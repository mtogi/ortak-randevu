import { ImageResponse } from "next/og";
import catalog from "../../messages/en.json";

/** Wordmark is identical in EN and TR catalogs (`app.name`). */
const wordmark = catalog.app.name;

export const alt = wordmark;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Compact mark is a 32×32 master (docs/design/assets/logo/mark-compact.svg). */
const MARK = 256;
const SCALE = MARK / 32;
const PLATE = 30 * SCALE;
const PLATE_RADIUS = 9 * SCALE;
const RING_OUTER = 17 * SCALE;
const RING_BORDER = 3 * SCALE;
const DISC = 3.15 * 2 * SCALE;

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background: "#F4F7FB",
        gap: 40,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: MARK,
          height: MARK,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: PLATE,
            height: PLATE,
            borderRadius: PLATE_RADIUS,
            background: "#0069FF",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: RING_OUTER,
              height: RING_OUTER,
              borderRadius: 999,
              border: `${RING_BORDER}px solid #5EDFD7`,
            }}
          >
            <div
              style={{
                width: DISC,
                height: DISC,
                borderRadius: 999,
                background: "#FFFFFF",
              }}
            />
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 72,
          fontWeight: 650,
          color: "#061B31",
          letterSpacing: "-0.03em",
        }}
      >
        {wordmark}
      </div>
    </div>,
    { ...size },
  );
}
