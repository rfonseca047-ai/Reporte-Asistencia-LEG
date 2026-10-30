import React from 'react';
import { VehicleRecord, DriverName } from '../types/vehicle';
import { formatDecimalHours } from '../utils/dateUtils';
import { Clock, AlertTriangle, User, Calendar, CheckCircle2 } from 'lucide-react';

interface StatsCardsProps {
  records: VehicleRecord[];
  selectedWeek: number | 'all';
  selectedDriver: DriverName | 'all';
  onFilterPending: () => void;
  statusFilter: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  records,
  selectedWeek,
  selectedDriver,
  onFilterPending,
  statusFilter,
}) => {
  // Filter for metrics calculations
  const filteredRecords = records.filter((r) => {
    if (selectedWeek !== 'all' && r.semana !== selectedWeek) return false;
    if (selectedDriver !== 'all' && r.nombre !== selectedDriver) return false;
    return true;
  });

  const enriqueHours = filteredRecords
    .filter((r) => r.nombre === 'ENRIQUE GRANT')
    .reduce((acc, r) => acc + (r.horas || 0), 0);

  const luisHours = filteredRecords
    .filter((r) => r.nombre === 'LUIS E. GRANT')
    .reduce((acc, r) => acc + (r.horas || 0), 0);

  const totalHours = enriqueHours + luisHours;

  const pendingRecords = records.filter(
    (r) => r.observaciones && r.observaciones.toLowerCase().includes('pendiente')
  );

  const tripsWithHours = filteredRecords.filter((r) => (r.horas || 0) > 0).length;
  const noDataRows = filteredRecords.filter((r) => r.observaciones === 'NO HAY DATOS').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Enrique Grant Card */}
      <div className="bg-white rounded-xl border border-sky-200 p-4 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-sky-50 rounded-bl-full pointer-events-none -mr-4 -mt-4 opacity-70" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-xs" />
            <span className="text-xs font-bold uppercase tracking-wider text-sky-800">
              Enrique Grant
            </span>
          </div>
          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-sky-100 text-sky-700">
            Empleado
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-black tracking-tight text-slate-800">
            {formatDecimalHours(enriqueHours)}
          </span>
          <span className="text-xs font-semibold text-slate-500">Horas laboradas</span>
        </div>
        <div className="mt-2 text-xs text-slate-600 flex items-center justify-between">
          <span>{filteredRecords.filter((r) => r.nombre === 'ENRIQUE GRANT' && r.horas > 0).length} registros</span>
          <span className="text-sky-700 font-medium">
            {selectedWeek === 'all' ? 'Histórico' : `Semana ${selectedWeek}`}
          </span>
        </div>
      </div>

      {/* Luis E. Grant Card */}
      <div className="bg-white rounded-xl border border-purple-200 p-4 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full pointer-events-none -mr-4 -mt-4 opacity-70" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shadow-xs" />
            <span className="text-xs font-bold uppercase tracking-wider text-purple-800">
              Luis E. Grant
            </span>
          </div>
          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-700">
            Empleado
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-black tracking-tight text-slate-800">
            {formatDecimalHours(luisHours)}
          </span>
          <span className="text-xs font-semibold text-slate-500">Horas laboradas</span>
        </div>
        <div className="mt-2 text-xs text-slate-600 flex items-center justify-between">
          <span>{filteredRecords.filter((r) => r.nombre === 'LUIS E. GRANT' && r.horas > 0).length} turnos</span>
          <span className="text-purple-700 font-medium">
            {selectedWeek === 'all' ? 'Histórico' : `Semana ${selectedWeek}`}
          </span>
        </div>
      </div>

      {/* Total Hours Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Total General
          </span>
          <Clock className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-black tracking-tight text-emerald-700">
            {formatDecimalHours(totalHours)}
          </span>
          <span className="text-xs font-semibold text-slate-500">Horas registradas</span>
        </div>
        <div className="mt-2 text-xs text-slate-600 flex items-center justify-between">
          <span>{tripsWithHours} turnos efectivos</span>
          <span className="text-slate-500">{noDataRows} filas sin datos</span>
        </div>
      </div>

      {/* Pending Verification Card */}
      <div
        onClick={onFilterPending}
        className={`rounded-xl border p-4 shadow-xs cursor-pointer transition-all ${
          pendingRecords.length > 0
            ? statusFilter === 'pendiente'
              ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-400'
              : 'bg-amber-50/80 border-amber-300 hover:bg-amber-100/70'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
            Por Verificar
          </span>
          {pendingRecords.length > 0 ? (
            <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          )}
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span
            className={`text-2xl font-black tracking-tight ${
              pendingRecords.length > 0 ? 'text-amber-800' : 'text-slate-800'
            }`}
          >
            {pendingRecords.length}
          </span>
          <span className="text-xs font-semibold text-slate-500">
            {pendingRecords.length === 1 ? 'registro incompleto' : 'registros incompletos'}
          </span>
        </div>
        <div className="mt-2 text-xs font-medium text-amber-800 flex items-center justify-between">
          {pendingRecords.length > 0 ? (
            <span>
              {statusFilter === 'pendiente' ? 'Mostrando pendientes ⤬' : 'Click para filtrar pendientes →'}
            </span>
          ) : (
            <span className="text-emerald-700">Todos los ingresos cerrados</span>
          )}
        </div>
      </div>
    </div>
  );
};
