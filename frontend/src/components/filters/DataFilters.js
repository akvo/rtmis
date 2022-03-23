import React from "react";
import "./style.scss";
import { Row, Col, Space, Button } from "antd";
import { Link } from "react-router-dom";
import AdministrationDropdown from "./AdministrationDropdown";
import FormDropdown from "./FormDropdown.js";
import { store } from "../../lib";
import RemoveFiltersButton from "./RemoveFiltersButton";

const DataFilters = ({ loading }) => {
  const { user: authUser, selectedForm } = store.useState((s) => s);
  return (
    <Row>
      <Col flex={1}>
        <Space>
          <FormDropdown loading={loading} />
          <AdministrationDropdown loading={loading} />
          <RemoveFiltersButton />
        </Space>
      </Col>
      {["Super Admin", "Admin", "User"].includes(authUser?.role?.value) && (
        <Col>
          <Space>
            <Link to={`/form/${selectedForm}`}>
              <Button type="primary">Add New</Button>
            </Link>
            <Button className="light dev">Bulk Update</Button>
            <Button className="light dev">Export Data</Button>
          </Space>
        </Col>
      )}
    </Row>
  );
};

export default React.memo(DataFilters);
