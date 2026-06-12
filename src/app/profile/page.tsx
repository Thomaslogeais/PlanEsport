import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import Image from "next/image";
import Link from "next/link";
import { User, Trophy, Users, Calendar } from "lucide-react";

export const metadata: Metadata = { title: "Mon profil" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      followings: { orderBy: { createdAt: "desc" } },
      accounts: { select: { provider: true } },
    },
  });

  if (!user) redirect("/login");

  const teams = user.followings.filter((f) => f.entityType === "team");
  const competitions = user.followings.filter((f) => f.entityType === "competition");

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      {/* Header profil */}
      <div
        className="rounded-2xl p-6 flex items-center gap-5"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name ?? "avatar"}
            width={72}
            height={72}
            className="rounded-full"
          />
        ) : (
          <div
            className="w-18 h-18 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{ backgroundColor: "var(--primary)", color: "#fff", width: 72, height: 72 }}
          >
            {user.name?.[0]?.toUpperCase() ?? <User size={32} />}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold">{user.name}</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>{user.email}</p>
          <div className="flex gap-2 mt-2">
            {user.accounts.map((a) => (
              <span
                key={a.provider}
                className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                style={{
                  backgroundColor: a.provider === "discord" ? "#5865F2" : "#4285F4",
                  color: "#fff",
                }}
              >
                {a.provider}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Équipes suivies", value: teams.length, Icon: Users },
          { label: "Compétitions", value: competitions.length, Icon: Trophy },
          { label: "Total", value: user.followings.length, Icon: Calendar },
        ].map(({ label, value, Icon }) => (
          <div
            key={label}
            className="rounded-xl p-4 text-center"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <Icon size={20} className="mx-auto mb-1" style={{ color: "var(--primary)" }} />
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Équipes suivies */}
      {teams.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <Users size={16} style={{ color: "var(--primary)" }} /> Équipes suivies
          </h2>
          <div className="flex flex-wrap gap-2">
            {teams.map((f) => (
              <Link
                key={f.id}
                href={`/teams/${f.entitySlug}`}
                className="px-3 py-1.5 rounded-full text-sm transition-opacity hover:opacity-80"
                style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
              >
                {f.entityName}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Compétitions suivies */}
      {competitions.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <Trophy size={16} style={{ color: "var(--primary)" }} /> Compétitions suivies
          </h2>
          <div className="flex flex-wrap gap-2">
            {competitions.map((f) => (
              <Link
                key={f.id}
                href={`/competitions/${f.entitySlug}`}
                className="px-3 py-1.5 rounded-full text-sm transition-opacity hover:opacity-80"
                style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
              >
                {f.entityName}
              </Link>
            ))}
          </div>
        </section>
      )}

      {user.followings.length === 0 && (
        <div className="text-center py-10" style={{ color: "var(--muted)" }}>
          <p className="text-sm">Tu ne suis encore rien.</p>
          <Link href="/explore" className="text-sm mt-2 inline-block" style={{ color: "var(--primary)" }}>
            Explorer des équipes et compétitions →
          </Link>
        </div>
      )}
    </div>
  );
}
