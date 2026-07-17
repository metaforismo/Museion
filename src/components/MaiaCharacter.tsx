import type { SVGProps } from "react";

export type MaiaState = "attentive" | "curious" | "thinking" | "celebrating" | "redirecting";

export default function MaiaCharacter({
  state = "attentive",
  className,
  title,
  ...props
}: { state?: MaiaState; className?: string; title?: string } & SVGProps<SVGSVGElement>) {
  const curious = state === "curious";
  const thinking = state === "thinking";
  const celebrating = state === "celebrating";
  const redirecting = state === "redirecting";
  return (
    <svg viewBox="0 0 180 210" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title} {...props}>
      <path fill="#2b4acb" d="M96 8c-7 27-4 45 13 61 22 21 39 42 37 74-2 35-24 58-58 58-37 0-61-24-60-59 1-21 13-38 28-56C74 64 85 42 96 8Z" />
      <path fill="#fff9ed" d="M55 78c3 29 14 43 35 55 18 11 19 32 1 55-30-10-43-33-35-57 4-13 5-30-1-53Z" />
      <path fill="#d9a514" d="M88 129c19 17 19 34 2 55-17-8-22-22-15-35 3-7 8-13 13-20Z" />
      {celebrating && <path fill="#2b4acb" d="M37 116 7 91l10 47 27 13Zm103-1 31-27-12 49-25 14Z" />}
      {redirecting && <path fill="#2b4acb" d="m138 123 36-12-17 19 20 7-39 13Z" />}
      {thinking && <path fill="#2b4acb" d="M132 128c21 4 26 19 17 32-8 11-20 4-24-7Z" />}
      <g fill="#fff9ed">
        <ellipse cx="78" cy={curious ? 104 : 108} rx="8" ry="10" />
        <ellipse cx="111" cy={curious ? 98 : 108} rx="8" ry="10" />
      </g>
      <g fill="#131c31">
        <circle cx={curious ? 81 : 80} cy={curious ? 101 : 109} r="3.2" />
        <circle cx={curious ? 114 : 109} cy={curious ? 95 : 109} r="3.2" />
      </g>
      {thinking && <path d="M70 94q8-7 16 0m17-2q8-7 16 0" fill="none" stroke="#fff9ed" strokeLinecap="round" strokeWidth="3" />}
      {celebrating && <path d="M72 96q8-9 16 0m15 0q8-9 16 0" fill="none" stroke="#fff9ed" strokeLinecap="round" strokeWidth="3" />}
      {curious && <path d="M70 87q8-8 16-1m18-8q8-3 15 4" fill="none" stroke="#fff9ed" strokeLinecap="round" strokeWidth="3" />}
      <path d={celebrating ? "M83 119q9 8 18 0" : thinking ? "M86 122q7-4 14 1" : "M86 121q7 4 14 0"} fill="none" stroke="#fff9ed" strokeLinecap="round" strokeWidth="3" />
      {curious && <text x="137" y="62" fill="#d9a514" fontSize="30" fontWeight="700">?</text>}
      {celebrating && <g fill="#d9a514"><circle cx="56" cy="34" r="5"/><circle cx="128" cy="43" r="4"/><path d="m88 30 5 12 12 5-12 5-5 12-5-12-12-5 12-5Z"/></g>}
      {thinking && <g fill="#d9a514"><circle cx="135" cy="67" r="4"/><circle cx="146" cy="52" r="6"/><circle cx="153" cy="31" r="9"/></g>}
    </svg>
  );
}
