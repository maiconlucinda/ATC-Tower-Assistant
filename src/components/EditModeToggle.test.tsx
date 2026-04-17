import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import EditModeToggle from './EditModeToggle';
import { useAppStore } from '@/store';

describe('EditModeToggle', () => {
    beforeEach(() => {
        useAppStore.setState({ editMode: false });
    });

    it('defaults to View Mode', () => {
        render(<EditModeToggle />);
        const button = screen.getByRole('button');
        expect(button).toHaveTextContent('View Mode');
        expect(button).toHaveAttribute('aria-pressed', 'false');
    });

    it('switches to Edit Mode on click', () => {
        render(<EditModeToggle />);
        const button = screen.getByRole('button');
        fireEvent.click(button);
        expect(button).toHaveTextContent('Edit Mode');
        expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('toggles back to View Mode on second click', () => {
        render(<EditModeToggle />);
        const button = screen.getByRole('button');
        fireEvent.click(button);
        fireEvent.click(button);
        expect(button).toHaveTextContent('View Mode');
        expect(button).toHaveAttribute('aria-pressed', 'false');
    });

    it('reflects Edit Mode when store is pre-set', () => {
        useAppStore.setState({ editMode: true });
        render(<EditModeToggle />);
        const button = screen.getByRole('button');
        expect(button).toHaveTextContent('Edit Mode');
        expect(button).toHaveAttribute('aria-pressed', 'true');
    });
});
