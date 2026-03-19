package migrations

import (
	"log"
	"vyavahara-backend/config/db"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func InitMigration(mongoDB *db.MongoDB) {
	err := mongoDB.AutoMigrate("Users", []mongo.IndexModel{
		{
			Keys:    bson.M{"username": 1},
			Options: options.Index().SetUnique(true),
		},
	})
	if err != nil {
		log.Println("[MIGRATION] Users Migration failed:", err)
	} else {
		log.Println("[MIGRATION] Users migration Successful")
	}

	err = mongoDB.AutoMigrate("Products", []mongo.IndexModel{
		{
			Keys:    bson.M{"name": 1},
			Options: options.Index().SetUnique(true),
		},
	})
	if err != nil {
		log.Println("[MIGRATION] Products Migration failed:", err)
	} else {
		log.Println("[MIGRATION] Products migration Successful")
	}

	err = mongoDB.AutoMigrate("Carts", []mongo.IndexModel{
		{
			Keys:    bson.M{"cart_name": 1},
			Options: options.Index().SetUnique(true),
		},
	})
	if err != nil {
		log.Println("[MIGRATION] Carts Migration failed:", err)
	} else {
		log.Println("[MIGRATION] Carts migration Successful")
	}

	err = mongoDB.AutoMigrate("Transactions", []mongo.IndexModel{
		{
			Keys:    bson.M{"index": 1},
			Options: options.Index().SetUnique(true),
		},
	})
	if err != nil {
		log.Println("[MIGRATION] Transactions Migration failed:", err)
	} else {
		log.Println("[MIGRATION] Transactions migration Successful")
	}
}
