"use client";

import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";

export default function Navbar() {
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          ResumeAgent
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link
            href="/dashboard"
            className="transition-colors hover:text-foreground"
          >
            Dashboard
          </Link>
          <Link
            href="/analyze"
            className="transition-colors hover:text-foreground"
          >
            Analyze
          </Link>

          <Link
            href="/how-it-works"
            className="transition-colors hover:text-foreground"
          >
            How it works
          </Link>

        
        </nav>

        <div className="flex items-center gap-3">
          {isSignedIn ? (
            <>
              <span className="text-sm font-medium">
                Hi, {user?.firstName || user?.username || "User"}
              </span>

              <button
                onClick={() => signOut({ redirectUrl: "/" })}
                className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Login
              </Link>

              <Link
                href="/sign-up"
                className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
