"use client"
import { useState, useRef, useEffect } from "react"
import MapView from "../components/PmspComponents/MapV"
import { HealthcareService } from "../services/apiService"
import GeoFilterPanel from "../components/GeoAnalysisPage/GeoFilterPanel"
import AnalyticsPanel from "../components/GeoAnalysisPage/MapLegend/AnalyticsPanel"

export default function GeoAnalysisPagePMSP() {
  const [geoMode, setGeoMode] = useState("walkaccess");
  const [mapData, setMapData] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPopulation, setTotalPopulation] = useState(0);
  const [avgVisit, setAvgVisit] = useState(0);
  const [avgPerson, setAvgPerson] = useState(0);
  const [selectedDistrict, setSelectedDistrict] = useState(["Все районы"]);
  const [selectedVisits, setSelectedVisits] = useState(["Все посещения"]);
  const [selectedLayers, setSelectedLayers] = useState(["Все слои"]);
  const [selectedAffiliations, setSelectedAffiliations] = useState(["all"]);
  const [activeScenario, setActiveScenario] = useState('current');
  const [isPlanningActive, setIsPlanningActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const mapRef = useRef();

  const handleReset = () => {
    setSelectedDistrict(["Все районы"]);
    setSelectedVisits(["Все посещения"]);
    setSelectedLayers(["Все слои"]);
    setSelectedAffiliations(["all"]);
    setActiveScenario('current');
    setSearchQuery("");
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div className="absolute top-6 left-6 z-20 w-[300px]">
        <GeoFilterPanel 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedDistrict={selectedDistrict}
          setSelectedDistrict={setSelectedDistrict}
          selectedLayers={selectedLayers}
          setSelectedLayers={setSelectedLayers}
          selectedVisits={selectedVisits} 
          setSelectedVisits={setSelectedVisits}
          selectedAffiliations={selectedAffiliations}
          setSelectedAffiliations={setSelectedAffiliations}
          totalCount={totalCount}
          totalPopulation={totalPopulation}
          avgVisit={avgVisit}
          avgPerson={avgPerson}
          activeScenario={activeScenario}
          setActiveScenario={setActiveScenario}
          onReset={() => handleReset()}
          plannedZonesData={mapData?.plannedZones}
          isPlanningActive={isPlanningActive}
          setIsPlanningActive={setIsPlanningActive}
          onZoomTo={(zone) => mapRef.current?.zoomToLocation(zone)}
          
        />
      </div>
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex shadow-2xl gap-2">
        {[
          { id: 'walkaccess', label: 'Пешая доступность' },
          { id: 'deficit', label: 'Дефицит' },
        ].map(btn => (
          <button
            key={btn.id}
            onClick={() => setGeoMode(btn.id)}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition-all duration-300 cursor-pointer ${
              geoMode === btn.id 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-500 hover:bg-gray-100 bg-white/90'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <div className="h-full w-full">
        <MapView 
          mode="geo-analysis"
          ref={mapRef}
          geoMode={geoMode}
          onDataUpdate={setMapData}

          selectedDistrict={selectedDistrict}
          selectedVisits={selectedVisits}
          selectedLayers={selectedLayers}
          selectedAffiliations={selectedAffiliations}
          setTotalCount={setTotalCount}
          setTotalPopulation={setTotalPopulation}
          setAvgVisit={setAvgVisit}
          setAvgPerson={setAvgPerson}
          activeScenario={activeScenario}
          isPlanningActive={isPlanningActive}
          extraFilters={{
            search: searchQuery,
            techConditions: []
          }}
        />
      </div>

      <div className="absolute bottom-20 right-6 z-30">
        <AnalyticsPanel 
          data={mapData?.pmsp} 
          onZoomTo={(item) => {
            if (mapRef.current) {
              mapRef.current.zoomToLocation(item);
            }
          }} 
        />
      </div>
    </div>
  );
}