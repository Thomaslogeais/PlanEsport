import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LoginButtons } from "@/components/ui/LoginButtons";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session) redirect("/");

  const { callbackUrl } = await searchParams;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
      <div
        className="w-full max-w-sm rounded-2xl p-8 shadow-2xl"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-1">
            Plan<span style={{ color: "var(--primary)" }}>Esport</span>
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Connecte-toi pour suivre tes équipes et compétitions
          </p>
        </div>

        <LoginButtons callbackUrl={callbackUrl ?? "/"} />

        <p className="text-center text-xs mt-6" style={{ color: "var(--muted)" }}>
          En te connectant, tu acceptes nos conditions d&apos;utilisation.
        </p>
      </div>
    </div>
  );
}
