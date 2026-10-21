// Every dropdown list in the app. Seeded into the LookupValue table; editable afterwards on
// Library → Lists. `label` is how the list is named in the app; values are what gets stored.

export type LookupList = { key: string; label: string; description: string; values: (string | [string, string])[] }

export const LOOKUP_LISTS: LookupList[] = [
  // ---------------------------------------------------------------- organisation
  { key: 'programStatus', label: 'Programme status', description: 'Where a client programme / IDP cycle is.',
    values: ['Planned', 'Active', 'On Hold', 'Completed', 'Cancelled'] },
  { key: 'staffRole', label: 'Staff role', description: 'What our own people do. One person can have several.',
    values: ['Consultant', 'Coach', 'Trainer', 'Assessor', 'Programme Manager', 'Administrator'] },
  { key: 'employeeStatus', label: 'Employee status', description: 'Whether the person is still in scope.',
    values: ['Active', 'On Leave', 'Left Company', 'Out of Scope'] },
  { key: 'jobFamily', label: 'Job family', description: 'Groups job roles into career tracks.',
    values: ['Security Operations', 'Threat Intelligence', 'Application Security', 'Offensive Security', 'Infrastructure & Cloud Security',
      'Identity & Access', 'Governance, Risk & Compliance', 'Business Continuity & Resilience', 'Security Leadership'] },
  { key: 'seniority', label: 'Seniority', description: 'Drives default required levels on role profiles.',
    values: ['Entry', 'Mid', 'Senior', 'Lead', 'Manager', 'Head', 'Executive'] },
  { key: 'enrollmentStatus', label: 'Enrolment status', description: 'A person\'s status in one programme.',
    values: ['Nominated', 'Enrolled', 'Active', 'On Hold', 'Completed', 'Withdrawn', 'Deferred'] },

  // ---------------------------------------------------------------- assessment
  { key: 'assessmentType', label: 'Assessment type', description: 'How the levels were obtained. Each is its own Assessment, so history is kept.',
    values: [
      ['Self-Assessment', 'The employee rates themselves (usually through the client survey).'],
      ['Consultant Assessment', 'Our consultant rates the person from evidence and interviews.'],
      ['Validation Interview', 'Structured interview that confirms or corrects the levels.'],
      ['Manager Assessment', 'The line manager rates the person.'],
      ['360 Feedback', 'Ratings collected from peers, reports and manager.'],
      ['Technical Test', 'Practical test or lab scored against the framework.'],
      ['Re-assessment', 'End-of-cycle assessment to measure progress.'],
    ] },
  { key: 'assessmentStatus', label: 'Assessment status', description: '', values: ['Not Started', 'Invited', 'In Progress', 'Completed', 'Cancelled'] },
  { key: 'reportStatus', label: 'Report status', description: 'Status of the individual report that goes to the client.',
    values: ['Not Started', 'In Draft', 'In Review', 'Delivered'] },
  { key: 'priority', label: 'Priority', description: 'How important a competency is for a role. Used as weights: High 3, Medium 2, Low 1.',
    values: ['High', 'Medium', 'Low'] },
  { key: 'validationStatus', label: 'Validation status', description: 'Manager validation outcome.',
    values: ['Pending', 'Approved', 'Rejected', 'Requires Further Evidence'] },

  { key: 'progressScale', label: 'Progress scale (1–5)', description: 'Used by coaches and line managers to score progress on a behaviour or skill (Validated level on a manager validation).',
    values: [
      ['1 - Not Started / No Exposure', ''], ['2 - Limited progress or competence', ''], ['3 - On Track', ''], ['4 - Good Effort', ''], ['5 - Fully Achieved', ''],
    ] },

  // ---------------------------------------------------------------- development plan
  { key: 'idpActionType', label: 'Development action type', description: 'What kind of action is planned in the IDP.',
    values: ['Training', 'Workshop', 'Certification', 'Coaching', 'Mentoring', 'Project Assignment', 'Shadowing', 'Cross-Functional Rotation',
      'Reading', 'Research', 'Simulation', 'Learning Plan Segment', 'Department Training Need'] },
  { key: 'idpStatus', label: 'Development action status', description: '"Overdue" is calculated (planned end passed and not completed), so it is not in this list.',
    values: ['Planned', 'Not Started', 'In Progress', 'Completed', 'On Hold', 'Deferred', 'Cancelled'] },

  // ---------------------------------------------------------------- training
  { key: 'courseType', label: 'Course type', description: 'The training categories of the catalogue.',
    values: ['Instructor Led', 'Workshop', 'Leadership Programme', 'Virtual Session', 'Immersive Lab', 'Simulation', 'Self Study',
      'Certification Preparation', 'Cross-Functional Rotation', 'On The Job Training', 'Project Assignment', 'Mentoring', 'Coaching', 'Compliance & Awareness'] },
  { key: 'deliveryMode', label: 'Delivery mode', description: '', values: ['In-person', 'Online (live)', 'Hybrid', 'Self-paced'] },
  { key: 'difficulty', label: 'Difficulty', description: '', values: ['Foundation', 'Intermediate', 'Advanced', 'Expert'] },
  { key: 'sessionStatus', label: 'Session status', description: 'Status of one run of a course.',
    values: ['Planned', 'Scheduled', 'In Progress', 'Completed', 'Postponed', 'Cancelled'] },
  { key: 'trainingStatus', label: 'Training status', description: 'One person on one course.',
    values: ['Assigned', 'Not Started', 'In Progress', 'Completed', 'Incomplete', 'No-show', 'Cancelled', 'Deferred', 'Expired'] },
  { key: 'attendance', label: 'Attendance', description: 'Attendance on one day of a course.',
    values: ['Present', 'Partial', 'Absent', 'Excused'] },
  { key: 'observationCategory', label: 'Observation category', description: 'Groups the behaviours trainers score.',
    values: ['Personal Effectiveness', 'Communication', 'Collaboration', 'Problem Solving', 'Leadership', 'Learning Agility'] },
  { key: 'potentialNote', label: 'Potential / risk note', description: 'The trainer\'s overall read on the person after a day.',
    values: ['High potential', 'Promising', 'Steady', 'Needs support', 'At risk'] },

  // ---------------------------------------------------------------- certification
  { key: 'certTrack', label: 'Certification track', description: '',
    values: ['Professional', 'AI', 'Vendor / Product', 'Internal'] },
  { key: 'certStatus', label: 'Certification status', description: '',
    values: ['Assigned', 'Not Started', 'Registered', 'In Progress', 'Exam Scheduled', 'Completed', 'Failed', 'Deferred', 'Expired', 'Not Required'] },
  { key: 'examResult', label: 'Exam result', description: '', values: ['Pass', 'Fail', 'Pending', 'Not Taken'] },

  // ---------------------------------------------------------------- coaching
  { key: 'coachingType', label: 'Coaching session type', description: '',
    values: ['Kick-off', 'Monthly Check-In', 'Capability Review', 'Performance Coaching', 'Certification Coaching', 'Development Review',
      'Feedback Session', 'Career Coaching', 'Close-out'] },
  { key: 'coachingStatus', label: 'Coaching session status', description: '',
    values: ['Scheduled', 'Completed', 'Rescheduled', 'Cancelled', 'No-show'] },

  // ---------------------------------------------------------------- evidence
  { key: 'evidenceType', label: 'Evidence type', description: '',
    values: ['Project', 'Presentation', 'Assessment', 'Certification', 'Workshop', 'Training', 'Report', 'Case Study', 'Simulation', 'Manager Validation', 'Peer Feedback'] },
  { key: 'verificationStatus', label: 'Verification status', description: '',
    values: ['Submitted', 'Under Review', 'Verified', 'Rejected', 'Needs More Information'] },

  // ---------------------------------------------------------------- audit
  { key: 'source', label: 'Source', description: 'Where a record came from. The client cannot use the app, so most of their input arrives by email or Excel and is typed in by us.',
    values: [
      ['Direct entry', 'Typed in by our team from first-hand work (sessions, interviews, coaching).'],
      ['Email from client', 'Sent by the client (e.g. a manager validation) and entered by us.'],
      ['Excel from client', 'Taken from a spreadsheet the client sent.'],
      ['Meeting / interview', 'Noted during a meeting or interview.'],
      ['Phone call', ''],
      ['LMS / platform export', 'Copied from a learning platform report.'],
      ['Trainer sheet', 'Copied from a trainer\'s paper or Excel scoring sheet.'],
      ['Imported', 'Loaded in bulk from an earlier workbook.'],
    ] },
]

export const LOOKUP_BY_KEY: Record<string, LookupList> = Object.fromEntries(LOOKUP_LISTS.map((l) => [l.key, l]))
