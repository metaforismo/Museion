# Curriculum architecture

Museion separates curriculum structure from course content and evidence.

`src/lib/curriculum` defines a strict graph of concept nodes, prerequisites, objectives, level, lesson linkage, and provenance. Validation rejects malformed nodes, dangling prerequisites, duplicate ids, and cycles. Recommendations include only uncompleted nodes whose prerequisites are complete.

The current graph is intentionally small: five Museion-authored lessons. It does not claim national-curriculum coverage.

## External alignment

Italian MIM and Chinese MOE standards may be represented as provenance-bearing alignment records after subject-expert review, version/status verification, translation review, and license review. Alignment is not the same as endorsement or complete coverage.

Marble is a candidate taxonomy source, not an imported dependency. Before any import, pin a version, verify manifest hashes, preserve upstream identifiers/provenance, document ODbL 1.0 database obligations and CC BY-SA 4.0 content obligations, separate third-party data from Museion-authored lessons, and publish the required notices. See [curriculum/MARBLE_INTEGRATION.md](curriculum/MARBLE_INTEGRATION.md).
