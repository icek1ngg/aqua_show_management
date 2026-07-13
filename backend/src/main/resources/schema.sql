DO $asms_migration$
DECLARE
  schedule_row record;
  paid_standard bigint;
  paid_vip bigint;
  paid_family bigint;
  paid_unknown bigint;
  legacy_sold bigint;
BEGIN
  -- On a brand-new database Hibernate creates the tables after this pre-JPA pass.
  -- ScheduleSchemaInitializer repeats this script after Hibernate so the same migration
  -- and trigger installation also happen on that first startup.
  IF to_regclass('show_schedules') IS NULL THEN
    RETURN;
  END IF;

  ALTER TABLE show_schedules ADD COLUMN IF NOT EXISTS standard_capacity integer;
  ALTER TABLE show_schedules ADD COLUMN IF NOT EXISTS vip_capacity integer;
  ALTER TABLE show_schedules ADD COLUMN IF NOT EXISTS family_capacity integer;
  ALTER TABLE show_schedules ADD COLUMN IF NOT EXISTS standard_available_tickets integer;
  ALTER TABLE show_schedules ADD COLUMN IF NOT EXISTS vip_available_tickets integer;
  ALTER TABLE show_schedules ADD COLUMN IF NOT EXISTS family_available_tickets integer;
  ALTER TABLE show_schedules ADD COLUMN IF NOT EXISTS standard_price numeric(12,2);

  FOR schedule_row IN SELECT * FROM show_schedules ORDER BY id FOR UPDATE LOOP
    paid_standard := 0;
    paid_vip := 0;
    paid_family := 0;
    paid_unknown := 0;

    IF to_regclass('bookings') IS NOT NULL THEN
      SELECT
        COALESCE(SUM(quantity) FILTER (
          WHERE UPPER(TRIM(ticket_type)) LIKE 'STANDARD%'
        ), 0),
        COALESCE(SUM(quantity) FILTER (
          WHERE UPPER(TRIM(ticket_type)) LIKE 'VIP%'
        ), 0),
        COALESCE(SUM(quantity) FILTER (
          WHERE UPPER(TRIM(ticket_type)) LIKE 'FAMILY%'
        ), 0),
        COALESCE(SUM(quantity) FILTER (
          WHERE UPPER(TRIM(ticket_type)) NOT LIKE 'STANDARD%'
            AND UPPER(TRIM(ticket_type)) NOT LIKE 'VIP%'
            AND UPPER(TRIM(ticket_type)) NOT LIKE 'FAMILY%'
        ), 0)
      INTO paid_standard, paid_vip, paid_family, paid_unknown
      FROM bookings
      WHERE schedule_id = schedule_row.id::text
        AND status = 'PAID';
    END IF;

    IF paid_unknown > 0 THEN
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

    -- Initialize legacy rows, and repair the previous standard-only backfill when it
    -- cannot represent the paid distribution. Available inventory stays aggregate-
    -- compatible: VIP/Family start fully sold and legacy availability stays STANDARD.
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

CREATE OR REPLACE FUNCTION asms_lock_and_sync_paid_schedule_inventory()
RETURNS trigger
LANGUAGE plpgsql
AS $asms_trigger_function$
DECLARE
  old_schedule_id text;
  new_schedule_id text;
  old_ticket_type text;
  new_ticket_type text;
  matched_schedule boolean;
  changed_rows integer;
BEGIN
  old_schedule_id := CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.schedule_id END;
  new_schedule_id := CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE NEW.schedule_id END;

  -- Lock in deterministic UUID order. Schedule management uses the same row lock,
  -- so validation and paid transitions cannot observe and overwrite stale inventory.
  PERFORM 1
  FROM show_schedules
  WHERE id::text IN (old_schedule_id, new_schedule_id)
  ORDER BY id
  FOR UPDATE;

  IF TG_OP <> 'INSERT' AND OLD.status = 'PAID' THEN
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

    SELECT EXISTS (SELECT 1 FROM show_schedules WHERE id::text = old_schedule_id)
    INTO matched_schedule;
    IF matched_schedule AND changed_rows = 0 THEN
      RAISE EXCEPTION 'Cannot release inconsistent paid inventory for schedule %', old_schedule_id;
    END IF;
  END IF;

  IF TG_OP <> 'DELETE' AND NEW.status = 'PAID' THEN
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

    SELECT EXISTS (SELECT 1 FROM show_schedules WHERE id::text = new_schedule_id)
    INTO matched_schedule;
    IF matched_schedule AND changed_rows = 0 THEN
      RAISE EXCEPTION 'Not enough tickets available for paid booking on schedule %', new_schedule_id;
    END IF;
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END
$asms_trigger_function$^^^

DO $asms_trigger_install$
BEGIN
  IF to_regclass('show_schedules') IS NULL OR to_regclass('bookings') IS NULL THEN
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
END
$asms_trigger_install$^^^
