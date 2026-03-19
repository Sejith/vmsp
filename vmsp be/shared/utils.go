package utils

import (
	"bytes"
	"crypto/sha1"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/fernet/fernet-go"
)

func GenerateBasicAuthToken(username, password string) string {
	auth := fmt.Sprintf("%s:%s", username, password)
	token := base64.StdEncoding.EncodeToString([]byte(auth))
	return token
}

func EncryptData(plainText string, keyStr string) (string, error) {
	keyBytes, err := base64.URLEncoding.DecodeString(keyStr)
	if err != nil && len(keyBytes) < 32 {
		log.Println("Invalid Fernet Key")
		return "", fmt.Errorf("invalid fernet key")
	}

	var key fernet.Key
	copy(key[:], keyBytes)

	encryptedText, err := fernet.EncryptAndSign([]byte(plainText), &key)
	if err != nil {
		log.Println("Error during the Encryption:", err)
		return "", fmt.Errorf("error during the encryption: %v", err)
	}
	return string(encryptedText), nil
}

func DecryptData(encryptedText string, keyStr string) (string, error) {
	keyBytes, err := base64.URLEncoding.DecodeString(keyStr)
	if err != nil {
		log.Println("Failed to decode Fernet Key:", err)
		return "", fmt.Errorf("invalid fernet key: %v", err)
	}

	if len(keyBytes) != 32 {
		log.Println("Invalid Fernet Key length:", len(keyBytes))
		return "", fmt.Errorf("invalid fernet key length: %d", len(keyBytes))
	}

	var key fernet.Key
	copy(key[:], keyBytes)

	plainText := fernet.VerifyAndDecrypt([]byte(encryptedText), 0, []*fernet.Key{&key})
	if plainText == nil {
		log.Println("Failed to decrypt or token is wrong")
		return "", fmt.Errorf("invalid or wrong token")
	}
	return string(plainText), nil
}

func getContentType(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	case ".webp":
		return "image/webp"
	default:
		return "application/octet-stream"
	}
}

func ToInt(v interface{}) int {
	switch val := v.(type) {
	case int:
		return val
	case int64:
		return int(val)
	case float64:
		return int(val)
	default:
		return 0
	}
}

type cloudinaryResponse struct {
	SecureURL string `json:"secure_url"`
	PublicID  string `json:"public_id"`
	Error     *struct {
		Message string `json:"message"`
	} `json:"error"`
}

func upload(file io.Reader, filename, folder, resourceType, publicID string) (string, error) {
	cloudName := os.Getenv("CLOUDINARY_CLOUD_NAME")
	apiKey := os.Getenv("CLOUDINARY_API_KEY")
	apiSecret := os.Getenv("CLOUDINARY_API_SECRET")

	timestamp := strconv.FormatInt(time.Now().Unix(), 10)

	var sigStr string
	if publicID != "" {
		sigStr = fmt.Sprintf(
			"folder=%s&overwrite=true&public_id=%s&timestamp=%s%s",
			folder, publicID, timestamp, apiSecret,
		)
	} else {
		sigStr = fmt.Sprintf("folder=%s&timestamp=%s%s", folder, timestamp, apiSecret)
	}

	h := sha1.New()
	h.Write([]byte(sigStr))
	signature := fmt.Sprintf("%x", h.Sum(nil))

	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)

	fw, err := w.CreateFormFile("file", filename)
	if err != nil {
		return "", fmt.Errorf("failed to create form file: %w", err)
	}
	if _, err = io.Copy(fw, file); err != nil {
		return "", fmt.Errorf("failed to copy file: %w", err)
	}

	_ = w.WriteField("api_key", apiKey)
	_ = w.WriteField("timestamp", timestamp)
	_ = w.WriteField("signature", signature)
	_ = w.WriteField("folder", folder)

	if publicID != "" {
		_ = w.WriteField("public_id", publicID)
		_ = w.WriteField("overwrite", "true")
	}

	w.Close()

	uploadURL := fmt.Sprintf("https://api.cloudinary.com/v1_1/%s/%s/upload", cloudName, resourceType)

	req, err := http.NewRequest(http.MethodPost, uploadURL, &buf)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", w.FormDataContentType())

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("cloudinary request failed: %w", err)
	}
	defer resp.Body.Close()

	var result cloudinaryResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("failed to decode cloudinary response: %w", err)
	}

	if result.Error != nil {
		return "", fmt.Errorf("cloudinary error: %s", result.Error.Message)
	}

	return result.SecureURL, nil
}

func UploadProductImage(file io.Reader, filename, productID string, slot int) (string, error) {
	folder := fmt.Sprintf("products/product_%s", productID)
	publicID := fmt.Sprintf("image%d", slot)

	url, err := upload(file, filename, folder, "image", publicID)
	if err != nil {
		return "", err
	}
	log.Printf("[CLOUDINARY] product=%s slot=%d => %s", productID, slot, url)
	return url, nil
}

func UploadInvoiceToCloudinary(file io.Reader, filename string) (string, error) {
	url, err := upload(file, filename, "invoices", "raw", "")
	if err != nil {
		return "", err
	}
	log.Printf("[CLOUDINARY] Invoice uploaded %s => %s", filename, url)
	return url, nil
}
