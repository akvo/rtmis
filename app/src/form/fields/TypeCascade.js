import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { FieldLabel } from '../support';
import { styles } from '../styles';
import { FormState } from '../../store';
import { i18n, cascades } from '../../lib';

const TypeCascade = ({
  onChange,
  values,
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
    Object.entries(gd).forEach(([key, value]) => {
      groupedData[key] = value;
    });
    return groupedData;
  };

  const handleOnChange = (index, value) => {
    const nextIndex = index + 1;
    const updatedItems = dropdownItems
      .slice(0, nextIndex)
      .map((d, dx) => (dx === index ? { ...d, value } : d));

    const options = dataSource?.filter((d) => d?.parent === value);

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
    let filterDs = dataSource.filter(
      (ds) =>
        parentIDs.includes(ds?.parent) ||
        values[id]?.includes(ds?.id) ||
        values[id]?.includes(ds?.parent),
    );
    if (filterDs.length === 0) {
      filterDs = dataSource.filter((ds) => parentIDs.includes(ds?.id));
    }
    const groupedDs = groupBy(filterDs, 'parent');
    if (parentIDs.length > 1 && Object.keys(groupedDs).length > 1) {
      const parentOptions = Object.keys(groupedDs).map((keyID) =>
        dataSource.find((d) => d?.id === parseInt(keyID, 10)),
      );
      return values[id]
        ? values[id]?.map((val, vx) => {
            const _options = dataSource?.filter((d) =>
              vx === 0
                ? parentIDs.includes(d?.id)
                : d?.parent === parseInt(values[id]?.[vx - 1], 10),
            );
            return {
              options: _options,
              value: parseInt(val, 10),
            };
          })
        : [
            {
              options: parentOptions,
              value: values[id] ? values[id][ox] : null,
            },
          ];
    }
    return Object.values(groupedDs).map((options, ox) => {
      return {
        options,
        value: values[id] ? values[id][ox] : null,
      };
    });
  }, [dataSource, source, values, id]);

  const fetchCascade = useCallback(async () => {
    if (source && values?.[id]?.length) {
      const cascadeID = values[id].slice(-1)[0];
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
  }, [source, values, id]);

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
        {values[id]}
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
