import type { APIRoute } from 'astro';
import { createSupabaseClient } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies, url }) => {
  const formData = await request.formData();
  const email = formData.get('email')?.toString();
  const next = '/reset-password';
  const baseUrl = import.meta.env.PUBLIC_APP_URL || url.origin;

  if (!email) {
    return new Response('Email is required', { status: 400 });
  }

  const supabase = createSupabaseClient(cookies);
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${baseUrl}/api/auth/callback?next=${encodeURIComponent(next)}`,
  });

  if (error) {
    return new Response(error.message, { status: 400 });
  }

  return new Response('Check your email for the password reset link!', { status: 200 });
};
