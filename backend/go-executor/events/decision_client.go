package events

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

type DecisionResult struct {
	PaymentID     string  `json:"payment_id"`
	Action        string  `json:"action"`
	ExpectedValue float64 `json:"expected_value"`
	Probability   float64 `json:"probability"`
}

type DecisionClient struct {
	baseURL    string
	httpClient *http.Client
}

func NewDecisionClient(baseURL string) *DecisionClient {
	return &DecisionClient{
		baseURL:    baseURL,
		httpClient: &http.Client{},
	}
}

func (c *DecisionClient) Decide(event PaymentFailedEvent) (DecisionResult, error) {
	payload, err := json.Marshal(event)
	if err != nil {
		return DecisionResult{}, fmt.Errorf("marshal decision request: %w", err)
	}

	req, err := http.NewRequest(
		http.MethodPost,
		c.baseURL+"/v1/recovery/decide",
		bytes.NewReader(payload),
	)
	if err != nil {
		return DecisionResult{}, fmt.Errorf("create decision request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return DecisionResult{}, fmt.Errorf("decision request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return DecisionResult{}, fmt.Errorf(
			"decision service returned status %d",
			resp.StatusCode,
		)
	}

	var result DecisionResult

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return DecisionResult{}, fmt.Errorf(
			"decode decision response: %w",
			err,
		)
	}

	return result, nil
}
