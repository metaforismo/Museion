# Curriculum architecture

Museion separates curriculum structure from course content and evidence.

`src/lib/curriculum` defines a strict graph of concept nodes, prerequisites, objectives, level, lesson linkage, and provenance. Validation rejects malformed nodes, dangling prerequisites, duplicate ids, and cycles. Recommendations include only uncompleted nodes whose prerequisites are complete.

The current graph is intentionally bounded: 24 Museion-authored lessons, including six connected course paths. `Algebra as Balance` develops relational equality, inverse operations, and two-step transfer; `Search by Halving` develops the sorted-input contract, binary-search invariant, and careful logarithmic reasoning; `Probability as Evidence` develops sample spaces, conditional evidence, and base rates; `Functions as Change` develops input-output rules, rate of change, linear models, and a fourth lesson where the learner manipulates vertex-form parameters against a target curve; `Claims to Evidence` develops operational definitions, observation versus inference, and falsifiable comparisons; `Samples to Conclusions` develops sampling frames, variability, and bounded estimates. Each path records sources, prerequisite assumptions, objectives, misconception coverage, and an evidence boundary. It does not claim national-curriculum coverage.

`CoursePathSchema` is the product-level contract for a designed sequence. It references registered lesson IDs but does not duplicate evaluator truth. Tests require every path lesson to exist in both the content registry and curriculum graph, and require each later path lesson to name the preceding lesson as a prerequisite.

## External alignment

Italian MIM and Chinese MOE standards may be represented as provenance-bearing alignment records after subject-expert review, version/status verification, translation review, and license review. Alignment is not the same as endorsement or complete coverage.

Marble is a candidate taxonomy source, not an imported dependency. Before any import, pin a version, verify manifest hashes, preserve upstream identifiers/provenance, document ODbL 1.0 database obligations and CC BY-SA 4.0 content obligations, separate third-party data from Museion-authored lessons, and publish the required notices. See [curriculum/MARBLE_INTEGRATION.md](curriculum/MARBLE_INTEGRATION.md).
