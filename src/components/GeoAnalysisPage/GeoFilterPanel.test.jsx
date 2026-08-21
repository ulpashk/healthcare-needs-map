import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import GeoFilterPanel from './GeoFilterPanel';

vi.mock('./PlanningToolList', () => ({
  default: () => <div data-testid="planning-tool-list">Planning Tool List</div>
}));

vi.mock('../PmspComponents/MapFilter/Indicators', () => ({
  default: () => <div data-testid="indicators">Indicators Component</div>
}));

vi.mock('lucide-react', () => ({
  Search: () => <svg />,
  ChevronDown: () => <svg />,
  RotateCcw: () => <svg />,
  TrendingUp: () => <svg />,
  Bus: () => <svg />,
  ChartLine: () => <svg />
}));

describe('GeoFilterPanel Component', () => {
  const mockProps = {
    searchQuery: '',
    setSearchQuery: vi.fn(),
    selectedDistrict: ['Все районы'],
    setSelectedDistrict: vi.fn(),
    selectedLayers: ['Все слои'],
    setSelectedLayers: vi.fn(),
    selectedVisits: ['Все посещения'],
    setSelectedVisits: vi.fn(),
    selectedAffiliations: ['all'],
    setSelectedAffiliations: vi.fn(),
    totalCount: 100,
    totalPopulation: 2000000,
    avgPerson: 10,
    avgVisit: 100,
    forecastStats: {
      forecastPopBase: 2100000,
      zhkhPopAdd: 50000,
      zhkCount: 10,
      totalNewZhkPop: 15000,
      totalPlannedServedPop: 12000,
      forecastDeficit: 3000,
      criticalDistrictsCount: 2,
      improvedZonesCount: 45,
      plannedPmspObjects: [{}, {}]
    },
    activeScenario: 'current',
    setActiveScenario: vi.fn(),
    onReset: vi.fn(),
    setIsPlanningActive: vi.fn(),
    isPlanningActive: false,
    plannedZonesData: [],
    onZoomTo: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it('должен рендериться и отображать заголовок "Фильтры"', () => {
    render(<GeoFilterPanel {...mockProps} />);
    expect(screen.getByText('Фильтры')).toBeInTheDocument();
  });

  it('должен вызывать setSearchQuery при вводе текста в поиск', () => {
    render(<GeoFilterPanel {...mockProps} />);
    const input = screen.getByPlaceholderText('Поиск по названию...');
    fireEvent.change(input, { target: { value: 'Поликлиника' } });
    expect(mockProps.setSearchQuery).toHaveBeenCalled();
  });

  it('должен открывать выпадающий список районов при клике', () => {
    render(<GeoFilterPanel {...mockProps} />);
    const districtTrigger = screen.getByText('Все районы');
    fireEvent.click(districtTrigger);
    
    expect(screen.getByText('Алатауский')).toBeInTheDocument();
  });

  it('должен вызывать setActiveScenario при клике на кнопки сценариев', () => {
    render(<GeoFilterPanel {...mockProps} />);
    const plannedBtn = screen.getByText('С планами');
    fireEvent.click(plannedBtn);
    expect(mockProps.setActiveScenario).toHaveBeenCalledWith('planned');
  });

  it('должен отображать блок прогноза, если выбран сценарий "2028"', () => {
    render(<GeoFilterPanel {...mockProps} activeScenario="2028" />);
    
    expect(screen.getByText('Прогноз 2026-2028')).toBeInTheDocument();
    expect(screen.getByText('🏗 Строящиеся ЖК')).toBeInTheDocument();
    expect(screen.getByText('~2.10 млн')).toBeInTheDocument();
  });

  it('должен скрывать Indicators, если активировано планирование', () => {
    const { rerender } = render(<GeoFilterPanel {...mockProps} isPlanningActive={false} />);
    expect(screen.getByTestId('indicators')).toBeInTheDocument();

    rerender(<GeoFilterPanel {...mockProps} isPlanningActive={true} />);
    expect(screen.queryByTestId('indicators')).not.toBeInTheDocument();
  });

  it('должен вызывать setIsPlanningActive при клике на синюю панель планирования', () => {
    render(<GeoFilterPanel {...mockProps} />);
    const planningPanel = screen.getByText('Инструмент планирования');
    fireEvent.click(planningPanel);
    expect(mockProps.setIsPlanningActive).toHaveBeenCalled();
  });

  it('должен вызывать onReset при клике на кнопку сброса', () => {
    render(<GeoFilterPanel {...mockProps} />);
    const resetBtn = screen.getByText('Сбросить фильтры');
    fireEvent.click(resetBtn);
    expect(mockProps.onReset).toHaveBeenCalled();
  });

  it('логика handleDistrictChange: выбор конкретного района заменяет "Все районы"', () => {
    render(<GeoFilterPanel {...mockProps} />);
    
    fireEvent.click(screen.getByText('Все районы'));
    
    const alatauOption = screen.getByLabelText('Алатауский');
    fireEvent.click(alatauOption);

    const updateFn = mockProps.setSelectedDistrict.mock.calls[0][0];
    const result = updateFn(['Все районы']);
    
    expect(result).toContain('Алатауский');
    expect(result).not.toContain('Все районы');
  });

  it('логика handleDistrictChange: клик по "Все районы" сбрасывает остальные', () => {
    render(<GeoFilterPanel {...mockProps} selectedDistrict={['Алатауский', 'Медеуский']} />);
    
    fireEvent.click(screen.getByText('Алатауский, Медеуский'));
    const allDistOption = screen.getByLabelText('Все районы');
    fireEvent.click(allDistOption);

    expect(mockProps.setSelectedDistrict).toHaveBeenCalledWith(['Все районы']);
  });
});