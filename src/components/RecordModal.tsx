import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Calendar,
  Calculator,
  Building2,
  User,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { VehicleRecord, DriverName } from '../types/vehicle';
import {
  calculateHoursDifference,
  parseExcelDateTime,
  formatDecimalHours,
  getWeekNumber,
  getSpanishDay,
} from '../utils/dateUtils';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: VehicleRecord, keepOpenForNext?: boolean) => void;
  initialRecord: VehicleRecord | null;
  mode: 'add' | 'edit' | 'resolve';
}

function parseExcelDateTimeToParts(str: string): {
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:MM
} {
  if (!str || !str.includes('/')) {
    return { dateStr: '2026-10-29', timeStr: '09:00' };
  }
  const parts = str.trim().split(' ');
  const datePart = parts[0];
  const timePart = parts[1] || '09:00';

  const [d, m, y] = datePart.split('/').map(Number);
  const year = isNaN(y) ? 2026 : y;
  const month = isNaN(m) ? 10 : m;
  const day = isNaN(d) ? 29 : d;

  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const cleanTime = timePart.includes('--') || !timePart.includes(':') ? '09:00' : timePart.substring(0, 5);

  return { dateStr, timeStr: cleanTime };
}

export const RecordModal: React.FC<RecordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRecord,
  mode,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-29');
  const [entryTime, setEntryTime] = useState<string>('09:00');
  const [exitTime, setExitTime] = useState<string>('12:00');
  const [predio, setPredio] = useState<string>('Predio 3');
  const [nombre, setNombre] = useState<DriverName>('ENRIQUE GRANT');
  const [horas, setHoras] = useState<number>(3.0);
  const [observaciones, setObservaciones] = useState<string>('');
  const [isZeroHours, setIsZeroHours] = useState<boolean>(false);

  useEffect(() => {
    if (initialRecord) {
      const inParts = parseExcelDateTimeToParts(initialRecord.fechaIngreso);
      const outParts = parseExcelDateTimeToParts(initialRecord.fechaSalida);

      setSelectedDate(inParts.dateStr);
      setEntryTime(inParts.timeStr);
      setExitTime(outParts.timeStr);
      setPredio(initialRecord.predio || 'Predio 3');
      setNombre(initialRecord.nombre);
      setHoras(initialRecord.horas);
      setObservaciones(initialRecord.observaciones || '');

      const isZero = initialRecord.horas === 0 && (inParts.timeStr === '00:00' || initialRecord.observaciones?.includes('NO HAY DATOS'));
      setIsZeroHours(Boolean(isZero));
    } else {
      // Default for new record
      setSelectedDate('2026-10-29');
      setEntryTime('09:00');
      setExitTime('12:00');
      setPredio('Predio 3');
      setNombre('ENRIQUE GRANT');
      setHoras(3.0);
      setObservaciones('');
      setIsZeroHours(false);
    }
  }, [initialRecord, isOpen]);

  if (!isOpen) return null;

  // Calculate day and week based on selectedDate
  let calculatedWeek = 44;
  let calculatedDay = 'jueves';
  let formattedDateDisplay = '29/10/2026';

  try {
    if (selectedDate) {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d, 0, 0, 0);
      calculatedWeek = getWeekNumber(dateObj);
      calculatedDay = getSpanishDay(dateObj);
      formattedDateDisplay = `${d}/${m}/${y}`;
    }
  } catch (e) {
    console.error(e);
  }

  // Recalculate hours automatically whenever times or date change
  const computeHours = (inTime: string, outTime: string, zeroMode: boolean) => {
    if (zeroMode) {
      setHoras(0);
      return;
    }
    if (!inTime || !outTime) return;

    try {
      const [inH, inM] = inTime.split(':').map(Number);
      const [outH, outM] = outTime.split(':').map(Number);

      let diffMinutes = outH * 60 + outM - (inH * 60 + inM);
      if (diffMinutes < 0) {
        // Shift crosses midnight
        diffMinutes += 24 * 60;
      }
      const calculatedHours = Math.round((diffMinutes / 60) * 100) / 100;
      setHoras(calculatedHours);
    } catch {
      // Ignore parse error
    }
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
  };

  const handleEntryTimeChange = (newTime: string) => {
    setEntryTime(newTime);
    computeHours(newTime, exitTime, isZeroHours);
  };

  const handleExitTimeChange = (newTime: string) => {
    setExitTime(newTime);
    computeHours(entryTime, newTime, isZeroHours);
  };

  const handleToggleZeroHours = () => {
    const nextVal = !isZeroHours;
    setIsZeroHours(nextVal);
    if (nextVal) {
      setEntryTime('00:00');
      setExitTime('00:00');
      setHoras(0);
      if (!observaciones) setObservaciones('NO HAY DATOS');
    } else {
      setEntryTime('09:00');
      setExitTime('12:00');
      computeHours('09:00', '12:00', false);
      if (observaciones === 'NO HAY DATOS') setObservaciones('');
    }
  };

  const buildSavedRecord = (): VehicleRecord => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const inDateTimeStr = `${d}/${m}/${y} ${entryTime}`;
    const outDateTimeStr = `${d}/${m}/${y} ${exitTime}`;

    return {
      id: initialRecord?.id || `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      semana: calculatedWeek,
      dia: calculatedDay,
      predio,
      fechaIngreso: inDateTimeStr,
      fechaSalida: outDateTimeStr,
      nombre,
      horas: Number(horas) || 0,
      observaciones: observaciones.trim(),
      sourceImage: initialRecord?.sourceImage,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const record = buildSavedRecord();
    onSave(record, false);
    onClose();
  };

  const handleSaveAndAddAnother = (e: React.MouseEvent) => {
    e.preventDefault();
    const record = buildSavedRecord();
    onSave(record, true);

    // Keep modal open, keep same date and employee, ready for next shift/predio!
    // Shift the times forward for the next movement (e.g. afternoon)
    setEntryTime('13:30');
    setExitTime('17:00');
    computeHours('13:30', '17:00', false);
    setIsZeroHours(false);
    // Cycle predio to next option if desired (e.g. Predio 1 -> Predio 2)
    if (predio === 'Predio 1') setPredio('Predio 2');
    else if (predio === 'Predio 2') setPredio('Predio 3');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-900/30 text-white">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {mode === 'add'
                  ? 'Nuevo Registro de Asistencia'
                  : mode === 'resolve'
                  ? 'Resolver Registro Pendiente'
                  : 'Editar Registro'}
              </h3>
              <p className="text-xs text-slate-300">
                Permite múltiples líneas/entradas por día a diferentes predios
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Notification: Multiple lines per day */}
          <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
            <span>
              <strong>Múltiples líneas por día:</strong> Puedes registrar 2 o 3 entradas en el mismo día para el mismo empleado si visita diferentes predios.
            </span>
          </div>

          {/* Empleado Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              Empleado
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setNombre('ENRIQUE GRANT')}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  nombre === 'ENRIQUE GRANT'
                    ? 'border-sky-500 bg-sky-50/80 text-sky-900 ring-2 ring-sky-300 font-bold shadow-xs'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-sky-500 shadow-xs shrink-0" />
                <div>
                  <div className="text-xs font-bold">ENRIQUE GRANT</div>
                  <div className="text-[10px] text-slate-500">Empleado</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setNombre('LUIS E. GRANT')}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  nombre === 'LUIS E. GRANT'
                    ? 'border-purple-500 bg-purple-50/80 text-purple-900 ring-2 ring-purple-300 font-bold shadow-xs'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-purple-600 shadow-xs shrink-0" />
                <div>
                  <div className="text-xs font-bold">LUIS E. GRANT</div>
                  <div className="text-[10px] text-slate-500">Empleado</div>
                </div>
              </button>
            </div>
          </div>

          {/* Predio Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              Predio de esta entrada
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Predio 1', 'Predio 2', 'Predio 3'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPredio(p)}
                  className={`py-2 px-2.5 rounded-xl border text-center font-bold transition-all ${
                    predio === p
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-300 shadow-xs'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs">{p}</div>
                  <div className="text-[10px] font-normal text-slate-500">
                    {p === 'Predio 1' ? 'T.G #1' : p === 'Predio 2' ? 'T.G #2' : 'T.G #3'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* CALENDARIO: Fecha del Movimiento */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Escoger Fecha en el Calendario
              </label>
              <div className="flex items-center gap-2 text-[11px] text-slate-600">
                <span className="capitalize font-bold text-slate-800">{calculatedDay}</span>
                <span>•</span>
                <span className="font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                  Semana {calculatedWeek}
                </span>
              </div>
            </div>

            <input
              type="date"
              required
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs cursor-pointer"
            />
          </div>

          {/* HORAS: Hora de Ingreso y Hora de Salida con selector de hora */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block font-bold text-slate-700 mb-1 text-[11px] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
                Hora de Ingreso
              </label>
              <input
                type="time"
                required
                disabled={isZeroHours}
                value={entryTime}
                onChange={(e) => handleEntryTimeChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-200 disabled:text-slate-500 shadow-xs cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                {formattedDateDisplay} {entryTime}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block font-bold text-slate-700 mb-1 text-[11px] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                Hora de Salida
              </label>
              <input
                type="time"
                required
                disabled={isZeroHours}
                value={exitTime}
                onChange={(e) => handleExitTimeChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-200 disabled:text-slate-500 shadow-xs cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                {formattedDateDisplay} {exitTime}
              </span>
            </div>
          </div>

          {/* Quick Toggle: 00:00 Ausente / Sin Movimiento */}
          <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isZeroHours}
                onChange={handleToggleZeroHours}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 border-slate-300 cursor-pointer"
              />
              <span className="font-semibold text-slate-700 text-xs">
                Marcar como Ausente / Sin movimiento (00:00 - 00:00 y 0,00 hrs)
              </span>
            </label>
            <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <Calculator className="w-3.5 h-3.5 text-emerald-600" />
              <span>{formatDecimalHours(horas)} hrs</span>
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">
              Observaciones (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: PREDIO 2, LIBRE, FERIADO, etc."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-slate-200">
            {mode === 'add' ? (
              <button
                type="button"
                onClick={handleSaveAndAddAnother}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 shadow-xs transition-colors"
                title="Guarda esta entrada y deja la ventana abierta con la misma fecha para registrar la siguiente entrada/predio del día"
              >
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                <span>Guardar y Agregar Otra Línea al Mismo Día</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-md transition-all"
              >
                Guardar Registro
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
