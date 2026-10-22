// One description of every table, shared by the server (validation, CRUD, Excel export)
// and the app (forms, tables). Field names are exactly the Prisma / database column names,
// so the Excel sheets can be imported into a database without renaming anything.

export type FieldType =
  | 'text' | 'longtext' | 'email' | 'url'
  | 'int' | 'number' | 'percent' | 'level'
  | 'date' | 'bool'
  | 'lookup' | 'multilookup' // values from a LookupValue list
  | 'suggest' // free text, with the values of a LookupValue list offered as suggestions
  | 'ref' // id of a row in another table

export type Field = {
  name: string
  label: string
  type: FieldType
  list?: string // lookup list key
  ref?: string // entity key
  required?: boolean
  help?: string
  min?: number
  max?: number
  /** Hidden in list tables (still in forms and exports). */
  hideInTable?: boolean
  /** Not shown in forms (set by the system or by a dedicated screen). */
  hideInForm?: boolean
  /** Shown in forms only when creating (cannot change afterwards). */
  createOnly?: boolean
  /** Filter option lists of this ref by another field's value: { optionField: formField } */
  dependsOn?: Record<string, string>
  default?: unknown
}

export type Join = {
  name: string // virtual field, e.g. competencyIds
  label: string
  model: string // prisma delegate, e.g. courseCompetency
  table: string // Prisma model / sheet name
  parentKey: string
  childKey: string
  ref: string // entity of the child
}

export type Entity = {
  key: string // also the API path segment
  model: string // prisma delegate name
  table: string // Prisma model name = Excel sheet name
  prefix: string
  pad: number
  label: string
  plural: string
  kind: 'reference' | 'activity'
  description: string
  /** How a row is named in dropdowns and links. Server resolves {field} and {ref.field}. */
  title: string
  /** For dropdowns: which fields are searched / shown as the secondary line. */
  subtitle?: string
  employeeScoped?: boolean // has employeeId (shows on the person page)
  audit?: boolean // has createdAt/updatedAt/createdBy/updatedBy/source
  fields: Field[]
  joins?: Join[]
  orderBy?: Record<string, 'asc' | 'desc'>[]
  /** Unique business key used by the seed and by duplicate checks. */
  naturalKey?: string[]
}

const SOURCE: Field = { name: 'source', label: 'Source', type: 'lookup', list: 'source', hideInTable: true, help: 'Where this came from. Use "Email from client" or "Excel from client" when the client sent it and you are typing it in.' }

export const ENTITIES: Entity[] = [
  // ================================================================== reference
  {
    key: 'lookups', model: 'lookupValue', table: 'LookupValue', prefix: 'LKP', pad: 4,
    label: 'List value', plural: 'Lists', kind: 'reference', title: '{value}',
    description: 'Every dropdown in the app. Add a value here and it appears in the forms straight away.',
    fields: [
      { name: 'list', label: 'List', type: 'text', required: true, createOnly: true },
      { name: 'value', label: 'Value', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'text' },
      { name: 'sortOrder', label: 'Order', type: 'int', default: 0 },
      { name: 'active', label: 'Active', type: 'bool', default: true },
    ],
    orderBy: [{ list: 'asc' }, { sortOrder: 'asc' }], naturalKey: ['list', 'value'],
  },
  {
    key: 'clients', model: 'client', table: 'Client', prefix: 'CLI', pad: 4,
    label: 'Client', plural: 'Clients', kind: 'reference', title: '{name}',
    description: 'Companies we run the programme for. Every employee belongs to one client.',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'industry', label: 'Industry', type: 'text' },
      { name: 'country', label: 'Country', type: 'text' },
      { name: 'contactName', label: 'Contact person', type: 'text' },
      { name: 'contactEmail', label: 'Contact email', type: 'email' },
      { name: 'notes', label: 'Notes', type: 'longtext', hideInTable: true },
      { name: 'active', label: 'Active', type: 'bool', default: true },
    ],
    orderBy: [{ name: 'asc' }], naturalKey: ['name'],
  },
  {
    key: 'programs', model: 'program', table: 'Program', prefix: 'PRG', pad: 4,
    label: 'Programme', plural: 'Programmes', kind: 'reference', title: '{name}', subtitle: '{client.name}',
    description: 'A programme / IDP cycle run for a client. People are enrolled into programmes.',
    fields: [
      { name: 'clientId', label: 'Client', type: 'ref', ref: 'clients', required: true },
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'cycle', label: 'Cycle', type: 'text', help: 'e.g. 2026 H2' },
      { name: 'startDate', label: 'Start', type: 'date' },
      { name: 'endDate', label: 'End', type: 'date' },
      { name: 'status', label: 'Status', type: 'lookup', list: 'programStatus' },
      { name: 'description', label: 'Description', type: 'longtext', hideInTable: true },
      { name: 'notes', label: 'Notes', type: 'longtext', hideInTable: true },
    ],
    orderBy: [{ startDate: 'desc' }],
  },
  {
    key: 'staff', model: 'staff', table: 'Staff', prefix: 'STF', pad: 4,
    label: 'Staff member', plural: 'Staff', kind: 'reference', title: '{name}', subtitle: '{roles}',
    description: 'Our own consultants, coaches, trainers and assessors. Client managers are employees, not staff.',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'roles', label: 'Roles', type: 'multilookup', list: 'staffRole' },
      { name: 'phone', label: 'Phone', type: 'text', hideInTable: true },
      { name: 'active', label: 'Active', type: 'bool', default: true },
      { name: 'notes', label: 'Notes', type: 'longtext', hideInTable: true },
    ],
    orderBy: [{ name: 'asc' }], naturalKey: ['name'],
  },
  {
    key: 'frameworks', model: 'framework', table: 'Framework', prefix: 'FWK', pad: 4,
    label: 'Framework', plural: 'Frameworks', kind: 'reference', title: '{name}',
    description: 'Competency frameworks and their rating scale.',
    fields: [
      { name: 'code', label: 'Code', type: 'text', required: true },
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'scaleMin', label: 'Lowest level', type: 'int', required: true, default: 1 },
      { name: 'scaleMax', label: 'Highest level', type: 'int', required: true, default: 5 },
      { name: 'description', label: 'Description', type: 'longtext' },
      { name: 'externalId', label: 'External ID', type: 'text', hideInTable: true, help: 'Key in the source platform, e.g. the Lexonis framework key.' },
    ],
    orderBy: [{ code: 'asc' }], naturalKey: ['code'],
  },
  {
    key: 'categories', model: 'competencyCategory', table: 'CompetencyCategory', prefix: 'CAT', pad: 4,
    label: 'Category', plural: 'Categories', kind: 'reference', title: '{name}', subtitle: '{framework.name}',
    description: 'Groups competencies inside a framework.',
    fields: [
      { name: 'frameworkId', label: 'Framework', type: 'ref', ref: 'frameworks', required: true },
      { name: 'code', label: 'Code', type: 'text', required: true },
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'sortOrder', label: 'Order', type: 'int', default: 0 },
      { name: 'externalId', label: 'External ID', type: 'text', hideInTable: true, help: 'Key in the source platform, e.g. the Lexonis category key.' },
    ],
    orderBy: [{ sortOrder: 'asc' }], naturalKey: ['code'],
  },
  {
    key: 'competencies', model: 'competency', table: 'Competency', prefix: 'CMP', pad: 4,
    label: 'Competency', plural: 'Competencies', kind: 'reference', title: '{code} · {name}', subtitle: '{category.name}',
    description: 'The competency library. Everything in the system ultimately links back to an employee and a competency.',
    fields: [
      { name: 'code', label: 'Code', type: 'text', required: true },
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'categoryId', label: 'Category', type: 'ref', ref: 'categories', required: true },
      { name: 'minLevel', label: 'Lowest level', type: 'int', required: true, default: 1 },
      { name: 'maxLevel', label: 'Highest level', type: 'int', required: true, default: 5 },
      { name: 'description', label: 'Description', type: 'longtext' },
      { name: 'supportingText', label: 'How it is assessed', type: 'longtext', hideInTable: true },
      { name: 'sortOrder', label: 'Order', type: 'int', default: 0, hideInTable: true },
      { name: 'externalId', label: 'External ID', type: 'text', hideInTable: true, help: 'Key in the source platform (Lexonis competency ID).' },
      { name: 'active', label: 'Active', type: 'bool', default: true },
    ],
    orderBy: [{ sortOrder: 'asc' }], naturalKey: ['code'],
  },
  {
    key: 'behaviors', model: 'competencyBehavior', table: 'CompetencyBehavior', prefix: 'BHV', pad: 4,
    label: 'Level indicator', plural: 'Level indicators', kind: 'reference', title: '{code}', subtitle: '{competency.name}',
    description: 'What each competency looks like at each level.',
    fields: [
      { name: 'competencyId', label: 'Competency', type: 'ref', ref: 'competencies', required: true },
      { name: 'level', label: 'Level', type: 'int', required: true, min: 0, max: 5 },
      { name: 'code', label: 'Code', type: 'text', required: true, help: '<competency code>-L<level>-<sequence>, e.g. AICI-001-L3-02' },
      { name: 'description', label: 'What it looks like', type: 'longtext', required: true },
      { name: 'externalId', label: 'External ID', type: 'text', hideInTable: true, help: 'Lexonis behaviour ID (CBPI…), to reconcile with the platform.' },
    ],
    orderBy: [{ code: 'asc' }], naturalKey: ['code'],
  },
  {
    key: 'roles', model: 'jobRole', table: 'JobRole', prefix: 'ROL', pad: 4,
    label: 'Job role', plural: 'Job roles', kind: 'reference', title: '{name}', subtitle: '{family} · {seniority}',
    description: 'Role profiles. Required levels are set once per role and copied into each new assessment.',
    fields: [
      { name: 'code', label: 'Code', type: 'text', required: true },
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'family', label: 'Job family', type: 'lookup', list: 'jobFamily' },
      { name: 'seniority', label: 'Seniority', type: 'lookup', list: 'seniority' },
      { name: 'nextRoleId', label: 'Usual next role', type: 'ref', ref: 'roles', help: 'The growth path: what this role usually leads to.' },
      { name: 'description', label: 'Description', type: 'longtext', hideInTable: true },
      { name: 'active', label: 'Active', type: 'bool', default: true },
    ],
    orderBy: [{ family: 'asc' }, { code: 'asc' }], naturalKey: ['code'],
  },
  {
    key: 'requirements', model: 'roleRequirement', table: 'RoleRequirement', prefix: 'REQ', pad: 5,
    label: 'Role requirement', plural: 'Role requirements', kind: 'reference', title: '{jobRole.name} · {competency.name}',
    description: 'The level a role needs in a competency, and how important it is.',
    fields: [
      { name: 'jobRoleId', label: 'Job role', type: 'ref', ref: 'roles', required: true },
      { name: 'competencyId', label: 'Competency', type: 'ref', ref: 'competencies', required: true },
      { name: 'requiredLevel', label: 'Required level', type: 'int', required: true, min: 0, max: 5 },
      { name: 'priority', label: 'Priority', type: 'lookup', list: 'priority', required: true, default: 'Medium' },
    ],
    naturalKey: ['jobRoleId', 'competencyId'],
  },
  {
    key: 'courses', model: 'course', table: 'Course', prefix: 'CRS', pad: 4,
    label: 'Course', plural: 'Courses', kind: 'reference', title: '{name}', subtitle: '{type} · {deliveryMode}',
    description: 'Training catalogue: instructor-led courses, workshops, labs, programmes and rotations.',
    fields: [
      { name: 'code', label: 'Code', type: 'text', required: true },
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'type', label: 'Type', type: 'lookup', list: 'courseType', required: true },
      { name: 'provider', label: 'Provider', type: 'text' },
      { name: 'deliveryMode', label: 'Delivery', type: 'lookup', list: 'deliveryMode' },
      { name: 'durationHours', label: 'Hours', type: 'number' },
      { name: 'days', label: 'Days', type: 'int' },
      { name: 'difficulty', label: 'Difficulty', type: 'lookup', list: 'difficulty', hideInTable: true },
      { name: 'observed', label: 'Behaviours observed', type: 'bool', default: false, help: 'Trainers score the 25 behaviours on every day of this course.' },
      { name: 'dayTitles', label: 'Day titles', type: 'longtext', hideInTable: true, help: 'Observed programmes: one line per day, e.g. "S1 Team Collaboration". Used as the day labels on the observation grid.' },
      { name: 'labsTotal', label: 'Labs in collection', type: 'int', hideInTable: true, min: 0, help: 'Hands-on lab collections: how many labs the collection holds.' },
      { name: 'description', label: 'Description', type: 'longtext', hideInTable: true },
      { name: 'active', label: 'Active', type: 'bool', default: true },
    ],
    joins: [{ name: 'competencyIds', label: 'Competencies it builds', model: 'courseCompetency', table: 'CourseCompetency', parentKey: 'courseId', childKey: 'competencyId', ref: 'competencies' }],
    orderBy: [{ name: 'asc' }], naturalKey: ['code'],
  },
  {
    key: 'certifications', model: 'certification', table: 'Certification', prefix: 'CRT', pad: 4,
    label: 'Certification', plural: 'Certifications', kind: 'reference', title: '{name}', subtitle: '{provider} · {track}',
    description: 'Certification catalogue.',
    fields: [
      { name: 'code', label: 'Code', type: 'text', required: true },
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'provider', label: 'Provider', type: 'text' },
      { name: 'track', label: 'Track', type: 'lookup', list: 'certTrack' },
      { name: 'difficulty', label: 'Difficulty', type: 'lookup', list: 'difficulty' },
      { name: 'validityMonths', label: 'Valid for (months)', type: 'int', hideInTable: true },
      { name: 'description', label: 'Description', type: 'longtext', hideInTable: true },
      { name: 'aliases', label: 'Other spellings', type: 'longtext', hideInTable: true, help: 'One per line: how this certification is written in client files. Used to match imports.' },
      { name: 'active', label: 'Active', type: 'bool', default: true },
    ],
    joins: [{ name: 'competencyIds', label: 'Competencies it proves', model: 'certificationCompetency', table: 'CertificationCompetency', parentKey: 'certificationId', childKey: 'competencyId', ref: 'competencies' }],
    orderBy: [{ name: 'asc' }], naturalKey: ['code'],
  },
  {
    key: 'parameters', model: 'observationParameter', table: 'ObservationParameter', prefix: 'OBP', pad: 4,
    label: 'Observed behaviour', plural: 'Observed behaviours', kind: 'reference', title: '{name}', subtitle: '{category}',
    description: 'The behaviours trainers score during observed courses, and the competency each one is evidence for.',
    fields: [
      { name: 'code', label: 'Code', type: 'text', required: true },
      { name: 'name', label: 'Behaviour', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'lookup', list: 'observationCategory', required: true },
      { name: 'competencyId', label: 'Evidence for', type: 'ref', ref: 'competencies' },
      { name: 'maxScore', label: 'Max score', type: 'int', default: 5 },
      { name: 'description', label: 'What to look for', type: 'longtext' },
      { name: 'interpretationLow', label: 'If low: interpretation', type: 'longtext', hideInTable: true },
      { name: 'actionLow', label: 'If low: suggested action', type: 'longtext', hideInTable: true },
      { name: 'signalHigh', label: 'If high: signal', type: 'longtext', hideInTable: true },
      { name: 'sortOrder', label: 'Order', type: 'int', default: 0, hideInTable: true },
      { name: 'active', label: 'Active', type: 'bool', default: true },
    ],
    orderBy: [{ sortOrder: 'asc' }], naturalKey: ['code'],
  },
  {
    key: 'riskRules', model: 'riskRule', table: 'RiskRule', prefix: 'RSK', pad: 4,
    label: 'Risk rule', plural: 'Risk rules', kind: 'reference', title: '{code} · {name}', subtitle: '{severity} · {panel}',
    description: 'Risk and opportunity rules checked for every person and group. The logic of each rule code is built in; edit the threshold, severity, wording, action and owner here, or set Active to No to switch a rule off.',
    fields: [
      { name: 'code', label: 'Code', type: 'text', required: true, createOnly: true, help: 'R01 … R36. Only these codes have logic behind them.' },
      { name: 'name', label: 'Risk / opportunity', type: 'text', required: true },
      { name: 'severity', label: 'Severity', type: 'lookup', list: 'riskSeverity', required: true },
      { name: 'threshold', label: 'Threshold', type: 'number' },
      { name: 'thresholdUnit', label: 'Unit', type: 'text' },
      { name: 'rule', label: 'Rule', type: 'longtext', required: true },
      { name: 'panel', label: 'Panel', type: 'lookup', list: 'riskPanel', required: true, hideInTable: true },
      { name: 'area', label: 'Area', type: 'lookup', list: 'riskArea', required: true },
      { name: 'appliesTo', label: 'Applies to', type: 'lookup', list: 'riskAppliesTo', required: true, hideInTable: true },
      { name: 'executiveAction', label: 'Executive action', type: 'longtext', hideInTable: true },
      { name: 'owner', label: 'Owner', type: 'text', hideInTable: true },
      { name: 'dataSource', label: 'Data source', type: 'text', hideInTable: true },
      { name: 'sortOrder', label: 'Order', type: 'int', default: 0, hideInTable: true },
      { name: 'active', label: 'Active', type: 'bool', default: true },
    ],
    orderBy: [{ sortOrder: 'asc' }], naturalKey: ['code'],
  },

  {
    key: 'valueAssumptions', model: 'valueAssumption', table: 'ValueAssumption', prefix: 'VAL', pad: 4,
    label: 'Value assumption', plural: 'Value assumptions', kind: 'reference', title: '{name}', subtitle: '{value} {unit} · {basis}',
    description: 'Rates and assumptions behind the Value & ROI page. Replace the ones marked Assumption with the client\'s own figures and set Basis to "Client data".',
    fields: [
      { name: 'code', label: 'Code', type: 'text', required: true, createOnly: true, help: 'The calculation reads the value by this code.' },
      { name: 'name', label: 'Assumption', type: 'text', required: true },
      { name: 'value', label: 'Value', type: 'number', required: true },
      { name: 'unit', label: 'Unit', type: 'text', help: 'For CURRENCY, the currency code shown on the page (e.g. AED).' },
      { name: 'group', label: 'Group', type: 'lookup', list: 'valueGroup', required: true },
      { name: 'basis', label: 'Basis', type: 'lookup', list: 'valueBasis', required: true },
      { name: 'source', label: 'Source', type: 'longtext', hideInTable: true },
      { name: 'note', label: 'Note', type: 'longtext', hideInTable: true },
      { name: 'sortOrder', label: 'Order', type: 'int', default: 0, hideInTable: true },
    ],
    orderBy: [{ sortOrder: 'asc' }], naturalKey: ['code'],
  },

  // ================================================================== activity
  {
    key: 'employees', model: 'employee', table: 'Employee', prefix: 'EMP', pad: 4,
    label: 'Person', plural: 'People', kind: 'activity', audit: true, title: '{name}', subtitle: '{jobTitle} · {client.name}',
    description: 'One row per person in a client company.',
    fields: [
      { name: 'clientId', label: 'Client', type: 'ref', ref: 'clients', required: true },
      { name: 'name', label: 'Full name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'employeeNumber', label: 'Employee number', type: 'text', hideInTable: true },
      { name: 'jobTitle', label: 'Job title', type: 'text', help: 'As the client writes it.' },
      { name: 'jobRoleId', label: 'Role profile', type: 'ref', ref: 'roles', help: 'The role profile this job maps to. Drives the required levels.' },
      { name: 'grade', label: 'Grade', type: 'suggest', list: 'jobGrade', hideInTable: true, help: 'Grade-style title, e.g. Senior Analyst or Section Head.' },
      { name: 'division', label: 'Division', type: 'suggest', list: 'orgDivision', hideInTable: true },
      { name: 'department', label: 'Department', type: 'suggest', list: 'orgDepartment' },
      { name: 'section', label: 'Section / team', type: 'suggest', list: 'orgSection', hideInTable: true },
      { name: 'businessUnit', label: 'Business unit', type: 'text', hideInTable: true },
      { name: 'location', label: 'Location', type: 'text', hideInTable: true },
      { name: 'lineManagerId', label: 'Line manager', type: 'ref', ref: 'employees', dependsOn: { clientId: 'clientId' }, help: 'Pick the manager if they are in the system; otherwise type their name below.' },
      { name: 'lineManagerName', label: 'Line manager (name only)', type: 'text', hideInTable: true },
      { name: 'status', label: 'Status', type: 'lookup', list: 'employeeStatus', default: 'Active' },
      { name: 'notes', label: 'Notes', type: 'longtext', hideInTable: true },
      SOURCE,
    ],
    orderBy: [{ name: 'asc' }],
  },
  {
    key: 'enrollments', model: 'enrollment', table: 'Enrollment', prefix: 'ENR', pad: 4,
    label: 'Programme enrolment', plural: 'Programme enrolments', kind: 'activity', audit: true, employeeScoped: true,
    title: '{program.name}', subtitle: '{employee.name}',
    description: 'A person taking part in a programme, with their coach and consultant.',
    fields: [
      { name: 'employeeId', label: 'Person', type: 'ref', ref: 'employees', required: true },
      { name: 'programId', label: 'Programme', type: 'ref', ref: 'programs', required: true },
      { name: 'batch', label: 'Batch', type: 'text' },
      { name: 'coachId', label: 'Coach', type: 'ref', ref: 'staff' },
      { name: 'consultantId', label: 'Consultant', type: 'ref', ref: 'staff' },
      { name: 'startDate', label: 'Start', type: 'date' },
      { name: 'endDate', label: 'End', type: 'date' },
      { name: 'status', label: 'Status', type: 'lookup', list: 'enrollmentStatus', default: 'Enrolled' },
      { name: 'notes', label: 'Notes', type: 'longtext', hideInTable: true },
      SOURCE,
    ],
    orderBy: [{ startDate: 'desc' }],
  },
  {
    key: 'assessments', model: 'assessment', table: 'Assessment', prefix: 'ASM', pad: 4,
    label: 'Assessment', plural: 'Assessments', kind: 'activity', audit: true, employeeScoped: true,
    title: '{type} · {date}', subtitle: '{employee.name}',
    description: 'One assessment event. The level per competency is entered on the assessment\'s ratings grid.',
    fields: [
      { name: 'employeeId', label: 'Person', type: 'ref', ref: 'employees', required: true },
      { name: 'type', label: 'Type', type: 'lookup', list: 'assessmentType', required: true },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'status', label: 'Status', type: 'lookup', list: 'assessmentStatus', default: 'In Progress' },
      { name: 'jobRoleId', label: 'Assessed against role', type: 'ref', ref: 'roles', help: 'Required levels are copied from this role profile. Defaults to the person\'s role.' },
      { name: 'assessorId', label: 'Assessor', type: 'ref', ref: 'staff' },
      { name: 'enrollmentId', label: 'Programme', type: 'ref', ref: 'enrollments', dependsOn: { employeeId: 'employeeId' }, hideInTable: true },
      { name: 'reportStatus', label: 'Report', type: 'lookup', list: 'reportStatus' },
      { name: 'summary', label: 'Summary / notes', type: 'longtext', hideInTable: true },
      SOURCE,
    ],
    orderBy: [{ date: 'desc' }],
  },
  {
    key: 'ratings', model: 'assessmentRating', table: 'AssessmentRating', prefix: 'RAT', pad: 6,
    label: 'Rating', plural: 'Ratings', kind: 'activity', title: '{competency.name}',
    description: 'The level for one competency in one assessment. Gap = required level − level.',
    fields: [
      { name: 'assessmentId', label: 'Assessment', type: 'ref', ref: 'assessments', required: true },
      { name: 'competencyId', label: 'Competency', type: 'ref', ref: 'competencies', required: true },
      { name: 'level', label: 'Level', type: 'level' },
      { name: 'requiredLevel', label: 'Required', type: 'level' },
      { name: 'priority', label: 'Priority', type: 'lookup', list: 'priority' },
      { name: 'comment', label: 'Comment', type: 'text' },
    ],
    naturalKey: ['assessmentId', 'competencyId'],
  },
  {
    key: 'validations', model: 'managerValidation', table: 'ManagerValidation', prefix: 'VAL', pad: 4,
    label: 'Manager validation', plural: 'Manager validations', kind: 'activity', audit: true, employeeScoped: true,
    title: '{status} · {date}', subtitle: '{employee.name}',
    description: 'A line manager confirming an assessment or a single competency level. Usually arrives by email: set Source accordingly.',
    fields: [
      { name: 'employeeId', label: 'Person', type: 'ref', ref: 'employees', required: true },
      { name: 'status', label: 'Status', type: 'lookup', list: 'validationStatus', required: true, default: 'Pending' },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'assessmentId', label: 'Assessment', type: 'ref', ref: 'assessments', dependsOn: { employeeId: 'employeeId' } },
      { name: 'competencyId', label: 'Competency', type: 'ref', ref: 'competencies', help: 'Leave empty if the whole assessment is validated.' },
      { name: 'validatedLevel', label: 'Validated level', type: 'level', help: 'The validated level, or progress 1–5 for monthly line-manager validation (1 Not started · 2 Limited · 3 On track · 4 Good effort · 5 Fully achieved). Round decimals such as 3.2.' },
      { name: 'managerId', label: 'Manager', type: 'ref', ref: 'employees' },
      { name: 'managerName', label: 'Manager (name only)', type: 'text', hideInTable: true },
      { name: 'evidenceReviewed', label: 'Evidence reviewed', type: 'text', hideInTable: true },
      { name: 'comments', label: 'Comments', type: 'longtext' },
      SOURCE,
    ],
    orderBy: [{ date: 'desc' }],
  },
  {
    key: 'baseline', model: 'baselineSurvey', table: 'BaselineSurvey', prefix: 'BSL', pad: 4,
    label: 'Baseline survey', plural: 'Baseline', kind: 'activity', audit: true, employeeScoped: true,
    title: 'Baseline · {date}', subtitle: '{employee.name}',
    description: 'Self-reported baseline before an observed programme: experience, six self-ratings and personality type. Baseline score = average position (1–5) of the six self-ratings.',
    fields: [
      { name: 'employeeId', label: 'Person', type: 'ref', ref: 'employees', required: true },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'yearsWithOrganisation', label: 'Years with the organisation', type: 'number', min: 0 },
      { name: 'totalYearsExperience', label: 'Total years of experience', type: 'number', min: 0 },
      { name: 'confidence', label: 'Confidence', type: 'lookup', list: 'baselineConfidence' },
      { name: 'emotionalRegulation', label: 'Emotional regulation', type: 'lookup', list: 'baselineEmotionalRegulation' },
      { name: 'communication', label: 'Communication', type: 'lookup', list: 'baselineCommunication' },
      { name: 'accountability', label: 'Accountability', type: 'lookup', list: 'baselineAccountability' },
      { name: 'productivity', label: 'Productivity', type: 'lookup', list: 'baselineProductivity' },
      { name: 'organisation', label: 'Organisation skills', type: 'lookup', list: 'baselineOrganisation' },
      { name: 'mbti', label: 'Personality type (MBTI)', type: 'lookup', list: 'mbti', hideInTable: true, help: 'Sensitive: kept out of client-wide reports.' },
      { name: 'enrollmentId', label: 'Programme', type: 'ref', ref: 'enrollments', dependsOn: { employeeId: 'employeeId' }, hideInTable: true },
      { name: 'notes', label: 'Notes', type: 'longtext', hideInTable: true },
      SOURCE,
    ],
    orderBy: [{ date: 'desc' }],
  },
  {
    key: 'idp', model: 'idpAction', table: 'IdpAction', prefix: 'IDP', pad: 4,
    label: 'Development action', plural: 'Development plan', kind: 'activity', audit: true, employeeScoped: true,
    title: '{title}', subtitle: '{actionType} · {employee.name}',
    description: 'The individual development plan: one row per planned action, usually tied to a competency gap.',
    fields: [
      { name: 'employeeId', label: 'Person', type: 'ref', ref: 'employees', required: true },
      { name: 'title', label: 'Action', type: 'text', required: true },
      { name: 'actionType', label: 'Type', type: 'lookup', list: 'idpActionType', required: true },
      { name: 'segment', label: 'Plan segment', type: 'lookup', list: 'idpSegment', help: 'S1 professional cert · S2 hands-on labs · S3 AI cert · S4 LMS learning · S5 cross-functional training · DTN department training need.' },
      { name: 'competencyId', label: 'Competency', type: 'ref', ref: 'competencies' },
      { name: 'courseId', label: 'Course', type: 'ref', ref: 'courses', hideInTable: true },
      { name: 'certificationId', label: 'Certification', type: 'ref', ref: 'certifications', hideInTable: true },
      { name: 'enrollmentId', label: 'Programme', type: 'ref', ref: 'enrollments', dependsOn: { employeeId: 'employeeId' }, hideInTable: true },
      { name: 'owner', label: 'Owner', type: 'text', hideInTable: true },
      { name: 'estimatedHours', label: 'Est. hours', type: 'number', hideInTable: true },
      { name: 'plannedStart', label: 'Planned start', type: 'date', hideInTable: true },
      { name: 'plannedEnd', label: 'Planned end', type: 'date' },
      { name: 'actualStart', label: 'Actual start', type: 'date', hideInTable: true },
      { name: 'actualEnd', label: 'Actual end', type: 'date', hideInTable: true },
      { name: 'status', label: 'Status', type: 'lookup', list: 'idpStatus', default: 'Planned' },
      { name: 'progressPct', label: 'Progress %', type: 'percent' },
      { name: 'comments', label: 'Comments', type: 'longtext', hideInTable: true },
      SOURCE,
    ],
    orderBy: [{ plannedEnd: 'asc' }],
  },
  {
    key: 'sessions', model: 'courseSession', table: 'CourseSession', prefix: 'SES', pad: 4,
    label: 'Course session', plural: 'Sessions', kind: 'activity', audit: true,
    title: '{course.name} · {startDate}', subtitle: '{batch}',
    description: 'One run of a course (dates, trainer, batch). Participants, attendance and observation scores are entered on the session page.',
    fields: [
      { name: 'courseId', label: 'Course', type: 'ref', ref: 'courses', required: true },
      { name: 'startDate', label: 'Start', type: 'date' },
      { name: 'endDate', label: 'End', type: 'date' },
      { name: 'trainerId', label: 'Trainer', type: 'ref', ref: 'staff' },
      { name: 'programId', label: 'Programme', type: 'ref', ref: 'programs' },
      { name: 'batch', label: 'Batch', type: 'text' },
      { name: 'code', label: 'Client code', type: 'text', hideInTable: true, help: 'The training record code the client uses, if any.' },
      { name: 'location', label: 'Location', type: 'text', hideInTable: true },
      { name: 'mode', label: 'Delivery', type: 'lookup', list: 'deliveryMode', hideInTable: true },
      { name: 'status', label: 'Status', type: 'lookup', list: 'sessionStatus', default: 'Scheduled' },
      { name: 'notes', label: 'Notes', type: 'longtext', hideInTable: true },
      SOURCE,
    ],
    orderBy: [{ startDate: 'desc' }],
  },
  {
    key: 'training', model: 'trainingRecord', table: 'TrainingRecord', prefix: 'TRN', pad: 6,
    label: 'Training record', plural: 'Training', kind: 'activity', audit: true, employeeScoped: true,
    title: '{course.name}', subtitle: '{status} · {employee.name}',
    description: 'One person on one course. Pick a session for scheduled courses; leave it empty for self-paced ones.',
    fields: [
      { name: 'employeeId', label: 'Person', type: 'ref', ref: 'employees', required: true },
      { name: 'courseId', label: 'Course', type: 'ref', ref: 'courses', required: true },
      { name: 'sessionId', label: 'Session', type: 'ref', ref: 'sessions', dependsOn: { courseId: 'courseId' } },
      { name: 'status', label: 'Status', type: 'lookup', list: 'trainingStatus', required: true, default: 'Assigned' },
      { name: 'assignedDate', label: 'Assigned', type: 'date', hideInTable: true },
      { name: 'startDate', label: 'Started', type: 'date', hideInTable: true },
      { name: 'completionDate', label: 'Completed', type: 'date' },
      { name: 'attendancePct', label: 'Attendance %', type: 'percent' },
      { name: 'completionPct', label: 'Completion %', type: 'percent', hideInTable: true },
      { name: 'score', label: 'Score', type: 'number' },
      { name: 'hours', label: 'Hours', type: 'number', hideInTable: true },
      { name: 'labsCompleted', label: 'Labs completed', type: 'int', min: 0, hideInTable: true, help: 'Hands-on lab collections (platform export COUNT_LABS_COMPLETED).' },
      { name: 'labsTotal', label: 'Labs in collection', type: 'int', min: 0, hideInTable: true, help: 'Leave empty to use the number on the course.' },
      { name: 'validatedLevel', label: 'Validated level (1–5)', type: 'int', min: 1, max: 5, hideInTable: true, help: 'Observed programmes: the level validated before the programme (batch setup).' },
      { name: 'targetLevel', label: 'Target level (1–5)', type: 'int', min: 1, max: 5, hideInTable: true, help: 'Observed programmes: the target level for the role (batch setup).' },
      { name: 'idpActionId', label: 'Development action', type: 'ref', ref: 'idp', dependsOn: { employeeId: 'employeeId' }, hideInTable: true },
      { name: 'comments', label: 'Comments', type: 'longtext', hideInTable: true },
      SOURCE,
    ],
    orderBy: [{ startDate: 'desc' }],
  },
  {
    key: 'observationDays', model: 'observationDay', table: 'ObservationDay', prefix: 'OBS', pad: 6,
    label: 'Observation day', plural: 'Observation days', kind: 'activity', audit: true, title: 'Day {dayNumber}',
    description: 'One person on one day of an observed course. Entered on the session page.',
    fields: [
      { name: 'trainingRecordId', label: 'Training record', type: 'ref', ref: 'training', required: true },
      { name: 'dayNumber', label: 'Day', type: 'int', required: true, min: 1 },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'attendance', label: 'Attendance', type: 'lookup', list: 'attendance' },
      { name: 'observerId', label: 'Observer', type: 'ref', ref: 'staff' },
      { name: 'potentialNote', label: 'Potential / risk', type: 'lookup', list: 'potentialNote' },
      { name: 'notes', label: 'Assessor notes', type: 'longtext' },
      SOURCE,
    ],
    naturalKey: ['trainingRecordId', 'dayNumber'],
  },
  {
    key: 'observationScores', model: 'observationScore', table: 'ObservationScore', prefix: 'OSC', pad: 6,
    label: 'Observation score', plural: 'Observation scores', kind: 'activity', title: '{parameter.name}',
    description: 'The score for one behaviour on one observation day.',
    fields: [
      { name: 'observationDayId', label: 'Observation day', type: 'ref', ref: 'observationDays', required: true },
      { name: 'parameterId', label: 'Behaviour', type: 'ref', ref: 'parameters', required: true },
      { name: 'score', label: 'Score', type: 'int', min: 1, max: 5 },
      { name: 'comment', label: 'Comment', type: 'text' },
    ],
    naturalKey: ['observationDayId', 'parameterId'],
  },
  {
    key: 'certs', model: 'certificationRecord', table: 'CertificationRecord', prefix: 'CER', pad: 4,
    label: 'Certification record', plural: 'Certifications', kind: 'activity', audit: true, employeeScoped: true,
    title: '{certification.name}', subtitle: '{status} · {employee.name}',
    description: 'One person working towards one certification.',
    fields: [
      { name: 'employeeId', label: 'Person', type: 'ref', ref: 'employees', required: true },
      { name: 'certificationId', label: 'Certification', type: 'ref', ref: 'certifications', required: true },
      { name: 'status', label: 'Status', type: 'lookup', list: 'certStatus', required: true, default: 'Assigned' },
      { name: 'assignedDate', label: 'Assigned', type: 'date', hideInTable: true },
      { name: 'targetDate', label: 'Target', type: 'date' },
      { name: 'examDate', label: 'Exam date', type: 'date', hideInTable: true },
      { name: 'completionDate', label: 'Achieved', type: 'date' },
      { name: 'expiryDate', label: 'Expires', type: 'date', hideInTable: true },
      { name: 'result', label: 'Result', type: 'lookup', list: 'examResult', hideInTable: true },
      { name: 'score', label: 'Score', type: 'number', hideInTable: true },
      { name: 'credentialId', label: 'Credential ID', type: 'text', hideInTable: true },
      { name: 'certificateUrl', label: 'Certificate link', type: 'url', hideInTable: true },
      { name: 'enrollmentId', label: 'Programme / cycle', type: 'ref', ref: 'enrollments', dependsOn: { employeeId: 'employeeId' }, hideInTable: true },
      { name: 'idpActionId', label: 'Development action', type: 'ref', ref: 'idp', dependsOn: { employeeId: 'employeeId' }, hideInTable: true },
      { name: 'comments', label: 'Comments', type: 'longtext', hideInTable: true },
      SOURCE,
    ],
    orderBy: [{ targetDate: 'asc' }],
  },
  {
    key: 'coaching', model: 'coachingSession', table: 'CoachingSession', prefix: 'COA', pad: 4,
    label: 'Coaching session', plural: 'Coaching', kind: 'activity', audit: true, employeeScoped: true,
    title: '{type} · {date}', subtitle: '{employee.name}',
    description: 'One coaching conversation.',
    fields: [
      { name: 'employeeId', label: 'Person', type: 'ref', ref: 'employees', required: true },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'type', label: 'Type', type: 'lookup', list: 'coachingType', required: true, default: 'Monthly Check-In' },
      { name: 'coachId', label: 'Coach', type: 'ref', ref: 'staff' },
      { name: 'status', label: 'Status', type: 'lookup', list: 'coachingStatus', default: 'Completed' },
      { name: 'startTime', label: 'Start time', type: 'text', hideInTable: true, help: 'HH:MM' },
      { name: 'endTime', label: 'End time', type: 'text', hideInTable: true, help: 'HH:MM' },
      { name: 'prepMinutes', label: 'Preparation (min)', type: 'int', hideInTable: true },
      { name: 'durationMinutes', label: 'Session (min)', type: 'int' },
      { name: 'reportingMinutes', label: 'Reporting (min)', type: 'int', hideInTable: true, help: 'Total coaching effort = preparation + session + reporting.' },
      { name: 'progressPct', label: 'Progress %', type: 'percent', help: 'Overall progress on the development plan, as judged by the coach.' },
      { name: 's1Progress', label: 'S1 Professional cert %', type: 'percent', hideInTable: true },
      { name: 's1Notes', label: 'S1 notes', type: 'longtext', hideInTable: true },
      { name: 's2Progress', label: 'S2 Hands-on labs %', type: 'percent', hideInTable: true },
      { name: 's2Notes', label: 'S2 notes', type: 'longtext', hideInTable: true },
      { name: 's3Progress', label: 'S3 AI cert %', type: 'percent', hideInTable: true },
      { name: 's3Notes', label: 'S3 notes', type: 'longtext', hideInTable: true },
      { name: 's4Progress', label: 'S4 LMS learning %', type: 'percent', hideInTable: true },
      { name: 's4Notes', label: 'S4 notes', type: 'longtext', hideInTable: true },
      { name: 's5Progress', label: 'S5 Cross-functional %', type: 'percent', hideInTable: true },
      { name: 's5Notes', label: 'S5 notes', type: 'longtext', hideInTable: true },
      { name: 'dtnProgress', label: 'Department training need %', type: 'percent', hideInTable: true },
      { name: 'dtnNotes', label: 'DTN notes', type: 'longtext', hideInTable: true },
      { name: 'otherTrainings', label: 'Other trainings', type: 'longtext', hideInTable: true },
      { name: 'summary', label: 'Discussion summary', type: 'longtext' },
      { name: 'challenges', label: 'Challenges', type: 'longtext', hideInTable: true },
      { name: 'actionItems', label: 'Action items', type: 'longtext', hideInTable: true },
      { name: 'nextReviewDate', label: 'Next review', type: 'date', hideInTable: true },
      { name: 'evidenceSubmitted', label: 'Evidence submitted', type: 'bool', hideInTable: true },
      { name: 'enrollmentId', label: 'Programme', type: 'ref', ref: 'enrollments', dependsOn: { employeeId: 'employeeId' }, hideInTable: true },
      SOURCE,
    ],
    orderBy: [{ date: 'desc' }],
  },
  {
    key: 'evidence', model: 'evidence', table: 'Evidence', prefix: 'EVD', pad: 4,
    label: 'Evidence', plural: 'Evidence', kind: 'activity', audit: true, employeeScoped: true,
    title: '{title}', subtitle: '{evidenceType} · {employee.name}',
    description: 'Proof that a competency was shown.',
    fields: [
      { name: 'employeeId', label: 'Person', type: 'ref', ref: 'employees', required: true },
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'evidenceType', label: 'Type', type: 'lookup', list: 'evidenceType', required: true },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'competencyId', label: 'Competency', type: 'ref', ref: 'competencies' },
      { name: 'behaviorId', label: 'Behaviour descriptor', type: 'ref', ref: 'behaviors', dependsOn: { competencyId: 'competencyId' }, hideInTable: true, help: 'Coach validation: the level indicator this evidence is for.' },
      { name: 'progress', label: 'Progress (1–5)', type: 'int', min: 1, max: 5, help: '1 Not started · 2 Limited progress · 3 On track · 4 Good effort · 5 Fully achieved' },
      { name: 'relatedId', label: 'Related record ID', type: 'text', hideInTable: true, help: 'Any ID from this system, e.g. TRN-000123 or CER-0004.' },
      { name: 'description', label: 'Description', type: 'longtext', hideInTable: true },
      { name: 'submittedBy', label: 'Submitted by', type: 'text', hideInTable: true },
      { name: 'verificationStatus', label: 'Verification', type: 'lookup', list: 'verificationStatus', default: 'Submitted' },
      { name: 'verifiedById', label: 'Verified by', type: 'ref', ref: 'staff', hideInTable: true },
      { name: 'fileLink', label: 'File link', type: 'url', hideInTable: true },
      SOURCE,
    ],
    orderBy: [{ date: 'desc' }],
  },
]

export const ENTITY: Record<string, Entity> = Object.fromEntries(ENTITIES.map((e) => [e.key, e]))
export const ENTITY_BY_TABLE: Record<string, Entity> = Object.fromEntries(ENTITIES.map((e) => [e.table, e]))
export const ENTITY_BY_PREFIX: Record<string, Entity> = Object.fromEntries(ENTITIES.map((e) => [e.prefix, e]))

export const AUDIT_FIELDS = ['createdAt', 'updatedAt', 'createdBy', 'updatedBy'] as const

/** The tabs on a person's page, in order. */
export const PERSON_TABS = ['enrollments', 'baseline', 'assessments', 'idp', 'training', 'certs', 'coaching', 'validations', 'evidence'] as const
