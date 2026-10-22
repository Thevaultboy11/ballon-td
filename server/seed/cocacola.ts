// Generic demo data for one client: the Global Cyber Security team of "Coca-Cola (demo)".
// Every person, email and record is made up. Structure follows the client templates:
//   • Lexonis competency framework (codes, categories and definitions from the competency sheet)
//   • Baseline survey (self-assessment) + validation interview
//   • IDP segments: S1 professional cert · S2 immersive labs · S3 AI cert · S4 SAP SuccessFactors ·
//     S5 cross-functional training · department training needs
//   • Coaching table: prep / 1-1 start-end / reporting time, segment notes
//   • Coach validation per behaviour descriptor with progress (1–5) and evidence
//   • Monthly line-manager validation per skill, progress 1–5
//   • 5-day cross-functional programme (S1 Team Collaboration … S5 Problem Solving), observed daily
//
//   npm run db:coca-cola              add it (the library is loaded first if needed)
//   npm run db:coca-cola -- --remove  remove the client, its people and its role profiles
import { prisma, prepareDatabase } from '../db.ts'
import { nextId, nextIds, syncCounters } from '../lib/ids.ts'
import { seedLibrary } from './seed.ts'
import { seedStarterLibrary } from './starter.ts'

const CLIENT = 'Coca-Cola — Global Cyber Security (demo)'
const MARK = 'Coca-Cola demo'
const DOMAIN = 'coca-cola-demo.example'
const TODAY = new Date(Date.UTC(2026, 9, 21))
const BY = 'Demo data (Coca-Cola)'

let seed = 7_2026
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296)
const pick = <T,>(a: T[]): T => a[Math.floor(rnd() * a.length)]
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x))
const day = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d))
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000)
const audit = (source = 'Direct entry') => ({ createdBy: BY, updatedBy: BY, source })
const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

/** Find by unique key or create with a new prefixed ID. */
async function ensure(model: string, prefix: string, where: Record<string, unknown>, data: Record<string, unknown> = {}) {
  const d = (prisma as any)[model]
  const found = await d.findFirst({ where })
  if (found) return found.id as string
  const id = await nextId(prefix)
  await d.create({ data: { id, ...where, ...data } })
  return id
}

// ------------------------------------------------------------------------------ Lexonis framework
// [code, name, category code, definition, behaviour phrase for the level indicators, min level]
const LEXONIS: [string, string, string, string, string, number][] = [
  ['LXSCN0055', 'Stakeholder Management', 'LEX_CF', 'Builds a broad network of relationships with stakeholders to identify problems and opportunities for improvement and structure performance expectations.', 'build and use a network of stakeholders to surface problems and agree expectations', 1],
  ['LXSCN0060', 'Systems Thinking', 'LEX_CF', 'Focuses on big picture thinking, combining data and insights into useful strategies and actions.', 'combine data and insights into a big-picture view that drives strategy and action', 1],
  ['LXSCN0080', 'Budgeting', 'LEX_CF', 'Identifies and incorporates financial resources into a comprehensive financial plan that supports business strategies.', 'build and manage a security budget that supports business strategy', 1],
  ['LXSCN0001', 'Cross-Team Integration', 'LEX_LM', 'Leads multiple teams to communicate and coordinate work as one team.', 'get several teams to communicate and coordinate work as one team', 1],
  ['LXSCN0005', 'Strategic Thinking', 'LEX_LM', 'Envisions the long-term direction of the organisation, anticipates future trends, develops plans that position the company for sustained success and pursues high potential opportunities for the benefit of the organisation.', 'anticipate future trends and plan the long-term direction of security', 1],
  ['LXSCN0008', 'Strategic Influence', 'LEX_LM', 'Develops and leverages internal/external relationships to facilitate decision-making.', 'use internal and external relationships to move decisions forward', 1],
  ['LXSCN0019', 'Decision Making', 'LEX_LM', 'Makes sound decisions in a timely manner, exercising a combination of analysis and good judgement.', 'make sound, timely decisions combining analysis and judgement', 1],
  ['LXSCN0020', 'Operational Effectiveness', 'LEX_LM', 'Drives organisational success by optimising operations, improving efficiencies and maximising business performance.', 'optimise operations and remove inefficiencies in security processes', 1],
  ['LXSCN0026', 'Leadership', 'LEX_LM', 'Creates a motivating vision, serves as a role model, rallies others in support of the chosen direction, and motivates people to embrace and lead change.', 'set a motivating direction, act as a role model and lead people through change', 1],
  ['LXSCN0027', 'Team Management', 'LEX_LM', 'Guides group efforts and helps others achieve excellent results.', 'guide the team\'s efforts and help others achieve excellent results', 1],
  ['LXSCN0206', 'Performance Management', 'LEX_LM', 'Works with individuals and teams to set expectations, monitor progress, provide feedback and support and evaluate their performance.', 'set expectations, monitor progress and give feedback on performance', 0],
  ['LXSCN0030', 'Business Acumen', 'LEX_ORG', 'Focuses activities and decisions on opportunities that produce significant, strategic business impact.', 'focus security work on what produces the biggest business impact', 1],
  ['LXSCN0031', 'Problem Solving', 'LEX_ORG', 'Applies problem-solving techniques and tools to resolve problems effectively.', 'apply structured problem-solving techniques to resolve issues', 1],
  ['LXSCN0032', 'Presentation Delivery', 'LEX_ORG', 'Effectively presents ideas, solutions and strategies with impact and influence.', 'present ideas, findings and strategies with impact', 1],
  ['LXSCN0034', 'Analytical Thinking', 'LEX_ORG', 'Generates and analyses information to improve the clarity of ideas and approaches.', 'analyse information to make ideas and approaches clearer', 1],
  ['LXSCN0035', 'Relationship Building', 'LEX_ORG', 'Develops trusting relationships by valuing others\' contributions and works with others in a constructive and collaborative manner.', 'build trusting, constructive working relationships', 1],
  ['LXSCN0036', 'Communication', 'LEX_ORG', 'Provides information and messages in a way that produces clarity and impact.', 'communicate information and messages with clarity and impact', 1],
  ['LXSCN0037', 'Tolerance for Uncertainty', 'LEX_ORG', 'Adept at handling risk, ambiguity and uncertainty in high pressured situations.', 'stay effective under risk, ambiguity and pressure', 1],
  ['LXSCN0038', 'Planning and Organising', 'LEX_ORG', 'Mobilises, plans, and controls time and resources to get things done.', 'plan and control time and resources to get things done', 1],
  ['LXSCN0039', 'Continuous Learning', 'LEX_ORG', 'Actively seeks new learning opportunities and acts to improve own performance and that of others. Has a growth mindset approach towards learning and personal growth.', 'seek new learning and improve their own and others\' performance', 1],
  ['LXSCN0045', 'Accuracy and Attention to Detail', 'LEX_ORG', 'Methodically plans, conducts and reviews work with a focus on quality.', 'plan, conduct and review work methodically with a focus on quality', 1],
  ['LXSCN0046', 'Adaptability', 'LEX_ORG', 'Responds with flexibility to changing work demands.', 'respond flexibly to changing work demands', 1],
  ['LXSCN0065', 'Project Management', 'LEX_PP', 'Plans, controls, monitors and completes projects, ensuring efficient utilisation of resources, to achieve successful project outcomes.', 'plan, control and complete security projects with efficient use of resources', 1],
  ['LXSCN0113', 'Managing the Programs and Projects Function', 'LEX_PP', 'Manages development and implementation of strategies, tools and methods for managing large scale efforts comprising a dossier of projects and transformation activities.', 'run a portfolio of security projects and transformation programmes', 1],
  ['LEX-CYB-01', 'Policy, Procedure & Standards Development', 'LEX_CYB', 'The ability to design, document, deploy, and continuously improve cybersecurity policies, procedures, and standards, establishing clear governance, data-handling protocols, and regulatory alignment, so that all business units operate under consistent, auditable, and risk-appropriate controls across the policy lifecycle.', 'design, deploy and improve security policies, procedures and standards that business units follow', 1],
]
const LEX_LEVELS: Record<number, (p: string) => string> = {
  0: () => 'No exposure yet.',
  1: (p) => `Foundation: with guidance, begins to ${p}.`,
  2: (p) => `Developing: can ${p} in familiar situations.`,
  3: (p) => `Proficient: able to ${p} independently, also in complex situations.`,
  4: (p) => `Expert: helps others ${p} and sets the standard across the organisation.`,
}

// ------------------------------------------------------------------------------ the team
type Sen = 'Entry' | 'Mid' | 'Senior' | 'Lead' | 'Manager' | 'Head' | 'Executive'
// [code, role name, section, seniority, next role, technical competency codes]
const ROLES: [string, string, string, Sen, string | null, string[]][] = [
  ['KO-CISO', 'Chief Information Security Officer', 'CISO Office', 'Executive', null, ['GRC-01', 'GRC-02', 'BCM-04', 'INF-09']],
  ['KO-DIR-SO', 'Director, Security Operations', 'CISO Office', 'Head', 'KO-CISO', ['SOC-02', 'GRC-02', 'BCM-04', 'INF-09']],
  ['KO-SOC-MGR', 'SOC Manager', 'Security Operations', 'Manager', 'KO-DIR-SO', ['SOC-01', 'SOC-02', 'CTI-08', 'GRC-02']],
  ['KO-SOC-LD', 'SOC Team Lead', 'Security Operations', 'Lead', 'KO-SOC-MGR', ['SOC-01', 'SOC-02', 'CTI-07', 'CTI-08', 'APP-05']],
  ['KO-SOC-SR', 'Senior SOC Analyst', 'Security Operations', 'Senior', 'KO-SOC-LD', ['SOC-01', 'SOC-02', 'SOC-03', 'CTI-07', 'CTI-08']],
  ['KO-SOC-L2', 'SOC Analyst (L2)', 'Security Operations', 'Mid', 'KO-SOC-SR', ['SOC-01', 'SOC-02', 'CTI-07', 'APP-05']],
  ['KO-SOC-L1', 'SOC Analyst (L1)', 'Security Operations', 'Entry', 'KO-SOC-L2', ['SOC-01', 'SOC-02', 'CTI-07']],
  ['KO-IR-LD', 'Incident Response Lead', 'Threat Intelligence & Incident Response', 'Lead', 'KO-SOC-MGR', ['SOC-02', 'SOC-03', 'SOC-04', 'BCM-05']],
  ['KO-IR', 'Incident Responder', 'Threat Intelligence & Incident Response', 'Mid', 'KO-IR-LD', ['SOC-02', 'SOC-03', 'SOC-04']],
  ['KO-CTI', 'Threat Intelligence Analyst', 'Threat Intelligence & Incident Response', 'Mid', 'KO-IR-LD', ['CTI-01', 'CTI-02', 'CTI-03', 'CTI-04']],
  ['KO-OT-LD', 'OT/ICS Security Lead (Bottling & Manufacturing)', 'OT Security', 'Lead', 'KO-DIR-SO', ['INF-10', 'INF-01', 'BCM-04', 'GRC-02', 'SOC-02']],
  ['KO-OT-EN', 'OT/ICS Security Engineer', 'OT Security', 'Mid', 'KO-OT-LD', ['INF-10', 'INF-01', 'INF-03', 'INF-08']],
  ['KO-CLD-EN', 'Cloud Security Engineer', 'Cloud & Identity', 'Mid', 'KO-CLD-SR', ['INF-02', 'INF-03', 'APP-04', 'INF-08']],
  ['KO-CLD-SR', 'Senior Cloud Security Engineer', 'Cloud & Identity', 'Senior', 'KO-ARCH', ['INF-02', 'INF-09', 'APP-04', 'CTI-05']],
  ['KO-ARCH', 'Security Architect', 'Cloud & Identity', 'Lead', 'KO-DIR-SO', ['INF-09', 'INF-02', 'INF-06', 'CTI-06']],
  ['KO-IAM-EN', 'IAM Engineer', 'Cloud & Identity', 'Mid', 'KO-ARCH', ['INF-05', 'INF-06', 'INF-07']],
  ['KO-IAM-AN', 'IAM Analyst', 'Cloud & Identity', 'Entry', 'KO-IAM-EN', ['INF-05', 'INF-06']],
  ['KO-APPSEC', 'Application Security Engineer', 'Application Security', 'Mid', 'KO-ARCH', ['APP-01', 'APP-02', 'APP-03', 'APP-06']],
  ['KO-GRC-MGR', 'GRC Manager', 'GRC & Third-Party Risk', 'Manager', 'KO-CISO', ['GRC-01', 'GRC-02', 'GRC-04', 'GRC-06', 'GRC-07']],
  ['KO-GRC-AN', 'GRC Analyst', 'GRC & Third-Party Risk', 'Entry', 'KO-GRC-SR', ['GRC-02', 'GRC-04', 'GRC-06', 'GRC-07']],
  ['KO-GRC-SR', 'Senior GRC Analyst', 'GRC & Third-Party Risk', 'Senior', 'KO-GRC-MGR', ['GRC-02', 'GRC-03', 'GRC-04', 'GRC-05', 'GRC-06']],
  ['KO-TPR', 'Third-Party Risk Analyst', 'GRC & Third-Party Risk', 'Mid', 'KO-GRC-SR', ['GRC-02', 'GRC-03', 'GRC-04']],
  ['KO-AWR', 'Security Awareness Specialist', 'Awareness & Resilience', 'Mid', 'KO-GRC-SR', ['GRC-08', 'GRC-06']],
  ['KO-BCM', 'Business Continuity & Resilience Manager', 'Awareness & Resilience', 'Manager', 'KO-DIR-SO', ['BCM-01', 'BCM-02', 'BCM-03', 'BCM-04', 'BCM-05']],
]
const RANK: Record<Sen, number> = { Entry: 0, Mid: 1, Senior: 2, Lead: 3, Manager: 4, Head: 5, Executive: 6 }

/** Lexonis requirements (scale 1–4) by seniority, plus the role's technical competencies (0–5). */
function requirements(code: string, sen: Sen, tech: string[]) {
  const r = RANK[sen]
  const lvl = [2, 2, 3, 3, 3, 4, 4][r]
  const out: [string, number, string][] = []
  const add = (c: string, l: number, p: string) => { if (!out.some((x) => x[0] === c)) out.push([c, clamp(l, 1, 4), p]) }
  for (const c of ['LXSCN0036', 'LXSCN0031', 'LXSCN0034', 'LXSCN0039', 'LXSCN0045', 'LXSCN0046', 'LXSCN0038', 'LXSCN0035', 'LXSCN0037', 'LXSCN0020'])
    add(c, lvl, ['LXSCN0031', 'LXSCN0045'].includes(c) && r < 3 ? 'High' : 'Medium')
  if (r >= 1) add('LXSCN0001', lvl, 'Medium')
  if (r >= 2) { add('LXSCN0055', lvl, 'Medium'); add('LXSCN0019', lvl, 'High'); add('LXSCN0032', lvl, 'Medium') }
  if (r >= 3) { for (const c of ['LXSCN0026', 'LXSCN0027', 'LXSCN0206']) add(c, lvl, 'High'); add('LXSCN0060', lvl - 1, 'Medium'); add('LXSCN0030', lvl - 1, 'Low'); add('LXSCN0065', lvl, 'Medium') }
  if (r >= 4) { add('LXSCN0005', lvl, 'High'); add('LXSCN0008', lvl, 'High'); add('LXSCN0080', lvl - 1, 'Medium') }
  if (r >= 5) add('LXSCN0113', lvl, 'Medium')
  if (code.startsWith('KO-GRC') || code === 'KO-TPR' || code === 'KO-AWR' || r >= 3) add('LEX-CYB-01', 3, code.startsWith('KO-GRC') ? 'High' : 'Medium')
  const techLvl = [2, 3, 4, 4, 3, 3, 3][r]
  tech.forEach((c, i) => out.push([c, Math.max(1, techLvl - (i >= 3 ? 1 : 0)), i < 2 ? 'High' : i < 3 ? 'Medium' : 'Low']))
  return out
}

// [role, count]
const TEAM: [string, number][] = [
  ['KO-CISO', 1], ['KO-DIR-SO', 1], ['KO-SOC-MGR', 1], ['KO-SOC-LD', 1], ['KO-SOC-SR', 2], ['KO-SOC-L2', 3], ['KO-SOC-L1', 3],
  ['KO-IR-LD', 1], ['KO-IR', 2], ['KO-CTI', 2], ['KO-OT-LD', 1], ['KO-OT-EN', 2], ['KO-CLD-SR', 1], ['KO-CLD-EN', 2], ['KO-ARCH', 1],
  ['KO-IAM-EN', 2], ['KO-IAM-AN', 1], ['KO-APPSEC', 2], ['KO-GRC-MGR', 1], ['KO-GRC-SR', 1], ['KO-GRC-AN', 2], ['KO-TPR', 1], ['KO-AWR', 1], ['KO-BCM', 1],
]
const FIRST = ['Maria', 'James', 'Aisha', 'Daniel', 'Elena', 'Kwame', 'Sofia', 'Lucas', 'Priya', 'Mateo', 'Hannah', 'Omar', 'Chloe', 'Ivan', 'Grace', 'Ahmed', 'Laura', 'Diego',
  'Nadia', 'Tomasz', 'Emma', 'Ravi', 'Julia', 'Samuel', 'Fatima', 'Noah', 'Ines', 'Marek', 'Zoe', 'Kenji', 'Amara', 'Luca', 'Selin', 'Erik', 'Yara', 'Ben', 'Mina', 'Paolo']
const LAST = ['Thompson', 'Okafor', 'Rahman', 'García', 'Novak', 'Mensah', 'Rossi', 'Fischer', 'Sharma', 'López', 'Becker', 'Haddad', 'Dubois', 'Petrov', 'Kim', 'Hassan', 'Martin',
  'Silva', 'Begović', 'Kowalski', 'Wilson', 'Patel', 'Costa', 'Adeyemi', 'Ali', 'Jensen', 'Moreau', 'Horvat', 'Clarke', 'Tanaka', 'Diallo', 'Bianchi', 'Yilmaz', 'Lindqvist', 'Nasser', 'Cohen', 'Park', 'Ferrari']
const LOCATIONS = ['Atlanta, US', 'Atlanta, US', 'Dublin, IE', 'Sofia, BG', 'Sarajevo, BA', 'Mexico City, MX', 'Shanghai, CN']

const PROFILES = { star: 0.5, solid: 0, specialist: 0.2, developing: -0.7, new: -1.1 } as Record<string, number>

async function remove() {
  const client = await prisma.client.findUnique({ where: { name: CLIENT } })
  if (client) {
    const ids = (await prisma.employee.findMany({ where: { clientId: client.id }, select: { id: true } })).map((e) => e.id)
    const progs = (await prisma.program.findMany({ where: { clientId: client.id }, select: { id: true } })).map((p) => p.id)
    await prisma.$transaction([
      prisma.employee.updateMany({ where: { clientId: client.id }, data: { lineManagerId: null } }),
      prisma.managerValidation.deleteMany({ where: { employeeId: { in: ids } } }),
      prisma.employee.deleteMany({ where: { clientId: client.id } }),
      prisma.courseSession.deleteMany({ where: { programId: { in: progs } } }),
      prisma.program.deleteMany({ where: { clientId: client.id } }),
      prisma.client.delete({ where: { id: client.id } }),
      prisma.changeLog.deleteMany({ where: { employeeId: { in: ids } } }),
    ])
    console.log(`Removed ${CLIENT} and ${ids.length} people.`)
  }
  await prisma.staff.deleteMany({ where: { notes: MARK } })
  const roles = await prisma.jobRole.findMany({ where: { code: { startsWith: 'KO-' } } })
  await prisma.jobRole.updateMany({ where: { code: { startsWith: 'KO-' } }, data: { nextRoleId: null } })
  await prisma.jobRole.deleteMany({ where: { id: { in: roles.map((r) => r.id) } } })
  console.log(`Removed ${roles.length} Coca-Cola role profiles. (The Lexonis framework and added courses stay in the library.)`)
}

async function create() {
  if (await prisma.client.findUnique({ where: { name: CLIENT } })) return console.log('Already loaded. Remove it first: npm run db:coca-cola -- --remove')
  await seedLibrary()
  await seedStarterLibrary() // the demo's technical role profiles use the starter library's codes

  // ---------------------------------------------------------------- library additions
  // The standard library (npm run db:seed) already holds both Lexonis frameworks as LEXCROSS / LEXFUNCT: reuse them.
  const libFw = async (code: string) => (await prisma.framework.findUnique({ where: { code } }))?.id
  const lexCF = (await libFw('LEXCROSS')) ?? await ensure('framework', 'FWK', { code: 'LEXCF' }, { name: 'Lexonis Cross-functional Competencies', scaleMin: 1, scaleMax: 4, description: 'Client competency framework (Lexonis). Scale 1–4.' })
  const lexFN = (await libFw('LEXFUNCT')) ?? await ensure('framework', 'FWK', { code: 'LEXFN' }, { name: 'Lexonis Functional Competencies', scaleMin: 1, scaleMax: 4, description: 'Client functional competencies (Lexonis). Scale 1–4.' })
  const cats: Record<string, string> = {
    LEX_CF: await ensure('competencyCategory', 'CAT', { code: 'LEX_CF' }, { name: 'Business', frameworkId: lexCF, sortOrder: 200 }),
    LEX_LM: await ensure('competencyCategory', 'CAT', { code: 'LEX_LM' }, { name: 'Leadership and Management', frameworkId: lexCF, sortOrder: 210 }),
    LEX_ORG: await ensure('competencyCategory', 'CAT', { code: 'LEX_ORG' }, { name: 'Personal', frameworkId: lexCF, sortOrder: 220 }),
    LEX_PP: await ensure('competencyCategory', 'CAT', { code: 'LEX_PP' }, { name: 'Project and Program Management', frameworkId: lexFN, sortOrder: 230 }),
    LEX_CYB: await ensure('competencyCategory', 'CAT', { code: 'LEX_CYB' }, { name: 'Cyber Security Governance', frameworkId: lexFN, sortOrder: 240 }),
  }
  const comp: Record<string, any> = {}
  for (const [i, [code, name, cat, description, phrase, min]] of LEXONIS.entries()) {
    const id = await ensure('competency', 'CMP', { code }, { name, categoryId: cats[cat], description, supportingText: 'Lexonis framework definition.', minLevel: min, maxLevel: 4, sortOrder: 2000 + i * 10 })
    for (let l = min; l <= 4; l++) await ensure('competencyBehavior', 'BHV', { code: `${code}-L${l}` }, { competencyId: id, level: l, description: LEX_LEVELS[l](phrase) })
  }
  const infCat = await prisma.competencyCategory.findUnique({ where: { code: 'INF' } })
  const otId = await ensure('competency', 'CMP', { code: 'INF-10' }, { name: 'OT/ICS Security', categoryId: infCat!.id, minLevel: 0, maxLevel: 5, sortOrder: 1000,
    description: 'Secures operational technology and industrial control systems (production lines, bottling plants) without disrupting operations.', supportingText: 'OT asset inventories, zone/conduit designs, plant assessments.' })
  for (let l = 0; l <= 5; l++) {
    const p = 'secure OT and industrial control systems without disrupting production'
    const txt = [`No exposure yet.`, `With guidance, begins to ${p}.`, `Can ${p} in routine situations, checking with others when unsure.`, `Able to ${p} independently, including in complex or unfamiliar situations.`, `Helps others ${p} and sets the standard for the team.`, `Shapes how the organisation is expected to ${p}.`][l]
    await ensure('competencyBehavior', 'BHV', { code: `INF-10-L${l}` }, { competencyId: otId, level: l, description: txt })
  }
  for (const c of await prisma.competency.findMany()) comp[c.code] = c

  // courses and certifications this client uses
  const course = async (code: string, data: any, comps: string[]) => {
    const id = await ensure('course', 'CRS', { code }, data)
    for (const c of comps) await prisma.courseCompetency.upsert({ where: { courseId_competencyId: { courseId: id, competencyId: comp[c].id } }, create: { courseId: id, competencyId: comp[c].id }, update: {} })
    return prisma.course.findUniqueOrThrow({ where: { id } })
  }
  const XFLP = await course('XFLP', { name: 'Cross-Functional Leadership Programme', type: 'Leadership Programme', provider: 'Internal', deliveryMode: 'In-person', durationHours: 30, days: 5, difficulty: 'Intermediate', observed: true,
    description: 'Five observed days: S1 Team Collaboration · S2 Accountability & MOM · S3 Storytelling · S4 Presentation Skills · S5 Problem Solving. Baseline survey before day 1.' },
    ['LXSCN0001', 'LXSCN0036', 'LXSCN0032', 'LXSCN0031', 'LXSCN0026'])
  const OTF = await course('OTSEC', { name: 'OT/ICS Security Fundamentals (IEC 62443)', type: 'Instructor Led', provider: 'Internal', deliveryMode: 'Hybrid', durationHours: 16, days: 2, difficulty: 'Intermediate', observed: false }, ['INF-10', 'INF-01'])
  const IMM = await course('IMM-LAB', { name: 'Immersive Labs: role learning path', type: 'Immersive Lab', provider: 'Immersive Labs', deliveryMode: 'Self-paced', durationHours: 20, days: 1, difficulty: 'Intermediate', observed: false }, ['SOC-01', 'INF-02', 'APP-06'])
  const SAP = await course('SAP-SF', { name: 'SAP SuccessFactors: role curriculum', type: 'Self Study', provider: 'SAP SuccessFactors', deliveryMode: 'Self-paced', durationHours: 8, days: 1, difficulty: 'Foundation', observed: false }, ['LXSCN0039'])
  const courses = Object.fromEntries((await prisma.course.findMany()).map((c) => [c.code, c]))
  const gicsp = await ensure('certification', 'CRT', { code: 'GICSP' }, { name: 'GIAC Global Industrial Cyber Security Professional (GICSP)', provider: 'GIAC', track: 'Professional', difficulty: 'Advanced', validityMonths: 48 })
  await prisma.certificationCompetency.upsert({ where: { certificationId_competencyId: { certificationId: gicsp, competencyId: otId } }, create: { certificationId: gicsp, competencyId: otId }, update: {} })
  const certs = Object.fromEntries((await prisma.certification.findMany()).map((c) => [c.code, c]))

  // ---------------------------------------------------------------- role profiles
  const roleId: Record<string, string> = {}
  for (const [code, name, section, sen, , tech] of ROLES) {
    const family = section === 'GRC & Third-Party Risk' ? 'Governance, Risk & Compliance' : section === 'Awareness & Resilience' ? (code === 'KO-BCM' ? 'Business Continuity & Resilience' : 'Governance, Risk & Compliance')
      : section === 'Cloud & Identity' ? (code.startsWith('KO-IAM') ? 'Identity & Access' : 'Infrastructure & Cloud Security') : section === 'OT Security' ? 'Infrastructure & Cloud Security'
      : section === 'Application Security' ? 'Application Security' : section === 'Threat Intelligence & Incident Response' ? (code === 'KO-CTI' ? 'Threat Intelligence' : 'Security Operations')
      : section === 'CISO Office' ? 'Security Leadership' : 'Security Operations'
    roleId[code] = await ensure('jobRole', 'ROL', { code }, { name, family, seniority: sen, description: 'Coca-Cola demo role profile (Lexonis + technical).' })
    for (const [c, level, priority] of requirements(code, sen, tech)) await ensure('roleRequirement', 'REQ', { jobRoleId: roleId[code], competencyId: comp[c].id }, { requiredLevel: level, priority })
  }
  for (const [code, , , , next] of ROLES) if (next) await prisma.jobRole.update({ where: { id: roleId[code] }, data: { nextRoleId: roleId[next] } })
  const roles = Object.fromEntries((await prisma.jobRole.findMany({ where: { code: { startsWith: 'KO-' } }, include: { requirements: true } })).map((r) => [r.code, r]))

  // ---------------------------------------------------------------- staff, client, programme
  const staff: Record<string, string> = {}
  for (const [name, r] of [['Amina Softić', 'Consultant; Assessor'], ['Jonas Weber', 'Consultant; Programme Manager'], ['Leila Haddad', 'Trainer; Assessor'],
    ['Marko Ilić', 'Trainer'], ['Sofia Martins', 'Coach'], ['David Chen', 'Coach; Trainer']]) {
    staff[name] = await ensure('staff', 'STF', { name }, { roles: r, email: `${name.split(' ')[0].toLowerCase().replace('ć', 'c')}@ballon-td.example`, notes: MARK })
  }
  const coaches = [staff['Sofia Martins'], staff['David Chen']]
  const consultants = [staff['Amina Softić'], staff['Jonas Weber']]
  const clientId = await nextId('CLI')
  await prisma.client.create({ data: { id: clientId, name: CLIENT, industry: 'Beverages / FMCG', country: 'United States (global)', contactName: 'Office of the CISO', notes: 'Fictional demo data: company name only, no real people or records.' } })
  const programId = await nextId('PRG')
  await prisma.program.create({ data: { id: programId, clientId, name: 'Cyber Security Capability Programme 2026 H2', cycle: '2026 H2', startDate: day(2026, 7, 1), endDate: day(2026, 12, 31), status: 'Active',
    description: 'Baseline survey, validation interviews, IDP segments S1–S5, monthly coaching and line-manager validation, 5-day cross-functional programme.' } })

  // ---------------------------------------------------------------- people
  const plan = TEAM.flatMap(([code, n]) => Array.from({ length: n }, () => code))
  const empIds = await nextIds('EMP', plan.length)
  const people: any[] = plan.map((code, i) => {
    const role = roles[code], def = ROLES.find((r) => r[0] === code)!
    const profile = code === 'KO-CISO' || code === 'KO-DIR-SO' ? 'solid' : i % 9 === 4 ? 'new' : pick(['star', 'solid', 'solid', 'specialist', 'developing', 'developing'])
    return { id: empIds[i], code, role, section: def[2], sen: def[3], profile, name: `${FIRST[i % FIRST.length]} ${LAST[(i * 7) % LAST.length]}` }
  })
  for (const [i, p] of people.entries()) {
    await prisma.employee.create({ data: {
      id: p.id, clientId, name: p.name, email: `${p.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z ]/g, '').replace(/ /g, '.')}@${DOMAIN}`,
      employeeNumber: `KO-${40100 + i}`, jobTitle: p.role.name, jobRoleId: p.role.id,
      grade: { Entry: 'B5', Mid: 'B6', Senior: 'B7', Lead: 'B8', Manager: 'B9', Head: 'B10', Executive: 'B12' }[p.sen as Sen],
      division: 'Technology & Digital', department: 'Global Cyber Security', section: p.section, businessUnit: 'Global Technology', location: i < 2 ? 'Atlanta, US' : pick(LOCATIONS),
      status: 'Active', ...audit('Excel from client'),
    } })
  }
  const first = (code: string) => people.find((p) => p.code === code)?.id
  const managerOf = (p: any) => {
    if (p.code === 'KO-CISO') return null
    if (['KO-DIR-SO', 'KO-GRC-MGR'].includes(p.code)) return first('KO-CISO')
    if (['KO-SOC-MGR', 'KO-OT-LD', 'KO-ARCH', 'KO-BCM'].includes(p.code)) return first('KO-DIR-SO')
    if (['KO-SOC-LD', 'KO-IR-LD'].includes(p.code)) return first('KO-SOC-MGR')
    if (p.section === 'Security Operations') return first('KO-SOC-LD')
    if (p.section === 'Threat Intelligence & Incident Response') return first('KO-IR-LD')
    if (p.section === 'OT Security') return first('KO-OT-LD')
    if (p.section === 'Cloud & Identity' || p.section === 'Application Security') return first('KO-ARCH')
    return first('KO-GRC-MGR')
  }
  for (const p of people) { p.managerId = managerOf(p); if (p.managerId) await prisma.employee.update({ where: { id: p.id }, data: { lineManagerId: p.managerId } }) }

  // segment content by section
  const segCert: Record<string, string> = { 'Security Operations': 'CYSA', 'Threat Intelligence & Incident Response': 'GCIH', 'OT Security': 'GICSP', 'Cloud & Identity': 'CCSP', 'Application Security': 'CSSLP', 'GRC & Third-Party Risk': 'CRISC', 'Awareness & Resilience': 'CBCI', 'CISO Office': 'CCISO' }
  const deptNeed: Record<string, string> = {
    'Security Operations': 'Department need: OT alert triage playbook for plant networks', 'Threat Intelligence & Incident Response': 'Department need: ransomware tabletop with bottling-plant scenario',
    'OT Security': 'Department need: IEC 62443 zone and conduit assessment of one plant', 'Cloud & Identity': 'Department need: privileged access review automation',
    'Application Security': 'Department need: secure SDLC gates for the consumer apps', 'GRC & Third-Party Risk': 'Department need: third-party risk tiering for bottling partners',
    'Awareness & Resilience': 'Department need: phishing simulation programme for plant staff', 'CISO Office': 'Department need: board-level cyber risk reporting',
  }
  const progressLabel = ['', '1 - Not Started / No Exposure', '2 - Limited progress or competence', '3 - On Track', '4 - Good Effort', '5 - Fully Achieved']

  // ---------------------------------------------------------------- per person: enrolment, assessments, IDP, certs, coaching, validations, evidence
  for (const [i, p] of people.entries()) {
    const enrId = await nextId('ENR')
    const coach = coaches[i % 2], consultant = consultants[i % 2]
    await prisma.enrollment.create({ data: { id: enrId, employeeId: p.id, programId, batch: i % 2 ? 'Cohort B' : 'Cohort A', coachId: coach, consultantId: consultant, startDate: day(2026, 7, 1), endDate: day(2026, 12, 31), status: 'Active', ...audit() } })
    p.enrId = enrId; p.coach = coach

    // baseline survey + validation interview
    const reqs = p.role.requirements as any[]
    const selfId = await nextId('ASM'), valId = await nextId('ASM')
    const surveyDate = addDays(day(2026, 7, 6), Math.floor(rnd() * 7)), interviewDate = addDays(surveyDate, 12 + Math.floor(rnd() * 10))
    await prisma.assessment.create({ data: { id: selfId, employeeId: p.id, enrollmentId: enrId, type: 'Self-Assessment', date: surveyDate, status: 'Completed', jobRoleId: p.role.id, summary: 'Baseline survey (Lexonis self-rating).', ...audit('Excel from client') } })
    const delivered = rnd() < 0.85
    await prisma.assessment.create({ data: { id: valId, employeeId: p.id, enrollmentId: enrId, type: 'Validation Interview', date: interviewDate, status: 'Completed', reportStatus: delivered ? 'Delivered' : 'In Review', jobRoleId: p.role.id, assessorId: consultant, summary: 'Validated in a 60-minute structured interview against the Lexonis framework and technical skills.', ...audit('Meeting / interview') } })
    const levels: Record<string, number> = {}
    // The interview also rates what the next role needs, so next-role readiness can be calculated
    const nextCode = ROLES.find((r) => r[0] === p.code)![4]
    const nextOnly = nextCode ? (roles[nextCode].requirements as any[]).filter((nr) => !reqs.some((r) => r.competencyId === nr.competencyId)) : []
    for (const nr of nextOnly) {
      const c = Object.values(comp).find((x: any) => x.id === nr.competencyId)
      const lvl = clamp(Math.round(nr.requiredLevel - 1 + PROFILES[p.profile] + rnd() * 0.9), c.minLevel, c.maxLevel)
      await prisma.assessmentRating.create({ data: { id: await nextId('RAT'), assessmentId: valId, competencyId: nr.competencyId, level: lvl, comment: `Rated for the next role (${roles[nextCode!].name}).` } })
    }
    const r1 = await nextIds('RAT', reqs.length), r2 = await nextIds('RAT', reqs.length)
    for (const [k, r] of reqs.entries()) {
      const c = Object.values(comp).find((x: any) => x.id === r.competencyId)
      const scale = c.maxLevel - c.minLevel
      const tech = c.maxLevel === 5
      const off = PROFILES[p.profile] * (scale / 4) + (p.profile === 'specialist' && tech ? 0.8 : 0)
      const lvl = clamp(Math.round(r.requiredLevel + off + (rnd() - 0.55) * (tech ? 1.6 : 1.2)), c.minLevel, c.maxLevel)
      levels[r.competencyId] = lvl
      await prisma.assessmentRating.create({ data: { id: r1[k], assessmentId: selfId, competencyId: r.competencyId, level: clamp(lvl + (rnd() < 0.5 ? 1 : 0), c.minLevel, c.maxLevel), requiredLevel: r.requiredLevel, priority: r.priority } })
      await prisma.assessmentRating.create({ data: { id: r2[k], assessmentId: valId, competencyId: r.competencyId, level: lvl, requiredLevel: r.requiredLevel, priority: r.priority } })
    }
    // focus skills = biggest weighted gaps
    const w = (pr: string) => (pr === 'High' ? 3 : pr === 'Medium' ? 2 : 1)
    const focus = reqs.map((r) => ({ r, gap: r.requiredLevel - levels[r.competencyId] })).filter((g) => g.gap > 0).sort((a, b) => b.gap * w(b.r.priority) - a.gap * w(a.r.priority)).slice(0, 2)
    p.focus = focus

    // IDP segments S1–S5 + department need
    const certCode = p.sen === 'Entry' ? 'SECPLUS' : segCert[p.section]
    const aiCode = p.section.startsWith('GRC') || p.section === 'CISO Office' ? 'AIGP' : pick(['AI900', 'AWSAI', 'AI102'])
    const segs: { title: string; type: string; hours: number; courseId?: string; certId?: string; compCode?: string }[] = [
      { title: `S1 · Professional certification: ${certs[certCode].name}`, type: 'Learning Plan Segment', hours: 60, certId: certs[certCode].id },
      { title: 'S2 · Immersive labs: role learning path', type: 'Learning Plan Segment', hours: 20, courseId: IMM.id },
      { title: `S3 · AI certification: ${certs[aiCode].name}`, type: 'Learning Plan Segment', hours: 15, certId: certs[aiCode].id },
      { title: 'S4 · SAP SuccessFactors: role curriculum', type: 'Learning Plan Segment', hours: 8, courseId: SAP.id },
      { title: 'S5 · Cross-functional training: Cross-Functional Leadership Programme', type: 'Learning Plan Segment', hours: 30, courseId: XFLP.id },
      { title: deptNeed[p.section], type: 'Department Training Need', hours: 12 },
    ]
    const segIds: string[] = []
    for (const [k, s] of segs.entries()) {
      const st = k === 4 ? (p.sen === 'Entry' ? 'Planned' : 'Completed') : pick(['Completed', 'In Progress', 'In Progress', 'In Progress', 'Not Started', 'Deferred'])
      const prog = st === 'Completed' ? 100 : st === 'Not Started' ? 0 : st === 'Planned' ? 0 : st === 'Deferred' ? 10 : 20 + Math.floor(rnd() * 60)
      const id = await nextId('IDP')
      segIds.push(id)
      await prisma.idpAction.create({ data: {
        id, employeeId: p.id, enrollmentId: enrId, actionType: s.type, title: s.title, courseId: s.courseId, certificationId: s.certId, owner: p.name, estimatedHours: s.hours,
        plannedStart: day(2026, 8, 1), plannedEnd: k === 5 ? day(2026, 11, 30) : addDays(day(2026, 9, 15), k * 20), status: st, progressPct: prog,
        actualStart: st === 'Not Started' || st === 'Planned' ? null : day(2026, 8, 3), actualEnd: st === 'Completed' ? addDays(day(2026, 9, 1), Math.floor(rnd() * 40)) : null,
        comments: st === 'Deferred' ? 'Deferred: incident workload in Q3.' : null, ...audit(),
      } })
      ;(segs[k] as any).status = st
    }
    // workplace assignments for the focus skills (coach validation "Workplace application assessment")
    const tasks: Record<string, string> = {
      'LEX-CYB-01': 'Draft the OT patching standard and get sign-off from two plant managers', LXSCN0055: 'Run the monthly security update with the bottling-plant operations leads',
      LXSCN0032: 'Present the quarterly SOC metrics to the IT leadership team', LXSCN0019: 'Own triage decisions on the night shift for two weeks, reviewed by the lead',
      LXSCN0036: 'Write the incident summary for the next P2 incident for a non-technical audience', LXSCN0031: 'Lead the root-cause analysis of a recurring alert',
    }
    for (const g of focus) {
      const c = Object.values(comp).find((x: any) => x.id === g.r.competencyId)
      await prisma.idpAction.create({ data: { id: await nextId('IDP'), employeeId: p.id, enrollmentId: enrId, competencyId: c.id, actionType: 'Project Assignment',
        title: `Workplace assignment: ${tasks[c.code] ?? `stretch task to practise ${c.name.toLowerCase()} on a live ${p.section.toLowerCase()} case`}`, owner: 'Coach', plannedStart: day(2026, 8, 20), plannedEnd: day(2026, 11, 15),
        status: 'In Progress', progressPct: 30 + Math.floor(rnd() * 50), comments: `Target level ${g.r.requiredLevel} (now ${levels[c.id]}). Task assigned to coachee.`, ...audit() } })
    }

    // certifications for S1 and S3
    for (const [k, code] of [[0, certCode], [2, aiCode]] as [number, string][]) {
      const st = (segs[k] as any).status
      const cst = st === 'Completed' ? 'Completed' : st === 'Not Started' ? 'Not Started' : st === 'Deferred' ? 'Deferred' : pick(['In Progress', 'Registered', 'Exam Scheduled'])
      await prisma.certificationRecord.create({ data: {
        id: await nextId('CER'), employeeId: p.id, certificationId: certs[code].id, enrollmentId: enrId, idpActionId: segIds[k], assignedDate: day(2026, 8, 1), targetDate: k === 0 ? day(2026, 12, 15) : day(2026, 11, 30),
        status: cst, examDate: cst === 'Exam Scheduled' || cst === 'Completed' ? addDays(day(2026, 9, 10), Math.floor(rnd() * 70)) : null,
        completionDate: cst === 'Completed' ? addDays(day(2026, 9, 10), Math.floor(rnd() * 35)) : null, result: cst === 'Completed' ? 'Pass' : null, ...audit(),
      } })
    }

    // self-paced S2 / S4 training records
    for (const [k, c] of [[1, IMM], [3, SAP]] as [number, any][]) {
      const st = (segs[k] as any).status
      await prisma.trainingRecord.create({ data: { id: await nextId('TRN'), employeeId: p.id, courseId: c.id, idpActionId: segIds[k], assignedDate: day(2026, 8, 1),
        startDate: st === 'Not Started' ? null : day(2026, 8, 5), completionDate: st === 'Completed' ? addDays(day(2026, 9, 1), Math.floor(rnd() * 40)) : null,
        status: st === 'Completed' ? 'Completed' : st === 'Not Started' ? 'Not Started' : st === 'Deferred' ? 'Deferred' : 'In Progress',
        completionPct: st === 'Completed' ? 100 : st === 'Not Started' ? 0 : 20 + Math.floor(rnd() * 60), hours: st === 'Completed' ? c.durationHours : null, ...audit('LMS / platform export') } })
    }

    // coaching: monthly, with the coaching-table times and segment notes
    let d = addDays(day(2026, 7, 27), i % 6), prog = 10
    for (let n = 0; d <= TODAY; n++, d = addDays(d, 28 + Math.floor(rnd() * 6))) {
      const start = 9 * 60 + 30 * Math.floor(rnd() * 14)
      const dur = n === 0 ? 60 : pick([45, 45, 60])
      prog = clamp(prog + 10 + Math.floor(rnd() * 10) + (p.profile === 'star' ? 5 : p.profile === 'developing' ? -4 : 0), 0, 100)
      const noShow = n > 0 && rnd() < 0.05
      const segNote = (k: number, txt: string) => `S${k + 1}: ${txt}`
      await prisma.coachingSession.create({ data: {
        id: await nextId('COA'), employeeId: p.id, enrollmentId: enrId, coachId: coach, date: d, type: n === 0 ? 'Kick-off' : n === 2 ? 'Capability Review' : 'Monthly Check-In',
        startTime: hhmm(start), endTime: hhmm(start + dur), prepMinutes: pick([15, 20, 30]), durationMinutes: noShow ? null : dur, reportingMinutes: noShow ? 5 : pick([15, 20]),
        status: noShow ? 'No-show' : 'Completed', progressPct: noShow ? null : prog,
        summary: noShow ? null : n === 0 ? 'Walked through the validation report, agreed the IDP segments S1–S5 and two focus skills.'
          : [segNote(0, pick(['study plan on track, practice exam 72%', 'exam booked', 'behind plan, re-scheduled study blocks'])), segNote(1, pick(['3 of 6 lab modules done', 'lab path completed', 'labs not started yet'])),
            segNote(2, pick(['AI cert course 50% done', 'AI cert passed', 'not started'])), segNote(3, pick(['SuccessFactors curriculum complete', '2 modules left'])), segNote(4, pick(['attended all 5 days', 'applied S4 presentation skills in team meeting', 'not yet scheduled']))].join(' · '),
        challenges: !noShow && rnd() < 0.4 ? pick(['Incident workload during Q3 peak season.', 'Line manager availability for the workplace assignment.', 'Shift pattern makes study time hard.']) : null,
        actionItems: noShow ? 'Re-book the session.' : pick(['Book the exam date.', 'Finish two lab modules before next check-in.', 'Share the draft standard with the line manager.', 'Present findings at the team stand-up.']),
        nextReviewDate: addDays(d, 30), evidenceSubmitted: !noShow && rnd() < 0.5, ...audit(),
      } })
    }

    // coach validation per behaviour descriptor (evidence) + monthly line-manager validation per focus skill
    for (const g of focus) {
      const c = Object.values(comp).find((x: any) => x.id === g.r.competencyId)
      const descs = await prisma.competencyBehavior.findMany({ where: { competencyId: c.id, level: { gte: 1 } }, orderBy: { level: 'asc' } })
      for (const [k, bd] of descs.entries()) {
        const progress = clamp(Math.round(4 - k * 0.8 + PROFILES[p.profile] + (rnd() - 0.5)), 1, 5)
        await prisma.evidence.create({ data: {
          id: await nextId('EVD'), employeeId: p.id, competencyId: c.id, evidenceType: progress >= 4 ? 'Project' : 'Manager Validation', date: addDays(day(2026, 9, 25), Math.floor(rnd() * 20)),
          title: `Behaviour descriptor ${k + 1} · ${c.name}: ${progressLabel[progress]}`,
          description: `${bd.description} Progress ${progress}/5. Evidence: ${pick(['artefact reviewed by coach', 'line manager confirmed in review meeting', 'observed during workplace assignment', 'document in shared drive'])}.`,
          submittedBy: 'Coach', verificationStatus: progress >= 3 ? 'Verified' : 'Under Review', verifiedById: coach, ...audit(),
        } })
      }
      let prog2 = clamp(1 + (p.profile === 'star' ? 1 : 0), 1, 5)
      for (const md of [day(2026, 8, 20), day(2026, 9, 20), day(2026, 10, 20)]) {
        if (md > TODAY) break
        await prisma.managerValidation.create({ data: {
          id: await nextId('VAL'), employeeId: p.id, assessmentId: valId, competencyId: c.id, managerId: p.managerId, managerName: p.managerId ? null : 'Board Risk Committee', date: md,
          status: 'Approved', validatedLevel: prog2, evidenceReviewed: 'Coach task review + workplace assignment output',
          comments: `Monthly progress on ${c.name}: ${progressLabel[prog2]}.`, ...audit('Email from client'),
        } })
        prog2 = clamp(prog2 + (rnd() < 0.75 ? 1 : 0), 1, 5)
      }
    }
    // manager sign-off of the interview
    if (p.managerId) await prisma.managerValidation.create({ data: { id: await nextId('VAL'), employeeId: p.id, assessmentId: valId, managerId: p.managerId, date: addDays(interviewDate, 10),
      status: delivered ? (rnd() < 0.85 ? 'Approved' : 'Requires Further Evidence') : 'Pending', comments: delivered ? 'Agree with the validated levels.' : null, ...audit('Email from client') } })
  }

  // ---------------------------------------------------------------- sessions
  const params = await prisma.observationParameter.findMany({ orderBy: { sortOrder: 'asc' } })
  const NOTES = ['Strong contribution in the group task; quieter in plenary.', 'Clear storyline in S3; needs to shorten messages.', 'Took ownership of the MOM in S2 and followed up next day.',
    'Struggled with structure in S4; improved after feedback.', 'Excellent problem framing in S5; led the team to a decision.', 'Supports others well; could challenge more.']
  const mkSession = async (c: any, start: Date, trainer: string, who: any[], observed: boolean, limited: Set<string> = new Set()) => {
    const sesId = await nextId('SES')
    const days = c.days ?? 1
    const end = addDays(start, days - 1)
    const status = end < TODAY ? 'Completed' : start <= TODAY ? 'In Progress' : 'Scheduled'
    await prisma.courseSession.create({ data: { id: sesId, courseId: c.id, programId, batch: 'Global Cyber Security', startDate: start, endDate: end, trainerId: staff[trainer],
      location: c.deliveryMode === 'In-person' ? 'Coca-Cola HQ, Atlanta (Security Ops Center)' : 'Online', mode: c.deliveryMode, status, ...audit() } })
    for (const p of who) {
      const absent = limited.has(p.id) ? 3 : 0
      const held = status === 'Completed' ? days : status === 'In Progress' ? Math.floor((TODAY.getTime() - start.getTime()) / 86400000) + 1 : 0
      const seg = await prisma.idpAction.findFirst({ where: { employeeId: p.id, courseId: c.id } })
      const trnId = await nextId('TRN')
      await prisma.trainingRecord.create({ data: { id: trnId, employeeId: p.id, courseId: c.id, sessionId: sesId, idpActionId: seg?.id, assignedDate: day(2026, 8, 15),
        startDate: status === 'Scheduled' ? null : start, completionDate: status === 'Completed' && !absent ? end : null,
        status: status === 'Scheduled' ? 'Assigned' : status === 'In Progress' ? 'In Progress' : absent ? 'Incomplete' : 'Completed',
        attendancePct: held ? Math.round(((held - Math.min(absent, held)) / held) * 100) : null, hours: status === 'Completed' && !absent ? c.durationHours : null,
        score: status === 'Completed' && !observed ? Math.round(62 + rnd() * 36) : null, comments: absent ? 'Limited attendance: excluded from high-potential ranking.' : null, ...audit('Trainer sheet') } })
      if (!observed) continue
      for (let dn = 1; dn <= held; dn++) {
        const isAbsent = absent && dn > days - absent
        const obsId = await nextId('OBS')
        const base = 2.9 + PROFILES[p.profile] * 0.9 + (dn - 1) * 0.15
        await prisma.observationDay.create({ data: { id: obsId, trainingRecordId: trnId, dayNumber: dn, date: addDays(start, dn - 1), attendance: isAbsent ? 'Absent' : 'Present', observerId: staff[trainer],
          potentialNote: isAbsent ? null : base > 3.5 ? pick(['High potential', 'Promising']) : base < 2.5 ? pick(['Needs support', 'At risk']) : 'Steady',
          notes: isAbsent ? null : `Day ${dn} (${['S1 Team Collaboration', 'S2 Accountability & MOM', 'S3 Storytelling', 'S4 Presentation Skills', 'S5 Problem Solving'][dn - 1] ?? ''}): ${pick(NOTES)}`, ...audit('Trainer sheet') } })
        if (isAbsent) continue
        const ids = await nextIds('OSC', params.length)
        await prisma.observationScore.createMany({ data: params.map((pa, k) => ({ id: ids[k], observationDayId: obsId, parameterId: pa.id, score: clamp(Math.round(base + (rnd() - 0.5) * 1.8), 1, 5) })) })
      }
    }
  }
  const leaders = people.filter((p) => ['Senior', 'Lead', 'Manager'].includes(p.sen))
  const limited = new Set([leaders[leaders.length - 1]?.id].filter(Boolean))
  await mkSession(XFLP, day(2026, 9, 14), 'Leila Haddad', leaders, true, limited)
  await mkSession(XFLP, day(2026, 10, 19), 'David Chen', people.filter((p) => p.sen === 'Mid').slice(0, 10), true)
  await mkSession(courses['SIEM'], day(2026, 9, 22), 'Marko Ilić', people.filter((p) => p.section === 'Security Operations' && ['Entry', 'Mid'].includes(p.sen)), false)
  await mkSession(OTF, day(2026, 10, 7), 'Marko Ilić', people.filter((p) => p.section === 'OT Security' || p.code === 'KO-IR-LD' || p.code === 'KO-SOC-LD'), false)
  await mkSession(courses['CAP'], day(2026, 10, 13), 'Leila Haddad', people.filter((p) => p.section === 'Cloud & Identity'), false)
  await mkSession(courses['RSK'], day(2026, 11, 10), 'Leila Haddad', people.filter((p) => p.section === 'GRC & Third-Party Risk' || p.section === 'Awareness & Resilience'), false)

  await syncCounters()
  console.log(`${CLIENT}: ${people.length} people, ${ROLES.length} role profiles, Lexonis framework (${LEXONIS.length} competencies), 6 sessions, IDP segments, coaching, monthly validations and evidence.`)
}

await prepareDatabase()
if (process.argv.includes('--remove')) await remove()
else await create()
await prisma.$disconnect()
