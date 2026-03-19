package redis

import (
	"context"
	"crypto/tls"
	"log"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

var Client *redis.Client

func InitUpstashRedis(ctx context.Context) {
	redisURL := os.Getenv("UPSTASH_REDIS_URL")
	if redisURL == "" {
		log.Fatal("UPSTASH_REDIS_URL not set")
	}

	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Fatalf("Invalid Redis URL: %v", err)
	}

	// Force TLS for rediss://
	if opt.TLSConfig == nil {
		opt.TLSConfig = &tls.Config{}
	}

	Client = redis.NewClient(opt)

	// Try ping with retries
	for i := 0; i < 5; i++ {
		_, err := Client.Ping(ctx).Result()
		if err == nil {
			log.Println("Connected to Redis")
			return
		}
		log.Printf("Redis connection attempt %d failed: %v\n", i+1, err)
		time.Sleep(time.Duration(i+1) * time.Second)
	}

	log.Fatal("Failed to connect to Redis after retries")
}
