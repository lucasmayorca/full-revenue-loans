package main

import "os"

type Config struct {
	BackendURL string
	Port       string
}

func loadConfig() Config {
	backendURL := os.Getenv("BACKEND_URL")
	if backendURL == "" {
		backendURL = "http://localhost:3001"
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "4000"
	}
	return Config{BackendURL: backendURL, Port: port}
}
