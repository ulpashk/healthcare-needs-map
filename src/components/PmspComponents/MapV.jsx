"use client";

import { forwardRef, useImperativeHandle, useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { useMapInitialization } from '../../hooks/useMapInitialization';
import { useMapData } from '../../hooks/useMapData';
import { MapLayersManager } from '../../utils/mapLayers';
import { MapControls } from '../general/MapControls';
import { LoadingOverlay } from '../general/LoadingOverlay';
import { HealthcareService } from '../../services/apiService';
import { AnalysisSidebar } from '../map/AnalysisSidebar';
import 'maplibre-gl/dist/maplibre-gl.css';

const MapView = forwardRef(({
  setBuildingData = () => {},
  setShowDetailCard = () => {},
  showDetailCard,
  selectedDistrict = ["Все районы"],
  selectedLayers = ["Все слои"],
  selectedVisits = ["Все посещения"],
  selectedAffiliations = ["all"], 
  extraFilters = { search: "", techConditions: [] }, 
  setTotalCount = () => {},
  setTotalPopulation = () => {},
  setAvgVisit = () => {},
  setAvgPerson = () => {},
  onDataUpdate = () => {},
  geoMode = "",
  mode = "load",
  activeScenario = 'current', 
  isPlanningActive = false,
  isMapPlanningActive = false,
}, ref) => {
  const mapContainer = useRef(null);
  const { mapRef, isLoading: mapLoading, zoomIn, zoomOut, resetView } = useMapInitialization(mapContainer);
  const {filterData, isLoading: dataLoading, isReady, data: rawCacheData } = useMapData(mode); 
  const activePopupRef = useRef(null);
  const showFullLoader = mapLoading || !isReady;
  const dataRef = useRef(null);
  const previousPointRef = useRef(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [currentData, setCurrentData] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const removeExistingPopup = () => {
    if (activePopupRef.current) {
      activePopupRef.current.remove();
      activePopupRef.current = null;
    }
  };

  useImperativeHandle(ref, () => ({
    zoomToLocation: (item) => {
      if (!mapRef.current) return;
      let center;
      let properties;
      if (item.geometry) {
        properties = item.properties;
        try {
          const geom = item.geometry;
          const ring = geom.type === 'MultiPolygon' ? geom.coordinates[0][0] : geom.coordinates[0];
          
          let sumLng = 0, sumLat = 0;
          ring.forEach(c => { sumLng += c[0]; sumLat += c[1]; });
          
          center = [sumLng / ring.length, sumLat / ring.length];
        } catch (e) {
          console.error("Ошибка расчета центра полигона", e);
          return;
        }
      } else {
        properties = item;
        center = [parseFloat(item.lng || item.longitude), parseFloat(item.lat || item.latitude)];
      }

      if (isNaN(center[0]) || isNaN(center[1])) return;

      removeExistingPopup();

      mapRef.current.flyTo({
        center: center,
        zoom: 15,
        essential: true
      });

      activePopupRef.current = new maplibregl.Popup({ 
        offset: 10, 
        closeButton: true,
        maxWidth: '450px' 
      })
        .setLngLat(center)
        .setHTML(MapLayersManager.getPopupContent(properties, mode))
        .addTo(mapRef.current);
        
      if (properties.unified_id || properties.id) {
        setBuildingData(properties);
        setShowDetailCard(true);
      }
    }
  }));

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;

    const handleMapClick = async (e) => {
      const layers = [
        'pmsp-layer', 'infra-points', 'zhk-points-unclustered-circle', 
        'planned-objs-unclustered-circle', 'geo-markers-layer', 'planned-fill'
      ];

      if (isMapPlanningActive) {
        const { lng, lat } = e.lngLat;
        
        setIsSimulating(false);
        MapLayersManager.updateAnalysisZone(map, { lng, lat }, 1200);
        
        if (dataRef.current) {
          const stats = MapLayersManager.calculateAnalysisStats({ lng, lat }, dataRef.current);
          if (stats) {
            setAnalysisResults({ ...stats, address: "Точка на карте" });      
          }
        }
        MapLayersManager.bringAnalysisToFront(map);
        return;
      }

      const activeLayers = layers.filter(id => map.getLayer(id));
      const features = map.queryRenderedFeatures(e.point, { layers: activeLayers });

      if (features.length > 0) {
        const feature = features[0];
        const props = feature.properties;
        const layerId = feature.layer.id;

        if (layerId === 'planned-fill' && !isPlanningActive) return;

        removeExistingPopup();

        const popup = new maplibregl.Popup({ offset: 10, closeButton: true, maxWidth: '450px' })
          .setLngLat(e.lngLat)
          .setHTML(MapLayersManager.getPopupContent(props, mode))
          .addTo(map);
        activePopupRef.current = popup;

        if (['pmsp-layer', 'infra-points', 'geo-markers-layer'].includes(layerId)) {
          try {
            const targetId = props.unified_id || props.id;
            const detailedData = await HealthcareService.getPmspDetail(targetId);
            popup.setHTML(MapLayersManager.getPopupContent(detailedData, mode));
          } catch (err) {
            console.error("Popup details error:", err);
          }
        }
      }
    };

    const handleMouseMove = (e) => {
      if (isMapPlanningActive) {
        map.getCanvas().style.cursor = 'crosshair';
        return;
      }
      const layers = [
        'pmsp-layer', 'infra-points', 'zhk-points-unclustered-circle', 'zhk-points-cluster-circle',
        'planned-objs-unclustered-circle', 'planned-objs-cluster-circle', 'geo-markers-layer', 'planned-fill'
      ];
      const activeLayers = layers.filter(id => map.getLayer(id));
      const features = map.queryRenderedFeatures(e.point, { layers: activeLayers });

      if (features.length > 0) {
        const f = features[0];
        if (f.layer.id === 'planned-fill' && !isPlanningActive) {
          map.getCanvas().style.cursor = '';
        } else {
          map.getCanvas().style.cursor = 'pointer';
        }
      } else {
        map.getCanvas().style.cursor = '';
      }
    };

    const updateMap = async () => {
      const data = filterData({
        districts: selectedDistrict,
        visits: selectedVisits,
        layers: selectedLayers,
        affiliations: selectedAffiliations, 
        activeScenario: activeScenario, 
        extraFilters: extraFilters, 
        simulatedPoint: isSimulating ? analysisResults?.lngLat : null
      });

      if (!data || !data.city) return;
      dataRef.current = data; 
      setCurrentData(data);
      if (onDataUpdate) onDataUpdate(data);

      MapLayersManager.setupCityBoundary(map, data.city);
      MapLayersManager.updateDistricts(map, data.districts);

      if (mode === "geo-analysis") {
        MapLayersManager.hideServiceZones(map);
        if (data.grid) MapLayersManager.updateGridLayer(map, data.grid, geoMode === "walkaccess");
        if (data.heatDeficit && data.heatCoverage) {
          MapLayersManager.updateHeatmapLayer(map, data.heatDeficit, geoMode === "deficit", 'deficit', ['#FDD835', '#EF6C00', '#C62828']);
          MapLayersManager.updateHeatmapLayer(map, data.heatCoverage, geoMode === "deficit", 'coverage', ['#A5D6A7', '#43A047', '#1B5E20']);
        }
      }

      const isAll = selectedLayers.includes("Все слои");
      if (mode !== "geo-analysis" && data.serviceZones) {
        MapLayersManager.updateServiceZones(map, data.serviceZones, isAll || selectedLayers.includes("Зоны обслуживания МО"));
      }

      const showGenplan = isAll || selectedLayers.includes("Зоны здравоохранения (генплан)");
      if (data.plannedZones) MapLayersManager.updatePlannedZones(map, data.plannedZones, showGenplan, isPlanningActive);
      if (data.plannedObjs) MapLayersManager.updatePlannedObjects(map, data.plannedObjs, isAll || selectedLayers.includes("Планируемые объекты здравоохранения"));
      if (data.zhk) MapLayersManager.updateZhkPoints(map, data.zhk, isAll || selectedLayers.includes("Планируемые жилые объекты (ЖКХ)"));

      if (mode === "infrastructure") {
        MapLayersManager.updateInfrastructureLayers(map, data.pmsp, true);
        if (map.getLayer('pmsp-layer')) map.setLayoutProperty('pmsp-layer', 'visibility', 'none');
      } else if (mode === "geo-analysis") {
        MapLayersManager.updateGeoMarkers(map, data.pmsp, true);
      } else {
        MapLayersManager.updatePmspPoints(map, data.pmsp, true);
      }

      MapLayersManager.applyLayerOrder(map);

      if (analysisResults) {
        MapLayersManager.bringAnalysisToFront(map);
      }

      if (map.getLayer('planned-objs-cluster-circle')) MapLayersManager.setupClusterClicks(map, 'planned-objs');
      if (map.getLayer('zhk-points-cluster-circle')) MapLayersManager.setupClusterClicks(map, 'zhk-points');

      setTotalCount(data.stats.totalCount);
      setTotalPopulation(data.stats.totalPopulation);
      setAvgVisit(data.stats.avgVisit);
      setAvgPerson(data.stats.avgPerson);
    };

    if (map.isStyleLoaded()) updateMap();
    else map.once('load', updateMap);

    map.on('click', handleMapClick);
    map.on('mousemove', handleMouseMove);

    if (!isPlanningActive && activePopupRef.current) removeExistingPopup();

    return () => {
      map.off('click', handleMapClick);
      map.off('mousemove', handleMouseMove);
      map.getCanvas().style.cursor = '';
    };

  }, [selectedDistrict, selectedVisits, selectedLayers, selectedAffiliations, extraFilters, isPlanningActive, isMapPlanningActive, isSimulating, analysisResults, mode, geoMode, filterData, isReady, rawCacheData, activeScenario]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleGlobalFlyTo = (e) => {
      const { lng, lat, address } = e.detail;

      setIsSimulating(false); 
      removeExistingPopup();

      map.flyTo({
        center: [lng, lat],
        zoom: 13,
        essential: true
      });

      MapLayersManager.updateAnalysisZone(map, { lng, lat }, 1200);

      if (dataRef.current) {
        const stats = MapLayersManager.calculateAnalysisStats({ lng, lat }, dataRef.current);
        
        if (stats) {
          setAnalysisResults({ ...stats, address, lngLat: { lng, lat } });
        } else {
          console.warn("calculateAnalysisStats вернул null");
        }
      } else {
        console.error("Данные (dataRef.current) еще не загружены в карту");
      }

      const popup = new maplibregl.Popup({ offset: 10, closeButton: true })
        .setLngLat([lng, lat])
        .setHTML(`
          <div style="padding: 8px; font-family: sans-serif; min-width: 200px;">
            <div style="font-weight: bold; color: #3b82f6; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
              <span style="font-size: 16px;">🔍</span> Анализ локации
            </div>
            <div style="font-size: 11px; color: #666; margin-bottom: 8px;">${address}</div>
            <div style="border-top: 1px solid #eee; pt-2; font-size: 12px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span>Статус:</span> <b style="color: #2e7d32;">Обработка...</b>
              </div>
            </div>
          </div>
        `)
        .addTo(map);
      
      activePopupRef.current = popup;
    };

    window.addEventListener('map-fly-to', handleGlobalFlyTo);

    return () => {
      window.removeEventListener('map-fly-to', handleGlobalFlyTo);
    };
  }, [mapRef.current, isReady]);

  useEffect(() => {
    if (!isMapPlanningActive) {
      setAnalysisResults(null);
      if (mapRef.current) {
        MapLayersManager.updateAnalysisZone(mapRef.current, null);
      }
      setIsSimulating(false);
    }
  }, [isMapPlanningActive]);

  useEffect(() => {
    const point = analysisResults?.lngLat;

    if (!point) return;

    const previousPoint = previousPointRef.current;

    if (
      previousPoint &&
      (
        previousPoint.lat !== point.lat ||
        previousPoint.lng !== point.lng
      )
    ) {
      setIsSimulating(false);
    }

    previousPointRef.current = point;
  }, [
    analysisResults?.lngLat?.lat,
    analysisResults?.lngLat?.lng
  ]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !isReady || isSimulating) return;

    const data = filterData({
      districts: selectedDistrict,
      visits: selectedVisits,
      layers: selectedLayers,
      affiliations: selectedAffiliations,
      activeScenario,
      extraFilters,
      simulatedPoint: null
    });

    if (!data?.grid) return;

    MapLayersManager.resetImpact(map);

    MapLayersManager.updateGridLayer(
      map,
      data.grid,
      geoMode === "walkaccess"
    );
  }, [
    isSimulating,
    isReady,
    filterData,
    selectedDistrict,
    selectedVisits,
    selectedLayers,
    selectedAffiliations,
    activeScenario,
    extraFilters,
    geoMode
  ]);

  return (
    <div className="relative w-full h-full">
      <MapControls
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetView}
      />

      <div
        className="w-full h-full"
        ref={mapContainer}
      />

      {analysisResults && (
        <AnalysisSidebar 
          results={analysisResults} 
          isSimulating={isSimulating}
          onSimulate={() => setIsSimulating(!isSimulating)}
          onClose={() => {
            setAnalysisResults(null);
            setIsSimulating(false);
            if (mapRef.current) {
              MapLayersManager.updateAnalysisZone(mapRef.current, null);
            }
          }} 
        />
      )}

      <LoadingOverlay isLoading={showFullLoader} />
    </div>
  );
});

export default MapView;