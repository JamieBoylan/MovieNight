import { logout } from "@/app/actions";

export default function UserMenu({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-ink/60">
        Logged in as <span className="font-bold text-ink">{name}</span>
      </span>
      <form action={logout}>
        <button type="submit" className="btn-secondary btn-sm">
          Log out
        </button>
      </form>
    </div>
  );
}
