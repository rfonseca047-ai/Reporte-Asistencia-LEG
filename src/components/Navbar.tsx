import {
  FileSpreadsheet,
  Upload,
  Copy,
  Check,
  Link,
  UserCheck,
  UserX,
} from 'lucide-react';

interface NavbarProps {
  onOpenUpload: () => void;
  onOpenAbsence: () => void;
  onExportXLSX: () => void;
  onCopyShareLink: () => void;
  onCopyGoogleSheets: () => void;
  copied: boolean;
  linkCopied: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenUpload,
  onOpenAbsence,
  onExportXLSX,
  onCopyShareLink,
  onCopyGoogleSheets,
  copied,
  linkCopied,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* EN EL ENCABEZADO SOLO EL TITULO */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-900/40 shrink-0">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-base sm:text-xl font-black tracking-wider text-white uppercase select-none">
              CONTROL DE ASISTENCIA GRANT´S
            </h1>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Compartir Enlace Web */}
            <button
              onClick={onCopyShareLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              title="Copiar enlace de la aplicación web para compartir"
            >
              {linkCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">¡Enlace Copiado!</span>
                </>
              ) : (
                <>
                  <Link className="w-4 h-4 text-sky-400" />
                  <span className="hidden lg:inline">Compartir Enlace</span>
                </>
              )}
            </button>

            {/* Export XLSX */}
            <button
              onClick={onExportXLSX}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              title="Descargar archivo Excel .xlsx"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            {/* Copy for Google Sheets */}
            <button
              onClick={onCopyGoogleSheets}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              title="Copiar celdas tabuladas para Google Sheets"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-indigo-400" />
                  <span className="hidden xl:inline">Google Sheets</span>
                </>
              )}
            </button>

            {/* Botón Marcar Ausente (00) */}
            <button
              onClick={onOpenAbsence}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-amber-200 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-600/60 shadow-xs transition-colors"
              title="Marcar fecha como ausente para Enrique, Luis o ambos (00:00 - 00:00 y 0,00 hrs)"
            >
              <UserX className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Marcar Ausente (00)</span>
            </button>

            {/* ÚNICO Botón de Subir Fotos */}
            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-md shadow-emerald-900/40 transition-all hover:scale-[1.02]"
            >
              <Upload className="w-4 h-4" />
              <span>Subir Fotos</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
