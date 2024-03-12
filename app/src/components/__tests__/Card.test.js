import React from 'react';
import { render } from 'react-native-testing-library';
import Card from '../Card';

describe('Card component', () => {
  it('renders title and subTitles correctly', () => {
    const title = 'Example Title';
    const subTitles = ['Subtitle 1', 'Subtitle 2'];

    const { getByText } = render(<Card title={title} subTitles={subTitles} />);

    const titleElement = getByText(title);
    expect(titleElement).toBeDefined();

    const subTitleElement1 = getByText(subTitles[0]);
    expect(subTitleElement1).toBeDefined();

    const subTitleElement2 = getByText(subTitles[1]);
    expect(subTitleElement2).toBeDefined();
  });
});
