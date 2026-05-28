const BASE_URL = 'https://admin.smartalmaty.kz/api/v1';

export const HospitalService = {
  getHospitals: async () => {
    const res = await fetch(`${BASE_URL}/healthcare/hospitals/?limit=1000`);
    return res.json();
  },
  getHospitalDetail: async (id) => {
    const res = await fetch(`${BASE_URL}/healthcare/hospitals/${id}/`);
    return res.json();
  },
  getSeismicPoints: async () => {
    const res = await fetch(`${BASE_URL}/healthcare/analytics/seismic/`);
    return res.json();
  },
  getRefusals: async () => {
    const res = await fetch(`${BASE_URL}/healthcare/extra-mo-refusal/?limit=10000`);
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
  getGridCells: async () => {
    const res = await fetch(`${BASE_URL}/healthcare/geo/grid-cells/`);
    return res.json();
  },
  getBedProfilesSummary: async () => {
    const res = await fetch(`${BASE_URL}/healthcare/analytics/bed-profiles-summary/`);
    return res.json();
  }
};