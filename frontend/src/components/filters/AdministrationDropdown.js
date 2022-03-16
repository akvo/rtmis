import React, { useEffect } from "react";
import "./style.scss";
import { Select, Space } from "antd";
import PropTypes from "prop-types";

import { api, store } from "../../lib";
import { useNotification } from "../../util/hooks";

const AdministrationDropdown = ({
  loading = false,
  withLabel = false,
  width = 160,
  persist = false,
  ...props
}) => {
  const { user, administration, isLoggedIn, loadingAdministration } =
    store.useState((state) => state);
  const { notify } = useNotification();

  useEffect(() => {
    if (isLoggedIn && !persist) {
      store.update((s) => {
        s.loadingAdministration = true;
      });
      api
        .get(`administration/${user.administration.id}`)
        .then((adminRes) => {
          store.update((s) => {
            s.administration = [
              {
                id: adminRes.data.id,
                name: adminRes.data.name,
                levelName: adminRes.data.level_name,
                children: adminRes.data.children,
                childLevelName: adminRes.data.children_level_name,
              },
            ];
          });
          store.update((s) => {
            s.loadingAdministration = false;
          });
        })
        .catch((err) => {
          notify({
            type: "error",
            message: "Could not load filters",
          });
          store.update((s) => {
            s.loadingAdministration = false;
          });
          console.error(err);
        });
    }
  }, [user, isLoggedIn, notify, persist]);

  const handleChange = (e, index) => {
    if (!e) {
      return;
    }
    store.update((s) => {
      s.loadingAdministration = true;
    });
    api
      .get(`administration/${e}`)
      .then((res) => {
        store.update((s) => {
          s.administration.length = index + 1;
          s.administration = [
            ...s.administration,
            {
              id: res.data.id,
              name: res.data.name,
              levelName: res.data.level_name,
              children: res.data.children,
              childLevelName: res.data.children_level_name,
            },
          ];
        });
        store.update((s) => {
          s.loadingAdministration = false;
        });
      })
      .catch((err) => {
        notify({
          type: "error",
          message: "Could not load filters",
        });
        store.update((s) => {
          s.loadingAdministration = false;
        });
        console.error(err);
      });
  };

  const handleClear = (index) => {
    store.update((s) => {
      s.administration.length = index + 1;
    });
  };

  if (administration) {
    return (
      <Space {...props}>
        {administration
          .filter((x) => x.children.length)
          .map((region, regionIdx) => (
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
                dropdownMatchSelectWidth={false}
                value={administration[regionIdx + 1]?.id || null}
                disabled={loadingAdministration || loading}
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
          ))}
      </Space>
    );
  }
  return "";
};

AdministrationDropdown.propTypes = {
  loading: PropTypes.bool,
  persist: PropTypes.bool,
};

export default React.memo(AdministrationDropdown);
