import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import "./style.scss";
import { Row, Col, Card, Button, Space, Select, Form, Checkbox } from "antd";
import {
  AdministrationDropdown,
  Breadcrumbs,
  DescriptionPanel,
} from "../../components";
import { useNavigate } from "react-router-dom";
import { api, store, uiText } from "../../lib";
import { useNotification } from "../../util/hooks";

const { Option } = Select;
const regExpFilename = /filename="(?<filename>.*)"/;

const DownloadAdministrationData = () => {
  const [loading, setLoading] = useState(false);
  const [attributes, setAttributes] = useState([]);
  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const [level, setLevel] = useState(null);
  const [isPrefilled, setIsPrefilled] = useState(true);
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
      title: text.AdministrationDataDownload,
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

  const handleLevelChange = (e) => {
    setLevel(e);
    store.update((s) => {
      s.administration.length = 1;
    });
  };

  const disableDownload = useMemo(() => {
    if (level || isPrefilled) {
      return level - 1 === selectedAdm?.level ? false : true;
    }
  }, [level, selectedAdm, isPrefilled]);

  return (
    <div id="uploadMasterData">
      <div className="description-container">
        <Row justify="space-between">
          <Col>
            <Breadcrumbs pagePath={pagePath} />
            <DescriptionPanel
              description={text.dataAdministrationDownloadText}
              title={text.AdministrationDataDownload}
            />
          </Col>
        </Row>
      </div>
      <div className="table-section">
        <div className="table-wrapper">
          <Card
            style={{ padding: 0, minHeight: "40vh" }}
            bodystyle={{ padding: 0 }}
          >
            <Space align="center" size={32}>
              <img src="/assets/data-download.svg" />
              <p>{text.AdministrationDownloadPageHint}</p>
            </Space>
            <Form
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 18 }}
              onFinish={handleOnDownload}
              ref={formRef}
              initialValues={{ prefilled: true }}
            >
              {isPrefilled && (
                <Form.Item label={text.admLevel} name="level">
                  <Select
                    placeholder={text.selectLevel}
                    fieldNames={{ value: "id", label: "name" }}
                    options={levels}
                    onChange={handleLevelChange}
                    value={level}
                    allowClear
                  />
                </Form.Item>
              )}
              {isPrefilled && level && (
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
                <Checkbox onChange={(e) => setIsPrefilled(e.target.checked)}>
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
                    disabled={disableDownload}
                  >
                    {text.download}
                  </Button>
                </Col>
              </Row>
            </Form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default React.memo(DownloadAdministrationData);
