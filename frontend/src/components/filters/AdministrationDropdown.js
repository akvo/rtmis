import React, { useEffect, useState } from "react";
import "./style.scss";
import { Select, Space, Checkbox, Row, Col } from "antd";
import PropTypes from "prop-types";
import { store, api } from "../../lib";
import { useCallback } from "react";

const AdministrationDropdown = ({
  loading = false,
  withLabel = false,
  width = 160,
  hidden = false,
  maxLevel = null,
  allowMultiple = false,
  persist = false,
  currentId = null,
  onChange,
  limitLevel = false,
  isSelectAllVillage = false,
  selectedAdministrations = [],
  certify = null,
  ...props
}) => {
  const { user, administration, levels } = store.useState((state) => state);
  const [checked, setChecked] = useState(false);
  /**
   * Get lowest level administrator from maxLevel.
   * otherwise, sort asc by level and get the last item from levels global state
   */
  const lowestLevel = maxLevel
    ? levels.find((l) => l?.id === maxLevel)
    : levels
        .slice()
        .sort((a, b) => a.level - b.level)
        .slice(-1)?.[0];

  const fetchUserAdmin = useCallback(async () => {
    if (user && !persist) {
      try {
        const { data: apiData } = await api.get(
          `administration/${user.administration.id}`
        );
        store.update((s) => {
          s.administration = [apiData];
        });
      } catch (error) {
        console.error(error);
      }
    }
  }, [user, persist]);

  useEffect(() => {
    fetchUserAdmin();
  }, [fetchUserAdmin, persist]);

  useEffect(() => {
    const multiadministration = administration?.find(
      (admLevel) => admLevel.level === lowestLevel.level - 1
    )?.children;
    if (multiadministration?.length === selectedAdministrations?.length) {
      setChecked(true);
    }
  }, [administration, selectedAdministrations, lowestLevel.level]);

  const handleChange = async (e, index) => {
    if (!e) {
      return;
    }
    let admItems = null;
    if (Array.isArray(e)) {
      const multiadministration = administration
        ?.find((admLevel) => admLevel.level === lowestLevel.level - 1)
        ?.children.filter((admItem) => e.includes(admItem.id));
      admItems = multiadministration;
    } else {
      const { data: selectedAdm } = await api.get(`administration/${e}`);
      admItems = [selectedAdm];
    }
    store.update((s) => {
      s.administration.length = index + 1;
      s.administration = s.administration.concat(admItems);
    });
    if (onChange) {
      const _values = allowMultiple && Array.isArray(e) ? e : [e];
      onChange(_values);
    }
  };

  const handleSelectAllVillage = (e) => {
    if (e.target.checked) {
      setChecked(true);
      let admItems = null;
      const multiadministration = administration?.find(
        (admLevel) => admLevel.level === lowestLevel.level - 1
      )?.children;
      admItems = multiadministration;
      if (selectedAdministrations.length === admItems.length) {
        return;
      }
      store.update((s) => {
        s.administration = s.administration.concat(admItems);
      });
      if (onChange) {
        const _values = admItems.map((item) => item.id);
        onChange(_values);
      }
    } else {
      setChecked(false);
      store.update((s) => {
        s.administration = s.administration.filter(
          (data) => data.level <= lowestLevel.level - 1
        );
      });
      if (onChange) {
        onChange(
          administration.filter((data) => data.level <= lowestLevel.level - 1)
        );
      }
    }
  };

  const handleClear = (index) => {
    store.update((s) => {
      s.administration.length = index + 1;
    });
  };

  if (administration && !hidden) {
    return (
      <Space {...props} style={{ width: "100%" }}>
        {administration
          .filter(
            (x) =>
              (x?.children?.length && !maxLevel) ||
              (maxLevel && x?.level < maxLevel - 1 && x?.children?.length) // show children based on maxLevel
          )
          .filter((l) => !limitLevel || l?.level !== limitLevel)
          .map((region, regionIdx) => {
            if (maxLevel === null || regionIdx + 1 < maxLevel) {
              /**
               * Find last item by checking:
               * - regionIdx + 1 = next index is equal with parent maxLevel
               * OR
               * - region.level = current level is equal with parent lowest level
               */
              const isLastItem =
                (maxLevel && maxLevel - 1 === regionIdx + 1) ||
                region.level === lowestLevel?.level - 1;
              const selectMode =
                allowMultiple && isLastItem ? "multiple" : null;
              const selectValues =
                selectMode === "multiple"
                  ? administration
                      ?.slice(regionIdx + 1, administration.length)
                      ?.map((a) => a?.id)
                  : administration[regionIdx + 1]?.id || null;
              return (
                <div key={regionIdx}>
                  {withLabel ? (
                    <label className="ant-form-item-label">
                      {region?.children_level_name || ""}
                    </label>
                  ) : (
                    ""
                  )}
                  <Select
                    placeholder={`Select ${region?.children_level_name || ""}`}
                    style={{ width: width }}
                    onChange={(e) => {
                      handleChange(e, regionIdx);
                    }}
                    onClear={() => {
                      handleClear(regionIdx);
                    }}
                    getPopupContainer={(trigger) => trigger.parentNode}
                    dropdownMatchSelectWidth={false}
                    value={selectValues}
                    disabled={loading}
                    allowClear
                    showSearch
                    filterOption={true}
                    optionFilterProp="children"
                    mode={selectMode}
                    className="custom-select"
                  >
                    {region.children
                      .filter(
                        (c) =>
                          (!certify &&
                            (!currentId ||
                              c?.id !== parseInt(currentId, 10))) ||
                          (certify && c?.id !== certify)
                      ) // prevents circular loops when primary ID has the same parent ID
                      .map((optionValue, optionIdx) => (
                        <Select.Option key={optionIdx} value={optionValue.id}>
                          {optionValue.name}
                        </Select.Option>
                      ))}
                  </Select>
                </div>
              );
            }
          })}
        {isSelectAllVillage && maxLevel === 5 && (
          <Row className="form-row">
            <Col span={24}>
              <Checkbox onChange={handleSelectAllVillage} checked={checked}>
                Select all village
              </Checkbox>
            </Col>
          </Row>
        )}
      </Space>
    );
  }
  return "";
};

AdministrationDropdown.propTypes = {
  loading: PropTypes.bool,
  persist: PropTypes.bool,
  hidden: PropTypes.bool,
  maxLevel: PropTypes.number,
  allowMultiple: PropTypes.bool,
  onChange: PropTypes.func,
  certify: PropTypes.number,
};

export default React.memo(AdministrationDropdown);
