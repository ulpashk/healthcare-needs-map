import React, { useState, useEffect } from 'react';
import { ChartLine, ChevronDown, RotateCcw, Bus, Train } from 'lucide-react';
import PlanningToolList from './PlanningToolList';
import Indicators from '../PmspComponents/MapFilter/Indicators';

export default function GeoFilterPanel({
  selectedDistrict, setSelectedDistrict,
  selectedLayers, setSelectedLayers,
  selectedVisits, setSelectedVisits,
  selectedAffiliations, setSelectedAffiliations,
  totalCount, totalPopulation, avgPerson, avgVisit,
  activeScenario, setActiveScenario,
  onReset, setIsPlanningActive, isPlanningActive, plannedZonesData,
  onZoomTo
}) {
  const [isPlanningOpen, setIsPlanningOpen] = useState(false);
  const [filtersHidden, setFiltersHidden] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const allDistricts = [
    "Все районы", "Алатауский", "Алмалинский", "Ауэзовский",
    "Бостандыкский", "Жетысуский", "Медеуский", "Наурызбайский", "Турксибский",
  ];

  const allVisits = [
    "Все посещения", 
    ">150% критично", 
    "130-150% перегружено", 
    "110-130% выше нормы", 
    "90–110% норма",
    "90% хорошо",
  ];

  const allLayers = [
    "Все слои", 
    // "Зоны обслуживания МО", 
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

  useEffect(() => {
    if (!selectedDistrict || selectedDistrict.length === 0) {
      setSelectedDistrict(["Все районы"]);
    }
  }, [selectedDistrict, setSelectedDistrict]);

  const handleDistrictChange = (city) => {
    if (city === "Все районы") {
      setSelectedDistrict(["Все районы"]);
    } else {
      setSelectedDistrict((prev) => {
        let updated = prev.includes(city)
          ? prev.filter((c) => c !== city)
          : [...prev.filter((c) => c !== "Все районы"), city];
        return updated.length === 0 ? ["Все районы"] : updated;
      });
    }
  };

  const handleVisitChange = (city) => {
    if (city === "Все посещения") {
      setSelectedVisits(["Все посещения"]);
    } else {
      setSelectedVisits((prev) => {
        let updated = prev.includes(city)
          ? prev.filter((c) => c !== city)
          : [...prev.filter((c) => c !== "Все посещения"), city];
        return updated.length === 0 ? ["Все посещения"] : updated;
      });
    }
  };

  const handleLayerChange = (city) => {
    if (city === "Все слои") {
      setSelectedLayers(["Все слои"]);
    } else {
      setSelectedLayers((prev) => {
        let updated = prev.includes(city)
          ? prev.filter((c) => c !== city)
          : [...prev.filter((c) => c !== "Все слои"), city];
        return updated.length === 0 ? ["Все слои"] : updated;
      });
    }
  };

  const handleAffiliationChange = (key) => {
    if (key === "all") {
      setSelectedAffiliations(["all"]);
    } else {
      setSelectedAffiliations((prev) => {
        const filtered = prev.filter((item) => item !== "all");
        
        let updated;
        if (filtered.includes(key)) {
          updated = filtered.filter((item) => item !== key);
        } else {
          updated = [...filtered, key];
        }
        return updated.length === 0 ? ["all"] : updated;
      });
    }
  };

  const labelWithArrow = (children) => (
    <span className="flex items-center space-x-1">
      <span className="text-gray-400">|</span>
      <span>{children}</span>
    </span>
  );

  return (
    <div className="flex flex-col max-h-[calc(100vh-100px)] bg-white/95 backdrop-blur-sm rounded-xl border shadow-lg overflow-hidden scrollbar-hide text-xs">
      
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm ">
          <div className="flex items-center justify-between px-3 py-2 pt-3 font-bold text-gray-800">
            <span className="text-sm">Фильтры</span>
            <button
              onClick={() => setFiltersHidden(!filtersHidden)}
              className="text-gray-600 hover:text-gray-900 transition-transform duration-300"
            >
              <svg
                className={`w-4 h-4 transform transition-transform duration-300 ${filtersHidden ? "" : "rotate-180"}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <div className="p-2 md:px-3">
            <div className="flex flex-col gap-1">
              
              {/* District Filter */}
              <div className="relative">
                <div
                  onClick={() => toggleDropdown('district')}
                  className="flex items-center justify-between px-2 py-1.5 border rounded-md bg-white text-[11px] cursor-pointer hover:border-blue-300"
                >
                  <span className="truncate pr-1">
                    {selectedDistrict.join(", ")}
                  </span>
                  <svg className={`w-3 h-3 shrink-0 transition-transform ${activeDropdown === 'district' ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M19 9l-7 7-7-7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {activeDropdown === 'district' && (
                  <div className="absolute top-full left-0 right-0 mt-0.5 bg-white border rounded-md shadow-xl z-50 max-h-40 overflow-y-auto text-[10px]">
                    {allDistricts.map((district) => (
                      <label key={district} className="flex items-center px-2 py-1 hover:bg-blue-50 cursor-pointer">
                        <input type="checkbox" checked={selectedDistrict.includes(district)} onChange={() => handleDistrictChange(district)} className="w-3 h-3 mr-2" />
                        {district}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Visit Filter */}
              <div className="relative">
                <div
                  onClick={() => toggleDropdown('visit')}
                  className="flex items-center justify-between px-2 py-1.5 border rounded-md bg-white text-[11px] cursor-pointer hover:border-blue-300"
                >
                  <span className="truncate pr-1">
                    {selectedVisits.join(", ") || "Выберите посещение"}
                  </span>
                  <svg className={`w-3 h-3 shrink-0 transition-transform ${activeDropdown === 'visit' ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M19 9l-7 7-7-7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {activeDropdown === 'visit' && (
                  <div className="absolute top-full left-0 right-0 mt-0.5 bg-white border rounded-md shadow-xl z-50 max-h-40 overflow-y-auto text-[10px]">
                    {allVisits.map((visit) => (
                      <label key={visit} className="flex items-center px-2 py-1 hover:bg-blue-50 cursor-pointer">
                        <input type="checkbox" checked={selectedVisits.includes(visit)} onChange={() => handleVisitChange(visit)} className="w-3 h-3 mr-2" />
                        {visit}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Layer Filter */}
              <div className="relative">
                <div
                  onClick={() => toggleDropdown('layer')}
                  className="flex items-center justify-between px-2 py-1.5 border rounded-md bg-white text-[11px] cursor-pointer hover:border-blue-300"
                >
                  <span className="truncate pr-1">
                    {selectedLayers.join(", ")}
                  </span>
                  <svg className={`w-3 h-3 shrink-0 transition-transform ${activeDropdown === 'layer' ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M19 9l-7 7-7-7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {activeDropdown === 'layer' && (
                  <div className="absolute top-full left-0 right-0 mt-0.5 bg-white border rounded-md shadow-xl z-50 max-h-40 overflow-y-auto text-[10px]">
                    {allLayers.map((layer) => (
                      <label key={layer} className="flex items-center px-2 py-1 hover:bg-blue-50 cursor-pointer">
                        <input type="checkbox" checked={selectedLayers.includes(layer)} onChange={() => handleLayerChange(layer)} className="w-3 h-3 mr-2" />
                        {layer}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Affiliation Filter */}
              <div className="relative">
                <div
                  onClick={() => toggleDropdown('affiliation')}
                  className="flex items-center justify-between px-2 py-1.5 border rounded-md bg-white text-[11px] cursor-pointer hover:border-blue-300"
                >
                  <span className="truncate pr-1">
                    {selectedAffiliations.includes("all") 
                      ? "Все принадлежности" 
                      : allAffiliations
                          .filter(a => selectedAffiliations.includes(a.key))
                          .map(a => a.label)
                          .join(", ") || "Выберите принадлежность"
                    }
                  </span>
                  <svg className={`w-3 h-3 shrink-0 transition-transform ${activeDropdown === 'affiliation' ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M19 9l-7 7-7-7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {activeDropdown === 'affiliation' && (
                  <div className="absolute top-full left-0 right-0 mt-0.5 bg-white border rounded-md shadow-xl z-50 max-h-40 overflow-y-auto text-[10px]">
                    {allAffiliations.map((affiliation) => (
                      <label key={affiliation.key} className="flex items-center px-2 py-1 hover:bg-blue-50 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={selectedAffiliations.includes(affiliation.key)}  
                          onChange={() => handleAffiliationChange(affiliation.key)}    
                          className="w-3 h-3 mr-2" 
                        />
                        {affiliation.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          className={`flex flex-col min-h-0 transition-all duration-500 ease-in-out ${
            filtersHidden ? "max-h-0 opacity-0 overflow-hidden" : "max-h-screen opacity-100"
          }`}
        >

          {!isPlanningActive &&
            <div className="flex-none bg-white z-10 shadow-sm relative">
              <Indicators
                totalCount={totalCount}
                totalPopulation={totalPopulation}
                avgVisit={avgVisit}
                avgPerson={avgPerson}
              />
            </div>
          }

          <div className="p-3 border-t bg-gray-50/30">
            <h3 className="font-bold text-gray-400 text-left uppercase text-[10px] mb-2">Сценарий анализа</h3>
            <div className="flex gap-1">
              {[
                { id: 'current', label: 'Текущее' },
                { id: 'planned', label: 'С планами' },
                { id: '2028', label: '2026-2028' },
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveScenario(s.id)}
                  className={`flex-1 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
                    activeScenario === s.id 
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-800 shadow-sm' 
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. ТРАНСПОРТ (Чекбокс) */}
          {/* <div className="px-4 py-2 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4" />
              <span className="text-[11px] text-gray-700 group-hover:text-black transition-colors">Маршруты ОТ (автобус / троллейбус)</span>
            </label>
            <div className="flex items-center gap-4 ml-6">
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                <div className="w-6 h-1 rounded bg-blue-500"></div> <span>Автобус</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                <div className="w-6 h-1 rounded bg-purple-600"></div> <span>Троллейбус</span>
              </div>
            </div>
          </div> */}

          {/* 4. ИНСТРУМЕНТ ПЛАНИРОВАНИЯ (Аккордеон) */}
          <div className="mt-2 border-t">
            <button 
              onClick={() => setIsPlanningActive(!isPlanningActive)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 flex items-center justify-between transition-colors shadow-inner"
            >
              <div className="flex items-center gap-2">
                <ChartLine className="w-4 h-4" />
                <span className="font-bold text-[12px]">Инструмент планирования</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isPlanningOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isPlanningActive &&
              <PlanningToolList 
                data={plannedZonesData}
                onZoomTo={onZoomTo}
              />
            }
          </div>
        </div>

        <div className="p-2 bg-gray-50 border-t shrink-0">
          <button 
            onClick={onReset}
            className="w-full py-2 flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-lg text-gray-500 font-bold hover:bg-gray-100 active:scale-95 transition-all shadow-sm"
          >
            <RotateCcw className="w-4 h-4 text-gray-400" />
            <span>Сбросить фильтры</span>
          </button>
        </div>
    </div>
  );
}