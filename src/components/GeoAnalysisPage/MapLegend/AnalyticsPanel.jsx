import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

export default function GeoLegendPanel() {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className={`w-[320px] bg-white shadow-2xl rounded-t-xl border border-gray-300 overflow-hidden transition-all duration-300 flex flex-col ${isMinimized ? 'h-[42px]' : 'h-fit'}`}>
      
      {/* HEADER */}
      <div 
        onClick={() => setIsMinimized(!isMinimized)}
        className="bg-[#1967d2] p-2.5 px-4 flex items-center justify-between text-white cursor-pointer hover:bg-[#1557b0] shrink-0"
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4" />
          <span className="font-bold text-[12px] uppercase tracking-wide">Аналитический гео-расчёт</span>
        </div>
        {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </div>

      {!isMinimized && (
        <div className="p-4 px-6 overflow-y-auto max-h-[550px] custom-classic-scrollbar space-y-4">
          
          {/* SECTION 1: Шаговая доступность */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold text-[#5f6368] uppercase tracking-tight">
              Шаговая доступность (адресная сетка)
            </h4>
            <div className="space-y-2">
              <LegendItem color="#2e7d32" label="≤10 мин (≤800м)" isSquare />
              <LegendItem color="#66bb6a" label="10–15 мин (800–1200м) — норма" isSquare />
              <LegendItem color="#fdd835" label="15–20 мин (1200–1600м) — за нормой" isSquare />
              <LegendItem color="#c62828" label=">20 мин (>1600м) — критически далеко" isSquare />
            </div>
            <p className="text-[10px] text-gray-400 italic text-center pt-1">
              Каждая ячейка ≈ 100–250м · контуры — зоны ПМСП
            </p>
          </div>

          <hr className="border-black opacity-100" />

          {/* SECTION 2: Маркеры */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 text-[12px] text-[#3c4043]">
              <div className="w-4 h-4 rounded-full bg-[#70757a]"></div>
              <span>Действующие ПМСП</span>
            </div>
            <div className="flex items-center gap-3 text-[12px] font-bold text-black">
              <span className="text-lg leading-none w-4 text-center">✚</span>
              <span>Планируемые ПМСП</span>
            </div>
            <div className="flex items-center gap-3 text-[12px] text-[#3c4043]">
              <span className="text-lg leading-none w-4 text-center text-gray-500">✕</span>
              <span>Рекоменд. точка размещения</span>
            </div>
            <div className="flex items-center gap-3 text-[12px] text-[#3c4043]">
              <div className="w-8 h-[2px] bg-[#1a237e]"></div>
              <span className="text-gray-400">Граница г. Алматы</span>
            </div>
          </div>

          <hr className="border-black opacity-100" />

          {/* SECTION 3: Планируемые объекты здрав. */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-[#5f6368] uppercase text-center">
              Планируемые объекты здрав.
            </h4>
            <div className="space-y-2">
              <LegendItem color="#2e7d32" label="Новая ПМСП — закрывает дефицит" />
              <LegendItem color="#ef6c00" label="Потенциально — ПСД разрабатывается" />
              <LegendItem color="#1967d2" label="Частично — улучшение существующей" />
              <LegendItem color="#70757a" label="Не ПМСП (больница, прочее)" />
            </div>
            <p className="text-[10px] text-gray-400 italic text-center">
              Крупный маркер = ПМСП · мелкий = прочее
            </p>
          </div>

          <hr className="border-black opacity-100" />

          {/* SECTION 4: ЖКХ */}
          <div className="space-y-3 pb-2">
            <h4 className="text-[11px] font-bold text-[#5f6368] uppercase text-center">
              Планируемые жилые дома (МЖКХ)
            </h4>
          </div>

        </div>
      )}

      <style jsx>{`
        /* Классический серый скроллбар как на первом фото */
        .custom-classic-scrollbar::-webkit-scrollbar {
          width: 12px;
        }
        .custom-classic-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          box-shadow: inset 1px 0 0 #e0e0e0;
        }
        .custom-classic-scrollbar::-webkit-scrollbar-thumb {
          background: #aaaaaa;
          border: 2px solid #f1f1f1;
          border-radius: 4px;
        }
        .custom-classic-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #888888;
        }
      `}</style>
    </div>
  );
}

function LegendItem({ color, label, isSquare = false }) {
  return (
    <div className="flex items-center gap-3 text-[12px] text-[#3c4043] leading-tight">
      <div 
        className={`${isSquare ? 'w-4 h-4 rounded-[2px]' : 'w-4 h-4 rounded-full'} shrink-0`} 
        style={{ backgroundColor: color }}
      ></div>
      <span>{label}</span>
    </div>
  );
}