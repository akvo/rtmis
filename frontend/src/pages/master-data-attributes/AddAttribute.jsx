import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
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
import { Breadcrumbs } from "../../components";
import { useNavigate, useParams } from "react-router-dom";
import { useNotification } from "../../util/hooks";
import { MinusCircleOutlined } from "@ant-design/icons";
import "./style.scss";
import { api, store } from "../../lib";

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

  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { notify } = useNotification();
  const { id } = useParams();

  const pagePath = [
    {
      title: "Control Center",
      link: "/control-center",
    },
    {
      title: "Manage Attributes",
      link: "/master-data/attributes",
    },
    {
      title: id ? "Edit Attribute" : "Add Attribute",
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
          {/* <DescriptionPanel description={descriptionData} /> */}
        </Col>
      </Row>
      <Divider />
      <Tabs size="large" activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Administration" key="administration" />
        <TabPane tab="Entity" key="entity" disabled />
      </Tabs>
      <Form
        name="adm-form"
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={onFinish}
      >
        <Card bodyStyle={{ padding: 0 }}>
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
          {OPTION_TYPES.includes(attrType) && (
            <Row className="form-row">
              <Col span={24}>
                <Form.Item label="Options">
                  <Form.List name="options">
                    {(fields, { add, remove }) => (
                      <div>
                        {fields.map(({ key, name, ...restField }) => (
                          <Space key={key}>
                            <Form.Item name={[name, "name"]} {...restField}>
                              <Input />
                            </Form.Item>
                            <Button
                              icon={<MinusCircleOutlined />}
                              onClick={() => remove(name)}
                            >
                              Remove
                            </Button>
                          </Space>
                        ))}
                        <Button onClick={() => add()}>Add option</Button>
                      </div>
                    )}
                  </Form.List>
                </Form.Item>
              </Col>
            </Row>
          )}
        </Card>
        <Space direction="horizontal">
          {initialValues?.id && (
            <Button type="danger" onClick={() => handleOnDelete(initialValues)}>
              Delete
            </Button>
          )}
          <Button type="primary" htmlType="submit" loading={submitting}>
            Save attribute
          </Button>
        </Space>
      </Form>
    </div>
  );
};

export default AddAttribute;
