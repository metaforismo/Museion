import { CurriculumGraphSchema } from "./contracts";

export const museionFoundations = CurriculumGraphSchema.parse({
  schemaVersion: "1.0",
  id: "museion-foundations",
  title: "Museion foundations",
  nodes: [
    { id: "negative-numbers", title: "Working with Negative Numbers", subject: "Arithmetic", level: "foundation", lessonId: "negative-numbers", prerequisiteIds: [], objective: "Reason about signed quantities and operations on the number line.", provenance: { kind: "museion-authored", label: "Museion authored lesson", url: null } },
    { id: "order-of-operations", title: "Order of Operations", subject: "Arithmetic", level: "foundation", lessonId: "order-of-operations", prerequisiteIds: [], objective: "Apply operation precedence and explain each grouping decision.", provenance: { kind: "museion-authored", label: "Museion authored lesson", url: null } },
    { id: "fractions-unlike-denominators", title: "Unlike Denominators", subject: "Arithmetic", level: "developing", lessonId: "fractions-unlike-denominators", prerequisiteIds: ["order-of-operations"], objective: "Build equivalent fractions before combining quantities.", provenance: { kind: "museion-authored", label: "Museion authored lesson", url: null } },
    { id: "linear-equations-intro", title: "Solving Linear Equations", subject: "Algebra", level: "developing", lessonId: "linear-equations-intro", prerequisiteIds: ["negative-numbers", "order-of-operations"], objective: "Preserve equality while isolating an unknown.", provenance: { kind: "museion-authored", label: "Museion authored lesson", url: null } },
    { id: "binary-numbers", title: "Binary Numbers", subject: "Computer Science", level: "extension", lessonId: "binary-numbers", prerequisiteIds: ["order-of-operations"], objective: "Connect positional notation to powers of two.", provenance: { kind: "museion-authored", label: "Museion authored lesson", url: null } },
  ],
});
