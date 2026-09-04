package events

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

type ExecutionClient struct {
	baseURL    string
	httpClient *http.Client
}

func NewExecutionClient(baseURL string) *ExecutionClient {
	return &ExecutionClient{
		baseURL:    baseURL,
		httpClient: &http.Client{},
	}
}

func (c *ExecutionClient) Execute(
	command RecoveryCommand,
) (ExecutionResult, error) {
	payload, err := json.Marshal(command)
	if err != nil {
		return ExecutionResult{}, fmt.Errorf(
			"marshal execution command: %w",
			err,
		)
	}

	req, err := http.NewRequest(
		http.MethodPost,
		c.baseURL+"/v1/recovery/execute",
		bytes.NewReader(payload),
	)
	if err != nil {
		return ExecutionResult{}, fmt.Errorf(
			"create execution request: %w",
			err,
		)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return ExecutionResult{}, fmt.Errorf(
			"execution request failed: %w",
			err,
		)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return ExecutionResult{}, fmt.Errorf(
			"execution service returned status %d",
			resp.StatusCode,
		)
	}

	var response struct {
		PaymentID string `json:"payment_id"`
		Recovered bool   `json:"recovered"`
		Attempts  int    `json:"attempts"`
		Outcome   string `json:"outcome"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return ExecutionResult{}, fmt.Errorf(
			"decode execution response: %w",
			err,
		)
	}

	return ExecutionResult{
		PaymentID: response.PaymentID,
		Recovered: response.Recovered,
		Attempts:  response.Attempts,
		Outcome:   response.Outcome,
		Amount:    command.Amount,
	}, nil
}
