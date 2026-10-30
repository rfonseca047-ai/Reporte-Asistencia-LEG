import React from 'react';
import { X, ExternalLink, HelpCircle, CheckCircle2 } from 'lucide-react';

interface ReferenceViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReferenceViewer: React.FC<ReferenceViewerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Modelo de Referencia Excel / Google Sheets
              </h2>
              <p className="text-xs text-slate-400">
                Formato exacto esperado según la imagen proporcionada
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

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-sky-50 rounded-xl border border-sky-200">
              <div className="font-bold text-sky-900 flex items-center gap-1.5 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                Empleado
              </div>
              <p className="text-slate-600">
                <strong className="text-sky-950">ENRIQUE GRANT</strong> (Enrique G).
                Celdas con fondo celeste claro.
              </p>
            </div>

            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
              <div className="font-bold text-purple-900 flex items-center gap-1.5 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                Empleado
              </div>
              <p className="text-slate-600">
                <strong className="text-purple-950">LUIS E. GRANT</strong> (Luis G).
                Celdas con fondo lila/magenta claro.
              </p>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Reglas Clave
              </div>
              <p className="text-slate-600">
                • Si falta ingreso o salida: <strong className="text-amber-700">PENDIENTE DE VERIFICACIÓN</strong>.
                <br />• Días sin laborar: <strong className="text-slate-700">NO HAY DATOS</strong> (0,00 hrs).
              </p>
            </div>
          </div>

          {/* Original Screenshot Display */}
          <div className="border border-slate-300 rounded-xl overflow-hidden bg-slate-100 shadow-inner">
            <div className="px-3 py-2 bg-slate-200 border-b border-slate-300 text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Captura original del usuario (image_354ba37d.png)</span>
              <span className="text-[11px] text-slate-500 font-normal">Semanas 39 y 40</span>
            </div>
            <div className="p-2 overflow-x-auto flex justify-center bg-slate-900/5">
              <img
                src="/assets/aistudio/image_354ba37d.png"
                alt="Ejemplo original Excel"
                className="max-h-96 w-auto object-contain rounded border border-slate-300 shadow-md"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-lg text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Entendido / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
