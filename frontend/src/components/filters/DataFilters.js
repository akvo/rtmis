import React from "react";
import "./style.scss";
import { Row, Col, Space, Button } from "antd";
import { Link } from "react-router-dom";
import AdministrationDropdown from "./AdministrationDropdown";
import FormDropdown from "./FormDropdown.js";
import { store } from "../../lib";

const DataFilters = ({ loading }) => {
  const { selectedForm } = store.useState((s) => s);
  return (
    <Row>
      <Col flex={1}>
        <Space>
          <FormDropdown loading={loading} />
          <AdministrationDropdown loading={loading} />
        </Space>
      </Col>
      <Col>
        <Row justify="end">
          <Col>
            <Link to={`/form/${selectedForm}`}>
              <Button type="primary">Add New</Button>
            </Link>
          </Col>
          <Col>
            <Button className="light dev">Bulk Update</Button>
          </Col>
          <Col>
            <Button className="light dev">Export Data</Button>
          </Col>
        </Row>
      </Col>
    </Row>
  );
};

export default React.memo(DataFilters);
