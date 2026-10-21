// Fictional demo data: the client "Northstar Enterprise Group" from the context document,
// 36 people, one programme, assessments, a development plan, sessions with attendance and
// observation scores, certifications, coaching, validations and evidence.
//
//   npm run db:demo            adds the demo client (only if it is not there yet)
//   npm run db:demo -- --remove  deletes the demo client and everything that belongs to it
import { prisma, prepareDatabase } from '../db.ts'
import { nextId, nextIds, syncCounters } from '../lib/ids.ts'
import { seedLibrary } from './seed.ts'

const CLIENT = 'Northstar Enterprise Group (demo)'
const TODAY = new Date(Date.UTC(2026, 9, 21))
const BY = 'Demo data'

let seed = 20261021
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296)
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)]
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x))
const day = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d))
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000)
const audit = (source = 'Direct entry') => ({ createdBy: BY, updatedBy: BY, source })

async function remove() {
  const client = await prisma.client.findUnique({ where: { name: CLIENT } })
  if (!client) return console.log('No demo client found.')
  const emps = await prisma.employee.findMany({ where: { clientId: client.id }, select: { id: true } })
  const ids = emps.map((e) => e.id)
  const progs = await prisma.program.findMany({ where: { clientId: client.id }, select: { id: true } })
  await prisma.$transaction([
    prisma.employee.updateMany({ where: { clientId: client.id }, data: { lineManagerId: null } }),
    prisma.managerValidation.deleteMany({ where: { employeeId: { in: ids } } }),
    prisma.employee.deleteMany({ where: { clientId: client.id } }),
    prisma.courseSession.deleteMany({ where: { programId: { in: progs.map((p) => p.id) } } }),
    prisma.program.deleteMany({ where: { clientId: client.id } }),
    prisma.client.delete({ where: { id: client.id } }),
    prisma.staff.deleteMany({ where: { notes: 'Demo staff' } }),
    prisma.changeLog.deleteMany({ where: { employeeId: { in: ids } } }),
  ])
  console.log(`Removed the demo client and ${ids.length} people.`)
}

async function create() {
  if (await prisma.client.findUnique({ where: { name: CLIENT } })) return console.log('The demo client already exists. Remove it first: npm run db:demo -- --remove')
  const counts = await seedLibrary()
  void counts

  const roles = await prisma.jobRole.findMany({ include: { requirements: true } })
  const roleBy = Object.fromEntries(roles.map((r) => [r.code, r]))
  const comps = await prisma.competency.findMany()
  const compBy = Object.fromEntries(comps.map((c) => [c.code, c]))
  const courses = Object.fromEntries((await prisma.course.findMany()).map((c) => [c.code, c]))
  const certs = Object.fromEntries((await prisma.certification.findMany()).map((c) => [c.code, c]))
  const params = await prisma.observationParameter.findMany({ orderBy: { sortOrder: 'asc' } })

  // ---------------------------------------------------------------- staff
  const staffDefs = [
    ['Amira Haddad', 'Consultant; Assessor'], ['Luka Petrović', 'Consultant; Programme Manager'], ['Nadia Karim', 'Trainer; Assessor'],
    ['Tomas Herrera', 'Trainer'], ['Ingrid Solberg', 'Coach'], ['Kwame Asante', 'Coach; Trainer'],
  ]
  const staff: Record<string, string> = {}
  for (const [name, rolesStr] of staffDefs) {
    const id = await nextId('STF')
    await prisma.staff.create({ data: { id, name, roles: rolesStr, email: `${name.split(' ')[0].toLowerCase()}@ballon-td.example`, notes: 'Demo staff' } })
    staff[name] = id
  }
  const coaches = [staff['Ingrid Solberg'], staff['Kwame Asante']]
  const consultants = [staff['Amira Haddad'], staff['Luka Petrović']]

  // ---------------------------------------------------------------- client & programme
  const clientId = await nextId('CLI')
  await prisma.client.create({ data: { id: clientId, name: CLIENT, industry: 'Financial services', country: 'Bosnia and Herzegovina', contactName: 'Head of People Development', notes: 'Fictional demo client.' } })
  const programId = await nextId('PRG')
  await prisma.program.create({ data: { id: programId, clientId, name: 'Cyber Capability Pathway 2026 H2', cycle: '2026 H2', startDate: day(2026, 7, 1), endDate: day(2026, 12, 31), status: 'Active' } })

  // ---------------------------------------------------------------- people
  const first = ['Adna', 'Emir', 'Lejla', 'Haris', 'Selma', 'Tarik', 'Amina', 'Kenan', 'Ena', 'Dino', 'Sara', 'Mirza', 'Lana', 'Armin', 'Nina', 'Edin', 'Maja', 'Damir',
    'Iva', 'Faruk', 'Hana', 'Nermin', 'Ajla', 'Vedran', 'Mia', 'Jasmin', 'Lea', 'Igor', 'Dalia', 'Omar', 'Tea', 'Alen', 'Merima', 'Kerim', 'Zara', 'Benjamin']
  const last = ['Hodžić', 'Kovač', 'Begić', 'Delić', 'Marić', 'Hadžić', 'Jukić', 'Mehmedović', 'Babić', 'Šarić', 'Ibrahimović', 'Novak', 'Kurtović', 'Pašić', 'Lončar', 'Tomić', 'Zukić', 'Vuković']
  type P = { role: string; dept: string; section: string; profile: 'star' | 'solid' | 'expert' | 'developing' | 'new' }
  const plan: P[] = [
    { role: 'HEAD-CYB', dept: 'Cyber Security', section: 'Leadership', profile: 'solid' },
    { role: 'SOC-MGR', dept: 'Cyber Security', section: 'Security Operations', profile: 'solid' },
    { role: 'SOC-LD', dept: 'Cyber Security', section: 'Security Operations', profile: 'star' },
    ...Array(3).fill({ role: 'SOC-SR', dept: 'Cyber Security', section: 'Security Operations' }),
    ...Array(4).fill({ role: 'SOC-T2', dept: 'Cyber Security', section: 'Security Operations' }),
    ...Array(4).fill({ role: 'SOC-T1', dept: 'Cyber Security', section: 'Security Operations' }),
    { role: 'IR-SR', dept: 'Cyber Security', section: 'Security Operations', profile: 'expert' },
    { role: 'CTI-AN', dept: 'Cyber Security', section: 'Threat Intelligence' }, { role: 'CTI-SR', dept: 'Cyber Security', section: 'Threat Intelligence' },
    { role: 'APS-LD', dept: 'Technology', section: 'Application Security', profile: 'solid' },
    ...Array(2).fill({ role: 'APS-EN', dept: 'Technology', section: 'Application Security' }),
    { role: 'PEN-TS', dept: 'Technology', section: 'Application Security' },
    { role: 'ARC-SEC', dept: 'Technology', section: 'Infrastructure & Cloud', profile: 'expert' },
    ...Array(2).fill({ role: 'CLD-EN', dept: 'Technology', section: 'Infrastructure & Cloud' }),
    { role: 'INF-EN', dept: 'Technology', section: 'Infrastructure & Cloud' },
    { role: 'IAM-EN', dept: 'Technology', section: 'Identity & Access' }, { role: 'IAM-AN', dept: 'Technology', section: 'Identity & Access', profile: 'new' },
    { role: 'HEAD-GRC', dept: 'Risk & Compliance', section: 'Leadership', profile: 'solid' },
    { role: 'GRC-LD', dept: 'Risk & Compliance', section: 'GRC', profile: 'star' },
    ...Array(2).fill({ role: 'GRC-SR', dept: 'Risk & Compliance', section: 'GRC' }),
    { role: 'GRC-AN', dept: 'Risk & Compliance', section: 'GRC', profile: 'new' }, { role: 'AUD-IT', dept: 'Risk & Compliance', section: 'GRC' },
    { role: 'BCM-AN', dept: 'Risk & Compliance', section: 'Business Continuity' },
  ].map((p: any) => ({ ...p, profile: p.profile ?? pick(['star', 'solid', 'solid', 'developing', 'developing', 'expert']) }))

  const empIds = await nextIds('EMP', plan.length)
  const people: any[] = plan.map((p, i) => ({ ...p, id: empIds[i], name: `${first[i]} ${last[i % last.length]}`, roleRow: roleBy[p.role] }))
  for (const p of people) {
    await prisma.employee.create({
      data: {
        id: p.id, clientId, name: p.name, email: `${p.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/ /g, '.')}@northstar.example`,
        employeeNumber: `NS-${1000 + empIds.indexOf(p.id)}`, jobTitle: p.roleRow.name, jobRoleId: p.roleRow.id,
        grade: { Entry: 'G5', Mid: 'G6', Senior: 'G7', Lead: 'G8', Manager: 'G9', Head: 'G10', Executive: 'G11' }[p.roleRow.seniority as string],
        division: 'Technology & Risk', department: p.dept, section: p.section, location: pick(['Sarajevo', 'Sarajevo', 'Mostar', 'Banja Luka']),
        status: 'Active', ...audit('Excel from client'),
      },
    })
  }
  // line managers: head of each section/department
  const head = (pred: (p: any) => boolean) => people.find(pred)?.id
  for (const p of people) {
    const mgr = p.role === 'HEAD-CYB' || p.role === 'HEAD-GRC' ? null
      : p.role === 'SOC-MGR' || p.role === 'APS-LD' || p.role === 'ARC-SEC' || p.role === 'GRC-LD' ? head((x) => x.role === (p.dept === 'Risk & Compliance' ? 'HEAD-GRC' : 'HEAD-CYB'))
      : p.section === 'Security Operations' ? head((x) => x.role === (p.role === 'SOC-LD' ? 'SOC-MGR' : 'SOC-LD'))
      : p.section === 'Threat Intelligence' ? head((x) => x.role === 'SOC-MGR')
      : p.section === 'Application Security' ? head((x) => x.role === 'APS-LD')
      : p.dept === 'Technology' ? head((x) => x.role === 'ARC-SEC')
      : head((x) => x.role === 'GRC-LD')
    if (mgr && mgr !== p.id) await prisma.employee.update({ where: { id: p.id }, data: { lineManagerId: mgr } })
    ;(p as any).managerId = mgr
  }

  // ---------------------------------------------------------------- enrolment, assessments, plan
  const offset: Record<string, number> = { star: 0.4, solid: 0, expert: 0.2, developing: -0.8, new: -1.2 }
  const prepCourse: Record<string, string> = { CISSP: 'PREP-CISSP', CISM: 'PREP-CISM', SECPLUS: 'PREP-SEC' }
  for (const [i, p] of people.entries()) {
    const enrId = await nextId('ENR')
    const coach = coaches[i % 2], consultant = consultants[i % 2]
    await prisma.enrollment.create({ data: { id: enrId, employeeId: p.id, programId, batch: i < 18 ? 'Batch A' : 'Batch B', coachId: coach, consultantId: consultant, startDate: day(2026, 7, 1), endDate: day(2026, 12, 31), status: 'Active', ...audit() } })

    const reqs: any[] = p.roleRow.requirements
    const self = await nextId('ASM'), cons = await nextId('ASM')
    const selfDate = addDays(day(2026, 7, 6), Math.floor(rnd() * 10)), consDate = addDays(selfDate, 10 + Math.floor(rnd() * 8))
    await prisma.assessment.create({ data: { id: self, employeeId: p.id, enrollmentId: enrId, type: 'Self-Assessment', date: selfDate, status: 'Completed', jobRoleId: p.roleRow.id, ...audit('Excel from client') } })
    const delivered = rnd() < 0.8
    await prisma.assessment.create({ data: { id: cons, employeeId: p.id, enrollmentId: enrId, type: 'Validation Interview', date: consDate, status: 'Completed', reportStatus: delivered ? 'Delivered' : 'In Draft', jobRoleId: p.roleRow.id, assessorId: consultant, summary: 'Validated in a 60-minute structured interview.', ...audit('Meeting / interview') } })
    const levels: Record<string, number> = {}
    const rat1 = await nextIds('RAT', reqs.length), rat2 = await nextIds('RAT', reqs.length)
    for (const [k, r] of reqs.entries()) {
      const c = comps.find((x) => x.id === r.competencyId)!
      const isTech = c.minLevel === 0
      const lvl = clamp(Math.round(r.requiredLevel + offset[p.profile] + (p.profile === 'expert' && isTech ? 0.8 : 0) + (rnd() - 0.55) * 1.6), c.minLevel, 5)
      levels[r.competencyId] = lvl
      await prisma.assessmentRating.create({ data: { id: rat1[k], assessmentId: self, competencyId: r.competencyId, level: clamp(lvl + (rnd() < 0.5 ? 1 : 0), c.minLevel, 5), requiredLevel: r.requiredLevel, priority: r.priority } })
      await prisma.assessmentRating.create({ data: { id: rat2[k], assessmentId: cons, competencyId: r.competencyId, level: lvl, requiredLevel: r.requiredLevel, priority: r.priority } })
    }
    // manager validation of the interview
    if (p.managerId && delivered) {
      await prisma.managerValidation.create({ data: { id: await nextId('VAL'), employeeId: p.id, assessmentId: cons, managerId: p.managerId, date: addDays(consDate, 12), status: rnd() < 0.85 ? 'Approved' : 'Requires Further Evidence', comments: rnd() < 0.5 ? 'Agree with the levels.' : null, ...audit('Email from client') } })
    } else if (p.managerId) {
      await prisma.managerValidation.create({ data: { id: await nextId('VAL'), employeeId: p.id, assessmentId: cons, managerId: p.managerId, status: 'Pending', ...audit() } })
    }

    // development plan: the two biggest gaps get a course, plus a certification for some
    const gaps = reqs.map((r: any) => ({ r, gap: r.requiredLevel - levels[r.competencyId], w: r.priority === 'High' ? 3 : r.priority === 'Medium' ? 2 : 1 }))
      .filter((g: any) => g.gap > 0).sort((a: any, b: any) => b.gap * b.w - a.gap * a.w).slice(0, 2)
    const allCourseComps = await prisma.courseCompetency.findMany()
    for (const g of gaps) {
      const cc = allCourseComps.filter((x) => x.competencyId === g.r.competencyId).map((x) => x.courseId)
      const course = Object.values(courses).find((c) => cc.includes(c.id) && !c.code.startsWith('PREP'))
      const status = pick(['Completed', 'In Progress', 'In Progress', 'Planned'])
      const plannedEnd = addDays(day(2026, 9, 1), Math.floor(rnd() * 100))
      const idpId = await nextId('IDP')
      await prisma.idpAction.create({ data: {
        id: idpId, employeeId: p.id, enrollmentId: enrId, competencyId: g.r.competencyId, actionType: course ? (course.type === 'Workshop' ? 'Workshop' : 'Training') : 'Project Assignment',
        title: course ? course.name : `Stretch assignment: ${compBy[comps.find((c) => c.id === g.r.competencyId)!.code].name}`, courseId: course?.id,
        owner: p.name, estimatedHours: course?.durationHours ?? 20, plannedStart: day(2026, 8, 15), plannedEnd, status, progressPct: status === 'Completed' ? 100 : status === 'Planned' ? 0 : 20 + Math.floor(rnd() * 60), ...audit(),
      } })
      ;(g as any).idpId = idpId; (g as any).course = course
    }
    ;(p as any).gaps = gaps; (p as any).enrId = enrId; (p as any).coach = coach; (p as any).levels = levels

    const certCode = { 'Security Operations': 'CYSA', 'Threat Intelligence': 'GCTI', 'Application Security': 'CSSLP', 'Offensive Security': 'OSCP', 'Infrastructure & Cloud Security': 'CCSP', 'Identity & Access': 'SC300', 'Governance, Risk & Compliance': 'CISM', 'Business Continuity & Resilience': 'CBCI', 'Security Leadership': 'CISSP' }[p.roleRow.family as string] ?? 'SECPLUS'
    const chosen = p.roleRow.seniority === 'Entry' ? 'SECPLUS' : certCode
    const cstatus = pick(['Completed', 'In Progress', 'Exam Scheduled', 'Registered', 'Not Started', 'Deferred'])
    const cIdp = await nextId('IDP')
    await prisma.idpAction.create({ data: { id: cIdp, employeeId: p.id, enrollmentId: enrId, actionType: 'Certification', title: certs[chosen].name, certificationId: certs[chosen].id, plannedEnd: day(2026, 12, 15), status: cstatus === 'Completed' ? 'Completed' : cstatus === 'Not Started' ? 'Planned' : cstatus === 'Deferred' ? 'Deferred' : 'In Progress', progressPct: cstatus === 'Completed' ? 100 : 30, ...audit() } })
    await prisma.certificationRecord.create({ data: {
      id: await nextId('CER'), employeeId: p.id, certificationId: certs[chosen].id, enrollmentId: enrId, idpActionId: cIdp, assignedDate: day(2026, 8, 1), targetDate: day(2026, 12, 15), status: cstatus,
      examDate: cstatus === 'Exam Scheduled' || cstatus === 'Completed' ? addDays(day(2026, 9, 1), Math.floor(rnd() * 80)) : null,
      completionDate: cstatus === 'Completed' ? addDays(day(2026, 9, 1), Math.floor(rnd() * 40)) : null, result: cstatus === 'Completed' ? 'Pass' : null,
      expiryDate: cstatus === 'Completed' && certs[chosen].validityMonths ? addDays(day(2026, 10, 1), certs[chosen].validityMonths! * 30) : null,
      comments: cstatus === 'Deferred' ? 'Deferred because of project workload.' : null, ...audit(),
    } })
    if (rnd() < 0.3) {
      const ai = pick(['AI900', 'AWSAI', 'AIGP'])
      await prisma.certificationRecord.create({ data: { id: await nextId('CER'), employeeId: p.id, certificationId: certs[ai].id, enrollmentId: enrId, assignedDate: day(2026, 8, 1), targetDate: day(2026, 11, 30), status: pick(['In Progress', 'Completed', 'Not Started']), ...audit() } })
    }

    // coaching: kick-off + monthly check-ins until today
    let d = day(2026, 7, 20 + (i % 7))
    let prog = 5
    for (let n = 0; d <= TODAY; n++, d = addDays(d, 28 + Math.floor(rnd() * 8))) {
      prog = clamp(prog + 8 + Math.floor(rnd() * 12) + (p.profile === 'star' ? 4 : p.profile === 'developing' ? -4 : 0), 0, 100)
      const noShow = n > 0 && rnd() < 0.06
      await prisma.coachingSession.create({ data: {
        id: await nextId('COA'), employeeId: p.id, enrollmentId: enrId, coachId: coach, date: d, type: n === 0 ? 'Kick-off' : n === 2 ? 'Capability Review' : 'Monthly Check-In',
        durationMinutes: n === 0 ? 60 : 45, status: noShow ? 'No-show' : 'Completed', progressPct: noShow ? null : prog,
        summary: noShow ? null : n === 0 ? 'Walked through the assessment report and agreed the development plan.' : pick(['Reviewed progress on the plan; on track.', 'Discussed a difficult stakeholder situation and how to prepare for it.', 'Course completed; agreed how to apply it at work.', 'Workload is high; re-planned the next two actions.']),
        challenges: !noShow && rnd() < 0.4 ? pick(['Limited time because of project deadlines.', 'Unclear support from the line manager.', 'Exam anxiety.']) : null,
        actionItems: noShow ? null : pick(['Book the exam date.', 'Present findings to the team next sprint.', 'Ask manager for a stretch assignment.', 'Finish the lab modules.']),
        nextReviewDate: addDays(d, 30), ...audit(),
      } })
    }
  }

  // ---------------------------------------------------------------- sessions with attendance and observations
  const sessionDefs: [string, Date, string, (p: any) => boolean][] = [
    ['ELB', day(2026, 9, 14), 'Nadia Karim', (p) => ['Senior', 'Lead'].includes(p.roleRow.seniority)],
    ['CWI', day(2026, 10, 5), 'Kwame Asante', (p) => ['Entry', 'Mid'].includes(p.roleRow.seniority) && rnd() < 0.7],
    ['MGR', day(2026, 10, 19), 'Nadia Karim', (p) => ['Lead', 'Manager', 'Head'].includes(p.roleRow.seniority)],
    ['SIEM', day(2026, 9, 22), 'Tomas Herrera', (p) => p.section === 'Security Operations' && ['Entry', 'Mid'].includes(p.roleRow.seniority)],
    ['ISO', day(2026, 11, 9), 'Tomas Herrera', (p) => p.dept === 'Risk & Compliance'],
  ]
  for (const [code, start, trainer, who] of sessionDefs) {
    const course = courses[code]
    const sesId = await nextId('SES')
    const end = addDays(start, (course.days ?? 1) - 1)
    const status = end < TODAY ? 'Completed' : start <= TODAY ? 'In Progress' : 'Scheduled'
    await prisma.courseSession.create({ data: { id: sesId, courseId: course.id, programId, batch: 'All batches', startDate: start, endDate: end, trainerId: staff[trainer], location: course.deliveryMode === 'In-person' ? 'Northstar HQ, Sarajevo' : 'Online', mode: course.deliveryMode, status, ...audit() } })
    for (const p of people.filter(who)) {
      const absentDays = status === 'Scheduled' ? 0 : rnd() < 0.12 ? 1 : 0
      const days = course.days ?? 1
      const daysHeld = status === 'Completed' ? days : status === 'In Progress' ? Math.max(1, Math.floor((TODAY.getTime() - start.getTime()) / 86400000) + 1) : 0
      const trnId = await nextId('TRN')
      const linked = (p as any).gaps.find((g: any) => g.course?.id === course.id)
      await prisma.trainingRecord.create({ data: {
        id: trnId, employeeId: p.id, courseId: course.id, sessionId: sesId, idpActionId: linked?.idpId, assignedDate: day(2026, 8, 20),
        startDate: status === 'Scheduled' ? null : start, completionDate: status === 'Completed' && !absentDays ? end : null,
        status: status === 'Scheduled' ? 'Assigned' : status === 'In Progress' ? 'In Progress' : absentDays ? 'Incomplete' : 'Completed',
        attendancePct: daysHeld ? Math.round(((daysHeld - Math.min(absentDays, daysHeld)) / daysHeld) * 100) : null,
        hours: status === 'Completed' && !absentDays ? course.durationHours : null, score: status === 'Completed' && !course.observed ? Math.round(60 + rnd() * 38) : null, ...audit('Trainer sheet'),
      } })
      if (!course.observed) continue
      for (let dn = 1; dn <= daysHeld; dn++) {
        const absent = absentDays && dn === days
        const obsId = await nextId('OBS')
        const base = 3 + offset[p.profile] * 0.8 + (dn - 1) * 0.2
        await prisma.observationDay.create({ data: {
          id: obsId, trainingRecordId: trnId, dayNumber: dn, date: addDays(start, dn - 1), attendance: absent ? 'Absent' : 'Present', observerId: staff[trainer],
          potentialNote: absent ? null : base > 3.5 ? pick(['High potential', 'Promising']) : base < 2.6 ? pick(['Needs support', 'At risk']) : 'Steady',
          notes: absent ? null : pick(['Engaged and asked good questions.', 'Quiet in group work; strong in the individual exercise.', 'Took the lead in the case study.', 'Struggled to structure the presentation; improved after feedback.', 'Very good listener; could push their view more.']),
          ...audit('Trainer sheet'),
        } })
        if (absent) continue
        const ids = await nextIds('OSC', params.length)
        await prisma.observationScore.createMany({ data: params.map((pa, k) => ({ id: ids[k], observationDayId: obsId, parameterId: pa.id, score: clamp(Math.round(base + (rnd() - 0.5) * 1.8), 1, 5) })) })
      }
    }
  }

  // ---------------------------------------------------------------- evidence
  for (const p of people.filter(() => rnd() < 0.55)) {
    const g = (p as any).gaps[0]
    await prisma.evidence.create({ data: {
      id: await nextId('EVD'), employeeId: p.id, competencyId: g?.r.competencyId ?? null, evidenceType: pick(['Project', 'Presentation', 'Report', 'Case Study']),
      title: pick(['Led the quarterly phishing simulation debrief', 'Wrote the incident post-mortem for INC-2291', 'Presented the cloud posture findings to IT leadership', 'Rebuilt the access review process', 'Mapped controls to NIS2 for the audit']),
      date: addDays(day(2026, 9, 1), Math.floor(rnd() * 45)), submittedBy: p.name, verificationStatus: pick(['Verified', 'Verified', 'Submitted', 'Under Review']),
      verifiedById: consultants[0], fileLink: 'https://sharepoint.example/evidence/' + p.id, ...audit(),
    } })
  }
  await syncCounters()
  console.log(`Demo client created: ${people.length} people with assessments, plans, sessions, observations, certifications, coaching, validations and evidence.`)
}

await prepareDatabase()
if (process.argv.includes('--remove')) await remove()
else await create()
await prisma.$disconnect()
