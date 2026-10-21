// Writes docs/LIBRARY.md: everything the app is preloaded with (npm run docs:library).
import fs from 'node:fs'
import path from 'node:path'
import { ROOT } from './env.mjs'
import { LOOKUP_LISTS } from '../shared/lookups.ts'
import { FRAMEWORKS, CATEGORIES, COMPETENCIES, LEVEL_TEMPLATES, JOB_ROLES, roleRequirements, COURSES, CERTIFICATIONS, OBSERVATION_PARAMETERS, type Seniority } from '../server/seed/library.ts'

const esc = (s: unknown) => String(s ?? '').replace(/\|/g, '\\|')
const out: string[] = []
const w = (s = '') => out.push(s)
const name = Object.fromEntries(COMPETENCIES.map((c) => [c[0], c[1]]))

w('# Preloaded library')
w()
w('Everything `npm run db:seed` loads. All of it can be edited in the app on **Library**. Generated from `server/seed/library.ts` and `shared/lookups.ts` by `npm run docs:library` — do not edit by hand.')
w()
w(`**Totals:** ${FRAMEWORKS.length} frameworks · ${CATEGORIES.length} categories · ${COMPETENCIES.length} competencies · ${COMPETENCIES.reduce((n, c) => n + (CATEGORIES.find((k) => k.code === c[0].slice(0, 3))!.framework === 'LEAD' ? 5 : 6), 0)} level indicators · ${JOB_ROLES.length} job roles · ${JOB_ROLES.reduce((n, r) => n + roleRequirements(r[2], r[3] as Seniority).length, 0)} role requirements · ${COURSES.length} courses · ${CERTIFICATIONS.length} certifications · ${OBSERVATION_PARAMETERS.length} observed behaviours · ${LOOKUP_LISTS.length} dropdown lists (${LOOKUP_LISTS.reduce((n, l) => n + l.values.length, 0)} values)`)
w()
w('> Descriptions and level indicators are starter text. The 16 original leadership competencies and the 25 observed behaviours come from the client\'s workbooks; the technical competencies and all lists come from the Master Data Dictionary. Replace the wording with the client\'s framework when it is available.')
w()
w('## Contents')
for (const h of ['Dropdown lists', 'Frameworks and categories', 'Competencies', 'Level indicators', 'Job roles and requirements', 'Courses', 'Certifications', 'Observed behaviours']) w(`- [${h}](#${h.toLowerCase().replace(/ /g, '-')})`)
w()

w('## Dropdown lists')
w()
w('| List | Used for | Values |')
w('| --- | --- | --- |')
for (const l of LOOKUP_LISTS) w(`| **${l.label}** \`${l.key}\` | ${esc(l.description)} | ${l.values.map((v) => (Array.isArray(v) ? v[0] : v)).map(esc).join(' · ')} |`)
w()

w('## Frameworks and categories')
w()
for (const f of FRAMEWORKS) {
  w(`**${f.name}** (\`${f.code}\`, scale ${f.scaleMin}–${f.scaleMax}) — ${f.description}`)
  w()
  for (const c of CATEGORIES.filter((x) => x.framework === f.code)) w(`- \`${c.code}\` ${c.name} — ${COMPETENCIES.filter((x) => x[0].startsWith(c.code)).length} competencies`)
  w()
}

w('## Competencies')
w()
for (const cat of CATEGORIES) {
  w(`### ${cat.name}`)
  w()
  w('| Code | Competency | Description | How it is assessed |')
  w('| --- | --- | --- | --- |')
  for (const c of COMPETENCIES.filter((x) => x[0].startsWith(cat.code))) w(`| \`${c[0]}\` | **${esc(c[1])}** | ${esc(c[2])} | ${esc(c[4])} |`)
  w()
}

w('## Level indicators')
w()
w('Every competency gets one indicator per level, built from its behaviour phrase. Leadership competencies use levels 1–5; technical ones 0–5 (0 = no exposure yet).')
w()
w('| Level | Pattern |')
w('| --- | --- |')
for (const l of [0, 1, 2, 3, 4, 5]) w(`| ${l} | ${esc(LEVEL_TEMPLATES[l]('…'))} |`)
w()
w('| Code | Behaviour phrase (fills the "…") |')
w('| --- | --- |')
for (const c of COMPETENCIES) w(`| \`${c[0]}\` ${esc(c[1])} | ${esc(c[3])} |`)
w()

w('## Job roles and requirements')
w()
w('Required levels are defaults by seniority (soft skills rise from 2 for Entry to 5 for Executive; technical skills peak at Senior/Lead). Edit them per role on Library → Role requirements.')
w()
w('| Code | Role | Family | Seniority | Next role | Requirements (level, priority) |')
w('| --- | --- | --- | --- | --- | --- |')
const roleName = Object.fromEntries(JOB_ROLES.map((r) => [r[0], r[1]]))
for (const [code, n, family, sen, next] of JOB_ROLES) {
  const reqs = roleRequirements(family, sen as Seniority)
  w(`| \`${code}\` | **${esc(n)}** | ${esc(family)} | ${sen} | ${next ? esc(roleName[next]) : '—'} | ${reqs.map((r) => `${name[r.code]} ${r.level}${r.priority === 'High' ? ' ★' : r.priority === 'Low' ? '' : ''}`).join(' · ')} |`)
}
w()
w('★ = High priority.')
w()

w('## Courses')
w()
w('| Code | Course | Type | Delivery | Hours | Days | Observed | Builds |')
w('| --- | --- | --- | --- | --- | --- | --- | --- |')
for (const c of COURSES) w(`| \`${c[0]}\` | **${esc(c[1])}** | ${c[2]} | ${c[4]} | ${c[5]} | ${c[6]} | ${c[8] ? 'Yes' : ''} | ${c[9].map((x) => name[x]).join(', ')} |`)
w()

w('## Certifications')
w()
w('| Code | Certification | Provider | Track | Difficulty | Valid (months) | Proves |')
w('| --- | --- | --- | --- | --- | --- | --- |')
for (const c of CERTIFICATIONS) w(`| \`${c[0]}\` | **${esc(c[1])}** | ${esc(c[2])} | ${c[3]} | ${c[4]} | ${c[5] ?? '—'} | ${c[6].map((x) => name[x]).join(', ')} |`)
w()

w('## Observed behaviours')
w()
w('Scored 1–5 by trainers on every day of an observed course. Each one is evidence for one competency.')
w()
w('| Code | Behaviour | Category | Evidence for | What to look for |')
w('| --- | --- | --- | --- | --- |')
for (const p of OBSERVATION_PARAMETERS) w(`| \`${p[0]}\` | **${esc(p[1])}** | ${p[2]} | ${name[p[3]]} | ${esc(p[4])} |`)
w()

fs.mkdirSync(path.join(ROOT, 'docs'), { recursive: true })
fs.writeFileSync(path.join(ROOT, 'docs', 'LIBRARY.md'), out.join('\n'))
console.log(`Wrote docs/LIBRARY.md (${out.length} lines)`)
