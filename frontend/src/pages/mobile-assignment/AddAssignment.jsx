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
    administration: selectedAdministration,
    language,
  } = store.useState((s) => s);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preload, setPreload] = useState(true);
  const [editAssignment, setEditAssignment] = useState(null);
  const [villageFetching, setVillageFetching] = useState(false);
  const [ward, setWard] = useState(null);
  const [villages, setVillages] = useState([]);

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

  const findWard = useMemo(() => {
    return authUser?.administration?.level === WARD_LEVEL &&
      authUser?.administration?.id !== 1
      ? authUser.administration
      : selectedAdministration?.find(
          (s) => s.level === WARD_LEVEL && s.id !== 1
        );
  }, [authUser, selectedAdministration]);

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
      if (id) {
        await api.put(`/mobile-assignments/${id}`, values);
      } else {
        await api.post("/mobile-assignments", values);
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

  const fetchVillages = useCallback(async () => {
    if (findWard && findWard?.id !== ward?.id) {
      setWard(findWard);
      setVillageFetching(true);
      try {
        const { data: apiData } = await api.get(
          `/administrations/${findWard.id}`
        );
        const { children: _villages } = apiData || {};
        setVillages(_villages);
        setVillageFetching(false);
      } catch {
        setVillages([]);
        setVillageFetching(false);
      }
    }
  }, [findWard, ward]);

  const fetchData = useCallback(async () => {
    if (id && preload) {
      setPreload(false);
      setLoading(true);
      const { data: apiData } = await api.get(`/mobile-assignments/${id}`);
      setEditAssignment(apiData);
      form.setFieldsValue(apiData);
      setLoading(false);
    }

    if (!id && preload) {
      setPreload(false);
    }
  }, [id, preload, form]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchVillages();
  }, [fetchVillages]);

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
          <div className="form-row">
            <Form.Item
              name="administrations"
              label={text.mobileLabelAdm}
              rules={[{ required: true, message: text.mobileAdmRequired }]}
            >
              <AdministrationDropdown
                direction="vertical"
                size="large"
                width="100%"
              />
              <Select
                allowClear
                getPopupContainer={(trigger) => trigger.parentNode}
                placeholder={text.mobileSelectAdm}
                mode="multiple"
                fieldNames={{ value: "id", label: "name" }}
                loading={villageFetching}
                options={villages}
                onChange={(_values) => {
                  form.setFieldsValue({ administrations: _values });
                }}
              />
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
