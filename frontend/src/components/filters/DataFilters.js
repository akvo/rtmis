import React from "react";
import "./style.scss";
import { Row, Col, Space, Input, Select, Button } from "antd";

import AdministrationDropdown from "./AdministrationDropdown";

const DataFilters = ({ query, setQuery, form, setForm, forms, loading }) => {
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
            placeholder="Form"
            style={{ width: 160 }}
            value={form}
            onChange={(e) => {
              setForm(e);
            }}
            disabled={loading}
          >
            {forms.map((item, idx) => (
              <Select.Option key={idx} value={item.id}>
                {item.name}
              </Select.Option>
            ))}
          </Select>
          <AdministrationDropdown />
        </Space>
      </Col>
      <Col span={4} align="right">
        <Space>
          <Button>Bulk Update Data</Button>
          <Button>Export Filtered Data</Button>
        </Space>
      </Col>
    </Row>
  );
};

export default React.memo(DataFilters);
