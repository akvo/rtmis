import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import QuestionGroupList from '../QuestionGroupList';

jest.useFakeTimers();
jest.mock("expo-font");
jest.mock("expo-asset");

const example = {
  name: 'Testing Form',
  languages: ['en', 'id'],
  defaultLanguage: 'en',
  translations: [
    {
      name: 'Formulir untuk Testing',
      language: 'id',
    },
  ],
  question_group: [
    {
      id: 1,
      name: 'Group 1',
      order: 1,
      translations: [
        {
          name: 'Grup 1',
          language: 'id',
        },
      ],
      question: [
        {
          id: 1,
          name: 'Your Name',
          order: 1,
          type: 'input',
          required: true,
          meta: true,
          translations: [
            {
              name: 'Nama Anda',
              language: 'id',
            },
          ],
        },
      ],
    },
    {
      id: 2,
      name: 'Group 2',
      order: 2,
      translations: [
        {
          name: 'Grup 2',
          language: 'id',
        },
      ],
      question: [
        {
          id: 2,
          name: 'Birth Date',
          order: 2,
          type: 'date',
          required: true,
          translations: [
            {
              name: 'Tanggal Lahir',
              language: 'id',
            },
          ],
        },
        {
          id: 3,
          name: 'Age',
          order: 3,
          type: 'number',
          required: true,
          translations: [
            {
              name: 'Umur',
              language: 'id',
            },
          ],
        },
      ],
    },
    {
      id: 3,
      name: 'Group 3',
      order: 3,
      translations: [
        {
          name: 'Grup 3',
          language: 'id',
        },
      ],
      question: [
        {
          id: 4,
          name: 'Gender',
          order: 4,
          type: 'option',
          required: true,
          option: [
            {
              id: 1,
              name: 'Male',
              order: 1,
            },
            {
              id: 2,
              name: 'Female',
              order: 2,
            },
          ],
          meta: true,
          translations: [
            {
              name: 'Jenis Kelamin',
              language: 'id',
            },
          ],
        },
        {
          id: 5,
          name: 'Comment',
          order: 5,
          type: 'text',
          required: false,
          meta: false,
          translations: [
            {
              name: 'Komentar',
              language: 'id',
            },
          ],
        },
      ],
    },
  ],
};

const mockQuestionGroupList = jest.fn();
const mockQuestionGroupListItem = jest.fn();

jest.mock(
  '../QuestionGroupList',
  () =>
    function({ form, values = {}, activeQuestionGroup, dataPointNameText }) {
      mockQuestionGroupList(form, values, activeQuestionGroup, dataPointNameText);
      return (
        <mock-QuestionGroupList>
          <mock-Text testID="datapoint-name">{dataPointNameText}</mock-Text>
        </mock-QuestionGroupList>
      );
    },
);

jest.mock('../QuestionGroupListItem', () => function({ name, active, completedQuestionGroup = false }) {
  mockQuestionGroupListItem(name, active, completedQuestionGroup);
  return <mock-QuestionGroupListItem />;
});

describe('QuestionGroupList', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should read form json', () => {
    render(<QuestionGroupList form={example} activeQuestionGroup={1} />);
    expect(mockQuestionGroupList.mock.calls[0][0]).toEqual(example);
  });

  it('Should read datapoint name', () => {
    render(
      <QuestionGroupList
        form={example}
        activeQuestionGroup={1}
        values={{ 1: 'Galih' }}
        dataPointNameText="Galih"
      />,
    );
    expect(mockQuestionGroupList.mock.calls[0][3]).toEqual('Galih');
  });

  it('Should read formik values', () => {
    render(<QuestionGroupList form={example} values={{ 1: 'Galih' }} activeQuestionGroup={1} />);
    expect(mockQuestionGroupList.mock.calls[0][1]).toEqual({ 1: 'Galih' });
  });
});
