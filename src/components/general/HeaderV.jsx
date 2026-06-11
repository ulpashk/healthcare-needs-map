import { Link, useLocation } from "react-router-dom"
import { MapPinned, Menu, X, ChevronDown } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "../ui/dialog"
import DoctorsCapacityMethodology from "../Methodology/DoctorsCapacityMethodology"

export default function Header() {
  const [mobileMenu, setMobileMenu] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false)
  
  const [activeDropdown, setActiveDropdown] = useState(null);

  const location = useLocation()

  const isParentActive = (prefix) => location.pathname.startsWith(prefix)
  const isLinkActive = (path) => location.pathname === path

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".nav-dropdown-container") && !event.target.closest(".district-container")) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [])

  const districts = ["Все районы", "Алатауский", "Алмалинский", "Ауэзовский", "Бостандыкский", "Жетысуский", "Медеуский", "Наурызбайский", "Турксибский"]

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
      <header className={`pl-4 pr-4 sticky top-0 z-50 w-full transition-all duration-300 ${isScrolled ? "bg-white shadow-md border-b-2 border-[#c1d3ff]" : "bg-white border-b border-[#e8e8e8]"}`}>
        <div className="flex h-14 w-full justify-between items-center px-2">
          <div className="flex items-center gap-3">
            <h1 className="text-sm sm:text-base font-bold text-[#1b1b1b] truncate max-w-[200px] md:max-w-none">
              Анализ и карта потребности в объектах здравоохранения
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <nav className="hidden lg:flex items-center gap-2">
              <button onClick={() => setIsMethodologyOpen(true)} className="rounded-md border border-blue-500 text-blue-600 font-semibold px-3 py-1.5 text-xs hover:bg-blue-50 mr-2">
                Методология
              </button>

              {menuConfig.map((group) => (
                <div key={group.id} className="relative nav-dropdown-container">
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === group.id ? null : group.id)}
                    className={`flex items-center gap-1 rounded-md px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                      isParentActive(group.prefix) ? "bg-[#236FFF] text-white" : "bg-transparent text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {group.label}
                    <ChevronDown className={`h-3 w-3 transition-transform ${activeDropdown === group.id ? "rotate-180" : ""}`} />
                  </button>

                  {activeDropdown === group.id && (
                    <div className="absolute top-full left-0 mt-1 w-40 rounded-lg border border-[#c1d3ff] bg-white shadow-xl z-50 py-1">
                      {group.subItems.map((sub) => (
                        <Link
                          key={sub.to}
                          to={sub.to}
                          onClick={() => setActiveDropdown(null)}
                          className={`block px-4 py-2 text-xs font-medium transition-colors ${
                            isLinkActive(sub.to) ? "bg-[#ebf1ff] text-[#3772ff]" : "text-[#283353] hover:bg-[#f5f7ff]"
                          }`}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileMenu(!mobileMenu)}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenu ? (
                  <X size={24} className="text-[#236FFF]" />
                ) : (
                  <Menu size={24} className="text-gray-700" />
                )}
              </button>
            </div>
          </div>
        </div>
        {mobileMenu && (
          <div className="lg:hidden absolute top-14 left-0 w-full bg-white border-b-2 border-[#c1d3ff] shadow-2xl z-50 animate-in slide-in-from-top duration-300">
            <div className="flex flex-col p-4 gap-4">
              
              <button
                onClick={() => {
                  setIsMethodologyOpen(true);
                  setMobileMenu(false);
                }}
                className="w-full py-3 px-4 rounded-xl border-2 border-blue-500 text-blue-600 font-bold text-sm text-center active:bg-blue-50"
              >
                Методология
              </button>

              {menuConfig.map((group) => (
                <div key={group.id} className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <div className="text-[10px] uppercase tracking-wider text-gray-400 font-black px-2">
                    {group.label}
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {group.subItems.map((sub) => (
                      <Link
                        key={sub.to}
                        to={sub.to}
                        onClick={() => setMobileMenu(false)}
                        className={`flex items-center justify-between px-3 py-3 rounded-lg text-sm font-semibold transition-all ${
                          location.pathname === sub.to
                            ? "bg-[#236FFF] text-white shadow-md"
                            : "bg-white text-gray-700 border border-gray-100"
                        }`}
                      >
                        {sub.label}
                        {location.pathname === sub.to && <div className="w-2 h-2 bg-white rounded-full" />}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      <Dialog open={isMethodologyOpen} onOpenChange={setIsMethodologyOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
           <DoctorsCapacityMethodology />
        </DialogContent>
      </Dialog>
    </>
  )
}