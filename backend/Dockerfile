# Tahap 1: Builder 
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
# Build binary yang standalone
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Tahap 2: Run)
FROM alpine:latest
WORKDIR /root/
# Ambil hasil build dari Tahap 1
COPY --from=builder /app/main .

EXPOSE 8080
CMD ["./main"]