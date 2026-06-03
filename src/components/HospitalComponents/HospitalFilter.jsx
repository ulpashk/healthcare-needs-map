import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Building2, TrendingUp, ChevronDown, ChevronUp, Bed, Users, MapIcon } from 'lucide-react';

const districts = ["Все районы", "Алатауский", "Алмалинский", "Ауэзовский", "Бостандыкский", 
  "Жетысуский", "Медеуский", "Наурызбайский", "Турксибский"];

const TECH_CONDITIONS = [
  { id: "dark-red", label: "Аварийное (критично)", color: "#7B0000" },
  { id: "red", label: "Аварийное (снос)", color: "#B71C1C" },
  { id: "orange", label: "Сейсмоусиление / Ветхое", color: "#EF6C00" },
  { id: "yellow", label: "Неудовлетворительное", color: "#F9A825" },
  { id: "green", label: "Исправное", color: "#2E7D32" },
  { id: "gray", label: "Нет данных", color: "#9E9E9E" },
];

const GEO_LAYERS = [
  { id: "zones", label: "🏥 Зоны генплана (больницы)" },
  { id: "grid", label: "🎯 Сетка доступности (15 мин)" },
  { id: "refusals", label: "⚕ Отказы в госпитализации" },
  { id: "profiles", label: "📊 Дефицит профилей" },
  { id: "orgTypeGrid", label: "🗺 Грид по типу МО" },
];

export default function HospitalFilter({ facilities, filters, onFiltersChange, onShowBuildingAnalysis }) {
  const [expandedSections, setExpandedSections] = useState({ tech: true });
  const location = useLocation();
  const isGeoPage = location.pathname.includes('geo-analysis');
  const isBuildingsPage = location.pathname.includes('buildings');

  const summaryData = useMemo(() => {
    const filtered = facilities.filter((f) => {
      if (filters.searchQuery && !f.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
      if (filters.district && filters.district !== "Все районы") {
        if (!f.district || !f.district.includes(filters.district)) {
          return false;
        }
      }
      return true;
    });

    if (!filtered.length) {
      return { totalMO: 0, avgOccupancy: 0, totalAdmitted: 0, totalBeds: 0 };
    }

    const totalBeds = filtered.reduce((sum, f) => sum + (f.total_beds || 0), 0);
    const totalAdmitted = filtered.reduce((sum, f) => sum + (f.admitted || 0), 0);
    const avgOccupancy = Math.round(filtered.reduce((sum, f) => sum + (f.pct_occupied || 0), 0) / filtered.length);

    return { 
      totalBeds, 
      avgOccupancy, 
      totalMO: filtered.length, 
      totalAdmitted 
    };
  }, [facilities, filters]);

  const handleToggleTech = (id) => {
    const next = filters.selectedTechConditions.includes(id)
      ? filters.selectedTechConditions.filter(item => item !== id)
      : [...filters.selectedTechConditions, id];
    onFiltersChange({ ...filters, selectedTechConditions: next });
  };

  const handleTabChange = (mode) => {
    onFiltersChange({ ...filters, mapMode: mode });
  };

  const activeTab = filters.mapMode;

  return (
    <div className="bg-white/95 rounded-xl border border-gray-200 shadow-xl flex flex-col max-h-[calc(100vh-120px)] w-80 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
        <h2 className="font-bold text-sm">
          Фильтры
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 ring-blue-100"
            placeholder="Название стационара..."
            value={filters.searchQuery}
            onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <select 
            value={filters.district}
            onChange={(e) => onFiltersChange({ ...filters, district: e.target.value })}
            className="w-full p-2 border border-gray-200 rounded-lg text-xs bg-white outline-none focus:ring-2 ring-blue-100 cursor-pointer"
          >
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {isGeoPage && (
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold text-gray-400 text-left uppercase tracking-wider">Доступность 15 мин</h3>
            <div className="flex p-1 bg-gray-100 rounded-lg gap-1">
              <button
                onClick={() => onFiltersChange({ ...filters, geoAccessMode: "current" })}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  filters.geoAccessMode === "current" ? "bg-white shadow-sm text-blue-600" : "text-gray-500"
                }`}
              >
                Текущие МО
              </button>
              <button
                onClick={() => onFiltersChange({ ...filters, geoAccessMode: "planned" })}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  filters.geoAccessMode === "planned" ? "bg-white shadow-sm text-green-600" : "text-gray-500"
                }`}
              >
                С планируемыми
              </button>
            </div>
          </div>
        )}

        {isBuildingsPage && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left">Тех. состояние</h3>
              <div className="bg-blue-50/50 p-2 rounded-lg space-y-1">
                {TECH_CONDITIONS.map(item => (
                  <label key={item.id} className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-3 h-3 rounded"
                      checked={filters.selectedTechConditions?.includes(item.id)}
                      onChange={() => {
                        const next = filters.selectedTechConditions.includes(item.id)
                          ? filters.selectedTechConditions.filter(i => i !== item.id)
                          : [...filters.selectedTechConditions, item.id];
                        onFiltersChange({ ...filters, selectedTechConditions: next });
                      }}
                    />
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[11px] text-gray-700">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2 border-t border-gray-200 pt-3 text-left">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                Сейсмика
              </h3>
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 rounded border-gray-300 text-orange-600"
                  checked={filters.showSeismicGrid || false}
                  onChange={(e) => onFiltersChange({ ...filters, showSeismicGrid: e.target.checked })}
                />
                <span className="text-xs text-gray-700 font-medium">Сейсмическая сетка</span>
              </label>
            </div>
            <button 
              onClick={onShowBuildingAnalysis}
              className="w-full py-2.5 bg-slate-800 text-white rounded-lg text-[11px] font-bold hover:bg-slate-700 cursor-pointer"
            >
              🏢 Анализ зданий
            </button>
          </div>
        )}

        {isGeoPage && (
          <div className="space-y-4">
             <div className="space-y-2">
                <h3 className="text-[10px] font-bold text-gray-400 text-left uppercase tracking-wider">Дополнительные слои</h3>
                <div className="bg-gray-50 rounded-lg space-y-2">
                  {GEO_LAYERS.map((layer) => (
                    <label key={layer.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600"
                        checked={filters.activeGeoLayers?.includes(layer.id)}
                        // onChange={(e) => {
                        //   const next = e.target.checked
                        //     ? [...filters.activeGeoLayers, layer.id]
                        //     : filters.activeGeoLayers.filter((id) => id !== layer.id);
                        //   onFiltersChange({ ...filters, activeGeoLayers: next });
                        // }}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          let nextLayers;

                          if (isChecked) {
                            nextLayers = [...filters.activeGeoLayers, layer.id];
                            if (layer.id === "grid") {
                              nextLayers = nextLayers.filter(id => id !== "orgTypeGrid");
                            }
                            if (layer.id === "orgTypeGrid") {
                              nextLayers = nextLayers.filter(id => id !== "grid");
                            }
                          } else {
                            nextLayers = filters.activeGeoLayers.filter((id) => id !== layer.id);
                          }
                          onFiltersChange({ ...filters, activeGeoLayers: nextLayers });
                        }}
                      />
                      <span className="text-xs text-gray-700">{layer.label}</span>
                    </label>
                  ))}
                </div>
              </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-100">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-500 shrink-0">
              <Bed className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-[9px] font-medium text-blue-600 uppercase leading-tight">Коек</div>
              <div className="text-xs font-bold text-blue-900 truncate">
                {summaryData.totalBeds.toLocaleString("ru-RU")}
              </div>
            </div>
          </div>

          <div className={`flex items-center gap-2 p-2 rounded-lg border border-gray-200 ${
            summaryData.avgOccupancy >= 70 ? "bg-orange-50 border-orange-100" : "bg-green-50 border-green-100"
          }`}>
            <div className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 ${
              summaryData.avgOccupancy >= 70 ? "bg-orange-500" : "bg-green-500"
            }`}>
              <TrendingUp className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className={`text-[9px] font-medium uppercase leading-tight ${
                summaryData.avgOccupancy >= 70 ? "text-orange-600" : "text-green-600"
              }`}>Загрузка</div>
              <div className="text-xs font-bold text-gray-800">{summaryData.avgOccupancy}%</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-500 shrink-0">
              <Building2 className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-[9px] font-medium text-slate-500 uppercase leading-tight">Объектов</div>
              <div className="text-xs font-bold text-slate-900">{summaryData.totalMO}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-indigo-50 border border-indigo-100">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-500 shrink-0">
              <Users className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-[9px] font-medium text-indigo-600 uppercase leading-tight">Поступило</div>
              <div className="text-xs font-bold text-indigo-900 truncate">
                {summaryData.totalAdmitted.toLocaleString("ru-RU")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}