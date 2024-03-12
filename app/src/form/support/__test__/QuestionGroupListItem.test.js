import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import QuestionGroupList, { checkCompleteQuestionGroup } from '../QuestionGroupList';
import QuestionGroupListItem from '../QuestionGroupListItem';
import { FormState } from '../../../store';

jest.useFakeTimers();
jest.mock('expo-font');
jest.mock('expo-asset');

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
          meta: false,
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
        {
          id: 6,
          name: 'Depend to Gender Male',
          order: 6,
          type: 'text',
          required: true,
          meta: false,
          dependency: [
            {
              id: 4,
              options: ['Male'],
            },
          ],
        },
        {
          id: 7,
          name: 'Depend to Gender Female',
          order: 7,
          type: 'text',
          required: false,
          meta: false,
          dependency: [
            {
              id: 4,
              options: ['Female'],
            },
          ],
        },
      ],
    },
    {
      id: 4,
      name: 'Group 4',
      order: 4,
      translations: [
        {
          name: 'Grup 4',
          language: 'id',
        },
      ],
      question: [
        {
          id: 8,
          name: 'Hobby',
          order: 8,
          type: 'option',
          required: false,
          option: [
            {
              id: 3,
              name: 'Reading',
              order: 1,
            },
            {
              id: 4,
              name: 'Programming',
              order: 2,
            },
          ],
          meta: false,
        },
        {
          id: 9,
          name: 'What programming language?',
          order: 9,
          type: 'input',
          required: true,
          meta: false,
          dependency: [
            {
              id: 8,
              options: ['Programming'],
            },
          ],
        },
      ],
    },
  ],
};

describe('QuestionGroup & QuestionGroupListItem without mock', () => {
  describe('checkCompleteQuestionGroup function', () => {
    it('Should return boolean if completed/not', () => {
      const completed = checkCompleteQuestionGroup(example, { 1: 'Galih' });
      expect(completed).toEqual([true, false, false, true]);
    });

    it.failing(
      'Should failing when only one question answered from two required questions in a question group',
      () => {
        const values = {
          2: new Date().toISOString(),
        };
        const completed = checkCompleteQuestionGroup(example, values);
        expect(completed).toEqual([false, true, false, true]);
      },
    );

    it('Should check two required questions in a question group', () => {
      const values = {
        2: new Date().toISOString(),
        3: '20',
      };
      const completed = checkCompleteQuestionGroup(example, values);
      expect(completed).toEqual([false, true, false, true]);
    });

    it('Should ignore not required questions', () => {
      const completed = checkCompleteQuestionGroup(example, { 4: ['Female'] });
      expect(completed).toEqual([false, false, true, true]);
    });

    it('Should ignore dependency question if not answered', () => {
      const completed = checkCompleteQuestionGroup(example, {});
      expect(completed).toEqual([false, false, false, true]);
    });

    it('Should ignore dependency question if not required', () => {
      const completed = checkCompleteQuestionGroup(example, { 4: ['Female'] });
      expect(completed).toEqual([false, false, true, true]);
    });

    it('Should check dependency question if  dependent question answered and dependency question required', () => {
      const completed = checkCompleteQuestionGroup(example, { 4: ['Male'], 8: ['Programming'] });
      expect(completed).toEqual([false, false, false, false]);
    });

    it('Should complete when dependent question answered and required dependency question answered', () => {
      const completed = checkCompleteQuestionGroup(example, {
        4: ['Male'],
        6: 'Lorem ipsum',
        8: ['Programming'],
        9: 'Python Language',
      });
      expect(completed).toEqual([false, false, true, true]);
    });
  });

  it('Should read form title', () => {
    const wrapper = render(<QuestionGroupList form={example} activeQuestionGroup={1} />);
    expect(wrapper.getByTestId('form-name').children[0]).toBe(example.name);
  });

  it('Should render datapoint name if defined', () => {
    act(() => {
      FormState.update((s) => {
        s.form = {
          json: JSON.stringify(example).replace(/'/g, "''"),
        };
        s.currentValues = {
          [1]: 'John Doe',
        };
      });
    });
    const wrapper = render(
      <QuestionGroupList form={example} activeQuestionGroup={1} values={{ 1: 'John Doe' }} />,
    );
    const dataPointElement = wrapper.getByTestId('datapoint-name');
    expect(dataPointElement).toBeDefined();
    expect(dataPointElement.props.children).toEqual('John Doe');
  });

  it('Should not render datapoint name if not defined', () => {
    act(() => {
      FormState.update((s) => {
        s.form = {};
        s.currentValues = {};
      });
    });
    const wrapper = render(<QuestionGroupList form={example} />);
    const dataPointElement = wrapper.queryByTestId('datapoint-name');
    expect(dataPointElement).toBeFalsy();
  });

  it('Should render question group name', () => {
    const wrapper = render(
      <QuestionGroupListItem label="Group 1" active={true} completedQuestionGroup={false} />,
    );
    const groupName = wrapper.getByText('Group 1');
    expect(groupName).toBeDefined();
  });

  it('Should have a active mark if completed', () => {
    const active = true;
    const completed = true;
    const wrapper = render(
      <QuestionGroupListItem label="Group 1" active={active} completedQuestionGroup={completed} />,
    );
    const iconEl = wrapper.getByTestId('icon-mark');
    const iconElProps = iconEl.props.children.props.children.props;
    expect(iconEl).toBeDefined();
    expect(iconElProps.color).toBe('#2884bd');
    // Drop the check mark (this can be implemented later after discussion with the design team )
    expect(iconElProps.name).toBe('circle'); // check-circle
  });

  it('Should have disabled mark if not completed', () => {
    const active = true;
    const completed = false;
    const wrapper = render(
      <QuestionGroupListItem label="Group 1" active={active} completedQuestionGroup={completed} />,
    );
    const iconEl = wrapper.getByTestId('icon-mark');
    const iconElProps = iconEl.props.children.props.children.props;
    expect(iconEl).toBeDefined();
    expect(iconElProps.color).toBe('#d4d4d4');
    expect(iconElProps.name).toBe('circle');
  });

  it('Should disable question group if not completed', () => {
    const wrapper = render(
      <QuestionGroupListItem label="Group 2" active={false} completedQuestionGroup={false} />,
    );
    const itemEl = wrapper.getByTestId('question-group-list-item-wrapper');
    expect(itemEl.props.accessibilityState.disabled).toBe(true);
  });

  it('Should not disable question group if completed', () => {
    const wrapper = render(
      <QuestionGroupListItem label="Group 2" active={false} completedQuestionGroup={true} />,
    );
    const itemEl = wrapper.getByTestId('question-group-list-item-wrapper');
    expect(itemEl.props.accessibilityState.disabled).toBe(false);
  });

  it('Should highlight question group if active', () => {
    const wrapper = render(
      <QuestionGroupListItem label="Group 1" active={true} completedQuestionGroup={false} />,
    );
    const itemEl = wrapper.getByTestId('question-group-list-item-wrapper');
    expect(itemEl.props.style.backgroundColor).toBe('#E9E9E9');
  });

  it.failing('Should highlight question group if not active', () => {
    const wrapper = render(
      <QuestionGroupListItem label="Group 1" active={false} completedQuestionGroup={false} />,
    );
    const itemEl = wrapper.getByTestId('question-group-list-item-wrapper');
    expect(itemEl.props.style.backgroundColor).toBe('#F3F3F3');
  });
});
