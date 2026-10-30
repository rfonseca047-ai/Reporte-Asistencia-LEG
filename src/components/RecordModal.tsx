import React, { useState, useEffect } from 'react';
import { X, Clock, Calculator, AlertTriangle, Check, User } from 'lucide-react';
import { VehicleRecord, DriverName } from '../types/vehicle';
import {
  calculateHoursDifference,
  parseExcelDateTime,
  formatDecimalHours,
  SPANISH_DAYS,
} from '../utils/dateUtils';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: VehicleRecord) => void;
  initialRecord: VehicleRecord | null;
  mode: 'add' | 'edit' | 'resolve';
}

export const RecordModal: React.FC<RecordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRecord,
  mode,
}) => {
  const [semana, setSemana] = useState<number>(40);
  const [dia, setDia] = useState<string>('lunes');
  const [predio, setPredio] = useState<string>('Predio 3');
  const [fechaIngreso, setFechaIngreso] = useState<string>('28/9/2026 10:00');
  const [fechaSalida, setFechaSalida] = useState<string>('28/9/2026 13:00');
  const [nombre, setNombre] = useState<DriverName>('ENRIQUE GRANT');
  const [horas, setHoras] = useState<number>(3.0);
  const [observaciones, setObservaciones] = useState<string>('');

  useEffect(() => {
    if (initialRecord) {
      setSemana(initialRecord.semana);
      setDia(initialRecord.dia);
      setPredio(initialRecord.predio || 'Predio 3');
      setFechaIngreso(initialRecord.fechaIngreso);
      setFechaSalida(initialRecord.fechaSalida);
      setNombre(initialRecord.nombre);
      setHoras(initialRecord.horas);
      setObservaciones(initialRecord.observaciones);
    } else {
      // Default new record
      setSemana(40);
      setDia('lunes');
      setPredio('Predio 3');
      setFechaIngreso('28/9/2026 09:00');
      setFechaSalida('28/9/2026 13:00');
      setNombre('ENRIQUE GRANT');
      setHoras(4.0);
      setObservaciones('');
    }
  }, [initialRecord, isOpen]);

  if (!isOpen) return null;

  const handleAutoCalcHours = () => {
    const inDate = parseExcelDateTime(fechaIngreso);
    const outDate = parseExcelDateTime(fechaSalida);

    if (inDate && outDate) {
      const diff = calculateHoursDifference(inDate, outDate);
      setHoras(diff);
      if (observaciones.includes('PENDIENTE')) {
        setObservaciones('');
      }
    } else {
      if (!fechaSalida || fechaSalida.includes('--')) {
        setObservaciones('PENDIENTE DE VERIFICACIÓN');
        setHoras(0);
      }
    }
  };

  const handleSetNoData = () => {
    const datePrefix = fechaIngreso.split(' ')[0] || '28/9/2026';
    setFechaIngreso(`${datePrefix} 00:00`);
    setFechaSalida(`${datePrefix} 00:00`);
    setHoras(0);
    setObservaciones('NO HAY DATOS');
  };

  const handleSetPending = () => {
    setObservaciones('PENDIENTE DE VERIFICACIÓN');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalObs = observaciones;
    // Auto-detect pending if missing time
    if (fechaSalida.includes('--') || fechaIngreso.includes('--')) {
      finalObs = 'PENDIENTE DE VERIFICACIÓN';
    }

    const savedRecord: VehicleRecord = {
      id: initialRecord?.id || `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      semana,
      dia,
      predio,
      fechaIngreso,
      fechaSalida,
      nombre,
      horas: Number(horas) || 0,
      observaciones: finalObs,
      sourceImage: initialRecord?.sourceImage,
    };

    onSave(savedRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                {mode === 'add'
                  ? 'Nuevo Registro de Asistencia'
                  : mode === 'resolve'
                  ? 'Resolver Registro Pendiente'
                  : 'Editar Registro'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Control de Ingreso, Salida, Predio y Cálculo de Horas
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
          {/* Predio Selection */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
              Predio
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Predio 1', 'Predio 2', 'Predio 3'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPredio(p)}
                  className={`p-2 rounded-lg border text-center font-bold transition-all ${
                    predio === p
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-300'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          {/* Employee selection */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
              Empleado
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNombre('ENRIQUE GRANT')}
                className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all ${
                  nombre === 'ENRIQUE GRANT'
                    ? 'border-sky-500 bg-sky-50 text-sky-900 ring-2 ring-sky-300 font-bold'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-xs" />
                <div>
                  <div className="text-xs">ENRIQUE GRANT</div>
                  <div className="text-[10px] text-slate-500">Empleado</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setNombre('LUIS E. GRANT')}
                className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all ${
                  nombre === 'LUIS E. GRANT'
                    ? 'border-purple-500 bg-purple-50 text-purple-900 ring-2 ring-purple-300 font-bold'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shadow-xs" />
                <div>
                  <div className="text-xs">LUIS E. GRANT</div>
                  <div className="text-[10px] text-slate-500">Empleado</div>
                </div>
              </button>
            </div>
          </div>

          {/* Week & Day */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">SEMANA</label>
              <input
                type="number"
                min="1"
                max="53"
                value={semana}
                onChange={(e) => setSemana(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">DIA</label>
              <select
                value={dia}
                onChange={(e) => setDia(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-medium capitalize text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {SPANISH_DAYS.map((d) => (
                  <option key={d} value={d} className="capitalize">
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ingreso & Salida */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                INGRESO (D/M/YYYY HH:MM)
              </label>
              <input
                type="text"
                placeholder="24/9/2026 09:40"
                value={fechaIngreso}
                onChange={(e) => setFechaIngreso(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                SALIDA (D/M/YYYY HH:MM)
              </label>
              <input
                type="text"
                placeholder="24/9/2026 12:29"
                value={fechaSalida}
                onChange={(e) => setFechaSalida(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* Quick Calculate Bar */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleAutoCalcHours}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 font-semibold transition-colors"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Calcular Horas Entre Fechas</span>
            </button>
            <button
              type="button"
              onClick={handleSetNoData}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 transition-colors"
            >
              Marcar NO HAY DATOS
            </button>
          </div>

          {/* Hours & Observations */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                HORAS (Decimal)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={horas}
                  onChange={(e) => setHoras(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-3 top-2.5 text-[11px] font-mono text-slate-400">
                  ≈ {formatDecimalHours(horas)}
                </span>
              </div>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                OBSERVACIONES
              </label>
              <input
                type="text"
                placeholder="NO HAY DATOS / PENDIENTE DE VERIFICACIÓN"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Registro</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
