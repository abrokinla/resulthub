export interface RatingScaleEntry {
  grade: string;
  label: string;
  range: string;
}

export interface SubjectEntry {
  name: string;
}

export interface AffectiveTrait {
  trait: string;
}

export interface PsychomotorSkill {
  skill: string;
}

export interface ScoreColumn {
  label: string;
  maxScore: number;
  key: string;
}

export interface SheetTypeConfig {
  id: string;
  section: string;
  label: string;
  scoreColumns: ScoreColumn[];
  subjects: string[];
  ratingScale: RatingScaleEntry[];
  affectiveTraits: string[];
  psychomotorSkills: string[];
  headerFields: string[];
  comments: { teacher: string; admin: string };
  footer: string[];
}

function getGrade(totalScore: number, scale: RatingScaleEntry[]): string {
  for (const entry of scale) {
    const [high, low] = entry.range.split("-").map(Number);
    if (totalScore >= low && totalScore <= high) return entry.grade;
  }
  return "F";
}

export const SHEET_TYPES: Record<string, SheetTypeConfig> = {
  NURSERY_EARLY: {
    id: "NURSERY_EARLY",
    section: "NURSERY",
    label: "Nursery / Early Years",
    scoreColumns: [
      { key: "ca1", label: "C.A (20)", maxScore: 20 },
      { key: "ca2", label: "C.A (20)", maxScore: 20 },
      { key: "exam", label: "EXAM (60)", maxScore: 60 },
      { key: "total", label: "TOTAL (100)", maxScore: 100 },
    ],
    subjects: [
      "CALCULATION SKILL",
      "LANGUAGE ART",
      "GENERAL SCIENCE",
      "RHYMES",
      "PHONICS",
      "CREATIVE ART",
    ],
    ratingScale: [
      { grade: "A", label: "EXCELLENT", range: "100-81" },
      { grade: "B", label: "V. GOOD", range: "80-71" },
      { grade: "C", label: "GOOD", range: "70-61" },
      { grade: "D", label: "SATISFACTORY", range: "60-51" },
      { grade: "E", label: "AVERAGE", range: "50-40" },
      { grade: "F", label: "FAIL", range: "39-0" },
    ],
    affectiveTraits: [
      "NEATNESS", "ATTENTIVENESS", "CONSISTENCY", "OBEDIENCE",
      "SELF CONTROL", "LEADERSHIP", "RESPONSE IN CLASS",
      "HOMEWORK RESPONSE", "APPEARANCE", "PUNCTUALITY",
    ],
    psychomotorSkills: ["CREATIVITY", "WRITING", "DRAMA", "SPORTS"],
    headerFields: ["name", "class", "position", "positionOutOf", "term", "session", "daysPresent", "daysAbsent", "totalScore", "average"],
    comments: { teacher: "formTeacherComment", admin: "headTeacherComment" },
    footer: ["outstandingSchoolFees", "resumptionDate", "classTeacherSignature", "headTeacherSignature"],
  },

  PRIMARY: {
    id: "PRIMARY",
    section: "PRIMARY",
    label: "Primary School",
    scoreColumns: [
      { key: "ca", label: "C.A (30)", maxScore: 30 },
      { key: "exam", label: "EXAM (70)", maxScore: 70 },
      { key: "total", label: "TOTAL (100)", maxScore: 100 },
    ],
    subjects: [
      "CALCULATION SKILL",
      "LANGUAGE ART",
      "AGRIC SCIENCE",
      "HOME ECONOMICS",
      "C.R.K",
      "CREATIVE ARTS",
      "BASIC SCIENCE",
      "PHONICS",
      "VOCATIONAL",
      "SOCIAL STUDIES",
      "HEALTH EDUCATION",
      "SPELLING",
      "HAND WRITING",
      "RHYMES",
      "DICTATION",
    ],
    ratingScale: [
      { grade: "A", label: "EXCELLENT", range: "100-81" },
      { grade: "B", label: "V. GOOD", range: "80-71" },
      { grade: "C", label: "GOOD", range: "70-61" },
      { grade: "D", label: "SATISFACTORY", range: "60-51" },
      { grade: "E", label: "AVERAGE", range: "50-40" },
      { grade: "F", label: "FAIL", range: "39-0" },
    ],
    affectiveTraits: [
      "NEATNESS", "ATTENTIVENESS", "CONSISTENCY", "OBEDIENCE",
      "SELF-CONTROL", "LEADERSHIP", "RESPONSE IN CLASS",
      "HOMEWORK RESPONSE", "APPEARANCE", "PUNCTUALITY",
    ],
    psychomotorSkills: ["CREATIVITY", "WRITING", "DRAMA", "SPORTS"],
    headerFields: ["name", "class", "position", "positionOutOf", "term", "session", "daysPresent", "daysAbsent", "totalScore", "average"],
    comments: { teacher: "classTeacherComment", admin: "headTeacherComment" },
    footer: ["outstandingSchoolFees", "resumptionDate", "headTeacherSignature"],
  },

  JUNIOR_SECONDARY: {
    id: "JUNIOR_SECONDARY",
    section: "JUNIOR_SECONDARY",
    label: "Junior Secondary School",
    scoreColumns: [
      { key: "ca", label: "C.A (30)", maxScore: 30 },
      { key: "exam", label: "EXAM (70)", maxScore: 70 },
      { key: "total", label: "TOTAL (100)", maxScore: 100 },
    ],
    subjects: [
      "MATHEMATICS",
      "ENGLISH LANGUAGE",
      "INTEGRATED SCIENCE",
      "INTRO. TECH",
      "SOCIAL STUDIES",
      "AGRIC SCIENCE",
      "BUSINESS STUDIES",
      "HOME ECONOMICS",
      "CIVIC EDUCATION",
      "P.H.E",
      "C.R.K",
      "CREATIVE & CULTURAL",
      "COMPUTER SCIENCE",
    ],
    ratingScale: [
      { grade: "A", label: "EXCELLENT", range: "100-81" },
      { grade: "B", label: "V. GOOD", range: "80-71" },
      { grade: "C", label: "GOOD", range: "70-61" },
      { grade: "D", label: "SATISFACTORY", range: "60-51" },
      { grade: "E", label: "AVERAGE", range: "50-40" },
      { grade: "F", label: "FAIL", range: "39-0" },
    ],
    affectiveTraits: [
      "NEATNESS", "ATTENTIVENESS", "CONSISTENCY", "OBEDIENCE",
      "SELF-CONTROL", "LEADERSHIP", "RESPONSE IN CLASS",
      "HOMEWORK RESPONSE", "APPEARANCE", "PUNCTUALITY",
    ],
    psychomotorSkills: ["CREATIVITY", "WRITING", "DRAMA", "SPORTS"],
    headerFields: ["name", "class", "position", "positionOutOf", "term", "session", "daysPresent", "daysAbsent", "totalScore", "average"],
    comments: { teacher: "formTeacherComment", admin: "principalComment" },
    footer: ["outstandingSchoolFees", "resumptionDate", "principalSignature"],
  },

  SENIOR_SECONDARY_BASIC: {
    id: "SENIOR_SECONDARY_BASIC",
    section: "SENIOR_SECONDARY",
    label: "Senior Secondary School",
    scoreColumns: [
      { key: "ca", label: "C.A (30)", maxScore: 30 },
      { key: "exam", label: "EXAM (70)", maxScore: 70 },
      { key: "total", label: "TOTAL (100)", maxScore: 100 },
    ],
    subjects: [
      "MATHEMATICS",
      "ENGLISH LANGUAGE",
      "BASIC SCIENCE & TECH",
      "AGRICULTURAL SCIENCE",
      "COMPUTER EDUCATION",
      "PHYSICAL & HEALTH EDUCATION",
      "CIVIC & MORAL EDUCATION",
      "HOME ECONOMICS",
      "SOCIAL STUDIES",
      "VOCATIONAL APTITUDE",
      "CHRISTIAN RELIGIONS STUDIES",
      "SPELLING & DICTATION",
      "CULTURAL & CREATIVE ART",
      "VERBAL APTITUDE",
      "QUANTITATIVE APTITUDE",
      "CALLIGRAPHY",
      "LITERATURE IN ENGLISH",
    ],
    ratingScale: [
      { grade: "A", label: "EXCELLENT", range: "100-81" },
      { grade: "B", label: "V. GOOD", range: "80-71" },
      { grade: "C", label: "GOOD", range: "70-61" },
      { grade: "D", label: "SATISFACTORY", range: "60-51" },
      { grade: "E", label: "AVERAGE", range: "50-40" },
      { grade: "F", label: "FAIL", range: "39-0" },
    ],
    affectiveTraits: [
      "NEATNESS", "ATTENTIVENESS", "CONSISTENCY", "OBEDIENCE",
      "SELF-CONTROL", "LEADERSHIP", "RESPONSE IN CLASS",
      "HOMEWORK RESPONSE", "APPEARANCE", "PUNCTUALITY",
    ],
    psychomotorSkills: ["CREATIVITY", "WRITING", "DRAMA", "SPORTS"],
    headerFields: ["name", "class", "position", "positionOutOf", "term", "session", "daysPresent", "daysAbsent", "totalScore", "average"],
    comments: { teacher: "formTeacherComment", admin: "principalComment" },
    footer: ["outstandingSchoolFees", "resumptionDate", "principalSignature"],
  },

  SENIOR_SECONDARY_EXTENDED: {
    id: "SENIOR_SECONDARY_EXTENDED",
    section: "SENIOR_SECONDARY",
    label: "Senior Secondary — Extended",
    scoreColumns: [
      { key: "ca", label: "CA (40)", maxScore: 40 },
      { key: "exam", label: "EXAM (60)", maxScore: 60 },
      { key: "total", label: "TOTAL (100)", maxScore: 100 },
    ],
    subjects: [
      "MATHEMATICS",
      "ENGLISH LANGUAGE",
      "BIOLOGY",
      "ECONOMICS",
      "GOVERNMENT",
      "CHEMISTRY",
      "PHYSICS",
      "CIVIC EDUCATION",
      "AGRIC SCIENCE",
      "GEOGRAPHY",
      "COMMERCE",
      "CRS",
      "COMPUTER SCIENCE",
      "DATA P.",
      "ACCOUNTING",
      "TECH DRAWING",
      "FURTHER MATHS",
    ],
    ratingScale: [
      { grade: "A", label: "EXCELLENT", range: "100-80" },
      { grade: "B", label: "VERY GOOD", range: "79-70" },
      { grade: "C", label: "GOOD", range: "69-60" },
      { grade: "D", label: "SATISFACTORY", range: "59-50" },
      { grade: "E", label: "AVERAGE", range: "49-40" },
      { grade: "F", label: "FAIL", range: "39-0" },
    ],
    affectiveTraits: [
      "NEATNESS", "OBEDIENCE", "PUNCTUALITY",
      "SPORTS", "WRITING", "RESPONSE IN CLASS",
    ],
    psychomotorSkills: [],
    headerFields: ["name", "class", "grade", "numberOfStudents", "term", "session", "daysPresent", "daysAbsent", "totalScore", "average"],
    comments: { teacher: "formTeacherComment", admin: "principalComment" },
    footer: ["outstandingSchoolFees", "resumptionDate", "principalSignature"],
  },
};

export function getSheetType(section: string, sheetTypeId?: string): SheetTypeConfig {
  if (sheetTypeId && SHEET_TYPES[sheetTypeId]) return SHEET_TYPES[sheetTypeId];
  const mapping: Record<string, string> = {
    NURSERY: "NURSERY_EARLY",
    PRIMARY: "PRIMARY",
    JUNIOR_SECONDARY: "JUNIOR_SECONDARY",
    SENIOR_SECONDARY: "SENIOR_SECONDARY_EXTENDED",
  };
  return SHEET_TYPES[mapping[section] || "PRIMARY"];
}

export function computeGrade(totalScore: number, sheetType: SheetTypeConfig): string {
  return getGrade(totalScore, sheetType.ratingScale);
}

export function computeAdminGrade(
  average: number,
  scale: RatingScaleEntry[]
): string {
  return getGrade(average, scale);
}
