// The STARTER library: invented placeholder frameworks (LEAD, TECH), 31 role profiles, courses and
// certifications that the two demo scripts (db:demo, db:coca-cola) are built on. It is NOT part of the
// standard library (that is server/seed/library/, loaded by `npm run db:seed`); only the demos load it.
import { prisma, prepareDatabase } from '../db.ts'
import { nextId, syncCounters } from '../lib/ids.ts'
import {
  FRAMEWORKS, CATEGORIES, COMPETENCIES, LEVEL_TEMPLATES, JOB_ROLES, roleRequirements,
  COURSES, CERTIFICATIONS, OBSERVATION_PARAMETERS, type Seniority,
} from './starter-library.ts'

const UPDATE = process.argv.includes('--update')
const counts: Record<string, { added: number; updated: number }> = {}
const tally = (t: string, k: 'added' | 'updated') => ((counts[t] ??= { added: 0, updated: 0 })[k]++)

/** Find by a unique key; create with a new prefixed ID if missing; update only with --update. */
async function upsert(model: string, prefix: string, where: Record<string, unknown>, data: Record<string, unknown>) {
  const d = (prisma as any)[model]
  const found = await d.findFirst({ where })
  if (found) {
    if (UPDATE) { await d.update({ where: { id: found.id }, data }); tally(model, 'updated') }
    return found.id as string
  }
  const id = await nextId(prefix)
  await d.create({ data: { id, ...where, ...data } })
  tally(model, 'added')
  return id
}

export async function seedStarterLibrary() {
  await prepareDatabase()
  await syncCounters()

  // framework
  const fw: Record<string, string> = {}
  for (const f of FRAMEWORKS) fw[f.code] = await upsert('framework', 'FWK', { code: f.code }, { name: f.name, description: f.description, scaleMin: f.scaleMin, scaleMax: f.scaleMax })
  const cat: Record<string, string> = {}
  for (const [i, c] of CATEGORIES.entries()) cat[c.code] = await upsert('competencyCategory', 'CAT', { code: c.code }, { name: c.name, frameworkId: fw[c.framework], sortOrder: (i + 1) * 10 })
  const comp: Record<string, string> = {}
  for (const [i, [code, name, description, phrase, supportingText]] of COMPETENCIES.entries()) {
    const catCode = code.slice(0, 3)
    const lead = CATEGORIES.find((c) => c.code === catCode)!.framework === 'LEAD'
    const minLevel = lead ? 1 : 0
    comp[code] = await upsert('competency', 'CMP', { code }, { name, description, supportingText, categoryId: cat[catCode], minLevel, maxLevel: 5, sortOrder: (i + 1) * 10 })
    for (let level = minLevel; level <= 5; level++) {
      await upsert('competencyBehavior', 'BHV', { code: `${code}-L${level}` }, { competencyId: comp[code], level, description: LEVEL_TEMPLATES[level](phrase) })
    }
  }

  // job roles, then next-role links, then requirements
  const role: Record<string, string> = {}
  for (const [code, name, family, seniority] of JOB_ROLES) role[code] = await upsert('jobRole', 'ROL', { code }, { name, family, seniority })
  for (const [code, , , , next] of JOB_ROLES) if (next) await prisma.jobRole.updateMany({ where: { id: role[code], nextRoleId: UPDATE ? undefined : null }, data: { nextRoleId: role[next] } })
  for (const [code, , family, seniority] of JOB_ROLES) {
    for (const req of roleRequirements(family, seniority as Seniority)) {
      await upsert('roleRequirement', 'REQ', { jobRoleId: role[code], competencyId: comp[req.code] }, { requiredLevel: req.level, priority: req.priority })
    }
  }

  // catalogue
  for (const [code, name, type, provider, deliveryMode, durationHours, days, difficulty, observed, comps, description] of COURSES) {
    const id = await upsert('course', 'CRS', { code }, { name, type, provider, deliveryMode, durationHours, days, difficulty, observed, description: description || null })
    for (const c of comps) await prisma.courseCompetency.upsert({ where: { courseId_competencyId: { courseId: id, competencyId: comp[c] } }, create: { courseId: id, competencyId: comp[c] }, update: {} })
  }
  for (const [code, name, provider, track, difficulty, validityMonths, comps] of CERTIFICATIONS) {
    const id = await upsert('certification', 'CRT', { code }, { name, provider, track, difficulty, validityMonths })
    for (const c of comps) await prisma.certificationCompetency.upsert({ where: { certificationId_competencyId: { certificationId: id, competencyId: comp[c] } }, create: { certificationId: id, competencyId: comp[c] }, update: {} })
  }
  for (const [i, [code, name, category, compCode, description]] of OBSERVATION_PARAMETERS.entries()) {
    await upsert('observationParameter', 'OBP', { code }, { name, category, description, competencyId: comp[compCode], maxScore: 5, sortOrder: (i + 1) * 10 })
  }
  return counts
}
