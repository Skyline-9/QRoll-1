import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);
import LeaderboardModal, { type LeaderboardRow } from './LeaderboardModal';

afterEach(cleanup);

const rows: LeaderboardRow[] = [
  { id: '1', name: 'Alice', present: 8, late: 1, absent: 1, total: 10, attendanceRate: 90 },
  { id: '2', name: 'Bob', present: 5, late: 0, absent: 5, total: 10, attendanceRate: 50 },
  { id: '3', name: 'Cara', present: 2, late: 3, absent: 5, total: 10, attendanceRate: 50 },
];

describe('LeaderboardModal', () => {
  it('renders a trigger and opens a modal listing every row in order', () => {
    render(
      <LeaderboardModal title="Top attendees" rows={rows} variant="top" />
    );

    expect(screen.getByRole('button', { name: /view all/i })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /view all/i }));

    const dialog = screen.getByRole('dialog', { name: 'Top attendees' });
    expect(dialog).toBeInTheDocument();
    // All three members are listed, in the given (already sorted) order
    const names = screen.getAllByText(/Alice|Bob|Cara/).map((el) => el.textContent);
    expect(names).toEqual(['Alice', 'Bob', 'Cara']);
    expect(screen.getByText('3 members total')).toBeInTheDocument();
  });

  it('closes via the close button and via Escape', async () => {
    render(
      <LeaderboardModal title="Most late arrivals" rows={rows} variant="late" />
    );

    fireEvent.click(screen.getByRole('button', { name: /view all/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /view all/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('shows an empty state when there are no rows', () => {
    render(<LeaderboardModal title="Least active" rows={[]} variant="least" />);
    fireEvent.click(screen.getByRole('button', { name: /view all/i }));
    expect(screen.getByText('No records yet.')).toBeInTheDocument();
  });
});
