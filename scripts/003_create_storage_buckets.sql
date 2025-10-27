-- Create storage buckets for audio files, cover images, and avatars

-- Audio files bucket
insert into storage.buckets (id, name, public)
values ('audio', 'audio', true)
on conflict (id) do nothing;

-- Cover images bucket
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

-- Avatar images bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Updated storage policies to allow anon users (wallet-based auth, not Supabase auth)
-- Storage policies for audio bucket (allow anyone to upload for MVP)
create policy "Allow anyone to upload audio"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'audio');

create policy "Allow public to read audio"
on storage.objects for select
to public
using (bucket_id = 'audio');

create policy "Allow anyone to update audio"
on storage.objects for update
to anon, authenticated
using (bucket_id = 'audio');

create policy "Allow anyone to delete audio"
on storage.objects for delete
to anon, authenticated
using (bucket_id = 'audio');

-- Storage policies for covers bucket
create policy "Allow anyone to upload covers"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'covers');

create policy "Allow public to read covers"
on storage.objects for select
to public
using (bucket_id = 'covers');

create policy "Allow anyone to update covers"
on storage.objects for update
to anon, authenticated
using (bucket_id = 'covers');

create policy "Allow anyone to delete covers"
on storage.objects for delete
to anon, authenticated
using (bucket_id = 'covers');

-- Storage policies for avatars bucket
create policy "Allow anyone to upload avatars"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'avatars');

create policy "Allow public to read avatars"
on storage.objects for select
to public
using (bucket_id = 'avatars');

create policy "Allow anyone to update avatars"
on storage.objects for update
to anon, authenticated
using (bucket_id = 'avatars');

create policy "Allow anyone to delete avatars"
on storage.objects for delete
to anon, authenticated
using (bucket_id = 'avatars');
