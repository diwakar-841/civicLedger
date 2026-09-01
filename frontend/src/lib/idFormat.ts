function toDisplayId(prefix: string, id: string): string {
  return `${prefix}-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export const electionDisplayId = (id: string) => toDisplayId("ELC", id);
export const voterDisplayId = (id: string) => toDisplayId("VTR", id);
export const adminDisplayId = (id: string) => toDisplayId("ADM", id);
