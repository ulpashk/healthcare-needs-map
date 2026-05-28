"use client"

import { X, MapPinned, ChevronRight } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

export default function MobileDrawer({
  isOpen,
  onClose,
  navigationItems,
  districts,
  selectedDistrict,
  onSelectDistrict
}) {
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  const handleDistrictSelect = (district) => {
    onSelectDistrict(district)
    onClose()
  }

  const handleNavClick = () => {
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[100] lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-[101] lg:hidden transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b-2 border-[#c1d3ff] bg-gradient-to-r from-[#3772ff] to-[#2956bf]">
            <h2 className="text-lg font-bold text-white">Меню</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors touch-manipulation"
              aria-label="Закрыть меню"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Navigation Items */}
            <div className="p-4">
              <h3 className="text-xs font-bold text-[#283353] uppercase tracking-wide mb-3 px-2">
                Навигация
              </h3>
              <nav className="space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={handleNavClick}
                      className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition-all duration-200 ${
                        isActive(item.to)
                          ? "bg-gradient-to-r from-[#3772ff] to-[#2956bf] text-white shadow-md"
                          : "text-[#283353] hover:bg-[#ebf1ff] border border-transparent"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isActive(item.to) ? "text-white" : "text-[#3772ff]"}`} />
                      <span className="flex-1">{item.label}</span>
                      <ChevronRight className={`h-4 w-4 ${isActive(item.to) ? "text-white" : "text-[#283353]/50"}`} />
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Districts */}
            <div className="p-4 border-t border-[#e8e8e8]">
              <h3 className="text-xs font-bold text-[#283353] uppercase tracking-wide mb-3 px-2 flex items-center gap-2">
                <MapPinned className="h-3.5 w-3.5 text-[#3772ff]" />
                Районы
              </h3>
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {districts.map((district) => (
                  <button
                    key={district}
                    onClick={() => handleDistrictSelect(district)}
                    className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                      district === selectedDistrict
                        ? "bg-[#ebf1ff] text-[#3772ff] font-bold border-2 border-[#c1d3ff]"
                        : "text-[#283353] hover:bg-[#eaebee] border-2 border-transparent"
                    }`}
                  >
                    {district === "Все районы" ? district : `${district} район`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#e8e8e8] bg-[#f8f9fa]">
            <p className="text-xs text-[#283353]/70 text-center">
              Система мониторинга здравоохранения
            </p>
            <p className="text-xs text-[#3772ff] font-semibold text-center mt-1">
              г. Алматы
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
