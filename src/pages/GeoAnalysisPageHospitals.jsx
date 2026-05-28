import React, { useState, useEffect, useMemo } from 'react';
import HospitalMapView from '../components/HospitalComponents/HospitalMapView';
import HospitalFilter from '../components/HospitalComponents/HospitalFilter';
import { HospitalService } from '../services/hospitalApiService';
import RefusalsModal from '../components/HospitalComponents/Modals/RefusalsModal';
import ProfilesDeficitModal from '../components/HospitalComponents/Modals/ProfilesDeficitModal';

export default function GeoAnalysisPageHospitals() {
  const [data, setData] = useState({
    hospitals: [],
    refusals: [],
    plannedZones: null,
    plannedObjects: null,
    gridCells: null,
    profilesSummary: null,
  });
  
  const [loading, setLoading] = useState(true);
  const [focusedRefusal, setFocusedRefusal] = useState(null);
  
  const [filters, setFilters] = useState({
    district: "Все районы",
    mapMode: "geo", // Режим геоанализа по умолчанию
    geoAccessMode: "current", // "current" или "planned"
    activeGeoLayers: ["zones", "grid"], // Слои: zones, grid, refusals, profiles
    selectedTechConditions: [],
    searchQuery: ""
  });

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [hosp, ref, zones, objs, grid, prof] = await Promise.all([
          HospitalService.getHospitals(),
          HospitalService.getRefusals(),
          HospitalService.getPlannedZones(),
          HospitalService.getPlannedObjects(),
          HospitalService.getGridCells(),
          HospitalService.getBedProfilesSummary()
        ]);

        setData({
          hospitals: hosp.results,
          refusals: ref.results || [],
          plannedZones: zones,
          plannedObjects: objs,
          gridCells: grid,
          profilesSummary: prof
        });
      } catch (err) {
        console.error("Ошибка загрузки данных геоанализа:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, []);

  // Фильтрация стационаров для отображения на карте
  const filteredHospitals = useMemo(() => {
    return data.hospitals.filter(h => {
      if (filters.district !== "Все районы" && h.district !== filters.district) return false;
      if (filters.searchQuery && !h.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [data.hospitals, filters]);

  if (loading) return <div className="h-full w-full flex items-center justify-center">Загрузка гео-слоев (Grid, Zones)...</div>;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <HospitalMapView 
        facilities={filteredHospitals}
        mapMode={filters.mapMode}
        // Передаем дополнительные гео-данные
        gridCells={data.gridCells}
        plannedZones={data.plannedZones}
        plannedObjects={data.plannedObjects}
        refusalsData={data.refusals}
        activeGeoLayers={filters.activeGeoLayers}
        geoAccessMode={filters.geoAccessMode}
        focusedRefusal={focusedRefusal}
      />

      <div className="absolute top-4 left-4 z-10">
        <HospitalFilter 
          facilities={filteredHospitals}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>

      {/* Модальное окно отказов (если слой активен) */}
      {filters.activeGeoLayers.includes("refusals") && (
        <RefusalsModal 
          data={data.refusals}
          onItemClick={(item) => setFocusedRefusal({...item, _t: Date.now()})}
          onClose={() => setFilters(f => ({...f, activeGeoLayers: f.activeGeoLayers.filter(l => l !== 'refusals')}))}
        />
      )}

      {/* Модальное окно дефицита профилей */}
      {filters.activeGeoLayers.includes("profiles") && (
        <ProfilesDeficitModal 
          data={data.profilesSummary}
          onClose={() => setFilters(f => ({...f, activeGeoLayers: f.activeGeoLayers.filter(l => l !== 'profiles')}))}
        />
      )}
    </div>
  );
}