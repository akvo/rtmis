import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PageTitle from '../PageTitle';
import { useNavigation } from '@react-navigation/native';

jest.mock('@react-navigation/native');

describe('PageTitle component', () => {
  it('renders page title and more options button correctly', () => {
    const title = 'Example Title';
    const { getByText, getByTestId } = render(<PageTitle text={title} />);

    const titleElement = getByText(title);
    expect(titleElement).toBeDefined();
    const moreOptionsEl = getByTestId('more-options-button');

    expect(moreOptionsEl).toBeDefined();
  });

  test('goback and more options is pressed', () => {
    const navigation = useNavigation();
    navigation.canGoBack.mockReturnValue(true);
    expect(navigation.canGoBack()).toEqual(true);
    const title = 'Example Title';
    const { getByTestId } = render(<PageTitle text={title} />);

    const backButton = getByTestId('arrow-back-button');
    expect(backButton).toBeDefined();

    fireEvent.press(backButton);
    expect(navigation.goBack).toHaveBeenCalledTimes(1);

    const kebabButton = getByTestId('more-options-button');
    expect(kebabButton).toBeDefined();

    fireEvent.press(kebabButton);
    expect(navigation.navigate).toHaveBeenCalledTimes(1);
    expect(navigation.navigate).toHaveBeenCalledWith('Settings');
  });

  it('should show subtitle when it defined', () => {
    const title = 'Example Title';
    const subTitle = 'Jhon Doe';
    const { getByText, getByTestId } = render(<PageTitle text={title} subTitle={subTitle} />);

    const titleElement = getByText(title);
    expect(titleElement).toBeDefined();
    const subTitleEl = getByTestId('page-subtitle');
    expect(subTitleEl).toBeDefined();
    expect(subTitleEl.props.children).toBe(subTitle);
  });
});
