/*
# Tighten storage policies + add DELETE for chat-media

The existing policies allowed any authenticated user to upload/update any
file. Tighten to owner-scoped using the path prefix convention {auth.uid()}/.
Also add a DELETE policy so users can remove their own media.
*/

DROP POLICY IF EXISTS chat_media_upload_own ON storage.objects;
DROP POLICY IF EXISTS chat_media_update_own ON storage.objects;
DROP POLICY IF EXISTS chat_media_read_all ON storage.objects;
DROP POLICY IF EXISTS chat_media_delete_own ON storage.objects;

-- Public read (media URLs are shared via getPublicUrl)
CREATE POLICY chat_media_read_all ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'chat-media');

-- Upload: must be authenticated and file must be under own user-id folder
CREATE POLICY chat_media_upload_own ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Update: owner only
CREATE POLICY chat_media_update_own ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Delete: owner only
CREATE POLICY chat_media_delete_own ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
