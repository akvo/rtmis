import React from "react";
import "./style.scss";
import { Row, Col, Space, Button } from "antd";
import AdministrationDropdown from "./AdministrationDropdown";

const ApproverFilters = ({ loading }) => {
  return (
    <Row>
      <Col flex={1}>
        <Space>
          <AdministrationDropdown loading={loading} />
        </Space>
      </Col>
      <Col>
        <Row justify="end">
          <Col>
            <Button className="light">Save</Button>
          </Col>
        </Row>
      </Col>
    </Row>
  );
};

export default React.memo(ApproverFilters);
