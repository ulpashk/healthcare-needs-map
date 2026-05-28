import { Building2, BarChart3, RotateCcw } from "lucide-react";
import DistrictSummaryModal from "../Modal/DistrictSummaryModal";
import BuildingAgeModal from "../Modal/BuildingAgeModal";

export default function Analytics({ setActiveModal, activeModal, onReset }) {
  return (
    <div className="flex flex-col gap-1.5 p-2 md:px-3 bg-white/95 border-t">
      <h3 className="text-left ml-1 font-bold text-gray-800 text-[11px] md:text-xs">Аналитика</h3>

      <button 
        onClick={() => setActiveModal(activeModal === 'summary' ? null : 'summary')}
        className={`flex items-center gap-2 w-full rounded-lg border p-2 transition-colors text-left ${activeModal === 'summary' ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
      >
        <BarChart3 className="w-4 h-4 text-blue-600 shrink-0" />
        <span className="font-medium text-blue-900 text-[10px] md:text-[11px] leading-tight">Сводка по районам</span>
      </button>

      <button 
        onClick={() => setActiveModal(activeModal === 'age' ? null : 'age')}
        className={`flex items-center gap-2 w-full rounded-lg border p-2 transition-colors text-left ${activeModal === 'age' ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
      >
        <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
        <span className="font-medium text-blue-900 text-[10px] md:text-[11px] leading-tight">Возраст зданий</span>
      </button>

      <button 
        onClick={onReset}
        className="flex items-center justify-center gap-1.5 w-full mt-0.5 rounded-lg border border-gray-100 bg-gray-50/50 p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all active:scale-95"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span className="font-medium text-[10px]">Сбросить фильтры</span>
      </button>
    </div>
  );
}