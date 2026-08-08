import { ImageResponse } from "next/og";

export const alt = "Outdoor Copilot · 个人户外智能";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "64px 72px",
          background: "linear-gradient(135deg, #1a241c 0%, #2c3a2e 55%, #3f6b4a 100%)",
          color: "#f3efe6",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 4, color: "#e8d9c0" }}>
          OUTDOOR COPILOT
        </div>
        <div style={{ fontSize: 72, fontWeight: 700, marginTop: 18, lineHeight: 1.05 }}>
          个人户外智能
        </div>
        <div style={{ fontSize: 34, marginTop: 28, color: "#d9e0d6", maxWidth: 820 }}>
          先看清这条路对你有多难。Know the trail. Know yourself. Go smarter.
        </div>
      </div>
    ),
    { ...size },
  );
}
