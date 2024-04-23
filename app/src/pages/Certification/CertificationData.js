import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View, Dimensions } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { Button, Icon, ListItem } from '@rneui/themed';
import PropTypes from 'prop-types';
import { BaseLayout } from '../../components';
import { FormState, UIState, UserState } from '../../store';
import { helpers, i18n, cascades } from '../../lib';
import { crudCertification } from '../../database/crud';
import { transformMonitoringData } from '../../form/lib';
import { SUBMISSION_TYPES } from '../../lib/constants';

const ADM_SQLITE_FILE = {
  file: 'administrator.sqlite',
};

const dropdownLevels = ['National', 'County', 'Sub-County', 'Ward', 'Village'];

const calculateDepth = (arr) => {
  if (!Array.isArray(arr) || !arr.every((item) => typeof item === 'object')) {
    return 1;
  }
  const childDepths = arr.map((item) => calculateDepth(Object.values(item)));
  const maxChildDepth = Math.max(...childDepths);
  return maxChildDepth + 1;
};

const RenderDropdown = ({
  key,
  options = [],
  screenWidth,
  disabled = false,
  onChange,
  value,
  placeholder,
}) => {
  const ddStyle = disabled
    ? { ...styles.dropdownField, ...styles.dropdownFieldDisabled }
    : styles.dropdownField;
  return (
    <Dropdown
      key={key}
      style={{ ...ddStyle, width: screenWidth }}
      data={options.map((x) => ({ label: x.name, value: x.id }))}
      maxHeight={300}
      labelField="label"
      valueField="value"
      value={value}
      onChange={({ value: optValue }) => {
        if (onChange) {
          onChange(optValue);
        }
      }}
      placeholder={`Select ${placeholder}`}
      disable={disabled}
    />
  );
};

const CertificationData = ({ navigation, route }) => {
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
  const subTitle = useMemo(() => {
    const submissionType = route.params?.submission_type || SUBMISSION_TYPES.registration;
    return helpers.flipObject(SUBMISSION_TYPES)[submissionType]?.toUpperCase();
  }, [route.params?.submission_type]);

  const certificationAdms = UserState.useState((s) => s.certifications);
  const [admPaths, setAdmPaths] = useState([]);
  const [admTrees, setAdmTrees] = useState([]);
  const [admDepth, setAdmDepth] = useState(0);
  const [selectedAdm, setSelectedAdm] = useState([]);
  const [filterByAdm, setFilterByAdm] = useState(null);

  const screenWidth = admDepth
    ? Dimensions.get('screen').width / (admDepth + 1)
    : Dimensions.get('screen').width;

  const fetchAdministrator = useCallback(async () => {
    certificationAdms.forEach(async (admId) => {
      const { rows } = await cascades.loadDataSource(ADM_SQLITE_FILE, admId);
      const { length: rowLength, _array: rowItems } = rows;
      const csValue = rowLength ? rowItems[0] : null;
      if (!csValue) {
        return;
      }
      setAdmPaths((prev) => [...new Set([...prev, `${csValue.path}${admId}`])]);
    });
  }, [certificationAdms]);

  useEffect(() => {
    if (certificationAdms?.length) {
      fetchAdministrator();
    }
  }, [fetchAdministrator, certificationAdms]);

  // build administrations level
  const buildTree = useCallback(async (nodes, level = 1) => {
    const uniqueIds = [...new Set(nodes.map((node) => node[level - 1]))];
    if (uniqueIds.length === 1 && level < nodes.length) {
      const nextLevel = level + 1;
      return buildTree(nodes, nextLevel);
    }
    return Promise.all(
      uniqueIds.map(async (id) => {
        const children = nodes.filter((node) => node[level - 1] === id);
        const { rows } = await cascades.loadDataSource(ADM_SQLITE_FILE, id);
        const { length: rowLength, _array: rowItems } = rows;
        const csValue = rowLength ? rowItems[0] : null;
        const name = csValue ? csValue.name : 'NA';
        const nextLevel = level + 1;
        if (nextLevel <= nodes[0].length) {
          return {
            id: Number(id),
            name,
            level,
            children: children.length ? await buildTree(children, nextLevel) : [],
          };
        }
        return {
          id: Number(id),
          name,
          level,
          children: [],
        };
      }),
    );
  }, []);
  // eol build administrations level

  const goToForm = (item) => {
    const { currentValues, prevAdmAnswer } = transformMonitoringData(
      selectedForm,
      JSON.parse(item.json.replace(/''/g, "'")),
    );
    FormState.update((s) => {
      s.currentValues = currentValues;
      s.prevAdmAnswer = prevAdmAnswer;
    });
    navigation.navigate('FormPage', {
      ...route.params,
      newSubmission: true,
      submission_type: SUBMISSION_TYPES.certification,
      uuid: item?.uuid,
    });
  };

  const goToDetails = (item) => {
    const { json: valuesJSON, name: dataPointName } = item || {};

    FormState.update((s) => {
      const valuesParsed = JSON.parse(valuesJSON);
      s.currentValues = typeof valuesParsed === 'string' ? JSON.parse(valuesParsed) : valuesParsed;
    });

    navigation.navigate('FormDataDetails', { name: dataPointName });
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
    const totalPage = await crudCertification.getTotal(formId, search);
    setTotal(totalPage);
  }, [formId, search]);

  useEffect(() => {
    fetchTotal();
  }, [fetchTotal]);

  const fetchData = useCallback(async () => {
    if (isLoading) {
      setIsLoading(false);
      const moreForms = await crudCertification.getPagination({
        formId,
        search: search.trim(),
        limit: 10,
        offset: page,
        administrationId: filterByAdm,
      });
      if (search || filterByAdm) {
        setForms(moreForms);
      } else {
        setForms(forms.concat(moreForms));
      }
    }
  }, [isLoading, forms, formId, page, search, filterByAdm]);

  useEffect(() => {
    // load administration and fetch data
    if (admPaths.length === certificationAdms.length) {
      const temp = admPaths.map((path) => {
        const splitted = path.split('.');
        return splitted.map((x) => Number(x));
      });
      buildTree(temp).then((res) => {
        setAdmTrees(res);
        setAdmDepth(calculateDepth(res));
        fetchData();
      });
    }
  }, [certificationAdms, admPaths, buildTree, fetchData]);

  useEffect(() => {
    if (selectedAdm.length - 1 === admDepth) {
      const selected = selectedAdm?.[admDepth]?.id || null;
      if (selected) {
        setFilterByAdm(selected);
        setPage(0);
        setIsLoading(true);
      }
    }
  }, [selectedAdm, admDepth]);

  const renderItem = ({ item }) => (
    <ListItem
      bottomDivider
      containerStyle={styles.listItemContainer}
      onPress={() => (item.isCertified ? goToDetails(item) : goToForm(item))}
    >
      <Icon name={item.isCertified ? 'checkmark-circle' : null} type="ionicon" color="green" />
      <ListItem.Content>
        <ListItem.Title>{item.name}</ListItem.Title>
      </ListItem.Content>
    </ListItem>
  );

  const renderDropdownFields = (max) => {
    const res = [];
    for (let a = 0; a < max; a += 1) {
      let options = [];
      if (selectedAdm.length) {
        options = selectedAdm?.[a]?.children || [];
      }
      res.push(
        <RenderDropdown
          key={`dd-child-${a}`}
          options={options}
          screenWidth={screenWidth}
          disabled={!selectedAdm?.[a]}
          onChange={(value) =>
            setSelectedAdm((prev) => {
              let pre = prev;
              if (prev.length - 1 === admDepth) {
                pre = prev.slice(0, a + 1);
              }
              return [...pre, options.find((x) => x.id === value)];
            })
          }
          value={selectedAdm?.[a + 1]?.id || null}
          placeholder={admTrees?.[0]?.level ? dropdownLevels[admTrees[0].level + a] : ''}
        />,
      );
    }
    return res;
  };

  return (
    <BaseLayout
      title={total ? `${route?.params?.name} (${total})` : route?.params?.name}
      subTitle={subTitle}
      rightComponent={false}
      search={{
        show: true,
        placeholder: trans.administrationSearch,
        value: search,
        action: handleOnSearch,
      }}
    >
      {
        // administration filter
        admTrees.length && (
          <View style={styles.dropdownContainer}>
            <RenderDropdown
              key="dd-parent"
              options={admTrees}
              screenWidth={screenWidth}
              onChange={(value) => setSelectedAdm([admTrees.find((x) => x.id === value)])}
              value={selectedAdm?.[0]?.id || null}
              placeholder={admTrees?.[0]?.level ? dropdownLevels[admTrees[0].level - 1] : ''}
            />
            {renderDropdownFields(admDepth)}
          </View>
        )
        // eol administration filter
      }
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
  dropdownContainer: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: 'grey',
    paddingVertical: 1,
  },
  dropdownField: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderColor: 'grey',
    borderWidth: 1,
    backgroundColor: '#fff',
  },
  dropdownFieldDisabled: {
    backgroundColor: '#e5e7eb',
    opacity: 0.95,
  },
});

export default CertificationData;

CertificationData.propTypes = {
  route: PropTypes.object,
};

CertificationData.defaultProps = {
  route: null,
};

RenderDropdown.propTypes = {
  key: PropTypes.string,
  options: PropTypes.array,
  screenWidth: PropTypes.number,
  disabled: PropTypes.bool,
  value: PropTypes.number,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
};

RenderDropdown.defaultProps = {
  key: null,
  options: [],
  screenWidth: null,
  disabled: false,
  value: null,
  onChange: null,
  placeholder: null,
};
