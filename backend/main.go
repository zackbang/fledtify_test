package main

import (
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/golang-jwt/jwt/v5"
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

type User struct {
	ID       uint   `gorm:"primaryKey"`
	Username string `gorm:"uniqueIndex;not null"`
	Password string `gorm:"not null"` 
	Role     string `gorm:"not null"`
}

type Invoice struct {
	ID              uint            `gorm:"primaryKey"`
	SenderName      string          `gorm:"not null"`
	SenderAddress   string          `gorm:"not null"`
	ReceiverName    string          `gorm:"not null"`
	ReceiverAddress string          `gorm:"not null"`
	TotalAmount     float64         `gorm:"not null"`
	Details         []InvoiceDetail `gorm:"foreignKey:InvoiceID"` 
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
	
	dsn := "host=db user=postgres password=postgres dbname=fleetify port=5432 sslmode=disable"
	var err error

	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Println("⚠️ Database belum berjalan ")
		return
	}

	log.Println("✅ Database berhasil terkoneksi!")

	// auto migrate
	DB.AutoMigrate(&User{},&Item{}, &Invoice{}, &InvoiceDetail{})

	seedItems()
	seedUsers()
}

func seedUsers() {
	var count int64
	DB.Model(&User{}).Count(&count)

	if count == 0 {
		users := []User{
			{Username: "admin", Password: "admin", Role: "Admin"},
			{Username: "kerani", Password: "kerani", Role: "Kerani"},
		}
		DB.Create(&users)
		log.Println("🌱 Seeding data users berhasil dilakukan!")
	}
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

// --- LOGIKA AUTENTIKASI (JWT) ---
var jwtSecret = []byte("rahasia-fleetify-123") // Di dunia nyata ini harus dari .env

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func loginHandler(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Input tidak valid"})
	}

	// CARI USER DI DATABASE
	var user User
	if err := DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Username tidak ditemukan"})
	}

	// CEK PASSWORD
	if user.Password != req.Password {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Password salah"})
	}

	// Buat token JWT jika sukses
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"username": user.Username,
		"role":     user.Role, // Ambil role asli dari database
		"exp":      time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal membuat token"})
	}

	return c.JSON(fiber.Map{
		"message": "Login berhasil",
		"token":   tokenString,
		"role":    user.Role,
	})
}

func getItemsHandler(c *fiber.Ctx) error {
	code := c.Query("code")
	var items []Item
	
	if err := DB.Where("LOWER(code) LIKE LOWER(?)", "%"+code+"%").Find(&items).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal mengambil data"})
	}
	
	return c.JSON(items)
}

func main() {
	app := fiber.New()
	app.Use(cors.New())
	// Inisialisasi Database
	initDatabase()

	// Endpoint Health Check
	app.Get("/api/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "OK", "message": "Backend Fleetify Berjalan!"})
	})

	log.Println("🚀 Server backend berjalan di port 8080")

	// Endpoint Health Check
	app.Get("/api/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "OK", "message": "Backend Fleetify Berjalan!"})
	})

	// Endpoint Login
	app.Post("/api/login", loginHandler)
	app.Get("/api/items", getItemsHandler)
	log.Fatal(app.Listen(":8080"))
}