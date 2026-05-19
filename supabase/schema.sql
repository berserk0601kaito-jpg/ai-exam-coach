-- ユーザーデータを1行にまとめたシンプルな設計
-- localStorage のデータをそのままJSONBで保存する

create table if not exists public.user_data (
  user_id uuid references auth.users on delete cascade primary key,
  profile jsonb default '{}',
  teacher jsonb default '{}',
  plan text default 'trial',
  trial_start text,
  usage jsonb default '{}',
  history jsonb default '[]',
  scores jsonb default '[]',
  events jsonb default '[]',
  books jsonb default '[]',
  last_subjects jsonb default '{}',
  latest_plan text,
  updated_at timestamptz default now()
);

-- RLS有効化
alter table public.user_data enable row level security;

-- 自分のデータのみ読み書きできる
create policy "user_data_own" on public.user_data
  for all using (auth.uid() = user_id);

-- updated_at を自動更新するトリガー
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger user_data_updated_at
  before update on public.user_data
  for each row execute function public.set_updated_at();
