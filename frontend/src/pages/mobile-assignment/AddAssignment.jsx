import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Row, Col, Form, Button, Input, Select, Space, Modal } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { api, config, store, uiText } from "../../lib";
import {
  AdministrationDropdown,
  Breadcrumbs,
  DescriptionPanel,
} from "../../components";
import { useNotification } from "../../util/hooks";
import "./style.scss";

const IS_SUPER_ADMIN = config.roles.find((x) => x.name === "Super Admin").id;

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
      link: "/control-center/mobile-assignment",
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
      Modal.error({
        title: text.mobileErrDelete,
        content: (
          <>
            {text.errDeleteCascadeText1}
            <br />
            <em>{text.errDeleteCascadeText2}</em>
          </>
        ),
      });
    }
  };

  const onDelete = () => {
    Modal.confirm({
      title: `${text.deleteText} ${editAssignment?.name}`,
      content: text.mobileConfirmDelete,
      onOk: () => {
        deleteAssginment();
      },
    });
  };

  const onSelectLevel = (val) => {
    setLevel(val);
    if (selectedAdm.length > 1) {
      store.update((s) => {
        s.administration = [
          config.fn.administration(authUser.administration.id),
        ];
      });
    }
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
        message: id ? text.mobileSuccessUpdated : text.mobileSuccessAdded,
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
      const editAdm = editAssignment?.administrations?.map((a) =>
        window.dbadm.find((dba) => dba.id === a?.id)
      );
      const findLvl = levels.find((l) => l?.level === editAdm?.[0]?.level);
      if (findLvl) {
        setLevel(findLvl.id);
        form.setFieldsValue({ level_id: findLvl.id });
      }
      const parentAdm =
        editAdm[0]?.path
          ?.split(".")
          ?.filter((p) => p)
          ?.map((pID) =>
            window.dbadm.find((dba) => dba?.id === parseInt(pID, 10))
          ) || [];

      store.update((s) => {
        s.administration = [...parentAdm, ...editAdm]?.map((a, ax) => {
          const childLevel = levels.find((l) => l?.level === ax + 1);
          return {
            ...a,
            childLevelName: childLevel?.name || null,
            children: window.dbadm.filter((sa) => sa?.parent === a?.id),
          };
        });
      });
    }

    if (!id && preload) {
      setPreload(false);
    }
  }, [id, preload, form, editAssignment, levels]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div id="add-assignment">
      <div className="description-container">
        <Row justify="space-between">
          <Col>
            <Breadcrumbs pagePath={pagePath} />
            <DescriptionPanel description={descriptionData} title={pageTitle} />
          </Col>
        </Row>
      </div>
      <div className="table-section">
        <div className="table-wrapper">
          <Form
            name="adm-form"
            form={form}
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 18 }}
            onFinish={onFinish}
          >
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
                <Form.Item
                  name="level_id"
                  label={text.admLevel}
                  rules={[
                    {
                      required: true,
                      message: text.mobileLevelRequired,
                    },
                  ]}
                >
                  <Select
                    getPopupContainer={(trigger) => trigger.parentNode}
                    placeholder={text.selectLevel}
                    onChange={onSelectLevel}
                    fieldNames={{ value: "id", label: "name" }}
                    options={admLevels}
                    allowClear
                  />
                </Form.Item>
              </div>
            )}
            {((admIsRequired && authUser?.role?.id !== IS_SUPER_ADMIN) ||
              (level > 0 && authUser?.role?.id === IS_SUPER_ADMIN)) && (
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
                    persist={id ? true : false}
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
            <Row justify="center" align="middle">
              <Col span={18} offset={6}>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    shape="round"
                    loading={submitting}
                  >
                    {text.mobileButtonSave}
                  </Button>
                  {id && (
                    <Button type="danger" shape="round" onClick={onDelete}>
                      {text.deleteText}
                    </Button>
                  )}
                </Space>
              </Col>
            </Row>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AddAssignment);
