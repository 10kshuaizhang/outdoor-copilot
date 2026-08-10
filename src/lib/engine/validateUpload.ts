import { detectTrackFormat, parseTrackXml, type TrackFormat } from "./parseTrack";

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_POINTS = 50_000;

export type UploadValidation =
  | {
      ok: true;
      xml: string;
      displayName: string;
      format: TrackFormat;
      pointsCount: number;
    }
  | { ok: false; message: string };

function displayNameFromFile(file: File): string {
  const base = file.name?.trim() || "上传路线";
  return base.replace(/\.(gpx|kml|xml|txt)$/i, "") || "上传路线";
}

function countGpxPoints(xml: string): number {
  return xml.match(/<(?:trkpt|rtept)\b/gi)?.length ?? 0;
}

function countKmlCoordTuples(xml: string): number {
  // Approximate: lon,lat pairs inside coordinates / gx:coord.
  const gx = xml.match(/<(?:[\w.-]+:)?(?:coord|gx:coord)\b/gi)?.length ?? 0;
  if (gx >= 2) return gx;
  const blocks = xml.match(/<coordinates\b[^>]*>[\s\S]*?<\/coordinates>/gi) ?? [];
  let n = 0;
  for (const block of blocks) {
    const inner = block.replace(/<\/?coordinates[^>]*>/gi, "");
    n += inner.split(/[\s\n\r]+/).filter((t) => /^-?\d/.test(t) && t.includes(","))
      .length;
  }
  return n;
}

/**
 * Validate an uploaded trail file (GPX or KML).
 * Prefer content sniffing: iOS often drops / ignores extensions.
 */
export async function readAndValidateTrackFile(
  file: File,
): Promise<UploadValidation> {
  if (file.size <= 0) {
    return { ok: false, message: "文件为空，请换一个 GPX / KML 再试。" };
  }
  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      message: "文件过大（上限 10MB）。请导出简化后的轨迹再上传。",
    };
  }

  let xml: string;
  try {
    xml = await file.text();
  } catch {
    return { ok: false, message: "无法读取该文件，请换一个 GPX / KML 再试。" };
  }

  if (xml.charCodeAt(0) === 0xfeff) {
    xml = xml.slice(1);
  }

  const name = (file.name || "").toLowerCase();
  const extensionLooksWrong =
    name.length > 0 &&
    !name.endsWith(".gpx") &&
    !name.endsWith(".kml") &&
    !name.endsWith(".xml") &&
    !name.endsWith(".txt");

  const format = detectTrackFormat(xml);
  if (!format) {
    return {
      ok: false,
      message: extensionLooksWrong
        ? "这不像轨迹文件。请选择 .gpx 或 .kml（两步路 / 六只脚 / Google 地球等导出均可）。"
        : "无法识别为有效 GPX / KML。请确认文件内含轨迹点，或改用示例路线。",
    };
  }

  const roughCount =
    format === "gpx" ? countGpxPoints(xml) : countKmlCoordTuples(xml);
  if (roughCount < 2) {
    // Content may still parse (unusual layouts) — verify with real parser.
    const parsed = parseTrackXml(xml, format);
    if (parsed.length < 2) {
      return {
        ok: false,
        message: "轨迹点太少，无法分析。请换一个包含完整路线的 GPX / KML。",
      };
    }
    if (parsed.length > MAX_POINTS) {
      return {
        ok: false,
        message: "轨迹点过多。请简化轨迹后再上传。",
      };
    }
    return {
      ok: true,
      xml,
      displayName: displayNameFromFile(file),
      format,
      pointsCount: parsed.length,
    };
  }

  if (roughCount > MAX_POINTS) {
    return {
      ok: false,
      message: "轨迹点过多。请简化轨迹后再上传。",
    };
  }

  // Ensure the chosen parser can actually extract points.
  const points = parseTrackXml(xml, format);
  if (points.length < 2) {
    return {
      ok: false,
      message: "无法从文件中解析出路线坐标。请确认是轨迹（LineString / Track），不是仅含地标点的地图。",
    };
  }

  return {
    ok: true,
    xml,
    displayName: displayNameFromFile(file),
    format,
    pointsCount: points.length,
  };
}

/** @deprecated Prefer readAndValidateTrackFile — kept for existing imports. */
export async function readAndValidateGpxFile(
  file: File,
): Promise<UploadValidation> {
  return readAndValidateTrackFile(file);
}
