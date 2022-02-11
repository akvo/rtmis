import React, { useEffect, useState } from "react";
import "./style.scss";
import { Select, message, Row, Col } from "antd";
import { useCookies } from "react-cookie";

import { api, store } from "../../lib";

const AdministrationDropdown = () => {
  const { county, subCounty, ward, community } = store.useState(
    (state) => state.filters
  );
  const [cookies] = useCookies(["AUTH_TOKEN"]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`administration/1`, {
        headers: { Authorization: `Bearer ${cookies.AUTH_TOKEN}` },
      })
      .then((res) => {
        store.update((s) => {
          s.filters.county.options = res.data.children;
        });
        setLoading(false);
      })
      .catch((err) => {
        message.error("Could not load filters");
        setLoading(false);
        console.error(err);
      });
  }, [cookies.AUTH_TOKEN]);

  const handleChange = (e) => {
    if (!e) {
      return;
    }
    setLoading(true);
    api
      .get(`administration/${e}`, {
        headers: { Authorization: `Bearer ${cookies.AUTH_TOKEN}` },
      })
      .then((res) => {
        switch (res.data.level) {
          case 1:
            store.update((s) => {
              s.filters.county.id = res.data.id;
              s.filters.subCounty = { id: null, options: res.data.children };
              s.filters.ward = { id: null, options: [] };
              s.filters.community = { id: null, options: [] };
            });
            setLoading(false);
            break;
          case 2:
            store.update((s) => {
              s.filters.subCounty.id = res.data.id;
              s.filters.ward = { id: null, options: res.data.children };
              s.filters.community = { id: null, options: [] };
            });
            setLoading(false);
            break;
          case 3:
            store.update((s) => {
              s.filters.ward.id = res.data.id;
              s.filters.community = { id: null, options: res.data.children };
            });
            setLoading(false);
            break;
          default:
            setLoading(false);
            break;
        }
      })
      .catch((err) => {
        message.error("Could not load filters");
        setLoading(false);
        console.error(err);
      });
  };

  const handleClear = (index) => {
    setLoading(true);
    switch (index) {
      case "county":
        store.update((s) => {
          s.filters.county.id = null;
          s.filters.subCounty = { id: null, options: [] };
          s.filters.ward = { id: null, options: [] };
          s.filters.community = { id: null, options: [] };
        });
        break;
      case "subCounty":
        store.update((s) => {
          s.filters.subCounty.id = null;
          s.filters.ward = { id: null, options: [] };
          s.filters.community = { id: null, options: [] };
        });
        break;
      case "ward":
        store.update((s) => {
          s.filters.ward.id = null;
          s.filters.community = { id: null, options: [] };
        });
        break;
      case "community":
        store.update((s) => {
          s.filters.community.id = null;
        });
        break;
      default:
        break;
    }
    setLoading(false);
  };

  return (
    <Row className="filter-row">
      <Col flex="auto">
        <Select
          placeholder="County"
          style={{ width: "90%" }}
          onChange={handleChange}
          onClear={() => {
            handleClear("county");
          }}
          value={county.id}
          disabled={loading}
          allowClear
        >
          {county.options.map((optionValue, optionIdx) => (
            <Select.Option key={optionIdx} value={optionValue.id}>
              {optionValue.name}
            </Select.Option>
          ))}
        </Select>
      </Col>
      {county.id && (
        <Col flex="auto">
          <Select
            placeholder="Sub-County"
            style={{ width: "90%" }}
            onChange={handleChange}
            onClear={() => {
              handleClear("subCounty");
            }}
            value={subCounty.id}
            disabled={loading}
            allowClear
          >
            {subCounty.options.map((optionValue, optionIdx) => (
              <Select.Option key={optionIdx} value={optionValue.id}>
                {optionValue.name}
              </Select.Option>
            ))}
          </Select>
        </Col>
      )}
      {subCounty.id && (
        <Col flex="auto">
          <Select
            placeholder="Ward"
            style={{ width: "90%" }}
            onChange={handleChange}
            onClear={() => {
              handleClear("ward");
            }}
            value={ward.id}
            disabled={loading}
            allowClear
          >
            {ward.options.map((optionValue, optionIdx) => (
              <Select.Option key={optionIdx} value={optionValue.id}>
                {optionValue.name}
              </Select.Option>
            ))}
          </Select>
        </Col>
      )}
      {ward.id && (
        <Col flex="auto">
          <Select
            placeholder="Community"
            style={{ width: "90%" }}
            onChange={handleChange}
            onClear={() => {
              handleClear("community");
            }}
            value={community.id}
            disabled={loading}
            allowClear
          >
            {community.options.map((optionValue, optionIdx) => (
              <Select.Option key={optionIdx} value={optionValue.id}>
                {optionValue.name}
              </Select.Option>
            ))}
          </Select>
        </Col>
      )}
    </Row>
  );
};

export default React.memo(AdministrationDropdown);
