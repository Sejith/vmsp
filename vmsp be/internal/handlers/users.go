package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
	"vyavahara-backend/config/db"
	"vyavahara-backend/internal/middlewares"
	"vyavahara-backend/internal/models"
	utils "vyavahara-backend/shared"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func V1SignUp(db *db.MongoDB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var user models.User
		if err := c.Bind(&user); err != nil {
			log.Printf("[SIGN-UP] Invalid signup request: %v", err)
			return c.JSON(http.StatusBadRequest, echo.Map{
				"is_success": false,
				"message":    "Invalid signup request",
				"error":      err.Error(),
			})
		}

		validate := validator.New()
		if err := validate.Struct(user); err != nil {
			log.Printf("[SIGN-UP] Validation failed for user %s: %v", user.UserName, err)
			return c.JSON(http.StatusBadRequest, echo.Map{
				"is_success": false,
				"message":    "Validation failed",
				"error":      err.Error(),
			})
		}

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		count, err := db.Database.Collection("Users").CountDocuments(ctx, bson.M{"username": user.UserName})
		if err != nil {
			log.Printf("[SIGN-UP] Failed to check existing user %s: %v", user.UserName, err)
			return c.JSON(http.StatusInternalServerError, echo.Map{
				"is_success": false,
				"message":    "Something went wrong, please try again",
			})
		}
		if count > 0 {
			log.Printf("[SIGN-UP] Username already exists: %s", user.UserName)
			return c.JSON(http.StatusConflict, echo.Map{
				"is_success": false,
				"message":    fmt.Sprintf("User with %s already exists, please login", user.UserName),
			})
		}

		keyStr := os.Getenv("AUTH_FERNET_KEY")
		encryptedPassword, err := utils.EncryptData(user.PassWord, keyStr)
		if err != nil {
			log.Printf("[SIGN-UP] Password encryption failed for user %s: %v", user.UserName, err)
			return c.JSON(http.StatusInternalServerError, echo.Map{
				"is_success": false,
				"message":    "Failed to process password",
			})
		}
		user.PassWord = encryptedPassword

		cartID := primitive.NewObjectID()
		cart := models.Carts{
			Id:        cartID,
			Name:      user.UserName,
			Items:     []models.CartItem{},
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		_, err = db.Database.Collection("Carts").InsertOne(ctx, cart)
		if err != nil {
			log.Printf("[SIGN-UP] Failed to create cart for user %s: %v", user.UserName, err)
			return c.JSON(http.StatusInternalServerError, echo.Map{
				"is_success": false,
				"message":    "Failed to create cart",
			})
		}

		user.Id = primitive.NewObjectID()
		user.CartId = cartID

		_, err = db.Database.Collection("Users").InsertOne(ctx, user)
		if err != nil {
			log.Printf("[SIGN-UP] Failed to create user %s: %v", user.UserName, err)
			return c.JSON(http.StatusInternalServerError, echo.Map{
				"is_success": false,
				"message":    "Failed to create user",
			})
		}

		token := utils.GenerateBasicAuthToken(user.UserName, user.PassWord)
		log.Printf("[SIGN-UP] User created successfully: %s (UserID: %s)", user.UserName, user.Id.Hex())

		return c.JSON(http.StatusCreated, echo.Map{
			"is_success": true,
			"data": map[string]interface{}{
				"token":   token,
				"isAdmin": user.IsAdmin,
				"userId": user.Id,
			},
			"message": "User created successfully",
		})
	}
}

func V1Login(db *db.MongoDB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var login models.Login
		if err := c.Bind(&login); err != nil {
			log.Printf("[LOGIN] Invalid login request: %v", err)
			return c.JSON(http.StatusBadRequest, echo.Map{
				"is_success": false,
				"message":    "Invalid login request",
				"error":      err.Error(),
			})
		}

		ok, err := middlewares.Authenticate(login.UserName, login.PassWord, db)
		if err != nil || !ok {
			log.Printf("[LOGIN] Authentication failed for user %s: %v", login.UserName, err)
			return c.JSON(http.StatusUnauthorized, echo.Map{
				"is_success": false,
				"message":    "Invalid username or password",
			})
		}

		token := utils.GenerateBasicAuthToken(login.UserName, login.PassWord)

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		var user models.User
		err = db.Database.Collection("Users").FindOne(ctx, bson.M{"username": login.UserName}).Decode(&user)
		if err != nil {
			log.Printf("[LOGIN] Failed to fetch user %s: %v", login.UserName, err)
			return c.JSON(http.StatusInternalServerError, echo.Map{
				"is_success": false,
				"message":    "Failed to fetch user data",
			})
		}

		log.Printf("[LOGIN] Login successful for user %s", login.UserName)

		return c.JSON(http.StatusOK, echo.Map{
			"is_success": true,
			"data": map[string]interface{}{
				"token":   token,
				"isAdmin": user.IsAdmin,
				"userId":  user.Id,
			},
			"message": "Login successful",
		})
	}
}

func GetUserDetails(db *db.MongoDB) echo.HandlerFunc {
	return func(c echo.Context) error {

		phoneNumber := c.QueryParam("phoneNumber")

		if phoneNumber == "" {
			return c.JSON(http.StatusBadRequest, echo.Map{
				"success": false,
				"message": "phoneNumber is required",
			})
		}

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		filter := bson.M{
			"phone_number": bson.M{
				"$regex":   phoneNumber,
				"$options": "i",
			},
		}

		var user models.User

		err := db.Database.Collection("Users").
			FindOne(ctx, filter).
			Decode(&user)

		if err != nil {

			if err == mongo.ErrNoDocuments {
				return c.JSON(http.StatusNotFound, echo.Map{
					"success": false,
					"message": "User not found",
				})
			}

			log.Println("[GET USER] Error:", err)
			return c.JSON(http.StatusInternalServerError, echo.Map{
				"success": false,
				"message": "Failed to fetch user",
			})
		}

		return c.JSON(http.StatusOK, echo.Map{
			"success": true,
			"user":    user,
		})
	}
}

func UpdateUserDetails(db *db.MongoDB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var updateUser models.UpdateUser
		if err := c.Bind(&updateUser); err != nil {
			return c.JSON(http.StatusBadRequest, echo.Map{
				"is_success": false,
				"message":    "Invalid request body",
			})
		}

		if updateUser.UserName == "" {
			return c.JSON(http.StatusBadRequest, echo.Map{
				"is_success": false,
				"message":    "Username is required",
			})
		}

		collection := db.Database.Collection("Users")

		updateFields := bson.M{}
		if updateUser.FirstName != "" {
			updateFields["first_name"] = updateUser.FirstName
		}

		if updateUser.LastName != "" {
			updateFields["last_name"] = updateUser.LastName
		}

		if updateUser.Email != "" {
			updateFields["email"] = updateUser.Email
		}

		if updateUser.PhoneNumber != "" {
			updateFields["phone_number"] = updateUser.PhoneNumber
		}

		updateFields["is_admin"] = updateUser.IsAdmin
		updateFields["is_active"] = updateUser.IsActive

		if len(updateFields) == 0 {
			return c.JSON(http.StatusBadRequest, bson.M{
				"is_success": false,
				"message":    "NO fields to Update",
			})
		}

		filter := bson.M{"username": updateUser.UserName}
		update := bson.M{"$set": updateFields}

		result, err := collection.UpdateOne(context.TODO(), filter, update)
		if err != nil {
			return c.JSON(http.StatusBadRequest, bson.M{
				"is_success": false,
				"message":    err.Error(),
			})
		}

		if result.MatchedCount == 0 {
			return c.JSON(http.StatusNotFound, bson.M{
				"is_suceess": false,
				"error":      "User not found",
			})
		}

		var updatedUser models.User
		if err := collection.FindOne(context.TODO(), filter).Decode(&updatedUser); err != nil {
			return c.JSON(http.StatusBadRequest, bson.M{
				"is_success": false,
			})
		}

		return c.JSON(http.StatusOK, bson.M{
			"is_success": true,
			"data":       updateUser,
		})
	}
}
