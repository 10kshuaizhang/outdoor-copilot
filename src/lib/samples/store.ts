import { promises as fs } from "node:fs";
import path from "node:path";
import { analyzeRoute } from "@/lib/engine/analyzeRoute";
import { detectTrackFormat, parseTrackXml } from "@/lib/engine/parseTrack";
import type { SampleFormat, SampleManifest, SampleMeta, SampleRecord } from "./types";

const MANIFEST_NAME = "manifest.json";

function defaultDataDir(): string {
  if (process.env.SAMPLES_DATA_DIR?.trim()) {
    return path.resolve(process.env.SAMPLES_DATA_DIR.trim());
  }
  // Vercel / serverless: only /tmp is writable (ephemeral).
  if (process.env.VERCEL) {
    return path.join("/tmp", "outdoor-copilot-samples");
  }
  return path.join(process.cwd(), "data", "samples");
}

function seedDir(): string {
  return path.join(process.cwd(), "public", "samples");
}

export function getSamplesDataDir(): string {
  return defaultDataDir();
}

export function publicSampleMeta(record: SampleRecord): SampleMeta {
  return {
    id: record.id,
    name: record.name,
    region: record.region,
    blurb: record.blurb,
    stats: record.stats,
    file: `/api/samples/${encodeURIComponent(record.id)}/track`,
  };
}

function sanitizeId(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function makeSampleId(name: string, existing: Set<string>): string {
  const base = sanitizeId(name) || `route-${Date.now().toString(36)}`;
  if (!existing.has(base)) return base;
  let i = 2;
  while (existing.has(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}

export function computeStatsFromXml(xml: string): string | undefined {
  try {
    const points = parseTrackXml(xml);
    if (points.length < 2) return undefined;
    const analysis = analyzeRoute({
      points,
      weather: { source: "fallback" },
    });
    return `约 ${analysis.route.distanceKm.toFixed(1)} km · +${analysis.route.elevationGainM} m`;
  } catch {
    return undefined;
  }
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function readManifestFile(dir: string): Promise<SampleManifest | null> {
  const file = path.join(dir, MANIFEST_NAME);
  if (!(await pathExists(file))) return null;
  const raw = await fs.readFile(file, "utf8");
  const parsed = JSON.parse(raw) as SampleManifest | SampleRecord[];
  // Support legacy array seed + new wrapped manifest.
  if (Array.isArray(parsed)) {
    return {
      version: 1,
      samples: parsed.map((s) => normalizeSeedRecord(s as SampleRecord)),
    };
  }
  if (parsed && Array.isArray(parsed.samples)) {
    return {
      version: 1,
      samples: parsed.samples.map(normalizeSeedRecord),
    };
  }
  return { version: 1, samples: [] };
}

function normalizeSeedRecord(
  s: Partial<SampleRecord> & { id: string; name: string; file?: string },
): SampleRecord {
  const trackFile =
    s.trackFile ||
    (s.file ? path.basename(s.file) : `${s.id}.gpx`);
  const format: SampleFormat =
    s.format === "kml" || trackFile.toLowerCase().endsWith(".kml")
      ? "kml"
      : "gpx";
  return {
    id: s.id,
    name: s.name,
    region: s.region ?? "",
    blurb: s.blurb ?? "",
    stats: s.stats,
    trackFile,
    format,
    updatedAt: s.updatedAt ?? new Date().toISOString(),
    file: `/api/samples/${encodeURIComponent(s.id)}/track`,
  };
}

async function writeManifest(dir: string, manifest: SampleManifest): Promise<void> {
  await ensureDir(dir);
  const file = path.join(dir, MANIFEST_NAME);
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(manifest, null, 2), "utf8");
  await fs.rename(tmp, file);
}

/** Copy bundled public/samples into the writable data dir once. */
export async function seedSamplesIfNeeded(dir = defaultDataDir()): Promise<void> {
  await ensureDir(dir);
  const manifestPath = path.join(dir, MANIFEST_NAME);
  if (await pathExists(manifestPath)) return;

  const seed = seedDir();
  const seedManifest = await readManifestFile(seed);
  if (!seedManifest || seedManifest.samples.length === 0) {
    await writeManifest(dir, { version: 1, samples: [] });
    return;
  }

  const samples: SampleRecord[] = [];
  for (const item of seedManifest.samples) {
    const srcName = item.trackFile || path.basename(item.file || "");
    const src = path.join(seed, srcName);
    if (!(await pathExists(src))) continue;
    const destName = srcName;
    await fs.copyFile(src, path.join(dir, destName));
    samples.push({
      ...item,
      trackFile: destName,
      file: `/api/samples/${encodeURIComponent(item.id)}/track`,
      updatedAt: item.updatedAt || new Date().toISOString(),
    });
  }
  await writeManifest(dir, { version: 1, samples });
}

export async function listSampleRecords(): Promise<SampleRecord[]> {
  const dir = defaultDataDir();
  await seedSamplesIfNeeded(dir);
  const manifest = await readManifestFile(dir);
  return manifest?.samples ?? [];
}

export async function listPublicSamples(): Promise<SampleMeta[]> {
  const records = await listSampleRecords();
  return records.map(publicSampleMeta);
}

export async function getSampleRecord(id: string): Promise<SampleRecord | null> {
  const records = await listSampleRecords();
  return records.find((s) => s.id === id) ?? null;
}

export async function readSampleTrack(
  id: string,
): Promise<{ xml: string; format: SampleFormat; filename: string } | null> {
  const record = await getSampleRecord(id);
  if (!record) return null;
  const dir = defaultDataDir();
  const dirResolved = path.resolve(dir);
  const filePath = path.resolve(dir, record.trackFile);
  const rel = path.relative(dirResolved, filePath);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  if (!(await pathExists(filePath))) return null;
  const xml = await fs.readFile(filePath, "utf8");
  return { xml, format: record.format, filename: record.trackFile };
}

export type UpsertSampleInput = {
  id?: string;
  name: string;
  region: string;
  blurb: string;
  stats?: string;
  xml: string;
  filenameHint?: string;
};

export async function createSample(input: UpsertSampleInput): Promise<SampleRecord> {
  const dir = defaultDataDir();
  await seedSamplesIfNeeded(dir);
  const manifest = (await readManifestFile(dir)) ?? { version: 1 as const, samples: [] };

  const format = detectTrackFormat(input.xml);
  if (!format) {
    throw new Error("无法识别为 GPX / KML 轨迹");
  }
  const points = parseTrackXml(input.xml, format);
  if (points.length < 2) {
    throw new Error("轨迹点太少，无法作为示例");
  }

  const ids = new Set(manifest.samples.map((s) => s.id));
  const id = input.id?.trim()
    ? sanitizeId(input.id) || makeSampleId(input.name, ids)
    : makeSampleId(input.name, ids);
  if (ids.has(id)) {
    throw new Error(`示例 id 已存在：${id}`);
  }

  const ext = format === "kml" ? "kml" : "gpx";
  const trackFile = `${id}.${ext}`;
  await fs.writeFile(path.join(dir, trackFile), input.xml, "utf8");

  const record: SampleRecord = {
    id,
    name: input.name.trim(),
    region: input.region.trim(),
    blurb: input.blurb.trim(),
    stats: input.stats?.trim() || computeStatsFromXml(input.xml),
    trackFile,
    format,
    updatedAt: new Date().toISOString(),
    file: `/api/samples/${encodeURIComponent(id)}/track`,
  };

  manifest.samples.push(record);
  await writeManifest(dir, manifest);
  return record;
}

export type UpdateSampleInput = {
  name?: string;
  region?: string;
  blurb?: string;
  stats?: string;
  xml?: string;
};

export async function updateSample(
  id: string,
  input: UpdateSampleInput,
): Promise<SampleRecord> {
  const dir = defaultDataDir();
  await seedSamplesIfNeeded(dir);
  const manifest = (await readManifestFile(dir)) ?? { version: 1 as const, samples: [] };
  const idx = manifest.samples.findIndex((s) => s.id === id);
  if (idx < 0) throw new Error("示例不存在");

  const current = manifest.samples[idx];
  let trackFile = current.trackFile;
  let format = current.format;
  let stats = input.stats !== undefined ? input.stats.trim() : current.stats;

  if (input.xml != null) {
    const detected = detectTrackFormat(input.xml);
    if (!detected) throw new Error("无法识别为 GPX / KML 轨迹");
    const points = parseTrackXml(input.xml, detected);
    if (points.length < 2) throw new Error("轨迹点太少，无法作为示例");
    format = detected;
    const ext = format === "kml" ? "kml" : "gpx";
    trackFile = `${id}.${ext}`;
    await fs.writeFile(path.join(dir, trackFile), input.xml, "utf8");
    if (current.trackFile !== trackFile) {
      try {
        await fs.unlink(path.join(dir, current.trackFile));
      } catch {
        // ignore missing old file
      }
    }
    if (input.stats === undefined) {
      stats = computeStatsFromXml(input.xml) ?? stats;
    }
  }

  const next: SampleRecord = {
    ...current,
    name: input.name?.trim() ?? current.name,
    region: input.region?.trim() ?? current.region,
    blurb: input.blurb?.trim() ?? current.blurb,
    stats,
    trackFile,
    format,
    updatedAt: new Date().toISOString(),
    file: `/api/samples/${encodeURIComponent(id)}/track`,
  };
  manifest.samples[idx] = next;
  await writeManifest(dir, manifest);
  return next;
}

export async function deleteSample(id: string): Promise<void> {
  const dir = defaultDataDir();
  await seedSamplesIfNeeded(dir);
  const manifest = (await readManifestFile(dir)) ?? { version: 1 as const, samples: [] };
  const idx = manifest.samples.findIndex((s) => s.id === id);
  if (idx < 0) throw new Error("示例不存在");
  const [removed] = manifest.samples.splice(idx, 1);
  await writeManifest(dir, manifest);
  try {
    await fs.unlink(path.join(dir, removed.trackFile));
  } catch {
    // ignore
  }
}

export async function samplesStorageInfo(): Promise<{
  dataDir: string;
  writable: boolean;
  ephemeral: boolean;
  count: number;
}> {
  const dataDir = defaultDataDir();
  let writable = false;
  try {
    await ensureDir(dataDir);
    const probe = path.join(dataDir, `.write-probe-${Date.now()}`);
    await fs.writeFile(probe, "ok");
    await fs.unlink(probe);
    writable = true;
  } catch {
    writable = false;
  }
  const records = writable ? await listSampleRecords() : [];
  return {
    dataDir,
    writable,
    ephemeral: Boolean(process.env.VERCEL),
    count: records.length,
  };
}
