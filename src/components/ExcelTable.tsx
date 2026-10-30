import React from 'react';
import { VehicleRecord, DriverName } from '../types/vehicle';
import { formatDecimalHours, sortAttendanceRecords } from '../utils/dateUtils';
import {
  Edit2,
  Trash2,
  AlertCircle,
  Plus,
  CalendarCheck,
  Check,
  Sparkles,
  ArrowUpDown,
  UserX,
  PlusCircle,
} from 'lucide-react';

interface ExcelTableProps {
  records: VehicleRecord[];
  onEditRecord: (record: VehicleRecord) => void;
  onDeleteRecord: (id: string) => void;
  onAddNewRecord: () => void;
  onAddDayMovement?: (record: VehicleRecord) => void;
  onOpenAbsence?: () => void;
  onQuickResolve: (record: VehicleRecord) => void;
  selectedWeek: number | 'all';
  setSelectedWeek: (week: number | 'all') => void;
  selectedDriver: DriverName | 'all';
  setSelectedDriver: (driver: DriverName | 'all') => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onFillWeeklyEmptyDays: () => void;
  availableWeeks: number[];
}

export const ExcelTable: React.FC<ExcelTableProps> = ({
  records,
  onEditRecord,
  onDeleteRecord,
  onAddNewRecord,
  onAddDayMovement,
  onOpenAbsence,
  onQuickResolve,
  selectedWeek,
  setSelectedWeek,
  selectedDriver,
  setSelectedDriver,
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
  onFillWeeklyEmptyDays,
  availableWeeks,
}) => {
  const [selectedPredio, setSelectedPredio] = React.useState<string>('all');

  // Apply filtering and strictly sort chronologically
  const filtered = sortAttendanceRecords(
    records.filter((rec) => {
      // Week filter
      if (selectedWeek !== 'all' && rec.semana !== selectedWeek) return false;

      // Driver filter
      if (selectedDriver !== 'all' && rec.nombre !== selectedDriver) return false;

      // Predio filter
      if (selectedPredio !== 'all' && (rec.predio || 'Predio 3') !== selectedPredio) return false;

      // Status filter
      if (statusFilter === 'pendiente') {
        if (!rec.observaciones.toLowerCase().includes('pendiente')) return false;
      } else if (statusFilter === 'con_datos') {
        if (rec.observaciones === 'NO HAY DATOS') return false;
      } else if (statusFilter === 'sin_datos') {
        if (rec.observaciones !== 'NO HAY DATOS') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          rec.semana.toString().includes(q) ||
          rec.dia.toLowerCase().includes(q) ||
          (rec.predio || '').toLowerCase().includes(q) ||
          rec.fechaIngreso.toLowerCase().includes(q) ||
          rec.fechaSalida.toLowerCase().includes(q) ||
          rec.nombre.toLowerCase().includes(q) ||
          rec.observaciones.toLowerCase().includes(q) ||
          formatDecimalHours(rec.horas).includes(q);
        if (!match) return false;
      }

      return true;
    })
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Table Toolbar & Filters */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Driver Tabs & Week Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Employee Selector */}
          <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-100 text-xs font-medium">
            <button
              onClick={() => setSelectedDriver('all')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                selectedDriver === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos los Empleados
            </button>
            <button
              onClick={() => setSelectedDriver('ENRIQUE GRANT')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                selectedDriver === 'ENRIQUE GRANT'
                  ? 'bg-sky-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-sky-900'
              }`}
            >
              Enrique Grant
            </button>
            <button
              onClick={() => setSelectedDriver('LUIS E. GRANT')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                selectedDriver === 'LUIS E. GRANT'
                  ? 'bg-purple-700 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-purple-900'
              }`}
            >
              Luis E. Grant
            </button>
          </div>

          {/* Week Selector - De mayor a menor empezando por semana 44 */}
          <div className="flex items-center gap-1.5 text-xs">
            <label className="font-semibold text-slate-700">Semana:</label>
            <select
              value={selectedWeek}
              onChange={(e) =>
                setSelectedWeek(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))
              }
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
            >
              <option value="all">Todas las semanas (44 a 23)</option>
              {availableWeeks.map((wk) => (
                <option key={wk} value={wk}>
                  Semana {wk} {wk === 44 ? '⭐ (Semana Actual)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Todos los estados</option>
            <option value="pendiente">⚠️ Solo Pendientes de Verificación</option>
            <option value="con_datos">Con Horas Trabajadas</option>
            <option value="sin_datos">Sin Datos ("NO HAY DATOS")</option>
          </select>

          {/* Predio Filter */}
          <select
            value={selectedPredio}
            onChange={(e) => setSelectedPredio(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Todos los predios</option>
            <option value="Predio 1">Predio 1 (T.G #1)</option>
            <option value="Predio 2">Predio 2 (T.G #2)</option>
            <option value="Predio 3">Predio 3 (T.G #3)</option>
          </select>
        </div>

        {/* Right: Search & Action Buttons */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Buscar por fecha, predio, nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-44 sm:w-56"
          />

          {/* Fill standard week with NO HAY DATOS */}
          <button
            onClick={onFillWeeklyEmptyDays}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 shadow-xs transition-colors"
            title="Completa los 7 días de la semana con 'NO HAY DATOS' para los días sin movimiento como en la plantilla"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden xl:inline">Rellenar plantilla semanal</span>
          </button>

          {/* Button Marcar Ausente (00) */}
          {onOpenAbsence && (
            <button
              onClick={onOpenAbsence}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 shadow-xs transition-colors"
              title="Marcar fecha como ausente para Enrique, Luis o ambos con 0,00 horas"
            >
              <UserX className="w-3.5 h-3.5 text-amber-700" />
              <span>Marcar Ausente (00)</span>
            </button>
          )}

          {/* Add Manual Row */}
          <button
            onClick={onAddNewRecord}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-white bg-slate-800 hover:bg-slate-700 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Registro</span>
          </button>
        </div>
      </div>

      {/* Excel Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse border border-slate-300 text-xs">
          {/* Header matching exact Dark Teal Excel style (#0D473D / #064e3b) */}
          <thead>
            <tr className="bg-[#0D473D] text-white select-none">
              <th className="py-2.5 px-3 border border-emerald-900 font-bold uppercase tracking-wider text-center w-20">
                SEMANA
              </th>
              <th className="py-2.5 px-3 border border-emerald-900 font-bold uppercase tracking-wider w-24">
                DIA
              </th>
              <th className="py-2.5 px-3 border border-emerald-900 font-bold uppercase tracking-wider text-center w-24">
                PREDIO
              </th>
              <th className="py-2.5 px-3 border border-emerald-900 font-bold uppercase tracking-wider min-w-[140px]">
                INGRESO
              </th>
              <th className="py-2.5 px-3 border border-emerald-900 font-bold uppercase tracking-wider min-w-[140px]">
                SALIDA
              </th>
              <th className="py-2.5 px-3 border border-emerald-900 font-bold uppercase tracking-wider min-w-[150px]">
                NOMBRE
              </th>
              <th className="py-2.5 px-3 border border-emerald-900 font-bold uppercase tracking-wider text-right w-24">
                HORAS
              </th>
              <th className="py-2.5 px-3 border border-emerald-900 font-bold uppercase tracking-wider min-w-[200px]">
                OBSERVACIONES
              </th>
              <th className="py-2.5 px-3 border border-emerald-900 font-bold uppercase tracking-wider text-center w-20">
                ACCIONES
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 bg-white">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="w-8 h-8 text-slate-300" />
                    <p className="font-medium text-slate-600">No se encontraron registros con los filtros seleccionados.</p>
                    <button
                      onClick={() => {
                        setSelectedWeek('all');
                        setSelectedDriver('all');
                        setSelectedPredio('all');
                        setStatusFilter('all');
                        setSearchQuery('');
                      }}
                      className="text-xs text-emerald-700 underline font-semibold mt-1"
                    >
                      Restablecer todos los filtros
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((record) => {
                const isPending = record.observaciones.toLowerCase().includes('pendiente');
                const isNoData = record.observaciones === 'NO HAY DATOS';
                // Highlight yellow for active rows in week 40 (or selected week)
                const isYellowHighlight = record.semana === 40 && !isNoData && !isPending;
                const predioVal = record.predio || 'Predio 3';

                return (
                  <tr
                    key={record.id}
                    className={`transition-colors hover:bg-slate-100/80 ${
                      isPending
                        ? 'bg-amber-50/70'
                        : isYellowHighlight
                        ? 'bg-[#fef9c3]' // soft yellow from user screenshot
                        : 'bg-white'
                    }`}
                  >
                    {/* SEMANA (pink cell like Excel) */}
                    <td className="py-2 px-3 border border-slate-300 text-center font-bold text-slate-800 bg-[#fce7f3]">
                      {record.semana}
                    </td>

                    {/* DIA */}
                    <td className="py-2 px-3 border border-slate-300 capitalize font-medium text-slate-700">
                      {record.dia}
                    </td>

                    {/* PREDIO */}
                    <td className="py-2 px-3 border border-slate-300 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          predioVal === 'Predio 1'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : predioVal === 'Predio 2'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {predioVal}
                      </span>
                    </td>

                    {/* INGRESO */}
                    <td
                      className={`py-2 px-3 border border-slate-300 font-mono text-slate-800 ${
                        isYellowHighlight ? 'bg-[#fef08a]' : ''
                      }`}
                    >
                      {record.fechaIngreso}
                    </td>

                    {/* SALIDA */}
                    <td
                      className={`py-2 px-3 border border-slate-300 font-mono text-slate-800 ${
                        isYellowHighlight ? 'bg-[#fef08a]' : ''
                      }`}
                    >
                      {record.fechaSalida}
                    </td>

                    {/* NOMBRE (Color coded: Enrique light blue, Luis light purple) */}
                    <td
                      className={`py-2 px-3 border border-slate-300 font-semibold tracking-wide ${
                        record.nombre === 'ENRIQUE GRANT'
                          ? 'bg-[#e0f2fe] text-sky-900'
                          : record.nombre === 'LUIS E. GRANT'
                          ? 'bg-[#f3e8ff] text-purple-900'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>{record.nombre}</span>
                    </td>

                    {/* HORAS */}
                    <td className="py-2 px-3 border border-slate-300 text-right font-mono font-bold text-slate-900">
                      {formatDecimalHours(record.horas)}
                    </td>

                    {/* OBSERVACIONES */}
                    <td className="py-2 px-3 border border-slate-300 text-slate-800">
                      {isPending ? (
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-200 text-amber-900 border border-amber-300">
                            <AlertCircle className="w-3 h-3 text-amber-700" />
                            PENDIENTE DE VERIFICACIÓN
                          </span>
                          <button
                            onClick={() => onQuickResolve(record)}
                            className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                            title="Ingresar la hora faltante para calcular horas trabajadas"
                          >
                            Resolver
                          </button>
                        </div>
                      ) : isNoData ? (
                        <span className="text-slate-500 font-medium tracking-wide">
                          NO HAY DATOS
                        </span>
                      ) : (
                        <span className="text-slate-700">{record.observaciones}</span>
                      )}
                    </td>

                    {/* ACCIONES */}
                    <td className="py-2 px-2 border border-slate-300 text-center">
                      <div className="inline-flex items-center gap-1">
                        {onAddDayMovement && (
                          <button
                            onClick={() => onAddDayMovement(record)}
                            className="p-1 text-emerald-700 hover:text-emerald-950 hover:bg-emerald-100 rounded transition-colors"
                            title="Añadir otra línea / entrada a este mismo día para este empleado (ej. visita a otro predio)"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onEditRecord(record)}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"
                          title="Editar fila"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteRecord(record.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Eliminar fila"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Summary Count */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600">
        <div>
          Mostrando <span className="font-bold text-slate-800">{filtered.length}</span> de{' '}
          <span className="font-bold text-slate-800">{records.length}</span> registros totales
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#fce7f3] border border-slate-300 inline-block rounded-xs" />
            <span>Columna Semana</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#fef08a] border border-amber-300 inline-block rounded-xs" />
            <span>Horas Activas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#e0f2fe] border border-sky-300 inline-block rounded-xs" />
            <span>Enrique Grant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#f3e8ff] border border-purple-300 inline-block rounded-xs" />
            <span>Luis E. Grant</span>
          </div>
        </div>
      </div>
    </div>
  );
};
