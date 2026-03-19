package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
	"vyavahara-backend/config/db"
	"vyavahara-backend/internal/models"
	"vyavahara-backend/internal/services"
	utils "vyavahara-backend/shared"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func V1UploadProduct(db *db.MongoDB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var product models.Products

		product.Id = primitive.NewObjectID()

		product.Name        = c.FormValue("name")
		product.Description = c.FormValue("description")
		product.Type        = c.FormValue("type")

		weightStr := c.FormValue("weight")
		weight, err := strconv.ParseFloat(weightStr, 64)
		if err != nil {
			return c.JSON(http.StatusBadRequest, echo.Map{
				"is_success": false,
				"message":    "Invalid weight",
			})
		}
		product.Weight = weight

		product.IsAvailable = c.FormValue("is_available") == "true"

		var validate = validator.New()
		if err := validate.Struct(product); err != nil {
			return c.JSON(http.StatusBadRequest, echo.Map{
				"success": false,
				"message": "Validation failed",
				"error":   err.Error(),
			})
		}

		for i := 1; i <= 5; i++ {
			imageKey := fmt.Sprintf("image%d", i)

			file, err := c.FormFile(imageKey)
			if err != nil {
				log.Printf("[UPLOAD-PRODUCT] %s not provided", imageKey)
				continue
			}

			src, err := file.Open()
			if err != nil {
				log.Printf("[UPLOAD-PRODUCT] Failed to open %s: %v", imageKey, err)
				continue
			}
			defer src.Close()

			url, err := utils.UploadProductImage(src, file.Filename, product.Id.Hex(), i)
			if err != nil {
				log.Printf("[UPLOAD-PRODUCT] Failed to upload %s: %v", imageKey, err)
				continue
			}

			switch i {
			case 1: product.Image1 = url
			case 2: product.Image2 = url
			case 3: product.Image3 = url
			case 4: product.Image4 = url
			case 5: product.Image5 = url
			}
		}

		now := time.Now()
		product.CreatedAt = now
		product.UpdatedAt = now

		_, err = db.Database.Collection("Products").InsertOne(context.TODO(), product)
		if err != nil {
			log.Println("[UPLOAD-PRODUCT] Failed to insert product:", err)
			return c.JSON(http.StatusInternalServerError, echo.Map{
				"success": false,
				"message": "Failed to save product",
			})
		}

		return c.JSON(http.StatusCreated, echo.Map{
			"success": true,
			"message": "Product uploaded successfully",
			"product": product,
		})
	}
}

func V1GetProducts(db *db.MongoDB) echo.HandlerFunc {
	return func(c echo.Context) error {

		limitStr := c.QueryParam("limit")
		offsetStr := c.QueryParam("offset")
		name := c.QueryParam("name")
		productType := c.QueryParam("type")
		id := c.QueryParam("id")

		limit := int64(8)
		offset := int64(0)

		if parsed, err := strconv.ParseInt(limitStr, 10, 64); err == nil && parsed > 0 {
			limit = parsed
		}

		if parsed, err := strconv.ParseInt(offsetStr, 10, 64); err == nil && parsed >= 0 {
			offset = parsed
		}

		if name != "" && id != "" {
			return c.JSON(http.StatusBadRequest, echo.Map{
				"is_success": false,
				"message":    "Cannot filter by both name and id",
			})
		}

		filter := bson.M{}

		if name != "" {
			filter["name"] = bson.M{"$regex": name, "$options": "i"}
		}

		if productType != "" {
			filter["type"] = bson.M{"$regex": productType, "$options": "i"}
		}

		if id != "" {
			objID, err := primitive.ObjectIDFromHex(id)
			if err != nil {
				return c.JSON(http.StatusBadRequest, echo.Map{
					"is_success": false,
					"message":    "Invalid product id",
				})
			}
			filter["_id"] = objID
		}

		totalProducts, err := db.Database.Collection("Products").
			CountDocuments(context.TODO(), filter)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{
				"is_success": false,
				"message":    err.Error(),
			})
		}

		findOptions := options.Find().
			SetLimit(limit).
			SetSkip(offset)

		cursor, err := db.Database.Collection("Products").
			Find(context.TODO(), filter, findOptions)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{
				"is_success": false,
				"message":    err.Error(),
			})
		}
		defer cursor.Close(context.TODO())

		var products []models.Products
		if err := cursor.All(context.TODO(), &products); err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{
				"is_success": false,
				"message":    err.Error(),
			})
		}

		goldRate, silverRate := services.GetMetalService().GetRates()

		var response []models.ProductResponse

		for _, product := range products {

			var rate float64

			switch strings.ToLower(product.Type) {
			case "gold":
				rate = goldRate
			case "silver":
				rate = silverRate
			}

			calculatedPrice := product.Weight * rate

			response = append(response, models.ProductResponse{
				Product: product,
				Price:   calculatedPrice,
			})
		}

		hasPrev := offset > 0
		hasNext := offset+int64(len(products)) < totalProducts

		return c.JSON(http.StatusOK, echo.Map{
			"is_success":  true,
			"total_count": totalProducts,
			"has_prev":    hasPrev,
			"has_next":    hasNext,
			"products":    response,
		})
	}
}

func V1GetProductsById(db *db.MongoDB) echo.HandlerFunc {
	return func(c echo.Context) error {

		id := c.Param("id")

		if id == "" {
			return c.JSON(http.StatusBadRequest, echo.Map{
				"is_success": false,
				"message":    "Product id is required",
			})
		}

		objID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			return c.JSON(http.StatusBadRequest, echo.Map{
				"is_success": false,
				"message":    "Invalid product id",
			})
		}

		filter := bson.M{"_id": objID}

		var product models.Products
		err = db.Database.Collection("Products").
			FindOne(context.TODO(), filter).
			Decode(&product)

		if err != nil {
			if err == mongo.ErrNoDocuments {
				return c.JSON(http.StatusNotFound, echo.Map{
					"is_success": false,
					"message":    "Product not found",
				})
			}
			return c.JSON(http.StatusInternalServerError, echo.Map{
				"is_success": false,
				"message":    err.Error(),
			})
		}

		goldRate, silverRate := services.GetMetalService().GetRates()

		var rate float64

		switch strings.ToLower(product.Type) {
		case "gold":
			rate = goldRate
		case "silver":
			rate = silverRate
		}

		calculatedPrice := product.Weight * rate

		response := models.ProductResponse{
			Product: product,
			Price:   calculatedPrice,
		}

		return c.JSON(http.StatusOK, echo.Map{
			"is_success": true,
			"product":    response,
		})
	}
}

func V1UpdateProductByID(db *db.MongoDB) echo.HandlerFunc {
	return func(c echo.Context) error {

		id := c.FormValue("id")
		if id == "" {
			return c.JSON(http.StatusBadRequest, echo.Map{
				"success": false,
				"message": "Product id is required",
			})
		}

		objID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			return c.JSON(http.StatusBadRequest, echo.Map{
				"success": false,
				"message": "Invalid product id",
			})
		}

		var existingProduct models.Products
		err = db.Database.Collection("Products").
			FindOne(context.TODO(), bson.M{"_id": objID}).
			Decode(&existingProduct)

		if err != nil {
			log.Println("[UPDATE_PRODUCT] Product not found:", err)
			return c.JSON(http.StatusNotFound, echo.Map{
				"success": false,
				"message": "Product not found",
			})
		}

		description := c.FormValue("description")
		if description != "" {
			existingProduct.Description = description
		}

		weightStr := c.FormValue("weight")
		if weightStr != "" {
			weight, err := strconv.ParseFloat(weightStr, 64)
			if err != nil {
				return c.JSON(http.StatusBadRequest, echo.Map{
					"success": false,
					"message": "Invalid weight",
				})
			}
			existingProduct.Weight = weight
		}

		productType := c.FormValue("type")
		if productType != "" {
			existingProduct.Type = productType
		}

		isAvailableStr := c.FormValue("is_available")
		if isAvailableStr != "" {
			existingProduct.IsAvailable = isAvailableStr == "true"
		}

		for i := 1; i <= 5; i++ {
			imageKey := fmt.Sprintf("image%d", i)

			file, err := c.FormFile(imageKey)
			if err != nil {
				continue
			}

			src, err := file.Open()
			if err != nil {
				log.Printf("[UPDATE_PRODUCT] Failed to open %s: %v", imageKey, err)
				continue
			}
			defer src.Close()

			fileName := fmt.Sprintf("%s_%d_%s", objID.Hex(), i, file.Filename)
			url, err := utils.UploadProductImage(src, fileName, objID.Hex(), i)
			if err != nil {
				log.Printf("[UPDATE_PRODUCT] Failed to upload %s: %v", imageKey, err)
				continue
			}

			switch i {
			case 1:
				existingProduct.Image1 = url
			case 2:
				existingProduct.Image2 = url
			case 3:
				existingProduct.Image3 = url
			case 4:
				existingProduct.Image4 = url
			case 5:
				existingProduct.Image5 = url
			}
		}

		existingProduct.UpdatedAt = time.Now()

		filter := bson.M{"_id": objID}
		update := bson.M{"$set": existingProduct}

		_, err = db.Database.Collection("Products").
			UpdateOne(context.TODO(), filter, update)

		if err != nil {
			log.Println("[UPDATE_PRODUCT] Failed to update product:", err)
			return c.JSON(http.StatusInternalServerError, echo.Map{
				"success": false,
				"message": "Failed to update product",
			})
		}

		return c.JSON(http.StatusOK, echo.Map{
			"success": true,
			"message": "Product updated successfully",
			"product": existingProduct,
		})
	}
}
