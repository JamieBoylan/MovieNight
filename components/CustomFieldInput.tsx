export interface CustomFieldLite {
  id: string;
  label: string;
  emoji: string;
  type: "BOOLEAN" | "TEXT" | "NUMBER" | "SELECT";
  options: string | null;
}

export default function CustomFieldInput({
  field,
  defaultValue,
}: {
  field: CustomFieldLite;
  defaultValue?: string | null;
}) {
  const name = `field_${field.id}`;

  if (field.type === "BOOLEAN") {
    return (
      <label className="chip cursor-pointer select-none">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultValue === "true"}
          className="w-4 h-4 accent-yellow-400"
        />
        <span>
          {field.emoji} {field.label}
        </span>
      </label>
    );
  }

  if (field.type === "SELECT") {
    const options = (field.options || "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
    return (
      <div>
        <label className="label">
          {field.emoji} {field.label}
        </label>
        <select name={name} defaultValue={defaultValue || ""} className="input">
          <option value="">—</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === "NUMBER") {
    return (
      <div>
        <label className="label">
          {field.emoji} {field.label}
        </label>
        <input
          type="number"
          step="any"
          name={name}
          defaultValue={defaultValue || ""}
          className="input"
        />
      </div>
    );
  }

  return (
    <div>
      <label className="label">
        {field.emoji} {field.label}
      </label>
      <input type="text" name={name} defaultValue={defaultValue || ""} className="input" />
    </div>
  );
}
