import { useQuery } from '@tanstack/react-query';
import { HospitalService } from '../services/hospitalApiService';

export const useHospitalQueries = (mode) => {
  const hospitalsQuery = useQuery({ 
    queryKey: ['hospitals'], 
    queryFn: HospitalService.getHospitals 
  });

  const districtsQuery = useQuery({ 
    queryKey: ['districts'], 
    queryFn: HospitalService.getDistricts 
  });

  const seismicQuery = useQuery({ 
    queryKey: ['seismicPoints'], 
    queryFn: HospitalService.getSeismicPoints,
    enabled: mode === 'buildings'
  });

  const isGeo = mode === 'geo';

  const refusalsQuery = useQuery({ 
    queryKey: ['refusals'], 
    queryFn: HospitalService.getRefusals, 
    enabled: isGeo 
  });

  const plannedZonesQuery = useQuery({ 
    queryKey: ['hospPlannedZones'], 
    queryFn: HospitalService.getPlannedZones, 
    enabled: isGeo 
  });

  const plannedObjsQuery = useQuery({ 
    queryKey: ['hospPlannedObjects'], 
    queryFn: HospitalService.getPlannedObjects, 
    enabled: isGeo 
  });

  const gridQuery = useQuery({ 
    queryKey: ['hospGridCells'], 
    queryFn: HospitalService.getGridCells, 
    enabled: isGeo 
  });

  const profilesQuery = useQuery({ 
    queryKey: ['bedProfilesSummary'], 
    queryFn: HospitalService.getBedProfilesSummary, 
    enabled: isGeo 
  });

  const recommendationsQuery = useQuery({
    queryKey: ['hospRecommendations'],
    queryFn: () => fetch("/geo-files/recommendations.json").then(res => res.json()),
    enabled: isGeo
  });

  return {
    data: {
      hospitals: hospitalsQuery.data?.results || [],
      districts: districtsQuery.data,
      seismic: seismicQuery.data || [],
      refusals: refusalsQuery.data,
      plannedZones: plannedZonesQuery.data,
      plannedObjects: plannedObjsQuery.data,
      gridCells: gridQuery.data,
      profilesSummary: profilesQuery.data,
      recommendations: recommendationsQuery.data || []
    },
    isLoading: hospitalsQuery.isLoading || districtsQuery.isLoading || (isGeo && (plannedZonesQuery.isLoading || gridQuery.isLoading)),
    isFetching: hospitalsQuery.isFetching
  };
};