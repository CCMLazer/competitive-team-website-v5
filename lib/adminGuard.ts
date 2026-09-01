import { supabase } from "@/lib/supabase";

const STATUS_ADMIN_ID =
  "82530f6b-67cf-4283-84b4-b58a1a299b5e";

export async function requireAdmin() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("AUTH CHECK ERROR:", error.message);
    window.location.href = "/login";
    return null;
  }

  if (!user) {
    console.log("NO USER LOGGED IN");
    window.location.href = "/login";
    return null;
  }

  console.log("LOGGED IN USER:", user.id);

  return user;
}

export async function isStatusAdmin() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id === STATUS_ADMIN_ID;
}