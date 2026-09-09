import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { joinGroup } from "@/app/g/[slug]/actions";
import UserMenu from "@/components/UserMenu";
import CopyLinkButton from "@/components/CopyLinkButton";

export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const group = await prisma.group.findUnique({ where: { slug: params.slug } });
  if (!group) notFound();

  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/g/${group.slug}`)}`);
  }

  const membership = await prisma.member.findUnique({
    where: { groupId_userId: { groupId: group.id, userId: user.id } },
  });

  // Logged in, but hasn't joined this particular group yet — show an
  // invite screen instead of the normal nav/feed.
  if (!membership) {
    const join = joinGroup.bind(null, group.id, group.slug);
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="card p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-3">🎬</div>
          <h1 className="text-2xl font-extrabold mb-1">{group.name}</h1>
          {group.tagline && <p className="text-ink/60 mb-4">{group.tagline}</p>}
          <p className="text-ink/70 mb-5">You've been invited to join this group.</p>
          <form action={join}>
            <button type="submit" className="btn-primary w-full text-lg">
              Join {group.name}
            </button>
          </form>
          <p className="text-xs text-ink/40 mt-4">Logged in as {user.name}</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b-[3px] border-ink bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Link href={`/g/${group.slug}`} className="text-2xl font-extrabold tracking-tight">
                🎬 {group.name}
              </Link>
              {group.tagline && (
                <p className="text-sm text-ink/60 -mt-0.5">{group.tagline}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <CopyLinkButton path={`/g/${group.slug}`} />
              <UserMenu name={user.name} />
            </div>
          </div>

          <nav className="flex flex-wrap gap-2 text-sm font-bold">
            <Link href={`/g/${group.slug}`} className="btn-secondary btn-sm">
              📽️ Feed
            </Link>
            <Link href={`/g/${group.slug}/new`} className="btn-secondary btn-sm">
              ➕ Log a night
            </Link>
            <Link href={`/g/${group.slug}/stats`} className="btn-secondary btn-sm">
              📊 Stats
            </Link>
            <Link href={`/g/${group.slug}/settings`} className="btn-secondary btn-sm">
              ⚙️ Settings
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
