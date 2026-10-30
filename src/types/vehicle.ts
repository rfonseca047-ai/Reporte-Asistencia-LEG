export type EmployeeName = 'ENRIQUE GRANT' | 'LUIS E. GRANT' | 'OTRO';
export type DriverName = EmployeeName; // Alias for backward compatibility
export type MovementType = 'INGRESO' | 'SALIDA' | 'DESCONOCIDO';
export type PredioType = 'Predio 1' | 'Predio 2' | 'Predio 3' | string;

export interface VehicleRecord {
  id: string;
  semana: number; // e.g. 39, 40
  dia: string; // 'lunes' | 'martes' | 'miércoles' | 'jueves' | 'viernes' | 'sábado' | 'domingo'
  predio?: PredioType; // "Predio 1" | "Predio 2" | "Predio 3"
  fechaIngreso: string; // Format: "D/M/YYYY HH:MM"
  fechaSalida: string; // Format: "D/M/YYYY HH:MM"
  nombre: EmployeeName;
  horas: number; // Decimal hours, e.g. 2.82
  observaciones: string; // "" | "NO HAY DATOS" | "PENDIENTE DE VERIFICACIÓN" | custom notes
  sourceImage?: string;
  isVerified?: boolean;
}

export type AttendanceRecord = VehicleRecord;

export interface RawDetection {
  id: string;
  sourceImage?: string;
  driver: EmployeeName; // Employee Name
  employeeName?: EmployeeName;
  predio?: PredioType;
  movementType: MovementType;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  rawTextFound?: string;
  confidenceNotes?: string;
  timestamp: number;
}
