import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TacticalTicker, { MOCK_TICKER_ITEMS } from '@/components/ui/TacticalTicker';

describe('TacticalTicker Component', () => {
  it('renders the bottom tactical ticker with correct accessibility attributes', () => {
    render(<TacticalTicker />);

    const tickerAside = screen.getByRole('complementary', {
      name: /cinta de información territorial en tiempo real/i,
    });
    expect(tickerAside).toBeInTheDocument();
    expect(tickerAside).toHaveClass('fixed', 'bottom-0', 'left-0', 'right-0', 'z-20', 'bg-[#09090b]');
  });

  it('renders mocked territorial statistics', () => {
    render(<TacticalTicker />);

    // Check key mock indicators exist
    const laPuntaElements = screen.getAllByText('La Punta');
    expect(laPuntaElements.length).toBeGreaterThan(0);

    const lmStatElements = screen.getAllByText('+34%');
    expect(lmStatElements.length).toBeGreaterThan(0);

    const callaoElements = screen.getAllByText('Callao Centro');
    expect(callaoElements.length).toBeGreaterThan(0);

    const riskScoreElements = screen.getAllByText('0.42');
    expect(riskScoreElements.length).toBeGreaterThan(0);

    const responseTimeElements = screen.getAllByText('8.5 min');
    expect(responseTimeElements.length).toBeGreaterThan(0);
  });

  it('contains the animation track with continuous duplicate for seamless 4K loop', () => {
    const { container } = render(<TacticalTicker />);

    const track = container.querySelector('.ticker-track');
    expect(track).toBeInTheDocument();
    expect(track).toHaveClass('animate-ticker');

    // Second half has aria-hidden="true" to prevent redundant screen reader announcements
    const hiddenTrackHalf = container.querySelector('[aria-hidden="true"]');
    expect(hiddenTrackHalf).toBeInTheDocument();
  });
});
