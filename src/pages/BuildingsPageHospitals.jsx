import React, { useState, useEffect, useMemo } from 'react';
import HospitalMapView from '../components/HospitalComponents/HospitalMapView';
import HospitalFilter from '../components/HospitalComponents/HospitalFilter';
import { HospitalService } from '../services/hospitalApiService';
import MapLegendHospitals from '../components/HospitalComponents/MapLegendHospitals';
import BuildingAnalysisModalHospitals from '../components/HospitalComponents/BuildingAnalysisModalHospitals';

export default function BuildingsPageHospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [focusedHospitalId, setFocusedHospitalId] = useState(null);
  
  const [filters, setFilters] = useState({
    district: "Все районы",
    searchQuery: "",
    selectedTechConditions: [],
    mapMode: "buildings"
  });

  useEffect(() => {
    HospitalService.getHospitals().then(data => {
      setHospitals(data.results);
      setLoading(false);
    });
  }, []);

  const filteredHospitals = useMemo(() => {
    return hospitals.filter(h => {
      // Фильтр поиска
      if (filters.searchQuery && !h.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
      
      // Фильтр тех. состояния (логика из Next.js)
      if (filters.selectedTechConditions.length > 0) {
        let conditionKey = "gray";
        if (h.bld_emergency) conditionKey = "dark-red";
        else if (h.bld_condition?.includes("Аварийное")) conditionKey = "red";
        else if (h.bld_seismic) conditionKey = "orange";
        else if (h.bld_condition?.includes("Ветхое") || h.bld_condition?.includes("Неудовлетворительное")) conditionKey = "yellow";
        else if (h.bld_condition?.includes("Исправное")) conditionKey = "green";
        
        if (!filters.selectedTechConditions.includes(conditionKey)) return false;
      }
      return true;
    });
  }, [hospitals, filters]);

  if (loading) return <div className="h-full w-full flex items-center justify-center">Загрузка данных...</div>;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <HospitalMapView 
        facilities={filteredHospitals}
        mapMode={filters.mapMode}
        focusedHospitalId={focusedHospitalId}
      />
      
      <div className="absolute top-4 left-4 z-10">
        <HospitalFilter 
          facilities={filteredHospitals}
          filters={filters}
          onFiltersChange={setFilters}
          onShowBuildingAnalysis={() => setShowAnalysis(true)}
        />
      </div>

      <MapLegendHospitals mapMode={filters.mapMode} />

      {showAnalysis && (
        <BuildingAnalysisModalHospitals 
          data={hospitals} 
          onClose={() => setShowAnalysis(false)}
          onHospitalClick={(id) => {
            setFocusedHospitalId(id);
            setShowAnalysis(false);
          }}
        />
      )}
    </div>
  );
}