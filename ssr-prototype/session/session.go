package session

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"sync"
	"time"
)

const CookieName = "fr_session"

type OfferAmounts struct {
	Base   int
	Social int // 1.5×
	Fiscal int // 3×
}

type Step1Data struct {
	Email     string
	TaxID     string
	Phone     string
	LegalName string
	Address   string
}

type FiscalData struct {
	CIEC string
}

type PrefillData struct {
	MerchantID    string
	FirstName     string
	LastName      string
	Email         string
	Phone         string
	TaxID         string
	LegalName     string
	Address       string
	Street        string
	Neighborhood  string
	PostalCode    string
	City          string
	State         string
	CLABE         string
	BankName      string
	AccountType   string
	AccountHolder string
}

type KYCPersonalData struct {
	FirstName     string
	LastName      string
	BirthDate     string
	Nationality   string
	MaritalStatus string
	RFC           string
}

type KYCAddressData struct {
	Street       string
	Neighborhood string
	PostalCode   string
	City         string
	State        string
}

type KYCBankData struct {
	CLABE         string
	BankName      string
	AccountType   string
	AccountHolder string
}

type Session struct {
	ID             string
	CreatedAt      time.Time
	ApplicationID  string
	FlowStep       string
	BaseAmount     int
	OfferAmounts   OfferAmounts
	Step1          Step1Data
	Fiscal         FiscalData
	Prefill        PrefillData
	HasPrefill     bool
	GoogleURL      string
	FacebookToken  string
	ReturnURL      string
	Errors         map[string]string
	KYCPersonal    KYCPersonalData
	KYCAddress     KYCAddressData
	KYCBank        KYCBankData
	KYCFrontFile   string // filename only, not proxied in prototype
	KYCBackFile    string
	BureauConsent  bool
	TwilioConsent  bool
	ApprovedAmount int
	DecisionStatus string
}

type Store struct {
	mu       sync.RWMutex
	sessions map[string]*Session
}

func NewStore() *Store {
	return &Store{sessions: make(map[string]*Session)}
}

func (s *Store) New() (*Session, string) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		panic("session: rand.Read: " + err.Error())
	}
	id := hex.EncodeToString(b)
	sess := &Session{
		ID:        id,
		CreatedAt: time.Now(),
		Errors:    make(map[string]string),
	}
	s.mu.Lock()
	s.sessions[id] = sess
	s.mu.Unlock()
	return sess, id
}

// Get retrieves an existing session from the cookie or creates a new one.
func (s *Store) Get(r *http.Request) (*Session, string) {
	cookie, err := r.Cookie(CookieName)
	if err != nil {
		return s.New()
	}
	s.mu.RLock()
	sess, ok := s.sessions[cookie.Value]
	s.mu.RUnlock()
	if !ok {
		return s.New()
	}
	if sess.Errors == nil {
		sess.Errors = make(map[string]string)
	}
	return sess, cookie.Value
}

// Save persists the session and sets the cookie.
func (s *Store) Save(w http.ResponseWriter, id string, sess *Session) {
	s.mu.Lock()
	s.sessions[id] = sess
	s.mu.Unlock()
	http.SetCookie(w, &http.Cookie{
		Name:     CookieName,
		Value:    id,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   86400, // 24 hours
	})
}

// PopErrors returns current errors and clears them from the session.
func PopErrors(sess *Session) map[string]string {
	errs := sess.Errors
	sess.Errors = make(map[string]string)
	return errs
}
