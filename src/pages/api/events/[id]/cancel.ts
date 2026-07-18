import type { APIRoute } from "astro";
import { createSupabaseClient } from "../../../../lib/supabase";

export const POST: APIRoute = async ({ params, cookies, redirect, request }) => {
  const supabase = createSupabaseClient(cookies);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const id = params.id;
  if (!id) return new Response("Missing id", { status: 400 });

  // Resolve event and its team's company_id to verify scoped admin access
  const { data: event } = await supabase
    .from("events")
    .select("team_id, teams (company_id)")
    .eq("id", id)
    .maybeSingle();

  if (!event) return new Response("Event not found", { status: 404 });

  const companyId = (event.teams as any)?.company_id;

  const [profileRes, companyMemberRes] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", session.user.id).single(),
    companyId
      ? supabase
          .from("company_members")
          .select("role")
          .eq("company_id", companyId)
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle()
      : Promise.resolve({ data: null })
  ]);

  const isGlobalAdmin = profileRes.data?.role === "admin";
  const isCompanyAdmin = !!companyMemberRes.data;

  if (!isGlobalAdmin && !isCompanyAdmin) return new Response("Forbidden", { status: 403 });

  let undo = false;
  const ct = request.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      const body = await request.json();
      undo = !!body?.undo;
    } catch {}
  } else {
    const form = await request.formData().catch(() => null);
    if (form?.get("undo") === "1") undo = true;
  }

  const { error } = await supabase
    .from("events")
    .update({ cancelled_at: undo ? null : new Date().toISOString() })
    .eq("id", id);

  if (error) return new Response(error.message, { status: 400 });

  if (ct.includes("application/json")) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  const toast = undo ? "Occurrence restored" : "Occurrence cancelled";
  return redirect(`/admin?toast=${encodeURIComponent(toast)}&toastType=success`);
};
