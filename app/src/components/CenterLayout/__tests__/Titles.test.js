import React from 'react';
import { render } from 'react-native-testing-library';
import { Titles } from '../Titles';

describe('Titles component', () => {
  it('renders titles correctly', () => {
    const items = ['Title 1', 'Title 2'];

    const { getByText } = render(<Titles items={items} />);

    const titleElement1 = getByText(items[0]);
    expect(titleElement1).toBeDefined();

    const titleElement2 = getByText(items[1]);
    expect(titleElement2).toBeDefined();
  });

  it('renders titles without params correctly', () => {
    const { getByTestId } = render(<Titles />);

    const layoutEl = getByTestId('center-layout-items');
    expect(layoutEl).toBeDefined();
  });
});
