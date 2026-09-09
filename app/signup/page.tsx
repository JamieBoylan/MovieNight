import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import SignupForm from "@/components/SignupForm";

export default async function SignupPage({
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
          <div className="text-4xl mb-2">🎬</div>
          <h1 className="text-2xl font-extrabold">Create your account</h1>
          <p className="text-ink/60 mt-1">Takes about ten seconds.</p>
        </div>
        <SignupForm next={searchParams.next} />
        <p className="text-center text-sm text-ink/60 mt-4">
          Already have an account?{" "}
          <Link
            href={`/login${searchParams.next ? `?next=${encodeURIComponent(searchParams.next)}` : ""}`}
            className="font-bold underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
