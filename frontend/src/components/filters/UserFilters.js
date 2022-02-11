import React from "react";
import "./style.scss";
import { Row, Col, Input, Select, Checkbox } from "antd";

import { store } from "../../lib";
import AdministrationDropdown from "./AdministrationDropdown";

const UserFilters = () => {
  const filterRole = store.useState((state) => state.filterRole);

  return (
    <Row>
      <Col span={4}>
        <Input placeholder="Search..." style={{ width: "90%" }} />
      </Col>
      <Col span={4}>
        <Select
          disabled
          placeholder="Organization"
          style={{ width: "90%" }}
          onChange={() => {}}
        >
          <Select.Option value="Organization 1">Organization 1</Select.Option>
        </Select>
      </Col>
      <Col span={4}>
        <Select
          placeholder="Role"
          style={{ width: "90%" }}
          value={filterRole}
          onChange={(e) => {
            store.update((s) => {
              s.filterRole = e;
            });
          }}
          allowClear
        >
          <Select.Option value="Super Admin">Super Admin</Select.Option>
          <Select.Option value="Admin">Admin</Select.Option>
          <Select.Option value="Approver">Approver</Select.Option>
          <Select.Option value="User">User</Select.Option>
        </Select>
      </Col>
      <Col span={4}>
        <AdministrationDropdown />
      </Col>
      <Col span={4}>&nbsp;</Col>
      <Col span={4} style={{ textAlign: "right" }}>
        <Checkbox onChange={() => {}}>Show Pending Users</Checkbox>
      </Col>
    </Row>
  );
};

export default React.memo(UserFilters);
