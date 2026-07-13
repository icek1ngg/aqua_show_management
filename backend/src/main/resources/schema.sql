BEGIN^^^

SELECT pg_advisory_xact_lock(
  hashtextextended('2026_07_14_schedule_capacity_v3', 0)
)^^^

SELECT pg_advisory_xact_lock(
  hashtextextended('2026_07_14_booking_aggregate_v1', 0)
)^^^

SELECT pg_advisory_xact_lock(
  hashtextextended('2026_07_14_ticket_booking_item_v1', 0)
)^^^

CREATE TABLE IF NOT EXISTS asms_schema_migrations (
  version varchar(100) PRIMARY KEY,
  applied_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
)^^^

DO $asms_migration$
DECLARE
  schedule_row record;
  paid_standard bigint;
  paid_vip bigint;
  paid_family bigint;
  paid_unknown_count bigint;
  paid_nonpositive_count bigint;
  paid_orphan_count bigint;
  legacy_sold bigint;
BEGIN
  -- The pre-JPA pass handles upgrades. On a fresh database it leaves the version
  -- unapplied so the conditional post-Hibernate initializer can run this once.
  IF to_regclass('show_schedules') IS NULL OR EXISTS (
    SELECT 1 FROM asms_schema_migrations
    WHERE version = '2026_07_14_schedule_capacity_v3'
  ) THEN
    RETURN;
  END IF;

  -- Reject legacy paid bookings with broken schedule references before either
  -- marking or reconciling the Task 2 migration. The column guard keeps this
  -- safe for a fresh aggregate schema where the legacy column no longer exists.
  IF to_regclass('bookings') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM pg_attribute
       WHERE attrelid = 'bookings'::regclass
         AND attname = 'schedule_id'
         AND NOT attisdropped
     ) THEN
    SELECT COUNT(*)
    INTO paid_orphan_count
    FROM bookings booking
    WHERE booking.status = 'PAID'
      AND NOT EXISTS (
        SELECT 1 FROM show_schedules schedule
        WHERE schedule.id::text = booking.schedule_id
      );

    IF paid_orphan_count > 0 THEN
      RAISE EXCEPTION
        'Paid booking schedule not found during migration: % orphan booking(s)',
        paid_orphan_count;
    END IF;
  END IF;

  -- On a fresh Task 5 schema Hibernate has already created the aggregate tables
  -- and removed the legacy booking columns used by the Task 2 reconciliation.
  IF to_regclass('booking_items') IS NOT NULL
     AND to_regclass('bookings') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_attribute
       WHERE attrelid = 'bookings'::regclass
         AND attname = 'schedule_id'
         AND NOT attisdropped
     ) THEN
    INSERT INTO asms_schema_migrations(version)
    VALUES ('2026_07_14_schedule_capacity_v3')
    ON CONFLICT (version) DO NOTHING;
    RETURN;
  END IF;

  ALTER TABLE show_schedules ADD COLUMN IF NOT EXISTS standard_capacity integer;
  ALTER TABLE show_schedules ADD COLUMN IF NOT EXISTS vip_capacity integer;
  ALTER TABLE show_schedules ADD COLUMN IF NOT EXISTS family_capacity integer;
  ALTER TABLE show_schedules ADD COLUMN IF NOT EXISTS standard_available_tickets integer;
  ALTER TABLE show_schedules ADD COLUMN IF NOT EXISTS vip_available_tickets integer;
  ALTER TABLE show_schedules ADD COLUMN IF NOT EXISTS family_available_tickets integer;
  ALTER TABLE show_schedules ADD COLUMN IF NOT EXISTS standard_price numeric(12,2);

  IF to_regclass('bookings') IS NOT NULL THEN
    SELECT COUNT(*) FILTER (WHERE quantity <= 0)
    INTO paid_nonpositive_count
    FROM bookings;

    IF paid_nonpositive_count > 0 THEN
      RAISE EXCEPTION 'Schedule capacity migration rejects booking quantity <= 0';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'bookings_quantity_positive'
        AND conrelid = 'bookings'::regclass
    ) THEN
      ALTER TABLE bookings
        ADD CONSTRAINT bookings_quantity_positive CHECK (quantity > 0);
    END IF;
  END IF;

  FOR schedule_row IN SELECT * FROM show_schedules ORDER BY id FOR UPDATE LOOP
    paid_standard := 0;
    paid_vip := 0;
    paid_family := 0;
    paid_unknown_count := 0;

    IF to_regclass('bookings') IS NOT NULL THEN
      SELECT
        COALESCE(SUM(quantity) FILTER (
          WHERE quantity > 0 AND UPPER(TRIM(ticket_type)) LIKE 'STANDARD%'
        ), 0),
        COALESCE(SUM(quantity) FILTER (
          WHERE quantity > 0 AND UPPER(TRIM(ticket_type)) LIKE 'VIP%'
        ), 0),
        COALESCE(SUM(quantity) FILTER (
          WHERE quantity > 0 AND UPPER(TRIM(ticket_type)) LIKE 'FAMILY%'
        ), 0),
        COUNT(*) FILTER (
          WHERE COALESCE(UPPER(TRIM(ticket_type)), '') NOT LIKE 'STANDARD%'
            AND COALESCE(UPPER(TRIM(ticket_type)), '') NOT LIKE 'VIP%'
            AND COALESCE(UPPER(TRIM(ticket_type)), '') NOT LIKE 'FAMILY%'
        )
      INTO paid_standard, paid_vip, paid_family, paid_unknown_count
      FROM bookings
      WHERE schedule_id = schedule_row.id::text
        AND status = 'PAID';
    END IF;

    IF paid_unknown_count > 0 THEN
      RAISE EXCEPTION
        'Schedule capacity migration cannot classify paid ticket types for schedule %',
        schedule_row.id;
    END IF;

    IF schedule_row.capacity < 0
       OR schedule_row.available_tickets < 0
       OR schedule_row.available_tickets > schedule_row.capacity THEN
      RAISE EXCEPTION
        'Schedule capacity migration cannot preserve legacy totals for schedule %: capacity %, available %',
        schedule_row.id, schedule_row.capacity, schedule_row.available_tickets;
    END IF;

    legacy_sold := schedule_row.capacity - schedule_row.available_tickets;
    IF paid_standard + paid_vip + paid_family > legacy_sold THEN
      RAISE EXCEPTION
        'Schedule capacity migration cannot preserve legacy totals for schedule %: paid quantity % exceeds legacy sold quantity %',
        schedule_row.id, paid_standard + paid_vip + paid_family, legacy_sold;
    END IF;

    IF schedule_row.standard_capacity IS NULL
       OR schedule_row.vip_capacity IS NULL
       OR schedule_row.family_capacity IS NULL
       OR schedule_row.standard_available_tickets IS NULL
       OR schedule_row.vip_available_tickets IS NULL
       OR schedule_row.family_available_tickets IS NULL
       OR schedule_row.standard_price IS NULL
       OR schedule_row.standard_capacity - schedule_row.standard_available_tickets < paid_standard
       OR schedule_row.vip_capacity - schedule_row.vip_available_tickets < paid_vip
       OR schedule_row.family_capacity - schedule_row.family_available_tickets < paid_family THEN
      UPDATE show_schedules SET
        standard_capacity = capacity - paid_vip - paid_family,
        vip_capacity = paid_vip,
        family_capacity = paid_family,
        standard_available_tickets = available_tickets,
        vip_available_tickets = 0,
        family_available_tickets = 0,
        standard_price = COALESCE(standard_price, price)
      WHERE id = schedule_row.id;
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1 FROM show_schedules
    WHERE standard_capacity + vip_capacity + family_capacity <> capacity
       OR standard_available_tickets + vip_available_tickets + family_available_tickets <> available_tickets
       OR standard_available_tickets < 0
       OR vip_available_tickets < 0
       OR family_available_tickets < 0
       OR standard_available_tickets > standard_capacity
       OR vip_available_tickets > vip_capacity
       OR family_available_tickets > family_capacity
  ) THEN
    RAISE EXCEPTION 'Schedule capacity migration cannot preserve legacy totals';
  END IF;

  ALTER TABLE show_schedules ALTER COLUMN standard_capacity SET NOT NULL;
  ALTER TABLE show_schedules ALTER COLUMN vip_capacity SET NOT NULL;
  ALTER TABLE show_schedules ALTER COLUMN family_capacity SET NOT NULL;
  ALTER TABLE show_schedules ALTER COLUMN standard_available_tickets SET NOT NULL;
  ALTER TABLE show_schedules ALTER COLUMN vip_available_tickets SET NOT NULL;
  ALTER TABLE show_schedules ALTER COLUMN family_available_tickets SET NOT NULL;
  ALTER TABLE show_schedules ALTER COLUMN standard_price SET NOT NULL;
END
$asms_migration$^^^

DO $asms_function_install$
BEGIN
  IF to_regclass('show_schedules') IS NULL
     OR to_regclass('bookings') IS NULL
     OR EXISTS (
       SELECT 1 FROM asms_schema_migrations
       WHERE version = '2026_07_14_schedule_capacity_v3'
     ) THEN
    RETURN;
  END IF;

  EXECUTE $create_function$
    CREATE OR REPLACE FUNCTION asms_lock_and_sync_paid_schedule_inventory()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $asms_trigger_function$
    DECLARE
      old_schedule_id text;
      new_schedule_id text;
      old_ticket_type text;
      new_ticket_type text;
      matched_schedule_count integer;
      changed_rows integer;
    BEGIN
      old_schedule_id := CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.schedule_id END;
      new_schedule_id := CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE NEW.schedule_id END;

      PERFORM 1
      FROM show_schedules
      WHERE id::text IN (old_schedule_id, new_schedule_id)
      ORDER BY id
      FOR UPDATE;

      IF TG_OP <> 'INSERT' AND OLD.status = 'PAID' THEN
        IF OLD.quantity <= 0 THEN
          RAISE EXCEPTION 'Booking quantity must be greater than 0';
        END IF;

        SELECT COUNT(*) INTO matched_schedule_count
        FROM show_schedules WHERE id::text = old_schedule_id;
        IF matched_schedule_count <> 1 THEN
          RAISE EXCEPTION 'Paid booking schedule not found: %', old_schedule_id;
        END IF;

        old_ticket_type := CASE
          WHEN UPPER(TRIM(OLD.ticket_type)) LIKE 'STANDARD%' THEN 'STANDARD'
          WHEN UPPER(TRIM(OLD.ticket_type)) LIKE 'VIP%' THEN 'VIP'
          WHEN UPPER(TRIM(OLD.ticket_type)) LIKE 'FAMILY%' THEN 'FAMILY'
          ELSE NULL
        END;
        IF old_ticket_type IS NULL THEN
          RAISE EXCEPTION 'Unknown paid ticket type %', OLD.ticket_type;
        END IF;

        UPDATE show_schedules SET
          standard_available_tickets = standard_available_tickets
            + CASE WHEN old_ticket_type = 'STANDARD' THEN OLD.quantity ELSE 0 END,
          vip_available_tickets = vip_available_tickets
            + CASE WHEN old_ticket_type = 'VIP' THEN OLD.quantity ELSE 0 END,
          family_available_tickets = family_available_tickets
            + CASE WHEN old_ticket_type = 'FAMILY' THEN OLD.quantity ELSE 0 END,
          available_tickets = available_tickets + OLD.quantity
        WHERE id::text = old_schedule_id
          AND available_tickets + OLD.quantity <= capacity
          AND standard_available_tickets + CASE WHEN old_ticket_type = 'STANDARD' THEN OLD.quantity ELSE 0 END <= standard_capacity
          AND vip_available_tickets + CASE WHEN old_ticket_type = 'VIP' THEN OLD.quantity ELSE 0 END <= vip_capacity
          AND family_available_tickets + CASE WHEN old_ticket_type = 'FAMILY' THEN OLD.quantity ELSE 0 END <= family_capacity;

        GET DIAGNOSTICS changed_rows = ROW_COUNT;
        IF changed_rows = 0 THEN
          RAISE EXCEPTION 'Cannot release inconsistent paid inventory for schedule %', old_schedule_id;
        END IF;
      END IF;

      IF TG_OP <> 'DELETE' AND NEW.status = 'PAID' THEN
        IF NEW.quantity <= 0 THEN
          RAISE EXCEPTION 'Booking quantity must be greater than 0';
        END IF;

        SELECT COUNT(*) INTO matched_schedule_count
        FROM show_schedules WHERE id::text = new_schedule_id;
        IF matched_schedule_count <> 1 THEN
          RAISE EXCEPTION 'Paid booking schedule not found: %', new_schedule_id;
        END IF;

        new_ticket_type := CASE
          WHEN UPPER(TRIM(NEW.ticket_type)) LIKE 'STANDARD%' THEN 'STANDARD'
          WHEN UPPER(TRIM(NEW.ticket_type)) LIKE 'VIP%' THEN 'VIP'
          WHEN UPPER(TRIM(NEW.ticket_type)) LIKE 'FAMILY%' THEN 'FAMILY'
          ELSE NULL
        END;
        IF new_ticket_type IS NULL THEN
          RAISE EXCEPTION 'Unknown paid ticket type %', NEW.ticket_type;
        END IF;

        UPDATE show_schedules SET
          standard_available_tickets = standard_available_tickets
            - CASE WHEN new_ticket_type = 'STANDARD' THEN NEW.quantity ELSE 0 END,
          vip_available_tickets = vip_available_tickets
            - CASE WHEN new_ticket_type = 'VIP' THEN NEW.quantity ELSE 0 END,
          family_available_tickets = family_available_tickets
            - CASE WHEN new_ticket_type = 'FAMILY' THEN NEW.quantity ELSE 0 END,
          available_tickets = available_tickets - NEW.quantity
        WHERE id::text = new_schedule_id
          AND available_tickets >= NEW.quantity
          AND standard_available_tickets >= CASE WHEN new_ticket_type = 'STANDARD' THEN NEW.quantity ELSE 0 END
          AND vip_available_tickets >= CASE WHEN new_ticket_type = 'VIP' THEN NEW.quantity ELSE 0 END
          AND family_available_tickets >= CASE WHEN new_ticket_type = 'FAMILY' THEN NEW.quantity ELSE 0 END;

        GET DIAGNOSTICS changed_rows = ROW_COUNT;
        IF changed_rows = 0 THEN
          RAISE EXCEPTION 'Not enough tickets available for paid booking on schedule %', new_schedule_id;
        END IF;
      END IF;

      RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
    END
    $asms_trigger_function$
  $create_function$;
END
$asms_function_install$^^^

DO $asms_trigger_install$
BEGIN
  IF to_regclass('show_schedules') IS NULL
     OR to_regclass('bookings') IS NULL
     OR EXISTS (
       SELECT 1 FROM asms_schema_migrations
       WHERE version = '2026_07_14_schedule_capacity_v3'
     ) THEN
    RETURN;
  END IF;

  DROP TRIGGER IF EXISTS asms_sync_paid_schedule_inventory ON bookings;
  EXECUTE $create_trigger$
    CREATE TRIGGER asms_sync_paid_schedule_inventory
    BEFORE INSERT OR UPDATE OF status, quantity, ticket_type, schedule_id OR DELETE
    ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION asms_lock_and_sync_paid_schedule_inventory()
  $create_trigger$;

  INSERT INTO asms_schema_migrations(version)
  VALUES ('2026_07_14_schedule_capacity_v3');
END
$asms_trigger_install$^^^

DO $asms_booking_aggregate_migration$
DECLARE
  legacy_column text;
  legacy_item_column_count integer;
BEGIN
  IF to_regclass('bookings') IS NULL OR EXISTS (
    SELECT 1 FROM asms_schema_migrations
    WHERE version = '2026_07_14_booking_aggregate_v1'
  ) THEN
    RETURN;
  END IF;

  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS idempotency_key varchar(100);
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_quantity integer;
  UPDATE bookings
  SET idempotency_key = 'legacy:' || id::text
  WHERE idempotency_key IS NULL OR BTRIM(idempotency_key) = '';
  CREATE UNIQUE INDEX IF NOT EXISTS bookings_idempotency_key_uq
    ON bookings (idempotency_key);
  ALTER TABLE bookings ALTER COLUMN idempotency_key SET NOT NULL;

  CREATE TABLE IF NOT EXISTS booking_items (
    id uuid PRIMARY KEY,
    booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    show_id varchar(100) NOT NULL,
    schedule_id varchar(100) NOT NULL,
    ticket_type varchar(30) NOT NULL CHECK (ticket_type IN ('STANDARD', 'VIP', 'FAMILY')),
    quantity integer NOT NULL CHECK (quantity > 0),
    unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
    line_total numeric(12,2) NOT NULL CHECK (line_total >= 0),
    hold_id varchar(100) NOT NULL UNIQUE,
    show_name varchar(255) NOT NULL,
    image_url varchar(500),
    start_time timestamp NOT NULL,
    end_time timestamp NOT NULL,
    venue_name varchar(255) NOT NULL
  );
  CREATE INDEX IF NOT EXISTS booking_items_booking_id_idx ON booking_items (booking_id);
  CREATE INDEX IF NOT EXISTS booking_items_schedule_type_idx
    ON booking_items (schedule_id, ticket_type);
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'booking_items_ticket_type_valid'
      AND conrelid = 'booking_items'::regclass
  ) THEN
    ALTER TABLE booking_items
      ADD CONSTRAINT booking_items_ticket_type_valid
      CHECK (ticket_type IN ('STANDARD', 'VIP', 'FAMILY'));
  END IF;

  SELECT COUNT(*)
  INTO legacy_item_column_count
  FROM information_schema.columns
  WHERE table_schema = current_schema()
    AND table_name = 'bookings'
    AND column_name IN (
      'show_id', 'schedule_id', 'show_name', 'show_date',
      'ticket_type', 'quantity', 'unit_price', 'hold_id'
    );

  IF legacy_item_column_count NOT IN (0, 8) THEN
    RAISE EXCEPTION
      'Booking aggregate migration found a partial legacy booking schema (% of 8 item columns)',
      legacy_item_column_count;
  END IF;

  IF to_regclass('show_schedules') IS NOT NULL
     AND to_regclass('shows') IS NOT NULL
     AND to_regclass('venues') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM information_schema.columns required
       WHERE required.table_schema = current_schema()
         AND required.table_name = 'bookings'
         AND required.column_name IN (
           'show_id', 'schedule_id', 'show_name', 'show_date',
           'ticket_type', 'quantity', 'unit_price', 'total_amount', 'hold_id'
         )
       HAVING COUNT(*) <> 9
     ) THEN
    INSERT INTO booking_items (
      id, booking_id, show_id, schedule_id, ticket_type, quantity,
      unit_price, line_total, hold_id, show_name, image_url,
      start_time, end_time, venue_name
    )
    SELECT
      md5(b.id::text || ':legacy')::uuid,
      b.id,
      COALESCE(sh.id::text, b.show_id),
      b.schedule_id,
      CASE
        WHEN UPPER(TRIM(b.ticket_type)) LIKE 'STANDARD%' THEN 'STANDARD'
        WHEN UPPER(TRIM(b.ticket_type)) LIKE 'VIP%' THEN 'VIP'
        WHEN UPPER(TRIM(b.ticket_type)) LIKE 'FAMILY%' THEN 'FAMILY'
        ELSE UPPER(TRIM(b.ticket_type))
      END,
      b.quantity,
      b.unit_price,
      COALESCE(b.total_amount, b.unit_price * b.quantity),
      b.hold_id,
      COALESCE(sh.title, b.show_name, 'Legacy show'),
      sh.image_url,
      COALESCE(s.start_time, b.show_date::timestamp, CURRENT_TIMESTAMP),
      COALESCE(s.end_time, s.start_time, b.show_date::timestamp, CURRENT_TIMESTAMP),
      COALESCE(v.name, 'Legacy venue')
    FROM bookings b
    LEFT JOIN show_schedules s ON s.id::text = b.schedule_id
    LEFT JOIN shows sh ON sh.id = s.show_id
    LEFT JOIN venues v ON v.id = s.venue_id
    WHERE NOT EXISTS (
      SELECT 1 FROM booking_items existing WHERE existing.booking_id = b.id
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  UPDATE bookings b
  SET total_quantity = totals.total_quantity,
      total_amount = totals.total_amount
  FROM (
    SELECT booking_id,
           SUM(quantity)::integer AS total_quantity,
           SUM(line_total) AS total_amount
    FROM booking_items
    GROUP BY booking_id
  ) totals
  WHERE totals.booking_id = b.id;
  UPDATE bookings SET total_quantity = 0 WHERE total_quantity IS NULL;
  ALTER TABLE bookings ALTER COLUMN total_quantity SET NOT NULL;

  FOREACH legacy_column IN ARRAY ARRAY[
    'hold_id', 'show_id', 'schedule_id', 'show_name', 'show_date',
    'ticket_type', 'quantity', 'unit_price'
  ] LOOP
    IF EXISTS (
      SELECT 1 FROM pg_attribute
      WHERE attrelid = 'bookings'::regclass
        AND attname = legacy_column
        AND NOT attisdropped
    ) THEN
      EXECUTE format('ALTER TABLE bookings ALTER COLUMN %I DROP NOT NULL', legacy_column);
    END IF;
  END LOOP;
END
$asms_booking_aggregate_migration$^^^

DO $asms_booking_aggregate_functions$
BEGIN
  IF to_regclass('bookings') IS NULL
     OR to_regclass('booking_items') IS NULL
     OR to_regclass('show_schedules') IS NULL
     OR EXISTS (
       SELECT 1 FROM asms_schema_migrations
       WHERE version = '2026_07_14_booking_aggregate_v1'
     ) THEN
    RETURN;
  END IF;

  EXECUTE $create_adjustment_function$
    CREATE OR REPLACE FUNCTION asms_adjust_schedule_inventory(
      item_schedule_id text,
      item_ticket_type text,
      quantity_delta integer
    )
    RETURNS void
    LANGUAGE plpgsql
    AS $adjustment_function$
    DECLARE
      normalized_ticket_type text;
      changed_rows integer;
    BEGIN
      IF quantity_delta = 0 THEN
        RETURN;
      END IF;
      normalized_ticket_type := UPPER(TRIM(item_ticket_type));
      IF normalized_ticket_type NOT IN ('STANDARD', 'VIP', 'FAMILY') THEN
        RAISE EXCEPTION 'Unknown paid ticket type %', item_ticket_type;
      END IF;

      PERFORM 1 FROM show_schedules
      WHERE id::text = item_schedule_id
      FOR UPDATE;

      UPDATE show_schedules SET
        standard_available_tickets = standard_available_tickets
          - CASE WHEN normalized_ticket_type = 'STANDARD' THEN quantity_delta ELSE 0 END,
        vip_available_tickets = vip_available_tickets
          - CASE WHEN normalized_ticket_type = 'VIP' THEN quantity_delta ELSE 0 END,
        family_available_tickets = family_available_tickets
          - CASE WHEN normalized_ticket_type = 'FAMILY' THEN quantity_delta ELSE 0 END,
        available_tickets = available_tickets - quantity_delta
      WHERE id::text = item_schedule_id
        AND available_tickets - quantity_delta BETWEEN 0 AND capacity
        AND standard_available_tickets
          - CASE WHEN normalized_ticket_type = 'STANDARD' THEN quantity_delta ELSE 0 END
          BETWEEN 0 AND standard_capacity
        AND vip_available_tickets
          - CASE WHEN normalized_ticket_type = 'VIP' THEN quantity_delta ELSE 0 END
          BETWEEN 0 AND vip_capacity
        AND family_available_tickets
          - CASE WHEN normalized_ticket_type = 'FAMILY' THEN quantity_delta ELSE 0 END
          BETWEEN 0 AND family_capacity;

      GET DIAGNOSTICS changed_rows = ROW_COUNT;
      IF changed_rows = 0 THEN
        RAISE EXCEPTION 'Cannot adjust paid inventory for schedule %', item_schedule_id;
      END IF;
    END
    $adjustment_function$
  $create_adjustment_function$;

  EXECUTE $create_booking_function$
    CREATE OR REPLACE FUNCTION asms_sync_paid_booking_inventory()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $booking_inventory_function$
    DECLARE
      item_row record;
    BEGIN
      IF OLD.status = 'PAID' AND NEW.status <> 'PAID' THEN
        FOR item_row IN
          SELECT schedule_id, ticket_type, quantity
          FROM booking_items WHERE booking_id = OLD.id
          ORDER BY schedule_id, id
        LOOP
          PERFORM asms_adjust_schedule_inventory(
            item_row.schedule_id, item_row.ticket_type, -item_row.quantity
          );
        END LOOP;
      ELSIF OLD.status <> 'PAID' AND NEW.status = 'PAID' THEN
        FOR item_row IN
          SELECT schedule_id, ticket_type, quantity
          FROM booking_items WHERE booking_id = NEW.id
          ORDER BY schedule_id, id
        LOOP
          PERFORM asms_adjust_schedule_inventory(
            item_row.schedule_id, item_row.ticket_type, item_row.quantity
          );
        END LOOP;
      END IF;
      RETURN NEW;
    END
    $booking_inventory_function$
  $create_booking_function$;

  EXECUTE $create_item_function$
    CREATE OR REPLACE FUNCTION asms_sync_paid_booking_item_inventory()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $booking_item_inventory_function$
    DECLARE
      old_paid boolean := false;
      new_paid boolean := false;
    BEGIN
      IF TG_OP <> 'INSERT' THEN
        SELECT status = 'PAID' INTO old_paid FROM bookings WHERE id = OLD.booking_id;
      END IF;
      IF TG_OP <> 'DELETE' THEN
        SELECT status = 'PAID' INTO new_paid FROM bookings WHERE id = NEW.booking_id;
      END IF;

      IF old_paid THEN
        PERFORM asms_adjust_schedule_inventory(
          OLD.schedule_id, OLD.ticket_type, -OLD.quantity
        );
      END IF;
      IF new_paid THEN
        PERFORM asms_adjust_schedule_inventory(
          NEW.schedule_id, NEW.ticket_type, NEW.quantity
        );
      END IF;
      RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
    END
    $booking_item_inventory_function$
  $create_item_function$;
END
$asms_booking_aggregate_functions$^^^

DO $asms_booking_aggregate_triggers$
BEGIN
  IF to_regclass('bookings') IS NULL
     OR to_regclass('booking_items') IS NULL
     OR to_regclass('show_schedules') IS NULL
     OR EXISTS (
       SELECT 1 FROM asms_schema_migrations
       WHERE version = '2026_07_14_booking_aggregate_v1'
     ) THEN
    RETURN;
  END IF;

  DROP TRIGGER IF EXISTS asms_sync_paid_schedule_inventory ON bookings;
  DROP TRIGGER IF EXISTS asms_sync_paid_booking_inventory ON bookings;
  EXECUTE $create_booking_trigger$
    CREATE TRIGGER asms_sync_paid_booking_inventory
    BEFORE UPDATE OF status ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION asms_sync_paid_booking_inventory()
  $create_booking_trigger$;

  DROP TRIGGER IF EXISTS asms_sync_paid_booking_item_inventory ON booking_items;
  EXECUTE $create_item_trigger$
    CREATE TRIGGER asms_sync_paid_booking_item_inventory
    AFTER INSERT OR UPDATE OF schedule_id, ticket_type, quantity, booking_id OR DELETE
    ON booking_items
    FOR EACH ROW
    EXECUTE FUNCTION asms_sync_paid_booking_item_inventory()
  $create_item_trigger$;

  INSERT INTO asms_schema_migrations(version)
  VALUES ('2026_07_14_booking_aggregate_v1');
END
$asms_booking_aggregate_triggers$^^^

DO $asms_ticket_booking_item_migration$
BEGIN
  IF to_regclass('tickets') IS NULL
     OR to_regclass('booking_items') IS NULL
     OR EXISTS (
       SELECT 1 FROM asms_schema_migrations
       WHERE version = '2026_07_14_ticket_booking_item_v1'
     ) THEN
    RETURN;
  END IF;

  ALTER TABLE tickets ADD COLUMN IF NOT EXISTS booking_item_id uuid;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tickets_booking_item_id_fkey'
      AND conrelid = 'tickets'::regclass
  ) THEN
    ALTER TABLE tickets
      ADD CONSTRAINT tickets_booking_item_id_fkey
      FOREIGN KEY (booking_item_id) REFERENCES booking_items(id);
  END IF;
  CREATE INDEX IF NOT EXISTS tickets_booking_item_id_idx ON tickets (booking_item_id);

  -- Inventory is now committed by PaymentService while schedules are locked in UUID order.
  -- Removing both aggregate triggers prevents a successful payment from decrementing twice.
  DROP TRIGGER IF EXISTS asms_sync_paid_schedule_inventory ON bookings;
  DROP TRIGGER IF EXISTS asms_sync_paid_booking_inventory ON bookings;
  DROP TRIGGER IF EXISTS asms_sync_paid_booking_item_inventory ON booking_items;

  INSERT INTO asms_schema_migrations(version)
  VALUES ('2026_07_14_ticket_booking_item_v1');
END
$asms_ticket_booking_item_migration$^^^

COMMIT^^^
