import React from "react";
import "./style.scss";
import { Row, Col, Space, Button } from "antd";
import AdministrationDropdown from "./AdministrationDropdown";

const ApproverFilters = ({ loading, isPristine, reset, save }) => {
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
            <Space size={6}>
              <Button
                className="light"
                disabled={isPristine || loading}
                onClick={reset}
              >
                Reset
              </Button>
              <Button
                type="primary"
                disabled={isPristine}
                onClick={save}
                loading={loading}
              >
                Save
              </Button>
            </Space>
          </Col>
        </Row>
      </Col>
    </Row>
  );
};

export default React.memo(ApproverFilters);
