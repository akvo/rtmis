import React from "react";
import "./style.scss";
import { Space, Row, Col } from "antd";
import AdministrationDropdown from "./AdministrationDropdown";
import FormDropdown from "./FormDropdown.js";
import RemoveFiltersButton from "./RemoveFiltersButton";
import AdvancedFiltersButton from "./AdvancedFiltersButton";
import AdvancedFilters from "./AdvancedFilters";
import { store } from "../../lib";

const VisualisationFilters = () => {
  const { showAdvancedFilters } = store.useState((s) => s);
  return (
    <>
      <Row align="bottom" justify="space-between" gutter={[0, 20]} wrap={true}>
        <Col flex={1} style={{ paddingRight: 32 }}>
          <FormDropdown title={true} />
        </Col>
        <Col style={{}}>
          <Space>
            <AdministrationDropdown />
            <RemoveFiltersButton />
            <AdvancedFiltersButton />
          </Space>
        </Col>
      </Row>
      {showAdvancedFilters && <AdvancedFilters />}
    </>
  );
};

export default React.memo(VisualisationFilters);
