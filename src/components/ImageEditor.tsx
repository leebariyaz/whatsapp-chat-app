import { useRef, useState, useEffect, useCallback } from 'react';
import { RotateCw, FlipHorizontal, FlipVertical, ZoomIn, ZoomOut, Undo, Redo, Crop, Save, X, Loader2 } from 'lucide-react';

interface ImageEditorProps {
  imageSrc: string;
  onSave: (processedBlob: Blob) => void;
  onCancel: () => void;
}

interface AdjustmentState {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  sepia: number;
  grayscale: number;
  hueRotate: number;
  invert: number;
}

const DEFAULT_ADJUSTMENTS: AdjustmentState = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
  sepia: 0,
  grayscale: 0,
  hueRotate: 0,
  invert: 0,
};

const FILTERS: { name: string; values: Partial<AdjustmentState> }[] = [
  { name: 'Original', values: {} },
  { name: 'Vivid', values: { saturation: 150, contrast: 110 } },
  { name: 'B&W', values: { grayscale: 100 } },
  { name: 'Sepia', values: { sepia: 80 } },
  { name: 'Cool', values: { hueRotate: 180, saturation: 120 } },
  { name: 'Warm', values: { sepia: 30, saturation: 120, brightness: 105 } },
  { name: 'Vintage', values: { sepia: 50, contrast: 90, brightness: 95 } },
  { name: 'Dramatic', values: { contrast: 140, saturation: 80, brightness: 90 } },
  { name: 'Faded', values: { saturation: 70, brightness: 110, contrast: 85 } },
  { name: 'Noir', values: { grayscale: 100, contrast: 130, brightness: 90 } },
];

const ADJUSTMENT_SLIDERS: { key: keyof AdjustmentState; label: string; min: number; max: number; step: number; unit: string }[] = [
  { key: 'brightness', label: 'Brightness', min: 0, max: 200, step: 1, unit: '%' },
  { key: 'contrast', label: 'Contrast', min: 0, max: 200, step: 1, unit: '%' },
  { key: 'saturation', label: 'Saturation', min: 0, max: 200, step: 1, unit: '%' },
  { key: 'blur', label: 'Blur', min: 0, max: 10, step: 0.1, unit: 'px' },
  { key: 'sepia', label: 'Warmth', min: 0, max: 100, step: 1, unit: '%' },
  { key: 'hueRotate', label: 'Tint', min: 0, max: 360, step: 1, unit: '°' },
  { key: 'grayscale', label: 'Grayscale', min: 0, max: 100, step: 1, unit: '%' },
  { key: 'invert', label: 'Invert', min: 0, max: 100, step: 1, unit: '%' },
];

export default function ImageEditor({ imageSrc, onSave, onCancel }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [adjustments, setAdjustments] = useState<AdjustmentState>(DEFAULT_ADJUSTMENTS);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [activeTab, setActiveTab] = useState<'filters' | 'adjust' | 'crop'>('filters');
  const [history, setHistory] = useState<AdjustmentState[]>([DEFAULT_ADJUSTMENTS]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const filterString = useCallback((a: AdjustmentState) => {
    return `brightness(${a.brightness}%) contrast(${a.contrast}%) saturate(${a.saturation}%) blur(${a.blur}px) sepia(${a.sepia}%) grayscale(${a.grayscale}%) hue-rotate(${a.hueRotate}deg) invert(${a.invert}%)`;
  }, []);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.complete) return;

    const size = 320;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, size, size);

    // Apply filter
    ctx.filter = filterString(adjustments);

    // Move to center for transformations
    ctx.translate(size / 2 + offset.x, size / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.scale(zoom, zoom);

    // Draw image centered and cropped to circle
    const aspect = img.width / img.height;
    let drawW = size;
    let drawH = size;
    if (aspect > 1) drawW = size * aspect;
    else drawH = size / aspect;

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Circular clip
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }, [adjustments, rotation, flipH, flipV, zoom, offset, filterString]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (img.complete) drawCanvas();
    else img.onload = drawCanvas;
  }, [drawCanvas]);

  const pushHistory = (newAdjustments: AdjustmentState) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAdjustments);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const updateAdjustment = (key: keyof AdjustmentState, value: number) => {
    const newAdjustments = { ...adjustments, [key]: value };
    setAdjustments(newAdjustments);
  };

  const commitAdjustment = () => {
    pushHistory(adjustments);
  };

  const applyFilter = (filterValues: Partial<AdjustmentState>) => {
    const newAdjustments = { ...DEFAULT_ADJUSTMENTS, ...filterValues };
    setAdjustments(newAdjustments);
    pushHistory(newAdjustments);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setAdjustments(history[newIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setAdjustments(history[newIndex]);
    }
  };

  const reset = () => {
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setHistory([DEFAULT_ADJUSTMENTS]);
    setHistoryIndex(0);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      drawCanvas();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.85);
      });
      onSave(blob);
    } catch (err) {
      console.error('Failed to save image', err);
    } finally {
      setSaving(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTab !== 'crop') return;
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStart || activeTab !== 'crop') return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setDragStart(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Edit Profile Photo</h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview */}
        <div className="flex flex-col items-center py-6 bg-slate-50 dark:bg-slate-900/50">
          <div
            className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-white dark:border-slate-700 shadow-lg"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: activeTab === 'crop' ? 'move' : 'default' }}
          >
            <canvas ref={canvasRef} className="w-full h-full" />
            <img ref={imgRef} src={imageSrc} alt="Source" className="hidden" />
          </div>

          {/* Transform controls */}
          <div className="flex items-center gap-2 mt-4">
            <IconBtn onClick={() => setRotation((r) => (r + 90) % 360)} title="Rotate"><RotateCw className="w-4 h-4" /></IconBtn>
            <IconBtn onClick={() => setFlipH((v) => !v)} title="Flip H" active={flipH}><FlipHorizontal className="w-4 h-4" /></IconBtn>
            <IconBtn onClick={() => setFlipV((v) => !v)} title="Flip V" active={flipV}><FlipVertical className="w-4 h-4" /></IconBtn>
            <IconBtn onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} title="Zoom out"><ZoomOut className="w-4 h-4" /></IconBtn>
            <IconBtn onClick={() => setZoom((z) => Math.min(3, z + 0.1))} title="Zoom in"><ZoomIn className="w-4 h-4" /></IconBtn>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-700">
          {(['filters', 'adjust', 'crop'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-medium capitalize transition ${
                activeTab === tab
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              {tab === 'crop' ? 'Reposition' : tab}
            </button>
          ))}
        </div>

        <div className="p-4 max-h-64 overflow-y-auto">
          {activeTab === 'filters' && (
            <div className="grid grid-cols-5 gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.name}
                  onClick={() => applyFilter(f.values)}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700" style={{ filter: filterString({ ...DEFAULT_ADJUSTMENTS, ...f.values }) }}>
                    <img src={imageSrc} alt={f.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{f.name}</span>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'adjust' && (
            <div className="space-y-3">
              {ADJUSTMENT_SLIDERS.map((slider) => (
                <div key={slider.key}>
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <span>{slider.label}</span>
                    <span>{adjustments[slider.key]}{slider.unit}</span>
                  </div>
                  <input
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    value={adjustments[slider.key]}
                    onChange={(e) => updateAdjustment(slider.key, Number(e.target.value))}
                    onMouseUp={commitAdjustment}
                    className="w-full accent-blue-500"
                  />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'crop' && (
            <div className="text-center py-4">
              <Crop className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Drag the image to reposition</p>
              <p className="text-xs text-slate-400 mt-1">Use zoom and rotate controls above to adjust further</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 dark:border-slate-700 gap-2">
          <div className="flex items-center gap-1">
            <IconBtn onClick={undo} title="Undo" disabled={historyIndex === 0}><Undo className="w-4 h-4" /></IconBtn>
            <IconBtn onClick={redo} title="Redo" disabled={historyIndex === history.length - 1}><Redo className="w-4 h-4" /></IconBtn>
            <IconBtn onClick={reset} title="Reset"><RotateCw className="w-4 h-4" /></IconBtn>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-medium hover:opacity-90 disabled:opacity-50 transition"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Photo
          </button>
        </div>
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, title, active, disabled }: { children: React.ReactNode; onClick: () => void; title: string; active?: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`p-2 rounded-lg transition disabled:opacity-30 ${
        active
          ? 'bg-blue-500 text-white'
          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
      }`}
    >
      {children}
    </button>
  );
}
