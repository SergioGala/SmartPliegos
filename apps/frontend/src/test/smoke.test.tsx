import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';

function Hello() {
  return createElement('h1', null, 'SmartPliegos');
}

describe('smoke', () => {
  it('renderiza un componente', () => {
    render(createElement(Hello));
    expect(screen.getByText('SmartPliegos')).toBeInTheDocument();
  });
});