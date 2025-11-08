// ===== robust parsing helpers (put above controller or inline) =====
export const parseMaybeArray = (value: unknown): string[] => {
  // undefined/null -> empty array
  if (value === undefined || value === null) return [];

  // already an array (e.g., if a JSON-parsing middleware provided it)
  if (Array.isArray(value)) return value.map(String).map(s => s.trim()).filter(Boolean);

  // if it's a string: may be CSV "a,b,c", or JSON '["a","b"]', or single value "a"
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return [];

    // if looks like JSON array -> try parse
    if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || trimmed.startsWith('"')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(String).map(s => s.trim()).filter(Boolean);
        // fallthrough to CSV fallback if parse produced something else
      } catch (e) {
        // not valid JSON — fall back to CSV below
      }
    }

    // CSV fallback (single string of comma-separated values)
    return trimmed.split(",").map(s => s.trim()).filter(Boolean);
  }

  // anything else: coerce to string and split
  return String(value).split(",").map(s => s.trim()).filter(Boolean);
};