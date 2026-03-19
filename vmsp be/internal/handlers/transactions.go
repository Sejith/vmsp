package handlers

import (
	"bytes"
	"context"
	"fmt"
	"log"
	"net"
	"net/http"
	"strconv"
	"strings"
	"text/template"
	"time"
	"vyavahara-backend/config/db"
	"vyavahara-backend/internal/models"
	"vyavahara-backend/internal/services"
	utils "vyavahara-backend/shared"

	"github.com/chromedp/cdproto/page"
	"github.com/chromedp/chromedp"
	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func AddTransaction(db *db.MongoDB) echo.HandlerFunc {
	return func(c echo.Context) error {

		var request models.InsertTransaction
		if err := c.Bind(&request); err != nil {
			return c.JSON(http.StatusBadRequest, echo.Map{
				"is_success": false,
				"message":    "Invalid request",
			})
		}

		userObjId, err := primitive.ObjectIDFromHex(request.UserId)
		if err != nil {
			return c.JSON(http.StatusBadRequest, echo.Map{
				"is_success": false,
				"message":    "Invalid user_id format",
			})
		}

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		goldRate, silverRate := services.GetMetalService().GetRates()

		var transactionItems []models.ProductItems
		totalPrice := 0.0
		totalQuantity := 0

		for _, item := range request.Items {

			var product models.Products
			err := db.Database.Collection("Products").
				FindOne(ctx, bson.M{"_id": item.ProductId}).
				Decode(&product)

			if err != nil {
				return c.JSON(http.StatusNotFound, echo.Map{
					"is_success": false,
					"message":    "Product not found",
				})
			}

			var ratePerGM float64
			switch product.Type {
			case "gold":
				ratePerGM = goldRate
			case "silver":
				ratePerGM = silverRate
			default:
				return c.JSON(http.StatusBadRequest, echo.Map{
					"is_success": false,
					"message":    "Unsupported metal type",
				})
			}

			unitPrice := product.Weight * ratePerGM
			lineTotal := unitPrice * float64(item.Quantity)

			transactionItems = append(transactionItems, models.ProductItems{
				ProductId: product.Id,
				Name:      product.Name,
				MetalType: product.Type,
				WeightGM:  product.Weight,
				RatePerGM: ratePerGM,
				UnitPrice: unitPrice,
				Quantity:  item.Quantity,
				LineTotal: lineTotal,
			})

			totalQuantity += item.Quantity
			totalPrice += lineTotal
		}

		userPrefix := request.UserId[:4]

		currentTime := time.Now().Format("2006-01-02--15-04-05")

		transactionIndex := fmt.Sprintf("%s_%s", userPrefix, currentTime)

		transaction := models.Transactions{
			Id:            primitive.NewObjectID(),
			UserId:        userObjId,
			Index:         transactionIndex,
			Items:         transactionItems,
			Quantity:      totalQuantity,
			Price:         totalPrice,
			Discount:      0,
			DiscountPrice: totalPrice,
			ModeOfPayment: request.ModeOfPayment,
			Status:        "PENDING",
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		_, err = db.Database.Collection("Transactions").InsertOne(ctx, transaction)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{
				"is_success": false,
				"message":    "Failed to create transaction",
			})
		}

		return c.JSON(http.StatusCreated, echo.Map{
			"is_success": true,
			"message":    "Transaction created successfully",
			"data":       transaction,
		})
	}
}

func UpdateTransactions(db *db.MongoDB) echo.HandlerFunc {
	return func(c echo.Context) error {

		transactionId := c.QueryParam("transactionId")
		status := c.QueryParam("status")
		discountStr := c.QueryParam("discount")

		objID, err := primitive.ObjectIDFromHex(transactionId)
		if err != nil {
			return c.JSON(http.StatusBadRequest, echo.Map{
				"is_success": false,
				"message":    "Invalid transactionId format",
			})
		}

		discountAmount := 0.0
		if discountStr != "" {
			discountAmount, err = strconv.ParseFloat(discountStr, 64)
			if err != nil {
				return c.JSON(http.StatusBadRequest, echo.Map{
					"is_success": false,
					"message":    "Invalid discount value",
				})
			}
		}

		ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
		defer cancel()

		var transaction models.Transactions
		err = db.Database.Collection("Transactions").FindOne(ctx, bson.M{"_id": objID}).Decode(&transaction)
		if err != nil {
			return c.JSON(http.StatusNotFound, echo.Map{
				"is_success": false,
				"message":    "Transaction not found",
			})
		}

		discountedPrice := transaction.Price - discountAmount

		update := bson.M{
			"$set": bson.M{
				"status":         strings.ToUpper(status),
				"discount":       discountAmount,
				"discount_price": discountedPrice,
				"updated_at":     time.Now(),
			},
		}

		_, err = db.Database.Collection("Transactions").UpdateByID(ctx, transaction.Id, update)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{
				"is_success": false,
				"message":    "Failed to update transaction",
			})
		}

		var user models.User
		if err := db.Database.Collection("Users").FindOne(ctx, bson.M{"_id": transaction.UserId}).Decode(&user); err == nil {
			if strings.ToUpper(status) == "SUCCESS" {
				_, _ = db.Database.Collection("Carts").UpdateOne(
					ctx,
					bson.M{"_id": user.CartId},
					bson.M{"$set": bson.M{"items": []models.CartItem{}, "updated_at": time.Now()}},
				)
			}
		}

		if strings.ToUpper(status) == "SUCCESS" {
			if err := generateInvoicePDF(transaction, &user, db, discountAmount, discountedPrice); err != nil {
				log.Println("[INVOICE] Failed to generate:", err)
			}
		}

		return c.JSON(http.StatusOK, echo.Map{
			"is_success":      true,
			"message":         "Transaction updated successfully",
			"status":          strings.ToUpper(status),
			"discount":        discountAmount,
			"discountedPrice": discountedPrice,
		})
	}
}

func generateInvoicePDF(transaction models.Transactions, user *models.User, db *db.MongoDB, discountAmount float64, discountPrice float64) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	var products []map[string]interface{}
	subtotal := 0.0

	for _, item := range transaction.Items {
		unitPrice := item.UnitPrice
		lineTotal := item.LineTotal
		subtotal += lineTotal

		products = append(products, map[string]interface{}{
			"Name":      item.Name,
			"Metal":     item.MetalType,
			"WeightGM":  item.WeightGM,
			"Rate1GM":   item.RatePerGM,
			"UnitPrice": unitPrice,
			"Quantity":  item.Quantity,
			"Amount":    lineTotal,
		})
	}

	var pages [][]map[string]interface{}
	for i := 0; i < len(products); i += 8 {
		end := i + 8
		if end > len(products) {
			end = len(products)
		}
		pages = append(pages, products[i:end])
	}

	data := map[string]interface{}{
		"Pages":    pages,
		"Date":     time.Now().Format("02-01-2006"),
		"Subtotal": subtotal,
		"Discount": discountAmount,
		"Total":    discountPrice,
		"User": map[string]interface{}{
			"Name": user.FirstName + " " + user.LastName,
		},
	}

	funcs := template.FuncMap{
		"add": func(a, b interface{}) int { return utils.ToInt(a) + utils.ToInt(b) },
		"sub": func(a, b interface{}) int { return utils.ToInt(a) - utils.ToInt(b) },
		"mul": func(a, b interface{}) int { return utils.ToInt(a) * utils.ToInt(b) },
	}

	tmpl, err := template.New("invoice.html").Funcs(funcs).ParseFiles("templates/invoice.html")
	if err != nil {
		return err
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return err
	}

	htmlContent := buf.String()

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return fmt.Errorf("failed to start local server: %w", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/invoice", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Write([]byte(htmlContent))
	})

	server := &http.Server{Handler: mux}
	go server.Serve(listener)
	defer server.Close()

	localURL := fmt.Sprintf("http://%s/invoice", listener.Addr().String())

	allocCtx, allocCancel := chromedp.NewExecAllocator(
		context.Background(),
		append(
			chromedp.DefaultExecAllocatorOptions[:],
			chromedp.Flag("disable-web-security", true),
			chromedp.Flag("allow-running-insecure-content", true),
			chromedp.NoSandbox,
			chromedp.Headless,
		)...,
	)
	defer allocCancel()

	pdfCtx, cancelPDF := chromedp.NewContext(allocCtx)
	defer cancelPDF()

	var pdfBytes []byte
	err = chromedp.Run(pdfCtx,
		chromedp.Navigate(localURL),
		chromedp.WaitVisible("body", chromedp.ByQuery),

		chromedp.ActionFunc(func(ctx context.Context) error {
			return chromedp.Evaluate(`document.fonts.ready`, nil).Do(ctx)
		}),
		chromedp.Sleep(1*time.Second),

		chromedp.ActionFunc(func(ctx context.Context) error {
			var err error
			pdfBytes, _, err = page.PrintToPDF().
				WithPrintBackground(true).
				WithPaperWidth(5.83).
				WithPaperHeight(8.27).
				WithLandscape(false).
				Do(ctx)
			return err
		}),
	)
	if err != nil {
		return err
	}

	fileName := fmt.Sprintf("invoice_%s.pdf", transaction.Id.Hex())
	invloiceurl, err := utils.UploadInvoiceToCloudinary(bytes.NewReader(pdfBytes), fileName)
	if err != nil {
		return err
	}

	_, err = db.Database.Collection("Transactions").UpdateByID(ctx, transaction.Id, bson.M{
		"$set": bson.M{"invoice_url": invloiceurl},
	})
	return err
}

func GetTransactions(db *db.MongoDB) echo.HandlerFunc {
	return func(c echo.Context) error {

		offset, _ := strconv.Atoi(c.QueryParam("offset"))
		limit, _ := strconv.Atoi(c.QueryParam("limit"))

		if offset < 0 {
			offset = 0
		}
		if limit < 1 {
			limit = 20
		}

		matchStage := bson.M{}

		if txnIdStr := c.QueryParam("transactionId"); txnIdStr != "" {
			txnId, err := primitive.ObjectIDFromHex(txnIdStr)
			if err != nil {
				return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid transaction ID"})
			}
			matchStage["_id"] = txnId
		}

		pipeline := mongo.Pipeline{
			{{Key: "$lookup", Value: bson.M{
				"from":         "Users",
				"localField":   "user_id",
				"foreignField": "_id",
				"as":           "user",
			}}},
			{{Key: "$unwind", Value: "$user"}},
		}

		if len(matchStage) > 0 {
			pipeline = append(pipeline, bson.D{{Key: "$match", Value: matchStage}})
		}

		pipeline = append(pipeline, bson.D{{Key: "$addFields", Value: bson.M{
			"pendingFirst": bson.M{
				"$cond": bson.A{
					bson.M{"$eq": bson.A{"$status", "PENDING"}},
					0,
					1,
				},
			},
		}}})

		pipeline = append(pipeline, bson.D{{Key: "$facet", Value: bson.M{
			"transactions": mongo.Pipeline{
				{{Key: "$sort", Value: bson.D{
					{Key: "pendingFirst", Value: 1},
					{Key: "updated_at", Value: -1},
				}}},
				{{Key: "$skip", Value: offset}},
				{{Key: "$limit", Value: limit}},
				{{Key: "$project", Value: bson.M{
					"_id":            1,
					"status":         1,
					"discount_price": 1,
					"updated_at":     1,
					"user_id":        1,
					"invoice_url":    1,
					"username":       "$user.username",
				}}},
			},
			"totalCount": mongo.Pipeline{
				{{Key: "$count", Value: "count"}},
			},
		}}})

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		cursor, err := db.Database.Collection("Transactions").Aggregate(ctx, pipeline)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		defer cursor.Close(ctx)

		var result []struct {
			Transactions []bson.M `bson:"transactions" json:"transactions"`
			TotalCount   []struct {
				Count int `bson:"count" json:"count"`
			} `bson:"totalCount" json:"totalCount"`
		}

		if err := cursor.All(ctx, &result); err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}

		if len(result) == 0 {
			return c.JSON(http.StatusOK, map[string]interface{}{
				"offset":       offset,
				"limit":        limit,
				"transactions": []bson.M{},
				"total_count":  0,
			})
		}

		resp := result[0]

		totalCount := 0
		if len(resp.TotalCount) > 0 {
			totalCount = resp.TotalCount[0].Count
		}

		return c.JSON(http.StatusOK, map[string]interface{}{
			"offset":       offset,
			"limit":        limit,
			"total_count":  totalCount,
			"transactions": resp.Transactions,
		})
	}
}

func GetTransactionsHandler(db *db.MongoDB) echo.HandlerFunc {
	return func(c echo.Context) error {

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		limit, _ := strconv.Atoi(c.QueryParam("limit"))
		offset, _ := strconv.Atoi(c.QueryParam("offset"))
		username := c.QueryParam("username")
		startDate := c.QueryParam("startDate")
		endDate := c.QueryParam("endDate")
		today := c.QueryParam("today")

		if limit == 0 {
			if offset == 0 {
				limit = 20
			} else {
				limit = 10
			}
		}

		filter := bson.M{}
		dateFilter := bson.M{}
		layout := "2006-01-02"

		if today == "true" {
			now := time.Now().UTC()
			start := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
			end := start.Add(24*time.Hour - time.Second)

			dateFilter["$gte"] = start
			dateFilter["$lte"] = end
		}

		if startDate != "" {
			if t, err := time.Parse(layout, startDate); err == nil {
				dateFilter["$gte"] = t
			}
		}

		if endDate != "" {
			if t, err := time.Parse(layout, endDate); err == nil {
				t = t.Add(24*time.Hour - time.Second)
				dateFilter["$lte"] = t
			}
		}

		if len(dateFilter) > 0 {
			filter["updated_at"] = dateFilter
		}

		pipeline := mongo.Pipeline{}

		if len(filter) > 0 {
			pipeline = append(pipeline, bson.D{{Key: "$match", Value: filter}})
		}

		pipeline = append(pipeline,
			bson.D{{Key: "$lookup", Value: bson.D{
				{Key: "from", Value: "Users"},
				{Key: "localField", Value: "user_id"},
				{Key: "foreignField", Value: "_id"},
				{Key: "as", Value: "user"},
			}}},
			bson.D{{Key: "$unwind", Value: bson.D{
				{Key: "path", Value: "$user"},
				{Key: "preserveNullAndEmptyArrays", Value: true},
			}}},
		)

		if username != "" {
			pipeline = append(pipeline, bson.D{{Key: "$match", Value: bson.M{"user.username": username}}})
		}

		pipeline = append(pipeline,
			bson.D{{Key: "$addFields", Value: bson.D{
				{Key: "pendingPriority", Value: bson.D{
					{Key: "$cond", Value: bson.A{
						bson.D{{Key: "$eq", Value: bson.A{"$status", "PENDING"}}},
						0,
						1,
					}},
				}},
			}}},
			bson.D{{Key: "$sort", Value: bson.D{
				{Key: "pendingPriority", Value: 1},
				{Key: "updated_at", Value: -1},
			}}},
			bson.D{{Key: "$skip", Value: offset}},
			bson.D{{Key: "$limit", Value: limit}},
			bson.D{{Key: "$project", Value: bson.D{
				{Key: "_id", Value: 1},
				{Key: "user_id", Value: 1},
				{Key: "username", Value: "$user.username"},
				{Key: "discount_price", Value: 1},
				{Key: "invoice_url", Value: 1},
				{Key: "status", Value: 1},
				{Key: "updated_at", Value: 1},
			}}},
		)

		cursor, err := db.Database.Collection("Transactions").Aggregate(ctx, pipeline)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		defer cursor.Close(ctx)

		var transactions []models.TransactionSummary
		if err := cursor.All(ctx, &transactions); err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}

		countPipeline := mongo.Pipeline{
			{{
				Key:   "$match",
				Value: filter,
			}},
			{{
				Key:   "$count",
				Value: "total",
			}},
		}

		countCursor, err := db.Database.Collection("Transactions").Aggregate(ctx, countPipeline)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		defer countCursor.Close(ctx)

		totalCount := int64(0)
		var countResult []bson.M
		countCursor.All(ctx, &countResult)
		if len(countResult) > 0 {
			switch v := countResult[0]["total"].(type) {
			case int32:
				totalCount = int64(v)
			case int64:
				totalCount = v
			case float64:
				totalCount = int64(v)
			}
		}

		totalPipeline := mongo.Pipeline{
			{{Key: "$match", Value: filter}},
			{{
				Key: "$group",
				Value: bson.D{
					{Key: "_id", Value: nil},
					{Key: "total", Value: bson.D{{Key: "$sum", Value: "$discount_price"}}},
				},
			}},
		}

		totalCursor, err := db.Database.Collection("Transactions").Aggregate(ctx, totalPipeline)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		defer totalCursor.Close(ctx)

		totalAmount := float64(0)
		var totalResult []bson.M
		totalCursor.All(ctx, &totalResult)
		if len(totalResult) > 0 {
			switch v := totalResult[0]["total"].(type) {
			case int32:
				totalAmount = float64(v)
			case int64:
				totalAmount = float64(v)
			case float64:
				totalAmount = v
			}
		}

		nextOffset := offset + limit
		if int64(nextOffset) >= totalCount {
			nextOffset = -1
		}

		if transactions == nil {
			transactions = []models.TransactionSummary{}
		}

		return c.JSON(http.StatusOK, echo.Map{
			"limit":        limit,
			"offset":       offset,
			"next_offset":  nextOffset,
			"total_count":  totalCount,
			"total_amount": totalAmount,
			"transactions": transactions,
		})
	}
}
