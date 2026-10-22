// Writes docs/LIBRARY.md: the standard reference library `npm run db:seed` loads (npm run docs:library).
// Source: server/seed/library/*.json and shared/lookups.ts. Do not edit LIBRARY.md by hand.
import fs from 'node:fs'
import path from 'node:path'
import { ROOT } from './env.mjs'
import { LOOKUP_LISTS } from '../shared/lookups.ts'

const DIR = path.join(ROOT, 'server', 'seed', 'library')
const read = (f: string) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'))
const F = read('frameworks.json'), C = read('competencies.json').competencies as any[], B = read('behaviors.json').behaviors as any[]
const R = read('roles.json'), K = read('catalogue.json'), O = read('observation.json'), RR = read('riskRules.json').riskRules as any[]
const VA = read('valueAssumptions.json').assumptions as any[], KPI = read('kpiCatalogue.json').kpis as any[]

const esc = (s: unknown) => String(s ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ')
const cut = (s: unknown, n = 160) => { const t = esc(s); return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t }
const out: string[] = []
const w = (s = '') => out.push(s)
const compName = new Map<string, string>(C.map((c) => [c.code, c.name]))
const SECTIONS = ['Totals', 'Dropdown lists', 'Frameworks and categories', 'Competencies', 'Level indicators', 'Role profiles', 'Role requirements', 'Courses and programmes', 'Lab collections', 'Certifications', 'Observed behaviours', 'Risk and opportunity rules', 'Value assumptions', 'KPI catalogue', 'Starter library (demos only)']
const anchor = (h: string) => h.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/ /g, '-')

w('# Reference library')
w()
w('Everything `npm run db:seed` loads into a new or existing database. All of it can be edited in the app on **Library**, and every row keeps a stable code, so the seed can be run again at any time: it only adds what is missing (`npm run db:seed -- --update` also overwrites the text of existing rows).')
w()
w('Generated from `server/seed/library/*.json` and `shared/lookups.ts` by `npm run docs:library`. Do not edit by hand.')
w()
w('## Contents')
for (const h of SECTIONS) w(`- [${h}](#${anchor(h)})`)
w()

// ------------------------------------------------------------------ totals
const extraCourses = 1 + K.bootCamps.length + 1 + K.labCollections.length
w('## Totals')
w()
w('| What | Rows | Where in the app |')
w('| --- | ---: | --- |')
w(`| Dropdown lists | ${LOOKUP_LISTS.length} lists, ${LOOKUP_LISTS.reduce((n, l) => n + l.values.length, 0)} values | Library → Dropdowns |`)
w(`| Frameworks | ${F.frameworks.length} | Library → Frameworks |`)
w(`| Competency categories | ${F.categories.length} | Library → Categories |`)
w(`| Competencies | ${C.length} | Library → Competencies |`)
w(`| Level indicators (behaviour descriptors) | ${B.length.toLocaleString('en')} | Library → Level indicators |`)
w(`| Role profiles | ${R.roles.length} with requirements + ${R.rolesWithoutProfile.length} job titles without requirements yet | Library → Job roles |`)
w(`| Role requirements | ${R.requirements.length} | Library → Role requirements |`)
w(`| Courses | ${K.courses.length + extraCourses} (${K.courses.length} catalogue courses, 1 observed programme, ${K.bootCamps.length} boot camps, 1 LMS curriculum, ${K.labCollections.length} lab collections) | Library → Courses |`)
w(`| Certifications | ${K.certifications.length} | Library → Certifications |`)
w(`| Observed behaviours | ${O.parameters.length} | Library → Observed behaviours |`)
w(`| Risk and opportunity rules | ${RR.length} | Library → Risk rules |`)
w(`| Value assumptions | ${VA.length} | Library → Value assumptions, Value page |`)
w(`| KPI catalogue | ${KPI.length} KPIs (read-only reference) | Value → KPI scorecard |`)
w()

// ------------------------------------------------------------------ lists
w('## Dropdown lists')
w()
w('Lists marked *suggest* are offered as suggestions on free-text fields (organisation units and grades differ per client); every other list is enforced.')
w()
w('| List | Used for | Values |')
w('| --- | --- | --- |')
for (const l of LOOKUP_LISTS) w(`| **${esc(l.label)}** \`${l.key}\` | ${esc(l.description)} | ${l.values.map((v) => (Array.isArray(v) ? v[0] : v)).map(esc).join(' · ')} |`)
w()

// ------------------------------------------------------------------ frameworks
w('## Frameworks and categories')
w()
for (const f of F.frameworks) {
  w(`**${esc(f.name)}** (\`${f.code}\`, scale ${f.scaleMin}–${f.scaleMax}${f.externalId ? `, external ID \`${f.externalId}\`` : ''}) — ${esc(f.description)}`)
  w()
  for (const c of F.categories.filter((x: any) => x.framework === f.code)) w(`- \`${c.code}\` ${esc(c.name)} — ${C.filter((x) => x.category === c.code).length} competencies`)
  w()
}

// ------------------------------------------------------------------ competencies
w('## Competencies')
w()
w('Codes like `AICI-001` are technical competencies; `LXSCN…` are cross-functional (behavioural) competencies and keep their source ID in *External ID*. *Indicators* is the number of level indicators, *Roles* the number of role profiles that require it.')
w()
for (const cat of F.categories) {
  const rows = C.filter((c) => c.category === cat.code)
  if (!rows.length) continue
  w(`### ${esc(cat.name)} (${rows.length})`)
  w()
  w('| Code | Competency | Levels | Indicators | Roles | Description |')
  w('| --- | --- | --- | ---: | ---: | --- |')
  for (const c of rows) w(`| \`${c.code}\` | **${esc(c.name)}** | ${c.minLevel}–${c.maxLevel} | ${c.indicatorCount} | ${c.roleCount} | ${cut(c.description)} |`)
  w()
}

// ------------------------------------------------------------------ indicators
w('## Level indicators')
w()
w(`${B.length.toLocaleString('en')} behaviour descriptors, each tied to one competency and one level. Codes follow \`<competency>-L<level>-<nn>\`; ${B.filter((b) => b.externalId).length} cross-functional ones also carry their source ID. Coaches validate progress (1–5) against a single descriptor on **Evidence**. The full text is in the app (Library → Level indicators) and in the Excel export (sheet CompetencyBehavior); below is the count per level.`)
w()
const levels = [...new Set(B.map((b) => b.level))].sort((a, b) => a - b)
w(`| Competency | ${levels.map((l) => `L${l}`).join(' | ')} | Total |`)
w(`| --- | ${levels.map(() => '---:').join(' | ')} | ---: |`)
for (const c of C) {
  const own = B.filter((b) => b.competency === c.code)
  if (!own.length) continue
  w(`| \`${c.code}\` ${esc(c.name)} | ${levels.map((l) => own.filter((b) => b.level === l).length || '').join(' | ')} | ${own.length} |`)
}
w()

// ------------------------------------------------------------------ roles
w('## Role profiles')
w()
w('Seniority is derived from the grade in the job title:')
w()
w(`${R.gradeSeniority.map((g: any) => `${g.grade} → ${g.seniority}`).join(' · ')}`)
w()
w('| Code | Role | Family | Seniority | Next role | Requirements (technical + cross-functional) |')
w('| --- | --- | --- | --- | --- | --- |')
for (const r of R.roles) w(`| \`${r.code}\` | **${esc(r.name)}** | ${esc(r.family)} | ${r.seniority} | ${esc(r.next) || '—'} | ${r.requirements} (${r.technical} + ${r.crossFunctional}) |`)
w()
w(`**Job titles without requirements yet** (loaded as ROLE-${String(R.roles.length + 1).padStart(2, '0')} onward so people can be linked; add requirements when the client provides them): ${R.rolesWithoutProfile.map(esc).join(' · ')}.`)
w()

w('## Role requirements')
w()
w('Required level per competency per role (623 pairs in the source, 620 loaded). Source priority 2 is the higher priority and is loaded as High; 3 is loaded as Medium (confirm with the client).')
w()
for (const r of R.roles) {
  const reqs = R.requirements.filter((q: any) => q.role === r.code)
  w(`<details><summary><b>${r.code}</b> ${esc(r.name)} — ${reqs.length} requirements</summary>`)
  w()
  w('| Competency | Level | Priority |')
  w('| --- | ---: | --- |')
  for (const q of reqs) w(`| \`${q.competency}\` ${esc(compName.get(q.competency))} | ${q.requiredLevel} | ${q.priority} |`)
  w()
  w('</details>')
  w()
}
if (R.requirementsMissingLevel?.length) {
  w(`Not loaded because the source has no required level: ${R.requirementsMissingLevel.map((q: any) => `${q.role} / ${q.competency}`).join(', ')}. Add them on Library → Role requirements once the level is known.`)
  w()
}

// ------------------------------------------------------------------ courses
w('## Courses and programmes')
w()
w('| Code | Course | Type | Delivery | Hours | Days | Observed |')
w('| --- | --- | --- | --- | ---: | ---: | --- |')
for (const c of K.courses) w(`| \`${c.code}\` | **${esc(c.name)}**${c.hoursProposed ? ' (hours proposed)' : ''} | ${c.type} | ${c.deliveryMode} | ${c.durationHours ?? ''} | ${c.days ?? ''} | ${c.observed ? 'Yes' : ''} |`)
w(`| \`XF-OBS-5D\` | **Cross-Functional Assessment Programme (5 days)** | Leadership Programme | In-person | | 5 | Yes |`)
K.bootCamps.forEach((b: any, i: number) => w(`| \`DTN-${String(i + 1).padStart(2, '0')}\` | **${esc(b.name)}** | Boot Camp | In-person | ${b.hours} | | |`))
w('| `LMS-S4` | **LMS learning curriculum (SAP SuccessFactors)** | Self Study | Self-paced | 8 | | |')
w()
w('**Observed programme days** (the observation grid shows these titles per day):')
w()
for (const d of K.observationProgramme) w(`- Day ${d.day}: ${esc(d.session)} — ${esc(d.workshop.replace(/^Day \d+ - /, ''))}`)
w()
w('**IDP segments** (Development plan → Segment; progress per segment on the coaching tracker):')
w()
w('| Segment | Label | Hours | Recorded as |')
w('| --- | --- | ---: | --- |')
for (const s of K.idpSegments) w(`| ${s.code} | ${esc(s.name)} | ${s.hours ?? ''} | ${esc(s.maps)} |`)
w()

w('## Lab collections')
w()
w('Loaded as courses of type Immersive Lab (code `LAB-<collection>`) with the number of labs, so a training record can hold *labs completed of total*.')
w()
w('| Code | Collection | Labs |')
w('| --- | --- | ---: |')
for (const l of K.labCollections) w(`| \`LAB-${l.code}\` | ${esc(l.name)} | ${l.labs} |`)
w()

// ------------------------------------------------------------------ certifications
w('## Certifications')
w()
w('*Other spellings* are the variants found in source registers; use them to match imported rows to the right certification.')
w()
w('| Code | Certification | Provider | Track | Other spellings |')
w('| --- | --- | --- | --- | --- |')
for (const c of K.certifications) w(`| \`${c.code}\` | **${esc(c.name)}** | ${esc(c.provider)} | ${c.track} | ${c.aliases.length ? c.aliases.map(esc).join('<br>') : ''} |`)
w()

// ------------------------------------------------------------------ observation
w('## Observed behaviours')
w()
w('Scored 1–5 by the trainer on every observed day. Each one is evidence for one cross-functional competency.')
w()
w('| Code | Behaviour | Domain | Evidence for | What to look for |')
w('| --- | --- | --- | --- | --- |')
for (const p of O.parameters) w(`| \`${p.code}\` | **${esc(p.name)}** | ${esc(p.category)} | \`${p.competency}\` ${esc(compName.get(p.competency))} | ${esc(p.description)} |`)
w()
w(`Interpretation when a behaviour is low: *${esc(O.parameterTexts.interpretationLow)}* Action: *${esc(O.parameterTexts.actionLow)}* When high: *${esc(O.parameterTexts.signalHigh)}*`)
w()

// ------------------------------------------------------------------ risk rules
w('## Risk and opportunity rules')
w()
w('Checked on every person page, on **Risks** and in the export (sheet Risk_Flags). The logic of each rule is fixed by its code; the threshold, severity and wording are read from Library → Risk rules and can be changed there. See [RISK_RULES.md](RISK_RULES.md) for how each rule is calculated.')
w()
w('| Code | Rule | Severity | Panel | Condition | Threshold | Action | Owner |')
w('| --- | --- | --- | --- | --- | --- | --- | --- |')
for (const r of RR) w(`| \`${r.code}\` | **${esc(r.name)}** | ${r.severity} | ${esc(r.panel)} | ${esc(r.rule)} | ${r.threshold ?? '—'} ${esc(r.thresholdUnit ?? '')} | ${esc(r.executiveAction)} | ${esc(r.owner)} |`)
w()

w('## Value assumptions')
w()
w('Rates behind the Value & ROI page ([VALUE.md](VALUE.md)). *Basis*: Fact = sourced figure, Estimate = derived from sourced figures, Assumption = placeholder to replace with the client figure.')
w()
w('| Code | Assumption | Value | Unit | Basis | Source |')
w('| --- | --- | ---: | --- | --- | --- |')
for (const a of VA) w(`| \`${a.code}\` | **${esc(a.name)}** | ${a.value} | ${esc(a.unit)} | ${a.basis} | ${esc(a.source)} |`)
w()

w('## KPI catalogue')
w()
w(`${KPI.length} KPIs from the market research, stored in \`server/seed/library/kpiCatalogue.json\`. *Available* is the research's own assessment of the data model; the Value page calculates every one it can.`)
w()
const audiences = [...new Set(KPI.map((k) => k.audience))]
w('| Audience | KPIs | Available today | Partly | Not yet |')
w('| --- | ---: | ---: | ---: | ---: |')
for (const a of audiences) { const ks = KPI.filter((k) => k.audience === a); w(`| ${esc(a)} | ${ks.length} | ${ks.filter((k) => k.availability === 'Yes').length} | ${ks.filter((k) => k.availability === 'Partly').length} | ${ks.filter((k) => k.availability === 'No').length} |`) }
w()
w('<details><summary>All KPIs</summary>')
w()
w('| ID | KPI | Audience | Formula | Available |')
w('| --- | --- | --- | --- | --- |')
for (const k of KPI) w(`| ${k.id} | ${esc(k.name)} | ${esc(k.audience)} | ${esc(k.formula)} | ${k.availability} |`)
w()
w('</details>')
w()

w('## Starter library (demos only)')
w()
w('`npm run db:demo` and `npm run db:coca-cola` also load the small starter library in `server/seed/starter-library.ts` (two frameworks, invented competencies with codes like `COM-01`, starter roles such as `SOC-T1`) because the demo people were built on it. A database for real client work only needs `npm run db:seed`.')
w()

fs.mkdirSync(path.join(ROOT, 'docs'), { recursive: true })
fs.writeFileSync(path.join(ROOT, 'docs', 'LIBRARY.md'), out.join('\n'))
console.log(`Wrote docs/LIBRARY.md (${out.length} lines)`)
