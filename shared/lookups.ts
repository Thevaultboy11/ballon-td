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
      'Identity & Access', 'Governance, Risk & Compliance', 'Business Continuity & Resilience', 'Security Leadership', 'OT Security'] },
  { key: 'jobGrade', label: 'Grade', description: 'Grade-style job titles from client people registers (suggestions; free text allowed). The description gives the matching seniority.',
    values: [['Analyst', 'Entry'], ['Engineer', 'Mid'], ['Specialist', 'Mid'], ['Senior Analyst', 'Senior'], ['Senior Engineer', 'Senior'], ['Section Head', 'Lead'], ['Department Manager', 'Manager'], ['VP', 'Executive']] },
  { key: 'orgDivision', label: 'Division', description: 'Suggested division names (a reusable template structure; free text allowed). Replace per client.',
    values: ['Digital Cybersecurity Operations Division', 'Group Information Security'] },
  { key: 'orgDepartment', label: 'Department', description: 'Suggested department names (template structure; free text allowed).',
    values: ['Digital Business Continuity & Cyber Threat Intelligence Department', 'Digital Cybersecurity Engineering Department', 'Digital Identity & Access Management Department',
      'Digital Risk Management & Compliance Department', 'Digital Security Operations Center Department', 'OT Cybersecurity Department'] },
  { key: 'orgSection', label: 'Section / team', description: 'Suggested section names (template structure; free text allowed). The description names the department.',
    values: [
      ['Digital Clouds & Applications Security Section', 'Digital Cybersecurity Engineering Department'],
      ['Digital Infrastructure Security Operations Section', 'Digital Cybersecurity Engineering Department'],
      ['Digital Vulnerability Management Section', 'Digital Cybersecurity Engineering Department'],
      ['Digital Cybersecurity Monitoring Section', 'Digital Security Operations Center Department'],
      ['Digital Threat Hunting Section', 'Digital Security Operations Center Department'],
      ['Downstream Industry, Marketing & Trading OT Cybersecurity Section', 'OT Cybersecurity Department'],
      ['Upstream OT Cybersecurity Section', 'OT Cybersecurity Department'],
      ['Cyber Threat Intelligence Section', 'Digital Business Continuity & Cyber Threat Intelligence Department'],
      ['Digital Business Continuity Management Section', 'Digital Business Continuity & Cyber Threat Intelligence Department'],
      ['Cyber Security Policies & Standards Section', 'Digital Risk Management & Compliance Department'],
      ['IT Risk Management & Compliance Section', 'Digital Risk Management & Compliance Department'],
      ['OT Risk Management & Compliance Section', 'Digital Risk Management & Compliance Department'],
    ] },
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
  { key: 'idpSegment', label: 'Plan segment', description: 'The fixed structure of an individual development plan: five segments and the department training need.',
    values: [
      ['S1 Professional certification', 'PROFESSIONAL CERTIFICATIONS · 40 h · a professional certification from the catalogue'],
      ['S2 Hands-on labs', 'HANDS-ON COACHING · hours per person · an Immersive Labs collection'],
      ['S3 AI certification', 'AI CERTIFICATION · 10 h (8 or 40 h) · an AI+ certification'],
      ['S4 LMS learning', 'SAP SUCCESSFACTOR LEARNING · 8 h · self-study on the client learning platform'],
      ['S5 Cross-functional training', 'CROSS-FUNCTIONAL TRAINING · 35 h · workshops and the observed programme'],
      ['DTN Department training need', 'Department Training Needs · 20 h · a department boot camp'],
    ] },
  { key: 'idpStatus', label: 'Development action status', description: '"Overdue" is calculated (planned end passed and not completed), so it is not in this list.',
    values: ['Planned', 'Not Started', 'In Progress', 'Completed', 'On Hold', 'Deferred', 'Cancelled'] },

  // ---------------------------------------------------------------- training
  { key: 'courseType', label: 'Course type', description: 'The training categories of the catalogue.',
    values: ['Instructor Led', 'Workshop', 'Leadership Programme', 'Virtual Session', 'Immersive Lab', 'Simulation', 'Self Study',
      'Certification Preparation', 'Cross-Functional Rotation', 'On The Job Training', 'Project Assignment', 'Mentoring', 'Coaching', 'Compliance & Awareness', 'Boot Camp'] },
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
  { key: 'observationScore', label: 'Observation score (1–5)', description: 'The score labels trainers use on the daily behaviour grid.',
    values: [['1 - Does not meet expectations', ''], ['2 - Below expectations', ''], ['3 - Average', ''], ['4 - Meets expectations', ''], ['5 - Exceeds expectations', '']] },
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
    values: ['Project', 'Presentation', 'Assessment', 'Certification', 'Workshop', 'Training', 'Report', 'Case Study', 'Simulation', 'Manager Validation', 'Peer Feedback',
      'Artifact', 'Line Manager Confirmation', 'Workplace Assignment'] },
  { key: 'verificationStatus', label: 'Verification status', description: '',
    values: ['Submitted', 'Under Review', 'Verified', 'Rejected', 'Needs More Information'] },

  // ---------------------------------------------------------------- baseline survey (self-reported, 1–5 by position)
  { key: 'baselineConfidence', label: 'Baseline: confidence', description: 'Self-reported. The number is the position used for the baseline score.',
    values: ['1 - Not at all confident', '2 - Slightly confident', '3 - Neutral', '4 - Confident', '5 - Very confident'] },
  { key: 'baselineEmotionalRegulation', label: 'Baseline: emotional regulation', description: 'Self-reported.',
    values: ['1 - Poor regulation', '2 - Somewhat regulated', '3 - Average regulation', '4 - Developed regulation', '5 - Excellent regulation'] },
  { key: 'baselineCommunication', label: 'Baseline: communication', description: 'Self-reported.',
    values: ['1 - Poor communication', '2 - Below average', '3 - Average', '4 - Above average', '5 - Excellent'] },
  { key: 'baselineAccountability', label: 'Baseline: accountability', description: 'Self-reported.',
    values: ['1 - Poor accountability', '2 - Below average', '3 - Average accountability', '4 - Above average', '5 - High accountability'] },
  { key: 'baselineProductivity', label: 'Baseline: productivity', description: 'Self-reported.',
    values: ['1 - Poor productivity', '2 - Below average', '3 - Average', '4 - Above average', '5 - High productivity'] },
  { key: 'baselineOrganisation', label: 'Baseline: organisation skills', description: 'Self-reported.',
    values: ['1 - Poor organisation', '2 - Below average', '3 - Average', '4 - Above average', '5 - High organisation'] },
  { key: 'mbti', label: 'Personality type (MBTI)', description: 'Self-reported. Sensitive: keep out of client-wide reports.',
    values: ['ISTJ', 'ISFJ', 'INFJ', 'INTJ', 'ISTP', 'ISFP', 'INFP', 'INTP', 'ESTP', 'ESFP', 'ENFP', 'ENTP', 'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'] },

  // ---------------------------------------------------------------- risk rules
  { key: 'riskSeverity', label: 'Risk severity', description: 'Sort order: High 1, Medium 2, Low 3, Opportunity 4.', values: ['High', 'Medium', 'Low', 'Opportunity'] },
  { key: 'riskPanel', label: 'Risk panel', description: 'Where a rule is shown on the dashboard.', values: ['Skill Gap Risks', 'Capability and Behaviour Risks', 'Development Plan Risks'] },
  { key: 'riskArea', label: 'Risk area', description: '', values: ['Capability', 'Behaviour', 'Development Plan', 'Assessment', 'Group View'] },
  { key: 'riskAppliesTo', label: 'Risk applies to', description: '', values: ['Individual and Group', 'Group'] },

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
