import React, { useState } from "react";
import "./style.scss";
import { Row, Col, Space, Button } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AdministrationDropdown from "./AdministrationDropdown";
import FormDropdown from "./FormDropdown.js";
import { useNotification } from "../../util/hooks";
import { api, store } from "../../lib";
import { takeRight } from "lodash";
import RemoveFiltersButton from "./RemoveFiltersButton";
import AdvancedFiltersButton from "./AdvancedFiltersButton";
import AdvancedFilters from "./AdvancedFilters";
import {
  PlusOutlined,
  DownloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";

const DataFilters = ({ loading, showAdm = true }) => {
  const {
    user: authUser,
    selectedForm,
    loadingForm,
    administration,
    showAdvancedFilters,
  } = store.useState((s) => s);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { notify } = useNotification();
  const [exporting, setExporting] = useState(false);
  const isUserHasForms = authUser?.forms ? authUser.forms.length : false;

  const exportGenerate = () => {
    setExporting(true);
    const adm_id = takeRight(administration, 1)[0]?.id;
    api
      .get(
        `download/generate?form_id=${selectedForm}&administration_id=${adm_id}`
      )
      .then(() => {
        notify({
          type: "success",
          message: `Data exported successfully`,
        });
        setExporting(false);
        navigate("/control-center/data/export");
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
    <>
      <Row style={{ marginBottom: "16px" }}>
        <Col flex={1}>
          <Space>
            <FormDropdown loading={loading} />
            <AdvancedFiltersButton />
          </Space>
        </Col>
        <Col>
          <Space>
            {pathname === "/control-center/data/manage" && (
              <Button
                shape="round"
                onClick={exportGenerate}
                loading={exporting}
                icon={<DownloadOutlined />}
              >
                Download Data
              </Button>
            )}
            <Link to="/control-center/data/upload">
              <Button shape="round" icon={<UploadOutlined />}>
                Bulk Upload
              </Button>
            </Link>
            <Link to={`/control-center/form/${selectedForm}`}>
              <Button
                shape="round"
                icon={<PlusOutlined />}
                type="primary"
                disabled={
                  !isUserHasForms && authUser?.role?.value !== "Super Admin"
                }
              >
                Add New
              </Button>
            </Link>
          </Space>
        </Col>
      </Row>
      <Row>
        <Col>
          <Space>
            {showAdm && (
              <AdministrationDropdown loading={loading || loadingForm} />
            )}
            <RemoveFiltersButton />
          </Space>
        </Col>
      </Row>
      {showAdvancedFilters && <AdvancedFilters />}
    </>
  );
};

export default React.memo(DataFilters);
