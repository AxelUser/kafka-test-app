package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"

	_ "github.com/lib/pq"
	"github.com/segmentio/kafka-go"
)

type UserTextMessage struct {
	UserText string `json:"userText"`
}

func main() {
	kafkaBrokers := os.Getenv("KAFKA_BROKERS")
	userTextMessagesTopic := os.Getenv("USER_TEXT_MESSAGES_TOPIC")
	groupID := os.Getenv("KAFKA_GROUP_ID")
	dbSource := os.Getenv("DATABASE_URL")

	// Kafka setup
	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers: strings.Split(kafkaBrokers, ","),
		Topic:   userTextMessagesTopic,
		GroupID: groupID,
	})

	log.Printf("Connected to Kafka topic %s, located on Kafka brokers %s.\n", userTextMessagesTopic, kafkaBrokers)

	// Database setup
	db, err := sql.Open("postgres", dbSource)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	log.Printf("Connected to PostgreSQL")

	// Ensure the DB is ready
	ensureDBReady(db)

	// Processing loop
	for {
		m, err := r.FetchMessage(context.Background())
		if err != nil {
			log.Printf("could not read message: %v\n", err)
			continue
		}

		err = handleMessage(m, db)
		if err != nil {
			log.Printf("failed to handle message: %v", err)
		}

		err = r.CommitMessages(context.Background(), m)
		if err != nil {
			log.Printf("failed to commit message from topic %s, partition %d and offset %d", m.Topic, m.Partition, m.Offset)
		} else {
			log.Printf("committed message from topic %s, partition %d and offset %d", m.Topic, m.Partition, m.Offset)
		}
	}
}

func handleMessage(m kafka.Message, db *sql.DB) error {
	var msg UserTextMessage
	if err := json.Unmarshal(m.Value, &msg); err != nil {
		return fmt.Errorf("could not unmarshal message: %w", err)
	}

	key := string(m.Key)

	wordCount := len(strings.Fields(msg.UserText))
	fmt.Printf("Received: %s - Words: %d\n", msg.UserText, wordCount)

	// Insert into database
	if _, err := db.Exec("INSERT INTO user_text (id, text, word_count) VALUES ($1, $2, $3)", key, msg.UserText, wordCount); err != nil {
		return fmt.Errorf("could not add user text into database: %w", err)
	}

	return nil
}

func ensureDBReady(db *sql.DB) {
	if _, err := db.Exec("CREATE TABLE IF NOT EXISTS user_text (id TEXT PRIMARY KEY, text TEXT, word_count INT)"); err != nil {
		log.Fatal("could not create table: ", err)
	}
}
