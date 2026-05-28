export default function Indicators({ totalCount, totalPopulation, avgVisit, avgPerson}) {
  const formatPopulation = (value) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} млн`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)} тыс`;
    return value?.toString() || '0';
  };

  const formatAvg = (value) => Math.ceil(value * 10) / 10;

  return (
    <div className="space-y-1.5 text-[11px] bg-white/95 p-2 md:px-3 md:py-2 border-t">
      <div className="grid grid-cols-2 gap-1.5">
        <div className="text-center rounded-lg border bg-white shadow-sm p-1.5">
          <div className="font-bold text-blue-900 text-sm md:text-base leading-none">{totalCount || '-'}</div>
          <p className="text-[9px] md:text-[10px] text-gray-500">Всего поликлиник</p>
        </div>

        <div className="text-center rounded-lg border bg-white shadow-sm p-1.5">
          <div className="font-bold text-blue-900 text-sm md:text-base leading-none">
            {formatPopulation(totalPopulation)}
          </div>
          <p className="text-[9px] md:text-[10px] text-gray-500">Население</p>
        </div>

        <div className="text-center rounded-lg border bg-white shadow-sm p-1.5">
          <div className="font-bold text-blue-900 text-sm md:text-base leading-none">
            {formatAvg(avgVisit) || '-'}
          </div>
          <p className="text-[9px] md:text-[10px] text-gray-500">Посещ. на пол-ку</p>
        </div>

        <div className="text-center rounded-lg border bg-white shadow-sm p-1.5">
          <div className="font-bold text-blue-900 text-sm md:text-base leading-none">
            {formatAvg(avgPerson) || '-'}
          </div>
          <p className="text-[9px] md:text-[10px] text-gray-500">Посещ. на чел.</p>
        </div>
      </div>

      <div className="bg-blue-200/30 p-2 md:p-3 rounded-md md:rounded-lg">
        <div className="text-left text-[9px] md:text-[10px] border-l-2 border-blue-600 pl-2">
          Примечание: Для просмотра детальной информации по медицинским учреждениям кликните на соответствующую точку на карте.
        </div>
      </div>
    </div>
  );
}