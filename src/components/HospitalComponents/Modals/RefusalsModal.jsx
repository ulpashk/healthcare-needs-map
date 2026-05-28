"use client";

import { X, AlertOctagon } from "lucide-react";

export default function RefusalsModal({ onClose, data, onItemClick }) {
  if (!data) return null;

  const sortedResults = [...(data.results || [])]
    .filter(item => 
      item.facility_type !== null && 
      item.facility_type !== 'null' && 
      item.facility_type !== ''
    )
    .sort((a, b) => {
      const pctA = a.total_emergency_visits > 0 ? (a.hospitalization_denied / a.total_emergency_visits) : 0;
      const pctB = b.total_emergency_visits > 0 ? (b.hospitalization_denied / b.total_emergency_visits) : 0;
      return pctB - pctA;
    });

  return (
    <div className="absolute top-4 right-4 z-50 w-[350px] bg-white rounded-xl shadow-2xl overflow-hidden border border-red-200 animate-in fade-in slide-in-from-right-4">
      <div className="bg-[#7B0000] p-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <AlertOctagon className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-tight">
            Отказы в экстренной госпитализации
          </span>
        </div>
        <button onClick={onClose} className="hover:bg-red-800 p-1 rounded-full">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-4 bg-white">
        <div className="mb-6">
          <h3 className="text-sm font-bold mb-3">По городу</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[10px] text-gray-500">Обращений</div>
              <div className="text-sm font-bold">{data.total_emergency_visits?.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500">Отказов</div>
              <div className="text-sm font-bold text-red-700">{data.total_refused?.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500">% отказов</div>
              <div className="text-sm font-bold text-red-700">{data.refusal_percentage}%</div>
            </div>
          </div>
          <div className="mt-2 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-600" 
              style={{ width: `${data.refusal_percentage}%` }}
            />
          </div>
        </div>

        <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">По типу МО (% отказов)</div>
        
        <div className="max-h-[450px] overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-gray-200">
          {sortedResults.map((item, idx) => {
            const pctRef = item.total_emergency_visits > 0 
              ? (item.hospitalization_denied / item.total_emergency_visits * 100).toFixed(1) 
              : "0";
            
            return (
              <div 
                key={idx} 
                className="space-y-1 cursor-pointer hover:bg-red-50/50 p-1 rounded-lg transition-colors group"
                onClick={() => onItemClick(item)}
              >
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold truncate leading-tight" title={item.facility_type}>
                      {item.facility_type}
                    </div>
                    <div className="text-[9px] text-gray-400">
                      {item.district} · {Math.round(item.beds_avg_annual)} коек · {(item.occupancy_rate_percent * 100).toFixed(1)}% занято
                    </div>
                  </div>
                  <div className="text-xs font-bold text-red-700 ml-2">{pctRef}%</div>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#7B0000]" 
                    style={{ width: `${Math.min(Number(pctRef), 100)}%` }}
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