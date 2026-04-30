package handlers

import (
	"log"
	"net/http"

	"github.com/r2capital/ssr-prototype/session"
)

// ---- KYC Step 1: Personal data ----

func (h *Handler) KYCStep1Get(w http.ResponseWriter, r *http.Request) {
	appID := r.PathValue("id")
	sess, sessID := h.store.Get(r)
	errs := session.PopErrors(sess)
	h.store.Save(w, sessID, sess)

	h.render(w, "kyc_step1", KYCStep1Data{
		AppID:   appID,
		Prefill: sess.Prefill,
		KYC:     sess.KYCPersonal,
		Errors:  errs,
		Step:    StepMeta{Current: 1, Total: 5, Label: "Datos personales"},
	})
}

func (h *Handler) KYCStep1Post(w http.ResponseWriter, r *http.Request) {
	appID := r.PathValue("id")
	if err := r.ParseForm(); err != nil {
		http.Error(w, "invalid form", http.StatusBadRequest)
		return
	}

	sess, sessID := h.store.Get(r)
	errs := make(map[string]string)

	firstName := required(r, "first_name", "Nombre", errs)
	lastName := required(r, "last_name", "Apellido", errs)
	birthDate := required(r, "birth_date", "Fecha de nacimiento", errs)
	nationality := required(r, "nationality", "Nacionalidad", errs)
	maritalStatus := r.FormValue("marital_status")
	rfc := r.FormValue("rfc")

	if len(errs) > 0 {
		sess.Errors = errs
		h.store.Save(w, sessID, sess)
		http.Redirect(w, r, "/full-revenue/kyc/"+appID, http.StatusSeeOther)
		return
	}

	sess.KYCPersonal = session.KYCPersonalData{
		FirstName:     firstName,
		LastName:      lastName,
		BirthDate:     birthDate,
		Nationality:   nationality,
		MaritalStatus: maritalStatus,
		RFC:           rfc,
	}
	h.store.Save(w, sessID, sess)
	http.Redirect(w, r, "/full-revenue/kyc/"+appID+"/step2", http.StatusSeeOther)
}

// ---- KYC Step 2: Address ----

func (h *Handler) KYCStep2Get(w http.ResponseWriter, r *http.Request) {
	appID := r.PathValue("id")
	sess, sessID := h.store.Get(r)
	errs := session.PopErrors(sess)
	h.store.Save(w, sessID, sess)

	// Pre-fill address from prefill data if KYC address is empty.
	kyc := sess.KYCAddress
	if kyc.Street == "" && sess.Prefill.Street != "" {
		kyc.Street = sess.Prefill.Street
		kyc.Neighborhood = sess.Prefill.Neighborhood
		kyc.PostalCode = sess.Prefill.PostalCode
		kyc.City = sess.Prefill.City
		kyc.State = sess.Prefill.State
	}

	h.render(w, "kyc_step2", KYCStep2Data{
		AppID:   appID,
		Prefill: sess.Prefill,
		KYC:     kyc,
		Errors:  errs,
		Step:    StepMeta{Current: 2, Total: 5, Label: "Dirección del negocio"},
	})
}

func (h *Handler) KYCStep2Post(w http.ResponseWriter, r *http.Request) {
	appID := r.PathValue("id")
	if err := r.ParseForm(); err != nil {
		http.Error(w, "invalid form", http.StatusBadRequest)
		return
	}

	sess, sessID := h.store.Get(r)
	errs := make(map[string]string)

	street := required(r, "street", "Calle y número", errs)
	neighborhood := required(r, "neighborhood", "Colonia", errs)
	postalCode := required(r, "postal_code", "Código postal", errs)
	city := required(r, "city", "Ciudad", errs)
	state := required(r, "state", "Estado", errs)

	if len(postalCode) != 5 {
		errs["postal_code"] = "Código postal debe tener 5 dígitos"
	}

	if len(errs) > 0 {
		sess.Errors = errs
		h.store.Save(w, sessID, sess)
		http.Redirect(w, r, "/full-revenue/kyc/"+appID+"/step2", http.StatusSeeOther)
		return
	}

	sess.KYCAddress = session.KYCAddressData{
		Street:       street,
		Neighborhood: neighborhood,
		PostalCode:   postalCode,
		City:         city,
		State:        state,
	}
	h.store.Save(w, sessID, sess)
	http.Redirect(w, r, "/full-revenue/kyc/"+appID+"/step3", http.StatusSeeOther)
}

// ---- KYC Step 3: Bank account ----

func (h *Handler) KYCStep3Get(w http.ResponseWriter, r *http.Request) {
	appID := r.PathValue("id")
	sess, sessID := h.store.Get(r)
	errs := session.PopErrors(sess)
	h.store.Save(w, sessID, sess)

	kyc := sess.KYCBank
	if kyc.CLABE == "" && sess.Prefill.CLABE != "" {
		kyc.CLABE = sess.Prefill.CLABE
		kyc.BankName = sess.Prefill.BankName
		kyc.AccountType = sess.Prefill.AccountType
		holder := sess.Prefill.AccountHolder
		if holder == "" {
			holder = sess.KYCPersonal.FirstName + " " + sess.KYCPersonal.LastName
		}
		kyc.AccountHolder = holder
	}

	h.render(w, "kyc_step3", KYCStep3Data{
		AppID:   appID,
		Prefill: sess.Prefill,
		KYC:     kyc,
		Errors:  errs,
		Step:    StepMeta{Current: 3, Total: 5, Label: "Cuenta bancaria"},
	})
}

func (h *Handler) KYCStep3Post(w http.ResponseWriter, r *http.Request) {
	appID := r.PathValue("id")
	if err := r.ParseForm(); err != nil {
		http.Error(w, "invalid form", http.StatusBadRequest)
		return
	}

	sess, sessID := h.store.Get(r)
	errs := make(map[string]string)

	clabe := required(r, "clabe", "CLABE", errs)
	bankName := required(r, "bank_name", "Banco", errs)
	accountHolder := required(r, "account_holder", "Titular", errs)
	accountType := r.FormValue("account_type")

	if len(clabe) != 18 {
		errs["clabe"] = "CLABE debe tener 18 dígitos"
	}

	if len(errs) > 0 {
		sess.Errors = errs
		h.store.Save(w, sessID, sess)
		http.Redirect(w, r, "/full-revenue/kyc/"+appID+"/step3", http.StatusSeeOther)
		return
	}

	sess.KYCBank = session.KYCBankData{
		CLABE:         clabe,
		BankName:      bankName,
		AccountType:   accountType,
		AccountHolder: accountHolder,
	}
	h.store.Save(w, sessID, sess)
	http.Redirect(w, r, "/full-revenue/kyc/"+appID+"/step4", http.StatusSeeOther)
}

// ---- KYC Step 4: Document upload ----

func (h *Handler) KYCStep4Get(w http.ResponseWriter, r *http.Request) {
	appID := r.PathValue("id")
	sess, sessID := h.store.Get(r)
	errs := session.PopErrors(sess)
	h.store.Save(w, sessID, sess)

	h.render(w, "kyc_step4", KYCStep4Data{
		AppID:  appID,
		Errors: errs,
		Step:   StepMeta{Current: 4, Total: 5, Label: "Identificación oficial"},
	})
}

func (h *Handler) KYCStep4Post(w http.ResponseWriter, r *http.Request) {
	appID := r.PathValue("id")

	if err := r.ParseMultipartForm(16 << 20); err != nil {
		http.Error(w, "invalid form", http.StatusBadRequest)
		return
	}

	sess, sessID := h.store.Get(r)
	errs := make(map[string]string)

	// In the prototype we just record the filenames; no proxying to backend.
	frontFile, frontHeader, err := r.FormFile("ine_front")
	if err != nil {
		errs["ine_front"] = "INE frente es requerida"
	} else {
		frontFile.Close()
		sess.KYCFrontFile = frontHeader.Filename
	}

	backFile, backHeader, err := r.FormFile("ine_back")
	if err != nil {
		errs["ine_back"] = "INE reverso es requerido"
	} else {
		backFile.Close()
		sess.KYCBackFile = backHeader.Filename
	}

	if len(errs) > 0 {
		sess.Errors = errs
		h.store.Save(w, sessID, sess)
		http.Redirect(w, r, "/full-revenue/kyc/"+appID+"/step4", http.StatusSeeOther)
		return
	}

	h.store.Save(w, sessID, sess)
	http.Redirect(w, r, "/full-revenue/kyc/"+appID+"/step5", http.StatusSeeOther)
}

// ---- KYC Step 5: Contract signature ----

func (h *Handler) KYCStep5Get(w http.ResponseWriter, r *http.Request) {
	appID := r.PathValue("id")
	sess, sessID := h.store.Get(r)
	h.store.Save(w, sessID, sess)

	h.render(w, "kyc_step5", KYCStep5Data{
		AppID:     appID,
		FirstName: sess.KYCPersonal.FirstName,
		Amount:    sess.OfferAmounts.Fiscal,
		Step:      StepMeta{Current: 5, Total: 5, Label: "Firma del contrato"},
	})
}

func (h *Handler) KYCStep5Post(w http.ResponseWriter, r *http.Request) {
	appID := r.PathValue("id")
	if err := r.ParseForm(); err != nil {
		http.Error(w, "invalid form", http.StatusBadRequest)
		return
	}

	sess, sessID := h.store.Get(r)
	errs := make(map[string]string)

	signature := r.FormValue("signature")
	contractAccepted := r.FormValue("contract_accepted") == "on"

	if signature == "" {
		errs["signature"] = "Escribe tu nombre completo como firma"
	}
	if !contractAccepted {
		errs["contract_accepted"] = "Debes aceptar el contrato para continuar"
	}

	if len(errs) > 0 {
		sess.Errors = errs
		h.store.Save(w, sessID, sess)
		http.Redirect(w, r, "/full-revenue/kyc/"+appID+"/step5", http.StatusSeeOther)
		return
	}

	// Submit all accumulated KYC data to the backend.
	// Files are not sent in this prototype — we send the structured fields only.
	log.Printf("KYC complete for application %s (prototype: files not proxied)", appID)

	h.store.Save(w, sessID, sess)
	http.Redirect(w, r, "/full-revenue/kyc/"+appID+"/success", http.StatusSeeOther)
}

// ---- KYC Success ----

func (h *Handler) KYCSuccessGet(w http.ResponseWriter, r *http.Request) {
	sess, sessID := h.store.Get(r)
	h.store.Save(w, sessID, sess)

	firstName := sess.KYCPersonal.FirstName
	if firstName == "" {
		firstName = sess.Prefill.FirstName
	}

	h.render(w, "kyc_success", KYCSuccessData{
		FirstName: firstName,
		Amount:    sess.OfferAmounts.Fiscal,
		ReturnURL: sess.ReturnURL,
	})
}
