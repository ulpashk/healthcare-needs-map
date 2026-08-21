import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import BuildingsFilterPanel from './BuildingsFilterPanel';

vi.mock('../PmspComponents/MapFilter/Indicators', () => ({
  default: ({ totalCount }) => <div data-testid="indicators-mock">Count: {totalCount}</div>
}));

vi.mock('../PmspComponents/MapFilter/Analytics', () => ({
  default: ({ onReset }) => <button onClick={onReset} data-testid="analytics-reset">Analytics Reset</button>
}));

describe('BuildingsFilterPanel Component', () => {
  const mockProps = {
    selectedDistrict: ["Все районы"],
    setSelectedDistrict: vi.fn(),
    selectedLayers: ["Все слои"],
    setSelectedLayers: vi.fn(),
    selectedAffiliations: ["all"],
    setSelectedAffiliations: vi.fn(),
    selectedTechConditions: [],
    setSelectedTechConditions: vi.fn(),
    searchQuery: "",
    setSearchQuery: vi.fn(),
    totalCount: 150,
    totalPopulation: 500000,
    avgVisit: 12.5,
    avgPerson: 4.2,
    onReset: vi.fn(),
    setActiveModal: vi.fn(),
    activeModal: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it('должен корректно рендериться и отображать заголовок', () => {
    render(<BuildingsFilterPanel {...mockProps} />);
    expect(screen.getByText('Фильтры')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Поиск по названию...')).toBeInTheDocument();
  });

  it('должен скрывать/показывать фильтры при клике на стрелку в заголовке', () => {
    const { container } = render(<BuildingsFilterPanel {...mockProps} />);
    const toggleBtn = screen.getByRole('button', { name: '' }); 
    const collapsibleArea = container.querySelector('.transition-all');

    expect(collapsibleArea).toHaveClass('max-h-screen');

    fireEvent.click(toggleBtn);
    expect(collapsibleArea).toHaveClass('max-h-0');
  });

  it('должен вызывать setSearchQuery при вводе текста', () => {
    render(<BuildingsFilterPanel {...mockProps} />);
    const input = screen.getByPlaceholderText('Поиск по названию...');
    
    fireEvent.change(input, { target: { value: 'Больница' } });
    expect(mockProps.setSearchQuery).toHaveBeenCalledWith('Больница');
  });

  it('должен открывать выпадающий список районов и вызывать setSelectedDistrict', () => {
    render(<BuildingsFilterPanel {...mockProps} />);
    
    const districtSelector = screen.getByText('Все районы');
    fireEvent.click(districtSelector);

    const checkAlatau = screen.getByLabelText('Алатауский');
    fireEvent.click(checkAlatau);

    expect(mockProps.setSelectedDistrict).toHaveBeenCalledWith(["Алатауский"]);
  });

  it('должен сбрасывать к "Все районы", если убрать все галочки', () => {
    const customProps = {
      ...mockProps,
      selectedDistrict: ["Алатауский"]
    };
    render(<BuildingsFilterPanel {...customProps} />);
    
    fireEvent.click(screen.getByText('Алатауский'));
    const checkAlatau = screen.getByLabelText('Алатауский');
    
    fireEvent.click(checkAlatau);

    expect(mockProps.setSelectedDistrict).toHaveBeenCalledWith(["Все районы"]);
  });

  it('должен корректно отображать лейбл тех. состояния', () => {
    render(<BuildingsFilterPanel {...mockProps} selectedTechConditions={['критично', 'риск']} />);
    
    expect(screen.getByText('Критическое, Риск')).toBeInTheDocument();
  });

  it('должен вызывать setSelectedTechConditions при выборе состояния', () => {
    render(<BuildingsFilterPanel {...mockProps} />);
    
    fireEvent.click(screen.getByText('Все состояния'));
    const checkboxCrit = screen.getByLabelText('Критическое');
    
    fireEvent.click(checkboxCrit);
    expect(mockProps.setSelectedTechConditions).toHaveBeenCalledWith(['критично']);
  });

  it('должен вызывать onReset при клике на общую кнопку сброса', () => {
    render(<BuildingsFilterPanel {...mockProps} />);
    
    const resetBtn = screen.getByText(/Сбросить/i);
    fireEvent.click(resetBtn);
    
    expect(mockProps.onReset).toHaveBeenCalledTimes(1);
  });

  it('должен передавать корректные данные в дочерний компонент Indicators', () => {
    render(<BuildingsFilterPanel {...mockProps} />);
    
    const indicators = screen.getByTestId('indicators-mock');
    expect(indicators).toHaveTextContent('Count: 150');
  });

  it('должен закрывать один dropdown при открытии другого', () => {
    render(<BuildingsFilterPanel {...mockProps} />);
    
    const districtSelector = screen.getByText('Все районы');
    const affiliationSelector = screen.getByText('Все принадлежности');

    fireEvent.click(districtSelector);
    expect(screen.getByText('Алатауский')).toBeInTheDocument();

    fireEvent.click(affiliationSelector);
    
    expect(screen.queryByText('Алатауский')).not.toBeInTheDocument();
    expect(screen.getByText('Городская (УЗ Алматы)')).toBeInTheDocument();
  });
});