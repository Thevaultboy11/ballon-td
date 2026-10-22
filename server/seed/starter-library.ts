// The preloaded reference library. `npm run db:seed` loads it; it is safe to run again
// (existing rows are matched by code and updated, nothing is deleted).
//
// Sources:
//  • The 16 leadership competencies and the 25 observed behaviours come from the client's
//    existing workbooks (the "Training Day Scores" headers: "Behaviour | Competency").
//  • The technical competencies, course types, statuses and evidence/coaching/IDP types come
//    from the Master Data Dictionary.
//  • Descriptions and level indicators are STARTER TEXT written to be realistic; replace them
//    with the client's framework wording on Library → Competencies when it is available.

export type Seniority = 'Entry' | 'Mid' | 'Senior' | 'Lead' | 'Manager' | 'Head' | 'Executive'

export const FRAMEWORKS = [
  { code: 'LEAD', name: 'Leadership & Behavioural Framework', scaleMin: 1, scaleMax: 5,
    description: 'How people communicate, lead, think, learn and deliver. Scale 1–5.' },
  { code: 'TECH', name: 'Technical Cyber Security Framework', scaleMin: 0, scaleMax: 5,
    description: 'Hands-on cyber security capability. Scale 0–5, where 0 means no exposure yet.' },
]

export const CATEGORIES = [
  { code: 'COM', framework: 'LEAD', name: 'Communication & Influence' },
  { code: 'LEA', framework: 'LEAD', name: 'Leadership & People' },
  { code: 'THK', framework: 'LEAD', name: 'Thinking & Decisions' },
  { code: 'LRN', framework: 'LEAD', name: 'Learning & Adaptability' },
  { code: 'DEL', framework: 'LEAD', name: 'Delivery & Ownership' },
  { code: 'GRC', framework: 'TECH', name: 'Governance, Risk & Compliance' },
  { code: 'CTI', framework: 'TECH', name: 'Threat Intelligence' },
  { code: 'SOC', framework: 'TECH', name: 'Security Operations & Incident Response' },
  { code: 'BCM', framework: 'TECH', name: 'Business Continuity & Resilience' },
  { code: 'INF', framework: 'TECH', name: 'Infrastructure & Cloud Security' },
  { code: 'APP', framework: 'TECH', name: 'Application Security' },
]

// [code, name, description, behaviour phrase (base verb form, used for the level indicators), how it is assessed]
type C = [string, string, string, string, string]

export const COMPETENCIES: C[] = [
  // ------------------------------------------------ Leadership & Behavioural (from the client's workbook)
  ['COM-01', 'Communication', 'Shares information clearly and concisely, in writing and in person, so others understand and can act.',
    'explain technical issues clearly and concisely to any audience', 'Written updates and reports, day-to-day communication, observed group work.'],
  ['COM-02', 'Presentation Delivery', 'Delivers well-structured presentations and briefings with confidence and composure.',
    'deliver structured briefings with confidence and handle questions with composure', 'Briefings, demos and the presentation exercises in leadership programmes.'],
  ['COM-03', 'Stakeholder Management', 'Builds trust with people outside the team and keeps them informed and aligned.',
    'keep the right stakeholders informed and adapt the message to each of them', 'Incident briefings, project updates and cross-team meetings.'],
  ['COM-04', 'Strategic Influence', 'Gains support for ideas and decisions across the organisation without relying on formal authority.',
    'build support for proposals and influence decisions without formal authority', 'Proposals, steering discussions, observed group exercises.'],
  ['COM-05', 'Relationship Building', 'Listens actively and builds respectful, lasting working relationships.',
    'build trust through active listening and respectful interaction', 'Peer feedback and observed group work.'],
  ['COM-06', 'Negotiation', 'Reaches agreements that protect security outcomes while keeping relationships intact.',
    'negotiate workable agreements on scope, risk and resources', 'Vendor and project discussions, role plays.'],
  ['COM-07', 'Facilitation', 'Runs meetings and workshops that reach clear outcomes and involve everyone.',
    'run meetings and workshops that reach clear, agreed outcomes', 'Workshops and meetings led, participant feedback.'],
  ['LEA-01', 'Leadership', 'Sets direction, acts as a role model and takes charge when situations escalate.',
    'set direction, act as a visible role model and take charge when situations escalate', 'Interviews, leadership programmes, incident behaviour.'],
  ['LEA-02', 'Team Management', 'Organises the team\'s work, develops people and handles conflict constructively.',
    'organise the team\'s work fairly and resolve conflict constructively', 'Team feedback, interviews, observed group work.'],
  ['LEA-03', 'Performance Management', 'Sets clear goals, follows through on commitments and gives useful feedback.',
    'set clear goals, follow through on commitments and give specific feedback', 'Goal records, one-to-ones, follow-through on actions.'],
  ['LEA-04', 'Cross-Team Integration', 'Works effectively with other teams and shares information and resources across boundaries.',
    'work effectively with other teams and share information across boundaries', 'Joint projects, exercises and cross-functional rotations.'],
  ['LEA-05', 'Coaching & Mentoring', 'Develops others through coaching conversations, mentoring and knowledge sharing.',
    'develop others through coaching, mentoring and knowledge sharing', 'Mentee feedback, coaching logs, team growth.'],
  ['LEA-06', 'Change Management', 'Leads people through change so new ways of working stick.',
    'plan and lead change so that new ways of working are adopted', 'Change initiatives led, adoption results.'],
  ['THK-01', 'Analytical Thinking', 'Breaks complex problems into parts, reasons logically and reflects on outcomes.',
    'break complex problems into logical parts and reflect on outcomes', 'Investigations, case exercises and post-incident reviews.'],
  ['THK-02', 'Problem Solving', 'Defines the real problem, finds root causes and works out practical solutions.',
    'define the real problem, find root causes and work out practical solutions', 'Troubleshooting, root cause analyses and case exercises.'],
  ['THK-03', 'Strategic Thinking', 'Connects daily work to long-term goals and generates new ideas.',
    'connect daily work to long-term security goals and generate new ideas', 'Roadmaps, proposals, scenario exercises.'],
  ['THK-04', 'Decision Making', 'Makes sound, timely decisions by weighing risks and trade-offs.',
    'make sound, timely decisions by weighing risks and trade-offs', 'Incident decisions, prioritisation and scenario exercises.'],
  ['THK-05', 'Critical Thinking', 'Questions assumptions and evaluates information before accepting it.',
    'question assumptions and test information before relying on it', 'Reviews of analyses and reports, case discussions.'],
  ['THK-06', 'Systems Thinking', 'Sees how people, processes and technology interact and anticipates knock-on effects.',
    'see how people, processes and technology interact and anticipate knock-on effects', 'Architecture and process reviews, scenario exercises.'],
  ['LRN-01', 'Continuous Learning', 'Seeks feedback and new knowledge, learns quickly and applies what is learned.',
    'seek feedback and new knowledge and apply what they learn quickly', 'Learning activity, certification progress, response to feedback.'],
  ['LRN-02', 'Tolerance for Uncertainty', 'Stays calm and effective under pressure and when information is incomplete.',
    'stay calm and effective under pressure and with incomplete information', 'Behaviour during incidents, exercises and change.'],
  ['LRN-03', 'Adaptability', 'Adjusts plans, priorities and approach when circumstances change.',
    'adjust plans and approach quickly when circumstances change', 'Behaviour during change and reprioritisation.'],
  ['LRN-04', 'Innovation', 'Proposes and tests better ways of working and continuously improves processes.',
    'propose, test and adopt better ways of working', 'Improvement ideas implemented, automation and process changes.'],
  ['DEL-01', 'Operational Effectiveness', 'Takes initiative and delivers work on time and to standard.',
    'take initiative and deliver work on time and to standard', 'Delivery records, ticket data and manager feedback.'],
  ['DEL-02', 'Planning & Organisation', 'Plans work, manages time and keeps several priorities under control.',
    'plan work, manage time and keep several priorities under control', 'Plans, deadlines met, workload management.'],
  ['DEL-03', 'Attention to Detail', 'Produces accurate, complete work and spots errors others miss.',
    'produce accurate, complete work and catch errors before they matter', 'Quality of reports, configurations and evidence.'],

  // ------------------------------------------------ Technical (from the Master Data Dictionary)
  ['GRC-01', 'Security & Risk Governance', 'Sets up the structures, roles and reporting that steer security and risk.',
    'set up and run security and risk governance structures and reporting', 'Governance documents, committee reporting, interviews.'],
  ['GRC-02', 'Risk Assessment', 'Identifies, rates and communicates security risk in business terms.',
    'identify, rate and communicate security risks in business terms', 'Risk assessments delivered and the quality of risk reporting.'],
  ['GRC-03', 'Risk Treatment Planning', 'Chooses and tracks treatments that bring risk within appetite.',
    'choose and track risk treatments that bring risk within appetite', 'Treatment plans, risk register quality.'],
  ['GRC-04', 'Compliance Management', 'Maps controls to laws, regulations and standards and evidences them.',
    'map controls to regulatory requirements and maintain compliance evidence', 'Control mappings, audit outcomes and evidence quality.'],
  ['GRC-05', 'Internal Auditing', 'Plans and performs security audits and reports findings that get fixed.',
    'plan and run security audits and report findings that lead to action', 'Audits completed, quality of findings.'],
  ['GRC-06', 'Policy & Standards Development', 'Writes security policies and standards that people can follow.',
    'write and maintain security policies and standards people can follow', 'Policies and standards authored and adopted.'],
  ['GRC-07', 'Control Frameworks', 'Applies frameworks such as ISO 27001, NIST CSF and CIS Controls.',
    'apply control frameworks such as ISO 27001, NIST CSF and CIS', 'Framework implementations, gap assessments.'],
  ['GRC-08', 'Security Awareness', 'Designs and runs awareness activities that change behaviour.',
    'design and run awareness activities that measurably change behaviour', 'Campaign results, phishing metrics.'],
  ['CTI-01', 'Threat Intelligence Lifecycle', 'Runs the intelligence cycle from requirements to dissemination and feedback.',
    'run the intelligence cycle from requirements to dissemination', 'Intelligence requirements and products delivered.'],
  ['CTI-02', 'Threat Actor Profiling', 'Profiles adversaries, their motives and techniques.',
    'profile threat actors and map their techniques to MITRE ATT&CK', 'Actor profiles and ATT&CK mappings.'],
  ['CTI-03', 'Threat Reporting', 'Writes intelligence reports that decision makers act on.',
    'write threat reports that decision makers can act on', 'Reports produced and their use.'],
  ['CTI-04', 'Open Source Intelligence', 'Collects and verifies information from open sources safely.',
    'collect and verify open-source intelligence safely and legally', 'OSINT investigations, lab work.'],
  ['CTI-05', 'Attack Path Analysis', 'Works out how an attacker could move from entry point to critical assets.',
    'work out realistic attack paths to critical assets', 'Attack path analyses, purple-team exercises.'],
  ['CTI-06', 'Threat Modelling', 'Identifies threats to a system early and designs mitigations.',
    'identify threats to a system early and design mitigations', 'Threat models produced, design reviews.'],
  ['CTI-07', 'Indicators of Compromise Analysis', 'Analyses and enriches indicators and turns them into detections.',
    'analyse and enrich indicators of compromise and turn them into detections', 'IOC analyses, detection content created.'],
  ['CTI-08', 'Threat Hunting', 'Searches proactively for attackers who evaded existing detection.',
    'hunt proactively for threats that evaded existing detection', 'Hunts run, findings and new detections.'],
  ['SOC-01', 'Security Monitoring & Detection', 'Builds, tunes and runs detection to spot malicious activity early.',
    'build and tune detection rules and triage alerts accurately', 'Detection rules authored, alert quality and lab exercises.'],
  ['SOC-02', 'Incident Response', 'Contains, eradicates and recovers from incidents using sound playbooks.',
    'contain and remediate security incidents using sound playbooks', 'Incident records, tabletop exercises and simulations.'],
  ['SOC-03', 'Digital Forensics', 'Collects and analyses digital evidence to reconstruct what happened.',
    'collect and analyse digital evidence to reconstruct attacker activity', 'Forensic case work and practical labs.'],
  ['SOC-04', 'Malware Analysis', 'Analyses malicious files to understand behaviour and extract indicators.',
    'analyse malicious files and extract useful indicators', 'Malware analyses, lab results.'],
  ['BCM-01', 'Business Continuity Planning', 'Writes and maintains plans that keep critical services running.',
    'write and maintain continuity plans for critical services', 'Plans produced and tested.'],
  ['BCM-02', 'Business Impact Analysis', 'Works out which services matter most and how long they can be down.',
    'run business impact analyses and set recovery objectives', 'BIAs completed, RTO/RPO quality.'],
  ['BCM-03', 'Disaster Recovery', 'Plans and tests the technical recovery of systems and data.',
    'plan and test the technical recovery of systems and data', 'DR plans and test results.'],
  ['BCM-04', 'Operational Resilience', 'Keeps important business services within impact tolerances.',
    'keep important business services within agreed impact tolerances', 'Resilience assessments, DORA/NIS2 work.'],
  ['BCM-05', 'Scenario Testing & Exercises', 'Designs and runs exercises that test plans and people.',
    'design and run realistic exercises that test plans and people', 'Exercises run, lessons learned.'],
  ['BCM-06', 'Backup & Recovery', 'Makes sure data can be restored quickly and safely.',
    'make sure data can be restored quickly, safely and completely', 'Backup coverage, restore tests.'],
  ['BCM-07', 'Dependency Mapping', 'Maps the people, suppliers and systems a service depends on.',
    'map the people, suppliers and systems a service depends on', 'Dependency maps and their accuracy.'],
  ['INF-01', 'Network Security', 'Designs and operates secure networks, segmentation and access rules.',
    'design and review secure network segmentation and access rules', 'Design reviews, rule audits and lab work.'],
  ['INF-02', 'Cloud Security', 'Secures cloud workloads, configurations and identities.',
    'secure cloud workloads and fix cloud misconfigurations', 'Posture findings, architecture reviews and labs.'],
  ['INF-03', 'System Hardening', 'Hardens servers and platforms against common attacks.',
    'harden servers and platforms against common attacks', 'Hardening baselines and audit results.'],
  ['INF-04', 'Endpoint Security', 'Protects devices with endpoint protection and hardening.',
    'deploy and tune endpoint protection on devices', 'EDR coverage, hardening baselines and incident data.'],
  ['INF-05', 'Identity Management', 'Manages the identity lifecycle from joiner to leaver.',
    'manage the identity lifecycle from joiner to leaver', 'Identity processes, access review results.'],
  ['INF-06', 'Access Control', 'Designs strong authentication, privileged access and least-privilege controls.',
    'design strong authentication and least-privilege access controls', 'Access designs, PAM coverage.'],
  ['INF-07', 'Certificate & Key Management', 'Manages certificates, keys and secrets so they stay valid and protected.',
    'manage certificates, keys and secrets so they stay valid and protected', 'Inventory quality, expiry incidents.'],
  ['INF-08', 'Patch & Vulnerability Management', 'Finds, prioritises and tracks vulnerabilities through to remediation.',
    'prioritise vulnerabilities by real risk and track them to closure', 'Scan coverage, remediation times and prioritisation quality.'],
  ['INF-09', 'Security Architecture', 'Designs secure systems and reviews designs against security principles.',
    'design secure architectures and review designs against security principles', 'Architecture decisions and design reviews.'],
  ['APP-01', 'Application Security Review', 'Reviews applications and code for security flaws.',
    'review applications and code for security flaws', 'Reviews completed, findings quality.'],
  ['APP-02', 'Secure Development', 'Builds security into software design, code and delivery.',
    'build security into software design, code and delivery', 'Code reviews, secure design records.'],
  ['APP-03', 'API Security', 'Designs and tests APIs against authentication, authorisation and abuse flaws.',
    'design and test APIs against authentication and authorisation flaws', 'API reviews and tests.'],
  ['APP-04', 'DevSecOps', 'Builds security checks into CI/CD pipelines.',
    'build automated security checks into CI/CD pipelines', 'Pipeline controls and coverage.'],
  ['APP-05', 'Security Automation & Scripting', 'Automates security tasks with scripts and playbooks.',
    'automate repetitive security tasks with scripts and playbooks', 'Scripts, SOAR playbooks and time saved.'],
  ['APP-06', 'Web Security', 'Understands and fixes common web vulnerabilities (OWASP Top 10).',
    'find and fix common web vulnerabilities such as the OWASP Top 10', 'Web testing labs and findings.'],
  ['APP-07', 'Penetration Testing', 'Plans and runs authorised tests that find exploitable weaknesses.',
    'plan and run authorised penetration tests and report clear remediation', 'Test reports, lab results and peer review.'],
]

/** Level indicators. Leadership competencies get levels 1–5, technical ones 0–5. */
export const LEVEL_TEMPLATES: Record<number, (p: string) => string> = {
  0: () => 'No exposure yet.',
  1: (p) => `With guidance, begins to ${p}.`,
  2: (p) => `Can ${p} in routine situations, checking with others when unsure.`,
  3: (p) => `Able to ${p} independently, including in complex or unfamiliar situations.`,
  4: (p) => `Helps others ${p} and sets the standard for the team.`,
  5: (p) => `Shapes how the organisation is expected to ${p}; recognised as a reference inside and outside the team.`,
}

// ------------------------------------------------------------------------------ job roles
// [code, name, family, seniority, next role code, technical competencies for the family]
type R = [string, string, string, Seniority, string | null]

export const FAMILY_TECH: Record<string, string[]> = {
  'Security Operations': ['SOC-01', 'SOC-02', 'SOC-03', 'CTI-07', 'CTI-08', 'APP-05'],
  'Threat Intelligence': ['CTI-01', 'CTI-02', 'CTI-03', 'CTI-04', 'CTI-05', 'CTI-07'],
  'Application Security': ['APP-01', 'APP-02', 'APP-03', 'APP-04', 'APP-06', 'CTI-06'],
  'Offensive Security': ['APP-07', 'APP-06', 'CTI-05', 'INF-01', 'APP-05', 'CTI-04'],
  'Infrastructure & Cloud Security': ['INF-01', 'INF-02', 'INF-03', 'INF-04', 'INF-08', 'INF-09'],
  'Identity & Access': ['INF-05', 'INF-06', 'INF-07', 'INF-02', 'GRC-04'],
  'Governance, Risk & Compliance': ['GRC-01', 'GRC-02', 'GRC-03', 'GRC-04', 'GRC-05', 'GRC-06', 'GRC-07'],
  'Business Continuity & Resilience': ['BCM-01', 'BCM-02', 'BCM-03', 'BCM-04', 'BCM-05', 'BCM-07'],
  'Security Leadership': ['GRC-01', 'GRC-02', 'SOC-02', 'INF-09', 'BCM-04'],
}

export const JOB_ROLES: R[] = [
  ['SOC-T1', 'SOC Analyst (Tier 1)', 'Security Operations', 'Entry', 'SOC-T2'],
  ['SOC-T2', 'SOC Analyst (Tier 2)', 'Security Operations', 'Mid', 'SOC-SR'],
  ['SOC-SR', 'Senior SOC Analyst', 'Security Operations', 'Senior', 'SOC-LD'],
  ['IR-SR', 'Senior Incident Responder', 'Security Operations', 'Senior', 'SOC-LD'],
  ['SOC-LD', 'SOC Team Lead', 'Security Operations', 'Lead', 'SOC-MGR'],
  ['SOC-MGR', 'Security Operations Manager', 'Security Operations', 'Manager', 'HEAD-CYB'],
  ['CTI-AN', 'Threat Intelligence Analyst', 'Threat Intelligence', 'Mid', 'CTI-SR'],
  ['CTI-SR', 'Senior Threat Intelligence Analyst', 'Threat Intelligence', 'Senior', 'CTI-LD'],
  ['CTI-LD', 'Threat Intelligence Lead', 'Threat Intelligence', 'Lead', 'SOC-MGR'],
  ['APS-EN', 'Application Security Engineer', 'Application Security', 'Mid', 'APS-SR'],
  ['APS-SR', 'Senior Application Security Engineer', 'Application Security', 'Senior', 'APS-LD'],
  ['APS-LD', 'Application Security Lead', 'Application Security', 'Lead', 'HEAD-CYB'],
  ['PEN-JR', 'Junior Penetration Tester', 'Offensive Security', 'Entry', 'PEN-TS'],
  ['PEN-TS', 'Penetration Tester', 'Offensive Security', 'Mid', 'PEN-SR'],
  ['PEN-SR', 'Senior Penetration Tester', 'Offensive Security', 'Senior', 'APS-LD'],
  ['INF-EN', 'Infrastructure Security Engineer', 'Infrastructure & Cloud Security', 'Mid', 'INF-SR'],
  ['CLD-EN', 'Cloud Security Engineer', 'Infrastructure & Cloud Security', 'Mid', 'INF-SR'],
  ['INF-SR', 'Senior Infrastructure & Cloud Security Engineer', 'Infrastructure & Cloud Security', 'Senior', 'ARC-SEC'],
  ['ARC-SEC', 'Security Architect', 'Infrastructure & Cloud Security', 'Lead', 'HEAD-CYB'],
  ['IAM-AN', 'IAM Analyst', 'Identity & Access', 'Entry', 'IAM-EN'],
  ['IAM-EN', 'IAM Engineer', 'Identity & Access', 'Mid', 'IAM-LD'],
  ['IAM-LD', 'IAM Lead', 'Identity & Access', 'Lead', 'HEAD-CYB'],
  ['GRC-AN', 'GRC Analyst', 'Governance, Risk & Compliance', 'Entry', 'GRC-SR'],
  ['GRC-SR', 'Senior GRC Analyst', 'Governance, Risk & Compliance', 'Senior', 'GRC-LD'],
  ['AUD-IT', 'IT Security Auditor', 'Governance, Risk & Compliance', 'Mid', 'GRC-SR'],
  ['GRC-LD', 'GRC Lead', 'Governance, Risk & Compliance', 'Lead', 'HEAD-GRC'],
  ['HEAD-GRC', 'Head of Governance, Risk & Compliance', 'Governance, Risk & Compliance', 'Head', 'CISO'],
  ['BCM-AN', 'Business Continuity Analyst', 'Business Continuity & Resilience', 'Mid', 'BCM-MGR'],
  ['BCM-MGR', 'Business Continuity & Resilience Manager', 'Business Continuity & Resilience', 'Manager', 'HEAD-GRC'],
  ['HEAD-CYB', 'Head of Cyber Security', 'Security Leadership', 'Head', 'CISO'],
  ['CISO', 'Chief Information Security Officer', 'Security Leadership', 'Executive', null],
]

const CORE_SOFT = ['COM-01', 'THK-01', 'THK-02', 'LRN-01', 'DEL-01', 'LEA-04', 'LRN-02', 'DEL-03']
const SENIOR_SOFT = ['COM-02', 'COM-03', 'THK-04', 'LEA-05', 'THK-05']
const LEADER_SOFT = ['LEA-01', 'LEA-02', 'LEA-03', 'COM-04', 'THK-03', 'LEA-06', 'THK-06', 'COM-06', 'COM-07']
const RANK: Record<Seniority, number> = { Entry: 0, Mid: 1, Senior: 2, Lead: 3, Manager: 4, Head: 5, Executive: 6 }

/** Default required level and priority for a role, by seniority. Editable afterwards on Library → Job roles. */
export function roleRequirements(family: string, seniority: Seniority): { code: string; level: number; priority: 'High' | 'Medium' | 'Low' }[] {
  const r = RANK[seniority]
  const out: { code: string; level: number; priority: 'High' | 'Medium' | 'Low' }[] = []
  const soft = (code: string, base: number, priority: 'High' | 'Medium' | 'Low') => out.push({ code, level: Math.min(5, base), priority })
  const softLevel = [2, 3, 3, 4, 4, 4, 5][r]
  for (const c of CORE_SOFT) soft(c, softLevel, r >= 3 ? 'Medium' : c === 'DEL-01' || c === 'THK-02' ? 'High' : 'Medium')
  if (r >= 2) for (const c of SENIOR_SOFT) soft(c, softLevel, r >= 3 ? 'Medium' : 'Low')
  if (r >= 3) for (const c of LEADER_SOFT) soft(c, softLevel - (c === 'COM-06' || c === 'COM-07' || c === 'THK-06' ? 1 : 0), ['LEA-01', 'LEA-02', 'LEA-03', 'COM-04', 'THK-03'].includes(c) ? 'High' : 'Low')
  const techLevel = [2, 3, 4, 4, 3, 3, 3][r]
  ;(FAMILY_TECH[family] || []).forEach((code, i) => out.push({ code, level: Math.max(1, techLevel - (i >= 4 ? 1 : 0)), priority: i < 3 && r < 4 ? 'High' : i < 4 ? 'Medium' : 'Low' }))
  const seen = new Set<string>()
  return out.filter((x) => (seen.has(x.code) ? false : (seen.add(x.code), true)))
}

// ------------------------------------------------------------------------------ catalogue
// [code, name, type, provider, mode, hours, days, difficulty, observed, [competency codes], description]
type K = [string, string, string, string, string, number, number, string, boolean, string[], string]

export const COURSES: K[] = [
  // leadership & behavioural programmes (observed: trainers score behaviours every day)
  ['ELB', 'Emerging Leaders Bootcamp', 'Leadership Programme', 'Internal', 'In-person', 24, 3, 'Intermediate', true, ['LEA-01', 'LEA-02', 'COM-02', 'THK-04', 'LRN-01'], 'Three-day programme for people stepping into their first lead role.'],
  ['MGR', 'Manager Essentials', 'Leadership Programme', 'Internal', 'Hybrid', 21, 3, 'Intermediate', true, ['LEA-02', 'LEA-03', 'COM-03', 'LEA-05'], 'Goal setting, feedback, delegation and running a team.'],
  ['CWI', 'Communicate with Impact', 'Workshop', 'Internal', 'In-person', 14, 2, 'Foundation', true, ['COM-01', 'COM-02', 'COM-05', 'COM-03'], 'Structuring messages, presenting and adapting to the audience.'],
  ['SLL', 'Strategic Leadership Lab', 'Leadership Programme', 'Internal', 'In-person', 16, 2, 'Advanced', true, ['THK-03', 'COM-04', 'LEA-06', 'THK-06'], 'Strategy, influence and leading change for senior leaders.'],
  ['FBK', 'Giving and Receiving Feedback', 'Workshop', 'Internal', 'In-person', 4, 1, 'Foundation', false, ['LEA-03', 'LRN-01', 'COM-05'], ''],
  ['TPM', 'Time & Priority Management', 'Virtual Session', 'Internal', 'Online (live)', 3, 1, 'Foundation', false, ['DEL-02', 'DEL-01'], ''],
  ['EXW', 'Writing for Executives', 'Virtual Session', 'Internal', 'Online (live)', 4, 1, 'Intermediate', false, ['COM-01', 'COM-03'], ''],
  ['CSS', 'Coaching Skills for Senior Staff', 'Workshop', 'Internal', 'In-person', 8, 1, 'Intermediate', true, ['LEA-05', 'COM-05', 'LEA-03'], ''],
  ['NEG', 'Negotiation for Security Professionals', 'Workshop', 'Internal', 'In-person', 7, 1, 'Intermediate', false, ['COM-06', 'COM-04'], ''],
  ['FAC', 'Facilitating Workshops that Decide', 'Workshop', 'Internal', 'In-person', 6, 1, 'Intermediate', false, ['COM-07', 'LEA-04'], ''],
  ['CHG', 'Leading Change', 'Virtual Session', 'Internal', 'Online (live)', 6, 2, 'Advanced', false, ['LEA-06', 'COM-04'], ''],
  ['CRT', 'Critical Thinking for Analysts', 'Workshop', 'Internal', 'Hybrid', 7, 1, 'Intermediate', false, ['THK-05', 'THK-01', 'DEL-03'], ''],
  // technical
  ['SIEM', 'SIEM Detection Engineering', 'Instructor Led', 'Internal', 'Hybrid', 16, 2, 'Intermediate', false, ['SOC-01', 'CTI-07', 'APP-05'], ''],
  ['HUNT', 'Threat Hunting Fundamentals', 'Immersive Lab', 'Internal', 'Online (live)', 12, 2, 'Intermediate', false, ['CTI-08', 'SOC-01'], ''],
  ['IRW', 'Incident Handling Workshop', 'Workshop', 'Internal', 'In-person', 16, 2, 'Intermediate', false, ['SOC-02', 'LRN-02', 'THK-04'], ''],
  ['TTX', 'Cyber Crisis Tabletop Exercise', 'Simulation', 'Internal', 'In-person', 4, 1, 'Advanced', true, ['SOC-02', 'BCM-05', 'THK-04', 'COM-03'], 'Scenario-based crisis exercise with executive participants.'],
  ['MAL', 'Malware Analysis Basics', 'Immersive Lab', 'Internal', 'Online (live)', 20, 3, 'Intermediate', false, ['SOC-04', 'CTI-07'], ''],
  ['FOR', 'Digital Forensics & Evidence Handling', 'Instructor Led', 'Internal', 'In-person', 24, 3, 'Advanced', false, ['SOC-03'], ''],
  ['CTI', 'Threat Intelligence with MITRE ATT&CK', 'Instructor Led', 'Internal', 'Online (live)', 14, 2, 'Intermediate', false, ['CTI-01', 'CTI-02', 'CTI-03'], ''],
  ['OSI', 'OSINT Investigations', 'Immersive Lab', 'Internal', 'Online (live)', 8, 1, 'Intermediate', false, ['CTI-04'], ''],
  ['WPT', 'Web Application Penetration Testing', 'Immersive Lab', 'Internal', 'Hybrid', 24, 3, 'Advanced', false, ['APP-07', 'APP-06'], ''],
  ['SCR', 'Secure Code Review', 'Instructor Led', 'Internal', 'Online (live)', 12, 2, 'Intermediate', false, ['APP-01', 'APP-02'], ''],
  ['API', 'API Security in Practice', 'Immersive Lab', 'Internal', 'Online (live)', 8, 1, 'Intermediate', false, ['APP-03'], ''],
  ['DSO', 'DevSecOps Pipelines', 'Instructor Led', 'Internal', 'Hybrid', 12, 2, 'Intermediate', false, ['APP-04', 'APP-05'], ''],
  ['TMW', 'Threat Modelling Workshop', 'Workshop', 'Internal', 'In-person', 8, 1, 'Intermediate', false, ['CTI-06', 'INF-09'], ''],
  ['CAP', 'Cloud Attack Paths', 'Immersive Lab', 'Internal', 'Online (live)', 16, 2, 'Advanced', false, ['CTI-05', 'INF-02'], ''],
  ['CSF', 'Cloud Security Foundations', 'Self Study', 'Internal', 'Self-paced', 12, 2, 'Foundation', false, ['INF-02'], ''],
  ['K8S', 'Kubernetes Security', 'Instructor Led', 'Internal', 'Hybrid', 16, 2, 'Advanced', false, ['INF-02', 'INF-03'], ''],
  ['NSF', 'Network Segmentation & Firewall Policy', 'Instructor Led', 'Internal', 'In-person', 16, 2, 'Intermediate', false, ['INF-01'], ''],
  ['HRD', 'System Hardening with CIS Benchmarks', 'Immersive Lab', 'Internal', 'Online (live)', 8, 1, 'Intermediate', false, ['INF-03', 'INF-04'], ''],
  ['EDR', 'Endpoint Hardening with EDR', 'Instructor Led', 'Internal', 'Online (live)', 10, 2, 'Intermediate', false, ['INF-04'], ''],
  ['VMP', 'Vulnerability Prioritisation with CVSS and EPSS', 'Virtual Session', 'Internal', 'Online (live)', 6, 1, 'Intermediate', false, ['INF-08'], ''],
  ['PKI', 'PKI and Secrets Management', 'Instructor Led', 'Internal', 'Online (live)', 8, 1, 'Intermediate', false, ['INF-07'], ''],
  ['ZTA', 'Zero Trust Identity Architecture', 'Instructor Led', 'Internal', 'Online (live)', 12, 2, 'Advanced', false, ['INF-06', 'INF-05', 'INF-09'], ''],
  ['PAM', 'Privileged Access Management in Practice', 'Instructor Led', 'Internal', 'Hybrid', 16, 2, 'Intermediate', false, ['INF-06'], ''],
  ['ARC', 'Security Architecture Patterns', 'Instructor Led', 'Internal', 'Hybrid', 16, 2, 'Advanced', false, ['INF-09', 'THK-06'], ''],
  ['ISO', 'ISO 27001 Implementation', 'Instructor Led', 'Internal', 'Hybrid', 24, 3, 'Intermediate', false, ['GRC-07', 'GRC-04', 'GRC-06'], ''],
  ['RSK', 'Risk Assessment & Treatment', 'Workshop', 'Internal', 'In-person', 8, 1, 'Intermediate', false, ['GRC-02', 'GRC-03'], ''],
  ['FAIR', 'Risk Quantification with FAIR', 'Instructor Led', 'Internal', 'Online (live)', 14, 2, 'Advanced', false, ['GRC-02', 'GRC-01'], ''],
  ['AUD', 'Audit Evidence & Sampling', 'Instructor Led', 'Internal', 'In-person', 12, 2, 'Intermediate', false, ['GRC-05', 'DEL-03'], ''],
  ['NIS', 'NIS2 and DORA Readiness', 'Compliance & Awareness', 'Internal', 'Online (live)', 6, 1, 'Foundation', false, ['GRC-04', 'BCM-04'], ''],
  ['POL', 'Writing Security Policies People Follow', 'Workshop', 'Internal', 'Online (live)', 4, 1, 'Foundation', false, ['GRC-06', 'COM-01'], ''],
  ['BIA', 'Business Impact Analysis Workshop', 'Workshop', 'Internal', 'In-person', 6, 1, 'Intermediate', false, ['BCM-02', 'BCM-07'], ''],
  ['BCP', 'Business Continuity & Disaster Recovery Planning', 'Instructor Led', 'Internal', 'Hybrid', 16, 2, 'Intermediate', false, ['BCM-01', 'BCM-03', 'BCM-06'], ''],
  ['AWR', 'Security Awareness Annual Refresher', 'Compliance & Awareness', 'Internal', 'Self-paced', 1.5, 1, 'Foundation', false, ['GRC-08'], ''],
  ['AIS', 'AI for Security Teams', 'Virtual Session', 'Internal', 'Online (live)', 6, 1, 'Intermediate', false, ['APP-05', 'LRN-04'], ''],
  ['AIL', 'Prompting & AI Safety at Work', 'Self Study', 'Internal', 'Self-paced', 3, 1, 'Foundation', false, ['LRN-04', 'LRN-01'], ''],
  ['PY', 'Python for Security Automation', 'Self Study', 'Internal', 'Self-paced', 20, 4, 'Intermediate', false, ['APP-05'], ''],
  // rotations and on-the-job
  ['ROT-SOC', 'SOC Shadowing Programme', 'Cross-Functional Rotation', 'Internal', 'In-person', 24, 5, 'Foundation', false, ['LEA-04', 'SOC-01'], ''],
  ['ROT-CLD', 'Cloud Security Rotation', 'Cross-Functional Rotation', 'Internal', 'Hybrid', 40, 10, 'Intermediate', false, ['LEA-04', 'INF-02'], ''],
  ['ROT-GRC', 'GRC for Engineers', 'Cross-Functional Rotation', 'Internal', 'Online (live)', 12, 3, 'Foundation', false, ['LEA-04', 'GRC-02'], ''],
  ['ROT-PUR', 'Red Team / Blue Team Exchange', 'Cross-Functional Rotation', 'Internal', 'In-person', 16, 4, 'Advanced', false, ['LEA-04', 'APP-07', 'SOC-01'], ''],
  // certification preparation
  ['PREP-SEC', 'Security+ Exam Preparation', 'Certification Preparation', 'Internal', 'Online (live)', 16, 4, 'Foundation', false, ['GRC-02', 'INF-01'], ''],
  ['PREP-CISSP', 'CISSP Exam Preparation', 'Certification Preparation', 'Internal', 'Hybrid', 40, 5, 'Advanced', false, ['GRC-01', 'INF-09'], ''],
  ['PREP-CISM', 'CISM Exam Preparation', 'Certification Preparation', 'Internal', 'Online (live)', 24, 4, 'Advanced', false, ['GRC-01', 'GRC-03'], ''],
]

// [code, name, provider, track, difficulty, validity months, [competency codes]]
type T = [string, string, string, string, string, number | null, string[]]

export const CERTIFICATIONS: T[] = [
  ['SECPLUS', 'CompTIA Security+', 'CompTIA', 'Professional', 'Foundation', 36, ['GRC-02', 'INF-01', 'SOC-01']],
  ['NETPLUS', 'CompTIA Network+', 'CompTIA', 'Professional', 'Foundation', 36, ['INF-01']],
  ['CYSA', 'CompTIA CySA+', 'CompTIA', 'Professional', 'Intermediate', 36, ['SOC-01', 'CTI-07']],
  ['GCIH', 'GIAC Certified Incident Handler (GCIH)', 'GIAC', 'Professional', 'Intermediate', 48, ['SOC-02']],
  ['GCFA', 'GIAC Certified Forensic Analyst (GCFA)', 'GIAC', 'Professional', 'Advanced', 48, ['SOC-03']],
  ['GCTI', 'GIAC Cyber Threat Intelligence (GCTI)', 'GIAC', 'Professional', 'Advanced', 48, ['CTI-01', 'CTI-02']],
  ['GWAPT', 'GIAC Web Application Penetration Tester (GWAPT)', 'GIAC', 'Professional', 'Advanced', 48, ['APP-07', 'APP-06']],
  ['EJPT', 'INE Junior Penetration Tester (eJPT)', 'INE', 'Professional', 'Foundation', 36, ['APP-07']],
  ['OSCP', 'OffSec Certified Professional (OSCP)', 'OffSec', 'Professional', 'Advanced', null, ['APP-07', 'CTI-05']],
  ['CSSLP', 'Certified Secure Software Lifecycle Professional (CSSLP)', 'ISC2', 'Professional', 'Advanced', 36, ['APP-02', 'APP-04']],
  ['CISSP', 'Certified Information Systems Security Professional (CISSP)', 'ISC2', 'Professional', 'Advanced', 36, ['GRC-01', 'INF-09']],
  ['CCSP', 'Certified Cloud Security Professional (CCSP)', 'ISC2', 'Professional', 'Advanced', 36, ['INF-02']],
  ['CISM', 'Certified Information Security Manager (CISM)', 'ISACA', 'Professional', 'Advanced', 36, ['GRC-01', 'GRC-03']],
  ['CISA', 'Certified Information Systems Auditor (CISA)', 'ISACA', 'Professional', 'Advanced', 36, ['GRC-05']],
  ['CRISC', 'Certified in Risk and Information Systems Control (CRISC)', 'ISACA', 'Professional', 'Advanced', 36, ['GRC-02', 'GRC-03']],
  ['ISO-LI', 'ISO/IEC 27001 Lead Implementer', 'PECB', 'Professional', 'Intermediate', 36, ['GRC-07', 'GRC-04']],
  ['ISO-LA', 'ISO/IEC 27001 Lead Auditor', 'PECB', 'Professional', 'Intermediate', 36, ['GRC-05', 'GRC-07']],
  ['CBCI', 'BCI Certificate (CBCI)', 'Business Continuity Institute', 'Professional', 'Intermediate', 12, ['BCM-01', 'BCM-02']],
  ['CCISO', 'EC-Council Certified CISO (CCISO)', 'EC-Council', 'Professional', 'Expert', 36, ['GRC-01', 'LEA-01']],
  ['SC300', 'Microsoft Identity and Access Administrator (SC-300)', 'Microsoft', 'Vendor / Product', 'Intermediate', 12, ['INF-05', 'INF-06']],
  ['AZ500', 'Microsoft Azure Security Engineer (AZ-500)', 'Microsoft', 'Vendor / Product', 'Intermediate', 12, ['INF-02']],
  ['AWSSEC', 'AWS Certified Security – Specialty', 'Amazon Web Services', 'Vendor / Product', 'Advanced', 36, ['INF-02']],
  ['AI900', 'Microsoft Azure AI Fundamentals (AI-900)', 'Microsoft', 'AI', 'Foundation', null, ['LRN-04']],
  ['AWSAI', 'AWS Certified AI Practitioner', 'Amazon Web Services', 'AI', 'Foundation', 36, ['LRN-04']],
  ['AI102', 'Microsoft Azure AI Engineer Associate (AI-102)', 'Microsoft', 'AI', 'Intermediate', 12, ['APP-05', 'LRN-04']],
  ['AIGP', 'IAPP Artificial Intelligence Governance Professional (AIGP)', 'IAPP', 'AI', 'Intermediate', 24, ['GRC-01', 'GRC-04']],
  ['GENAI', 'Google Cloud Generative AI Leader', 'Google Cloud', 'AI', 'Foundation', 36, ['THK-03', 'LRN-04']],
]

// ------------------------------------------------------------------------------ observed behaviours
// The 25 behaviours from the client's "Training Day Scores" sheet. [code, name, category, competency code, description]
export const OBSERVATION_PARAMETERS: [string, string, string, string, string][] = [
  ['OB-01', 'Confidence / composure', 'Personal Effectiveness', 'COM-02', 'Speaks and acts with composure, also when challenged.'],
  ['OB-02', 'Accountability / follow-through', 'Personal Effectiveness', 'LEA-03', 'Does what they said they would do and owns the result.'],
  ['OB-03', 'Emotional regulation', 'Personal Effectiveness', 'LRN-02', 'Stays calm and constructive under pressure or frustration.'],
  ['OB-04', 'Openness to feedback', 'Learning Agility', 'LRN-01', 'Listens to feedback without defending and asks for more.'],
  ['OB-05', 'Clarity of message', 'Communication', 'COM-01', 'The point is easy to understand the first time.'],
  ['OB-06', 'Structure of message', 'Communication', 'COM-02', 'Messages have a clear beginning, logic and conclusion.'],
  ['OB-07', 'Active listening', 'Communication', 'COM-05', 'Listens fully, checks understanding and builds on what others say.'],
  ['OB-08', 'Adaptation to audience', 'Communication', 'COM-03', 'Adjusts detail, language and tone to who is listening.'],
  ['OB-09', 'Conciseness', 'Communication', 'COM-01', 'Says what matters without padding.'],
  ['OB-10', 'Participation', 'Collaboration', 'LEA-04', 'Contributes actively to group work.'],
  ['OB-11', 'Respectful interaction', 'Collaboration', 'COM-05', 'Treats everyone with respect, including in disagreement.'],
  ['OB-12', 'Influence in group', 'Collaboration', 'COM-04', 'Moves the group\'s thinking or decisions.'],
  ['OB-13', 'Conflict handling', 'Collaboration', 'LEA-02', 'Addresses disagreement openly and resolves it constructively.'],
  ['OB-14', 'Collaboration', 'Collaboration', 'LEA-04', 'Works with others towards a shared result rather than alone.'],
  ['OB-15', 'Problem definition', 'Problem Solving', 'THK-02', 'Clarifies the real problem before jumping to solutions.'],
  ['OB-16', 'Logical thinking', 'Problem Solving', 'THK-01', 'Reasons step by step and backs conclusions with facts.'],
  ['OB-17', 'Idea generation', 'Problem Solving', 'THK-03', 'Comes up with several useful options.'],
  ['OB-18', 'Decision quality', 'Problem Solving', 'THK-04', 'Reaches sound decisions in reasonable time.'],
  ['OB-19', 'Initiative', 'Personal Effectiveness', 'DEL-01', 'Acts without being asked when something needs doing.'],
  ['OB-20', 'Ownership', 'Personal Effectiveness', 'LEA-03', 'Takes responsibility for outcomes, not just tasks.'],
  ['OB-21', 'Guiding others', 'Leadership', 'LEA-02', 'Helps others contribute and move forward.'],
  ['OB-22', 'Presence / authority', 'Leadership', 'LEA-01', 'Others look to them for direction.'],
  ['OB-23', 'Learning speed', 'Learning Agility', 'LRN-01', 'Picks up new concepts and tools quickly.'],
  ['OB-24', 'Applies feedback', 'Learning Agility', 'LRN-01', 'Visibly does things differently after feedback.'],
  ['OB-25', 'Reflection quality', 'Learning Agility', 'THK-01', 'Draws specific, honest lessons from what happened.'],
]
