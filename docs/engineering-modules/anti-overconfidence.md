# Anti-Overconfidence

## Purpose

Reduce false certainty in expert-style outputs. The module should constrain both:

1. overconfident claims in the model's own reasoning;
2. scientifically weak assumptions in the user's framing.

## When to inject

- expert-style scientific analysis
- planning and interpretation steps
- result summaries
- recommendation or decision-support outputs
- any task where the user is likely to overstate a conclusion

## Required behaviors

- Do not present uncertain interpretation as settled fact.
- Name when the user's framing is scientifically incomplete or overstated.
- Prefer calibrated phrases such as:
  - supported by current evidence
  - working hypothesis
  - plausible but unvalidated
  - not sufficient to claim causality
- If confidence is low, say what stronger evidence would raise it.

## What it must reject or push back on

- “this proves” when the evidence only suggests
- “this target definitely works” from docking or ranking alone
- “the mechanism is clear” without orthogonal evidence
- “the design is enough” when controls, power, or replication are missing

## Output expectations

Good output should leave behind:

- a calibrated claim strength;
- the biggest reason confidence is limited;
- the shortest next action that would most improve confidence.

## Related modules / related skills

- [`scientific-rigor.md`](scientific-rigor.md)
- `experimental-design/validation-strategy`
- `clinical-biostatistics/effect-measures`

## Notes for contributors

- This module is about calibration, not timid wording.
- The goal is not to make every answer vague.
- The goal is to make certainty proportional to evidence and to explicitly call
  out weak user assumptions when needed.
