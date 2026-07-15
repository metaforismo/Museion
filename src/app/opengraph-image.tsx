import { ImageResponse } from "next/og";

export const alt = "Museion — reasoning, made visible";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ background: "#f4f6fa", color: "#131c31", display: "flex", height: "100%", padding: 72, position: "relative", width: "100%" }}>
      <div style={{ background: "radial-gradient(circle at top left, #e7ecfc, transparent 58%)", inset: 0, position: "absolute" }} />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", width: "100%" }}>
        <div style={{ alignItems: "center", display: "flex", fontSize: 30, fontWeight: 700, gap: 18 }}><span style={{ alignItems: "center", background: "#131c31", borderRadius: 18, color: "white", display: "flex", height: 66, justifyContent: "center", width: 66 }}>M</span>Museion</div>
        <div style={{ display: "flex", flexDirection: "column" }}><span style={{ color: "#20379b", fontSize: 20, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" }}>A source-grounded learning engine</span><span style={{ fontFamily: "Georgia", fontSize: 78, fontWeight: 700, letterSpacing: -3, lineHeight: 1.02, marginTop: 22 }}>Learn by reasoning,<br/><span style={{ color: "#2b4acb" }}>not by being told.</span></span></div>
        <div style={{ display: "flex", fontSize: 22, justifyContent: "space-between" }}><span>The engine owns truth.</span><span style={{ color: "#5b6478" }}>Maia owns questions.</span></div>
      </div>
    </div>,
    size,
  );
}
