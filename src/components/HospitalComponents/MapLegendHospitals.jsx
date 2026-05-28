"use client";

import { Bed, Ruler } from "lucide-react";


export default function MapLegend({ mapMode }) {
  const loadLegend = [
    { color: "#7B0000", label: ">100% перегружено" },
    { color: "#C62828", label: "92–100% очень высокая" },
    { color: "#EF6C00", label: "85–92% высокая" },
    { color: "#2E7D32", label: "70–85% норма" },
    { color: "#FDD835", label: "50–70% низкая" },
    { color: "#9E9E9E", label: "<50% нет данных" },
  ];

  const buildingsLegend = [
    { color: "#7B0000", label: "Аварийное (критично)" },
    { color: "#B71C1C", label: "Аварийное (снос)" },
    { color: "#EF6C00", label: "Сейсмоусиление" },
    { color: "#F9A825", label: "Неудовлетворительное" },
    { color: "#2E7D32", label: "Исправное" },
    { color: "#9E9E9E", label: "Нет данных" },
  ];

  const currentLegend = mapMode === "buildings" ? buildingsLegend : loadLegend;
  const title = mapMode === "buildings" ? "Здания — тех. состояние" : mapMode === "load" ? "Стационары — загруженность" : "Стационары — геоанализ";

  return (
    <div className="absolute bottom-6 right-4 z-20 w-64 bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 animate-in fade-in slide-in-from-bottom-2">
      <div className="bg-[#1565C0] p-2.5 px-4 flex items-center gap-2 text-white">
        <Bed className="h-4 w-4" />
        <span className="text-xs font-bold tracking-wide">{title}</span>
      </div>

      <div className="p-4 space-y-2.5">
        <div className="text-[11px] text-gray-500 font-medium mb-1">
          Цвет — {mapMode === "buildings" ? "тех. состояние" : "% занятых коек"}
        </div>
        
        {currentLegend.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div 
              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" 
              style={{ backgroundColor: item.color }} 
            />
            <span className="text-[11px] text-gray-700 font-medium leading-none">
              {item.label}
            </span>
          </div>
        ))}

        <div className="pt-3 mt-1 border-t border-gray-100 space-y-2">
          <div className="flex items-center gap-2 text-gray-400">
            <Ruler className="h-3.5 w-3.5 rotate-45" />
            <span className="text-[10px] italic">Размер = число коек</span>
          </div>
          <div className="text-[10px] text-gray-400 pl-5">
            Обводка — летальность {'>'}2%
          </div>
        </div>
      </div>
    </div>
  );
}