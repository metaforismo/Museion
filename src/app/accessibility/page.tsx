import type { Metadata } from "next";
import PublicPage from "@/components/PublicPage";
import { LEGAL_OPERATOR } from "@/lib/site/config";
export const metadata: Metadata = { title: "Accessibility", description: "Keyboard navigation, reduced motion, readable layouts, and accessibility feedback in Museion.", alternates: { canonical: "/accessibility" } };
export default function AccessibilityPage() {
  return <PublicPage path="/accessibility" eyebrow="Room for different ways to learn" title="A clearer path through the page." intro="Museion is being built for keyboard, touch, and different screen sizes. These are the features and limits of the current local version." sections={[
    { id: "keyboard", title: "Navigate with a keyboard", body: <p>Use Tab to move between controls, Enter to follow links, and the Skip to content link to reach the main page. The compact navigation menu supports Escape. Material cards remain a native horizontal scroll region, and lesson controls have named actions.</p> },
    { id: "motion", title: "Choose less motion", body: <p>Enable Reduce motion in your device or browser settings. Museion then stops the rotating hero text, decorative floating motion, and scroll-linked material rail. Cards remain available through ordinary horizontal scrolling. Essential controls and course content remain visible.</p> },
    { id: "reading", title: "Read at your own size", body: <p>Layouts adapt to small screens and browser zoom. Forms use visible labels, validation messages, and clear focus states. Decorative images are hidden from assistive technology; meaningful illustrations and controls have text alternatives.</p> },
    { id: "limits", title: "What is still being checked", body: <p>Automated checks and browser reviews cover representative screens and interactions. This is not a declaration of full WCAG conformance. Interactive learning activities, generated material, voice features, and third-party source files may need further assistive-technology testing.</p> },
    { id: "feedback", title: "Help us remove a barrier", body: <p>Tell the operator which page or activity is difficult, what you expected, and your browser or assistive technology if you are comfortable sharing it. Contact: {LEGAL_OPERATOR.email}{LEGAL_OPERATOR.placeholder ? " (placeholder; replace before publication)" : ""}. Do not include passwords or verification codes.</p> },
  ]}/>;
}
