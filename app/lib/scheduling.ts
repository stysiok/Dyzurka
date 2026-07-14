import type { Disease, ProgramStatus } from './patients';

export type ScheduleInput = { disease: Disease; medicine: string; doseMg: string; lastVisitDate: string; therapyStartDate: string; programStatus: ProgramStatus; cycleStartDate: string; suspensionStartDate?: string };
export type NextVisitResult = { nextVisitDate: string; hasNextVisit: boolean; isKontrola: boolean; note: string; sourceProgram: string; nextProgramStatus?: ProgramStatus; nextCycleStartDate?: string; nextSuspensionStartDate?: string };
export type ControlPoint = { date: string; days: number; kind: 'KONTROLA' | 'BADANIA_B44' };

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_PROJECTION_STEPS = 200;
const SPIROMETRY_INTERVAL = 120;
const parse = (iso: string) => new Date(`${iso}T00:00:00`);
const format = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const workday = (iso: string) => { const date = parse(iso); while (date.getDay() === 0 || date.getDay() === 6) date.setDate(date.getDate() + 1); return format(date); };
const addDaysRaw = (iso: string, days: number) => { const date = parse(iso); date.setDate(date.getDate() + days); return format(date); };
const addDays = (iso: string, days: number) => workday(addDaysRaw(iso, days));
const weeksFromStart = (start: string, target: string) => Math.floor((parse(target).getTime() - parse(start).getTime()) / DAY_MS / 7);

export const calculateNextVisit = (input: ScheduleInput): NextVisitResult => {
  const med = input.medicine.toUpperCase();
  if (input.disease === 'AZS') {
    if (med === 'DUPIXENT') { const nextVisitDate = addDays(input.lastVisitDate, 14); const week = weeksFromStart(input.therapyStartDate, nextVisitDate); return { nextVisitDate, hasNextVisit: true, isKontrola: week === 16 || week === 26 || (week > 26 && (week - 26) % 26 === 0), sourceProgram: 'B.124 (AZS)', note: 'Dupilumab co 2 tygodnie; punkty monitorowania: 16, 26 tyg. i dalej co 6 mies.' }; }
    if (med === 'RINVOQ') { const week16 = addDaysRaw(input.therapyStartDate, 16 * 7); const nextVisitDate = parse(input.lastVisitDate) < parse(week16) ? workday(week16) : addDays(input.lastVisitDate, 90); return { nextVisitDate, hasNextVisit: true, isKontrola: true, sourceProgram: 'B.124 (AZS)', note: 'JAK inhibitor: monitorowanie po 16 tyg., następnie co ok. 3 miesiące.' }; }
    return { nextVisitDate: addDays(input.lastVisitDate, 90), hasNextVisit: true, isKontrola: true, sourceProgram: 'B.124 (AZS)', note: 'Domyślny harmonogram AZS: kontrola co ok. 3 miesiące.' };
  }
  if (input.disease === 'Pokrzywka') {
    const status = input.programStatus; const cycle = input.cycleStartDate || input.therapyStartDate; const suspension = input.suspensionStartDate || input.lastVisitDate;
    if (status === 'ENDED') return { nextVisitDate: '', hasNextVisit: false, isKontrola: false, sourceProgram: 'B.107', note: 'Program zakończony po okresie zawieszenia (wymaga ponownej kwalifikacji).', nextProgramStatus: 'ENDED', nextCycleStartDate: cycle, nextSuspensionStartDate: suspension };
    if (status === 'SUSPENDED') { const checkpoints = [42, 98, 168].map((days) => workday(addDaysRaw(suspension, days))); const next = checkpoints.find((date) => parse(date).getTime() > parse(input.lastVisitDate).getTime()); if (!next) return { nextVisitDate: '', hasNextVisit: false, isKontrola: false, sourceProgram: 'B.107', note: 'Po harmonogramie kontroli 6/14/24 tygodni program został zakończony.', nextProgramStatus: 'ENDED', nextCycleStartDate: cycle, nextSuspensionStartDate: suspension }; const final = next === checkpoints[2]; return { nextVisitDate: next, hasNextVisit: true, isKontrola: true, sourceProgram: 'B.107', note: final ? 'Zawieszenie terapii: ostatnia kontrola po 24 tygodniach (bez podania leku).' : 'Zawieszenie terapii: kontrola bez podania leku zgodnie z harmonogramem 6/14/24 tyg.', nextProgramStatus: final ? 'ENDED' : 'SUSPENDED', nextCycleStartDate: cycle, nextSuspensionStartDate: suspension }; }
    const regular = addDays(input.lastVisitDate, 28); const boundary = workday(addDaysRaw(cycle, 168)); const tolerance = workday(addDaysRaw(cycle, 182));
    if (parse(regular).getTime() <= parse(tolerance).getTime()) return { nextVisitDate: regular, hasNextVisit: true, isKontrola: false, sourceProgram: 'B.107', note: 'Aktywny cykl: omalizumab 300 mg co 4 tygodnie.', nextProgramStatus: 'ACTIVE', nextCycleStartDate: cycle };
    return { nextVisitDate: boundary, hasNextVisit: true, isKontrola: true, sourceProgram: 'B.107', note: 'Wizyta po 24 tygodniach: zawieszenie terapii i przejście do monitorowania bez leku.', nextProgramStatus: 'SUSPENDED', nextCycleStartDate: cycle, nextSuspensionStartDate: boundary };
  }
  let interval = 28; let note = 'Wizyta zgodna z dawkowaniem leku.';
  if (med === 'DUPIXENT') { interval = 14; note = 'Dupilumab: dawka podtrzymująca co 2 tygodnie.'; } else if (med === 'NUCALA') { note = 'Mepolizumab: co 4 tygodnie.'; } else if (med === 'FASENRA') { interval = weeksFromStart(input.therapyStartDate, input.lastVisitDate) < 8 ? 28 : 56; note = 'Benralizumab: pierwsze 3 dawki co 4 tyg., potem co 8 tyg.'; } else if (med === 'XOLAIR') { interval = Number(input.doseMg.replace(',', '.')) >= 375 ? 14 : 28; note = 'Omalizumab: interwał 2–4 tyg. zależy od schematu dawkowania.'; }
  const nextVisitDate = addDays(input.lastVisitDate, interval); const week = weeksFromStart(input.therapyStartDate, nextVisitDate);
  return { nextVisitDate, hasNextVisit: true, isKontrola: week === 24 || week === 52 || (week > 52 && week % 52 === 0), sourceProgram: 'B.44', note };
};

const advance = (input: ScheduleInput, visit: Pick<NextVisitResult, 'nextVisitDate' | 'nextProgramStatus' | 'nextCycleStartDate' | 'nextSuspensionStartDate'>): ScheduleInput => ({ ...input, lastVisitDate: visit.nextVisitDate, programStatus: visit.nextProgramStatus ?? input.programStatus, cycleStartDate: visit.nextCycleStartDate ?? input.cycleStartDate, suspensionStartDate: visit.nextSuspensionStartDate ?? input.suspensionStartDate });
export const daysUntil = (target: string, today: Date) => Math.max(0, Math.floor((parse(target).getTime() - today.getTime()) / DAY_MS));
export const dosesUntilControl = (input: ScheduleInput) => { let count = 0; let cursor = input; for (let i = 0; i < MAX_PROJECTION_STEPS; i += 1) { const visit = calculateNextVisit(cursor); if (!visit.hasNextVisit || visit.isKontrola) break; count += 1; cursor = advance(cursor, visit); } return count; };
export const dosesUntilSpirometry = (input: ScheduleInput) => { if (input.disease !== 'Astma') return Infinity; const target = workday(addDaysRaw(input.lastVisitDate, SPIROMETRY_INTERVAL)); let count = 0; let cursor = input; for (let i = 0; i < MAX_PROJECTION_STEPS; i += 1) { const visit = calculateNextVisit(cursor); if (!visit.hasNextVisit || visit.nextVisitDate > target) break; count += 1; cursor = advance(cursor, visit); } return Math.max(0, count - 1); };
export const projectedVisit = (input: ScheduleInput, doses: number) => { let visit = calculateNextVisit(input); let cursor = input; for (let i = 0; i < doses; i += 1) { if (!visit.hasNextVisit) break; cursor = advance(cursor, visit); visit = calculateNextVisit(cursor); } return visit; };
export const homeMedicationDates = (input: ScheduleInput, doses: number) => { const dates: string[] = []; let cursor = input; for (let i = 0; i < doses; i += 1) { const visit = calculateNextVisit(cursor); if (!visit.hasNextVisit) break; dates.push(visit.nextVisitDate); cursor = advance(cursor, visit); } return dates; };
export const intakeDays = (input: ScheduleInput, doses: number) => { let total = 0; let cursor = input; for (let i = 0; i < doses; i += 1) { const visit = calculateNextVisit(cursor); if (!visit.hasNextVisit) break; total += Math.max(0, Math.round((parse(visit.nextVisitDate).getTime() - parse(cursor.lastVisitDate).getTime()) / DAY_MS)); cursor = advance(cursor, visit); } return total; };
export const getUpcomingControlPoints = (input: ScheduleInput, today: Date): ControlPoint[] => { const points: ControlPoint[] = []; const end = new Date(today); end.setDate(end.getDate() + 365); let cursor = input; for (let i = 0; i < MAX_PROJECTION_STEPS; i += 1) { const visit = calculateNextVisit(cursor); if (!visit.hasNextVisit || parse(visit.nextVisitDate) > end) break; if (visit.isKontrola) points.push({ date: visit.nextVisitDate, days: daysUntil(visit.nextVisitDate, today), kind: 'KONTROLA' }); cursor = advance(cursor, visit); } if (input.disease === 'Astma') { const spirometry = parse(input.lastVisitDate); for (let i = 0; i < 12; i += 1) { spirometry.setDate(spirometry.getDate() + SPIROMETRY_INTERVAL); const date = workday(format(spirometry)); if (parse(date) > end) break; points.push({ date, days: daysUntil(date, today), kind: 'BADANIA_B44' }); } } return points.sort((a, b) => a.days - b.days || a.date.localeCompare(b.date)); };
