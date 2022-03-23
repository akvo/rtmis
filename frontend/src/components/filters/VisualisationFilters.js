import React from "react";
import "./style.scss";
import { Space } from "antd";
import AdministrationDropdown from "./AdministrationDropdown";
import FormDropdown from "./FormDropdown.js";
import RemoveFiltersButton from "./RemoveFiltersButton";

const VisualisationFilters = () => {
  return (
    <Space>
      <FormDropdown />
      <AdministrationDropdown />
      <RemoveFiltersButton />
    </Space>
  );
};

export default React.memo(VisualisationFilters);
