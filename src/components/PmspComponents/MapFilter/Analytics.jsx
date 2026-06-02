import { Building2, BarChart3, RotateCcw } from "lucide-react";

export default function Analytics({ setActiveModal, activeModal }) {
  return (
    <div className="flex flex-col pb-2 md:px-3 bg-white/95">
      <button 
        onClick={() => setActiveModal(activeModal === 'age' ? null : 'age')}
        className={`flex items-center gap-2 w-full rounded-lg border border-gray-200 p-2 transition-colors text-left cursor-pointer ${activeModal === 'age' ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
      >
        <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
        <span className="font-medium text-blue-900 text-[10px] md:text-[11px] leading-tight">Возраст зданий</span>
      </button>
    </div>
  );
}