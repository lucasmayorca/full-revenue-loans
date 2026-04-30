# --- Build stage ---
FROM golang:1.22-alpine AS builder
WORKDIR /app

COPY go.mod ./
RUN go mod download

COPY . .
RUN go build -o ssr-prototype .

# --- Production stage ---
FROM alpine:3.19
WORKDIR /app

COPY --from=builder /app/ssr-prototype ./ssr-prototype
COPY templates ./templates
COPY static ./static

EXPOSE 4000

CMD ["./ssr-prototype"]
