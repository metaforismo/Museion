import type { Lesson } from "../types";

const lesson = {
  id: "samples-to-conclusions-sampling-frame",
  title: "Samples to Conclusions: Check the Frame Before the Count",
  track: "Research Methods",
  description:
    "Name the group a conclusion concerns, inspect who can enter the sample, and recognize clear coverage gaps.",
  concepts: ["target-population", "sampling-frame", "coverage-bias"],
  steps: [
    {
      id: "step-1",
      concept: "target-population",
      prompt:
        "A school wants to describe how students travel to school this month. Which group is the target population?",
      answer: {
        kind: "multipleChoice",
        options: [
          "All students at the school this month.",
          "Only students who arrive before 7:30 a.m.",
          "Only members of the travel-survey team.",
        ],
        correctIndex: 0,
      },
      solution:
        "The intended conclusion is about how students at this school travel during this month, so all students at the school in that period are the target population. Early arrivals and survey-team members are narrower groups that leave out many students covered by the question.",
      misconceptions: [
        {
          id: "narrows-to-early-arrivals",
          triggerAnswers: ["1"],
          description: "The learner selected a timing-based subgroup rather than the whole group named in the question.",
          remediationFocus: "State who the conclusion is meant to describe before looking at how data are collected.",
        },
        {
          id: "narrows-to-survey-team",
          triggerAnswers: ["2"],
          description: "The learner confused the people collecting a survey with the people the survey is about.",
          remediationFocus: "Separate the investigators from the population described by the claim.",
        },
      ],
      hints: [
        "The target population is the full group the question wants to describe.",
        "The wording says ‘students travel to school,’ not ‘early students’ or ‘survey team.’",
        "Choose the option that includes every student covered by the month-long question.",
      ],
    },
    {
      id: "step-2",
      concept: "sampling-frame",
      prompt:
        "The survey is posted only in the school’s after-school robotics club chat. What is the sampling frame: the group that can be reached by this method?",
      answer: {
        kind: "multipleChoice",
        options: [
          "Students who are in the robotics club chat.",
          "All students at the school.",
          "Every student in the country.",
        ],
        correctIndex: 0,
      },
      solution:
        "A sampling frame is the reachable list or group from which a sample can actually be drawn. With this posting method, members of the robotics club chat are reachable. The target population may be all school students, but many of them are not in this frame.",
      misconceptions: [
        {
          id: "confuses-target-with-frame",
          triggerAnswers: ["1"],
          description: "The learner named the intended population instead of the reachable group.",
          remediationFocus: "Ask who has a real opportunity to be selected by the stated collection method.",
        },
        {
          id: "overextends-frame",
          triggerAnswers: ["2"],
          description: "The learner extended the reach of a local chat beyond its actual members.",
          remediationFocus: "Use the collection method, not the topic’s possible importance, to define reach.",
        },
      ],
      hints: [
        "A frame is about who can be reached, not who we wish to describe.",
        "Look at the specific place where the survey was posted.",
        "Choose the group with access to that club chat.",
      ],
    },
    {
      id: "step-3",
      concept: "coverage-bias",
      prompt:
        "Why is a conclusion about all students’ travel habits risky when the responses come only from the robotics club chat?",
      answer: {
        kind: "multipleChoice",
        options: [
          "Many students outside the chat could not be included, so the frame misses part of the target population.",
          "Robotics-club responses are always dishonest.",
          "A small group can never provide any useful information.",
        ],
        correctIndex: 0,
      },
      solution:
        "The risk is undercoverage: the reachable frame excludes students outside the chat. That does not make individual responses dishonest or useless. It means the result should be described as information from this reachable group, not automatically as a conclusion about every student.",
      misconceptions: [
        {
          id: "assumes-dishonesty",
          triggerAnswers: ["1"],
          description: "The learner attributed a coverage problem to respondent character rather than the collection method.",
          remediationFocus: "Focus on who had a chance to be included, not on an unsupported claim about honesty.",
        },
        {
          id: "treats-all-small-samples-as-worthless",
          triggerAnswers: ["2"],
          description: "The learner confused a limit on generalization with a claim that no small-group evidence can inform anything.",
          remediationFocus: "Describe what the observed group can support while keeping its coverage limit visible.",
        },
      ],
      hints: [
        "Compare the target population with the people who could actually see the survey.",
        "A coverage problem is about missing part of the intended group.",
        "Choose the option that names students outside the chat as unreachable by this method.",
      ],
    },
  ],
  practice: [
    {
      id: "practice-1",
      concept: "target-population",
      prompt:
        "Work unaided: A library wants to estimate which reading rooms are used by its visitors on Saturdays. What is the target population?",
      answer: {
        kind: "multipleChoice",
        options: [
          "Library visitors on Saturdays.",
          "Only visitors sitting near the front desk.",
          "Only library employees.",
        ],
        correctIndex: 0,
      },
      solution:
        "The question specifies library visitors on Saturdays, so that is the target population. Front-desk visitors and employees are possible subgroups, but neither matches the full group whose room use is being described.",
      misconceptions: [
        {
          id: "uses-convenient-location",
          triggerAnswers: ["1"],
          description: "The learner selected a convenient subset defined by location.",
          remediationFocus: "Start from the full group named in the question rather than the easiest people to observe.",
        },
        {
          id: "uses-staff-instead-of-visitors",
          triggerAnswers: ["2"],
          description: "The learner confused a group working in a setting with the group the question names.",
          remediationFocus: "Check whether the selected people are the people whose behavior the claim describes.",
        },
      ],
      hints: [
        "Read the words after ‘estimate’ carefully.",
        "The target population is defined by both visitor role and Saturday timing.",
        "Choose all Saturday visitors, not just the easiest subgroup to encounter.",
      ],
    },
    {
      id: "practice-2",
      concept: "sampling-frame",
      prompt:
        "Work unaided: A park survey link is printed only on posters at the north entrance. Who is in the sampling frame?",
      answer: {
        kind: "multipleChoice",
        options: [
          "Park visitors who pass the north-entrance posters.",
          "Every resident of the city.",
          "Only the people who designed the posters.",
        ],
        correctIndex: 0,
      },
      solution:
        "The stated reach is the people who pass the north-entrance posters and can see the link. City residents and poster designers are not defined by that opportunity to encounter the survey.",
      misconceptions: [
        {
          id: "extends-reach-to-city",
          triggerAnswers: ["1"],
          description: "The learner treated a local posting route as if it reached all residents.",
          remediationFocus: "Define a frame from the actual invitation path, not from the topic’s geographic area.",
        },
        {
          id: "uses-designers-not-recipients",
          triggerAnswers: ["2"],
          description: "The learner named people who created the invitation rather than people who can receive it.",
          remediationFocus: "Ask who can realistically be selected through the invitation method.",
        },
      ],
      hints: [
        "The frame follows the survey link’s path to potential respondents.",
        "Who can see the link under the stated poster placement?",
        "Choose visitors who pass the north entrance, where the posters are located.",
      ],
    },
    {
      id: "practice-3",
      concept: "coverage-bias",
      prompt:
        "Near transfer — work unaided: A clinic wants feedback from all appointment types but sends a survey only to people with online appointments. What is the clearest limit?",
      answer: {
        kind: "multipleChoice",
        options: [
          "People with non-online appointments are not reached, so the frame does not cover all appointment types.",
          "Online respondents cannot answer any question accurately.",
          "The survey proves that online appointments are best.",
        ],
        correctIndex: 0,
      },
      solution:
        "The collection method reaches online-appointment participants but misses other appointment types. This is a frame-coverage limitation. It does not establish that online respondents are inaccurate or that one appointment type is best.",
      misconceptions: [
        {
          id: "dismisses-respondents",
          triggerAnswers: ["1"],
          description: "The learner treated an incomplete frame as evidence that reachable respondents are inaccurate.",
          remediationFocus: "Separate who is missing from whether the included respondents can report their own experience.",
        },
        {
          id: "turns-coverage-into-ranking",
          triggerAnswers: ["2"],
          description: "The learner drew a value ranking that was not measured by the survey reach.",
          remediationFocus: "Name the coverage limit without adding an unsupported comparative conclusion.",
        },
      ],
      hints: [
        "The goal says ‘all appointment types,’ but the invitation names only one type.",
        "Look for the group that lacks a chance to appear in the data.",
        "Choose the statement that identifies non-online appointments as missing from the frame.",
      ],
    },
  ],
} satisfies Lesson;

export default lesson;
