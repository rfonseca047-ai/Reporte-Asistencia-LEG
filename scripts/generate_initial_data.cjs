const fs = require('fs');

const records = JSON.parse(fs.readFileSync('parsed_pdf_records.json', 'utf8'));

const mapped = records.map((r, i) => {
  return {
    id: `rec-pdf-${String(i + 1).padStart(4, '0')}`,
    semana: r.week,
    dia: r.dayOfWeek.toLowerCase(),
    predio: r.predio,
    fechaIngreso: r.entryDate,
    fechaSalida: r.exitDate,
    nombre: r.employeeName,
    horas: r.totalHours,
    observaciones: r.observations || ''
  };
});

const tsContent = `/**
 * Datos reales extraídos directamente del documento oficial:
 * REPORTE ASISTENCIA GRANT.pdf (Semanas 23 a 42)
 * Empleados: ENRIQUE GRANT y LUIS E. GRANT
 */
import { VehicleRecord } from '../types/vehicle';

export const INITIAL_VEHICLE_RECORDS: VehicleRecord[] = ${JSON.stringify(mapped, null, 2)};
`;

fs.writeFileSync('src/data/initialData.ts', tsContent, 'utf8');
console.log(`Generated src/data/initialData.ts with ${mapped.length} official records.`);
