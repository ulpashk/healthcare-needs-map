import React from 'react';
import { X, Activity, Users, Home, ShieldCheck, AlertTriangle, MapPin, Info } from 'lucide-react';

export const AnalysisSidebar = ({ results, onClose, onSimulate, isSimulating }) => {
  if (!results) return null;

  const getScoreColors = (score) => {
    if (score >= 80) return "bg-green-50 border-green-100 text-green-700";
    if (score >= 40) return "bg-orange-50 border-orange-100 text-orange-700";
    return "bg-red-50 border-red-100 text-red-700";
  };

  return (
    <div className="absolute top-24 right-6 bottom-20 w-[320px] bg-white shadow-2xl rounded-xl border border-gray-300 overflow-hidden transition-all duration-300 flex flex-col z-[60] animate-in slide-in-from-right">  
      <div className="bg-[#1967d2] p-2.5 px-4 flex items-center justify-between text-white shrink-0 h-[42px]">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4" />
          <span className="font-bold text-[12px] uppercase tracking-wide">Анализ точки размещения</span>
        </div>
        <button onClick={onClose} className="hover:bg-[#1557b0] p-1 rounded-full transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-classic-scrollbar p-4 px-5 space-y-4">
        <div className={`p-3 rounded-lg border flex flex-col items-center transition-all ${getScoreColors(results.score)}`}>
          <span className="text-[9px] font-bold uppercase opacity-80 tracking-wider">Целесообразность</span>
          <div className="text-[16px] font-black tracking-tight">
            {results.score}% — {results.verdict}
          </div>
        </div>

        <div className="space-y-1">
          <h4 className="text-[10px] font-bold text-[#5f6368] uppercase tracking-tight">Рекомендация по типу</h4>
          <div className={`text-[13px] font-bold leading-tight ${results.score < 40 ? 'text-gray-400' : 'text-[#3c4043]'}`}>
            {results.recommendation}
          </div>
        </div>
        
        {results.recommendation !== "Строительство не требуется" && (
          <div className="px-1 pb-2">
            <button 
              onClick={onSimulate}
              className={`w-full py-2 rounded-lg border font-bold text-[10px] transition-all flex items-center justify-center gap-2 ${
                isSimulating 
                  ? "bg-green-600 border-green-600 text-white" 
                  : "bg-white border-[#1967d2] text-[#1967d2] hover:bg-blue-50"
              }`}
            >
              <Activity size={14} className={isSimulating ? "animate-pulse" : ""} />
              {isSimulating ? "ОТКЛЮЧИТЬ МОДЕЛИРОВАНИЕ" : "МОДЕЛИРОВАТЬ РАЗМЕЩЕНИЕ"}
            </button>
          </div>
        )}


        <hr className="border-gray-100" />

        {/* Списки объектов */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-[#5f6368] uppercase tracking-tight">Объекты в радиусе {results.radius}м</h4>
          
          <div className="space-y-1">
            <div className="text-[9px] font-bold text-gray-400 uppercase px-1">Действующие ({results.existingNearby?.length || 0})</div>
            <div className="max-h-[100px] overflow-y-auto space-y-1 pr-1 custom-classic-scrollbar">
              {results.existingNearby && results.existingNearby.length > 0 ? results.existingNearby.map((obj, i) => (
                <div key={i} className="flex justify-between items-center p-1.5 bg-gray-50 rounded border border-gray-100 text-[10px]">
                  <span className="truncate max-w-[150px]">{obj.name}</span>
                  <span className="font-bold text-blue-600 shrink-0">{obj.dist}м</span>
                </div>
              )) : <div className="text-[10px] text-gray-400 italic px-1">Объекты не найдены</div>}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[9px] font-bold text-orange-400 uppercase px-1">Планируемые ({results.plannedNearby?.length || 0})</div>
            <div className="max-h-[100px] overflow-y-auto space-y-1 pr-1 custom-classic-scrollbar">
              {results.plannedNearby && results.plannedNearby.length > 0 ? results.plannedNearby.map((obj, i) => (
                <div key={i} className="flex justify-between items-center p-1.5 bg-orange-50 rounded border border-orange-100 text-[10px]">
                  <span className="truncate max-w-[150px] text-orange-800">{obj.name}</span>
                  <span className="font-bold text-orange-600 shrink-0">{obj.dist}м</span>
                </div>
              )) : <div className="text-[10px] text-gray-400 italic px-1">Планы отсутствуют</div>}
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Сетка жителей */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
            <div className="flex items-center gap-1.5 text-gray-500 mb-1">
              <Users size={12} />
              <span className="text-[9px] font-bold uppercase">Жителей</span>
            </div>
            <div className="text-[12px] font-bold text-blue-700">~{(results.population || 0).toLocaleString()}</div>
          </div>
          <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
            <div className="flex items-center gap-1.5 text-gray-500 mb-1">
              <Home size={12} />
              <span className="text-[9px] font-bold uppercase">в т.ч. ЖК</span>
            </div>
            <div className="text-[12px] font-bold text-orange-700">+{(results.zhkPop || 0).toLocaleString()}</div>
          </div>
        </div>

        {/* Детали */}
        <div className="space-y-2 border-t pt-3">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-gray-500">Мощность</span>
            <span className="font-bold text-[#3c4043]">{results.capacity > 0 ? `${results.capacity} пос/см` : "—"}</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-gray-500">Радиус поиска</span>
            <span className="font-bold text-[#3c4043]">{results.radius} м</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-gray-500 text-red-500">Ячеек в дефиците</span>
            <span className="font-bold text-red-600">{results.redCells} ед.</span>
          </div>
        </div>

        {/* Текстовый вывод */}
        <div className={`p-2.5 rounded-lg border text-[10px] leading-tight font-medium ${results.score >= 40 ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
          {results.score >= 40 
            ? "Размещение целесообразно: точка охватывает зону дефицита ПМСП и учитывает прирост населения от ЖК."
            : "Размещение не рекомендуется: высокая плотность существующих объектов или наличие утвержденных планов строительства."}
        </div>
      </div>

      <style>{`
        .custom-classic-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-classic-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-classic-scrollbar::-webkit-scrollbar-thumb {
          background: #aaaaaa;
          border-radius: 4px;
        }
        .custom-classic-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #888888;
        }
      `}</style>
    </div>
  );
};