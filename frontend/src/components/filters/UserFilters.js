import React, { useState, useEffect } from "react";
import "./style.scss";
import { Row, Col, Space, Input, Select, Checkbox } from "antd";
const { Search } = Input;

import { store, config, api } from "../../lib";
import AdministrationDropdown from "./AdministrationDropdown";
import RemoveFiltersButton from "./RemoveFiltersButton";

const { Option } = Select;

const UserFilters = ({
  query,
  setQuery,
  fetchData,
  pending,
  setPending,
  loading,
}) => {
  const { user: authUser, filters } = store.useState((state) => state);
  const { trained, role, organisation } = filters;

  const { trainedStatus } = config;
  const allowedRole = config.roles.filter((r) => r.id >= authUser.role.id);

  const [organisations, setOrganisations] = useState([]);

  useEffect(() => {
    if (!organisations.length) {
      api.get("organisations").then((res) => {
        setOrganisations(res.data);
      });
    }
  }, [organisations, setOrganisations]);

  return (
    <Row>
      <Col span={20}>
        <Space>
          <Search
            placeholder="Search..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
            onSearch={(e) => {
              fetchData(e);
            }}
            style={{ width: 160 }}
            loading={loading && !!query}
            allowClear
          />
          <Select
            placeholder="Organization"
            getPopupContainer={(trigger) => trigger.parentNode}
            style={{ width: 160 }}
            value={organisation}
            onChange={(e) => {
              store.update((s) => {
                s.filters.organisation = e;
              });
            }}
            allowClear
          >
            {organisations?.map((o, oi) => (
              <Option key={`org-${oi}`} value={o.id}>
                {o.name}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="Trained Status"
            getPopupContainer={(trigger) => trigger.parentNode}
            style={{ width: 160 }}
            value={trained}
            onChange={(e) => {
              store.update((s) => {
                s.filters.trained = e;
              });
            }}
            allowClear
          >
            {trainedStatus.map((t, ti) => (
              <Option key={ti} value={t.value}>
                {t.label}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="Role"
            getPopupContainer={(trigger) => trigger.parentNode}
            style={{ width: 160 }}
            value={role}
            onChange={(e) => {
              store.update((s) => {
                s.filters.role = e;
              });
            }}
            allowClear
          >
            {allowedRole.map((r, ri) => (
              <Option key={ri} value={r.id}>
                {r.name}
              </Option>
            ))}
          </Select>
          <AdministrationDropdown loading={loading} />
          <RemoveFiltersButton
            extra={(s) => {
              s.filters = { trained: null, role: null, organisation: null };
            }}
          />
        </Space>
      </Col>
      <Col span={4} align="right">
        <Checkbox
          onChange={() => {
            setPending(!pending);
          }}
          disabled={loading}
          checked={pending}
        >
          Show Pending Users
        </Checkbox>
      </Col>
    </Row>
  );
};

export default React.memo(UserFilters);
