import { useState, useCallback } from 'react';
import wellknown from 'wellknown';

// const API_BASE_URL = 'https://admin.smartalmaty.kz/api/v1/healthcare/territorial-division-map/';
const API_BASE_URL = 'https://admin.smartalmaty.kz/api/v1/healthcare/clinic-areas/';

const getCoverageColor = (ratio) => {
  let numRatio = typeof ratio === 'string' ? parseFloat(ratio) : ratio;

  if (isNaN(numRatio) || numRatio === null || numRatio === undefined) {
    console.warn('Invalid coverage ratio:', ratio);
    return '#808080';
  }

  if (numRatio > 10) {
    numRatio = numRatio / 100;
  }

  if (numRatio > 1.0) {
    return '#ef4444';
  }

  if (numRatio < 0.9) {
    return '#eab308';
  }

  return '#22c55e';
};

export const useHealthcareData = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHealthcareData = useCallback(async (selectedDistrict) => {
    setIsLoading(true);
    setError(null);

    const validDistricts = Array.isArray(selectedDistrict)
      ? selectedDistrict.filter((d) => d !== "Все районы")
      : [];

    const districtQuery =
      validDistricts.length > 0
        ? `districts=${encodeURIComponent(validDistricts.join(","))}&`
        : "";

    try {
      const response = await fetch(
        `${API_BASE_URL}?${districtQuery}limit=100000`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data?.results) {
        throw new Error('Invalid API response format');
      }

      const processedData = processHealthcareData(data);

      return {
        points: processedData.points,
        polygons: processedData.polygons,
        polygonMapping: processedData.polygonMapping,
        stats: {
          // totalCount: new Set(data.results.map((item) => item.id)).size,
          // totalPopulation: data.total_population,
          // avgVisit: data.avg_overall_coverage_ratio,
          // avgPerson: data.avg_per_1_person,
          totalCount: data.mo_count || data.count, // Используем mo_count из новой апи
          totalPopulation: data.total_population,
          avgVisit: data.overall_coverage_ratio, // Было avg_overall_coverage_ratio
          avgPerson: data.per_1_person,  
          vopNeeded: data.vop_needed,
          vopCount: data.vop_count,
        },
      };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchHealthcareData, isLoading, error };
};

// const processHealthcareData = (data) => {
//   const groups = {};
//   let polygonIdCounter = 0;
//   const polygonMapping = {};

//   data.results.forEach((item) => {
//     if (!groups[item.id]) {
//       groups[item.id] = {
//         point: {
//           type: 'Feature',
//           geometry: {
//             type: 'Point',
//             coordinates: [
//               parseFloat(item.longitude),
//               parseFloat(item.latitude),
//             ],
//           },
//           id: item.id,
//           properties: {
//             id: item.id,
//             name: item.name,
//             address: item.full_address,
//             district: item.district,
//             photo: item.photo,
//             color: getCoverageColor(item.overall_coverage_ratio),
//             coverage_ratio: item.overall_coverage_ratio,
//           },
//         },
//         polygons: [],
//         polygonIds: [],
//       };
//     }

//     const geo = item.geometry ? wellknown.parse(item.geometry) : null;
//     if (geo) {
//       const uniquePolygonId = polygonIdCounter++;
//       groups[item.id].polygons.push({
//         type: 'Feature',
//         geometry: geo,
//         id: uniquePolygonId,
//         properties: {
//           parentId: item.id,
//           id: item.id,
//           name: item.name,
//           address: item.full_address,
//           color: ['#DCDCDC'], 
//           original_color: ['#DCDCDC'],
//         },
//       });
//       groups[item.id].polygonIds.push(uniquePolygonId);
//     }
//   });

//   Object.keys(groups).forEach((parentId) => {
//     polygonMapping[parentId] = groups[parentId].polygonIds;
//   });

//   return {
//     points: {
//       type: 'FeatureCollection',
//       features: Object.values(groups).map((g) => g.point),
//     },
//     polygons: {
//       type: 'FeatureCollection',
//       features: Object.values(groups).flatMap((g) => g.polygons),
//     },
//     polygonMapping,
//   };
// };

const processHealthcareData = (data) => {
  const groups = {};
  let polygonIdCounter = 0;
  const polygonMapping = {};

  data.results.forEach((item) => {
    if (!groups[item.id]) {
      // 3. ОБРАБОТКА КООРДИНАТ
      // В новой API нет полей latitude/longitude в корне. 
      // Берем первую координату из полигона для точки (маркера)
      const coords = item.geom?.coordinates?.[0]?.[0]?.[0] || [0, 0];
      
      groups[item.id] = {
        point: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [coords[0], coords[1]], // [lng, lat]
          },
          id: item.id,
          properties: {
            id: item.id,
            name: item.name || `Объект ${item.id}`,
            address: item.full_address || "Адрес не указан",
            district: item.district,
            color: getCoverageColor(item.overall_coverage_ratio || data.overall_coverage_ratio),
            coverage_ratio: item.overall_coverage_ratio,
          },
        },
        polygons: [],
        polygonIds: [],
      };
    }

    // 4. ГЕОМЕТРИЯ ТЕПЕРЬ ОБЪЕКТ, А НЕ СТРОКА
    const geo = item.geom; 
    
    if (geo) {
      const uniquePolygonId = polygonIdCounter++;
      groups[item.id].polygons.push({
        type: 'Feature',
        geometry: geo,
        id: uniquePolygonId,
        properties: {
          parentId: item.id,
          id: item.id,
          name: item.name,
          color: ['#DCDCDC'], 
        },
      });
      groups[item.id].polygonIds.push(uniquePolygonId);
    }
  });

  Object.keys(groups).forEach((parentId) => {
    polygonMapping[parentId] = groups[parentId].polygonIds;
  });

  return {
    points: {
      type: 'FeatureCollection',
      features: Object.values(groups).map((g) => g.point),
    },
    polygons: {
      type: 'FeatureCollection',
      features: Object.values(groups).flatMap((g) => g.polygons),
    },
    polygonMapping,
  };
};