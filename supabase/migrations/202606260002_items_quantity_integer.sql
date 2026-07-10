-- Proposes integer quantities for manual MVP items.
-- Review and execute manually in Supabase after approval.

begin;

alter table public.items
  alter column quantity set default 1;

alter table public.items
  add constraint items_quantity_integer_mvp check (quantity = trunc(quantity));

alter table public.items
  add constraint items_quantity_mvp_range check (quantity between 1 and 9999);

comment on column public.items.amount_cents is 'Unit amount in cents. Line total is amount_cents * quantity.';
comment on column public.items.quantity is 'MVP quantity is treated as an integer between 1 and 9999. Column remains numeric until a later approved schema hardening step.';

commit;
