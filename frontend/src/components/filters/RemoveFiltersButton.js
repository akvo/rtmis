import React from "react";
import "./style.scss";
import { Button } from "antd";
import { store } from "../../lib";
import { useLocation } from "react-router-dom";

const hideInPages = ["/control-center", "/data/submissions", "/profile"];

const RemoveFiltersButton = ({ extra = () => {} }) => {
  const { pathname } = useLocation();
  const hideButton = hideInPages.includes(pathname);
  if (hideButton) {
    return "";
  }
  return (
    <Button
      onClick={() => {
        store.update([
          (s) => {
            s.administration.length = 1;
            s.selectedAdministration = null;
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
