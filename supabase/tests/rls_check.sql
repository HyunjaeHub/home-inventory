-- RLS 확인 (다른 가구의 데이터를 보거나 고칠 수 없는지)
-- Supabase SQL Editor에 통째로 붙여 넣고 Run.
--   · 결과 표에 "RLS 확인 통과" → 통과
--   · 빨간 오류 "RLS 실패: ..." → 막혀야 할 것이 뚫림
-- 가짜 사용자 2명과 가구 2개를 만들어 확인한 뒤 마지막 rollback으로 모두 취소한다 (실제 데이터는 그대로).

begin;

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000a1', 'rls-a@example.test'),
  ('00000000-0000-4000-8000-0000000000b1', 'rls-b@example.test');

-- 앱과 같은 권한(로그인한 사용자)으로 바꾼다
set local role authenticated;

-- ───── A: 가구를 만들고 품목·할 일 하나씩 ─────
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
select set_config('rls.a_household', public.create_household('A')::text, true);

insert into public.items (household_id, name, kind, place_id, unit)
select p.household_id, 'RLS-확인-품목', 'food', p.id, '개'
from public.places p where p.kind = 'fridge' limit 1;
insert into public.tasks (household_id, text)
values (current_setting('rls.a_household')::uuid, 'RLS-확인-할 일');

do $$
declare n int;
begin
  select count(*) into n from public.households;
  if n <> 1 then raise exception 'RLS 실패: A가 가구 %개를 봄 (1개여야 함)', n; end if;
  select count(*) into n from public.items;
  if n <> 1 then raise exception 'RLS 실패: A가 품목 %개를 봄 (자기 것 1개여야 함)', n; end if;
end $$;

-- ───── B: 다른 가구 ─────
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-0000000000b1","role":"authenticated"}', true);
select public.create_household('B');

do $$
declare
  n int;
  a_hh uuid := current_setting('rls.a_household')::uuid;
begin
  -- 읽기: 내 가구만 보여야 한다 (A 가구도, 실제 우리 집도 안 보임)
  select count(*) into n from public.households;
  if n <> 1 then raise exception 'RLS 실패: B가 가구 %개를 봄', n; end if;
  select count(*) into n from public.household_members;
  if n <> 1 then raise exception 'RLS 실패: B가 구성원 %명을 봄', n; end if;
  select count(*) into n from public.items;
  if n <> 0 then raise exception 'RLS 실패: B가 다른 가구 품목 %개를 봄', n; end if;
  select count(*) into n from public.tasks;
  if n <> 0 then raise exception 'RLS 실패: B가 다른 가구 할 일 %개를 봄', n; end if;
  select count(*) into n from public.places where household_id = a_hh;
  if n <> 0 then raise exception 'RLS 실패: B가 A의 보관 장소를 봄'; end if;

  -- 고치기·지우기: A의 행은 0개만 바뀌어야 한다
  update public.tasks set done = true where household_id = a_hh;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'RLS 실패: B가 A의 할 일을 고침'; end if;
  delete from public.items where household_id = a_hh;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'RLS 실패: B가 A의 품목을 지움'; end if;

  -- 넣기: A 가구로 넣으려 하면 거절돼야 한다
  begin
    insert into public.tasks (household_id, text) values (a_hh, '침입');
    raise exception 'RLS 실패: B가 A 가구에 할 일을 넣음';
  exception when insufficient_privilege then null;
  end;

  -- 한 번에 저장(apply_changes)도 같은 규칙
  begin
    perform public.apply_changes(jsonb_build_object('upsert', jsonb_build_object('tasks',
      jsonb_build_array(jsonb_build_object(
        'id', gen_random_uuid(), 'household_id', a_hh, 'text', '침입', 'done', false)))));
    raise exception 'RLS 실패: B가 apply_changes로 A 가구에 넣음';
  exception when insufficient_privilege then null;
  end;

  -- 초대 코드 없이 남의 가구에 합류할 수 없다 (이미 가구가 있으면 합류 자체가 막힘)
  begin
    perform public.join_household('XXXXXXXX', 'B');
    raise exception 'RLS 실패: 가구가 있는데 또 합류됨';
  exception when raise_exception then
    if sqlerrm like 'RLS 실패%' then raise; end if;
  end;
end $$;

-- ───── 로그인하지 않은 사용자(anon)는 아무것도 못 읽는다 ─────
set local role anon;
do $$
begin
  begin
    perform 1 from public.items limit 1;
    raise exception 'RLS 실패: 로그인 안 한 사용자가 품목을 읽음';
  exception when insufficient_privilege then null;
  end;
end $$;

-- SQL Editor는 결과를 돌려주는 마지막 문장만 보여 주므로, 여기까지 오면 통과 표시
select 'RLS 확인 통과 (가짜 데이터는 아래 rollback으로 취소)' as 결과;

rollback;
