import type { Metadata } from "next";
import PublicPage from "@/components/PublicPage";
export const metadata: Metadata = { title: "Our method", description: "Learn from sources, try an idea, and reason through the next step with Maia.", alternates: { canonical: "/about" } };
export default function AboutPage() {
  return <PublicPage path="/about" eyebrow="A house for curious minds" title="Understanding takes a little doing." intro="Museion gives you a course to follow, a source to question, and Maia beside you when the next step is unclear." sections={[
    { id: "start", title: "Start with something worth understanding", body: <p>Choose a Museion Original or build from your own material. Originals are structured courses with authored activities, sources, and feedback. Your workspace keeps courses and progress together, so you can return to the idea you were working on.</p> },
    { id: "try", title: "Make your reasoning visible", body: <p>Predict, move an interactive element, explain a choice, or test a claim. Feedback responds to your attempt. A wrong turn gives you a useful place to look again; it does not end the lesson.</p> },
    { id: "maia", title: "A guide to the next step", body: <><p>Maia notices the current activity and the work you have submitted. She asks a focused question, gives a small hint, or connects the idea to a practical example. The aim is to help you make the next move yourself.</p><p>Guidance starts from the lesson and your observed attempts. Maia does not invent personal memories, grades, or claims about how much you know.</p></> },
    { id: "practice", title: "Give the idea another try", body: <p>An independent check lets you try a nearby problem without hints. Your dashboard uses recorded activity to suggest where to continue or practise. These observations help you choose what to do next; they are not a certificate of lasting mastery.</p> },
    { id: "sources", title: "Keep the source close", body: <p>Sources and quotations stay beside the lesson so you can inspect an explanation. AI guidance can be imperfect, and authored material can contain mistakes. Check the evidence, ask another question, and use the feedback to refine your reasoning.</p> },
  ]}/>;
}
