import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import CenterLayout from '..';

describe('CenterLayout component', () => {
  it('renders page without children correctly', () => {
    const { getByTestId } = render(<CenterLayout />);
    const layoutElement = getByTestId('center-layout');
    expect(layoutElement).toBeDefined();
  });

  it('renders page with children correctly', () => {
    const content = 'Example content';
    const { getByText } = render(
      <CenterLayout>
        <Text>{content}</Text>
      </CenterLayout>,
    );

    const contentElement = getByText(content);
    expect(contentElement).toBeDefined();
  });
});
