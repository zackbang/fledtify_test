package main

import (
	"log"
	"strings"
	"time"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Database schemas
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
	ID              uint   `gorm:"primaryKey"`
	InvoiceNo       string `gorm:"uniqueIndex"`
	Date            time.Time
	SenderName      string
	SenderAddress   string
	ReceiverName    string
	ReceiverAddress string
	TotalAmount     float64
	CreatedBy       uint
}

type InvoiceDetail struct {
	ID        uint `gorm:"primaryKey"`
	InvoiceID uint
	ItemID    uint
	Quantity  int
	Price     float64
	Subtotal  float64
}

type InvoiceRequest struct {
	SenderName      string `json:"sender_name"`
	SenderAddress   string `json:"sender_address"`
	ReceiverName    string `json:"receiver_name"`
	ReceiverAddress string `json:"receiver_address"`
	Items           []struct {
		ItemID   uint `json:"item_id"`
		Quantity int  `json:"quantity"`
	} `json:"items"`
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

	// migrate tables
	DB.AutoMigrate(&User{}, &Item{}, &Invoice{}, &InvoiceDetail{})

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

// JWT authentication
var jwtSecret = []byte("rahasia-fleetify-123") // TODO: move to .env

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// ... (Kode Struct dan Seeders di atas biarkan saja) ...

func loginHandler(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Input tidak valid"})
	}

	var user User
	if err := DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Username tidak ditemukan"})
	}

	if user.Password != req.Password {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Password salah"})
	}

	// PERBAIKAN KRITIS: Tambahkan "id": user.ID agar tidak CRASH di middleware
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":       user.ID, 
		"username": user.Username,
		"role":     user.Role, 
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

func authRequired(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: No token provided"})
	}

	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	if err != nil || !token.Valid {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: Invalid token"})
	}

	claims := token.Claims.(jwt.MapClaims)
	// SEKARANG INI AMAN, KARENA ID SUDAH ADA DI TOKEN:
	c.Locals("user_id", uint(claims["id"].(float64))) 
	c.Locals("user_role", claims["role"].(string))

	return c.Next()
}

func createInvoiceHandler(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)

	var req InvoiceRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request payload"})
	}

	return DB.Transaction(func(tx *gorm.DB) error {
		var totalAmount float64

		for _, itemReq := range req.Items {
			var masterItem Item
			if err := tx.First(&masterItem, itemReq.ItemID).Error; err != nil {
				return err 
			}
			totalAmount += masterItem.Price * float64(itemReq.Quantity)
		}

		invoice := Invoice{
			InvoiceNo:       "INV-" + time.Now().Format("20060102150405"),
			Date:            time.Now(),
			SenderName:      req.SenderName,
			SenderAddress:   req.SenderAddress,
			ReceiverName:    req.ReceiverName,
			ReceiverAddress: req.ReceiverAddress,
			TotalAmount:     totalAmount, 
			CreatedBy:       userID,
		}

		if err := tx.Create(&invoice).Error; err != nil {
			return err 
		}

		for _, itemReq := range req.Items {
			var masterItem Item
			tx.First(&masterItem, itemReq.ItemID)

			detail := InvoiceDetail{
				InvoiceID: invoice.ID,
				ItemID:    itemReq.ItemID,
				Quantity:  itemReq.Quantity,
				Price:     masterItem.Price,
				Subtotal:  masterItem.Price * float64(itemReq.Quantity),
			}

			if err := tx.Create(&detail).Error; err != nil {
				return err 
			}
		}

		return c.JSON(fiber.Map{
			"message":    "Invoice successfully created",
			"invoice_no": invoice.InvoiceNo,
		})
	})
}

func main() {
	app := fiber.New()
	
	// PERBAIKAN CORS: Cukup taruh 1 di atas sini agar Frontend bisa tembus
	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:3000",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	initDatabase()

	app.Get("/api/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "OK", "message": "Backend Fleetify Berjalan!"})
	})

	log.Println("🚀 Server backend berjalan di port 8080")
	
	app.Post("/api/login", loginHandler)
	app.Get("/api/items", getItemsHandler)
	app.Post("/api/invoices", authRequired, createInvoiceHandler)
	
	log.Fatal(app.Listen(":8080"))
}
