package handlers

import (
	"context"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"vyavahara-backend/config/redis"

	"github.com/labstack/echo/v4"
)

type MetalPrices struct {
	GoldPrice1gm   float64 `json:"gold_price_1gm"`
	SilverPrice1gm float64 `json:"silver_price_1gm"`
}

var httpClient = http.Client{Timeout: 5 * time.Second}

func extractMetalPrices(raw string) (goldPer1gm float64, silverPer1gm float64) {
	raw = strings.ReplaceAll(raw, "\r\n", "\n")
	lines := strings.Split(raw, "\n")

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		parts := strings.Split(line, "\t")
		if len(parts) < 7 {
			parts = strings.Fields(line)
		}
		if len(parts) < 7 {
			continue
		}

		name := strings.ToLower(strings.TrimSpace(parts[1]))
		price2 := strings.TrimSpace(parts[3])

		if strings.Contains(name, "gold andhra") {
			val, _ := strconv.ParseFloat(price2, 64)
			if val > 0 {
				goldPer1gm = val
			}
		}

		if strings.Contains(name, "silver 30 kg") {
			val, _ := strconv.ParseFloat(price2, 64)
			if val > 0 {
				silverPer1gm = val / 1000
			}
		}

		if goldPer1gm > 0 && silverPer1gm > 0 {
			break
		}
	}

	return
}

func MetalPricesHandler(c echo.Context) error {
	resp, err := httpClient.Get(os.Getenv("LIVEPRICES_API_URL"))
	if err != nil {
		log.Println("MetalPrices API error:", err)
		return c.JSON(http.StatusBadGateway, map[string]string{
			"error": "Failed to fetch live prices",
		})
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Println("MetalPrices read error:", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Failed to read price data",
		})
	}

	goldPrice, silverPrice := extractMetalPrices(string(body))

	if goldPrice == 0 || silverPrice == 0 {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Could not extract metal prices from feed",
		})
	}

	return c.JSON(http.StatusOK, MetalPrices{
		GoldPrice1gm:   goldPrice,
		SilverPrice1gm: silverPrice,
	})
}

func StartHourlyPriceSaver() {
	log.Println("Hourly metal price saver started")

	saveMetalPrices()

	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	for range ticker.C {
		saveMetalPrices()
	}
}

func saveMetalPrices() {
	resp, err := httpClient.Get(os.Getenv("LIVEPRICES_API_URL"))
	if err != nil {
		log.Println("Hourly API error:", err)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Println("Hourly read error:", err)
		return
	}

	goldPrice, silverPrice := extractMetalPrices(string(body))

	if goldPrice > 0 {
		saveToCache("gold", goldPrice)
	}

	if silverPrice > 0 {
		saveToCache("silver", silverPrice)
	}
}

func saveToCache(key string, value float64) {
	err := redis.Client.Set(
		context.Background(),
		key,
		value,
		0,
	).Err()

	if err != nil {
		log.Printf("Upstash error saving %s price: %v\n", key, err)
		return
	}

	log.Printf("%s price saved to Upstash: %f\n", key, value)
}
