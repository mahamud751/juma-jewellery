import { ImageResponse } from "next/og";

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
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 50% 40%, #1a2744 0%, #0c1018 46%, #07080c 78%)",
          color: "#f6f1e6",
        }}
      >
        <div style={{ fontSize: 108, letterSpacing: 22, fontWeight: 500 }}>JHUMA</div>
        <div style={{ marginTop: 18, fontSize: 24, letterSpacing: 8, color: "#e4c27a" }}>
          JEWELLERS · ZINDABAZAR
        </div>
      </div>
    ),
    size,
  );
}
