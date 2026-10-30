import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Sparkles,
  FileText,
  Clock,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { RawDetection, VehicleRecord } from '../types/vehicle';
import { pairDetectionsIntoRecords, formatDecimalHours } from '../utils/dateUtils';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRecords: (newRecords: VehicleRecord[], replaceAll: boolean) => void;
}

interface ImageFileItem {
  file: File;
  previewUrl: string;
  base64: string;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onAddRecords }) => {
  const [images, setImages] = useState<ImageFileItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-29');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detectedEvents, setDetectedEvents] = useState<RawDetection[]>([]);
  const [pairedPreview, setPairedPreview] = useState<VehicleRecord[]>([]);
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clipboard paste listener
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleFilesAdded([file]);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFilesAdded = async (files: File[]) => {
    setErrorMessage(null);
    const newItems: ImageFileItem[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const previewUrl = URL.createObjectURL(file);
      const base64 = await fileToBase64(file);
      newItems.push({ file, previewUrl, base64 });
    }

    setImages((prev) => [...prev, ...newItems]);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].previewUrl);
      copy.splice(index, 1);
      return copy;
    });
  };

  const handleLoadSampleWhatsAppImage = async () => {
    try {
      setErrorMessage(null);
      const res = await fetch('/assets/aistudio/image_869e1d9b.png');
      const blob = await res.blob();
      const file = new File([blob], 'WhatsApp_TG_Millenium_Enrique.png', { type: 'image/png' });
      await handleFilesAdded([file]);
    } catch (e) {
      console.error(e);
      setErrorMessage('No se pudo cargar la captura de WhatsApp de ejemplo.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(Array.from(e.dataTransfer.files));
    }
  };

  const handleProcessImages = async () => {
    if (images.length === 0) {
      setErrorMessage('Por favor selecciona al menos una captura de WhatsApp para procesar.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const payload = {
        defaultYear: selectedDate.slice(0, 4),
        referenceDate: selectedDate,
        images: images.map((item) => ({
          filename: item.file.name,
          mimeType: item.file.type,
          data: item.base64,
        })),
      };

      const res = await fetch('/api/process-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar las imágenes en el servidor.');
      }

      const detections: RawDetection[] = (data.detections || []).map(
        (det: Partial<RawDetection>, idx: number) => ({
          id: `det-${idx}-${Date.now()}`,
          sourceImage: det.sourceImage || 'WhatsApp Captura',
          driver: det.driver || 'OTRO',
          predio: det.predio || 'Predio 3',
          movementType: det.movementType || 'DESCONOCIDO',
          date: det.date || selectedDate,
          time: det.time || '10:00',
          rawTextFound: det.rawTextFound || '',
          confidenceNotes: det.confidenceNotes || '',
          timestamp: Date.now(),
        })
      );

      setDetectedEvents(detections);
      const paired = pairDetectionsIntoRecords(detections);
      setPairedPreview(paired);
      setStep('preview');
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMessage(error.message || 'Error de conexión o procesamiento');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = (replaceAll: boolean) => {
    onAddRecords(pairedPreview, replaceAll);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-600 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Procesar Capturas de WhatsApp con IA
              </h2>
              <p className="text-xs text-slate-400">
                Extracción automática de ingresos y salidas para Enrique Grant y Luis E. Grant
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

        {/* Modal Content */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 'upload' ? (
            <div className="space-y-4">
              {/* Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-6 text-center cursor-pointer bg-slate-50/60 hover:bg-emerald-50/30 transition-all flex flex-col items-center justify-center gap-2"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleFilesAdded(Array.from(e.target.files));
                    }
                  }}
                />
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Haz clic para seleccionar imágenes o arrástralas aquí
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    También puedes pegar directamente con <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-200 text-slate-700 rounded border border-slate-300">Ctrl + V</kbd>
                  </p>
                </div>
                <p className="text-[11px] text-slate-400">
                  Soporta capturas de chat de WhatsApp con stickers "Ingresa / Sale" y reportes con fecha y hora
                </p>
              </div>

              {/* Quick Test Sample Button */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-emerald-900">
                    ¿Quieres probar con la captura de WhatsApp adjunta? (T.G #3 Millenium · Enrique Grant)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLoadSampleWhatsAppImage}
                  className="px-3 py-1 font-bold text-xs bg-emerald-700 hover:bg-emerald-600 text-white rounded-md shadow-xs transition-colors shrink-0"
                >
                  Cargar Captura de Prueba
                </button>
              </div>

              {/* Date selector for WhatsApp image */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-slate-700">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block">
                      Fecha de la imagen que vas a registrar:
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Como los mensajes de WhatsApp solo indican la hora (ej. 09:35, 10:31), se aplicará esta fecha al registro.
                    </span>
                  </div>
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 shrink-0"
                />
              </div>

              {/* Selected Images List */}
              {images.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Imágenes seleccionadas ({images.length})
                    </span>
                    <button
                      onClick={() => setImages([])}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Limpiar todas
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-56 overflow-y-auto p-1">
                    {images.map((item, index) => (
                      <div
                        key={index}
                        className="relative group border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs"
                      >
                        <img
                          src={item.previewUrl}
                          alt={item.file.name}
                          className="h-24 w-full object-cover"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(index);
                          }}
                          className="absolute top-1 right-1 p-1 bg-slate-900/80 text-white rounded-full hover:bg-rose-600 transition-colors"
                          title="Eliminar imagen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="p-1.5 text-[10px] text-slate-600 truncate bg-slate-50">
                          {item.file.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Step: Preview extracted data */
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">
                    ¡Análisis completado! Se detectaron {detectedEvents.length} eventos y se generaron {pairedPreview.length} registros para el Excel.
                  </span>
                </div>
                <button
                  onClick={() => setStep('upload')}
                  className="text-emerald-700 font-bold underline hover:text-emerald-800"
                >
                  Volver a imágenes
                </button>
              </div>

              {/* Preview Table */}
              <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#0D473D] text-white sticky top-0">
                    <tr>
                      <th className="py-2 px-2.5 font-bold text-center">SEM</th>
                      <th className="py-2 px-2.5 font-bold">DIA</th>
                      <th className="py-2 px-2.5 font-bold text-center">PREDIO</th>
                      <th className="py-2 px-2.5 font-bold">INGRESO</th>
                      <th className="py-2 px-2.5 font-bold">SALIDA</th>
                      <th className="py-2 px-2.5 font-bold">NOMBRE</th>
                      <th className="py-2 px-2.5 font-bold text-right">HORAS</th>
                      <th className="py-2 px-2.5 font-bold">OBSERVACIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {pairedPreview.map((rec, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-2.5 text-center font-bold bg-[#fce7f3]">
                          {rec.semana}
                        </td>
                        <td className="py-2 px-2.5 capitalize">{rec.dia}</td>
                        <td className="py-2 px-2.5 text-center font-semibold text-emerald-800">
                          {rec.predio || 'Predio 3'}
                        </td>
                        <td className="py-2 px-2.5 font-mono">{rec.fechaIngreso}</td>
                        <td className="py-2 px-2.5 font-mono">{rec.fechaSalida}</td>
                        <td className="py-2 px-2.5 font-semibold">
                          <span
                            className={`px-1.5 py-0.5 rounded ${
                              rec.nombre === 'ENRIQUE GRANT'
                                ? 'bg-[#e0f2fe] text-sky-900'
                                : 'bg-[#f3e8ff] text-purple-900'
                            }`}
                          >
                            {rec.nombre}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-bold">
                          {formatDecimalHours(rec.horas)}
                        </td>
                        <td className="py-2 px-2.5">
                          {rec.observaciones.includes('PENDIENTE') ? (
                            <span className="text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded font-bold text-[10px]">
                              PENDIENTE
                            </span>
                          ) : (
                            rec.observaciones || '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancelar
          </button>

          {step === 'upload' ? (
            <button
              onClick={handleProcessImages}
              disabled={images.length === 0 || isProcessing}
              className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg text-white shadow-md transition-all ${
                images.length === 0 || isProcessing
                  ? 'bg-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.02]'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Procesando capturas con Gemini IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Procesar {images.length} {images.length === 1 ? 'Captura' : 'Capturas'}</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleApply(false)}
                className="px-4 py-2 text-xs font-bold rounded-lg text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 transition-colors"
              >
                Añadir al final del Excel
              </button>
              <button
                onClick={() => handleApply(true)}
                className="px-4 py-2 text-xs font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-colors"
              >
                Reemplazar todo el Excel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
