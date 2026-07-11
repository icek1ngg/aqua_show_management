# Create Show Communication Diagram Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a code-faithful PlantUML communication diagram for the current Create Show flow.

**Architecture:** Use PlantUML class-diagram primitives to reproduce the communication-diagram style in the supplied reference. Keep the Manager as an actor, render every system participant as a stereotyped class box, and place hierarchically numbered messages on directed links.

**Tech Stack:** PlantUML text syntax, Spring Boot/React source files as verification references

## Global Constraints

- Include only the main Create Show flow; exclude JWT authentication and refresh-token handling.
- Preserve validation, title-conflict, persistence, cache-invalidation, mapping, success, and frontend-error behavior from the current code.
- Keep `Manager` as an actor and every system participant as a class-shaped element.
- Do not add a runtime or diagram-generation dependency to the application.

---

### Task 1: Create and verify the communication diagram

**Files:**
- Create: `docs/diagrams/create-show-communication-diagram.puml`
- Reference: `docs/superpowers/specs/2026-07-11-create-show-communication-diagram-design.md`

**Interfaces:**
- Consumes: Create Show calls and return values from the React and Spring Boot source files listed in the spec.
- Produces: A standalone UTF-8 PlantUML source beginning with `@startuml` and ending with `@enduml`.

- [ ] **Step 1: Create the PlantUML source**

```plantuml
@startuml create_show_communication
title <u>Create Show</u>
caption Communication Diagram - Create Show

left to right direction
hide empty fields
hide empty methods
skinparam shadowing false
skinparam linetype ortho
skinparam classAttributeIconSize 0
skinparam ArrowColor #263238
skinparam ArrowFontColor #17202A
skinparam ArrowFontSize 11
skinparam classBorderColor #263238
skinparam classBackgroundColor #7EC8E3
skinparam classFontColor #17202A
skinparam classBackgroundColor<<database>> #F4E6A2
skinparam classBackgroundColor<<cache>> #F4E6A2
skinparam classBackgroundColor<<entity>> #B8E0D2
skinparam actorStyle awesome

actor Manager

class ":ManageShowsPage" as UI <<view>>
class ":managerShowService" as FrontendService <<service>>
class ":apiClient" as ApiClient <<client>>
class ":BeanValidation" as Validator <<validator>>
class ":ManagerShowController" as Controller <<controller>>
class ":ShowService" as Service <<service>>
class ":ShowRepository" as Repository <<repository>>
class ":Show" as ShowEntity <<entity>>
class ":PostgreSQL" as Database <<database>>
class ":CatalogCacheService" as CacheService <<service>>
class ":Redis" as Redis <<cache>>
class ":CatalogMapper" as Mapper <<mapper>>
class ":GlobalExceptionHandler" as ExceptionHandler <<handler>>

Manager -[hidden]right-> UI
UI -[hidden]right-> FrontendService
FrontendService -[hidden]right-> ApiClient
ApiClient -[hidden]right-> Validator
Validator -[hidden]right-> Controller
Controller -[hidden]right-> Service
Repository -[hidden]down-> Database
Service -[hidden]down-> ShowEntity
ShowEntity -[hidden]right-> CacheService
CacheService -[hidden]right-> Redis
Controller -[hidden]down-> Mapper
Mapper -[hidden]right-> ExceptionHandler

Manager -right-> UI : 1: submitCreateShow()
UI -down-> UI : 2: preventDefault(); initializeState();\n2.1: buildPayload()
UI -right-> FrontendService : 3: createShow(payload)
FrontendService -right-> ApiClient : 4: post("/manager/shows", payload)
ApiClient -right-> Validator : 5: POST /api/manager/shows\nCreateShowRequest
Validator -down-> Validator : 6: validateRequest()

Validator -down-> ExceptionHandler : 6.1 [invalid]:\nMethodArgumentNotValidException
ExceptionHandler -left-> ApiClient : 6.2 [invalid]: HTTP 400\nvalidationFailure(errors)
Validator -right-> Controller : 7 [valid]: createShow(request)

Controller -right-> Service : 8: createShow(request)
Service -down-> Service : 9: trimTitle();\n9.1: requireUniqueTitle(title, null)
Service -left-> Repository : 9.2: existsByTitleIgnoreCase(title)
Repository -down-> Database : 9.2.1: SELECT title existence
Database -up-> Repository : 9.2.2: exists
Repository -right-> Service : 9.3: exists

Service -down-> ExceptionHandler : 9.4 [title exists]:\nConflictException
ExceptionHandler -left-> ApiClient : 9.5 [title exists]: HTTP 409\nfailure(message)
Service -down-> ExceptionHandler : 9.6 [unexpected error]: Exception
ExceptionHandler -left-> ApiClient : 9.7 [unexpected error]: HTTP 500\nfailure("Internal server error")

Service -down-> ShowEntity : 10 [title unique]: <<create>>\nnew Show(title, description, imageUrl, duration)
ShowEntity -up-> Service : 10.1: show(id, status=ACTIVE)
Service -left-> Repository : 11: save(show)
Repository -down-> Database : 11.1: INSERT shows
Database -up-> Repository : 11.2: savedRow
Repository -right-> Service : 11.3: savedShow

Service -down-> CacheService : 12: invalidateShowCache(savedShow.id)
CacheService -right-> Redis : 12.1: delete("show:list") + wildcard variants\n12.2: delete("show:detail:{id}") + wildcard variants\n12.3: delete("schedule:show:{id}") + wildcard variants
Redis -left-> CacheService : 12.4: delete results
CacheService -down-> CacheService : 12.5 [RuntimeException]: catch and ignore
CacheService -up-> Service : 12.6: invalidationComplete

Service -left-> Mapper : 13: toShowManagement(savedShow)
Mapper -right-> Service : 13.1: ShowManagementResponse
Service -left-> Controller : 14: ShowManagementResponse
Controller -left-> ApiClient : 14.1: HTTP 200 ApiResponse.success\n("Show created successfully", data)
ApiClient -left-> FrontendService : 14.2: AxiosResponse
FrontendService -down-> FrontendService : 14.3: unwrap(response)
FrontendService -left-> UI : 14.4: ShowManagementResponse
UI -down-> UI : 15: setSuccessMessage(); closeForm();\n15.1: increment reloadKey; setIsSaving(false)
UI -left-> Manager : 16: displaySuccessAndRefreshedResult()

ApiClient -left-> FrontendService : 17 [HTTP/API error]: rejectedPromise
FrontendService -left-> UI : 17.1: error
UI -down-> UI : 17.2: mapValidationErrors();\n17.3: setFormError(); setIsSaving(false)
UI -left-> Manager : 17.4: displayError()

legend bottom left
  Message guards correspond to alternative paths in the code.
  Cache RuntimeException is ignored, so PostgreSQL success still returns success.
endlegend
@enduml
```

- [ ] **Step 2: Run structural validation**

Run:

```powershell
$file = 'docs/diagrams/create-show-communication-diagram.puml'
$text = Get-Content -Raw $file
if (-not $text.StartsWith('@startuml')) { throw 'Missing @startuml' }
if (-not $text.TrimEnd().EndsWith('@enduml')) { throw 'Missing @enduml' }
$required = 'ManageShowsPage','managerShowService','apiClient','BeanValidation','ManagerShowController','ShowService','ShowRepository','Show','PostgreSQL','CatalogCacheService','Redis','CatalogMapper','GlobalExceptionHandler'
$missing = $required | Where-Object { $text -notmatch [regex]::Escape($_) }
if ($missing) { throw "Missing participants: $($missing -join ', ')" }
'PASS: PlantUML structure and required participants'
```

Expected: `PASS: PlantUML structure and required participants`

- [ ] **Step 3: Compare message coverage with the implementation**

Run:

```powershell
$file = 'docs/diagrams/create-show-communication-diagram.puml'
$text = Get-Content -Raw $file
$requiredMessages = 'createShow(payload)','post("/manager/shows", payload)','validateRequest()','existsByTitleIgnoreCase(title)','save(show)','invalidateShowCache(savedShow.id)','toShowManagement(savedShow)','unwrap(response)','displayError()'
$missing = $requiredMessages | Where-Object { -not $text.Contains($_) }
if ($missing) { throw "Missing messages: $($missing -join ', ')" }
if ($text -match 'refreshAccessToken|JwtAuthenticationFilter') { throw 'Authentication details are out of scope' }
'PASS: Required flow messages present; authentication excluded'
```

Expected: `PASS: Required flow messages present; authentication excluded`

- [ ] **Step 4: Review the diff and commit**

Run:

```powershell
git diff --check
git diff -- docs/diagrams/create-show-communication-diagram.puml
git add docs/diagrams/create-show-communication-diagram.puml docs/superpowers/plans/2026-07-12-create-show-communication-diagram.md
git commit -m "docs: add create show communication diagram"
```

Expected: no whitespace errors, followed by a commit containing only the plan and PlantUML source.
