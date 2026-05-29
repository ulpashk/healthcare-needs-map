"use client";

import { X, AlertTriangle, BarChart3 } from "lucide-react";

export default function ProfilesDeficitModal({ onClose, data }) {
  if (!data) return null;

  const getOccColor = (pct) => {
    if (pct >= 100) return "text-red-700";
    if (pct > 92) return "text-red-500";
    if (pct >= 70) return "text-green-600";
    return "text-gray-400";
  };

  return (
    <div className="absolute top-4 right-4 z-50 w-[360px] bg-white rounded-xl shadow-2xl overflow-hidden border border-blue-200 animate-in fade-in slide-in-from-right-4 flex flex-col max-h-[90vh]">
      <div className="bg-[#1A237E] p-3 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-green-400" />
          <span className="text-[13px] font-bold">
            Дефицит профилей коечного фонда
          </span>
        </div>
        <button onClick={onClose} className="hover:bg-blue-900 p-1 rounded-full transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-4 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
        <div>
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 text-left">
            Системные показатели
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-blue-50/50 p-3 rounded-lg text-center border border-blue-100/50">
              <div className="text-md font-extrabold text-[#1A237E]">{data.kpi.beds_per_10k} / 10k</div>
              <div className="text-[9px] text-gray-500 leading-tight">Коек на 10 000 жит.</div>
            </div>
            <div className="bg-blue-50/50 p-3 rounded-lg text-center border border-blue-100/50">
              <div className="text-md font-extrabold text-[#1A237E]">{data.kpi.overflow_count} МО</div>
              <div className="text-[9px] text-gray-500 leading-tight">Переполнены {'>'}100%</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-100">
              <div className="text-md font-extrabold text-[#1A237E]">{data.kpi.underload_count} МО</div>
              <div className="text-[9px] text-gray-500 leading-tight">Недозагружены {'<'}70%</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-100">
              <div className="text-md font-extrabold text-[#1A237E]">{data.kpi.new_residents.toLocaleString()}</div>
              <div className="text-[9px] text-gray-500 leading-tight">Новых жителей (ЖК)</div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 text-left">
            Занятость по профилям (% занятых коек)
          </h3>
          <div className="space-y-3.5">
            {data.profiles.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[11px] font-medium text-gray-700 truncate" title={item.group}>
                      {item.group}
                    </span>
                    {item.pct_occ > 100 && (
                      <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
                    )}
                  </div>
                  <span className={`text-[11px] font-bold shrink-0 ${getOccColor(item.pct_occ)}`}>
                    {item.pct_occ}%
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-slate-500 transition-all duration-500" 
                    style={{ width: `${Math.min(item.pct_occ, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 text-[10px] text-gray-400 leading-tight italic border-t border-gray-100">
          Красный {'>'} 100% — дефицит коек; {'>'} 92% — критически высокий
        </div>
      </div>
    </div>
  );
}