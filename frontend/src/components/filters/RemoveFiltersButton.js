import React from "react";
import "./style.scss";
import { Button, Tooltip } from "antd";
import { store } from "../../lib";
import { useLocation } from "react-router-dom";
import { ResetIcon } from "../../components/Icons";

const hideInPages = ["/control-center", "/data/submissions", "/profile"];

const RemoveFiltersButton = ({ extra = () => {} }) => {
  const { pathname } = useLocation();
  const hideButton = hideInPages.includes(pathname);
  if (hideButton) {
    return "";
  }
  return (
    <Tooltip title="Remove filters">
      <Button
        icon={<ResetIcon />}
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
      />
    </Tooltip>
  );
};

export default React.memo(RemoveFiltersButton);
