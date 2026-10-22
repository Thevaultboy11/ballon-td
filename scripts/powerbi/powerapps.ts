// Generates the Power Apps input screens (powerbi/powerapps/*.yaml) that write rows into the
// Excel tables of BallonTD_Data.xlsx, plus a manual-build reference (powerbi/powerapps/SCREENS.md).
//
// Each .yaml file is ONE container control in Power Apps' YAML format (pa.yaml v3): create a blank
// screen in Power Apps Studio, select it in the tree view and paste (Ctrl+V).
import fs from 'node:fs'
import path from 'node:path'
import YAML from 'yaml'
import { PBI } from './build.ts'

export const PA_DIR = path.join(PBI, 'powerapps')
const P = (s: string) => `=${s}` // Power Fx formula
const q = (s: string) => `"${s.replace(/"/g, '""')}"`

type In =
  | { kind: 'person'; col: string; label: string }
  | { kind: 'lookup'; col: string; label: string; list: string; def?: string; required?: boolean }
  | { kind: 'record'; col: string; label: string; table: string; display: string; filter?: string; required?: boolean; idCol?: string }
  | { kind: 'text' | 'multiline' | 'time'; col: string; label: string; def?: string; required?: boolean }
  | { kind: 'number'; col: string; label: string; def?: string }
  | { kind: 'date'; col: string; label: string; def?: string; required?: boolean }
  | { kind: 'score'; col: string; label: string; options: number[] }
  | { kind: 'toggle'; col: string; label: string }

type Form = { key: string; title: string; subtitle: string; table: string; prefix: string; inputs: In[]; extra?: Record<string, string>; audit?: boolean }

const PERSON: In = { kind: 'person', col: 'employeeId', label: 'Person' }
const SOURCE = (def = 'Direct entry'): In => ({ kind: 'lookup', col: 'source', label: 'Source', list: 'source', def })

export const FORMS: Form[] = [
  {
    key: 'Coaching', title: 'Coaching session', subtitle: 'The coaching table: times, effort and notes per IDP segment.', table: 'tbl_CoachingSession', prefix: 'COA', audit: true,
    inputs: [PERSON,
      { kind: 'date', col: 'date', label: 'Coaching session date', def: 'Today()', required: true },
      { kind: 'lookup', col: 'type', label: 'Session type', list: 'coachingType', def: 'Monthly Check-In', required: true },
      { kind: 'record', col: 'coachId', label: 'Coach', table: 'tbl_Staff', display: 'name', filter: '"Coach" in roles' },
      { kind: 'lookup', col: 'status', label: 'Status', list: 'coachingStatus', def: 'Completed' },
      { kind: 'time', col: 'startTime', label: '1-1 session start (HH:MM)', def: '"09:00"' },
      { kind: 'time', col: 'endTime', label: '1-1 session end (HH:MM)', def: '"10:00"' },
      { kind: 'number', col: 'prepMinutes', label: 'Preparation time (min)', def: '"15"' },
      { kind: 'number', col: 'durationMinutes', label: 'Session (min)', def: '"60"' },
      { kind: 'number', col: 'reportingMinutes', label: 'Reporting time (min)', def: '"15"' },
      { kind: 'number', col: 'progressPct', label: 'Overall IDP progress %' },
      { kind: 'multiline', col: 'summary', label: 'Segment notes (S1 cert · S2 immersive · S3 AI cert · S4 SuccessFactors · S5 cross-functional · department needs)' },
      { kind: 'multiline', col: 'challenges', label: 'Challenges' },
      { kind: 'multiline', col: 'actionItems', label: 'Action items' },
      { kind: 'date', col: 'nextReviewDate', label: 'Next review' },
      { kind: 'toggle', col: 'evidenceSubmitted', label: 'Evidence submitted' },
      SOURCE()],
  },
  {
    key: 'Validation', title: 'Line-manager validation', subtitle: 'Monthly progress per skill (1 Not started … 5 Fully achieved), after the coach\'s review meeting with the line manager.', table: 'tbl_ManagerValidation', prefix: 'VAL', audit: true,
    inputs: [PERSON,
      { kind: 'record', col: 'competencyId', label: 'Skill', table: 'tbl_Competency', display: 'name', required: true },
      { kind: 'date', col: 'date', label: 'Validation date', def: 'Today()', required: true },
      { kind: 'score', col: 'validatedLevel', label: 'Progress (1–5)', options: [1, 2, 3, 4, 5] },
      { kind: 'lookup', col: 'status', label: 'Status', list: 'validationStatus', def: 'Approved', required: true },
      { kind: 'record', col: 'managerId', label: 'Line manager', table: 'tbl_Employee', display: 'name' },
      { kind: 'text', col: 'evidenceReviewed', label: 'Evidence reviewed' },
      { kind: 'multiline', col: 'comments', label: 'Comments' },
      SOURCE('Email from client')],
  },
  {
    key: 'Evidence', title: 'Coach validation (behaviour descriptor)', subtitle: 'One row per behaviour descriptor: progress 1–5 and the evidence (artefact or line-manager confirmation).', table: 'tbl_Evidence', prefix: 'EVD', audit: true,
    inputs: [PERSON,
      { kind: 'record', col: 'competencyId', label: 'Skill', table: 'tbl_Competency', display: 'name', required: true },
      { kind: 'record', col: 'title', label: 'Behaviour descriptor', table: 'tbl_CompetencyBehavior', display: 'description', idCol: 'code', filter: 'competencyId = cbEvidenceSkill.Selected.id', required: true },
      { kind: 'score', col: 'progress', label: 'Progress (1–5)', options: [1, 2, 3, 4, 5] },
      { kind: 'lookup', col: 'evidenceType', label: 'Evidence type', list: 'evidenceType', def: 'Manager Validation', required: true },
      { kind: 'date', col: 'date', label: 'Date', def: 'Today()' },
      { kind: 'multiline', col: 'description', label: 'Evidence (artefact or line-manager confirmation)' },
      { kind: 'lookup', col: 'verificationStatus', label: 'Verification', list: 'verificationStatus', def: 'Verified' },
      { kind: 'record', col: 'verifiedById', label: 'Verified by (coach)', table: 'tbl_Staff', display: 'name' },
      { kind: 'text', col: 'fileLink', label: 'File link' },
      SOURCE()],
  },
  {
    key: 'Plan', title: 'Development action', subtitle: 'IDP segment, department training need or workplace assignment.', table: 'tbl_IdpAction', prefix: 'IDP', audit: true,
    inputs: [PERSON,
      { kind: 'text', col: 'title', label: 'Action (start segments with S1…S5)', required: true },
      { kind: 'lookup', col: 'actionType', label: 'Type', list: 'idpActionType', def: 'Learning Plan Segment', required: true },
      { kind: 'record', col: 'competencyId', label: 'Skill', table: 'tbl_Competency', display: 'name' },
      { kind: 'lookup', col: 'status', label: 'Status', list: 'idpStatus', def: 'Planned' },
      { kind: 'number', col: 'progressPct', label: 'Progress %', def: '"0"' },
      { kind: 'number', col: 'estimatedHours', label: 'Estimated hours' },
      { kind: 'date', col: 'plannedStart', label: 'Planned start', def: 'Today()' },
      { kind: 'date', col: 'plannedEnd', label: 'Planned end' },
      { kind: 'text', col: 'owner', label: 'Owner' },
      { kind: 'multiline', col: 'comments', label: 'Comments' },
      SOURCE()],
  },
  {
    key: 'Training', title: 'Training record', subtitle: 'One person on one course (pick the session for scheduled courses).', table: 'tbl_TrainingRecord', prefix: 'TRN', audit: true,
    inputs: [PERSON,
      { kind: 'record', col: 'courseId', label: 'Course', table: 'tbl_Course', display: 'name', required: true },
      { kind: 'record', col: 'sessionId', label: 'Session (start date)', table: 'tbl_CourseSession', display: 'startDate', filter: 'courseId = cbTrainingCourse.Selected.id' },
      { kind: 'lookup', col: 'status', label: 'Status', list: 'trainingStatus', def: 'Assigned', required: true },
      { kind: 'number', col: 'attendancePct', label: 'Attendance %' },
      { kind: 'number', col: 'score', label: 'Score' },
      { kind: 'number', col: 'hours', label: 'Hours' },
      { kind: 'date', col: 'assignedDate', label: 'Assigned', def: 'Today()' },
      { kind: 'date', col: 'completionDate', label: 'Completed' },
      { kind: 'multiline', col: 'comments', label: 'Comments' },
      SOURCE('Trainer sheet')],
  },
  {
    key: 'Certification', title: 'Certification record', subtitle: 'Professional (S1) or AI (S3) certification progress.', table: 'tbl_CertificationRecord', prefix: 'CER', audit: true,
    inputs: [PERSON,
      { kind: 'record', col: 'certificationId', label: 'Certification', table: 'tbl_Certification', display: 'name', required: true },
      { kind: 'lookup', col: 'status', label: 'Status', list: 'certStatus', def: 'Assigned', required: true },
      { kind: 'date', col: 'targetDate', label: 'Target date' },
      { kind: 'date', col: 'examDate', label: 'Exam date' },
      { kind: 'date', col: 'completionDate', label: 'Achieved' },
      { kind: 'lookup', col: 'result', label: 'Result', list: 'examResult' },
      { kind: 'number', col: 'score', label: 'Score' },
      { kind: 'text', col: 'certificateUrl', label: 'Certificate link' },
      { kind: 'multiline', col: 'comments', label: 'Comments' },
      SOURCE()],
  },
]

// ------------------------------------------------------------------ YAML builder
type Ctl = Record<string, { Control: string; Variant?: string; Properties: Record<string, string>; Children?: Ctl[] }>

function controlsFor(f: Form): { yaml: Ctl[]; manual: [string, string, string][]; patch: string } {
  const k = f.key
  const name = (i: In) => {
    const base = i.col.replace(/Id$/, '').replace(/^./, (c) => c.toUpperCase())
    if (i.kind === 'person') return `cb${k}Person`
    if (i.col === 'competencyId' || i.label === 'Skill') return `cb${k}Skill`
    if (i.kind === 'record' && i.col === 'courseId') return `cb${k}Course`
    return `${{ lookup: 'cb', record: 'cb', text: 'txt', multiline: 'txt', time: 'txt', number: 'txt', date: 'dp', score: 'dd', toggle: 'tgl' }[i.kind]}${k}${base}`
  }
  const ctls: Ctl[] = []
  const manual: [string, string, string][] = []
  const colW = 440, labelH = 22, rowH = 74, x0 = 24, y0 = 96
  ctls.push({ [`lbl${k}Title`]: { Control: 'Label', Properties: { Text: P(q(f.title)), X: P(`${x0}`), Y: P('16'), Width: P('900'), Height: P('40'), Size: P('20'), FontWeight: P('FontWeight.Semibold'), Color: P('RGBA(20, 30, 18, 1)') } } })
  ctls.push({ [`lbl${k}Sub`]: { Control: 'Label', Properties: { Text: P(q(f.subtitle)), X: P(`${x0}`), Y: P('56'), Width: P('900'), Height: P('30'), Size: P('11'), Color: P('RGBA(107, 113, 106, 1)') } } })
  const record: string[] = [`id: ${q(`${f.prefix}-PA`)} & Text(Now(), "yymmddhhmmss")`]
  const required: string[] = []
  const resets: string[] = []
  let row = 0, colIdx = 0
  for (const i of f.inputs) {
    const wide = i.kind === 'multiline'
    if (wide && colIdx === 1) { row++; colIdx = 0 }
    const x = x0 + colIdx * (colW + 24), y = y0 + row * rowH
    const n = name(i)
    ctls.push({ [`lbl${n.charAt(0).toUpperCase()}${n.slice(1)}`]: { Control: 'Label', Properties: { Text: P(q(i.label + ('required' in i && i.required || i.kind === 'person' ? ' *' : ''))), X: P(`${x}`), Y: P(`${y}`), Width: P(`${wide ? colW * 2 + 24 : colW}`), Height: P(`${labelH}`), Size: P('10'), Color: P('RGBA(96, 103, 96, 1)') } } })
    const iy = y + labelH + 2, w = wide ? colW * 2 + 24 : colW
    const geo = { X: P(`${x}`), Y: P(`${iy}`), Width: P(`${w}`), Height: P(wide ? '72' : '40') }
    let value = ''
    switch (i.kind) {
      case 'person':
        ctls.push({ [n]: { Control: 'Classic/ComboBox', Properties: { ...geo, Items: P('SortByColumns(tbl_Employee, "name")'), DisplayFields: P('["name"]'), SearchFields: P('["name", "jobTitle", "id"]'), SelectMultiple: P('false'),
          DefaultSelectedItems: P('Filter(tbl_Employee, id = First(PowerBIIntegration.Data).\'Employee ID\')') } } })
        value = `${n}.Selected.id`; required.push(`IsBlank(${n}.Selected.id)`)
        manual.push([n, 'Combo box', 'Items = SortByColumns(tbl_Employee, "name") · DisplayFields = ["name"] · DefaultSelectedItems = Filter(tbl_Employee, id = First(PowerBIIntegration.Data).\'Employee ID\')'])
        break
      case 'lookup': {
        const items = `Sort(Filter(tbl_LookupValue, list = ${q(i.list)} && active), sortOrder)`
        ctls.push({ [n]: { Control: 'Classic/ComboBox', Properties: { ...geo, Items: P(items), DisplayFields: P('["value"]'), SearchFields: P('["value"]'), SelectMultiple: P('false'),
          ...(i.def ? { DefaultSelectedItems: P(`Filter(tbl_LookupValue, list = ${q(i.list)} && value = ${q(i.def)})`) } : {}) } } })
        value = `${n}.Selected.value`; if (i.required) required.push(`IsBlank(${n}.Selected.value)`)
        manual.push([n, 'Combo box', `Items = ${items} · DisplayFields = ["value"]${i.def ? ` · default "${i.def}"` : ''}`])
        break
      }
      case 'record': {
        const items = i.filter ? `Filter(${i.table}, ${i.filter})` : i.table
        ctls.push({ [n]: { Control: 'Classic/ComboBox', Properties: { ...geo, Items: P(`SortByColumns(${items}, ${q(i.display)})`), DisplayFields: P(`[${q(i.display)}]`), SearchFields: P(`[${q(i.display)}]`), SelectMultiple: P('false') } } })
        value = i.idCol ? `${n}.Selected.${i.idCol} & ": " & ${n}.Selected.${i.display}` : `${n}.Selected.id`
        if (i.required) required.push(`IsBlank(${n}.Selected)`)
        manual.push([n, 'Combo box', `Items = SortByColumns(${items}, "${i.display}") · DisplayFields = ["${i.display}"]`])
        break
      }
      case 'text': case 'time': case 'multiline':
        ctls.push({ [n]: { Control: 'Classic/TextInput', Properties: { ...geo, Default: P(i.def ?? '""'), ...(i.kind === 'multiline' ? { Mode: P('TextMode.MultiLine') } : {}), HintText: P(q(i.kind === 'time' ? 'HH:MM' : '')) } } })
        value = `If(IsBlank(${n}.Text), Blank(), ${n}.Text)`; if (i.required) required.push(`IsBlank(${n}.Text)`)
        manual.push([n, `Text input${i.kind === 'multiline' ? ' (multi-line)' : ''}`, `Default = ${i.def ?? '""'}`])
        break
      case 'number':
        ctls.push({ [n]: { Control: 'Classic/TextInput', Properties: { ...geo, Default: P(i.def ?? '""'), Format: P('TextFormat.Number') } } })
        value = `If(IsBlank(${n}.Text), Blank(), Value(${n}.Text))`
        manual.push([n, 'Text input (number)', `Format = TextFormat.Number${i.def ? ` · Default = ${i.def}` : ''}`])
        break
      case 'date':
        ctls.push({ [n]: { Control: 'Classic/DatePicker', Properties: { ...geo, DefaultDate: P(i.def ?? 'Blank()'), Format: P('"yyyy-mm-dd"') } } })
        value = `If(IsBlank(${n}.SelectedDate), Blank(), Text(${n}.SelectedDate, "yyyy-mm-dd"))`; if (i.required) required.push(`IsBlank(${n}.SelectedDate)`)
        manual.push([n, 'Date picker', `DefaultDate = ${i.def ?? 'Blank()'} · saved as text yyyy-mm-dd`])
        break
      case 'score':
        ctls.push({ [n]: { Control: 'Classic/DropDown', Properties: { ...geo, Items: P(`[${i.options.join(', ')}]`), Default: P('3') } } })
        value = `${n}.Selected.Value`
        manual.push([n, 'Drop down', `Items = [${i.options.join(', ')}]`])
        break
      case 'toggle':
        ctls.push({ [n]: { Control: 'Classic/Toggle', Properties: { ...geo, Default: P('false') } } })
        value = `${n}.Value`
        manual.push([n, 'Toggle', 'Default = false'])
        break
    }
    resets.push(`Reset(${n})`)
    if (i.col === 'progress') {
      // coach validation keeps the progress inside the evidence record (title + description)
    } else record.push(`${i.col}: ${value}`)
    if (wide || colIdx === 1) { row++; colIdx = 0 } else colIdx = 1
  }
  if (f.key === 'Evidence') {
    const desc = record.findIndex((r) => r.startsWith('description:'))
    record[desc] = `description: "Progress " & ddEvidenceProgress.Selected.Value & "/5. " & txtEvidenceDescription.Text`
    record.push('submittedBy: "Coach"')
  }
  if (f.audit) record.push('createdAt: Text(Now(), "yyyy-mm-dd hh:mm:ss")', 'createdBy: User().FullName', 'updatedAt: Text(Now(), "yyyy-mm-dd hh:mm:ss")', 'updatedBy: User().FullName')
  const by = y0 + (colIdx ? row + 1 : row) * rowH + 8
  const patch = `Patch(${f.table}, Defaults(${f.table}), {\n    ${record.join(',\n    ')}\n});\nNotify(${q(`${f.title} saved. It appears in the report after the next refresh.`)}, NotificationType.Success);\n${resets.filter((r) => !r.includes('Person')).join('; ')}`
  ctls.push({ [`btn${k}Save`]: { Control: 'Classic/Button', Properties: {
    Text: P('"Save"'), X: P(`${x0}`), Y: P(`${by}`), Width: P('160'), Height: P('44'),
    Fill: P('RGBA(147, 201, 38, 1)'), Color: P('RGBA(20, 30, 18, 1)'), HoverFill: P('RGBA(125, 176, 26, 1)'), RadiusTopLeft: P('22'), RadiusTopRight: P('22'), RadiusBottomLeft: P('22'), RadiusBottomRight: P('22'),
    DisplayMode: P(`If(${required.join(' || ') || 'false'}, DisplayMode.Disabled, DisplayMode.Edit)`),
    OnSelect: P(patch),
  } } })
  ctls.push({ [`btn${k}Clear`]: { Control: 'Classic/Button', Properties: {
    Text: P('"Clear"'), X: P(`${x0 + 176}`), Y: P(`${by}`), Width: P('120'), Height: P('44'),
    Fill: P('RGBA(255, 255, 255, 1)'), Color: P('RGBA(20, 30, 18, 1)'), BorderColor: P('RGBA(0, 26, 0, 0.15)'), BorderThickness: P('1'), HoverFill: P('RGBA(0, 39, 0, 0.05)'),
    RadiusTopLeft: P('22'), RadiusTopRight: P('22'), RadiusBottomLeft: P('22'), RadiusBottomRight: P('22'), OnSelect: P(resets.join('; ')),
  } } })
  manual.push([`btn${k}Save`, 'Button', 'OnSelect: see the Patch formula below'])
  const container: Ctl = { [`con${k}`]: { Control: 'GroupContainer', Variant: 'ManualLayout', Properties: { X: P('0'), Y: P('0'), Width: P('Parent.Width'), Height: P('Parent.Height'), Fill: P('RGBA(255, 255, 251, 1)') }, Children: ctls } }
  return { yaml: [container], manual, patch }
}

/** Observation scores: one person, one session day, the 25 behaviours in a gallery. */
function observationControls(): { yaml: Ctl[]; patch: string } {
  const k = 'Obs'
  const patch = `With({tr: LookUp(tbl_TrainingRecord, employeeId = cbObsPerson.Selected.id && sessionId = cbObsSession.Selected.id), dayId: "OBS-PA" & Text(Now(), "yymmddhhmmss")},
    If(IsBlank(tr.id),
        Notify("This person is not on that session. Add a training record first.", NotificationType.Error),
        Patch(tbl_ObservationDay, Defaults(tbl_ObservationDay), {
            id: dayId, trainingRecordId: tr.id, dayNumber: ddObsDay.Selected.Value,
            date: Text(dpObsDate.SelectedDate, "yyyy-mm-dd"), attendance: cbObsAttendance.Selected.value,
            potentialNote: cbObsPotential.Selected.value, notes: txtObsNotes.Text, source: "Trainer sheet",
            createdAt: Text(Now(), "yyyy-mm-dd hh:mm:ss"), createdBy: User().FullName, updatedAt: Text(Now(), "yyyy-mm-dd hh:mm:ss"), updatedBy: User().FullName
        });
        ForAll(Filter(galObs.AllItems, !IsBlank(ThisRecord.ddObsScore.Selected.Value) && ThisRecord.ddObsScore.Selected.Value <> ""),
            Patch(tbl_ObservationScore, Defaults(tbl_ObservationScore), {
                id: dayId & "-" & ThisRecord.code, observationDayId: dayId, parameterId: ThisRecord.id, score: ThisRecord.ddObsScore.Selected.Value
            })
        );
        Notify("Day " & ddObsDay.Selected.Value & " saved for " & cbObsPerson.Selected.name, NotificationType.Success)
    )
)`
  const L = (n: string, t: string, x: number, y: number, w = 300) => ({ [n]: { Control: 'Label', Properties: { Text: P(q(t)), X: P(`${x}`), Y: P(`${y}`), Width: P(`${w}`), Height: P('22'), Size: P('10'), Color: P('RGBA(96, 103, 96, 1)') } } })
  const combo = (n: string, items: string, display: string, x: number, y: number, w: number, def?: string) => ({ [n]: { Control: 'Classic/ComboBox', Properties: { X: P(`${x}`), Y: P(`${y}`), Width: P(`${w}`), Height: P('40'), Items: P(items), DisplayFields: P(`[${q(display)}]`), SearchFields: P(`[${q(display)}]`), SelectMultiple: P('false'), ...(def ? { DefaultSelectedItems: P(def) } : {}) } } })
  const ctls: Ctl[] = [
    { lblObsTitle: { Control: 'Label', Properties: { Text: P('"Observation scores (cross-functional table)"'), X: P('24'), Y: P('16'), Width: P('900'), Height: P('40'), Size: P('20'), FontWeight: P('FontWeight.Semibold'), Color: P('RGBA(20, 30, 18, 1)') } } },
    { lblObsSub: { Control: 'Label', Properties: { Text: P('"One person, one programme day: attendance, the 25 behaviours (1–5), potential / risk note and assessor notes."'), X: P('24'), Y: P('56'), Width: P('900'), Height: P('30'), Size: P('11'), Color: P('RGBA(107, 113, 106, 1)') } } },
    L('lblObsPerson', 'Attendee *', 24, 96), combo('cbObsPerson', 'SortByColumns(tbl_Employee, "name")', 'name', 24, 120, 300, 'Filter(tbl_Employee, id = First(PowerBIIntegration.Data).\'Employee ID\')'),
    L('lblObsSession', 'Session *', 340, 96), combo('cbObsSession', 'SortByColumns(Filter(tbl_CourseSession, id in Filter(tbl_TrainingRecord, employeeId = cbObsPerson.Selected.id).sessionId), "startDate", SortOrder.Descending)', 'id', 340, 120, 220),
    L('lblObsDay', 'Day', 576, 96, 80), { ddObsDay: { Control: 'Classic/DropDown', Properties: { X: P('576'), Y: P('120'), Width: P('80'), Height: P('40'), Items: P('[1, 2, 3, 4, 5]') } } },
    L('lblObsDate', 'Date', 672, 96, 160), { dpObsDate: { Control: 'Classic/DatePicker', Properties: { X: P('672'), Y: P('120'), Width: P('170'), Height: P('40'), DefaultDate: P('Today()'), Format: P('"yyyy-mm-dd"') } } },
    L('lblObsAttendance', 'Attendance', 858, 96, 160), combo('cbObsAttendance', 'Sort(Filter(tbl_LookupValue, list = "attendance" && active), sortOrder)', 'value', 858, 120, 160, 'Filter(tbl_LookupValue, list = "attendance" && value = "Present")'),
    {
      galObs: {
        Control: 'Gallery', Variant: 'Vertical',
        Properties: { X: P('24'), Y: P('176'), Width: P('820'), Height: P('Parent.Height - 200'), Items: P('SortByColumns(Filter(tbl_ObservationParameter, active), "sortOrder")'), TemplateSize: P('44'), TemplatePadding: P('0') },
        Children: [
          { lblObsParam: { Control: 'Label', Properties: { Text: P('ThisItem.name'), X: P('8'), Y: P('4'), Width: P('420'), Height: P('36'), Size: P('11') } } },
          { lblObsCat: { Control: 'Label', Properties: { Text: P('ThisItem.category'), X: P('436'), Y: P('4'), Width: P('230'), Height: P('36'), Size: P('10'), Color: P('RGBA(107, 113, 106, 1)') } } },
          { ddObsScore: { Control: 'Classic/DropDown', Properties: { X: P('676'), Y: P('4'), Width: P('120'), Height: P('36'), Items: P('["", "1", "2", "3", "4", "5"]'), Default: P('""') } } },
        ],
      },
    },
    L('lblObsPotential', 'Potential / risk note', 868, 176, 360), combo('cbObsPotential', 'Sort(Filter(tbl_LookupValue, list = "potentialNote" && active), sortOrder)', 'value', 868, 200, 360),
    L('lblObsNotes', 'Assessor notes', 868, 256, 360), { txtObsNotes: { Control: 'Classic/TextInput', Properties: { X: P('868'), Y: P('280'), Width: P('360'), Height: P('160'), Mode: P('TextMode.MultiLine'), Default: P('""') } } },
    { btnObsSave: { Control: 'Classic/Button', Properties: { Text: P('"Save day"'), X: P('868'), Y: P('460'), Width: P('160'), Height: P('44'), Fill: P('RGBA(147, 201, 38, 1)'), Color: P('RGBA(20, 30, 18, 1)'),
      RadiusTopLeft: P('22'), RadiusTopRight: P('22'), RadiusBottomLeft: P('22'), RadiusBottomRight: P('22'),
      DisplayMode: P('If(IsBlank(cbObsPerson.Selected.id) || IsBlank(cbObsSession.Selected.id), DisplayMode.Disabled, DisplayMode.Edit)'), OnSelect: P(patch) } } },
  ]
  // the dropdown holds text so an empty choice is possible; store it as a number
  const fixed = patch.replace('score: ThisRecord.ddObsScore.Selected.Value', 'score: Value(ThisRecord.ddObsScore.Selected.Value)')
  ;(ctls[ctls.length - 1] as any).btnObsSave.Properties.OnSelect = P(fixed)
  return { yaml: [{ [`con${k}`]: { Control: 'GroupContainer', Variant: 'ManualLayout', Properties: { X: P('0'), Y: P('0'), Width: P('Parent.Width'), Height: P('Parent.Height'), Fill: P('RGBA(255, 255, 251, 1)') }, Children: ctls } }], patch: fixed }
}

/** Menu with one button per form (for the first screen). */
function menuControls(): Ctl[] {
  const items = [...FORMS.map((f) => [f.key, f.title]), ['Obs', 'Observation scores']]
  return [{ conMenu: { Control: 'GroupContainer', Variant: 'ManualLayout', Properties: { X: P('0'), Y: P('0'), Width: P('Parent.Width'), Height: P('Parent.Height'), Fill: P('RGBA(255, 255, 251, 1)') }, Children: [
    { lblMenuTitle: { Control: 'Label', Properties: { Text: P('"Ballon TD · data entry"'), X: P('24'), Y: P('16'), Width: P('900'), Height: P('40'), Size: P('20'), FontWeight: P('FontWeight.Semibold') } } },
    { lblMenuPerson: { Control: 'Label', Properties: { Text: P('"Selected in the report: " & Coalesce(First(PowerBIIntegration.Data).\'Full name\', "nobody (pick a person on each form)")'), X: P('24'), Y: P('56'), Width: P('900'), Height: P('30'), Size: P('11'), Color: P('RGBA(107, 113, 106, 1)') } } },
    ...items.map(([key, title], i) => ({ [`btnMenu${key}`]: { Control: 'Classic/Button', Properties: {
      Text: P(q(title)), X: P(`${24 + (i % 2) * 336}`), Y: P(`${104 + Math.floor(i / 2) * 64}`), Width: P('320'), Height: P('48'), Fill: P('RGBA(228, 247, 199, 1)'), Color: P('RGBA(93, 119, 13, 1)'),
      RadiusTopLeft: P('12'), RadiusTopRight: P('12'), RadiusBottomLeft: P('12'), RadiusBottomRight: P('12'), OnSelect: P(`Navigate(scr${key}, ScreenTransition.None)`),
    } } })),
  ] } }]
}

const BACK = (k: string): Ctl => ({ [`btn${k}Back`]: { Control: 'Classic/Button', Properties: { Text: P('"← Menu"'), X: P('Parent.Width - 144'), Y: P('20'), Width: P('120'), Height: P('36'), Fill: P('RGBA(255, 255, 255, 1)'), Color: P('RGBA(20, 30, 18, 1)'), BorderColor: P('RGBA(0, 26, 0, 0.15)'), BorderThickness: P('1'), OnSelect: P('Navigate(scrMenu, ScreenTransition.None)') } } })

/**
 * YAML emitter that follows the Power Fx YAML formula grammar: every formula starts with "=",
 * and a formula containing ":" or "#" (or a line break) uses the multiline |- form, because
 * single-line formulas may not contain them and YAML quoting is not supported.
 */
export function emit(ctls: Ctl[], indentN: number): string {
  const pad = (n: number) => ' '.repeat(n)
  const out: string[] = []
  for (const item of ctls) {
    const [name, c] = Object.entries(item)[0]
    out.push(`${pad(indentN)}- ${name}:`)
    const b = indentN + 4
    out.push(`${pad(b)}Control: ${c.Control}`)
    if (c.Variant) out.push(`${pad(b)}Variant: ${c.Variant}`)
    out.push(`${pad(b)}Properties:`)
    for (const [k, v] of Object.entries(c.Properties)) {
      if (!v.startsWith('=')) throw new Error(`${name}.${k} must start with =`)
      if (/[:#\n]/.test(v)) out.push(`${pad(b + 2)}${k}: |-`, ...v.split('\n').map((l) => `${pad(b + 4)}${l}`))
      else out.push(`${pad(b + 2)}${k}: ${v}`)
    }
    if (c.Children?.length) { out.push(`${pad(b)}Children:`); out.push(emit(c.Children, b + 2).replace(/\n$/, '')) }
  }
  return out.join('\n') + '\n'
}

export function buildPowerApps() {
  fs.rmSync(PA_DIR, { recursive: true, force: true })
  fs.mkdirSync(PA_DIR, { recursive: true })
  const doc = (ctls: Ctl[]) => emit(ctls, 0)
  const screens: Record<string, { Children: Ctl[] }> = {}
  const out: { file: string; screen: string; title: string; manual: [string, string, string][]; patch: string; table: string }[] = []
  const menu = menuControls()
  fs.writeFileSync(path.join(PA_DIR, '00-Menu.yaml'), doc(menu))
  screens.scrMenu = { Children: menu }
  FORMS.forEach((f, i) => {
    const { yaml, manual, patch } = controlsFor(f)
    const c = Object.values(yaml[0])[0]
    c.Children!.push(BACK(f.key))
    const file = `${String(i + 1).padStart(2, '0')}-${f.key}.yaml`
    fs.writeFileSync(path.join(PA_DIR, file), doc(yaml))
    screens[`scr${f.key}`] = { Children: yaml }
    out.push({ file, screen: `scr${f.key}`, title: f.title, manual, patch, table: f.table })
  })
  const obs = observationControls()
  Object.values(obs.yaml[0])[0].Children!.push(BACK('Obs'))
  fs.writeFileSync(path.join(PA_DIR, '07-Observation.yaml'), doc(obs.yaml))
  screens.scrObs = { Children: obs.yaml }
  out.push({ file: '07-Observation.yaml', screen: 'scrObs', title: 'Observation scores', manual: [['cbObsPerson / cbObsSession / ddObsDay / dpObsDate / cbObsAttendance', 'Combo boxes, drop down, date picker', 'see 07-Observation.yaml'], ['galObs', 'Blank vertical gallery', 'Items = SortByColumns(Filter(tbl_ObservationParameter, active), "sortOrder") · inside: two labels (ThisItem.name, ThisItem.category) and drop down ddObsScore with Items = ["", "1", "2", "3", "4", "5"]'], ['btnObsSave', 'Button', 'OnSelect: see below']], patch: obs.patch, table: 'tbl_ObservationDay + tbl_ObservationScore' })
  // complete app source in pa.yaml v3 form (for reference and schema validation)
  fs.writeFileSync(path.join(PA_DIR, 'all-screens.pa.yaml'), 'Screens:\n' + Object.entries(screens).map(([n, sc]) => `  ${n}:\n    Children:\n${emit(sc.Children, 6)}`).join(''))
  return out
}

if (process.argv[1]?.endsWith('powerapps.ts')) {
  const r = buildPowerApps()
  console.log(`Wrote ${r.length + 1} Power Apps screens to powerbi/powerapps`)
}
