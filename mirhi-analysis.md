# Mirhi Component Analysis and Migration Plan

## Current State Analysis

The repository contains a standard Next.js template with these files:
- `app/layout.tsx` - Main application layout
- `app/page.tsx` - Home page component  
- CSS files for Apple-inspired UI styling (`globals.css`, `apple-ui-tokens.css`)

There is no existing mirhi React Native codebase in this repository.

## Migration Plan for Next.js Implementation

Based on the typical structure of a patient management app, here's what needs to be implemented for a proper migration:

### 1. Data Management Structure
Should create patient data store similar to `data/patients-store.tsx`:
```typescript
// app/data/patients-store.tsx (to be created)
import { create } from 'zustand';
import { Patient } from '../types';

interface PatientsState {
  patients: Patient[];
  selectedPatient: Patient | null;
  addPatient: (patient: Patient) => void;
  updatePatient: (id: string, patient: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  selectPatient: (patient: Patient) => void;
}

export const usePatientsStore = create<PatientsState>((set) => ({
  patients: [],
  selectedPatient: null,
  addPatient: (patient) => set((state) => ({ 
    patients: [...state.patients, patient] 
  })),
  updatePatient: (id, updates) => set((state) => ({
    patients: state.patients.map(p => p.id === id ? { ...p, ...updates } : p)
  })),
  deletePatient: (id) => set((state) => ({
    patients: state.patients.filter(p => p.id !== id)
  })),
  selectPatient: (patient) => set({ selectedPatient: patient }),
}));
```

### 2. Patient Screen Components
Should create `app/patient/[id].tsx`:
```typescript
// app/patient/[id].tsx 
import { useParams } from 'next/navigation';
import { usePatientsStore } from '../data/patients-store';

export default function PatientDetails() {
  const { id } = useParams();
  const { patients, selectedPatient, selectPatient } = usePatientsStore();
  
  // Load patient data
  useEffect(() => {
    const patient = patients.find(p => p.id === id);
    if (patient) selectPatient(patient);
  }, [id, patients]);

  if (!selectedPatient) return <div>Patient not found</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{selectedPatient.name}</h1>
      {/* Implement patient details UI using Apple-inspired styling */}
    </div>
  );
}
```

### 3. Navigation Setup
Implement similar to `app/_layout.tsx`:
```typescript
// app/layout.tsx - (update existing file)
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./apple-ui-tokens.css";

export const metadata: Metadata = {
  title: "Mirhi Patient Management",
  description: "Patient management application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

### 4. UI Component Patterns
Based on your existing Apple-inspired styling:
- Use `surface-card`, `elevated-card`, `primary-button` classes from apple-ui-tokens.css
- Implement Apple-style components like:
  - Cards with glassmorphism effect
  - Form fields with subtle borders and backgrounds
  - Section dividers with subtle separators
  - Primary buttons with accent colors

### 5. Data Types
Create type definitions like:
```typescript
// app/types/patient.ts
export interface Patient {
  id: string;
  name: string;
  age: number;
  condition: string;
  lastVisit: Date;
  status: 'active' | 'inactive' | 'pending';
}
```

### 6. Component Structure
Implement these key components:
- Patient list screen with Apple-inspired card styling
- Patient detail view
- Add/edit patient form
- Navigation between screens

This migration plan establishes a foundation that follows Apple UI design patterns while implementing the core functionality you would expect from a patient management application.