import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';
import { Button, ListItem } from '@rneui/themed';
import PropTypes from 'prop-types';
import { BaseLayout } from '../../components';
import { FormState, UIState } from '../../store';
import { i18n } from '../../lib';
import { crudMonitoring } from '../../database/crud';
import { transformMonitoringData } from '../../form/lib';

const UpdateForm = ({ navigation, route }) => {
  const params = route?.params || null;
  const [search, setSearch] = useState('');
  const [forms, setForms] = useState([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const activeLang = UIState.useState((s) => s.lang);
  const trans = i18n.text(activeLang);
  const selectedForm = FormState.useState((s) => s.form);

  const formId = params?.formId;
  const loadMore = useMemo(() => forms.length < total, [forms, total]);

  const handleUpdateForm = (item) => {
    const { currentValues, prevAdmAnswer } = transformMonitoringData(
      selectedForm,
      JSON.parse(item.json.replace(/''/g, "'")),
    );
    FormState.update((s) => {
      s.currentValues = currentValues;
      s.prevAdmAnswer = prevAdmAnswer;
    });
    navigation.navigate('FormPage', {
      formId: route?.params.formId,
      id: route?.params.id,
      name: route?.params.name,
      showSubmitted: false,
      newSubmission: true,
      isMonitoring: true,
      submission_type: 'monitoring',
    });
  };

  const handleOnSearch = (keyword) => {
    if (keyword?.trim()?.length === 0) {
      setForms([]);
    }
    setSearch(keyword);
    if (!isLoading) {
      setPage(0);
      setIsLoading(true);
    }
  };

  const fetchTotal = useCallback(async () => {
    const totalPage = await crudMonitoring.getTotal(formId, search);
    setTotal(totalPage);
  }, [formId, search]);

  useEffect(() => {
    fetchTotal();
  }, [fetchTotal]);

  const fetchData = useCallback(async () => {
    if (isLoading) {
      setIsLoading(false);
      const moreForms = await crudMonitoring.getFormsPaginated({
        formId,
        search: search.trim(),
        limit: 10,
        offset: page,
      });
      if (search) {
        setForms(moreForms);
      } else {
        setForms(forms.concat(moreForms));
      }
    }
  }, [isLoading, forms, formId, page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      title={total ? `${route?.params?.name} (${total})` : route?.params?.name}
      rightComponent={false}
      search={{
        show: true,
        placeholder: trans.administrationSearch,
        value: search,
        action: handleOnSearch,
      }}
    >
      <FlatList
        data={forms}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isLoading ? <ActivityIndicator size="large" color="#0000ff" /> : null}
      />
      {loadMore && (
        <Button
          onPress={() => {
            setIsLoading(true);
            setPage(page + 1);
          }}
        >
          {trans.loadMore}
        </Button>
      )}
    </BaseLayout>
  );
};

const styles = StyleSheet.create({
  listItemContainer: {
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  syncButton: {
    backgroundColor: 'transparent',
  },
});

export default UpdateForm;

UpdateForm.propTypes = {
  route: PropTypes.object,
};

UpdateForm.defaultProps = {
  route: null,
};
