import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Divider,
  Input,
  Select,
  Space,
  Modal,
} from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { api, store, uiText } from "../../lib";
import {
  AdministrationDropdown,
  Breadcrumbs,
  DescriptionPanel,
} from "../../components";
import { useNotification } from "../../util/hooks";
import "./style.scss";

const IS_SUPER_ADMIN = 1;

const AddAssignment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { notify } = useNotification();
  const {
    forms: userForms,
    user: authUser,
    language,
    levels,
    administration: selectedAdm,
  } = store.useState((s) => s);
  const editAssignment = store.useState((s) => s.mobileAssignment);
  const userAdmLevel = authUser?.administration?.level;
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preload, setPreload] = useState(true);
  const [level, setLevel] = useState(userAdmLevel);

  const admLevels = levels
    .slice(1, levels.length)
    .filter((l) => l?.level >= userAdmLevel)
    .sort((a, b) => a?.level - b?.level);
  const admChildren = selectedAdm
    ?.slice()
    ?.sort((a, b) => a.level - b.level)
    ?.slice(-1)
    ?.flatMap((sa) => sa?.children);
  const admIsRequired = admChildren.length ? true : false;
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

  const deleteAssginment = async () => {
    try {
      await api.delete(`/mobile-assignments/${id}`);
      navigate("/mobile-assignment");
    } catch {
      notify({
        type: "error",
        message: "Oops, something went wrong.",
      });
    }
  };

  const onDelete = () => {
    Modal.confirm({
      title: `Delete ${editAssignment?.name || "Assignment"}`,
      content: "Are you sure you want to delete this assignment?",
      onOk: () => {
        deleteAssginment();
      },
    });
  };

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        name: values.name,
        administrations:
          values.administrations || selectedAdm.map((a) => a?.id),
        forms: values.forms,
      };
      if (id) {
        await api.put(`/mobile-assignments/${id}`, payload);
      } else {
        await api.post("/mobile-assignments", payload);
      }
      notify({
        type: "success",
        message: id ? "Mobile assignment update" : "Mobile assignment added",
      });
      setLoading(false);
      navigate("/mobile-assignment");
    } catch {
      setSubmitting(false);
    }
  };

  const fetchData = useCallback(() => {
    if (id && preload && editAssignment?.id) {
      setPreload(false);
      form.setFieldsValue({
        ...editAssignment,
        administrations: editAssignment.administrations.map((a) => a?.id),
        forms: editAssignment.forms.map((f) => f?.id),
      });
    }

    if (!id && preload) {
      setPreload(false);
    }
  }, [id, preload, form, editAssignment]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div id="add-assignment">
      <Row justify="space-between">
        <Col>
          <Breadcrumbs pagePath={pagePath} />
          <DescriptionPanel description={descriptionData} />
        </Col>
      </Row>
      <Divider />
      <Form name="user-form" form={form} layout="vertical" onFinish={onFinish}>
        <Card bodyStyle={{ padding: 0 }}>
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
          {authUser?.role?.id === IS_SUPER_ADMIN && (
            <div className="form-row">
              <Form.Item name="level_id" label="Administration Level">
                <Select
                  getPopupContainer={(trigger) => trigger.parentNode}
                  placeholder="Select level.."
                  onChange={setLevel}
                  fieldNames={{ value: "id", label: "name" }}
                  options={admLevels}
                  allowClear
                />
              </Form.Item>
            </div>
          )}
          {admIsRequired && (
            <div className="form-row">
              <Form.Item
                name="administrations"
                label={text.mobileLabelAdm}
                rules={[{ required: true, message: text.mobileAdmRequired }]}
              >
                <AdministrationDropdown
                  size="large"
                  width="100%"
                  direction="vertical"
                  maxLevel={level}
                  onChange={(values) => {
                    if (values) {
                      form.setFieldsValue({ administrations: values });
                    }
                  }}
                  allowMultiple
                />
              </Form.Item>
            </div>
          )}
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
                fieldNames={{ value: "id", label: "name" }}
                options={userForms}
              />
            </Form.Item>
          </div>
        </Card>
        <Space>
          {id && (
            <Button type="danger" onClick={onDelete}>
              Delete
            </Button>
          )}
          <Button type="primary" htmlType="submit" loading={submitting}>
            {text.mobileButtonSave}
          </Button>
        </Space>
      </Form>
    </div>
  );
};

export default React.memo(AddAssignment);
