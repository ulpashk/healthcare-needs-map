"use client";

import React, { useEffect, useRef, useState, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import { useMapInitialization } from '../../hooks/useMapInitialization';
import { HospitalService } from '../../services/hospitalApiService';
import { MapControls } from '../general/MapControls';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getMoSettings } from '../../constants/mo-config';

const shortenName = (name) => {
  if (!name) return "";
  return name
    .replace('Городская клиническая больница', 'ГКБ')
    .replace('Центральная городская клиническая больница', 'ЦГКБ')
    .replace('Городская детская клиническая больница', 'ГДКБ');
};

function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const dy = (lat2 - lat1) * 111000;
  const dx = (lng2 - lng1) * 111000 * Math.cos(lat1 * Math.PI / 180);
  return Math.sqrt(dx * dx + dy * dy);
}

function computeGridData(gridGeoJSON, targets) {
  if (!gridGeoJSON || !targets.length) return gridGeoJSON;
  const features = gridGeoJSON.features.map(f => {
    const coords = f.geometry.coordinates[0][0][0]; 
    let minD = Infinity;
    for (const p of targets) {
      const d = getDistanceMeters(coords[1], coords[0], p.lat, p.lng);
      if (d < minD) minD = d;
    }
    let color = "#C62828";
    if (minD <= 1200) color = "#2E7D32";
    else if (minD <= 5000) color = "#1565C0";
    return { ...f, properties: { ...f.properties, dynamicColor: color } };
  });
  return { ...gridGeoJSON, features };
}

function enrichZonesWithEverything(zones, plannedObjs, recommendations = []) {
  if (!zones || !zones.features) return zones;

  const features = zones.features
    .filter(f => f.properties.priority !== "critical")
    .map((zone) => {
      const zoneId = zone.id || zone.properties.id;

      let coords;
      try {
        coords = zone.geometry.type === "MultiPolygon" 
          ? zone.geometry.coordinates[0][0][0] 
          : zone.geometry.coordinates[0][0];
      } catch (e) { return zone; }

      let isPlanned = false;
      let plannedName = "";
      if (plannedObjs && plannedObjs.features) {
        for (const obj of plannedObjs.features) {
          const d = getDistanceMeters(coords[1], coords[0], obj.geometry.coordinates[1], obj.geometry.coordinates[0]);
          if (d <= 2500) {
            isPlanned = true;
            plannedName = obj.properties.name;
            break;
          }
        }
      }

      const rec = recommendations.find(r => r.zone_id === zoneId && r.type !== "ПМСП");

      return {
        ...zone,
        properties: {
          ...zone.properties,
          is_planned: isPlanned,
          planned_hosp_name: plannedName,
          has_rec: !!rec,
          rec_type: rec ? rec.type : "",
          rec_reason: rec ? rec.reason : "",
          rec_scale: rec ? rec.scale : ""
        }
      };
    });

  return { ...zones, features };
}

function computeOrgTypeGrid(gridGeoJSON, targets, nearThreshold, farThreshold) {
  if (!gridGeoJSON || !targets.length) return gridGeoJSON;

  const features = gridGeoJSON.features.map((f) => {
    const coords = f.geometry.coordinates[0][0]; 
    const cellLng = (coords[0][0] + coords[2][0]) / 2;
    const cellLat = (coords[0][1] + coords[2][1]) / 2;

    let minD = Infinity;
    for (const p of targets) {
      const d = getDistanceMeters(cellLat, cellLng, p.lat, p.lng);
      if (d < minD) minD = d;
    }

    let color = "#E53935";
    if (minD <= nearThreshold) color = "#43A047";
    else if (minD <= farThreshold) color = "#FB8C00";

    return {
      ...f,
      properties: { 
        ...f.properties, 
        typeGridColor: color,
        dist: minD 
      }
    };
  });

  return { ...gridGeoJSON, features };
}

export default function HospitalMapView({ 
  facilities = [],
  mapMode = "buildings",
  selectedDistrict = "Все районы",
  seismicData = [],
  showSeismicGrid = false,
  focusedHospitalId = null,
  activeGeoLayers = [],
  gridCells = null,
  plannedZones = null,
  plannedObjects = null,
  refusalsData = [],
  recommendations = [],
  geoAccessMode = "current", 
  focusedRefusal = null,
  selectedOrgTypeForGrid = null,
}) {
  const mapContainer = useRef(null);
  const { mapRef, isLoading, zoomIn, zoomOut, resetView } = useMapInitialization(mapContainer);
  const activePopupRef = useRef(null);
  const [districtsGeoJson, setDistrictsGeoJson] = useState(null);

  useEffect(() => {
    fetch("https://admin.smartalmaty.kz/api/v1/address/districts?city=1")
      .then(res => res.json())
      .then(data => setDistrictsGeoJson(data.results));
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !districtsGeoJson) return;

    const updateDistrictLayer = () => {
      if (!map.isStyleLoaded()) return;

      const sourceId = 'districts-source';
      
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, { type: 'geojson', data: districtsGeoJson });
      }

      if (map.getLayer('districts-fill')) map.removeLayer('districts-fill');
      if (map.getLayer('districts-outline')) map.removeLayer('districts-outline');

      const filterLogic = selectedDistrict === "Все районы" 
        ? ["has", "name_ru"] 
        : ["==", ["get", "name_ru"], selectedDistrict];

      map.addLayer({
        id: 'districts-fill',
        type: 'fill',
        source: sourceId,
        filter: filterLogic,
        paint: {
          'fill-color': '#3772ff',
          'fill-opacity': selectedDistrict === "Все районы" ? 0.05 : 0.2
        }
      }, 'hospitals-layer');

      map.addLayer({
        id: 'districts-outline',
        type: 'line',
        source: sourceId,
        filter: filterLogic,
        paint: {
          'line-color': '#3772ff',
          'line-width': selectedDistrict === "Все районы" ? 1 : 2,
          'line-opacity': 0.5
        }
      }, 'hospitals-layer');
    };

    updateDistrictLayer();
  }, [selectedDistrict, districtsGeoJson, isLoading]);

  useEffect(() => {
    const styleId = 'hospital-popup-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .ml-card { max-width:300px; font-family: sans-serif; }
        .ml-hd { padding: 8px 0; border-bottom: 1px solid #eee; margin-bottom: 8px; }
        .ml-ttl { font-weight: bold; font-size: 14px; color: #111; margin: 0; }
        .ml-meta { display: flex; gap: 4px; margin-top: 4px; flex-wrap: wrap; }
        .ml-pill { background: #f3f4f6; border-radius: 4px; padding: 2px 6px; font-size: 10px; color: #4b5563; }
        .ml-occ-badge { font-weight: bold; font-size: 11px; padding: 2px 8px; border-radius: 10px; display: inline-block; }
        .ml-row { display: flex; justify-content: space-between; font-size: 11px; margin: 4px 0; }
        .ml-bar { height: 6px; background: #eee; border-radius: 3px; overflow: hidden; margin-top: 2px; }
        .ml-bar i { display: block; height: 100%; border-radius: 3px; }
        .ml-section-title { font-size: 10px; font-weight: bold; color: #999; text-transform: uppercase; margin-top: 10px; }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const buildHospitalPopup = (d) => {
    const getOccColor = (cat) => {
      const map = { over: '#dc2626', vhigh: '#ea580c', high: '#f59e0b', norm: '#16a34a', low: '#6b7280', vlow: '#9ca3af' };
      return map[cat] || '#6b7280';
    };
    const occColor = getOccColor(d.occ_cat);

    return `
      <div class="ml-card">
        <div class="ml-hd">
          <h3 class="ml-ttl">${d.name}</h3>
          <div class="ml-meta">
            <span class="ml-pill">${d.org_type}</span>
            <span class="ml-pill">${d.district}</span>
          </div>
        </div>
        <div class="ml-bd">
          <div class="ml-row">
            <span class="ml-occ-badge" style="background:${occColor}22; color:${occColor}">
              Загрузка: ${d.pct_occupied}%
            </span>
            <span style="font-size:10px; color:#666">${d.ownership}</span>
          </div>
          
          <div class="ml-section-title">Коечный фонд</div>
          <div class="ml-row">
            Всего коек:</span> <b>${d.total_beds}</b>
          </div>
          <div class="ml-bar"><i style="width:${Math.min(d.pct_occupied, 100)}%; background:${occColor}"></i></div>
          
          <div class="ml-section-title">Показатели</div>
          <div class="ml-row"><span>Летальность:</span> <b style="color:${d.lethal > 2 ? '#dc2626' : '#111'}">${d.lethal}%</b></div>
          <div class="ml-row"><span>Оборот койки:</span> <b>${d.turnover}</b></div>
          
          <div class="ml-section-title">Здание</div>
          <div class="ml-row"><span>Год постройки:</span> <b>${d.bld_year || '—'}</b></div>
          <div class="ml-row"><span>Состояние:</span> <b>${d.bld_condition || 'Нет данных'}</b></div>
        </div>
      </div>
    `;
  };

  const buildRefusalPopupHTML = (item) => {
    const pctRef = item.total_emergency_visits > 0 
      ? (item.hospitalization_denied / item.total_emergency_visits * 100).toFixed(1) 
      : "0";

    return `
      <div style="padding: 12px; font-family: sans-serif; min-width: 250px; text-align: left;">
        <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px; color: #7B0000;">
          ${item.facility_type}
        </div>
        <div style="color: #666; font-size: 11px; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 4px;">
          ${item.district}
        </div>
        <div style="font-size: 12px; line-height: 1.6; color: #333;">
          Обращений: <b>${Math.round(item.total_emergency_visits).toLocaleString()}</b><br/>
          Отказано: <b>${Math.round(item.hospitalization_denied).toLocaleString()} (${pctRef}%)</b><br/>
          Занятость коек: <b>${(item.occupancy_rate_percent * 100).toFixed(1)}%</b>
        </div>
      </div>
    `;
  };

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const sourceId = "hospitals-source";
    const layerId = "hospitals-layer";

    const updateMap = () => {
      const geojsonData = {
        type: "FeatureCollection",
        features: facilities.map(h => ({
          type: "Feature",
          properties: { ...h },
          geometry: { type: "Point", coordinates: [Number(h.lng), Number(h.lat)] }
        }))
      };

      const filterLogic = (activeGeoLayers.includes("orgTypeGrid") && selectedOrgTypeForGrid)
        ? ["==", ["get", "org_type"], selectedOrgTypeForGrid]
        : undefined;

      const buildingColorLogic = [
        "case",
        ["to-boolean", ["coalesce", ["get", "bld_emergency"], false]], "#7B0000",
        ["in", "Аварийное", ["coalesce", ["get", "bld_condition"], ""]], "#B71C1C",
        ["to-boolean", ["coalesce", ["get", "bld_seismic"], false]], "#EF6C00",
        ["any",
            ["in", "Ветхое", ["coalesce", ["get", "bld_condition"], ""]],
            ["in", "Неудовлетворительное", ["coalesce", ["get", "bld_condition"], ""]]
        ], "#F9A825",
        ["in", "Исправное", ["coalesce", ["get", "bld_condition"], ""]], "#2E7D32",
        "#9e9e9e"
      ];

      const loadColorLogic = [
        "match", ["get", "occ_cat"],
        "over", "#7B0000",
        "vhigh", "#C62828",
        "high", "#EF6C00",
        "norm", "#2E7D32",
        "low", "#FDD835",
        "vlow", "#9E9E9E",
        "#9E9E9E"
      ];

      const currentColorLogic = mapMode === "buildings" ? buildingColorLogic : loadColorLogic;

      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, { type: "geojson", data: geojsonData });

        map.addLayer({
          id: layerId,
          type: "circle",
          source: sourceId,
          filter: filterLogic || ["all"],
          paint: {
            "circle-radius": [
              "max", 5, 
              ["min", 28, ["+", 7, ["*", ["sqrt", ["get", "total_beds"]], 0.45]]]
            ],
            "circle-color": currentColorLogic,
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": [
              "case",
              [">", ["get", "lethal"], 2], 3,
              1.5
            ],
            "circle-opacity": 0.9,
          },
        });

        map.on("click", layerId, async (e) => {
          const feature = e.features[0];
          const props = feature.properties;

          if (activePopupRef.current) activePopupRef.current.remove();

          const popup = new maplibregl.Popup({ offset: 15, closeButton: true })
            .setLngLat(e.lngLat)
            .setHTML('<div style="padding:10px">Загрузка...</div>')
            .addTo(map);
          
          activePopupRef.current = popup;

          try {
            const detail = await HospitalService.getHospitalDetail(props.unified_id);
            popup.setHTML(buildHospitalPopup(detail));
          } catch (err) {
            popup.setHTML(buildHospitalPopup(props));
          }
        });

        map.on("mouseenter", layerId, () => map.getCanvas().style.cursor = 'pointer');
        map.on("mouseleave", layerId, () => map.getCanvas().style.cursor = '');
      } else {
        if (map.getLayer(layerId)) {
          map.getSource(sourceId).setData(geojsonData);
          map.setPaintProperty(layerId, "circle-color", currentColorLogic);
          map.setFilter(layerId, filterLogic || ["all"]);
        }
      }
    };

    if (map.isStyleLoaded()) updateMap();
    else map.once('load', updateMap);

  }, [facilities, mapMode, isLoading, selectedOrgTypeForGrid, activeGeoLayers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || isLoading || !gridCells) return;

    const updateGeoLayers = () => {
      if (!map.isStyleLoaded() || !map.getLayer("hospitals-layer")) return;

      const isTypeActive = activeGeoLayers.includes("orgTypeGrid") && selectedOrgTypeForGrid;
      const isGeneralGridActive = activeGeoLayers.includes("grid");
      const settings = selectedOrgTypeForGrid ? getMoSettings(selectedOrgTypeForGrid) : null;

      const sourceId = "grid-source";
      const layerId = "grid-layer";

      let gridData = null;
      let shouldShowGrid = false;

      if (isGeneralGridActive) {
        shouldShowGrid = true;
        
        let points = facilities.map(f => ({ lat: f.lat, lng: f.lng }));

        if (geoAccessMode === "planned" && plannedObjects?.features) {
          plannedObjects.features.forEach(f => {
            if (f.geometry && f.geometry.coordinates) {
              points.push({ 
                lat: f.geometry.coordinates[1], 
                lng: f.geometry.coordinates[0] 
              });
            }
          });
        }

        gridData = computeGridData(gridCells, points);
      } 
      else if (isTypeActive && settings?.mode === "territorial") {
        shouldShowGrid = true;
        const targets = facilities
          .filter(f => f.org_type === selectedOrgTypeForGrid)
          .map(f => ({ lat: f.lat, lng: f.lng }));
        
        if (targets.length > 0) {
          gridData = computeOrgTypeGrid(gridCells, targets, settings.near, settings.far);
        }
      }

      if (shouldShowGrid && gridData) {
        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, { type: "geojson", data: gridData });
          map.addLayer({
            id: layerId,
            type: "fill",
            source: sourceId,
            paint: {
              "fill-color": ["coalesce", ["get", "typeGridColor"], ["get", "dynamicColor"], "#ccc"],
              "fill-opacity": 0.3
            }
          }, "hospitals-layer");
        } else {
          map.getSource(sourceId).setData(gridData);
          map.setLayoutProperty(layerId, 'visibility', 'visible');
        }
      } else {
        if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', 'none');
      }

      if (isTypeActive && settings?.mode === "zonal") {
        const districtsWithMO = Array.from(new Set(
          facilities
            .filter(f => f.org_type === selectedOrgTypeForGrid)
            .map(f => f.district.replace(" район", "").trim())
        ));
        if (map.getLayer("districts-fill")) {
          map.setPaintProperty("districts-fill", "fill-color", [
            "case", ["in", ["get", "name_ru"], ["literal", districtsWithMO]], "#43A047", "#E53935"
          ]);
          map.setPaintProperty("districts-fill", "fill-opacity", 0.4);
        }
      } else if (!shouldShowGrid) {
        if (map.getLayer("districts-fill")) {
          map.setPaintProperty("districts-fill", "fill-color", "#3772ff");
          map.setPaintProperty("districts-fill", "fill-opacity", 0.05);
        }
      }

      const showPlannedDots = geoAccessMode === "planned" && plannedObjects;
      if (showPlannedDots) {
        if (!map.getSource("planned-dots-source")) {
          map.addSource("planned-dots-source", { type: "geojson", data: plannedObjects });
          map.addLayer({
            id: "planned-dots-layer",
            type: "circle",
            source: "planned-dots-source",
            paint: {
              "circle-radius": 8,
              "circle-color": "#FF6F00",
              "circle-stroke-color": "#ffffff",
              "circle-stroke-width": 2,
              "circle-opacity": 1
            }
          });
        } else {
          map.getSource("planned-dots-source").setData(plannedObjects);
          map.setLayoutProperty("planned-dots-layer", "visibility", "visible");
        }
      } else if (map.getLayer("planned-dots-layer")) {
        map.setLayoutProperty("planned-dots-layer", "visibility", "none");
      }

      if (activeGeoLayers.includes("zones") && plannedZones) {
        const enrichedData = enrichZonesWithEverything(plannedZones, plannedObjects);
        if (!map.getSource("zones-source")) {
          map.addSource("zones-source", { type: "geojson", data: enrichedData });
          map.addLayer({
            id: "zones-layer",
            type: "fill",
            source: "zones-source",
            paint: {
              "fill-color": [
                "case",
                ["to-boolean", ["get", "is_planned"]], "#388E3C",
                ["to-boolean", ["get", "has_rec"]], "#D32F2F",
                ["==", ["get", "priority"], "high"], "#1565C0",
                ["==", ["get", "priority"], "moderate"], "#78909C",
                "#CFD8DC"
              ],
              "fill-opacity": 0.35
            }
          }, "hospitals-layer");

          map.addLayer({
            id: "zones-line-layer",
            type: "line",
            source: "zones-source",
            paint: {
              "line-color": [
                "case",
                ["to-boolean", ["get", "is_planned"]], "#1B5E20",
                ["to-boolean", ["get", "has_rec"]], "#B71C1C",
                ["==", ["get", "priority"], "high"], "#0D47A1",
                "#546E7A"
              ],
              "line-width": 1.2
            }
          });
        } else {
          map.getSource("zones-source").setData(enrichedData);
          map.setLayoutProperty("zones-layer", "visibility", "visible");
          map.setLayoutProperty("zones-line-layer", "visibility", "visible");
        }
      } else if (map.getLayer("zones-layer")) {
        map.setLayoutProperty("zones-layer", "visibility", "none");
        map.setLayoutProperty("zones-line-layer", "visibility", "none");
      }

      if (activeGeoLayers.includes("refusals") && refusalsData.length > 0) {
        const refusalGeojson = {
          type: "FeatureCollection",
          features: refusalsData.map(r => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [r.longitude, r.latitude] },
            properties: { ...r }
          }))
        };

        if (!map.getSource("refusals-source")) {
          map.addSource("refusals-source", { type: "geojson", data: refusalGeojson });
          map.addLayer({
            id: "refusals-layer",
            type: "circle",
            source: "refusals-source",
            paint: {
              "circle-radius": [
                "interpolate", ["linear"], ["get", "hospitalization_denied"],
                0, 5, 
                100, 20
              ],
              "circle-color": "#dc2626",
              "circle-opacity": 0.6,
              "circle-stroke-width": 1,
              "circle-stroke-color": "#fff"
            }
          });
          map.on("click", "refusals-layer", (e) => {
            if (!e.features?.length) return;
            const props = e.features[0].properties;

            if (activePopupRef.current) activePopupRef.current.remove();

            const popup = new maplibregl.Popup({ offset: 15, closeButton: true })
              .setLngLat(e.lngLat)
              .setHTML(buildRefusalPopupHTML(props))
              .addTo(map);

            activePopupRef.current = popup;
          });

          map.on("mouseenter", "refusals-layer", () => {
            map.getCanvas().style.cursor = 'pointer';
          });
          map.on("mouseleave", "refusals-layer", () => {
            map.getCanvas().style.cursor = '';
          });
        } else {
          map.getSource("refusals-source").setData(refusalGeojson);
          map.setLayoutProperty("refusals-layer", "visibility", "visible");
        }
      } else if (map.getLayer("refusals-layer")) {
        map.setLayoutProperty("refusals-layer", "visibility", "none");
      }

      if (map.getLayer("grid-layer") && map.getLayer("zones-layer")) {
        map.moveLayer("grid-layer", "zones-layer");
      }
      if (map.getLayer("zones-layer") && map.getLayer("hospitals-layer")) {
        map.moveLayer("zones-layer", "hospitals-layer");
      }
    };

    if (map.isStyleLoaded()) updateGeoLayers();
    else map.once('idle', updateGeoLayers);

    const timer = setTimeout(updateGeoLayers, 50); 
    return () => clearTimeout(timer);
  }, [activeGeoLayers, gridCells, plannedZones, refusalsData, plannedObjects, facilities, selectedOrgTypeForGrid, geoAccessMode, isLoading]);
  
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const sourceId = "seismic-source";
    const layerId = "seismic-layer";

    const updateSeismic = () => {
      if (!map.isStyleLoaded()) {
        map.once('idle', updateSeismic);
        return;
      }
      
      if (!showSeismicGrid || !seismicData || seismicData.length === 0) {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
        return;
      }

      const geojson = {
        type: "FeatureCollection",
        features: seismicData.map(s => ({
          type: "Feature",
          properties: { ...s, seismic_score: Number(s.seismic_score) },
          geometry: { type: "Point", coordinates: [Number(s.lng), Number(s.lat)] }
        }))
      };

      if (map.getSource(sourceId)) {
        map.getSource(sourceId).setData(geojson);
      } else {
        map.addSource(sourceId, { type: "geojson", data: geojson });
        map.addLayer({
          id: layerId,
          type: "circle",
          source: sourceId,
          paint: {
            "circle-radius": ["+", 8, ["*", ["get", "seismic_score"], 24]],
            "circle-color": [
              "step", ["get", "seismic_score"],
              "#FDD835", 0.4, 
              "#EF6C00", 0.7, 
              "#B71C1C"
            ],
            "circle-stroke-width": 2,
            "circle-stroke-color": [
              "step", ["get", "seismic_score"],
              "#FDD835", 0.4, 
              "#EF6C00", 0.7, 
              "#B71C1C"
            ],
            "circle-opacity": 0.18,
            "circle-stroke-opacity": 0.7
          }
        });

        if (map.getLayer("hospitals-layer")) {
          map.moveLayer(layerId, "hospitals-layer");
        }
      }
    };

    updateSeismic();
  }, [seismicData, showSeismicGrid, isLoading]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusedHospitalId) return;

    const hospital = facilities.find(f => f.unified_id === focusedHospitalId);
    if (hospital) {
      map.flyTo({
        center: [hospital.lng, hospital.lat],
        zoom: 15,
        essential: true
      });

      if (activePopupRef.current) activePopupRef.current.remove();
      
      const popup = new maplibregl.Popup({ offset: 15, closeButton: true })
        .setLngLat([hospital.lng, hospital.lat])
        .setHTML(buildHospitalPopup(hospital))
        .addTo(map);
        
      activePopupRef.current = popup;
    }
  }, [focusedHospitalId, facilities]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusedRefusal || !focusedRefusal.latitude) return;

    if (activePopupRef.current) {
      activePopupRef.current.remove();
    }

    map.flyTo({
      center: [focusedRefusal.longitude, focusedRefusal.latitude],
      zoom: 14.5,
      essential: true,
      duration: 1500
    });

    const popup = new maplibregl.Popup({ offset: 15, closeButton: true })
    .setLngLat([focusedRefusal.longitude, focusedRefusal.latitude])
    .setHTML(buildRefusalPopupHTML(focusedRefusal))
    .addTo(map);

    activePopupRef.current = popup;

  }, [focusedRefusal]);

  return (
    <div className="relative w-full h-full">
      <MapControls onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetView} />
      <div ref={mapContainer} className="w-full h-full" />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-50">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}