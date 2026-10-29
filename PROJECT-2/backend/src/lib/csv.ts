/**
 * RFC 4180 CSV cell escaping plus spreadsheet formula-injection protection.
 *
 * - Cells starting with = + - @ TAB or CR are prefixed with a single quote so
 *   Excel / Sheets treat them as text instead of executing them.
 * - The cell is always wrapped in double quotes and embedded quotes are
 *   doubled ("" ), which is what CSV parsers expect. (JSON.stringify escapes
 *   quotes as \" which is NOT valid CSV and corrupts any cell containing a
 *   double quote, e.g. JSON metadata.)
 */
export function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function csvRow(values: unknown[]): string {
  return values.map(csvCell).join(",");
}
