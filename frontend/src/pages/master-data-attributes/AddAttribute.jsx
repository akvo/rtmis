import React, { useState } from "react";
import { Button, Card, Col, Divider, Form, Input, Row, Select } from "antd";
import { Breadcrumbs } from "../../components";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../util/hooks";
import { store } from "../../lib";
import { MinusCircleOutlined } from "@ant-design/icons";

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
    title: "Add Attribute",
  },
];

const admLevels = [
  {
    id: 2,
    level: 1,
    name: "NAME_1",
    alias: "County",
  },
  {
    id: 3,
    level: 2,
    name: "NAME_2",
    alias: "Sub-County",
  },
  {
    id: 4,
    level: 3,
    name: "NAME_3",
    alias: "Ward",
  },
];
const attributeTypes = [
  {
    id: 1,
    name: "administration",
  },
  {
    id: 2,
    name: "entity",
  },
];

const { Option } = Select;

const AddAttribute = () => {
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { notify } = useNotification();

  const onFinish = async (values) => {
    setSubmitting(true);
    const payload = {
      attribute_type: values.attribute_type,
      level_id: values.level_id,
      name: values.name,
      options: values.options,
    };
    store.update((s) => {
      const _md = {
        ...s.masterData,
        attribute: { ...payload, id: 1011 },
      };
      s.masterData = _md;
    });
    await new Promise((r) => setTimeout(r, 2000));
    notify({
      type: "success",
      message: `Attribute added`,
    });
    setSubmitting(false);
    navigate("/master-data/attributes");
  };

  return (
    <>
      <Row justify="space-between">
        <Col>
          <Breadcrumbs pagePath={pagePath} />
          {/* <DescriptionPanel description={descriptionData} /> */}
        </Col>
      </Row>
      <Divider />
      <Form
        name="adm-form"
        form={form}
        layout="vertical"
        initialValues={{
          attribute_type: "",
          level_id: null,
          name: "",
          options: [],
        }}
        onFinish={onFinish}
      >
        <Card bodyStyle={{ padding: 0 }}>
          <div className="form-row">
            <Form.Item
              name="attribute_type"
              label="Attribute Type"
              rules={[{ required: true }]}
            >
              <Select
                getPopupContainer={(trigger) => trigger.parentNode}
                placeholder="Select type..."
                allowClear
              >
                {attributeTypes?.map((at) => (
                  <Option key={at.id} value={at.id}>
                    {at.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <div className="form-row">
            <Form.Item
              name="level_id"
              label="Attribute Level"
              rules={[{ required: true }]}
            >
              <Select
                getPopupContainer={(trigger) => trigger.parentNode}
                placeholder="Select level.."
                allowClear
              >
                {admLevels?.map((adm, adx) => (
                  <Option key={`org-attr-${adx}`} value={adm.id}>
                    {adm.alias}
                  </Option>
                ))}
              </Select>
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
          <Form.List name="options">
            {(fields, { add, remove }) => (
              <div>
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key}>
                    <Form.Item name={[name, "name"]} {...restField}>
                      <Input />
                    </Form.Item>
                    <Button
                      icon={<MinusCircleOutlined />}
                      onClick={() => remove(name)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <br />
                <Button onClick={() => add()}>Add option</Button>
              </div>
            )}
          </Form.List>
        </Card>
        <Row justify="end" align="middle">
          <Col>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Add attribute
            </Button>
          </Col>
        </Row>
      </Form>
    </>
  );
};

export default AddAttribute;
