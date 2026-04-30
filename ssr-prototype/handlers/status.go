package handlers

import (
	"log"
	"net/http"
)

func (h *Handler) StatusGet(w http.ResponseWriter, r *http.Request) {
	appID := r.PathValue("id")
	if appID == "" {
		http.Redirect(w, r, "/offers", http.StatusFound)
		return
	}

	sess, sessID := h.store.Get(r)
	h.store.Save(w, sessID, sess)

	app, err := h.backend.GetApplication(appID)
	if err != nil {
		log.Printf("getApplication %s: %v", appID, err)
		h.render(w, "status", StatusData{
			IsPending: true,
			ReturnURL: sess.ReturnURL,
		})
		return
	}

	// Terminal states: APPROVED, REJECTED, MANUAL_REVIEW
	isPending := app.DecisionStatus == "" || app.DecisionStatus == "PENDING"

	h.render(w, "status", StatusData{
		Application: app,
		IsPending:   isPending,
		ReturnURL:   sess.ReturnURL,
	})
}
