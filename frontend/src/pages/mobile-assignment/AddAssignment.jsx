import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Row, Col, Card, Form, Button, Divider, Input, Select } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { store, uiText } from "../../lib";
import {
  AdministrationDropdown,
  Breadcrumbs,
  DescriptionPanel,
} from "../../components";
import { useNotification } from "../../util/hooks";
import "./style.scss";

const { Option } = Select;

const WARD_LEVEL = 3;

const AddAssignment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { notify } = useNotification();
  const {
    forms: userForms,
    user: authUser,
    administration: userAdms,

    language,
  } = store.useState((s) => s);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const pageTitle = id ? text.mobileEditText : text.mobileAddText;
  const descriptionData = (
    <p>{id ? text.mobilePanelEditDesc : text.mobilePanelAddDesc}</p>
  );
  const pagePath = [
    {
      title: text.controlCenter,
      link: "/control-center",
    },
    {
      title: text.mobilePanelTitle,
      link: "/mobile-assignment",
    },
    {
      title: pageTitle,
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
      message: `Data collector ${id ? "updated" : "added"}`,
    });
    setSubmitting(false);
    navigate("/mobile-assignment");
  };

  const initialValues = useMemo(() => {
    const { administration: userAdm } = authUser;
    const _administrations =
      userAdm?.level === WARD_LEVEL
        ? [{ ...userAdm, label: userAdm?.name, value: userAdm?.id }]
        : [];
    if (id) {
      // TODO
      return {
        name: "EditedUser",
        administrations: [{ value: 910, label: "Khalaba" }],
        forms: [{ value: 563350033, label: "WASH in Schools" }],
      };
    }

    return {
      name: "",
      administrations: _administrations,
      forms: [],
    };
  }, [id, authUser]);

  const fakeFetchData = useCallback(async () => {
    // TODO
    if (id) {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 2000));
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fakeFetchData();
  }, [fakeFetchData]);

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
                label={text.mobileLabelName}
                rules={[
                  {
                    required: true,
                    message: text.mobileNameRequired,
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
              label={text.mobileLabelAdm}
              rules={[{ required: true, message: text.mobileAdmRequired }]}
            >
              <Select
                getPopupContainer={(trigger) => trigger.parentNode}
                placeholder={text.mobileSelectAdm}
                mode="multiple"
                allowClear
                loading={loading}
              >
                {userAdms
                  ?.filter((a) => a?.level === WARD_LEVEL)
                  ?.map((adm) => (
                    <Option key={adm.id} value={adm.id}>
                      {adm.name}
                    </Option>
                  ))}
              </Select>
            </Form.Item>
          </div>
          <div className="form-row">
            <Form.Item
              name="forms"
              label={text.mobileLabelForms}
              rules={[{ required: true, message: text.mobileFormsRequired }]}
            >
              <Select
                getPopupContainer={(trigger) => trigger.parentNode}
                placeholder={text.mobileSelectForms}
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
              {text.mobileButtonSave}
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default React.memo(AddAssignment);
