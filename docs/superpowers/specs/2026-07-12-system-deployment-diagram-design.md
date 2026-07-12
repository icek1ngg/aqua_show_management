# ASMS System Deployment Diagram Design

## Goal

Create a logical production deployment diagram for AquaShow Management System (ASMS) that matches the implemented technology stack and the deployment view required by Section IV.2 of the report.

## Deployment Nodes

- Client Device containing a Web Browser used by Guest, Customer, Staff, Manager, and Administrator roles.
- Web Server hosting the `ASMS React SPA` artifact built with React and Vite.
- Application Server hosting the `ASMS Spring Boot API` artifact running on Java 21 and Spring Boot 3.3.5.
- PostgreSQL Server running PostgreSQL 16 and storing the `asms_db` relational database.
- Redis Server running Redis 7 for cache and temporary ticket holds.
- RabbitMQ Server running RabbitMQ 3 for asynchronous post-payment ticket and email processing.
- PayOS Gateway as an external payment service.
- Gmail Server as an external SMTP email service.
- Google OAuth Server as an external identity provider.

## Communication Paths

- Web Browser to Web Server over HTTPS.
- React SPA to Spring Boot API over HTTPS REST/JSON.
- Spring Boot API to PostgreSQL over JDBC/PostgreSQL protocol on port 5432.
- Spring Boot API to Redis over RESP on port 6379.
- Spring Boot API to RabbitMQ over AMQP on port 5672.
- Spring Boot API to PayOS over HTTPS for payment session creation, status lookup, and callbacks.
- Spring Boot API to Gmail over SMTP with STARTTLS on port 587.
- Spring Boot API to Google OAuth over OAuth 2.0/OpenID Connect over HTTPS.

## Presentation

- Use PlantUML deployment-diagram nodes, artifacts, databases, queues, and cloud/external-service elements.
- Use one logical Client Device instead of duplicating a browser for every user role.
- Group PostgreSQL, Redis, and RabbitMQ inside a `Data and Messaging Infrastructure` frame.
- Group PayOS, Gmail, and Google OAuth inside an `External Services` cloud.
- Use the project's light-blue color `#72C5E8` for deployed nodes and artifacts.
- Keep the layout left-to-right: Client, Web tier, Application tier, infrastructure, then external services.

## Scope Boundaries

- This is a logical production view, not the current developer-machine topology.
- Do not claim a specific cloud provider, load balancer, container orchestrator, CDN, reverse proxy, or production domain because none is defined in the codebase.
- Show only protocols and ports supported by repository configuration and documentation.

## Verification

- Confirm every configured runtime dependency is represented: PostgreSQL, Redis, RabbitMQ, PayOS, Gmail, and Google OAuth.
- Confirm frontend and backend artifacts are deployed to separate logical server nodes.
- Confirm all connections have a direction and protocol label.
- Confirm matching `@startuml` and `@enduml` directives and render when a PlantUML runtime is available.
