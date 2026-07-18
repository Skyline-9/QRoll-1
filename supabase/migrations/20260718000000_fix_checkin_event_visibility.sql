BEGIN;

-- Fix check-in chicken-and-egg problem:
-- New users signing up via OAuth and scanning a check-in QR code
-- could not see the event details because they weren't team members yet.
-- Events only contain non-sensitive data (title, time, location), 
-- so it is safe to let all authenticated users view them.

DROP POLICY IF EXISTS "Team members can view events" ON public.events;

CREATE POLICY "Authenticated users can view events" ON public.events 
  FOR SELECT 
  TO authenticated 
  USING (true);

COMMIT;
