import React, { useState, useEffect } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, ToastAndroid } from 'react-native';
import { ListItem, Button } from '@rneui/themed';
import { BaseLayout } from '../../components';
import { UIState, UserState } from '../../store';
import { api, i18n } from '../../lib';
import Icon from 'react-native-vector-icons/Ionicons';
import { crudUsers, crudMonitoring } from '../../database/crud';

const PAGE_SIZE = 50; // Adjust as needed

const FormSelection = ({ navigation, route }) => {
  const params = route?.params || null;
  const [filteredData, setFilteredData] = useState([]);
  const [search, setSearch] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const activeLang = UIState.useState((s) => s.lang);
  const trans = i18n.text(activeLang);

  const { id: currentUserId } = UserState.useState((s) => s);

  const loadMoreData = async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    const start = data.length;
    const end = start + PAGE_SIZE;
    const newData = await crudUsers.getUserAdministrationListChunk(currentUserId, start, end);

    if (newData.length < PAGE_SIZE) {
      setHasMore(false);
    }

    const updatedData = [...data, ...newData];
    setData(updatedData);
    filterData(search, updatedData);

    setLoading(false);
  };

  const filterData = (searchText, list) => {
    const searchWords = searchText
      .toLowerCase()
      .split(' ')
      .filter((word) => word.trim() !== '');
    const filtered = list.filter((item) => {
      return searchWords.every((word) => item.name.toLowerCase().includes(word));
    });
    setFilteredData(filtered);
  };

  useEffect(() => {
    loadMoreData();
  }, []);

  useEffect(() => {
    filterData(search, data);
  }, [search, data]);

  async function fetchData(administration, form, pageNumber = 1, allData = []) {
    try {
      const response = await api.get(
        `/datapoint-list?page=${pageNumber}&administration=${administration}&form=${form}`,
      );
      const data = response.data.data;

      const updatedData = [...allData, ...data];

      if (data.hasMorePages) {
        return fetchData(administration, form, pageNumber + 1, updatedData);
      } else {
        return updatedData;
      }
    } catch (error) {
      ToastAndroid.show(`${error?.errorCode}: ${error?.message}`, ToastAndroid.LONG);
    }
  }

  const handleDataPoint = async (id) => {
    ToastAndroid.show(trans.syncingText, ToastAndroid.CENTER);
    setSyncLoading(true);
    try {
      const allData = await fetchData(id, params.id);
      const urls = allData.map((item) => item.url);
      await Promise.all(urls.map(downloadJson));
    } catch (error) {
      setSyncLoading(false);
    }
  };

  const downloadJson = async (url) => {
    try {
      const response = await api.get(url);
      if (response.status === 200) {
        const jsonData = response.data;
        await crudMonitoring.addForm({
          formId: params.id,
          formJSON: jsonData,
        });
        setSyncLoading(false);
        ToastAndroid.show(trans.syncingSuccessText, ToastAndroid.LONG);
      }
    } catch (error) {
      ToastAndroid.show(`${error?.errorCode}: ${error?.message}`, ToastAndroid.LONG);
    }
  };

  const getForms = async () => {
    await crudMonitoring.getAllForms();
  };

  const renderItem = ({ item }) => (
    <ListItem bottomDivider containerStyle={styles.listItemContainer}>
      <ListItem.Content>
        <ListItem.Title>{item.name.replaceAll(/\|/g, ', ')}</ListItem.Title>
      </ListItem.Content>
      <Button
        icon={<Icon name="sync" size={24} color="orange" />}
        buttonStyle={styles.syncButton}
        onPress={() => handleDataPoint(item.id)}
        disabled={syncLoading}
      />
    </ListItem>
  );

  return (
    <BaseLayout
      title={trans.administrationListPageTitle}
      rightComponent={false}
      search={{
        show: true,
        placeholder: trans.administrationSearch,
        value: search,
        action: setSearch,
      }}
    >
      <FlatList
        data={filteredData}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        onEndReached={loadMoreData}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loading ? <ActivityIndicator size="large" /> : null}
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

export default FormSelection;
