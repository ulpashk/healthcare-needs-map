import React from 'react';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';

import BuildingAnalysisModalHospitals from "./BuildingAnalysisModalHospitals";

vi.mock("../../utils/hospital-utils", () => ({
  shortenHospitalName: vi.fn((name) => name.replace('Больница', 'Б.')),
}));

vi.mock('lucide-react', () => ({
  X: () => <svg data-testid="icon-x" />,
  Building2: () => <svg />,
  Calendar: () => <svg />,
}));

const mockHospitalData = [
  { unified_id: 1, name: "Больница 1", bld_emergency: true, bld_year: 1950, district: "Алатауский" },
  { unified_id: 2, name: "Больница 2", bld_seismic: true, bld_year: 1960, district: "Медеуский" },
  { unified_id: 3, name: "Больница 3", bld_seismic: true, bld_year: 1970, district: "Медеуский" },
  { unified_id: 4, name: "Больница 4", bld_tech: "Ветхое", bld_year: 1975, district: "Ауэзовский" },
  { unified_id: 5, name: "Больница 5", bld_tech: "Ветхое", bld_year: 1985, district: "Ауэзовский" },
  { unified_id: 6, name: "Больница 6", bld_tech: "Ветхое", bld_year: 1990, district: "Ауэзовский" },
  { unified_id: 7, name: "Больница 7", bld_tech: "Исправное", bld_year: 1940, district: "Алатауский" },
  { unified_id: 8, name: "Больница 8", bld_tech: "Исправное", bld_year: 2020, district: "Медеуский" }
];

describe('BuildingAnalysisModalHospitals Component', () => {
  const mockOnClose = vi.fn();
  const mockOnHospitalClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it('должен правильно рассчитывать уникальную статистику в карточках', () => {
    render(
      <BuildingAnalysisModalHospitals 
        onClose={mockOnClose} 
        data={mockHospitalData} 
        onHospitalClick={mockOnHospitalClick} 
      />
    );

    const statsGrid = screen.getByText(/Аварийных/i).closest('.grid');
    const statsScope = within(statsGrid);

    const checkCard = (labelRegex, expectedValue) => {
      const labelElement = statsScope.getByText(labelRegex);
      const cardContainer = labelElement.parentElement; 
      expect(within(cardContainer).getByText(expectedValue.toString())).toBeInTheDocument();
    };

    checkCard(/Аварийных/i, 1);
    checkCard(/Сейсмика/i, 2);
    checkCard(/Ветхих/i, 3);
    checkCard(/До 1980г/i, 5);
  });

  it('должен отображать только объекты с риском в списке', () => {
    render(<BuildingAnalysisModalHospitals onClose={mockOnClose} data={mockHospitalData} onHospitalClick={mockOnHospitalClick} />);

    expect(screen.getByText('Б. 1')).toBeInTheDocument();
    expect(screen.getByText('Б. 6')).toBeInTheDocument();
    expect(screen.queryByText('Б. 8')).not.toBeInTheDocument();
  });

  it('должен переключаться на вкладку "По районам" и корректно считать пропорции риска', () => {
    render(<BuildingAnalysisModalHospitals onClose={mockOnClose} data={mockHospitalData} onHospitalClick={mockOnHospitalClick} />);

    fireEvent.click(screen.getByText(/По районам/i));

    expect(screen.getByText('Алатауский')).toBeInTheDocument();
    expect(screen.getByText('1/2 МО')).toBeInTheDocument();

    expect(screen.getByText('Медеуский')).toBeInTheDocument();
    expect(screen.getByText('2/3 МО')).toBeInTheDocument();

    expect(screen.getByText('Ауэзовский')).toBeInTheDocument();
    expect(screen.getByText('3/3 МО')).toBeInTheDocument();
  });

  it('должен вызывать onHospitalClick при выборе объекта', () => {
    render(<BuildingAnalysisModalHospitals onClose={mockOnClose} data={mockHospitalData} onHospitalClick={mockOnHospitalClick} />);

    const item = screen.getByText('Б. 1');
    fireEvent.click(item.closest('.cursor-pointer'));

    expect(mockOnHospitalClick).toHaveBeenCalledWith(1);
  });

  it('должен вызывать onClose при клике на крестик', () => {
    render(<BuildingAnalysisModalHospitals onClose={mockOnClose} data={mockHospitalData} onHospitalClick={mockOnHospitalClick} />);

    const closeBtn = screen.getByTestId('icon-x').closest('button');
    fireEvent.click(closeBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});