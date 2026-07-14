# AquaShow Management System (ASMS)

## 1. Project Overview
AquaShow Management System (ASMS) is a comprehensive web application designed for a water park to efficiently manage shows, ticket bookings, and customer check-ins. 

### Key Features
- **Show Management**: Browse available shows, venues, and schedules.
- **Ticket Booking & Cart**: Select tickets for different age groups, manage cart, and proceed to checkout.
- **Payment Integration**: Secure online payment processing via PayOS.
- **Ticketing & Validation**: Generate QR code tickets post-payment and validate them at check-in counters.
- **Role-based Access Control**: Manage Users, Staff, and Admin roles securely using JWT and Google OAuth.
- **Automated Notifications**: Asynchronous email notifications via Gmail integration.

### System Architecture & Database
The project follows a Layered MVC Architecture for the backend and a component-based structure for the frontend.
- **Database**: **PostgreSQL** for persistent and relational data storage (Users, Bookings, Tickets).
- **Caching**: **Redis** for fast show/schedule caching and temporary ticket holding during checkout.
- **Message Queue**: **RabbitMQ** for handling asynchronous background tasks like post-payment ticket generation and email delivery.

---

## 2. Technologies & Project Structure

### Tech Stack
| Component | Technologies |
| --- | --- |
| **Frontend** | ReactJS, Vite, Tailwind CSS, Axios, React Router |
| **Backend** | Java 21, Spring Boot 3.x, Spring Security, JWT, Hibernate |
| **Database & Infra** | PostgreSQL, Redis, RabbitMQ, Docker Compose |
| **3rd Party Services** | PayOS API, Google OAuth, Gmail SMTP |

### Folder Structure
```text
aqua_show_management/
├── backend/          # Java Spring Boot REST API
├── frontend/         # React/Vite User Interface
├── docs/             # Project documentation, architecture, and database schemas
├── docker-compose.yml# Docker infrastructure setup
└── README.md         # Project documentation
```

---

## 3. How to Run the Project

### Prerequisites
- **Java 21** & **Maven**
- **Node.js** (LTS version)
- **Docker Desktop**
- **Git**

### Step 1: Start Infrastructure (Database, Redis, RabbitMQ)
Run the following command at the root of the project to start all required databases and message brokers:
```powershell
docker compose up -d
```

### Step 2: Configure Environment Variables
Copy the template files and fill in your actual credentials (database passwords, API keys, etc.):
- **Root**: `cp .env.example .env`
- **Frontend**: `cd frontend && cp .env.example .env.local`

### Step 3: Run the Backend
```powershell
cd backend
mvn spring-boot:run
```
*The backend API will be available at `http://localhost:8080` (Health Check: `http://localhost:8080/api/health`).*

### Step 4: Run the Frontend
```powershell
cd frontend
npm install
npm run dev
```
*The frontend UI will be available at `http://localhost:5173`.*

---

## 4. Team Members & Contributions

| Name | Main Module | Key Objectives & Contributions |
| --- | --- | --- |
| **Lê Gia Bảo** | Show, Venue, Schedule & Management | Display shows and schedules; manage shows, venues, schedules, and bookings; reporting; user and role management. |
| **Đào Minh Đức** | Identity, Profile, Cart, Booking & Ticket Holding | Registration and email verification; normal/Google login, password recovery; profile management; multi-show ticket cart; create booking, temporary ticket hold with Redis; view tickets and booking history. |
| **Phan Bùi Bá Đạt** | Payment, Ticketing & Notification | PayOS payment; callback processing and reconciliation; generate QR tickets; send/resend ticket emails; QR validation, ensure single check-in and record check-in logs. |
