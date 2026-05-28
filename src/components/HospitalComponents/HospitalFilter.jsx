import React, { useState, useMemo } from 'react';
import { Search, Building2, TrendingUp, ChevronDown, ChevronUp, Bed, Users } from 'lucide-react';

const TECH_CONDITIONS = [
  { id: "dark-red", label: "Аварийное (критично)", color: "#7B0000" },
  { id: "red", label: "Аварийное (снос)", color: "#B71C1C" },
  { id: "orange", label: "Сейсмоусиление / Ветхое", color: "#EF6C00" },
  { id: "yellow", label: "Неудовлетворительное", color: "#F9A825" },
  { id: "green", label: "Исправное", color: "#2E7D32" },
  { id: "gray", label: "Нет данных", color: "#9E9E9E" },
];

export default function HospitalFilter({ facilities, filters, onFiltersChange, onShowBuildingAnalysis }) {
  const [expandedSections, setExpandedSections] = useState({ tech: true });

  const summaryData = useMemo(() => {
    const totalBeds = facilities.reduce((sum, f) => sum + (f.total_beds || 0), 0);
    const avgOccupancy = facilities.length > 0 
      ? Math.round(facilities.reduce((sum, f) => sum + (f.pct_occupied || 0), 0) / facilities.length) 
      : 0;
    return { totalBeds, avgOccupancy, totalMO: facilities.length };
  }, [facilities]);

  const handleToggleTech = (id) => {
    const next = filters.selectedTechConditions.includes(id)
      ? filters.selectedTechConditions.filter(item => item !== id)
      : [...filters.selectedTechConditions, id];
    onFiltersChange({ ...filters, selectedTechConditions: next });
  };

  return (
    <div className="bg-white/95 rounded-xl border border-gray-200 shadow-xl flex flex-col max-h-[calc(100vh-120px)] w-80 overflow-hidden">
      <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
        <Building2 className="w-4 h-4 text-blue-600" />
        <h2 className="font-bold text-sm">Фильтры стационаров</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Поиск */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 ring-blue-100"
            placeholder="Название стационара..."
            value={filters.searchQuery}
            onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
          />
        </div>

        {/* Тех состояние */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Тех. состояние</h3>
          <div className="bg-blue-50/50 p-2 rounded-lg space-y-1">
            {TECH_CONDITIONS.map(item => (
              <label key={item.id} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-white/50 rounded px-1">
                <input 
                  type="checkbox" 
                  checked={filters.selectedTechConditions.includes(item.id)}
                  onChange={() => handleToggleTech(item.id)}
                  className="w-3 h-3 rounded text-blue-600"
                />
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[11px] text-gray-700">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 gap-2 pt-2">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <Bed className="w-3 h-3 text-blue-600" />
              <span className="text-[10px] font-bold text-blue-800 uppercase">Всего коек</span>
            </div>
            <div className="text-lg font-bold text-blue-900">{summaryData.totalBeds.toLocaleString()}</div>
          </div>
          
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-3 h-3 text-slate-600" />
              <span className="text-[10px] font-bold text-slate-800 uppercase">Объектов МО</span>
            </div>
            <div className="text-lg font-bold text-slate-900">{summaryData.totalMO}</div>
          </div>
        </div>

        <button 
          onClick={onShowBuildingAnalysis}
          className="w-full py-3 bg-slate-800 text-white rounded-lg text-[11px] font-bold hover:bg-slate-700 transition-colors shadow-lg flex items-center justify-center gap-2"
        >
          🏢 Анализ зданий
        </button>
      </div>
    </div>
  );
}