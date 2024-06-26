import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View, Dimensions } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { Button, ListItem } from '@rneui/themed';
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

const findFirstDifferentIndex = (arrays) => {
  // Iterate over the arrays
  for (let i = 0; i < arrays[0].length; i += 1) {
    const firstValue = arrays[0][i];
    // Compare each value in the current index position across arrays
    for (let j = 1; j < arrays.length; j += 1) {
      if (arrays[j][i] !== firstValue) {
        // If a different value is found, return the index
        return i;
      }
    }
  }
  // If no difference found, return -1
  return -1;
};

const calculateDepth = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) {
    return 1;
  }
  const childDepths = arr.map((item) => {
    if (Array.isArray(item.children) && item.children.length > 0) {
      // Recursively calculate the depth of the children array
      return 1 + calculateDepth(item.children);
    }
    return 1;
  });
  return Math.max(...childDepths);
};

const RenderDropdown = ({
  indexKey,
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
      key={indexKey}
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
    ? Dimensions.get('screen').width / admDepth
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
  const buildTree = useCallback(async (nodes, firstDiffIndex, level = 1) => {
    const uniqueIds = [...new Set(nodes.map((node) => node[level - 1]))];
    if (uniqueIds.length === 1 && level <= firstDiffIndex) {
      const nextLevel = level + 1;
      return buildTree(nodes, firstDiffIndex, nextLevel);
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
            children: children.length ? await buildTree(children, firstDiffIndex, nextLevel) : [],
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
    const totalPage = await crudCertification.getTotal(formId, search, filterByAdm);
    setTotal(totalPage);
  }, [formId, search, filterByAdm]);

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
      if (search) {
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
      const firstDiffIndex = findFirstDifferentIndex(temp);
      if (firstDiffIndex > 0) {
        buildTree(temp, firstDiffIndex).then((res) => {
          setAdmTrees(res);
          setAdmDepth(calculateDepth(res));
          fetchData();
        });
      } else {
        fetchData();
      }
    }
  }, [certificationAdms, admPaths, buildTree, fetchData]);

  useEffect(() => {
    // handle filter by administration
    if (selectedAdm.length === admDepth) {
      const selected = selectedAdm?.[selectedAdm.length - 1]?.id || null;
      if (selected) {
        setFilterByAdm(selected);
        setForms([]);
        setPage(0);
        setIsLoading(true);
      }
    }
  }, [selectedAdm, admDepth]);

  const renderItem = ({ item }) => (
    <ListItem
      bottomDivider
      containerStyle={styles.listItemContainer}
      onPress={() => goToForm(item)}
    >
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
          indexKey={`dd-child-${a}`}
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
              indexKey="dd-parent"
              options={admTrees}
              screenWidth={screenWidth}
              onChange={(value) => setSelectedAdm([admTrees.find((x) => x.id === value)])}
              value={selectedAdm?.[0]?.id || null}
              placeholder={admTrees?.[0]?.level ? dropdownLevels[admTrees[0].level - 1] : ''}
            />
            {admDepth > 1 && renderDropdownFields(admDepth)}
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
  indexKey: PropTypes.string,
  options: PropTypes.array,
  screenWidth: PropTypes.number,
  disabled: PropTypes.bool,
  value: PropTypes.number,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
};

RenderDropdown.defaultProps = {
  indexKey: null,
  options: [],
  screenWidth: null,
  disabled: false,
  value: null,
  onChange: null,
  placeholder: null,
};
