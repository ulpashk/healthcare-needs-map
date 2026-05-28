"use client";

import { useState, useMemo } from "react";
import { X, Building2, Calendar } from "lucide-react";
import { shortenHospitalName } from "../../utils/hospital-utils";

export default function BuildingAnalysisModal({ onClose, data, onHospitalClick }) {
  const [activeTab, setActiveTab] = useState("objects");

  const stats = useMemo(() => {
    if (!data || !Array.isArray(data)) return { emergency: 0, seismic: 0, vetkhoe: 0, pre1980: 0 };
    const emergency = data.filter(d => d.bld_emergency).length;
    const seismic = data.filter(d => d.bld_seismic && !d.bld_emergency).length;
    const vetkhoe = data.filter(d => {
      const t = d.bld_tech || '';
      return !d.bld_emergency && !d.bld_seismic && 
        (t.includes('Аварийное') || t.includes('Ветхое') || t.includes('Неудовлетворит'));
    }).length;
    const pre1980 = data.filter(d => d.bld_year && d.bld_year > 1900 && d.bld_year < 1980).length;

    return { emergency, seismic, vetkhoe, pre1980 };
  }, [data]);

  const objectsList = useMemo(() => {
    const getRiskScore = (d) => {
      if (d.bld_emergency) return 4;
      const t = d.bld_tech || '';
      if (t.includes('Аварийное')) return 3;
      if (d.bld_seismic) return 2;
      if (t.includes('Ветхое') || t.includes('Неудовлетворит')) return 1;
      return 0;
    };

    return data
      .map(d => ({ ...d, riskScore: getRiskScore(d) }))
      .filter(d => d.riskScore > 0)
      .sort((a, b) => b.riskScore - a.riskScore);
  }, [data]);

  const districtsStats = useMemo(() => {
    const byDist = {};
    data.forEach(d => {
      const dist = d.district || 'Не указан';
      if (!byDist[dist]) byDist[dist] = { total: 0, riskCount: 0 };
      byDist[dist].total++;
      const t = d.bld_tech || '';
      if (d.bld_emergency || d.bld_seismic || t.includes('Аварийное') || t.includes('Ветхое')) {
        byDist[dist].riskCount++;
      }
    });

    const maxRisk = Math.max(...Object.values(byDist).map((r) => r.riskCount), 1);
    return Object.entries(byDist)
      .sort((a, b) => b[1].riskCount - a[1].riskCount)
      .map(([name, r]) => ({ name, ...r, maxRisk }));
  }, [data]);

  const getRiskUI = (score) => {
    const configs= {
      4: { label: "Аварийное", color: "#7B0000" },
      3: { label: "Аварийное", color: "#B71C1C" },
      2: { label: "Сейсмика", color: "#EF6C00" },
      1: { label: "Ветхое", color: "#827717" },
    };
    return configs[score] || { label: "Норма", color: "#2E7D32" };
  };

  return (
    <div className="absolute top-4 left-[340px] z-50 w-[380px] bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 animate-in fade-in slide-in-from-left-2 flex flex-col max-h-[85vh]">
      <div className="bg-[#37474F] p-3 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-tight">Анализ тех. состояния зданий</span>
        </div>
        <button onClick={onClose} className="hover:bg-slate-600 p-1 rounded-full"><X className="h-5 w-5" /></button>
      </div>

      <div className="p-3 bg-white space-y-4 overflow-y-auto">
        <div className="grid grid-cols-4 gap-1.5">
          <div className="bg-[#B71C1C] text-white p-2 rounded-lg text-center">
            <div className="text-lg font-bold">{stats.emergency}</div>
            <div className="text-[8px] uppercase opacity-80">Аварийных</div>
          </div>
          <div className="bg-[#E65100] text-white p-2 rounded-lg text-center">
            <div className="text-lg font-bold">{stats.seismic}</div>
            <div className="text-[8px] uppercase opacity-80">Сейсмика</div>
          </div>
          <div className="bg-[#827717] text-white p-2 rounded-lg text-center">
            <div className="text-lg font-bold">{stats.vetkhoe}</div>
            <div className="text-[8px] uppercase opacity-80">Ветхих</div>
          </div>
          <div className="bg-[#455A64] text-white p-2 rounded-lg text-center">
            <div className="text-lg font-bold">{stats.pre1980}</div>
            <div className="text-[8px] flex justify-center items-center gap-1 uppercase opacity-80"><Calendar className="w-2 h-2"/> До 1980г</div>
          </div>
        </div>

        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => setActiveTab("objects")}
            className={`flex-1 py-2 text-[11px] font-bold transition-all cursor-pointer ${activeTab === "objects" ? "border-b-2 border-[#37474F] text-[#37474F]" : "text-gray-400"}`}
          >
            По объектам
          </button>
          <button 
            onClick={() => setActiveTab("districts")}
            className={`flex-1 py-2 text-[11px] font-bold transition-all cursor-pointer ${activeTab === "districts" ? "border-b-2 border-[#37474F] text-[#37474F]" : "text-gray-400"}`}
          >
            По районам
          </button>
        </div>

        {activeTab === "objects" && (
          <div className="space-y-2">
            {objectsList.map((obj) => {
              const ui = getRiskUI(obj.riskScore);
              return (
                <div 
                  key={obj.unified_id} 
                  className="flex items-center gap-2 group cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                  onClick={() => onHospitalClick(obj.unified_id)}
                >
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ui.color }} />
                  <div className="text-[10px] font-medium text-gray-700 truncate flex-1" title={obj.name}>
                    {shortenHospitalName(obj.name)}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold text-white uppercase" style={{ backgroundColor: ui.color }}>
                      {ui.label}
                    </span>
                    <span className="text-[9px] text-gray-400">{obj.bld_year}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "districts" && (
          <div className="space-y-3">
            {districtsStats.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="font-medium text-gray-600">{item.name}</span>
                  <span className="text-gray-400 font-bold">{item.riskCount}/{item.total} МО</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#B71C1C] transition-all duration-700" 
                    style={{ width: `${(item.riskCount / item.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}