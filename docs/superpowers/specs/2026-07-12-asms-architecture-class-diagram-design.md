# ASMS Architecture Class Diagram Design

## Goal

Create a high-level class diagram for the ASMS system architecture at the same abstraction level as the supplied reference diagram.

## Scope

The diagram contains four client classes:

- `Guest / Customer` with stereotypes `UserInteraction`, `Client`, and `WebBrowser`.
- `Staff` with stereotypes `UserInteraction`, `Client`, and `WebBrowser`.
- `Manager` with stereotypes `UserInteraction`, `Client`, and `WebBrowser`.
- `Administrator` with stereotypes `UserInteraction`, `Client`, and `WebBrowser`.

The diagram contains one `ASMS System` software-system boundary with:

- `ASMS Web Application`, representing the single React SPA shared by all roles.
- `ASMS Backend`, representing the Spring Boot REST API and business logic.

The diagram contains one external `PostgreSQL Database` class with the `DataBaseServer` stereotype.

## Relationships and Multiplicities

- Each client class has multiplicity `0..*` and connects to exactly `1` ASMS Web Application.
- The ASMS System contains exactly `1` ASMS Web Application and exactly `1` ASMS Backend.
- The ASMS Web Application communicates with exactly `1` ASMS Backend.
- The ASMS Backend communicates with exactly `1` PostgreSQL Database.

## Presentation

- Match the reference diagram's high-level class-box style rather than a detailed domain or package class diagram.
- Use the light-blue project color `#72C5E8`, black borders, and left-to-right layout.
- Display stereotype text inside each class box.
- Show the ASMS Web Application and ASMS Backend inside the larger ASMS System boundary.
- Do not show attributes, operations, individual controllers, services, repositories, Redis, RabbitMQ, PayOS, Gmail, or Google OAuth.

## Verification

- Confirm that the diagram represents the single React SPA found in the router instead of inventing separate customer/admin websites.
- Confirm all four application roles are represented.
- Confirm multiplicities match the approved high-level design.
- Confirm the PlantUML source has matching `@startuml` and `@enduml` directives.
