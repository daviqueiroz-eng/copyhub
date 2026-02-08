INSERT INTO storage.buckets (id, name, public) VALUES ('mentorado-avatars', 'mentorado-avatars', true);

CREATE POLICY "Users can upload mentorado avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'mentorado-avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update mentorado avatars" ON storage.objects
  FOR UPDATE USING (bucket_id = 'mentorado-avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view mentorado avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'mentorado-avatars');