import React, { useEffect, useState, useMemo } from "react";
import {
  Button,
  Col,
  Divider,
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
import { api, store, uiText } from "../../lib";

const TYPES = [
  {
    value: "value",
    label: "Value",
  },
  {
    value: "option",
    label: "Option",
  },
  {
    value: "multiple_option",
    label: "Multiple Option",
  },
  {
    value: "aggregate",
    label: "Aggregate",
  },
];
const OPTION_TYPES = ["option", "multiple_option", "aggregate"];

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

  const pagePath = [
    {
      title: text.controlCenter,
      link: "/control-center",
    },
    {
      title: text.manageAttributes,
      link: "/master-data/attributes",
    },
    {
      title: id ? text.editAttributes : text.addAttributes,
    },
  ];

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
        message: `Attribute ${id ? "updated" : "added"}`,
      });
      setSubmitting(false);
      navigate("/master-data/attributes");
    } catch {
      setSubmitting(false);
    }
  };

  const deleteAttribute = async (record) => {
    try {
      await api.delete(`/administration-attributes/${record?.id}`);
      notify({
        type: "success",
        message: `Attribute deleted`,
      });
      navigate("/master-data/attributes");
    } catch {
      Modal.error({
        title: "Unable to delete the attribute",
      });
    }
  };

  const handleOnDelete = (record) => {
    Modal.confirm({
      title: `Delete "${record?.name || "attribute"}"`,
      content: "Are you sure you want to delete this attribute?",
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
      <Row justify="space-between">
        <Col>
          <Breadcrumbs pagePath={pagePath} />
          <DescriptionPanel
            title={id ? text.editAttributes : text.addAttributes}
          />
        </Col>
      </Row>
      <Divider />
      <Tabs size="large" activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Administration" key="administration" />
        <TabPane tab="Entity" key="entity" disabled />
      </Tabs>
      <div className="table-section">
        <div className="table-wrapper">
          <Form
            name="adm-form"
            form={form}
            labelCol={{
              span: 8,
            }}
            wrapperCol={{
              span: 16,
            }}
            initialValues={initialValues}
            onFinish={onFinish}
          >
            <Row className="form-row">
              <Col span={24}>
                <Form.Item
                  name="name"
                  label="Attribute Name"
                  rules={[
                    {
                      required: true,
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
                label="Attribute Type"
                rules={[{ required: true }]}
              >
                <Select
                  getPopupContainer={(trigger) => trigger.parentNode}
                  placeholder="Select type..."
                  onSelect={setAttrType}
                  allowClear
                  options={TYPES}
                />
              </Form.Item>
            </div>
            {OPTION_TYPES.includes(attrType) && (
              <Row className="form-row">
                <Col span={24}>
                  <Form.Item label="Options">
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
                            Add option
                          </Button>
                        </Space>
                      )}
                    </Form.List>
                  </Form.Item>
                </Col>
              </Row>
            )}
            <Row justify="center" align="middle">
              <Col span={16} offset={8}>
                <Space direction="horizontal">
                  {initialValues?.id && (
                    <Button
                      shape="round"
                      type="danger"
                      onClick={() => handleOnDelete(initialValues)}
                    >
                      {text.deleteText}
                    </Button>
                  )}
                  <Button
                    type="primary"
                    htmlType="submit"
                    shape="round"
                    loading={submitting}
                  >
                    Save attribute
                  </Button>
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
