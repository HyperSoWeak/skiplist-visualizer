import React from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import SkipListVisualizer from './SkipListVisualizer';

describe('SkipListVisualizer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders mock skip list values before the backend state request resolves', () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise(() => {}));

    render(<SkipListVisualizer />);

    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getAllByText('10').length).toBeGreaterThan(0);
    expect(screen.getAllByText('25').length).toBeGreaterThan(0);
    expect(screen.getAllByText('30').length).toBeGreaterThan(0);
  });
});
