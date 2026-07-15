import type { Lesson } from "../types";

const lesson = {
  id: "binary-numbers",
  title: "Binary Numbers",
  track: "Computer Science",
  description:
    "How computers count with only two digits — read and write base-2 numbers from scratch.",
  concepts: ["binary-place-value", "binary-to-decimal", "decimal-to-binary"],
  steps: [
    {
      id: "step-1",
      concept: "binary-place-value",
      prompt:
        "In binary, each place is worth TWICE the place to its right (1, 2, 4, 8, …). What is the binary number 10 worth in decimal?",
      answer: { kind: "numeric", value: 2, tolerance: 0 },
      solution:
        "Binary 10 has a 1 in the twos place and a 0 in the ones place: 1×2 + 0×1 = 2. The same two symbols mean 'ten' in base ten and 'two' in base two — the base decides what each place is worth.",
      misconceptions: [
        {
          id: "reads-as-decimal",
          triggerAnswers: ["10"],
          description:
            "The learner read the digits as the decimal number ten.",
          remediationFocus:
            "Digits only have value through their place. In base 2, the places are worth 1, 2, 4, 8 — not 1, 10, 100.",
        },
      ],
      hints: [
        "Don't read it as 'ten'. What is each of the two places worth in base 2?",
        "The right place is worth 1, the next is worth 2. Which place holds the 1?",
      ],
    },
    {
      id: "step-2",
      concept: "binary-to-decimal",
      prompt: "What is binary 101 in decimal?",
      answer: { kind: "numeric", value: 5, tolerance: 0 },
      solution:
        "From right to left the places are worth 1, 2, 4. Binary 101 = 1×4 + 0×2 + 1×1 = 5.",
      misconceptions: [
        {
          id: "reads-as-decimal",
          triggerAnswers: ["101"],
          description:
            "The learner read the digits as the decimal number one hundred one.",
          remediationFocus:
            "In base 2 the places are worth 1, 2, 4 — convert each digit through its place value.",
        },
        {
          id: "counts-the-ones",
          triggerAnswers: ["2"],
          description:
            "The learner counted how many 1-digits there are instead of weighting them by place value.",
          remediationFocus:
            "Each 1 contributes its PLACE's value, not just 'one'. A 1 in the fours place contributes 4.",
        },
      ],
      hints: [
        "Write the place values above the digits: 4, 2, 1.",
        "Add up the place values where a 1 appears.",
      ],
    },
    {
      id: "step-3",
      concept: "binary-to-decimal",
      prompt: "One more read: what is binary 1101 in decimal?",
      answer: { kind: "numeric", value: 13, tolerance: 0 },
      solution:
        "Places from the right: 1, 2, 4, 8. Binary 1101 = 1×8 + 1×4 + 0×2 + 1×1 = 13.",
      misconceptions: [
        {
          id: "reads-as-decimal",
          triggerAnswers: ["1101"],
          description:
            "The learner read the digits as a decimal number again.",
          remediationFocus:
            "Four binary places are worth 8, 4, 2, 1 — weight each digit by its place.",
        },
      ],
      hints: [
        "Four digits means four place values: 8, 4, 2, 1.",
        "Three of the places hold a 1. Which three values do you add?",
      ],
    },
    {
      id: "step-4",
      concept: "decimal-to-binary",
      prompt:
        "Now write one yourself: what is the decimal number 6 in binary?",
      answer: { kind: "expression", acceptedForms: ["110", "0110"] },
      solution:
        "Find the powers of 2 that sum to 6: 4 + 2 = 6, so there is a 1 in the fours place, a 1 in the twos place and a 0 in the ones place: 110.",
      misconceptions: [
        {
          id: "writes-decimal",
          triggerAnswers: ["6"],
          description:
            "The learner wrote the decimal digit 6, which doesn't exist in base 2.",
          remediationFocus:
            "Binary only has the digits 0 and 1. The value 6 must be built from place values: which powers of 2 add up to 6?",
        },
      ],
      hints: [
        "Binary digits can only be 0 or 1. Which powers of 2 (1, 2, 4, 8) add up to 6?",
        "6 = 4 + 2. Put a 1 in those two places and a 0 in the ones place.",
      ],
    },
  ],
  practice: [
    {
      id: "practice-1",
      concept: "binary-to-decimal",
      prompt: "What is binary 111 in decimal?",
      answer: { kind: "numeric", value: 7, tolerance: 0 },
      solution: "Places 4, 2, 1 — all hold a 1: 4 + 2 + 1 = 7.",
      misconceptions: [
        {
          id: "reads-as-decimal",
          triggerAnswers: ["111"],
          description: "The learner read the digits as decimal one hundred eleven.",
          remediationFocus:
            "Weight each digit by its base-2 place value: 4, 2, 1.",
        },
        {
          id: "counts-the-ones",
          triggerAnswers: ["3"],
          description:
            "The learner counted the 1-digits instead of adding their place values.",
          remediationFocus:
            "Each 1 contributes its place's value: 4, 2 and 1 — not just 'one' each.",
        },
      ],
      hints: ["Three places: 4, 2, 1. Which hold a 1?"],
    },
    {
      id: "practice-2",
      concept: "binary-to-decimal",
      prompt: "What is binary 1010 in decimal?",
      answer: { kind: "numeric", value: 10, tolerance: 0 },
      solution: "Places 8, 4, 2, 1. Ones sit in the 8s and 2s places: 8 + 2 = 10.",
      misconceptions: [
        {
          id: "reads-as-decimal",
          triggerAnswers: ["1010"],
          description: "The learner read the digits as a decimal number.",
          remediationFocus:
            "Four binary places are worth 8, 4, 2, 1 — add the ones' places.",
        },
      ],
      hints: ["Write 8, 4, 2, 1 above the digits."],
    },
    {
      id: "practice-3",
      concept: "decimal-to-binary",
      prompt: "Write the decimal number 9 in binary.",
      answer: { kind: "expression", acceptedForms: ["1001", "01001"] },
      solution:
        "9 = 8 + 1, so there's a 1 in the eights place, 0s in the fours and twos places, and a 1 in the ones place: 1001.",
      misconceptions: [
        {
          id: "writes-decimal",
          triggerAnswers: ["9"],
          description: "The learner wrote the decimal digit 9.",
          remediationFocus:
            "Binary has only 0 and 1 — build 9 from powers of 2: which of 8, 4, 2, 1 add to 9?",
        },
      ],
      hints: ["Which powers of 2 sum to 9?"],
    },
  ],
} satisfies Lesson;

export default lesson;
