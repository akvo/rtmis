import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
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
  Form,
  Checkbox,
} from "antd";
import { FileTextFilled } from "@ant-design/icons";
import {
  AdministrationDropdown,
  Breadcrumbs,
  DescriptionPanel,
} from "../../components";
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
  const [level, setLevel] = useState(null);
  const [isPrefilled, setIsPrefilled] = useState(false);
  const formRef = useRef();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const levels = store.useState((s) =>
    s.levels?.slice(2, s.levels?.length - 1)
  );
  const [selectedAdm] = store.useState((s) => s.administration?.slice(-1));
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
      link: "/control-center/master-data",
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

  const downloadTemplate = ({ level }) => {
    setLoading(true);
    const query = {
      attributes: selectedAttributes,
      level,
    };
    const queryURL = "?" + new URLSearchParams(query).toString();
    const apiURL = `export/administrations-template${queryURL}`;
    api
      .get(apiURL, {
        responseType: "blob",
      })
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

  const handleOnDownload = ({ prefilled, ...values }) => {
    if (prefilled) {
      setLoading(true);
      const queryURL =
        "?" +
        new URLSearchParams({
          ...values,
          administration: selectedAdm?.id || null,
        }).toString();
      const apiURL = `export/prefilled-administrations-template${queryURL}`;
      api
        .get(apiURL)
        .then(() => {
          setLoading(false);
          formRef.current.resetFields();
          navigate("/administration-download");
        })
        .catch((e) => {
          console.error(e);
          notify({
            type: "error",
            message: text.templateFetchFail,
          });
          setLoading(false);
        });
    } else {
      downloadTemplate(values);
    }
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
                    <img src="/assets/data-download.svg" />
                    <p>{text.templateDownloadHint}</p>
                  </Space>
                  <Form
                    labelCol={{ span: 6 }}
                    wrapperCol={{ span: 18 }}
                    onFinish={handleOnDownload}
                    ref={formRef}
                  >
                    {isPrefilled && (
                      <Form.Item label={text.admLevel} name="level">
                        <Select
                          placeholder={text.selectLevel}
                          fieldNames={{ value: "id", label: "name" }}
                          options={levels}
                          onChange={setLevel}
                          value={level}
                          allowClear
                        />
                      </Form.Item>
                    )}
                    {isPrefilled && (
                      <Form.Item
                        label={text.administrationLabel}
                        name="administration"
                      >
                        {level && (
                          <AdministrationDropdown
                            className="administration"
                            maxLevel={level}
                          />
                        )}
                      </Form.Item>
                    )}
                    <Form.Item label={text.bulkUploadAttr} name="attributes">
                      <Select
                        placeholder={text.bulkUploadAttrPlaceholder}
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
                    </Form.Item>
                    <Form.Item
                      name="prefilled"
                      valuePropName="checked"
                      wrapperCol={{ offset: 6, span: 18 }}
                    >
                      <Checkbox
                        onChange={(e) => setIsPrefilled(e.target.checked)}
                      >
                        {text.bulkUploadCheckboxPrefilled}
                      </Checkbox>
                    </Form.Item>
                    <Row justify="center" align="middle">
                      <Col span={18} offset={6}>
                        <Button
                          loading={loading}
                          type="primary"
                          htmlType="submit"
                          shape="round"
                        >
                          {text.download}
                        </Button>
                      </Col>
                    </Row>
                  </Form>
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
