import { NavLink, Outlet } from 'react-router-dom';

function HomePage() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex shadow-2xl gap-2">
        {[
          { path: 'buildings', label: 'Здания' },
          { path: 'geo-analysis', label: 'Гео-анализ' },
        ].map(btn => (
          <NavLink
            key={btn.path}
            to={`/pmsp/${btn.path}`}
            className={({ isActive }) => `
              px-4 py-2 rounded-md text-xs font-semibold transition-all duration-300 cursor-pointer
              ${isActive 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-500 hover:bg-gray-100 bg-white/90'}
            `}
          >
            {btn.label}
          </NavLink>
        ))}
      </div>

      <div className="h-full w-full">
        <Outlet /> 
      </div>
    </div>
  );
}

export default HomePage;