package handlers

import (
	"log"
	"net/http"

	"github.com/r2capital/ssr-prototype/backend"
	"github.com/r2capital/ssr-prototype/session"
)

var defaultOffers = []OfferCard{
	{Amount: 50_000, Retention: 0.20, Total: 60_000, Fee: 10_000, Monthly: 5_000, Term: 12},
	{Amount: 30_000, Retention: 0.15, Total: 36_000, Fee: 6_000, Monthly: 3_000, Term: 12},
}

func (h *Handler) OffersGet(w http.ResponseWriter, r *http.Request) {
	sess, sessID := h.store.Get(r)

	// Persist return_url from OLE on first load.
	if ru := r.URL.Query().Get("return_url"); ru != "" && sess.ReturnURL == "" {
		sess.ReturnURL = ru
	}

	var flash string

	// Load personalized prefill data from the campaign token.
	token := r.URL.Query().Get("t")
	if token != "" && !sess.HasPrefill {
		link, err := h.backend.GetPrefillLink(token)
		if err != nil {
			log.Printf("prefill token %q: %v", token, err)
			if be, ok := err.(*backend.BackendError); ok && be.StatusCode == 410 {
				flash = "Tu enlace ha expirado. Mostrando oferta estándar."
			} else {
				flash = "No pudimos cargar tu oferta personalizada. Mostrando oferta estándar."
			}
		} else {
			hydratePrefill(sess, link)
		}
	}

	// Ensure offer amounts are initialized.
	if sess.BaseAmount == 0 {
		sess.BaseAmount = DefaultBaseAmount
		sess.OfferAmounts = session.OfferAmounts{
			Base:   DefaultBaseAmount,
			Social: int(float64(DefaultBaseAmount) * 1.5),
			Fiscal: DefaultBaseAmount * 3,
		}
	}

	h.store.Save(w, sessID, sess)

	// Build RBF offer cards.
	offers := defaultOffers
	if sess.HasPrefill && len(sess.Prefill.Email) > 0 {
		// Use actual offers from the prefill link if they were stored.
		// (They are stored in defaultOffers if we have session data.)
		offers = defaultOffers // prototype: prefill link offers used for amounts only
	}

	merchantName := sess.Prefill.FirstName

	h.render(w, "offers", OffersData{
		MerchantName:  merchantName,
		FullRevAmount: sess.OfferAmounts.Fiscal,
		Offers:        offers,
		Flash:         flash,
		ReturnURL:     sess.ReturnURL,
	})
}

// hydratePrefill copies backend prefill data into the session.
func hydratePrefill(sess *session.Session, link *backend.PrefillLink) {
	sess.HasPrefill = true
	sess.BaseAmount = link.BaseAmount
	sess.OfferAmounts = session.OfferAmounts{
		Base:   link.BaseAmount,
		Social: int(float64(link.BaseAmount) * 1.5),
		Fiscal: link.BaseAmount * 3,
	}
	p := link.Prefill
	sess.Prefill = session.PrefillData{
		MerchantID:    p.MerchantID,
		FirstName:     p.FirstName,
		LastName:      p.LastName,
		Email:         p.Email,
		Phone:         p.Phone,
		TaxID:         p.TaxID,
		LegalName:     p.LegalName,
		Address:       p.Address,
		Street:        p.Street,
		Neighborhood:  p.Neighborhood,
		PostalCode:    p.PostalCode,
		City:          p.City,
		State:         p.State,
		CLABE:         p.CLABE,
		BankName:      p.BankName,
		AccountType:   p.AccountType,
		AccountHolder: p.AccountHolder,
	}
}
