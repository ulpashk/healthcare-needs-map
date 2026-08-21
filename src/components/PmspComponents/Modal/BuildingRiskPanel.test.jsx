import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import BuildingRiskPanel from './BuildingRiskPanel';
import { HealthcareService } from '../../../services/apiService';

vi.mock('../../../services/apiService', () => ({
  HealthcareService: {
    getInfrastructureAnalytics: vi.fn()
  }
}));

const mockData = {
  emergency_count: 7,
  seismic_count: 12,
  by_priority: {
    'критично': 18,
    'нет данных': 25
  },
  by_age: [
    { district: 'Алмалинский район', pre1970: 5, y1970_2000: 10, post2000: 15 },
    { district: 'Медеуский район', pre1970: 3, y1970_2000: 20, post2000: 25 }
  ],
  critical_list: [
    { 
      name: 'Городская поликлиника 1', 
      bld_year_built: 1965, 
      priority_reason: 'Аварийное', 
      bld_priority: 'Критично',
      lat: 43.1, 
      lng: 76.1 
    }
  ]
};

describe('BuildingRiskPanel Component', () => {
  const mockOnClose = vi.fn();
  const mockOnZoomTo = vi.fn();

  beforeEach(() => {
    HealthcareService.getInfrastructureAnalytics.mockResolvedValue(mockData);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('должен показывать индикатор загрузки (loader) при ожидании данных', () => {
    HealthcareService.getInfrastructureAnalytics.mockReturnValue(new Promise(() => {}));
    render(<BuildingRiskPanel onClose={mockOnClose} onZoomTo={mockOnZoomTo} />);
    
    const loader = document.querySelector('.animate-spin');
    expect(loader).toBeInTheDocument();
  });

  it('должен рендерить верхние показатели после загрузки данных', async () => {
    render(<BuildingRiskPanel onClose={mockOnClose} onZoomTo={mockOnZoomTo} />);

    await waitFor(() => {
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('18')).toBeInTheDocument();
    });
    
    expect(screen.getByText(/Скрытый риск/i)).toBeInTheDocument();
  });

  it('должен корректно отображать список объектов и сокращать названия (ГП)', async () => {
    render(<BuildingRiskPanel onClose={mockOnClose} onZoomTo={mockOnZoomTo} />);

    const hospitalName = await screen.findByText('ГП 1');
    expect(hospitalName).toBeInTheDocument();
    expect(screen.getByText('1965')).toBeInTheDocument();
  });

  it('должен вызывать onZoomTo при клике на строку объекта', async () => {
    render(<BuildingRiskPanel onClose={mockOnClose} onZoomTo={mockOnZoomTo} />);

    const row = await screen.findByText('ГП 1');
    fireEvent.click(row.closest('tr'));

    expect(mockOnZoomTo).toHaveBeenCalledWith(mockData.critical_list[0]);
  });

  it('должен переключаться на вкладку "По районам" и считать итоги в футере', async () => {
    render(<BuildingRiskPanel onClose={mockOnClose} onZoomTo={mockOnZoomTo} />);

    const tabDist = await screen.findByText(/По районам/i);
    fireEvent.click(tabDist);

    expect(screen.getByText('До 1970')).toBeInTheDocument();
    expect(screen.getByText('Алмалинский')).toBeInTheDocument();

    const footer = document.querySelector('tfoot');
    const footerScope = within(footer);

    expect(footerScope.getByText('8')).toBeInTheDocument();
    
    expect(footerScope.getByText('30')).toBeInTheDocument();
    
    expect(footerScope.getByText('78')).toBeInTheDocument();
  });

  it('должен вызывать onClose при нажатии на крестик', async () => {
    render(<BuildingRiskPanel onClose={mockOnClose} onZoomTo={mockOnZoomTo} />);

    await screen.findByText(/Скрытый риск/i);
    
    const closeBtn = screen.getAllByRole('button')[0]; 
    fireEvent.click(closeBtn);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});