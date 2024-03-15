import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import Content from '../Content';

describe('Content component', () => {
  it('renders content correctly with 2 columns and has data', () => {
    const data = [
      {
        id: 1,
        name: 'HH Form 1',
        subtitles: ['Submitted: 2', 'Draft: 1'],
      },
      {
        id: 2,
        name: 'HH Form 2',
        subtitles: ['Submitted: 2', 'Draft: 0'],
      },
    ];
    const { getByText, getByTestId } = render(<Content data={data} columns={2} />);
    const dataName1 = getByText(data[0].name);
    expect(dataName1).toBeDefined();
    const dataName2 = getByText(data[1].name);
    expect(dataName2).toBeDefined();

    const container = getByTestId('card-non-touchable-1');
    expect(container.props.style).toEqual({
      width: '50%',
    });
  });

  it('renders content correctly with single column and doesnt have data', () => {
    const titleTest = 'Testing';
    const data = [];
    const { getByTestId, getByText } = render(
      <Content data={data}>
        <Text testID="text-test">{titleTest}</Text>
      </Content>,
    );
    const titleElement = getByText(titleTest);
    expect(titleElement).toBeDefined();

    const container = getByTestId('text-test');
    expect(container.props.style).toEqual({
      width: '100%',
    });
  });

  it('renders content correctly when doesnt have props', () => {
    const { getByTestId } = render(<Content />);
    const stackElement = getByTestId('stack-container');
    expect(stackElement).toBeDefined();
  });

  test('calls onPress function when card is pressed', () => {
    const data = [
      {
        id: 1,
        name: 'HH Form 1',
        subtitles: ['Submitted: 2', 'Draft: 1'],
      },
      {
        id: 2,
        name: 'HH Form 2',
        subtitles: ['Submitted: 2', 'Draft: 0'],
      },
    ];
    const onPressMock = jest.fn();
    const { getByTestId } = render(<Content data={data} columns={2} action={onPressMock} />);
    const cardItem = getByTestId('card-touchable-1');

    fireEvent.press(cardItem);
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
});
