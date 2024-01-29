import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { FieldLabel } from '../support';
import { styles } from '../styles';
import { FormState } from '../../store';
import { i18n, cascades } from '../../lib';

const TypeCascade = ({
  onChange,
  value,
  keyform,
  id,
  name,
  tooltip,
  required,
  requiredSign,
  source,
  dataSource = [],
}) => {
  const [dropdownItems, setDropdownItems] = useState([]);
  const activeLang = FormState.useState((s) => s.lang);
  const trans = i18n.text(activeLang);
  const requiredValue = required ? requiredSign : null;

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
      });
    }
    setDropdownItems(updatedItems);
  };

  const initialDropdowns = useMemo(() => {
    const parentIDs = source?.parent_id?.length ? source.parent_id : [0];
    const filterDs = dataSource.filter(
      (ds) =>
        parentIDs.includes(ds?.parent) ||
        parentIDs.includes(ds?.id) ||
        value?.includes(ds?.id) ||
        value?.includes(ds?.parent),
    );
    const groupedDs = groupBy(filterDs, 'parent');
    if (parentIDs.length > 1 && Object.keys(groupedDs).length > 1) {
      const parentOptions = Object.keys(groupedDs).map((keyID) =>
        dataSource.find((d) => d?.id === parseInt(keyID, 10)),
      );
      return value
        ? value?.map((val, vx) => {
            const _options = dataSource?.filter((d) =>
              vx === 0 ? parentIDs.includes(d?.id) : d?.parent === parseInt(value?.[vx - 1], 10),
            );
            return {
              options: _options,
              value: parseInt(val, 10),
            };
          })
        : [
            {
              options: parentOptions,
              value: value ? value[ox] : null,
            },
          ];
    }
    return Object.values(groupedDs).map((options, ox) => {
      return {
        options,
        value: value?.[ox] || null,
      };
    });
  }, [dataSource, source, value, id]);

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
    if (dropdownItems.length === 0 && initialDropdowns.length) {
      setDropdownItems(initialDropdowns);
    }
  }, [dropdownItems, initialDropdowns]);

  return (
    <View testID="view-type-cascade">
      <FieldLabel keyform={keyform} name={name} tooltip={tooltip} requiredSign={requiredValue} />
      <Text testID="text-values" style={styles.cascadeValues}>
        {value}
      </Text>
      <View style={styles.cascadeContainer}>
        {dropdownItems.map((item, index) => {
          return (
            <Dropdown
              key={index}
              labelField="name"
              valueField="id"
              testID={`dropdown-cascade-${index}`}
              data={item?.options}
              search={item?.options.length > 3}
              searchPlaceholder={trans.searchPlaceholder}
              onChange={({ id: selectedID }) => handleOnChange(index, selectedID)}
              value={item.value}
              style={[styles.dropdownField]}
              placeholder={trans.selectItem}
            />
          );
        })}
      </View>
    </View>
  );
};

export default TypeCascade;
