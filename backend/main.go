package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// --- SKEMA DATABASE (GORM) ---

type Item struct {
	ID    uint    `gorm:"primaryKey"`
	Code  string  `gorm:"uniqueIndex;not null"`
	Name  string  `gorm:"not null"`
	Price float64 `gorm:"not null"`
}

type Invoice struct {
	ID              uint            `gorm:"primaryKey"`
	SenderName      string          `gorm:"not null"`
	SenderAddress   string          `gorm:"not null"`
	ReceiverName    string          `gorm:"not null"`
	ReceiverAddress string          `gorm:"not null"`
	TotalAmount     float64         `gorm:"not null"`
	Details         []InvoiceDetail `gorm:"foreignKey:InvoiceID"` // Relasi One-to-Many
}

type InvoiceDetail struct {
	ID        uint    `gorm:"primaryKey"`
	InvoiceID uint    `gorm:"not null"`
	ItemID    uint    `gorm:"not null"`
	Quantity  int     `gorm:"not null"`
	Subtotal  float64 `gorm:"not null"`
}

var DB *gorm.DB

func initDatabase() {
	// DSN menggunakan hostname "db" agar terhubung dengan docker-compose nantinya
	dsn := "host=db user=postgres password=postgres dbname=fleetify port=5432 sslmode=disable"
	var err error

	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Println("⚠️ Database belum berjalan (Wajar saat ini karena docker-compose belum dinyalakan)")
		return
	}

	log.Println("✅ Database berhasil terkoneksi!")

	// Syarat Zero-Setup: Auto-Migrate tabel saat aplikasi jalan
	DB.AutoMigrate(&Item{}, &Invoice{}, &InvoiceDetail{})

	// Syarat Zero-Setup: Seeding Data otomatis jika tabel items kosong
	seedItems()
}

func seedItems() {
	var count int64
	DB.Model(&Item{}).Count(&count)

	if count == 0 {
		items := []Item{
			{Code: "B001", Name: "Ban Luar Truk Michelin", Price: 1500000},
			{Code: "O001", Name: "Oli Mesin Diesel 5L", Price: 450000},
			{Code: "K001", Name: "Kampas Rem Hino", Price: 350000},
			{Code: "F001", Name: "Filter Udara", Price: 250000},
		}
		DB.Create(&items)
		log.Println("🌱 Seeding data items berhasil dilakukan!")
	}
}

func main() {
	app := fiber.New()

	// Inisialisasi Database
	initDatabase()

	// Endpoint Health Check
	app.Get("/api/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "OK", "message": "Backend Fleetify Berjalan!"})
	})

	log.Println("🚀 Server backend berjalan di port 8080")
	log.Fatal(app.Listen(":8080"))
}