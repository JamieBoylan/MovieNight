import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { goToGroup } from "@/app/actions";
import CreateGroupForm from "@/components/CreateGroupForm";
import UserMenu from "@/components/UserMenu";

export default async function HomePage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <main className="min-h-screen px-4 py-10 md:py-16">
        <div className="max-w-xl mx-auto text-center">
          <div className="text-5xl mb-3">🎬🍿✨</div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Movie Night</h1>
          <p className="mt-3 text-ink/70 text-lg">
            Letterboxd, but it's just your group chat. Rate movies together, track who fell
            asleep, and settle who has the best taste — for good.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <Link href="/signup" className="btn-primary text-lg">
              Get started free
            </Link>
            <Link href="/login" className="btn-secondary text-lg">
              Log in
            </Link>
          </div>
          <p className="text-ink/40 text-sm mt-10">
            Free accounts, invite-only groups — no one can see or join a group without its link.
          </p>
        </div>
      </main>
    );
  }

  const memberships = await prisma.member.findMany({
    where: { userId: user.id },
    include: {
      group: {
        include: {
          _count: { select: { movies: true, members: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <main className="min-h-screen px-4 py-10 md:py-16">
      <div className="max-w-xl mx-auto">
        <header className="flex items-center justify-between gap-3 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">🎬 Movie Night</h1>
            <p className="text-ink/60">Hey {user.name.split(" ")[0]} 👋</p>
          </div>
          <UserMenu name={user.name} />
        </header>

        <section className="mb-10">
          <h2 className="font-extrabold text-xl mb-3">Your groups</h2>
          {memberships.length === 0 ? (
            <p className="text-ink/60 card p-5">
              You're not in any groups yet — create one below, or ask a friend for their invite
              link.
            </p>
          ) : (
            <div className="space-y-3">
              {memberships.map((m) => (
                <Link key={m.group.id} href={`/g/${m.group.slug}`} className="card p-4 flex items-center justify-between">
                  <div>
                    <p className="font-extrabold text-lg">{m.group.name}</p>
                    {m.group.tagline && <p className="text-sm text-ink/60">{m.group.tagline}</p>}
                  </div>
                  <div className="text-sm text-ink/50 text-right shrink-0">
                    <p>{m.group._count.movies} movie nights</p>
                    <p>{m.group._count.members} members</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mb-8">
          <h2 className="font-extrabold text-xl mb-3">Start a new group</h2>
          <CreateGroupForm />
        </section>

        <section>
          <h2 className="font-extrabold text-xl mb-3">Have an invite link?</h2>
          <form action={goToGroup} className="card p-5 flex flex-col sm:flex-row gap-3">
            <input
              name="code"
              className="input"
              placeholder="Paste the group's link or code"
              required
            />
            <button type="submit" className="btn-secondary shrink-0">
              Go →
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
