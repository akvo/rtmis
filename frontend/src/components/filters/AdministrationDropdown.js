import React from "react";
import "./style.scss";
import { Select } from "antd";

// import { store } from "../../lib";

const AdministrationDropdown = () => {
  // const filterRegion = store.useState((state) => state.filterRegion);

  return (
    <Select
      placeholder="Region"
      style={{ width: "90%" }}
      onChange={() => {}}
      allowClear
    >
      <Select.Option value="Region 1">Region 1</Select.Option>
    </Select>
  );
};

export default React.memo(AdministrationDropdown);
