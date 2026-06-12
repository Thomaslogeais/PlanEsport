"use client";

import { signIn, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { LogIn, LogOut, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";

type AuthButtonProps = {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    id?: string;
  } | null;
};

export function AuthButton({ user }: AuthButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  if (!user) {
    return (
      <button
        onClick={() => signIn()}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
        style={{ backgroundColor: "var(--primary)", color: "#fff" }}
      >
        <LogIn size={14} />
        <span className="hidden sm:inline">Connexion</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full focus:outline-none"
      >
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name ?? "avatar"}
            width={32}
            height={32}
            className="rounded-full border-2"
            style={{ borderColor: "var(--primary)" }}
          />
        ) : (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ backgroundColor: "var(--primary)", color: "#fff" }}
          >
            {user.name?.[0]?.toUpperCase() ?? <User size={14} />}
          </div>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-10 w-52 rounded-lg shadow-xl z-50 py-2"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="px-4 py-2 border-b" style={{ borderColor: "var(--border)" }}>
            <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
              {user.name}
            </p>
            <p className="text-xs truncate" style={{ color: "var(--muted)" }}>
              {user.email}
            </p>
          </div>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm hover:opacity-80 transition-opacity"
            style={{ color: "var(--text)" }}
          >
            <User size={14} />
            Mon profil
          </Link>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:opacity-80 transition-opacity"
            style={{ color: "var(--muted)" }}
          >
            <LogOut size={14} />
            Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}
