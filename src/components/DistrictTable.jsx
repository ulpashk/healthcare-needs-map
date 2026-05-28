import { useEffect, useState } from "react";

const calcDeficitVop = (vopdata) => {
  const sum =
    vopdata.peds_count * 800 +
    vopdata.vop_count * 1700 +
    vopdata.therap_count * 2200;
  const diff = vopdata.total_population - sum;
  const fin = (diff / 1700).toFixed(0);
  return Number(fin);
};

export default function DistrictTable() {
  const [tableData, setTableData] = useState([]);
  const [tableDataTotals, setTableDataTotals] = useState({});
  const [vopData, setVopData] = useState([]);
  const [vopTotals, setVopTotals] = useState({});
  const [totalDeficit, setTotalDeficit] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch main table data
        const response = await fetch(
          "https://admin.smartalmaty.kz/api/v1/healthcare/clinic-visit-5month/count_by_district"
        );
        const data_json = await response.json();
        setTableData(data_json.results);
        setTableDataTotals(data_json.totals);

        // Fetch VOP data
        const vopResponse = await fetch(
          "https://admin.smartalmaty.kz/api/v1/healthcare/org-capacity/count_by_district/"
        );
        const vopJson = await vopResponse.json();
        setVopData(vopJson.results);
        setVopTotals(vopJson.totals);

        // Compute total deficit
        const total = vopJson.results.reduce(
          (acc, item) => acc + calcDeficitVop(item),
          0
        );
        setTotalDeficit(total);
      } catch (error) {
        console.error("Failed to fetch data", error);
      }
    }
    fetchData();
  }, []);

  // Create a lookup for VOP data by district
  const vopLookup = Object.fromEntries(vopData.map((d) => [d.district, d]));

  return (
    <div className="h-full flex flex-col">
      <div className="relative flex-1 overflow-y-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-blue-200">
            <tr>
              <th className="px-4 py-2 border">Район</th>
              <th className="px-4 py-2 border">Количество</th>
              <th className="px-4 py-2 border">Общее население</th>
              <th className="px-4 py-2 border">Средняя посещаемость</th>
              <th className="px-4 py-2 border">Количество на 1 чел</th>
              <th className="px-4 py-2 border">Дефицит ВОП</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((item) => {
              const vopInfo = vopLookup[item.district];
              const deficit = vopInfo ? calcDeficitVop(vopInfo) : 0;

              return (
                <tr key={item.district} className="hover:bg-gray-100">
                  <td className="px-4 py-2 border text-left">
                    {item.district}
                  </td>
                  <td className="px-4 py-2 border">{item.clinic_count}</td>
                  <td className="px-4 py-2 border">
                    {item.total_population_sum.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 border">
                    {item.visit_sum.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 border">
                    {item.per_1_person_sum}
                  </td>
                  <td className="px-4 py-2 border">
                    {deficit.toLocaleString()}
                  </td>
                </tr>
              );
            })}

            {/* Totals Row */}
            <tr className="font-semibold bg-gray-200">
              <td className="px-4 py-2 border text-left">Total</td>
              <td className="px-4 py-2 border">
                {tableDataTotals.clinic_count}
              </td>
              <td className="px-4 py-2 border">
                {tableDataTotals.population_sum?.toLocaleString()}
              </td>
              <td className="px-4 py-2 border">
                {tableDataTotals.visit_sum?.toLocaleString()}
              </td>
              <td className="px-4 py-2 border">
                {tableDataTotals.per_1_person_sum}
              </td>
              <td className="px-4 py-2 border">{totalDeficit.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
