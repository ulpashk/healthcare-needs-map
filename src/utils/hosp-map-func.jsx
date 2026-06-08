export function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const dy = (lat2 - lat1) * 111000;
  const dx = (lng2 - lng1) * 111000 * Math.cos(lat1 * Math.PI / 180);
  return Math.sqrt(dx * dx + dy * dy);
}

export function computeGridData(gridGeoJSON, targets) {
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

export function enrichZonesWithEverything(zones, plannedObjs, recommendations = []) {
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

export function computeOrgTypeGrid(gridGeoJSON, targets, nearThreshold, farThreshold) {
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