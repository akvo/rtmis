import React from 'react';
import { render } from '@testing-library/react-native';
import BaseLayout from '..';

describe('BaseLayout component', () => {
  it('renders page without props correctly', () => {
    const { getByTestId } = render(<BaseLayout />);
    const stackElement = getByTestId('stack-container');
    expect(stackElement).toBeDefined();
  });

  it('renders page with title correctly', () => {
    const title = 'Example Title';
    const { getByText, getByTestId } = render(<BaseLayout title={title} />);

    const titleElement = getByText(title);
    expect(titleElement).toBeDefined();
  });

  it('renders page with search bar correctly', () => {
    const search = {
      placeholder: 'Search here...',
      show: true,
    };
    const { getByPlaceholderText, getByTestId } = render(<BaseLayout search={search} />);
    const searchBarElement = getByTestId('search-bar');
    expect(searchBarElement).toBeDefined();

    const searchPlaceholderElement = getByPlaceholderText(search.placeholder);
    expect(searchPlaceholderElement).toBeDefined();
  });
});
