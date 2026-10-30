import React, { useState, useEffect, useMemo } from 'react';
import { VehicleRecord, DriverName } from './types/vehicle';
import { INITIAL_VEHICLE_RECORDS } from './data/initialData';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { ExcelTable } from './components/ExcelTable';
import { UploadModal } from './components/UploadModal';
import { RecordModal } from './components/RecordModal';
import { ReferenceViewer } from './components/ReferenceViewer';
import { AbsenceModal } from './components/AbsenceModal';
import { exportToXLSX, exportToCSV, copyForGoogleSheets, generateWeeklyFill } from './utils/excelExporter';
import { getWeekNumber, getSpanishDay } from './utils/dateUtils';
import {
  FileSpreadsheet,
  Upload,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Download,
  Info,
  Car,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export default function App() {
  // Load saved records from localStorage if present, else use INITIAL_VEHICLE_RECORDS (ordenados de mayor a menor: 44, 43, 42 a 23)
  const [records, setRecords] = useState<VehicleRecord[]>(() => {
    try {
      const saved = localStorage.getItem('control_asistencia_grants_records_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error reading localStorage', e);
    }
    return INITIAL_VEHICLE_RECORDS;
  });

  // Filters state - Por defecto inicia en la semana actual (44)
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>(44);
  const [selectedDriver, setSelectedDriver] = useState<DriverName | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAbsenceOpen, setIsAbsenceOpen] = useState(false);
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordModalMode, setRecordModalMode] = useState<'add' | 'edit' | 'resolve'>('add');
  const [editingRecord, setEditingRecord] = useState<VehicleRecord | null>(null);

  // User feedback states
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('control_asistencia_grants_records_v4', JSON.stringify(records));
    } catch (e) {
      console.error('Error writing to localStorage', e);
    }
  }, [records]);

  // Show temporary toast
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Distinct available weeks - De mayor a menor (44, 43, 42, ...)
  const availableWeeks = useMemo(() => {
    const weeksSet = new Set<number>();
    records.forEach((r) => {
      if (r.semana) weeksSet.add(r.semana);
    });
    return Array.from(weeksSet).sort((a, b) => b - a);
  }, [records]);

  // Pending count
  const pendingCount = useMemo(() => {
    return records.filter((r) => r.observaciones?.toLowerCase().includes('pendiente')).length;
  }, [records]);

  // Handlers
  const handleAddNewRecord = () => {
    setEditingRecord(null);
    setRecordModalMode('add');
    setIsRecordModalOpen(true);
  };

  const handleEditRecord = (rec: VehicleRecord) => {
    setEditingRecord(rec);
    setRecordModalMode('edit');
    setIsRecordModalOpen(true);
  };

  const handleQuickResolve = (rec: VehicleRecord) => {
    setEditingRecord(rec);
    setRecordModalMode('resolve');
    setIsRecordModalOpen(true);
  };

  const handleDeleteRecord = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este registro?')) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
      showToast('Registro eliminado', 'info');
    }
  };

  const handleSaveRecord = (savedRecord: VehicleRecord) => {
    setRecords((prev) => {
      const index = prev.findIndex((r) => r.id === savedRecord.id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = savedRecord;
        return next;
      } else {
        return [savedRecord, ...prev];
      }
    });
    showToast('Registro guardado correctamente', 'success');
  };

  const handleAddRecordsFromOCR = (newRecords: VehicleRecord[], replaceAll: boolean) => {
    if (replaceAll) {
      setRecords(newRecords);
      showToast(`Excel actualizado con ${newRecords.length} registros extraídos por IA`, 'success');
    } else {
      setRecords((prev) => [...prev, ...newRecords]);
      showToast(`Se agregaron ${newRecords.length} nuevos registros al Excel`, 'success');
    }
  };

  const handleMarkAbsence = ({
    employees,
    dateStr,
    predio,
    observacion,
  }: {
    employees: DriverName[];
    dateStr: string;
    predio: string;
    observacion: string;
  }) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d, 0, 0, 0);
    const week = getWeekNumber(dateObj);
    const dayName = getSpanishDay(dateObj);
    const dateTimeStr = `${d}/${m}/${y} 00:00`;
    const dateMatchPrefix = `${d}/${m}/${y}`;

    setRecords((prev) => {
      const updated = [...prev];

      employees.forEach((emp) => {
        // Look for existing record for this employee on this exact date
        const existingIndex = updated.findIndex((r) => {
          if (r.nombre !== emp) return false;
          const entryDateOnly = r.fechaIngreso.split(' ')[0];
          return entryDateOnly === dateMatchPrefix;
        });

        if (existingIndex >= 0) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            fechaIngreso: dateTimeStr,
            fechaSalida: dateTimeStr,
            horas: 0,
            predio,
            observaciones: observacion,
          };
        } else {
          const newRecord: VehicleRecord = {
            id: `rec-abs-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            semana: week,
            dia: dayName,
            predio,
            fechaIngreso: dateTimeStr,
            fechaSalida: dateTimeStr,
            nombre: emp,
            horas: 0,
            observaciones: observacion,
          };
          updated.unshift(newRecord);
        }
      });

      return updated;
    });

    setSelectedWeek(week);
    const names = employees.length === 2 ? 'Enrique Grant y Luis E. Grant' : employees[0];
    showToast(`Ausencia registrada para ${names} el ${d}/${m}/${y} (00:00 - 0,00 hrs)`, 'success');
  };

  const handleExportXLSX = () => {
    exportToXLSX(records);
    showToast('Archivo Excel (.xlsx) descargado', 'success');
  };

  const handleExportCSV = () => {
    exportToCSV(records);
    showToast('Archivo CSV descargado', 'success');
  };

  const [linkCopied, setLinkCopied] = useState(false);
  const handleCopyShareLink = async () => {
    try {
      const shareUrl = window.location.href;
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      showToast('Enlace de la aplicación copiado. ¡Listo para compartir por WhatsApp!', 'success');
      setTimeout(() => setLinkCopied(false), 3000);
    } catch {
      showToast('No se pudo copiar el enlace', 'error');
    }
  };

  const handleCopyGoogleSheets = async () => {
    const ok = await copyForGoogleSheets(records);
    if (ok) {
      setCopied(true);
      showToast('Copiado al portapapeles. Pega directamente en Google Sheets con Ctrl+V', 'success');
      setTimeout(() => setCopied(false), 3000);
    } else {
      showToast('No se pudo copiar al portapapeles', 'error');
    }
  };

  const handleResetToSample = () => {
    if (window.confirm('¿Deseas restaurar la base de datos con los registros ordenados desde la semana actual 44, 43, 42 a la 23?')) {
      setRecords(INITIAL_VEHICLE_RECORDS);
      setSelectedWeek(44);
      setSelectedDriver('all');
      setStatusFilter('all');
      showToast('Datos restaurados (Semanas 44 a 23 de mayor a menor)', 'info');
    }
  };

  const handleFillWeeklyEmptyDays = () => {
    const targetWeek = selectedWeek === 'all' ? 44 : selectedWeek;
    const targetDriver = selectedDriver === 'all' ? 'ENRIQUE GRANT' : selectedDriver;

    const filled = generateWeeklyFill(records, targetWeek, targetDriver);

    // Merge into records avoiding duplicates
    setRecords((prev) => {
      const otherRecords = prev.filter(
        (r) => !(r.semana === targetWeek && r.nombre === targetDriver)
      );
      return [...otherRecords, ...filled].sort((a, b) => a.semana - b.semana);
    });

    showToast(`Plantilla completada para Semana ${targetWeek} (${targetDriver})`, 'success');
  };

  const handleFilterPending = () => {
    if (statusFilter === 'pendiente') {
      setStatusFilter('all');
    } else {
      setStatusFilter('pendiente');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl border text-xs font-bold flex items-center gap-2 text-white ${
              toast.type === 'success'
                ? 'bg-emerald-700 border-emerald-600'
                : toast.type === 'error'
                ? 'bg-rose-700 border-rose-600'
                : 'bg-slate-800 border-slate-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            ) : (
              <Info className="w-4 h-4 text-slate-300" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Navigation Header - EN EL ENCABEZADO SOLO EL TITULO */}
      <Navbar
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenAbsence={() => setIsAbsenceOpen(true)}
        onExportXLSX={handleExportXLSX}
        onCopyShareLink={handleCopyShareLink}
        onCopyGoogleSheets={handleCopyGoogleSheets}
        copied={copied}
        linkCopied={linkCopied}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Key Metrics Cards */}
        <StatsCards
          records={records}
          selectedWeek={selectedWeek}
          selectedDriver={selectedDriver}
          onFilterPending={handleFilterPending}
          statusFilter={statusFilter}
        />

        {/* Spreadsheet Table View */}
        <ExcelTable
          records={records}
          onEditRecord={handleEditRecord}
          onDeleteRecord={handleDeleteRecord}
          onAddNewRecord={handleAddNewRecord}
          onOpenAbsence={() => setIsAbsenceOpen(true)}
          onQuickResolve={handleQuickResolve}
          selectedWeek={selectedWeek}
          setSelectedWeek={setSelectedWeek}
          selectedDriver={selectedDriver}
          setSelectedDriver={setSelectedDriver}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onFillWeeklyEmptyDays={handleFillWeeklyEmptyDays}
          availableWeeks={availableWeeks}
        />
      </main>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onAddRecords={handleAddRecordsFromOCR}
      />

      <AbsenceModal
        isOpen={isAbsenceOpen}
        onClose={() => setIsAbsenceOpen(false)}
        onMarkAbsence={handleMarkAbsence}
      />

      <RecordModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSave={handleSaveRecord}
        initialRecord={editingRecord}
        mode={recordModalMode}
      />

      <ReferenceViewer
        isOpen={isReferenceOpen}
        onClose={() => setIsReferenceOpen(false)}
      />
    </div>
  );
}
