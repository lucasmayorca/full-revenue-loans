package handlers

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/r2capital/ssr-prototype/backend"
	"github.com/r2capital/ssr-prototype/session"
)

// ---- Step 1: Identity ----

func (h *Handler) ApplyStep1Get(w http.ResponseWriter, r *http.Request) {
	sess, sessID := h.store.Get(r)
	errs := session.PopErrors(sess)
	h.store.Save(w, sessID, sess)

	h.render(w, "apply_step1", ApplyStep1Data{
		Prefill: sess.Prefill,
		Errors:  errs,
		Step:    StepMeta{Current: 1, Total: 5, Label: "Cuéntanos sobre tu negocio"},
	})
}

func (h *Handler) ApplyStep1Post(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		http.Error(w, "invalid form", http.StatusBadRequest)
		return
	}

	sess, sessID := h.store.Get(r)
	errs := make(map[string]string)

	email := required(r, "email", "Email", errs)
	taxID := required(r, "tax_id", "RFC", errs)
	phone := required(r, "phone", "Teléfono", errs)
	legalName := r.FormValue("legal_name")
	address := required(r, "address", "Domicilio", errs)
	if address != "" && len(address) < 5 {
		errs["address"] = "Domicilio debe tener al menos 5 caracteres"
	}

	// Basic RFC validation: 12-13 alphanumeric chars.
	if taxID != "" && (len(taxID) < 12 || len(taxID) > 13) {
		errs["tax_id"] = "RFC debe tener 12 o 13 caracteres"
	}

	if len(errs) > 0 {
		sess.Errors = errs
		h.store.Save(w, sessID, sess)
		http.Redirect(w, r, "/full-revenue/apply", http.StatusSeeOther)
		return
	}

	// Create the application on first submit.
	if sess.ApplicationID == "" {
		appID, err := h.backend.CreateApplication(DemoMerchantID)
		if err != nil {
			log.Printf("createApplication: %v", err)
			sess.Errors = map[string]string{"_global": "Error al crear la solicitud. Intenta de nuevo."}
			h.store.Save(w, sessID, sess)
			http.Redirect(w, r, "/full-revenue/apply", http.StatusSeeOther)
			return
		}
		sess.ApplicationID = appID
	}

	sess.Step1 = session.Step1Data{
		Email:     email,
		TaxID:     taxID,
		Phone:     phone,
		LegalName: legalName,
		Address:   address,
	}
	sess.FlowStep = "step2"
	h.store.Save(w, sessID, sess)

	http.Redirect(w, r, "/full-revenue/apply/step2", http.StatusSeeOther)
}

// ---- Step 2: Consent + Social ----

func (h *Handler) ApplyStep2Get(w http.ResponseWriter, r *http.Request) {
	sess, sessID := h.store.Get(r)
	if sess.ApplicationID == "" {
		http.Redirect(w, r, "/full-revenue/apply", http.StatusFound)
		return
	}
	errs := session.PopErrors(sess)
	h.store.Save(w, sessID, sess)

	h.render(w, "apply_step2", ApplyStep2Data{
		AppID:         sess.ApplicationID,
		BackendURL:    h.backendURL,
		GoogleURL:     sess.GoogleURL,
		FBConnected:   sess.FacebookToken != "",
		BureauConsent: sess.BureauConsent,
		TwilioConsent: sess.TwilioConsent,
		Errors:        errs,
		Step:          StepMeta{Current: 2, Total: 5, Label: "Consentimientos y conexiones"},
	})
}

func (h *Handler) ApplyStep2Post(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		http.Error(w, "invalid form", http.StatusBadRequest)
		return
	}

	sess, sessID := h.store.Get(r)
	if sess.ApplicationID == "" {
		http.Redirect(w, r, "/full-revenue/apply", http.StatusFound)
		return
	}

	errs := make(map[string]string)

	bureauConsent := r.FormValue("bureau_consent") == "on"
	twilioConsent := r.FormValue("twilio_consent") == "on"

	if !bureauConsent {
		errs["bureau_consent"] = "Debes aceptar la consulta al Buró de Crédito"
	}
	if !twilioConsent {
		errs["twilio_consent"] = "Debes aceptar la validación de identidad"
	}

	if len(errs) > 0 {
		sess.Errors = errs
		h.store.Save(w, sessID, sess)
		http.Redirect(w, r, "/full-revenue/apply/step2", http.StatusSeeOther)
		return
	}

	sess.BureauConsent = bureauConsent
	sess.TwilioConsent = twilioConsent
	sess.GoogleURL = strings.TrimSpace(r.FormValue("google_url"))

	// Submit consent to backend.
	if err := h.backend.SubmitConsent(sess.ApplicationID, bureauConsent, twilioConsent); err != nil {
		log.Printf("submitConsent %s: %v", sess.ApplicationID, err)
		// Non-fatal: continue to prequal.
	}

	// Run pre-qualification to get initial approved amount.
	prequal, err := h.backend.Prequalify(sess.ApplicationID)
	if err != nil {
		log.Printf("prequalify %s: %v", sess.ApplicationID, err)
	} else if prequal.ApprovedAmount > 0 {
		sess.ApprovedAmount = int(prequal.ApprovedAmount)
	}

	sess.FlowStep = "offer1"
	h.store.Save(w, sessID, sess)

	http.Redirect(w, r, "/full-revenue/apply/offer1", http.StatusSeeOther)
}

// ---- Offer 1: Bureau + Social offer (1.5×) ----

func (h *Handler) ApplyOffer1Get(w http.ResponseWriter, r *http.Request) {
	sess, sessID := h.store.Get(r)
	if sess.ApplicationID == "" {
		http.Redirect(w, r, "/full-revenue/apply", http.StatusFound)
		return
	}
	errs := session.PopErrors(sess)
	h.store.Save(w, sessID, sess)

	h.render(w, "apply_offer1", ApplyOfferData{
		Amount:     sess.OfferAmounts.Social,
		BaseAmount: sess.OfferAmounts.Base,
		Stage:      "bureau",
		Rate:       "3.8%",
		Errors:     errs,
		Step:       StepMeta{Current: 3, Total: 5, Label: "Tu primera oferta"},
	})
}

func (h *Handler) ApplyOffer1Post(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		http.Error(w, "invalid form", http.StatusBadRequest)
		return
	}

	sess, sessID := h.store.Get(r)
	if sess.ApplicationID == "" {
		http.Redirect(w, r, "/full-revenue/apply", http.StatusFound)
		return
	}

	action := r.FormValue("action")

	if action == "ampliar" {
		// User wants to add fiscal data for a larger offer.
		sess.FlowStep = "step3"
		h.store.Save(w, sessID, sess)
		http.Redirect(w, r, "/full-revenue/apply/step3", http.StatusSeeOther)
		return
	}

	// action == "apply": submit with social data only.
	if err := h.submitApplication(sess, false); err != nil {
		log.Printf("submitApplication social-only %s: %v", sess.ApplicationID, err)
		sess.Errors = map[string]string{"_global": "Error al enviar la solicitud. Intenta de nuevo."}
		h.store.Save(w, sessID, sess)
		http.Redirect(w, r, "/full-revenue/apply/offer1", http.StatusSeeOther)
		return
	}

	sess.FlowStep = "done"
	h.store.Save(w, sessID, sess)
	http.Redirect(w, r, "/full-revenue/apply/done", http.StatusSeeOther)
}

// ---- Step 3: Fiscal (CIEC) ----

func (h *Handler) ApplyStep3Get(w http.ResponseWriter, r *http.Request) {
	sess, sessID := h.store.Get(r)
	if sess.ApplicationID == "" {
		http.Redirect(w, r, "/full-revenue/apply", http.StatusFound)
		return
	}
	errs := session.PopErrors(sess)
	h.store.Save(w, sessID, sess)

	h.render(w, "apply_step3", ApplyStep3Data{
		Errors: errs,
		Step:   StepMeta{Current: 4, Total: 5, Label: "Validación fiscal"},
	})
}

func (h *Handler) ApplyStep3Post(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		http.Error(w, "invalid form", http.StatusBadRequest)
		return
	}

	sess, sessID := h.store.Get(r)
	if sess.ApplicationID == "" {
		http.Redirect(w, r, "/full-revenue/apply", http.StatusFound)
		return
	}

	errs := make(map[string]string)
	ciec := required(r, "ciec", "CIEC", errs)

	if len(ciec) < 8 {
		errs["ciec"] = "CIEC debe tener al menos 8 caracteres"
	}

	if len(errs) > 0 {
		sess.Errors = errs
		h.store.Save(w, sessID, sess)
		http.Redirect(w, r, "/full-revenue/apply/step3", http.StatusSeeOther)
		return
	}

	sess.Fiscal = session.FiscalData{CIEC: ciec}
	sess.FlowStep = "offer2"
	h.store.Save(w, sessID, sess)

	http.Redirect(w, r, "/full-revenue/apply/offer2", http.StatusSeeOther)
}

// ---- Offer 2: Full fiscal offer (3×) ----

func (h *Handler) ApplyOffer2Get(w http.ResponseWriter, r *http.Request) {
	sess, sessID := h.store.Get(r)
	if sess.ApplicationID == "" {
		http.Redirect(w, r, "/full-revenue/apply", http.StatusFound)
		return
	}
	errs := session.PopErrors(sess)
	h.store.Save(w, sessID, sess)

	h.render(w, "apply_offer2", ApplyOfferData{
		Amount:     sess.OfferAmounts.Fiscal,
		BaseAmount: sess.OfferAmounts.Base,
		Stage:      "fiscal",
		Rate:       "3.0%",
		Errors:     errs,
		Step:       StepMeta{Current: 5, Total: 5, Label: "Tu oferta final"},
	})
}

func (h *Handler) ApplyOffer2Post(w http.ResponseWriter, r *http.Request) {
	sess, sessID := h.store.Get(r)
	if sess.ApplicationID == "" {
		http.Redirect(w, r, "/full-revenue/apply", http.StatusFound)
		return
	}

	if err := h.submitApplication(sess, true); err != nil {
		log.Printf("submitApplication fiscal %s: %v", sess.ApplicationID, err)
		sess.Errors = map[string]string{"_global": "Error al enviar la solicitud. Intenta de nuevo."}
		h.store.Save(w, sessID, sess)
		http.Redirect(w, r, "/full-revenue/apply/offer2", http.StatusSeeOther)
		return
	}

	sess.FlowStep = "done"
	h.store.Save(w, sessID, sess)
	http.Redirect(w, r, "/full-revenue/apply/done", http.StatusSeeOther)
}

// ---- Done ----

func (h *Handler) ApplyDoneGet(w http.ResponseWriter, r *http.Request) {
	sess, sessID := h.store.Get(r)
	h.store.Save(w, sessID, sess)

	h.render(w, "apply_done", ApplyDoneData{
		AppID:     sess.ApplicationID,
		ReturnURL: sess.ReturnURL,
	})
}

// ---- Facebook OAuth callback ----

// OAuthCallbackGet handles the redirect from the backend after Facebook OAuth.
// The backend redirects to FRONTEND_URL/full-revenue/oauth/callback with
// query params: facebook=connected&fb_token=<token>&appId=<id>
func (h *Handler) OAuthCallbackGet(w http.ResponseWriter, r *http.Request) {
	sess, sessID := h.store.Get(r)

	fbToken := r.URL.Query().Get("fb_token")
	if fbToken == "" {
		fbToken = r.URL.Query().Get("access_token")
	}
	if fbToken != "" {
		sess.FacebookToken = fbToken
	}

	h.store.Save(w, sessID, sess)
	http.Redirect(w, r, "/full-revenue/apply/step2", http.StatusSeeOther)
}

// ---- Shared submit helper ----

func (h *Handler) submitApplication(sess *session.Session, withFiscal bool) error {
	payload := backend.SubmitPayload{
		TaxID:         sess.Step1.TaxID,
		Email:         sess.Step1.Email,
		Phone:         sess.Step1.Phone,
		LegalName:     sess.Step1.LegalName,
		Address:       sess.Step1.Address,
		GoogleMapsURL: sess.GoogleURL,
		FacebookToken: sess.FacebookToken,
		WithSocial:    true,
		WithFiscal:    withFiscal,
		ConsentGiven:  true,
		BureauConsent: sess.BureauConsent,
		TwilioConsent: sess.TwilioConsent,
	}
	if withFiscal {
		payload.CIEC = sess.Fiscal.CIEC
	}
	return h.backend.SubmitApplication(sess.ApplicationID, payload)
}

// fmtAmount formats an int as a display string (used in templates via printf).
func fmtAmount(n int) string {
	return fmt.Sprintf("%d", n)
}

// ensure fmtAmount is referenced to avoid unused import.
var _ = fmtAmount
