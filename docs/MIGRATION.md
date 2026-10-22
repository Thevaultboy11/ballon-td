# Loading a client's legacy workbooks

How the spreadsheets a client already keeps (people register, rating export, training log, observation toolkit, coaching tracker, IDP sheets, lab overview, risk rules) map onto Ballon TD. Use it when a new client hands over their files, or when someone asks "where does column X go?".

Everything below has a home in the schema. Fields that used to have *no direct home* now have one (see [New fields](#new-fields-for-legacy-data)).

## Which legacy row becomes which record

| Legacy record | Ballon TD record(s) | Match on | Notes |
| --- | --- | --- | --- |
| People register row | **Employee** + **Enrollment** | lower-cased email | Source = *Excel from client*. Milestone flags become Assessment rows (see value mapping) |
| Rating export row (person × competency) | **Assessment** (Validation Interview or Consultant Assessment) + **AssessmentRating** | email + competency code | Required level and priority come from the role profile; the gap is calculated, never imported |
| Distinct (job role, competency) pairs | **JobRole** + **RoleRequirement** | role + competency code | Already loaded by `npm run db:seed` (620 pairs) |
| Competency descriptions | **Framework**, **CompetencyCategory**, **Competency** | competency code | Already loaded (160) |
| Behaviour descriptors | **CompetencyBehavior** | competency + level + sequence | Already loaded (3,244; one exact duplicate dropped) |
| Training log row | **Course** + **CourseSession** + **TrainingRecord** | email + training record code | One record per person per session |
| Behaviour scores by day (programme database) | **TrainingRecord** + **ObservationDay** + 25 **ObservationScore** | email + record code + day | Day narratives go to ObservationDay notes |
| Observation toolkit `Day_n` row | **ObservationDay** (day *n*) + 25 **ObservationScore** | attendee + day | Score label "4 - …" → 4 |
| Baseline survey row | **BaselineSurvey** | attendee | Years, six self-ratings and personality type each have a column |
| Coaching log row | **CoachingSession** (Completed) | email + date | Type, minutes and notes from the coachee tracker |
| Coaching tracker row | **CoachingSession** with S1–S5 / DTN progress and notes | coachee + date | Total effort is calculated |
| Capability gap progress (coach) | **Evidence** with *Behaviour descriptor* + *Progress (1–5)* | coachee + skill + descriptor | One row per descriptor validated |
| Capability gap progress (line manager, monthly) | **ManagerValidation** (*Validated level*) | coachee + skill + month | Round decimals (see notes) |
| IDP certification row | **Certification** + **CertificationRecord** (professional and AI) + **IdpAction** (S1, S3) | email + certification | Match spellings with *Other spellings* on the certification |
| IDP segment row | **IdpAction** × 6 with *Plan segment* S1–S5 / DTN | email | Text times → decimal hours |
| Hands-on lab overview row | **TrainingRecord** on the `LAB-…` course, with *Labs completed* / *Labs total* | email + collection | Status from the started / complete flags |
| Risk rules row | **RiskRule** | rule ID | Already loaded (36) |

## Value mapping

| Legacy field | Legacy value | Ballon TD field | Value |
| --- | --- | --- | --- |
| Self-assessment | Done / Not Done | Assessment (Self-Assessment) status | Completed / Not Started |
| Validation interview | Done / Not Done | Assessment (Validation Interview) status | Completed / Not Started |
| Validation interview report | Sent / Prepared / Not Started | Assessment report status | Delivered / In Review / Not Started |
| Any milestone | N/A | Employee status | Out of Scope |
| Cross-functional training | Started / Not Started | Enrollment status | Active / Enrolled |
| Attendance + status | Attended + Completed | TrainingRecord status / attendance % | Completed / 100 |
| Attendance + status | Partially Attended + Completed | TrainingRecord | Completed with the partial % (confirm) or Incomplete |
| Attendance + status | Absent + Need to be rescheduled | TrainingRecord status | Deferred |
| Attendance + status | Absent + Left the Session | TrainingRecord status | Incomplete |
| Attendance + status | Absent + Completed (inconsistent) | TrainingRecord status | No-show (review) |
| Mode | Face-to-Face | CourseSession mode | In-person |
| Day attendance | Attended / Partially Attended / Absent | ObservationDay attendance | Present / Partial / Absent |
| Training type | Cross-Functional | Course type | Workshop (one day) or Leadership Programme (observed, several days) |
| Training type | AI-CERT | Course type | Certification Preparation |
| Priority | 2 / 3 | RoleRequirement priority | High / Medium |
| Certification status | Not specified (certification present) | CertificationRecord status | Assigned |
| Certification status | Not listed | — | no record; rules R21 / R22 fire |
| Lab started / complete flags | False/False · True/False · True/True | TrainingRecord status | Not Started · In Progress · Completed |
| Toolkit score label | "n - …" | ObservationScore score | n (1–5) |
| Toolkit assessor note | contains "absent" | ObservationDay attendance | Absent (no scores) |
| Coaching tracker progress | 1–5 | ManagerValidation validated level / Evidence progress | 1–5 |
| Segment time | "9 HR 35 MIN" | IdpAction estimated hours | 9.58 |
| Grade in job title | Analyst … VP | JobRole seniority | see [LIBRARY.md](LIBRARY.md#role-profiles) |

## New fields for legacy data

These used to have no column. They now do, so nothing has to go into free-text notes.

| Legacy data | Where it goes now |
| --- | --- |
| Years with the organisation, total years of experience | BaselineSurvey `yearsWithOrganisation`, `totalYearsExperience` |
| Personality type (MBTI) | BaselineSurvey `mbti` (personal data: leave it out of client-wide exports if not needed) |
| Six baseline self-ratings | BaselineSurvey `confidence` … `organisation` (lists *Baseline: …*, values "1 - …" to "5 - …") |
| Evidence strength, leadership potential, timeframe, classification | Calculated on the person page and in `Employee_Summary` (never stored) |
| Lab counts (completed / total) | TrainingRecord `labsCompleted`, `labsTotal`; Course `labsTotal` for the collection size |
| Validated and target level per observed participant | TrainingRecord `validatedLevel`, `targetLevel` |
| Risk rules | RiskRule table |
| Workplace application assessment | IdpAction of type *Project Assignment* linked to the competency, or Evidence of type *Workplace Assignment* |
| Source system IDs | `externalId` on Framework, CompetencyCategory, Competency, CompetencyBehavior |
| Segment of an IDP action | IdpAction `segment` (S1–S5, DTN) |
| Coach validation of one descriptor | Evidence *Behaviour descriptor* + *Progress (1–5)* |
| Certification spelling variants | Certification `aliases` (*Other spellings*) |
| Day titles of an observed programme | Course `dayTitles` (one per line; shown on the observation grid) |
| Division / department / section, grade | Employee fields with suggestions from the lists *Division*, *Department*, *Section*, *Grade*; free text still allowed |

## Data-quality notes to check on every import

* **Match people on lower-cased email.** Names are spelled differently across sheets and some participants are missing from the people register; add them first.
* **Org-unit names vary** ("Dept" vs "Department", "Clouds & Applications" vs "Cloud & Application"). Use the suggested values.
* **Do not import placeholder observation days.** In the source toolkit only Day 1 held real scores; days 2–5 were all 1s.
* **One scale per measure.** The observation grid is 1–5; the risk rules convert to 0–4 themselves. Competency levels stay on the framework scale (0–4 technical, 1–4 cross-functional).
* **Monthly line-manager progress has decimals** (3.2, 4.2) on a whole-number scale. *Validated level* is a whole number: round, and keep the original in the comment.
* **Do not import gaps.** Three source rows disagree with required − level; Ballon TD recalculates.
* **Six training rows say Absent and Completed.** Load as No-show and review.
* **Three requirements of ROLE-12 have no required level** in the source (ASD-001, ASR-001, LXSCN032) and were not loaded. Add them when the client confirms the level.
* **Nine job titles have no role profile yet** (Vice President, department managers, some section heads). They are loaded as role profiles without requirements so people can be linked.
* **Certification names are free text** with about 46 spellings for 31 certifications. Match through *Other spellings*.
* **Narrative notes about individuals** (strengths, attendance excuses) are personal. Untick the change log and keep notes out of files that go to a wider audience.
* **Sector and country terms** remain inside some competency and indicator texts (OT in energy operations, national compliance standards). They are subject matter, not a client name. If the library is shown to a client in another sector, reword the affected competencies on Library → Competencies.
