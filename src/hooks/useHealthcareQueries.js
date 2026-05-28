import { useQuery } from '@tanstack/react-query';
import { HealthcareService } from '../services/apiService';

export const useHealthcareQueries = (mode) => {
  const cityQuery = useQuery({ queryKey: ['city'], queryFn: HealthcareService.getCityBoundary });
  const districtsQuery = useQuery({ queryKey: ['districts'], queryFn: HealthcareService.getDistricts });
  const pmspQuery = useQuery({ queryKey: ['pmsp'], queryFn: HealthcareService.getPmsp });
  
  const plannedZonesQuery = useQuery({ queryKey: ['plannedZones'], queryFn: HealthcareService.getPlannedZones });
  const plannedObjsQuery = useQuery({ queryKey: ['plannedObjs'], queryFn: HealthcareService.getPlannedObjects });
  const serviceZonesQuery = useQuery({ queryKey: ['serviceZones'], queryFn: HealthcareService.getServiceZones });
  const zhkQuery = useQuery({ queryKey: ['zhk'], queryFn: HealthcareService.getZhk });

  const isGeo = mode === 'geo-analysis';
  
  const gridQuery = useQuery({ 
    queryKey: ['grid'], 
    queryFn: HealthcareService.getGridCells, 
    enabled: isGeo 
  });
  const heatDeficitQuery = useQuery({ 
    queryKey: ['heatDeficit'], 
    queryFn: () => HealthcareService.getHeatmapData('deficit'), 
    enabled: isGeo 
  });
  const heatCoverageQuery = useQuery({ 
    queryKey: ['heatCoverage'], 
    queryFn: () => HealthcareService.getHeatmapData('coverage'), 
    enabled: isGeo 
  });

  return {
    data: {
      city: cityQuery.data,
      dists: districtsQuery.data,
      pmsp: pmspQuery.data,
      plannedZones: plannedZonesQuery.data,
      plannedObjs: plannedObjsQuery.data,
      serviceZones: serviceZonesQuery.data,
      zhk: zhkQuery.data,
      grid: gridQuery.data,
      heatDeficit: heatDeficitQuery.data,
      heatCoverage: heatCoverageQuery.data,
    },
    isLoading: cityQuery.isLoading || districtsQuery.isLoading || pmspQuery.isLoading || plannedObjsQuery.isLoading || zhkQuery.isLoading,
    isFetching: gridQuery.isFetching || plannedObjsQuery.isFetching
  };
};