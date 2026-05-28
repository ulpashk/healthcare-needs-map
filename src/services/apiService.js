const BASE_URL = 'https://admin.smartalmaty.kz/api/v1';

export const HealthcareService = {
  getCityBoundary: async () => {
    const res = await fetch(`${BASE_URL}/healthcare/geo/city-boundary/`);
    return res.json();
  },

  getDistricts: async () => {
    const res = await fetch(`${BASE_URL}/address/districts/?city=1`);
    return res.json();
  },

  getPmsp: async () => {
    const res = await fetch(`${BASE_URL}/healthcare/pmsp/?limit=1000`);
    return res.json();
  },

  getPmspDetail: async (id) => {
    const res = await fetch(`${BASE_URL}/healthcare/pmsp/${id}/`);
    if (!res.ok) throw new Error("Ошибка загрузки деталей ПМСП");
    return res.json();
  },

  getPlannedZones: async () => {
    const res = await fetch(`${BASE_URL}/healthcare/geo/planned-zones/`);
    return res.json();
  },

  getPlannedObjects: async () => {
    const res = await fetch(`${BASE_URL}/healthcare/geo/planned-objects/`);
    return res.json();
  },

  getServiceZones: async () => {
    const res = await fetch(`${BASE_URL}/healthcare/geo/service-zones/`);
    return res.json();
  },

  getZhk: async () => {
    const res = await fetch(`${BASE_URL}/healthcare/analytics/zhk/`);
    return res.json();
  }, 

  getDistrictSummary: async () => {
    const res = await fetch(`${BASE_URL}/healthcare/pmsp/district-summary/`);
    if (!res.ok) throw new Error("Ошибка при получении сводки");
    return res.json();
  },

  getBuildingAgeStats: async () => {
    const res = await fetch(`${BASE_URL}/healthcare/analytics/buildings/age-stats/`);
    if (!res.ok) throw new Error("Ошибка при получении статистики зданий");
    return res.json();
  },

  getInfrastructureAnalytics: async () => {
    const res = await fetch(`${BASE_URL}/healthcare/analytics/buildings/`);
    if (!res.ok) throw new Error("Ошибка загрузки аналитики зданий");
    return res.json();
  },

  getGridCells: async () => {
    const res = await fetch(`${BASE_URL}/healthcare/geo/grid-cells/`);
    return res.json();
  },

  getHeatmapData: async (type) => {
    const res = await fetch(`${BASE_URL}/healthcare/analytics/heatmap/${type}/`);
    const data = await res.json();
    
    return {
      type: 'FeatureCollection',
      features: data.map((point, idx) => ({
        type: 'Feature',
        id: idx,
        geometry: {
          type: 'Point',
          coordinates: [point[1], point[0]]
        },
        properties: {
          weight: point[2] || 1
        }
      }))
    };
  }
};