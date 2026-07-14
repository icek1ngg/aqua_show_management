# Multi-Show Cart and Booking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a multi-show ticket cart, per-ticket-type schedule inventory, one multi-item Booking and one PayOS payment while removing fixed price, time, venue, and stale Redis availability displays.

**Architecture:** `ShowSchedule` owns Standard/VIP/Family capacity and a Standard base price. The browser stores untrusted cart selections, while the backend reloads schedules, prices every item, holds inventory per schedule/type in Redis, and persists one `Booking` aggregate with many `BookingItem` rows. Payment remains one-to-one with Booking and ticket generation expands every paid BookingItem.

**Tech Stack:** Java 21, Spring Boot 3.3, Spring Data JPA, PostgreSQL, Redis Lua scripts, RabbitMQ, React 18, React Router 6, Tailwind CSS, browser `localStorage`, Java/JUnit 5, Node built-in test runner.

## Global Constraints

- Follow `AGENTS.md`, `backend/AGENTS.md`, and `frontend/AGENTS.md`.
- UI copy introduced or changed by this work is English only.
- Display VND as `2.500 VND`; never display `₫`, `đ`, `$`, or comma-separated VND in touched flows.
- Standard price multiplier is `1.0`, VIP is `2.5`, and Family is `1.5`.
- A schedule's Standard, VIP, and Family capacities must sum to a positive value not exceeding venue capacity.
- Cart icon and badge appear only in visitor/user navigation, on desktop and mobile.
- Cart selections persist in `localStorage`; identifiers and quantities are untrusted until backend checkout validation.
- One selected cart checkout produces one Booking, many BookingItems, and no more than one Payment.
- RabbitMQ remains post-payment only.
- Do not add or commit Maven Wrapper files.
- Preserve legacy schedules, bookings, payments, and tickets with an idempotent PostgreSQL migration.

## File Structure

**Backend additions**

- `backend/src/main/java/com/asms/booking/enums/TicketType.java` — canonical ticket type.
- `backend/src/main/java/com/asms/booking/service/TicketPricingService.java` — multiplier and `BigDecimal` price calculation.
- `backend/src/main/java/com/asms/booking/entity/BookingItem.java` — order line and catalog snapshot.
- `backend/src/main/java/com/asms/booking/repository/BookingItemRepository.java` — item queries.
- `backend/src/main/resources/schema.sql` — idempotent compatibility migration after Hibernate schema update.
- New focused JUnit tests under `backend/src/test/java/com/asms/booking/` and `backend/src/test/java/com/asms/catalog/`.

**Frontend additions**

- `frontend/src/features/cart/cartStorage.js` — versioned persistence and pure cart reducer helpers.
- `frontend/src/features/cart/CartContext.jsx` — shared user cart state.
- `frontend/src/features/cart/CartBadge.jsx` — shared badge/link presentation.
- `frontend/src/features/cart/TicketSelector.jsx` — schedule/type/quantity selector used by `/shows`.
- `frontend/src/features/cart/CartItemCard.jsx` — one selectable cart line.
- `frontend/src/features/cart/CartOrderSummary.jsx` — selected totals and checkout action.
- Pure `.test.js` files next to cart and currency utilities, run with `node --test`.

---

### Task 1: Canonical Ticket Types, Pricing, and VND Formatting

**Files:**
- Create: `backend/src/main/java/com/asms/booking/enums/TicketType.java`
- Create: `backend/src/main/java/com/asms/booking/service/TicketPricingService.java`
- Create: `backend/src/test/java/com/asms/booking/TicketPricingServiceTest.java`
- Modify: `frontend/src/shared/utils/ticketPricing.js`
- Create: `frontend/src/shared/utils/ticketPricing.test.js`
- Modify: `frontend/package.json`

**Interfaces:**
- Produces: `TicketType.parse(String)`, `TicketPricingService.unitPrice(BigDecimal, TicketType)`, `ticketPrice(basePrice, ticketType)`, and `formatCurrency(value)`.
- Consumers: schedule API mapping, booking checkout, `/shows`, cart, payment, booking history, and Manager pages.

- [ ] **Step 1: Write failing backend pricing tests**

```java
class TicketPricingServiceTest {
    private final TicketPricingService pricing = new TicketPricingService();

    @ParameterizedTest
    @CsvSource({"STANDARD,2500,2500.00", "VIP,2500,6250.00", "FAMILY,2500,3750.00"})
    void calculatesPriceFromScheduleBasePrice(String rawType, String base, String expected) {
        assertThat(pricing.unitPrice(new BigDecimal(base), TicketType.parse(rawType)))
                .isEqualByComparingTo(expected);
    }

    @Test
    void rejectsUnknownTicketType() {
        assertThatThrownBy(() -> TicketType.parse("GOLD"))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Unknown ticket type");
    }
}
```

- [ ] **Step 2: Run the backend test and confirm it fails because the pricing types do not exist**

Run: `mvn -f backend/pom.xml -Dtest=TicketPricingServiceTest test`

Expected: compilation failure for missing `TicketType` and `TicketPricingService`.

- [ ] **Step 3: Implement the backend pricing policy**

```java
public enum TicketType {
    STANDARD("1.0"), VIP("2.5"), FAMILY("1.5");

    private final BigDecimal multiplier;

    TicketType(String multiplier) {
        this.multiplier = new BigDecimal(multiplier);
    }

    public BigDecimal multiplier() {
        return multiplier;
    }

    public static TicketType parse(String value) {
        String normalized = String.valueOf(value).trim().toUpperCase(Locale.ROOT)
                .replace(" ENTRY", "").replace(" EXPERIENCE", "").replace(" PACKAGE", "").replace(" PASS", "");
        try {
            return TicketType.valueOf(normalized);
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Unknown ticket type");
        }
    }
}

@Service
public class TicketPricingService {
    public BigDecimal unitPrice(BigDecimal standardPrice, TicketType type) {
        if (standardPrice == null || standardPrice.signum() <= 0) {
            throw new BadRequestException("Standard price must be greater than 0");
        }
        return standardPrice.multiply(type.multiplier()).setScale(2, RoundingMode.HALF_UP);
    }
}
```

- [ ] **Step 4: Write failing frontend utility tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCurrency, getTicketTypePrice } from './ticketPricing.js';

test('formats VND with periods and a VND suffix', () => {
  assert.equal(formatCurrency(1250000), '1.250.000 VND');
});

test('derives ticket prices from the schedule Standard price', () => {
  assert.equal(getTicketTypePrice(2500, 'STANDARD'), 2500);
  assert.equal(getTicketTypePrice(2500, 'VIP'), 6250);
  assert.equal(getTicketTypePrice(2500, 'FAMILY'), 3750);
});
```

- [ ] **Step 5: Replace fixed frontend prices with multipliers and deterministic formatting**

```js
const ticketTypeMultipliers = { STANDARD: 1, VIP: 2.5, FAMILY: 1.5 };

export function getTicketTypePrice(standardPrice, value) {
  const base = Number(standardPrice);
  const multiplier = ticketTypeMultipliers[normalizeTicketType(value)];
  return Number.isFinite(base) && multiplier ? base * multiplier : 0;
}

export function formatCurrency(value) {
  const amount = Math.round(Number(value) || 0);
  return `${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(amount)} VND`;
}
```

Add `"test": "node --test"` to `frontend/package.json`.

- [ ] **Step 6: Run focused and aggregate tests**

Run: `mvn -f backend/pom.xml -Dtest=TicketPricingServiceTest test`

Run: `npm --prefix frontend test`

Expected: all pricing and formatter tests pass.

- [ ] **Step 7: Commit the pricing unit**

```powershell
git add backend/src/main/java/com/asms/booking/enums/TicketType.java backend/src/main/java/com/asms/booking/service/TicketPricingService.java backend/src/test/java/com/asms/booking/TicketPricingServiceTest.java frontend/src/shared/utils/ticketPricing.js frontend/src/shared/utils/ticketPricing.test.js frontend/package.json
git commit -m "feat: derive ticket prices from schedule base price"
```

### Task 2: Per-Type Schedule Capacity and Compatibility Migration

**Files:**
- Modify: `backend/src/main/java/com/asms/catalog/entity/ShowSchedule.java`
- Modify: `backend/src/main/java/com/asms/catalog/dto/CatalogDtos.java`
- Modify: `backend/src/main/java/com/asms/catalog/service/ScheduleService.java`
- Modify: `backend/src/main/java/com/asms/catalog/service/CatalogMapper.java`
- Modify: `backend/src/main/java/com/asms/catalog/repository/ShowScheduleRepository.java`
- Modify: `backend/src/main/resources/application.yml`
- Create: `backend/src/main/resources/schema.sql`
- Create: `backend/src/test/java/com/asms/catalog/ScheduleCapacityServiceTest.java`

**Interfaces:**
- Produces: per-type capacity/available getters, `ShowSchedule.availableFor(TicketType)`, `ShowSchedule.decrementAvailable(TicketType,int)`, and manager DTO fields.
- Consumes: `TicketType` from Task 1.

- [ ] **Step 1: Write failing schedule validation tests**

```java
@Test
void createScheduleStoresPerTypeCapacityAndStandardPrice() {
    CreateScheduleRequest request = new CreateScheduleRequest(showId, venueId, start, end, 70, 20, 10, new BigDecimal("2500"));
    ScheduleManagementResponse result = service.createSchedule(request);
    assertThat(result.standardCapacity()).isEqualTo(70);
    assertThat(result.vipCapacity()).isEqualTo(20);
    assertThat(result.familyCapacity()).isEqualTo(10);
    assertThat(result.totalCapacity()).isEqualTo(100);
    assertThat(result.standardPrice()).isEqualByComparingTo("2500");
}

@Test
void rejectsCapacityTotalAboveVenueCapacity() {
    CreateScheduleRequest request = new CreateScheduleRequest(showId, venueId, start, end, 80, 20, 1, new BigDecimal("2500"));
    assertThatThrownBy(() -> service.createSchedule(request))
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Ticket capacity total cannot exceed venue capacity");
}
```

- [ ] **Step 2: Run and confirm the DTO constructor/test fails**

Run: `mvn -f backend/pom.xml -Dtest=ScheduleCapacityServiceTest test`

Expected: compilation failure because per-type fields do not exist.

- [ ] **Step 3: Change the schedule entity and DTO contract**

Use explicit fields and helpers:

```java
public int getTotalCapacity() {
    return standardCapacity + vipCapacity + familyCapacity;
}

public int availableFor(TicketType type) {
    return switch (type) {
        case STANDARD -> standardAvailableTickets;
        case VIP -> vipAvailableTickets;
        case FAMILY -> familyAvailableTickets;
    };
}

public void decrementAvailable(TicketType type, int quantity) {
    int next = availableFor(type) - quantity;
    if (next < 0) throw new ConflictException("Not enough tickets available");
    switch (type) {
        case STANDARD -> standardAvailableTickets = next;
        case VIP -> vipAvailableTickets = next;
        case FAMILY -> familyAvailableTickets = next;
    }
}
```

Manager create/update DTOs use `standardCapacity`, `vipCapacity`, `familyCapacity`, and `standardPrice`. Management responses include those fields, matching available fields, and derived `totalCapacity`/`totalAvailableTickets`.

Map newly added schedule columns as nullable for the first schema-update pass so Hibernate can add them to a populated table. Service constructors and update validation still require non-null domain values. The post-Hibernate `schema.sql` backfill below finishes by setting all seven new columns `NOT NULL`.

- [ ] **Step 4: Update schedule create/update validation**

Implement `validateTicketCapacities(venue, standard, vip, family)` with non-negative checks, positive total, venue limit, and paid-item minimum checks by type. Preserve already-sold quantities when capacities change:

```java
int soldStandard = schedule.getStandardCapacity() - schedule.getStandardAvailableTickets();
schedule.setStandardCapacity(request.standardCapacity());
schedule.setStandardAvailableTickets(request.standardCapacity() - soldStandard);
```

Repeat for VIP and Family and reject a new capacity below sold quantity.

- [ ] **Step 5: Add the idempotent PostgreSQL compatibility migration**

Set `spring.jpa.defer-datasource-initialization: true` and `spring.sql.init.mode: always`. `schema.sql` must:

```sql
ALTER TABLE show_schedules ADD COLUMN IF NOT EXISTS standard_capacity integer;
ALTER TABLE show_schedules ADD COLUMN IF NOT EXISTS vip_capacity integer;
ALTER TABLE show_schedules ADD COLUMN IF NOT EXISTS family_capacity integer;
ALTER TABLE show_schedules ADD COLUMN IF NOT EXISTS standard_available_tickets integer;
ALTER TABLE show_schedules ADD COLUMN IF NOT EXISTS vip_available_tickets integer;
ALTER TABLE show_schedules ADD COLUMN IF NOT EXISTS family_available_tickets integer;
ALTER TABLE show_schedules ADD COLUMN IF NOT EXISTS standard_price numeric(12,2);

UPDATE show_schedules SET
  standard_capacity = COALESCE(standard_capacity, capacity),
  vip_capacity = COALESCE(vip_capacity, 0),
  family_capacity = COALESCE(family_capacity, 0),
  standard_available_tickets = COALESCE(standard_available_tickets, available_tickets),
  vip_available_tickets = COALESCE(vip_available_tickets, 0),
  family_available_tickets = COALESCE(family_available_tickets, 0),
  standard_price = COALESCE(standard_price, price);

ALTER TABLE show_schedules ALTER COLUMN standard_capacity SET NOT NULL;
ALTER TABLE show_schedules ALTER COLUMN vip_capacity SET NOT NULL;
ALTER TABLE show_schedules ALTER COLUMN family_capacity SET NOT NULL;
ALTER TABLE show_schedules ALTER COLUMN standard_available_tickets SET NOT NULL;
ALTER TABLE show_schedules ALTER COLUMN vip_available_tickets SET NOT NULL;
ALTER TABLE show_schedules ALTER COLUMN family_available_tickets SET NOT NULL;
ALTER TABLE show_schedules ALTER COLUMN standard_price SET NOT NULL;
```

Keep legacy columns during this feature so the migration is reversible; new code reads only the new fields.

- [ ] **Step 6: Run schedule tests and the complete backend suite**

Run: `mvn -f backend/pom.xml -Dtest=ScheduleCapacityServiceTest test`

Run: `mvn -f backend/pom.xml test`

Expected: all tests pass; existing schedule tests are updated to the new constructor.

- [ ] **Step 7: Commit schedule inventory**

```powershell
git add backend/src/main/java/com/asms/catalog backend/src/main/resources/application.yml backend/src/main/resources/schema.sql backend/src/test/java/com/asms/catalog
git commit -m "feat: add ticket type capacity to schedules"
```

### Task 3: Accurate Redis Holds per Schedule and Ticket Type

**Files:**
- Modify: `backend/src/main/java/com/asms/booking/service/RedisTicketHoldService.java`
- Modify: `backend/src/main/java/com/asms/booking/service/impl/RedisTicketHoldServiceImpl.java`
- Modify: `backend/src/main/java/com/asms/booking/dto/TicketHoldDtos.java`
- Modify: `backend/src/test/java/com/asms/booking/RedisTicketHoldServiceTest.java`

**Interfaces:**
- Produces: `initializeInventory(scheduleId, TicketType, persistentAvailable)`, `effectiveAvailability(...)`, `holdTickets(...)`, `releaseHold(...)`.
- Consumers: public catalog mapping and multi-item booking service.

- [ ] **Step 1: Replace reflection-heavy expectations with key and expiry behavior tests**

Add tests asserting:

```java
assertThat(service.inventoryKey("schedule-1", TicketType.VIP))
        .isEqualTo("booking:inventory:schedule-1:VIP");

when(redisTemplate.execute(any(), anyList(), any(Object[].class)))
        .thenReturn(List.of("1", "hold-123", "7", "2026-07-13T15:15:00Z"));
HoldResult result = service.holdTickets("schedule-1", TicketType.VIP, 3, userId);
assertThat(result.remainingAvailable()).isEqualTo(7);
```

Add a test in which two holds have different expirations; cleanup removes only the expired hold and effective availability includes the active hold.

- [ ] **Step 2: Run the Redis test and confirm signature/key failures**

Run: `mvn -f backend/pom.xml -Dtest=RedisTicketHoldServiceTest test`

Expected: failures because keys omit ticket type and no effective availability API exists.

- [ ] **Step 3: Implement active-hold tracking with one Lua reservation script**

Use:

```text
booking:inventory:{scheduleId}:{ticketType}
booking:hold:{holdId}
booking:active-holds:{scheduleId}:{ticketType}
```

The sorted set score is expiration epoch seconds and member is hold ID. The Lua script removes expired members, reads active hold hashes to sum quantities, compares `inventory - activeHeld`, creates the hold hash with 900-second TTL, adds it to the sorted set, and returns remaining availability. `releaseHold` deletes the hash and removes its member from the correct sorted set.

- [ ] **Step 4: Implement read-side effective availability**

```java
public int effectiveAvailability(String scheduleId, TicketType type, int persistentAvailable) {
    initializeInventory(scheduleId, type, persistentAvailable);
    Long result = redisTemplate.execute(AVAILABLE_SCRIPT,
            List.of(inventoryKey(scheduleId, type), activeHoldsKey(scheduleId, type)),
            String.valueOf(Instant.now().getEpochSecond()), holdKeyPrefix());
    return Math.max(0, result == null ? 0 : result.intValue());
}
```

Redis failure remains a clear `TicketHoldServiceUnavailableException`; no silent fallback is allowed during checkout.

- [ ] **Step 5: Run focused and full backend tests**

Run: `mvn -f backend/pom.xml -Dtest=RedisTicketHoldServiceTest test`

Run: `mvn -f backend/pom.xml test`

Expected: all tests pass, including rollback and Redis-unavailable tests.

- [ ] **Step 6: Commit Redis correctness**

```powershell
git add backend/src/main/java/com/asms/booking/service backend/src/main/java/com/asms/booking/dto/TicketHoldDtos.java backend/src/test/java/com/asms/booking/RedisTicketHoldServiceTest.java
git commit -m "fix: track active ticket holds by schedule and type"
```

### Task 4: Booking-Ready Public Schedule API

**Files:**
- Modify: `backend/src/main/java/com/asms/catalog/dto/CatalogDtos.java`
- Modify: `backend/src/main/java/com/asms/catalog/service/PublicShowService.java`
- Modify: `backend/src/main/java/com/asms/catalog/service/CatalogMapper.java`
- Modify: `backend/src/main/java/com/asms/catalog/controller/PublicScheduleController.java`
- Create: `backend/src/test/java/com/asms/catalog/PublicScheduleBookingDetailsTest.java`
- Modify: `frontend/src/services/showService.js`

**Interfaces:**
- Produces: `BookingScheduleResponse getSchedule(UUID)` with show snapshot, times, venue, prices, capacities, and effective availability.
- Consumers: `/shows` selector and cart refresh.

- [ ] **Step 1: Write a failing controller/service test**

```java
@Test
void scheduleDetailsExposeDerivedPricesAndRedisAdjustedAvailability() {
    when(holds.effectiveAvailability(scheduleId.toString(), TicketType.STANDARD, 100)).thenReturn(98);
    BookingScheduleResponse response = publicShowService.getSchedule(scheduleId);
    assertThat(response.showTitle()).isEqualTo("Aqua Journey");
    assertThat(response.venueName()).isEqualTo("Main Plaza Pool");
    assertThat(response.standardPrice()).isEqualByComparingTo("2500");
    assertThat(response.vipPrice()).isEqualByComparingTo("6250");
    assertThat(response.standardAvailableTickets()).isEqualTo(98);
}
```

- [ ] **Step 2: Run and confirm the response type does not exist**

Run: `mvn -f backend/pom.xml -Dtest=PublicScheduleBookingDetailsTest test`

- [ ] **Step 3: Implement the authoritative response**

Define `BookingScheduleResponse` with schedule/show IDs, show title/description/image, status, start/end, venue, Standard base price, three derived prices, three capacities, and three effective availability values. Inject `RedisTicketHoldService` and `TicketPricingService` into `PublicShowService` and map the response transactionally while the entity relations are open.

- [ ] **Step 4: Update the frontend service contract**

Keep `getSchedule(scheduleId)` at `/schedules/{id}` and remove any expectation that query-string show name, date, venue, or price is authoritative.

- [ ] **Step 5: Run tests and commit**

Run: `mvn -f backend/pom.xml -Dtest=PublicScheduleBookingDetailsTest test`

Run: `mvn -f backend/pom.xml test`

```powershell
git add backend/src/main/java/com/asms/catalog backend/src/test/java/com/asms/catalog/PublicScheduleBookingDetailsTest.java frontend/src/services/showService.js
git commit -m "feat: expose booking ready schedule details"
```

### Task 5: Booking Aggregate, BookingItem, and Legacy Data Migration

**Files:**
- Modify: `backend/src/main/java/com/asms/booking/entity/Booking.java`
- Create: `backend/src/main/java/com/asms/booking/entity/BookingItem.java`
- Create: `backend/src/main/java/com/asms/booking/repository/BookingItemRepository.java`
- Modify: `backend/src/main/java/com/asms/booking/repository/BookingRepository.java`
- Modify: `backend/src/main/java/com/asms/booking/dto/BookingDtos.java`
- Modify: `backend/src/main/resources/schema.sql`
- Modify: `backend/src/main/java/com/asms/core/config/DevDataSeeder.java`
- Create: `backend/src/test/java/com/asms/booking/BookingAggregateTest.java`

**Interfaces:**
- Produces: `Booking.addItem(BookingItem)`, `Booking.items()`, aggregate `totalQuantity`, `totalAmount`, and `BookingItemResponse`.
- Consumers: booking service, payment, ticket generation, history, detail, Manager search.

- [ ] **Step 1: Write failing aggregate tests**

```java
@Test
void bookingOwnsMultipleItemsAndRecalculatesTotals() {
    Booking booking = Booking.create(user, "AQB20260713ABC123", expiresAt);
    booking.addItem(BookingItem.create(booking, standardSchedule, TicketType.STANDARD, 2, new BigDecimal("2500"), "hold-1"));
    booking.addItem(BookingItem.create(booking, vipSchedule, TicketType.VIP, 1, new BigDecimal("6250"), "hold-2"));
    assertThat(booking.getTotalQuantity()).isEqualTo(3);
    assertThat(booking.getTotalAmount()).isEqualByComparingTo("11250.00");
    assertThat(booking.getItems()).hasSize(2);
}
```

- [ ] **Step 2: Run and confirm `BookingItem` is missing**

Run: `mvn -f backend/pom.xml -Dtest=BookingAggregateTest test`

- [ ] **Step 3: Refactor Booking and add BookingItem**

`Booking` keeps order-level fields and owns:

```java
@OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
private List<BookingItem> items = new ArrayList<>();

public void addItem(BookingItem item) {
    items.add(item);
    item.attachTo(this);
    totalQuantity = items.stream().mapToInt(BookingItem::getQuantity).sum();
    totalAmount = items.stream().map(BookingItem::getLineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
}
```

`BookingItem` stores schedule/show IDs, ticket type enum, quantity, unit/line price, hold ID, title/image, LocalDateTime start/end, and venue snapshot. Remove single-item fields from the Java Booking model.

- [ ] **Step 4: Replace single-item DTOs with item lists**

```java
public record CreateBookingItemRequest(
        @NotBlank String scheduleId,
        @NotBlank String ticketType,
        @NotNull @Min(1) @Max(10) Integer quantity) {}

public record CreateBookingRequest(
        @NotBlank String idempotencyKey,
        @NotEmpty @Size(max = 20) List<@Valid CreateBookingItemRequest> items) {}

public record BookingItemResponse(
        UUID id, String showId, String scheduleId, String showName, String imageUrl,
        LocalDateTime startTime, LocalDateTime endTime, String venueName,
        TicketType ticketType, Integer quantity, BigDecimal unitPrice, BigDecimal lineTotal) {}
```

Booking responses contain `items`, `totalQuantity`, and `totalAmount`.

- [ ] **Step 5: Extend the idempotent migration**

`schema.sql` creates/backfills one `booking_items` row for every legacy Booking without items, using legacy Booking columns and referenced schedule/show/venue data where present. Use the deterministic expression `md5(b.id::text || ':legacy')::uuid` for migrated item IDs so the script needs no PostgreSQL UUID extension. It drops `NOT NULL` from legacy single-item columns so new aggregate bookings can be inserted, but does not drop legacy data. Add a unique idempotency key column/index to `bookings`.

- [ ] **Step 6: Update seed data and repository queries**

Replace `countPaidTicketsByScheduleId` with item queries grouped by `scheduleId` and `ticketType`. Manager search joins items when filtering show/schedule and uses `distinct` Booking results.

- [ ] **Step 7: Run aggregate and full backend tests**

Run: `mvn -f backend/pom.xml -Dtest=BookingAggregateTest test`

Run: `mvn -f backend/pom.xml test`

- [ ] **Step 8: Commit the aggregate model**

```powershell
git add backend/src/main/java/com/asms/booking backend/src/main/java/com/asms/core/config/DevDataSeeder.java backend/src/main/resources/schema.sql backend/src/test/java/com/asms/booking/BookingAggregateTest.java
git commit -m "refactor: model booking as a multi item order"
```

### Task 6: Transactional Multi-Item Booking Checkout

**Files:**
- Modify: `backend/src/main/java/com/asms/booking/service/impl/BookingServiceImpl.java`
- Modify: `backend/src/main/java/com/asms/booking/service/BookingService.java`
- Modify: `backend/src/main/java/com/asms/booking/controller/BookingController.java`
- Modify: `backend/src/test/java/com/asms/booking/BookingServiceControllerTest.java`
- Modify: `backend/src/test/java/com/asms/booking/CreateBookingSynchronousArchitectureTest.java`

**Interfaces:**
- Consumes: pricing, per-type schedule inventory, Redis holds, Booking aggregate.
- Produces: idempotent `createBooking(CreateBookingRequest,String)` returning one normalized aggregate response.

- [ ] **Step 1: Add failing happy-path and compensation tests**

```java
@Test
void createsOneBookingWithItemsFromDifferentSchedules() {
    CreateBookingResponse response = service.createBooking(request("request-1",
            item(scheduleA, "STANDARD", 2), item(scheduleB, "VIP", 1)), userEmail);
    assertThat(response.items()).hasSize(2);
    assertThat(response.totalQuantity()).isEqualTo(3);
    assertThat(response.totalAmount()).isEqualByComparingTo("11250.00");
    verify(bookingRepository).save(argThat(booking -> booking.getItems().size() == 2));
}

@Test
void releasesEarlierHoldsWhenLaterItemCannotBeHeld() {
    when(holds.holdTickets(scheduleAId, TicketType.STANDARD, 2, userId)).thenReturn(success("hold-a"));
    when(holds.holdTickets(scheduleBId, TicketType.VIP, 1, userId)).thenReturn(failure());
    assertThatThrownBy(() -> service.createBooking(request, userEmail)).isInstanceOf(ConflictException.class);
    verify(holds).releaseHold("hold-a");
    verify(bookingRepository, never()).save(any());
}
```

Also test duplicate item normalization, inactive schedule, changed price source, Redis unavailable, database failure, repeated idempotency key, and maximum 20 lines.

- [ ] **Step 2: Run focused tests and confirm old single-item logic fails**

Run: `mvn -f backend/pom.xml -Dtest=BookingServiceControllerTest test`

- [ ] **Step 3: Implement deterministic validation and hold acquisition**

Normalize items into a `LinkedHashMap<scheduleId + ':' + type, quantity>`, sort by schedule ID/type for deterministic acquisition, load every schedule, calculate server prices, and acquire one hold per normalized item. Register rollback compensation and explicitly release acquired holds on persistence failure.

Use `bookingRepository.findByUserAndIdempotencyKey` to return the original response on safe client retry.

- [ ] **Step 4: Map aggregate responses and expiration behavior**

All detail/history/hold lookup paths map item lists. Pending expiration loops through item hold IDs and releases them before returning `EXPIRED`. Remove `findByHoldId` at Booking level; if retained for payment compatibility, resolve it through `BookingItemRepository`.

- [ ] **Step 5: Run backend tests**

Run: `mvn -f backend/pom.xml -Dtest=BookingServiceControllerTest,CreateBookingSynchronousArchitectureTest test`

Run: `mvn -f backend/pom.xml test`

- [ ] **Step 6: Commit checkout service**

```powershell
git add backend/src/main/java/com/asms/booking backend/src/test/java/com/asms/booking
git commit -m "feat: create multi item bookings atomically"
```

### Task 7: One Payment, Inventory Commit, and Tickets per BookingItem

**Files:**
- Modify: `backend/src/main/java/com/asms/payment/service/impl/PaymentServiceImpl.java`
- Modify: `backend/src/main/java/com/asms/ticketing/entity/Ticket.java`
- Modify: `backend/src/main/java/com/asms/ticketing/service/impl/TicketGenerationServiceImpl.java`
- Modify: `backend/src/main/java/com/asms/ticketing/repository/TicketRepository.java`
- Modify: `backend/src/main/java/com/asms/catalog/repository/ShowScheduleRepository.java`
- Modify: `backend/src/main/resources/schema.sql`
- Modify: `backend/src/test/java/com/asms/payment/PaymentServiceImplTest.java`
- Create: `backend/src/test/java/com/asms/ticketing/MultiItemTicketGenerationTest.java`

**Interfaces:**
- Consumes: Booking items and their hold IDs.
- Produces: one payment for aggregate total, per-item inventory decrement, and tickets carrying BookingItem snapshots.

- [ ] **Step 1: Write failing payment idempotency and ticket tests**

Test a paid Booking with 2 Standard items and 1 VIP item across schedules. Assert three tickets are generated, each references the correct item/schedule/type, both schedule inventories are decremented once, both holds are released, and a repeated success callback performs none of those writes again.

- [ ] **Step 2: Run focused tests and confirm single-item assumptions fail**

Run: `mvn -f backend/pom.xml -Dtest=PaymentServiceImplTest,MultiItemTicketGenerationTest test`

- [ ] **Step 3: Add pessimistic schedule locking and item inventory commit**

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("select s from ShowSchedule s where s.id in :ids order by s.id")
List<ShowSchedule> findAllByIdForUpdate(@Param("ids") Collection<UUID> ids);
```

On the first transition to payment success, lock all affected schedules, validate all item holds, decrement the appropriate type count, mark Booking paid, release all holds after the database change is secured, generate tickets, and publish one payment-completed message after commit.

- [ ] **Step 4: Generate tickets from BookingItems**

`Ticket` gains an optional `bookingItem` relation for migrated legacy tickets. New tickets are constructed with `(Booking booking, BookingItem item, String qrCode)`. Generation loops each item quantity; QR indexes include item ID and item-local index so retries remain discoverable through `existsByBooking_Id`.

- [ ] **Step 5: Run payment/ticket tests and full suite**

Run: `mvn -f backend/pom.xml -Dtest=PaymentServiceImplTest,MultiItemTicketGenerationTest test`

Run: `mvn -f backend/pom.xml test`

- [ ] **Step 6: Commit payment integration**

```powershell
git add backend/src/main/java/com/asms/payment backend/src/main/java/com/asms/ticketing backend/src/main/java/com/asms/catalog/repository/ShowScheduleRepository.java backend/src/main/resources/schema.sql backend/src/test/java/com/asms/payment backend/src/test/java/com/asms/ticketing
git commit -m "feat: pay and issue tickets for multi item bookings"
```

### Task 8: Shared Cart State and User Navbar Badge

**Files:**
- Create: `frontend/src/features/cart/cartStorage.js`
- Create: `frontend/src/features/cart/cartStorage.test.js`
- Create: `frontend/src/features/cart/CartContext.jsx`
- Create: `frontend/src/features/cart/CartBadge.jsx`
- Modify: `frontend/src/main.jsx`
- Modify: `frontend/src/shared/components/navigation/Navbar.jsx`

**Interfaces:**
- Produces: `useCart()` with `items`, `totalQuantity`, `addItem`, `updateQuantity`, `removeItem`, `removeItems`, and `clearCart`.
- Consumers: Navbar, `/shows` selector, and cart page.

- [ ] **Step 1: Write failing pure cart tests**

```js
test('merges the same schedule and ticket type', () => {
  const result = addCartItem([], { scheduleId: 's1', ticketType: 'VIP', quantity: 2 }, 10);
  const merged = addCartItem(result, { scheduleId: 's1', ticketType: 'VIP', quantity: 3 }, 10);
  assert.deepEqual(merged, [{ scheduleId: 's1', ticketType: 'VIP', quantity: 5 }]);
});

test('keeps different types and schedules as separate lines', () => {
  const result = [
    { scheduleId: 's1', ticketType: 'STANDARD', quantity: 2 },
    { scheduleId: 's1', ticketType: 'VIP', quantity: 1 },
    { scheduleId: 's2', ticketType: 'STANDARD', quantity: 3 },
  ];
  assert.equal(cartTotalQuantity(result), 6);
});
```

Test malformed JSON, storage version mismatch, quantity clamp, remove selected keys, and snapshot preservation.

- [ ] **Step 2: Run and confirm helpers are missing**

Run: `npm --prefix frontend test`

- [ ] **Step 3: Implement versioned storage and CartContext**

Use storage key `aquapulse.cart.v1`, key function `${scheduleId}:${normalizeTicketType(ticketType)}`, immutable reducer helpers, and a `storage` event listener so multiple tabs synchronize. Wrap `RouterProvider` with `CartProvider` inside `AuthProvider`.

- [ ] **Step 4: Add the shared Navbar badge**

`CartBadge` renders a link to `/bookings/create`, a cart icon, and total ticket badge. Use it in desktop and mobile user actions. Hide it when `hasRole(user, 'STAFF')`; Manager/Admin layouts remain unchanged because they do not use the public Navbar.

- [ ] **Step 5: Run tests and build**

Run: `npm --prefix frontend test`

Run: `npm --prefix frontend run build`

- [ ] **Step 6: Commit cart state**

```powershell
git add frontend/src/features/cart frontend/src/main.jsx frontend/src/shared/components/navigation/Navbar.jsx
git commit -m "feat: add persistent user cart and navbar badge"
```

### Task 9: Manager Schedule Form for Standard, VIP, and Family Inventory

**Files:**
- Modify: `frontend/src/stitch-react/ManageSchedulesPage.jsx`
- Modify: `frontend/src/services/scheduleService.js`
- Modify: `frontend/src/shared/utils/ticketPricing.js`
- Create: `frontend/src/features/manager/scheduleForm.js`
- Create: `frontend/src/features/manager/scheduleForm.test.js`

**Interfaces:**
- Consumes: new Manager schedule DTO from Task 2.
- Produces: per-type capacity form and table display.

- [ ] **Step 1: Add pure form-validation tests to `frontend/src/features/manager/scheduleForm.test.js`**

Test that `70 + 20 + 10` is valid for venue capacity 100, `80 + 20 + 1` is invalid, negative values are invalid, and Standard price must be positive.

- [ ] **Step 2: Run tests and confirm the validation helper is missing**

Run: `npm --prefix frontend test`

- [ ] **Step 3: Replace generic capacity/price fields**

The Create/Edit modal uses four inputs named `standardCapacity`, `vipCapacity`, `familyCapacity`, and `standardPrice`. Show a live `Total Capacity: X / Y` line and disable submit when invalid. Payloads send only the new contract.

The table displays `Standard A/C`, `VIP A/C`, `Family A/C`, total availability, and Standard base price formatted as `2.500 VND`. Update stat cards to sum effective per-type availability.

- [ ] **Step 4: Run frontend tests/build and backend contract tests**

Run: `npm --prefix frontend test`

Run: `npm --prefix frontend run build`

Run: `mvn -f backend/pom.xml -Dtest=ScheduleCapacityServiceTest test`

- [ ] **Step 5: Commit Manager UI**

```powershell
git add frontend/src/stitch-react/ManageSchedulesPage.jsx frontend/src/services/scheduleService.js frontend/src/shared/utils frontend/src/features/manager/scheduleForm.js frontend/src/features/manager/scheduleForm.test.js
git commit -m "feat: manage schedule inventory by ticket type"
```

### Task 10: Select Tickets on `/shows`

**Files:**
- Create: `frontend/src/features/cart/TicketSelector.jsx`
- Create: `frontend/src/features/cart/ticketSelectorState.js`
- Create: `frontend/src/features/cart/ticketSelectorState.test.js`
- Modify: `frontend/src/features/home/HomePage.jsx`
- Modify: `frontend/src/stitch-react/ShowDetailPage.jsx`
- Modify: `frontend/src/shared/components/navigation/TicketSearchDrawer.jsx`
- Modify: `frontend/src/services/bookingService.js`

**Interfaces:**
- Consumes: `getSchedule`, `useCart`, pricing/formatting helpers.
- Produces: add-to-cart flow without navigating directly to checkout.

- [ ] **Step 1: Extract and test selector state as pure helpers**

Test schedule switch resets quantities, zero availability disables a type, a quantity cannot exceed `min(10, effectiveAvailability)`, and an added item contains only trusted IDs/quantity plus display snapshots.

- [ ] **Step 2: Run tests and confirm selector helpers fail**

Run: `npm --prefix frontend test`

- [ ] **Step 3: Implement `TicketSelector`**

Props are `show`, `schedules`, and `onClose`. It renders active schedule choice, three type rows with `formatCurrency`, availability, quantity controls, and `Add to Cart`. On success it calls `addItem`, shows `Added to cart`, and leaves the user on `/shows`.

- [ ] **Step 4: Integrate all public booking entry points**

Replace HomePage hero/search/card links that build `/bookings/create?...` URLs with scroll/open-selector behavior. Show Detail reuses `TicketSelector` or adds the selected schedule/type directly through `useCart`. TicketSearchDrawer navigates to `/shows` and opens selection rather than creating a fixed booking URL. Remove `buildBookingUrl` once no callers remain.

- [ ] **Step 5: Run tests/build**

Run: `npm --prefix frontend test`

Run: `npm --prefix frontend run build`

- [ ] **Step 6: Commit show selection**

```powershell
git add frontend/src/features/cart/TicketSelector.jsx frontend/src/features/cart/ticketSelectorState.js frontend/src/features/cart/ticketSelectorState.test.js frontend/src/features/home/HomePage.jsx frontend/src/stitch-react/ShowDetailPage.jsx frontend/src/shared/components/navigation/TicketSearchDrawer.jsx frontend/src/services/bookingService.js
git commit -m "feat: select show tickets into the cart"
```

### Task 11: Cart-Style Create Booking Page

**Files:**
- Rewrite: `frontend/src/features/booking/CreateBookingPage.jsx`
- Create: `frontend/src/features/cart/CartItemCard.jsx`
- Create: `frontend/src/features/cart/CartOrderSummary.jsx`
- Create: `frontend/src/features/cart/cartCheckout.js`
- Create: `frontend/src/features/cart/cartCheckout.test.js`
- Modify: `frontend/src/services/bookingService.js`
- Modify: `frontend/src/app/router.jsx`

**Interfaces:**
- Consumes: `useCart`, authoritative schedule API, multi-item create Booking API.
- Produces: selected subset checkout and navigation to `/bookings/{id}/payment`.

- [ ] **Step 1: Write failing selection/checkout payload tests**

```js
test('checkout includes only checked and valid cart lines', () => {
  const payload = buildCheckoutPayload(lines, new Set(['s1:STANDARD', 's2:VIP']), 'request-123');
  assert.deepEqual(payload, {
    idempotencyKey: 'request-123',
    items: [
      { scheduleId: 's1', ticketType: 'STANDARD', quantity: 2 },
      { scheduleId: 's2', ticketType: 'VIP', quantity: 1 },
    ],
  });
});
```

Test selected totals, stale price review flag, unavailable line exclusion, and selected-key removal after success.

- [ ] **Step 2: Run tests and confirm checkout helpers are missing**

Run: `npm --prefix frontend test`

- [ ] **Step 3: Implement the cart page using the attached HTML as visual direction**

Reuse `MainLayout`; do not duplicate Navbar/Footer. Render `01 Cart` and `02 Payment`. `CartItemCard` includes checkbox, image, show/schedule snapshots, type, editable quantity, line total, show detail, and remove. `CartOrderSummary` displays selected lines/tickets, combined total, validation notices, and `Continue to Payment`.

On load, fetch every unique schedule ID and replace display snapshots with authoritative response values. Mark missing/inactive/sold-out lines unavailable. Mark changed price/availability for review before enabling checkout.

- [ ] **Step 4: Submit one aggregate Booking**

Generate one `crypto.randomUUID()` idempotency key per submit attempt, call `createBooking({ idempotencyKey, items })`, disable duplicate submission, remove only selected cart keys on success, and navigate to `/bookings/${bookingId}/payment`. For 401, preserve cart and route to login with return location. For 409, refresh affected schedules and show latest availability.

Move `/bookings/create` outside the immediate `ProtectedRoute` so an unauthenticated user can view their cart; require login only when they press Continue.

- [ ] **Step 5: Run frontend tests/build**

Run: `npm --prefix frontend test`

Run: `npm --prefix frontend run build`

- [ ] **Step 6: Commit cart checkout UI**

```powershell
git add frontend/src/features/booking/CreateBookingPage.jsx frontend/src/features/cart frontend/src/services/bookingService.js frontend/src/app/router.jsx
git commit -m "feat: turn create booking into a selectable cart"
```

### Task 12: Multi-Item History, Payment, Manager Views, and Full Verification

**Files:**
- Modify: `frontend/src/features/booking/BookingDetailPage.jsx`
- Modify: `frontend/src/features/booking/BookingHistoryPage.jsx`
- Modify: `frontend/src/features/payment/PaymentPage.jsx`
- Modify: `frontend/src/features/payment/PaymentResultPage.jsx`
- Modify: `frontend/src/stitch-react/ManageBookingsPage.jsx`
- Modify: `frontend/src/features/ticketing/MyTicketsPage.jsx`
- Modify: `backend/src/main/java/com/asms/booking/service/ManagerBookingService.java`
- Modify: `backend/src/test/java/com/asms/booking/BookingServiceControllerTest.java`
- Create: `backend/src/test/java/com/asms/booking/ManagerBookingServiceTest.java`
- Modify: `docs/API_SPEC.md`
- Modify: `docs/BUSINESS_RULES.md`
- Modify: `docs/DATABASE_SCHEMA.md`

**Interfaces:**
- Consumes: aggregate Booking responses.
- Produces: coherent multi-item user/manager/payment presentation and final documentation.

- [ ] **Step 1: Add mapper tests for multi-item history and Manager detail**

Assert item count, total quantity, combined total, item snapshots, payment status, ticket summary, and Manager schedule/show filtering through BookingItems.

- [ ] **Step 2: Run tests and confirm single-item DTO assumptions fail**

Run: `mvn -f backend/pom.xml -Dtest=BookingServiceControllerTest test`

- [ ] **Step 3: Update user and Manager pages**

History cards summarize the first item plus `+N more shows`; detail renders all item rows. Payment page lists all selected shows/types and one combined total. Manager booking detail lists every item. My Tickets groups generated tickets by BookingItem. All touched currency calls use the shared `formatCurrency` and display `2.500 VND` style.

- [ ] **Step 4: Update project documentation**

Document the create Booking request/response item arrays, schedule inventory fields, pricing multipliers, Redis key isolation, one Booking-to-Payment rule, BookingItem schema, and cart/checkout lifecycle.

- [ ] **Step 5: Run fresh automated verification**

Run: `mvn -f backend/pom.xml test`

Expected: exit 0 with zero failures/errors.

Run: `npm --prefix frontend test`

Expected: all Node tests pass.

Run: `npm --prefix frontend run build`

Expected: Vite production build exits 0.

- [ ] **Step 6: Run database migration verification against Docker PostgreSQL**

Start the backend against the existing database, then verify legacy rows have BookingItems and existing schedules migrated to Standard inventory. Re-run startup and verify row counts do not increase, proving idempotency.

- [ ] **Step 7: Run the browser E2E acceptance flow**

1. Manager creates Show A and Show B schedules with separate Standard/VIP/Family inventories and Standard prices.
2. User opens `/shows`, adds Standard from Show A and VIP from Show B.
3. Navbar badge is identical on `/shows`, show detail, profile, and booking history; no badge appears in Manager/Staff/Admin layouts.
4. Cart survives refresh, checkbox selection changes summary, delete removes one line, and unselected lines remain after checkout.
5. Continue creates one `PENDING_PAYMENT` Booking with two BookingItems and one combined total.
6. Redis effective availability decreases only for held schedule/type pairs and returns after expiration or explicit release.
7. Payment page shows all items and combined amount; stop before external PayOS payment.

- [ ] **Step 8: Inspect final repository state**

Run: `git status --short`

Run: `git diff --check`

Expected: no whitespace errors and only intentional changes. Confirm no Maven Wrapper files are staged.

- [ ] **Step 9: Commit downstream views and documentation**

```powershell
git add frontend/src/features/booking frontend/src/features/payment frontend/src/features/ticketing frontend/src/stitch-react/ManageBookingsPage.jsx backend/src/main/java/com/asms/booking/service/ManagerBookingService.java backend/src/test/java/com/asms/booking docs/API_SPEC.md docs/BUSINESS_RULES.md docs/DATABASE_SCHEMA.md
git commit -m "feat: present multi item bookings across the application"
```
