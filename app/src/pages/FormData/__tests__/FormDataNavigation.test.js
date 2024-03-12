import React, { useState } from 'react';
import { render, renderHook, fireEvent } from '@testing-library/react-native';
import FormDataNavigation from '../FormDataNavigation';

describe('FormDataNavigation', () => {
  it('should render correctly', () => {
    const totalPage = 5;
    const { result } = renderHook(() => useState(0));
    const [currentPage, setCurrentPage] = result.current;

    const { getByTestId } = render(
      <FormDataNavigation
        totalPage={totalPage}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />,
    );
    const btnBack = getByTestId('button-back');
    expect(btnBack).toBeDefined();
    const txtPagination = getByTestId('text-pagination');
    expect(txtPagination).toBeDefined();
    const btnNext = getByTestId('button-next');
    expect(btnNext).toBeDefined();
  });

  it('should back button disabled when currentPage is 0', () => {
    const totalPage = 5;
    const { result } = renderHook(() => useState(0));
    const [currentPage, setCurrentPage] = result.current;

    const { getByTestId } = render(
      <FormDataNavigation
        totalPage={totalPage}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />,
    );
    const btnBack = getByTestId('button-back');
    expect(btnBack).toBeDefined();
    expect(btnBack.props.accessibilityState.disabled).toBeTruthy();
  });

  it('should next button enabled when currentPage < totalPage - 1', () => {
    const totalPage = 5;
    const { result } = renderHook(() => useState(0));
    const [currentPage, setCurrentPage] = result.current;

    const { getByTestId } = render(
      <FormDataNavigation
        totalPage={totalPage}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />,
    );
    const btnNext = getByTestId('button-next');
    expect(btnNext.props.disabled).toBeFalsy();
  });

  it('should go to the next page when next button clicked', () => {
    const totalPage = 5;
    const { result } = renderHook(() => useState(0));
    const [currentPage, setCurrentPage] = result.current;

    const { getByTestId, rerender } = render(
      <FormDataNavigation
        totalPage={totalPage}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />,
    );
    const btnNext = getByTestId('button-next');
    fireEvent.press(btnNext);

    rerender(
      <FormDataNavigation
        totalPage={totalPage}
        currentPage={result.current[0]}
        setCurrentPage={setCurrentPage}
      />,
    );

    expect(result.current[0]).toBe(1);
    const textPagination = getByTestId('text-pagination');
    expect(textPagination.props.children).toEqual([2, '/', 5]);
  });

  it('should back button enabled when currentPage > 0', () => {
    const totalPage = 5;
    const { result } = renderHook(() => useState(0));
    const [currentPage, setCurrentPage] = result.current;

    const { getByTestId, rerender } = render(
      <FormDataNavigation
        totalPage={totalPage}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />,
    );
    const btnNext = getByTestId('button-next');
    fireEvent.press(btnNext);

    rerender(
      <FormDataNavigation
        totalPage={totalPage}
        currentPage={result.current[0]}
        setCurrentPage={setCurrentPage}
      />,
    );

    const btnBack = getByTestId('button-back');
    expect(btnBack).toBeDefined();
    expect(btnBack.props.disabled).toBeFalsy();
  });
  it('should go to the previous page when back button clicked', () => {
    const totalPage = 5;
    const { result } = renderHook(() => useState(0));
    const [currentPage, setCurrentPage] = result.current;

    const { getByTestId, rerender } = render(
      <FormDataNavigation
        totalPage={totalPage}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />,
    );
    const btnNext = getByTestId('button-next');
    fireEvent.press(btnNext);

    rerender(
      <FormDataNavigation
        totalPage={totalPage}
        currentPage={result.current[0]}
        setCurrentPage={setCurrentPage}
      />,
    );

    const btnBack = getByTestId('button-back');

    fireEvent.press(btnBack);
    rerender(
      <FormDataNavigation
        totalPage={totalPage}
        currentPage={result.current[0]}
        setCurrentPage={setCurrentPage}
      />,
    );
    expect(result.current[0]).toBe(0);
    const textPagination = getByTestId('text-pagination');
    expect(textPagination.props.children).toEqual([1, '/', 5]);
  });
  it('should disabled next button when currentPage == totalPage -1', () => {
    const totalPage = 5;
    const { result } = renderHook(() => useState(0));
    const [currentPage, setCurrentPage] = result.current;

    const { getByTestId, rerender } = render(
      <FormDataNavigation
        totalPage={totalPage}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />,
    );
    const btnNext = getByTestId('button-next');
    fireEvent.press(btnNext);

    rerender(
      <FormDataNavigation
        totalPage={totalPage}
        currentPage={result.current[0]}
        setCurrentPage={setCurrentPage}
      />,
    );
    // currentPage = 2
    fireEvent.press(btnNext);

    rerender(
      <FormDataNavigation
        totalPage={totalPage}
        currentPage={result.current[0]}
        setCurrentPage={setCurrentPage}
      />,
    );
    // currentPage = 3
    fireEvent.press(btnNext);

    rerender(
      <FormDataNavigation
        totalPage={totalPage}
        currentPage={result.current[0]}
        setCurrentPage={setCurrentPage}
      />,
    );
    // currentPage = 4
    fireEvent.press(btnNext);

    rerender(
      <FormDataNavigation
        totalPage={totalPage}
        currentPage={result.current[0]}
        setCurrentPage={setCurrentPage}
      />,
    );
    // currentPage = 5
    expect(btnNext.props.accessibilityState.disabled).toBeTruthy();
    const textPagination = getByTestId('text-pagination');
    expect(textPagination.props.children).toEqual([5, '/', 5]);
  });
});
