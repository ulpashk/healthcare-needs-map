import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export const MapControls = ({ onZoomIn, onZoomOut, onReset }) => {
  return (
    <div className="absolute top-3 right-3 md:top-4 md:right-4 z-20 flex flex-col gap-1.5 md:gap-2">
      <button
        onClick={onZoomIn}
        className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-2 md:p-2.5 shadow-md hover:shadow-lg transition-all duration-200"
        title="Увеличить"
        aria-label="Zoom in"
      >
        <ZoomIn className="h-3 w-3 md:h-3.5 md:w-3.5 text-gray-700" />
      </button>
      <button
        onClick={onZoomOut}
        className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-2 md:p-2.5 shadow-md hover:shadow-lg transition-all duration-200"
        title="Уменьшить"
        aria-label="Zoom out"
      >
        <ZoomOut className="h-3 w-3 md:h-3.5 md:w-3.5 text-gray-700" />
      </button>
      <button
        onClick={onReset}
        className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-2 md:p-2.5 shadow-md hover:shadow-lg transition-all duration-200"
        title="Сбросить вид"
        aria-label="Reset view"
      >
        <RotateCcw className="h-3 w-3 md:h-3.5 md:w-3.5 text-gray-700" />
      </button>
    </div>
  );
};
