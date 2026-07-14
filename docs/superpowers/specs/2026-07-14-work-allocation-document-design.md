# Work Allocation Document Update Design

## Objective

Update `SWD392_Group4.docx` so the project-team section includes a work-allocation table that matches the current ASMS codebase and the document's existing 21-use-case catalogue.

## Scope

- Preserve the existing cover, table of contents, team-member table, use-case numbering, diagrams, and document styling.
- Insert a new subsection named `I.3 Work Allocation` immediately after `I.2 Project Team` and its existing member table.
- Add one four-column table with the headings `Member`, `Main Module`, `Responsible Use Cases`, and `Objectives`.
- Use the three existing member names rather than generic labels such as “Person 1”.
- Do not rewrite unrelated report content.

## Allocation

### Lê Gia Bảo

- Main module: Show, Venue, Schedule & Management.
- Use cases: UC-01, UC-02, UC-14, UC-15, UC-16, UC-17, UC-18, UC-19.
- Objectives: public show and schedule browsing; show, venue, and schedule management; manager booking management and reporting; administrator user and role management.

### Đào Minh Đức

- Main module: Identity, Profile, Cart, Booking & Ticket Holding.
- Use cases: UC-03, UC-04, UC-05, UC-06, UC-07, UC-08, UC-09, UC-11, UC-12.
- Objectives: registration, email verification, login, Google OAuth, logout, password recovery, profile management, multi-show/multi-item cart booking, Redis ticket holding, booking details and history, and viewing generated tickets.

### Phan Bùi Bá Đạt

- Main module: Payment, Ticketing & Notification.
- Use cases: UC-10, UC-13, UC-20, UC-21.
- Objectives: PayOS payment initiation, callback verification and payment reconciliation; QR ticket generation; ticket-email delivery and resend; QR validation and single-use check-in logging.

## Formatting

- Reuse the existing document's heading and table visual system.
- Keep the table readable within the current page margins, allowing natural row wrapping without fixed row heights.
- Keep the existing `I.2 Project Team` table unchanged.

## Verification

- Confirm all 21 use-case IDs are assigned exactly once across the three members.
- Confirm every allocation statement is supported by current frontend routes or backend controllers/services.
- Render the edited DOCX to page images when a compatible Word/LibreOffice renderer is available; otherwise perform structural DOCX checks and disclose the rendering limitation.

