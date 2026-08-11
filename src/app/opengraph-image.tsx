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
          background:
            "linear-gradient(135deg, #0c2226 0%, #163338 48%, #1f4f52 78%, #c97b8a 160%)",
          color: "#f0f4f5",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 480,
            height: 480,
            background:
              "radial-gradient(circle, rgba(232,213,208,0.28) 0%, transparent 70%)",
          }}
        />
        <div style={{ fontSize: 26, letterSpacing: 6, color: "#e8d5d0" }}>
          OUTDOOR COPILOT
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            marginTop: 18,
            lineHeight: 1.05,
          }}
        >
          个人户外智能
        </div>
        <div
          style={{
            fontSize: 34,
            marginTop: 28,
            color: "#d7e4e6",
            maxWidth: 820,
          }}
        >
          先看清这条路对你有多难。
        </div>
      </div>
    ),
    { ...size },
  );
}
