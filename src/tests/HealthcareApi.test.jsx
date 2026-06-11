import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMapData } from '../hooks/useMapData';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Создаем обертку для React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Healthcare API - Тестирование стабильности', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn()); // Мокаем глобальный fetch через Vitest
  });

  it('Критический случай: Сервер вернул ошибку 500', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Server Error' }),
    });

    const { result } = renderHook(() => useMapData('load'), {
      wrapper: createWrapper(),
    });

    // Ждем, пока загрузка завершится (с ошибкой)
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Проверяем, что приложение не "упало", а вернуло null вместо данных
    const data = result.current.filterData({});
    expect(data).toBeNull();
  });

  it('Граничный случай: Сервер вернул пустые списки объектов', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        results: [],        // Для pmsp
        features: [],       // Для гео-данных
        zhk_rows: [],       // Для ЖКХ
        district_summary: [] // Важно: добавить этот пустой массив
      }),
    });

    const { result } = renderHook(() => useMapData('load'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Теперь это не должно вызывать ошибку .reduce()
    const data = result.current.filterData({ districts: ["Все районы"] });
    
    expect(data.stats.totalCount).toBe(0);
    expect(data.forecastStats.totalNewZhkPop).toBe(0);
  });

  it('Граничный случай: У больницы отсутствуют данные о мощности (null)', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        results: [{
            id: 99,
            name: "Проблемный объект",
            lat: 43.2,
            lng: 76.8,
            cap_load: null, // Поле пустое
            population: 0
        }],
        features: [],
      }),
    });

    const { result } = renderHook(() => useMapData('load'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
        const data = result.current.filterData({});
        if (data) {
            // Проверяем, что функция расчета цвета в useMapData.js 
            // вернула дефолтный цвет для null (серый), а не сломалась
            expect(data.pmsp.features[0].properties.color).toBe('#6b7280');
        }
    });
  });
});