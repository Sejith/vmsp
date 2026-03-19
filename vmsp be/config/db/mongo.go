package db

import (
	"context"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoDB struct {
	Client *mongo.Client
	Database *mongo.Database
}

func Connect() *MongoDB {
	uri := os.Getenv("MONGO_URI")
	dbName := os.Getenv("MONGO_DBNAME")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		log.Fatal("Failed to connect to db:", err)
	}

	log.Println("Connected to DB:", dbName)
	return &MongoDB{
		Client: client,
		Database: client.Database(dbName),
	}
}


func (m *MongoDB) AutoMigrate(collection string, indexes []mongo.IndexModel) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_,err := m.Database.Collection(collection).Indexes().CreateMany(ctx,indexes)
	return err
}
