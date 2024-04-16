import React from 'react';
import { render } from 'react-native-testing-library';
import Card from '../Card';
import { SUBMISSION_TYPES } from '../../lib/constants';

describe('Card component', () => {
  it('renders title and subTitles correctly', () => {
    const title = 'Example Title';
    const subTitles = ['Subtitle 1', 'Subtitle 2'];

    const { getByText, queryByTestId } = render(<Card title={title} subTitles={subTitles} />);

    const titleElement = getByText(title);
    expect(titleElement).toBeDefined();

    const subTitleElement1 = getByText(subTitles[0]);
    expect(subTitleElement1).toBeDefined();

    const subTitleElement2 = getByText(subTitles[1]);
    expect(subTitleElement2).toBeDefined();

    const submissionTypeTag = queryByTestId('submission-type-tag');
    expect(submissionTypeTag).toBeNull();
  });

  it('renders title, subTitles and submission_type correctly', () => {
    const title = 'Example Title';
    const subTitles = ['Subtitle 1', 'Subtitle 2'];
    const submissionType = SUBMISSION_TYPES.monitoring;

    const { getByText, getByTestId } = render(
      <Card title={title} subTitles={subTitles} submissionType={submissionType} />,
    );

    const titleElement = getByText(title);
    expect(titleElement).toBeDefined();

    const subTitleElement1 = getByText(subTitles[0]);
    expect(subTitleElement1).toBeDefined();

    const subTitleElement2 = getByText(subTitles[1]);
    expect(subTitleElement2).toBeDefined();

    const submissionTypeTag = getByTestId('submission-type-tag');
    expect(submissionTypeTag).toBeDefined();

    expect(getByText('Monitoring')).toBeDefined();
  });
});
