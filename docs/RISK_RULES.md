# Risk and opportunity rules

Ballon TD checks 36 rules against everything entered for a person and shows the result in three places:

| Where | What you see |
| --- | --- |
| **Person → Overview** | *Risks & opportunities* card: every rule that fires for this person, with the detail, the suggested action and its owner |
| **Risks** (top navigation) | Every rule with how many people and groups it fires for. Click a rule to list them |
| **Export** | `Risk_Flags` sheet (one row per flag), risk counts and codes on `Employee_Summary`, and the rule table itself on `RiskRule` |

## How a rule is stored

The rules are rows in the **RiskRule** table (Library → Risk & opportunity → Risk rules). Each code has fixed logic in [`server/lib/risks.ts`](../server/lib/risks.ts). Everything else is read from the row, so it can be changed without touching code:

| Column | Meaning | Change it to… |
| --- | --- | --- |
| `threshold`, `thresholdUnit` | The number the rule compares against | make a rule stricter or looser |
| `severity` | High · Medium · Low · Opportunity | change the order and colour |
| `name`, `rule` | Wording shown in the app and export | match the client's language |
| `executiveAction`, `owner` | Suggested response and who owns it | match the client's governance |
| `active` | No = the rule is never checked | switch a rule off for a client |

People with status **Out of Scope** or **Left Company** are not checked.

## Scales

* **Competency levels** use the framework scale (technical 0–4, cross-functional 1–4). A *gap* is required level − current level; the current level is the latest completed assessment that is not a self-assessment.
* **Observation scores** are typed 1–5 on the observation grid. The rule thresholds come from a 0–4 scale, so the rules use **score − 1**. Example: R15 "overall below 3" fires when the grid average is below 4.
* **Shares** (R03, R20, R25, R34–R36) are decimals: 0.4 = 40 %.

## The rules

### Skill gaps and capability (assessment ratings against the role profile)

| Code | Fires when | Default | Severity |
| --- | --- | --- | --- |
| R01 Critical skill gap | Any rated skill is ≥ threshold levels below required | 2 levels | High |
| R02 Critical gap on a priority skill | A High-priority skill is ≥ threshold levels below required | 2 levels | High |
| R03 Broad capability shortfall | Share of rated skills below required ≥ threshold | 0.4 | High |
| R04 Technical readiness below target | Average gap over technical skills ≥ threshold | 1 level | Medium |
| R05 Cross-functional readiness below target | Average gap over cross-functional skills ≥ threshold | 0.5 level | Medium |
| R06 High-potential talent | ≥ threshold skills above required and no R01 gap | 5 skills | Opportunity |
| R07 No proficiency in a required skill | Level 0 on a skill that requires ≥ 1 | — | High |
| R08 Gaps in both frameworks | Average gap > 0 in technical **and** cross-functional | — | Medium |
| R09 Fully meets role requirements | No rated skill below required | — | Opportunity |
| R10 Subject-matter expert | Top of the scale on ≥ threshold skills | 3 skills | Opportunity |

Technical vs cross-functional is decided by the framework code: `TECH…` is technical, `LEX…` and `LEAD` are cross-functional.

### Behaviour (observed programme days)

Absent days are left out of the averages.

| Code | Fires when | Default | Severity |
| --- | --- | --- | --- |
| R11 Behavioural category below expectation | Any domain (Personal Effectiveness, Communication, Collaboration, Problem Solving, Leadership, Learning Agility) averages below threshold | 3 | Medium |
| R12 Low behaviour rating | Any single behaviour scored ≤ threshold | 2 | Low |
| R13 Low programme attendance | ≥ threshold observed days marked Absent | 2 days | High |
| R14 Leadership and agility below expectation | Average of Leadership + Learning Agility scores below threshold | 3 | Medium |
| R15 Overall below expectation | Average of the day averages below threshold | 3 | Medium |
| R16 Declining trend | Last day average − first day average ≤ −threshold | 0.3 | Medium |
| R17 Improving trend | Last day average − first day average ≥ threshold | 0.3 | Opportunity |
| R18 Strong behavioural performer | Overall average ≥ threshold | 3.5 | Opportunity |

### Development plan

| Code | Fires when | Default | Severity |
| --- | --- | --- | --- |
| R19 Hands-on labs not started | Lab collections are assigned and no lab is completed (a record *In Progress* with no count is treated as unknown, not zero) | 0 labs | High |
| R20 Hands-on labs behind plan | Some labs done but completed ÷ total below threshold | 0.25 | Medium |
| R21 Professional certification not defined | No certification record on the Professional track | — | Medium |
| R22 AI certification not defined | No certification record on the AI track | — | Medium |
| R23 No coaching recorded | No coaching session in the current cycle (enrolment or programme dates; all time when no dates) | — | High |
| R24 Training absence | A training record is No-show, Deferred, Incomplete or below 100 % attendance, or an observed day is Absent or Partial | — | Medium |
| R25 Cross-functional hours behind plan | Attended workshop and leadership-programme hours ÷ planned S5 hours below threshold (only when S5 plan actions have estimated hours) | 0.5 | Low |
| R26 AI certification training not attended | An AI certification is in the plan and no Certification Preparation course is completed or in progress | — | Medium |
| R27 Labs started but not completed | Labs started and completion below 100 % | — | Low |
| R28 Repeated training absence | ≥ threshold training records No-show, Deferred or 0 % attendance | 2 | High |
| R29 No training attended this cycle | No training completed, in progress or attended in the cycle | — | High |
| R30 Limited coaching | Exactly threshold coaching sessions in the cycle | 1 | Low |

### Assessment milestones

| Code | Fires when | Severity |
| --- | --- | --- |
| R31 Self-assessment outstanding | No completed self-assessment | Medium |
| R32 Validation interview outstanding | No completed validation interview | Medium |
| R33 Validation report not issued | Report status is Not Started | Low |

### Group view

Checked across the people in scope (everyone, or one client on the Risks page). Groups smaller than three people are skipped.

| Code | Group | Fires when | Default | Severity |
| --- | --- | --- | --- | --- |
| R34 Team at risk | People with the same line manager | Share with an R01 gap ≥ threshold | 0.5 | High |
| R35 Section at risk | People in the same section | Share with an R01 gap ≥ threshold | 0.5 | High |
| R36 Organisation-wide skill gap | Everyone rated on the same skill | Share below required ≥ threshold | 0.5 | High |

## Adding a rule

1. Add a row on Library → Risk rules with a new code (say `R37`), its wording, threshold and severity.
2. Add its check to `evaluatePerson` (or `evaluateGroup`) in `server/lib/risks.ts`, reading the threshold with `T('R37', default)`.
3. Add it to `server/seed/library/riskRules.json` so new databases get it, and run `npm run docs:library`.
