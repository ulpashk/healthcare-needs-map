export const MapLegend = () => {
  const legendItems = [
    {
      color: 'bg-green-500',
      label: 'Оптимальная загруженность',
      range: '(0.90-1.00)',
    },
    {
      color: 'bg-yellow-400',
      label: 'Низкая загруженность',
      range: '(<0.90)',
    },
    {
      color: 'bg-red-500',
      label: 'Высокая загруженность',
      range: '(>1.00)',
    },
  ];
 
  return (
    // <div className="absolute bottom-4 left-4 md:bottom-6 md:left-auto md:right-4 z-20 bg-white/95 backdrop-blur-md p-2.5 md:p-3 rounded-lg shadow-lg md:max-w-none">
    <div className="absolute bottom-0 left-0 p-3 rounded-lg border bg-white/50 backdrop-blur-md">
      <div className="font-bold text-[#1b1b1b] mb-2 md:mb-2.5 text-xs md:text-sm">
        Легенда по загруженности
      </div>
      {legendItems.map((item, index) => (
        <div key={index} className="flex items-center mb-1.5 md:mb-2 last:mb-0">
          <span
            className={`w-3 h-3 md:w-3.5 md:h-3.5 ${item.color} inline-block rounded mr-2 md:mr-2.5 shadow-sm border border-gray-300 flex-shrink-0`}
          />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] md:text-[11px] text-[#283353] font-semibold leading-tight truncate">{item.label} {item.range}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
