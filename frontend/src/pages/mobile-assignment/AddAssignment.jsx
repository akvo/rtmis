import React, { useState, useEffect, useMemo } from "react";
import { Row, Col, Card, Form, Button, Divider, Input, Select } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { api, config, store } from "../../lib";
import {
  AdministrationDropdown,
  Breadcrumbs,
  DescriptionPanel,
} from "../../components";
import { useNotification } from "../../util/hooks";
import "./style.scss";

const { Option } = Select;

const descriptionData = (
  <p>
    This page allows you to add mobile data collectors to the RUSH platform.
  </p>
);

const AddAssignment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { notify } = useNotification();
  const {
    forms: userForms,
    user: authUser,
    administration: userAdms,
    isLoggedIn,
  } = store.useState((s) => s);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const pagePath = [
    {
      title: "Control Center",
      link: "/control-center",
    },
    {
      title: "Mobile Data Collectors",
      link: "/mobile-assignment",
    },
    {
      title: "Add Mobile Data Collector",
    },
  ];

  const onFinish = async (values) => {
    // TODO
    setSubmitting(true);
    const passcode = Math.random().toString(36).slice(7);
    const payload = {
      name: values.name,
      administrations: values.administrations,
      forms: values.forms,
      passcode,
      id: passcode,
    };
    await new Promise((r) => setTimeout(r, 2000));
    store.update((s) => {
      s.mobileAssignment = payload;
    });
    notify({
      type: "success",
      message: `Data collector added`,
    });
    setSubmitting(false);
    navigate("/mobile-assignment");
  };

  const initialValues = useMemo(() => {
    const { administration: userAdm } = authUser;
    if (id) {
      return {
        name: "EditedUser",
        administrations: [59],
        forms: [563350033],
      };
    }
    return {
      name: "",
      administrations: [
        { ...userAdm, label: userAdm?.name, value: userAdm?.id },
      ],
      forms: [],
    };
  }, [id, authUser]);

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

  useEffect(() => {
    if (isLoggedIn) {
      store.update((s) => {
        s.administration = [
          config.fn.administration(authUser.administration.id),
        ];
      });
    }
  }, [authUser, isLoggedIn]);

  return (
    <div id="add-assignment">
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
        initialValues={initialValues}
        onFinish={onFinish}
      >
        <Card bodyStyle={{ padding: 0 }}>
          <AdministrationDropdown
            direction="vertical"
            withLabel={true}
            // persist={true}
            size="large"
            width="100%"
          />
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
                {userAdms
                  ?.filter((a) => a?.level === 2)
                  ?.map((adm) => (
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

export default React.memo(AddAssignment);
