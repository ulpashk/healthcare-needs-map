import React from 'react';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import BuildingAgeModal from './BuildingAgeModal';
import { HealthcareService } from '../../../services/apiService';

vi.mock('../../../services/apiService', () => ({
    HealthcareService: {
        getBuildingAgeStats: vi.fn()
    }
}));

const mockStats = [
    { district: "Алатауский", total: 10, pre1970: 4, p1970_2000: 3, post2000: 3, critical: 1, snos: 1 },
    { district: "Медеуский", total: 20, pre1970: 2, p1970_2000: 10, post2000: 8, critical: 0, snos: 0 },
    { district: "Бостандыкский", total: 10, pre1970: 6, p1970_2000: 2, post2000: 2, critical: 2, snos: 0 },
    { district: "nan", total: 5, pre1970: 1 }, 
];

describe('BuildingAgeModal Component', () => {
    const mockOnClose = vi.fn();

    beforeEach(() => {
        HealthcareService.getBuildingAgeStats.mockResolvedValue(mockStats);
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('должен показывать лоадер при инициализации', () => {
        HealthcareService.getBuildingAgeStats.mockReturnValue(new Promise(() => {}));
        render(<BuildingAgeModal onClose={mockOnClose} />);
        expect(screen.getByText(/Сбор аналитики по зданиям/i)).toBeInTheDocument();
    });

    it('должен фильтровать "nan" и сортировать по убыванию старых зданий (pre1970)', async () => {
        render(<BuildingAgeModal onClose={mockOnClose} />);

        await waitFor(() => expect(screen.queryByText(/Сбор аналитики/i)).not.toBeInTheDocument());

        const rows = screen.getAllByRole('row');
        expect(rows[1]).toHaveTextContent('Бостандыкский');
        expect(rows[2]).toHaveTextContent('Алатауский');
        expect(rows[3]).toHaveTextContent('Медеуский');

        expect(screen.queryByText('nan')).not.toBeInTheDocument();
    });

    it('должен правильно рассчитывать проценты старых зданий', async () => {
        render(<BuildingAgeModal onClose={mockOnClose} />);

        const pctLabel = await screen.findByText('(40%)');
        expect(pctLabel).toBeInTheDocument();
        
        expect(screen.getByText('(60%)')).toBeInTheDocument();
    });

    it('должен подсвечивать красным фоном строки, где > 30% старых зданий', async () => {
        const { container } = render(<BuildingAgeModal onClose={mockOnClose} />);

        await waitFor(() => screen.getByText('Бостандыкский'));

        const highRiskRow = screen.getByText('Бостандыкский').closest('tr');
        expect(highRiskRow).toHaveClass('bg-red-50/30');

        const normalRow = screen.getByText('Медеуский').closest('tr');
        expect(normalRow).not.toHaveClass('bg-red-50/30');
    });

    it('должен отображать ошибку, если API запрос не удался', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        HealthcareService.getBuildingAgeStats.mockRejectedValue(new Error('Fetch error'));

        render(<BuildingAgeModal onClose={mockOnClose} />);

        await waitFor(() => {
            expect(screen.getByText('Ошибка загрузки данных')).toBeInTheDocument();
        });
    });

    it('должен вызывать onClose при клике на кнопку закрытия', async () => {
        render(<BuildingAgeModal onClose={mockOnClose} />);
        
        const closeBtn = screen.getByRole('button');
        fireEvent.click(closeBtn);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
});