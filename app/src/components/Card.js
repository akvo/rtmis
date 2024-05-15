/* eslint-disable react/no-array-index-key */
import React from 'react';
import { View } from 'react-native';
import { Card as RneCard, Text } from '@rneui/themed';
import PropTypes from 'prop-types';
import { helpers } from '../lib';
import { SUBMISSION_TYPES } from '../lib/constants';

const Card = ({ title, subTitles, submissionType }) => {
  const subNames = helpers.flipObject(SUBMISSION_TYPES);
  const subTypeName = Object.values(SUBMISSION_TYPES).includes(submissionType)
    ? subNames[submissionType]
    : subNames[SUBMISSION_TYPES.registration];
  const colors = {
    [SUBMISSION_TYPES.registration]: '#2563eb',
    [SUBMISSION_TYPES.monitoring]: '#0891b2',
    [SUBMISSION_TYPES.verification]: '#ca8a04',
    [SUBMISSION_TYPES.certification]: '#ea580c',
  };
  const titleWidth = submissionType ? '70%' : '100%';
  return (
    <RneCard>
      {submissionType && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            paddingVertical: 4,
            paddingHorizontal: 12,
            backgroundColor: colors?.[submissionType] || colors[SUBMISSION_TYPES.registration],
            borderRadius: 5,
          }}
          testID="submission-type-tag"
        >
          <Text
            style={{
              fontSize: 12,
              color: '#ffffff',
              letterSpacing: 1.2,
              fontWeight: '700',
              textAlign: 'right',
            }}
          >
            {helpers.capitalizeFirstLetter(subTypeName)}
          </Text>
        </View>
      )}
      {title && (
        <RneCard.Title style={{ textAlign: 'left', width: titleWidth }}>{title}</RneCard.Title>
      )}
      {subTitles?.map((s, sx) => (
        <Text key={sx}>{s}</Text>
      ))}
    </RneCard>
  );
};

export default Card;

Card.propTypes = {
  title: PropTypes.string,
  subTitles: PropTypes.arrayOf(PropTypes.string),
  submissionType: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

Card.defaultProps = {
  title: null,
  subTitles: [],
  submissionType: null,
};
