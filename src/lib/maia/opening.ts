import type { PublicStep } from "@/lib/content/types";

export interface MaiaOpeningMoment {
  kind: PublicStep["kind"];
  surface?: "recursion" | "sequence" | "range" | "trace";
  outcome: "untried" | "incorrect" | "correct";
  attempts?: number;
  independent?: boolean;
}

/** Only public surface type and engine-checked outcome enter this function.
 * No exercise text, answers, hint ladder, choice content or mastery is read.
 * The note is a UI invitation, never a model turn or persisted chat message. */
export function maiaOpeningNudge(moment?: MaiaOpeningMoment): { invitation: string; message: string } | null {
  if (moment?.independent) return null;
  if (moment?.outcome === "correct") return {
    invitation: "Explain the move that worked.",
    message: "You’ve checked this step. How would you explain your key move to someone else?",
  };
  if (moment?.outcome === "incorrect") return (moment.attempts ?? 1) > 1 ? {
    invitation: "Let’s revisit your last move.",
    message: "That attempt didn’t match yet. Let’s slow down: which assumption would you check first?",
  } : {
    invitation: "Let’s look at your reasoning.",
    message: "Your last attempt didn’t match. What were you thinking just before that answer?",
  };
  if (moment?.surface === "recursion") return {
    invitation: "Trace one call at a time.",
    message: "Track one function call at a time. What changes before the next call?",
  };
  if (moment?.surface === "sequence") return {
    invitation: "Find one dependency.",
    message: "Which step needs another step to happen first? Start with one pair.",
  };
  if (moment?.surface === "range") return {
    invitation: "Compare before narrowing.",
    message: "Compare the target with the midpoint. Which candidates can you rule out, and why?",
  };
  if (moment?.surface === "trace") return {
    invitation: "Track the next state.",
    message: "Track the bounds and midpoint. What changes after this comparison?",
  };
  switch (moment?.kind) {
    case "multipleChoice": return {
      invitation: "Make a prediction first.",
      message: "Before choosing, put the question in your own words. Which option fits your reasoning, and why?",
    };
    case "numeric": return {
      invitation: "What do the quantities mean?",
      message: "Before calculating, name what each quantity represents. What operation connects them?",
    };
    case "expression": return {
      invitation: "Break it into one small move.",
      message: "Read the expression one part at a time. Which operation would you do first, and why?",
    };
    case "graph": return {
      invitation: "Notice what changes on the graph.",
      message: "Compare the curves before changing the controls. What feature would you try to move first?",
    };
    default: return {
      invitation: "Start with what you notice.",
      message: "Put the question in your own words. What is one small move you could try?",
    };
  }
}
