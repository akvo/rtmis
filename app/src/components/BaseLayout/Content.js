import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import Card from '../Card';
import Stack from '../Stack';

export const Content = ({ children, data = [], columns = 1, action = null }) => {
  if (data?.length) {
    return (
      <ScrollView>
        <Stack row columns={columns}>
          {data?.map((d, dx) => {
            return action ? (
              <TouchableOpacity
                key={dx}
                type="clear"
                onPress={() => action(d?.id)}
                testID={`card-touchable-${dx}`}
              >
                <Card title={d?.name} subTitles={d?.subtitles} />
              </TouchableOpacity>
            ) : (
              <View key={dx} testID={`card-non-touchable-${dx}`}>
                <Card title={d?.name} subTitles={d?.subtitles} />
              </View>
            );
          })}
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
