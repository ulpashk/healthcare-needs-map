"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import { useMapInitialization } from '../../hooks/useMapInitialization';
import { HospitalService } from '../../services/hospitalApiService';
import { MapControls } from '../general/MapControls';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getMoSettings } from '../../constants/mo-config';
import { computeGridData, computeOrgTypeGrid, enrichZonesWithEverything } from '../../utils/hosp-map-func';
import { buildHospitalPopup, buildPlannedObjectPopupHTML, buildRefusalPopupHTML } from '../../utils/hosp-popups';

function ensureSource(map, id, data) {
  if (!map.getSource(id)) {
    map.addSource(id, { type: 'geojson', data });
    return true;
  }
  map.getSource(id).setData(data);
  return false;
}

function setVisibility(map, layerId, visible) {
  if (map.getLayer(layerId)) {
    map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
  }
}

function safeMoveLayer(map, layerId, beforeId) {
  if (map.getLayer(layerId) && map.getLayer(beforeId)) {
    map.moveLayer(layerId, beforeId);
  }
}

export default function HospitalMapView({
  facilities = [],
  mapMode = "buildings",
  selectedDistrict = "Все районы",
  districtsGeoJson = null,
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

  const [geoLayersReady, setGeoLayersReady] = useState(false);
  const prevHeavyDataRef = useRef({ gridCells: null, plannedZones: null, plannedObjects: null, refusalsData: null });
  // const [districtsGeoJson, setDistrictsGeoJson] = useState(null);

  const districtOnlyGeoJson = useMemo(() => {
    if (!districtsGeoJson?.features) return null;
    return {
      ...districtsGeoJson,
      features: districtsGeoJson.features.filter(
        f => f.properties?.name_ru !== "г. Алматы"
      )
    };
  }, [districtsGeoJson]);

  const popupOpenerRef = useRef(null);

  const showLoader = isLoading || !geoLayersReady;

  useEffect(() => {
    const styleId = 'hospital-popup-styles';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .ml-card {
        max-width: 320px; max-height: 480px; overflow-y: auto; 
        border: 1px solid rgba(0,0,0,.08); border-radius: 10px; 
        scrollbar-width: thin; background: #fff;
        box-shadow: 0 6px 16px rgba(0,0,0,.06);
        font-family: Inter, system-ui, -apple-system, sans-serif;
      }
      .ml-card::-webkit-scrollbar { width: 4px; }
      .ml-card::-webkit-scrollbar-thumb { background: #ddd; border-radius: 10px; }
      .ml-hd { padding: 12px 12px 8px; border-bottom: 1px solid #f0f0f0; }
      .ml-ttl { margin: 0 0 6px; font-weight:600; font-size: 15px; line-height: 1.2; color: #1a202c; text-align: left; }
      .ml-chip { border-radius: 999px; padding: 2px 8px; font-weight: 700; font-size: 10px; white-space: nowrap; display: inline-block; }
      .ml-meta { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
      .ml-pill { background: #edf2f7; border-radius: 6px; padding: 2px 8px; font-size: 10px; color: #4a5568; font-weight: 600; }
      .ml-bd { padding: 12px; }
      .ml-warning-box { background: #fff5f2; border: 1px solid #ffccbc; padding: 6px 10px; border-radius: 8px; font-size: 11px; color: #d32f2f; margin-bottom: 12px; text-align: left;}
      .ml-row { display: flex; justify-content: space-between; align-items: center; font-size: 11px; margin: 4px 0; color: #4a5568; }
      .ml-bar { height: 6px; width: 100%; background: #f7fafc; border-radius: 999px; overflow: hidden; margin-top: 4px; border: 1px solid #edf2f7; }
      .ml-bar i { display: block; height: 100%; transition: width 0.5s ease; }
      .ml-section-title { font-weight: 800; font-size: 11px; margin: 16px 0 8px; color: #2d3748; text-transform: uppercase; letter-spacing: 0.025em; border-bottom: 1px solid #edf2f7; padding-bottom: 4px; display: flex; align-items: center; gap: 6px; }
      .ml-kpi { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
      .ml-box { background: #f8fafc; border-radius: 8px; padding: 8px; border: 1px solid #f1f5f9; }
      .ml-cap { font-size: 10px; color: #718096; text-align: left; }
      .ml-val { font-weight: 700; font-size: 13px; color: #1a202c; text-align: left;}
      .ml-profiles { max-height: 120px; overflow-y: auto; margin-top: 4px; padding-right: 4px; }
      .ml-bld-wrapper { max-height: 150px; overflow-y: auto; border: 1px solid #f1f5f9; border-radius: 8px; margin-top: 4px; }
      .ml-table { width: 100%; font-size: 10px; border-collapse: collapse; }
      .ml-table th { text-align: left; background: #f8fafc; padding: 6px 8px; color: #718096; position: sticky; top: 0; }
      .ml-table td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; }
    `;
    document.head.appendChild(style);
  }, []);

  // useEffect(() => {
  //   fetch("https://admin.smartalmaty.kz/api/v1/address/districts/?city=1")
  //     .then(res => res.json())
  //     .then(data => setDistrictsGeoJson(data))
  //     .catch(err => console.error("Districts fetch error:", err));
  // }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || isLoading) return;

    const syncLayers = () => {
      if (!map.isStyleLoaded()) return;

      if (districtOnlyGeoJson?.features) {
        const distSourceId = 'districts-source';
        const created = ensureSource(map, distSourceId, districtOnlyGeoJson);

        if (created) {
          map.addLayer({
            id: 'districts-fill',
            type: 'fill',
            source: distSourceId,
            filter: ["all"],
            paint: { 'fill-color': '#3773ff', 'fill-opacity': 0 }
          });
          map.addLayer({
            id: 'districts-outline',
            type: 'line',
            source: distSourceId,
            filter: ["all"],
            paint: { 'line-color': '#3772ff', 'line-width': 2, 'line-opacity': 0.5 }
          });
        }

        const distFilter = selectedDistrict === "Все районы"
          ? ["all"]
          : ["in", selectedDistrict, ["get", "name_ru"]];

        if (map.getLayer('districts-fill')) {
          map.setFilter('districts-fill', distFilter);
        }
        if (map.getLayer('districts-outline')) {
          map.setFilter('districts-outline', distFilter);
        }
      }

      const hospSourceId = "hospitals-source";
      const hospLayerId = "hospitals-layer";

      const validFacilities = facilities.filter(h => h.lng && h.lat && !isNaN(h.lng));
      const geojsonData = {
        type: "FeatureCollection",
        features: validFacilities.map(h => ({
          type: "Feature",
          properties: { ...h },
          geometry: { type: "Point", coordinates: [Number(h.lng), Number(h.lat)] }
        }))
      };

      const buildingColorLogic = [
        "case",
        ["to-boolean", ["coalesce", ["get", "bld_emergency"], false]], "#7B0000",
        ["in", "Аварийное", ["coalesce", ["get", "bld_tech"], ""]], "#B71C1C",
        ["to-boolean", ["coalesce", ["get", "bld_seismic"], false]], "#EF6C00",
        ["any",
          ["in", "Ветхое", ["coalesce", ["get", "bld_tech"], ""]],
          ["in", "Неудовлетворительное", ["coalesce", ["get", "bld_tech"], ""]]
        ], "#F9A825",
        ["in", "Исправное", ["coalesce", ["get", "bld_tech"], ""]], "#2E7D32",
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

      const filterLogic = (activeGeoLayers.includes("orgTypeGrid") && selectedOrgTypeForGrid)
        ? ["==", ["get", "org_type"], selectedOrgTypeForGrid]
        : ["all"];

      const hospCreated = ensureSource(map, hospSourceId, geojsonData);

      if (hospCreated) {
        map.addLayer({
          id: hospLayerId,
          type: "circle",
          source: hospSourceId,
          filter: filterLogic,
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
        map.on("click", hospLayerId, async (e) => {
          const feature = e.features[0];
          const props = feature.properties;
          if (activePopupRef.current) activePopupRef.current.remove();
          const popup = new maplibregl.Popup({ offset: 25, closeButton: true, maxWidth: '400px' })
            .setLngLat(e.lngLat)
            .setHTML('<div style="padding: 20px; text-align:center;">Загрузка данных...</div>')
            .addTo(map);
          activePopupRef.current = popup;
          try {
            const detail = await HospitalService.getHospitalDetail(props.unified_id);
            popup.setHTML(buildHospitalPopup(detail));
          } catch {
            popup.setHTML(buildHospitalPopup(props));
          }
        });
        map.on("mouseenter", hospLayerId, () => map.getCanvas().style.cursor = 'pointer');
        map.on("mouseleave", hospLayerId, () => map.getCanvas().style.cursor = '');
      } else {
        map.setPaintProperty(hospLayerId, "circle-color", currentColorLogic);
        map.setFilter(hospLayerId, filterLogic);
      }

      safeMoveLayer(map, 'districts-fill', hospLayerId);
      safeMoveLayer(map, 'districts-outline', hospLayerId);
    };

    if (map.isStyleLoaded()) syncLayers();
    else map.once('load', syncLayers);

  }, [facilities, selectedDistrict, mapMode, isLoading, districtOnlyGeoJson, activeGeoLayers, selectedOrgTypeForGrid]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || isLoading) return;

    const heavyLayersActive =
      activeGeoLayers.includes("grid") ||
      (activeGeoLayers.includes("orgTypeGrid") && selectedOrgTypeForGrid) ||
      activeGeoLayers.includes("zones") ||
      activeGeoLayers.includes("refusals") ||
      (geoAccessMode === "planned" && plannedObjects);

    if (!heavyLayersActive) {
      setGeoLayersReady(true);
      return;
    }

    const prev = prevHeavyDataRef.current;
    const dataChanged =
      prev.gridCells !== gridCells ||
      prev.plannedZones !== plannedZones ||
      prev.plannedObjects !== plannedObjects ||
      prev.refusalsData !== refusalsData;

    if (dataChanged) {
      prevHeavyDataRef.current = { gridCells, plannedZones, plannedObjects, refusalsData };
      setGeoLayersReady(false);
    }

    const updateGeoLayers = () => {
      if (!map.isStyleLoaded() || !map.getLayer("hospitals-layer")) {
        map.once('idle', updateGeoLayers);
        return;
      }

      const isTypeActive = activeGeoLayers.includes("orgTypeGrid") && selectedOrgTypeForGrid;
      const isGeneralGridActive = activeGeoLayers.includes("grid");
      const settings = selectedOrgTypeForGrid ? getMoSettings(selectedOrgTypeForGrid) : null;

      const sourceId = "grid-source";
      const layerId = "grid-layer";

      let gridData = null;
      let shouldShowGrid = false;

      if (isGeneralGridActive && gridCells) {
        shouldShowGrid = true;
        let points = facilities.map(f => ({ lat: f.lat, lng: f.lng }));
        if (geoAccessMode === "planned" && plannedObjects?.features) {
          plannedObjects.features.forEach(f => {
            if (f.geometry?.coordinates) {
              points.push({ lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] });
            }
          });
        }
        gridData = computeGridData(gridCells, points);
      } else if (isTypeActive && settings?.mode === "territorial" && gridCells) {
        shouldShowGrid = true;
        const targets = facilities
          .filter(f => f.org_type === selectedOrgTypeForGrid)
          .map(f => ({ lat: f.lat, lng: f.lng }));
        if (targets.length > 0) {
          gridData = computeOrgTypeGrid(gridCells, targets, settings.near, settings.far);
        }
      }

      if (shouldShowGrid && gridData) {
        const created = ensureSource(map, sourceId, gridData);
        if (created) {
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
          setVisibility(map, layerId, true);
        }
      } else {
        setVisibility(map, layerId, false);
      }

      if (isTypeActive && settings?.mode === "zonal") {
        const normalize = (s) => s.replace(/\s*район$/i, "").trim();

        const districtsFromFacilities = facilities
          .filter(f => f.org_type === selectedOrgTypeForGrid)
          .map(f => normalize(f.district));

        const districtsFromPlanned = (plannedObjects?.features || [])
          .filter(f => f.properties?.obj_type && selectedOrgTypeForGrid
            ? f.properties.obj_type === selectedOrgTypeForGrid
            : true)
          .map(f => normalize(f.properties?.district || ""))
          .filter(Boolean);

        const validDistrictNames = new Set(
          (districtsGeoJson?.features || []).map(f => f.properties?.name_ru).filter(Boolean)
        );

        const districtsWithMO = Array.from(new Set([...districtsFromFacilities, ...districtsFromPlanned]))
          .map(d => d + " район")
          .filter(d => validDistrictNames.has(d)); 

        if (districtsGeoJson?.features && map.getSource("districts-source")) {
          const enriched = {
            ...districtOnlyGeoJson,
            features: districtOnlyGeoJson.features.map(f => ({
              ...f,
              properties: {
                ...f.properties,
                zonal_has_mo: districtsWithMO.includes(f.properties?.name_ru) ? 1 : 0
              }
            }))
          };
          map.getSource("districts-source").setData(enriched);
        }

        if (map.getLayer("districts-fill")) {
          map.setPaintProperty("districts-fill", "fill-color", [
            "case", ["==", ["get", "zonal_has_mo"], 1], "#388E3C", "#D32F2F"
          ]);
          map.setPaintProperty("districts-fill", "fill-opacity", 0.75);
        }
        if (map.getLayer("districts-outline")) {
          map.setPaintProperty("districts-outline", "line-color", "#333333");
          map.setPaintProperty("districts-outline", "line-opacity", 0.6);
          map.setPaintProperty("districts-outline", "line-width", 1.5);
        }
      } else {
        if (districtsGeoJson?.features && map.getSource("districts-source")) {
          map.getSource("districts-source").setData(districtOnlyGeoJson);
        }
        if (map.getLayer("districts-fill")) {
          map.setPaintProperty("districts-fill", "fill-opacity", 0);
        }
        if (map.getLayer("districts-outline")) {
          map.setPaintProperty("districts-outline", "line-color", "#3772ff");
          map.setPaintProperty("districts-outline", "line-opacity", 0.5);
          map.setPaintProperty("districts-outline", "line-width", 2);
        }
      }

      const showPlannedDots = geoAccessMode === "planned" && plannedObjects;
      if (showPlannedDots) {
        const created = ensureSource(map, "planned-dots-source", plannedObjects);
        if (created) {
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
          map.on("click", "planned-dots-layer", (e) => {
            if (!e.features?.length) return;
            const props = e.features[0].properties;
            if (activePopupRef.current) activePopupRef.current.remove();
            const popup = new maplibregl.Popup({ offset: 15, closeButton: true, maxWidth: '400px' })
              .setLngLat(e.lngLat)
              .setHTML(buildPlannedObjectPopupHTML(props))
              .addTo(map);
            activePopupRef.current = popup;
          });
          map.on("mouseenter", "planned-dots-layer", () => map.getCanvas().style.cursor = 'pointer');
          map.on("mouseleave", "planned-dots-layer", () => map.getCanvas().style.cursor = '');
        } else {
          setVisibility(map, "planned-dots-layer", true);
        }
      } else {
        setVisibility(map, "planned-dots-layer", false);
      }

      if (activeGeoLayers.includes("zones") && plannedZones) {
        const enrichedData = enrichZonesWithEverything(plannedZones, plannedObjects, recommendations);
        const created = ensureSource(map, "zones-source", enrichedData);
        if (created) {
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
          }, "hospitals-layer");

          map.on("click", "zones-layer", (e) => {
            if (!e.features?.length) return;
            const p = e.features[0].properties;
            if (activePopupRef.current) activePopupRef.current.remove();

            let html = `<div style="padding: 10px; font-family: sans-serif; min-width:240px; text-align: left;">`;
            if (String(p.is_planned) === "true") {
              html += `
                <b style="color: #2E7D32; font-size: 13px;">✅ ЗАПЛАНИРОВАНА БОЛЬНИЦА</b>
                <p style="margin-top: 5px; font-weight: bold; border-top:1px solid #eee; padding-top:5px; font-size:12px;">${p.planned_hosp_name}</p>
                <p style="font-size: 10px; color: #666;">(объект в радиусе 2.5 км от этой зоны)</p>
              `;
            } else if (String(p.has_rec) === "true") {
              html += `
                <b style="color: #D32F2F; font-size: 13px;">⚠ РЕКОМЕНДАЦИЯ СИСТЕМЫ</b>
                <p style="margin: 5px 0; font-weight: bold; color: #333; font-size:12px;">Нужно построить: ${p.rec_type}</p>
                <div style="font-size: 11px; background: #FFF3F3; padding: 8px; border-radius: 6px; border-left: 4px solid #D32F2F; line-height:1.4;">
                  <b>Причина:</b> ${p.rec_reason}<br>
                  <b style="display:block; margin-top:4px;">Масштаб:</b> ${p.rec_scale}
                </div>
              `;
            } else {
              html += `
                <b style="color: #333; font-size: 13px;">Зона Генплана</b>
                <p style="font-size: 12px; margin-top: 5px; color: #666;">Приоритет дефицита в районе: <b>${p.priority || 'норма'}</b></p>
              `;
            }
            html += `</div>`;

            const popup = new maplibregl.Popup({ closeButton: true, maxWidth: '300px' })
              .setLngLat(e.lngLat)
              .setHTML(html)
              .addTo(map);
            activePopupRef.current = popup;
          });
          map.on("mouseenter", "zones-layer", () => map.getCanvas().style.cursor = 'pointer');
          map.on("mouseleave", "zones-layer", () => map.getCanvas().style.cursor = '');
        } else {
          setVisibility(map, "zones-layer", true);
          setVisibility(map, "zones-line-layer", true);
        }
      } else {
        setVisibility(map, "zones-layer", false);
        setVisibility(map, "zones-line-layer", false);
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
        const created = ensureSource(map, "refusals-source", refusalGeojson);
        if (created) {
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
            const popup = new maplibregl.Popup({ offset: 15, closeButton: true, maxWidth: '300px' })
              .setLngLat(e.lngLat)
              .setHTML(buildRefusalPopupHTML(props))
              .addTo(map);
            activePopupRef.current = popup;
          });
          map.on("mouseenter", "refusals-layer", () => map.getCanvas().style.cursor = 'pointer');
          map.on("mouseleave", "refusals-layer", () => map.getCanvas().style.cursor = '');
        } else {
          setVisibility(map, "refusals-layer", true);
        }
      } else {
        setVisibility(map, "refusals-layer", false);
      }

      safeMoveLayer(map, "grid-layer", "zones-layer");
      safeMoveLayer(map, "zones-layer", "hospitals-layer");
      safeMoveLayer(map, "zones-line-layer", "hospitals-layer");

      setGeoLayersReady(true);
    };

    if (map.isStyleLoaded()) {
      updateGeoLayers();
    } else {
      map.once('idle', updateGeoLayers);
    }

  }, [
    activeGeoLayers, gridCells, plannedZones, refusalsData,
    plannedObjects, facilities, selectedOrgTypeForGrid,
    geoAccessMode, isLoading, recommendations
  ]);

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

      if (!showSeismicGrid || !seismicData?.length) {
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

      const created = ensureSource(map, sourceId, geojson);
      if (created) {
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
        safeMoveLayer(map, layerId, "hospitals-layer");
      }
    };

    updateSeismic();
  }, [seismicData, showSeismicGrid, isLoading]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusedHospitalId) return;

    const hospital = facilities.find(f => f.unified_id === focusedHospitalId);
    if (!hospital) return;

    map.flyTo({ center: [hospital.lng, hospital.lat], zoom: 15, essential: true });

    if (activePopupRef.current) activePopupRef.current.remove();
    const popup = new maplibregl.Popup({ offset: 15, closeButton: true, maxWidth: '400px' })
      .setLngLat([hospital.lng, hospital.lat])
      .setHTML('<div style="padding: 20px; text-align:center;">Загрузка детальных данных...</div>')
      .addTo(map);
    activePopupRef.current = popup;

    HospitalService.getHospitalDetail(focusedHospitalId)
      .then(detailData => {
        if (activePopupRef.current === popup) popup.setHTML(buildHospitalPopup(detailData));
      })
      .catch(() => {
        if (activePopupRef.current === popup) popup.setHTML(buildHospitalPopup(hospital));
      });
  }, [focusedHospitalId, facilities]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusedRefusal?.latitude) return;

    if (activePopupRef.current) activePopupRef.current.remove();

    map.flyTo({
      center: [focusedRefusal.longitude, focusedRefusal.latitude],
      zoom: 14.5,
      essential: true,
      duration: 1500
    });

    const popup = new maplibregl.Popup({ offset: 15, closeButton: true, maxWidth: '300px' })
      .setLngLat([focusedRefusal.longitude, focusedRefusal.latitude])
      .setHTML(buildRefusalPopupHTML(focusedRefusal))
      .addTo(map);
    activePopupRef.current = popup;
  }, [focusedRefusal]);

  return (
    <div className="relative w-full h-full">
      <MapControls onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetView} />
      <div ref={mapContainer} className="w-full h-full" />
      {showLoader && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-50">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}