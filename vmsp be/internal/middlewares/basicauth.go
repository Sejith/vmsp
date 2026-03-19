package middlewares

import (
	"context"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
	"vyavahara-backend/config/db"
	"vyavahara-backend/internal/models"
	utils "vyavahara-backend/shared"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
)

func EncodeBase64(token string) string {
	return base64.StdEncoding.EncodeToString([]byte(token))
}

func DecodeBase64(token string) (string, error) {
	decoded, err := base64.StdEncoding.DecodeString(token)
	if err != nil {
		log.Printf("[BASE64-DECODE] Failed to decode %v", err)
		return "", err
	}
	return string(decoded), nil
}

func Authenticate(username, password string, mongoDB *db.MongoDB) (bool, error) {
	log.Printf("[BASICAUTH] Attempting Authentication for username : %s", username)

	user, err := GetUserDetails(username, mongoDB)
	if err != nil {
		log.Printf("[BASICAUTH] Error retrieving user: %v", err)
		return false, err
	}

	if !user.IsActive {
		log.Printf("[BASICAUTH] User %s is inactive", username)
		return false, errors.New("user not active")
	}

	keyStr := os.Getenv("AUTH_FERNET_KEY")
	storedPassword, err := utils.DecryptData(user.PassWord, keyStr)
	if err != nil {
		log.Printf("[BASICAUTH] Failed to decrypt user password: %v", err.Error())
		return false, err
	}

	userNameMatch := subtle.ConstantTimeCompare([]byte(username), []byte(user.UserName)) == 1
	passwordMatch := subtle.ConstantTimeCompare([]byte(storedPassword), []byte(password)) == 1

	if userNameMatch && passwordMatch {
		log.Printf("[BASICAUTH] Authentication successful for user %s", username)
		return true, nil
	}

	log.Printf("[BASICAUTH] Authentication failed for user %s", username)
	return false, errors.New("unauthorized: incorrect username or password")

}

func GetUserDetails(username string, mongoDB *db.MongoDB) (*models.User, error) {
	log.Printf("[BASICAUTH] Fetching User: %s", username)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user models.User
	err := mongoDB.Database.Collection("Users").FindOne(ctx, bson.M{"username": username}).Decode(&user)
	if err != nil {
		log.Printf("Failed to fetch the user: %v", err)
		return nil, errors.New("user not found")
	}

	return &user, nil
}

func BasicAuthMiddleWare(mongoDB *db.MongoDB) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {

			if c.Request().Method == http.MethodOptions {
				return next(c)
			}

			authHeader := c.Request().Header.Get("Authorization")

			if authHeader == "" || !strings.HasPrefix(authHeader, "Basic ") {
				log.Printf("[BASICAUTH] Missing or invalid Autherization Header")
				return c.JSON(http.StatusUnauthorized, echo.Map{
					"error": "Authorization header is missing or invalid",
				})
			}

			log.Printf("[BASICAUTH] Authorization Header Received")

			base64Creds := strings.TrimPrefix(authHeader, "Basic ")
			decoded, err := DecodeBase64(base64Creds)
			if err != nil {
				log.Printf("[BASICAUTH] Base64 decoding failed: %v", err)
				return c.JSON(http.StatusUnauthorized, echo.Map{
					"error": "Invalid base64 encoding",
				})
			}

			parts := strings.SplitN(string(decoded), ":", 2)
			if len(parts) != 2 {
				log.Printf("[BASICAUTH] Invalid credentials format")
				return c.JSON(http.StatusUnauthorized, echo.Map{
					"error": "",
				})
			}

			username, password := parts[0], parts[1]
			ok, err := Authenticate(username, password, mongoDB)
			if err != nil || !ok {
				log.Printf("[BASICAUTH] Authentication failed: %v", err)
				return c.JSON(http.StatusUnauthorized, echo.Map{"error": "Unauthorized"})
			}

			log.Printf("[BASICAUTH] Authentication Successful for user: %s", username)
			c.Set("username", username)
			return next(c)
		}
	}
}
