import React, { useEffect } from "react";
import "./style.scss";
import { Select, Space } from "antd";
import PropTypes from "prop-types";
import { store, config } from "../../lib";
import { useNotification } from "../../util/hooks";

const AdministrationDropdown = ({
  loading = false,
  withLabel = false,
  width = 160,
  persist = false,
  hidden = false,
  maxLevel = null,
  onChange,
  ...props
}) => {
  const { user, administration, isLoggedIn } = store.useState((state) => state);
  const { notify } = useNotification();

  useEffect(() => {
    if (isLoggedIn && !persist) {
      store.update((s) => {
        s.administration = [config.fn.administration(user.administration.id)];
      });
    }
  }, [user, isLoggedIn, notify, persist]);

  const handleChange = (e, index) => {
    if (!e) {
      return;
    }
    store.update((s) => {
      s.administration.length = index + 1;
      s.administration = [...s.administration, config.fn.administration(e)];
    });
    if (onChange) {
      onChange();
    }
  };

  const handleClear = (index) => {
    store.update((s) => {
      s.administration.length = index + 1;
    });
  };

  if (administration && !hidden) {
    return (
      <Space {...props}>
        {administration
          .filter((x) => x.children.length)
          .map((region, regionIdx) => {
            if (maxLevel === null || regionIdx + 1 < maxLevel) {
              return (
                <div key={regionIdx}>
                  {withLabel ? (
                    <label className="ant-form-item-label">
                      {region?.childLevelName}
                    </label>
                  ) : (
                    ""
                  )}
                  <Select
                    placeholder={`Select ${region?.childLevelName}`}
                    style={{ width: width }}
                    onChange={(e) => {
                      handleChange(e, regionIdx);
                    }}
                    onClear={() => {
                      handleClear(regionIdx);
                    }}
                    getPopupContainer={(trigger) => trigger.parentNode}
                    dropdownMatchSelectWidth={false}
                    value={administration[regionIdx + 1]?.id || null}
                    disabled={loading}
                    allowClear
                    showSearch
                    filterOption={true}
                    optionFilterProp="children"
                  >
                    {region.children.map((optionValue, optionIdx) => (
                      <Select.Option key={optionIdx} value={optionValue.id}>
                        {optionValue.name}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
              );
            }
          })}
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
  onChange: PropTypes.func,
};

export default React.memo(AdministrationDropdown);
