-- 집 재고관리 초기 스키마 (Phase 4)
-- 모든 데이터는 가구(household) 단위. 한 사람은 한 가구에만 속한다.
-- 앱 사용자(authenticated)는 RLS로 자기 가구 행만 읽고 쓸 수 있다.
-- "누가"는 이름 글자가 아니라 auth.users id로 저장하고, 화면에서 구성원 이름으로 바꿔 보인다.

-- ───────────────────────── 가구·구성원 ─────────────────────────

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default '우리 집',
  -- 배우자 합류용 초대 코드
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  display_name text not null,
  -- 사람마다 다른 설정 (알림 켜기·시간 등)
  prefs jsonb not null default '{}'::jsonb,
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- 가구 전체가 함께 쓰는 설정: 계산 규칙(rules)과 공용 설정(prefs: 정리함 사용·추천·기록 보관 기간)
create table public.household_settings (
  household_id uuid primary key references public.households (id) on delete cascade,
  rules jsonb not null default '{}'::jsonb,
  prefs jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ───────────────────────── 보관 장소 ─────────────────────────

create table public.places (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  kind text not null check (kind in ('fridge', 'freezer', 'pantry', 'home')),
  sort_order int not null default 0,
  unique (household_id, name),
  -- 다른 테이블이 (가구, 장소)로 참조해 다른 가구 장소를 가리키지 못하게 한다
  unique (household_id, id)
);

-- ───────────────────────── 품목·로트·기록 ─────────────────────────

create table public.items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  kind text not null check (kind in ('food', 'cons')),
  -- 기본 보관 장소. 쓰는 중인 장소는 지울 수 없다 (restrict)
  place_id uuid not null,
  unit text not null,
  -- 식품: 기한 없이 관리
  no_exp boolean not null default false,
  -- 소모품: 남은 개수, 한 개를 며칠에 걸쳐 쓰는지
  qty numeric,
  every_days int,
  created_at timestamptz not null default now(),
  unique (household_id, name),
  unique (household_id, id),
  foreign key (household_id, place_id) references public.places (household_id, id) on delete restrict,
  check (kind = 'food' or (qty is not null and qty >= 0 and every_days is not null and every_days > 0))
);

create table public.lots (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  item_id uuid not null,
  place_id uuid not null,
  -- 개수. 소분 팩이면 팩 수
  qty numeric not null check (qty >= 0),
  unit text not null,
  -- 소분 팩 한 개의 양. 소분하지 않았으면 null
  size numeric check (size is null or size > 0),
  exp date,
  bought_on date not null default current_date,
  bought_by uuid references auth.users (id) on delete set null,
  unique (household_id, id),
  foreign key (household_id, item_id) references public.items (household_id, id) on delete cascade,
  foreign key (household_id, place_id) references public.places (household_id, id) on delete restrict
);

create table public.item_logs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  item_id uuid not null,
  text text not null,
  actor uuid references auth.users (id) on delete set null,
  day date not null default current_date,
  created_at timestamptz not null default now(),
  foreign key (household_id, item_id) references public.items (household_id, id) on delete cascade
);

-- ───────────────────────── 장보기·정리할 것 ─────────────────────────

create table public.shop_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  name text not null,
  place_id uuid not null,
  added_by uuid references auth.users (id) on delete set null,
  checked boolean not null default false,
  created_at timestamptz not null default now(),
  foreign key (household_id, place_id) references public.places (household_id, id) on delete restrict
);

create table public.inbox_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  name text not null,
  place_id uuid not null,
  added_by uuid references auth.users (id) on delete set null,
  day date not null default current_date,
  created_at timestamptz not null default now(),
  foreign key (household_id, place_id) references public.places (household_id, id) on delete restrict
);

-- ───────────────────────── 다음 한끼·할 일 ─────────────────────────

create table public.meal_entries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  item_id uuid not null,
  -- 먼저 꺼낼 로트
  lot_id uuid not null,
  -- 담은 양의 단위 ('팩' 또는 로트 단위)
  label text not null,
  qty numeric not null check (qty > 0),
  checked boolean not null default true,
  created_at timestamptz not null default now(),
  foreign key (household_id, item_id) references public.items (household_id, id) on delete cascade,
  foreign key (household_id, lot_id) references public.lots (household_id, id) on delete cascade
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  text text not null check (length(trim(text)) > 0),
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create index on public.places (household_id, sort_order);
create index on public.items (household_id);
create index on public.lots (item_id);
create index on public.lots (household_id);
create index on public.item_logs (item_id, created_at desc);
create index on public.shop_items (household_id);
create index on public.inbox_items (household_id);
create index on public.meal_entries (household_id);
create index on public.tasks (household_id);

-- ───────────────────────── 장소 지우기 제한 ─────────────────────────
-- 쓰는 중인 장소는 외래키(restrict)가 막고, 종류의 마지막 한 곳은 이 트리거가 막는다.

create function public.guard_last_place_of_kind()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and old.kind = new.kind then
    return new;
  end if;
  -- 가구 전체를 지우는 중(cascade)이면 통과
  if not exists (select 1 from public.households h where h.id = old.household_id) then
    return old;
  end if;
  if not exists (
    select 1 from public.places p
    where p.household_id = old.household_id and p.kind = old.kind and p.id <> old.id
  ) then
    raise exception '이 종류의 마지막 보관 장소라 지우거나 바꿀 수 없어요'
      using errcode = 'P0001';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger places_guard_last_of_kind
before delete or update of kind on public.places
for each row execute function public.guard_last_place_of_kind();

-- ───────────────────────── 내 가구 찾기 ─────────────────────────

-- RLS 안에서 쓰므로 security definer로 구성원 테이블의 RLS를 건너뛴다
create function public.my_household_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.household_id from public.household_members m where m.user_id = (select auth.uid())
$$;

-- ───────────────────────── 가구 만들기·합류 ─────────────────────────

create function public.create_household(p_display_name text, p_name text default '우리 집')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null then
    raise exception '로그인이 필요해요';
  end if;
  if exists (select 1 from public.household_members m where m.user_id = v_uid) then
    raise exception '이미 가구에 속해 있어요';
  end if;

  insert into public.households (name, invite_code)
  values (
    coalesce(nullif(trim(p_name), ''), '우리 집'),
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
  )
  returning id into v_id;

  insert into public.household_members (household_id, user_id, display_name)
  values (v_id, v_uid, coalesce(nullif(trim(p_display_name), ''), '나'));

  insert into public.household_settings (household_id) values (v_id);

  insert into public.places (household_id, name, kind, sort_order) values
    (v_id, '냉장', 'fridge', 0),
    (v_id, '냉동', 'freezer', 1),
    (v_id, '실온', 'pantry', 2),
    (v_id, '생활', 'home', 3);

  return v_id;
end;
$$;

create function public.join_household(p_invite_code text, p_display_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null then
    raise exception '로그인이 필요해요';
  end if;
  if exists (select 1 from public.household_members m where m.user_id = v_uid) then
    raise exception '이미 가구에 속해 있어요';
  end if;

  select h.id into v_id from public.households h
  where h.invite_code = upper(trim(p_invite_code));
  if v_id is null then
    raise exception '초대 코드를 찾을 수 없어요';
  end if;

  insert into public.household_members (household_id, user_id, display_name)
  values (v_id, v_uid, coalesce(nullif(trim(p_display_name), ''), '나'));

  return v_id;
end;
$$;

-- ───────────────────────── RLS ─────────────────────────

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_settings enable row level security;
alter table public.places enable row level security;
alter table public.items enable row level security;
alter table public.lots enable row level security;
alter table public.item_logs enable row level security;
alter table public.shop_items enable row level security;
alter table public.inbox_items enable row level security;
alter table public.meal_entries enable row level security;
alter table public.tasks enable row level security;

-- 가구: 내 가구만 보고 이름만 고친다 (만들기는 create_household로)
create policy "내 가구 보기" on public.households
  for select to authenticated using (id = (select public.my_household_id()));
create policy "내 가구 이름 고치기" on public.households
  for update to authenticated
  using (id = (select public.my_household_id()))
  with check (id = (select public.my_household_id()));

-- 구성원: 같은 가구 사람은 보고, 내 행만 고친다 (합류는 join_household로)
create policy "같은 가구 구성원 보기" on public.household_members
  for select to authenticated using (household_id = (select public.my_household_id()));
create policy "내 정보 고치기" on public.household_members
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and household_id = (select public.my_household_id()));

create policy "가구 설정 보기" on public.household_settings
  for select to authenticated using (household_id = (select public.my_household_id()));
create policy "가구 설정 고치기" on public.household_settings
  for update to authenticated
  using (household_id = (select public.my_household_id()))
  with check (household_id = (select public.my_household_id()));

-- 나머지 데이터 테이블: 내 가구 행이면 모두 할 수 있다
do $$
declare
  t text;
begin
  foreach t in array array[
    'places', 'items', 'lots', 'item_logs', 'shop_items', 'inbox_items', 'meal_entries', 'tasks'
  ] loop
    execute format(
      'create policy "내 가구 데이터" on public.%I for all to authenticated
         using (household_id = (select public.my_household_id()))
         with check (household_id = (select public.my_household_id()))',
      t
    );
  end loop;
end;
$$;

-- ───────────────────────── 권한 ─────────────────────────
-- 프로젝트에서 "새 테이블 자동 공개"를 껐으므로 앱(authenticated)이 쓸 것만 직접 연다.
-- 로그인하지 않은 anon에게는 아무것도 열지 않는다.

grant select, update on public.households to authenticated;
grant select, update (display_name, prefs) on public.household_members to authenticated;
grant select, update (rules, prefs, updated_at) on public.household_settings to authenticated;
grant select, insert, update, delete on
  public.places, public.items, public.lots, public.item_logs,
  public.shop_items, public.inbox_items, public.meal_entries, public.tasks
  to authenticated;

revoke execute on function public.my_household_id() from public, anon;
revoke execute on function public.create_household(text, text) from public, anon;
revoke execute on function public.join_household(text, text) from public, anon;
revoke execute on function public.guard_last_place_of_kind() from public, anon, authenticated;
grant execute on function public.my_household_id() to authenticated;
grant execute on function public.create_household(text, text) to authenticated;
grant execute on function public.join_household(text, text) to authenticated;
