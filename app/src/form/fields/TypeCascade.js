import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import PropTypes from 'prop-types';

import { FieldLabel } from '../support';
import styles from '../styles';
import { FormState, UserState } from '../../store';
import { i18n, cascades } from '../../lib';

const TypeCascade = ({
  onChange,
  value,
  keyform,
  id,
  label,
  tooltip,
  required,
  requiredSign,
  source,
  disabled,
}) => {
  const [dataSource, setDataSource] = useState([]);
  const [dropdownItems, setDropdownItems] = useState([]);
  const prevAdmAnswer = FormState.useState((s) => s.prevAdmAnswer);
  const activeLang = FormState.useState((s) => s.lang);
  const trans = i18n.text(activeLang);
  const requiredValue = required ? requiredSign : null;
  const {
    cascade_parent: cascadeParent,
    cascade_type: cascadeType,
    parent_id: parentId,
  } = source || {};
  const certifications = UserState.useState((s) => s?.certifications);
  const isCertification = value?.length && certifications.includes(value[0]);

  const groupBy = (array, property) => {
    const gd = array
      .sort((a, b) => a?.name?.localeCompare(b?.name))
      .reduce((groups, item) => {
        const key = item[property];
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(item);
        return groups;
      }, {});
    const groupedData = {};
    Object.entries(gd).forEach(([key, val]) => {
      groupedData[key] = val;
    });
    return groupedData;
  };

  const handleOnChange = (index, val) => {
    const nextIndex = index + 1;
    const updatedItems = dropdownItems
      .slice(0, nextIndex)
      .map((d, dx) => (dx === index ? { ...d, value: val } : d));

    const options = dataSource?.filter((d) => d?.parent === val);

    if (options.length) {
      updatedItems.push({
        options,
        value: null,
      });
    }
    const dropdownValues = updatedItems.filter((dd) => dd.value);
    const finalValues =
      updatedItems.length !== dropdownValues.length ? null : dropdownValues.map((dd) => dd.value);
    onChange(id, finalValues);
    if (finalValues) {
      const { options: selectedOptions, value: selectedValue } = dropdownValues.pop();
      const findSelected = selectedOptions?.find((o) => o.id === selectedValue);
      const cascadeName = findSelected?.name;
      FormState.update((s) => {
        s.cascades = { ...s.cascades, [id]: cascadeName };
        s.prevAdmAnswer = source?.file === 'administrator.sqlite' ? finalValues : s.prevAdmAnswer;
      });
    }
    setDropdownItems(updatedItems);
  };

  const initialDropdowns = useMemo(() => {
    if (isCertification) {
      const findAdm = dataSource.find((d) => d?.id === value[0]);
      if (findAdm) {
        const parentIDs = findAdm.path
          .split('.')
          .map((p) => parseInt(p, 10))
          .filter((p) => p);
        return parentIDs.map((p, px) => {
          if (px === 0) {
            return {
              options: dataSource?.filter((ds) => ds?.id === p),
              value: p,
            };
          }

          if (px === parentIDs.length - 1) {
            return {
              options: dataSource?.filter((ds) => ds?.parent === p),
              value: value[0],
            };
          }
          return {
            options: dataSource?.filter((ds) => ds?.parent === parentIDs[px - 1]),
            value: p,
          };
        });
      }
      return [];
    }
    const parentIDs =
      cascadeParent === 'administrator.sqlite' ? prevAdmAnswer || [] : parentId || [0];
    const filterDs = dataSource
      ?.filter((ds) => {
        if (cascadeParent) {
          return parentIDs.includes(ds?.parent);
        }
        return (
          parentIDs.includes(ds?.parent) ||
          parentIDs.includes(ds?.id) ||
          value?.includes(ds?.id) ||
          value?.includes(ds?.parent)
        );
      })
      ?.filter((ds) => {
        if (cascadeType && ds?.entity) {
          return ds.entity === cascadeType;
        }
        return ds;
      });

    const groupedDs = groupBy(filterDs, 'parent');
    if (parentIDs.length > 1 && Object.keys(groupedDs).length > 1) {
      const parentOptions = Object.keys(groupedDs).map((keyID) =>
        dataSource.find((d) => d?.id === parseInt(keyID, 10)),
      );
      return value
        ? value.map((val, vx) => {
            const options = dataSource?.filter((d) =>
              vx === 0 ? parentIDs.includes(d?.id) : d?.parent === parseInt(value?.[vx - 1], 10),
            );
            return {
              options,
              value: parseInt(val, 10),
            };
          })
        : [
            {
              options: parentOptions,
              value: value?.[0] || null,
            },
          ];
    }
    return Object.values(groupedDs).map((options, ox) => {
      const defaultValue = value?.[ox] || null;
      const answer =
        typeof defaultValue === 'string'
          ? options.find((o) => o?.name === defaultValue)?.id
          : defaultValue;
      return {
        options,
        value: answer,
      };
    });
  }, [dataSource, cascadeParent, cascadeType, parentId, value, prevAdmAnswer, isCertification]);

  const fetchCascade = useCallback(async () => {
    if (source && value?.length) {
      const cascadeID = value.slice(-1)[0];
      const { rows } = await cascades.loadDataSource(source, cascadeID);
      const { length: rowLength, _array: rowItems } = rows;
      const csValue = rowLength ? rowItems[0] : null;
      if (csValue) {
        FormState.update((s) => {
          s.cascades = {
            ...s.cascades,
            [id]: csValue.name,
          };
        });
      }
    }
  }, [source, value, id]);

  useEffect(() => {
    fetchCascade();
  }, [fetchCascade]);

  useEffect(() => {
    if (
      (dropdownItems.length === 0 && initialDropdowns.length) ||
      (source?.cascade_parent && prevAdmAnswer)
    ) {
      /**
       * Reset entity cascade options when the prevAdmAnswer changes.
       */
      setDropdownItems(initialDropdowns);
    }
  }, [dropdownItems, initialDropdowns, source, prevAdmAnswer]);

  const loadDataSource = useCallback(async () => {
    const { rows } = await cascades.loadDataSource(source);
    setDataSource(rows._array);
    if (cascadeType) {
      FormState.update((s) => {
        s.entityOptions[id] = rows._array?.filter((a) => a?.entity === cascadeType);
      });
    }
  }, [cascadeType, source, id]);

  useEffect(() => {
    loadDataSource();
  }, [loadDataSource]);

  const handleDefaultValue = useCallback(() => {
    if (typeof value?.[0] === 'string' && dropdownItems.length) {
      const lastValue = dropdownItems.slice(-1)?.[0]?.value;
      if (lastValue) {
        onChange(id, [lastValue]);
      }
    }
  }, [value, id, dropdownItems, onChange]);

  useEffect(() => {
    handleDefaultValue();
  }, [handleDefaultValue]);

  if (!dropdownItems.length) {
    return null;
  }

  return (
    <View testID="view-type-cascade">
      <FieldLabel keyform={keyform} name={label} tooltip={tooltip} requiredSign={requiredValue} />
      <Text testID="text-values" style={styles.cascadeValues}>
        {value}
      </Text>
      <View style={styles.cascadeContainer}>
        {dropdownItems.map((item, index) => {
          const hasSearch = item?.options.length > 3;
          const style = disabled
            ? { ...styles.dropdownField, ...styles.dropdownFieldDisabled }
            : styles.dropdownField;
          return (
            <Dropdown
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              labelField="name"
              valueField="id"
              testID={`dropdown-cascade-${index}`}
              data={item?.options}
              search={hasSearch}
              searchPlaceholder={trans.searchPlaceholder}
              onChange={({ id: selectedID }) => handleOnChange(index, selectedID)}
              value={item.value}
              style={style}
              placeholder={trans.selectItem}
              disable={disabled}
            />
          );
        })}
      </View>
    </View>
  );
};

export default TypeCascade;

TypeCascade.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.array,
  keyform: PropTypes.number.isRequired,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  label: PropTypes.string.isRequired,
  tooltip: PropTypes.object,
  required: PropTypes.bool.isRequired,
  requiredSign: PropTypes.string,
  source: PropTypes.object.isRequired,
  disabled: PropTypes.bool,
};

TypeCascade.defaultProps = {
  value: null,
  requiredSign: '*',
  disabled: false,
  tooltip: null,
};
