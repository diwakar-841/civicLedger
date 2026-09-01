export function rowsOf(result) {
  if (Array.isArray(result)) {
    return result;
  }
  if (result && typeof result === "object" && Array.isArray(result.rows)) {
    return result.rows;
  }
  return [];
}
