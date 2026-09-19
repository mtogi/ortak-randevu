import { ImageResponse } from "next/og";

/** Full-bleed; iOS applies the home-screen mask. Geometry matches mark-compact. */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "#0069FF",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 62,
            height: 62,
            borderRadius: 999,
            border: "17px solid #5EDFD7",
          }}
        >
          <div
            style={{
              width: 35,
              height: 35,
              borderRadius: 999,
              background: "#FFFFFF",
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
