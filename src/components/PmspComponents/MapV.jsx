"use client";

import { forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { useMapInitialization } from '../../hooks/useMapInitialization';
import { useMapData } from '../../hooks/useMapData';
import { MapLayersManager } from '../../utils/mapLayers';
import { MapControls } from '../general/MapControls';
import { LoadingOverlay } from '../general/LoadingOverlay';
import { HealthcareService } from '../../services/apiService';
import 'maplibre-gl/dist/maplibre-gl.css';

const MapView = forwardRef(({
  setBuildingData = () => {},
  setShowDetailCard = () => {},
  showDetailCard,
  selectedDistrict = ["Все районы"],
  selectedLayers = ["Все слои"],
  selectedVisits = ["Все посещения"],
  selectedAffiliations = ["all"], 
  setTotalCount = () => {},
  setTotalPopulation = () => {},
  setAvgVisit = () => {},
  setAvgPerson = () => {},
  onDataUpdate = () => {},
  geoMode = "",
  mode = "load",
  activeScenario = 'current', 
  isPlanningActive = false,
}, ref) => {
  const mapContainer = useRef(null);
  const { mapRef, isLoading: mapLoading, zoomIn, zoomOut, resetView } = useMapInitialization(mapContainer);
  const {filterData, isLoading: dataLoading, isReady, data: rawCacheData } = useMapData(mode); 
  const activePopupRef = useRef(null);
  const showFullLoader = mapLoading || !isReady;

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
        activeScenario: activeScenario
      });

      if (!data || !data.city) return;
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

  }, [selectedDistrict, selectedVisits, selectedLayers, selectedAffiliations, isPlanningActive, mode, geoMode, filterData, isReady, rawCacheData, activeScenario]);

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

      <LoadingOverlay isLoading={showFullLoader} />
    </div>
  );
});

export default MapView;
