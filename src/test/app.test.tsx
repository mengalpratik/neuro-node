import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

describe('Personal Dashboard Full App Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    // Mock global fetch for weather
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        current: {
          temperature_2m: 25,
          relative_humidity_2m: 55,
          weather_code: 0,
          wind_speed_10m: 10,
          wind_direction_10m: 90,
        },
        daily: {
          temperature_2m_max: [30],
          temperature_2m_min: [20],
          precipitation_probability_max: [10],
        },
      }),
    } as any);
  });

  it('renders the core dashboard shell, clock, calendar, and initial groups', () => {
    render(<App />);

    // Brand
    expect(screen.getByText('NEURO//NODE')).toBeInTheDocument();
    expect(screen.getByText('COMMAND')).toBeInTheDocument();

    // Clock
    expect(screen.getByText(/CHRONO \/\/ LIVE/i)).toBeInTheDocument();

    // Indian Calendar
    expect(screen.getByText(/भारतीय पंचांग \/\/ CALENDAR/i)).toBeInTheDocument();

    // Weather
    expect(screen.getByText(/METEOROLOGY \/\/ LIVE/i)).toBeInTheDocument();

    // Schedule / Events
    expect(screen.getByText(/SCHEDULE \/\/ EVENTS/i)).toBeInTheDocument();

    // Clean first-run: 0 demo bookmark groups
    expect(screen.getByText(/MATRIX ROUTING \/\/ BOOKMARK CLUSTERS \(0\)/i)).toBeInTheDocument();
    expect(screen.queryByText(/Development/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Cybersecurity/i)).not.toBeInTheDocument();

    // + Add Group card is ready for user's own bookmarks
    expect(screen.getByText(/\+ Add Group/i)).toBeInTheDocument();
  });

  it('opens and closes the Horoscope modal without cluttering the primary dashboard', () => {
    render(<App />);

    const horoscopeBtn = screen.getByRole('button', { name: /राशीभविष्य \/ Horoscope/i });
    expect(horoscopeBtn).toBeInTheDocument();

    // Modal is initially closed
    expect(screen.queryByText(/दैनिक राशीभविष्य \/\/ HOROSCOPE INSIGHTS/i)).not.toBeInTheDocument();

    // Click to open
    fireEvent.click(horoscopeBtn);
    expect(screen.getByText(/दैनिक राशीभविष्य \/\/ HOROSCOPE INSIGHTS/i)).toBeInTheDocument();
    expect(screen.getByText(/Mesh/i)).toBeInTheDocument();

    // Close via Close button
    const closeBtn = screen.getByLabelText(/Close dialog/i);
    fireEvent.click(closeBtn);
    expect(screen.queryByText(/दैनिक राशीभविष्य \/\/ HOROSCOPE INSIGHTS/i)).not.toBeInTheDocument();
  });

  it('opens the main burger settings drawer and switches tabs', () => {
    render(<App />);

    const menuBtn = screen.getByRole('button', { name: /Open main system settings menu/i });
    fireEvent.click(menuBtn);

    // Settings drawer is visible
    expect(screen.getByText(/SYSTEM CONFIG \/\/ SETTINGS/i)).toBeInTheDocument();
    expect(screen.getByText(/Color Presets/i)).toBeInTheDocument();

    // Switch to Data & Backup tab
    const dataTab = screen.getByRole('button', { name: /Data & Backup/i });
    fireEvent.click(dataTab);
    expect(screen.getByText(/Export Dashboard Backup/i)).toBeInTheDocument();
    expect(screen.getByText(/Import Dashboard Backup/i)).toBeInTheDocument();

    // Close settings drawer
    const closeDrawerBtn = screen.getByLabelText(/Close settings drawer/i);
    fireEvent.click(closeDrawerBtn);
    expect(screen.queryByText(/SYSTEM CONFIG \/\/ SETTINGS/i)).not.toBeInTheDocument();
  });

  it('allows creating a new bookmark group interactively', () => {
    render(<App />);

    // Click "+ Add Group"
    const addGroupBtn = screen.getByLabelText(/Add new bookmark group/i);
    fireEvent.click(addGroupBtn);

    expect(screen.getByText(/Create New Bookmark Group/i)).toBeInTheDocument();

    // Enter title
    const input = screen.getByPlaceholderText(/e\.g\. Cloud Infrastructure/i);
    fireEvent.change(input, { target: { value: 'Cryptocurrency' } });

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Create Group/i });
    fireEvent.click(submitBtn);

    // Group now exists on dashboard
    expect(screen.getByText('Cryptocurrency')).toBeInTheDocument();
  });
});
