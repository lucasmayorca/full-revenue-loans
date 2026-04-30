package handlers

import (
	"html/template"
	"net/http"

	"github.com/r2capital/ssr-prototype/backend"
	"github.com/r2capital/ssr-prototype/session"
)

const (
	DemoMerchantID   = "demo_merchant_rappi"
	DefaultBaseAmount = 50_000
)

type Handler struct {
	tmpl       map[string]*template.Template
	backend    *backend.Client
	store      *session.Store
	backendURL string
}

func New(
	tmpl map[string]*template.Template,
	bc *backend.Client,
	store *session.Store,
	backendURL string,
) *Handler {
	return &Handler{tmpl: tmpl, backend: bc, store: store, backendURL: backendURL}
}

func (h *Handler) render(w http.ResponseWriter, name string, data any) {
	t, ok := h.tmpl[name]
	if !ok {
		http.Error(w, "template not found: "+name, http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := t.ExecuteTemplate(w, "layout", data); err != nil {
		http.Error(w, "render error: "+err.Error(), http.StatusInternalServerError)
	}
}

// required returns the form value and records an error if it is empty.
func required(r *http.Request, field, label string, errs map[string]string) string {
	v := r.FormValue(field)
	if v == "" {
		errs[field] = label + " es requerido"
	}
	return v
}
