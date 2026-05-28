import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

export default function GeoLegendPanel() {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className={`w-[300px] bg-white shadow-2xl rounded-xl border border-gray-200 overflow-hidden transition-all duration-300 ${isMinimized ? 'h-[42px]' : 'h-auto'}`}>
      
      {/* HEADER (Кликабельный для сворачивания) */}
      <div 
        onClick={() => setIsMinimized(!isMinimized)}
        className="bg-[#1565C0] p-2.5 px-4 flex items-center justify-between text-white cursor-pointer hover:bg-[#1256a8]"
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4" />
          <span className="font-bold text-[11px] uppercase tracking-wider">Аналитический гео-расчёт</span>
        </div>
        {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </div>

      {!isMinimized && (
        <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
          
          {/* SECTION 1: Шаговая доступность */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase">Шаговая доступность (адресная сетка)</h4>
            <div className="space-y-1.5">
              <LegendItem color="#2E7D32" label="≤10 мин (≤800м)" isSquare />
              <LegendItem color="#66BB6A" label="10–15 мин (800–1200м) — норма" isSquare />
              <LegendItem color="#FDD835" label="15–20 мин (1200–1600м) — за нормой" isSquare />
              <LegendItem color="#C62828" label=">20 мин (>1600м) — критически далеко" isSquare />
            </div>
            <p className="text-[9px] text-gray-400 italic mt-1">Каждая ячейка ≈ 100–250м · контуры — зоны ПМСП</p>
          </div>

          {/* SECTION 2: Маркеры */}
          <div className="space-y-1.5 border-t pt-3">
            <div className="flex items-center gap-2 text-[11px] text-gray-700">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span>Действующие ПМСП</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-700 font-bold">
              <div className="w-3 h-3 flex items-center justify-center text-black text-sm">✚</div>
              <span>Планируемые ПМСП</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-700">
              <div className="w-3 h-3 flex items-center justify-center text-gray-500 text-xs font-bold">✕</div>
              <span>Рекоменд. точка размещения</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-700">
              <div className="w-6 h-0.5 bg-blue-800"></div>
              <span className="text-gray-400">Граница г. Алматы</span>
            </div>
          </div>

          {/* SECTION 3: Планируемые объекты здрав. */}
          <div className="space-y-2 border-t pt-3">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase">Планируемые объекты здрав.</h4>
            <div className="space-y-1.5">
              <LegendItem color="#2E7D32" label="Новая ПМСП — закрывает дефицит" />
              <LegendItem color="#F57F17" label="Потенциально — ПСД разрабатывается" />
              <LegendItem color="#1565C0" label="Частично — улучшение существующей" />
              <LegendItem color="#757575" label="Не ПМСП (больница, прочее)" />
            </div>
            <p className="text-[9px] text-gray-400 italic mt-1 pl-5">Крупный маркер = ПМСП · мелкий = прочее</p>
          </div>

          {/* SECTION 4: ЖКХ */}
          <div className="space-y-2 border-t pt-3">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase">Планируемые жилые дома (МЖКХ)</h4>
            <div className="flex items-center gap-2 text-[11px] text-gray-700">
              <div className="w-5 h-5 rounded-full bg-[#1976D2] flex items-center justify-center text-[10px] text-white shadow-sm">🏠</div>
              <span>МЖК / жилой дом (133 объекта)</span>
            </div>
            <p className="text-[9px] text-gray-400 italic pl-7">Реестр МЖКХ г. Алматы</p>
          </div>

          {/* SECTION 5: Генплан */}
          <div className="space-y-2 border-t pt-3">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase">Генплан здравоохранения</h4>
            <div className="flex items-center gap-2 text-[11px] text-gray-700">
              <div className="w-5 h-3.5 border-2 border-dashed border-[#E91E63] bg-[#E91E63]/10 rounded-sm"></div>
              <span>Зоны резервирования (81 зона)</span>
            </div>
            <p className="text-[9px] text-gray-400 italic pl-7">Alagenplan — функциональные зоны</p>
          </div>

        </div>
      )}
    </div>
  );
}

// Вспомогательный компонент для строк легенды
function LegendItem({ color, label, isSquare = false }) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-gray-700 leading-tight">
      <div 
        className={`${isSquare ? 'w-4 h-3 rounded-[2px]' : 'w-3 h-3 rounded-full'} shrink-0 shadow-sm`} 
        style={{ backgroundColor: color }}
      ></div>
      <span>{label}</span>
    </div>
  );
}