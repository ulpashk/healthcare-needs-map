import { useEffect, useState } from "react";
import { X, Building2, Loader2, AlertCircle } from "lucide-react";
import { HealthcareService } from "../../../services/apiService";

export default function BuildingAgeModal({ onClose }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const json = await HealthcareService.getBuildingAgeStats();
                
                const processed = json
                    .filter(item => item.district && item.district !== "nan")
                    .sort((a, b) => (b.pre1970 || 0) - (a.pre1970 || 0));
                
                setData(processed);
            } catch (err) {
                setError("Ошибка загрузки данных");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    return (
        <div className="w-[680px] bg-white shadow-2xl rounded-xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-left-2">
            <div className="bg-[#5C6BC0] p-2 px-3 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span className="font-bold text-sm tracking-wide">Возраст зданий по районам</span>
                </div>
                <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                        <span className="text-xs text-gray-400">Сбор аналитики по зданиям...</span>
                    </div>
                ) : error ? (
                    <div className="p-10 flex flex-col items-center text-red-500 gap-2">
                        <AlertCircle className="w-8 h-8" />
                        <span className="text-xs font-medium">{error}</span>
                    </div>
                ) : (
                    <table className="w-full text-[11px] md:text-xs border-collapse">
                        <thead className="bg-[#E8EAF6] text-[#3F51B5] font-bold border-b sticky top-0 z-10">
                            <tr>
                                <th className="p-2 text-left">Район</th>
                                <th className="p-2 text-center">Всего зд.</th>
                                <th className="p-2 text-center text-red-700">50+ лет</th>
                                <th className="p-2 text-center text-orange-600">1970–2000</th>
                                <th className="p-2 text-center text-green-700">После 2000</th>
                                <th className="p-2 text-center text-purple-700">Критич.</th>
                                <th className="p-2 text-center text-gray-600">Снос</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((r, i) => {
                                const pctOld = r.total ? Math.round((r.pre1970 / r.total) * 100) : 0;
                                return (
                                    <tr key={i} className={`border-b hover:bg-gray-50 transition-colors ${pctOld > 30 ? 'bg-red-50/30' : ''}`}>
                                        <td className="p-2 font-bold text-gray-800">{r.district}</td>
                                        <td className="p-2 text-center font-semibold text-gray-600">{r.total}</td>
                                        <td className="p-2 text-center text-red-700 font-bold">
                                            {r.pre1970 > 0 ? (
                                                <div className="flex flex-col leading-none">
                                                    <span>{r.pre1970}</span>
                                                    <span className="text-[9px] text-gray-400 font-normal">({pctOld}%)</span>
                                                </div>
                                            ) : "—"}
                                        </td>
                                        <td className="p-2 text-center text-orange-600">{r.p1970_2000 || "—"}</td>
                                        <td className="p-2 text-center text-green-700">{r.post2000 || "—"}</td>
                                        <td className="p-2 text-center text-purple-800 font-bold">{r.critical || "—"}</td>
                                        <td className="p-2 text-center text-gray-500">{r.snos || "—"}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
            
            <div className="p-2 bg-gray-50 text-[10px] text-gray-500 border-t flex justify-between items-center px-4">
                <span className="italic">* «50+ лет» — здания, построенные до 1970 года.</span>
                <span className="font-medium">Источник: База данных ГИС МО</span>
            </div>
        </div>
    );
}