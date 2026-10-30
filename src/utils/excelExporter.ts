import * as XLSX from 'xlsx';
import { VehicleRecord, DriverName } from '../types/vehicle';
import { formatDecimalHours, SPANISH_DAYS, getWeekNumber, formatToExcelDateTime } from './dateUtils';

/**
 * Downloads an actual .xlsx file with proper headers and data types
 */
export function exportToXLSX(records: VehicleRecord[], fileName: string = 'Control_De_Asistencia_Grants.xlsx') {
  const wb = XLSX.utils.book_new();

  // Prepare table rows
  const excelData = records.map((rec) => ({
    SEMANA: rec.semana,
    DIA: rec.dia,
    PREDIO: rec.predio || 'Predio 3',
    INGRESO: rec.fechaIngreso,
    SALIDA: rec.fechaSalida,
    NOMBRE: rec.nombre,
    HORAS: rec.horas, // Keep as number in xlsx so formulas works
    OBSERVACIONES: rec.observaciones || '',
  }));

  const ws = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  ws['!cols'] = [
    { wch: 10 }, // SEMANA
    { wch: 12 }, // DIA
    { wch: 12 }, // PREDIO
    { wch: 18 }, // INGRESO
    { wch: 18 }, // SALIDA
    { wch: 18 }, // NOMBRE
    { wch: 10 }, // HORAS
    { wch: 28 }, // OBSERVACIONES
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Reporte Semanal');

  // Also create a Summary Sheet (Resumen Empleados)
  const enriqueHours = records
    .filter((r) => r.nombre === 'ENRIQUE GRANT')
    .reduce((acc, r) => acc + (r.horas || 0), 0);
  const luisHours = records
    .filter((r) => r.nombre === 'LUIS E. GRANT')
    .reduce((acc, r) => acc + (r.horas || 0), 0);
  const pendingCount = records.filter((r) => r.observaciones.includes('PENDIENTE')).length;

  const summaryData = [
    { Concepto: 'Total Horas ENRIQUE GRANT (Empleado)', Valor: Math.round(enriqueHours * 100) / 100 },
    { Concepto: 'Total Horas LUIS E. GRANT (Empleado)', Valor: Math.round(luisHours * 100) / 100 },
    { Concepto: 'Total Horas Globales', Valor: Math.round((enriqueHours + luisHours) * 100) / 100 },
    { Concepto: 'Registros Pendientes de Verificación', Valor: pendingCount },
    { Concepto: 'Total Registros en el Archivo', Valor: records.length },
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 45 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

  XLSX.writeFile(wb, fileName);
}

/**
 * Downloads a UTF-8 with BOM CSV compatible with Latin American & Spanish Excel
 */
export function exportToCSV(records: VehicleRecord[], fileName: string = 'Control_De_Asistencia_Grants.csv') {
  const headers = ['SEMANA', 'DIA', 'PREDIO', 'INGRESO', 'SALIDA', 'NOMBRE', 'HORAS', 'OBSERVACIONES'];
  const rows = records.map((rec) => [
    rec.semana,
    `"${rec.dia}"`,
    `"${rec.predio || 'Predio 3'}"`,
    `"${rec.fechaIngreso}"`,
    `"${rec.fechaSalida}"`,
    `"${rec.nombre}"`,
    formatDecimalHours(rec.horas),
    `"${rec.observaciones || ''}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copies table data in TSV format for instant pasting into Google Sheets or Excel
 */
export async function copyForGoogleSheets(records: VehicleRecord[]): Promise<boolean> {
  const headers = ['SEMANA', 'DIA', 'PREDIO', 'INGRESO', 'SALIDA', 'NOMBRE', 'HORAS', 'OBSERVACIONES'];
  const lines = records.map((rec) =>
    [
      rec.semana,
      rec.dia,
      rec.predio || 'Predio 3',
      rec.fechaIngreso,
      rec.fechaSalida,
      rec.nombre,
      formatDecimalHours(rec.horas),
      rec.observaciones || '',
    ].join('\t')
  );

  const tsvText = [headers.join('\t'), ...lines].join('\n');
  try {
    await navigator.clipboard.writeText(tsvText);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
}

/**
 * Fills in missing days of the week (Lunes a Domingo) with "NO HAY DATOS"
 * for the selected week and driver, matching the user's Excel style.
 */
export function generateWeeklyFill(
  existingRecords: VehicleRecord[],
  weekNumber: number,
  driver: DriverName,
  year: number = 2026
): VehicleRecord[] {
  const simpleDate = new Date(year, 0, 1 + (weekNumber - 1) * 7);
  const dow = simpleDate.getDay();
  const ISOweekStart = simpleDate;
  if (dow <= 4) {
    ISOweekStart.setDate(simpleDate.getDate() - simpleDate.getDay() + 1);
  } else {
    ISOweekStart.setDate(simpleDate.getDate() + 8 - simpleDate.getDay());
  }

  const generated: VehicleRecord[] = [];

  for (let i = 0; i < 7; i++) {
    const curDate = new Date(ISOweekStart);
    curDate.setDate(ISOweekStart.getDate() + i);
    const dayName = SPANISH_DAYS[curDate.getDay()];

    const dayRecords = existingRecords.filter(
      (r) => r.semana === weekNumber && r.nombre === driver && r.dia.toLowerCase() === dayName.toLowerCase()
    );

    if (dayRecords.length > 0) {
      generated.push(...dayRecords);
    } else {
      const emptyDateStr = `${curDate.getDate()}/${curDate.getMonth() + 1}/${curDate.getFullYear()} 00:00`;
      generated.push({
        id: `empty-${weekNumber}-${driver}-${dayName}-${Math.random().toString(36).substring(2, 6)}`,
        semana: weekNumber,
        dia: dayName,
        predio: 'Predio 3',
        fechaIngreso: emptyDateStr,
        fechaSalida: emptyDateStr,
        nombre: driver,
        horas: 0,
        observaciones: 'NO HAY DATOS',
      });
    }
  }

  return generated;
}

/**
 * Downloads a standalone, beautiful HTML report that can be opened in any browser
 * or shared directly via WhatsApp / Email.
 */
export function exportToHTML(records: VehicleRecord[], fileName: string = 'Control_De_Asistencia_Grants.html') {
  const enriqueHours = records
    .filter((r) => r.nombre === 'ENRIQUE GRANT')
    .reduce((acc, r) => acc + (r.horas || 0), 0);
  const luisHours = records
    .filter((r) => r.nombre === 'LUIS E. GRANT')
    .reduce((acc, r) => acc + (r.horas || 0), 0);
  const totalHours = enriqueHours + luisHours;
  const pendingCount = records.filter((r) => r.observaciones?.includes('PENDIENTE')).length;

  const rowsHtml = records
    .map((r) => {
      const isPending = r.observaciones?.includes('PENDIENTE');
      const isNoData = r.observaciones === 'NO HAY DATOS';
      const isYellow = r.semana === 40 && !isNoData && !isPending;
      const driverBg =
        r.nombre === 'ENRIQUE GRANT' ? '#e0f2fe' : r.nombre === 'LUIS E. GRANT' ? '#f3e8ff' : '#f1f5f9';
      const driverColor =
        r.nombre === 'ENRIQUE GRANT' ? '#0369a1' : r.nombre === 'LUIS E. GRANT' ? '#7e22ce' : '#334155';

      return `
        <tr style="background-color: ${isPending ? '#fffbeb' : isYellow ? '#fef9c3' : '#ffffff'};">
          <td style="background-color: #fce7f3; text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px;">${r.semana}</td>
          <td style="text-transform: capitalize; border: 1px solid #cbd5e1; padding: 8px;">${r.dia}</td>
          <td style="font-weight: bold; border: 1px solid #cbd5e1; padding: 8px; text-align: center; color: #065f46; background-color: #ecfdf5;">${r.predio || 'Predio 3'}</td>
          <td style="font-family: monospace; border: 1px solid #cbd5e1; padding: 8px; background-color: ${isYellow ? '#fef08a' : 'transparent'};">${r.fechaIngreso}</td>
          <td style="font-family: monospace; border: 1px solid #cbd5e1; padding: 8px; background-color: ${isYellow ? '#fef08a' : 'transparent'};">${r.fechaSalida}</td>
          <td style="background-color: ${driverBg}; color: ${driverColor}; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px;">${r.nombre}</td>
          <td style="font-family: monospace; font-weight: bold; text-align: right; border: 1px solid #cbd5e1; padding: 8px;">${formatDecimalHours(r.horas)}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; ${isPending ? 'color: #92400e; font-weight: bold;' : isNoData ? 'color: #64748b;' : ''}">
            ${isPending ? '⚠️ PENDIENTE DE VERIFICACIÓN' : r.observaciones || ''}
          </td>
        </tr>
      `;
    })
    .join('');

  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CONTROL DE ASISTENCIA GRANT´S</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      margin: 0;
      padding: 24px;
    }
    .container {
      max-width: 1240px;
      margin: 0 auto;
      background: #ffffff;
      padding: 24px;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      border: 1px solid #e2e8f0;
    }
    .header {
      border-bottom: 2px solid #0D473D;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    h1 {
      margin: 0;
      color: #0D473D;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: #f1f5f9;
      padding: 16px;
      border-radius: 12px;
      border: 1px solid #cbd5e1;
    }
    .stat-label {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: bold;
      color: #64748b;
    }
    .stat-value {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-top: 12px;
    }
    th {
      background-color: #0D473D;
      color: #ffffff;
      padding: 10px 8px;
      text-align: left;
      font-weight: bold;
      border: 1px solid #064e3b;
    }
    th.text-center { text-align: center; }
    th.text-right { text-align: right; }
    .print-btn {
      background-color: #0D473D;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
      font-size: 13px;
    }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; border: none; padding: 0; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>CONTROL DE ASISTENCIA GRANT´S</h1>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
          Reporte Semanal de Ingresos, Salidas y Horas Laboradas por Predio
        </div>
      </div>
      <button class="print-btn" onclick="window.print()">Imprimir / Guardar como PDF</button>
    </div>

    <div class="stats">
      <div class="stat-card" style="border-left: 4px solid #0284c7; background: #f0f9ff;">
        <div class="stat-label" style="color: #0369a1;">Enrique Grant (Empleado)</div>
        <div class="stat-value" style="color: #0369a1;">${formatDecimalHours(enriqueHours)} hrs</div>
      </div>
      <div class="stat-card" style="border-left: 4px solid #9333ea; background: #faf5ff;">
        <div class="stat-label" style="color: #7e22ce;">Luis E. Grant (Empleado)</div>
        <div class="stat-value" style="color: #7e22ce;">${formatDecimalHours(luisHours)} hrs</div>
      </div>
      <div class="stat-card" style="border-left: 4px solid #0D473D; background: #f0fdf4;">
        <div class="stat-label" style="color: #0D473D;">Total Horas Registradas</div>
        <div class="stat-value" style="color: #0D473D;">${formatDecimalHours(totalHours)} hrs</div>
      </div>
      <div class="stat-card" style="border-left: 4px solid ${pendingCount > 0 ? '#f59e0b' : '#10b981'}; background: ${pendingCount > 0 ? '#fffbeb' : '#f8fafc'};">
        <div class="stat-label" style="color: ${pendingCount > 0 ? '#b45309' : '#10b981'};">Por Verificar</div>
        <div class="stat-value" style="color: ${pendingCount > 0 ? '#b45309' : '#10b981'};">${pendingCount}</div>
      </div>
    </div>

    <div style="overflow-x: auto;">
      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 70px;">SEMANA</th>
            <th style="width: 90px;">DIA</th>
            <th class="text-center" style="width: 95px;">PREDIO</th>
            <th style="min-width: 130px;">INGRESO</th>
            <th style="min-width: 130px;">SALIDA</th>
            <th style="min-width: 140px;">NOMBRE</th>
            <th class="text-right" style="width: 80px;">HORAS</th>
            <th style="min-width: 180px;">OBSERVACIONES</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>

    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
      CONTROL DE ASISTENCIA GRANT´S · Generado automáticamente
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
