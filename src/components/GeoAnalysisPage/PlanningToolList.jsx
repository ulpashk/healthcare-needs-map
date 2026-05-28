import React, { useState, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function PlanningToolList({ data, onZoomTo }) {
  const [filter, setFilter] = useState('all');

  const stats = useMemo(() => {
    if (!data || !data.features) return { total: 0, critical: 0 };
    const totalWithDeficit = data.features.filter(f => f.properties.hasDeficit).length;
    const criticalOnly = data.features.filter(f => f.properties.lbl === 'Критичный').length;
    return { total: totalWithDeficit, critical: criticalOnly };
  }, [data]);

  const filteredList = useMemo(() => {
    if (!data || !data.features) return [];
    
    return data.features
      .filter(f => {
        const lbl = f.properties.lbl;
        if (filter === 'critical') return lbl === 'Критичный';
        if (filter === 'high') return lbl === 'Высокий';
        return lbl === 'Критичный' || lbl === 'Высокий';
      })
      .sort((a, b) => b.properties.defPop - a.properties.defPop);
  }, [data, filter]);

  return (
    <div className="bg-gray-50 border-b flex flex-col font-sans">
      
      <div className="bg-[#E8EAF6] p-3 border-b border-indigo-100 text-left text-[10px] font-semibold">
        <div className="text-[#1A237E] leading-tight">
          Найдено <span className="font-bold">{stats.total}</span> зон генплана в дефицитных районах
        </div>
        <div className="flex items-center gap-1 mt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#7B1FA2] border border-black/10 shadow-sm"></div>
          <div className="text-[#4A148C]">
            <span className="font-bold">{stats.critical}</span> критичных (фиолетовый)
          </div>
        </div>
        {/* <div className="text-[9px] text-blue-600 mt-1 italic">
          * Клик на зону в списке для фокусировки на карте
        </div> */}
      </div>

      <div className="flex justify-between gap-1 p-2 bg-white border-b overflow-x-auto no-scrollbar">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1 rounded-lg text-[10px] font-bold transition-all ${
            filter === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-500'
          }`}
        >
          Все
        </button>

        <button
          onClick={() => setFilter('critical')}
          className={`flex items-center gap-1 px-4 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
            filter === 'critical' ? 'bg-purple-50 border-purple-200 text-purple-700 shadow-sm' : 'bg-white border-gray-100 text-gray-400'
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-[#7B1FA2]" />
          Критические
        </button>

        <button
          onClick={() => setFilter('high')}
          className={`flex items-center gap-1.5 px-4 py-1 rounded-lg text-[10px] font-bold border transition-all ${
            filter === 'high' ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'bg-white border-gray-100 text-gray-400'
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-[#0039FF]" />
          Высокие
        </button>
      </div>

      <div className="max-h-[250px] overflow-y-auto custom-scrollbar p-2 space-y-2 pb-20">
        {filteredList.length === 0 ? (
          <div className="text-center p-6 text-gray-400 italic text-[11px]">Зон не найдено</div>
        ) : (
          filteredList.map((zone, i) => {
            const p = zone.properties;
            return (
              <div 
                key={i}
                onClick={() => onZoomTo(zone)}
                className="bg-white border border-gray-100 border-l-4 rounded-r-md p-2 shadow-sm cursor-pointer hover:border-indigo-200 transition-all group"
                style={{ borderLeftColor: p.col }}
              >
                <div className="font-bold text-[11px] text-gray-800 group-hover:text-blue-700 leading-tight">
                  {p.note || 'Зона здравоохранения'} {p.zone_index || ''}
                </div>
                <div className="text-[10px] text-gray-500 flex justify-between mt-1.5">
                  <span>👥 ≈<b>{p.defPop.toLocaleString()}</b> чел.</span>
                  <span style={{ color: p.col }} className="font-bold uppercase text-[9px]">{p.lbl}</span>
                </div>
                <div className="mt-1.5 pt-1.5 border-t border-dashed border-gray-100 font-bold text-[10px]" style={{ color: p.col }}>
                  🏥 Требуется: {p.recommendation}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}