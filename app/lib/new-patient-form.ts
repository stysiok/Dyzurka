import type { Disease } from './patients';

export type Medicine = 'XOLAIR' | 'DUPIXENT' | 'RINVOQ' | 'NUCALA' | 'FASENRA';
type WeightBin = '20-25' | '>25-30' | '>30-40' | '>40-50' | '>50-60' | '>60-70' | '>70-80' | '>80-90' | '>90-125' | '>125-150';
export const MEDICINES: Record<Disease, Medicine[]> = { Pokrzywka: ['XOLAIR'], AZS: ['DUPIXENT', 'RINVOQ'], Astma: ['DUPIXENT', 'NUCALA', 'FASENRA', 'XOLAIR'] };
export const DEFAULT_MEDICINE: Record<Disease, Medicine> = { Pokrzywka: 'XOLAIR', AZS: 'DUPIXENT', Astma: 'DUPIXENT' };
export const XOLAIR_TABLE3_URL = 'https://ec.europa.eu/health/documents/community-register/2016/20160909135675/anx_135675_pl.pdf#page=4';
const table: Record<string, Partial<Record<WeightBin, number>>> = {
  '>200-300': { '>125-150': 375 }, '>300-400': { '>90-125': 450, '>125-150': 525 },
  '>400-500': { '>70-80': 375, '>80-90': 375, '>90-125': 525, '>125-150': 600 },
  '>500-600': { '>60-70': 375, '>70-80': 450, '>80-90': 450, '>90-125': 600 },
  '>600-700': { '>25-30': 225, '>50-60': 375, '>60-70': 450, '>70-80': 450, '>80-90': 525 },
  '>700-800': { '20-25': 225, '>25-30': 225, '>30-40': 300, '>40-50': 375, '>50-60': 450, '>60-70': 450, '>70-80': 525, '>80-90': 600 },
  '>800-900': { '20-25': 225, '>25-30': 225, '>30-40': 300, '>40-50': 375, '>50-60': 450, '>60-70': 525, '>70-80': 600 },
  '>900-1000': { '20-25': 225, '>25-30': 300, '>30-40': 375, '>40-50': 450, '>50-60': 525, '>60-70': 600 },
  '>1000-1100': { '20-25': 225, '>25-30': 300, '>30-40': 375, '>40-50': 450, '>50-60': 600 },
  '>1100-1200': { '20-25': 300, '>25-30': 300, '>30-40': 450, '>40-50': 525, '>50-60': 600 },
  '>1200-1300': { '20-25': 300, '>25-30': 375, '>30-40': 450, '>40-50': 525 }, '>1300-1500': { '20-25': 300, '>25-30': 375, '>30-40': 525, '>40-50': 600 },
};
export const sanitizeDecimal = (value: string) => value.replace(/[^0-9.,]/g, '');
export const defaultDose = (disease: Disease, medicine: Medicine) => { if (disease === 'Pokrzywka') return '300'; if (disease === 'AZS') return medicine === 'RINVOQ' ? '15' : '200'; if (medicine === 'NUCALA') return '100'; if (medicine === 'FASENRA') return '30'; if (medicine === 'DUPIXENT') return '400'; return ''; };
const decimal = (value: string) => value.trim() ? Number(value.replace(',', '.')) : Number.NaN;
const weightBin = (weight: number): WeightBin | undefined => { if (weight >= 20 && weight <= 25) return '20-25'; if (weight > 25 && weight <= 30) return '>25-30'; if (weight > 30 && weight <= 40) return '>30-40'; if (weight > 40 && weight <= 50) return '>40-50'; if (weight > 50 && weight <= 60) return '>50-60'; if (weight > 60 && weight <= 70) return '>60-70'; if (weight > 70 && weight <= 80) return '>70-80'; if (weight > 80 && weight <= 90) return '>80-90'; if (weight > 90 && weight <= 125) return '>90-125'; if (weight > 125 && weight <= 150) return '>125-150'; return undefined; };
const igeRow = (ige: number) => { if (ige >= 30 && ige <= 200) return 'table2'; for (let start = 200; start < 1500; start += 100) if (ige > start && ige <= start + (start === 1300 ? 200 : 100)) return `>${start}-${start + (start === 1300 ? 200 : 100)}`; return undefined; };
export const xolairGuidance = (igeValue: string, weightValue: string) => { const ige = decimal(igeValue), weight = decimal(weightValue); if (!Number.isFinite(ige) || !Number.isFinite(weight)) return { dose: '', message: 'Podaj stężenie IgE i masę ciała, aby wyliczyć dawkę.' }; const row = igeRow(ige), bin = weightBin(weight); if (!row || !bin) return { dose: '', message: 'Wartości są poza wspieranym zakresem kalkulacji.' }; if (row === 'table2') return { dose: '', message: 'Dla tych wartości nie można wyliczyć dawki w tym widoku.' }; const dose = table[row]?.[bin]; return dose ? { dose: String(dose), message: 'Dawka została uzupełniona automatycznie.' } : { dose: '', message: 'Brak dostępnej rekomendacji dawki dla podanych wartości.' }; };
