import React, { useState, useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { ListItem } from '@rneui/themed';
import { BaseLayout } from '../../components';
import { UIState } from '../../store';
import { i18n } from '../../lib';
import { crudForms } from '../../database/crud';

const FormSelection = ({ navigation }) => {
  const [forms, setForms] = useState([]);
  const activeLang = UIState.useState((s) => s.lang);
  const trans = i18n.text(activeLang);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const formsData = await crudForms.getMyForms();
        setForms(formsData);
      } catch (error) {
        console.error('Error fetching forms:', error);
      }
    };

    fetchForms();
  }, []);

  const goToAdministrationList = (id) => {
    navigation.navigate('AdministrationList', { id });
  };

  return (
    <BaseLayout title={trans.formSelectionPageTitle} rightComponent={false}>
      <ScrollView>
        <View>
          {forms.map((form) => (
            <ListItem key={form.id} bottomDivider onPress={() => goToAdministrationList(form.id)}>
              <ListItem.Content>
                <ListItem.Title>{form.name}</ListItem.Title>
              </ListItem.Content>
              <ListItem.Chevron />
            </ListItem>
          ))}
        </View>
      </ScrollView>
    </BaseLayout>
  );
};

export default FormSelection;
