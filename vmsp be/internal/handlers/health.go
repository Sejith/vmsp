package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

func CheckHealth(c echo.Context) error {
	return  c.JSON(http.StatusOK, map[string]string {
		"message": "Service is working fine",
	})
}