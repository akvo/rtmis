/* eslint-disable react/no-array-index-key */
import React from 'react';
import { Card as RneCard, Text } from '@rneui/themed';
import PropTypes from 'prop-types';

const Card = ({ title, subTitles }) => (
  <RneCard>
    {title && <RneCard.Title style={{ textAlign: 'left' }}>{title}</RneCard.Title>}
    {subTitles?.map((s, sx) => (
      <Text key={sx}>{s}</Text>
    ))}
  </RneCard>
);

export default Card;

Card.propTypes = {
  title: PropTypes.string,
  subTitles: PropTypes.arrayOf(PropTypes.string),
};

Card.defaultProps = {
  title: null,
  subTitles: [],
};
