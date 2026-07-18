BEGIN;

-- Make handle_new_user trigger case-insensitive for admin invites
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  is_invited_admin boolean;
BEGIN
  SELECT exists (
    SELECT 1 FROM public.admin_invites WHERE lower(email) = lower(new.email)
  ) INTO is_invited_admin;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    CASE WHEN is_invited_admin THEN 'admin' ELSE 'attendee' END
  );

  IF is_invited_admin THEN
    DELETE FROM public.admin_invites WHERE lower(email) = lower(new.email);
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make handle_profile_claim trigger case-insensitive for auto-claiming team members
CREATE OR REPLACE FUNCTION public.handle_profile_claim()
RETURNS trigger AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    UPDATE public.team_members
    SET user_id = NEW.id,
        claimed_at = now()
    WHERE lower(email) = lower(NEW.email) AND user_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
