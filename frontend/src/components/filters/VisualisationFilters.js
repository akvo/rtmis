import React from "react";
import "./style.scss";
import { Space } from "antd";
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
      <Space>
        <FormDropdown />
        <AdministrationDropdown />
        <RemoveFiltersButton />
        <AdvancedFiltersButton />
      </Space>
      {showAdvancedFilters && <AdvancedFilters />}
    </>
  );
};

export default React.memo(VisualisationFilters);
