/*
  # Create Audio Storage Bucket

  1. Storage
    - Create a public bucket named `audio-recordings` for storing audio files
    - Enable public access for easy file retrieval
    - Set up appropriate policies for file upload and access

  2. Security
    - Allow public read access to files
    - Allow public upload access (for demo purposes)
    - In production, you would restrict uploads to authenticated users only
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-recordings', 'audio-recordings', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow public uploads to audio-recordings'
  ) THEN
    CREATE POLICY "Allow public uploads to audio-recordings"
    ON storage.objects FOR INSERT
    TO anon, authenticated
    WITH CHECK (bucket_id = 'audio-recordings');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow public access to audio-recordings'
  ) THEN
    CREATE POLICY "Allow public access to audio-recordings"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'audio-recordings');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow public updates to audio-recordings'
  ) THEN
    CREATE POLICY "Allow public updates to audio-recordings"
    ON storage.objects FOR UPDATE
    TO anon, authenticated
    USING (bucket_id = 'audio-recordings')
    WITH CHECK (bucket_id = 'audio-recordings');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow public deletes from audio-recordings'
  ) THEN
    CREATE POLICY "Allow public deletes from audio-recordings"
    ON storage.objects FOR DELETE
    TO anon, authenticated
    USING (bucket_id = 'audio-recordings');
  END IF;
END $$;