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
import { api, store, uiText } from "../../lib";
import { useNotification } from "../../util/hooks";

const { Option } = Select;
const regExpFilename = /filename="(?<filename>.*)"/;

const DownloadEntitiesData = () => {
  const [loading, setLoading] = useState(false);
  const [entityTypes, setEntityTypes] = useState([]);
  const [entityPage, setEntityPage] = useState(1);
  const [level, setLevel] = useState(null);
  const [isPrefilled, setIsPrefilled] = useState(true);
  const formRef = useRef();
  const { notify } = useNotification();
  const levels = store.useState((s) =>
    s.levels?.slice(1, s.levels?.length - 1)
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
      title: text.manageEntities,
      link: "/control-center/master-data/entities",
    },
    {
      title: text.EntitiesDataDownload,
    },
  ];

  const fetchEntityTypes = useCallback(async () => {
    if (entityPage === null) {
      return;
    }
    try {
      const { data: apiData } = await api.get(`/entities?page=${entityPage}`);
      const { data: _entityTypes, total_page, current: page } = apiData;
      if (page === total_page) {
        setEntityPage(null);
      } else {
        setEntityPage(page);
      }
      setEntityTypes(_entityTypes);
    } catch {
      setEntityTypes([]);
    }
  }, [entityPage]);

  useEffect(() => {
    fetchEntityTypes();
  }, [fetchEntityTypes]);

  const handleOnDownload = ({ prefilled, ...values }) => {
    const params =
      "?" +
      new URLSearchParams({
        ...values,
        adm_id: selectedAdm?.id || null,
      }).toString();
    setLoading(true);
    const apiURL = prefilled
      ? `export/prefilled-entity-data-template${params}`
      : `export/entity-data-template${params}`;
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
              description={text.dataEntitiesDownloadText}
              title={text.EntitiesDataDownload}
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
              <p>{text.EntitiesDownloadPageHint}</p>
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
              <Form.Item
                label={text.entityTypes}
                name="entity_types"
                rules={[
                  {
                    required: true,
                    message: text.entityIsRequired,
                  },
                ]}
              >
                <Select
                  placeholder={text.selectEntity}
                  className="multiple-select-box"
                  mode="multiple"
                  allowClear
                >
                  {entityTypes.map((f, fI) => (
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

export default React.memo(DownloadEntitiesData);
