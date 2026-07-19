BEGIN;

-- Allow authenticated users to view unclaimed roster members so they can claim their slot,
-- or view their own linked roster member slot.
CREATE POLICY "Allow view unclaimed or own roster members" ON public.team_members
  FOR SELECT TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid());

COMMIT;
