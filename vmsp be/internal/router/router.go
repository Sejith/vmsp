package router

import (
	"vyavahara-backend/config/db"
	"vyavahara-backend/internal/handlers"
	"vyavahara-backend/internal/middlewares"

	"github.com/labstack/echo/v4"
)

func RegisterRoutes(e *echo.Echo, vyavaharaDB *db.MongoDB) {
	e.GET("/health", handlers.CheckHealth)
	e.POST("/v1/signup", handlers.V1SignUp(vyavaharaDB))
	e.POST("/v1/login", handlers.V1Login(vyavaharaDB))
	e.GET("/metal-prices", handlers.MetalPricesHandler)

	basicAuthGroup := e.Group("/v1")
	basicAuthGroup.Use(middlewares.BasicAuthMiddleWare(vyavaharaDB))

	basicAuthGroup.GET("/get/user", handlers.GetUserDetails(vyavaharaDB))
	basicAuthGroup.POST("/update/user", handlers.UpdateUserDetails(vyavaharaDB))
	basicAuthGroup.POST("/upload/product", handlers.V1UploadProduct(vyavaharaDB))
	basicAuthGroup.GET("/get/products", handlers.V1GetProducts(vyavaharaDB))
	basicAuthGroup.GET("/get/product/:id", handlers.V1GetProductsById(vyavaharaDB))
	basicAuthGroup.POST("/update/product", handlers.V1UpdateProductByID(vyavaharaDB))
	basicAuthGroup.GET("/get/cart", handlers.GetCart(vyavaharaDB))
	basicAuthGroup.POST("/update/cart", handlers.AddOrUpdateCart(vyavaharaDB))
	basicAuthGroup.GET("/get/admin/transactions", handlers.GetTransactions(vyavaharaDB))
	basicAuthGroup.GET("/get/transactions", handlers.GetTransactionsHandler(vyavaharaDB))
	basicAuthGroup.POST("/add/transactions", handlers.AddTransaction(vyavaharaDB))
	basicAuthGroup.POST("/update/transactions", handlers.UpdateTransactions(vyavaharaDB))
}
