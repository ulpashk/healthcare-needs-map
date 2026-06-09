"use client";

import React, { useEffect, useRef, useState, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import { useMapInitialization } from '../../hooks/useMapInitialization';
import { HospitalService } from '../../services/hospitalApiService';
import { MapControls } from '../general/MapControls';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getMoSettings } from '../../constants/mo-config';
import { computeGridData, computeOrgTypeGrid, enrichZonesWithEverything } from '../../utils/hosp-map-func';
import { buildHospitalPopup, buildPlannedObjectPopupHTML, buildRefusalPopupHTML } from '../../utils/hosp-popups';

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
    fetch("https://admin.smartalmaty.kz/api/v1/address/districts/?city=1")
      .then(res => res.json())
      .then(data => setDistrictsGeoJson(data));
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !districtsGeoJson || !districtsGeoJson.features) return;

    const initDistricts = () => {
      if (!map.isStyleLoaded()) return;
      const sourceId = 'districts-source';

      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, { type: 'geojson', data: districtsGeoJson });

        const beforeId = map.getLayer('hospitals-layer') ? 'hospitals-layer' : undefined;

        map.addLayer({
          id: 'districts-fill',
          type: 'fill',
          source: sourceId,
          filter: ["all"],
          paint: {
            'fill-color': '#3773ff3a',
            'fill-opacity': 0.15
          }
        }, beforeId);

        map.addLayer({
          id: 'districts-outline',
          type: 'line',
          source: sourceId,
          filter: ["all"],
          paint: {
            'line-color': '#3772ff',
            'line-width': 2,
            'line-opacity': 0.5
          }
        }, beforeId);
      }
    };

    if (map.isStyleLoaded()) initDistricts();
    else map.once('idle', initDistricts);
  }, [districtsGeoJson]);

  useEffect(() => {
    const styleId = 'hospital-popup-styles';
    if (!document.getElementById(styleId)) {
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
    }
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || isLoading) return;

    const syncLayers = () => {
      if (!map.isStyleLoaded()) return;

      if (districtsGeoJson) {
        const distSourceId = 'districts-source';
        if (!map.getSource(distSourceId)) {
          map.addSource(distSourceId, { type: 'geojson', data: districtsGeoJson });
          
          map.addLayer({
            id: 'districts-fill',
            type: 'fill',
            source: distSourceId,
            paint: { 'fill-color': '#3773ff', 'fill-opacity': 0.15 }
          });
          map.addLayer({
            id: 'districts-outline',
            type: 'line',
            source: distSourceId,
            paint: { 'line-color': '#3772ff', 'line-width': 2, 'line-opacity': 0.5 }
          });
        }

        const distFilter = selectedDistrict === "Все районы" 
          ? ["all"] 
          : ["in", selectedDistrict, ["get", "name_ru"]];
        
        map.setFilter('districts-fill', distFilter);
        map.setFilter('districts-outline', distFilter);
        map.setPaintProperty('districts-fill', 'fill-opacity', selectedDistrict === "Все районы" ? 0.05 : 0.2);
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

      const source = map.getSource(hospSourceId);
      if (!source) {
        map.addSource(hospSourceId, { type: "geojson", data: geojsonData });
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
          } catch (err) {
            popup.setHTML(buildHospitalPopup(props));
          }
        });
        map.on("mouseenter", hospLayerId, () => map.getCanvas().style.cursor = 'pointer');
        map.on("mouseleave", hospLayerId, () => map.getCanvas().style.cursor = '');
      } else {
        source.setData(geojsonData);
        map.setPaintProperty(hospLayerId, "circle-color", currentColorLogic);
        map.setFilter(hospLayerId, filterLogic);
      }

      if (map.getLayer('districts-fill') && map.getLayer(hospLayerId)) {
        map.moveLayer('districts-fill', hospLayerId);
        map.moveLayer('districts-outline', hospLayerId);
      }
    };

    if (map.isStyleLoaded()) syncLayers();
    else map.once('load', syncLayers);

  }, [facilities, selectedDistrict, mapMode, isLoading, activeGeoLayers, selectedOrgTypeForGrid]);

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

          map.on("mouseenter", "planned-dots-layer", () => {
            map.getCanvas().style.cursor = 'pointer';
          });
          map.on("mouseleave", "planned-dots-layer", () => {
            map.getCanvas().style.cursor = '';
          });

        } else {
          map.getSource("planned-dots-source").setData(plannedObjects);
          map.setLayoutProperty("planned-dots-layer", "visibility", "visible");
        }
      } else if (map.getLayer("planned-dots-layer")) {
        map.setLayoutProperty("planned-dots-layer", "visibility", "none");
      }

      if (activeGeoLayers.includes("zones") && plannedZones) {
        const enrichedData = enrichZonesWithEverything(plannedZones, plannedObjects, recommendations);
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

            const popup = new maplibregl.Popup({ offset: 15, closeButton: true, maxWidth: '300px' })
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
      
      const popup = new maplibregl.Popup({ offset: 15, closeButton: true, maxWidth: '400px' })
        .setLngLat([hospital.lng, hospital.lat])
        .setHTML('<div style="padding: 20px; text-align:center;">Загрузка детальных данных...</div>')
        .addTo(map);
        
      activePopupRef.current = popup;

      const loadDetails = async () => {
        try {
          const detailData = await HospitalService.getHospitalDetail(focusedHospitalId);
          if (activePopupRef.current === popup) {
            popup.setHTML(buildHospitalPopup(detailData));
          }
        } catch (err) {
          console.error("Ошибка загрузки деталей при фокусе:", err);
          if (activePopupRef.current === popup) {
            popup.setHTML(buildHospitalPopup(hospital));
          }
        }
      };
      loadDetails();
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
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-50">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}