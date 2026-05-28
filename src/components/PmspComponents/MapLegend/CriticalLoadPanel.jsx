import React, { useState, useMemo } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, MousePointer2, X } from 'lucide-react';

const shortPmspName = (name) => {
  if (!name) return "";
  return name.replace(/городская поликлиника/gi, 'ГП')
             .replace(/поликлиника/gi, 'Пол.')
             .replace(/Центр/gi, 'Центр');
};

const fmtNum = (num) => new Intl.NumberFormat('ru-RU').format(Math.round(num || 0));

const getPctClass = (val) => {
  if (val > 150) return 'text-[#C62828] font-bold';
  if (val > 130) return 'text-[#EF6C00] font-bold';
  if (val > 110) return 'text-[#FBC02D] font-bold';
  return 'text-[#2E7D32]';
};

export default function CriticalLoadPanel({ data, onZoomTo, isMinimized, setIsMinimized }) {
  const [activeTab, setActiveTab] = useState('cap');

  const pmspBase = useMemo(() => {
    return (data?.features || [])
      .map(f => f.properties)
      .filter(d => (d.cap_load || 0) >= 100);
  }, [data]);

  const rows = useMemo(() => {
    if (activeTab === 'cap') return [...pmspBase].sort((a, b) => b.cap_load - a.cap_load);
    if (activeTab === 'doc') return [...pmspBase].filter(d => d.doctor_load != null).sort((a, b) => b.doctor_load - a.doctor_load);
    if (activeTab === 'gap') {
        return (data?.features || [])
            .map(f => f.properties)
            .filter(d => 
            d.doctor_load != null && 
            d.doctor_load > 130 && 
            (d.doctor_load > (d.cap_load || 0))
            )
            .sort((a, b) => {
            const gapA = a.doctor_load - (a.cap_load || 0);
            const gapB = b.doctor_load - (b.cap_load || 0);
            return gapB - gapA;
            });
        }
    return [];
  }, [pmspBase, activeTab, data]);

  const totals = useMemo(() => {
    if (rows.length === 0) return null;
    const n = rows.length;
    if (activeTab === 'cap') {
      const plan = rows.reduce((s, r) => s + (r.cap_planned*456), 0);
      const fact = rows.reduce((s, r) => s + (r.visits_fact || r.population * 2.4), 0);
      const pop = rows.reduce((s, r) => s + (r.population || 0), 0);
      return { n, plan, fact, diff: fact - plan, pop };
    }
    if (activeTab === 'doc') {
      const avgDoc = rows.reduce((s, r) => s + (r.doctor_load || 0), 0) / n;
      return { n, avgDoc };
    }
    if (activeTab === 'gap') {
        const n = rows.length;
        const totalGap = rows.reduce((s, r) => s + (r.doctor_load - (r.cap_load || 0)), 0);
        const pop = rows.reduce((s, r) => s + (r.population || 0), 0);
        return { n, avgGap: totalGap / n, pop };
    }
    return null;
  }, [rows, activeTab]);

  if (!data) return null;

  return (
    <div className={`w-[360px] bg-white shadow-2xl rounded-xl border border-gray-200 overflow-hidden transition-all duration-300 ${isMinimized ? 'h-[42px]' : 'h-auto'}`}>
      
      <div 
        onClick={() => setIsMinimized(!isMinimized)}
        className="bg-[#C62828] p-2.5 px-4 flex items-center justify-between text-white cursor-pointer hover:bg-[#b52424]"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-bold text-[11px] uppercase tracking-wider">Критическая нагрузка ПМСП</span>
        </div>
        {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </div>

      {!isMinimized && (
        <>
          <div className="flex bg-gray-100 border-b">
            {[
              { id: 'cap', label: 'По посещаемости' },
              { id: 'doc', label: 'По врачам' },
              { id: 'gap', label: 'Разрыв' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 text-[10px] font-bold uppercase transition-colors ${
                  activeTab === tab.id ? 'bg-white text-[#C62828] border-b-2 border-[#C62828]' : 'text-gray-500'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="max-h-[380px] overflow-y-auto relative custom-scrollbar">
            <div className="bg-gray-50 px-3 py-1 text-[9px] text-gray-400 flex items-center gap-1 border-b italic font-medium">
              <MousePointer2 className="w-3 h-3" /> Нажмите строку для перехода на карту
            </div>

            <table className="w-full text-[10px] border-collapse table-fixed">
              <thead className="bg-white sticky top-0 z-10 border-b text-[9px] text-gray-400 uppercase">
                <tr>
                  <th className="p-2 text-left pl-4 w-[40%]">ПМСП</th>
                  <th className="p-2 text-center w-[20%]">{activeTab === 'cap' ? 'Нагруз.%' : 'Врач.%'}</th>
                  <th className="p-2 text-right w-[20%]">{activeTab === 'cap' ? 'Пл./год' : activeTab === 'doc' ? 'ВОП/чел' : 'Посещ.%'}</th>
                  {activeTab === 'doc' && <th className="p-2 text-right w-[20%]">Терап./чел</th>}
                  {activeTab === 'gap' && <th className="p-2 text-right w-[20%]">Разрыв</th>}
                  {/* {activeTab === 'doc' && <th className="p-2 text-right w-[20%]">Педиатр/чел</th>} */}
                  <th className="p-2 text-right pr-4 w-[20%]">{activeTab === 'cap' ? 'Факт/год' : activeTab === 'doc' ? 'Педиатр/чел' : 'РПН'}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {rows.map((r, i) => (
                  <tr 
                    key={i} 
                    onClick={() => onZoomTo(r)} 
                    className="hover:bg-red-50 cursor-pointer transition-colors"
                  >
                    <td className="p-2 pl-4 py-3 align-middle">
                      <div 
                        className="font-medium text-gray-800 text-left leading-tight line-clamp-2 overflow-hidden" 
                        title={r.name}
                        style={{ display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical' }}
                      >
                        {shortPmspName(r.name)}
                      </div>
                    </td>
                    
                    <td className={`p-2 text-center align-middle ${getPctClass(activeTab === 'cap' ? r.cap_load : r.doctor_load)}`}>
                      {(activeTab === 'cap' ? r.cap_load : r.doctor_load).toFixed(1)}%
                    </td>

                    {activeTab === 'cap' && (
                      <>
                        <td className="p-2 text-right align-middle text-gray-500">{fmtNum(r.cap_planned * 456)}</td>
                        <td className="p-2 text-right align-middle font-bold pr-4">{fmtNum(r.visits_fact || r.population * 2.4)}</td>
                      </>
                    )}

                    {activeTab === 'doc' && (
                      <>
                        <td className="p-2 text-right align-middle font-bold pr-4 text-red-600">{r.doc_vop_load ? Math.ceil(r.doc_vop_load) : '0'}</td>
                        <td className="p-2 text-right align-middle font-bold pr-4 text-red-600">{r.doc_ther_load ? Math.ceil(r.doc_ther_load) : '0'}</td>
                        <td className="p-2 text-right align-middle font-bold pr-4 text-red-600">{r.doc_ped_load ? Math.ceil(r.doc_ped_load) : '0'}</td>
                      </>
                    )}

                    {activeTab === 'gap' && (
                      <>
                        <td className="p-2 text-right align-middle text-gray-400">{(r.cap_load || 0).toFixed(0)}%</td>
                        <td className="p-2 text-right align-middle font-bold text-[#7B1FA2] pr-2">+{(r.doctor_load - (r.cap_load || 0)).toFixed(1)} пп</td>
                        <td className="p-2 text-right align-middle font-bold pr-4 text-blue-700">{fmtNum(r.population)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>

              {totals && (
                <tfoot className="sticky bottom-0 bg-[#FFF3E0] border-t-2 border-[#EF6C00] font-bold text-gray-800 text-[10px] z-10">
                  {activeTab === 'cap' && (
                    <tr>
                      <td className="p-2 pl-4 text-left">Итого ({totals.n})</td>
                      <td></td>
                      <td className="p-2 text-right">{fmtNum(totals.plan)}</td>
                      <td className="p-2 text-right pr-4">{fmtNum(totals.fact)}</td>
                    </tr>
                  )}
                  {activeTab === 'doc' && (
                    <tr>
                      <td className="p-2 pl-4 text-left">Итого ({totals.n})</td>
                      <td className="p-2 text-center text-[#E65100]">Ср. {totals.avgDoc.toFixed(1)}%</td>
                      <td colSpan="2"></td>
                      <td colSpan="2"></td>
                      <td colSpan="2"></td>
                    </tr>
                  )}
                  {activeTab === 'gap' && (
                    <tr>
                      <td className="p-2 pl-4 text-left">Итого ({totals.n})</td>
                      <td colSpan="2" className="p-2 text-right text-[#7B1FA2]">Ср. +{totals.avgGap.toFixed(1)} пп</td>
                      <td></td>
                      <td className="p-2 text-right pr-4 text-blue-700">{fmtNum(totals.pop)}</td>
                    </tr>
                  )}
                </tfoot>
              )}
            </table>
          </div>

          <div className="p-2.5 bg-gray-50 border-t grid grid-cols-2 gap-x-2 gap-y-1">
            {[
              { color: '#C62828', label: '>150% критично' },
              { color: '#EF6C00', label: '130–150% перегруз' },
              { color: '#FBC02D', label: '110–130% выше нормы' },
              { color: '#66BB6A', label: '90–110% норма' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-[9px] text-gray-500 font-medium">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}