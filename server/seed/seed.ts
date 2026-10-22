// Loads the standard reference library from server/seed/library/*.json:
//   lists · 3 frameworks · 5 categories · 160 competencies · 3,244 level indicators · 41 role profiles
//   with 620 requirements · courses (workshops, observed programmes, boot camps, LMS learning, 12 lab
//   collections) · 39 certifications · 25 observed behaviours · 36 risk and opportunity rules.
//
//   npm run db:seed              add whatever is missing, leave existing rows alone
//   npm run db:seed -- --update  also overwrite existing rows with the library text
//
// Matching is by business key (code; list + value; role + competency), so it is safe to run again.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { prisma, prepareDatabase } from '../db.ts'
import { nextId, nextIds, syncCounters } from '../lib/ids.ts'
import { LOOKUP_LISTS } from '../../shared/lookups.ts'

const UPDATE = process.argv.includes('--update')
const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'library')
const read = (f: string) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'))

export const LIBRARY = {
  frameworks: read('frameworks.json'),
  competencies: read('competencies.json').competencies as any[],
  behaviors: read('behaviors.json').behaviors as any[],
  roles: read('roles.json'),
  catalogue: read('catalogue.json'),
  observation: read('observation.json'),
  riskRules: read('riskRules.json').riskRules as any[],
  valueAssumptions: read('valueAssumptions.json').assumptions as any[],
}

const counts: Record<string, { added: number; updated: number }> = {}
const tally = (t: string, k: 'added' | 'updated', n = 1) => { (counts[t] ??= { added: 0, updated: 0 })[k] += n }

/** Upsert many rows of one table by a business key. New rows get consecutive prefixed IDs. */
async function bulk(model: string, prefix: string, keyOf: (r: any) => string, rows: Record<string, unknown>[]): Promise<Map<string, string>> {
  const d = (prisma as any)[model]
  const existing = await d.findMany()
  const ids = new Map<string, string>(existing.map((r: any) => [keyOf(r), r.id]))
  const missing = rows.filter((r) => !ids.has(keyOf(r)))
  const newIds = await nextIds(prefix, missing.length)
  for (let i = 0; i < missing.length; i += 500) {
    const chunk = missing.slice(i, i + 500).map((r, j) => ({ id: newIds[i + j], ...r }))
    await d.createMany({ data: chunk })
  }
  missing.forEach((r, i) => ids.set(keyOf(r), newIds[i]))
  tally(model, 'added', missing.length)
  if (UPDATE) {
    for (const r of rows) {
      if (missing.includes(r)) continue
      await d.update({ where: { id: ids.get(keyOf(r)) }, data: r })
      tally(model, 'updated')
    }
  }
  return ids
}

const ROLE_FAMILY_BY_TITLE: [RegExp, string][] = [
  [/Threat Intelligence|Business Continuity/i, 'Business Continuity & Resilience'],
  [/Identity & Access/i, 'Identity & Access'],
  [/Engineering|Clouds|Infrastructure|Vulnerability/i, 'Infrastructure & Cloud Security'],
  [/Risk Management|Policies|Compliance|Information Security/i, 'Governance, Risk & Compliance'],
  [/OT Cybersecurity/i, 'OT Security'],
  [/Security Operations|Monitoring|Threat Hunting/i, 'Security Operations'],
]

export async function seedLibrary() {
  await prepareDatabase()
  await syncCounters()

  // ---------------------------------------------------------------- lists
  const listRows = LOOKUP_LISTS.flatMap((list) => list.values.map((v, i) => {
    const [value, description] = Array.isArray(v) ? v : [v, '']
    return { list: list.key, value, description: description || null, sortOrder: (i + 1) * 10 }
  }))
  await bulk('lookupValue', 'LKP', (r) => `${r.list}\u0000${r.value}`, listRows)

  // ---------------------------------------------------------------- frameworks, categories, competencies, level indicators
  const fw = await bulk('framework', 'FWK', (r) => r.code, LIBRARY.frameworks.frameworks.map((f: any) => ({
    code: f.code, name: f.name, description: f.description, scaleMin: f.scaleMin, scaleMax: f.scaleMax, externalId: f.externalId })))
  const cat = await bulk('competencyCategory', 'CAT', (r) => r.code, LIBRARY.frameworks.categories.map((c: any, i: number) => ({
    code: c.code, name: c.name, frameworkId: fw.get(c.framework), sortOrder: (i + 1) * 10, externalId: c.externalId })))
  const comp = await bulk('competency', 'CMP', (r) => r.code, LIBRARY.competencies.map((c: any, i: number) => ({
    code: c.code, name: c.name, categoryId: cat.get(c.category), description: c.description || null,
    minLevel: c.minLevel, maxLevel: c.maxLevel, externalId: c.externalId, sortOrder: (i + 1) * 10 })))
  await bulk('competencyBehavior', 'BHV', (r) => r.code, LIBRARY.behaviors.map((b: any) => ({
    code: b.code, competencyId: comp.get(b.competency), level: b.level, description: b.description, externalId: b.externalId })))

  // ---------------------------------------------------------------- role profiles and requirements
  const R = LIBRARY.roles
  const roleRows = R.roles.map((r: any) => ({ code: r.code, name: r.name, family: r.family, seniority: r.seniority,
    description: `Source job family: ${r.sourceFamily}. ${r.technical} technical and ${r.crossFunctional} cross-functional requirements.` }))
  R.rolesWithoutProfile.forEach((name: string, i: number) => {
    const seniority = /^Vice President/.test(name) ? 'Executive' : /^Department Manager/.test(name) ? 'Manager' : /^Section Head/.test(name) ? 'Lead' : 'Senior'
    roleRows.push({ code: `ROLE-${String(R.roles.length + i + 1).padStart(2, '0')}`, name, seniority,
      family: ROLE_FAMILY_BY_TITLE.find(([re]) => re.test(name))?.[1] ?? 'Security Leadership',
      description: 'Job title found in a client people register with no competency requirements yet. Add requirements, or map people to the nearest role profile.' })
  })
  const role = await bulk('jobRole', 'ROL', (r) => r.code, roleRows)
  const byName = new Map<string, string>(roleRows.map((r: any) => [r.name, r.code]))
  for (const r of R.roles) {
    if (!r.next) continue
    const next = role.get(byName.get(r.next)!)
    await prisma.jobRole.updateMany({ where: { id: role.get(r.code), ...(UPDATE ? {} : { nextRoleId: null }) }, data: { nextRoleId: next } })
  }
  await bulk('roleRequirement', 'REQ', (r) => `${r.jobRoleId}\u0000${r.competencyId}`, R.requirements.map((q: any) => ({
    jobRoleId: role.get(q.role), competencyId: comp.get(q.competency), requiredLevel: q.requiredLevel, priority: q.priority })))

  // ---------------------------------------------------------------- courses
  const C = LIBRARY.catalogue
  const courseRows: Record<string, unknown>[] = C.courses.map((c: any) => ({
    code: c.code, name: c.name, type: c.type, deliveryMode: c.deliveryMode, durationHours: c.durationHours, days: c.days, observed: c.observed,
    description: c.hoursProposed ? 'Personal Efficiency Performance (PEP) programme day. Hours are a proposal; confirm.' : null }))
  courseRows.push({
    code: 'XF-OBS-5D', name: 'Cross-Functional Assessment Programme (5 days)', type: 'Leadership Programme', deliveryMode: 'In-person', days: 5, observed: true,
    dayTitles: C.observationProgramme.map((d: any) => d.session).join('\n'),
    description: `Five observed days with a baseline survey before day 1. ${C.observationProgramme.map((d: any) => `Day ${d.day}: ${d.workshop.replace(/^Day \d+ - /, '')} (${d.module})`).join('; ')}.`,
  })
  C.bootCamps.forEach((b: any, i: number) => courseRows.push({
    code: `DTN-${String(i + 1).padStart(2, '0')}`, name: b.name, type: 'Boot Camp', deliveryMode: 'In-person', durationHours: b.hours, observed: false,
    description: 'Department training need (IDP part 2).' }))
  courseRows.push({ code: 'LMS-S4', name: 'LMS learning curriculum (SAP SuccessFactors)', type: 'Self Study', provider: 'SAP SuccessFactors', deliveryMode: 'Self-paced',
    durationHours: 8, observed: false, description: 'IDP segment S4: self-study courses on the client learning platform.' })
  C.labCollections.forEach((l: any) => courseRows.push({
    code: `LAB-${l.code}`, name: `Immersive Labs: ${l.name}`, type: 'Immersive Lab', provider: 'Immersive Labs', deliveryMode: 'Self-paced', labsTotal: l.labs, observed: false,
    description: `Hands-on lab collection ${l.code} (${l.labs} labs). IDP segment S2.` }))
  await bulk('course', 'CRS', (r) => r.code, courseRows)

  // ---------------------------------------------------------------- certifications
  await bulk('certification', 'CRT', (r) => r.code, C.certifications.map((c: any) => ({
    code: c.code, name: c.name, provider: c.provider || null, track: c.track, description: c.description || null,
    aliases: c.aliases.length ? c.aliases.join('\n') : null })))

  // ---------------------------------------------------------------- observed behaviours
  const O = LIBRARY.observation
  await bulk('observationParameter', 'OBP', (r) => r.code, O.parameters.map((p: any, i: number) => ({
    code: p.code, name: p.name, category: p.category, description: p.description, competencyId: comp.get(p.competency) ?? null, maxScore: 5,
    interpretationLow: O.parameterTexts.interpretationLow, actionLow: O.parameterTexts.actionLow, signalHigh: O.parameterTexts.signalHigh, sortOrder: (i + 1) * 10 })))

  // ---------------------------------------------------------------- risk rules
  await bulk('riskRule', 'RSK', (r) => r.code, LIBRARY.riskRules.map((r: any, i: number) => ({
    code: r.code, name: r.name, panel: r.panel, area: r.area, appliesTo: r.appliesTo, rule: r.rule, threshold: r.threshold, thresholdUnit: r.thresholdUnit,
    severity: r.severity, executiveAction: r.executiveAction, owner: r.owner, dataSource: r.dataSource, sortOrder: (i + 1) * 10 })))

  // ---------------------------------------------------------------- value & ROI assumptions
  await bulk('valueAssumption', 'VAL', (r) => r.code, LIBRARY.valueAssumptions.map((v: any, i: number) => ({
    code: v.code, name: v.name, group: v.group, value: v.value, unit: v.unit ?? null, basis: v.basis, source: v.source || null, note: v.note || null, sortOrder: (i + 1) * 10 })))

  void nextId
  return counts
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('seed.ts')) {
  const c = await seedLibrary()
  const lines = Object.entries(c).filter(([, v]) => v.added || v.updated).map(([t, v]) => `  ${t.padEnd(24)} +${v.added}${UPDATE ? `  updated ${v.updated}` : ''}`)
  console.log(lines.length ? `Library loaded:\n${lines.join('\n')}` : 'Library already complete (nothing to add).')
  await prisma.$disconnect()
}
