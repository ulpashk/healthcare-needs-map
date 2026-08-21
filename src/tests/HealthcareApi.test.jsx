import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMapData } from '../hooks/useMapData';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
    vi.stubGlobal('fetch', vi.fn());
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

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const data = result.current.filterData({});
    expect(data).toBeNull();
  });

  it('Граничный случай: Сервер вернул пустые списки объектов', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        results: [],
        features: [],
        zhk_rows: [],
        district_summary: []
      }),
    });

    const { result } = renderHook(() => useMapData('load'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

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
            cap_load: null,
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
            expect(data.pmsp.features[0].properties.color).toBe('#6b7280');
        }
    });
  });
});