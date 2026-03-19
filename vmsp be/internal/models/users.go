package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type User struct {
	Id          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	FirstName   string             `bson:"first_name" json:"first_name" validate:"required"`
	LastName    string             `bson:"last_name" json:"last_name" validate:"required"`
	UserName    string             `bson:"username" json:"username" validate:"required"`
	PassWord    string             `bson:"password" json:"password" validate:"required"`
	IsAdmin     bool               `bson:"is_admin" json:"is_admin"`
	IsActive    bool               `bson:"is_active" json:"is_active"`
	PhoneNumber string             `bson:"phone_number" json:"phone_number" validate:"required"`
	Email       string             `bson:"email" json:"email" validate:"required"`
	CartId      primitive.ObjectID `bson:"cart_id" json:"cart_id"`
}

type Login struct {
	UserName string `json:"username"`
	PassWord string `json:"password"`
}

type UpdateUser struct {
	UserName    string `json:"username"`
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
	IsAdmin     bool   `json:"is_admin"`
	IsActive    bool   `json:"is_active"`
	PhoneNumber string `json:"phone_number"`
	Email       string `json:"email"`
}
