import React, { useState, useMemo } from "react";
import "./style.scss";
import { Row, Col, Space, Button } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AdministrationDropdown from "./AdministrationDropdown";
import FormDropdown from "./FormDropdown.js";
import { useNotification } from "../../util/hooks";
import { api, store, uiText } from "../../lib";
import { takeRight } from "lodash";
import RemoveFiltersButton from "./RemoveFiltersButton";
import AdvancedFilters from "./AdvancedFilters";
import {
  PlusOutlined,
  DownloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";
//import AdvancedFiltersButton from "./AdvancedFiltersButton";

const DataFilters = ({ loading, showAdm = true, resetFilter = true }) => {
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
  const language = store.useState((s) => s.language);
  const { active: activeLang } = language;

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

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
        navigate("/downloads");
      })
      .catch(() => {
        notify({
          type: "error",
          message: "Export failed",
        });
        setExporting(false);
      });
  };

  const goToAddForm = () => {
    /***
     * reset initial value and monitoring
     */
    store.update((s) => {
      s.initialValue = [];
      s.monitoring = null;
    });
    navigate(`/control-center/form/${selectedForm}`);
  };

  return (
    <>
      <Row style={{ marginBottom: "16px" }}>
        <Col flex={1}>
          <Space>
            <FormDropdown loading={loading} />
            {/* <AdvancedFiltersButton /> */}
          </Space>
        </Col>
        <Col>
          <Space>
            <Link to="/control-center/data/upload">
              <Button shape="round" icon={<UploadOutlined />}>
                Bulk Upload
              </Button>
            </Link>
            {pathname === "/control-center/data" && (
              <Button
                shape="round"
                onClick={exportGenerate}
                loading={exporting}
                icon={<DownloadOutlined />}
              >
                {text.download}
              </Button>
            )}
            <Button
              shape="round"
              icon={<PlusOutlined />}
              type="primary"
              disabled={
                !isUserHasForms && authUser?.role?.value !== "Super Admin"
              }
              onClick={goToAddForm}
            >
              Add New
            </Button>
          </Space>
        </Col>
      </Row>
      <Row>
        <Col>
          <Space>
            {showAdm && (
              <AdministrationDropdown loading={loading || loadingForm} />
            )}
            {resetFilter && <RemoveFiltersButton />}
          </Space>
        </Col>
      </Row>
      {showAdvancedFilters && <AdvancedFilters />}
    </>
  );
};

export default React.memo(DataFilters);
