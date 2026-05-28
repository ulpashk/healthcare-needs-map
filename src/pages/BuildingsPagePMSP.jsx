"use client"

import { useState, useRef } from "react"
import MapView from "../components/PmspComponents/MapV"
import MapFilter from "../components/PmspComponents/MapFilter/MapFilter"
import BuildingRiskPanel from "../components/BuildingsPage/Modal/BuildingRiskPanel"

export default function BuildingsPagePMSP() {
  const [selectedDistrict, setSelectedDistrict] = useState("")
  const [mapData, setMapData] = useState(null)
  const [selectedLayers, setSelectedLayers] = useState(["Все слои"]);
  const mapRef = useRef(null)
  
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="h-full w-full">
        <MapView 
          mode="infrastructure"
          ref={mapRef}
          selectedDistrict={selectedDistrict ? [selectedDistrict] : ["Все районы"]}
          selectedLayers={selectedLayers}
          onDataUpdate={setMapData}
        />
      </div>
    </div>
  )
}