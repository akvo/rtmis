import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import Card from '../Card';
import Stack from '../Stack';

const Content = ({ children, data, columns, action }) => {
  if (data?.length) {
    return (
      <ScrollView>
        <Stack row columns={columns}>
          {data?.map((d) =>
            action ? (
              <TouchableOpacity
                key={d?.id}
                type="clear"
                onPress={() => action(d?.id)}
                testID={`card-touchable-${d?.id}`}
              >
                <Card title={d?.name} subTitles={d?.subtitles} />
              </TouchableOpacity>
            ) : (
              <View key={d?.id} testID={`card-non-touchable-${d?.id}`}>
                <Card title={d?.name} subTitles={d?.subtitles} />
              </View>
            ),
          )}
        </Stack>
      </ScrollView>
    );
  }
  return (
    <Stack row columns={columns}>
      {children}
    </Stack>
  );
};

export default Content;

Content.propTypes = {
  children: PropTypes.node,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string,
      subTitles: PropTypes.arrayOf(PropTypes.string),
    }),
  ),
  columns: PropTypes.number,
  action: PropTypes.func,
};

Content.defaultProps = {
  children: null,
  data: [],
  columns: 1,
  action: null,
};
