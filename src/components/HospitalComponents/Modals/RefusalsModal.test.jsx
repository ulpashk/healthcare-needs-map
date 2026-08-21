import React from 'react';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import RefusalsModal from './RefusalsModal';

vi.mock('lucide-react', () => ({
  X: () => <svg data-testid="icon-x" />,
  AlertOctagon: () => <svg />,
}));

const mockData = {
  total_emergency_visits: 1500,
  total_refused: 450,
  refusal_percentage: 30,
  results: [
    {
      facility_type: "Городская больница",
      district: "Алмалинский район",
      total_emergency_visits: 100,
      hospitalization_denied: 80,
      beds_avg_annual: 250.4,
      occupancy_rate_percent: 0.95 
    },
    {
      facility_type: "Медцентр",
      district: "Медеуский район",
      total_emergency_visits: 200,
      hospitalization_denied: 100,
      beds_avg_annual: 100,
      occupancy_rate_percent: 0.60
    },
    {
      facility_type: "Прочая клиника",
      district: "Ауэзовский район",
      total_emergency_visits: 500,
      hospitalization_denied: 50,
      beds_avg_annual: 150,
      occupancy_rate_percent: 0.40
    }
  ]
};

describe('RefusalsModal Component', () => {
  const mockOnClose = vi.fn();
  const mockOnItemClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it('должен возвращать null, если данные отсутствуют', () => {
    const { container } = render(<RefusalsModal data={null} onClose={mockOnClose} />);
    expect(container.firstChild).toBeNull();
  });

  it('должен корректно отображать сводную статистику (шапка)', () => {
    render(<RefusalsModal data={mockData} onClose={mockOnClose} />);

    expect(screen.getByText('1 500')).toBeInTheDocument();
    expect(screen.getByText('450')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  it('должен сортировать список по проценту отказов (от большего к меньшему)', () => {
    render(<RefusalsModal data={mockData} onClose={mockOnClose} />);

    const items = screen.getAllByText(/%/).filter(el => el.className.includes('text-xs font-bold'));
    expect(items[0]).toHaveTextContent('80.0%');
    expect(items[1]).toHaveTextContent('50.0%');
  });

  it('должен удалять слово "район" из названий районов', () => {
    render(<RefusalsModal data={mockData} onClose={mockOnClose} />);
    
    expect(screen.getByText('Алмалинский')).toBeInTheDocument();
    expect(screen.queryByText('Алмалинский район')).not.toBeInTheDocument();
  });

  it('должен подсвечивать красным цветом высокую загрузку (>90%)', () => {
    render(<RefusalsModal data={mockData} onClose={mockOnClose} />);
    
    const occupancyCell = screen.getByText('95% занято');
    expect(occupancyCell).toHaveClass('text-red-600');
  });

  it('должен вызывать onItemClick при клике на элемент списка', () => {
    render(<RefusalsModal data={mockData} onClose={mockOnClose} onItemClick={mockOnItemClick} />);
    
    const hospitalItem = screen.getByText('Городская больница').closest('.cursor-pointer');
    fireEvent.click(hospitalItem);

    expect(mockOnItemClick).toHaveBeenCalledWith(mockData.results[0]);
  });

  it('должен корректно рассчитывать цвета для разных уровней отказа', () => {
    render(<RefusalsModal data={mockData} onClose={mockOnClose} />);
    
    const highVal = screen.getByText('80.0%');
    const midVal = screen.getByText('50.0%');
    const lowVal = screen.getByText('10.0%');

    expect(highVal).toHaveStyle({ color: 'rgb(198, 40, 40)' }); 
    expect(midVal).toHaveStyle({ color: 'rgb(239, 108, 0)' }); 
    expect(lowVal).toHaveStyle({ color: 'rgb(46, 125, 50)' });
  });

  it('должен вызывать onClose при клике на кнопку закрытия', () => {
    render(<RefusalsModal data={mockData} onClose={mockOnClose} />);
    
    const closeBtn = screen.getByTestId('icon-x').closest('button');
    fireEvent.click(closeBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});