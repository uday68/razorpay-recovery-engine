package main

import (
	"database/sql"
	"fmt"

	_ "github.com/lib/pq"
)

type PostgresCommandStore struct {
	db *sql.DB
}

func NewPostgresCommandStore(databaseURL string) (*PostgresCommandStore, error) {
	db, err := sql.Open("postgres", databaseURL)

	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		db.Close()
		return nil, err
	}

	_, err = db.Exec(`
CREATE TABLE IF NOT EXISTS command_idempotency (
			command_id TEXT PRIMARY KEY,
			claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
`)

	if err != nil {
		db.Close()
		return nil, fmt.Errorf("create command_idempotency table :%w", err)
	}
	return &PostgresCommandStore{db: db}, nil
}

func (s *PostgresCommandStore) Claim(commandID string) (bool, error) {
	var claimedID string

	err := s.db.QueryRow(`
		INSERT INTO command_idempotency (command_id)
		VALUES ($1)
		ON CONFLICT (command_id) DO NOTHING
		RETURNING command_id
	`, commandID).Scan(&claimedID)

	if err == sql.ErrNoRows {
		return false, nil
	}

	if err != nil {
		return false, err
	}

	return true, nil
}

func (s *PostgresCommandStore) Delete(commandID string) error {
	_, err := s.db.Exec(
		`DELETE FROM command_idempotency WHERE command_id = $1`,
		commandID,
	)

	return err
}

func (s *PostgresCommandStore) Close() error {
	return s.db.Close()
}
