# Frontend Agent Instructions

## Scope
This file applies to the ASMS frontend project.

## Tech Stack
- ReactJS
- Vite
- Tailwind CSS
- JavaScript or TypeScript depending on project setup

## Structure
Use feature-based structure:

```text
src/
├── app/
├── features/
├── services/
├── store/
├── shared/
└── assets/
```

## Rules
- Use React functional components.
- Use Tailwind CSS for styling.
- Keep pages and reusable components separated.
- Put API calls in `src/services`.
- Do not hardcode API base URLs.
- Use environment variable `VITE_API_BASE_URL`.
- Keep authentication token handling centralized.
- Do not put business rules only in frontend; backend must enforce them.
- Keep components small and readable.
- Reuse shared components where possible.

## API
- Communicate with backend through REST API.
- Use DTO fields consistently with backend API responses.
- Handle loading, success, and error states clearly.

## Main Frontend Features
- Authentication and registration
- Show list and show details
- Booking creation
- Payment redirect
- My tickets and QR display
- QR ticket validation page for Staff
- Show and schedule management for Manager
- User and role management for Administrator
- Reports
