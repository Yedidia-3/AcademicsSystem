// Unified P-Level / class status used across the Dean's modules
// (P-Levels, Distribution, Dashboard):
//   • Sleep    — no students imported yet (not created)
//   • Progress — students created but not yet distributed (incl. shuffled,
//                submitted, approved-but-not-distributed)
//   • Active   — distributed (class lists are live)

export interface PLevelLike {
  student_count?: number;
  class_count?: number;
  is_distributed?: boolean;
  any_distributed?: boolean;
}

export interface StatusMeta {
  key: "sleep" | "progress" | "active";
  label: string;
  color: string;
  bg: string;
}

export function pLevelStatus(pl: PLevelLike): StatusMeta {
  const students = pl.student_count ?? 0;
  if (students === 0) {
    return { key: "sleep", label: "Sleep", color: "#9A9A9A", bg: "#F4F4F6" };
  }
  if (pl.is_distributed || pl.any_distributed) {
    return { key: "active", label: "Active", color: "#1A7F4B", bg: "#F0FDF4" };
  }
  return { key: "progress", label: "Progress", color: "#D97706", bg: "#FEF3E8" };
}
