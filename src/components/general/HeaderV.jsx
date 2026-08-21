import { Link, useLocation } from "react-router-dom"
import { Menu, X, ChevronDown, Info, Search, MapPin, Loader2} from "lucide-react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "../ui/dialog"
import DoctorsCapacityMethodology from "../Methodology/DoctorsCapacityMethodology"
import { GeocodingService } from "../../services/geocodingService";

export default function Header() {
  const [mobileMenu, setMobileMenu] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const location = useLocation();
  const isParentActive = (prefix) => location.pathname.startsWith(prefix)
  const isLinkActive = (path) => location.pathname === path
  const isGeoPage = location.pathname.includes('geo-analysis');
  const [localPlanning, setLocalPlanning] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchAttempted(true);
    setIsSearching(true);
    try {
      const results = await GeocodingService.searchAddress(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const dispatchPlanningEvent = (isActive) => {
    window.dispatchEvent(new CustomEvent('toggle-planning-mode', { 
      detail: { active: isActive } 
    }));
  };

  const selectLocation = (res) => {
    setLocalPlanning(true);
    dispatchPlanningEvent(true);

    const event = new CustomEvent('map-fly-to', { 
      detail: { 
        lng: parseFloat(res.lon), 
        lat: parseFloat(res.lat),
        address: res.display_name 
      } 
    });
    window.dispatchEvent(event);
    setIsSearchOpen(false);
  };
  
  const togglePlanning = () => {
    const newState = !localPlanning;
    setLocalPlanning(newState);
    dispatchPlanningEvent(newState);
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".nav-dropdown-container")) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (!isSearchOpen) {
      setSearchQuery("");
      setSearchResults([]);
      setSearchAttempted(false);
    }
  }, [isSearchOpen]);

  const menuConfig = [
    {
      id: 'pmsp',
      label: 'По ПМСП',
      prefix: '/pmsp',
      subItems: [
        { to: '/pmsp/buildings', label: 'Здания' },
        { to: '/pmsp/geo-analysis', label: 'Гео-анализ' }
      ]
    },
    {
      id: 'hospitals',
      label: 'По Больницам',
      prefix: '/hospitals',
      subItems: [
        { to: '/hospitals/buildings', label: 'Здания' },
        { to: '/hospitals/geo-analysis', label: 'Гео-анализ' }
      ]
    }
  ]

  return (
    <>
      <header className={`sticky top-0 z-50 w-full transition-all duration-300 flex-shrink-0 ${
        isScrolled ? "bg-white shadow-md border-b border-blue-100" : "bg-white border-b border-gray-200"
      }`}>
        <div className="w-full px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            
            <div className="flex items-center flex-shrink-0">
              <h1 className="text-sm sm:text-base font-bold text-gray-900 leading-tight max-w-[200px] sm:max-w-[400px] md:max-w-none">
                Анализ и карта потребности <br className="hidden sm:block md:hidden" /> 
                <span className="">в объектах здравоохранения</span>
              </h1>
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <button 
                onClick={() => setIsMethodologyOpen(true)} 
                className="flex items-center gap-2 rounded-lg border border-blue-200 text-blue-600 font-semibold px-4 py-2 text-xs hover:bg-blue-50 transition-all flex-shrink-0 cursor-pointer"
              >
                Методология
              </button>

              {isGeoPage && (
                <div className="relative nav-dropdown-container">
                  <button
                    onClick={() =>
                      setActiveDropdown(
                        activeDropdown === "point-analysis" ? null : "point-analysis"
                      )
                    }
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      localPlanning
                        ? "bg-green-600 text-white shadow-sm"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <MapPin size={14} />

                    {localPlanning ? "Анализ точки: ВКЛ" : "Анализ точки"}

                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${
                        activeDropdown === "point-analysis" ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {activeDropdown === "point-analysis" && (
                    <div className="absolute top-full right-0 mt-2 w-56 rounded-xl border border-gray-100 bg-white shadow-xl z-[60] py-1.5 animate-in fade-in zoom-in-95 duration-200">

                      <button
                        onClick={() => {
                          togglePlanning(); 
                          setActiveDropdown(null);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-medium transition-colors cursor-pointer ${
                          localPlanning
                            ? "bg-green-50 text-green-700 font-bold"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <MapPin size={15} className={localPlanning ? "text-green-600" : ""} />

                        <div className="flex flex-col items-start text-left">
                          <span className="font-semibold">
                            {localPlanning ? "Выключение выбора на карте" : "Выбрать точку на карте"}
                          </span>

                          <span className="text-[10px] text-gray-400 mt-0.5 leading-tight">
                            {localPlanning 
                              ? "Нажмите, чтобы вернуться в обычный режим" 
                              : "Кликните по нужному месту на карте"}
                          </span>
                        </div>

                        {localPlanning && (
                          <span className="ml-auto flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setIsSearchOpen(true);
                          setActiveDropdown(null);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <Search size={15} />

                        <div className="flex flex-col items-start">
                          <span className="font-semibold">
                            Найти точку по адресу
                          </span>

                          <span className="text-[10px] text-gray-400 mt-0.5">
                            Введите улицу и номер дома
                          </span>
                        </div>
                      </button>

                    </div>
                  )}
                </div>
              )}

              {menuConfig.map((group) => (
                <div key={group.id} className="relative nav-dropdown-container">
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === group.id ? null : group.id)}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      isParentActive(group.prefix) 
                        ? "bg-blue-600 text-white shadow-sm" 
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {group.label}
                    <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === group.id ? "rotate-180" : ""}`} />
                  </button>

                  {activeDropdown === group.id && (
                    <div className="absolute top-full right-0 mt-2 w-48 rounded-xl border border-gray-100 bg-white shadow-xl z-[60] py-1.5 animate-in fade-in zoom-in-95 duration-200">
                      {group.subItems.map((sub) => (
                        <Link
                          key={sub.to}
                          to={sub.to}
                          onClick={() => setActiveDropdown(null)}
                          className={`block px-4 py-2.5 text-xs font-medium transition-colors ${
                            isLinkActive(sub.to) ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="lg:hidden p-2.5 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              {mobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {mobileMenu && (
          <div className="lg:hidden fixed inset-x-0 top-16 bg-white border-b border-blue-100 shadow-2xl z-[50] max-h-[calc(100vh-64px)] overflow-y-auto animate-in slide-in-from-top duration-300">
            <div className="p-4 space-y-4">
              <button
                onClick={() => {
                  setIsMethodologyOpen(true);
                  setMobileMenu(false);
                }}
                className="w-full py-3 px-4 rounded-xl bg-blue-50 text-blue-700 font-bold text-sm border border-blue-100 flex items-center justify-center gap-2"
              >
                <Info size={18} />
                Методология
              </button>

              {menuConfig.map((group) => (
                <div key={group.id} className="bg-gray-50 rounded-2xl p-2 space-y-1">
                  <div className="text-[10px] uppercase tracking-[0.1em] text-gray-400 font-bold px-3 py-2">
                    {group.label}
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {group.subItems.map((sub) => (
                      <Link
                        key={sub.to}
                        to={sub.to}
                        onClick={() => setMobileMenu(false)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                          isLinkActive(sub.to)
                            ? "bg-blue-600 text-white shadow-md"
                            : "bg-white text-gray-700 border border-gray-100"
                        }`}
                      >
                        {sub.label}
                        {isLinkActive(sub.to) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-w-md w-[95vw] p-0 overflow-hidden border-none shadow-2xl bg-white rounded-2xl z-[100]">
          
          <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-gray-50">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <Search size={18} className="text-blue-600" />
              Поиск на карте
            </h2>
            <button 
              onClick={() => setIsSearchOpen(false)}
              className="p-1.5 hover:bg-gray-200 rounded-full transition-all text-gray-400 hover:text-gray-800"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <input 
                autoFocus
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Введите улицу и номер дома..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchAttempted(false);

                  if (searchResults.length > 0) {
                    setSearchResults([]);
                  }
                }}
              />
              <button 
                type="submit"
                disabled={isSearching}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:bg-blue-300 transition-all flex items-center gap-2"
              >
                {isSearching ? <Loader2 className="animate-spin" size={18} /> : "Найти"}
              </button>
            </form>

            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 custom-classic-scrollbar border-t pt-4">
                <p className="text-[10px] text-gray-400 uppercase font-bold mb-2 px-1">Найдено адресов: {searchResults.length}</p>
                {searchResults.map((res, i) => (
                  <button
                    key={i}
                    onClick={() => selectLocation(res)}
                    className="w-full text-left p-3 text-sm hover:bg-blue-50 border border-gray-100 rounded-xl transition-all flex items-start gap-3 group"
                  >
                    <div className="bg-red-50 p-2 rounded-lg group-hover:bg-red-100 transition-colors">
                      <MapPin className="text-red-500 flex-shrink-0" size={16} />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-medium text-gray-700 leading-tight truncate">
                        {res.display_name.split(',')[0]} {res.display_name.split(',')[1]}
                      </span>
                      <span className="text-[11px] text-gray-400 mt-0.5 truncate">
                        {res.display_name.split(',').slice(2).join(',')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchAttempted && !isSearching && searchResults.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 px-4 border-t border-gray-100">
                <div className="bg-gray-100 p-3 rounded-full mb-3">
                  <MapPin className="text-gray-400" size={22} />
                </div>

                <p className="text-sm font-semibold text-gray-700">
                  Ничего не найдено
                </p>

                <p className="text-xs text-gray-400 text-center mt-1">
                  Проверьте название улицы и номер дома
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isMethodologyOpen} onOpenChange={setIsMethodologyOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0">
           <div className="overflow-y-auto p-6">
             <DoctorsCapacityMethodology />
           </div>
        </DialogContent>
      </Dialog>
    </>
  )
}