import React from 'react';
import { Card as RneCard, Text } from '@rneui/themed';

const Card = ({ title = null, subTitles = [] }) => {
  return (
    <RneCard>
      {title && <RneCard.Title style={{ textAlign: 'left' }}>{title}</RneCard.Title>}
      {subTitles?.map((s, sx) => {
        return <Text key={sx}>{s}</Text>;
      })}
    </RneCard>
  );
};

export default Card;
