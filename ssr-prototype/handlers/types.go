package handlers

import (
	"github.com/r2capital/ssr-prototype/backend"
	"github.com/r2capital/ssr-prototype/session"
)

// OfferCard represents one RBF offer card on the landing page.
type OfferCard struct {
	Amount    int
	Retention float64
	Total     int
	Fee       int
	Monthly   int
	Term      int
}

// OffersData is the template data for the /offers landing page.
type OffersData struct {
	MerchantName  string
	FullRevAmount int
	Offers        []OfferCard
	Flash         string
	ReturnURL     string
}

// ApplyStep1Data is the template data for the identity form.
type ApplyStep1Data struct {
	Prefill session.PrefillData
	Errors  map[string]string
	Step    StepMeta
}

// ApplyStep2Data is the template data for the consent + social step.
type ApplyStep2Data struct {
	AppID         string
	BackendURL    string
	GoogleURL     string
	FBConnected   bool
	BureauConsent bool
	TwilioConsent bool
	Errors        map[string]string
	Step          StepMeta
}

// ApplyOfferData is the template data for offer reveal pages.
type ApplyOfferData struct {
	Amount     int
	BaseAmount int
	Stage      string // "bureau" | "fiscal"
	Rate       string
	Errors     map[string]string
	Step       StepMeta
}

// ApplyStep3Data is the template data for the fiscal (CIEC) form.
type ApplyStep3Data struct {
	Errors map[string]string
	Step   StepMeta
}

// ApplyDoneData is the template data for the done confirmation page.
type ApplyDoneData struct {
	AppID     string
	ReturnURL string
}

// StatusData is the template data for the application status page.
type StatusData struct {
	Application *backend.Application
	IsPending   bool
	ReturnURL   string
}

// KYCStep1Data is the template data for KYC personal info.
type KYCStep1Data struct {
	AppID   string
	Prefill session.PrefillData
	KYC     session.KYCPersonalData
	Errors  map[string]string
	Step    StepMeta
}

// KYCStep2Data is the template data for KYC address.
type KYCStep2Data struct {
	AppID   string
	Prefill session.PrefillData
	KYC     session.KYCAddressData
	Errors  map[string]string
	Step    StepMeta
}

// KYCStep3Data is the template data for KYC bank account.
type KYCStep3Data struct {
	AppID   string
	Prefill session.PrefillData
	KYC     session.KYCBankData
	Errors  map[string]string
	Step    StepMeta
}

// KYCStep4Data is the template data for KYC document upload.
type KYCStep4Data struct {
	AppID  string
	Errors map[string]string
	Step   StepMeta
}

// KYCStep5Data is the template data for the contract signature step.
type KYCStep5Data struct {
	AppID     string
	FirstName string
	Amount    int
	Step      StepMeta
}

// KYCSuccessData is the template data for the KYC success page.
type KYCSuccessData struct {
	FirstName string
	Amount    int
	ReturnURL string
}

// StepMeta carries progress indicator data shown on all multi-step pages.
type StepMeta struct {
	Current int
	Total   int
	Label   string
}
