import { createSupabaseBrowserClient } from "@/lib/supabase";

/**
 * Wrapper around fetch that adds the Supabase auth token.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const supabase = createSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();

  const headers = new Headers(options.headers);
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }
  // Only default to JSON for non-FormData bodies — FormData must keep the
  // browser-generated multipart boundary Content-Type.
  if (
    !headers.has("Content-Type") &&
    options.body &&
    !(options.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, { ...options, headers });
}
