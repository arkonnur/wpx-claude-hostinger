// ft+in <-> mm/m conversions. Ported from wpx-boq (canonical).
export const FT_TO_MM = 304.8;
export const IN_TO_MM = 25.4;
export const M_TO_FT = 3.28084;
export const SQM_TO_SQFT = 10.7639;
export const SQFT_TO_SQM = 1 / SQM_TO_SQFT;
export const SQYD_TO_SQFT = 9;

export interface FtIn {
  ft: number;
  in: number;
}

export const ftInToMm = (v: FtIn): number => (v.ft || 0) * FT_TO_MM + (v.in || 0) * IN_TO_MM;
export const mmToFtIn = (mm: number): FtIn => {
  const totalIn = mm / IN_TO_MM;
  const ft = Math.floor(totalIn / 12);
  const inch = +(totalIn - ft * 12).toFixed(1);
  return { ft, in: inch };
};
export const mmToM = (mm: number) => mm / 1000;
export const mmToFt = (mm: number) => mm / FT_TO_MM;
export const sqmmToSqft = (sqmm: number) => sqmm / (FT_TO_MM * FT_TO_MM);
export const sqmmToSqm = (sqmm: number) => sqmm / 1_000_000;

/** Normalize any supported area unit to sqft. */
export const toSqft = (value: number, unit: "sqft" | "sqm" | "sqyd"): number => {
  if (unit === "sqm") return value * SQM_TO_SQFT;
  if (unit === "sqyd") return value * SQYD_TO_SQFT;
  return value;
};

export const fmtFtIn = (mm: number) => {
  const { ft, in: inch } = mmToFtIn(mm);
  return `${ft}'${inch}"`;
};
export const fmtArea = (sqmm: number) =>
  `${sqmmToSqft(sqmm).toLocaleString("en-IN", { maximumFractionDigits: 0 })} sqft`;
export const fmtINR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
