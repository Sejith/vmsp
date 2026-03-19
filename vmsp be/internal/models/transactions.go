package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Transactions struct {
	Id            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserId        primitive.ObjectID `bson:"user_id" json:"user_id"`
	Index         string             `bson:"index" json:"index"`
	Items         []ProductItems     `bson:"items" json:"items"`
	Quantity      int                `bson:"total_quantity" json:"total_quantity"`
	Price         float64            `bson:"total_price" json:"total_price"`
	Discount      float64            `bson:"discount" json:"discount"`
	DiscountPrice float64            `bson:"discount_price" json:"discount_price"`
	ModeOfPayment string             `bson:"payment_mode" json:"payment_mode"`
	CreatedAt     time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt     time.Time          `bson:"updated_at" json:"updated_at"`
	Status        string             `bson:"status" json:"status" default:"PROCESSING"`
	Invoiceurl    string             `bson:"invoice_url" json:"invoice_url"`
}

type ProductItems struct {
	ProductId primitive.ObjectID `bson:"product_id" json:"product_id"`
	Name      string             `bson:"name" json:"name"`
	MetalType string             `bson:"metal_type" json:"metal_type"`
	WeightGM  float64            `bson:"weight_gm" json:"weight_gm"`
	RatePerGM float64            `bson:"rate_per_gm" json:"rate_per_gm"`
	UnitPrice float64            `bson:"unit_price" json:"unit_price"`
	Quantity  int                `bson:"quantity" json:"quantity"`
	LineTotal float64            `bson:"line_total" json:"line_total"`
}

type InsertTransaction struct {
	UserId        string         `json:"user_id"`
	Items         []ProductItems `json:"items"`
	ModeOfPayment string         `json:"payment_mode"`
}

type TransactionSummary struct {
	ID            primitive.ObjectID `bson:"_id" json:"_id"`
	UserID        primitive.ObjectID `bson:"user_id" json:"user_id"`
	Username      string             `bson:"username" json:"username"`
	DiscountPrice float64            `bson:"discount_price" json:"discount_price"`
	InvoiceURL    string             `bson:"invoice_url" json:"invoice_url"`
	Status        string             `bson:"status" json:"status"`
	UpdatedAt     time.Time          `bson:"updated_at" json:"updated_at"`
}
