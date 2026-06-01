import React from "react";
import { X, Search, ChevronRight, ArrowLeft, LocateFixed, LayoutGrid, Building2 } from "lucide-react";
import { getMoSettings } from "../../constants/mo-config"; 

export default function OrgTypeGridPanel({ 
  onClose, 
  hospitals, 
  selectedType, 
  onSelectType,
  onHospitalClick 
}) {
  
  const typeCounts = hospitals.reduce((acc, h) => {
    acc[h.org_type] = (acc[h.org_type] || 0) + 1;
    return acc;
  }, {});

  const allTypes = Object.keys(typeCounts).sort();

  const filteredHospitals = selectedType 
    ? hospitals.filter(h => h.org_type === selectedType)
    : [];

  const hospitalsInType = selectedType ? hospitals.filter(h => h.org_type === selectedType) : [];
  const settings = selectedType ? getMoSettings(selectedType) : null;

  const coveredCount = new Set(hospitalsInType.map(h => h.district)).size;
  const avgLoad = hospitalsInType.length > 0 
    ? Math.round(hospitalsInType.reduce((acc, h) => acc + (h.pct_occupied || 0), 0) / hospitalsInType.length)
    : 0;
  
  return (
    <div className="absolute top-4 right-4 z-50 w-80 bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-blue-200 animate-in fade-in slide-in-from-right-4">
      <div className="bg-blue-800 p-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          {selectedType ? (
            <button 
              onClick={() => onSelectType(null)} 
              className="p-1 -ml-1 hover:bg-blue-700 rounded-full transition-colors flex items-center justify-center"
              title="Назад к списку типов"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span className="text-xs font-bold leading-tight">
            {selectedType ? "Назад к выбору типа" : "Доступность по типу МО"}
          </span>
        </div>
        <button onClick={onClose} className="hover:bg-blue-700 p-1 rounded-full transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-2.5 bg-blue-50 border-b border-blue-100">
        {!selectedType ? (
          <p className="text-[10px] text-blue-900 leading-tight">Выберите тип МО для анализа доступности</p>
        ) : (
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[12px] font-bold text-blue-900">{selectedType}</span>
              <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase">
                {settings?.mode === 'territorial' ? '📍 Территориальный' : 
                 settings?.mode === 'zonal' ? '🏘 Зональный' : '🏢 Мощностной'}
              </span>
            </div>
            
            {settings?.mode === 'territorial' && (
              <div className="flex gap-3 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-600"/> ≤{settings.near/1000}км</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"/> ≤{settings.far/1000}км</span>
              </div>
            )}

            {settings?.mode === 'zonal' && (
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-600">Покрытие: <b className="text-green-600">{coveredCount} районов</b></span>
              </div>
            )}

            {settings?.mode === 'capacity' && (
              <div className="flex justify-between items-center text-[11px] pt-1">
                <span className="text-gray-600">Ср. нагрузка по городу: 
                  <b className={avgLoad > 90 ? "text-red-600" : "text-green-600"}> {avgLoad}%</b>
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 scrollbar-hide">
        {!selectedType ? (
          <div className="divide-y divide-gray-100">
            {allTypes.map(type => {
              const typeSettings = getMoSettings(type);
              const mode = typeSettings?.mode;

              let IconComponent = LocateFixed;
              let iconColor = "text-blue-500";

              if (mode === 'zonal') {
                IconComponent = LayoutGrid;
                iconColor = "text-orange-500";
              } else if (mode === 'capacity') {
                IconComponent = Building2;
                iconColor = "text-slate-500";
              } else {
                iconColor = "text-green-600";
              }

              return (
                <button 
                  key={type}
                  onClick={() => onSelectType(type)}
                  className="w-full flex items-center justify-between p-3 hover:bg-blue-50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`${iconColor} shrink-0`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-semibold text-gray-700 truncate">
                        {type}
                      </span>
                      <span className="text-[8px] text-gray-400 uppercase font-medium">
                        {mode === 'territorial' ? 'территориальный' : 
                        mode === 'zonal' ? 'зональный' : 'мощностной'}
                      </span>
                    </div>
                  </div>

                  <span className="bg-gray-100 text-gray-600 text-[9px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                    {typeCounts[type]}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            <div className="p-2 bg-gray-200 text-[9px] font-bold text-gray-500 uppercase tracking-widest px-3">
              Список объектов ({filteredHospitals.length})
            </div>
            {filteredHospitals.map(h => (
              <button 
                key={h.unified_id}
                onClick={() => onHospitalClick(h)}
                className="w-full p-3 hover:bg-blue-50 transition-colors text-left flex items-center justify-between group"
              >
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-gray-800 leading-tight truncate">{h.name}</div>
                  <div className="text-[10px] text-gray-500">{h.district} · {h.total_beds} коек</div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}