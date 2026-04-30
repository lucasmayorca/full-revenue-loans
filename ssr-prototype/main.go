package main

import (
	"fmt"
	"html/template"
	"log"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/r2capital/ssr-prototype/backend"
	"github.com/r2capital/ssr-prototype/handlers"
	"github.com/r2capital/ssr-prototype/session"
)

func main() {
	cfg := loadConfig()

	bc := backend.New(cfg.BackendURL)
	store := session.NewStore()
	tmpl := parseTemplates()

	h := handlers.New(tmpl, bc, store, cfg.BackendURL)

	mux := http.NewServeMux()

	// Static files
	mux.Handle("GET /static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	// Entry point: loan offers landing page
	mux.HandleFunc("GET /offers", h.OffersGet)

	// Apply flow (PRG pattern)
	mux.HandleFunc("GET /full-revenue/apply", h.ApplyStep1Get)
	mux.HandleFunc("POST /full-revenue/apply/step1", h.ApplyStep1Post)
	mux.HandleFunc("GET /full-revenue/apply/step2", h.ApplyStep2Get)
	mux.HandleFunc("POST /full-revenue/apply/step2", h.ApplyStep2Post)
	mux.HandleFunc("GET /full-revenue/apply/offer1", h.ApplyOffer1Get)
	mux.HandleFunc("POST /full-revenue/apply/offer1", h.ApplyOffer1Post)
	mux.HandleFunc("GET /full-revenue/apply/step3", h.ApplyStep3Get)
	mux.HandleFunc("POST /full-revenue/apply/step3", h.ApplyStep3Post)
	mux.HandleFunc("GET /full-revenue/apply/offer2", h.ApplyOffer2Get)
	mux.HandleFunc("POST /full-revenue/apply/offer2", h.ApplyOffer2Post)
	mux.HandleFunc("GET /full-revenue/apply/done", h.ApplyDoneGet)

	// Facebook OAuth callback (same-window redirect from backend)
	mux.HandleFunc("GET /full-revenue/oauth/callback", h.OAuthCallbackGet)

	// Status page (polls until decision)
	mux.HandleFunc("GET /full-revenue/status/{id}", h.StatusGet)

	// KYC flow
	mux.HandleFunc("GET /full-revenue/kyc/{id}", h.KYCStep1Get)
	mux.HandleFunc("POST /full-revenue/kyc/{id}/step1", h.KYCStep1Post)
	mux.HandleFunc("GET /full-revenue/kyc/{id}/step2", h.KYCStep2Get)
	mux.HandleFunc("POST /full-revenue/kyc/{id}/step2", h.KYCStep2Post)
	mux.HandleFunc("GET /full-revenue/kyc/{id}/step3", h.KYCStep3Get)
	mux.HandleFunc("POST /full-revenue/kyc/{id}/step3", h.KYCStep3Post)
	mux.HandleFunc("GET /full-revenue/kyc/{id}/step4", h.KYCStep4Get)
	mux.HandleFunc("POST /full-revenue/kyc/{id}/step4", h.KYCStep4Post)
	mux.HandleFunc("GET /full-revenue/kyc/{id}/step5", h.KYCStep5Get)
	mux.HandleFunc("POST /full-revenue/kyc/{id}/step5", h.KYCStep5Post)
	mux.HandleFunc("GET /full-revenue/kyc/{id}/success", h.KYCSuccessGet)

	// Root redirect
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			http.Redirect(w, r, "/offers", http.StatusFound)
			return
		}
		http.NotFound(w, r)
	})

	log.Printf("SSR prototype listening on :%s  (backend: %s)", cfg.Port, cfg.BackendURL)
	log.Fatal(http.ListenAndServe(":"+cfg.Port, mux))
}

func parseTemplates() map[string]*template.Template {
	funcMap := template.FuncMap{
		"formatMXN": func(n int) string {
			if n == 0 {
				return "$0"
			}
			s := fmt.Sprintf("%d", n)
			var parts []string
			for len(s) > 3 {
				parts = append([]string{s[len(s)-3:]}, parts...)
				s = s[:len(s)-3]
			}
			parts = append([]string{s}, parts...)
			return "$" + strings.Join(parts, ",")
		},
		"pct": func(f float64) string {
			return fmt.Sprintf("%.0f%%", f*100)
		},
		"seq": func(n int) []int {
			s := make([]int, n)
			for i := range s {
				s[i] = i + 1
			}
			return s
		},
		"add": func(a, b int) int { return a + b },
		"sub": func(a, b int) int { return a - b },
		"mul": func(a, b int) int { return a * b },
		"div": func(a, b int) int {
			if b == 0 {
				return 0
			}
			return a / b
		},
	}

	pages := []string{
		"offers",
		"apply_step1", "apply_step2",
		"apply_offer1", "apply_step3", "apply_offer2", "apply_done",
		"status",
		"kyc_step1", "kyc_step2", "kyc_step3", "kyc_step4", "kyc_step5", "kyc_success",
	}

	tmpl := make(map[string]*template.Template, len(pages))
	for _, page := range pages {
		tmpl[page] = template.Must(
			template.New("layout").Funcs(funcMap).ParseFiles(
				filepath.Join("templates", "layout.html"),
				filepath.Join("templates", page+".html"),
			),
		)
	}
	return tmpl
}
