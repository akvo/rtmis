import React from "react";
import "./style.scss";
import { Row, Col, Space, Input, Select, Checkbox } from "antd";

import { store } from "../../lib";
import AdministrationDropdown from "./AdministrationDropdown";

const UserFilters = ({ query, setQuery, pending, setPending, loading }) => {
  const { role } = store.useState((state) => state.filters);

  return (
    <Row>
      <Col span={20}>
        <Space>
          <Input
            placeholder="Search..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
            style={{ width: 160 }}
          />
          <Select
            disabled
            placeholder="Organization"
            style={{ width: 160 }}
            onChange={() => {}}
          >
            <Select.Option value="Organization 1">Organization 1</Select.Option>
          </Select>
          <Select
            placeholder="Role"
            style={{ width: 160 }}
            value={role}
            onChange={(e) => {
              store.update((s) => {
                s.filters.role = e;
              });
            }}
            allowClear
          >
            <Select.Option value="Super Admin">Super Admin</Select.Option>
            <Select.Option value="Admin">Admin</Select.Option>
            <Select.Option value="Approver">Approver</Select.Option>
            <Select.Option value="User">User</Select.Option>
          </Select>
          <AdministrationDropdown loading={loading} />
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
