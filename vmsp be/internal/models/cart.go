package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Carts struct {
	Id        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Items     []CartItem         `bson:"items" json:"items"`
	Name      string             `bson:"cart_name" json:"cart_name"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time          `bson:"updated_at" json:"updated_at"`
}

type CartItem struct {
	ProductId primitive.ObjectID `bson:"product_id" json:"product_id"`
	Quantity  int                `bson:"quantity" json:"quantity"`
}
