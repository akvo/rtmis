import React, { useCallback, useEffect, useState } from "react";
import { Button, Card, Col, Divider, Form, Input, Row, Select } from "antd";
import { Breadcrumbs, InputAttributes } from "../../components";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../util/hooks";
import { api } from "../../lib";
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
    const payload = {
      ...values,
      attributes: values.attributes.map((attr) => {
        const { id: attrId, ...fieldValue } = attr;
        return {
          attribute: attrId,
          value: Object.values(fieldValue)?.[0] || "",
          options: [],
        };
      }),
    };
    try {
      await api.post(`/administrations`, payload);
      notify({
        type: "success",
        message: `Administration added`,
      });
      setSubmitting(false);
      navigate("/master-data");
    } catch (error) {
      setSubmitting(false);
    }
  };

  const fetchAttributes = useCallback(async () => {
    try {
      const { data: _attributes } = await api.get("/administration-attributes");
      const attrFields = _attributes.map((attr) => {
        return {
          id: attr?.id,
          [attr.name]: attr.options.length ? [] : "",
        };
      });
      setAttributes(_attributes);
      form.setFieldsValue({ attributes: attrFields });
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  useEffect(() => {
    // TODO
    // get real adm parents
    setParents([
      {
        id: 3,
        name: "Bomet",
        code: null,
        parent: {
          id: 1,
          name: "Kenya",
          code: null,
        },
        level: {
          id: 2,
          name: "County",
        },
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
          parent: null,
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
              name="parent"
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
