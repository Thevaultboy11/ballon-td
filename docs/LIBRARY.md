# Preloaded library

Everything `npm run db:seed` loads. All of it can be edited in the app on **Library**. Generated from `server/seed/library.ts` and `shared/lookups.ts` by `npm run docs:library` — do not edit by hand.

**Totals:** 2 frameworks · 11 categories · 69 competencies · 388 level indicators · 31 job roles · 623 role requirements · 55 courses · 27 certifications · 25 observed behaviours · 29 dropdown lists (189 values)

> Descriptions and level indicators are starter text. The 16 original leadership competencies and the 25 observed behaviours come from the client's workbooks; the technical competencies and all lists come from the Master Data Dictionary. Replace the wording with the client's framework when it is available.

## Contents
- [Dropdown lists](#dropdown-lists)
- [Frameworks and categories](#frameworks-and-categories)
- [Competencies](#competencies)
- [Level indicators](#level-indicators)
- [Job roles and requirements](#job-roles-and-requirements)
- [Courses](#courses)
- [Certifications](#certifications)
- [Observed behaviours](#observed-behaviours)

## Dropdown lists

| List | Used for | Values |
| --- | --- | --- |
| **Programme status** `programStatus` | Where a client programme / IDP cycle is. | Planned · Active · On Hold · Completed · Cancelled |
| **Staff role** `staffRole` | What our own people do. One person can have several. | Consultant · Coach · Trainer · Assessor · Programme Manager · Administrator |
| **Employee status** `employeeStatus` | Whether the person is still in scope. | Active · On Leave · Left Company · Out of Scope |
| **Job family** `jobFamily` | Groups job roles into career tracks. | Security Operations · Threat Intelligence · Application Security · Offensive Security · Infrastructure & Cloud Security · Identity & Access · Governance, Risk & Compliance · Business Continuity & Resilience · Security Leadership |
| **Seniority** `seniority` | Drives default required levels on role profiles. | Entry · Mid · Senior · Lead · Manager · Head · Executive |
| **Enrolment status** `enrollmentStatus` | A person's status in one programme. | Nominated · Enrolled · Active · On Hold · Completed · Withdrawn · Deferred |
| **Assessment type** `assessmentType` | How the levels were obtained. Each is its own Assessment, so history is kept. | Self-Assessment · Consultant Assessment · Validation Interview · Manager Assessment · 360 Feedback · Technical Test · Re-assessment |
| **Assessment status** `assessmentStatus` |  | Not Started · Invited · In Progress · Completed · Cancelled |
| **Report status** `reportStatus` | Status of the individual report that goes to the client. | Not Started · In Draft · In Review · Delivered |
| **Priority** `priority` | How important a competency is for a role. Used as weights: High 3, Medium 2, Low 1. | High · Medium · Low |
| **Validation status** `validationStatus` | Manager validation outcome. | Pending · Approved · Rejected · Requires Further Evidence |
| **Development action type** `idpActionType` | What kind of action is planned in the IDP. | Training · Workshop · Certification · Coaching · Mentoring · Project Assignment · Shadowing · Cross-Functional Rotation · Reading · Research · Simulation · Learning Plan Segment · Department Training Need |
| **Development action status** `idpStatus` | "Overdue" is calculated (planned end passed and not completed), so it is not in this list. | Planned · Not Started · In Progress · Completed · On Hold · Deferred · Cancelled |
| **Course type** `courseType` | The training categories of the catalogue. | Instructor Led · Workshop · Leadership Programme · Virtual Session · Immersive Lab · Simulation · Self Study · Certification Preparation · Cross-Functional Rotation · On The Job Training · Project Assignment · Mentoring · Coaching · Compliance & Awareness |
| **Delivery mode** `deliveryMode` |  | In-person · Online (live) · Hybrid · Self-paced |
| **Difficulty** `difficulty` |  | Foundation · Intermediate · Advanced · Expert |
| **Session status** `sessionStatus` | Status of one run of a course. | Planned · Scheduled · In Progress · Completed · Postponed · Cancelled |
| **Training status** `trainingStatus` | One person on one course. | Assigned · Not Started · In Progress · Completed · Incomplete · No-show · Cancelled · Deferred · Expired |
| **Attendance** `attendance` | Attendance on one day of a course. | Present · Partial · Absent · Excused |
| **Observation category** `observationCategory` | Groups the behaviours trainers score. | Personal Effectiveness · Communication · Collaboration · Problem Solving · Leadership · Learning Agility |
| **Potential / risk note** `potentialNote` | The trainer's overall read on the person after a day. | High potential · Promising · Steady · Needs support · At risk |
| **Certification track** `certTrack` |  | Professional · AI · Vendor / Product · Internal |
| **Certification status** `certStatus` |  | Assigned · Not Started · Registered · In Progress · Exam Scheduled · Completed · Failed · Deferred · Expired · Not Required |
| **Exam result** `examResult` |  | Pass · Fail · Pending · Not Taken |
| **Coaching session type** `coachingType` |  | Kick-off · Monthly Check-In · Capability Review · Performance Coaching · Certification Coaching · Development Review · Feedback Session · Career Coaching · Close-out |
| **Coaching session status** `coachingStatus` |  | Scheduled · Completed · Rescheduled · Cancelled · No-show |
| **Evidence type** `evidenceType` |  | Project · Presentation · Assessment · Certification · Workshop · Training · Report · Case Study · Simulation · Manager Validation · Peer Feedback |
| **Verification status** `verificationStatus` |  | Submitted · Under Review · Verified · Rejected · Needs More Information |
| **Source** `source` | Where a record came from. The client cannot use the app, so most of their input arrives by email or Excel and is typed in by us. | Direct entry · Email from client · Excel from client · Meeting / interview · Phone call · LMS / platform export · Trainer sheet · Imported |

## Frameworks and categories

**Leadership & Behavioural Framework** (`LEAD`, scale 1–5) — How people communicate, lead, think, learn and deliver. Scale 1–5.

- `COM` Communication & Influence — 7 competencies
- `LEA` Leadership & People — 6 competencies
- `THK` Thinking & Decisions — 6 competencies
- `LRN` Learning & Adaptability — 4 competencies
- `DEL` Delivery & Ownership — 3 competencies

**Technical Cyber Security Framework** (`TECH`, scale 0–5) — Hands-on cyber security capability. Scale 0–5, where 0 means no exposure yet.

- `GRC` Governance, Risk & Compliance — 8 competencies
- `CTI` Threat Intelligence — 8 competencies
- `SOC` Security Operations & Incident Response — 4 competencies
- `BCM` Business Continuity & Resilience — 7 competencies
- `INF` Infrastructure & Cloud Security — 9 competencies
- `APP` Application Security — 7 competencies

## Competencies

### Communication & Influence

| Code | Competency | Description | How it is assessed |
| --- | --- | --- | --- |
| `COM-01` | **Communication** | Shares information clearly and concisely, in writing and in person, so others understand and can act. | Written updates and reports, day-to-day communication, observed group work. |
| `COM-02` | **Presentation Delivery** | Delivers well-structured presentations and briefings with confidence and composure. | Briefings, demos and the presentation exercises in leadership programmes. |
| `COM-03` | **Stakeholder Management** | Builds trust with people outside the team and keeps them informed and aligned. | Incident briefings, project updates and cross-team meetings. |
| `COM-04` | **Strategic Influence** | Gains support for ideas and decisions across the organisation without relying on formal authority. | Proposals, steering discussions, observed group exercises. |
| `COM-05` | **Relationship Building** | Listens actively and builds respectful, lasting working relationships. | Peer feedback and observed group work. |
| `COM-06` | **Negotiation** | Reaches agreements that protect security outcomes while keeping relationships intact. | Vendor and project discussions, role plays. |
| `COM-07` | **Facilitation** | Runs meetings and workshops that reach clear outcomes and involve everyone. | Workshops and meetings led, participant feedback. |

### Leadership & People

| Code | Competency | Description | How it is assessed |
| --- | --- | --- | --- |
| `LEA-01` | **Leadership** | Sets direction, acts as a role model and takes charge when situations escalate. | Interviews, leadership programmes, incident behaviour. |
| `LEA-02` | **Team Management** | Organises the team's work, develops people and handles conflict constructively. | Team feedback, interviews, observed group work. |
| `LEA-03` | **Performance Management** | Sets clear goals, follows through on commitments and gives useful feedback. | Goal records, one-to-ones, follow-through on actions. |
| `LEA-04` | **Cross-Team Integration** | Works effectively with other teams and shares information and resources across boundaries. | Joint projects, exercises and cross-functional rotations. |
| `LEA-05` | **Coaching & Mentoring** | Develops others through coaching conversations, mentoring and knowledge sharing. | Mentee feedback, coaching logs, team growth. |
| `LEA-06` | **Change Management** | Leads people through change so new ways of working stick. | Change initiatives led, adoption results. |

### Thinking & Decisions

| Code | Competency | Description | How it is assessed |
| --- | --- | --- | --- |
| `THK-01` | **Analytical Thinking** | Breaks complex problems into parts, reasons logically and reflects on outcomes. | Investigations, case exercises and post-incident reviews. |
| `THK-02` | **Problem Solving** | Defines the real problem, finds root causes and works out practical solutions. | Troubleshooting, root cause analyses and case exercises. |
| `THK-03` | **Strategic Thinking** | Connects daily work to long-term goals and generates new ideas. | Roadmaps, proposals, scenario exercises. |
| `THK-04` | **Decision Making** | Makes sound, timely decisions by weighing risks and trade-offs. | Incident decisions, prioritisation and scenario exercises. |
| `THK-05` | **Critical Thinking** | Questions assumptions and evaluates information before accepting it. | Reviews of analyses and reports, case discussions. |
| `THK-06` | **Systems Thinking** | Sees how people, processes and technology interact and anticipates knock-on effects. | Architecture and process reviews, scenario exercises. |

### Learning & Adaptability

| Code | Competency | Description | How it is assessed |
| --- | --- | --- | --- |
| `LRN-01` | **Continuous Learning** | Seeks feedback and new knowledge, learns quickly and applies what is learned. | Learning activity, certification progress, response to feedback. |
| `LRN-02` | **Tolerance for Uncertainty** | Stays calm and effective under pressure and when information is incomplete. | Behaviour during incidents, exercises and change. |
| `LRN-03` | **Adaptability** | Adjusts plans, priorities and approach when circumstances change. | Behaviour during change and reprioritisation. |
| `LRN-04` | **Innovation** | Proposes and tests better ways of working and continuously improves processes. | Improvement ideas implemented, automation and process changes. |

### Delivery & Ownership

| Code | Competency | Description | How it is assessed |
| --- | --- | --- | --- |
| `DEL-01` | **Operational Effectiveness** | Takes initiative and delivers work on time and to standard. | Delivery records, ticket data and manager feedback. |
| `DEL-02` | **Planning & Organisation** | Plans work, manages time and keeps several priorities under control. | Plans, deadlines met, workload management. |
| `DEL-03` | **Attention to Detail** | Produces accurate, complete work and spots errors others miss. | Quality of reports, configurations and evidence. |

### Governance, Risk & Compliance

| Code | Competency | Description | How it is assessed |
| --- | --- | --- | --- |
| `GRC-01` | **Security & Risk Governance** | Sets up the structures, roles and reporting that steer security and risk. | Governance documents, committee reporting, interviews. |
| `GRC-02` | **Risk Assessment** | Identifies, rates and communicates security risk in business terms. | Risk assessments delivered and the quality of risk reporting. |
| `GRC-03` | **Risk Treatment Planning** | Chooses and tracks treatments that bring risk within appetite. | Treatment plans, risk register quality. |
| `GRC-04` | **Compliance Management** | Maps controls to laws, regulations and standards and evidences them. | Control mappings, audit outcomes and evidence quality. |
| `GRC-05` | **Internal Auditing** | Plans and performs security audits and reports findings that get fixed. | Audits completed, quality of findings. |
| `GRC-06` | **Policy & Standards Development** | Writes security policies and standards that people can follow. | Policies and standards authored and adopted. |
| `GRC-07` | **Control Frameworks** | Applies frameworks such as ISO 27001, NIST CSF and CIS Controls. | Framework implementations, gap assessments. |
| `GRC-08` | **Security Awareness** | Designs and runs awareness activities that change behaviour. | Campaign results, phishing metrics. |

### Threat Intelligence

| Code | Competency | Description | How it is assessed |
| --- | --- | --- | --- |
| `CTI-01` | **Threat Intelligence Lifecycle** | Runs the intelligence cycle from requirements to dissemination and feedback. | Intelligence requirements and products delivered. |
| `CTI-02` | **Threat Actor Profiling** | Profiles adversaries, their motives and techniques. | Actor profiles and ATT&CK mappings. |
| `CTI-03` | **Threat Reporting** | Writes intelligence reports that decision makers act on. | Reports produced and their use. |
| `CTI-04` | **Open Source Intelligence** | Collects and verifies information from open sources safely. | OSINT investigations, lab work. |
| `CTI-05` | **Attack Path Analysis** | Works out how an attacker could move from entry point to critical assets. | Attack path analyses, purple-team exercises. |
| `CTI-06` | **Threat Modelling** | Identifies threats to a system early and designs mitigations. | Threat models produced, design reviews. |
| `CTI-07` | **Indicators of Compromise Analysis** | Analyses and enriches indicators and turns them into detections. | IOC analyses, detection content created. |
| `CTI-08` | **Threat Hunting** | Searches proactively for attackers who evaded existing detection. | Hunts run, findings and new detections. |

### Security Operations & Incident Response

| Code | Competency | Description | How it is assessed |
| --- | --- | --- | --- |
| `SOC-01` | **Security Monitoring & Detection** | Builds, tunes and runs detection to spot malicious activity early. | Detection rules authored, alert quality and lab exercises. |
| `SOC-02` | **Incident Response** | Contains, eradicates and recovers from incidents using sound playbooks. | Incident records, tabletop exercises and simulations. |
| `SOC-03` | **Digital Forensics** | Collects and analyses digital evidence to reconstruct what happened. | Forensic case work and practical labs. |
| `SOC-04` | **Malware Analysis** | Analyses malicious files to understand behaviour and extract indicators. | Malware analyses, lab results. |

### Business Continuity & Resilience

| Code | Competency | Description | How it is assessed |
| --- | --- | --- | --- |
| `BCM-01` | **Business Continuity Planning** | Writes and maintains plans that keep critical services running. | Plans produced and tested. |
| `BCM-02` | **Business Impact Analysis** | Works out which services matter most and how long they can be down. | BIAs completed, RTO/RPO quality. |
| `BCM-03` | **Disaster Recovery** | Plans and tests the technical recovery of systems and data. | DR plans and test results. |
| `BCM-04` | **Operational Resilience** | Keeps important business services within impact tolerances. | Resilience assessments, DORA/NIS2 work. |
| `BCM-05` | **Scenario Testing & Exercises** | Designs and runs exercises that test plans and people. | Exercises run, lessons learned. |
| `BCM-06` | **Backup & Recovery** | Makes sure data can be restored quickly and safely. | Backup coverage, restore tests. |
| `BCM-07` | **Dependency Mapping** | Maps the people, suppliers and systems a service depends on. | Dependency maps and their accuracy. |

### Infrastructure & Cloud Security

| Code | Competency | Description | How it is assessed |
| --- | --- | --- | --- |
| `INF-01` | **Network Security** | Designs and operates secure networks, segmentation and access rules. | Design reviews, rule audits and lab work. |
| `INF-02` | **Cloud Security** | Secures cloud workloads, configurations and identities. | Posture findings, architecture reviews and labs. |
| `INF-03` | **System Hardening** | Hardens servers and platforms against common attacks. | Hardening baselines and audit results. |
| `INF-04` | **Endpoint Security** | Protects devices with endpoint protection and hardening. | EDR coverage, hardening baselines and incident data. |
| `INF-05` | **Identity Management** | Manages the identity lifecycle from joiner to leaver. | Identity processes, access review results. |
| `INF-06` | **Access Control** | Designs strong authentication, privileged access and least-privilege controls. | Access designs, PAM coverage. |
| `INF-07` | **Certificate & Key Management** | Manages certificates, keys and secrets so they stay valid and protected. | Inventory quality, expiry incidents. |
| `INF-08` | **Patch & Vulnerability Management** | Finds, prioritises and tracks vulnerabilities through to remediation. | Scan coverage, remediation times and prioritisation quality. |
| `INF-09` | **Security Architecture** | Designs secure systems and reviews designs against security principles. | Architecture decisions and design reviews. |

### Application Security

| Code | Competency | Description | How it is assessed |
| --- | --- | --- | --- |
| `APP-01` | **Application Security Review** | Reviews applications and code for security flaws. | Reviews completed, findings quality. |
| `APP-02` | **Secure Development** | Builds security into software design, code and delivery. | Code reviews, secure design records. |
| `APP-03` | **API Security** | Designs and tests APIs against authentication, authorisation and abuse flaws. | API reviews and tests. |
| `APP-04` | **DevSecOps** | Builds security checks into CI/CD pipelines. | Pipeline controls and coverage. |
| `APP-05` | **Security Automation & Scripting** | Automates security tasks with scripts and playbooks. | Scripts, SOAR playbooks and time saved. |
| `APP-06` | **Web Security** | Understands and fixes common web vulnerabilities (OWASP Top 10). | Web testing labs and findings. |
| `APP-07` | **Penetration Testing** | Plans and runs authorised tests that find exploitable weaknesses. | Test reports, lab results and peer review. |

## Level indicators

Every competency gets one indicator per level, built from its behaviour phrase. Leadership competencies use levels 1–5; technical ones 0–5 (0 = no exposure yet).

| Level | Pattern |
| --- | --- |
| 0 | No exposure yet. |
| 1 | With guidance, begins to …. |
| 2 | Can … in routine situations, checking with others when unsure. |
| 3 | Able to … independently, including in complex or unfamiliar situations. |
| 4 | Helps others … and sets the standard for the team. |
| 5 | Shapes how the organisation is expected to …; recognised as a reference inside and outside the team. |

| Code | Behaviour phrase (fills the "…") |
| --- | --- |
| `COM-01` Communication | explain technical issues clearly and concisely to any audience |
| `COM-02` Presentation Delivery | deliver structured briefings with confidence and handle questions with composure |
| `COM-03` Stakeholder Management | keep the right stakeholders informed and adapt the message to each of them |
| `COM-04` Strategic Influence | build support for proposals and influence decisions without formal authority |
| `COM-05` Relationship Building | build trust through active listening and respectful interaction |
| `COM-06` Negotiation | negotiate workable agreements on scope, risk and resources |
| `COM-07` Facilitation | run meetings and workshops that reach clear, agreed outcomes |
| `LEA-01` Leadership | set direction, act as a visible role model and take charge when situations escalate |
| `LEA-02` Team Management | organise the team's work fairly and resolve conflict constructively |
| `LEA-03` Performance Management | set clear goals, follow through on commitments and give specific feedback |
| `LEA-04` Cross-Team Integration | work effectively with other teams and share information across boundaries |
| `LEA-05` Coaching & Mentoring | develop others through coaching, mentoring and knowledge sharing |
| `LEA-06` Change Management | plan and lead change so that new ways of working are adopted |
| `THK-01` Analytical Thinking | break complex problems into logical parts and reflect on outcomes |
| `THK-02` Problem Solving | define the real problem, find root causes and work out practical solutions |
| `THK-03` Strategic Thinking | connect daily work to long-term security goals and generate new ideas |
| `THK-04` Decision Making | make sound, timely decisions by weighing risks and trade-offs |
| `THK-05` Critical Thinking | question assumptions and test information before relying on it |
| `THK-06` Systems Thinking | see how people, processes and technology interact and anticipate knock-on effects |
| `LRN-01` Continuous Learning | seek feedback and new knowledge and apply what they learn quickly |
| `LRN-02` Tolerance for Uncertainty | stay calm and effective under pressure and with incomplete information |
| `LRN-03` Adaptability | adjust plans and approach quickly when circumstances change |
| `LRN-04` Innovation | propose, test and adopt better ways of working |
| `DEL-01` Operational Effectiveness | take initiative and deliver work on time and to standard |
| `DEL-02` Planning & Organisation | plan work, manage time and keep several priorities under control |
| `DEL-03` Attention to Detail | produce accurate, complete work and catch errors before they matter |
| `GRC-01` Security & Risk Governance | set up and run security and risk governance structures and reporting |
| `GRC-02` Risk Assessment | identify, rate and communicate security risks in business terms |
| `GRC-03` Risk Treatment Planning | choose and track risk treatments that bring risk within appetite |
| `GRC-04` Compliance Management | map controls to regulatory requirements and maintain compliance evidence |
| `GRC-05` Internal Auditing | plan and run security audits and report findings that lead to action |
| `GRC-06` Policy & Standards Development | write and maintain security policies and standards people can follow |
| `GRC-07` Control Frameworks | apply control frameworks such as ISO 27001, NIST CSF and CIS |
| `GRC-08` Security Awareness | design and run awareness activities that measurably change behaviour |
| `CTI-01` Threat Intelligence Lifecycle | run the intelligence cycle from requirements to dissemination |
| `CTI-02` Threat Actor Profiling | profile threat actors and map their techniques to MITRE ATT&CK |
| `CTI-03` Threat Reporting | write threat reports that decision makers can act on |
| `CTI-04` Open Source Intelligence | collect and verify open-source intelligence safely and legally |
| `CTI-05` Attack Path Analysis | work out realistic attack paths to critical assets |
| `CTI-06` Threat Modelling | identify threats to a system early and design mitigations |
| `CTI-07` Indicators of Compromise Analysis | analyse and enrich indicators of compromise and turn them into detections |
| `CTI-08` Threat Hunting | hunt proactively for threats that evaded existing detection |
| `SOC-01` Security Monitoring & Detection | build and tune detection rules and triage alerts accurately |
| `SOC-02` Incident Response | contain and remediate security incidents using sound playbooks |
| `SOC-03` Digital Forensics | collect and analyse digital evidence to reconstruct attacker activity |
| `SOC-04` Malware Analysis | analyse malicious files and extract useful indicators |
| `BCM-01` Business Continuity Planning | write and maintain continuity plans for critical services |
| `BCM-02` Business Impact Analysis | run business impact analyses and set recovery objectives |
| `BCM-03` Disaster Recovery | plan and test the technical recovery of systems and data |
| `BCM-04` Operational Resilience | keep important business services within agreed impact tolerances |
| `BCM-05` Scenario Testing & Exercises | design and run realistic exercises that test plans and people |
| `BCM-06` Backup & Recovery | make sure data can be restored quickly, safely and completely |
| `BCM-07` Dependency Mapping | map the people, suppliers and systems a service depends on |
| `INF-01` Network Security | design and review secure network segmentation and access rules |
| `INF-02` Cloud Security | secure cloud workloads and fix cloud misconfigurations |
| `INF-03` System Hardening | harden servers and platforms against common attacks |
| `INF-04` Endpoint Security | deploy and tune endpoint protection on devices |
| `INF-05` Identity Management | manage the identity lifecycle from joiner to leaver |
| `INF-06` Access Control | design strong authentication and least-privilege access controls |
| `INF-07` Certificate & Key Management | manage certificates, keys and secrets so they stay valid and protected |
| `INF-08` Patch & Vulnerability Management | prioritise vulnerabilities by real risk and track them to closure |
| `INF-09` Security Architecture | design secure architectures and review designs against security principles |
| `APP-01` Application Security Review | review applications and code for security flaws |
| `APP-02` Secure Development | build security into software design, code and delivery |
| `APP-03` API Security | design and test APIs against authentication and authorisation flaws |
| `APP-04` DevSecOps | build automated security checks into CI/CD pipelines |
| `APP-05` Security Automation & Scripting | automate repetitive security tasks with scripts and playbooks |
| `APP-06` Web Security | find and fix common web vulnerabilities such as the OWASP Top 10 |
| `APP-07` Penetration Testing | plan and run authorised penetration tests and report clear remediation |

## Job roles and requirements

Required levels are defaults by seniority (soft skills rise from 2 for Entry to 5 for Executive; technical skills peak at Senior/Lead). Edit them per role on Library → Role requirements.

| Code | Role | Family | Seniority | Next role | Requirements (level, priority) |
| --- | --- | --- | --- | --- | --- |
| `SOC-T1` | **SOC Analyst (Tier 1)** | Security Operations | Entry | SOC Analyst (Tier 2) | Communication 2 · Analytical Thinking 2 · Problem Solving 2 ★ · Continuous Learning 2 · Operational Effectiveness 2 ★ · Cross-Team Integration 2 · Tolerance for Uncertainty 2 · Attention to Detail 2 · Security Monitoring & Detection 2 ★ · Incident Response 2 ★ · Digital Forensics 2 ★ · Indicators of Compromise Analysis 2 · Threat Hunting 1 · Security Automation & Scripting 1 |
| `SOC-T2` | **SOC Analyst (Tier 2)** | Security Operations | Mid | Senior SOC Analyst | Communication 3 · Analytical Thinking 3 · Problem Solving 3 ★ · Continuous Learning 3 · Operational Effectiveness 3 ★ · Cross-Team Integration 3 · Tolerance for Uncertainty 3 · Attention to Detail 3 · Security Monitoring & Detection 3 ★ · Incident Response 3 ★ · Digital Forensics 3 ★ · Indicators of Compromise Analysis 3 · Threat Hunting 2 · Security Automation & Scripting 2 |
| `SOC-SR` | **Senior SOC Analyst** | Security Operations | Senior | SOC Team Lead | Communication 3 · Analytical Thinking 3 · Problem Solving 3 ★ · Continuous Learning 3 · Operational Effectiveness 3 ★ · Cross-Team Integration 3 · Tolerance for Uncertainty 3 · Attention to Detail 3 · Presentation Delivery 3 · Stakeholder Management 3 · Decision Making 3 · Coaching & Mentoring 3 · Critical Thinking 3 · Security Monitoring & Detection 4 ★ · Incident Response 4 ★ · Digital Forensics 4 ★ · Indicators of Compromise Analysis 4 · Threat Hunting 3 · Security Automation & Scripting 3 |
| `IR-SR` | **Senior Incident Responder** | Security Operations | Senior | SOC Team Lead | Communication 3 · Analytical Thinking 3 · Problem Solving 3 ★ · Continuous Learning 3 · Operational Effectiveness 3 ★ · Cross-Team Integration 3 · Tolerance for Uncertainty 3 · Attention to Detail 3 · Presentation Delivery 3 · Stakeholder Management 3 · Decision Making 3 · Coaching & Mentoring 3 · Critical Thinking 3 · Security Monitoring & Detection 4 ★ · Incident Response 4 ★ · Digital Forensics 4 ★ · Indicators of Compromise Analysis 4 · Threat Hunting 3 · Security Automation & Scripting 3 |
| `SOC-LD` | **SOC Team Lead** | Security Operations | Lead | Security Operations Manager | Communication 4 · Analytical Thinking 4 · Problem Solving 4 · Continuous Learning 4 · Operational Effectiveness 4 · Cross-Team Integration 4 · Tolerance for Uncertainty 4 · Attention to Detail 4 · Presentation Delivery 4 · Stakeholder Management 4 · Decision Making 4 · Coaching & Mentoring 4 · Critical Thinking 4 · Leadership 4 ★ · Team Management 4 ★ · Performance Management 4 ★ · Strategic Influence 4 ★ · Strategic Thinking 4 ★ · Change Management 4 · Systems Thinking 3 · Negotiation 3 · Facilitation 3 · Security Monitoring & Detection 4 ★ · Incident Response 4 ★ · Digital Forensics 4 ★ · Indicators of Compromise Analysis 4 · Threat Hunting 3 · Security Automation & Scripting 3 |
| `SOC-MGR` | **Security Operations Manager** | Security Operations | Manager | Head of Cyber Security | Communication 4 · Analytical Thinking 4 · Problem Solving 4 · Continuous Learning 4 · Operational Effectiveness 4 · Cross-Team Integration 4 · Tolerance for Uncertainty 4 · Attention to Detail 4 · Presentation Delivery 4 · Stakeholder Management 4 · Decision Making 4 · Coaching & Mentoring 4 · Critical Thinking 4 · Leadership 4 ★ · Team Management 4 ★ · Performance Management 4 ★ · Strategic Influence 4 ★ · Strategic Thinking 4 ★ · Change Management 4 · Systems Thinking 3 · Negotiation 3 · Facilitation 3 · Security Monitoring & Detection 3 · Incident Response 3 · Digital Forensics 3 · Indicators of Compromise Analysis 3 · Threat Hunting 2 · Security Automation & Scripting 2 |
| `CTI-AN` | **Threat Intelligence Analyst** | Threat Intelligence | Mid | Senior Threat Intelligence Analyst | Communication 3 · Analytical Thinking 3 · Problem Solving 3 ★ · Continuous Learning 3 · Operational Effectiveness 3 ★ · Cross-Team Integration 3 · Tolerance for Uncertainty 3 · Attention to Detail 3 · Threat Intelligence Lifecycle 3 ★ · Threat Actor Profiling 3 ★ · Threat Reporting 3 ★ · Open Source Intelligence 3 · Attack Path Analysis 2 · Indicators of Compromise Analysis 2 |
| `CTI-SR` | **Senior Threat Intelligence Analyst** | Threat Intelligence | Senior | Threat Intelligence Lead | Communication 3 · Analytical Thinking 3 · Problem Solving 3 ★ · Continuous Learning 3 · Operational Effectiveness 3 ★ · Cross-Team Integration 3 · Tolerance for Uncertainty 3 · Attention to Detail 3 · Presentation Delivery 3 · Stakeholder Management 3 · Decision Making 3 · Coaching & Mentoring 3 · Critical Thinking 3 · Threat Intelligence Lifecycle 4 ★ · Threat Actor Profiling 4 ★ · Threat Reporting 4 ★ · Open Source Intelligence 4 · Attack Path Analysis 3 · Indicators of Compromise Analysis 3 |
| `CTI-LD` | **Threat Intelligence Lead** | Threat Intelligence | Lead | Security Operations Manager | Communication 4 · Analytical Thinking 4 · Problem Solving 4 · Continuous Learning 4 · Operational Effectiveness 4 · Cross-Team Integration 4 · Tolerance for Uncertainty 4 · Attention to Detail 4 · Presentation Delivery 4 · Stakeholder Management 4 · Decision Making 4 · Coaching & Mentoring 4 · Critical Thinking 4 · Leadership 4 ★ · Team Management 4 ★ · Performance Management 4 ★ · Strategic Influence 4 ★ · Strategic Thinking 4 ★ · Change Management 4 · Systems Thinking 3 · Negotiation 3 · Facilitation 3 · Threat Intelligence Lifecycle 4 ★ · Threat Actor Profiling 4 ★ · Threat Reporting 4 ★ · Open Source Intelligence 4 · Attack Path Analysis 3 · Indicators of Compromise Analysis 3 |
| `APS-EN` | **Application Security Engineer** | Application Security | Mid | Senior Application Security Engineer | Communication 3 · Analytical Thinking 3 · Problem Solving 3 ★ · Continuous Learning 3 · Operational Effectiveness 3 ★ · Cross-Team Integration 3 · Tolerance for Uncertainty 3 · Attention to Detail 3 · Application Security Review 3 ★ · Secure Development 3 ★ · API Security 3 ★ · DevSecOps 3 · Web Security 2 · Threat Modelling 2 |
| `APS-SR` | **Senior Application Security Engineer** | Application Security | Senior | Application Security Lead | Communication 3 · Analytical Thinking 3 · Problem Solving 3 ★ · Continuous Learning 3 · Operational Effectiveness 3 ★ · Cross-Team Integration 3 · Tolerance for Uncertainty 3 · Attention to Detail 3 · Presentation Delivery 3 · Stakeholder Management 3 · Decision Making 3 · Coaching & Mentoring 3 · Critical Thinking 3 · Application Security Review 4 ★ · Secure Development 4 ★ · API Security 4 ★ · DevSecOps 4 · Web Security 3 · Threat Modelling 3 |
| `APS-LD` | **Application Security Lead** | Application Security | Lead | Head of Cyber Security | Communication 4 · Analytical Thinking 4 · Problem Solving 4 · Continuous Learning 4 · Operational Effectiveness 4 · Cross-Team Integration 4 · Tolerance for Uncertainty 4 · Attention to Detail 4 · Presentation Delivery 4 · Stakeholder Management 4 · Decision Making 4 · Coaching & Mentoring 4 · Critical Thinking 4 · Leadership 4 ★ · Team Management 4 ★ · Performance Management 4 ★ · Strategic Influence 4 ★ · Strategic Thinking 4 ★ · Change Management 4 · Systems Thinking 3 · Negotiation 3 · Facilitation 3 · Application Security Review 4 ★ · Secure Development 4 ★ · API Security 4 ★ · DevSecOps 4 · Web Security 3 · Threat Modelling 3 |
| `PEN-JR` | **Junior Penetration Tester** | Offensive Security | Entry | Penetration Tester | Communication 2 · Analytical Thinking 2 · Problem Solving 2 ★ · Continuous Learning 2 · Operational Effectiveness 2 ★ · Cross-Team Integration 2 · Tolerance for Uncertainty 2 · Attention to Detail 2 · Penetration Testing 2 ★ · Web Security 2 ★ · Attack Path Analysis 2 ★ · Network Security 2 · Security Automation & Scripting 1 · Open Source Intelligence 1 |
| `PEN-TS` | **Penetration Tester** | Offensive Security | Mid | Senior Penetration Tester | Communication 3 · Analytical Thinking 3 · Problem Solving 3 ★ · Continuous Learning 3 · Operational Effectiveness 3 ★ · Cross-Team Integration 3 · Tolerance for Uncertainty 3 · Attention to Detail 3 · Penetration Testing 3 ★ · Web Security 3 ★ · Attack Path Analysis 3 ★ · Network Security 3 · Security Automation & Scripting 2 · Open Source Intelligence 2 |
| `PEN-SR` | **Senior Penetration Tester** | Offensive Security | Senior | Application Security Lead | Communication 3 · Analytical Thinking 3 · Problem Solving 3 ★ · Continuous Learning 3 · Operational Effectiveness 3 ★ · Cross-Team Integration 3 · Tolerance for Uncertainty 3 · Attention to Detail 3 · Presentation Delivery 3 · Stakeholder Management 3 · Decision Making 3 · Coaching & Mentoring 3 · Critical Thinking 3 · Penetration Testing 4 ★ · Web Security 4 ★ · Attack Path Analysis 4 ★ · Network Security 4 · Security Automation & Scripting 3 · Open Source Intelligence 3 |
| `INF-EN` | **Infrastructure Security Engineer** | Infrastructure & Cloud Security | Mid | Senior Infrastructure & Cloud Security Engineer | Communication 3 · Analytical Thinking 3 · Problem Solving 3 ★ · Continuous Learning 3 · Operational Effectiveness 3 ★ · Cross-Team Integration 3 · Tolerance for Uncertainty 3 · Attention to Detail 3 · Network Security 3 ★ · Cloud Security 3 ★ · System Hardening 3 ★ · Endpoint Security 3 · Patch & Vulnerability Management 2 · Security Architecture 2 |
| `CLD-EN` | **Cloud Security Engineer** | Infrastructure & Cloud Security | Mid | Senior Infrastructure & Cloud Security Engineer | Communication 3 · Analytical Thinking 3 · Problem Solving 3 ★ · Continuous Learning 3 · Operational Effectiveness 3 ★ · Cross-Team Integration 3 · Tolerance for Uncertainty 3 · Attention to Detail 3 · Network Security 3 ★ · Cloud Security 3 ★ · System Hardening 3 ★ · Endpoint Security 3 · Patch & Vulnerability Management 2 · Security Architecture 2 |
| `INF-SR` | **Senior Infrastructure & Cloud Security Engineer** | Infrastructure & Cloud Security | Senior | Security Architect | Communication 3 · Analytical Thinking 3 · Problem Solving 3 ★ · Continuous Learning 3 · Operational Effectiveness 3 ★ · Cross-Team Integration 3 · Tolerance for Uncertainty 3 · Attention to Detail 3 · Presentation Delivery 3 · Stakeholder Management 3 · Decision Making 3 · Coaching & Mentoring 3 · Critical Thinking 3 · Network Security 4 ★ · Cloud Security 4 ★ · System Hardening 4 ★ · Endpoint Security 4 · Patch & Vulnerability Management 3 · Security Architecture 3 |
| `ARC-SEC` | **Security Architect** | Infrastructure & Cloud Security | Lead | Head of Cyber Security | Communication 4 · Analytical Thinking 4 · Problem Solving 4 · Continuous Learning 4 · Operational Effectiveness 4 · Cross-Team Integration 4 · Tolerance for Uncertainty 4 · Attention to Detail 4 · Presentation Delivery 4 · Stakeholder Management 4 · Decision Making 4 · Coaching & Mentoring 4 · Critical Thinking 4 · Leadership 4 ★ · Team Management 4 ★ · Performance Management 4 ★ · Strategic Influence 4 ★ · Strategic Thinking 4 ★ · Change Management 4 · Systems Thinking 3 · Negotiation 3 · Facilitation 3 · Network Security 4 ★ · Cloud Security 4 ★ · System Hardening 4 ★ · Endpoint Security 4 · Patch & Vulnerability Management 3 · Security Architecture 3 |
| `IAM-AN` | **IAM Analyst** | Identity & Access | Entry | IAM Engineer | Communication 2 · Analytical Thinking 2 · Problem Solving 2 ★ · Continuous Learning 2 · Operational Effectiveness 2 ★ · Cross-Team Integration 2 · Tolerance for Uncertainty 2 · Attention to Detail 2 · Identity Management 2 ★ · Access Control 2 ★ · Certificate & Key Management 2 ★ · Cloud Security 2 · Compliance Management 1 |
| `IAM-EN` | **IAM Engineer** | Identity & Access | Mid | IAM Lead | Communication 3 · Analytical Thinking 3 · Problem Solving 3 ★ · Continuous Learning 3 · Operational Effectiveness 3 ★ · Cross-Team Integration 3 · Tolerance for Uncertainty 3 · Attention to Detail 3 · Identity Management 3 ★ · Access Control 3 ★ · Certificate & Key Management 3 ★ · Cloud Security 3 · Compliance Management 2 |
| `IAM-LD` | **IAM Lead** | Identity & Access | Lead | Head of Cyber Security | Communication 4 · Analytical Thinking 4 · Problem Solving 4 · Continuous Learning 4 · Operational Effectiveness 4 · Cross-Team Integration 4 · Tolerance for Uncertainty 4 · Attention to Detail 4 · Presentation Delivery 4 · Stakeholder Management 4 · Decision Making 4 · Coaching & Mentoring 4 · Critical Thinking 4 · Leadership 4 ★ · Team Management 4 ★ · Performance Management 4 ★ · Strategic Influence 4 ★ · Strategic Thinking 4 ★ · Change Management 4 · Systems Thinking 3 · Negotiation 3 · Facilitation 3 · Identity Management 4 ★ · Access Control 4 ★ · Certificate & Key Management 4 ★ · Cloud Security 4 · Compliance Management 3 |
| `GRC-AN` | **GRC Analyst** | Governance, Risk & Compliance | Entry | Senior GRC Analyst | Communication 2 · Analytical Thinking 2 · Problem Solving 2 ★ · Continuous Learning 2 · Operational Effectiveness 2 ★ · Cross-Team Integration 2 · Tolerance for Uncertainty 2 · Attention to Detail 2 · Security & Risk Governance 2 ★ · Risk Assessment 2 ★ · Risk Treatment Planning 2 ★ · Compliance Management 2 · Internal Auditing 1 · Policy & Standards Development 1 · Control Frameworks 1 |
| `GRC-SR` | **Senior GRC Analyst** | Governance, Risk & Compliance | Senior | GRC Lead | Communication 3 · Analytical Thinking 3 · Problem Solving 3 ★ · Continuous Learning 3 · Operational Effectiveness 3 ★ · Cross-Team Integration 3 · Tolerance for Uncertainty 3 · Attention to Detail 3 · Presentation Delivery 3 · Stakeholder Management 3 · Decision Making 3 · Coaching & Mentoring 3 · Critical Thinking 3 · Security & Risk Governance 4 ★ · Risk Assessment 4 ★ · Risk Treatment Planning 4 ★ · Compliance Management 4 · Internal Auditing 3 · Policy & Standards Development 3 · Control Frameworks 3 |
| `AUD-IT` | **IT Security Auditor** | Governance, Risk & Compliance | Mid | Senior GRC Analyst | Communication 3 · Analytical Thinking 3 · Problem Solving 3 ★ · Continuous Learning 3 · Operational Effectiveness 3 ★ · Cross-Team Integration 3 · Tolerance for Uncertainty 3 · Attention to Detail 3 · Security & Risk Governance 3 ★ · Risk Assessment 3 ★ · Risk Treatment Planning 3 ★ · Compliance Management 3 · Internal Auditing 2 · Policy & Standards Development 2 · Control Frameworks 2 |
| `GRC-LD` | **GRC Lead** | Governance, Risk & Compliance | Lead | Head of Governance, Risk & Compliance | Communication 4 · Analytical Thinking 4 · Problem Solving 4 · Continuous Learning 4 · Operational Effectiveness 4 · Cross-Team Integration 4 · Tolerance for Uncertainty 4 · Attention to Detail 4 · Presentation Delivery 4 · Stakeholder Management 4 · Decision Making 4 · Coaching & Mentoring 4 · Critical Thinking 4 · Leadership 4 ★ · Team Management 4 ★ · Performance Management 4 ★ · Strategic Influence 4 ★ · Strategic Thinking 4 ★ · Change Management 4 · Systems Thinking 3 · Negotiation 3 · Facilitation 3 · Security & Risk Governance 4 ★ · Risk Assessment 4 ★ · Risk Treatment Planning 4 ★ · Compliance Management 4 · Internal Auditing 3 · Policy & Standards Development 3 · Control Frameworks 3 |
| `HEAD-GRC` | **Head of Governance, Risk & Compliance** | Governance, Risk & Compliance | Head | Chief Information Security Officer | Communication 4 · Analytical Thinking 4 · Problem Solving 4 · Continuous Learning 4 · Operational Effectiveness 4 · Cross-Team Integration 4 · Tolerance for Uncertainty 4 · Attention to Detail 4 · Presentation Delivery 4 · Stakeholder Management 4 · Decision Making 4 · Coaching & Mentoring 4 · Critical Thinking 4 · Leadership 4 ★ · Team Management 4 ★ · Performance Management 4 ★ · Strategic Influence 4 ★ · Strategic Thinking 4 ★ · Change Management 4 · Systems Thinking 3 · Negotiation 3 · Facilitation 3 · Security & Risk Governance 3 · Risk Assessment 3 · Risk Treatment Planning 3 · Compliance Management 3 · Internal Auditing 2 · Policy & Standards Development 2 · Control Frameworks 2 |
| `BCM-AN` | **Business Continuity Analyst** | Business Continuity & Resilience | Mid | Business Continuity & Resilience Manager | Communication 3 · Analytical Thinking 3 · Problem Solving 3 ★ · Continuous Learning 3 · Operational Effectiveness 3 ★ · Cross-Team Integration 3 · Tolerance for Uncertainty 3 · Attention to Detail 3 · Business Continuity Planning 3 ★ · Business Impact Analysis 3 ★ · Disaster Recovery 3 ★ · Operational Resilience 3 · Scenario Testing & Exercises 2 · Dependency Mapping 2 |
| `BCM-MGR` | **Business Continuity & Resilience Manager** | Business Continuity & Resilience | Manager | Head of Governance, Risk & Compliance | Communication 4 · Analytical Thinking 4 · Problem Solving 4 · Continuous Learning 4 · Operational Effectiveness 4 · Cross-Team Integration 4 · Tolerance for Uncertainty 4 · Attention to Detail 4 · Presentation Delivery 4 · Stakeholder Management 4 · Decision Making 4 · Coaching & Mentoring 4 · Critical Thinking 4 · Leadership 4 ★ · Team Management 4 ★ · Performance Management 4 ★ · Strategic Influence 4 ★ · Strategic Thinking 4 ★ · Change Management 4 · Systems Thinking 3 · Negotiation 3 · Facilitation 3 · Business Continuity Planning 3 · Business Impact Analysis 3 · Disaster Recovery 3 · Operational Resilience 3 · Scenario Testing & Exercises 2 · Dependency Mapping 2 |
| `HEAD-CYB` | **Head of Cyber Security** | Security Leadership | Head | Chief Information Security Officer | Communication 4 · Analytical Thinking 4 · Problem Solving 4 · Continuous Learning 4 · Operational Effectiveness 4 · Cross-Team Integration 4 · Tolerance for Uncertainty 4 · Attention to Detail 4 · Presentation Delivery 4 · Stakeholder Management 4 · Decision Making 4 · Coaching & Mentoring 4 · Critical Thinking 4 · Leadership 4 ★ · Team Management 4 ★ · Performance Management 4 ★ · Strategic Influence 4 ★ · Strategic Thinking 4 ★ · Change Management 4 · Systems Thinking 3 · Negotiation 3 · Facilitation 3 · Security & Risk Governance 3 · Risk Assessment 3 · Incident Response 3 · Security Architecture 3 · Operational Resilience 2 |
| `CISO` | **Chief Information Security Officer** | Security Leadership | Executive | — | Communication 5 · Analytical Thinking 5 · Problem Solving 5 · Continuous Learning 5 · Operational Effectiveness 5 · Cross-Team Integration 5 · Tolerance for Uncertainty 5 · Attention to Detail 5 · Presentation Delivery 5 · Stakeholder Management 5 · Decision Making 5 · Coaching & Mentoring 5 · Critical Thinking 5 · Leadership 5 ★ · Team Management 5 ★ · Performance Management 5 ★ · Strategic Influence 5 ★ · Strategic Thinking 5 ★ · Change Management 5 · Systems Thinking 4 · Negotiation 4 · Facilitation 4 · Security & Risk Governance 3 · Risk Assessment 3 · Incident Response 3 · Security Architecture 3 · Operational Resilience 2 |

★ = High priority.

## Courses

| Code | Course | Type | Delivery | Hours | Days | Observed | Builds |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ELB` | **Emerging Leaders Bootcamp** | Leadership Programme | In-person | 24 | 3 | Yes | Leadership, Team Management, Presentation Delivery, Decision Making, Continuous Learning |
| `MGR` | **Manager Essentials** | Leadership Programme | Hybrid | 21 | 3 | Yes | Team Management, Performance Management, Stakeholder Management, Coaching & Mentoring |
| `CWI` | **Communicate with Impact** | Workshop | In-person | 14 | 2 | Yes | Communication, Presentation Delivery, Relationship Building, Stakeholder Management |
| `SLL` | **Strategic Leadership Lab** | Leadership Programme | In-person | 16 | 2 | Yes | Strategic Thinking, Strategic Influence, Change Management, Systems Thinking |
| `FBK` | **Giving and Receiving Feedback** | Workshop | In-person | 4 | 1 |  | Performance Management, Continuous Learning, Relationship Building |
| `TPM` | **Time & Priority Management** | Virtual Session | Online (live) | 3 | 1 |  | Planning & Organisation, Operational Effectiveness |
| `EXW` | **Writing for Executives** | Virtual Session | Online (live) | 4 | 1 |  | Communication, Stakeholder Management |
| `CSS` | **Coaching Skills for Senior Staff** | Workshop | In-person | 8 | 1 | Yes | Coaching & Mentoring, Relationship Building, Performance Management |
| `NEG` | **Negotiation for Security Professionals** | Workshop | In-person | 7 | 1 |  | Negotiation, Strategic Influence |
| `FAC` | **Facilitating Workshops that Decide** | Workshop | In-person | 6 | 1 |  | Facilitation, Cross-Team Integration |
| `CHG` | **Leading Change** | Virtual Session | Online (live) | 6 | 2 |  | Change Management, Strategic Influence |
| `CRT` | **Critical Thinking for Analysts** | Workshop | Hybrid | 7 | 1 |  | Critical Thinking, Analytical Thinking, Attention to Detail |
| `SIEM` | **SIEM Detection Engineering** | Instructor Led | Hybrid | 16 | 2 |  | Security Monitoring & Detection, Indicators of Compromise Analysis, Security Automation & Scripting |
| `HUNT` | **Threat Hunting Fundamentals** | Immersive Lab | Online (live) | 12 | 2 |  | Threat Hunting, Security Monitoring & Detection |
| `IRW` | **Incident Handling Workshop** | Workshop | In-person | 16 | 2 |  | Incident Response, Tolerance for Uncertainty, Decision Making |
| `TTX` | **Cyber Crisis Tabletop Exercise** | Simulation | In-person | 4 | 1 | Yes | Incident Response, Scenario Testing & Exercises, Decision Making, Stakeholder Management |
| `MAL` | **Malware Analysis Basics** | Immersive Lab | Online (live) | 20 | 3 |  | Malware Analysis, Indicators of Compromise Analysis |
| `FOR` | **Digital Forensics & Evidence Handling** | Instructor Led | In-person | 24 | 3 |  | Digital Forensics |
| `CTI` | **Threat Intelligence with MITRE ATT&CK** | Instructor Led | Online (live) | 14 | 2 |  | Threat Intelligence Lifecycle, Threat Actor Profiling, Threat Reporting |
| `OSI` | **OSINT Investigations** | Immersive Lab | Online (live) | 8 | 1 |  | Open Source Intelligence |
| `WPT` | **Web Application Penetration Testing** | Immersive Lab | Hybrid | 24 | 3 |  | Penetration Testing, Web Security |
| `SCR` | **Secure Code Review** | Instructor Led | Online (live) | 12 | 2 |  | Application Security Review, Secure Development |
| `API` | **API Security in Practice** | Immersive Lab | Online (live) | 8 | 1 |  | API Security |
| `DSO` | **DevSecOps Pipelines** | Instructor Led | Hybrid | 12 | 2 |  | DevSecOps, Security Automation & Scripting |
| `TMW` | **Threat Modelling Workshop** | Workshop | In-person | 8 | 1 |  | Threat Modelling, Security Architecture |
| `CAP` | **Cloud Attack Paths** | Immersive Lab | Online (live) | 16 | 2 |  | Attack Path Analysis, Cloud Security |
| `CSF` | **Cloud Security Foundations** | Self Study | Self-paced | 12 | 2 |  | Cloud Security |
| `K8S` | **Kubernetes Security** | Instructor Led | Hybrid | 16 | 2 |  | Cloud Security, System Hardening |
| `NSF` | **Network Segmentation & Firewall Policy** | Instructor Led | In-person | 16 | 2 |  | Network Security |
| `HRD` | **System Hardening with CIS Benchmarks** | Immersive Lab | Online (live) | 8 | 1 |  | System Hardening, Endpoint Security |
| `EDR` | **Endpoint Hardening with EDR** | Instructor Led | Online (live) | 10 | 2 |  | Endpoint Security |
| `VMP` | **Vulnerability Prioritisation with CVSS and EPSS** | Virtual Session | Online (live) | 6 | 1 |  | Patch & Vulnerability Management |
| `PKI` | **PKI and Secrets Management** | Instructor Led | Online (live) | 8 | 1 |  | Certificate & Key Management |
| `ZTA` | **Zero Trust Identity Architecture** | Instructor Led | Online (live) | 12 | 2 |  | Access Control, Identity Management, Security Architecture |
| `PAM` | **Privileged Access Management in Practice** | Instructor Led | Hybrid | 16 | 2 |  | Access Control |
| `ARC` | **Security Architecture Patterns** | Instructor Led | Hybrid | 16 | 2 |  | Security Architecture, Systems Thinking |
| `ISO` | **ISO 27001 Implementation** | Instructor Led | Hybrid | 24 | 3 |  | Control Frameworks, Compliance Management, Policy & Standards Development |
| `RSK` | **Risk Assessment & Treatment** | Workshop | In-person | 8 | 1 |  | Risk Assessment, Risk Treatment Planning |
| `FAIR` | **Risk Quantification with FAIR** | Instructor Led | Online (live) | 14 | 2 |  | Risk Assessment, Security & Risk Governance |
| `AUD` | **Audit Evidence & Sampling** | Instructor Led | In-person | 12 | 2 |  | Internal Auditing, Attention to Detail |
| `NIS` | **NIS2 and DORA Readiness** | Compliance & Awareness | Online (live) | 6 | 1 |  | Compliance Management, Operational Resilience |
| `POL` | **Writing Security Policies People Follow** | Workshop | Online (live) | 4 | 1 |  | Policy & Standards Development, Communication |
| `BIA` | **Business Impact Analysis Workshop** | Workshop | In-person | 6 | 1 |  | Business Impact Analysis, Dependency Mapping |
| `BCP` | **Business Continuity & Disaster Recovery Planning** | Instructor Led | Hybrid | 16 | 2 |  | Business Continuity Planning, Disaster Recovery, Backup & Recovery |
| `AWR` | **Security Awareness Annual Refresher** | Compliance & Awareness | Self-paced | 1.5 | 1 |  | Security Awareness |
| `AIS` | **AI for Security Teams** | Virtual Session | Online (live) | 6 | 1 |  | Security Automation & Scripting, Innovation |
| `AIL` | **Prompting & AI Safety at Work** | Self Study | Self-paced | 3 | 1 |  | Innovation, Continuous Learning |
| `PY` | **Python for Security Automation** | Self Study | Self-paced | 20 | 4 |  | Security Automation & Scripting |
| `ROT-SOC` | **SOC Shadowing Programme** | Cross-Functional Rotation | In-person | 24 | 5 |  | Cross-Team Integration, Security Monitoring & Detection |
| `ROT-CLD` | **Cloud Security Rotation** | Cross-Functional Rotation | Hybrid | 40 | 10 |  | Cross-Team Integration, Cloud Security |
| `ROT-GRC` | **GRC for Engineers** | Cross-Functional Rotation | Online (live) | 12 | 3 |  | Cross-Team Integration, Risk Assessment |
| `ROT-PUR` | **Red Team / Blue Team Exchange** | Cross-Functional Rotation | In-person | 16 | 4 |  | Cross-Team Integration, Penetration Testing, Security Monitoring & Detection |
| `PREP-SEC` | **Security+ Exam Preparation** | Certification Preparation | Online (live) | 16 | 4 |  | Risk Assessment, Network Security |
| `PREP-CISSP` | **CISSP Exam Preparation** | Certification Preparation | Hybrid | 40 | 5 |  | Security & Risk Governance, Security Architecture |
| `PREP-CISM` | **CISM Exam Preparation** | Certification Preparation | Online (live) | 24 | 4 |  | Security & Risk Governance, Risk Treatment Planning |

## Certifications

| Code | Certification | Provider | Track | Difficulty | Valid (months) | Proves |
| --- | --- | --- | --- | --- | --- | --- |
| `SECPLUS` | **CompTIA Security+** | CompTIA | Professional | Foundation | 36 | Risk Assessment, Network Security, Security Monitoring & Detection |
| `NETPLUS` | **CompTIA Network+** | CompTIA | Professional | Foundation | 36 | Network Security |
| `CYSA` | **CompTIA CySA+** | CompTIA | Professional | Intermediate | 36 | Security Monitoring & Detection, Indicators of Compromise Analysis |
| `GCIH` | **GIAC Certified Incident Handler (GCIH)** | GIAC | Professional | Intermediate | 48 | Incident Response |
| `GCFA` | **GIAC Certified Forensic Analyst (GCFA)** | GIAC | Professional | Advanced | 48 | Digital Forensics |
| `GCTI` | **GIAC Cyber Threat Intelligence (GCTI)** | GIAC | Professional | Advanced | 48 | Threat Intelligence Lifecycle, Threat Actor Profiling |
| `GWAPT` | **GIAC Web Application Penetration Tester (GWAPT)** | GIAC | Professional | Advanced | 48 | Penetration Testing, Web Security |
| `EJPT` | **INE Junior Penetration Tester (eJPT)** | INE | Professional | Foundation | 36 | Penetration Testing |
| `OSCP` | **OffSec Certified Professional (OSCP)** | OffSec | Professional | Advanced | — | Penetration Testing, Attack Path Analysis |
| `CSSLP` | **Certified Secure Software Lifecycle Professional (CSSLP)** | ISC2 | Professional | Advanced | 36 | Secure Development, DevSecOps |
| `CISSP` | **Certified Information Systems Security Professional (CISSP)** | ISC2 | Professional | Advanced | 36 | Security & Risk Governance, Security Architecture |
| `CCSP` | **Certified Cloud Security Professional (CCSP)** | ISC2 | Professional | Advanced | 36 | Cloud Security |
| `CISM` | **Certified Information Security Manager (CISM)** | ISACA | Professional | Advanced | 36 | Security & Risk Governance, Risk Treatment Planning |
| `CISA` | **Certified Information Systems Auditor (CISA)** | ISACA | Professional | Advanced | 36 | Internal Auditing |
| `CRISC` | **Certified in Risk and Information Systems Control (CRISC)** | ISACA | Professional | Advanced | 36 | Risk Assessment, Risk Treatment Planning |
| `ISO-LI` | **ISO/IEC 27001 Lead Implementer** | PECB | Professional | Intermediate | 36 | Control Frameworks, Compliance Management |
| `ISO-LA` | **ISO/IEC 27001 Lead Auditor** | PECB | Professional | Intermediate | 36 | Internal Auditing, Control Frameworks |
| `CBCI` | **BCI Certificate (CBCI)** | Business Continuity Institute | Professional | Intermediate | 12 | Business Continuity Planning, Business Impact Analysis |
| `CCISO` | **EC-Council Certified CISO (CCISO)** | EC-Council | Professional | Expert | 36 | Security & Risk Governance, Leadership |
| `SC300` | **Microsoft Identity and Access Administrator (SC-300)** | Microsoft | Vendor / Product | Intermediate | 12 | Identity Management, Access Control |
| `AZ500` | **Microsoft Azure Security Engineer (AZ-500)** | Microsoft | Vendor / Product | Intermediate | 12 | Cloud Security |
| `AWSSEC` | **AWS Certified Security – Specialty** | Amazon Web Services | Vendor / Product | Advanced | 36 | Cloud Security |
| `AI900` | **Microsoft Azure AI Fundamentals (AI-900)** | Microsoft | AI | Foundation | — | Innovation |
| `AWSAI` | **AWS Certified AI Practitioner** | Amazon Web Services | AI | Foundation | 36 | Innovation |
| `AI102` | **Microsoft Azure AI Engineer Associate (AI-102)** | Microsoft | AI | Intermediate | 12 | Security Automation & Scripting, Innovation |
| `AIGP` | **IAPP Artificial Intelligence Governance Professional (AIGP)** | IAPP | AI | Intermediate | 24 | Security & Risk Governance, Compliance Management |
| `GENAI` | **Google Cloud Generative AI Leader** | Google Cloud | AI | Foundation | 36 | Strategic Thinking, Innovation |

## Observed behaviours

Scored 1–5 by trainers on every day of an observed course. Each one is evidence for one competency.

| Code | Behaviour | Category | Evidence for | What to look for |
| --- | --- | --- | --- | --- |
| `OB-01` | **Confidence / composure** | Personal Effectiveness | Presentation Delivery | Speaks and acts with composure, also when challenged. |
| `OB-02` | **Accountability / follow-through** | Personal Effectiveness | Performance Management | Does what they said they would do and owns the result. |
| `OB-03` | **Emotional regulation** | Personal Effectiveness | Tolerance for Uncertainty | Stays calm and constructive under pressure or frustration. |
| `OB-04` | **Openness to feedback** | Learning Agility | Continuous Learning | Listens to feedback without defending and asks for more. |
| `OB-05` | **Clarity of message** | Communication | Communication | The point is easy to understand the first time. |
| `OB-06` | **Structure of message** | Communication | Presentation Delivery | Messages have a clear beginning, logic and conclusion. |
| `OB-07` | **Active listening** | Communication | Relationship Building | Listens fully, checks understanding and builds on what others say. |
| `OB-08` | **Adaptation to audience** | Communication | Stakeholder Management | Adjusts detail, language and tone to who is listening. |
| `OB-09` | **Conciseness** | Communication | Communication | Says what matters without padding. |
| `OB-10` | **Participation** | Collaboration | Cross-Team Integration | Contributes actively to group work. |
| `OB-11` | **Respectful interaction** | Collaboration | Relationship Building | Treats everyone with respect, including in disagreement. |
| `OB-12` | **Influence in group** | Collaboration | Strategic Influence | Moves the group's thinking or decisions. |
| `OB-13` | **Conflict handling** | Collaboration | Team Management | Addresses disagreement openly and resolves it constructively. |
| `OB-14` | **Collaboration** | Collaboration | Cross-Team Integration | Works with others towards a shared result rather than alone. |
| `OB-15` | **Problem definition** | Problem Solving | Problem Solving | Clarifies the real problem before jumping to solutions. |
| `OB-16` | **Logical thinking** | Problem Solving | Analytical Thinking | Reasons step by step and backs conclusions with facts. |
| `OB-17` | **Idea generation** | Problem Solving | Strategic Thinking | Comes up with several useful options. |
| `OB-18` | **Decision quality** | Problem Solving | Decision Making | Reaches sound decisions in reasonable time. |
| `OB-19` | **Initiative** | Personal Effectiveness | Operational Effectiveness | Acts without being asked when something needs doing. |
| `OB-20` | **Ownership** | Personal Effectiveness | Performance Management | Takes responsibility for outcomes, not just tasks. |
| `OB-21` | **Guiding others** | Leadership | Team Management | Helps others contribute and move forward. |
| `OB-22` | **Presence / authority** | Leadership | Leadership | Others look to them for direction. |
| `OB-23` | **Learning speed** | Learning Agility | Continuous Learning | Picks up new concepts and tools quickly. |
| `OB-24` | **Applies feedback** | Learning Agility | Continuous Learning | Visibly does things differently after feedback. |
| `OB-25` | **Reflection quality** | Learning Agility | Analytical Thinking | Draws specific, honest lessons from what happened. |
