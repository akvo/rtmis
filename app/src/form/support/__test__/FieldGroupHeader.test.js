import React from 'react';
import { render } from 'react-native-testing-library';
import FieldGroupHeader from '../FieldGroupHeader';

describe('FieldGroupHeader component', () => {
  it('renders name and description correctly', () => {
    const name = 'Group Title';
    const description = 'Group description';

    const { getByText } = render(<FieldGroupHeader name={name} description={description} />);

    const nameOutput = `1. ${name}`;
    const nameElement = getByText(nameOutput);
    expect(nameElement).toBeDefined();
    expect(nameElement.props.children).toBe(nameOutput);

    const descriptionElement = getByText(description);
    expect(descriptionElement).toBeDefined();
    expect(descriptionElement.props.children).toBe(description);
  });

  it('should not render name and description if not defined', () => {
    const { getByTestId, queryByTestId } = render(<FieldGroupHeader />);

    const nameEl = getByTestId('text-name');
    expect(nameEl.props.children).toBe('1. ');

    const descriptionEl = queryByTestId('text-description');
    expect(descriptionEl).toBeNull();
  });
});
