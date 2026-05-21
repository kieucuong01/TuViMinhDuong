import { ImageResponse } from "next/og";
import { APP_NAME, APP_URL } from "@/lib/env";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "Lập lá số tử vi miễn phí";
  const subtitle = searchParams.get("subtitle") || "Xem lá số, xem ngày và luận giải dễ hiểu";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #fff7ed 0%, #ffffff 48%, #ecfdf5 100%)",
          color: "#1c1917",
          padding: 72,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div
            style={{
              width: 82,
              height: 82,
              borderRadius: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #fed7aa, #fff7ed 42%, #d1fae5)",
              border: "3px solid #fdba74",
              color: "#7c2d12",
              fontSize: 30,
              fontWeight: 900,
            }}
          >
            TH
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 34, fontWeight: 900 }}>{APP_NAME}</div>
            <div style={{ fontSize: 22, color: "#9a3412", fontWeight: 700 }}>Tinh tuyển lá số cho người Việt</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ maxWidth: 950, fontSize: 72, lineHeight: 1.05, fontWeight: 950, letterSpacing: -1 }}>
            {title}
          </div>
          <div style={{ maxWidth: 850, fontSize: 30, lineHeight: 1.35, color: "#57534e" }}>
            {subtitle}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 24, color: "#7c2d12", fontWeight: 800 }}>
          <span>Lá số • Luận cung • Đại vận • Xem ngày</span>
          <span>{APP_URL.replace(/^https?:\/\//, "")}</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
