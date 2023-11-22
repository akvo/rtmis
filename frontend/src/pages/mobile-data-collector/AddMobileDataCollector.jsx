import React, { useState, useMemo, useEffect } from "react";
import { Row, Col, Card, Form, Button, Divider, Input, Select } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { api, store } from "../../lib";
import { Breadcrumbs, DescriptionPanel } from "../../components";
import { useNotification } from "../../util/hooks";

const { Option } = Select;

const descriptionData = (
  <p>This page allows you to add organisations to the RUSH platform.</p>
);

const AddMobileDataCollector = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { notify } = useNotification();
  const { forms: userForms, administration: userAdministrations } =
    store.useState((s) => s);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const pagePath = [
    {
      title: "Control Center",
      link: "/control-center",
    },
    {
      title: "Mobile Data Collectors",
      link: "/mobile/data-collectors",
    },
    {
      title: "Add Mobile Data Collector",
    },
  ];

  const onFinish = async (values) => {
    setSubmitting(true);
    const payload = {
      name: values.name,
      administrations: values.administrations,
      forms: values.forms,
    };
    await new Promise((r) => setTimeout(r, 2000));
    console.log("payload", payload);
    setSubmitting(false);
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      api.get(`organisation/${id}`).then((res) => {
        form.setFieldsValue({
          name: res.data.name,
          attributes: res.data.attributes.map((a) => a.type_id),
        });
        setLoading(false);
      });
    }
  }, [id, form]);

  return (
    <div id="add-organisation">
      <Row justify="space-between">
        <Col>
          <Breadcrumbs pagePath={pagePath} />
          <DescriptionPanel description={descriptionData} />
        </Col>
      </Row>
      <Divider />
      <Form
        name="user-form"
        form={form}
        layout="vertical"
        initialValues={{
          name: "",
          attributes: [],
        }}
        onFinish={onFinish}
      >
        <Card bodyStyle={{ padding: 0 }}>
          <Row className="form-row">
            <Col span={24}>
              <Form.Item
                name="name"
                label="Name"
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
              name="administrations"
              label="Villages"
              rules={[{ required: true }]}
            >
              <Select
                getPopupContainer={(trigger) => trigger.parentNode}
                placeholder="Select Village.."
                mode="multiple"
                allowClear
                loading={loading}
              >
                {userAdministrations?.map((adm) => (
                  <Option key={adm.id} value={adm.id}>
                    {adm.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <div className="form-row">
            <Form.Item name="forms" label="Forms" rules={[{ required: true }]}>
              <Select
                getPopupContainer={(trigger) => trigger.parentNode}
                placeholder="Select forms.."
                mode="multiple"
                allowClear
                loading={loading}
              >
                {userForms?.map((form) => (
                  <Option key={form.id} value={form.id}>
                    {form.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>
        </Card>
        <Row justify="end" align="middle">
          <Col>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Add mobile data collector
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default React.memo(AddMobileDataCollector);
