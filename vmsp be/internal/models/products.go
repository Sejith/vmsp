package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Products struct {
	Id          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name        string             `bson:"name" json:"name" validate:"required"`
	Description string             `bson:"description" json:"description" validate:"required"`
	Weight      float64            `bson:"weight" json:"weight" validate:"required"`
	Type        string             `bson:"type" json:"type" validate:"required"`
	IsAvailable bool               `bson:"is_available" json:"is_available" validate:"required"`
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updated_at"`

	Image1 string `bson:"image1,omitempty" json:"image1,omitempty"`
	Image2 string `bson:"image2,omitempty" json:"image2,omitempty"`
	Image3 string `bson:"image3,omitempty" json:"image3,omitempty"`
	Image4 string `bson:"image4,omitempty" json:"image4,omitempty"`
	Image5 string `bson:"image5,omitempty" json:"image5,omitempty"`
}



type ProductResponse struct {
	Product Products `json:"product"`
	Price float64 `json:"price"`
}
