function toDisplayId(prefix, id) {
  return `${prefix}-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export const electionDisplayId = (id) => {return toDisplayId("ELC", id);};
export const voterDisplayId = (id) => {return toDisplayId("VTR", id);};
export const adminDisplayId = (id) => {return toDisplayId("ADM", id);};