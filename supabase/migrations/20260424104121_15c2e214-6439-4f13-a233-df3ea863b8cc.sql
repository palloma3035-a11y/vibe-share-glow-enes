-- =========================================================
-- STORIES (24h expiry)
-- =========================================================
create table public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  image_url text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create index idx_stories_user_created on public.stories(user_id, created_at desc);
create index idx_stories_expires on public.stories(expires_at);

alter table public.stories enable row level security;

create policy "Active stories are viewable by everyone"
  on public.stories for select
  using (expires_at > now());

create policy "Users can create their own stories"
  on public.stories for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own stories"
  on public.stories for delete
  using (auth.uid() = user_id);

-- =========================================================
-- FOLLOWS
-- =========================================================
create table public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null,
  following_id uuid not null,
  created_at timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);

create index idx_follows_follower on public.follows(follower_id);
create index idx_follows_following on public.follows(following_id);

alter table public.follows enable row level security;

create policy "Follows are viewable by everyone"
  on public.follows for select
  using (true);

create policy "Users can follow as themselves"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create policy "Users can unfollow their own follows"
  on public.follows for delete
  using (auth.uid() = follower_id);

-- =========================================================
-- AVATARS storage bucket
-- =========================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );