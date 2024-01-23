import React from "react";
import "./style.scss";
import { Row, Col, Space, Button } from "antd";
import AdministrationDropdown from "./AdministrationDropdown";
import RemoveFiltersButton from "./RemoveFiltersButton";

const ApproverFilters = ({ loading, disabled, visible, reset, save }) => {
  return (
    <Row>
      <Col flex={1}>
        <Space>
          <AdministrationDropdown loading={loading} limitLevel={3} />
          <RemoveFiltersButton />
        </Space>
      </Col>
      <Col>
        {visible ? (
          <Row justify="end">
            <Col>
              <Space size={6}>
                <Button className="light" disabled={disabled} onClick={reset}>
                  Reset
                </Button>
                <Button
                  type="primary"
                  disabled={disabled}
                  onClick={save}
                  loading={loading}
                >
                  Save
                </Button>
              </Space>
            </Col>
          </Row>
        ) : (
          ""
        )}
      </Col>
    </Row>
  );
};

export default React.memo(ApproverFilters);
