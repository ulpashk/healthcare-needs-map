"use client"

import { useState, useRef } from "react"
import MapView from "../components/PmspComponents/MapV"
import BuildingsFilterPanel from "../components/BuildingsPage/BuildingsFilterPanel"
import BuildingRiskPanel from "../components/PmspComponents/Modal/BuildingRiskPanel"
import BuildingAgeModal from "../components/PmspComponents/Modal/BuildingAgeModal"
import BuildingLegend from "../components/PmspComponents/MapLegend/BuildingLegend"

export default function BuildingsPagePMSP() {
  const [mapData, setMapData] = useState(null)
  const mapRef = useRef(null)

  const [selectedDistrict, setSelectedDistrict] = useState(["Все районы"]);
  const [selectedLayers, setSelectedLayers] = useState(["Все слои"]);
  const [selectedAffiliations, setSelectedAffiliations] = useState(["all"]);
  const [selectedTechConditions, setSelectedTechConditions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModal, setActiveModal] = useState(null);

  const [stats, setStats] = useState({ count: 0, pop: 0, visit: 0, person: 0 });

  const handleReset = () => {
    setSelectedDistrict(["Все районы"]);
    setSelectedLayers(["Все слои"]);
    setSelectedAffiliations(["all"]);
    setSelectedTechConditions([]);
    setSearchQuery("");
    setActiveModal(null);
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute top-[20px] left-4 z-20 w-[220px] md:w-[280px]">
        <BuildingsFilterPanel 
          selectedDistrict={selectedDistrict} setSelectedDistrict={setSelectedDistrict}
          selectedLayers={selectedLayers} setSelectedLayers={setSelectedLayers}
          selectedAffiliations={selectedAffiliations} setSelectedAffiliations={setSelectedAffiliations}
          selectedTechConditions={selectedTechConditions} setSelectedTechConditions={setSelectedTechConditions}
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          totalCount={stats.count} totalPopulation={stats.pop}
          avgVisit={stats.visit} avgPerson={stats.person}
          onReset={handleReset}
          setActiveModal={setActiveModal}
          activeModal={activeModal}
        />
      </div>
      <div className="absolute top-4 right-4 z-50"> 
        {activeModal === 'age' && (
          <BuildingAgeModal onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'hidden' && (
          <BuildingRiskPanel 
            onClose={() => setActiveModal(null)} 
            onZoomTo={(item) => mapRef.current?.zoomToLocation(item)}
          />
        )}
      </div>

      <div className="h-full w-full">
        <MapView 
          mode="infrastructure"
          ref={mapRef}
          onDataUpdate={setMapData}
          selectedDistrict={selectedDistrict}
          selectedLayers={selectedLayers}
          selectedAffiliations={selectedAffiliations}
          extraFilters={{
            techConditions: selectedTechConditions,
            search: searchQuery
          }}
          setTotalCount={(v) => setStats(s => ({...s, count: v}))}
          setTotalPopulation={(v) => setStats(s => ({...s, pop: v}))}
          setAvgVisit={(v) => setStats(s => ({...s, visit: v}))}
          setAvgPerson={(v) => setStats(s => ({...s, person: v}))}
        />
      </div>

      <div className="absolute bottom-6 right-6 z-30">
        <BuildingLegend />
      </div>
    </div>
  )
}