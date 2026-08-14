import { createClient } from "@supabase/supabase-js";
import type { Request } from "express";
import dotenv from "dotenv"
dotenv.config();

export function createSupabaseClient(req: Request) {
    const authHeader = req.headers.authorization;

    const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;

    if (!token) {
        throw new Error("Missing Clerk token");
    }

    return createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_PUBLISHABLE_KEY!,
        {
            accessToken: async () => token,
        }
    );
}