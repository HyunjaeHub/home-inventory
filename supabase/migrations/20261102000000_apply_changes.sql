-- 앱의 변경 한 번(먹음, 나누기, 장보기 완료 등)을 한 트랜잭션으로 저장한다 (Phase 5)
-- 앱이 바뀌기 전·후 상태를 비교해 바뀐 행만 보낸다:
--   p = { "upsert": { "<테이블>": [행, ...] }, "delete": { "<테이블>": [id, ...] } }
-- security invoker라 RLS가 그대로 적용된다 (내 가구 행만 쓸 수 있음).
-- 순서: 추가·수정은 부모 → 자식, 지우기는 자식 → 부모.

create function public.apply_changes(p jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  u jsonb := coalesce(p -> 'upsert', '{}'::jsonb);
  d jsonb := coalesce(p -> 'delete', '{}'::jsonb);
begin
  -- ───── 추가·수정 ─────
  insert into public.places (id, household_id, name, kind, sort_order)
  select r.id, r.household_id, r.name, r.kind, r.sort_order
  from jsonb_populate_recordset(null::public.places, coalesce(u -> 'places', '[]')) r
  on conflict (id) do update
    set name = excluded.name, kind = excluded.kind, sort_order = excluded.sort_order;

  insert into public.items (id, household_id, name, kind, place_id, unit, no_exp, qty, every_days)
  select r.id, r.household_id, r.name, r.kind, r.place_id, r.unit, r.no_exp, r.qty, r.every_days
  from jsonb_populate_recordset(null::public.items, coalesce(u -> 'items', '[]')) r
  on conflict (id) do update
    set name = excluded.name, kind = excluded.kind, place_id = excluded.place_id,
        unit = excluded.unit, no_exp = excluded.no_exp, qty = excluded.qty,
        every_days = excluded.every_days;

  insert into public.lots (id, household_id, item_id, place_id, qty, unit, size, exp, bought_on, bought_by)
  select r.id, r.household_id, r.item_id, r.place_id, r.qty, r.unit, r.size, r.exp, r.bought_on, r.bought_by
  from jsonb_populate_recordset(null::public.lots, coalesce(u -> 'lots', '[]')) r
  on conflict (id) do update
    set place_id = excluded.place_id, qty = excluded.qty, unit = excluded.unit,
        size = excluded.size, exp = excluded.exp, bought_on = excluded.bought_on,
        bought_by = excluded.bought_by;

  -- 기록은 추가만 한다
  insert into public.item_logs (id, household_id, item_id, text, actor, day, created_at)
  select r.id, r.household_id, r.item_id, r.text, r.actor, r.day, r.created_at
  from jsonb_populate_recordset(null::public.item_logs, coalesce(u -> 'item_logs', '[]')) r
  on conflict (id) do nothing;

  insert into public.shop_items (id, household_id, name, place_id, added_by, checked)
  select r.id, r.household_id, r.name, r.place_id, r.added_by, r.checked
  from jsonb_populate_recordset(null::public.shop_items, coalesce(u -> 'shop_items', '[]')) r
  on conflict (id) do update
    set name = excluded.name, place_id = excluded.place_id, checked = excluded.checked;

  insert into public.inbox_items (id, household_id, name, place_id, added_by, day)
  select r.id, r.household_id, r.name, r.place_id, r.added_by, r.day
  from jsonb_populate_recordset(null::public.inbox_items, coalesce(u -> 'inbox_items', '[]')) r
  on conflict (id) do update
    set name = excluded.name, place_id = excluded.place_id;

  insert into public.meal_entries (id, household_id, item_id, lot_id, label, qty, checked)
  select r.id, r.household_id, r.item_id, r.lot_id, r.label, r.qty, r.checked
  from jsonb_populate_recordset(null::public.meal_entries, coalesce(u -> 'meal_entries', '[]')) r
  on conflict (id) do update
    set lot_id = excluded.lot_id, label = excluded.label, qty = excluded.qty,
        checked = excluded.checked;

  insert into public.tasks (id, household_id, text, done)
  select r.id, r.household_id, r.text, r.done
  from jsonb_populate_recordset(null::public.tasks, coalesce(u -> 'tasks', '[]')) r
  on conflict (id) do update
    set text = excluded.text, done = excluded.done;

  -- ───── 지우기 ─────
  delete from public.meal_entries
  where id in (select jsonb_array_elements_text(coalesce(d -> 'meal_entries', '[]'))::uuid);
  delete from public.tasks
  where id in (select jsonb_array_elements_text(coalesce(d -> 'tasks', '[]'))::uuid);
  delete from public.inbox_items
  where id in (select jsonb_array_elements_text(coalesce(d -> 'inbox_items', '[]'))::uuid);
  delete from public.shop_items
  where id in (select jsonb_array_elements_text(coalesce(d -> 'shop_items', '[]'))::uuid);
  delete from public.lots
  where id in (select jsonb_array_elements_text(coalesce(d -> 'lots', '[]'))::uuid);
  delete from public.items
  where id in (select jsonb_array_elements_text(coalesce(d -> 'items', '[]'))::uuid);
  delete from public.places
  where id in (select jsonb_array_elements_text(coalesce(d -> 'places', '[]'))::uuid);
end;
$$;

revoke execute on function public.apply_changes(jsonb) from public, anon;
grant execute on function public.apply_changes(jsonb) to authenticated;
