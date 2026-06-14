"use client";
import type { Profile } from "@/lib/types";

/** Seeded "log in as" switch. Hidden when there's only one identity. */
export default function LoginAsPicker({
  profiles,
  currentId,
  onChange,
  label = "Viewing as",
}: {
  profiles: Profile[];
  currentId: string | null;
  onChange: (id: string) => void;
  label?: string;
}) {
  if (profiles.length <= 1) return null;
  return (
    <label className="cw-loginas">
      <span>{label}</span>
      <select value={currentId ?? ""} onChange={(e) => onChange(e.target.value)}>
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.avatar_emoji ? `${p.avatar_emoji} ` : ""}
            {p.full_name}
          </option>
        ))}
      </select>
    </label>
  );
}
