const MAX_BYTES = 10 * 1024 * 1024;
const MAX_POINTS = 50_000;

export type UploadValidation =
  | { ok: true; xml: string; displayName: string }
  | { ok: false; message: string };

function looksLikeGpx(xml: string): boolean {
  const head = xml.slice(0, 4000);
  return (
    /<gpx[\s>]/i.test(head) ||
    /<(?:trkpt|rtept)\b/i.test(xml) ||
    (/<\?xml/i.test(head) && /<(?:trk|rte)\b/i.test(xml))
  );
}

function displayNameFromFile(file: File): string {
  const base = file.name?.trim() || "上传路线";
  return base.replace(/\.gpx$/i, "") || "上传路线";
}

/**
 * Validate an uploaded trail file.
 * On iOS, the Files picker often strips or ignores .gpx extension filters,
 * and selected items may lack a .gpx suffix — so we prefer content sniffing.
 */
export async function readAndValidateGpxFile(
  file: File,
): Promise<UploadValidation> {
  if (file.size <= 0) {
    return { ok: false, message: "文件为空，请换一个 GPX 再试。" };
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
    return { ok: false, message: "无法读取该文件，请换一个 GPX 再试。" };
  }

  // Strip UTF-8 BOM if present (common from Windows / some watch exports).
  if (xml.charCodeAt(0) === 0xfeff) {
    xml = xml.slice(1);
  }

  const name = (file.name || "").toLowerCase();
  const extensionLooksWrong =
    name.length > 0 &&
    !name.endsWith(".gpx") &&
    !name.endsWith(".xml") &&
    !name.endsWith(".txt");

  if (!looksLikeGpx(xml)) {
    return {
      ok: false,
      message: extensionLooksWrong
        ? "这不像 GPX 轨迹文件。请选择 .gpx（或导出为 GPX 的路线文件）。"
        : "无法识别为有效 GPX。请确认文件内含轨迹点，或改用示例路线。",
    };
  }

  const pointMatches = xml.match(/<(?:trkpt|rtept)\b/gi);
  const count = pointMatches?.length ?? 0;
  if (count < 2) {
    return {
      ok: false,
      message: "轨迹点太少，无法分析。请换一个包含完整路线的 GPX。",
    };
  }
  if (count > MAX_POINTS) {
    return {
      ok: false,
      message: "轨迹点过多。请简化 GPX 后再上传。",
    };
  }

  return { ok: true, xml, displayName: displayNameFromFile(file) };
}
