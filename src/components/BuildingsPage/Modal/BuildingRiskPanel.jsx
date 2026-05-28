import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { HealthcareService } from '../../../services/apiService';

const fmt = (n) => new Intl.NumberFormat('ru-RU').format(n || 0);

export default function BuildingRiskPanel({ onClose, onZoomTo }) {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('obj');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    HealthcareService.getInfrastructureAnalytics().then(d => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-10 flex justify-center bg-white rounded-xl shadow-lg"><Loader2 className="animate-spin" /></div>;

  const totalPre1970 = data?.by_age.reduce((s, i) => s + i.pre1970, 0);
  const total1970_2000 = data?.by_age.reduce((s, i) => s + i.y1970_2000, 0);
  const totalAllDist = data?.by_age.reduce((s, i) => s + (i.pre1970 + i.y1970_2000 + i.post2000), 0);

  return (
    <div className="h-full bg-white shadow-2xl rounded-xl border border-gray-200 overflow-hidden flex flex-col">
        <div className="shrink-0">
            {/* Header */}
            <div className="bg-[#37474F] p-2.5 px-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-400" />
                <span className="font-bold text-[13px]">Скрытый риск: здания без данных</span>
              </div>
            </div>

            {/* KPI Blocks */}
            <div className="grid grid-cols-5 gap-px bg-gray-100 border-b">
                {[
                { label: 'Аварийных', val: data.emergency_count, color: '#7B1FA2' },
                { label: 'Сейсм. угроза', val: data.seismic_count, color: '#B71C1C' },
                { label: 'Вер. износ', val: data.by_priority['критично'], color: '#E65100' },
                { label: 'Нет данных', val: data.by_priority['нет данных'], color: '#78909C' },
                { label: 'До 1980 г.', val: data.by_age.reduce((s,i)=>s+i.pre1970,0), color: '#F57F17' },
                ].map((k, i) => (
                  <div key={i} className="bg-white p-2 text-center">
                    <div className="text-lg font-bold leading-none mb-1" style={{ color: k.color }}>{k.val}</div>
                    <div className="text-[9px] text-gray-400 uppercase leading-tight">{k.label}</div>
                  </div>
                ))}
            </div>
        </div>

      {/* Tabs */}
      <div className="flex bg-gray-50 border-b text-[11px] font-bold uppercase">
        <button onClick={() => setActiveTab('obj')} className={`flex-1 py-2 ${activeTab === 'obj' ? 'bg-white border-b-2 border-[#37474F]' : 'text-gray-400'}`}>По объектам</button>
        <button onClick={() => setActiveTab('dist')} className={`flex-1 py-2 ${activeTab === 'dist' ? 'bg-white border-b-2 border-[#37474F]' : 'text-gray-400'}`}>По районам</button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        <table className="w-full text-[10px] border-collapse">
          {activeTab === 'obj' ? (
            <>
              <thead className="bg-white sticky top-0 border-b text-gray-400">
                <tr>
                  <th className="p-2 text-left">ПМСП</th>
                  <th className="p-2 text-center">Год</th>
                  <th className="p-2 text-center">Риск</th>
                  <th className="p-2 text-right">Приоритет</th>
                  {/* <th className="p-2 text-right">РПН</th> */}
                </tr>
              </thead>
              <tbody>
                {data.critical_list.map((r, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => onZoomTo(r.lat, r.lng)}>
                    <td className="p-2 font-medium truncate max-w-[150px] text-left">{r.name.replace(/городская поликлиника/gi, 'ГП')}</td>
                    <td className="p-2 text-center text-gray-500">{r.bld_year_built || '—'}</td>
                    <td className="p-2 text-center">
                       <span className={`px-1.5 py-0.5 rounded text-[9px] text-white font-bold ${r.priority_reason?.includes('Авар') ? 'bg-purple-600' : 'bg-red-600'}`}>
                         {r.priority_reason}
                       </span>
                    </td>
                    <td className="p-2 text-right text-blue-600 font-bold">{r.bld_priority}</td>
                    {/* <td className="p-2 text-right text-blue-600 font-bold">{fmt(Math.floor(Math.random()*50000))}</td> */}
                  </tr>
                ))}
              </tbody>
              <tfoot className="sticky bottom-0 bg-[#ECEFF1] border-t-2 border-[#546E7A] font-bold text-gray-700 z-10">
                <tr>
                  <td className="p-2 pl-4 text-left" colSpan="3">Итого: {data.critical_list.length} объектов</td>
                  <td className="p-2 text-right pr-4 text-blue-900">Критично</td>
                </tr>
              </tfoot>
            </>
          ) : (
            <>
              <thead className="bg-white sticky top-0 border-b text-gray-400">
                <tr><th className="p-2 text-left">Район</th><th className="p-2 text-center">До 1970</th><th className="p-2 text-center">1970-2000</th><th className="p-2 text-right">Всего</th></tr>
              </thead>
              <tbody>
                {data.by_age.map((r, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2 font-bold text-left">{r.district.replace(" район", "")}</td>
                    <td className="p-2 text-center text-orange-600 font-bold">{r.pre1970}</td>
                    <td className="p-2 text-center text-gray-600">{r.y1970_2000}</td>
                    <td className="p-2 text-right font-bold text-gray-800">{r.pre1970 + r.y1970_2000 + r.post2000}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="sticky bottom-0 bg-[#ECEFF1] border-t-2 border-[#546E7A] font-bold text-gray-700 z-10">
                <tr>
                  <td className="p-2 pl-4 text-left font-bold">Всего по городу</td>
                  <td className="p-2 text-center text-red-700">{totalPre1970}</td>
                  <td className="p-2 text-center text-gray-600">{total1970_2000}</td>
                  <td className="p-2 text-right font-bold pr-4 text-gray-900">{totalAllDist}</td>
                </tr>
              </tfoot>
            </>
          )}
        </table>
      </div>
    </div>
  );
}