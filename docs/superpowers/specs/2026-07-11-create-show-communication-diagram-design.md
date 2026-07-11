# Create Show Communication Diagram Design

## Goal

Create a PlantUML communication diagram for the current Create Show implementation. The diagram must preserve the participants, call order, return path, validation/error branches, persistence, cache invalidation, DTO mapping, and UI result handling found in the codebase.

## Scope

- Start when a Manager submits the Create Show form.
- End when `ManageShowsPage` displays success or error state and schedules the show-list refresh.
- Exclude JWT authentication, access-token refresh, and unrelated show-management operations.
- Treat the current codebase as the source of truth because no source sequence diagram exists in the workspace.

## Visual Format

- Follow the supplied Create Booking communication-diagram style.
- Keep `Manager` as a UML actor.
- Render every system participant as a class-shaped rectangle with a stereotype and instance-style name.
- Use blue fill for application classes and pale database/cache fill for infrastructure classes.
- Put ordered message labels on links and use hierarchical numbering for nested calls.
- Use guards such as `[invalid request]`, `[title exists]`, `[valid and unique]`, and `[cache exception]` for branches.
- Add a title and the caption `Communication Diagram - Create Show`.

## Participants

1. `Manager` — actor submitting the form and receiving the result.
2. `<<view>> :ManageShowsPage` — builds the request payload and updates UI state.
3. `<<service>> :managerShowService` — sends the Create Show request and unwraps the API response.
4. `<<client>> :apiClient` — performs `POST /manager/shows`.
5. `<<controller>> :ManagerShowController` — accepts the validated request and wraps the response.
6. `<<validator>> :BeanValidation` — represents Spring validation of `CreateShowRequest` before controller method execution.
7. `<<service>> :ShowService` — enforces title uniqueness, creates the entity, persists it, invalidates cache, and maps the result.
8. `<<repository>> :ShowRepository` — performs title-existence and save operations.
9. `<<entity>> :Show` — represents construction of the new show with generated UUID and `ACTIVE` status.
10. `<<database>> :PostgreSQL` — stores and queries rows in `shows`.
11. `<<service>> :CatalogCacheService` — invalidates show-related cache entries without blocking the database write.
12. `<<cache>> :Redis` — receives delete/keys/delete-wildcard operations for the relevant keys.
13. `<<mapper>> :CatalogMapper` — maps the saved entity to `ShowManagementResponse`.
14. `<<handler>> :GlobalExceptionHandler` — maps validation, conflict, and unexpected exceptions to API failures.

## Message Flow

### Submit and request construction

1. `Manager -> ManageShowsPage: submit Create Show form`
2. `ManageShowsPage -> ManageShowsPage: preventDefault(); initialize saving/error state; build payload`
3. `ManageShowsPage -> managerShowService: createShow(payload)`
4. `managerShowService -> apiClient: post("/manager/shows", payload)`
5. `apiClient -> BeanValidation: POST /api/manager/shows + CreateShowRequest`

### Request validation

6. `BeanValidation -> BeanValidation: validate @NotBlank, @Size, @NotNull, @Min`
7. `[invalid request] BeanValidation -> GlobalExceptionHandler: MethodArgumentNotValidException`
8. `[invalid request] GlobalExceptionHandler -> apiClient: HTTP 400 validationFailure(errors)`
9. `[valid request] BeanValidation -> ManagerShowController: createShow(request)`

### Business logic and persistence

10. `ManagerShowController -> ShowService: createShow(request)`
11. `ShowService -> ShowService: trim title; requireUniqueTitle(title, null)`
12. `ShowService -> ShowRepository: existsByTitleIgnoreCase(normalizedTitle)`
13. `ShowRepository -> PostgreSQL: SELECT existence by lower(title)`
14. `PostgreSQL -> ShowRepository: exists`
15. `ShowRepository -> ShowService: exists`
16. `[title exists] ShowService -> GlobalExceptionHandler: ConflictException("Show title already exists")`
17. `[title exists] GlobalExceptionHandler -> apiClient: HTTP 409 failure(message)`
17a. `[unexpected service/repository error] ShowService -> GlobalExceptionHandler: Exception`
17b. `[unexpected service/repository error] GlobalExceptionHandler -> apiClient: HTTP 500 failure("Internal server error")`
18. `[title unique] ShowService -> Show: new Show(title, trimmed description, normalized imageUrl, durationMinutes)`
19. `Show -> ShowService: show(id, status=ACTIVE)`
20. `ShowService -> ShowRepository: save(show)`
21. `ShowRepository -> PostgreSQL: INSERT shows`
22. `PostgreSQL -> ShowRepository: saved row`
23. `ShowRepository -> ShowService: savedShow`

### Cache invalidation and mapping

24. `ShowService -> CatalogCacheService: invalidateShowCache(savedShow.id)`
25. `CatalogCacheService -> Redis: delete show:list and wildcard variants`
26. `CatalogCacheService -> Redis: delete show:detail:{id} and wildcard variants`
27. `CatalogCacheService -> Redis: delete schedule:show:{id} and wildcard variants`
28. `[cache exception] CatalogCacheService -> CatalogCacheService: catch RuntimeException and ignore`
29. `CatalogCacheService -> ShowService: invalidation complete`
30. `ShowService -> CatalogMapper: toShowManagement(savedShow)`
31. `CatalogMapper -> ShowService: ShowManagementResponse`
32. `ShowService -> ManagerShowController: ShowManagementResponse`

### Success and UI result

33. `ManagerShowController -> apiClient: HTTP 200 ApiResponse.success("Show created successfully", data)`
34. `apiClient -> managerShowService: Axios response`
35. `managerShowService -> managerShowService: unwrap(response)`
36. `managerShowService -> ManageShowsPage: ShowManagementResponse`
37. `ManageShowsPage -> ManageShowsPage: set success; close form; increment reloadKey; stop saving`
38. `ManageShowsPage -> Manager: display success and refreshed result`

### Frontend error result

39. `[HTTP/API error] apiClient -> managerShowService: rejected promise`
40. `managerShowService -> ManageShowsPage: error`
41. `ManageShowsPage -> ManageShowsPage: map field errors; set form error; stop saving`
42. `ManageShowsPage -> Manager: display validation/conflict/general error`

The final PlantUML may group return messages on the same links as calls, matching the reference image, while preserving this order and all guards.

## Verification

- Compare every participant and message against `ManageShowsPage.jsx`, `managerShowService.js`, `ManagerShowController.java`, `ShowService.java`, `ShowRepository.java`, `Show.java`, `CatalogCacheService.java`, `CatalogMapper.java`, and `GlobalExceptionHandler.java`.
- Confirm PlantUML parses successfully.
- Render the diagram and visually inspect class-shaped participants, readable message labels, link routing, title, and caption.
- Confirm no JWT/refresh-token participant or message appears.
