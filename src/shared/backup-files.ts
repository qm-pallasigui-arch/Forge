import { BACKUP_LIMIT } from "./backup";
export async function saveBackup(text: string) {
  const { File, Paths } = await import("expo-file-system");
  const sharing = await import("expo-sharing");
  if (!await sharing.isAvailableAsync()) throw new Error("File sharing is unavailable on this device.");
  const file = new File(Paths.cache, `FitMap-backup-${Date.now()}.json`);
  file.write(text);
  // Android's chooser can return before the receiving app finishes reading.
  // Keep this temporary cache file available; the OS may reclaim app cache later.
  await sharing.shareAsync(file.uri, { mimeType: "application/json", dialogTitle: "Save your FitMap backup", UTI: "public.json" });
}
export async function pickBackup(): Promise<string | null> {
  const picker = await import("expo-document-picker");
  const result = await picker.getDocumentAsync({ type: ["application/json", "text/plain", "application/octet-stream"], copyToCacheDirectory: true, multiple: false });
  if (result.canceled) return null;
  const { File } = await import("expo-file-system");
  const file = new File(result.assets[0].uri);
  try { if (file.size > BACKUP_LIMIT) throw new Error("Backup exceeds the 5 MB limit."); return await file.text(); }
  finally { if (file.exists) file.delete(); }
}
