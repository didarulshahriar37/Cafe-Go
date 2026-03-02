# CafeGo: The Smart Cafeteria System 🌙☕

**CafeGo** is a high-performance, microservices-driven platform designed to revolutionize the cafeteria experience during peak demand, specifically optimized for **Iftar management**. It combines sleek, modern aesthetics with a resilient, event-driven backend to ensure every student gets their meal with precision and ease.

---

## ✨ Key Features

### 🍱 Premium Iftar Menu
Browse a curated, high-resolution menu of traditional Iftar favorites (Haleem, Tehari, Jalebi, etc.) with real-time stock availability.

### ⚡ Real-Time Order Tracking
Experience live, WebSocket-powered status updates:
- **Order Received** (5s validation)
- **In the Kitchen** (7s preparation)
- **Ready for Pickup** (Instant notification)

### 🛡️ Core Engineering (DevSprint 2026)
- **Standalone Identity Provider**: Decoupled authentication into a dedicated service for secure JWT issuance and student verification.
- **Optimistic Locking**: Implemented version-based concurrency control in the Stock Service to handle high-traffic Iftar rushes without data corruption.
- **CI/CD Pipeline**: Automated validation via GitHub Actions, running a suite of unit tests on every push to maintain system integrity.

### 🎁 Bonus Challenges
- **Advanced Rate Limiting**: The Identity Service includes a per-user rate limiter (**3 attempts/min**) to prevent brute-force "botting" of orders.
- **Visual Latency Alerts**: The Admin Dashboard features a real-time monitoring alert that triggers if Gateway latency exceeds **1,000ms**.

---

## 🔑 Test Credentials

You can use the following pre-seeded accounts to explore the system:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@iut-cafe.com` | `admin123` |
| **Student** | `didarul@iut-dhaka.edu` | `230042137` |
| **Student** | `ashfaque@iut-dhaka.edu` | `230042102` |
| **Student** | `saimon@iut-dhaka.edu` | `230042103` |
| **Student** | `shifat@iut-dhaka.edu` | `230042156` |
| **Student** | `arafat@iut-dhaka.edu` | `230042151` |
| **Student** | `ifham@iut-dhaka.edu` | `230042112` |

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React (Vite), Tailwind CSS, Framer Motion, Lucide Icons |
| **Backend** | Node.js (Express), Microservices Architecture |
| **Databases** | MongoDB (Persistent), Redis (Idempotency & Caching) |
| **Messaging** | RabbitMQ (Event-Driven Pipeline) |
| **Validation** | Jest (Unit Testing), GitHub Actions (CI/CD) |
| **Infrastructure** | Vercel (Edge Functions), Railway (Real-time Containers) |

---

## 🚀 Microservices Grid

| Service | Responsibility | Status |
| :--- | :--- | :--- |
| **Gateway** | Routing, Orchestration, Redis Caching | [Live](https://gateway-service-topaz.vercel.app) |
| **Identity** | Auth, JWT Issuance, Rate Limiting | [Live](https://identity-service-one.vercel.app) |
| **Stock** | Inventory Management, Optimistic Locking | [Live](https://stock-service-six.vercel.app) |
| **Kitchen** | Order Processing (Async) | Live |
| **Notification**| WebSockets, Real-time Updates | Live |

---

## 🧪 Testing & Validation

To ensure the system's reliability, we maintain a comprehensive test suite:
```bash
# Gateway Orchestration Tests
cd backend/gateway-service && npm test

# Stock Concurrency (Optimistic Locking) Tests
cd backend/stock-service && npm test
```

---

### Developed for the Smart Campus 🕌✨
*CafeGo—Pure Speed, Precision, and Elegance.*
