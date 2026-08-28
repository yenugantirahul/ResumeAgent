import "./env.js";
import { createClient } from "@supabase/supabase-js";
import type { Request } from "express";

const supabaseUrl = process.env.SUPABASE_URL;
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function createSupabaseClient(req: Request) {
  const authHeader = req.headers.authorization;

  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    throw new Error("Missing Clerk token");
  }

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are required in environment variables.");
  }

  return createClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      accessToken: async () => token,
    }
  );
}

// Admin client bypasses RLS — safe to use on the backend
// since Clerk middleware already verified the user's identity.
export function createSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in environment variables.");
  }

  return createClient(
    supabaseUrl,
    supabaseServiceRoleKey
  );
}