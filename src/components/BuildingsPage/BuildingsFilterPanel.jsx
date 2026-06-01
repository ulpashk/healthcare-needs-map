import React, { useState, useEffect } from 'react';
import { Search, MapPinned, ChevronDown, RotateCcw, Building2, ShieldAlert, Layers } from 'lucide-react';
import Indicators from '../PmspComponents/MapFilter/Indicators';

const TECH_CONDITIONS = [
  { id: "критично", label: "Критическое", color: "#C62828" },
  { id: "риск", label: "Риск", color: "#EF6C00" },
  { id: "норма", label: "Норма", color: "#2E7D32" },
  { id: "нет данных", label: "Нет данных", color: "#9E9E9E" },
];

const allDistricts = [
  "Все районы", "Алатауский", "Алмалинский", "Ауэзовский",
  "Бостандыкский", "Жетысуский", "Медеуский", "Наурызбайский", "Турксибский",
];

const allLayers = [
  "Все слои", 
  "Зоны обслуживания МО", 
  "Зоны здравоохранения (генплан)", 
  "Планируемые объекты здравоохранения", 
  "Планируемые жилые объекты (ЖКХ)",
];

const allAffiliations = [
  { key: "all", label: "Все принадлежности" },
  { key: "Городская", label: "Городская (УЗ Алматы)" },
  { key: "Республиканская", label: "Республиканская (МЗ РК)" },
  { key: "Ведомственная", label: "Ведомственная (МВД/КНБ)" },
  { key: "Частная", label: "Частная" },
];

export default function BuildingsFilterPanel({
  selectedDistrict, setSelectedDistrict,
  selectedLayers, setSelectedLayers,
  selectedAffiliations, setSelectedAffiliations,
  selectedTechConditions, setSelectedTechConditions,
  searchQuery, setSearchQuery,
  totalCount, totalPopulation, avgPerson, avgVisit,
  onReset
}) {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [filtersHidden, setFiltersHidden] = useState(false);

  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const handleMultiSelect = (item, selectedArray, setSelectedFn, allLabel) => {
    if (item === allLabel) {
      setSelectedFn([allLabel]);
    } else {
      let updated = selectedArray.includes(item)
        ? selectedArray.filter((i) => i !== item)
        : [...selectedArray.filter((i) => i !== allLabel), item];
      if (updated.length === 0) updated = [allLabel];
      setSelectedFn(updated);
    }
  };

  return (
    <div className="flex flex-col max-h-[calc(100vh-100px)] bg-white/95 backdrop-blur-sm rounded-xl border border-gray-100 shadow-2xl overflow-hidden text-xs">
      <div className="sticky top-0 z-20 bg-white/95 p-3 flex items-center justify-between border-b border-gray-50">
        <span className="text-sm font-bold text-gray-800">Фильтры</span>
        <button onClick={() => setFiltersHidden(!filtersHidden)} className="text-gray-500">
          <ChevronDown className={`w-4 h-4 transition-transform ${filtersHidden ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div className={`transition-all duration-500 overflow-y-auto scrollbar-hide ${filtersHidden ? "max-h-0" : "max-h-screen"}`}>
        <div className="p-3 pt-0 space-y-1">
          
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-blue-300 transition-colors"
            />
          </div>

          <div className="relative">
            <div onClick={() => toggleDropdown('district')} className="flex items-center justify-between px-2 py-1.5 border border-gray-200 rounded-lg bg-white cursor-pointer hover:border-blue-300 transition-colors">
              <span className="truncate flex items-center gap-2"><MapPinned className="w-3 h-3 text-blue-500"/> {selectedDistrict.join(", ")}</span>
              <ChevronDown className="w-3 h-3" />
            </div>
            {activeDropdown === 'district' && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg cursor-pointer shadow-xl z-50 max-h-40 overflow-y-auto">
                {allDistricts.map(d => (
                  <label key={d} className="flex items-center px-2 py-1.5 hover:bg-blue-50 cursor-pointer">
                    <input type="checkbox" checked={selectedDistrict.includes(d)} onChange={() => handleMultiSelect(d, selectedDistrict, setSelectedDistrict, "Все районы")} className="mr-2" />
                    {d}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <div onClick={() => toggleDropdown('affiliation')} className="flex items-center justify-between px-2 py-1.5 border border-gray-200 rounded-lg bg-white cursor-pointer hover:border-blue-300 transition-colors">
              <span className="truncate flex items-center gap-2"><Building2 className="w-3 h-3 text-blue-500"/> Принадлежность</span>
              <ChevronDown className="w-3 h-3" />
            </div>
            {activeDropdown === 'affiliation' && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg cursor-pointer shadow-xl z-50 max-h-40 overflow-y-auto">
                {allAffiliations.map(a => (
                  <label key={a.key} className="flex items-center px-2 py-1.5 hover:bg-blue-50 cursor-pointer">
                    <input type="checkbox" checked={selectedAffiliations.includes(a.key)} onChange={() => handleMultiSelect(a.key, selectedAffiliations, setSelectedAffiliations, "all")} className="mr-2" />
                    {a.label}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <div onClick={() => toggleDropdown('layer')} className="flex items-center justify-between px-2 py-1.5 border border-gray-200 rounded-lg bg-white cursor-pointer hover:border-blue-300 transition-colors">
              <span className="truncate flex items-center gap-2"><Layers className="w-3 h-3 text-blue-500"/> Слои карты</span>
              <ChevronDown className="w-3 h-3" />
            </div>
            {activeDropdown === 'layer' && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg cursor-pointer shadow-xl z-50 max-h-40 overflow-y-auto">
                {allLayers.map(l => (
                  <label key={l} className="flex items-center px-2 py-1.5 hover:bg-blue-50 cursor-pointer">
                    <input type="checkbox" checked={selectedLayers.includes(l)} onChange={() => handleMultiSelect(l, selectedLayers, setSelectedLayers, "Все слои")} className="mr-2" />
                    {l}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3"/> Состояние зданий
            </h3>
            <div className="space-y-1.5">
              {TECH_CONDITIONS.map(item => (
                <label key={item.id} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedTechConditions.includes(item.id)}
                    onChange={() => {
                       const next = selectedTechConditions.includes(item.id)
                        ? selectedTechConditions.filter(i => i !== item.id)
                        : [...selectedTechConditions, item.id];
                       setSelectedTechConditions(next);
                    }}
                    className="w-3 h-3 rounded text-blue-600"
                  />
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="group-hover:text-blue-600 transition-colors">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <Indicators 
            totalCount={totalCount} 
            totalPopulation={totalPopulation} 
            avgVisit={avgVisit} 
            avgPerson={avgPerson} 
          />
        </div>
      </div>

      <div className="p-2 bg-gray-50 border-t border-gray-200">
        <button onClick={onReset} className="w-full py-2 flex items-center justify-center gap-2 bg-white border rounded-lg text-gray-500 font-bold hover:bg-gray-100 transition-all shadow-sm">
          <RotateCcw className="w-3.5 h-3.5" /> Сбросить
        </button>
      </div>
    </div>
  );
}