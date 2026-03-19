package handlers

import (
	"context"
	"log"
	"net/http"
	"strings"
	"time"
	"vyavahara-backend/config/db"
	"vyavahara-backend/internal/models"
	"vyavahara-backend/internal/services"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func GetCart(db *db.MongoDB) echo.HandlerFunc {
	return func(c echo.Context) error {

		userIdStr := c.QueryParam("userId")

		userId, err := primitive.ObjectIDFromHex(userIdStr)
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Invalid user ID",
			})
		}

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		var user models.User
		err = db.Database.Collection("Users").
			FindOne(ctx, bson.M{"_id": userId}).
			Decode(&user)

		if err != nil {
			if err == mongo.ErrNoDocuments {
				return c.JSON(http.StatusNotFound, map[string]string{
					"error": "User not found",
				})
			}
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": err.Error(),
			})
		}

		var cart models.Carts
		err = db.Database.Collection("Carts").
			FindOne(ctx, bson.M{"_id": user.CartId}).
			Decode(&cart)

		if err != nil {
			if err == mongo.ErrNoDocuments {
				return c.JSON(http.StatusNotFound, map[string]string{
					"error": "Cart not found",
				})
			}
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": err.Error(),
			})
		}

		goldRate, silverRate := services.GetMetalService().GetRates()

		if goldRate == 0 && silverRate == 0 {
			return c.JSON(http.StatusServiceUnavailable, map[string]string{
				"error": "Metal rates unavailable. Please try again later.",
			})
		}

		type CartItemWithProduct struct {
			Product     models.Products `json:"product"`
			Quantity    int             `json:"quantity"`
			RatePerGram float64         `json:"rate_per_gram"`
			ItemTotal   float64         `json:"item_total"`
		}

		var itemsWithProducts []CartItemWithProduct
		var totalAmount float64

		for _, item := range cart.Items {

			var product models.Products
			err := db.Database.Collection("Products").
				FindOne(ctx, bson.M{"_id": item.ProductId}).
				Decode(&product)

			if err != nil {
				if err == mongo.ErrNoDocuments {
					continue
				}
				return c.JSON(http.StatusInternalServerError, map[string]string{
					"error": err.Error(),
				})
			}

			var rate float64

			switch strings.ToLower(product.Type) {
			case "gold":
				rate = goldRate
			case "silver":
				rate = silverRate
			default:
				continue
			}

			if rate == 0 {
				return c.JSON(http.StatusServiceUnavailable, map[string]string{
					"error": "Metal rate unavailable",
				})
			}

			itemTotal := product.Weight * rate * float64(item.Quantity)

			if product.IsAvailable {
				totalAmount += itemTotal
			}

			itemsWithProducts = append(itemsWithProducts, CartItemWithProduct{
				Product:     product,
				Quantity:    item.Quantity,
				RatePerGram: rate,
				ItemTotal:   itemTotal,
			})
		}

		return c.JSON(http.StatusOK, echo.Map{
			"id":           cart.Id,
			"cart_name":    cart.Name,
			"items":        itemsWithProducts,
			"total_amount": totalAmount,
			"created_at":   cart.CreatedAt,
			"updated_at":   cart.UpdatedAt,
		})
	}
}

func AddOrUpdateCart(db *db.MongoDB) echo.HandlerFunc {
	return func(c echo.Context) error {
		userIdStr := c.QueryParam("userId")
		productIdStr := c.QueryParam("productId")
		action := strings.ToUpper(c.QueryParam("action"))

		log.Printf("[AddOrUpdateCart] userId=%s, productId=%s, action=%s\n", userIdStr, productIdStr, action)

		if action != "INC" && action != "DEC" && action != "REMOVE" {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Invalid action. Use INC, DEC or REMOVE",
			})
		}

		userId, err := primitive.ObjectIDFromHex(userIdStr)
		if err != nil {
			log.Println("[AddOrUpdateCart] Invalid user ID:", err)
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid user ID"})
		}

		productId, err := primitive.ObjectIDFromHex(productIdStr)
		if err != nil {
			log.Println("[AddOrUpdateCart] Invalid product ID:", err)
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid product ID"})
		}

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		var product models.Products
		err = db.Database.Collection("Products").FindOne(ctx, bson.M{"_id": productId}).Decode(&product)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				log.Println("[AddOrUpdateCart] Product not found:", productId)
				return c.JSON(http.StatusNotFound, map[string]string{"error": "Product not found"})
			}
			log.Println("[AddOrUpdateCart] DB error:", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}

		var user models.User
		err = db.Database.Collection("Users").FindOne(ctx, bson.M{"_id": userId}).Decode(&user)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				log.Println("[AddOrUpdateCart] User not found:", userId)
				return c.JSON(http.StatusNotFound, map[string]string{"error": "User not found"})
			}
			log.Println("[AddOrUpdateCart] DB error:", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}

		var cart models.Carts
		err = db.Database.Collection("Carts").FindOne(ctx, bson.M{"_id": user.CartId}).Decode(&cart)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				log.Println("[AddOrUpdateCart] Cart not found:", user.CartId)
				return c.JSON(http.StatusNotFound, map[string]string{"error": "Cart not found"})
			}
			log.Println("[AddOrUpdateCart] DB error:", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}

		found := false
		for i, item := range cart.Items {
			if item.ProductId == productId {
				found = true
				if action == "INC" {
					cart.Items[i].Quantity++
					log.Println("[AddOrUpdateCart] Increased quantity for product:", productId)
				} else if action == "DEC" {
					cart.Items[i].Quantity--
					if cart.Items[i].Quantity <= 0 {
						cart.Items = append(cart.Items[:i], cart.Items[i+1:]...)
					}
					log.Println("[AddOrUpdateCart] Decreased quantity for product:", productId)
				} else if action == "REMOVE" {
					cart.Items = append(cart.Items[:i], cart.Items[i+1:]...)
					log.Println("[AddOrUpdateCart] Removed product from cart:", productId)
				}
				break
			}
		}

		if !found && action == "INC" {
			if len(cart.Items) >= 25 {
				log.Println("[AddOrUpdateCart] Max unique products reached for cart:", user.CartId)
				return c.JSON(http.StatusForbidden, map[string]string{"error": "Max unique products reached"})
			}
			cart.Items = append(cart.Items, models.CartItem{
				ProductId: productId,
				Quantity:  1,
			})
			log.Println("[AddOrUpdateCart] Added new product to cart:", productId)
		}

		cart.UpdatedAt = time.Now()

		_, err = db.Database.Collection("Carts").UpdateOne(
			ctx,
			bson.M{"_id": cart.Id},
			bson.M{"$set": bson.M{"items": cart.Items, "updated_at": cart.UpdatedAt}},
		)
		if err != nil {
			log.Println("[AddOrUpdateCart] Failed to update cart:", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to update cart"})
		}

		log.Println("[AddOrUpdateCart] Cart updated successfully for user:", userId)
		return c.JSON(http.StatusOK, cart)
	}
}
