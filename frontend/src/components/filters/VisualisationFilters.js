import React from "react";
import "./style.scss";
import { Space, Row, Col } from "antd";
import AdministrationDropdown from "./AdministrationDropdown";
import FormDropdown from "./FormDropdown.js";
import RemoveFiltersButton from "./RemoveFiltersButton";
import AdvancedFilters from "./AdvancedFilters";
//import AdvancedFiltersButton from "./AdvancedFiltersButton";
// import { Button } from "antd";
// import { Link } from "react-router-dom";

const VisualisationFilters = ({
  persist = false,
  hidden = false,
  showFormOptions = true,
}) => {
  return hidden ? (
    <>
      {showFormOptions && <FormDropdown title={true} hidden={true} />}
      <AdministrationDropdown persist={persist} hidden={true} />
    </>
  ) : (
    <>
      <Row align="bottom" justify="space-between" gutter={[0, 20]} wrap={true}>
        {showFormOptions && (
          <Col flex={1} style={{ paddingRight: 32 }}>
            <FormDropdown title={true} />
          </Col>
        )}
        <Col style={{}}>
          <Space>
            <AdministrationDropdown persist={persist} />
            <RemoveFiltersButton />
            {/* <AdvancedFiltersButton /> */}
            {/*!location.pathname.includes("/reports") && (
              <Link to="/reports">
                <Button className="light">Print</Button>
              </Link>
            )*/}
          </Space>
        </Col>
      </Row>
      <AdvancedFilters />
    </>
  );
};

export default React.memo(VisualisationFilters);
