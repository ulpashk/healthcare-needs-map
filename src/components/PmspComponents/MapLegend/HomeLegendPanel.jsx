import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';

export default function HomeLegendPanel({ isMinimized, setIsMinimized }) {

  return (
    <div className={`w-[300px] bg-white shadow-2xl rounded-xl border border-gray-200 overflow-hidden transition-all duration-300 flex flex-col ${isMinimized ? 'h-[40px]' : 'max-h-[85vh]'}`}>
      
      <div 
        onClick={() => setIsMinimized(isMinimized)}
        className="bg-[#1565C0] p-2.5 px-4 flex items-center justify-between text-white cursor-pointer hover:bg-[#1256a8] shrink-0"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          <span className="font-bold text-[11px] uppercase tracking-wider">Легенда карты ПМСП</span>
        </div>
        {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </div>

      {!isMinimized && (
        <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar">
          
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">Цвет — посещаемость (мощность %)</h4>
            <div className="space-y-1.5">
              <LegendItem color="#C62828" label=">150% критично" />
              <LegendItem color="#EF6C00" label="130–150% перегружено" />
              <LegendItem color="#FDD835" label="110–130% выше нормы" />
              <LegendItem color="#66BB6A" label="90–110% норма" />
              <LegendItem color="#2E7D32" label="<90% хорошо" />
              <LegendItem color="#9E9E9E" label="Нет данных" />
            </div>
          </div>

          <div className="space-y-1.5 border-t pt-3">
            <div className="flex items-center gap-2 text-[11px] text-gray-700">
              <div className="w-3.5 h-3.5 rounded-full bg-gray-500"></div>
              <span>Действующие ПМСП</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-700 font-bold">
              <div className="w-3.5 h-3.5 flex items-center justify-center text-black text-sm">✚</div>
              <span>Планируемые ПМСП</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-700">
              <div className="w-6 h-0.5 bg-blue-800"></div>
              <span className="text-gray-400 font-medium">Граница г. Алматы</span>
            </div>
          </div>

          <div className="space-y-2 border-t pt-3">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">Планируемые объекты здрав.</h4>
            <div className="space-y-1.5">
              <LegendItem color="#2E7D32" label="Новая ПМСП — закрывает дефицит" />
              <LegendItem color="#F57F17" label="Потенциально — ПСД разрабатывается" />
              <LegendItem color="#1565C0" label="Частично — улучшение существующей" />
              <LegendItem color="#757575" label="Не ПМСП (больница, прочее)" />
            </div>
            <p className="text-[9px] text-gray-400 italic mt-1 pl-5">
              Крупный маркер = ПМСП · мелкий = прочее
            </p>
          </div>

          <div className="space-y-2 border-t pt-3">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">Планируемые жилые дома (МЖКХ)</h4>
            <div className="flex items-center gap-2 text-[11px] text-gray-700">
              <div className="w-5 h-5 rounded-full bg-[#1976D2] flex items-center justify-center text-[10px] text-white shadow-sm shrink-0">🏠</div>
              <span>МЖК / жилой дом (133 объекта)</span>
            </div>
            <p className="text-[9px] text-gray-400 italic pl-7">Реестр МЖКХ г. Алматы</p>
          </div>

          <div className="space-y-2 border-t pt-3">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">Генплан здравоохранения</h4>
            <div className="flex items-center gap-2 text-[11px] text-gray-700">
              <div className="w-5 h-3.5 border-2 border-dashed border-[#E91E63] bg-[#E91E63]/10 rounded-sm shrink-0"></div>
              <span>Зоны резервирования (81 зона)</span>
            </div>
            <p className="text-[9px] text-gray-400 italic pl-7 leading-tight">Alagenplan — функциональные зоны</p>
          </div>

        </div>
      )}
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-gray-700 leading-tight">
      <div className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: color }}></div>
      <span>{label}</span>
    </div>
  );
}