# Validate QR Ticket Sequence Diagram Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a concise, report-ready PlantUML sequence diagram for UC-13 Validate QR Ticket and export a rendered PNG when a local PlantUML runtime is available.

**Architecture:** Represent the implemented request path from Staff through the React validation page, Spring controller and service, then the ticket and check-in-log repositories. Use one nested alternative structure to distinguish invalid, successful, and concurrent/duplicate outcomes while keeping implementation-only scanner details out of the report diagram.

**Tech Stack:** PlantUML, Java/PlantUML CLI or compatible local renderer, PowerShell verification commands

## Global Constraints

- Include exactly these six participants: Staff, StaffTicketValidationPage, TicketValidationController, TicketValidationServiceImpl, TicketRepository, and CheckInLogRepository.
- Keep labels short and in English.
- Use numbered messages, activation bars, and the project's light-blue diagram style.
- Show invalid, valid, and concurrent/duplicate outcomes.
- Do not include camera initialization, QR decoding libraries, HTTP authentication internals, DTO construction, or frontend cooldown state.

---

### Task 1: Create and export the report sequence diagram

**Files:**
- Modify: `docs/diagrams/validate-qr-ticket-sequence-diagram.puml`
- Create when rendering is available: `docs/diagrams/validate-qr-ticket-sequence-diagram.png`

**Interfaces:**
- Consumes: UC-13 behavior documented in `docs/superpowers/specs/2026-07-12-validate-qr-ticket-sequence-diagram-design.md` and implemented by `TicketValidationServiceImpl.validateQr(...)`.
- Produces: A standalone PlantUML source file and a report-ready PNG with the same basename.

- [ ] **Step 1: Replace the PlantUML source with the approved concise diagram**

```plantuml
@startuml validate_qr_ticket_sequence
title Validate QR Ticket

hide footbox
autonumber
skinparam shadowing false
skinparam sequenceMessageAlign center
skinparam responseMessageBelowArrow true
skinparam ParticipantBackgroundColor #72C5E8
skinparam ParticipantBorderColor #222222
skinparam LifeLineBorderColor #222222
skinparam ActivationBackgroundColor #72C5E8
skinparam ActivationBorderColor #222222

actor Staff
boundary "StaffTicketValidationPage" as View
control "TicketValidationController" as Controller
control "TicketValidationServiceImpl" as Service
database "TicketRepository" as TicketRepo
database "CheckInLogRepository" as LogRepo

Staff -> View: Scan or enter QR ticket
activate View
View -> Controller: Submit QR code
activate Controller
Controller -> Service: validateQr(request, staff)
activate Service
Service -> TicketRepo: findByQrCodeWithBooking(qrCode)
activate TicketRepo
TicketRepo --> Service: Ticket or empty
deactivate TicketRepo

alt Invalid ticket
    Service -> LogRepo: Save or reuse failure log
    LogRepo --> Service: CheckInLog
    Service --> Controller: Validation failure
    Controller --> View: Rejected result
    View --> Staff: Deny entry and show reason
else Valid ticket
    Service -> TicketRepo: markUsedIfValid(VALID, USED)
    TicketRepo --> Service: updatedRows
    alt updatedRows = 1
        Service -> LogRepo: Save SUCCESS log
        LogRepo --> Service: CheckInLog
        Service --> Controller: SUCCESS
        Controller --> View: Validated result
        View --> Staff: Allow entry
    else Concurrent or duplicate scan
        Service -> LogRepo: Save or reuse ALREADY_USED log
        LogRepo --> Service: CheckInLog
        Service --> Controller: ALREADY_USED
        Controller --> View: Rejected result
        View --> Staff: Deny duplicate entry
    end
end

deactivate Service
deactivate Controller
deactivate View
@enduml
```

- [ ] **Step 2: Verify the source structure**

Run:

```powershell
$file = 'docs/diagrams/validate-qr-ticket-sequence-diagram.puml'
$text = Get-Content -Raw $file
@('@startuml', '@enduml', 'actor Staff', 'StaffTicketValidationPage', 'TicketValidationController', 'TicketValidationServiceImpl', 'TicketRepository', 'CheckInLogRepository', 'Invalid ticket', 'Valid ticket', 'Concurrent or duplicate scan') | ForEach-Object { if (-not $text.Contains($_)) { throw "Missing required content: $_" } }
```

Expected: command exits successfully with no missing-content error.

- [ ] **Step 3: Render and inspect the PNG**

Run when `plantuml` is available:

```powershell
plantuml -tpng 'docs/diagrams/validate-qr-ticket-sequence-diagram.puml'
```

Expected: `docs/diagrams/validate-qr-ticket-sequence-diagram.png` exists, contains six readable lifelines, and shows all three outcomes without clipped or overlapping labels. If no PlantUML runtime exists locally, retain the verified `.puml` as the deliverable and report that PNG export was unavailable.

- [ ] **Step 4: Review the final diff**

Run:

```powershell
git diff --check -- docs/diagrams/validate-qr-ticket-sequence-diagram.puml
git diff -- docs/diagrams/validate-qr-ticket-sequence-diagram.puml
```

Expected: no whitespace errors; the diff matches the approved concise design and introduces no unrelated changes.

- [ ] **Step 5: Commit the diagram artifacts**

```powershell
git add docs/diagrams/validate-qr-ticket-sequence-diagram.puml
if (Test-Path 'docs/diagrams/validate-qr-ticket-sequence-diagram.png') { git add docs/diagrams/validate-qr-ticket-sequence-diagram.png }
git commit -m "docs: add validate QR ticket sequence diagram"
```
