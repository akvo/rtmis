import React, { useState, useMemo } from "react";
import "./style.scss";
import { Row, Col, Space, Button } from "antd";
import { useNavigate } from "react-router-dom";
import AdministrationDropdown from "./AdministrationDropdown.js";
import FormDropdown from "./FormDropdown.js";
import { useNotification } from "../../util/hooks/index.js";
import { api, config, store, uiText } from "../../lib/index.js";
import { takeRight } from "lodash";
import { DownloadOutlined } from "@ant-design/icons";

const CertificationDataFilters = ({
  loading,
  submissionType = config.submissionType.certification,
}) => {
  const { selectedForm, loadingForm, administration } = store.useState(
    (s) => s
  );
  const navigate = useNavigate();
  const { notify } = useNotification();
  const [exporting, setExporting] = useState(false);
  const language = store.useState((s) => s.language);
  const { active: activeLang } = language;
  const levels = store.useState((s) => s.levels);

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const exportGenerate = () => {
    setExporting(true);
    const adm_id = takeRight(administration, 1)[0]?.id;
    api
      .get(
        `download/generate?form_id=${selectedForm}&administration_id=${adm_id}&type=all&submission_type=${submissionType}`
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
  const maxLevel =
    submissionType === config.submissionType.certification
      ? levels.slice(-2)?.[0]
      : levels.slice(-1)?.[0];
  return (
    <Row>
      <Col flex={1}>
        <Space>
          <FormDropdown loading={loading} submissionTypes={[submissionType]} />
          <AdministrationDropdown
            loading={loading || loadingForm}
            submissionType={submissionType}
            maxLevel={maxLevel?.id}
          />
        </Space>
      </Col>
      <Col>
        <Button
          icon={<DownloadOutlined />}
          shape="round"
          loading={exporting}
          onClick={exportGenerate}
        >
          {text.download}
        </Button>
      </Col>
    </Row>
  );
};

export default React.memo(CertificationDataFilters);
