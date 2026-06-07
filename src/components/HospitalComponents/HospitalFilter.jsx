import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Building2, TrendingUp, ChevronDown, ChevronUp, Bed, Users, MapIcon, Stethoscope, Landmark } from 'lucide-react';

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

const OWN_TYPE_OPTIONS = [
  { id: "Городская", label: "Городская (УЗ Алматы)", color: "#1565C0" },
  { id: "Республиканская", label: "Республиканская (МЗ РК)", color: "#2E7D32" },
  { id: "Ведомственная", label: "Ведомственная", color: "#E65100" },
  { id: "Частная", label: "Частная", color: "#6A1B9A" },
];

export default function HospitalFilter({ facilities, allFacilities, filters, onFiltersChange, onShowBuildingAnalysis }) {
  const [expandedSections, setExpandedSections] = useState({ tech: false, orgTypes: false,
    ownership: false });
  const location = useLocation();
  const isGeoPage = location.pathname.includes('geo-analysis');
  const isBuildingsPage = location.pathname.includes('buildings');

  const facilityTypeOptions = useMemo(() => {
    const types = [...new Set(allFacilities.map(f => f.org_type).filter(Boolean))];
    return types.sort().map(t => ({ id: t, label: t }));
  }, [allFacilities]);

  const profileOptions = useMemo(() => {
    const allProfiles = allFacilities.flatMap(f => f.profile_groups || []);
    const uniqueProfiles = [...new Set(allProfiles)].filter(Boolean);
    return uniqueProfiles.sort().map(p => ({ id: p, label: p }));
  }, [allFacilities]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleToggleArrayFilter = (field, value) => {
    const currentValues = filters[field] || [];
    const nextValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    onFiltersChange({ ...filters, [field]: nextValues });
  };

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
          <div className="space-y-2">
            <FilterSection 
              title="Техническое состояние" 
              isOpen={expandedSections.tech} 
              onToggle={() => toggleSection('tech')}
            >
              {TECH_CONDITIONS.map(opt => (
                <CheckboxItem 
                  key={opt.id} label={opt.label} color={opt.color}
                  checked={filters.selectedTechConditions?.includes(opt.id)}
                  onChange={() => handleToggleArrayFilter('selectedTechConditions', opt.id)}
                />
              ))}
            </FilterSection>
            <FilterSection 
              title="Типы организаций" 
              isOpen={expandedSections.orgTypes} 
              onToggle={() => toggleSection('orgTypes')}
            >
              {facilityTypeOptions.map(opt => (
                <CheckboxItem 
                  key={opt.id} label={opt.label} 
                  checked={filters.facilityTypes?.includes(opt.id)}
                  onChange={() => handleToggleArrayFilter('facilityTypes', opt.id)}
                />
              ))}
            </FilterSection>

            <FilterSection 
              title="Профили медицинской помощи" 
              isOpen={expandedSections.profiles} 
              onToggle={() => toggleSection('profiles')}
            >
              {profileOptions.map(opt => (
                <CheckboxItem 
                  key={opt.id} label={opt.label} 
                  checked={filters.profileGroups?.includes(opt.id)}
                  onChange={() => handleToggleArrayFilter('profileGroups', opt.id)}
                />
              ))}
            </FilterSection>

            {/* 3. Принадлежность */}
            <FilterSection 
              title="Принадлежность" 
              isOpen={expandedSections.ownership} 
              onToggle={() => toggleSection('ownership')}
            >
              {OWN_TYPE_OPTIONS.map(opt => (
                <CheckboxItem 
                  key={opt.id} label={opt.label} color={opt.color}
                  checked={filters.ownTypes?.includes(opt.id)}
                  onChange={() => handleToggleArrayFilter('ownTypes', opt.id)}
                />
              ))}
            </FilterSection>

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

const FilterSection = ({ title, icon, children, isOpen, onToggle }) => (
  <div className="border border-gray-100 rounded-lg overflow-hidden">
    <button onClick={onToggle} className="w-full flex items-center justify-between p-2.5 bg-gray-50/50 hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-2 text-gray-600">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-tight">{title}</span>
      </div>
      <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    {isOpen && <div className="p-2 space-y-1.5 bg-white border-t border-gray-50 max-h-48 overflow-y-auto scrollbar-hide">{children}</div>}
  </div>
);

const CheckboxItem = ({ label, checked, onChange, color }) => (
  <label className="flex items-center gap-2 cursor-pointer group">
    <input type="checkbox" checked={checked} onChange={onChange} className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-0" />
    {color && <div className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor: color}} />}
    <span className="text-[11px] text-gray-700 group-hover:text-blue-600 truncate">{label}</span>
  </label>
);