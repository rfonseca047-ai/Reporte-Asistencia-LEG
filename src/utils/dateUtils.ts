import { RawDetection, VehicleRecord, DriverName } from '../types/vehicle';

export const SPANISH_DAYS = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
];

/**
 * Calculates ISO week number from a Date object
 */
export function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Day 0 is Sunday, ISO week starts on Monday
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Format Date to "D/M/YYYY HH:MM"
 */
export function formatToExcelDateTime(date: Date): string {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Parse string "D/M/YYYY HH:MM" into a Date object
 */
export function parseExcelDateTime(str: string): Date | null {
  if (!str || !str.includes('/') || !str.includes(':')) return null;
  try {
    const [datePart, timePart] = str.trim().split(' ');
    if (!datePart || !timePart) return null;
    const [day, month, year] = datePart.split('/').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hours) || isNaN(minutes)) {
      return null;
    }
    return new Date(year, month - 1, day, hours, minutes, 0);
  } catch {
    return null;
  }
}

/**
 * Calculate decimal hours between two dates, rounded to 2 decimals
 */
export function calculateHoursDifference(start: Date, end: Date): number {
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return 0;
  const hours = diffMs / (1000 * 60 * 60);
  return Math.round(hours * 100) / 100;
}

/**
 * Format number with comma as decimal separator, e.g. 2.82 -> "2,82"
 */
export function formatDecimalHours(hours: number): string {
  return hours.toFixed(2).replace('.', ',');
}

/**
 * Parse decimal string with comma or dot into number
 */
export function parseDecimalHours(str: string): number {
  const clean = str.replace(',', '.').trim();
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

/**
 * Get Spanish day of the week for a Date object
 */
export function getSpanishDay(date: Date): string {
  return SPANISH_DAYS[date.getDay()];
}

/**
 * Given a list of raw detections from WhatsApp screenshots,
 * pair INGRESO and SALIDA by employee and date to create attendance records.
 */
export function pairDetectionsIntoRecords(detections: RawDetection[]): VehicleRecord[] {
  // Sort chronologically
  const sorted = [...detections].sort((a, b) => {
    const timeA = new Date(`${a.date}T${a.time}:00`).getTime();
    const timeB = new Date(`${b.date}T${b.time}:00`).getTime();
    return timeA - timeB;
  });

  // Group by employee
  const byEmployee: Record<string, RawDetection[]> = {
    'ENRIQUE GRANT': [],
    'LUIS E. GRANT': [],
  };

  sorted.forEach((det) => {
    const emp = det.driver || det.employeeName;
    if (emp === 'ENRIQUE GRANT' || emp === 'LUIS E. GRANT') {
      byEmployee[emp].push(det);
    }
  });

  const records: VehicleRecord[] = [];

  // For each employee, match INGRESO with next SALIDA
  for (const driverName of ['ENRIQUE GRANT', 'LUIS E. GRANT'] as DriverName[]) {
    const events = byEmployee[driverName] || [];
    let pendingIngreso: RawDetection | null = null;

    for (let i = 0; i < events.length; i++) {
      const ev = events[i];

      if (ev.movementType === 'INGRESO') {
        if (pendingIngreso) {
          const d = new Date(`${pendingIngreso.date}T${pendingIngreso.time}:00`);
          const predio = pendingIngreso.predio || 'Predio 3';
          records.push({
            id: `rec-${pendingIngreso.id || Math.random().toString(36).substring(2, 9)}`,
            semana: getWeekNumber(d),
            dia: getSpanishDay(d),
            predio,
            fechaIngreso: formatToExcelDateTime(d),
            fechaSalida: `${pendingIngreso.date.split('-').reverse().join('/')} --:--`,
            nombre: driverName,
            horas: 0,
            observaciones: 'PENDIENTE DE VERIFICACIÓN',
            sourceImage: pendingIngreso.sourceImage,
          });
        }
        pendingIngreso = ev;
      } else if (ev.movementType === 'SALIDA') {
        if (pendingIngreso) {
          // Valid matched pair!
          const inDate = new Date(`${pendingIngreso.date}T${pendingIngreso.time}:00`);
          const outDate = new Date(`${ev.date}T${ev.time}:00`);
          const hours = calculateHoursDifference(inDate, outDate);
          const week = getWeekNumber(inDate);
          const predio = ev.predio || pendingIngreso.predio || 'Predio 3';

          records.push({
            id: `rec-${Math.random().toString(36).substring(2, 9)}`,
            semana: week,
            dia: getSpanishDay(inDate),
            predio,
            fechaIngreso: formatToExcelDateTime(inDate),
            fechaSalida: formatToExcelDateTime(outDate),
            nombre: driverName,
            horas: hours,
            observaciones: '',
            sourceImage: `${pendingIngreso.sourceImage || ''} / ${ev.sourceImage || ''}`.trim(),
          });
          pendingIngreso = null;
        } else {
          // Orphan SALIDA without INGRESO
          const d = new Date(`${ev.date}T${ev.time}:00`);
          const predio = ev.predio || 'Predio 3';
          records.push({
            id: `rec-${ev.id || Math.random().toString(36).substring(2, 9)}`,
            semana: getWeekNumber(d),
            dia: getSpanishDay(d),
            predio,
            fechaIngreso: `${ev.date.split('-').reverse().join('/')} --:--`,
            fechaSalida: formatToExcelDateTime(d),
            nombre: driverName,
            horas: 0,
            observaciones: 'PENDIENTE DE VERIFICACIÓN',
            sourceImage: ev.sourceImage,
          });
        }
      }
    }

    // Trailing pending ingreso
    if (pendingIngreso) {
      const d = new Date(`${pendingIngreso.date}T${pendingIngreso.time}:00`);
      const predio = pendingIngreso.predio || 'Predio 3';
      records.push({
        id: `rec-${pendingIngreso.id || Math.random().toString(36).substring(2, 9)}`,
        semana: getWeekNumber(d),
        dia: getSpanishDay(d),
        predio,
        fechaIngreso: formatToExcelDateTime(d),
        fechaSalida: `${pendingIngreso.date.split('-').reverse().join('/')} --:--`,
        nombre: driverName,
        horas: 0,
        observaciones: 'PENDIENTE DE VERIFICACIÓN',
        sourceImage: pendingIngreso.sourceImage,
      });
    }
  }

  // Sort by week descending, then employee, then chronological timestamp
  return sortAttendanceRecords(records);
}

/**
 * Extract an exact millisecond timestamp from "D/M/YYYY HH:MM" or "DD/MM/YYYY HH:MM"
 */
export function getRecordTimestamp(fechaStr: string): number {
  if (!fechaStr) return 0;
  try {
    const [datePart, timePart] = fechaStr.trim().split(' ');
    if (!datePart || !datePart.includes('/')) return 0;
    const [d, m, y] = datePart.split('/').map(Number);
    if (!d || !m || !y) return 0;

    let hours = 0;
    let minutes = 0;
    if (timePart && timePart.includes(':') && !timePart.includes('--')) {
      const [h, min] = timePart.split(':').map(Number);
      if (!isNaN(h)) hours = h;
      if (!isNaN(min)) minutes = min;
    }
    return new Date(y, m - 1, d, hours, minutes, 0).getTime();
  } catch {
    return 0;
  }
}

/**
 * Standard sorter for Attendance Records:
 * 1. Semanas ordenadas de mayor a menor (ej: 44, 43, 42 ... 23)
 * 2. Empleados agrupados (ENRIQUE GRANT primero, luego LUIS E. GRANT)
 * 3. Dentro de cada semana y empleado: estrictamente cronológico por fecha y hora
 *    (Domingo -> Lunes -> Martes -> Miércoles -> Jueves -> Viernes -> Sábado)
 * 4. En el mismo día con varias entradas: por hora de ingreso ascendente (ej. 09:00 antes de 13:30)
 */
export function sortAttendanceRecords(records: VehicleRecord[]): VehicleRecord[] {
  return [...records].sort((a, b) => {
    // 1. Semana: de mayor a menor (44, 43, 42...)
    if (b.semana !== a.semana) {
      return b.semana - a.semana;
    }

    // 2. Empleado: mantener agrupado
    if (a.nombre !== b.nombre) {
      return a.nombre.localeCompare(b.nombre);
    }

    // 3. Fecha y hora cronológica (más temprano antes de más tarde)
    const timeA = getRecordTimestamp(a.fechaIngreso);
    const timeB = getRecordTimestamp(b.fechaIngreso);
    if (timeA !== timeB) {
      return timeA - timeB;
    }

    // 4. Si empatan en hora de ingreso, ordenar por hora de salida
    const outA = getRecordTimestamp(a.fechaSalida);
    const outB = getRecordTimestamp(b.fechaSalida);
    if (outA !== outB) {
      return outA - outB;
    }

    // 5. Desempate por predio o id
    return (a.predio || '').localeCompare(b.predio || '');
  });
}

