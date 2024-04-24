import React, { useState, useMemo } from "react";
import "./style.scss";
import { Row, Col, Space, Button, Dropdown } from "antd";
import { useNavigate } from "react-router-dom";
import AdministrationDropdown from "./AdministrationDropdown.js";
import FormDropdown from "./FormDropdown.js";
import { useNotification } from "../../util/hooks/index.js";
import { api, config, store, uiText } from "../../lib/index.js";
import { takeRight } from "lodash";
import { DownloadOutlined } from "@ant-design/icons";

const DataClaimFilters = ({
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

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const exportGenerate = ({ key }) => {
    setExporting(true);
    const adm_id = takeRight(administration, 1)[0]?.id;
    api
      .get(
        `download/generate?form_id=${selectedForm}&administration_id=${adm_id}&type=${key}&submission_type=${submissionType}`
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

  const downloadTypes = [
    {
      key: "all",
      label: "All Data",
      onClick: (param) => {
        exportGenerate(param);
      },
    },
    {
      key: "recent",
      label: "Latest Data",
      onClick: (param) => {
        exportGenerate(param);
      },
    },
  ];

  return (
    <Row>
      <Col flex={1}>
        <Space>
          <FormDropdown loading={loading} submissionTypes={[submissionType]} />
          <AdministrationDropdown loading={loading || loadingForm} />
        </Space>
      </Col>
      <Col>
        <Dropdown menu={{ items: downloadTypes }} placement="bottomRight">
          <Button icon={<DownloadOutlined />} shape="round" loading={exporting}>
            {text.download}
          </Button>
        </Dropdown>
      </Col>
    </Row>
  );
};

export default React.memo(DataClaimFilters);
