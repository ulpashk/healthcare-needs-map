import { useEffect, useState } from "react";
import MapFilterIndicators from "./Indicators";
import Analytics from "./Analytics";

export default function MapFilter({
  setSelectedDistrict,
  setSelectedVisits,
  setSelectedLayers,
  setSelectedAffiliations,
  selectedDistrict,
  selectedVisits,
  selectedLayers,
  selectedAffiliations,
  totalCount,
  totalPopulation, 
  avgVisit, 
  avgPerson,
  setActiveModal, 
  activeModal,
}) {
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

  const handleReset = () => {
    setSelectedDistrict(["Все районы"]);
    setSelectedVisits(["Все посещения"]);
    setSelectedLayers(["Все слои"]);
    setSelectedAffiliations(["all"]);
    if (setActiveModal) setActiveModal(null);
  };

  return (
    <div className="relative">
      <div className="flex flex-col max-h-[calc(100vh-100px)] bg-white/95 backdrop-blur-sm rounded-xl border shadow-lg overflow-y-auto overflow-x-hidden scrollbar-hide text-xs">
        
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
          <div className="flex-none bg-white z-10 shadow-sm relative">
            <MapFilterIndicators
              totalCount={totalCount}
              totalPopulation={totalPopulation}
              avgVisit={avgVisit}
              avgPerson={avgPerson}
            />
            <Analytics 
              activeModal={activeModal}
              setActiveModal={setActiveModal}
              onReset={handleReset} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}