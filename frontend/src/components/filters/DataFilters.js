import React, { useState } from "react";
import "./style.scss";
import { Row, Col, Space, Button } from "antd";
import { Link, useNavigate } from "react-router-dom";
import AdministrationDropdown from "./AdministrationDropdown";
import FormDropdown from "./FormDropdown.js";
import { useNotification } from "../../util/hooks";
import { api, store } from "../../lib";
import RemoveFiltersButton from "./RemoveFiltersButton";

const DataFilters = ({ loading }) => {
  const { user: authUser, selectedForm } = store.useState((s) => s);
  const navigate = useNavigate();
  const { notify } = useNotification();
  const [exporting, setExporting] = useState(false);
  const exportGenerate = () => {
    setExporting(true);
    api
      .get(`download/generate?form_id=${selectedForm}`)
      .then(() => {
        notify({
          type: "success",
          message: `Data exported successfully`,
        });
        setExporting(false);
        navigate("/data/export");
      })
      .catch(() => {
        notify({
          type: "error",
          message: "Export failed",
        });
        setExporting(false);
      });
  };
  return (
    <Row>
      <Col flex={1}>
        <Space>
          <FormDropdown loading={loading} />
          <AdministrationDropdown loading={loading} />
          <RemoveFiltersButton />
        </Space>
      </Col>
      {["Super Admin", "Admin", "User"].includes(authUser?.role?.value) && (
        <Col>
          <Space>
            <Link to={`/form/${selectedForm}`}>
              <Button type="primary">Add New</Button>
            </Link>
            <Button type="primary" onClick={exportGenerate} loading={exporting}>
              Export Data
            </Button>
            <Link to="/data/upload">
              <Button className="light">Bulk Upload</Button>
            </Link>
          </Space>
        </Col>
      )}
    </Row>
  );
};

export default React.memo(DataFilters);
