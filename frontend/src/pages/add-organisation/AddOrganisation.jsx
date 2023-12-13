import React, { useState, useMemo, useEffect } from "react";
import "./style.scss";
import { Row, Col, Form, Button, Input, Select } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { api, store, config, uiText } from "../../lib";
import { Breadcrumbs, DescriptionPanel } from "../../components";
import { useNotification } from "../../util/hooks";

const { Option } = Select;

const descriptionData = (
  <p>This page allows you to add organisations to the RUSH platform.</p>
);

const AddOrganisation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { notify } = useNotification();
  const { organisationAttributes } = config;
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const pagePath = [
    {
      title: text.settings,
      link: "/settings",
    },
    {
      title: text.manageOrganisations,
      link: "/control-center/master-data/organisations",
    },
    {
      title: id ? text.editOrganisation : text.addOrganisation,
    },
  ];

  const onFinish = (values) => {
    setSubmitting(true);
    const payload = {
      name: values.name,
      attributes: values.attributes,
    };
    api[id ? "put" : "post"](
      id ? `organisation/${id}` : "organisation",
      payload
    )
      .then(() => {
        notify({
          type: "success",
          message: `Organization ${id ? "updated" : "added"}`,
        });
        setSubmitting(false);
        navigate("/master-data/organisations");
      })
      .catch((err) => {
        notify({
          type: "error",
          message:
            err?.response?.data?.message ||
            `Organization could not be ${id ? "updated" : "added"}`,
        });
        setSubmitting(false);
      });
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
      <div className="description-container">
        <Row justify="space-between">
          <Col>
            <Breadcrumbs pagePath={pagePath} />
            <DescriptionPanel
              description={descriptionData}
              title={id ? text.editOrganisation : text.addOrganisation}
            />
          </Col>
        </Row>
      </div>
      <div className="table-section">
        <div className="table-wrapper">
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
            <div bodyStyle={{ padding: 0 }}>
              <Row className="form-row">
                <Col span={24}>
                  <Form.Item
                    name="name"
                    label="Organization Name"
                    rules={[
                      {
                        required: true,
                        message: text.valOrgName,
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <div className="form-row">
                <Form.Item
                  name="attributes"
                  label="Organization Attributes"
                  rules={[{ required: true, message: text.valOrgAttributes }]}
                >
                  <Select
                    getPopupContainer={(trigger) => trigger.parentNode}
                    placeholder="Select attributes.."
                    mode="multiple"
                    allowClear
                    loading={!organisationAttributes.length || loading}
                  >
                    {organisationAttributes?.map((o, oi) => (
                      <Option key={`org-attr-${oi}`} value={o.id}>
                        {o.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>
            </div>
            <Row justify="end" align="middle">
              <Col>
                <Button
                  type="primary"
                  htmlType="submit"
                  shape="round"
                  loading={submitting}
                >
                  {id ? text.updateOrganisation : text.addOrganisation}
                </Button>
              </Col>
            </Row>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AddOrganisation);
