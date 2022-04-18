import React from "react";
import "./style.scss";
import { Button } from "antd";
import { store } from "../../lib";

const RemoveFiltersButton = ({ extra = () => {} }) => {
  return (
    <Button
      onClick={() => {
        store.update([
          (s) => {
            s.administration.length = 1;
            s.advancedFilters = [];
          },
          extra,
        ]);
      }}
      className="light"
    >
      Remove Filters
    </Button>
  );
};

export default React.memo(RemoveFiltersButton);
