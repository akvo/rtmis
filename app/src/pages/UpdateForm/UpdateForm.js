import React, { useState, useEffect } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, ToastAndroid } from 'react-native';
import { ListItem } from '@rneui/themed';
import { BaseLayout } from '../../components';
import { FormState, UIState } from '../../store';
import { i18n } from '../../lib';
import { crudMonitoring } from '../../database/crud';
import { transformMonitoringData } from '../../form/lib';

const UpdateForm = ({ navigation, route }) => {
  const params = route?.params || null;
  const [search, setSearch] = useState('');
  const [forms, setForms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const limit = 10;
  const activeLang = UIState.useState((s) => s.lang);
  const trans = i18n.text(activeLang);
  const selectedForm = FormState.useState((s) => s.form);

  const formId = params?.formId;

  const fetchData = async (reset = false) => {
    const forms = await crudMonitoring.getAllForms();

    if (isLoading) return;
    const currentOffset = reset ? 0 : forms.length;
    setIsLoading(true);
    try {
      const moreForms = await crudMonitoring.getFormsPaginated({
        formId,
        search,
        limit,
        offset: currentOffset,
      });

      if (reset) {
        setForms(moreForms);
      } else {
        setForms((prevForms) => [...prevForms, ...moreForms]);
      }
    } catch (error) {
      ToastAndroid.show(`${error?.errorCode}: ${error?.message}`, ToastAndroid.LONG);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData(true);
  }, [search]);

  const handleUpdateForm = (item) => {
    FormState.update((s) => {
      s.currentValues = transformMonitoringData(
        selectedForm,
        JSON.parse(item.json.replace(/''/g, "'")),
      );
    });
    navigation.navigate('FormPage', {
      formId: route?.params.formId,
      id: route?.params.id,
      name: route?.params.name,
      showSubmitted: false,
      newSubmission: false,
      monitoring: {
        isMonitoring: true,
        uuid: item.uuid,
      },
    });
  };

  const renderItem = ({ item }) => (
    <ListItem
      bottomDivider
      containerStyle={styles.listItemContainer}
      onPress={() => handleUpdateForm(item)}
    >
      <ListItem.Content>
        <ListItem.Title>{item.name}</ListItem.Title>
      </ListItem.Content>
    </ListItem>
  );

  return (
    <BaseLayout
      title={route?.params?.name}
      rightComponent={false}
      search={{
        show: true,
        placeholder: trans.administrationSearch,
        value: search,
        action: setSearch,
      }}
    >
      <FlatList
        data={forms}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isLoading ? <ActivityIndicator size="large" color="#0000ff" /> : null}
      />
    </BaseLayout>
  );
};

const styles = StyleSheet.create({
  listItemContainer: {
    position: 'relative',
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  syncButton: {
    backgroundColor: 'transparent',
  },
});

export default UpdateForm;
