import React, { useState, useEffect, useMemo } from 'react';
import HospitalMapView from '../components/HospitalComponents/HospitalMapView';
import HospitalFilter from '../components/HospitalComponents/HospitalFilter';
import { HospitalService } from '../services/hospitalApiService';
import RefusalsModal from '../components/HospitalComponents/Modals/RefusalsModal';
import ProfilesDeficitModal from '../components/HospitalComponents/Modals/ProfilesDeficitModal';
import OrgTypeGridPanel from '../components/HospitalComponents/OrgTypeGridPanel';
import MapLegendHospitals from '../components/HospitalComponents/MapLegendHospitals';
import { useHospitalQueries } from '../hooks/useHospitalQueries';

export default function GeoAnalysisPageHospitals() {
  const { data, isLoading } = useHospitalQueries('geo');
  const [focusedRefusal, setFocusedRefusal] = useState(null);
  const [selectedOrgType, setSelectedOrgType] = useState(null);
  const [focusedHospitalId, setFocusedHospitalId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    district: "Все районы",
    mapMode: "geo",
    geoAccessMode: "current",
    activeGeoLayers: ["zones", "grid"],
    selectedTechConditions: [],
    searchQuery: ""
  });

  const filteredPlannedObjects = useMemo(() => {
    if (!data.plannedObjects) return null;
    return {
      ...data.plannedObjects,
      features: data.plannedObjects.features.filter(f => 
        ["Больница", "Многопрофильная Больница"].includes(f.properties.obj_type)
      )
    };
  }, [data.plannedObjects]);

  const filteredHospitals = useMemo(() => {
    return data.hospitals.filter(h => {
      if (filters.district && filters.district !== "Все районы" && !h.district.includes(filters.district)) return false;
      if (filters.searchQuery && !h.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [data.hospitals, filters]);

  if (isLoading) return <div className="h-full w-full flex items-center justify-center">Загрузка гео-слоев (Grid, Zones)...</div>;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <HospitalMapView 
        facilities={filteredHospitals}
        districtsGeoJson={data.districts}
        mapMode="geo"
        gridCells={data.gridCells}
        plannedZones={data.plannedZones}
        plannedObjects={filteredPlannedObjects}
        recommendations={data.recommendations}
        refusalsData={data.refusals?.results || []} 
        activeGeoLayers={filters.activeGeoLayers}
        geoAccessMode={filters.geoAccessMode}
        focusedRefusal={focusedRefusal}
        focusedHospitalId={focusedHospitalId}
        selectedOrgTypeForGrid={selectedOrgType}
        selectedDistrict={filters.district}
      />

      <div className="absolute top-4 left-4 z-10">
        <HospitalFilter 
          facilities={filteredHospitals}
          allFacilities={data.hospitals}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>

      <MapLegendHospitals mapMode={filters.mapMode} />

      {filters.activeGeoLayers.includes("orgTypeGrid") && (
        <OrgTypeGridPanel 
          onClose={() => setFilters(prev => ({
            ...prev, 
            activeGeoLayers: prev.activeGeoLayers.filter(l => l !== 'orgTypeGrid')
          }))}
          hospitals={data.hospitals}
          selectedType={selectedOrgType}
          onSelectType={setSelectedOrgType}
          onHospitalClick={(h) => setFocusedHospitalId(h.unified_id)}
        />
      )}

      {filters.activeGeoLayers.includes("refusals") && (
        <RefusalsModal 
          data={data.refusals} 
          onItemClick={(item) => setFocusedRefusal({...item, _t: Date.now()})}
          onClose={() => setFilters(f => ({...f, activeGeoLayers: f.activeGeoLayers.filter(l => l !== 'refusals')}))}
        />
      )}

      {filters.activeGeoLayers.includes("profiles") && (
        <ProfilesDeficitModal 
          data={data.profilesSummary}
          onClose={() => setFilters(f => ({...f, activeGeoLayers: f.activeGeoLayers.filter(l => l !== 'profiles')}))}
        />
      )}
    </div>
  );
}