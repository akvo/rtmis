import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ListItem, Image } from '@rneui/themed';
import moment from 'moment';
import PropTypes from 'prop-types';
import { FormState, UIState } from '../../store';
import { cascades, i18n } from '../../lib';
import { BaseLayout } from '../../components';
import FormDataNavigation from './FormDataNavigation';

const SubtitleContent = ({ index, answers, type, id, source, option }) => {
  const activeLang = UIState.useState((s) => s.lang);
  const trans = i18n.text(activeLang);
  const [cascadeValue, setCascadeValue] = useState(null);

  const fetchCascade = useCallback(async () => {
    if (source) {
      const cascadeID = parseInt(answers?.[id], 10);
      const { rows } = await cascades.loadDataSource(source, cascadeID);
      const { length: rowLength, _array: rowItems } = rows || {};
      const csValue = rowLength ? rowItems[0] : null;
      setCascadeValue(csValue);
    }
  }, [answers, id, source]);

  useEffect(() => {
    fetchCascade();
  }, [fetchCascade]);

  switch (type) {
    case 'geo':
      return (
        <View testID={`text-type-geo-${index}`}>
          <Text>
            {trans.latitude}: {answers?.[id]?.[0]}
          </Text>
          <Text>
            {trans.longitude}: {answers?.[id]?.[1]}
          </Text>
        </View>
      );
    case 'cascade':
      return <Text testID={`text-answer-${index}`}>{cascadeValue ? cascadeValue.name : '-'}</Text>;
    case 'date':
      return (
        <Text testID={`text-answer-${index}`}>
          {answers?.[id] ? moment(answers[id]).format('YYYY-MM-DD') : '-'}
        </Text>
      );
    case 'option':
    case 'multiple_option':
      return answers?.[id]
        ?.map((a) => {
          const findOption = option?.find((o) => o?.value === a);
          return findOption?.label;
        })
        ?.join(', ');
    default:
      return (
        <Text testID={`text-answer-${index}`}>
          {answers?.[id] || answers?.[id] === 0 ? answers[id] : '-'}
        </Text>
      );
  }
};

SubtitleContent.propTypes = {
  index: PropTypes.number.isRequired,
  answers: PropTypes.object.isRequired,
  type: PropTypes.string.isRequired,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  source: PropTypes.object,
  option: PropTypes.array,
};

SubtitleContent.defaultProps = {
  source: null,
  option: [],
};

const FormDataDetails = ({ navigation, route }) => {
  const selectedForm = FormState.useState((s) => s.form);
  const currentValues = FormState.useState((s) => s.currentValues);
  const [currentPage, setCurrentPage] = useState(0);

  const { json: formJSON } = selectedForm || {};

  const form = formJSON ? JSON.parse(formJSON) : {};
  const currentGroup = form?.question_group?.[currentPage] || [];
  const totalPage = form?.question_group?.length || 0;
  const questions = currentGroup?.question || [];

  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e) => {
        // Prevent default behavior of leaving the screen
        e.preventDefault();

        if (Object.keys(currentValues).length) {
          FormState.update((s) => {
            s.currentValues = {};
          });
          navigation.dispatch(e.data.action);
        }
      }),
    [navigation, currentValues],
  );

  return (
    <BaseLayout title={route?.params?.name} rightComponent={false}>
      <ScrollView>
        {questions?.map((q, i) =>
          q.type === 'photo' && currentValues?.[q.id] ? (
            <View key={q.id} style={styles.containerImage}>
              <Text style={styles.title} testID={`text-question-${i}`}>
                {q.label}
              </Text>
              <Image
                source={{ uri: currentValues?.[q.id] }}
                testID={`image-answer-${i}`}
                style={{ width: '100%', height: 200, aspectRatio: 1 }}
              />
            </View>
          ) : (
            <ListItem key={q.id} bottomDivider>
              <ListItem.Content>
                <ListItem.Title style={styles.title} testID={`text-question-${i}`}>
                  {q.label}
                </ListItem.Title>
                <ListItem.Subtitle>
                  <SubtitleContent
                    index={i}
                    answers={currentValues}
                    type={q.type}
                    id={q.id}
                    source={q?.source}
                    option={q?.option}
                  />
                </ListItem.Subtitle>
              </ListItem.Content>
            </ListItem>
          ),
        )}
      </ScrollView>
      <FormDataNavigation
        totalPage={totalPage}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
    </BaseLayout>
  );
};

const styles = StyleSheet.create({
  title: {
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
  },
  containerImage: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'silver',
  },
});

export default FormDataDetails;

FormDataDetails.propTypes = {
  route: PropTypes.object,
};

FormDataDetails.defaultProps = {
  route: null,
};
