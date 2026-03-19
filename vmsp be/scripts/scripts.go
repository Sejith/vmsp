package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	godotenv.Load()
	uri := os.Getenv("MONGO_URI")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		log.Fatal("Failed to connect to db:", err)
	}

	db := client.Database(os.Getenv("MONGO_DBNAME"))
	users := db.Collection("Users")

	usernameToUpdate := "sejithkumar"

	filter := bson.M{"username": usernameToUpdate}
	update := bson.M{
		"$set": bson.M{
			"email":        "",
			"phone_number": "",
		},
	}

	result, err := users.UpdateMany(ctx, filter, update)
	if err != nil {
		log.Fatal("Failed to update users:", err)
	}

	fmt.Printf("Updated %d users\n", result.ModifiedCount)
}
