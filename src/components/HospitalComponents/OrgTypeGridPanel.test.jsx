import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import OrgTypeGridPanel from './OrgTypeGridPanel';
import { getMoSettings } from "../../constants/mo-config";

vi.mock("../../constants/mo-config", () => ({
  getMoSettings: vi.fn()
}));

vi.mock('lucide-react', () => ({
  X: () => <svg data-testid="icon-x" />,
  Search: () => <svg />,
  ChevronRight: () => <svg />,
  ArrowLeft: () => <svg data-testid="icon-back" />,
  LocateFixed: () => <svg />,
  LayoutGrid: () => <svg />,
  Building2: () => <svg />,
}));

const mockHospitals = [
  { unified_id: 1, name: "Поликлиника №1", org_type: "ГП", district: "Алатауский", total_beds: 10, pct_occupied: 80 },
  { unified_id: 2, name: "Поликлиника №2", org_type: "ГП", district: "Медеуский", total_beds: 20, pct_occupied: 100 },
  { unified_id: 3, name: "Больница №4", org_type: "ГКБ", district: "Ауэзовский", total_beds: 200, pct_occupied: 60 },
];

describe('OrgTypeGridPanel Component', () => {
  const mockOnClose = vi.fn();
  const mockOnSelectType = vi.fn();
  const mockOnHospitalClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    getMoSettings.mockReturnValue({ mode: 'territorial', near: 1000, far: 3000 });
  });

  afterEach(cleanup);

  it('должен отображать список уникальных типов МО и их количество', () => {
    render(
      <OrgTypeGridPanel 
        hospitals={mockHospitals} 
        selectedType={null} 
        onClose={mockOnClose} 
      />
    );

    expect(screen.getByText('ГП')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('ГКБ')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('должен вызывать onSelectType при клике на тип организации', () => {
    render(
      <OrgTypeGridPanel 
        hospitals={mockHospitals} 
        selectedType={null} 
        onSelectType={mockOnSelectType} 
      />
    );

    const typeBtn = screen.getByText('ГП').closest('button');
    fireEvent.click(typeBtn);

    expect(mockOnSelectType).toHaveBeenCalledWith('ГП');
  });

  it('должен показывать статистику покрытия (районы) в зональном режиме', () => {
    getMoSettings.mockReturnValue({ mode: 'zonal' });
    
    render(
      <OrgTypeGridPanel 
        hospitals={mockHospitals} 
        selectedType="ГП" 
      />
    );

    expect(screen.getByText(/Покрытие:/i)).toBeInTheDocument();
    expect(screen.getByText('2 районов')).toBeInTheDocument();
  });

  it('должен показывать среднюю нагрузку и менять её цвет в мощностном режиме', () => {
    getMoSettings.mockReturnValue({ mode: 'capacity' });
    
    render(
      <OrgTypeGridPanel 
        hospitals={mockHospitals} 
        selectedType="ГП" 
      />
    );

    const loadText = screen.getByText('90%');
    expect(loadText).toBeInTheDocument();
    expect(loadText).toHaveClass('text-green-600');
  });

  it('должен отображать список конкретных больниц, если тип выбран', () => {
    render(
      <OrgTypeGridPanel 
        hospitals={mockHospitals} 
        selectedType="ГП" 
        onHospitalClick={mockOnHospitalClick}
      />
    );

    expect(screen.getByText('Поликлиника №1')).toBeInTheDocument();
    expect(screen.getByText('Поликлиника №2')).toBeInTheDocument();
    expect(screen.queryByText('Больница №4')).not.toBeInTheDocument();
  });

  it('должен вызывать onHospitalClick при клике на объект из списка', () => {
    render(
      <OrgTypeGridPanel 
        hospitals={mockHospitals} 
        selectedType="ГП" 
        onHospitalClick={mockOnHospitalClick}
      />
    );

    const hospitalBtn = screen.getByText('Поликлиника №1').closest('button');
    fireEvent.click(hospitalBtn);

    expect(mockOnHospitalClick).toHaveBeenCalledWith(mockHospitals[0]);
  });

  it('должен сбрасывать выбранный тип при нажатии на кнопку "Назад"', () => {
    render(
      <OrgTypeGridPanel 
        hospitals={mockHospitals} 
        selectedType="ГП" 
        onSelectType={mockOnSelectType} 
      />
    );

    const backBtn = screen.getByTestId('icon-back').closest('button');
    fireEvent.click(backBtn);

    expect(mockOnSelectType).toHaveBeenCalledWith(null);
  });

  it('должен вызывать onClose при клике на крестик', () => {
    render(<OrgTypeGridPanel hospitals={mockHospitals} onClose={mockOnClose} />);
    
    const closeBtn = screen.getByTestId('icon-x').closest('button');
    fireEvent.click(closeBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});