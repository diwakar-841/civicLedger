import { apiClient } from "./apiClient";

/**
 * Download a protected file (CSV export etc.).
 *
 * The API authenticates with an `Authorization: Bearer` header, which a plain
 * <a href> navigation can never send - the browser would get a 401 JSON body
 * and save that instead of the file. Fetching through apiClient attaches the
 * token (and transparently refreshes it), then we hand the blob to the browser.
 */
export async function downloadAuthenticatedFile(
  path: string,
  filename: string,
): Promise<void> {
  const response = await apiClient.get<Blob>(path, { responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}
