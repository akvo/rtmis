import React from "react";
import "./style.scss";
import { Button } from "antd";
import { store } from "../../lib";
import { FilterOutlined } from "@ant-design/icons";

const AdvancedFiltersButton = () => {
  const { advancedFilters, showAdvancedFilters } = store.useState((s) => s);
  return (
    <Button
      onClick={() => {
        store.update((s) => {
          s.showAdvancedFilters = !showAdvancedFilters;
        });
      }}
      icon={<FilterOutlined />}
      className={
        showAdvancedFilters || advancedFilters.length ? "light active" : "light"
      }
    >
      Advanced Filters
    </Button>
  );
};

export default React.memo(AdvancedFiltersButton);
