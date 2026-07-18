import type { APIRoute } from 'astro';
import { createSupabaseClient } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
  const formData = await request.formData();
  const password = formData.get('password')?.toString();

  if (!password || password.length < 6) {
    return new Response('Password must be at least 6 characters long', { status: 400 });
  }

  const supabase = createSupabaseClient(cookies);
  
  // Ensure user has a valid active session first
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return new Response('Unauthorized: Session not found', { status: 401 });
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return new Response(error.message, { status: 400 });
  }

  return new Response('Password updated successfully', { status: 200 });
};
