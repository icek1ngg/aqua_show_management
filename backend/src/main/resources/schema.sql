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
