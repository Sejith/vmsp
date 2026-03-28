package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"time"
	"vyavahara-backend/config/db"
	"vyavahara-backend/config/redis"
	"vyavahara-backend/internal/handlers"
	"vyavahara-backend/internal/migrations"
	"vyavahara-backend/internal/router"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	godotenv.Load()

	mongoDB := db.Connect()
	migrations.InitMigration(mongoDB)
	redis.InitUpstashRedis(context.Background())

	e := echo.New()

	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:5173", os.Getenv("VMSP_FE_URL")},
		AllowMethods:     []string{echo.GET, echo.POST, echo.PUT, echo.DELETE, echo.OPTIONS},
		AllowHeaders:     []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
		AllowCredentials: true,
	}))

	router.RegisterRoutes(e, mongoDB)
	go handlers.StartHourlyPriceSaver()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	if err := e.Start(":" + port); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Shutting down the server: %v", err)
	}

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt)
	<-quit

	log.Println("Shutting down the server....")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := e.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited with Graceful Shutdown")
}
