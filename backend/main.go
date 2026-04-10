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
	ID              uint      `gorm:"primaryKey"`
	InvoiceNo       string    `gorm:"uniqueIndex"`
	Date            time.Time
	SenderName      string
	SenderAddress   string
	ReceiverName    string
	ReceiverAddress string
	TotalAmount     float64
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

func createInvoiceHandler(c *fiber.Ctx) error {
	var req InvoiceRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Input tidak valid"})
	}

	// 1. Mulai Database Transaction (Syarat Tes)
	tx := DB.Begin()
	if tx.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal memulai transaksi"})
	}

	// 2. ZERO-TRUST: Hitung ulang total harga di Backend
	var totalAmount float64
	for _, reqItem := range req.Items {
		var item Item
		if err := tx.First(&item, reqItem.ItemID).Error; err != nil {
			tx.Rollback() // Batalkan semua jika ada barang fiktif
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Barang tidak ditemukan"})
		}
		totalAmount += item.Price * float64(reqItem.Quantity)
	}

	// 3. Simpan Header Invoice
	invoiceNo := "INV-" + time.Now().Format("20060102150405")
	invoice := Invoice{
		InvoiceNo:       invoiceNo,
		Date:            time.Now(),
		SenderName:      req.SenderName,
		SenderAddress:   req.SenderAddress,
		ReceiverName:    req.ReceiverName,
		ReceiverAddress: req.ReceiverAddress,
		TotalAmount:     totalAmount,
	}

	if err := tx.Create(&invoice).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal menyimpan invoice"})
	}

	// 4. Simpan Detail Invoice
	for _, reqItem := range req.Items {
		var item Item
		tx.First(&item, reqItem.ItemID)
		
		detail := InvoiceDetail{
			InvoiceID: invoice.ID,
			ItemID:    reqItem.ItemID,
			Quantity:  reqItem.Quantity,
			Price:     item.Price,
			Subtotal:  item.Price * float64(reqItem.Quantity),
		}
		if err := tx.Create(&detail).Error; err != nil {
			tx.Rollback()
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal menyimpan detail"})
		}
	}

	// 5. Commit (Simpan Permanen)
	tx.Commit()
	return c.JSON(fiber.Map{"message": "Invoice berhasil dibuat!", "invoice_no": invoiceNo})
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

	// Endpoint 
	app.Post("/api/login", loginHandler)
	app.Get("/api/items", getItemsHandler)
	app.Post("/api/invoices", createInvoiceHandler)
	log.Fatal(app.Listen(":8080"))
}