export default function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="card p-4 text-center">
      <p className="text-xs font-bold uppercase tracking-wide text-ink/50">{label}</p>
      <p className="text-3xl font-extrabold mt-1">{value}</p>
      {sub && <p className="text-xs text-ink/50 mt-0.5">{sub}</p>}
    </div>
  );
}
