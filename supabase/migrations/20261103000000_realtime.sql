-- 실시간 동기화 (Phase 6)
-- 우리 집 테이블이 바뀌면 같은 가구의 다른 폰에 알린다. 앱은 알림을 받으면 서버 데이터를 다시 읽는다.
-- 앱은 household_id로 거른다. DELETE도 거를 수 있게 replica identity를 full로 둔다
-- (RLS가 켜져 있으면 DELETE 알림에는 기본키만 담긴다).

alter table public.places replica identity full;
alter table public.items replica identity full;
alter table public.lots replica identity full;
alter table public.item_logs replica identity full;
alter table public.shop_items replica identity full;
alter table public.inbox_items replica identity full;
alter table public.meal_entries replica identity full;
alter table public.tasks replica identity full;
alter table public.household_settings replica identity full;
alter table public.household_members replica identity full;

alter publication supabase_realtime add table
  public.places,
  public.items,
  public.lots,
  public.item_logs,
  public.shop_items,
  public.inbox_items,
  public.meal_entries,
  public.tasks,
  public.household_settings,
  public.household_members;
