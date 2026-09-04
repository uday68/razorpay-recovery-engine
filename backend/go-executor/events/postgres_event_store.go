package events

import (
	"database/sql"
	"fmt"

	_ "github.com/lib/pq"
)

type PostgresEventStore struct {
	db *sql.DB
}

func NewPostgresEventStore(databaseURL string) (*PostgresEventStore, error) {
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		db.Close()
		return nil, err
	}

	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS event_idempotency (
			event_id TEXT PRIMARY KEY,
			claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`)
	if err != nil {
		db.Close()
		return nil, fmt.Errorf("create event_idempotency table: %w", err)
	}

	return &PostgresEventStore{db: db}, nil
}

func (s *PostgresEventStore) Claim(eventID string) (bool, error) {
	var claimedID string

	err := s.db.QueryRow(`
		INSERT INTO event_idempotency (event_id)
		VALUES ($1)
		ON CONFLICT (event_id) DO NOTHING
		RETURNING event_id
	`, eventID).Scan(&claimedID)

	if err == sql.ErrNoRows {
		return false, nil
	}

	if err != nil {
		return false, err
	}

	return true, nil
}

func (s *PostgresEventStore) Delete(eventID string) error {
	_, err := s.db.Exec(
		`DELETE FROM event_idempotency WHERE event_id = $1`,
		eventID,
	)

	return err
}

func (s *PostgresEventStore) Close() error {
	return s.db.Close()
}
