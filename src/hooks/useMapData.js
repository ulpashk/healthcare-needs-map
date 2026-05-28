import { useCallback, useMemo } from 'react';
import { useHealthcareQueries } from './useHealthcareQueries'; 

const isPointInPolygon = (point, geometry) => {
  if (!geometry) return false;
  const [lng, lat] = point;
  let inside = false;

  const coordinates = geometry.type === 'MultiPolygon' ? geometry.coordinates[0] : geometry.coordinates;

  for (let i = 0, j = coordinates[0].length - 1; i < coordinates[0].length; j = i++) {
    const xi = coordinates[0][i][0], yi = coordinates[0][i][1];
    const xj = coordinates[0][j][0], yj = coordinates[0][j][1];

    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

const fastDistM = (lat1, lng1, lat2, lng2) => {
  const dlat = (lat2 - lat1) * 111320;
  const dlng = (lng2 - lng1) * 81375;
  return Math.sqrt(dlat * dlat + dlng * dlng);
};

export const useMapData = (mode) => {

  const { data: cache, isLoading, isFetching } = useHealthcareQueries(mode);

  const normalize = (name) => {
    if (!name) return "";
    return name.toString().toLowerCase().replace(" район", "").trim();
  };

  const getVisitCategory = (load) => {
    const val = parseFloat(load);
    if (val > 150) return ">150% критично";
    if (val > 130) return "130-150% перегружено";
    if (val > 110) return "110-130% выше нормы";
    if (val >= 90) return "90–110% норма";
    return "90% хорошо";
  };

  const getCapLoadColor = (load) => {
    const val = parseFloat(load);
    if (isNaN(val)) return '#6b7280';

    if (val > 150) return '#C62828';
    if (val >= 130) return '#EF6C00';
    if (val >= 110) return '#FDD835';
    if (val >= 90) return '#66BB6A';
    if (val < 90) return '#2E7D32';
    
    return '#6b7280';
  };

  const calculateStrokeColor = (item) => {
    const dl = item.doctor_load;
    const cl = item.cap_load;
    if (dl !== null && cl > 0 && Math.abs((dl || 0) - cl) > 30) {
      return '#C62828';
    }
    return '#212121';
  };

  const calculateStrokeWidth = (dl) => {
    if (dl === null || dl === undefined) return 1;
    if (dl > 160) return 7;
    if (dl > 140) return 5.5;
    if (dl > 130) return 4.5;
    if (dl > 115) return 3;
    if (dl > 100) return 2;
    return 1;
  };

  const calculateZhkRadius = (flats) => {
    const f = parseInt(flats) || 0;
    return Math.min(10, Math.max(4, Math.round(4 + Math.sqrt(f) * 0.18)));
  };

  const filterData = useCallback((filters) => {
    if (!cache.city || !cache.pmsp || !cache.dists || !cache.plannedZones) return null;

    const { 
      districts = ["Все районы"], 
      activeScenario = 'current',
      visits = ["Все посещения"], 
      layers = ["Все слои"], 
      affiliations = ["all"]
    } = filters;

    const currentFacs = cache.pmsp.results.map(f => ({
      lat: f.lat, lng: f.lng, name: f.name, own_type: f.ownership, isPlanned: false
    }));

    let activeFacsForGrid = [...currentFacs];

    if (activeScenario !== 'current' && cache.plannedObjs) {
      const plannedFacs = cache.plannedObjs.features
        .filter(f => f.properties.is_pmsp)
        .map(f => ({
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
          name: f.properties.name,
          isPlanned: true
        }));
      activeFacsForGrid = [...activeFacsForGrid, ...plannedFacs];
    }

    const isAllDistricts = districts.includes("Все районы");
    const normalizedSelectedDistricts = districts.map(d => normalize(d));
    
    const checkDistrict = (itemDistrict) => {
      if (isAllDistricts) return true;
      return normalizedSelectedDistricts.includes(normalize(itemDistrict));
    };

    const filteredDistricts = {
      ...cache.dists,
      features: cache.dists.features.filter(f => checkDistrict(f.properties.name_ru))
    };


    const getCentroid = (geom) => {
      if (!geom || !geom.coordinates) return { lat: 0, lng: 0 };
      try {
          let ring = geom.type === 'MultiPolygon' 
              ? geom.coordinates[0][0] 
              : geom.coordinates[0];
          
          if (!ring || ring.length === 0) return { lat: 0, lng: 0 };
          
          let sumLng = 0, sumLat = 0;
          ring.forEach(c => { sumLng += c[0]; sumLat += c[1]; });
          
          return { lng: sumLng / ring.length, lat: sumLat / ring.length };
      } catch (e) {
          return { lat: 0, lng: 0 };
      }
    };

    const deficitCells = (cache.grid?.features || [])
      .filter(f => {
        const cat = f.properties.pmsp_access_cat;
        return (cat === 'red' || cat === 'ylw') && checkDistrict(f.properties.district);
      })
      .map(f => ({
        ...getCentroid(f.geometry),
        pop: parseFloat(f.properties.population || 0),
        cat: f.properties.pmsp_access_cat
      }));

    const recomputedGrid = cache.grid ? {
      ...cache.grid,
      features: cache.grid.features
        .filter(cell => checkDistrict(cell.properties.district))
        .map(cell => {
          const cLat = (cell.geometry.coordinates[0][0][0][1] + cell.geometry.coordinates[0][0][2][1]) / 2;
          const cLng = (cell.geometry.coordinates[0][0][0][0] + cell.geometry.coordinates[0][0][2][0]) / 2;
          
          let minDist = Infinity;
          for (const fac of activeFacsForGrid) {
            const d = fastDistM(cLat, cLng, fac.lat, fac.lng);
            if (d < minDist) minDist = d;
          }

          const newCat = minDist <= 800 ? 'g10' : minDist <= 1200 ? 'g15' : minDist <= 1600 ? 'ylw' : 'red';
          const origCat = cell.properties.pmsp_access_cat;
          
          const improved = (origCat === 'red' || origCat === 'ylw') && (newCat === 'g10' || newCat === 'g15');

          return {
            ...cell,
            properties: {
              ...cell.properties,
              pmsp_access_cat: newCat,
              improved: improved,
              distance: Math.round(minDist)
            }
          };
        })
    } : null;

    const finalPlannedZones = {
      ...cache.plannedZones,
      features: cache.plannedZones.features.map(zone => {
        if (!cache.grid) return zone;

        const zoneCenter = getCentroid(zone.geometry);
        let redCnt = 0, ylwCnt = 0, totalPopNearby = 0;
        const MATCH_R = 1200;

        deficitCells.forEach(cell => {
          const dist = fastDistM(zoneCenter.lat, zoneCenter.lng, cell.lat, cell.lng);
          if (dist <= MATCH_R) {
            totalPopNearby += cell.pop;
            if (cell.cat === 'red') redCnt++;
            else ylwCnt++;
          }
        });

        const totalBadCells = redCnt + ylwCnt;
          
        if (totalBadCells > 0) {
          const pctRed = redCnt / totalBadCells;
          let priority;
          
          if (pctRed > 0.7) {
              priority = { lbl: 'Критичный', col: '#6A1B9A', fill: '#7B1FA2' };
          } else if (pctRed > 0.3) {
              priority = { lbl: 'Высокий', col: '#0039FF', fill: '#0039FF' };
          } else {
              priority = { lbl: 'Умеренный', col: '#1565C0', fill: '#1976D2' };
          }

          let rec = 'Объект не требуется';
          if (totalPopNearby >= 30000) rec = 'Поликлиника';
          else if (totalPopNearby >= 1500) rec = 'Врачебная амбулатория';

          return {
            ...zone,
            properties: {
              ...zone.properties,
              ...priority,
              defPop: Math.round(totalPopNearby),
              recommendation: rec,
              hasDeficit: true, 
              redCnt: redCnt, 
              ylwCnt: ylwCnt
            }
          };
        }

        return {
          ...zone,
          properties: {
            ...zone.properties,
            lbl: 'Норма', col: '#90A4AE', fill: '#CFD8DC', hasDeficit: false, defPop: 0
          }
        };
      })
    };

    const popMultiplier = activeScenario === '2028' ? 1.03 : 1; 

    const filteredPmspRaw = cache.pmsp.results.filter(item => {
      const matchDist = checkDistrict(item.district);
      const matchVisit = visits.includes("Все посещения") || visits.includes(getVisitCategory(item.cap_load));
      const matchAffiliation = affiliations.includes("all") || affiliations.includes(item.own_type);      
      return matchDist && matchVisit && matchAffiliation;
    });

    const filteredPmspFeatures = filteredPmspRaw.map(i => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [i.lng, i.lat] },
      properties: { 
        ...i, 
        color: getCapLoadColor(i.cap_load),
        stroke_color: calculateStrokeColor(i),
        stroke_width: calculateStrokeWidth(i.doctor_load)
      }
    }));

    const filteredServiceZones = cache.serviceZones ? {
      ...cache.serviceZones,
      features: cache.serviceZones.features
        .filter(f => checkDistrict(f.properties.district_name))
        .map(zone => {
          const clinicsInside = filteredPmspRaw.filter(clinic => 
            isPointInPolygon([clinic.lng, clinic.lat], zone.geometry)
          );
          let zoneColor = '#9E9E9E';
          let zoneOpacity = 0.05;
          if (clinicsInside.length > 0) {
            const avgLoad = clinicsInside.reduce((sum, c) => sum + (c.cap_load || 0), 0) / clinicsInside.length;
            zoneColor = getCapLoadColor(avgLoad);
            zoneOpacity = 0.25;
          }
          return {
            ...zone,
            properties: { ...zone.properties, fill_color: zoneColor, fill_opacity: zoneOpacity, stroke_color: zoneColor, clinics_count: clinicsInside.length }
          };
        })
    } : null;

    const filteredPlannedObjs = cache.plannedObjs ? {
      ...cache.plannedObjs,
      features: cache.plannedObjs.features.filter(f => checkDistrict(f.properties.district))
        .map(f => ({ ...f, properties: { ...f.properties, layerType: 'planned' } }))
    } : null;

    const filteredZhk = cache.zhk ? {
      type: 'FeatureCollection',
      features: cache.zhk.zhk_rows
        .filter(item => checkDistrict(item.district))
        .map((item, idx) => ({
          type: 'Feature',
          id: idx,
          geometry: { type: 'Point', coordinates: [item.lng, item.lat] },
          properties: { ...item, radius: calculateZhkRadius(item.flats), layerType: 'zhkh' }
        }))
    } : null;

    const stats = {
      totalCount: filteredPmspFeatures.length,
      totalPopulation: filteredPmspFeatures.reduce((s, f) => s + (f.properties.population || 0), 0),
      avgVisit: filteredPmspFeatures.length > 0 
        ? (filteredPmspFeatures.reduce((s, f) => s + (f.properties.cap_load || 0), 0) / filteredPmspFeatures.length).toFixed(1)
        : 0,
      avgPerson: filteredPmspFeatures.length > 0
        ? (filteredPmspFeatures.reduce((s, f) => s + (f.properties.doctor_load || 0), 0) / filteredPmspFeatures.length).toFixed(1)
        : 0
    };

    return {
      city: cache.city,
      plannedZones: finalPlannedZones,
      districts: filteredDistricts,
      pmsp: { type: 'FeatureCollection', features: filteredPmspFeatures },
      plannedObjs: filteredPlannedObjs,
      serviceZones: filteredServiceZones,
      zhk: filteredZhk,
      grid: recomputedGrid,
      heatDeficit: cache.heatDeficit,
      heatCoverage: cache.heatCoverage,
      stats
    };
  }, [cache]);

  const isReady = useMemo(() => {
    if (!cache.city || !cache.pmsp || !cache.dists || !cache.plannedZones) return false;

    if (mode === 'geo-analysis') {
      return !!(cache.grid && cache.heatDeficit);
    }
    
    if (mode === 'infrastructure' || mode === 'load') {
      return !!(cache.serviceZones && cache.plannedZones); 
    }

    return true;
  }, [cache, mode]);

  return { filterData, isLoading, isFetching, isReady };
};