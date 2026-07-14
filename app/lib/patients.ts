export type Disease = 'Astma' | 'AZS' | 'Pokrzywka';
export type ProgramStatus = 'ACTIVE' | 'SUSPENDED' | 'ENDED';

export type Patient = {
  id: string; name: string; disease: Disease; medicine: string; doseMg: string;
  therapyStartDate: string; visitDate: string; programStatus: ProgramStatus;
  cycleStartDate?: string; suspensionStartDate?: string; kontrola: boolean;
  intakeDurationDays?: number; homeDoseCount?: number; homeDoseDates?: string[];
  lastWorkflowActionDate?: string; lastWorkflowActionType?: 'NEXT_VISIT_PLANNED' | 'THERAPY_RESET';
};

const key = 'mirhi_patients_v3_demo';
let patients: Patient[] = [];
let nextId = 1;
let hydrated = false;
const serverPatientsSnapshot: Patient[] = [];
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
const formatIso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const isIso = (value: string | undefined): value is string => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
const iso = () => formatIso(new Date());
export const normalizeWorkday = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  while (date.getDay() === 0 || date.getDay() === 6) date.setDate(date.getDate() + 1);
  return formatIso(date);
};
const normalise = (patient: Patient): Patient => ({
  ...patient, programStatus: patient.programStatus ?? 'ACTIVE', visitDate: normalizeWorkday(patient.visitDate),
  therapyStartDate: normalizeWorkday(patient.therapyStartDate),
  cycleStartDate: patient.cycleStartDate ? normalizeWorkday(patient.cycleStartDate) : undefined,
  suspensionStartDate: patient.suspensionStartDate ? normalizeWorkday(patient.suspensionStartDate) : undefined,
  intakeDurationDays: Number.isFinite(patient.intakeDurationDays) ? Math.max(0, Math.floor(patient.intakeDurationDays!)) : undefined,
  homeDoseCount: Number.isFinite(patient.homeDoseCount) ? Math.max(0, Math.floor(patient.homeDoseCount!)) : undefined,
  homeDoseDates: Array.isArray(patient.homeDoseDates) ? patient.homeDoseDates.filter((date): date is string => typeof date === 'string' && isIso(date)) : undefined,
  lastWorkflowActionDate: isIso(patient.lastWorkflowActionDate) ? patient.lastWorkflowActionDate : undefined,
  lastWorkflowActionType: patient.lastWorkflowActionType === 'NEXT_VISIT_PLANNED' || patient.lastWorkflowActionType === 'THERAPY_RESET' ? patient.lastWorkflowActionType : undefined,
});
const persist = () => { try { localStorage.setItem(key, JSON.stringify({ patients, nextId })); } catch {} };
export const subscribePatients = (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener); };
export const getPatientsSnapshot = () => patients;
export const getServerPatientsSnapshot = () => serverPatientsSnapshot;
export const getHydrationSnapshot = () => hydrated;
export const getServerHydrationSnapshot = () => false;
export const initPatientsStore = () => {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  try { const saved = JSON.parse(localStorage.getItem(key) || '{}'); if (Array.isArray(saved.patients)) patients = saved.patients.map(normalise); if (Number.isFinite(saved.nextId)) nextId = saved.nextId; else nextId = patients.length + 1; } catch {}
  persist();
  notify();
};
export const addPatient = (firstName: string, lastName: string, disease: Disease, medicine: string, doseMg: string, therapyStartDate: string) => {
  const id = String(nextId++);
  const patient = normalise({ id, name: `${firstName.trim().charAt(0).toUpperCase()}. ${lastName.trim()}`, disease, medicine, doseMg, therapyStartDate, visitDate: normalizeWorkday(iso()), programStatus: 'ACTIVE', cycleStartDate: therapyStartDate, kontrola: Number(id) % 2 === 0 });
  patients = [patient, ...patients]; persist(); notify(); return patient;
};
export const updatePatientSchedule = (id: string, update: Partial<Patient>) => { patients = patients.map((p) => p.id === id ? normalise({ ...p, ...update }) : p); persist(); notify(); };
export const resetPatientTherapy = (id: string, startDate: string) => updatePatientSchedule(id, { therapyStartDate: startDate, visitDate: startDate, programStatus: 'ACTIVE', cycleStartDate: startDate, suspensionStartDate: undefined, intakeDurationDays: undefined, homeDoseCount: undefined, homeDoseDates: undefined, lastWorkflowActionDate: iso(), lastWorkflowActionType: 'THERAPY_RESET', kontrola: false });
