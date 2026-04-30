package backend

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type Client struct {
	baseURL    string
	httpClient *http.Client
}

func New(baseURL string) *Client {
	return &Client{
		baseURL:    baseURL,
		httpClient: &http.Client{Timeout: 15 * time.Second},
	}
}

// ---- Domain types ----

type creditOffer struct {
	ApprovedAmount int `json:"approved_amount"`
}

type decisionPayload struct {
	CreditOffer creditOffer `json:"credit_offer"`
}

type Application struct {
	ID              string          `json:"id"`
	MerchantID      string          `json:"merchant_id"`
	DecisionStatus  string          `json:"decision_status"`
	DecisionPayload decisionPayload `json:"decision_payload"`
	TaxID           string          `json:"tax_id"`
	Email           string          `json:"email"`
}

// ApprovedAmount returns the approved amount from the nested decision payload.
func (a *Application) ApprovedAmount() int {
	return a.DecisionPayload.CreditOffer.ApprovedAmount
}

type PrefillOffer struct {
	Amount    int     `json:"amount"`
	Retention float64 `json:"retention"`
	Total     int     `json:"total"`
	Fee       int     `json:"fee"`
	Monthly   int     `json:"monthly"`
	Term      int     `json:"term"`
}

type PrefillData struct {
	MerchantID    string `json:"merchant_id"`
	FirstName     string `json:"first_name"`
	LastName      string `json:"last_name"`
	Email         string `json:"email"`
	Phone         string `json:"phone"`
	TaxID         string `json:"tax_id"`
	LegalName     string `json:"legal_name"`
	Address       string `json:"address"`
	Street        string `json:"street"`
	Neighborhood  string `json:"neighborhood"`
	PostalCode    string `json:"postal_code"`
	City          string `json:"city"`
	State         string `json:"state"`
	CLABE         string `json:"clabe"`
	BankName      string `json:"bank_name"`
	AccountType   string `json:"account_type"`
	AccountHolder string `json:"account_holder"`
}

type PrefillLink struct {
	Token      string         `json:"token"`
	BaseAmount int            `json:"base_amount"`
	Offers     []PrefillOffer `json:"offers"`
	Prefill    PrefillData    `json:"prefill"`
}

type PrequalResult struct {
	ApprovedAmount float64 `json:"approved_amount"`
}

// submitFormData matches the backend's formDataSchema exactly.
type submitFormData struct {
	Email               string `json:"email"`
	Address             string `json:"address"`
	ConsentGiven        bool   `json:"consent_given"`
	TaxID               string `json:"tax_id,omitempty"`
	LegalName           string `json:"legal_name,omitempty"`
	Phone               string `json:"phone,omitempty"`
	CIEC                string `json:"ciec,omitempty"`
	GoogleBusinessURL   string `json:"google_business_url,omitempty"`
	FacebookAccessToken string `json:"facebook_access_token,omitempty"`
}

type SubmitPayload struct {
	TaxID         string
	Email         string
	Phone         string
	LegalName     string
	Address       string
	GoogleMapsURL string
	FacebookToken string
	CIEC          string
	WithFiscal    bool
	WithSocial    bool
	ConsentGiven  bool
	BureauConsent bool
	TwilioConsent bool
}

// ---- API methods ----

func (c *Client) CreateApplication(merchantID string) (string, error) {
	var result struct {
		ID string `json:"id"`
	}
	if err := c.post("/full-revenue/applications", map[string]string{"merchant_id": merchantID}, &result); err != nil {
		return "", err
	}
	return result.ID, nil
}

func (c *Client) SubmitConsent(appID string, bureau, twilio bool) error {
	return c.post("/full-revenue/applications/"+appID+"/consent", map[string]any{
		"bureau_consent":          bureau,
		"twilio_consent":          twilio,
		"data_processing_consent": true,
	}, nil)
}

func (c *Client) Prequalify(appID string) (*PrequalResult, error) {
	var result PrequalResult
	if err := c.get("/full-revenue/applications/"+appID+"/prequal", &result); err != nil {
		return nil, err
	}
	return &result, nil
}

func (c *Client) SubmitApplication(appID string, payload SubmitPayload) error {
	body := map[string]any{
		"form_data": submitFormData{
			Email:               payload.Email,
			Address:             payload.Address,
			ConsentGiven:        true,
			TaxID:               payload.TaxID,
			LegalName:           payload.LegalName,
			Phone:               payload.Phone,
			CIEC:                payload.CIEC,
			GoogleBusinessURL:   payload.GoogleMapsURL,
			FacebookAccessToken: payload.FacebookToken,
		},
	}
	return c.post("/full-revenue/applications/"+appID+"/submit", body, nil)
}

func (c *Client) GetApplication(appID string) (*Application, error) {
	var result Application
	if err := c.get("/full-revenue/applications/"+appID, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

func (c *Client) GetPrefillLink(token string) (*PrefillLink, error) {
	var result PrefillLink
	if err := c.get("/full-revenue/prefill/"+token, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// BackendError carries the HTTP status code from the backend.
type BackendError struct {
	StatusCode int
	Body       string
}

func (e *BackendError) Error() string {
	return fmt.Sprintf("backend %d: %s", e.StatusCode, e.Body)
}

// ---- HTTP helpers ----

func (c *Client) get(path string, out any) error {
	resp, err := c.httpClient.Get(c.baseURL + path)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return &BackendError{StatusCode: resp.StatusCode, Body: string(body)}
	}
	if out == nil {
		return nil
	}
	return json.NewDecoder(resp.Body).Decode(out)
}

func (c *Client) post(path string, body any, out any) error {
	b, err := json.Marshal(body)
	if err != nil {
		return err
	}
	resp, err := c.httpClient.Post(c.baseURL+path, "application/json", bytes.NewReader(b))
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return &BackendError{StatusCode: resp.StatusCode, Body: string(bodyBytes)}
	}
	if out == nil {
		return nil
	}
	return json.NewDecoder(resp.Body).Decode(out)
}
