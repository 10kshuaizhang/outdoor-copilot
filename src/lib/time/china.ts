/** Product clock: China mainland (UTC+8). */

export const CHINA_TZ = "Asia/Shanghai";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Build an absolute instant for a Shanghai wall-clock on YYYY-MM-DD. */
export function shanghaiWallIso(
  dateYYYYMMDD: string,
  hour: number,
  minute: number,
): string {
  const day = /^\d{4}-\d{2}-\d{2}$/.test(dateYYYYMMDD)
    ? dateYYYYMMDD
    : new Date().toLocaleDateString("en-CA", { timeZone: CHINA_TZ });
  return new Date(
    `${day}T${pad2(hour)}:${pad2(minute)}:00+08:00`,
  ).toISOString();
}

/** HH:mm in Asia/Shanghai from an ISO instant. */
export function formatShanghaiClock(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: CHINA_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

/** Today's YYYY-MM-DD in Asia/Shanghai. */
export function shanghaiToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: CHINA_TZ });
}
