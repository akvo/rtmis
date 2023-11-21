import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import { View } from 'react-native';
import { ListItem } from '@rneui/themed';
import { BaseLayout } from '../components';
import { UIState, FormState } from '../store';
import { i18n } from '../lib';
import { getCurrentTimestamp } from '../form/lib';

const ManageForm = ({ navigation, route }) => {
  const draftCount = FormState.useState((s) => s.form?.draft);
  const submittedCount = FormState.useState((s) => s.form?.submitted);
  const activeLang = UIState.useState((s) => s.lang);
  const trans = i18n.text(activeLang);

  const goToNewForm = () => {
    FormState.update((s) => {
      s.surveyStart = getCurrentTimestamp();
    });
    navigation.navigate('FormPage', { ...route?.params, newSubmission: true });
  };

  const items = [
    {
      id: 1,
      text: trans.manageNewBlank,
      icon: 'add',
      goTo: goToNewForm,
    },
    {
      id: 2,
      text: `${trans.manageEditSavedForm} (${draftCount})`,
      icon: 'folder-open',
      goTo: () => navigation.navigate('FormData', { ...route?.params, showSubmitted: false }),
    },
    {
      id: 3,
      text: `${trans.manageViewSubmitted} (${submittedCount})`,
      icon: 'eye',
      goTo: () => navigation.navigate('FormData', { ...route?.params, showSubmitted: true }),
    },
  ];
  return (
    <BaseLayout title={route?.params?.name} rightComponent={false}>
      <BaseLayout.Content>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            paddingHorizontal: 16,
          }}
        >
          {items.map((i, ix) => (
            <ListItem key={ix} onPress={() => i.goTo()} testID={`goto-item-${ix}`}>
              <Icon name={i.icon} color="grey" size={18} />
              <ListItem.Content>
                <ListItem.Title>{i.text}</ListItem.Title>
              </ListItem.Content>
              <ListItem.Chevron />
            </ListItem>
          ))}
        </View>
      </BaseLayout.Content>
    </BaseLayout>
  );
};

export default ManageForm;
