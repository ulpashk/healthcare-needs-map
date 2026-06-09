import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Layout, 
  Ruler, 
  Hospital, 
  Home, 
  SquareDashed,
  Building2
} from 'lucide-react';

export default function BuildingLegend() {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className={`w-[320px] bg-white shadow-2xl rounded-t-xl border border-gray-300 overflow-hidden transition-all duration-300 flex flex-col text-left ${isMinimized ? 'h-[42px]' : 'h-fit'}`}>
      
      {/* HEADER */}
      <div 
        onClick={() => setIsMinimized(!isMinimized)}
        className="bg-[#1967d2] p-2.5 px-4 flex items-center justify-between text-white cursor-pointer hover:bg-[#1557b0] shrink-0"
      >
        <div className="flex items-center gap-2">
          <Layout className="w-4 h-4" />
          <span className="font-bold text-[14px]">Состояние зданий</span>
        </div>
        {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </div>

      {!isMinimized && (
        <div className="p-4 px-6 overflow-y-auto max-h-[550px] custom-classic-scrollbar space-y-4">
          
          {/* SECTION 1: Тех. состояние */}
          <div className="space-y-2.5 text-left">
            <h4 className="text-[11px] font-bold text-[#5f6368]">
              Тех. состояние здания (комплексная оценка)
            </h4>
            <div className="space-y-2">
              <LegendItem color="#d32f2f" label="Критично — аварийное; сейсмо; износ≥70%+возраст≥40 лет; >60 лет без ремонта" />
              <LegendItem color="#ef6c00" label="Риск — износ≥60%; износ≥50%+возраст≥30 лет; возраст≥40 лет без ремонта" />
              <LegendItem color="#2e7d32" label="Норма — свежий кап.ремонт / исправное / строительство запланировано" />
              {/* <LegendItem color="#1967d2" label="Генплан — реконструкция/строительство" /> */}
              <LegendItem color="#909daf" label="Нет данных" />
            </div>
            {/* <div className="flex items-center gap-2 pt-1">
              <Ruler className="w-4 h-4 text-gray-400" />
              <span className="text-[12px] text-gray-500">Размер = площадь здания</span>
            </div> */}
          </div>

          <hr className="border-gray-100" />

          {/* SECTION 2: Планируемые объекты здрав. */}
          {/* <div className="space-y-3">
            <h4 className="text-[12px] font-bold text-[#5f6368]">
              Планируемые объекты здрав.
            </h4>
            <div className="space-y-2.5">
              <LegendItemWithIcon color="#2e7d32" label="Новая ПМСП — закрывает дефицит" icon={<Building2 className="w-3 h-3 text-purple-400" />} />
              <LegendItemWithIcon color="#ef6c00" label="Потенциально — ПСД разрабатывается" icon={<Building2 className="w-3 h-3 text-purple-400" />} />
              <LegendItemWithIcon color="#1967d2" label="Частично — улучшение существующей" icon={<Building2 className="w-3 h-3 text-purple-400" />} />
              <LegendItemWithIcon color="#757575" label="Не ПМСП (больница, прочее)" icon={<Hospital className="w-3 h-3 text-red-400" />} />
            </div>
          </div> */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-[#f29900] border-2 border-white flex items-center justify-center shadow-md shrink-0">
                <span className="text-white font-bold text-[20px] leading-none mb-1">+</span>
              </div>              
              <span className="text-[13px] text-[#3c4043]">
                Планируемые объекты здрав.
              </span>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* SECTION 3: МЖКХ */}
          <div className="space-y-2">
            <h4 className="text-[12px] font-bold text-[#5f6368]">
              Планируемые жилые дома (МЖКХ)
            </h4>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-[#1967d2] flex items-center justify-center border border-white">
                {/* <Home className="w-3.5 h-3.5 text-white" /> */}
              </div>
              <span className="text-[13px] text-[#3c4043]">МЖК / жилой дом (133 объекта)</span>
            </div>
            <p className="text-[11px] text-gray-400 pl-9">Реестр МЖКХ г. Алматы</p>
          </div>

          <hr className="border-gray-100" />

          {/* SECTION 4: Генплан здравоохранения */}
          <div className="space-y-2 pb-2">
            <h4 className="text-[12px] font-bold text-[#5f6368]">
              Генплан здравоохранения
            </h4>
            <div className="flex items-center gap-3">
              <SquareDashed className="w-5 h-5 text-pink-500" strokeDasharray="4 2" />
              <span className="text-[13px] text-[#3c4043]">Зоны резервирования (81 зона)</span>
            </div>
            <p className="text-[11px] text-gray-400 pl-8">Alagenplan — функциональные зоны здравоохранения</p>
          </div>

        </div>
      )}

      <style jsx>{`
        .custom-classic-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-classic-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-classic-scrollbar::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 4px;
        }
        .custom-classic-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #aaa;
        }
      `}</style>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-start gap-3 text-[12px] text-[#3c4043] leading-[1.4]">
      <div 
        className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5" 
        style={{ backgroundColor: color }}
      ></div>
      <span>{label}</span>
    </div>
  );
}

function LegendItemWithIcon({ color, label, icon }) {
  return (
    <div className="flex items-start gap-3 text-[12px] text-[#3c4043] leading-[1.4]">
      <div className="flex items-center gap-1 shrink-0 mt-0.5">
        <div 
          className="w-3.5 h-3.5 rounded-full" 
          style={{ backgroundColor: color }}
        ></div>
        {icon}
      </div>
      <span>{label}</span>
    </div>
  );
}