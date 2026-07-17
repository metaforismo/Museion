import { ImageResponse } from "next/og";

export const alt = "Museion — reasoning, made visible";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ background: "#f4f6fa", color: "#131c31", display: "flex", height: "100%", padding: 72, position: "relative", width: "100%" }}>
      <div style={{ background: "radial-gradient(circle at top left, #e7ecfc, transparent 58%)", inset: 0, position: "absolute" }} />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", width: "100%" }}>
        <div style={{ alignItems: "center", display: "flex", fontSize: 30, fontWeight: 700, gap: 18 }}><svg width="66" height="66" viewBox="0 0 64 64"><path fill="#2b4acb" d="M32 4c11 0 15 10 21 17 5 6 10 10 9 19-1 10-10 13-18 18-7 4-16 4-23-1-6-4-9-10-14-14-7-6-6-16 0-22C14 15 18 4 32 4Z"/><path fill="#fff9ed" d="M17 26c6-2 11 0 15 5 4-5 9-7 15-5v18c-6-2-11 0-15 6-4-6-9-8-15-6V26Z"/><circle cx="32" cy="40" r="3.5" fill="#d9a514"/></svg>Museion</div>
        <div style={{ display: "flex", flexDirection: "column" }}><span style={{ color: "#20379b", fontSize: 20, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" }}>A source-grounded learning engine</span><span style={{ fontFamily: "Georgia", fontSize: 78, fontWeight: 700, letterSpacing: -3, lineHeight: 1.02, marginTop: 22 }}>Learn by reasoning,<br/><span style={{ color: "#2b4acb" }}>not by being told.</span></span></div>
        <div style={{ display: "flex", fontSize: 22, justifyContent: "space-between" }}><span>The engine owns truth.</span><span style={{ color: "#5b6478" }}>Maia owns questions.</span></div>
      </div>
    </div>,
    size,
  );
}
