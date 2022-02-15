import React, { useEffect, useState } from "react";
import "./style.scss";
import { Select, message, Space } from "antd";
import { useCookies } from "react-cookie";

import { api, store } from "../../lib";

const AdministrationDropdown = () => {
  const { administration } = store.useState((state) => state);
  const [cookies] = useCookies(["AUTH_TOKEN"]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cookies.AUTH_TOKEN) {
      return;
    }
    setLoading(true);
    api
      .get(`get/profile/`, {
        headers: { Authorization: `Bearer ${cookies.AUTH_TOKEN}` },
      })
      .then((res) => {
        api
          .get(`administration/${res.data.administration.id}/`, {
            headers: { Authorization: `Bearer ${cookies.AUTH_TOKEN}` },
          })
          .then((adminRes) => {
            store.update((s) => {
              s.administration = [
                {
                  id: adminRes.data.id,
                  name: adminRes.data.name,
                  levelName: adminRes.data.level_name,
                  children: adminRes.data.children,
                },
              ];
            });
            setLoading(false);
          })
          .catch((err) => {
            message.error("Could not load filters");
            setLoading(false);
            console.error(err);
          });
      })
      .catch((err) => {
        message.error("Could not load filters");
        setLoading(false);
        console.error(err);
      });
  }, [cookies.AUTH_TOKEN]);

  const handleChange = (e, index) => {
    if (!e) {
      return;
    }
    setLoading(true);
    api
      .get(`administration/${e}/`, {
        headers: { Authorization: `Bearer ${cookies.AUTH_TOKEN}` },
      })
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
            },
          ];
        });
        setLoading(false);
      })
      .catch((err) => {
        message.error("Could not load filters");
        setLoading(false);
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
      <Space>
        {administration
          .filter((x) => x.children.length)
          .map((region, regionIdx) => (
            <Select
              key={regionIdx}
              placeholder={`Select ${region.levelName}`}
              style={{ width: 160 }}
              onChange={(e) => {
                handleChange(e, regionIdx);
              }}
              onClear={() => {
                handleClear(regionIdx);
              }}
              value={administration[regionIdx + 1]?.id || null}
              disabled={loading}
              allowClear
            >
              {region.children.map((optionValue, optionIdx) => (
                <Select.Option key={optionIdx} value={optionValue.id}>
                  {optionValue.name}
                </Select.Option>
              ))}
            </Select>
          ))}
      </Space>
    );
  }

  return "";
};

export default React.memo(AdministrationDropdown);
