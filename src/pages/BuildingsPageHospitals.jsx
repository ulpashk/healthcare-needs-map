import React, { useState, useEffect, useMemo } from 'react';
import HospitalMapView from '../components/HospitalComponents/HospitalMapView';
import HospitalFilter from '../components/HospitalComponents/HospitalFilter';
import { HospitalService } from '../services/hospitalApiService';
import MapLegendHospitals from '../components/HospitalComponents/MapLegendHospitals';
import BuildingAnalysisModalHospitals from '../components/HospitalComponents/BuildingAnalysisModalHospitals';
import { useHospitalQueries } from '../hooks/useHospitalQueries';

export default function BuildingsPageHospitals() {
  const { data, isLoading } = useHospitalQueries('buildings');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [focusedHospitalId, setFocusedHospitalId] = useState(null);
  
  const [hospitals, setHospitals] = useState([]);
  const [seismicData, setSeismicData] = useState([]);
  // const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    district: "Все районы",
    searchQuery: "",
    selectedTechConditions: [],
    facilityTypes: [],
    ownTypes: [],  
    mapMode: "buildings",
    showSeismicGrid: false,
    profileGroups: [],
  });

  // useEffect(() => {
  //   const loadData = async () => {
  //     try {
  //       const [hospRes, seismicRes] = await Promise.all([
  //         HospitalService.getHospitals(),
  //         HospitalService.getSeismicPoints()
  //       ]);
  //       setHospitals(hospRes.results);
  //       setSeismicData(seismicRes);
  //     } catch (err) {
  //       console.error("Ошибка загрузки:", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   loadData();
  // }, []);

  // const filteredHospitals = useMemo(() => {
  //   return hospitals.filter(h => {
  //     if (filters.searchQuery && !h.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
      
  //     if (filters.district && filters.district !== "Все районы") {
  //       if (!h.district.includes(filters.district)) return false;
  //     }

  //     if (filters.selectedTechConditions.length > 0) {
  //       let conditionKey = "gray";
  //       if (h.bld_emergency) conditionKey = "dark-red";
  //       else if (h.bld_tech?.includes("Аварийное")) conditionKey = "red";
  //       else if (h.bld_seismic) conditionKey = "orange";
  //       else if (h.bld_tech?.includes("Ветхое") || h.bld_tech?.includes("Неудовлетворительное")) conditionKey = "yellow";
  //       else if (h.bld_tech?.includes("Исправное")) conditionKey = "green";
        
  //       if (!filters.selectedTechConditions.includes(conditionKey)) return false;
  //     }

  //     if (filters.facilityTypes.length > 0) {
  //       if (!filters.facilityTypes.includes(h.org_type)) return false;
  //     }

  //     if (filters.ownTypes.length > 0) {
  //       if (!filters.ownTypes.includes(h.own_type)) return false;
  //     }
  //     if (filters.profileGroups.length > 0) {
  //       if (!h.profile_groups || !h.profile_groups.some(p => filters.profileGroups.includes(p))) {
  //         return false;
  //       }
  //     }
  //     return true;
  //   });
  // }, [hospitals, filters]);

  const filteredHospitals = useMemo(() => {
    return data.hospitals.filter(h => {
      if (filters.searchQuery && !h.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
      if (filters.district && filters.district !== "Все районы" && !h.district.includes(filters.district)) return false;

      if (filters.selectedTechConditions.length > 0) {
        let conditionKey = "gray";
        if (h.bld_emergency) conditionKey = "dark-red";
        else if (h.bld_tech?.includes("Аварийное")) conditionKey = "red";
        else if (h.bld_seismic) conditionKey = "orange";
        else if (h.bld_tech?.includes("Ветхое") || h.bld_tech?.includes("Неудовлетворительное")) conditionKey = "yellow";
        else if (h.bld_tech?.includes("Исправное")) conditionKey = "green";
        if (!filters.selectedTechConditions.includes(conditionKey)) return false;
      }

      if (filters.facilityTypes.length > 0 && !filters.facilityTypes.includes(h.org_type)) return false;
      if (filters.ownTypes.length > 0 && !filters.ownTypes.includes(h.own_type)) return false;
      if (filters.profileGroups.length > 0) {
        if (!h.profile_groups || !h.profile_groups.some(p => filters.profileGroups.includes(p))) return false;
      }
      return true;
    });
  }, [data.hospitals, filters]);

  if (isLoading) return <div className="h-full w-full flex items-center justify-center">Загрузка данных...</div>;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <HospitalMapView 
        facilities={filteredHospitals}
        selectedDistrict={filters.district}
        mapMode={filters.mapMode}
        focusedHospitalId={focusedHospitalId}
        seismicData={data.seismic}
        showSeismicGrid={filters.showSeismicGrid}
      />
      
      <div className="absolute top-4 left-4 z-10">
        <HospitalFilter 
          facilities={filteredHospitals}
          allFacilities={data.hospitals}
          filters={filters}
          onFiltersChange={setFilters}
          onShowBuildingAnalysis={() => setShowAnalysis(true)}
        />
      </div>

      <MapLegendHospitals mapMode={filters.mapMode} />

      {showAnalysis && (
        <BuildingAnalysisModalHospitals 
          data={data.hospitals} 
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