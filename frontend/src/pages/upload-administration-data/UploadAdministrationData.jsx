import React, { useState, useEffect, useMemo, useCallback } from "react";
import "./style.scss";
import {
  Row,
  Col,
  Card,
  Divider,
  Button,
  Space,
  Select,
  Upload,
  Result,
} from "antd";
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
const { Option } = Select;
const { Dragger } = Upload;
const regExpFilename = /filename="(?<filename>.*)"/;

const UploadAdministrationData = () => {
  const { user } = store.useState((state) => state);
  const [fileName, setFileName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [attributes, setAttributes] = useState([]);
  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const { notify } = useNotification();
  const navigate = useNavigate();
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const pagePath = [
    {
      title: text.controlCenter,
      link: "/control-center",
    },
    {
      title: text.AdministrationDataUpload,
    },
  ];

  const fetchAttributes = useCallback(async () => {
    try {
      const { data: _attributes } = await api.get("/administration-attributes");
      setAttributes(_attributes);
    } catch {
      setAttributes([]);
    }
  }, []);

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

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

  //handling attribute multiple select
  const handleAttributeChange = (e) => {
    setSelectedAttributes(e);
  };

  const downloadTemplate = () => {
    setLoading(true);
    api
      .get(
        `export/administrations-template?attributes=${selectedAttributes.join(
          ","
        )}`,
        {
          responseType: "blob",
        }
      )
      .then((res) => {
        const contentDispositionHeader = res.headers["content-disposition"];
        const filename = regExpFilename.exec(contentDispositionHeader)?.groups
          ?.filename;
        if (filename) {
          const url = window.URL.createObjectURL(new Blob([res.data]));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", filename);
          document.body.appendChild(link);
          link.click();
          setLoading(false);
        } else {
          notify({
            type: "error",
            message: text.templateFetchFail,
          });
          setLoading(false);
        }
      })
      .catch((e) => {
        console.error(e);
        notify({
          type: "error",
          message: text.templateFetchFail,
        });
        setLoading(false);
      });
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
          {!loading && showSuccess && (
            <div
              style={{ padding: 0, minHeight: "40vh" }}
              bodyStyle={{ padding: 0 }}
            >
              <Result
                status="success"
                title={text?.formSuccessTitle}
                extra={[
                  <p key="phar">{text.uploadThankyouText}</p>,
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
                bodyStyle={{ padding: 0 }}
              >
                <Space align="center" size={32}>
                  <img src="/assets/data-download.svg" />
                  <p>{text.templateDownloadHint}</p>
                  <Select
                    placeholder="Select Attributes..."
                    className="multiple-select-box"
                    onChange={handleAttributeChange}
                    mode="multiple"
                    allowClear
                  >
                    {attributes.map((f, fI) => (
                      <Option key={fI} value={f.id}>
                        {f.name}
                      </Option>
                    ))}
                  </Select>
                  <Button
                    loading={loading}
                    type="primary"
                    onClick={downloadTemplate}
                    shape="round"
                  >
                    {text.download}
                  </Button>
                </Space>
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
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(UploadAdministrationData);
