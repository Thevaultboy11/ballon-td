# Reference library

Everything `npm run db:seed` loads into a new or existing database. All of it can be edited in the app on **Library**, and every row keeps a stable code, so the seed can be run again at any time: it only adds what is missing (`npm run db:seed -- --update` also overwrites the text of existing rows).

Generated from `server/seed/library/*.json` and `shared/lookups.ts` by `npm run docs:library`. Do not edit by hand.

## Contents
- [Totals](#totals)
- [Dropdown lists](#dropdown-lists)
- [Frameworks and categories](#frameworks-and-categories)
- [Competencies](#competencies)
- [Level indicators](#level-indicators)
- [Role profiles](#role-profiles)
- [Role requirements](#role-requirements)
- [Courses and programmes](#courses-and-programmes)
- [Lab collections](#lab-collections)
- [Certifications](#certifications)
- [Observed behaviours](#observed-behaviours)
- [Risk and opportunity rules](#risk-and-opportunity-rules)
- [Value assumptions](#value-assumptions)
- [KPI catalogue](#kpi-catalogue)
- [Starter library (demos only)](#starter-library-demos-only)

## Totals

| What | Rows | Where in the app |
| --- | ---: | --- |
| Dropdown lists | 49 lists, 306 values | Library → Dropdowns |
| Frameworks | 3 | Library → Frameworks |
| Competency categories | 5 | Library → Categories |
| Competencies | 160 | Library → Competencies |
| Level indicators (behaviour descriptors) | 3,244 | Library → Level indicators |
| Role profiles | 32 with requirements + 9 job titles without requirements yet | Library → Job roles |
| Role requirements | 620 | Library → Role requirements |
| Courses | 35 (15 catalogue courses, 1 observed programme, 6 boot camps, 1 LMS curriculum, 12 lab collections) | Library → Courses |
| Certifications | 39 | Library → Certifications |
| Observed behaviours | 25 | Library → Observed behaviours |
| Risk and opportunity rules | 36 | Library → Risk rules |
| Value assumptions | 17 | Library → Value assumptions, Value page |
| KPI catalogue | 205 KPIs (read-only reference) | Value → KPI scorecard |

## Dropdown lists

Lists marked *suggest* are offered as suggestions on free-text fields (organisation units and grades differ per client); every other list is enforced.

| List | Used for | Values |
| --- | --- | --- |
| **Programme status** `programStatus` | Where a client programme / IDP cycle is. | Planned · Active · On Hold · Completed · Cancelled |
| **Staff role** `staffRole` | What our own people do. One person can have several. | Consultant · Coach · Trainer · Assessor · Programme Manager · Administrator |
| **Employee status** `employeeStatus` | Whether the person is still in scope. | Active · On Leave · Left Company · Out of Scope |
| **Job family** `jobFamily` | Groups job roles into career tracks. | Security Operations · Threat Intelligence · Application Security · Offensive Security · Infrastructure & Cloud Security · Identity & Access · Governance, Risk & Compliance · Business Continuity & Resilience · Security Leadership · OT Security |
| **Grade** `jobGrade` | Grade-style job titles from client people registers (suggestions; free text allowed). The description gives the matching seniority. | Analyst · Engineer · Specialist · Senior Analyst · Senior Engineer · Section Head · Department Manager · VP |
| **Division** `orgDivision` | Suggested division names (a reusable template structure; free text allowed). Replace per client. | Digital Cybersecurity Operations Division · Group Information Security |
| **Department** `orgDepartment` | Suggested department names (template structure; free text allowed). | Digital Business Continuity & Cyber Threat Intelligence Department · Digital Cybersecurity Engineering Department · Digital Identity & Access Management Department · Digital Risk Management & Compliance Department · Digital Security Operations Center Department · OT Cybersecurity Department |
| **Section / team** `orgSection` | Suggested section names (template structure; free text allowed). The description names the department. | Digital Clouds & Applications Security Section · Digital Infrastructure Security Operations Section · Digital Vulnerability Management Section · Digital Cybersecurity Monitoring Section · Digital Threat Hunting Section · Downstream Industry, Marketing & Trading OT Cybersecurity Section · Upstream OT Cybersecurity Section · Cyber Threat Intelligence Section · Digital Business Continuity Management Section · Cyber Security Policies & Standards Section · IT Risk Management & Compliance Section · OT Risk Management & Compliance Section |
| **Seniority** `seniority` | Drives default required levels on role profiles. | Entry · Mid · Senior · Lead · Manager · Head · Executive |
| **Enrolment status** `enrollmentStatus` | A person's status in one programme. | Nominated · Enrolled · Active · On Hold · Completed · Withdrawn · Deferred |
| **Assessment type** `assessmentType` | How the levels were obtained. Each is its own Assessment, so history is kept. | Self-Assessment · Consultant Assessment · Validation Interview · Manager Assessment · 360 Feedback · Technical Test · Re-assessment |
| **Assessment status** `assessmentStatus` |  | Not Started · Invited · In Progress · Completed · Cancelled |
| **Report status** `reportStatus` | Status of the individual report that goes to the client. | Not Started · In Draft · In Review · Delivered |
| **Priority** `priority` | How important a competency is for a role. Used as weights: High 3, Medium 2, Low 1. | High · Medium · Low |
| **Validation status** `validationStatus` | Manager validation outcome. | Pending · Approved · Rejected · Requires Further Evidence |
| **Progress scale (1–5)** `progressScale` | Used by coaches and line managers to score progress on a behaviour or skill (Validated level on a manager validation). | 1 - Not Started / No Exposure · 2 - Limited progress or competence · 3 - On Track · 4 - Good Effort · 5 - Fully Achieved |
| **Development action type** `idpActionType` | What kind of action is planned in the IDP. | Training · Workshop · Certification · Coaching · Mentoring · Project Assignment · Shadowing · Cross-Functional Rotation · Reading · Research · Simulation · Learning Plan Segment · Department Training Need |
| **Plan segment** `idpSegment` | The fixed structure of an individual development plan: five segments and the department training need. | S1 Professional certification · S2 Hands-on labs · S3 AI certification · S4 LMS learning · S5 Cross-functional training · DTN Department training need |
| **Development action status** `idpStatus` | "Overdue" is calculated (planned end passed and not completed), so it is not in this list. | Planned · Not Started · In Progress · Completed · On Hold · Deferred · Cancelled |
| **Course type** `courseType` | The training categories of the catalogue. | Instructor Led · Workshop · Leadership Programme · Virtual Session · Immersive Lab · Simulation · Self Study · Certification Preparation · Cross-Functional Rotation · On The Job Training · Project Assignment · Mentoring · Coaching · Compliance & Awareness · Boot Camp |
| **Delivery mode** `deliveryMode` |  | In-person · Online (live) · Hybrid · Self-paced |
| **Difficulty** `difficulty` |  | Foundation · Intermediate · Advanced · Expert |
| **Session status** `sessionStatus` | Status of one run of a course. | Planned · Scheduled · In Progress · Completed · Postponed · Cancelled |
| **Training status** `trainingStatus` | One person on one course. | Assigned · Not Started · In Progress · Completed · Incomplete · No-show · Cancelled · Deferred · Expired |
| **Attendance** `attendance` | Attendance on one day of a course. | Present · Partial · Absent · Excused |
| **Observation category** `observationCategory` | Groups the behaviours trainers score. | Personal Effectiveness · Communication · Collaboration · Problem Solving · Leadership · Learning Agility |
| **Observation score (1–5)** `observationScore` | The score labels trainers use on the daily behaviour grid. | 1 - Does not meet expectations · 2 - Below expectations · 3 - Average · 4 - Meets expectations · 5 - Exceeds expectations |
| **Potential / risk note** `potentialNote` | The trainer's overall read on the person after a day. | High potential · Promising · Steady · Needs support · At risk |
| **Certification track** `certTrack` |  | Professional · AI · Vendor / Product · Internal |
| **Certification status** `certStatus` |  | Assigned · Not Started · Registered · In Progress · Exam Scheduled · Completed · Failed · Deferred · Expired · Not Required |
| **Exam result** `examResult` |  | Pass · Fail · Pending · Not Taken |
| **Coaching session type** `coachingType` |  | Kick-off · Monthly Check-In · Capability Review · Performance Coaching · Certification Coaching · Development Review · Feedback Session · Career Coaching · Close-out |
| **Coaching session status** `coachingStatus` |  | Scheduled · Completed · Rescheduled · Cancelled · No-show |
| **Evidence type** `evidenceType` |  | Project · Presentation · Assessment · Certification · Workshop · Training · Report · Case Study · Simulation · Manager Validation · Peer Feedback · Artifact · Line Manager Confirmation · Workplace Assignment |
| **Verification status** `verificationStatus` |  | Submitted · Under Review · Verified · Rejected · Needs More Information |
| **Baseline: confidence** `baselineConfidence` | Self-reported. The number is the position used for the baseline score. | 1 - Not at all confident · 2 - Slightly confident · 3 - Neutral · 4 - Confident · 5 - Very confident |
| **Baseline: emotional regulation** `baselineEmotionalRegulation` | Self-reported. | 1 - Poor regulation · 2 - Somewhat regulated · 3 - Average regulation · 4 - Developed regulation · 5 - Excellent regulation |
| **Baseline: communication** `baselineCommunication` | Self-reported. | 1 - Poor communication · 2 - Below average · 3 - Average · 4 - Above average · 5 - Excellent |
| **Baseline: accountability** `baselineAccountability` | Self-reported. | 1 - Poor accountability · 2 - Below average · 3 - Average accountability · 4 - Above average · 5 - High accountability |
| **Baseline: productivity** `baselineProductivity` | Self-reported. | 1 - Poor productivity · 2 - Below average · 3 - Average · 4 - Above average · 5 - High productivity |
| **Baseline: organisation skills** `baselineOrganisation` | Self-reported. | 1 - Poor organisation · 2 - Below average · 3 - Average · 4 - Above average · 5 - High organisation |
| **Personality type (MBTI)** `mbti` | Self-reported. Sensitive: keep out of client-wide reports. | ISTJ · ISFJ · INFJ · INTJ · ISTP · ISFP · INFP · INTP · ESTP · ESFP · ENFP · ENTP · ESTJ · ESFJ · ENFJ · ENTJ |
| **Risk severity** `riskSeverity` | Sort order: High 1, Medium 2, Low 3, Opportunity 4. | High · Medium · Low · Opportunity |
| **Risk panel** `riskPanel` | Where a rule is shown on the dashboard. | Skill Gap Risks · Capability and Behaviour Risks · Development Plan Risks |
| **Risk area** `riskArea` |  | Capability · Behaviour · Development Plan · Assessment · Group View |
| **Value assumption group** `valueGroup` | Where an assumption is used on the Value & ROI page. | Cost rate · Benefit model · Adjustment · Display |
| **Value assumption basis** `valueBasis` | How solid a value is. | Fact · Estimate · Assumption · Client data |
| **Risk applies to** `riskAppliesTo` |  | Individual and Group · Group |
| **Source** `source` | Where a record came from. The client cannot use the app, so most of their input arrives by email or Excel and is typed in by us. | Direct entry · Email from client · Excel from client · Meeting / interview · Phone call · LMS / platform export · Trainer sheet · Imported |

## Frameworks and categories

**Client Technical Framework (Digital & Cybersecurity)** (`TECHCS`, scale 0–4) — Technical / functional cybersecurity competencies of the client role profiles.

- `GD&CS` Technical Cybersecurity — 135 competencies

**Lexonis Cross-functional Competencies** (`LEXCROSS`, scale 1–4, external ID `lexcross`) — Behavioural and leadership competencies (Lexonis library).

- `LEX_CF` Business — 4 competencies
- `LEX_LM` Leadership and Management — 8 competencies
- `LEX_ORG` Personal — 11 competencies

**Lexonis Functional Competencies** (`LEXFUNCT`, scale 1–4, external ID `lexfunct`) — Functional competencies (Lexonis library), project and programme management.

- `LEX_PP` Project and Program Management — 2 competencies

## Competencies

Codes like `AICI-001` are technical competencies; `LXSCN…` are cross-functional (behavioural) competencies and keep their source ID in *External ID*. *Indicators* is the number of level indicators, *Roles* the number of role profiles that require it.

### Technical Cybersecurity (135)

| Code | Competency | Levels | Indicators | Roles | Description |
| --- | --- | --- | ---: | ---: | --- |
| `AICI-001` | **Asset Inventory and CMDB Integration** | 0–4 | 20 | 1 | The ability to maintain complete, accurate, and continuously updated records of enterprise servers and related configuration data within asset inventory and CM… |
| `AM-001` | **Access Management** | 0–4 | 20 | 1 | The ability to define, enforce, review, and optimize access control models, including entitlements, RBAC and policy engines, to uphold least privilege, enforce… |
| `APKCE-001` | **Attack-Path & Kill-Chain Engineering** | 0–4 | 20 | 1 | The ability to transform threat-intelligence and reconnaissance data into multi-stage kill-chains that reveal exploitable infrastructure, user-journey and proc… |
| `AS-002` | **Application Security** | 0–4 | 20 | 6 | The ability to effectively identify, assess, mitigate, and manage application security risks throughout the software development lifecycle. |
| `ASD-001` | **Application Security Development** | 0–4 | 20 | 5 | The ability to embed security throughout the software development and lifecycle management process by ensuring that applications are designed, built, deployed,… |
| `ASR-001` | **Application Security Review** | 0–4 | 20 | 3 | The ability to perform in-depth application security reviews across the software development lifecycle by leveraging structured review processes, code analysis… |
| `ATAC-001` | **APT Tracking & Attribution CTI** | 0–4 | 20 | 1 | The ability to correlate technical indicators, malware artefacts, network telemetry, TTPs, with geopolitical context, sector-specific targeting patterns, and b… |
| `BCDRSP-001` | **Business Continuity & Disaster Recovery Strategy and Planning** | 0–4 | 20 | 1 | The ability to design, implement, and govern the organisation's Business Continuity and Disaster Recovery strategies in alignment with ISO 22301 standard, inte… |
| `BCDRTEAM-001` | **BCDR Testing, Exercise and Awareness Management** | 0–4 | 20 | 2 | The ability to plan, execute, and govern business continuity and disaster recovery (BCDR) testing, simulation exercises, and awareness programs that validate o… |
| `BIAB-001` | **Business Impact Analysis (BIA)** | 0–4 | 20 | 2 | The ability to plan, conduct, and govern Business Impact Analyses (BIA) to identify critical business and technical functions, assess disruption impacts, and t… |
| `BRT-001` | **Backup and Recovery Technologies** | 0–4 | 20 | 1 | The ability to design, implement, manage, and govern backup and recovery technologies and procedures to ensure data integrity, availability, and rapid restorat… |
| `BSDM-001` | **Business Service Dependency Mapping** | 0–4 | 20 | 1 | The ability to identify and document end-to-end service architecture, business-critical dependencies, and technical interconnections across IT and OT domains,… |
| `CABP-001` | **Cybersecurity and Business Partnering** | 0–4 | 20 | 0 | The ability to advise and guide business and cybersecurity stakeholders on aligning risk and compliance priorities to ensure that security objectives are balan… |
| `CAG-001` | **Cyber Assurance Governance** | 0–4 | 20 | 0 | The ability to advise and guide on the planning, execution, and governance of cyber assurance assessments across IT and OT to ensure control effectiveness is i… |
| `CAS-001` | **Cloud Automation and Scripting** | 0–4 | 20 | 5 | The ability to design and implement scripts, API integrations, and infrastructure-as-code (IaC) to automate the enforcement of security controls, collection of… |
| `CDL-001` | **Cybersecurity Data Lake** | 0–4 | 20 | 4 | The ability to design, operate, and leverage cybersecurity data lakes to ingest, normalize, correlate, and analyze diverse security telemetry (e.g., vulnerabil… |
| `CEOIS-001` | **Cyber Exercise & Operational Intelligence Support** | 0–4 | 20 | 1 | The ability to embed targeted, high-fidelity threat intelligence into cybersecurity drills, Security Operations Center (SOC) workflows, and time-sensitive oper… |
| `CIM-001` | **Cloud Identity Management** | 0–4 | 20 | 1 | The ability to manage and govern identities, roles, secrets, and access policies across multi-cloud environments, integrating with on-premises directories to e… |
| `CIMRC-001` | **Cybersecurity Incident Management, Response, and Coordination** | 0–4 | 20 | 9 | The ability to detect, assess, respond to, and coordinate resolution of cybersecurity incidents across IT and OT environments, ensuring minimal business disrup… |
| `CM-001` | **Crisis Management** | 0–4 | 20 | 0 | The ability to prepare for, respond to, and lead organizational crisis situations by activating structured plans, enabling informed decision-making, managing i… |
| `CRGS-001` | **Cyber Risk Governance & Strategy** | 0–4 | 20 | 6 | The ability to define and implement cybersecurity risk governance models, strategies, and frameworks aligned with the organisation's business objectives, risk… |
| `CSA-001` | **Cloud Security Architecture** | 0–4 | 20 | 4 | The ability to designs secure cloud architectures by integrating workload protection, identity and access control, and network segmentation using cloud-native… |
| `CSDSP-001` | **Collection Strategy & Data-Source Prioritization** | 0–4 | 20 | 1 | The ability to transforms PIRs into focused collection plans selecting and prioritizing the most valuable data sources aligned to mission-critical assets and t… |
| `CSM-001` | **Cloud Security Monitoring** | 0–4 | 20 | 4 | The ability to monitor security events across cloud platforms (e.g., AWS, Azure, GCP) by analyzing logs, detecting misconfigurations, access misuse, and cloud-… |
| `CSM-002` | **Cloud Security Management** | 0–4 | 20 | 4 | The ability to operationalize and govern cloud security architectures, services, and controls across IaaS, PaaS, and SaaS environments, leveraging provider-nat… |
| `CSMS-001` | **Cyber Security Management System (CSMS)** | 0–4 | 20 | 6 | The ability to implement, operate, and continuously enhance a Cyber Security Management System (CSMS) that satisfies ISA/IEC 62443, ISO 27001, and UAE regulato… |
| `CSPM-001` | **Cloud Services Patch Management** | 0–4 | 20 | 0 | The ability to plan, automate, and govern Windows and Linux patching across cloud environments (AWS, Azure, GCP) to ensure systems remain secure, reliable, and… |
| `CSRG-001` | **Cloud Security Risk Management** | 0–4 | 20 | 5 | The ability to identify, evaluate, and govern cloud-security risks, ensuring compliant, resilient, and cost-optimised cloud operations across the enterprise. |
| `CTBDEM-001` | **Continuity Testing & BC/DR Exercise Management** | 0–4 | 20 | 2 | The ability to design, execute, and manage structured continuity testing programs, including business continuity and disaster recovery (BC/DR) drills, tabletop… |
| `CTIC-001` | **Cyber Threat Intelligence (CTI)** | 0–4 | 21 | 5 | The ability to collect, enrich, analyze, and operationalize threat data and adversary behaviors to produce actionable intelligence that informs cybersecurity d… |
| `CTIO-001` | **Cyber Threat Intelligence for OT** | 0–4 | 20 | 5 | The ability to collect, analyse, and apply cyber-threat intelligence that is specific to Operational Technology (OT) and industrial control systems (ICS) used… |
| `CVM-001` | **Cybersecurity Vendor Management** | 0–4 | 20 | 0 | The ability to assess, select, onboard, monitor, and govern external cybersecurity vendors and service providers to ensure they meet organizational security, o… |
| `DAC-002` | **Data Analytics for Cybersecurity** | 0–4 | 20 | 7 | The ability to collect, normalize, analyze, and visualize security-relevant data to detect anomalies, interpret adversary behavior, assess control effectivenes… |
| `DDUGE-001` | **Data-Diode & Unidirectional-Gateway Engineering** | 0–4 | 20 | 2 | The ability to design, deploy, and maintain data-diode solutions to securely transfer OT data one-way, preventing inbound threats and ensuring compliance with… |
| `DE-001` | **Detection Engineering** | 0–4 | 20 | 4 | The ability to design, tune, and validate detection logic, including analytics, correlation rules, and signatures, that reliably identifies malicious activity… |
| `DF-003` | **Digital Forensics** | 0–4 | 20 | 3 | The ability to collect, preserve, analyze, and present digital evidence to support investigations of computer-related incidents maintain its integrity for use… |
| `DIR-001` | **Data Incident Response** | 0–4 | 20 | 0 | The ability to triage, investigate, and assess data breaches by coordinating forensic analysis and response teams to contain impact, while ensuring timely repo… |
| `DLPD-001` | **Data Loss Prevention (DLP)** | 0–4 | 20 | 0 | The ability to deploy, calibrate, and monitor endpoint, email, and cloud-based DLP controls that detect, alert, and prevent unauthorized transmission or exfilt… |
| `DML-001` | **Data Management Lifecycle** | 0–4 | 20 | 0 | The ability to design and enforce data-classification schemas, handling rules, and retention schedules, applying labelling tools and automated workflows across… |
| `DOSIOC-001` | **Deep Open-Source Intelligence (OSINT) Collection** | 0–4 | 20 | 1 | The ability to systematically gathers and enriches open-source and dark-web data to inform red-team planning, craft convincing social-engineering lures, and pi… |
| `DPG-001` | **Data Protection Governance** | 0–4 | 20 | 0 | The ability to develop and deploy an enterprise data-protection governance model and strategic roadmap spanning privacy, classification, information lifecycle… |
| `DPIAD-001` | **Data Privacy Impact Assessment (DPIA)** | 0–4 | 20 | 0 | The ability to assess projects, systems, and third-party vendors for privacy risk by documenting lawful basis, data flows, risk mitigations, and residual impac… |
| `DRCI-001` | **Digital Resilience & Cybersecurity Integration** | 0–4 | 20 | 1 | The ability to embed cybersecurity requirements, threat intelligence insights, and cyber resilience principles into business continuity strategies, ensuring th… |
| `DRM-001` | **Data Rights Management** | 0–4 | 20 | 0 | The ability to orchestrate end-to-end workflows for data subject rights requests, including identity verification, data retrieval, redaction, and secure fulfil… |
| `DRSD-001` | **Data Retention & Secure Disposal** | 0–4 | 20 | 0 | The ability to align and enforce data retention and disposal practices by harmonizing legal hold obligations, operational needs, and UAE regulatory requirement… |
| `DRSI-001` | **Data Regulatory & Standards Interpretation** | 0–4 | 20 | 0 | The ability to monitor, interpret and translate evolving UAE and international privacy regulations into actionable controls, updated policies, and enterprise-w… |
| `ECAF-001` | **Enterprise Control and Assurance Framework** | 0–4 | 20 | 0 | The ability to design and maintain cybersecurity control frameworks across IT and OT, standardizing testing, mapping risks, scoring criticality, and enabling t… |
| `ECAPM-001` | **Enterprise Cybersecurity Assurance Program Management** | 0–4 | 20 | 0 | The ability to lead a cybersecurity assurance program, aligning assessments and projects to strategic objectives, standardizing methods, coordinating vendors,… |
| `ERMIR-001` | **Enterprise Risk Management Integration & Reporting** | 0–4 | 20 | 6 | The ability to integrate cybersecurity risk management into Enterprise Risk Management (ERM) frameworks and report risk status and trends to senior governance… |
| `ESA-001` | **Enterprise Security Architecture** | 0–4 | 20 | 4 | The ability to design, assess, and govern secure digital infrastructure architectures across IT, OT, and cloud environments by embedding security-by-design pri… |
| `ESI-001` | **Endpoint Security (IT)** | 0–4 | 20 | 10 | The ability to design, implement, operate, and govern security protections for individual computing devices (e.g., laptops, servers, mobile devices, virtual ma… |
| `ESO-001` | **Endpoint Security (OT)** | 0–4 | 20 | 10 | The ability to secure industrial endpoint devices, such as PLCs, RTUs, HMIs, and safety systems, by applying security configuration, monitoring, and risk mitig… |
| `ETTTE-001` | **Emerging Threat Technologies and Tools Evaluation** | 0–4 | 20 | 1 | The ability to identify, assess, and trial advanced threat intelligence platforms, data sources, and analytical tools to improve threat detection, attribution,… |
| `EXT-001` | **EDR/XDR Tooling** | 0–4 | 20 | 4 | The ability to deploy, configure, and operationalize Endpoint Detection and Response (EDR) and Extended Detection and Response (XDR) platforms to achieve compr… |
| `IA-001` | **IAM Architecture** | 0–4 | 20 | 1 | The ability to design and evolve holistic IAM blueprints, reference patterns, and technology roadmaps that align identity capabilities with enterprise architec… |
| `IA-002` | **IAM Automation** | 0–4 | 20 | 1 | The ability to streamline identity lifecycle management, access provisioning, policy enforcement, and compliance reporting through automated workflows and inte… |
| `IAI-001` | **IAM Application Integration** | 0–4 | 20 | 1 | The ability to build, secure, and maintain REST/SCIM integrations, using tokens, webhooks, and service identities that synchronise identity data and extend IAM… |
| `ICER-001` | **Internal Controls Evaluation for Resilience** | 0–4 | 20 | 11 | The ability to systematically review, test, and enhance internal business, IT, OT, and third-party controls, spanning policies, processes, and technical safegu… |
| `IG-001` | **IAM Governance** | 0–4 | 20 | 1 | The ability to establish, measure, and enforce IAM policies, roles, workflows, and accountability structures to ensure identity decisions align with organizati… |
| `IICR-001` | **IT Infrastructure and Cloud Resilience** | 0–4 | 20 | 1 | The ability to design, implement, and govern resilient IT and cloud infrastructure architectures, ensuring system availability, recoverability, and continuity… |
| `IOPSAT-001` | **ICS/OT Penetration & Safety-Aware Testing** | 0–4 | 20 | 0 | The ability to plan and executive penetration tests against industrial control systems and operational technology (OT) while preserving human / process safety,… |
| `IOS-001` | **IAM for OT Systems** | 0–4 | 20 | 2 | The ability to manage and secure human and machine identities in OT environments by enforcing least privilege, MFA, and access governance, aligned with IEC 624… |
| `ISA-001` | **Internal Security Audit** | 0–4 | 20 | 6 | The ability to systematically evaluates an organization's information security controls, policies, and procedures through structured assessment methodologies t… |
| `ISA-002` | **Information Security Awareness** | 0–4 | 20 | 0 | The able to design and deliver awareness programs that embed UAE regulations and corporate data protection and privacy policies into daily practices promoting… |
| `ISGRC-001` | **Information Security Governance and Regulatory Compliance** | 0–4 | 20 | 6 | The ability to interpret, implement, monitor, and continuously improve information security governance frameworks and cybersecurity requirements from internati… |
| `KPM-001` | **Kubernetes Patch Management** | 0–4 | 20 | 0 | The ability to plan, execute, and govern patching activities across Kubernetes clusters and their underlying components to ensure security, stability, and comp… |
| `LM-001` | **Log Management** | 0–4 | 20 | 4 | The ability to collect, normalize, store, and govern security-relevant log data to ensure its integrity, availability, and usability for threat monitoring, for… |
| `MA-001` | **Malware Analysis** | 0–4 | 20 | 4 | The ability to dissect and analyze malicious code to uncover its functionality, identify behavioral patterns, extract indicators of compromise (IOCs), and reco… |
| `NIS-001` | **Network & Infrastructure Security** | 0–4 | 20 | 4 | The ability to design, implement, monitor, and evolve secure, resilient, and compliant network infrastructure across IT and OT environments. This includes safe… |
| `NSM-001` | **Network Security Monitoring** | 0–4 | 20 | 4 | The ability to monitor and analyze network traffic using IDS, flow data, and packet analysis tools to detect and investigate suspicious activity, validate IOCs… |
| `OCI-001` | **OT Cybersecurity** | 0–4 | 20 | 4 | The ability to assess, implement, and govern cybersecurity controls for Operational Technology (OT) and Industrial Control Systems (ICS), in accordance with IE… |
| `ODC-001` | **OT Downstream Cybersecurity** | 0–4 | 20 | 1 | The ability to secure and protect operational technology (OT) systems in downstream oil and gas operations, including refining, petrochemical processing, and d… |
| `OIRF-001` | **OT Incident Response & Forensics** | 0–4 | 20 | 2 | The ability to manages OT cyber incident response coordinating containment, recovery, and forensics while maintaining safety and compliance with UAE critical i… |
| `OISAIC-001` | **OT/ICS Security Assurance and IEC 62443 Conformance** | 0–4 | 20 | 0 | The ability to plan and execute OT assurance that sustains IEC 62443 conformance, prioritises safety, and proves control effectiveness across plants, pipelines… |
| `OKD-001` | **OT KPIs & Dashboarding** | 0–4 | 20 | 0 | The ability to develop and maintain OT security KPIs and dashboards that visualize risk, control performance, and compliance to support data-driven decisions a… |
| `OND-001` | **OT Network Design** | 0–4 | 20 | 2 | The ability to design and enforce OT network architectures using zoning and segmentation to block unauthorized traffic, protect SIS, and reduce lateral movemen… |
| `OPSV-001` | **OT Project Security Validation** | 0–4 | 20 | 2 | The ability to ensure OT cybersecurity requirements are embedded and verified across EPCC project phases, aligning with corporate standards, UAE regulations, a… |
| `OPVM-001` | **OT Patch & Vulnerability Management** | 0–4 | 20 | 2 | The ability to identify, prioritize, and remediate vulnerabilities in OT environments while maintaining safety, minimizing production downtime, and meeting UAE… |
| `ORC-001` | **OT Regulatory Compliance** | 0–4 | 20 | 0 | The ability to ensure OT security control alignment with ISA/IEC 62443 and UAE regulations by managing compliance programs, audits, and evidence across critica… |
| `OSBCM-001` | **OT Security Baselines & Configuration Management** | 0–4 | 20 | 2 | The ability to define, implement, and verify hardened security baselines for Operational Technology (OT) systems to reduce cyber risk and attack surface across… |
| `OTDM-001` | **OT Threat Detection & Monitoring** | 0–4 | 20 | 4 | The ability to detects, analyze, and alert on threats across industrial networks and control systems to protect critical OT assets, aligned with UAE regulation… |
| `OUC-001` | **OT Upstream Cybersecurity** | 0–4 | 20 | 1 | The ability to secure and protect operational technology (OT) systems involved in upstream oil and gas operations (exploration and production) ensuring resilie… |
| `OWCCCR-001` | **OPSEC Workplace (Covert Command-and-Control Resilience)** | 0–4 | 20 | 1 | The ability to design and maintain resilient command-and-control (C) infrastructures (leveraging staging servers, proxy chains, domain fronting, and layered en… |
| `PAMPG-001` | **Privileged Access Management (PAM) Governance** | 0–4 | 20 | 1 | The ability to govern, assure, and monitor privileged access across IT, cloud, and OT, enforcing policy, evidencing compliance, and detecting misuse through st… |
| `PCAR-001` | **Patch Compliance and Audit Readiness** | 0–4 | 20 | 0 | The ability to analyze, prioritize, and manage vulnerabilities that drive patching decisions, ensuring remediation efforts focus on the highest-risk exposures. |
| `PCM-001` | **PKI & Certificate Management** | 0–4 | 20 | 4 | The ability to architect, implement, and govern cryptographic ecosystems, spanning certificate lifecycle management, public key infrastructure (PKI), and cloud… |
| `PDSMK-001` | **Privacy & Data Security Metrics/KPIs** | 0–4 | 20 | 0 | The ability to define, capture, and visualize key privacy and data security indicators (e.g., DPIA completion rates, DLP incident trends, etc.) aligned with UA… |
| `PLRM-001` | **Patch Lifecyle and Release Management** | 0–4 | 20 | 0 | The ability to manage the complete lifecycle of software patches, from vendor release through internal validation, controlled deployment, and decommissioning ,… |
| `PM-001` | **Patch Management** | 0–4 | 20 | 6 | The ability to identify, prioritize, deploy, verify, and track security patches and compensating mitigations across IT, OT, and cloud environments, aligned wit… |
| `PMOSP-001` | **Preventive Maintenance for OT Security Platforms** | 0–4 | 20 | 2 | The ability to implement preventive maintenance for OT security platforms, aligning with vendor guidance, UAE regulations, and oil and gas uptime requirements… |
| `PMPO-001` | **Patch Management Platform Operation** | 0–4 | 20 | 0 | The ability to effectively use, configure, and optimize enterprise patch management platforms to plan, deploy, monitor, and report on system updates across Win… |
| `PPSD-001` | **Policy, Procedure & Standards Development** | 0–4 | 20 | 7 | The ability to design, document, deploy, and continuously improve cybersecurity policies, procedures, and standards, establishing clear governance, data-handli… |
| `PRACI-001` | **Patch Reporting, Analytics and Continuous Improvement** | 0–4 | 20 | 0 | The ability to collect, analyze, and communicate patch management metrics to drive transparency, compliance, and ongoing performance enhancement. |
| `PSHCRA-001` | **Process-Safety & HSE Cyber-Risk Alignment** | 0–4 | 20 | 2 | The ability to integrate cybersecurity risk into process safety and HSE frameworks to protect OT, SIS, and emergency systems, ensuring alignment with corporate… |
| `PT-001` | **Penetration Testing** | 0–4 | 20 | 3 | The ability to simulate cyberattacks against computer systems, networks, applications, and physical infrastructure to identify security vulnerabilities and hel… |
| `PTE-001` | **Purple Team Engagement** | 0–4 | 20 | 0 | The ability to operate effectively in joint Red Team (offense) and Blue Team (defense) exercises—planning, executing, and analyzing purple-team engagements to… |
| `RAM-001` | **Risk Assessment Methodology** | 0–4 | 20 | 5 | The ability to plan, execute, and govern structured risk assessments to identify, analyze, and evaluate threats, vulnerabilities, and business impacts across I… |
| `RCI-001` | **Regulatory Compliance (IAM)** | 0–4 | 20 | 1 | The ability to interpret regulatory requirements, industry standards, and audit obligations, translating them into effective IAM controls, evidence collection… |
| `RCSA-001` | **Regulatory Compliance & Standards Adherence** | 0–4 | 20 | 0 | The ability to interpret, implement, monitor, and continuously improve cybersecurity requirements from international and national standards, sector directives,… |
| `RTM-001` | **Red Team Management** | 0–4 | 20 | 0 | The ability to plan, execute, govern, and evaluate Red Team operations, simulations, and adversary emulation activities to assess and improve the organization'… |
| `RTMP-001` | **Risk Treatment & Mitigation Planning** | 0–4 | 20 | 5 | The ability to develop, implement, and oversee risk treatment plans by selecting and applying controls, accepting or transferring risks as appropriate, and tra… |
| `RTVAR-001` | **Red Team & Vulnerability Assessment Reporting** | 0–4 | 20 | 0 | The ability to synthesise, document, and communicate findings from penetration tests, red-team exercises, and enterprise vulnerability assessments across conve… |
| `SA-001` | **SOC Automation** | 0–4 | 20 | 4 | The ability to identify, implement, and optimize automated tools, workflows, and processes to manage to security threats and incidents with increased speed, co… |
| `SAC-001` | **Security Awareness & Communication** | 0–4 | 20 | 6 | The ability to ensures employees have the necessary knowledge and skills regarding cybersecurity risks and threats as well as the policies and best practices t… |
| `SAT-001` | **Security Alert Triage** | 0–4 | 20 | 4 | The ability to assess, validate, and prioritize security alerts based on contextual risk, ensuring timely escalation of true threats while minimizing false pos… |
| `SCCA-001` | **Security Control Compliance Assurance** | 0–4 | 20 | 0 | The ability to assure cybersecurity controls implemented across OT and IT systems are effective, ensuring compliance with internal policies, international stan… |
| `SCCA-002` | **Strategic Change Cyber Assurance** | 0–4 | 20 | 0 | The ability to provide cybersecurity advisory and assurance across M&A, transformation, and digitization initiatives covering due diligence, control reviews, c… |
| `SCH-001` | **Server Configuration and Hardening** | 0–4 | 20 | 0 | The ability to establish, implement, and maintain secure configuration baselines across Windows and Linux server environments to reduce attack surfaces and ens… |
| `SCHMR-001` | **Server Cyber Hygiene Monitoring and Reporting** | 0–4 | 20 | 0 | The ability to ensure servers (Windows, Linux, on-prem, and cloud) are continuously monitored, assessed, and maintained for security health, configuration comp… |
| `SCRA-001` | **Strategic Cyber Risk Advisory** | 0–4 | 20 | 0 | The ability to interpret, contextualize, and communicate cyber threat intelligence into actionable risk insights that inform executive decision-making, influen… |
| `SDRS-001` | **Scenario Development & Resilience Simulation** | 0–4 | 20 | 1 | The ability to design, script, and execute realistic disruption scenarios that test organizational readiness, surface hidden dependencies, and drive continuous… |
| `SEITS-001` | **Social Engineering & Insider Threat Simulation** | 0–4 | 20 | 0 | The ability to design and conduct sophisticated social-engineering and insider-threat campaigns to rigorously test human, process, and facility defences across… |
| `SHOSH-001` | **System Hardening and OS Cyber Hygiene** | 0–4 | 20 | 4 | The ability to reduce attack surface by securely configuring operating systems, services and endpoints according to approved cybersecurity benchmarks. |
| `SPM-001` | **Server Patch Deployment** | 0–4 | 20 | 0 | The ability to plan, execute, and govern the timely deployment of operating system and third-party software updates across Windows and Linux server environment… |
| `SRAGA-001` | **Secure Remote Access Gateway Administration** | 0–4 | 20 | 2 | The ability to administer secure remote access gateways to OT assets, enabling controlled, auditable connectivity that preserves safety, system integrity, and… |
| `SSC-001` | **Security Standards and Compliance Governance** | 0–4 | 20 | 0 | The ability to interpret, implement, monitor, and continuously improve cybersecurity requirements from international standards, regional regulations, sector-sp… |
| `TAP-001` | **Threat Actor Profiling** | 0–4 | 20 | 1 | The ability to investigate, profile, and track threat actors targeting OT and IT technology in the Oil & Gas sector, transforming disparate data on campaigns,… |
| `TEPE-001` | **Threat Emulation Planning & Execution** | 0–4 | 20 | 0 | The ability to design, orchestrate, and conduct full-scope red-team operations that faithfully replicate advanced adversaries to achieve clearly defined intell… |
| `TERA-001` | **Technology Evaluation & Resilience Architecture** | 0–4 | 20 | 1 | The ability to assess, select, and architect technology solutions that support digital business continuity and cyber resilience objectives. |
| `TH-002` | **Threat Hunting** | 0–4 | 20 | 3 | The ability to conduct hypothesis-driven searches for malicious activities and potential security compromises that may have evaded security controls within an… |
| `TIDT-001` | **Threat Intelligence Deception Tooling** | 0–4 | 20 | 0 | The ability to design, deploy, and maintain deception technologies inside IT and OT environments to lure, detect, and analyse adversary activity and disrupt ca… |
| `TIGC-001` | **Threat Intelligence Governance and Compliance** | 0–4 | 20 | 0 | The ability to apply regulatory, ethical, and policy-based requirements to ensure threat intelligence activities are conducted responsibly, securely, and in al… |
| `TILM-001` | **Threat Intelligence Lifecycle Management** | 0–4 | 20 | 1 | The ability to orchestrate end-to-end cyber-threat intelligence, from multi-source collection and enrichment through to enterprise-wide operationalisation, ens… |
| `TIPDL-001` | **Threat Intelligence Program Development & Leadership** | 0–4 | 20 | 0 | The ability to lead, develop, and sustain a high-performing threat intelligence function by setting vision and strategy, building capability, managing performa… |
| `TIRCC-001` | **Threat Intelligence Reporting & Communication** | 0–4 | 20 | 1 | The ability to create and deliver clear, contextualized, and actionable threat intelligence outputs tailored to diverse audiences, from technical teams to exec… |
| `TM-001` | **Threat Modelling** | 0–4 | 20 | 1 | The ability to identify, model, and prioritise cyber-threat scenarios that could impact both OT and IT environments in Oil & Gas, translating adversary tactics… |
| `TMD-001` | **Threat Monitoring and Detection** | 0–4 | 20 | 4 | The ability to monitor networks, systems, and data to detect potential security threats, vulnerabilities, and suspicious activities to help maintain a robust s… |
| `TPCBDTC-001` | **Third-Party & Cross-Border Data Transfer Compliance** | 0–4 | 20 | 0 | The ability to assess third-party data transfers, draft contract protections, and apply legal tools like SCCs and TIAs to manage cross-border data flows in lin… |
| `TSC-001` | **Tools and Scripting Creation** | 0–4 | 20 | 0 | The ability to design, code, and maintain custom security tools, scripts, and automations that streamline defensive (SOC), offensive (Red-Team), and engineerin… |
| `TVRM-001` | **Testing, Validation and Rollback Management** | 0–4 | 20 | 0 | The ability to plan and govern patch testing and rollback procedures that ensure stability, minimize disruption, and maintain reliability through structured va… |
| `UP-001` | **User Provisioning** | 0–4 | 20 | 1 | The ability to orchestrate, automate, and continuously improve joiner–mover–leaver (JML) workflows to ensure accurate, timely, and auditable creation, modifica… |
| `VM-001` | **Vulnerability Management** | 0–4 | 20 | 6 | The ability to systematically detect, analyze, prioritize, and remediate vulnerabilities across IT, OT, and cloud environments using risk-based, automated, and… |
| `WAS-001` | **Web and API Security** | 0–4 | 20 | 6 | The ability to protect web applications and APIs against exploits, abuse and data leakage by applying secure-coding and defensive controls. |
| `WLBOFAS-001` | **Wireless / Low-Bandwidth OT Field Asset Security** | 0–4 | 20 | 2 | The ability to secure telemetry and control traffic over constrained or wireless links, ensuring data confidentiality, integrity, and availability across remot… |
| `WLSA-001` | **Windows and Linux Server Administration** | 0–4 | 20 | 1 | The ability to effectively configure, maintain, secure, and troubleshoot Windows and Linux server environments that underpin enterprise operations and patch ma… |

### Business (4)

| Code | Competency | Levels | Indicators | Roles | Description |
| --- | --- | --- | ---: | ---: | --- |
| `DM-001` | **Document Management** | 0–4 | 20 | 17 | The ability to create, manage, and govern cybersecurity documentation (e.g. policies, standards, runbooks, threat-intel reports, code artifacts) using discipli… |
| `LXSCN055` | **Stakeholder Management** | 1–4 | 20 | 6 | Builds a broad network of relationships with stakeholders to identify problems and opportunities for improvement and structure performance expectations. |
| `LXSCN060` | **Systems Thinking** | 1–4 | 20 | 18 | Focuses on big picture thinking, combining data and insights into useful strategies and actions. |
| `LXSCN080` | **Budgeting** | 1–4 | 20 | 0 | Identifies and incorporates financial resources into a comprehensive financial plan that supports business strategies. |

### Leadership and Management (8)

| Code | Competency | Levels | Indicators | Roles | Description |
| --- | --- | --- | ---: | ---: | --- |
| `LXSCN001` | **Cross-Team Integration** | 1–4 | 20 | 30 | Leads multiple teams to communicate and coordinate work as one team. |
| `LXSCN005` | **Strategic Thinking** | 1–4 | 20 | 7 | Envisions the long-term direction of the organisation, anticipates future trends, develops plans that position the company for sustained success and pursues hi… |
| `LXSCN008` | **Strategic Influence** | 1–4 | 24 | 3 | Develops and leverages internal/external relationships to facilitate decision-making. |
| `LXSCN019` | **Decision Making** | 1–4 | 24 | 23 | Makes sound decisions in a timely manner, exercising a combination of analysis and good judgement. |
| `LXSCN020` | **Operational Effectiveness** | 1–4 | 20 | 4 | Drives organisational success by optimising operations, improving efficiencies and maximising business performance. |
| `LXSCN026` | **Leadership** | 1–4 | 24 | 18 | Creates a motivating vision, serves as a role model, rallies others in support of the chosen direction, and motivates people to embrace and lead change. |
| `LXSCN027` | **Team Management** | 1–4 | 28 | 8 | Guides group efforts and helps others achieve excellent results. |
| `LXSCN206` | **Performance Management** | 0–4 | 20 | 3 | Works with individuals and teams to set expectations, monitor progress, provide feedback and support and evaluate their performance. |

### Personal (11)

| Code | Competency | Levels | Indicators | Roles | Description |
| --- | --- | --- | ---: | ---: | --- |
| `LXSCN030` | **Business Acumen** | 1–4 | 28 | 10 | Focuses activities and decisions on opportunities that produce significant, strategic business impact. |
| `LXSCN031` | **Problem Solving** | 1–4 | 20 | 29 | Applies problem-solving techniques and tools to resolve problems effectively. |
| `LXSCN032` | **Presentation Delivery** | 1–4 | 16 | 22 | Effectively presents ideas, solutions and strategies with impact and influence. |
| `LXSCN034` | **Analytical Thinking** | 1–4 | 24 | 25 | Generates and analyses information to improve the clarity of ideas and approaches. |
| `LXSCN035` | **Relationship Building** | 1–4 | 24 | 14 | Develops trusting relationships by valuing others' contributions and works with others in a constructive and collaborative manner. |
| `LXSCN036` | **Communication** | 1–4 | 28 | 31 | Provides information and messages in a way that produces clarity and impact. |
| `LXSCN037` | **Tolerance for Uncertainty** | 1–4 | 20 | 6 | Adept at handling risk, ambiguity and uncertainty in high pressured situations. |
| `LXSCN038` | **Planning and Organising** | 1–4 | 20 | 11 | Mobilises, plans, and controls time and resources to get things done. |
| `LXSCN039` | **Continuous Learning** | 1–4 | 24 | 19 | Actively seeks new learning opportunities and acts to improve own performance and that of others. Has a growth mindset approach to towards learning and persona… |
| `LXSCN045` | **Accuracy and Attention to Detail** | 1–4 | 20 | 20 | Methodically plans, conducts and reviews work with a focus on quality. |
| `LXSCN046` | **Adaptability** | 1–4 | 20 | 7 | Responds with flexibility to changing work demands. |

### Project and Program Management (2)

| Code | Competency | Levels | Indicators | Roles | Description |
| --- | --- | --- | ---: | ---: | --- |
| `LXSCN065` | **Project Management** | 1–4 | 20 | 0 | Plans, controls, monitors and completes projects, ensuring efficient utilisation of resources, to achieve successful project outcomes. |
| `LXSCN113` | **Managing the Programs and Projects Function** | 1–4 | 20 | 0 | Manages development and implementation of strategies, tools and methods for managing large scale efforts comprising a dossier of projects and transformation ac… |

## Level indicators

3,244 behaviour descriptors, each tied to one competency and one level. Codes follow `<competency>-L<level>-<nn>`; 524 cross-functional ones also carry their source ID. Coaches validate progress (1–5) against a single descriptor on **Evidence**. The full text is in the app (Library → Level indicators) and in the Excel export (sheet CompetencyBehavior); below is the count per level.

| Competency | L1 | L2 | L3 | L4 | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| `AICI-001` Asset Inventory and CMDB Integration | 5 | 5 | 5 | 5 | 20 |
| `AM-001` Access Management | 5 | 5 | 5 | 5 | 20 |
| `APKCE-001` Attack-Path & Kill-Chain Engineering | 5 | 5 | 5 | 5 | 20 |
| `AS-002` Application Security | 5 | 5 | 5 | 5 | 20 |
| `ASD-001` Application Security Development | 5 | 5 | 5 | 5 | 20 |
| `ASR-001` Application Security Review | 5 | 5 | 5 | 5 | 20 |
| `ATAC-001` APT Tracking & Attribution CTI | 5 | 5 | 5 | 5 | 20 |
| `BCDRSP-001` Business Continuity & Disaster Recovery Strategy and Planning | 5 | 5 | 5 | 5 | 20 |
| `BCDRTEAM-001` BCDR Testing, Exercise and Awareness Management | 5 | 5 | 5 | 5 | 20 |
| `BIAB-001` Business Impact Analysis (BIA) | 5 | 5 | 5 | 5 | 20 |
| `BRT-001` Backup and Recovery Technologies | 5 | 5 | 5 | 5 | 20 |
| `BSDM-001` Business Service Dependency Mapping | 5 | 5 | 5 | 5 | 20 |
| `CABP-001` Cybersecurity and Business Partnering | 5 | 5 | 5 | 5 | 20 |
| `CAG-001` Cyber Assurance Governance | 5 | 5 | 5 | 5 | 20 |
| `CAS-001` Cloud Automation and Scripting | 5 | 5 | 5 | 5 | 20 |
| `CDL-001` Cybersecurity Data Lake | 5 | 5 | 5 | 5 | 20 |
| `CEOIS-001` Cyber Exercise & Operational Intelligence Support | 5 | 5 | 5 | 5 | 20 |
| `CIM-001` Cloud Identity Management | 5 | 5 | 5 | 5 | 20 |
| `CIMRC-001` Cybersecurity Incident Management, Response, and Coordination | 5 | 5 | 5 | 5 | 20 |
| `CM-001` Crisis Management | 5 | 5 | 5 | 5 | 20 |
| `CRGS-001` Cyber Risk Governance & Strategy | 5 | 5 | 5 | 5 | 20 |
| `CSA-001` Cloud Security Architecture | 5 | 5 | 5 | 5 | 20 |
| `CSDSP-001` Collection Strategy & Data-Source Prioritization | 5 | 5 | 5 | 5 | 20 |
| `CSM-001` Cloud Security Monitoring | 5 | 5 | 5 | 5 | 20 |
| `CSM-002` Cloud Security Management | 5 | 5 | 5 | 5 | 20 |
| `CSMS-001` Cyber Security Management System (CSMS) | 5 | 5 | 5 | 5 | 20 |
| `CSPM-001` Cloud Services Patch Management | 5 | 5 | 5 | 5 | 20 |
| `CSRG-001` Cloud Security Risk Management | 5 | 5 | 5 | 5 | 20 |
| `CTBDEM-001` Continuity Testing & BC/DR Exercise Management | 5 | 5 | 5 | 5 | 20 |
| `CTIC-001` Cyber Threat Intelligence (CTI) | 5 | 5 | 5 | 6 | 21 |
| `CTIO-001` Cyber Threat Intelligence for OT | 5 | 5 | 5 | 5 | 20 |
| `CVM-001` Cybersecurity Vendor Management | 5 | 5 | 5 | 5 | 20 |
| `DAC-002` Data Analytics for Cybersecurity | 5 | 5 | 5 | 5 | 20 |
| `DDUGE-001` Data-Diode & Unidirectional-Gateway Engineering | 5 | 5 | 5 | 5 | 20 |
| `DE-001` Detection Engineering | 5 | 5 | 5 | 5 | 20 |
| `DF-003` Digital Forensics | 5 | 5 | 5 | 5 | 20 |
| `DIR-001` Data Incident Response | 5 | 5 | 5 | 5 | 20 |
| `DLPD-001` Data Loss Prevention (DLP) | 5 | 5 | 5 | 5 | 20 |
| `DML-001` Data Management Lifecycle | 5 | 5 | 5 | 5 | 20 |
| `DOSIOC-001` Deep Open-Source Intelligence (OSINT) Collection | 5 | 5 | 5 | 5 | 20 |
| `DPG-001` Data Protection Governance | 5 | 5 | 5 | 5 | 20 |
| `DPIAD-001` Data Privacy Impact Assessment (DPIA) | 5 | 5 | 5 | 5 | 20 |
| `DRCI-001` Digital Resilience & Cybersecurity Integration | 5 | 5 | 5 | 5 | 20 |
| `DRM-001` Data Rights Management | 5 | 5 | 5 | 5 | 20 |
| `DRSD-001` Data Retention & Secure Disposal | 5 | 5 | 5 | 5 | 20 |
| `DRSI-001` Data Regulatory & Standards Interpretation | 5 | 5 | 5 | 5 | 20 |
| `ECAF-001` Enterprise Control and Assurance Framework | 5 | 5 | 5 | 5 | 20 |
| `ECAPM-001` Enterprise Cybersecurity Assurance Program Management | 5 | 5 | 5 | 5 | 20 |
| `ERMIR-001` Enterprise Risk Management Integration & Reporting | 5 | 5 | 5 | 5 | 20 |
| `ESA-001` Enterprise Security Architecture | 5 | 5 | 5 | 5 | 20 |
| `ESI-001` Endpoint Security (IT) | 5 | 5 | 5 | 5 | 20 |
| `ESO-001` Endpoint Security (OT) | 5 | 5 | 5 | 5 | 20 |
| `ETTTE-001` Emerging Threat Technologies and Tools Evaluation | 5 | 5 | 5 | 5 | 20 |
| `EXT-001` EDR/XDR Tooling | 5 | 5 | 5 | 5 | 20 |
| `IA-001` IAM Architecture | 5 | 5 | 5 | 5 | 20 |
| `IA-002` IAM Automation | 5 | 5 | 5 | 5 | 20 |
| `IAI-001` IAM Application Integration | 5 | 5 | 5 | 5 | 20 |
| `ICER-001` Internal Controls Evaluation for Resilience | 5 | 5 | 5 | 5 | 20 |
| `IG-001` IAM Governance | 5 | 5 | 5 | 5 | 20 |
| `IICR-001` IT Infrastructure and Cloud Resilience | 5 | 5 | 5 | 5 | 20 |
| `IOPSAT-001` ICS/OT Penetration & Safety-Aware Testing | 5 | 5 | 5 | 5 | 20 |
| `IOS-001` IAM for OT Systems | 5 | 5 | 5 | 5 | 20 |
| `ISA-001` Internal Security Audit | 5 | 5 | 5 | 5 | 20 |
| `ISA-002` Information Security Awareness | 5 | 5 | 5 | 5 | 20 |
| `ISGRC-001` Information Security Governance and Regulatory Compliance | 5 | 5 | 5 | 5 | 20 |
| `KPM-001` Kubernetes Patch Management | 5 | 5 | 5 | 5 | 20 |
| `LM-001` Log Management | 5 | 5 | 5 | 5 | 20 |
| `MA-001` Malware Analysis | 5 | 5 | 5 | 5 | 20 |
| `NIS-001` Network & Infrastructure Security | 5 | 5 | 5 | 5 | 20 |
| `NSM-001` Network Security Monitoring | 5 | 5 | 5 | 5 | 20 |
| `OCI-001` OT Cybersecurity | 5 | 5 | 5 | 5 | 20 |
| `ODC-001` OT Downstream Cybersecurity | 5 | 5 | 5 | 5 | 20 |
| `OIRF-001` OT Incident Response & Forensics | 5 | 5 | 5 | 5 | 20 |
| `OISAIC-001` OT/ICS Security Assurance and IEC 62443 Conformance | 5 | 5 | 5 | 5 | 20 |
| `OKD-001` OT KPIs & Dashboarding | 5 | 5 | 5 | 5 | 20 |
| `OND-001` OT Network Design | 5 | 5 | 5 | 5 | 20 |
| `OPSV-001` OT Project Security Validation | 5 | 5 | 5 | 5 | 20 |
| `OPVM-001` OT Patch & Vulnerability Management | 5 | 5 | 5 | 5 | 20 |
| `ORC-001` OT Regulatory Compliance | 5 | 5 | 5 | 5 | 20 |
| `OSBCM-001` OT Security Baselines & Configuration Management | 5 | 5 | 5 | 5 | 20 |
| `OTDM-001` OT Threat Detection & Monitoring | 5 | 5 | 5 | 5 | 20 |
| `OUC-001` OT Upstream Cybersecurity | 5 | 5 | 5 | 5 | 20 |
| `OWCCCR-001` OPSEC Workplace (Covert Command-and-Control Resilience) | 5 | 4 | 5 | 5 | 19 |
| `PAMPG-001` Privileged Access Management (PAM) Governance | 5 | 5 | 5 | 5 | 20 |
| `PCAR-001` Patch Compliance and Audit Readiness | 5 | 5 | 5 | 5 | 20 |
| `PCM-001` PKI & Certificate Management | 5 | 5 | 5 | 5 | 20 |
| `PDSMK-001` Privacy & Data Security Metrics/KPIs | 5 | 5 | 5 | 5 | 20 |
| `PLRM-001` Patch Lifecyle and Release Management | 5 | 5 | 5 | 5 | 20 |
| `PM-001` Patch Management | 5 | 5 | 5 | 5 | 20 |
| `PMOSP-001` Preventive Maintenance for OT Security Platforms | 5 | 5 | 5 | 5 | 20 |
| `PMPO-001` Patch Management Platform Operation | 5 | 5 | 5 | 5 | 20 |
| `PPSD-001` Policy, Procedure & Standards Development | 5 | 5 | 5 | 5 | 20 |
| `PRACI-001` Patch Reporting, Analytics and Continuous Improvement | 5 | 5 | 5 | 5 | 20 |
| `PSHCRA-001` Process-Safety & HSE Cyber-Risk Alignment | 5 | 5 | 5 | 5 | 20 |
| `PT-001` Penetration Testing | 5 | 5 | 5 | 5 | 20 |
| `PTE-001` Purple Team Engagement | 5 | 5 | 5 | 5 | 20 |
| `RAM-001` Risk Assessment Methodology | 5 | 5 | 5 | 5 | 20 |
| `RCI-001` Regulatory Compliance (IAM) | 5 | 5 | 5 | 5 | 20 |
| `RCSA-001` Regulatory Compliance & Standards Adherence | 5 | 5 | 5 | 5 | 20 |
| `RTM-001` Red Team Management | 5 | 5 | 5 | 5 | 20 |
| `RTMP-001` Risk Treatment & Mitigation Planning | 5 | 5 | 5 | 5 | 20 |
| `RTVAR-001` Red Team & Vulnerability Assessment Reporting | 5 | 5 | 5 | 5 | 20 |
| `SA-001` SOC Automation | 5 | 5 | 5 | 5 | 20 |
| `SAC-001` Security Awareness & Communication | 5 | 5 | 5 | 5 | 20 |
| `SAT-001` Security Alert Triage | 5 | 5 | 5 | 5 | 20 |
| `SCCA-001` Security Control Compliance Assurance | 5 | 5 | 5 | 5 | 20 |
| `SCCA-002` Strategic Change Cyber Assurance | 5 | 5 | 5 | 5 | 20 |
| `SCH-001` Server Configuration and Hardening | 5 | 5 | 5 | 5 | 20 |
| `SCHMR-001` Server Cyber Hygiene Monitoring and Reporting | 5 | 5 | 5 | 5 | 20 |
| `SCRA-001` Strategic Cyber Risk Advisory | 5 | 5 | 5 | 5 | 20 |
| `SDRS-001` Scenario Development & Resilience Simulation | 5 | 5 | 5 | 5 | 20 |
| `SEITS-001` Social Engineering & Insider Threat Simulation | 5 | 5 | 5 | 5 | 20 |
| `SHOSH-001` System Hardening and OS Cyber Hygiene | 5 | 5 | 5 | 5 | 20 |
| `SPM-001` Server Patch Deployment | 5 | 5 | 5 | 5 | 20 |
| `SRAGA-001` Secure Remote Access Gateway Administration | 5 | 5 | 5 | 5 | 20 |
| `SSC-001` Security Standards and Compliance Governance | 5 | 5 | 5 | 5 | 20 |
| `TAP-001` Threat Actor Profiling | 5 | 5 | 5 | 5 | 20 |
| `TEPE-001` Threat Emulation Planning & Execution | 5 | 5 | 5 | 5 | 20 |
| `TERA-001` Technology Evaluation & Resilience Architecture | 5 | 5 | 5 | 5 | 20 |
| `TH-002` Threat Hunting | 5 | 5 | 5 | 5 | 20 |
| `TIDT-001` Threat Intelligence Deception Tooling | 5 | 5 | 5 | 5 | 20 |
| `TIGC-001` Threat Intelligence Governance and Compliance | 5 | 5 | 5 | 5 | 20 |
| `TILM-001` Threat Intelligence Lifecycle Management | 5 | 5 | 5 | 5 | 20 |
| `TIPDL-001` Threat Intelligence Program Development & Leadership | 5 | 5 | 5 | 5 | 20 |
| `TIRCC-001` Threat Intelligence Reporting & Communication | 5 | 5 | 5 | 5 | 20 |
| `TM-001` Threat Modelling | 5 | 5 | 5 | 5 | 20 |
| `TMD-001` Threat Monitoring and Detection | 5 | 5 | 5 | 5 | 20 |
| `TPCBDTC-001` Third-Party & Cross-Border Data Transfer Compliance | 5 | 5 | 5 | 5 | 20 |
| `TSC-001` Tools and Scripting Creation | 5 | 5 | 5 | 5 | 20 |
| `TVRM-001` Testing, Validation and Rollback Management | 5 | 5 | 5 | 5 | 20 |
| `UP-001` User Provisioning | 5 | 5 | 5 | 5 | 20 |
| `VM-001` Vulnerability Management | 5 | 5 | 5 | 5 | 20 |
| `WAS-001` Web and API Security | 5 | 5 | 5 | 5 | 20 |
| `WLBOFAS-001` Wireless / Low-Bandwidth OT Field Asset Security | 5 | 5 | 5 | 5 | 20 |
| `WLSA-001` Windows and Linux Server Administration | 5 | 5 | 5 | 5 | 20 |
| `DM-001` Document Management | 5 | 5 | 5 | 5 | 20 |
| `LXSCN055` Stakeholder Management | 5 | 5 | 5 | 5 | 20 |
| `LXSCN060` Systems Thinking | 5 | 5 | 5 | 5 | 20 |
| `LXSCN080` Budgeting | 5 | 5 | 5 | 5 | 20 |
| `LXSCN001` Cross-Team Integration | 5 | 5 | 5 | 5 | 20 |
| `LXSCN005` Strategic Thinking | 5 | 5 | 5 | 5 | 20 |
| `LXSCN008` Strategic Influence | 6 | 6 | 6 | 6 | 24 |
| `LXSCN019` Decision Making | 6 | 6 | 6 | 6 | 24 |
| `LXSCN020` Operational Effectiveness | 5 | 5 | 5 | 5 | 20 |
| `LXSCN026` Leadership | 6 | 6 | 6 | 6 | 24 |
| `LXSCN027` Team Management | 7 | 7 | 7 | 7 | 28 |
| `LXSCN206` Performance Management | 5 | 5 | 5 | 5 | 20 |
| `LXSCN030` Business Acumen | 7 | 7 | 7 | 7 | 28 |
| `LXSCN031` Problem Solving | 5 | 5 | 5 | 5 | 20 |
| `LXSCN032` Presentation Delivery | 4 | 4 | 4 | 4 | 16 |
| `LXSCN034` Analytical Thinking | 6 | 6 | 6 | 6 | 24 |
| `LXSCN035` Relationship Building | 6 | 6 | 6 | 6 | 24 |
| `LXSCN036` Communication | 7 | 7 | 7 | 7 | 28 |
| `LXSCN037` Tolerance for Uncertainty | 5 | 5 | 5 | 5 | 20 |
| `LXSCN038` Planning and Organising | 5 | 5 | 5 | 5 | 20 |
| `LXSCN039` Continuous Learning | 6 | 6 | 6 | 6 | 24 |
| `LXSCN045` Accuracy and Attention to Detail | 5 | 5 | 5 | 5 | 20 |
| `LXSCN046` Adaptability | 5 | 5 | 5 | 5 | 20 |
| `LXSCN065` Project Management | 5 | 5 | 5 | 5 | 20 |
| `LXSCN113` Managing the Programs and Projects Function | 5 | 5 | 5 | 5 | 20 |

## Role profiles

Seniority is derived from the grade in the job title:

Analyst → Entry · Engineer → Mid · Specialist → Mid · Senior Analyst → Senior · Senior Engineer → Senior · Section Head → Lead · Department Manager → Manager · VP → Executive

| Code | Role | Family | Seniority | Next role | Requirements (technical + cross-functional) |
| --- | --- | --- | --- | --- | --- |
| `ROLE-01` | **Section Head, Cyber Threat Intelligence** | Threat Intelligence | Lead | — | 11 (0 + 11) |
| `ROLE-02` | **Section Head, Digital Business Continuity** | Business Continuity & Resilience | Lead | — | 13 (0 + 13) |
| `ROLE-03` | **Senior Analyst, Cyber Threat Intelligence** | Threat Intelligence | Senior | Section Head, Cyber Threat Intelligence | 22 (15 + 7) |
| `ROLE-04` | **Senior Analyst, Digital Business Continuity** | Business Continuity & Resilience | Senior | Section Head, Digital Business Continuity | 20 (12 + 8) |
| `ROLE-05` | **Senior Analyst, Digital Identity & Access Management** | Identity & Access | Senior | — | 20 (9 + 11) |
| `ROLE-06` | **Analyst, Digital Vulnerability Management** | Infrastructure & Cloud Security | Entry | — | 16 (7 + 9) |
| `ROLE-07` | **Engineer, Digital Clouds & Application Security** | Infrastructure & Cloud Security | Mid | Senior Engineer, Digital Clouds & Application Security | 27 (19 + 8) |
| `ROLE-08` | **Engineer, Digital Infrastructure Security** | Infrastructure & Cloud Security | Mid | Senior Engineer, Digital Infrastructure Security | 24 (17 + 7) |
| `ROLE-09` | **Section Head, Digital Infrastructure Security Operations** | Infrastructure & Cloud Security | Lead | — | 13 (0 + 13) |
| `ROLE-10` | **Section Head, Digital Vulnerability Management** | Infrastructure & Cloud Security | Lead | — | 10 (0 + 10) |
| `ROLE-11` | **Senior Engineer, Digital Clouds & Application Security** | Infrastructure & Cloud Security | Senior | — | 27 (19 + 8) |
| `ROLE-12` | **Senior Engineer, Digital Infrastructure Security** | Infrastructure & Cloud Security | Senior | Section Head, Digital Infrastructure Security Operations | 27 (19 + 8) |
| `ROLE-13` | **Senior Engineer, Digital Vulnerability Management** | Infrastructure & Cloud Security | Senior | Section Head, Digital Vulnerability Management | 20 (10 + 10) |
| `ROLE-14` | **Department Manager, Digital Risk Management & Compliance** | Governance, Risk & Compliance | Manager | — | 4 (0 + 4) |
| `ROLE-15` | **Section Head, Cybersecurity Policies & Standard** | Governance, Risk & Compliance | Lead | — | 13 (0 + 13) |
| `ROLE-16` | **Section Head, OT Risk Management & Compliance** | Governance, Risk & Compliance | Lead | — | 14 (0 + 14) |
| `ROLE-17` | **Senior Analyst, Cybersecurity Policies and Standards** | Governance, Risk & Compliance | Senior | Section Head, Cybersecurity Policies & Standard | 24 (12 + 12) |
| `ROLE-18` | **Senior Analyst, IT Risk Management and Compliance** | Governance, Risk & Compliance | Senior | — | 23 (11 + 12) |
| `ROLE-19` | **Senior Analyst, OT Risk Management and Compliance** | Governance, Risk & Compliance | Senior | Section Head, OT Risk Management & Compliance | 23 (11 + 12) |
| `ROLE-20` | **Specialist, Cybersecurity Policies and Standards** | Governance, Risk & Compliance | Mid | Senior Analyst, Cybersecurity Policies and Standards | 17 (9 + 8) |
| `ROLE-21` | **Specialist, Group Companies Risk Management and Compliance** | Governance, Risk & Compliance | Mid | — | 27 (15 + 12) |
| `ROLE-22` | **Specialist, IT Risk Management and Compliance** | Governance, Risk & Compliance | Mid | Senior Analyst, IT Risk Management and Compliance | 21 (11 + 10) |
| `ROLE-23` | **Section Head, Downstream Industry, Marketing and Trading OT Cybersecurity** | OT Security | Lead | — | 14 (0 + 14) |
| `ROLE-24` | **Section Head, Upstream OT Cybersecurity** | OT Security | Lead | — | 13 (0 + 13) |
| `ROLE-25` | **Senior Engineer, Downstream OT Cybersecurity** | OT Security | Senior | — | 24 (12 + 12) |
| `ROLE-26` | **Senior Engineer, Upstream OT Cybersecurity** | OT Security | Senior | Section Head, Upstream OT Cybersecurity | 22 (12 + 10) |
| `ROLE-27` | **Analyst, Digital Cybersecurity Monitoring** | Security Operations | Entry | Senior Analyst, Digital Cybersecurity Monitoring | 27 (19 + 8) |
| `ROLE-28` | **Section Head, Digital Cybersecurity Monitoring** | Security Operations | Lead | — | 11 (0 + 11) |
| `ROLE-29` | **Section Head, Threat Hunting** | Security Operations | Lead | — | 20 (0 + 20) |
| `ROLE-30` | **Senior Analyst, Digital Cybersecurity Monitoring** | Security Operations | Senior | Section Head, Digital Cybersecurity Monitoring | 24 (18 + 6) |
| `ROLE-31` | **Senior Engineer, Digital Cybersecurity Monitoring** | Security Operations | Senior | Section Head, Digital Cybersecurity Monitoring | 25 (16 + 9) |
| `ROLE-32` | **Specialist, Malware Analysis** | Security Operations | Mid | — | 27 (19 + 8) |

**Job titles without requirements yet** (loaded as ROLE-33 onward so people can be linked; add requirements when the client provides them): Department Manager, Digital Business Continuity and Cyber Threat Intelligence · Department Manager, Digital Cybersecurity Engineering · Department Manager, Digital Identity & Access Management · Department Manager, OT Cybersecurity · Department Manager, Security Operations Center Department · Section Head, Digital Clouds & Application Security · Section Head, IT Risk Management and Compliance · Vice President, Group Digital Cybersecurity Operations · Vice President, Group Information Security.

## Role requirements

Required level per competency per role (623 pairs in the source, 620 loaded). Source priority 2 is the higher priority and is loaded as High; 3 is loaded as Medium (confirm with the client).

<details><summary><b>ROLE-01</b> Section Head, Cyber Threat Intelligence — 11 requirements</summary>

| Competency | Level | Priority |
| --- | ---: | --- |
| `LXSCN001` Cross-Team Integration | 3 | Medium |
| `LXSCN019` Decision Making | 3 | Medium |
| `LXSCN026` Leadership | 3 | Medium |
| `LXSCN027` Team Management | 3 | Medium |
| `LXSCN031` Problem Solving | 3 | Medium |
| `LXSCN032` Presentation Delivery | 3 | Medium |
| `LXSCN035` Relationship Building | 3 | Medium |
| `LXSCN036` Communication | 3 | Medium |
| `LXSCN038` Planning and Organising | 3 | Medium |
| `LXSCN046` Adaptability | 3 | Medium |
| `LXSCN055` Stakeholder Management | 3 | Medium |

</details>

<details><summary><b>ROLE-02</b> Section Head, Digital Business Continuity — 13 requirements</summary>

| Competency | Level | Priority |
| --- | ---: | --- |
| `LXSCN001` Cross-Team Integration | 3 | Medium |
| `LXSCN005` Strategic Thinking | 3 | High |
| `LXSCN008` Strategic Influence | 3 | High |
| `LXSCN019` Decision Making | 3 | Medium |
| `LXSCN026` Leadership | 3 | Medium |
| `LXSCN027` Team Management | 3 | Medium |
| `LXSCN031` Problem Solving | 3 | Medium |
| `LXSCN032` Presentation Delivery | 3 | Medium |
| `LXSCN035` Relationship Building | 3 | Medium |
| `LXSCN036` Communication | 3 | Medium |
| `LXSCN038` Planning and Organising | 3 | Medium |
| `LXSCN046` Adaptability | 3 | Medium |
| `LXSCN055` Stakeholder Management | 3 | Medium |

</details>

<details><summary><b>ROLE-03</b> Senior Analyst, Cyber Threat Intelligence — 22 requirements</summary>

| Competency | Level | Priority |
| --- | ---: | --- |
| `APKCE-001` Attack-Path & Kill-Chain Engineering | 2 | Medium |
| `ATAC-001` APT Tracking & Attribution CTI | 2 | Medium |
| `CEOIS-001` Cyber Exercise & Operational Intelligence Support | 2 | Medium |
| `CIMRC-001` Cybersecurity Incident Management, Response, and Coordination | 2 | High |
| `CSDSP-001` Collection Strategy & Data-Source Prioritization | 3 | Medium |
| `CTIC-001` Cyber Threat Intelligence (CTI) | 2 | Medium |
| `CTIO-001` Cyber Threat Intelligence for OT | 2 | Medium |
| `DOSIOC-001` Deep Open-Source Intelligence (OSINT) Collection | 3 | Medium |
| `ETTTE-001` Emerging Threat Technologies and Tools Evaluation | 2 | High |
| `OCI-001` OT Cybersecurity | 2 | High |
| `OWCCCR-001` OPSEC Workplace (Covert Command-and-Control Resilience) | 2 | High |
| `TAP-001` Threat Actor Profiling | 2 | Medium |
| `TILM-001` Threat Intelligence Lifecycle Management | 3 | Medium |
| `TIRCC-001` Threat Intelligence Reporting & Communication | 2 | Medium |
| `TM-001` Threat Modelling | 2 | Medium |
| `DM-001` Document Management | 2 | High |
| `LXSCN026` Leadership | 2 | Medium |
| `LXSCN031` Problem Solving | 2 | Medium |
| `LXSCN036` Communication | 3 | Medium |
| `LXSCN038` Planning and Organising | 2 | Medium |
| `LXSCN039` Continuous Learning | 2 | Medium |
| `LXSCN045` Accuracy and Attention to Detail | 3 | Medium |

</details>

<details><summary><b>ROLE-04</b> Senior Analyst, Digital Business Continuity — 20 requirements</summary>

| Competency | Level | Priority |
| --- | ---: | --- |
| `BCDRSP-001` Business Continuity & Disaster Recovery Strategy and Planning | 2 | Medium |
| `BCDRTEAM-001` BCDR Testing, Exercise and Awareness Management | 3 | Medium |
| `BIAB-001` Business Impact Analysis (BIA) | 3 | Medium |
| `BRT-001` Backup and Recovery Technologies | 2 | Medium |
| `BSDM-001` Business Service Dependency Mapping | 2 | Medium |
| `CTBDEM-001` Continuity Testing & BC/DR Exercise Management | 3 | Medium |
| `DRCI-001` Digital Resilience & Cybersecurity Integration | 2 | Medium |
| `ICER-001` Internal Controls Evaluation for Resilience | 2 | Medium |
| `IICR-001` IT Infrastructure and Cloud Resilience | 2 | Medium |
| `PPSD-001` Policy, Procedure & Standards Development | 2 | Medium |
| `SDRS-001` Scenario Development & Resilience Simulation | 2 | Medium |
| `TERA-001` Technology Evaluation & Resilience Architecture | 2 | Medium |
| `DM-001` Document Management | 2 | Medium |
| `LXSCN026` Leadership | 2 | Medium |
| `LXSCN030` Business Acumen | 2 | High |
| `LXSCN031` Problem Solving | 2 | Medium |
| `LXSCN036` Communication | 3 | Medium |
| `LXSCN038` Planning and Organising | 2 | Medium |
| `LXSCN039` Continuous Learning | 2 | Medium |
| `LXSCN045` Accuracy and Attention to Detail | 3 | Medium |

</details>

<details><summary><b>ROLE-05</b> Senior Analyst, Digital Identity & Access Management — 20 requirements</summary>

| Competency | Level | Priority |
| --- | ---: | --- |
| `AM-001` Access Management | 3 | Medium |
| `CIM-001` Cloud Identity Management | 2 | High |
| `IA-001` IAM Architecture | 2 | Medium |
| `IA-002` IAM Automation | 2 | Medium |
| `IAI-001` IAM Application Integration | 2 | Medium |
| `IG-001` IAM Governance | 2 | Medium |
| `PAMPG-001` Privileged Access Management (PAM) Governance | 2 | Medium |
| `RCI-001` Regulatory Compliance (IAM) | 2 | High |
| `UP-001` User Provisioning | 2 | Medium |
| `LXSCN001` Cross-Team Integration | 2 | Medium |
| `LXSCN020` Operational Effectiveness | 2 | High |
| `LXSCN026` Leadership | 2 | High |
| `LXSCN031` Problem Solving | 2 | Medium |
| `LXSCN032` Presentation Delivery | 2 | High |
| `LXSCN034` Analytical Thinking | 2 | Medium |
| `LXSCN036` Communication | 2 | Medium |
| `LXSCN038` Planning and Organising | 2 | Medium |
| `LXSCN039` Continuous Learning | 2 | Medium |
| `LXSCN045` Accuracy and Attention to Detail | 2 | Medium |
| `LXSCN060` Systems Thinking | 2 | High |

</details>

<details><summary><b>ROLE-06</b> Analyst, Digital Vulnerability Management — 16 requirements</summary>

| Competency | Level | Priority |
| --- | ---: | --- |
| `AS-002` Application Security | 3 | Medium |
| `ASD-001` Application Security Development | 2 | High |
| `ESI-001` Endpoint Security (IT) | 2 | High |
| `ESO-001` Endpoint Security (OT) | 2 | High |
| `PM-001` Patch Management | 2 | Medium |
| `VM-001` Vulnerability Management | 2 | Medium |
| `WAS-001` Web and API Security | 2 | Medium |
| `DM-001` Document Management | 2 | Medium |
| `LXSCN001` Cross-Team Integration | 2 | Medium |
| `LXSCN019` Decision Making | 2 | Medium |
| `LXSCN031` Problem Solving | 3 | Medium |
| `LXSCN032` Presentation Delivery | 1 | Medium |
| `LXSCN034` Analytical Thinking | 3 | Medium |
| `LXSCN036` Communication | 3 | Medium |
| `LXSCN039` Continuous Learning | 3 | High |
| `LXSCN045` Accuracy and Attention to Detail | 3 | High |

</details>

<details><summary><b>ROLE-07</b> Engineer, Digital Clouds & Application Security — 27 requirements</summary>

| Competency | Level | Priority |
| --- | ---: | --- |
| `AS-002` Application Security | 2 | Medium |
| `ASD-001` Application Security Development | 2 | Medium |
| `ASR-001` Application Security Review | 2 | Medium |
| `CAS-001` Cloud Automation and Scripting | 2 | Medium |
| `CDL-001` Cybersecurity Data Lake | 2 | High |
| `CIMRC-001` Cybersecurity Incident Management, Response, and Coordination | 2 | Medium |
| `CSA-001` Cloud Security Architecture | 2 | Medium |
| `CSM-002` Cloud Security Management | 2 | Medium |
| `DAC-002` Data Analytics for Cybersecurity | 3 | High |
| `ESA-001` Enterprise Security Architecture | 2 | Medium |
| `ESI-001` Endpoint Security (IT) | 2 | Medium |
| `ESO-001` Endpoint Security (OT) | 1 | High |
| `ICER-001` Internal Controls Evaluation for Resilience | 2 | Medium |
| `NIS-001` Network & Infrastructure Security | 2 | Medium |
| `PCM-001` PKI & Certificate Management | 2 | Medium |
| `PM-001` Patch Management | 2 | Medium |
| `SHOSH-001` System Hardening and OS Cyber Hygiene | 2 | Medium |
| `VM-001` Vulnerability Management | 2 | High |
| `WAS-001` Web and API Security | 2 | Medium |
| `LXSCN001` Cross-Team Integration | 2 | Medium |
| `LXSCN019` Decision Making | 2 | Medium |
| `LXSCN031` Problem Solving | 3 | Medium |
| `LXSCN032` Presentation Delivery | 2 | Medium |
| `LXSCN034` Analytical Thinking | 3 | Medium |
| `LXSCN036` Communication | 3 | Medium |
| `LXSCN039` Continuous Learning | 3 | Medium |
| `LXSCN045` Accuracy and Attention to Detail | 3 | Medium |

</details>

<details><summary><b>ROLE-08</b> Engineer, Digital Infrastructure Security — 24 requirements</summary>

| Competency | Level | Priority |
| --- | ---: | --- |
| `AS-002` Application Security | 3 | High |
| `CAS-001` Cloud Automation and Scripting | 2 | Medium |
| `CDL-001` Cybersecurity Data Lake | 2 | Medium |
| `CIMRC-001` Cybersecurity Incident Management, Response, and Coordination | 2 | Medium |
| `CSA-001` Cloud Security Architecture | 2 | High |
| `CSM-002` Cloud Security Management | 2 | High |
| `DAC-002` Data Analytics for Cybersecurity | 3 | High |
| `ESA-001` Enterprise Security Architecture | 2 | Medium |
| `ESI-001` Endpoint Security (IT) | 2 | Medium |
| `ESO-001` Endpoint Security (OT) | 2 | High |
| `ICER-001` Internal Controls Evaluation for Resilience | 2 | Medium |
| `NIS-001` Network & Infrastructure Security | 2 | Medium |
| `PCM-001` PKI & Certificate Management | 2 | Medium |
| `PM-001` Patch Management | 2 | Medium |
| `SHOSH-001` System Hardening and OS Cyber Hygiene | 2 | Medium |
| `VM-001` Vulnerability Management | 2 | High |
| `WAS-001` Web and API Security | 2 | Medium |
| `LXSCN001` Cross-Team Integration | 2 | Medium |
| `LXSCN019` Decision Making | 2 | Medium |
| `LXSCN031` Problem Solving | 3 | Medium |
| `LXSCN034` Analytical Thinking | 3 | Medium |
| `LXSCN036` Communication | 3 | Medium |
| `LXSCN039` Continuous Learning | 3 | High |
| `LXSCN045` Accuracy and Attention to Detail | 3 | High |

</details>

<details><summary><b>ROLE-09</b> Section Head, Digital Infrastructure Security Operations — 13 requirements</summary>

| Competency | Level | Priority |
| --- | ---: | --- |
| `LXSCN001` Cross-Team Integration | 3 | Medium |
| `LXSCN005` Strategic Thinking | 2 | Medium |
| `LXSCN019` Decision Making | 3 | Medium |
| `LXSCN026` Leadership | 3 | High |
| `LXSCN027` Team Management | 3 | Medium |
| `LXSCN031` Problem Solving | 4 | Medium |
| `LXSCN032` Presentation Delivery | 3 | High |
| `LXSCN034` Analytical Thinking | 3 | Medium |
| `LXSCN036` Communication | 3 | Medium |
| `LXSCN038` Planning and Organising | 3 | High |
| `LXSCN039` Continuous Learning | 3 | High |
| `LXSCN045` Accuracy and Attention to Detail | 3 | High |
| `LXSCN060` Systems Thinking | 3 | Medium |

</details>

<details><summary><b>ROLE-10</b> Section Head, Digital Vulnerability Management — 10 requirements</summary>

| Competency | Level | Priority |
| --- | ---: | --- |
| `DM-001` Document Management | 3 | Medium |
| `LXSCN001` Cross-Team Integration | 3 | Medium |
| `LXSCN005` Strategic Thinking | 2 | Medium |
| `LXSCN019` Decision Making | 3 | Medium |
| `LXSCN027` Team Management | 3 | Medium |
| `LXSCN031` Problem Solving | 4 | Medium |
| `LXSCN032` Presentation Delivery | 3 | Medium |
| `LXSCN034` Analytical Thinking | 3 | Medium |
| `LXSCN036` Communication | 3 | Medium |
| `LXSCN060` Systems Thinking | 3 | Medium |

</details>

<details><summary><b>ROLE-11</b> Senior Engineer, Digital Clouds & Application Security — 27 requirements</summary>

| Competency | Level | Priority |
| --- | ---: | --- |
| `AS-002` Application Security | 3 | Medium |
| `ASD-001` Application Security Development | 3 | Medium |
| `ASR-001` Application Security Review | 3 | Medium |
| `CAS-001` Cloud Automation and Scripting | 3 | Medium |
| `CDL-001` Cybersecurity Data Lake | 2 | High |
| `CIMRC-001` Cybersecurity Incident Management, Response, and Coordination | 3 | Medium |
| `CSA-001` Cloud Security Architecture | 3 | Medium |
| `CSM-002` Cloud Security Management | 3 | Medium |
| `DAC-002` Data Analytics for Cybersecurity | 3 | High |
| `ESA-001` Enterprise Security Architecture | 3 | Medium |
| `ESI-001` Endpoint Security (IT) | 3 | Medium |
| `ESO-001` Endpoint Security (OT) | 2 | High |
| `ICER-001` Internal Controls Evaluation for Resilience | 3 | Medium |
| `NIS-001` Network & Infrastructure Security | 3 | Medium |
| `PCM-001` PKI & Certificate Management | 3 | Medium |
| `PM-001` Patch Management | 3 | Medium |
| `SHOSH-001` System Hardening and OS Cyber Hygiene | 3 | Medium |
| `VM-001` Vulnerability Management | 2 | High |
| `WAS-001` Web and API Security | 3 | Medium |
| `LXSCN001` Cross-Team Integration | 2 | Medium |
| `LXSCN019` Decision Making | 2 | Medium |
| `LXSCN031` Problem Solving | 3 | Medium |
| `LXSCN032` Presentation Delivery | 3 | Medium |
| `LXSCN034` Analytical Thinking | 3 | Medium |
| `LXSCN036` Communication | 3 | Medium |
| `LXSCN039` Continuous Learning | 3 | Medium |
| `LXSCN045` Accuracy and Attention to Detail | 3 | Medium |

</details>

<details><summary><b>ROLE-12</b> Senior Engineer, Digital Infrastructure Security — 24 requirements</summary>

| Competency | Level | Priority |
| --- | ---: | --- |
| `AS-002` Application Security | 3 | High |
| `CAS-001` Cloud Automation and Scripting | 3 | Medium |
| `CDL-001` Cybersecurity Data Lake | 3 | Medium |
| `CIMRC-001` Cybersecurity Incident Management, Response, and Coordination | 3 | Medium |
| `CSA-001` Cloud Security Architecture | 3 | High |
| `CSM-002` Cloud Security Management | 3 | High |
| `DAC-002` Data Analytics for Cybersecurity | 3 | High |
| `ESA-001` Enterprise Security Architecture | 3 | Medium |
| `ESI-001` Endpoint Security (IT) | 3 | Medium |
| `ESO-001` Endpoint Security (OT) | 3 | High |
| `ICER-001` Internal Controls Evaluation for Resilience | 3 | Medium |
| `NIS-001` Network & Infrastructure Security | 3 | Medium |
| `PCM-001` PKI & Certificate Management | 3 | Medium |
| `PM-001` Patch Management | 3 | Medium |
| `SHOSH-001` System Hardening and OS Cyber Hygiene | 3 | Medium |
| `VM-001` Vulnerability Management | 2 | High |
| `WAS-001` Web and API Security | 3 | Medium |
| `LXSCN001` Cross-Team Integration | 2 | Medium |
| `LXSCN019` Decision Making | 2 | Medium |
| `LXSCN031` Problem Solving | 3 | Medium |
| `LXSCN034` Analytical Thinking | 3 | Medium |
| `LXSCN036` Communication | 3 | Medium |
| `LXSCN039` Continuous Learning | 3 | High |
| `LXSCN045` Accuracy and Attention to Detail | 3 | High |

</details>

<details><summary><b>ROLE-13</b> Senior Engineer, Digital Vulnerability Management — 20 requirements</summary>

| Competency | Level | Priority |
| --- | ---: | --- |
| `AICI-001` Asset Inventory and CMDB Integration | 3 | High |
| `AS-002` Application Security | 3 | Medium |
| `ASD-001` Application Security Development | 2 | High |
| `CAS-001` Cloud Automation and Scripting | 1 | High |
| `ESI-001` Endpoint Security (IT) | 2 | High |
| `ESO-001` Endpoint Security (OT) | 2 | High |
| `PM-001` Patch Management | 3 | Medium |
| `VM-001` Vulnerability Management | 3 | Medium |
| `WAS-001` Web and API Security | 2 | High |
| `WLSA-001` Windows and Linux Server Administration | 2 | High |
| `DM-001` Document Management | 2 | Medium |
| `LXSCN001` Cross-Team Integration | 2 | Medium |
| `LXSCN019` Decision Making | 2 | Medium |
| `LXSCN031` Problem Solving | 3 | Medium |
| `LXSCN032` Presentation Delivery | 2 | Medium |
| `LXSCN034` Analytical Thinking | 3 | Medium |
| `LXSCN036` Communication | 3 | Medium |
| `LXSCN038` Planning and Organising | 3 | Medium |
| `LXSCN039` Continuous Learning | 3 | High |
| `LXSCN045` Accuracy and Attention to Detail | 3 | High |

</details>

<details><summary><b>ROLE-14</b> Department Manager, Digital Risk Management & Compliance — 4 requirements</summary>

| Competency | Level | Priority |
| --- | ---: | --- |
| `LXSCN001` Cross-Team Integration | 4 | Medium |
| `LXSCN019` Decision Making | 4 | Medium |
| `LXSCN026` Leadership | 4 | Medium |
| `LXSCN060` Systems Thinking | 4 | Medium |

</details>

<details><summary><b>ROLE-15</b> Section Head, Cybersecurity Policies & Standard — 13 requirements</summary>

| Competency | Level | Priority |
| --- | ---: | --- |
| `DM-001` Document Management | 4 | Medium |
| `LXSCN001` Cross-Team Integration | 3 | Medium |
| `LXSCN005` Strategic Thinking | 3 | Medium |
| `LXSCN019` Decision Making | 3 | Medium |
| `LXSCN026` Leadership | 3 | Medium |
| `LXSCN030` Business Acumen | 2 | Medium |
| `LXSCN032` Presentation Delivery | 4 | Medium |
| `LXSCN034` Analytical Thinking | 3 | Medium |
| `LXSCN035` Relationship Building | 3 | Medium |
| `LXSCN036` Communication | 3 | Medium |
| `LXSCN038` Planning and Organising | 3 | Medium |
| `LXSCN046` Adaptability | 3 | Medium |
| `LXSCN060` Systems Thinking | 3 | Medium |

</details>

<details><summary><b>ROLE-16</b> Section Head, OT Risk Management & Compliance — 14 requirements</summary>

| Competency | Level | Priority |
| --- | ---: | --- |
| `DM-001` Document Management | 2 | Medium |
| `LXSCN001` Cross-Team Integration | 3 | Medium |
| `LXSCN005` Strategic Thinking | 2 | Medium |
| `LXSCN019` Decision Making | 3 | Medium |
| `LXSCN026` Leadership | 3 | Medium |
| `LXSCN030` Business Acumen | 2 | Medium |
| `LXSCN031` Problem Solving | 4 | Medium |
| `LXSCN032` Presentation Delivery | 4 | Medium |
| `LXSCN034` Analytical Thinking | 3 | Medium |
| `LXSCN035` Relationship Building | 3 | Medium |
| `LXSCN036` Communication | 3 | Medium |
| `LXSCN038` Planning and Organising | 3 | Medium |
| `LXSCN046` Adaptability | 3 | Medium |
| `LXSCN060` Systems Thinking | 3 | Medium |

</details>

<details><summary><b>ROLE-17</b> Senior Analyst, Cybersecurity Policies and Standards — 24 requirements</summary>

| Competency | Level | Priority |
| --- | ---: | --- |
| `CRGS-001` Cyber Risk Governance & Strategy | 2 | Medium |
| `CSMS-001` Cyber Security Management System (CSMS) | 2 | Medium |
| `CSRG-001` Cloud Security Risk Management | 2 | High |
| `ERMIR-001` Enterprise Risk Management Integration & Reporting | 2 | High |
| `ICER-001` Internal Controls Evaluation for Resilience | 2 | High |
| `ISA-001` Internal Security Audit | 1 | High |
| `ISGRC-001` Information Security Governance and Regulatory Compliance | 2 | Medium |
| `OCI-001` OT Cybersecurity | 2 | High |
| `PPSD-001` Policy, Procedure & Standards Development | 3 | Medium |
| `RAM-001` Risk Assessment Methodology | 2 | High |
| `RTMP-001` Risk Treatment & Mitigation Planning | 2 | High |
| `SAC-001` Security Awareness & Communication | 2 | Medium |
| `DM-001` Document Management | 2 | Medium |
| `LXSCN001` Cross-Team Integration | 2 | Medium |
| `LXSCN026` Leadership | 2 | High |
| `LXSCN030` Business Acumen | 1 | Medium |
| `LXSCN031` Problem Solving | 2 | High |
| `LXSCN032` Presentation Delivery | 3 | Medium |
| `LXSCN034` Analytical Thinking | 2 | Medium |
| `LXSCN035` Relationship Building | 2 | Medium |
| `LXSCN036` Communication | 2 | Medium |
| `LXSCN039` Continuous Learning | 2 | High |
| `LXSCN045` Accuracy and Attention to Detail | 2 | High |
| `LXSCN060` Systems Thinking | 2 | Medium |

</details>

<details><summary><b>ROLE-18</b> Senior Analyst, IT Risk Management and Compliance — 23 requirements</summary>

| Competency | Level | Priority |
| --- | ---: | --- |
| `CRGS-001` Cyber Risk Governance & Strategy | 2 | Medium |
| `CSMS-001` Cyber Security Management System (CSMS) | 2 | High |
| `CSRG-001` Cloud Security Risk Management | 2 | Medium |
| `ERMIR-001` Enterprise Risk Management Integration & Reporting | 2 | Medium |
| `ICER-001` Internal Controls Evaluation for Resilience | 2 | Medium |
| `ISA-001` Internal Security Audit | 1 | High |
| `ISGRC-001` Information Security Governance and Regulatory Compliance | 2 | Medium |
| `PPSD-001` Policy, Procedure & Standards Development | 2 | High |
| `RAM-001` Risk Assessment Methodology | 2 | Medium |
| `RTMP-001` Risk Treatment & Mitigation Planning | 2 | Medium |
| `SAC-001` Security Awareness & Communication | 2 | High |
| `DM-001` Document Management | 2 | Medium |
| `LXSCN001` Cross-Team Integration | 2 | Medium |
| `LXSCN026` Leadership | 2 | High |
| `LXSCN030` Business Acumen | 1 | Medium |
| `LXSCN031` Problem Solving | 2 | Medium |
| `LXSCN032` Presentation Delivery | 3 | Medium |
| `LXSCN034` Analytical Thinking | 2 | Medium |
| `LXSCN035` Relationship Building | 2 | Medium |
| `LXSCN036` Communication | 2 | Medium |
| `LXSCN039` Continuous Learning | 2 | High |
| `LXSCN045` Accuracy and Attention to Detail | 2 | High |
| `LXSCN060` Systems Thinking | 2 | Medium |

</details>

<details><summary><b>ROLE-19</b> Senior Analyst, OT Risk Management and Compliance — 23 requirements</summary>

| Competency | Level | Priority |
| --- | ---: | --- |
| `CRGS-001` Cyber Risk Governance & Strategy | 2 | Medium |
| `CSMS-001` Cyber Security Management System (CSMS) | 2 | High |
| `ERMIR-001` Enterprise Risk Management Integration & Reporting | 2 | Medium |
| `ICER-001` Internal Controls Evaluation for Resilience | 2 | Medium |
| `ISA-001` Internal Security Audit | 1 | High |
| `ISGRC-001` Information Security Governance and Regulatory Compliance | 2 | Medium |
| `OCI-001` OT Cybersecurity | 2 | Medium |
| `PPSD-001` Policy, Procedure & Standards Development | 2 | High |
| `RAM-001` Risk Assessment Methodology | 2 | Medium |
| `RTMP-001` Risk Treatment & Mitigation Planning | 2 | Medium |
| `SAC-001` Security Awareness & Communication | 2 | High |
| `DM-001` Document Management | 2 | Medium |
| `LXSCN001` Cross-Team Integration | 2 | Medium |
| `LXSCN026` Leadership | 2 | High |
| `LXSCN030` Business Acumen | 1 | Medium |
| `LXSCN031` Problem Solving | 2 | Medium |
| `LXSCN032` Presentation Delivery | 3 | Medium |
| `LXSCN034` Analytical Thinking | 2 | Medium |
| `LXSCN035` Relationship Building | 2 | Medium |
| `LXSCN036` Communication | 2 | Medium |
| `LXSCN039` Continuous Learning | 2 | High |
| `LXSCN045` Accuracy and Attention to Detail | 2 | High |
| `LXSCN060` Systems Thinking | 2 | Medium |

</details>

<details><summary><b>ROLE-20</b> Specialist, Cybersecurity Policies and Standards — 17 requirements</summary>

| Competency | Level | Priority |
| --- | ---: | --- |
| `CRGS-001` Cyber Risk Governance & Strategy | 3 | Medium |
| `CSMS-001` Cyber Security Management System (CSMS) | 3 | Medium |
| `CSRG-001` Cloud Security Risk Management | 2 | High |
| `ERMIR-001` Enterprise Risk Management Integration & Reporting | 3 | High |
| `ICER-001` Internal Controls Evaluation for Resilience | 2 | High |
| `ISA-001` Internal Security Audit | 1 | High |
| `ISGRC-001` Information Security Governance and Regulatory Compliance | 3 | Medium |
| `PPSD-001` Policy, Procedure & Standards Development | 3 | Medium |
| `SAC-001` Security Awareness & Communication | 3 | Medium |
| `DM-001` Document Management | 3 | Medium |
| `LXSCN001` Cross-Team Integration | 2 | Medium |
| `LXSCN030` Business Acumen | 1 | Medium |
| `LXSCN032` Presentation Delivery | 3 | Medium |
| `LXSCN034` Analytical Thinking | 3 | Medium |
| `LXSCN035` Relationship Building | 2 | Medium |
| `LXSCN036` Communication | 3 | Medium |
| `LXSCN060` Systems Thinking | 3 | Medium |

</details>

<details><summary><b>ROLE-21</b> Specialist, Group Companies Risk Management and Compliance — 27 requirements</summary>

| Competency | Level | Priority |
| --- | ---: | --- |
| `BCDRTEAM-001` BCDR Testing, Exercise and Awareness Management | 2 | Medium |
| `BIAB-001` Business Impact Analysis (BIA) | 3 | Medium |
| `CRGS-001` Cyber Risk Governance & Strategy | 3 | Medium |
| `CSMS-001` Cyber Security Management System (CSMS) | 2 | Medium |
| `CSRG-001` Cloud Security Risk Management | 3 | High |
| `CTBDEM-001` Continuity Testing & BC/DR Exercise Management | 2 | High |
| `ERMIR-001` Enterprise Risk Management Integration & Reporting | 3 | Medium |
| `ICER-001` Internal Controls Evaluation for Resilience | 2 | Medium |
| `ISA-001` Internal Security Audit | 1 | High |
| `ISGRC-001` Information Security Governance and Regulatory Compliance | 2 | Medium |
| `OCI-001` OT Cybersecurity | 2 | Medium |
| `PPSD-001` Policy, Procedure & Standards Development | 2 | Medium |
| `RAM-001` Risk Assessment Methodology | 2 | Medium |
| `RTMP-001` Risk Treatment & Mitigation Planning | 2 | Medium |
| `SAC-001` Security Awareness & Communication | 3 | Medium |
| `DM-001` Document Management | 2 | Medium |
| `LXSCN001` Cross-Team Integration | 2 | Medium |
| `LXSCN026` Leadership | 2 | High |
| `LXSCN030` Business Acumen | 1 | High |
| `LXSCN031` Problem Solving | 3 | Medium |
| `LXSCN032` Presentation Delivery | 3 | Medium |
| `LXSCN034` Analytical Thinking | 3 | Medium |
| `LXSCN035` Relationship Building | 3 | Medium |
| `LXSCN036` Communication | 3 | Medium |
| `LXSCN039` Continuous Learning | 3 | High |
| `LXSCN045` Accuracy and Attention to Detail | 2 | High |
| `LXSCN060` Systems Thinking | 3 | High |

</details>

<details><summary><b>ROLE-22</b> Specialist, IT Risk Management and Compliance — 21 requirements</summary>

| Competency | Level | Priority |
| --- | ---: | --- |
| `CRGS-001` Cyber Risk Governance & Strategy | 3 | Medium |
| `CSMS-001` Cyber Security Management System (CSMS) | 2 | High |
| `CSRG-001` Cloud Security Risk Management | 3 | Medium |
| `ERMIR-001` Enterprise Risk Management Integration & Reporting | 3 | Medium |
| `ICER-001` Internal Controls Evaluation for Resilience | 2 | Medium |
| `ISA-001` Internal Security Audit | 1 | High |
| `ISGRC-001` Information Security Governance and Regulatory Compliance | 2 | Medium |
| `PPSD-001` Policy, Procedure & Standards Development | 2 | High |
| `RAM-001` Risk Assessment Methodology | 2 | Medium |
| `RTMP-001` Risk Treatment & Mitigation Planning | 2 | Medium |
| `SAC-001` Security Awareness & Communication | 3 | High |
| `DM-001` Document Management | 2 | Medium |
| `LXSCN001` Cross-Team Integration | 2 | Medium |
| `LXSCN026` Leadership | 2 | High |
| `LXSCN030` Business Acumen | 1 | Medium |
| `LXSCN031` Problem Solving | 3 | Medium |
| `LXSCN032` Presentation Delivery | 3 | Medium |
| `LXSCN034` Analytical Thinking | 3 | Medium |
| `LXSCN035` Relationship Building | 2 | Medium |
| `LXSCN036` Communication | 3 | Medium |
| `LXSCN060` Systems Thinking | 3 | Medium |

</details>

<details><summary><b>ROLE-23</b> Section Head, Downstream Industry, Marketing and Trading OT Cybersecurity — 14 requirements</summary>

| Competency | Level | Priority |
| --- | ---: | --- |
| `DM-001` Document Management | 3 | Medium |
| `LXSCN001` Cross-Team Integration | 3 | Medium |
| `LXSCN008` Strategic Influence | 3 | High |
| `LXSCN019` Decision Making | 3 | Medium |
| `LXSCN020` Operational Effectiveness | 2 | Medium |
| `LXSCN026` Leadership | 3 | Medium |
| `LXSCN027` Team Management | 3 | Medium |
| `LXSCN031` Problem Solving | 4 | Medium |
| `LXSCN035` Relationship Building | 3 | Medium |
| `LXSCN036` Communication | 3 | Medium |
| `LXSCN046` Adaptability | 3 | Medium |
| `LXSCN055` Stakeholder Management | 3 | Medium |
| `LXSCN060` Systems Thinking | 3 | Medium |
| `LXSCN206` Performance Management | 3 | Medium |

</details>

<details><summary><b>ROLE-24</b> Section Head, Upstream OT Cybersecurity — 13 requirements</summary>

| Competency | Level | Priority |
| --- | ---: | --- |
| `DM-001` Document Management | 3 | Medium |
| `LXSCN001` Cross-Team Integration | 3 | Medium |
| `LXSCN019` Decision Making | 3 | Medium |
| `LXSCN020` Operational Effectiveness | 2 | Medium |
| `LXSCN026` Leadership | 3 | Medium |
| `LXSCN027` Team Management | 3 | Medium |
| `LXSCN031` Problem Solving | 4 | Medium |
| `LXSCN035` Relationship Building | 3 | Medium |
| `LXSCN036` Communication | 3 | Medium |
| `LXSCN046` Adaptability | 3 | Medium |
| `LXSCN055` Stakeholder Management | 3 | Medium |
| `LXSCN060` Systems Thinking | 3 | Medium |
| `LXSCN206` Performance Management | 3 | Medium |

</details>

<details><summary><b>ROLE-25</b> Senior Engineer, Downstream OT Cybersecurity — 24 requirements</summary>

| Competency | Level | Priority |
| --- | ---: | --- |
| `DDUGE-001` Data-Diode & Unidirectional-Gateway Engineering | 2 | Medium |
| `IOS-001` IAM for OT Systems | 2 | Medium |
| `ODC-001` OT Downstream Cybersecurity | 2 | Medium |
| `OIRF-001` OT Incident Response & Forensics | 2 | Medium |
| `OND-001` OT Network Design | 2 | Medium |
| `OPSV-001` OT Project Security Validation | 2 | Medium |
| `OPVM-001` OT Patch & Vulnerability Management | 2 | Medium |
| `OSBCM-001` OT Security Baselines & Configuration Management | 2 | Medium |
| `PMOSP-001` Preventive Maintenance for OT Security Platforms | 2 | Medium |
| `PSHCRA-001` Process-Safety & HSE Cyber-Risk Alignment | 1 | Medium |
| `SRAGA-001` Secure Remote Access Gateway Administration | 2 | High |
| `WLBOFAS-001` Wireless / Low-Bandwidth OT Field Asset Security | 2 | Medium |
| `DM-001` Document Management | 2 | Medium |
| `LXSCN001` Cross-Team Integration | 2 | Medium |
| `LXSCN019` Decision Making | 2 | Medium |
| `LXSCN031` Problem Solving | 3 | Medium |
| `LXSCN032` Presentation Delivery | 2 | High |
| `LXSCN034` Analytical Thinking | 3 | High |
| `LXSCN035` Relationship Building | 2 | High |
| `LXSCN036` Communication | 3 | Medium |
| `LXSCN039` Continuous Learning | 1 | High |
| `LXSCN045` Accuracy and Attention to Detail | 2 | High |
| `LXSCN055` Stakeholder Management | 2 | Medium |
| `LXSCN060` Systems Thinking | 2 | Medium |

</details>

<details><summary><b>ROLE-26</b> Senior Engineer, Upstream OT Cybersecurity — 22 requirements</summary>

| Competency | Level | Priority |
| --- | ---: | --- |
| `DDUGE-001` Data-Diode & Unidirectional-Gateway Engineering | 3 | Medium |
| `IOS-001` IAM for OT Systems | 2 | Medium |
| `OIRF-001` OT Incident Response & Forensics | 2 | Medium |
| `OND-001` OT Network Design | 2 | Medium |
| `OPSV-001` OT Project Security Validation | 2 | Medium |
| `OPVM-001` OT Patch & Vulnerability Management | 2 | Medium |
| `OSBCM-001` OT Security Baselines & Configuration Management | 2 | Medium |
| `OUC-001` OT Upstream Cybersecurity | 2 | Medium |
| `PMOSP-001` Preventive Maintenance for OT Security Platforms | 2 | Medium |
| `PSHCRA-001` Process-Safety & HSE Cyber-Risk Alignment | 1 | Medium |
| `SRAGA-001` Secure Remote Access Gateway Administration | 2 | High |
| `WLBOFAS-001` Wireless / Low-Bandwidth OT Field Asset Security | 2 | Medium |
| `DM-001` Document Management | 2 | Medium |
| `LXSCN001` Cross-Team Integration | 2 | Medium |
| `LXSCN019` Decision Making | 2 | Medium |
| `LXSCN031` Problem Solving | 3 | Medium |
| `LXSCN032` Presentation Delivery | 2 | High |
| `LXSCN034` Analytical Thinking | 3 | High |
| `LXSCN036` Communication | 3 | Medium |
| `LXSCN045` Accuracy and Attention to Detail | 2 | High |
| `LXSCN055` Stakeholder Management | 2 | Medium |
| `LXSCN060` Systems Thinking | 2 | Medium |

</details>

<details><summary><b>ROLE-27</b> Analyst, Digital Cybersecurity Monitoring — 27 requirements</summary>

| Competency | Level | Priority |
| --- | ---: | --- |
| `CIMRC-001` Cybersecurity Incident Management, Response, and Coordination | 2 | Medium |
| `CSM-001` Cloud Security Monitoring | 2 | Medium |
| `CTIC-001` Cyber Threat Intelligence (CTI) | 1 | Medium |
| `CTIO-001` Cyber Threat Intelligence for OT | 1 | Medium |
| `DAC-002` Data Analytics for Cybersecurity | 2 | High |
| `DE-001` Detection Engineering | 2 | Medium |
| `DF-003` Digital Forensics | 1 | Medium |
| `ESI-001` Endpoint Security (IT) | 1 | High |
| `ESO-001` Endpoint Security (OT) | 1 | High |
| `EXT-001` EDR/XDR Tooling | 2 | Medium |
| `LM-001` Log Management | 2 | Medium |
| `MA-001` Malware Analysis | 1 | High |
| `NSM-001` Network Security Monitoring | 2 | Medium |
| `OTDM-001` OT Threat Detection & Monitoring | 1 | Medium |
| `PT-001` Penetration Testing | 1 | Medium |
| `SA-001` SOC Automation | 1 | Medium |
| `SAT-001` Security Alert Triage | 2 | Medium |
| `TH-002` Threat Hunting | 1 | Medium |
| `TMD-001` Threat Monitoring and Detection | 2 | Medium |
| `LXSCN001` Cross-Team Integration | 2 | Medium |
| `LXSCN019` Decision Making | 2 | Medium |
| `LXSCN031` Problem Solving | 2 | Medium |
| `LXSCN034` Analytical Thinking | 3 | Medium |
| `LXSCN036` Communication | 3 | Medium |
| `LXSCN037` Tolerance for Uncertainty | 2 | Medium |
| `LXSCN039` Continuous Learning | 2 | High |
| `LXSCN045` Accuracy and Attention to Detail | 2 | High |

</details>

<details><summary><b>ROLE-28</b> Section Head, Digital Cybersecurity Monitoring — 11 requirements</summary>

| Competency | Level | Priority |
| --- | ---: | --- |
| `LXSCN001` Cross-Team Integration | 3 | Medium |
| `LXSCN005` Strategic Thinking | 2 | Medium |
| `LXSCN019` Decision Making | 3 | Medium |
| `LXSCN026` Leadership | 3 | Medium |
| `LXSCN027` Team Management | 3 | Medium |
| `LXSCN031` Problem Solving | 4 | Medium |
| `LXSCN034` Analytical Thinking | 3 | Medium |
| `LXSCN036` Communication | 3 | Medium |
| `LXSCN037` Tolerance for Uncertainty | 4 | Medium |
| `LXSCN038` Planning and Organising | 3 | Medium |
| `LXSCN060` Systems Thinking | 3 | Medium |

</details>

<details><summary><b>ROLE-29</b> Section Head, Threat Hunting — 20 requirements</summary>

| Competency | Level | Priority |
| --- | ---: | --- |
| `LXSCN001` Cross-Team Integration | 3 | Medium |
| `LXSCN005` Strategic Thinking | 4 | Medium |
| `LXSCN008` Strategic Influence | 3 | Medium |
| `LXSCN019` Decision Making | 3 | Medium |
| `LXSCN020` Operational Effectiveness | 4 | Medium |
| `LXSCN026` Leadership | 3 | High |
| `LXSCN027` Team Management | 3 | Medium |
| `LXSCN030` Business Acumen | 3 | Medium |
| `LXSCN031` Problem Solving | 3 | Medium |
| `LXSCN032` Presentation Delivery | 3 | High |
| `LXSCN034` Analytical Thinking | 3 | Medium |
| `LXSCN035` Relationship Building | 4 | Medium |
| `LXSCN036` Communication | 3 | Medium |
| `LXSCN037` Tolerance for Uncertainty | 3 | Medium |
| `LXSCN038` Planning and Organising | 3 | High |
| `LXSCN039` Continuous Learning | 3 | High |
| `LXSCN045` Accuracy and Attention to Detail | 3 | High |
| `LXSCN046` Adaptability | 4 | Medium |
| `LXSCN060` Systems Thinking | 3 | Medium |
| `LXSCN206` Performance Management | 4 | Medium |

</details>

<details><summary><b>ROLE-30</b> Senior Analyst, Digital Cybersecurity Monitoring — 24 requirements</summary>

| Competency | Level | Priority |
| --- | ---: | --- |
| `CIMRC-001` Cybersecurity Incident Management, Response, and Coordination | 3 | Medium |
| `CSM-001` Cloud Security Monitoring | 3 | Medium |
| `CTIC-001` Cyber Threat Intelligence (CTI) | 1 | Medium |
| `CTIO-001` Cyber Threat Intelligence for OT | 1 | Medium |
| `DE-001` Detection Engineering | 2 | Medium |
| `DF-003` Digital Forensics | 1 | Medium |
| `ESI-001` Endpoint Security (IT) | 1 | High |
| `ESO-001` Endpoint Security (OT) | 1 | High |
| `EXT-001` EDR/XDR Tooling | 2 | Medium |
| `LM-001` Log Management | 2 | Medium |
| `MA-001` Malware Analysis | 1 | High |
| `NSM-001` Network Security Monitoring | 2 | Medium |
| `OTDM-001` OT Threat Detection & Monitoring | 1 | Medium |
| `PT-001` Penetration Testing | 1 | Medium |
| `SA-001` SOC Automation | 1 | Medium |
| `SAT-001` Security Alert Triage | 2 | Medium |
| `TH-002` Threat Hunting | 1 | Medium |
| `TMD-001` Threat Monitoring and Detection | 2 | Medium |
| `LXSCN001` Cross-Team Integration | 2 | Medium |
| `LXSCN019` Decision Making | 2 | Medium |
| `LXSCN031` Problem Solving | 3 | Medium |
| `LXSCN034` Analytical Thinking | 3 | Medium |
| `LXSCN036` Communication | 3 | Medium |
| `LXSCN037` Tolerance for Uncertainty | 2 | Medium |

</details>

<details><summary><b>ROLE-31</b> Senior Engineer, Digital Cybersecurity Monitoring — 25 requirements</summary>

| Competency | Level | Priority |
| --- | ---: | --- |
| `CIMRC-001` Cybersecurity Incident Management, Response, and Coordination | 2 | Medium |
| `CSM-001` Cloud Security Monitoring | 3 | Medium |
| `CTIC-001` Cyber Threat Intelligence (CTI) | 1 | Medium |
| `CTIO-001` Cyber Threat Intelligence for OT | 1 | Medium |
| `DAC-002` Data Analytics for Cybersecurity | 3 | Medium |
| `DE-001` Detection Engineering | 4 | Medium |
| `ESI-001` Endpoint Security (IT) | 3 | High |
| `ESO-001` Endpoint Security (OT) | 3 | High |
| `EXT-001` EDR/XDR Tooling | 2 | Medium |
| `LM-001` Log Management | 3 | Medium |
| `MA-001` Malware Analysis | 2 | High |
| `NSM-001` Network Security Monitoring | 3 | Medium |
| `OTDM-001` OT Threat Detection & Monitoring | 2 | Medium |
| `SA-001` SOC Automation | 3 | Medium |
| `SAT-001` Security Alert Triage | 3 | Medium |
| `TMD-001` Threat Monitoring and Detection | 3 | Medium |
| `LXSCN001` Cross-Team Integration | 2 | Medium |
| `LXSCN019` Decision Making | 3 | Medium |
| `LXSCN031` Problem Solving | 3 | Medium |
| `LXSCN032` Presentation Delivery | 3 | High |
| `LXSCN034` Analytical Thinking | 3 | Medium |
| `LXSCN036` Communication | 3 | Medium |
| `LXSCN037` Tolerance for Uncertainty | 2 | Medium |
| `LXSCN039` Continuous Learning | 3 | High |
| `LXSCN045` Accuracy and Attention to Detail | 3 | High |

</details>

<details><summary><b>ROLE-32</b> Specialist, Malware Analysis — 27 requirements</summary>

| Competency | Level | Priority |
| --- | ---: | --- |
| `CIMRC-001` Cybersecurity Incident Management, Response, and Coordination | 2 | Medium |
| `CSM-001` Cloud Security Monitoring | 2 | Medium |
| `CTIC-001` Cyber Threat Intelligence (CTI) | 2 | Medium |
| `CTIO-001` Cyber Threat Intelligence for OT | 2 | Medium |
| `DAC-002` Data Analytics for Cybersecurity | 2 | Medium |
| `DE-001` Detection Engineering | 3 | Medium |
| `DF-003` Digital Forensics | 4 | Medium |
| `ESI-001` Endpoint Security (IT) | 3 | Medium |
| `ESO-001` Endpoint Security (OT) | 3 | Medium |
| `EXT-001` EDR/XDR Tooling | 4 | Medium |
| `LM-001` Log Management | 2 | Medium |
| `MA-001` Malware Analysis | 4 | Medium |
| `NSM-001` Network Security Monitoring | 3 | Medium |
| `OTDM-001` OT Threat Detection & Monitoring | 4 | Medium |
| `PT-001` Penetration Testing | 4 | Medium |
| `SA-001` SOC Automation | 3 | Medium |
| `SAT-001` Security Alert Triage | 2 | Medium |
| `TH-002` Threat Hunting | 4 | Medium |
| `TMD-001` Threat Monitoring and Detection | 4 | Medium |
| `LXSCN001` Cross-Team Integration | 2 | Medium |
| `LXSCN019` Decision Making | 2 | Medium |
| `LXSCN031` Problem Solving | 3 | Medium |
| `LXSCN034` Analytical Thinking | 3 | Medium |
| `LXSCN036` Communication | 3 | Medium |
| `LXSCN037` Tolerance for Uncertainty | 2 | Medium |
| `LXSCN039` Continuous Learning | 3 | High |
| `LXSCN045` Accuracy and Attention to Detail | 3 | High |

</details>

Not loaded because the source has no required level: ROLE-12 / ASD-001, ROLE-12 / ASR-001, ROLE-12 / LXSCN032. Add them on Library → Role requirements once the level is known.

## Courses and programmes

| Code | Course | Type | Delivery | Hours | Days | Observed |
| --- | --- | --- | --- | ---: | ---: | --- |
| `AIC-01` | **AI+ Security Practitioner** | Certification Preparation | In-person | 40 | 5 |  |
| `CF-02` | **Cognitive Agility, Decision Making and Behavioral Performance** | Workshop | In-person | 6 | 1 | Yes |
| `CF-03` | **Communicating with Impact- Effective Presentation Skills** | Workshop | In-person | 4 | 1 | Yes |
| `CF-04` | **Communicating with Influence-Storytelling for Engagement** | Workshop | In-person | 4 | 1 | Yes |
| `CF-05` | **Communication Skills: Communicating with Clarity & Impact: Part 1** | Workshop | In-person | 4 | 1 | Yes |
| `CF-06` | **Communication Skills: Communicating with Clarity & Impact: Part 2** | Workshop | In-person | 4 | 1 | Yes |
| `CF-07` | **Communication in Meetings- Driving Clarity & Accountability with Minutes of the Meeting** | Workshop | In-person | 4 | 1 | Yes |
| `CF-08` | **Communication with Effective Solutions with Design Thinking** | Workshop | In-person | 4 | 1 | Yes |
| `CF-09` | **Reading People, Shaping Outcomes: Psychometrics, NLP & Conflict Intelligence** | Workshop | In-person | 6 | 1 | Yes |
| `CF-10` | **Team Collaboration & Communication Excellence with Fish Philosophy** | Workshop | In-person | 4 | 1 | Yes |
| `CF-11` | **The Human Side of Time Management and the Psychology of Prioritization** | Workshop | In-person | 6 | 1 | Yes |
| `PEP-01` | **Cognitive Agility, Decision Making & Behavioral Performance** (hours proposed) | Leadership Programme | In-person | 6 | 1 | Yes |
| `PEP-02` | **Communication Skills - Part 1** (hours proposed) | Leadership Programme | In-person | 6 | 1 | Yes |
| `PEP-03` | **The Human Side of Time Management & Psychology of Prioritization** (hours proposed) | Leadership Programme | In-person | 6 | 1 | Yes |
| `PEP-04` | **The Psychology of Persuasive Communication** (hours proposed) | Leadership Programme | In-person | 6 | 1 | Yes |
| `XF-OBS-5D` | **Cross-Functional Assessment Programme (5 days)** | Leadership Programme | In-person | | 5 | Yes |
| `DTN-01` | **OT Fundamentals Boot Camp** | Boot Camp | In-person | 20 | | |
| `DTN-02` | **Vulnerability and Infrastructure Security Boot Camp** | Boot Camp | In-person | 20 | | |
| `DTN-03` | **AI SOC Boot Camp** | Boot Camp | In-person | 20 | | |
| `DTN-04` | **OT & GRC Boot Camp** | Boot Camp | In-person | 20 | | |
| `DTN-05` | **CAPM Preparation Boot Camp** | Boot Camp | In-person | 20 | | |
| `DTN-06` | **OT & ICS Boot Camp** | Boot Camp | In-person | 20 | | |
| `LMS-S4` | **LMS learning curriculum (SAP SuccessFactors)** | Self Study | Self-paced | 8 | | |

**Observed programme days** (the observation grid shows these titles per day):

- Day 1: S1 Team Collaboration — Team Collaboration with Fish Philosophy
- Day 2: S2 Accountability & MOM — Driving Accountability & MOM
- Day 3: S3 Storytelling — Communication with Influence - Storytelling
- Day 4: S4 Presentation Skills — Communication with Impact - Presentation Skills
- Day 5: S5 Problem Solving — Effective Solutions: Problem Solving & Critical Thinking

**IDP segments** (Development plan → Segment; progress per segment on the coaching tracker):

| Segment | Label | Hours | Recorded as |
| --- | --- | ---: | --- |
| S1 | S1 Professional certification | 40 | Certification (track Professional) |
| S2 | S2 Hands-on labs (Immersive) |  | Course (Immersive Lab collection) |
| S3 | S3 AI certification | 10 | Certification (track AI) |
| S4 | S4 LMS learning (SAP SuccessFactors) | 8 | Course (Self Study) |
| S5 | S5 Cross-functional training | 35 | Courses (Workshop / Leadership Programme) |
| DTN | DTN Department training need | 20 | Course (Boot camp) |

## Lab collections

Loaded as courses of type Immersive Lab (code `LAB-<collection>`) with the number of labs, so a training record can hold *labs completed of total*.

| Code | Collection | Labs |
| --- | --- | ---: |
| `LAB-AI-CHALLENGES` | AI Challenges | 3 |
| `LAB-ENG-CIA-1` | Cloud, Infra, & App Sec Phase 1 | 79 |
| `LAB-BCMCTI-DBC-1` | DBC Phase 1 | 42 |
| `LAB-RC-ITOT-1` | IT & OT Risk & Compliance Phase 1 | 31 |
| `LAB-DIAM-1` | Identity & Access Phase 1 | 26 |
| `LAB-SOC-M-1` | Monitoring Phase 1 | 74 |
| `LAB-OSINT` | OSINT | 15 |
| `LAB-BCMCTI-RCTI-1` | Red & CTI Phase 1 | 68 |
| `LAB-RC-RCPS-1` | Risk, Compliance, Policies, & Standards Phase 1 | 42 |
| `LAB-SOC-TH-1` | Threat Hunting Phase 1 | 70 |
| `LAB-OT-1` | Up & Down Stream Phase 1 | 37 |
| `LAB-ENG-VP-1` | Vulnerability & Patch Management Phase 1 | 78 |

## Certifications

*Other spellings* are the variants found in source registers; use them to match imported rows to the right certification.

| Code | Certification | Provider | Track | Other spellings |
| --- | --- | --- | --- | --- |
| `CISSP` | **Certified Information Systems Security Professional (CISSP)** | ISC2 | Professional | ISC 2 CISSP - Certified Information Systems Security Professional<br>ISC2 C IS SP : Certified Information Systems Security Pro fessional |
| `CCSP` | **Certified Cloud Security Professional (CCSP)** | ISC2 | Professional | CCSP - Certified Cloud Security Professional<br>ISC2 CCSP: Certified Cloud Security Professional |
| `CSSLP` | **Certified Secure Software Lifecycle Professional (CSSLP)** | ISC2 | Professional | ISC2 CSSLP (Certified Secure Software Lifecycle Professional) |
| `CISM` | **Certified Information Security Manager (CISM)** | ISACA | Professional | ISACA CISM (Certified Information Security Manager) |
| `CISA` | **Certified Information Systems Auditor (CISA)** | ISACA | Professional | ISACA CISA (Certified Information Systems Auditor)<br>ISACA CIS A (Certified Information Systems Auditor ) |
| `CRISC` | **Certified in Risk and Information Systems Control (CRISC)** | ISACA | Professional | ISACA CRISC (Certified in Risk and Information Systems Control)<br>CRISC (Certified in Risk and Information Systems Control)<br>ISACA CRISC – Certified in Risk and Information Systems Control<br>ISACA Certified in Risk and Information Systems Control (CRISC) |
| `CGEIT` | **Certified in the Governance of Enterprise IT (CGEIT)** | ISACA | Professional | CGEIT (Certified in the Governance of Enterprise IT) |
| `CDPSE` | **Certified Data Privacy Solutions Engineer (CDPSE)** | ISACA | Professional | ISACA CDPSE : Certified Data Privacy Solutions Engineer |
| `GCDA` | **GIAC Certified Detection Analyst (GCDA)** | SANS / GIAC | Professional | SANS GIAC Certified Detection Analyst (GCDA) |
| `GCIH` | **GIAC Certified Incident Handler (GCIH)** | SANS / GIAC | Professional | GIAC Certified Incident Handler (GCIH)<br>SANS GIAC Certified Incident Handler ( GCIH ) |
| `GCTI` | **GIAC Cyber Threat Intelligence (GCTI)** | SANS / GIAC | Professional | GCTI – GIAC Cyber Threat Intelligence<br>SANS GIAC Cyber Threat Intelligence (GCTI) |
| `GOSI` | **GIAC Open Source Intelligence (GOSI)** | SANS / GIAC | Professional | GOSI – GIAC Open-Source Intelligence |
| `GRID` | **GIAC Response and Industrial Defense (GRID)** | SANS / GIAC | Professional | SANS GIAC Response and Industrial Defense (GRID) |
| `ICS410` | **ICS/SCADA Security Essentials (ICS410)** | SANS | Professional | ICS/SCADA Security Essentials (ICS410)<br>ICS/SCADA Security Essentials ( ICS 410) |
| `FOR509` | **FOR509: Enterprise Cloud Forensics and Incident Response** | SANS | Professional | SANS FOR509: Enterprise Cloud Forensics and Incident Response |
| `CESE` | **Certified Endpoint Security Engineer (CESE)** | EC-Council | Professional | EC-Council Certified Endpoint Security Engineer (CESE) |
| `CASE` | **Certified Application Security Engineer (CASE)** | EC-Council | Professional | EC-Council: Certified Application Security Engineer (CASE) |
| `SECPLUS` | **CompTIA Security+** | CompTIA | Professional | CompTIA Security+ |
| `CYSA` | **CompTIA CySA+** | CompTIA | Professional | CompTIA CySA+<br>CompTIA CySA + |
| `CCNA` | **Cisco Certified Network Associate (CCNA)** | Cisco | Professional | Cisco CCNA: Certified Computer Networks Associate |
| `AZ-400` | **Microsoft Certified: DevOps Engineer Expert (AZ-400)** | Microsoft | Professional | Microsoft Certified: DevOps Engineer Expert (AZ-400)<br>Microsoft AZ-400 DevOps Engineer Expert<br>Microsoft Certified: DevOps Engineer Expert (AZ-400) or Pre- reqs , Azure DevOps Associate or Azure Administrator Associate, AZ-104 or AZ-204 |
| `SC-300` | **Microsoft Certified: Identity and Access Administrator Associate (SC-300)** | Microsoft | Professional | Microsoft Certified: Identity and Access Administrator Associate (SC-300) |
| `SC-200` | **Microsoft Certified: Security Operations Analyst Associate (SC-200)** | Microsoft | Professional | Microsoft Certified: Security Operations Analyst Associate (SC-200) |
| `OSWA` | **OffSec Web Assessor (OSWA) - WEB-200** | OffSec | Professional | OffSec WEB-200 (OSWA) – Offensive Security Web Assessor |
| `ISO27001-LI` | **ISO/IEC 27001 Lead Implementer** | PECB | Professional | PECB ISO/IEC 27001 Lead Implementer |
| `ISO31000-RM` | **ISO 31000 Risk Manager** | PECB | Professional | ISO 31000 Risk Manager<br>PECB ISO 31000 Risk Manager |
| `ISO22301-LI` | **ISO/IEC 22301 Lead Implementer** | PECB | Professional | ISO 22301 Lead Implementer<br>ISO/IEC 22301 Lead Implementer |
| `ISO42001-LI` | **ISO/IEC 42001 Lead Implementer - AI Management System** | PECB | Professional | ISO/IEC 42001 Lead Implementer – AI Management System |
| `CBCP` | **Certified Business Continuity Professional (CBCP)** | DRI International | Professional | Certified Business Continuity Professional (CBCP) |
| `ISA62443-CFS` | **ISA/IEC 62443 Cybersecurity Fundamentals Specialist** | ISA | Professional | ISA/IEC 62443 Cybersecurity Fundamentals Specialist<br>ISA/IEC 62443 Fundamentals |
| `COPSECP` | **Certified Operational Security Professional (COPSECP)** | OPSEC Professionals Society | Professional | Certified Operational Security Professional (COPSECP) |
| `AIP-SEC-L1` | **AI+ Security Level 1** | AI CERTs | AI | AI+ Security Level 1 |
| `AIP-SEC-L2` | **AI+ Security Level 2** | AI CERTs | AI | AI+ Security Level 2 |
| `AIP-SEC-PRAC` | **AI+ Security Practitioner** | AI CERTs | AI | AI+ Security Practitioner |
| `AIP-SEC-EXP` | **AI+ Security Expert** | AI CERTs | AI | AI+ Security Expert |
| `AIP-SEC-COMP` | **AI+ Security Compliance** | AI CERTs | AI | AI+ Security Compliance |
| `AIP-CLOUD` | **AI+ Cloud Practitioner** | AI CERTs | AI | AI+ Cloud Practitioner<br>AI+ Cloud Practitioner 4 |
| `AIP-ARCH` | **AI+ Architect Practitioner** | AI CERTs | AI | AI+ Architect Practitioner |
| `AIP-NET` | **AI+ Network Practitioner** | AI CERTs | AI | AI+ Network Practitioner |

## Observed behaviours

Scored 1–5 by the trainer on every observed day. Each one is evidence for one cross-functional competency.

| Code | Behaviour | Domain | Evidence for | What to look for |
| --- | --- | --- | --- | --- |
| `OB-01` | **Confidence / composure** | Personal Effectiveness | `LXSCN032` Presentation Delivery | Maintains a calm, credible, and steady presence when speaking or being challenged. |
| `OB-02` | **Accountability / follow-through** | Personal Effectiveness | `LXSCN206` Performance Management | Owns actions, closes loops, and stays answerable for tasks and commitments. |
| `OB-03` | **Emotional regulation** | Personal Effectiveness | `LXSCN037` Tolerance for Uncertainty | Remains composed and professional under pressure or disagreement. |
| `OB-04` | **Openness to feedback** | Personal Effectiveness | `LXSCN039` Continuous Learning | Receives input constructively and adjusts behaviour accordingly. |
| `OB-05` | **Clarity of message** | Communication | `LXSCN036` Communication | Communicates main point understandably and without confusion. |
| `OB-06` | **Structure of message** | Communication | `LXSCN032` Presentation Delivery | Uses logical flow, framing, and closure. |
| `OB-07` | **Active listening** | Communication | `LXSCN035` Relationship Building | Shows attention, paraphrases, and builds on what others say. |
| `OB-08` | **Adaptation to audience** | Communication | `LXSCN055` Stakeholder Management | Adjusts language and level of detail to the audience. |
| `OB-09` | **Conciseness** | Communication | `LXSCN036` Communication | Communicates efficiently without unnecessary detail. |
| `OB-10` | **Participation** | Collaboration | `LXSCN001` Cross-Team Integration | Contributes appropriately and consistently in group work. |
| `OB-11` | **Respectful interaction** | Collaboration | `LXSCN035` Relationship Building | Shows professionalism, respect, and constructive tone. |
| `OB-12` | **Influence in group** | Collaboration | `LXSCN008` Strategic Influence | Shapes discussion positively without overpowering others. |
| `OB-13` | **Conflict handling** | Collaboration | `LXSCN027` Team Management | Handles disagreement calmly and productively. |
| `OB-14` | **Collaboration** | Collaboration | `LXSCN001` Cross-Team Integration | Works effectively toward shared outcomes with others. |
| `OB-15` | **Problem definition** | Problem Solving | `LXSCN031` Problem Solving | Frames the actual issue before trying to solve it. |
| `OB-16` | **Logical thinking** | Problem Solving | `LXSCN034` Analytical Thinking | Explains reasoning coherently and step by step. |
| `OB-17` | **Idea generation** | Problem Solving | `LXSCN005` Strategic Thinking | Produces useful options and alternatives. |
| `OB-18` | **Decision quality** | Problem Solving | `LXSCN019` Decision Making | Makes sensible choices and explains trade-offs. |
| `OB-19` | **Initiative** | Leadership | `LXSCN020` Operational Effectiveness | Steps forward without waiting to be told. |
| `OB-20` | **Ownership** | Leadership | `LXSCN206` Performance Management | Acts as if the outcome matters personally. |
| `OB-21` | **Guiding others** | Leadership | `LXSCN027` Team Management | Helps organise, guide, or support peers effectively. |
| `OB-22` | **Presence / authority** | Leadership | `LXSCN026` Leadership | Projects grounded, credible authority that others respond to. |
| `OB-23` | **Learning speed** | Learning Agility | `LXSCN039` Continuous Learning | Improves quickly across activities and days. |
| `OB-24` | **Applies feedback** | Learning Agility | `LXSCN039` Continuous Learning | Converts feedback into visible behavioural change. |
| `OB-25` | **Reflection quality** | Learning Agility | `LXSCN034` Analytical Thinking | Can identify what worked, what did not, and what to change. |

Interpretation when a behaviour is low: *Below required standard for current role level or batch expectation.* Action: *Targeted coaching, deliberate practice, feedback follow-up, and observation in next workshop.* When high: *Possible growth, stretch assignment, mentoring exposure, or leadership-readiness signal if consistent.*

## Risk and opportunity rules

Checked on every person page, on **Risks** and in the export (sheet Risk_Flags). The logic of each rule is fixed by its code; the threshold, severity and wording are read from Library → Risk rules and can be changed there. See [RISK_RULES.md](RISK_RULES.md) for how each rule is calculated.

| Code | Rule | Severity | Panel | Condition | Threshold | Action | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `R01` | **Critical skill gap** | High | Skill Gap Risks | Any skill is this many levels or more below its required level | 2 levels | Prioritise the skill in the next development cycle and fund targeted training | Line Manager and Academy |
| `R02` | **Critical gap on a priority skill** | High | Skill Gap Risks | A priority skill (Priority = 2, the higher priority) is this many levels or more below required | 2 levels | Escalate: assign a subject-matter mentor and a fast-track plan | Line Manager and Department Head |
| `R03` | **Broad capability shortfall** | High | Skill Gap Risks | This share or more of assessed skills is below the required level | 0.4 share of skills | Agree a structured 6-month recovery plan with monthly line manager review | Line Manager |
| `R04` | **Technical readiness below target** | Medium | Capability and Behaviour Risks | Average technical gap is this many levels or more | 1 levels (average) | Focus the plan on technical certification and hands-on labs | Academy |
| `R05` | **Cross-functional readiness below target** | Medium | Capability and Behaviour Risks | Average cross-functional gap is this many levels or more | 0.5 levels (average) | Enrol in the cross-functional training programme | Academy |
| `R06` | **High-potential talent** | Opportunity | Capability and Behaviour Risks | This many skills or more above required, with no critical gap | 5 skills | Consider for stretch assignments, mentoring others and the succession pool | Department Head and Human Resources |
| `R07` | **No proficiency in a required skill** | High | Skill Gap Risks | Current level is 0 on a skill that requires level 1 or higher | 0 level | Start foundation training immediately and pair with an experienced colleague | Line Manager and Academy |
| `R08` | **Gaps in both technical and cross-functional skills** | Medium | Capability and Behaviour Risks | Average gap is above zero in both frameworks | —  | Build a balanced plan covering both areas without overloading the employee | Line Manager |
| `R09` | **Fully meets role requirements** | Opportunity | Capability and Behaviour Risks | No skill below its required level | —  | Recognise the achievement and set next-level targets for career progression | Line Manager and Human Resources |
| `R10` | **Subject-matter expert** | Opportunity | Capability and Behaviour Risks | Level 4 (maximum) on this many skills or more | 3 skills | Use as an internal trainer or mentor and run knowledge-sharing sessions | Academy |
| `R11` | **Behavioural category below expectation** | Medium | Capability and Behaviour Risks | Any Personal Efficiency Performance category averages below this score | 3 score (0 to 4) | Targeted coaching on that behavioural category | Coach |
| `R12` | **Low behaviour rating** | Low | Capability and Behaviour Risks | Any single behaviour is scored at or below this score | 2 score (0 to 4) | Address with specific examples in the next coaching session | Coach |
| `R13` | **Low programme attendance** | High | Capability and Behaviour Risks | Absent from this many Personal Efficiency Performance training days or more | 2 days (of 4) | Line manager to confirm commitment and reschedule missed days | Line Manager |
| `R14` | **Leadership and agility below expectation** | Medium | Capability and Behaviour Risks | Leadership + Agility average is below this score | 3 score (0 to 4) | Leadership development programme or shadowing a senior leader | Line Manager and Academy |
| `R15` | **Overall behavioural performance below expectation** | Medium | Capability and Behaviour Risks | Overall day average is below this score | 3 score (0 to 4) | Agree a behavioural development focus with the coach | Coach |
| `R16` | **Declining behavioural trend** | Medium | Capability and Behaviour Risks | Overall score falls by this much or more from first to last training day | 0.3 score drop | Coach to review the cause and agree corrective support | Coach |
| `R17` | **Improving behavioural trend** | Opportunity | Capability and Behaviour Risks | Overall score rises by this much or more from first to last training day | 0.3 score rise | Acknowledge the progress with the employee and line manager | Line Manager |
| `R18` | **Strong behavioural performer** | Opportunity | Capability and Behaviour Risks | Average behaviour score is at or above this score | 3.5 score (0 to 4) | Nominate as a peer coach or for team lead opportunities | Department Head |
| `R19` | **Hands-on labs not started** | High | Development Plan Risks | Labs are assigned but none has been completed | 0 labs completed | Set a monthly lab target and protected learning time | Line Manager |
| `R20` | **Hands-on labs behind plan** | Medium | Development Plan Risks | Lab completion is above zero but below this share | 0.25 share completed | Agree catch-up milestones for the rest of the cycle | Line Manager |
| `R21` | **Professional certification not defined** | Medium | Development Plan Risks | No professional certification is set in the plan | —  | Agree a role-aligned certification at the next plan review | Line Manager and Academy |
| `R22` | **Artificial intelligence certification not defined** | Medium | Development Plan Risks | No artificial intelligence certification is set in the plan | —  | Assign the appropriate artificial intelligence certification track | Academy |
| `R23` | **No coaching recorded** | High | Development Plan Risks | No coaching session recorded in the current cycle | —  | Schedule a coaching session within two weeks | Academy |
| `R24` | **Training absence** | Medium | Development Plan Risks | Any training marked Absent or Partially Attended, or status Need to be rescheduled | —  | Re-enrol in the next session and confirm availability | Line Manager |
| `R25` | **Cross-functional hours behind plan** | Low | Development Plan Risks | Attended cross-functional hours are below this share of the 35-hour plan | 0.5 share of plan | Book the remaining cross-functional courses for this cycle | Academy |
| `R26` | **Artificial intelligence certification training not attended** | Medium | Development Plan Risks | An artificial intelligence certification is assigned but the 40-hour course has not been attended | —  | Schedule the artificial intelligence certification course this cycle | Academy |
| `R27` | **Labs started but not completed** | Low | Development Plan Risks | Assigned lab content is started but not complete | —  | Set a completion date and check progress monthly | Line Manager |
| `R28` | **Repeated training absence** | High | Development Plan Risks | Absent from this many training sessions or more | 2 sessions | Line manager conversation on commitment and workload | Line Manager |
| `R29` | **No training attended this cycle** | High | Development Plan Risks | No training attended in the current cycle | —  | Agree a training schedule with the employee this month | Line Manager and Academy |
| `R30` | **Limited coaching** | Low | Development Plan Risks | Only one coaching session recorded | 1 sessions | Book a follow-up coaching session to embed the learning | Academy |
| `R31` | **Self-assessment outstanding** | Medium | Development Plan Risks | Self-Assessment is Not Done | —  | Employee to complete the self-assessment; line manager to follow up | Employee and Line Manager |
| `R32` | **Validation interview outstanding** | Medium | Development Plan Risks | Validation Interview is Not Done | —  | Schedule the validation interview | Academy |
| `R33` | **Validation report not issued** | Low | Development Plan Risks | Validation Interview Report is Not Started | —  | Issue the validation report to the employee and line manager | Academy |
| `R34` | **Team at risk** | High | Skill Gap Risks | This share or more of a line manager's team (3+ people) has a critical skill gap | 0.5 share of team | Review the team's development plan with the line manager and consider team-wide training | Department Head |
| `R35` | **Section at risk** | High | Skill Gap Risks | This share or more of a section (3+ people) has a critical skill gap | 0.5 share of section | Prioritise the section in the Academy training calendar | Division Head and Academy |
| `R36` | **Organisation-wide skill gap** | High | Skill Gap Risks | This share or more of assessed employees is below required on the same skill | 0.5 share of employees | Commission a group-wide training programme for that skill | Academy and Vice President |

## Value assumptions

Rates behind the Value & ROI page ([VALUE.md](VALUE.md)). *Basis*: Fact = sourced figure, Estimate = derived from sourced figures, Assumption = placeholder to replace with the client figure.

| Code | Assumption | Value | Unit | Basis | Source |
| --- | --- | ---: | --- | --- | --- |
| `CURRENCY` | **Display currency (units per US$)** | 1 | USD | Assumption | Amounts are entered in US$. Set the rate and the currency code (e.g. 3.6725 and AED) to show every figure in another currency. |
| `COST_LEARNING_HOUR` | **Training cost per learning hour** | 165 | US$ per hour | Fact | ATD State of the Industry 2025 (2024 data): cost per learning hour used US$165 (td.org) |
| `COACH_RATE` | **Coaching cost per hour (preparation, session and reporting)** | 150 | US$ per hour | Estimate | Coaching at about US$1,800–4,500 per employee per year (BetterUp, third-party estimate, low confidence) over roughly 12–30 coaching hours |
| `CERT_EXAM` | **Certification exam fee** | 999 | US$ per exam | Fact | GIAC exam price 2025 (giac.org/pricing) |
| `LAB_SEAT` | **Hands-on lab seat** | 2500 | US$ per person per year | Fact | Hack The Box Enterprise listed tier US$2,500 per seat per year (hackthebox.com/pricing) |
| `ASSESS_PER_PERSON` | **Assessment and readiness reporting** | 450 | US$ per person per cycle | Estimate | Quarterly Readiness Report package US$12k–20k per year for a 36-person team (research, part 6.2) |
| `PLATFORM_FEE` | **Platform and executive dashboard** | 35000 | US$ per client per year | Estimate | Executive Cyber Workforce Dashboard package US$25k–45k per year (research, part 6.2); Immersive median US$44,250 (Vendr) |
| `INCLUDE_TIME` | **Count participants' time as a cost** | 1 | 1 = yes, 0 = no | Assumption | Phillips ROI methodology counts participants' time away from work as a programme cost |
| `LOADED_SALARY` | **Loaded annual cost per employee** | 95000 | US$ per year | Assumption | Placeholder: replace with the client's average salary plus benefits for the people in scope (research, part 7 #3: salary band is not in the data model yet) |
| `WORK_HOURS` | **Working hours per year** | 1720 | hours | Assumption | Standard full-time year net of leave |
| `COMPETENCE_VALUE` | **Value of full role competence (share of loaded cost)** | 1 | share (1 = 100%) | Assumption | Competency-based utility analysis (Phillips): one percentage point of role readiness is worth one percent of the role's loaded cost per year |
| `HIRE_COST` | **External hire or replacement cost per role** | 28500 | US$ per hire | Assumption | Placeholder: about 30% of the loaded cost (agency fee, vacancy and ramp-up). Replace with the client's cost per hire (research, part 7 #11) |
| `INTERNAL_FILL` | **Share of ready people who fill a role internally within 12 months** | 0.5 | share | Assumption | Placeholder: confirm with the client's succession plan |
| `ATTRITION` | **Baseline annual attrition** | 0.15 | share per year | Assumption | Placeholder: replace with the client's attrition for these roles (HRIS) |
| `ATTRITION_CUT` | **Attrition reduction for programme participants** | 0.2 | relative share | Assumption | LinkedIn Workplace Learning Report 2025: learning is the #1 retention strategy (qualitative); no published effect size. Replace with measured retention once 12 months of data exist (KPI K032) |
| `ATTRIBUTION` | **Share of improvement attributed to the programme** | 0.5 | share | Assumption | Phillips ROI isolation step: credit the programme with only part of the measured change |
| `CONFIDENCE` | **Confidence in the estimates** | 0.8 | share | Assumption | Phillips ROI confidence adjustment |

## KPI catalogue

205 KPIs from the market research, stored in `server/seed/library/kpiCatalogue.json`. *Available* is the research's own assessment of the data model; the Value page calculates every one it can.

| Audience | KPIs | Available today | Partly | Not yet |
| --- | ---: | ---: | ---: | ---: |
| Board/CEO | 11 | 5 | 4 | 2 |
| CISO | 17 | 3 | 2 | 12 |
| CHRO | 12 | 6 | 3 | 3 |
| L&D | 20 | 15 | 1 | 4 |
| CFO | 8 | 0 | 1 | 7 |
| Compliance | 16 | 5 | 11 | 0 |
| Line manager | 9 | 9 | 0 | 0 |
| Individual | 8 | 8 | 0 | 0 |
| Coach/consultant (internal) | 10 | 7 | 1 | 2 |
| Programme/account | 8 | 6 | 1 | 1 |
| Assessment quality | 7 | 6 | 1 | 0 |
| Predictive | 10 | 6 | 3 | 1 |
| Department - SOC | 3 | 0 | 3 | 0 |
| Department - Threat intelligence | 3 | 0 | 3 | 0 |
| Department - Incident response | 3 | 0 | 3 | 0 |
| Department - AppSec/DevSecOps | 3 | 0 | 3 | 0 |
| Department - Red team/Offensive | 3 | 0 | 3 | 0 |
| Department - Cloud & infra security | 3 | 0 | 3 | 0 |
| Department - OT/ICS security | 3 | 0 | 3 | 0 |
| Department - IAM | 3 | 0 | 3 | 0 |
| Department - GRC | 3 | 0 | 3 | 0 |
| Department - Business continuity | 3 | 0 | 3 | 0 |
| Department - Security architecture | 3 | 0 | 3 | 0 |
| Department - Security awareness | 3 | 0 | 3 | 0 |
| Department - Security leadership | 3 | 0 | 3 | 0 |
| Department - IT operations | 3 | 0 | 3 | 0 |
| Department - Engineering | 3 | 0 | 3 | 0 |
| Department - Data | 3 | 0 | 3 | 0 |
| Department - Finance | 3 | 0 | 3 | 0 |
| Department - HR | 3 | 0 | 3 | 0 |
| Department - Sales | 3 | 0 | 3 | 0 |
| Department - Customer service | 3 | 0 | 3 | 0 |
| Department - Supply chain | 3 | 0 | 3 | 0 |
| Department - Manufacturing | 3 | 0 | 3 | 0 |
| Department - Legal | 3 | 0 | 3 | 0 |

<details><summary>All KPIs</summary>

| ID | KPI | Audience | Formula | Available |
| --- | --- | --- | --- | --- |
| K001 | Overall role readiness % | Board/CEO | weighted avg role readiness % (H3/M2/L1) across employees | Yes |
| K002 | Critical gap exposure | Board/CEO | count(ratings where priority=H and level<required) | Yes |
| K003 | Bench strength ratio | Board/CEO | ready-now+ready-6-12m successors / critical roles | Partly |
| K004 | Succession coverage % | Board/CEO | critical roles with >=1 successor readiness>=80% / critical roles | Partly |
| K005 | Key-person risk count | Board/CEO | count(competencies where #employees at >=required level <=1) | Yes |
| K006 | Return on development spend | Board/CEO | (monetised benefit - cost)/cost (Phillips) | No |
| K007 | Compliance training status | Board/CEO | mandatory completions in-date / required | Partly |
| K008 | Net readiness change per cycle | Board/CEO | readiness_end - readiness_baseline | Yes |
| K009 | Capability vs threat alignment | Board/CEO | share of threat-mapped competencies at required level | No |
| K010 | Workforce risk index | Board/CEO | weighted(critical gaps, SPOF, expiry, attrition risk) | Partly |
| K011 | NICE work-role coverage % | CISO | work roles with >=1 qualified person / roles needed | No |
| K012 | ECSF profile coverage % | CISO | profiles with qualified person / profiles needed | No |
| K013 | Critical-skill coverage per shift | CISO | shifts with >=1 qualified per critical skill / shifts | No |
| K014 | SPOF competencies (cyber) | CISO | as Key-person risk, scoped to security | Yes |
| K015 | IR readiness score | CISO | avg readiness of IR roles on IR competencies x exercise pass | Partly |
| K016 | Certification coverage % | CISO | valid required certs / required certs | Partly |
| K017 | Certification expiry risk (90d) | CISO | count(expiry within 90 days) | Yes |
| K018 | Skills uplift vs MTTD | CISO | corr(readiness change, MTTD change) | No |
| K019 | Skills uplift vs MTTR | CISO | corr(readiness change, MTTR change) | No |
| K020 | Escalation accuracy uplift | CISO | false-escalation rate before vs after | No |
| K021 | Phishing click rate vs training | CISO | clicks/simulated emails | No |
| K022 | Audit findings related to competence | CISO | count(findings tagged competence) | No |
| K023 | Vuln remediation time vs AppSec skill | CISO | corr(AppSec readiness, mean remediation days) | No |
| K024 | MSSP dependency index | CISO | MSSP-covered competencies / required competencies | No |
| K025 | Hire vs upskill cost ratio | CISO | cost to upskill to ready / cost to hire | No |
| K026 | Exercise pass rate | CISO | passed exercises / exercises | No |
| K027 | Internal mobility rate | CHRO | internal moves / headcount | No |
| K028 | Promotion readiness count | CHRO | count(next-role readiness>=80%) | Yes |
| K029 | Time-to-readiness (actual) | CHRO | median(date ready - enrol date) | Yes |
| K030 | HiPo share (observation) | CHRO | count(potential=high)/observed | Yes |
| K031 | Retention risk flag | CHRO | rule: at-risk notes + overdue plan + low progress | Partly |
| K032 | Retention of programme participants | CHRO | participants still employed 12m / participants | No |
| K033 | Development access equity | CHRO | training hours per head by group / overall | No |
| K034 | Succession pipeline depth | CHRO | count(successors by band) | Partly |
| K035 | Flight risk among key persons | CHRO | SPOF persons with retention flag | Partly |
| K036 | Engagement proxy | CHRO | weighted(attendance%, plan progress, coaching attendance) | Yes |
| K037 | Career path clarity % | CHRO | employees with next role + IDP / employees | Yes |
| K038 | 9-box distribution | CHRO | count by readiness x potential | Yes |
| K039 | Kirkpatrick L1 reaction score | L&D | avg post-course rating | No |
| K040 | Kirkpatrick L2 learning gain | L&D | post score - pre score | Partly |
| K041 | Kirkpatrick L3 behaviour change | L&D | obs score trend + manager validation trend after course | Yes |
| K042 | Kirkpatrick L4 results | L&D | ops KPI delta for trained teams | No |
| K043 | Phillips ROI % | L&D | (benefit-cost)/cost*100 | No |
| K044 | Competency lift per training hour | L&D | Δlevel / training hours | Yes |
| K045 | Cost per competency point | L&D | cost / Σ level gained | No |
| K046 | Training completion rate | L&D | completed/enrolled | Yes |
| K047 | Attendance rate | L&D | avg attendance % | Yes |
| K048 | No-show rate | L&D | no-shows/registered | Yes |
| K049 | Course effectiveness index | L&D | avg Δlevel on linked competencies for attendees vs non-attendees | Yes |
| K050 | Trainer effectiveness | L&D | avg Δlevel by trainer | Yes |
| K051 | Observation trajectory slope | L&D | slope of obs score vs day | Yes |
| K052 | Training hours per employee | L&D | Σ hours / headcount | Yes |
| K053 | Plan adherence % | L&D | actions completed by planned date / due actions | Yes |
| K054 | Overdue action count | L&D | count(status<>done and planned<today) | Yes |
| K055 | Blended mix ratio | L&D | hours by action type / total | Yes |
| K056 | Learning plan segment progress S1-S5 | L&D | segments completed / 5 | Yes |
| K057 | Cost per participant | CFO | total cost / participants | No |
| K058 | Cost per readiness point | CFO | cost / Σ readiness pp gained | No |
| K059 | Cost avoided via internal fill | CFO | internal fills * (external hire cost - upskill cost) | No |
| K060 | Contractor/MSSP spend avoided | CFO | Σ replaced external days * rate | No |
| K061 | Budget utilisation % | CFO | spent / budget | No |
| K062 | Spend per employee vs benchmark | CFO | spend per head / benchmark | No |
| K063 | Cost per learning hour | CFO | cost / hours | Partly |
| K064 | Certification spend per pass | CFO | cert cost / passes | No |
| K065 | Audit evidence pack completeness - ISO 27001 cl.7.2 | Compliance | in-scope persons with complete verified evidence / in-scope persons | Partly |
| K066 | Audit evidence pack completeness - NIS2 Art.20/21 | Compliance | in-scope persons with complete verified evidence / in-scope persons | Partly |
| K067 | Audit evidence pack completeness - DORA Art.13(6) | Compliance | in-scope persons with complete verified evidence / in-scope persons | Partly |
| K068 | Audit evidence pack completeness - PCI DSS 12.6 | Compliance | in-scope persons with complete verified evidence / in-scope persons | Partly |
| K069 | Audit evidence pack completeness - SOC 2 CC1.4 | Compliance | in-scope persons with complete verified evidence / in-scope persons | Partly |
| K070 | Audit evidence pack completeness - NERC CIP-004 | Compliance | in-scope persons with complete verified evidence / in-scope persons | Partly |
| K071 | Audit evidence pack completeness - HIPAA 164.308(a)(5) | Compliance | in-scope persons with complete verified evidence / in-scope persons | Partly |
| K072 | Audit evidence pack completeness - GDPR Art.39 | Compliance | in-scope persons with complete verified evidence / in-scope persons | Partly |
| K073 | Audit evidence pack completeness - EU AI Act Art.4 | Compliance | in-scope persons with complete verified evidence / in-scope persons | Partly |
| K074 | Audit evidence pack completeness - UAE IA / NCA ECC | Compliance | in-scope persons with complete verified evidence / in-scope persons | Partly |
| K075 | Evidence completeness % | Compliance | ratings with >=1 evidence / ratings | Yes |
| K076 | Evidence verified % | Compliance | verified/total evidence | Yes |
| K077 | Mandatory training in-date % | Compliance | in-date/required | Partly |
| K078 | Cert validity % | Compliance | valid/held | Yes |
| K079 | Audit trail coverage | Compliance | rows with audit trail / rows | Yes |
| K080 | Evidence age | Compliance | median days since evidence date | Yes |
| K081 | Team gap heatmap | Line manager | matrix person x competency of (required-level) | Yes |
| K082 | Stretch candidates | Line manager | readiness>=90% current role and next-role >=60% | Yes |
| K083 | Validation workload | Line manager | count(pending manager validations) | Yes |
| K084 | Monthly validated progress | Line manager | avg validation score per month | Yes |
| K085 | Manager vs assessor agreement | Line manager | % ratings within ±0 levels manager vs consultant | Yes |
| K086 | Rejected / needs-evidence rate | Line manager | rejected+needs evidence / validations | Yes |
| K087 | Team readiness trend | Line manager | team avg readiness over time | Yes |
| K088 | Coaching participation | Line manager | sessions held/planned | Yes |
| K089 | My role readiness % | Individual | weighted readiness | Yes |
| K090 | My next-role readiness % | Individual | next-role readiness | Yes |
| K091 | My development velocity | Individual | Δlevels per month | Yes |
| K092 | My plan progress | Individual | avg progress % | Yes |
| K093 | My certifications timeline | Individual | list | Yes |
| K094 | My coaching history | Individual | sessions, actions | Yes |
| K095 | My top strengths | Individual | competencies level>required | Yes |
| K096 | My self vs validated calibration | Individual | avg(self-validated) | Yes |
| K097 | Coach effort hours | Coach/consultant (internal) | Σ prep+session+report minutes/60 | Yes |
| K098 | Minutes per competency point | Coach/consultant (internal) | coaching minutes / Δlevels of coachees | Yes |
| K099 | Coaching cost per point | Coach/consultant (internal) | minutes*rate / Δlevels | No |
| K100 | Coach effectiveness | Coach/consultant (internal) | avg readiness Δ of coachees | Yes |
| K101 | Coaching cadence adherence | Coach/consultant (internal) | sessions within planned interval / sessions | Yes |
| K102 | Prep/report to session ratio | Coach/consultant (internal) | (prep+report)/session minutes | Yes |
| K103 | Staff utilisation | Coach/consultant (internal) | billable hours / available | No |
| K104 | Data quality score | Coach/consultant (internal) | non-null required fields / required | Yes |
| K105 | Data timeliness | Coach/consultant (internal) | median days event->entry | Yes |
| K106 | Enrolment funnel | Programme/account | nominated>enrolled>assessed>plan>active>completed | Yes |
| K107 | Programme progress vs plan | Programme/account | actual milestones / planned | Yes |
| K108 | Cohort comparison | Programme/account | readiness Δ by batch | Yes |
| K109 | Baseline vs re-assessment uplift | Programme/account | avg(level_re - level_base) | Yes |
| K110 | % moving up a readiness band | Programme/account | persons with band up / persons | Yes |
| K111 | Renewal health score | Programme/account | weighted(uplift, engagement, exec views, NPS) | Partly |
| K112 | Sponsor report engagement | Programme/account | report views by sponsor | No |
| K113 | Gap closure rate | Programme/account | gaps closed / baseline gaps | Yes |
| K114 | Over/under-confidence index | Assessment quality | avg(self - validated) per person/competency | Yes |
| K115 | Inter-rater reliability | Assessment quality | Cohen's kappa / ICC between raters | Yes |
| K116 | Rating distribution | Assessment quality | histogram of levels | Yes |
| K117 | Assessment coverage % | Assessment quality | rated required / required | Yes |
| K118 | Assessment recency | Assessment quality | median days since last rating | Yes |
| K119 | 360 response rate | Assessment quality | responses/invites | Partly |
| K120 | Technical test vs rating gap | Assessment quality | avg(test-derived level - rated level) | Yes |
| K121 | Time-to-ready forecast | Predictive | extrapolate velocity to target | Yes |
| K122 | Probability of target by date | Predictive | survival/logistic model | Yes |
| K123 | At-risk learners | Predictive | rule/model: low velocity + overdue + at-risk notes | Yes |
| K124 | Next best development action | Predictive | rank actions by expected Δ on largest weighted gap | Yes |
| K125 | Skills supply vs demand forecast | Predictive | projected qualified headcount vs demand | No |
| K126 | Scenario: attrition of key persons | Predictive | recompute coverage without person | Yes |
| K127 | Skills half-life tracker | Predictive | time until competency rating drops/obsolete | Partly |
| K128 | Peer benchmark percentile | Predictive | client score percentile among anonymised clients | Partly |
| K129 | AI-skill readiness | Predictive | readiness on AI competencies | Partly |
| K130 | Cloud-security readiness | Predictive | readiness on cloud competencies | Yes |
| K131 | SOC: Alert triage accuracy | Department - SOC | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K132 | SOC: Detection engineering coverage | Department - SOC | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K133 | SOC: Shift skill coverage | Department - SOC | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K134 | Threat intelligence: Intel requirement coverage | Department - Threat intelligence | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K135 | Threat intelligence: Analytic writing quality | Department - Threat intelligence | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K136 | Threat intelligence: ATT&CK mapping proficiency | Department - Threat intelligence | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K137 | Incident response: IR playbook proficiency | Department - Incident response | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K138 | Incident response: Tabletop pass rate | Department - Incident response | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K139 | Incident response: Forensics coverage | Department - Incident response | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K140 | AppSec/DevSecOps: Secure coding proficiency | Department - AppSec/DevSecOps | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K141 | AppSec/DevSecOps: Developer AppSec training coverage | Department - AppSec/DevSecOps | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K142 | AppSec/DevSecOps: Vuln reintroduction rate | Department - AppSec/DevSecOps | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K143 | Red team/Offensive: Offensive skill depth | Department - Red team/Offensive | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K144 | Red team/Offensive: Exercise objective success | Department - Red team/Offensive | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K145 | Red team/Offensive: Cert coverage (OSCP/GPEN) | Department - Red team/Offensive | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K146 | Cloud & infra security: Cloud platform coverage | Department - Cloud & infra security | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K147 | Cloud & infra security: IaC security proficiency | Department - Cloud & infra security | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K148 | Cloud & infra security: Misconfig remediation time | Department - Cloud & infra security | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K149 | OT/ICS security: OT protocol proficiency | Department - OT/ICS security | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K150 | OT/ICS security: IEC 62443 competence coverage | Department - OT/ICS security | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K151 | OT/ICS security: OT incident drill readiness | Department - OT/ICS security | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K152 | IAM: IAM platform proficiency | Department - IAM | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K153 | IAM: Access review quality | Department - IAM | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K154 | IAM: PAM skill coverage | Department - IAM | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K155 | GRC: Framework expertise coverage | Department - GRC | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K156 | GRC: Audit finding closure | Department - GRC | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K157 | GRC: Risk assessment proficiency | Department - GRC | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K158 | Business continuity: BCP exercise participation | Department - Business continuity | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K159 | Business continuity: Crisis role coverage | Department - Business continuity | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K160 | Business continuity: BIA proficiency | Department - Business continuity | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K161 | Security architecture: Architecture review proficiency | Department - Security architecture | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K162 | Security architecture: Zero-trust skill coverage | Department - Security architecture | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K163 | Security architecture: Design review throughput | Department - Security architecture | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K164 | Security awareness: Phish-prone % trend | Department - Security awareness | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K165 | Security awareness: Awareness completion | Department - Security awareness | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K166 | Security awareness: Report rate of simulations | Department - Security awareness | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K167 | Security leadership: Leadership competency readiness | Department - Security leadership | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K168 | Security leadership: Board communication skill | Department - Security leadership | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K169 | Security leadership: Successor readiness CISO | Department - Security leadership | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K170 | IT operations: Platform certification coverage | Department - IT operations | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K171 | IT operations: Change success vs skill | Department - IT operations | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K172 | IT operations: On-call skill coverage | Department - IT operations | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K173 | Engineering: Tech stack proficiency | Department - Engineering | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K174 | Engineering: Code review skill coverage | Department - Engineering | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K175 | Engineering: Onboarding time-to-productivity | Department - Engineering | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K176 | Data: Data tool proficiency | Department - Data | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K177 | Data: Data governance competence | Department - Data | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K178 | Data: ML ops coverage | Department - Data | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K179 | Finance: Regulatory finance competence | Department - Finance | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K180 | Finance: Systems proficiency (ERP) | Department - Finance | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K181 | Finance: Controls training in-date | Department - Finance | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K182 | HR: HR analytics competence | Department - HR | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K183 | HR: Employment law training in-date | Department - HR | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K184 | HR: HRIS proficiency | Department - HR | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K185 | Sales: Product knowledge certification | Department - Sales | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K186 | Sales: Sales methodology proficiency | Department - Sales | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K187 | Sales: Ramp time | Department - Sales | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K188 | Customer service: Product knowledge score | Department - Customer service | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K189 | Customer service: QA score vs competence | Department - Customer service | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K190 | Customer service: Time to proficiency new agents | Department - Customer service | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K191 | Supply chain: Planning tool proficiency | Department - Supply chain | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K192 | Supply chain: Supplier risk competence | Department - Supply chain | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K193 | Supply chain: Cross-skilling ratio | Department - Supply chain | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K194 | Manufacturing: Skills matrix coverage per line | Department - Manufacturing | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K195 | Manufacturing: Operator qualification in-date | Department - Manufacturing | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K196 | Manufacturing: Cross-training index | Department - Manufacturing | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K197 | Legal: Regulatory knowledge coverage | Department - Legal | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K198 | Legal: Contract tool proficiency | Department - Legal | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K199 | Legal: Privacy law training in-date | Department - Legal | share of people/roles at required level for the relevant competencies (or metric delta where operational) | Partly |
| K200 | Readiness band distribution | Board/CEO | count by band (Ready/6-12m/Growing/Needs support) | Yes |
| K201 | Exceeds-role competency count | Line manager | count(level>required) | Yes |
| K202 | Training-to-need match % | L&D | training hours on gap competencies / total hours | Yes |
| K203 | Certification pass rate | CISO | first-attempt passes / attempts | Yes |
| K204 | Coaching action completion | Coach/consultant (internal) | action items closed / raised | Partly |
| K205 | Observed behaviour average by competency | L&D | avg obs score per behaviour | Yes |

</details>

## Starter library (demos only)

`npm run db:demo` and `npm run db:coca-cola` also load the small starter library in `server/seed/starter-library.ts` (two frameworks, invented competencies with codes like `COM-01`, starter roles such as `SOC-T1`) because the demo people were built on it. A database for real client work only needs `npm run db:seed`.
