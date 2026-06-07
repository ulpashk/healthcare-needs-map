import React from "react";
import { X, AlertOctagon } from "lucide-react";

export default function RefusalsModal({ onClose, data, onItemClick }) {
  if (!data || !data.results) return null;

  // Функция для определения цвета в зависимости от % отказов
  const getRefusalColor = (pct) => {
    const val = parseFloat(pct);
    if (val >= 70) return "#C62828"; // Красный (Критично)
    if (val >= 50) return "#EF6C00"; // Оранжевый (Высокий)
    return "#2E7D32";                // Зеленый (Норма)
  };

  const sortedResults = [...data.results]
    .filter(item => item.facility_type)
    .sort((a, b) => {
      const pctA = a.total_emergency_visits > 0 ? (a.hospitalization_denied / a.total_emergency_visits) : 0;
      const pctB = b.total_emergency_visits > 0 ? (b.hospitalization_denied / b.total_emergency_visits) : 0;
      return pctB - pctA;
    });

  return (
    <div className="absolute top-4 right-4 z-50 w-[350px] bg-white rounded-xl shadow-2xl overflow-hidden border border-red-200 animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col max-h-[85vh]">
      {/* HEADER */}
      <div className="bg-[#7B0000] p-3 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-2">
          <AlertOctagon className="h-4 w-4 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-tight text-left leading-tight">
            Отказы в экстренной госпитализации
          </span>
        </div>
        <button onClick={onClose} className="hover:bg-red-800 p-1 rounded-full transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-4 bg-white text-left overflow-y-auto scrollbar-hide">
        {/* СТАТИСТИКА ПО ГОРОДУ */}
        <div className="mb-6">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[9px] text-gray-500 uppercase">Обращений</div>
              <div className="text-sm font-bold text-gray-900">{data.total_emergency_visits?.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[9px] text-gray-500 uppercase">Отказов</div>
              <div className="text-sm font-bold" style={{ color: getRefusalColor(data.refusal_percentage) }}>
                {data.total_refused?.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-gray-500 uppercase">% отказов</div>
              <div className="text-sm font-bold" style={{ color: getRefusalColor(data.refusal_percentage) }}>
                {data.refusal_percentage}%
              </div>
            </div>
          </div>
          <div className="mt-3 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-1000" 
              style={{ 
                width: `${data.refusal_percentage}%`, 
                backgroundColor: getRefusalColor(data.refusal_percentage) 
              }} 
            />
          </div>
        </div>

        <div className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wider">По типу МО (% отказов)</div>
        
        {/* СПИСОК С ЦВЕТАМИ */}
        <div className="space-y-3 pr-1">
          {sortedResults.map((item, idx) => {
            const pctRef = item.total_emergency_visits > 0 
              ? ((item.hospitalization_denied / item.total_emergency_visits) * 100).toFixed(1) 
              : "0";
            
            const currentColor = getRefusalColor(pctRef);
            
            return (
              <div 
                key={idx} 
                className="space-y-1.5 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-all group border border-transparent"
                onClick={() => onItemClick(item)}
              >
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold text-gray-800 truncate leading-tight group-hover:text-blue-900 transition-colors">
                      {item.facility_type}
                    </div>
                    <div className="text-[9px] text-gray-500 mt-1 flex items-center gap-1.5">
                      <span>{item.district.replace(' район', '')}</span>
                      <span className="text-gray-300">|</span>
                      <span>🛏 {Math.round(item.beds_avg_annual)} коек</span>
                      <span className="text-gray-300">|</span>
                      <span className={item.occupancy_rate_percent > 0.9 ? 'text-red-600 font-bold' : ''}>
                        {(item.occupancy_rate_percent * 100).toFixed(0)}% занято
                      </span>
                    </div>
                  </div>
                  <div 
                    className="text-xs font-bold ml-2 transition-colors" 
                    style={{ color: currentColor }}
                  >
                    {pctRef}%
                  </div>
                </div>
                {/* Динамический прогресс-бар */}
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full opacity-85 transition-all duration-500" 
                    style={{ 
                      width: `${Math.min(Number(pctRef), 100)}%`, 
                      backgroundColor: currentColor 
                    }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}