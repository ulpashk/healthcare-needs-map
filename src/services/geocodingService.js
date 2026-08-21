export const GeocodingService = {
  async searchAddress(query) {
    if (!query) return [];

    const ALMATY_VIEWBOX = "76.70,43.40,77.10,43.15"; 

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", Алматы")}&addressdetails=1&limit=10&viewbox=${ALMATY_VIEWBOX}&bounded=1`;
    
    try {
      const response = await fetch(url, {
        headers: { 
            'Accept-Language': 'ru-RU',
            'User-Agent': 'Almaty-Healthcare-Map-App'
        }
      });
      const data = await response.json();
      
      return data.filter(item => {
        const addr = item.display_name.toLowerCase();
        return addr.includes("алматы") && !addr.includes("алматинская область");
      });
    } catch (error) {
      console.error("Ошибка геокодинга:", error);
      return [];
    }
  }
};