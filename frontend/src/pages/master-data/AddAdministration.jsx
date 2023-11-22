import React, { useCallback, useEffect, useState } from "react";
import { Button, Card, Col, Divider, Form, Input, Row, Select } from "antd";
import { Breadcrumbs, InputAttributes } from "../../components";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../util/hooks";
import fakeAttributes from "../../placeholders/attributes-administration.json";
import { store } from "../../lib";
import "./style.scss";

const pagePath = [
  {
    title: "Control Center",
    link: "/control-center",
  },
  {
    title: "Manage Administrative List",
    link: "/master-data",
  },
  {
    title: "Add Administration",
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

const { Option } = Select;

const AddAdministration = () => {
  const [submitting, setSubmitting] = useState(false);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attributes, setAttributes] = useState(true);

  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { notify } = useNotification();

  const onFinish = async (values) => {
    setSubmitting(true);

    const attributesPayload = values.attributes.map((attr, ax) => {
      const attrName = attributes?.[ax]?.name;
      const fieldValue = attr?.[attrName];
      // TODO
      return {
        administration_id: 1,
        administration_attribute_id: attributes?.[ax]?.id,
        attribute: attrName,
        value: fieldValue,
        options: attributes?.[ax]?.options ? [fieldValue] : [],
      };
    });
    const payload = {
      code: values.code,
      name: values.name,
      level_id: values.level_id,
      parent_id: values.parent_id,
      attributes: attributesPayload,
    };
    store.update((s) => {
      const _md = {
        ...s.masterData,
        administration: { ...payload, id: 1011 },
      };
      s.masterData = _md;
    });
    await new Promise((r) => setTimeout(r, 2000));
    notify({
      type: "success",
      message: `Administration added`,
    });
    setSubmitting(false);
    navigate("/master-data");
  };

  const fakeGetAttributesApi = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 2000));
    const attrFields = fakeAttributes.map((attr) => {
      return {
        [attr.name]: attr.options.length ? [] : "",
      };
    });
    setAttributes(fakeAttributes);
    form.setFieldsValue({ attributes: attrFields });
    setLoading(false);
  }, [form]);

  useEffect(() => {
    fakeGetAttributesApi();
  }, [fakeGetAttributesApi]);

  useEffect(() => {
    // TODO
    // get real adm parents
    setParents([
      {
        id: 1,
        code: "JKT",
        name: "DKI Jakarta",
        level_id: 1,
        parent_id: null,
        parent: null,
        path: "1",
      },
    ]);
  }, []);

  return (
    <div id="add-administration">
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
          code: "",
          name: "",
          level_id: null,
          parent_id: null,
          attributes: [],
        }}
        onFinish={onFinish}
      >
        <Card bodyStyle={{ padding: 0 }}>
          <Row className="form-row">
            <Col span={24}>
              <Form.Item
                name="code"
                label="Administration Code"
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
          <Row className="form-row">
            <Col span={24}>
              <Form.Item
                name="name"
                label="Administration Name"
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
              name="level_id"
              label="Administration Level"
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
          <div className="form-row">
            <Form.Item
              name="parent_id"
              label="Administration Parent"
              rules={[{ required: true }]}
            >
              <Select
                getPopupContainer={(trigger) => trigger.parentNode}
                placeholder="Select parent.."
                allowClear
              >
                {parents?.map((p, px) => (
                  <Option key={`adm-parent-${px}`} value={p.id}>
                    {p.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <InputAttributes attributes={attributes} loading={loading} />
        </Card>
        <Row justify="end" align="middle">
          <Col>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Add administration
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default AddAdministration;
