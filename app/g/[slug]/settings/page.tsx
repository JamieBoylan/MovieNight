import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import {
  removeMember,
  archiveCustomField,
  updateGroupDetails,
  deleteGroup,
  leaveGroup,
} from "@/app/g/[slug]/actions";
import CustomFieldForm from "@/components/CustomFieldForm";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import CopyLinkButton from "@/components/CopyLinkButton";

export default async function SettingsPage({ params }: { params: { slug: string } }) {
  const group = await prisma.group.findUnique({
    where: { slug: params.slug },
    include: {
      members: { include: { user: true }, orderBy: { joinedAt: "asc" } },
      customFields: { orderBy: { order: "asc" } },
    },
  });
  if (!group) notFound();

  const user = await getSessionUser();
  const me = user ? group.members.find((m) => m.userId === user.id) : undefined;
  const isOwner = me?.role === "OWNER";

  const updateDetails = updateGroupDetails.bind(null, group.id, group.slug);
  const deleteGroupAction = deleteGroup.bind(null, group.id);
  const leaveGroupAction = leaveGroup.bind(null, group.id, group.slug);

  const activeFields = group.customFields.filter((f) => !f.archived);

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold mb-1">Settings</h1>
        <p className="text-ink/60">Manage your group, members, and custom stats.</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-extrabold text-xl">Group details</h2>
        {isOwner ? (
          <form action={updateDetails} className="card p-4 space-y-3">
            <div>
              <label className="label">Group name</label>
              <input name="name" defaultValue={group.name} className="input" required maxLength={60} />
            </div>
            <div>
              <label className="label">Tagline</label>
              <input name="tagline" defaultValue={group.tagline || ""} className="input" maxLength={80} />
            </div>
            <button type="submit" className="btn-secondary">
              Save
            </button>
          </form>
        ) : (
          <div className="card p-4">
            <p className="font-bold">{group.name}</p>
            {group.tagline && <p className="text-ink/60 text-sm">{group.tagline}</p>}
            <p className="text-xs text-ink/40 mt-1">Only the group owner can edit these.</p>
          </div>
        )}
        <div>
          <p className="label mb-2">Invite people</p>
          <CopyLinkButton path={`/g/${group.slug}`} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-extrabold text-xl">Members</h2>
        <div className="card divide-y-2 divide-ink/10">
          {group.members.map((m) => (
            <div key={m.id} className="p-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-8 h-8 rounded-full border-2 border-ink flex items-center justify-center"
                  style={{ backgroundColor: m.color }}
                >
                  {m.emoji}
                </span>
                <span className="font-bold">
                  {m.user.name}
                  {user && m.userId === user.id && <span className="text-ink/40 font-normal"> (you)</span>}
                </span>
                {m.role === "OWNER" && <span className="badge">👑 Owner</span>}
              </div>
              {isOwner && m.role !== "OWNER" && (
                <form action={removeMember.bind(null, m.id, group.id, group.slug)}>
                  <ConfirmSubmitButton
                    message={`Remove ${m.user.name} and all of their ratings? This can't be undone.`}
                    className="btn-secondary btn-sm"
                  >
                    Remove
                  </ConfirmSubmitButton>
                </form>
              )}
            </div>
          ))}
        </div>
        {me && me.role !== "OWNER" && (
          <form action={leaveGroupAction}>
            <ConfirmSubmitButton
              message={`Leave ${group.name}? You can rejoin later with the invite link.`}
              className="btn-secondary btn-sm"
            >
              Leave group
            </ConfirmSubmitButton>
          </form>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-extrabold text-xl">Custom stats</h2>
        <p className="text-ink/60 text-sm -mt-2">
          Add whatever quirky fields your group tracks — a Bechdel test, a "Corv Cameo" tracker, a
          "muted but didn't realize" log. You decide.
        </p>
        {activeFields.length > 0 && (
          <div className="card divide-y-2 divide-ink/10">
            {activeFields.map((f) => (
              <div key={f.id} className="p-3 flex items-center justify-between gap-2">
                <div>
                  <span className="font-bold">
                    {f.emoji} {f.label}
                  </span>
                  <span className="text-xs text-ink/50 ml-2">
                    {f.type.toLowerCase()} · {f.scope === "MOVIE" ? "per movie" : "per rating"}
                  </span>
                </div>
                <form action={archiveCustomField.bind(null, f.id, group.id, group.slug)}>
                  <ConfirmSubmitButton
                    message={`Remove the "${f.label}" field? Past answers are kept but it'll disappear from new forms.`}
                    className="btn-secondary btn-sm"
                  >
                    Remove
                  </ConfirmSubmitButton>
                </form>
              </div>
            ))}
          </div>
        )}
        <CustomFieldForm groupId={group.id} groupSlug={group.slug} />
      </section>

      {isOwner && (
        <section className="space-y-3">
          <h2 className="font-extrabold text-xl text-rose-400">Danger zone</h2>
          <form
            action={deleteGroupAction}
            className="card p-4 border-rose-400 flex items-center justify-between gap-3"
          >
            <p className="text-sm text-ink/60">
              Delete this group and every movie night, rating, and member in it.
            </p>
            <ConfirmSubmitButton
              message={`Delete "${group.name}" forever? Every movie, rating, and member goes with it. This can't be undone.`}
              className="btn-danger btn-sm shrink-0"
            >
              Delete group
            </ConfirmSubmitButton>
          </form>
        </section>
      )}
    </div>
  );
}
