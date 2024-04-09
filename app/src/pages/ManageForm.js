import React, { useMemo } from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { View } from 'react-native';
import { ListItem } from '@rneui/themed';
import PropTypes from 'prop-types';
import { BaseLayout } from '../components';
import { UIState, FormState, UserState } from '../store';
import { i18n } from '../lib';
import { getCurrentTimestamp } from '../form/lib';
import { SUBMISSION_TYPES } from '../lib/constants';

const ManageForm = ({ navigation, route }) => {
  const activeForm = FormState.useState((s) => s.form);
  const activeLang = UIState.useState((s) => s.lang);
  const userCertifications = UserState.useState((s) => s.certifications);

  const trans = i18n.text(activeLang);
  const subTypesAvailable = useMemo(() => {
    try {
      const form = JSON.parse(activeForm.json.replace(/''/g, "'"));
      return form?.submission_types;
    } catch {
      return [];
    }
  }, [activeForm]);

  const goToNewForm = () => {
    FormState.update((s) => {
      s.surveyStart = getCurrentTimestamp();
      s.prevAdmAnswer = null;
    });
    navigation.navigate('FormPage', {
      ...route?.params,
      newSubmission: true,
      submission_type: SUBMISSION_TYPES.registration,
    });
  };

  const goToUpdateForm = (submissionType) => {
    FormState.update((s) => {
      s.surveyStart = getCurrentTimestamp();
    });
    navigation.navigate('UpdateForm', {
      ...route?.params,
      newSubmission: true,
      submission_type: submissionType,
    });
  };

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
          {subTypesAvailable.includes(SUBMISSION_TYPES.registration) && (
            <ListItem key={1} onPress={goToNewForm} testID="goto-item-1">
              <Icon name="clipboard-outline" color="grey" size={18} />
              <ListItem.Content>
                <ListItem.Title>{trans.manageNewBlank}</ListItem.Title>
              </ListItem.Content>
              <ListItem.Chevron />
            </ListItem>
          )}
          {subTypesAvailable.includes(SUBMISSION_TYPES.monitoring) && (
            <ListItem
              key={2}
              onPress={() => goToUpdateForm(SUBMISSION_TYPES.monitoring)}
              testID="goto-item-2"
            >
              <Icon name="clipboard-edit-outline" color="grey" size={18} />
              <ListItem.Content>
                <ListItem.Title>{trans.manageUpdate}</ListItem.Title>
              </ListItem.Content>
              <ListItem.Chevron />
            </ListItem>
          )}
          {/* {subTypesAvailable.includes(SUBMISSION_TYPES.verification) && (
            <ListItem
              key={5}
              onPress={() => goToUpdateForm(SUBMISSION_TYPES.verification)}
              testID="goto-item-5"
            >
              <Icon name="clipboard-check" color="grey" size={18} />
              <ListItem.Content>
                <ListItem.Title>{trans.manageVerification}</ListItem.Title>
              </ListItem.Content>
              <ListItem.Chevron />
            </ListItem>
          )} */}
          {subTypesAvailable.includes(SUBMISSION_TYPES.certification) &&
          userCertifications?.length ? (
            <ListItem
              key={6}
              onPress={() =>
                navigation.navigate('CertificationData', {
                  ...route?.params,
                  submission_type: SUBMISSION_TYPES.certification,
                })
              }
              testID="goto-item-6"
            >
              <Icon name="ribbon" color="grey" size={18} />
              <ListItem.Content>
                <ListItem.Title>{trans.manageCertification}</ListItem.Title>
              </ListItem.Content>
              <ListItem.Chevron />
            </ListItem>
          ) : null}
          <ListItem
            key={3}
            onPress={() =>
              navigation.navigate('FormData', { ...route?.params, showSubmitted: false })
            }
            testID="goto-item-3"
          >
            <Icon name="folder-open" color="grey" size={18} />
            <ListItem.Content>
              <ListItem.Title>{`${trans.manageEditSavedForm} (${activeForm?.draft})`}</ListItem.Title>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>
          <ListItem
            key={4}
            onPress={() =>
              navigation.navigate('FormData', { ...route?.params, showSubmitted: true })
            }
            testID="goto-item-4"
          >
            <Icon name="eye" color="grey" size={18} />
            <ListItem.Content>
              <ListItem.Title>{`${trans.manageViewSubmitted} (${activeForm?.submitted})`}</ListItem.Title>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>
        </View>
      </BaseLayout.Content>
    </BaseLayout>
  );
};

export default ManageForm;

ManageForm.propTypes = {
  route: PropTypes.object,
};

ManageForm.defaultProps = {
  route: null,
};
