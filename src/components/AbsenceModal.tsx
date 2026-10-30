import React, { useState } from 'react';
import {
  X,
  UserX,
  Calendar,
  Clock,
  Building2,
  CheckCircle2,
  AlertCircle,
  Users,
  User,
} from 'lucide-react';
import { VehicleRecord, DriverName } from '../types/vehicle';
import { getWeekNumber, getSpanishDay } from '../utils/dateUtils';

interface AbsenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMarkAbsence: (recordsToUpdate: {
    employees: DriverName[];
    dateStr: string; // YYYY-MM-DD
    predio: string;
    observacion: string;
  }) => void;
  initialDate?: string;
}

export const AbsenceModal: React.FC<AbsenceModalProps> = ({
  isOpen,
  onClose,
  onMarkAbsence,
  initialDate = '2026-10-29',
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [targetEmployees, setTargetEmployees] = useState<'luis' | 'enrique' | 'both'>('luis');
  const [predio, setPredio] = useState<string>('Predio 3');
  const [observacion, setObservacion] = useState<string>('NO HAY DATOS');
  const [customObservacion, setCustomObservacion] = useState<string>('');

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

  const effectiveReason = observacion === 'OTRO' ? customObservacion.trim() || 'AUSENTE' : observacion;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let emps: DriverName[] = [];
    if (targetEmployees === 'luis') {
      emps = ['LUIS E. GRANT'];
    } else if (targetEmployees === 'enrique') {
      emps = ['ENRIQUE GRANT'];
    } else {
      emps = ['ENRIQUE GRANT', 'LUIS E. GRANT'];
    }

    onMarkAbsence({
      employees: emps,
      dateStr: selectedDate,
      predio,
      observacion: effectiveReason,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-900/30 text-white">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Registrar Ausencia (Marcar 00)
              </h2>
              <p className="text-xs text-slate-300">
                Registra 00:00 - 00:00 y 0,00 horas laboradas para el día indicado
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              Fecha del Día a Registrar
            </label>
            <input
              type="date"
              required
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all shadow-xs"
            />
            <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="capitalize font-bold text-slate-700">{calculatedDay}</span>
              <span>•</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Semana {calculatedWeek}
              </span>
              <span>•</span>
              <span>{formattedDateDisplay}</span>
            </div>
          </div>

          {/* Employee Selection: Who was absent? */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-600" />
              ¿Quién no asistió / estuvo ausente?
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {/* Option 1: Solo Luis */}
              <label
                onClick={() => setTargetEmployees('luis')}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  targetEmployees === 'luis'
                    ? 'border-purple-600 bg-purple-50/70 shadow-xs ring-1 ring-purple-600'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      targetEmployees === 'luis'
                        ? 'border-purple-600 bg-purple-600 text-white'
                        : 'border-slate-400 bg-white'
                    }`}
                  >
                    {targetEmployees === 'luis' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Solo Luis E. Grant
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Enrique sí asistió; registrar 00 solo para Luis E. Grant
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                  Luis E. Grant
                </span>
              </label>

              {/* Option 2: Solo Enrique */}
              <label
                onClick={() => setTargetEmployees('enrique')}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  targetEmployees === 'enrique'
                    ? 'border-sky-600 bg-sky-50/70 shadow-xs ring-1 ring-sky-600'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      targetEmployees === 'enrique'
                        ? 'border-sky-600 bg-sky-600 text-white'
                        : 'border-slate-400 bg-white'
                    }`}
                  >
                    {targetEmployees === 'enrique' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Solo Enrique Grant
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Luis sí asistió; registrar 00 solo para Enrique Grant
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-sky-100 text-sky-800 border border-sky-200 shrink-0">
                  Enrique Grant
                </span>
              </label>

              {/* Option 3: Ambos */}
              <label
                onClick={() => setTargetEmployees('both')}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  targetEmployees === 'both'
                    ? 'border-amber-600 bg-amber-50/70 shadow-xs ring-1 ring-amber-600'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      targetEmployees === 'both'
                        ? 'border-amber-600 bg-amber-600 text-white'
                        : 'border-slate-400 bg-white'
                    }`}
                  >
                    {targetEmployees === 'both' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Ambos Empleados (Ninguno asistió)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Registrar 00 tanto para Enrique Grant como para Luis E. Grant
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                  Ambos (2)
                </span>
              </label>
            </div>
          </div>

          {/* Predio & Motivo / Observaciones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Predio */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                Predio
              </label>
              <select
                value={predio}
                onChange={(e) => setPredio(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Predio 3">Predio 3 (T.G #3 Millenium)</option>
                <option value="Predio 2">Predio 2 (T.G #2 Millenium)</option>
                <option value="Predio 1">Predio 1 (T.G #1 Millenium)</option>
              </select>
            </div>

            {/* Motivo / Observación */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Observación
              </label>
              <select
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="NO HAY DATOS">NO HAY DATOS (Oficial Excel)</option>
                <option value="AUSENTE">AUSENTE</option>
                <option value="LIBRE">LIBRE</option>
                <option value="FERIADO">FERIADO</option>
                <option value="PERMISO">PERMISO</option>
                <option value="OTRO">Personalizada...</option>
              </select>
            </div>
          </div>

          {observacion === 'OTRO' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Escribe la observación personalizada:
              </label>
              <input
                type="text"
                placeholder="Ej. Incapacidad, permiso personal, etc."
                value={customObservacion}
                onChange={(e) => setCustomObservacion(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          )}

          {/* Preview Box */}
          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs space-y-1 text-slate-700">
            <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
              <CheckCircle2 className="w-4 h-4 text-amber-600" />
              <span>Resultado que se registrará en el Excel:</span>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[11px] bg-white p-2 rounded-lg border border-amber-200/60">
              <div><span className="text-slate-500 font-sans">Semana:</span> <span className="font-bold text-slate-800">{calculatedWeek}</span></div>
              <div><span className="text-slate-500 font-sans">Día:</span> <span className="capitalize font-bold text-slate-800">{calculatedDay}</span></div>
              <div><span className="text-slate-500 font-sans">Ingreso:</span> <span className="font-bold text-slate-800">{formattedDateDisplay} 00:00</span></div>
              <div><span className="text-slate-500 font-sans">Salida:</span> <span className="font-bold text-slate-800">{formattedDateDisplay} 00:00</span></div>
              <div><span className="text-slate-500 font-sans">Horas:</span> <span className="font-bold text-amber-700 bg-amber-100 px-1 py-0.5 rounded">0,00</span></div>
              <div><span className="text-slate-500 font-sans">Observaciones:</span> <span className="font-bold text-slate-800">{effectiveReason}</span></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-md shadow-amber-900/20 transition-all flex items-center gap-1.5"
            >
              <UserX className="w-4 h-4" />
              <span>Guardar y Marcar 00</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
