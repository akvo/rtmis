import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Row, Col, Form, Button, Input, Select, Space, Modal, Tag } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { api, store, uiText } from "../../lib";
import {
  AdministrationDropdown,
  Breadcrumbs,
  DescriptionPanel,
} from "../../components";
import { useNotification } from "../../util/hooks";
import "./style.scss";

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
  const userAdmLevel =
    levels.find((l) => l?.level === authUser.administration.level)?.id || null;
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preload, setPreload] = useState(true);
  const [level, setLevel] = useState(userAdmLevel);
  const [selectedAdministrations, setSelectedAdministrations] = useState([]);
  const [formErrors, setFormErrors] = useState([]);
  const [formFeedback, setFormFeedback] = useState(null);

  const lowestLevel = levels
    .slice()
    .sort((a, b) => a.level - b.level)
    .slice(-1)?.[0];

  const admLevels = levels
    .slice()
    .filter((l) => l?.id > userAdmLevel)
    .sort((a, b) => a?.level - b?.level);
  /**
   * Administration is required when
   * the level has been selected as valid `admLevels`
   * AND
   * the current selected administration have a children
   */
  const admIsRequired =
    admLevels.map((a) => a.id).includes(level) &&
    selectedAdm?.[0]?.children?.length > 0;

  const showLevel = userAdmLevel !== lowestLevel?.id;

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

  const fetchUserAdmin = useCallback(async () => {
    try {
      const { data: _userAdm } = await api.get(
        `administration/${authUser.administration.id}`
      );
      store.update((s) => {
        s.administration = [_userAdm];
      });
    } catch (error) {
      console.error(error);
    }
  }, [authUser]);

  useEffect(() => {
    fetchUserAdmin();
  }, [fetchUserAdmin]);

  const deleteAssginment = async () => {
    try {
      await api.delete(`/mobile-assignments/${id}`);
      navigate("/control-center/mobile-assignment");
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

  const onSelectLevel = async (val, option) => {
    store.update((s) => {
      s.administration.length = val;
      s.administration = selectedAdm.filter(
        (item) => item.level < option.level
      );
    });
    setLevel(val);
  };

  const onFinish = async (values) => {
    setSubmitting(true);
    setFormFeedback(null);
    setFormErrors([]);
    try {
      const payload = {
        name: values.name,
        administrations: selectedAdministrations,
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
      navigate("/control-center/mobile-assignment");
    } catch (error) {
      const { response: errorResponse } = error.request || {};
      const { forms: _formErrors } = JSON.parse(errorResponse || "{}");
      if (_formErrors) {
        const _formFeedback = _formErrors.map((f) => {
          if (f.exists === "True") {
            return `Selected administration didn't have ${f.entity} data`;
          }
          return `Please create an entity type: ${f.entity} and its data`;
        });
        setFormFeedback(_formFeedback);
        setFormErrors(_formErrors);
      }
      setSubmitting(false);
    }
  };

  const tagRender = (props) => {
    const { label, value, closable, onClose } = props;
    const onPreventMouseDown = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    const isError = formErrors.find((err) => err.form === `${value}`);
    const color = isError ? "red" : "default";
    return (
      <Tag
        onMouseDown={onPreventMouseDown}
        closable={closable}
        onClose={onClose}
        style={{
          marginRight: 3,
        }}
        color={color}
      >
        {label}
      </Tag>
    );
  };

  const fetchData = useCallback(async () => {
    if (id && preload && editAssignment?.id && selectedAdm) {
      setPreload(false);
      form.setFieldsValue({
        ...editAssignment,
        administrations: editAssignment.administrations.map((a) => a?.id),
        forms: editAssignment.forms.map((f) => f?.id),
      });
      const selectedAdministration = await Promise.all(
        (editAssignment.administrations.map((a) => a?.id) ?? [])
          .filter((p) => p)
          .map(async (pID) => {
            const apiResponse = await api.get(`administration/${pID}`);
            return apiResponse.data;
          })
      );
      if (selectedAdministration) {
        setLevel(selectedAdministration[0].level + 1);
        form.setFieldsValue({ level_id: selectedAdministration[0].level + 1 });
        setSelectedAdministrations(selectedAdministration.map((adm) => adm.id));
      }
      const parentAdm = await Promise.all(
        (selectedAdministration?.[0]?.path?.split(".") ?? [])
          .filter((p) => p)
          .map(async (pID) => {
            const apiResponse = await api.get(`administration/${pID}`);
            return apiResponse.data;
          })
      );
      store.update((s) => {
        s.administration = [...parentAdm, ...selectedAdministration]
          ?.slice(
            [...parentAdm, ...selectedAdministration].findIndex(
              (r) => r.id === authUser.administration.id
            )
          )
          .map((a) => {
            const childLevel = levels.filter((l) => l?.level === a.level);
            return {
              ...a,
              childLevelName: childLevel?.name || null,
            };
          });
      });
    }
    if (!id && preload) {
      setPreload(false);
    }
  }, [id, preload, form, editAssignment, levels, selectedAdm, authUser]);

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
            {showLevel && (
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
                    fieldNames={{ value: "id", label: "name", level: "level" }}
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
                        setSelectedAdministrations(values);
                      }
                    }}
                    persist={id ? true : false}
                    allowMultiple
                    isSelectAllVillage={true}
                    selectedAdministrations={selectedAdministrations}
                  />
                </Form.Item>
              </div>
            )}
            <div className="form-row">
              <Form.Item
                name="forms"
                label={text.mobileLabelForms}
                rules={[{ required: true, message: text.mobileFormsRequired }]}
                validateStatus={formFeedback ? "error" : "success"}
                hasFeedback={formFeedback}
                help={
                  <ul>
                    {formFeedback?.map((feedback, fx) => (
                      <li key={fx}>{feedback}</li>
                    ))}
                  </ul>
                }
              >
                <Select
                  getPopupContainer={(trigger) => trigger.parentNode}
                  placeholder={text.mobileSelectForms}
                  mode="multiple"
                  allowClear
                  loading={loading}
                  fieldNames={{ value: "id", label: "name" }}
                  options={userForms}
                  className="custom-select"
                  tagRender={tagRender}
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
