import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const user = await getSessionUser();
  if (user) redirect(searchParams.next || "/");

  return (
    <main className="min-h-screen px-4 py-16">
      <div className="max-w-sm mx-auto">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🍿</div>
          <h1 className="text-2xl font-extrabold">Welcome back</h1>
        </div>
        <LoginForm next={searchParams.next} />
        <p className="text-center text-sm text-ink/60 mt-4">
          New here?{" "}
          <Link
            href={`/signup${searchParams.next ? `?next=${encodeURIComponent(searchParams.next)}` : ""}`}
            className="font-bold underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
