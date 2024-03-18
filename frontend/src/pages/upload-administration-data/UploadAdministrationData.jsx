import React, { useState, useEffect, useMemo } from "react";
import "./style.scss";
import { Link } from "react-router-dom";
import { Row, Col, Card, Divider, Button, Space, Upload, Result } from "antd";
import { FileTextFilled } from "@ant-design/icons";
import { Breadcrumbs, DescriptionPanel } from "../../components";
import { useNavigate } from "react-router-dom";
import { api, store, uiText } from "../../lib";
import { useNotification } from "../../util/hooks";
import { snakeCase } from "lodash";
import moment from "moment";

const allowedFiles = [
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const { Dragger } = Upload;

const UploadAdministrationData = () => {
  const { user } = store.useState((state) => state);
  const [fileName, setFileName] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { notify } = useNotification();
  const navigate = useNavigate();
  const { active: activeLang } = store.useState((s) => s.language);

  const text = useMemo(() => {
    return uiText?.[activeLang] || uiText.en;
  }, [activeLang]);

  const pagePath = [
    {
      title: text.controlCenter,
      link: "/control-center",
    },
    {
      title: text.manageAdministrativeList,
      link: "/control-center/master-data/administration",
    },
    {
      title: text.AdministrationDataUpload,
    },
  ];

  useEffect(() => {
    if (user) {
      const date = moment().format("YYYYMMDD");
      setFileName([date, snakeCase(user.name)].join("-"));
    }
  }, [user]);

  const onChange = (info) => {
    if (info.file?.status === "done") {
      notify({
        type: "success",
        message: text.fileUploadSuccess,
      });
      setUploading(false);
      setShowSuccess(true);
    } else if (info.file?.status === "error") {
      notify({
        type: "error",
        message: text.fileUploadFail,
      });
      setUploading(false);
    }
  };

  const uploadRequest = ({ file, onSuccess }) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("is_update", false);
    setUploading(true);
    api
      .post(`upload/bulk-administrations`, formData)
      .then((res) => {
        onSuccess(res.data);
      })
      .catch(() => {
        notify({
          type: "error",
          message: text.fileUploadFail,
        });
        setUploading(false);
      });
  };

  const props = {
    name: fileName,
    multiple: false,
    maxCount: 1,
    showUploadList: false,
    accept: allowedFiles.join(","),
    disabled: !fileName || uploading,
    onChange: onChange,
    customRequest: uploadRequest,
  };

  return (
    <div id="uploadMasterData">
      <div className="description-container">
        <Row justify="space-between">
          <Col>
            <Breadcrumbs pagePath={pagePath} />
            <DescriptionPanel
              description={text.dataAdministrationUploadText}
              title={text.AdministrationDataUpload}
            />
          </Col>
        </Row>
      </div>
      <div className="table-section">
        <div className="table-wrapper">
          {showSuccess && (
            <div
              style={{ padding: 0, minHeight: "40vh" }}
              bodystyle={{ padding: 0 }}
            >
              <Result
                status="success"
                title={text.administrationUploadSuccessTitle}
                extra={[
                  <Divider key="divider" />,
                  <Button
                    type="primary"
                    key="back-button"
                    onClick={() => setShowSuccess(false)}
                    shape="round"
                  >
                    {text.uploadAnotherFileLabel}
                  </Button>,
                  <Button
                    key="page"
                    onClick={() => navigate("/control-center")}
                    shape="round"
                  >
                    {text.backToCenterLabel}
                  </Button>,
                ]}
              />
            </div>
          )}
          {!showSuccess && (
            <>
              <Card
                style={{ padding: 0, minHeight: "40vh" }}
                bodystyle={{ padding: 0 }}
              >
                <Space direction="vertical">
                  <Space align="center" size={32}>
                    <img src="/assets/data-upload.svg" />
                    <p>{text.uploadMasterDataLabel}</p>
                  </Space>
                  <div className="upload-wrap">
                    <Dragger {...props}>
                      <p className="ant-upload-drag-icon">
                        <FileTextFilled style={{ color: "#707070" }} />
                      </p>
                      <p className="ant-upload-text">
                        {uploading ? text.uploading : text.dropFile}
                      </p>
                      <Button shape="round" loading={uploading}>
                        {text.browseComputer}
                      </Button>
                    </Dragger>
                  </div>
                  <Space align="center" size={32}>
                    <img src="/assets/data-download.svg" />
                    {/*TODO Translate the text */}
                    <p>
                      If you do not already have a template, please{" "}
                      <Link to="/control-center/master-data/download-administration-data">
                        download here
                      </Link>
                    </p>
                  </Space>
                </Space>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(UploadAdministrationData);
