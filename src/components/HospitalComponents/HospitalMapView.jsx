"use client";

import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { useMapInitialization } from '../../hooks/useMapInitialization';
import { HospitalService } from '../../services/hospitalApiService';
import { MapControls } from '../general/MapControls';
import 'maplibre-gl/dist/maplibre-gl.css';

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
    let color = "#C62828"; // Красный (>5км)
    if (minD <= 1200) color = "#2E7D32";      // Зеленый (пешком)
    else if (minD <= 5000) color = "#1565C0"; // Синий (транспорт)
    return { ...f, properties: { ...f.properties, dynamicColor: color } };
  });
  return { ...gridGeoJSON, features };
}

export default function HospitalMapView({ 
  facilities = [], 
  mapMode = "buildings", 
  focusedHospitalId = null, 
  activeGeoLayers = [],
  gridCells = null,
  plannedZones = null,
  refusalsData = [],
  geoAccessMode = "current"
}) {
  const mapContainer = useRef(null);
  const { mapRef, isLoading, zoomIn, zoomOut, resetView } = useMapInitialization(mapContainer);
  const activePopupRef = useRef(null);

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
            <span>Всего коек:</span> <b>${d.total_beds}</b>
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
          paint: {
            "circle-radius": [
              "max", 7, 
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
        map.getSource(sourceId).setData(geojsonData);
        map.setPaintProperty(layerId, "circle-color", currentColorLogic);   
      }
    };

    if (map.isStyleLoaded()) updateMap();
    else map.once('load', updateMap);

  }, [facilities, mapMode, isLoading]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || isLoading) return;

    const updateGeoLayers = () => {
      if (!map.isStyleLoaded()) return;

      // 1. СЛОЙ СЕТКИ ДОСТУПНОСТИ (GRID)
      if (activeGeoLayers.includes("grid") && gridCells) {
        const points = facilities.map(f => ({ lat: f.lat, lng: f.lng }));
        // Здесь можно добавить логику для "planned", если нужно учитывать и будущие объекты
        const gridData = computeGridData(gridCells, points);

        if (!map.getSource("grid-source")) {
          map.addSource("grid-source", { type: "geojson", data: gridData });
          map.addLayer({
            id: "grid-layer",
            type: "fill",
            source: "grid-source",
            paint: {
              "fill-color": ["get", "dynamicColor"],
              "fill-opacity": 0.3
            }
          }, "hospitals-layer"); // Кладем ПОД слой больниц
        } else {
          map.getSource("grid-source").setData(gridData);
          map.setLayoutProperty("grid-layer", "visibility", "visible");
        }
      } else if (map.getLayer("grid-layer")) {
        map.setLayoutProperty("grid-layer", "visibility", "none");
      }

      // 2. СЛОЙ ЗОН ГЕНПЛАНА (ZONES)
      if (activeGeoLayers.includes("zones") && plannedZones) {
        if (!map.getSource("zones-source")) {
          map.addSource("zones-source", { type: "geojson", data: plannedZones });
          map.addLayer({
            id: "zones-layer",
            type: "fill",
            source: "zones-source",
            paint: {
              "fill-color": "#1565C0",
              "fill-opacity": 0.2,
              "fill-outline-color": "#0D47A1"
            }
          }, "grid-layer" || "hospitals-layer");
        } else {
          map.getSource("zones-source").setData(plannedZones);
          map.setLayoutProperty("zones-layer", "visibility", "visible");
        }
      } else if (map.getLayer("zones-layer")) {
        map.setLayoutProperty("zones-layer", "visibility", "none");
      }

      // 3. СЛОЙ ОТКАЗОВ В ГОСПИТАЛИЗАЦИИ (REFUSALS)
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
        } else {
          map.getSource("refusals-source").setData(refusalGeojson);
          map.setLayoutProperty("refusals-layer", "visibility", "visible");
        }
      } else if (map.getLayer("refusals-layer")) {
        map.setLayoutProperty("refusals-layer", "visibility", "none");
      }
    };

    if (map.isStyleLoaded()) updateGeoLayers();
    else map.once('idle', updateGeoLayers);

  }, [activeGeoLayers, gridCells, plannedZones, refusalsData, facilities, isLoading]);

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

      // Автоматически открываем попап
      if (activePopupRef.current) activePopupRef.current.remove();
      
      const popup = new maplibregl.Popup({ offset: 15, closeButton: true })
        .setLngLat([hospital.lng, hospital.lat])
        .setHTML(buildHospitalPopup(hospital))
        .addTo(map);
        
      activePopupRef.current = popup;
    }
  }, [focusedHospitalId, facilities]);

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