import React from "react";
import "./style.scss";
import { Row, Col, Space, Button } from "antd";
import AdministrationDropdown from "./AdministrationDropdown";
import FormDropdown from "./FormDropdown.js";
import { store } from "../../lib";

const VisualisationFilters = () => {
  return (
    <Row>
      <Col flex={1}>
        <Space>
          <FormDropdown />
          <AdministrationDropdown />
        </Space>
      </Col>
      <Col>
        <Button
          onClick={() => {
            store.update((s) => {
              s.administration.length = 1;
            });
          }}
          className="light"
        >
          Remove Filters
        </Button>
      </Col>
    </Row>
  );
};

export default React.memo(VisualisationFilters);
