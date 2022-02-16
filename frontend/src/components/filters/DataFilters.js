import React from "react";
import "./style.scss";
import { Row, Col, Space, Input, Button } from "antd";
const { Search } = Input;
import AdministrationDropdown from "./AdministrationDropdown";
import FormDropdown from "./FormDropdown.js";

const DataFilters = ({ query, setQuery, loading }) => {
  return (
    <Row>
      <Col flex={1}>
        <Space>
          <Search
            placeholder="Search..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
            style={{ width: 160 }}
            allowClear
          />
          <FormDropdown loading={loading} />
          <AdministrationDropdown loading={loading} />
        </Space>
      </Col>
      <Col>
        <Row justify="end">
          <Col>
            <Button className="button">Bulk Update Data</Button>
          </Col>
          <Col>
            <Button className="button">Export Filtered Data</Button>
          </Col>
        </Row>
      </Col>
    </Row>
  );
};

export default React.memo(DataFilters);
