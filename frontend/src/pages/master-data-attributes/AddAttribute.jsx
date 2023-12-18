import React, { useEffect, useState, useMemo } from "react";
import {
  Button,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Tabs,
} from "antd";
import { Breadcrumbs, DescriptionPanel } from "../../components";
import { useNavigate, useParams } from "react-router-dom";
import { useNotification } from "../../util/hooks";
import { MinusCircleOutlined, PlusCircleFilled } from "@ant-design/icons";
// import "./style.scss";
import { api, config, store, uiText } from "../../lib";

const { TabPane } = Tabs;

const AddAttribute = () => {
  const initialValues = store.useState((s) => s.masterData.attribute);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("administration");
  const [attrType, setAttrType] = useState(initialValues?.type || null);

  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { notify } = useNotification();
  const { id } = useParams();
  const TYPES = config.attribute.allTypes;
  const OPTION_TYPES = config.attribute.optionTypes;

  const pagePath = [
    {
      title: text.controlCenter,
      link: "/control-center",
    },
    {
      title: text.manageAttributes,
      link: "/control-center/master-data/attributes",
    },
    {
      title: id ? text.editAttributes : text.addAttributes,
    },
  ];

  const descriptionData = (
    <p>{id ? text.editAttributeDesc : text.addAttributeDesc}</p>
  );

  const onFinish = async (values) => {
    try {
      setSubmitting(true);
      const payload = {
        name: values.name,
        type: values.type,
        options: values?.options?.map((o) => o.name) || [],
      };
      if (id) {
        await api.put(`/administration-attributes/${id}`, payload);
      } else {
        await api.post("/administration-attributes", payload);
      }
      notify({
        type: "success",
        message: id ? text.attrSuccessUpdated : text.attrSuccessAdded,
      });
      setSubmitting(false);
      navigate("/control-center/master-data/attributes");
    } catch {
      setSubmitting(false);
    }
  };

  const deleteAttribute = async (record) => {
    try {
      await api.delete(`/administration-attributes/${record?.id}`);
      notify({
        type: "success",
        message: text.attrSuccessDeleted,
      });
      navigate("/control-center/master-data/attributes");
    } catch {
      Modal.error({
        title: text.attrErrDeleteTitle,
      });
    }
  };

  const handleOnDelete = (record) => {
    Modal.confirm({
      title: `${text.deleteText} "${record?.name}"`,
      content: text.attrConfirmDelete,
      onOk: () => {
        deleteAttribute(record);
      },
    });
  };

  useEffect(() => {
    if (!id && initialValues?.id) {
      form.setFieldsValue({
        type: null,
        name: "",
        options: [],
      });
      store.update((s) => {
        s.masterData.attribute = {};
      });
    }
  }, [initialValues, id, form]);

  return (
    <div id="add-attribute">
      <div className="description-container">
        <Row justify="space-between">
          <Col>
            <Breadcrumbs pagePath={pagePath} />
            <DescriptionPanel
              description={descriptionData}
              title={id ? text.editAttributes : text.addAttributes}
            />
          </Col>
        </Row>
      </div>
      <div className="table-section">
        <div className="table-wrapper">
          <Tabs size="large" activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="Administration" key="administration" />
            <TabPane tab="Entity" key="entity" disabled />
          </Tabs>
          <Form
            name="adm-form"
            form={form}
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 18 }}
            initialValues={initialValues}
            onFinish={onFinish}
          >
            <Row className="form-row">
              <Col span={24}>
                <Form.Item
                  name="name"
                  label={text.attrName}
                  rules={[
                    {
                      required: true,
                      message: text.attrNameRequired,
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <div className="form-row">
              <Form.Item
                name="type"
                label={text.attrType}
                rules={[{ required: true, message: text.attrTypeRequired }]}
              >
                <Select
                  getPopupContainer={(trigger) => trigger.parentNode}
                  placeholder={text.selectType}
                  onSelect={setAttrType}
                  allowClear
                  options={TYPES}
                />
              </Form.Item>
            </div>
            {OPTION_TYPES.includes(attrType) && (
              <Row className="form-row">
                <Col span={24}>
                  <Form.Item label={text.optionsField}>
                    <Form.List name="options">
                      {(fields, { add, remove }) => (
                        <Space align="baseline" wrap>
                          {fields.map(({ key, name, ...restField }) => (
                            <Space align="baseline" key={key}>
                              <Form.Item name={[name, "name"]} {...restField}>
                                <Input />
                              </Form.Item>
                              <Button
                                icon={<MinusCircleOutlined />}
                                onClick={() => remove(name)}
                              />
                            </Space>
                          ))}
                          <Button
                            onClick={() => add()}
                            shape="round"
                            icon={<PlusCircleFilled />}
                          >
                            {text.addOptionButton}
                          </Button>
                        </Space>
                      )}
                    </Form.List>
                  </Form.Item>
                </Col>
              </Row>
            )}
            <Row justify="center" align="middle">
              <Col span={18} offset={6}>
                <Space direction="horizontal">
                  <Button
                    type="primary"
                    htmlType="submit"
                    shape="round"
                    loading={submitting}
                  >
                    {text.saveButton}
                  </Button>
                  {initialValues?.id && (
                    <Button
                      shape="round"
                      type="danger"
                      onClick={() => handleOnDelete(initialValues)}
                    >
                      {text.deleteText}
                    </Button>
                  )}
                </Space>
              </Col>
            </Row>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default AddAttribute;
