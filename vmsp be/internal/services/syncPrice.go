package services

import (
	"context"
	"strconv"
	"sync"
	"time"
	"vyavahara-backend/config/redis"
)

type MetalService struct {
	gold   float64
	silver float64
	expiry time.Time
	mu     sync.RWMutex
}

var metalService = &MetalService{}

func GetMetalService() *MetalService {
	return metalService
}

func (m *MetalService) GetRates() (float64, float64) {

	m.mu.RLock()
	if time.Now().Before(m.expiry) {
		gold := m.gold
		silver := m.silver
		m.mu.RUnlock()
		return gold, silver
	}
	m.mu.RUnlock()

	m.mu.Lock()
	defer m.mu.Unlock()

	if time.Now().Before(m.expiry) {
		return m.gold, m.silver
	}

	vals, err := redis.Client.MGet(
		context.Background(),
		"gold",
		"silver",
	).Result()

	if err != nil || len(vals) < 2 {
		return 0, 0
	}

	goldStr, ok1 := vals[0].(string)
	silverStr, ok2 := vals[1].(string)

	if !ok1 || !ok2 {
		return 0, 0
	}

	gold, _ := strconv.ParseFloat(goldStr, 64)
	silver, _ := strconv.ParseFloat(silverStr, 64)

	m.gold = gold
	m.silver = silver
	m.expiry = time.Now().Add(1 * time.Hour)

	return gold, silver
}
