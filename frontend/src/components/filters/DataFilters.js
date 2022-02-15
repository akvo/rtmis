import React from "react";
import "./style.scss";
import { Row, Col, Space, Input, Button } from "antd";

import AdministrationDropdown from "./AdministrationDropdown";
import FormDropdown from "./FormDropdown";

const DataFilters = ({ query, setQuery, loading }) => {
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
          <FormDropdown loading={loading} />
          <AdministrationDropdown loading={loading} />
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
