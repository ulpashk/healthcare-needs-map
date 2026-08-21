import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import HospitalFilter from './HospitalFilter';

vi.mock('lucide-react', () => ({
  Search: () => <svg data-testid="icon-search" />,
  Building2: () => <svg />,
  TrendingUp: () => <svg />,
  ChevronDown: () => <svg />,
  ChevronUp: () => <svg />,
  Bed: () => <svg />,
  Users: () => <svg />,
  MapIcon: () => <svg />,
  Stethoscope: () => <svg />,
  Landmark: () => <svg />,
}));

const mockFacilities = [
  { 
    name: "ГКБ 1", 
    district: "Алмалинский", 
    total_beds: 100, 
    admitted: 50, 
    pct_occupied: 80,
    org_type: "Больница" 
  },
  { 
    name: "МЦ ХАК", 
    district: "Медеуский", 
    total_beds: 50, 
    admitted: 20, 
    pct_occupied: 60,
    org_type: "Медцентр" 
  }
];

const mockFilters = {
  searchQuery: "",
  district: "Все районы",
  selectedTechConditions: [],
  facilityTypes: [],
  ownTypes: [],
  activeGeoLayers: ["zones"],
  mapMode: "load"
};

const renderWithRouter = (ui, { route = '/' } = {}) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>
  );
};

describe('HospitalFilter Component', () => {
  const mockOnFiltersChange = vi.fn();
  const mockOnShowBuildingAnalysis = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it('должен корректно рассчитывать суммарные показатели (beds, occupancy)', () => {
    renderWithRouter(
      <HospitalFilter 
        facilities={mockFacilities} 
        allFacilities={mockFacilities} 
        filters={mockFilters} 
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('70')).toBeInTheDocument();
    expect(screen.getByText('70%')).toBeInTheDocument();
  });

  it('должен вызывать onFiltersChange при вводе в поиск', () => {
    renderWithRouter(
      <HospitalFilter 
        facilities={mockFacilities} 
        allFacilities={mockFacilities} 
        filters={mockFilters} 
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const input = screen.getByPlaceholderText(/Название стационара/i);
    fireEvent.change(input, { target: { value: 'ГКБ' } });

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ searchQuery: 'ГКБ' })
    );
  });

  it('должен отображать специфичные фильтры для страницы зданий', () => {
    renderWithRouter(
      <HospitalFilter 
        facilities={mockFacilities} 
        allFacilities={mockFacilities} 
        filters={mockFilters} 
        onFiltersChange={mockOnFiltersChange}
      />,
      { route: '/buildings' }
    );

    expect(screen.getByText(/Техническое состояние/i)).toBeInTheDocument();
    expect(screen.getByText(/Типы организаций/i)).toBeInTheDocument();
  });

  it('должен раскрывать секцию при клике', () => {
    renderWithRouter(
      <HospitalFilter 
        facilities={mockFacilities} 
        allFacilities={mockFacilities} 
        filters={mockFilters} 
        onFiltersChange={mockOnFiltersChange}
      />,
      { route: '/buildings' }
    );

    const techSectionBtn = screen.getByText(/Техническое состояние/i);
    fireEvent.click(techSectionBtn);

    expect(screen.getByText(/Исправное/i)).toBeInTheDocument();
  });

  it('должен корректно обрабатывать логику взаимоисключающих слоев в Гео-анализе', () => {
    const geoFilters = { ...mockFilters, activeGeoLayers: ["zones"] };
    
    renderWithRouter(
      <HospitalFilter 
        facilities={mockFacilities} 
        allFacilities={mockFacilities} 
        filters={geoFilters} 
        onFiltersChange={mockOnFiltersChange}
      />,
      { route: '/geo-analysis' }
    );

    const gridCheckbox = screen.getByLabelText(/Сетка доступности/i);
    fireEvent.click(gridCheckbox);

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ activeGeoLayers: ["zones", "grid"] })
    );
  });

  it('должен вызывать onShowBuildingAnalysis при нажатии на кнопку', () => {
    renderWithRouter(
      <HospitalFilter 
        facilities={mockFacilities} 
        allFacilities={mockFacilities} 
        filters={mockFilters} 
        onFiltersChange={mockOnFiltersChange}
        onShowBuildingAnalysis={mockOnShowBuildingAnalysis}
      />,
      { route: '/buildings' }
    );

    const btn = screen.getByText(/Анализ зданий/i);
    fireEvent.click(btn);

    expect(mockOnShowBuildingAnalysis).toHaveBeenCalled();
  });

  it('должен менять цвет индикатора загрузки в зависимости от процента', () => {
    const highLoadFacilities = [{ ...mockFacilities[0], pct_occupied: 95 }];
    
    renderWithRouter(
      <HospitalFilter 
        facilities={highLoadFacilities} 
        allFacilities={highLoadFacilities} 
        filters={mockFilters} 
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const loadContainer = screen.getByText('95%').closest('.rounded-lg');
    expect(loadContainer).toHaveClass('bg-orange-50');
  });
});