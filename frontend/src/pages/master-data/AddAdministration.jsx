import React, { useCallback, useEffect, useState } from "react";
import { Button, Card, Col, Divider, Form, Input, Row, Select } from "antd";
import {
  AdministrationDropdown,
  Breadcrumbs,
  InputAttributes,
} from "../../components";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../util/hooks";
import { api, store } from "../../lib";
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
    id: 1,
    level: 0,
    name: "National",
  },
  {
    id: 2,
    level: 1,
    name: "County",
  },
  {
    id: 3,
    level: 2,
    name: "Sub-County",
  },
];

const { Option } = Select;

const AddAdministration = () => {
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attributes, setAttributes] = useState(true);
  const [level, setLevel] = useState(1);
  const selectedAdm = store.useState((s) => s.administration);

  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { notify } = useNotification();

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      const parent = selectedAdm?.slice(-1)?.[0];
      const payload = {
        code: values.code,
        name: values.name,
        parent: parent?.id || null,
        attributes: values.attributes.map((attr) => {
          const { id: attrId, ...fieldValue } = attr;
          return {
            attribute: attrId,
            value: Object.values(fieldValue)?.[0] || "",
            options: [],
          };
        }),
      };
      await api.post("/administrations", payload);
      notify({
        type: "success",
        message: `Administration added`,
      });
      setSubmitting(false);
      navigate("/master-data");
    } catch {
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
          level_id: 1,
          parent: 1,
          attributes: [],
        }}
        onFinish={onFinish}
      >
        <Card bodyStyle={{ padding: 0 }}>
          <Row gutter={16}>
            <Col span={6}>
              <div className="form-row">
                <Form.Item
                  name="level_id"
                  label="Administration Level"
                  rules={[{ required: true }]}
                >
                  <Select
                    getPopupContainer={(trigger) => trigger.parentNode}
                    placeholder="Select level.."
                    value={level}
                    onChange={setLevel}
                    allowClear
                  >
                    {admLevels?.map((adm) => (
                      <Option key={adm.id} value={adm.id}>
                        {adm.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>
            </Col>
            <Col span={18}>
              <Form.Item name="parent" label="Administration Parent">
                {level === 1 ? (
                  <Select placeholder="Select parent.." allowClear>
                    {selectedAdm?.map((adm) => (
                      <Option key={adm.id} value={adm.id}>
                        {adm.name}
                      </Option>
                    ))}
                  </Select>
                ) : (
                  <AdministrationDropdown
                    size="large"
                    width="100%"
                    maxLevel={level}
                  />
                )}

                <Input type="hidden" />
              </Form.Item>
            </Col>
          </Row>
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
