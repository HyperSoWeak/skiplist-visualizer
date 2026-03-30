import React from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import SkipListVisualizer from './SkipListVisualizer';

describe('SkipListVisualizer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a loading state before the backend state request resolves', () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise(() => {}));

    render(<SkipListVisualizer />);

    expect(screen.getByText('Loading skip-list state...')).toBeInTheDocument();
    expect(screen.queryByText('Ready')).not.toBeInTheDocument();
    expect(screen.queryByText('10')).not.toBeInTheDocument();
    expect(screen.queryByText('25')).not.toBeInTheDocument();
    expect(screen.queryByText('30')).not.toBeInTheDocument();
  });
});
