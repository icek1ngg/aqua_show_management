# Architecture

## Chosen Architecture
ASMS uses Layered MVC Architecture.

```text
React Frontend
    -> REST API
Spring Boot Backend
    -> Controller -> Service -> Repository -> Entity -> PostgreSQL
```

## System Components
- React Web Application: UI, routing, forms, API calls
- Spring Boot Backend: REST API and business logic
- PostgreSQL: main relational database
- Redis: cache and temporary ticket holding
- RabbitMQ: asynchronous post-payment ticket/email processing
- PayOS: payment gateway
- Gmail: email delivery
- Google OAuth: Google authentication

## Backend Layer Responsibilities
| Layer | Responsibility |
|---|---|
| Controller | Receive HTTP request, call Service, return response |
| Service | Business logic, validation, transactions |
| Repository | Database access through Spring Data JPA |
| Entity | Database table mapping |
| DTO | API request and response models |
| Integration Client | External service communication |

## Design Patterns
| Pattern | Usage |
|---|---|
| MVC Pattern | Controller, Service, Repository separation |
| Service Layer Pattern | Business rules in Service classes |
| Repository Pattern | Spring Data JPA repositories |
| DTO Pattern | Request/response data transfer |
| Publisher-Consumer Pattern | RabbitMQ post-payment processing |
| Adapter/Client Pattern | PayOS, Gmail, Google OAuth clients |
| Global Exception Handler | Centralized API error handling |

## Package Structure
```text
com.asms
├── core
├── identity
├── catalog
├── booking
├── payment
├── ticketing
├── notification
├── reporting
├── async
└── integration
```
