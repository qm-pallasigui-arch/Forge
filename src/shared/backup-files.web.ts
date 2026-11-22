import { BACKUP_LIMIT } from "./backup";
export async function saveBackup(text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const link = document.createElement("a"); link.href = url; link.download = "FitMap-backup.json"; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function pickBackup(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input"); input.type = "file"; input.accept = ".json,application/json";
    input.oncancel = () => resolve(null);
    input.onchange = async () => { try { const file = input.files?.[0]; if (!file) return resolve(null); if (file.size > BACKUP_LIMIT) throw new Error("Backup exceeds the 5 MB limit."); resolve(await file.text()); } catch (error) { reject(error); } };
    input.click();
  });
}
