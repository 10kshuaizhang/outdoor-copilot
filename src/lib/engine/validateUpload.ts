const MAX_BYTES = 10 * 1024 * 1024;
const MAX_POINTS = 50_000;

export type UploadValidation =
  | { ok: true; xml: string }
  | { ok: false; message: string };

export async function readAndValidateGpxFile(
  file: File,
): Promise<UploadValidation> {
  const name = file.name.toLowerCase();
  if (!name.endsWith(".gpx")) {
    return {
      ok: false,
      message: "请上传 .gpx 文件。也可以改用下方示例路线。",
    };
  }
  if (file.size <= 0) {
    return { ok: false, message: "文件为空，请换一个 GPX 再试。" };
  }
  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      message: "文件过大（上限 10MB）。请导出简化后的轨迹再上传。",
    };
  }

  const xml = await file.text();
  if (!/<gpx[\s>]/i.test(xml) && !/<trkpt[\s>]/i.test(xml)) {
    return {
      ok: false,
      message: "无法识别为有效 GPX。请确认文件内容，或改用示例路线。",
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

  return { ok: true, xml };
}
