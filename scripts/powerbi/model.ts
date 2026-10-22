// Semantic model definition for the Power BI version: tables (from the data workbook),
// friendly column names, Power Query (M) per table, relationships and DAX measures.
// build.ts turns this into TMDL; validate.ts checks it.
import { ENTITY, type Entity, type Field } from '../../shared/entities.ts'

export type MCol = {
  name: string // column name in the model
  source: string // column name in the workbook (or derived)
  dataType: 'string' | 'int64' | 'double' | 'dateTime' | 'boolean'
  hidden?: boolean
  isKey?: boolean
  isDate?: boolean
  formatString?: string
  description?: string
  summarize?: 'none' | 'sum' | 'average'
}
export type CalcCol = { name: string; dax: string; dataType: MCol['dataType']; formatString?: string; description?: string }
export type MTable = { name: string; description: string; columns: MCol[]; calcColumns?: CalcCol[]; m: string; hidden?: boolean }
export type Measure = { name: string; dax: string; formatString?: string; folder: string; description: string }
export type Rel = { from: [string, string]; to: [string, string] }

// ------------------------------------------------------------------ helpers
const ID_NAME: Record<string, string> = { Employee: 'Employee ID', Competency: 'Competency ID' }
const idName = (table: string) => ID_NAME[table] ?? 'ID'
const mStr = (s: string) => `"${s.replace(/"/g, '""')}"`
const mList = (xs: string[]) => `{${xs.map(mStr).join(', ')}}`

function dataTypeOf(f: Pick<Field, 'type'> | { type: string }): MCol['dataType'] {
  switch (f.type) {
    case 'int': case 'level': return 'int64'
    case 'number': case 'percent': return 'double'
    case 'date': case 'datetime': return 'dateTime'
    case 'bool': return 'boolean'
    default: return 'string'
  }
}
const converter = (t: MCol['dataType'], isDateTime: boolean) =>
  t === 'int64' ? 'ToInt, Int64.Type' : t === 'double' ? 'ToNumber, type nullable number' : t === 'boolean' ? 'ToBool, type nullable logical'
    : t === 'dateTime' ? (isDateTime ? 'ToDateTime, type nullable datetime' : 'ToDate, type nullable date') : 'ToText, type nullable text'

type Merge = { key: string; table: string; take: string; as: string; on?: string }

/** A model table built from one workbook table: select, type, merge names, rename. */
function fromEntity(e: Entity, opts: { relRefs: string[]; merges?: Merge[]; extra?: { name: string; m: string; dataType: MCol['dataType']; formatString?: string }[]; skip?: string[]; description?: string; calc?: CalcCol[] }): MTable {
  const used = new Set<string>()
  const cols: MCol[] = []
  const add = (c: MCol) => { let n = c.name; let i = 2; while (used.has(n.toLowerCase())) n = `${c.name} (${i++})`; used.add(n.toLowerCase()); cols.push({ ...c, name: n }) }
  add({ name: idName(e.table), source: 'id', dataType: 'string', summarize: 'none', isKey: true })
  const srcCols: { source: string; type: MCol['dataType']; isDateTime: boolean }[] = [{ source: 'id', type: 'string', isDateTime: false }]
  for (const f of e.fields) {
    if (opts.skip?.includes(f.name)) continue
    const dt = dataTypeOf(f)
    srcCols.push({ source: f.name, type: dt, isDateTime: false })
    if (f.type === 'ref') {
      add({ name: f.name, source: f.name, dataType: 'string', hidden: true, summarize: 'none', description: `Key of ${ENTITY[f.ref!].table}.` })
    } else {
      add({ name: f.label, source: f.name, dataType: dt, isDate: f.type === 'date', formatString: f.type === 'date' ? 'yyyy-mm-dd' : f.type === 'percent' ? '0' : undefined, summarize: 'none', description: f.help })
    }
  }
  if (e.audit) for (const [k, label] of [['createdAt', 'Created'], ['createdBy', 'Created by'], ['updatedAt', 'Last changed'], ['updatedBy', 'Changed by']] as const) {
    const dt = k.endsWith('At') ? 'dateTime' : 'string'
    srcCols.push({ source: k, type: dt, isDateTime: true })
    add({ name: label, source: k, dataType: dt, formatString: dt === 'dateTime' ? 'yyyy-mm-dd hh:mm' : undefined, hidden: true, summarize: 'none' })
  }
  const steps: string[] = []
  steps.push(`Source = Raw(${mStr(`tbl_${e.table}`)})`)
  steps.push(`Selected = Table.SelectColumns(Source, ${mList(srcCols.map((c) => c.source))}, MissingField.UseNull)`)
  steps.push(`Typed = Table.TransformColumns(Selected, {${srcCols.map((c) => `{${mStr(c.source)}, ${converter(c.type, c.isDateTime)}}`).join(', ')}})`)
  steps.push(`Rows = Table.SelectRows(Typed, each [id] <> null)`)
  let last = 'Rows'
  ;(opts.merges ?? []).forEach((mg, i) => {
    steps.push(`J${i} = Table.NestedJoin(${last}, {${mStr(mg.key)}}, Table.SelectColumns(Raw(${mStr(`tbl_${mg.table}`)}), {${mStr(mg.on ?? 'id')}, ${mStr(mg.take)}}, MissingField.UseNull), {${mStr(mg.on ?? 'id')}}, "_j${i}", JoinKind.LeftOuter)`)
    steps.push(`X${i} = Table.ExpandTableColumn(J${i}, "_j${i}", {${mStr(mg.take)}}, {${mStr(mg.as)}})`)
    last = `X${i}`
    add({ name: mg.as, source: mg.as, dataType: 'string', summarize: 'none' })
  })
  ;(opts.extra ?? []).forEach((x, i) => {
    steps.push(`A${i} = Table.AddColumn(${last}, ${mStr(x.name)}, ${x.m}, ${x.dataType === 'int64' ? 'Int64.Type' : x.dataType === 'double' ? 'type nullable number' : x.dataType === 'dateTime' ? 'type nullable date' : x.dataType === 'boolean' ? 'type nullable logical' : 'type nullable text'})`)
    last = `A${i}`
    add({ name: x.name, source: x.name, dataType: x.dataType, isDate: x.dataType === 'dateTime', formatString: x.formatString ?? (x.dataType === 'dateTime' ? 'yyyy-mm-dd' : undefined), summarize: 'none' })
  })
  const renames = cols.filter((c) => c.source !== c.name).map((c) => `{${mStr(c.source)}, ${mStr(c.name)}}`)
  steps.push(`Renamed = Table.RenameColumns(${last}, {${renames.join(', ')}})`)
  for (const c of cols) c.source = c.name
  const m = `let\n${steps.map((s) => `    ${s}`).join(',\n')}\nin\n    Renamed`
  return { name: e.table, description: opts.description ?? e.description, columns: cols, calcColumns: opts.calc, m }
}

// ------------------------------------------------------------------ shared Power Query expressions
export const DEFAULT_DATA_FILE = 'C:\\BallonTD\\BallonTD_Data.xlsx'
export const EXPRESSIONS: { name: string; m: string; kind: 'parameter' | 'function' | 'table'; description: string }[] = [
  { name: 'DataFile', kind: 'parameter', m: mStr(DEFAULT_DATA_FILE), description: 'Full path of BallonTD_Data.xlsx. For SharePoint/OneDrive see the Workbook query.' },
  {
    name: 'Workbook', kind: 'table', description: 'The data workbook. Local file by default; switch to the SharePoint line when the file lives in SharePoint or OneDrive for Business.',
    m: `let\n    // Local file (Power BI Desktop, or the service through a gateway):\n    Source = Excel.Workbook(File.Contents(DataFile), null, true)\n    // SharePoint / OneDrive for Business (no gateway needed) - paste the file URL into DataFile and use instead:\n    // Source = Excel.Workbook(Web.Contents(DataFile), null, true)\nin\n    Source`,
  },
  { name: 'Raw', kind: 'function', description: 'Returns one Excel table of the workbook by name.', m: `(tableName as text) as table =>\n    Workbook{[Item = tableName, Kind = "Table"]}[Data]` },
  { name: 'ToText', kind: 'function', description: 'Any value to trimmed text; empty becomes null.', m: `(v as any) as nullable text =>\n    if v = null then null\n    else\n        let t = Text.Trim(Text.From(v))\n        in if t = "" then null else t` },
  { name: 'ToNumber', kind: 'function', description: 'Any value to number; text uses en-US; failures become null.', m: `(v as any) as nullable number =>\n    if v = null or v = "" then null\n    else if v is number then v\n    else try Number.From(Text.Replace(Text.From(v), "%", ""), "en-US") otherwise null` },
  { name: 'ToInt', kind: 'function', description: 'Any value to a whole number.', m: `(v as any) as nullable number =>\n    let n = ToNumber(v)\n    in if n = null then null else Number.Round(n, 0)` },
  { name: 'ToBool', kind: 'function', description: 'TRUE/FALSE, Yes/No, 1/0 to logical.', m: `(v as any) as nullable logical =>\n    if v = null or v = "" then null\n    else if v is logical then v\n    else List.Contains({"true", "yes", "1"}, Text.Lower(Text.Trim(Text.From(v))))` },
  { name: 'ToDate', kind: 'function', description: 'ISO text (2026-10-22, also with a time part), Excel serial numbers and real dates to date.', m: `(v as any) as nullable date =>\n    if v = null or v = "" then null\n    else if v is date then v\n    else if v is datetime then Date.From(v)\n    else if v is datetimezone then Date.From(DateTimeZone.RemoveZone(v))\n    else if v is number then Date.From(v)\n    else try Date.FromText(Text.Start(Text.Trim(Text.From(v)), 10), [Format = "yyyy-MM-dd"]) otherwise null` },
  { name: 'ToDateTime', kind: 'function', description: 'ISO text (2026-10-22 15:56:16) and real date-times to datetime.', m: `(v as any) as nullable datetime =>\n    if v = null or v = "" then null\n    else if v is datetime then v\n    else if v is date then DateTime.From(v)\n    else if v is datetimezone then DateTimeZone.RemoveZone(v)\n    else if v is number then DateTime.From(v)\n    else\n        let t = Text.Replace(Text.Start(Text.Trim(Text.From(v)), 19), "T", " ")\n        in try DateTime.FromText(t, [Format = "yyyy-MM-dd HH:mm:ss"]) otherwise ToDate(v)` },
  {
    name: 'CurrentLevels', kind: 'table', description: 'Latest completed rating per person and competency: a validation/consultant assessment wins over a self-assessment, newest first. Not loaded; used by CurrentCompetency and NextRoleGap.',
    m: `let
    R = Table.SelectColumns(Raw("tbl_AssessmentRating"), {"assessmentId", "competencyId", "level", "requiredLevel", "priority"}, MissingField.UseNull),
    A = Table.SelectColumns(Raw("tbl_Assessment"), {"id", "employeeId", "type", "date", "status"}, MissingField.UseNull),
    J = Table.ExpandTableColumn(Table.NestedJoin(R, {"assessmentId"}, A, {"id"}, "a", JoinKind.Inner), "a", {"employeeId", "type", "date", "status"}),
    T = Table.TransformColumns(J, {{"level", ToNumber, type nullable number}, {"requiredLevel", ToNumber, type nullable number}, {"date", ToDate, type nullable date}, {"employeeId", ToText, type nullable text}, {"competencyId", ToText, type nullable text}, {"priority", ToText, type nullable text}, {"type", ToText, type nullable text}, {"status", ToText, type nullable text}}),
    Done = Table.SelectRows(T, each ([status] = null or [status] = "Completed") and [level] <> null and [employeeId] <> null),
    Flag = Table.AddColumn(Done, "isSelf", each if [type] = "Self-Assessment" then 1 else 0, Int64.Type),
    G = Table.Group(Flag, {"employeeId", "competencyId"}, {
        {"best", each Table.First(Table.Sort(_, {{"isSelf", Order.Ascending}, {"date", Order.Descending}})), type record},
        {"Self level", each let s = Table.Sort(Table.SelectRows(_, each [isSelf] = 1), {{"date", Order.Descending}}) in if Table.IsEmpty(s) then null else s{0}[level], type nullable number}
    }),
    X = Table.ExpandRecordColumn(G, "best", {"level", "requiredLevel", "priority", "type", "date"}, {"Level", "RatingRequired", "RatingPriority", "Source", "Source date"})
in
    X`,
  },
]

// ------------------------------------------------------------------ tables
const SEGMENT_M = `each let t = if [title] = null then "" else [title] in
            if Text.StartsWith(t, "S1") then "S1 · Professional certification"
            else if Text.StartsWith(t, "S2") then "S2 · Immersive labs"
            else if Text.StartsWith(t, "S3") then "S3 · AI certification"
            else if Text.StartsWith(t, "S4") then "S4 · SAP SuccessFactors"
            else if Text.StartsWith(t, "S5") then "S5 · Cross-functional training"
            else if [actionType] = "Department Training Need" then "Department training need"
            else if [actionType] = "Project Assignment" then "Workplace assignment"
            else [actionType]`

export function buildTables(): MTable[] {
  const E = ENTITY
  const t: MTable[] = []
  t.push(fromEntity(E.clients, { relRefs: [] }))
  t.push(fromEntity(E.programs, { relRefs: [], merges: [{ key: 'clientId', table: 'Client', take: 'name', as: 'Client' }] }))
  t.push(fromEntity(E.staff, { relRefs: [] }))
  t.push(fromEntity(E.competencies, {
    relRefs: [],
    merges: [{ key: 'categoryId', table: 'CompetencyCategory', take: 'name', as: 'Category' }, { key: 'categoryId', table: 'CompetencyCategory', take: 'frameworkId', as: 'frameworkKey' }],
    description: 'The competency library, with category and framework names merged in.',
  }))
  // add framework name through the merged framework key
  const comp = t[t.length - 1]
  comp.m = comp.m.replace('    Renamed = ', '    F0 = Table.ExpandTableColumn(Table.NestedJoin(X1, {"frameworkKey"}, Table.SelectColumns(Raw("tbl_Framework"), {"id", "name"}, MissingField.UseNull), {"id"}, "_f", JoinKind.LeftOuter), "_f", {"name"}, {"Framework"}),\n    Renamed = ').replace('Table.RenameColumns(X1,', 'Table.RenameColumns(F0,')
  comp.columns.find((c) => c.name === 'frameworkKey')!.hidden = true
  comp.columns.push({ name: 'Framework', source: 'Framework', dataType: 'string', summarize: 'none' })
  t.push(fromEntity(E.behaviors, { relRefs: [] }))
  t.push(fromEntity(E.roles, { relRefs: [], merges: [{ key: 'nextRoleId', table: 'JobRole', take: 'name', as: 'Next role' }] }))
  t.push(fromEntity(E.requirements, { relRefs: [], extra: [{ name: 'Weight', dataType: 'int64', m: 'each if [priority] = "High" then 3 else if [priority] = "Low" then 1 else 2' }] }))
  t.push(fromEntity(E.courses, { relRefs: [] }))
  t.push(fromEntity(E.certifications, { relRefs: [] }))
  t.push(fromEntity(E.parameters, { relRefs: [] }))
  t.push(fromEntity(E.employees, {
    relRefs: [],
    merges: [{ key: 'lineManagerId', table: 'Employee', take: 'name', as: 'Line manager' }, { key: 'clientId', table: 'Client', take: 'name', as: 'Client' }, { key: 'jobRoleId', table: 'JobRole', take: 'name', as: 'Role profile' }],
    calc: [
      { name: 'Readiness band', dax: '[Readiness Band Label]', dataType: 'string', description: 'Calculated at refresh from the readiness measures, so it can be used in slicers.' },
    ],
  }))
  t.push(fromEntity(E.enrollments, { relRefs: [], merges: [{ key: 'programId', table: 'Program', take: 'name', as: 'Programme' }, { key: 'coachId', table: 'Staff', take: 'name', as: 'Coach' }, { key: 'consultantId', table: 'Staff', take: 'name', as: 'Consultant' }] }))
  t.push(fromEntity(E.assessments, { relRefs: [], merges: [{ key: 'assessorId', table: 'Staff', take: 'name', as: 'Assessor' }, { key: 'jobRoleId', table: 'JobRole', take: 'name', as: 'Role assessed against' }] }))
  t.push(fromEntity(E.ratings, { relRefs: [] }))
  t.push(fromEntity(E.validations, {
    relRefs: [], merges: [{ key: 'managerId', table: 'Employee', take: 'name', as: 'Manager' }],
    extra: [{ name: 'Month', dataType: 'dateTime', formatString: 'mmm yyyy', m: 'each if [date] = null then null else Date.StartOfMonth([date])' }],
  }))
  t.push(fromEntity(E.idp, { relRefs: [], extra: [{ name: 'Segment', dataType: 'string', m: SEGMENT_M }] }))
  t.push(fromEntity(E.sessions, { relRefs: [], merges: [{ key: 'courseId', table: 'Course', take: 'name', as: 'Course' }, { key: 'trainerId', table: 'Staff', take: 'name', as: 'Trainer' }] }))
  t.push(fromEntity(E.training, { relRefs: [] }))
  t.push(fromEntity(E.observationDays, { relRefs: [], merges: [{ key: 'observerId', table: 'Staff', take: 'name', as: 'Observer' }] }))
  t.push(fromEntity(E.observationScores, { relRefs: [] }))
  t.push(fromEntity(E.certs, { relRefs: [] }))
  t.push(fromEntity(E.coaching, {
    relRefs: [], merges: [{ key: 'coachId', table: 'Staff', take: 'name', as: 'Coach' }],
    extra: [
      { name: 'Total effort (min)', dataType: 'int64', m: 'each List.Sum(List.RemoveNulls({[prepMinutes], [durationMinutes], [reportingMinutes]}))' },
      { name: 'Month', dataType: 'dateTime', formatString: 'mmm yyyy', m: 'each if [date] = null then null else Date.StartOfMonth([date])' },
    ],
  }))
  t.push(fromEntity(E.evidence, { relRefs: [], merges: [{ key: 'verifiedById', table: 'Staff', take: 'name', as: 'Verified by' }] }))

  // derived: current level per person × competency
  t.push({
    name: 'CurrentCompetency',
    description: 'One row per person and competency in their role profile or rated for them: current level, required level, priority, gap. Built from the latest completed ratings.',
    columns: [
      { name: 'employeeId', source: 'employeeId', dataType: 'string', hidden: true, summarize: 'none' },
      { name: 'competencyId', source: 'competencyId', dataType: 'string', hidden: true, summarize: 'none' },
      { name: 'Level', source: 'Level', dataType: 'double', summarize: 'average' },
      { name: 'Required', source: 'Required', dataType: 'double', summarize: 'average' },
      { name: 'Priority', source: 'Priority', dataType: 'string', summarize: 'none' },
      { name: 'Weight', source: 'Weight', dataType: 'int64', summarize: 'sum', hidden: true },
      { name: 'Gap', source: 'Gap', dataType: 'double', summarize: 'sum', description: 'Required − level. Positive = below the requirement.' },
      { name: 'Self level', source: 'Self level', dataType: 'double', summarize: 'average' },
      { name: 'Source', source: 'Source', dataType: 'string', summarize: 'none', description: 'Which assessment type the level comes from.' },
      { name: 'Source date', source: 'Source date', dataType: 'dateTime', isDate: true, formatString: 'yyyy-mm-dd', summarize: 'none' },
    ],
    m: `let
    Rated = CurrentLevels,
    E = Table.TransformColumns(Table.SelectColumns(Raw("tbl_Employee"), {"id", "jobRoleId"}, MissingField.UseNull), {{"id", ToText, type nullable text}, {"jobRoleId", ToText, type nullable text}}),
    Q = Table.TransformColumns(Table.SelectColumns(Raw("tbl_RoleRequirement"), {"jobRoleId", "competencyId", "requiredLevel", "priority"}, MissingField.UseNull), {{"jobRoleId", ToText, type nullable text}, {"competencyId", ToText, type nullable text}, {"requiredLevel", ToNumber, type nullable number}, {"priority", ToText, type nullable text}}),
    EQ = Table.ExpandTableColumn(Table.NestedJoin(E, {"jobRoleId"}, Q, {"jobRoleId"}, "q", JoinKind.Inner), "q", {"competencyId", "requiredLevel", "priority"}, {"competencyId", "RoleRequired", "RolePriority"}),
    Req = Table.RenameColumns(Table.SelectColumns(EQ, {"id", "competencyId", "RoleRequired", "RolePriority"}), {{"id", "employeeId"}}),
    Keys = Table.Distinct(Table.Combine({Table.SelectColumns(Rated, {"employeeId", "competencyId"}), Table.SelectColumns(Req, {"employeeId", "competencyId"})})),
    K1 = Table.ExpandTableColumn(Table.NestedJoin(Keys, {"employeeId", "competencyId"}, Rated, {"employeeId", "competencyId"}, "x", JoinKind.LeftOuter), "x", {"Level", "RatingRequired", "RatingPriority", "Source", "Source date", "Self level"}),
    K2 = Table.ExpandTableColumn(Table.NestedJoin(K1, {"employeeId", "competencyId"}, Req, {"employeeId", "competencyId"}, "y", JoinKind.LeftOuter), "y", {"RoleRequired", "RolePriority"}),
    Required = Table.AddColumn(K2, "Required", each if [RatingRequired] <> null then [RatingRequired] else [RoleRequired], type nullable number),
    Priority = Table.AddColumn(Required, "Priority", each if [RatingPriority] <> null then [RatingPriority] else [RolePriority], type nullable text),
    Weight = Table.AddColumn(Priority, "Weight", each if [Priority] = "High" then 3 else if [Priority] = "Low" then 1 else 2, Int64.Type),
    Gap = Table.AddColumn(Weight, "Gap", each if [Level] = null or [Required] = null then null else [Required] - [Level], type nullable number),
    Out = Table.SelectColumns(Gap, {"employeeId", "competencyId", "Level", "Required", "Priority", "Weight", "Gap", "Self level", "Source", "Source date"}),
    Typed = Table.TransformColumnTypes(Out, {{"employeeId", type text}, {"competencyId", type text}, {"Level", type number}, {"Required", type number}, {"Self level", type number}, {"Source", type text}, {"Source date", type date}})
in
    Typed`,
  })
  t.push({
    name: 'NextRoleGap',
    description: 'Requirements of each person\'s next role (from the role profile\'s "Usual next role"), with the person\'s current level.',
    columns: [
      { name: 'employeeId', source: 'employeeId', dataType: 'string', hidden: true, summarize: 'none' },
      { name: 'competencyId', source: 'competencyId', dataType: 'string', hidden: true, summarize: 'none' },
      { name: 'Next role', source: 'Next role', dataType: 'string', summarize: 'none' },
      { name: 'Next required', source: 'Next required', dataType: 'double', summarize: 'average' },
      { name: 'Next priority', source: 'Next priority', dataType: 'string', summarize: 'none' },
      { name: 'Next weight', source: 'Next weight', dataType: 'int64', summarize: 'sum', hidden: true },
      { name: 'Level now', source: 'Level now', dataType: 'double', summarize: 'average' },
      { name: 'Gap to next role', source: 'Gap to next role', dataType: 'double', summarize: 'sum' },
    ],
    m: `let
    E = Table.TransformColumns(Table.SelectColumns(Raw("tbl_Employee"), {"id", "jobRoleId"}, MissingField.UseNull), {{"id", ToText, type nullable text}, {"jobRoleId", ToText, type nullable text}}),
    R = Table.TransformColumns(Table.SelectColumns(Raw("tbl_JobRole"), {"id", "nextRoleId", "name"}, MissingField.UseNull), {{"id", ToText, type nullable text}, {"nextRoleId", ToText, type nullable text}, {"name", ToText, type nullable text}}),
    Names = Table.RenameColumns(Table.SelectColumns(R, {"id", "name"}), {{"id", "roleId"}, {"name", "Next role"}}),
    EN = Table.ExpandTableColumn(Table.NestedJoin(E, {"jobRoleId"}, R, {"id"}, "r", JoinKind.Inner), "r", {"nextRoleId"}),
    HasNext = Table.SelectRows(EN, each [nextRoleId] <> null),
    WithName = Table.ExpandTableColumn(Table.NestedJoin(HasNext, {"nextRoleId"}, Names, {"roleId"}, "n", JoinKind.LeftOuter), "n", {"Next role"}),
    Q = Table.TransformColumns(Table.SelectColumns(Raw("tbl_RoleRequirement"), {"jobRoleId", "competencyId", "requiredLevel", "priority"}, MissingField.UseNull), {{"jobRoleId", ToText, type nullable text}, {"competencyId", ToText, type nullable text}, {"requiredLevel", ToNumber, type nullable number}, {"priority", ToText, type nullable text}}),
    J = Table.ExpandTableColumn(Table.NestedJoin(WithName, {"nextRoleId"}, Q, {"jobRoleId"}, "q", JoinKind.Inner), "q", {"competencyId", "requiredLevel", "priority"}, {"competencyId", "Next required", "Next priority"}),
    Base = Table.RenameColumns(Table.SelectColumns(J, {"id", "competencyId", "Next role", "Next required", "Next priority"}), {{"id", "employeeId"}}),
    L = Table.ExpandTableColumn(Table.NestedJoin(Base, {"employeeId", "competencyId"}, CurrentLevels, {"employeeId", "competencyId"}, "c", JoinKind.LeftOuter), "c", {"Level"}, {"Level now"}),
    W = Table.AddColumn(L, "Next weight", each if [Next priority] = "High" then 3 else if [Next priority] = "Low" then 1 else 2, Int64.Type),
    G = Table.AddColumn(W, "Gap to next role", each if [Next required] = null then null else [Next required] - (if [Level now] = null then 0 else [Level now]), type nullable number),
    Typed = Table.TransformColumnTypes(G, {{"employeeId", type text}, {"competencyId", type text}, {"Next role", type text}, {"Next required", type number}, {"Next priority", type text}, {"Level now", type number}})
in
    Typed`,
  })
  return t
}

// ------------------------------------------------------------------ relationships (many → one)
export const RELATIONSHIPS: Rel[] = [
  { from: ['Employee', 'clientId'], to: ['Client', 'ID'] },
  { from: ['Employee', 'jobRoleId'], to: ['JobRole', 'ID'] },
  { from: ['RoleRequirement', 'jobRoleId'], to: ['JobRole', 'ID'] },
  { from: ['RoleRequirement', 'competencyId'], to: ['Competency', 'Competency ID'] },
  { from: ['CompetencyBehavior', 'competencyId'], to: ['Competency', 'Competency ID'] },
  { from: ['Enrollment', 'employeeId'], to: ['Employee', 'Employee ID'] },
  { from: ['Enrollment', 'programId'], to: ['Program', 'ID'] },
  { from: ['Assessment', 'employeeId'], to: ['Employee', 'Employee ID'] },
  { from: ['AssessmentRating', 'assessmentId'], to: ['Assessment', 'ID'] },
  { from: ['AssessmentRating', 'competencyId'], to: ['Competency', 'Competency ID'] },
  { from: ['ManagerValidation', 'employeeId'], to: ['Employee', 'Employee ID'] },
  { from: ['ManagerValidation', 'competencyId'], to: ['Competency', 'Competency ID'] },
  { from: ['IdpAction', 'employeeId'], to: ['Employee', 'Employee ID'] },
  { from: ['IdpAction', 'competencyId'], to: ['Competency', 'Competency ID'] },
  { from: ['TrainingRecord', 'employeeId'], to: ['Employee', 'Employee ID'] },
  { from: ['TrainingRecord', 'courseId'], to: ['Course', 'ID'] },
  { from: ['TrainingRecord', 'sessionId'], to: ['CourseSession', 'ID'] },
  { from: ['ObservationDay', 'trainingRecordId'], to: ['TrainingRecord', 'ID'] },
  { from: ['ObservationScore', 'observationDayId'], to: ['ObservationDay', 'ID'] },
  { from: ['ObservationScore', 'parameterId'], to: ['ObservationParameter', 'ID'] },
  { from: ['ObservationParameter', 'competencyId'], to: ['Competency', 'Competency ID'] },
  { from: ['CertificationRecord', 'employeeId'], to: ['Employee', 'Employee ID'] },
  { from: ['CertificationRecord', 'certificationId'], to: ['Certification', 'ID'] },
  { from: ['CoachingSession', 'employeeId'], to: ['Employee', 'Employee ID'] },
  { from: ['Evidence', 'employeeId'], to: ['Employee', 'Employee ID'] },
  { from: ['Evidence', 'competencyId'], to: ['Competency', 'Competency ID'] },
  { from: ['CurrentCompetency', 'employeeId'], to: ['Employee', 'Employee ID'] },
  { from: ['CurrentCompetency', 'competencyId'], to: ['Competency', 'Competency ID'] },
  { from: ['NextRoleGap', 'employeeId'], to: ['Employee', 'Employee ID'] },
  { from: ['NextRoleGap', 'competencyId'], to: ['Competency', 'Competency ID'] },
]

// ------------------------------------------------------------------ measures
export const MEASURES_TABLE = '_Measures'
const q = (t: string) => `'${t.replace(/'/g, "''")}'`
/** Column reference by model table + workbook column name, resolved to the friendly name. */
export function measures(tables: MTable[]): Measure[] {
  const byTable = new Map(tables.map((t) => [t.name, t]))
  const c = (table: string, src: string) => {
    const e = Object.values(ENTITY).find((x) => x.table === table)
    const f = e?.fields.find((x) => x.name === src)
    const name = src === 'id' ? idName(table) : f && f.type !== 'ref' ? byTable.get(table)!.columns.find((x) => x.name.startsWith(f.label))?.name ?? f.label : src
    if (!byTable.get(table)!.columns.some((x) => x.name === name) && !(byTable.get(table)!.calcColumns ?? []).some((x) => x.name === name)) throw new Error(`No column ${table}.${src} (${name})`)
    return `${q(table)}[${name.replace(/]/g, ']]')}]`
  }
  const CC = (n: string) => `'CurrentCompetency'[${n}]`
  const NG = (n: string) => `'NextRoleGap'[${n}]`
  return [
    // people & readiness
    { folder: 'People', name: 'People', dax: `COUNTROWS('Employee')`, formatString: '0', description: 'Number of people in the current filter.' },
    { folder: 'Readiness', name: 'Role Readiness', formatString: '0%', description: 'Σ weight × min(level, required) ÷ Σ weight × required over rated competencies (weights High 3, Medium 2, Low 1).',
      dax: `VAR t = FILTER('CurrentCompetency', NOT ISBLANK(${CC('Level')}) && ${CC('Required')} > 0)\nRETURN DIVIDE(SUMX(t, ${CC('Weight')} * MIN(${CC('Level')}, ${CC('Required')})), SUMX(t, ${CC('Weight')} * ${CC('Required')}))` },
    { folder: 'Readiness', name: 'Average Role Readiness', formatString: '0%', description: 'Average of each person\'s role readiness.', dax: `AVERAGEX(VALUES(${c('Employee', 'id')}), [Role Readiness])` },
    { folder: 'Readiness', name: 'Next Role Readiness', formatString: '0%', description: 'Readiness against the requirements of the next role; unrated competencies count as 0.',
      dax: `VAR t = FILTER('NextRoleGap', ${NG('Next required')} > 0)\nRETURN IF(COUNTROWS(t) = 0 || ISBLANK([Role Readiness]), BLANK(), DIVIDE(SUMX(t, ${NG('Next weight')} * MIN(COALESCE(${NG('Level now')}, 0), ${NG('Next required')})), SUMX(t, ${NG('Next weight')} * ${NG('Next required')})))` },
    { folder: 'Readiness', name: 'Open Gaps', formatString: '0', description: 'Competencies below the required level.', dax: `COUNTROWS(FILTER('CurrentCompetency', ${CC('Gap')} > 0))` },
    { folder: 'Readiness', name: 'Critical Gaps', formatString: '0', description: 'High-priority competencies below the required level.', dax: `COUNTROWS(FILTER('CurrentCompetency', ${CC('Gap')} > 0 && ${CC('Priority')} = "High"))` },
    { folder: 'Readiness', name: 'Competencies Rated', formatString: '0', description: 'Rated competencies that have a requirement.', dax: `COUNTROWS(FILTER('CurrentCompetency', NOT ISBLANK(${CC('Level')}) && NOT ISBLANK(${CC('Required')})))` },
    { folder: 'Readiness', name: 'Average Level', formatString: '0.0', description: '', dax: `AVERAGE(${CC('Level')})` },
    { folder: 'Readiness', name: 'Average Gap', formatString: '+0.0;-0.0;0', description: 'Average of required − level. Positive = below requirement.', dax: `AVERAGE(${CC('Gap')})` },
    { folder: 'Readiness', name: 'Readiness Band Label', description: 'Same rules as the app: Ready for next role ≥ 92% next-role readiness and no critical gaps; Ready in 6–12 months ≥ 85% and ≤ 1 critical gap; Growing in role ≥ 85% role readiness; otherwise Needs support.',
      dax: `VAR rr = [Role Readiness]\nVAR nr = [Next Role Readiness]\nVAR cg = [Critical Gaps] + 0\nRETURN SWITCH(TRUE(), ISBLANK(rr), "Not assessed", NOT ISBLANK(nr) && nr >= 0.92 && cg = 0, "Ready for next role", NOT ISBLANK(nr) && nr >= 0.85 && cg <= 1, "Ready in 6–12 months", rr >= 0.85, "Growing in role", "Needs support")` },
    { folder: 'Readiness', name: 'People Ready Within 12 Months', formatString: '0', description: '', dax: `COUNTROWS(FILTER('Employee', 'Employee'[Readiness band] IN {"Ready for next role", "Ready in 6–12 months"}))` },
    // plan
    { folder: 'Development plan', name: 'Plan Actions', formatString: '0', description: 'Development actions that are not cancelled.', dax: `COUNTROWS(FILTER('IdpAction', ${c('IdpAction', 'status')} <> "Cancelled"))` },
    { folder: 'Development plan', name: 'Plan Actions Completed', formatString: '0', description: '', dax: `COUNTROWS(FILTER('IdpAction', ${c('IdpAction', 'status')} = "Completed"))` },
    { folder: 'Development plan', name: 'Plan Progress', formatString: '0%', description: 'Average progress % of actions that are not cancelled.', dax: `DIVIDE(AVERAGEX(FILTER('IdpAction', ${c('IdpAction', 'status')} <> "Cancelled"), COALESCE(${c('IdpAction', 'progressPct')}, 0)), 100)` },
    { folder: 'Development plan', name: 'Overdue Actions', formatString: '0', description: 'Planned end passed and not completed or cancelled.', dax: `COUNTROWS(FILTER('IdpAction', NOT ISBLANK(${c('IdpAction', 'plannedEnd')}) && ${c('IdpAction', 'plannedEnd')} < TODAY() && NOT (${c('IdpAction', 'status')} IN {"Completed", "Cancelled"})))` },
    // training
    { folder: 'Training', name: 'Trainings Assigned', formatString: '0', description: '', dax: `COUNTROWS('TrainingRecord')` },
    { folder: 'Training', name: 'Trainings Completed', formatString: '0', description: '', dax: `COUNTROWS(FILTER('TrainingRecord', ${c('TrainingRecord', 'status')} = "Completed"))` },
    { folder: 'Training', name: 'Training Completion', formatString: '0%', description: 'Completed ÷ all trainings except cancelled, deferred and expired.', dax: `DIVIDE([Trainings Completed], COUNTROWS(FILTER('TrainingRecord', NOT (${c('TrainingRecord', 'status')} IN {"Cancelled", "Deferred", "Expired"}))))` },
    { folder: 'Training', name: 'Training Hours', formatString: '0', description: 'Hours of completed trainings (record hours, else course hours).', dax: `SUMX(FILTER('TrainingRecord', ${c('TrainingRecord', 'status')} = "Completed"), COALESCE(${c('TrainingRecord', 'hours')}, RELATED(${c('Course', 'durationHours')})))` },
    { folder: 'Training', name: 'Participants', formatString: '0', description: 'People on a session.', dax: `DISTINCTCOUNT(${c('TrainingRecord', 'employeeId')})` },
    { folder: 'Observations', name: 'Observed Average', formatString: '0.00', description: 'Average trainer score (1–5) of observed behaviours.', dax: `AVERAGE(${c('ObservationScore', 'score')})` },
    { folder: 'Observations', name: 'Observed Days', formatString: '0', description: 'Observation days attended.', dax: `COUNTROWS(FILTER('ObservationDay', ${c('ObservationDay', 'attendance')} <> "Absent"))` },
    // certifications
    { folder: 'Certifications', name: 'Certifications', formatString: '0', description: '', dax: `COUNTROWS('CertificationRecord')` },
    { folder: 'Certifications', name: 'Certifications Achieved', formatString: '0', description: '', dax: `COUNTROWS(FILTER('CertificationRecord', ${c('CertificationRecord', 'status')} = "Completed"))` },
    { folder: 'Certifications', name: 'Certifications In Progress', formatString: '0', description: 'Registered, in progress or exam scheduled.', dax: `COUNTROWS(FILTER('CertificationRecord', ${c('CertificationRecord', 'status')} IN {"Registered", "In Progress", "Exam Scheduled"}))` },
    // coaching
    { folder: 'Coaching', name: 'Coaching Sessions', formatString: '0', description: 'Completed coaching sessions.', dax: `COUNTROWS(FILTER('CoachingSession', ${c('CoachingSession', 'status')} = "Completed"))` },
    { folder: 'Coaching', name: 'Coaching Effort Hours', formatString: '0.0', description: 'Preparation + session + reporting time of completed sessions, in hours.', dax: `DIVIDE(SUMX(FILTER('CoachingSession', ${c('CoachingSession', 'status')} = "Completed"), 'CoachingSession'[Total effort (min)]), 60)` },
    { folder: 'Coaching', name: 'Last Coaching', formatString: 'yyyy-mm-dd', description: '', dax: `MAXX(FILTER('CoachingSession', ${c('CoachingSession', 'status')} = "Completed"), ${c('CoachingSession', 'date')})` },
    { folder: 'Coaching', name: 'Latest Coaching Progress', formatString: '0%', description: 'Progress % recorded at the most recent completed session.',
      dax: `VAR d = [Last Coaching]\nRETURN DIVIDE(MAXX(FILTER('CoachingSession', ${c('CoachingSession', 'date')} = d && ${c('CoachingSession', 'status')} = "Completed"), ${c('CoachingSession', 'progressPct')}), 100)` },
    // validation & evidence
    { folder: 'Validation', name: 'Validations', formatString: '0', description: '', dax: `COUNTROWS('ManagerValidation')` },
    { folder: 'Validation', name: 'Validations Pending', formatString: '0', description: '', dax: `COUNTROWS(FILTER('ManagerValidation', ${c('ManagerValidation', 'status')} IN {"Pending", "Requires Further Evidence"}))` },
    { folder: 'Validation', name: 'Average Validated Progress', formatString: '0.0', description: 'Average progress (1–5) given by line managers.', dax: `AVERAGE(${c('ManagerValidation', 'validatedLevel')})` },
    { folder: 'Validation', name: 'Evidence Items', formatString: '0', description: '', dax: `COUNTROWS('Evidence')` },
    { folder: 'Validation', name: 'Evidence Verified', formatString: '0', description: '', dax: `COUNTROWS(FILTER('Evidence', ${c('Evidence', 'verificationStatus')} = "Verified"))` },
  ]
}

/** Resolves a friendly column name for report fields: col('Employee','name') → 'Full name'. */
export function colName(tables: MTable[], table: string, src: string) {
  const t = tables.find((x) => x.name === table)!
  if (src === 'id') return idName(table)
  const e = Object.values(ENTITY).find((x) => x.table === table)
  const f = e?.fields.find((x) => x.name === src)
  const name = f && f.type !== 'ref' ? f.label : src
  const hit = t.columns.find((x) => x.name === name) ?? (t.calcColumns ?? []).find((x) => x.name === name) ?? t.columns.find((x) => x.name === src)
  if (!hit) throw new Error(`No column ${table}.${src}`)
  return hit.name
}
