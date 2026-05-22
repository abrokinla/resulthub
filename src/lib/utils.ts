import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generatePin(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let pin = "";
  for (let i = 0; i < 6; i++) {
    pin += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pin;
}

export function computeCAScore(
  assessments: { scoreObtained: number; maxScore: number; type: string }[],
  caMaxScore: number = 30
): number {
  const testAssessments = assessments.filter(
    (a) => a.type === "CLASS_TEST" || a.type === "MID_TERM_EXAM"
  );
  if (testAssessments.length === 0) return 0;
  const totalObtained = testAssessments.reduce((s, a) => s + a.scoreObtained, 0);
  const totalMax = testAssessments.reduce((s, a) => s + a.maxScore, 0);
  if (totalMax === 0) return 0;
  return Math.round((totalObtained / totalMax) * caMaxScore * 100) / 100;
}

export function computeExamScore(
  assessments: { scoreObtained: number; maxScore: number; type: string }[]
): number {
  const exam = assessments.find((a) => a.type === "TERMINAL_EXAM");
  if (!exam) return 0;
  return Math.round((exam.scoreObtained / exam.maxScore) * 60 * 100) / 100;
}

export function computeTotal(caScore: number, examScore: number): number {
  return Math.round((caScore + examScore) * 100) / 100;
}

export function isFail(totalScore: number, passThreshold: number): boolean {
  return totalScore <= passThreshold;
}

export const DEFAULT_CLASSES = [
  { name: "Nursery 1", section: "NURSERY", sheetType: "NURSERY_EARLY", order: 1 },
  { name: "Nursery 2", section: "NURSERY", sheetType: "NURSERY_EARLY", order: 2 },
  { name: "Nursery 3", section: "NURSERY", sheetType: "NURSERY_EARLY", order: 3 },
  { name: "Primary 1", section: "PRIMARY", sheetType: "PRIMARY", order: 4 },
  { name: "Primary 2", section: "PRIMARY", sheetType: "PRIMARY", order: 5 },
  { name: "Primary 3", section: "PRIMARY", sheetType: "PRIMARY", order: 6 },
  { name: "Primary 4", section: "PRIMARY", sheetType: "PRIMARY", order: 7 },
  { name: "Primary 5", section: "PRIMARY", sheetType: "PRIMARY", order: 8 },
  { name: "Primary 6", section: "PRIMARY", sheetType: "PRIMARY", order: 9 },
  { name: "JSS 1", section: "JUNIOR_SECONDARY", sheetType: "JUNIOR_SECONDARY", order: 10 },
  { name: "JSS 2", section: "JUNIOR_SECONDARY", sheetType: "JUNIOR_SECONDARY", order: 11 },
  { name: "JSS 3", section: "JUNIOR_SECONDARY", sheetType: "JUNIOR_SECONDARY", order: 12 },
  { name: "SSS 1", section: "SENIOR_SECONDARY", sheetType: "SENIOR_SECONDARY_EXTENDED", order: 13 },
  { name: "SSS 2", section: "SENIOR_SECONDARY", sheetType: "SENIOR_SECONDARY_EXTENDED", order: 14 },
  { name: "SSS 3", section: "SENIOR_SECONDARY", sheetType: "SENIOR_SECONDARY_EXTENDED", order: 15 },
];
