import React, { useState, useEffect, useMemo } from "react";
import "./style.scss";
import {
  Row,
  Col,
  Form,
  Button,
  Input,
  Select,
  Checkbox,
  Modal,
  Table,
} from "antd";
import { AdministrationDropdown } from "../../components";
import { useNavigate, useParams } from "react-router-dom";
import { api, store, config, uiText } from "../../lib";
import { Breadcrumbs, DescriptionPanel } from "../../components";
import { takeRight, take, max } from "lodash";
import { useNotification } from "../../util/hooks";

const { Option } = Select;

const descriptionData = (
  <p>
    This page allows you to add users to the RUSH platform.You will only be able
    to add users for regions under your jurisdisction.
    <br />
    Once you have added the user, the user will be notified by email to set
    their password and access the platform
  </p>
);

const AddUser = () => {
  const {
    user: authUser,
    administration,
    forms,
    loadingForm,
    language,
  } = store.useState((s) => s);
  const { active: activeLang } = language;

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [adminError, setAdminError] = useState(null);
  const [levelError, setLevelError] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { notify } = useNotification();
  const { id } = useParams();
  const [organisations, setOrganisations] = useState([]);
  const [nationalApprover, setNationalApprover] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState([]);
  const maxLevel = max(authUser?.role_detail?.administration_level || 0);

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);
  const panelTitle = id ? text.editUser : text.addUser;

  useEffect(() => {
    if (!organisations.length) {
      // filter by 1 for member attribute
      api.get("organisations?filter=1").then((res) => {
        setOrganisations(res.data);
      });
    }
  }, [organisations]);

  const pagePath = [
    {
      title: text.controlCenter,
      link: "/control-center",
    },
    {
      title: text.manageUsers,
      link: "/control-center/users",
    },
    {
      title: id ? text.editUser : text.addUser,
    },
  ];

  const onCloseModal = () => {
    setIsModalVisible(false);
    setModalContent([]);
  };

  const allowedRoles = useMemo(() => {
    const lookUp = authUser.role?.id === 2 ? 3 : authUser.role?.id || 4;
    return config.roles.filter((r) => r.id >= lookUp);
  }, [authUser]);

  const onFinish = (values) => {
    if ([3, 5].includes(values.role)) {
      if (selectedLevel === null) {
        setLevelError(true);
        return;
      }
      const admLevel = administration.length;
      if (selectedLevel < maxLevel && admLevel !== selectedLevel) {
        setAdminError(
          `Please select a ${
            window.levels.find((l) => l.id === selectedLevel)?.name
          }`
        );
        return;
      }
    } else if ([2, 4].includes(values.role)) {
      if (
        !allowedLevels.map((a) => a.level + 1).includes(administration.length)
      ) {
        const levelNames = allowedLevels.map((l) => l.name).join("/");
        setAdminError(
          `${
            allowedRoles.find((a) => role === a.id)?.name
          } is allowed with ${levelNames} administration`
        );
        return;
      }
    }
    setSubmitting(true);
    const admin = takeRight(administration, 1)?.[0];
    const payload = {
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      administration: admin.id,
      phone_number: values.phone_number,
      designation: values.designation,
      role: values.role,
      forms: values.forms,
      inform_user: values.inform_user,
      organisation: values.organisation,
      trained: values.trained,
    };
    api[id ? "put" : "post"](id ? `user/${id}` : "user", payload)
      .then(() => {
        notify({
          type: "success",
          message: `User ${id ? "updated" : "added"}`,
        });
        setSubmitting(false);
        navigate("/control-center/users");
      })
      .catch((err) => {
        if (err?.response?.status === 403) {
          setIsModalVisible(true);
          setModalContent(err?.response?.data?.message);
        } else {
          notify({
            type: "error",
            message:
              err?.response?.data?.message ||
              `User could not be ${id ? "updated" : "added"}`,
          });
        }
        setSubmitting(false);
      });
  };

  const onRoleChange = (r) => {
    setRole(r);
    setSelectedLevel(null);
    setLevelError(false);
    setAdminError(null);
    form.setFieldsValue({
      forms: [],
    });
    if (r > 1) {
      store.update((s) => {
        s.administration = take(s.administration, 1);
      });
    }
  };

  const onLevelChange = (l) => {
    setSelectedLevel(l);
    setLevelError(false);
    setAdminError(null);
    if (administration.length >= l) {
      store.update((s) => {
        s.administration.length = l;
      });
    }
  };

  const onAdminChange = () => {
    setLevelError(false);
    setAdminError(null);
  };

  useEffect(() => {
    const fetchData = async (adminId, acc, roleRes) => {
      const adm = await config.fn.administration(adminId);
      acc.unshift(adm);
      if (adm.level > 0) {
        fetchData(adm.parent, acc, roleRes);
      } else {
        store.update((s) => {
          s.administration = acc;
        });
        if ([3, 5].includes(roleRes)) {
          setSelectedLevel(
            window.levels.find(
              (l) => l.name === takeRight(acc, 1)[0].level_name
            ).level + 1
          );
        }
      }
    };
    if (id) {
      try {
        setLoading(true);
        api.get(`user/${id}`).then((res) => {
          form.setFieldsValue({
            administration: res.data?.administration,
            designation: parseInt(res.data?.designation) || null,
            email: res.data?.email,
            first_name: res.data?.first_name,
            last_name: res.data?.last_name,
            phone_number: res.data?.phone_number,
            role: res.data?.role,
            forms: res.data?.forms.map((f) => parseInt(f.id)),
            organisation: res.data?.organisation?.id || [],
            trained: res?.data?.trained,
            nationalApprover: res.data?.role === 1 && !!res.data?.forms?.length,
            inform_user: !id
              ? true
              : authUser?.email === res.data?.email
              ? false
              : true,
          });
          setRole(res.data?.role);
          setLoading(false);
          setNationalApprover(
            res.data?.role === 1 && !!res.data?.forms?.length
          );
          fetchData(res.data.administration, [], res.data?.role);
        });
      } catch (error) {
        notify({ type: "error", message: text.errorUserLoad });
        setLoading(false);
      }
    }
  }, [id, form, forms, notify, text.errorUserLoad, authUser?.email]);

  const allowedLevels = useMemo(() => {
    const admLevels =
      allowedRoles.find((r) => r.id === role)?.administration_level || [];
    return window.levels?.filter((l) => admLevels.includes(l.level + 1)) || [];
  }, [role, allowedRoles]);

  const allowedForms = useMemo(() => {
    if (role === 1) {
      return forms.filter((f) => f.type === 2);
    }
    return role < 3 ? forms : forms.filter((f) => f.type === 1);
  }, [role, forms]);

  return (
    <div id="add-user">
      <div className="description-container">
        <Row justify="space-between">
          <Col>
            <Breadcrumbs pagePath={pagePath} />
            <DescriptionPanel
              description={descriptionData}
              title={panelTitle}
            />
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
            initialValues={{
              first_name: "",
              last_name: "",
              phone_number: "",
              designation: null,
              email: "",
              role: null,
              county: null,
              forms: [],
              inform_user: true,
              organisation: [],
            }}
            onFinish={onFinish}
          >
            <div className="form-row">
              <Form.Item
                label={text.userFirstName}
                name="first_name"
                rules={[
                  {
                    required: true,
                    message: text.valFirstName,
                  },
                ]}
              >
                <Input />
              </Form.Item>
            </div>
            <div className="form-row">
              <Form.Item
                label={text.userLastName}
                name="last_name"
                rules={[
                  {
                    required: true,
                    message: text.valLastName,
                  },
                ]}
              >
                <Input />
              </Form.Item>
            </div>
            <div className="form-row">
              <Form.Item
                label={text.userEmail}
                name="email"
                rules={[
                  {
                    required: true,
                    message: text.valEmail,
                    type: "email",
                  },
                ]}
              >
                <Input />
              </Form.Item>
            </div>
            <div className="form-row">
              <Form.Item
                label={text.userPhoneNumber}
                name="phone_number"
                rules={[
                  {
                    required: true,
                    message: text.valPhone,
                  },
                ]}
              >
                <Input />
              </Form.Item>
            </div>
            <div className="form-row">
              <Form.Item
                name="organisation"
                label={text.userOrganisation}
                rules={[{ required: true, message: text.valOrganization }]}
              >
                <Select
                  getPopupContainer={(trigger) => trigger.parentNode}
                  placeholder={text.selectOne}
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {organisations?.map((o, oi) => (
                    <Option key={`org-${oi}`} value={o.id}>
                      {o.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
            <div className="form-row">
              <Form.Item
                name="designation"
                label={text.userDesignation}
                rules={[{ required: true, message: text.valDesignation }]}
              >
                <Select
                  placeholder={text.selectOne}
                  getPopupContainer={(trigger) => trigger.parentNode}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {config?.designations?.map((d, di) => (
                    <Option key={di} value={d.id}>
                      {d.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
            <Row className="form-row">
              <Col span={18} offset={6}>
                <Form.Item name="trained" valuePropName="checked">
                  <Checkbox>{text.userTrained}</Checkbox>
                </Form.Item>
              </Col>
            </Row>
            <div className="form-row">
              <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true, message: text.valRole }]}
              >
                <Select
                  getPopupContainer={(trigger) => trigger.parentNode}
                  placeholder={text.selectOne}
                  onChange={onRoleChange}
                >
                  {allowedRoles.map((r, ri) => (
                    <Option key={ri} value={r.id}>
                      {r.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
            <Row justify="center" align="middle">
              <Col span={18} offset={6}>
                {role && (
                  <span className="role-description">
                    {config.roles.find((r) => r.id === role)?.description}
                  </span>
                )}
              </Col>
            </Row>
            {(role === 3 || role === 5) && (
              <Form.Item label={text.admLevel}>
                <Select
                  value={selectedLevel}
                  getPopupContainer={(trigger) => trigger.parentNode}
                  placeholder={text.selectOne}
                  onChange={onLevelChange}
                >
                  {allowedLevels.map((l, li) => (
                    <Option key={li} value={l.level + 1}>
                      {l.name}
                    </Option>
                  ))}
                </Select>
                {levelError && (
                  <div className="text-error">
                    {text.userSelectLevelRequired}
                  </div>
                )}
              </Form.Item>
            )}
            {([2, 4].includes(role) ||
              ([3, 5].includes(role) && selectedLevel > 1)) && (
              <Row className="form-row">
                <Col span={6} className=" ant-form-item-label">
                  <label htmlFor="administration">
                    {text.administrationLabel}
                  </label>
                </Col>
                <Col span={18}>
                  <AdministrationDropdown
                    withLabel={true}
                    persist={true}
                    size="large"
                    width="100%"
                    onChange={onAdminChange}
                    maxLevel={
                      [3, 5].includes(role)
                        ? selectedLevel
                        : max(
                            allowedRoles?.find((r) => r.id === role)
                              ?.administration_level
                          ) || null
                    }
                  />
                  {!!adminError && (
                    <div className="text-error">{adminError}</div>
                  )}
                </Col>
              </Row>
            )}
            <Row justify="center" align="middle">
              <Col span={18} offset={6}>
                {role === 1 && (
                  <div className="form-row">
                    <Form.Item
                      name="nationalApprover"
                      valuePropName="checked"
                      onChange={(e) => setNationalApprover(e.target.checked)}
                    >
                      <Checkbox>{text.userNationalApprover}</Checkbox>
                    </Form.Item>
                  </div>
                )}
              </Col>
            </Row>
            {([2, 3, 4].includes(role) || nationalApprover) && (
              <div className="form-row" style={{ marginTop: 24 }}>
                {loadingForm || loading ? (
                  <>
                    <div className="ant-form-item-label">
                      <label title={text.questionnairesLabel}>
                        {text.questionnairesLabel}
                      </label>
                    </div>
                    <p style={{ paddingLeft: 12, color: "#6b6b6f" }}>
                      {text.loadingText}
                    </p>
                  </>
                ) : (
                  <Form.Item
                    name="forms"
                    label={text.questionnairesLabel}
                    rules={[{ required: false }]}
                  >
                    <Select
                      mode="multiple"
                      getPopupContainer={(trigger) => trigger.parentNode}
                      placeholder={text.selectText}
                      allowClear
                    >
                      {allowedForms.map((f) => (
                        <Option key={f.id} value={f.id}>
                          {f.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                )}
              </div>
            )}
            <Row justify="center" align="middle">
              <Col span={18} offset={6}>
                <Form.Item
                  id="informUser"
                  label=""
                  valuePropName="checked"
                  name="inform_user"
                  rules={[{ required: false }]}
                >
                  <Checkbox
                    disabled={
                      !id
                        ? true
                        : authUser?.email === form.getFieldValue("email")
                        ? true
                        : false
                    }
                  >
                    {text.informUser}
                  </Checkbox>
                </Form.Item>
              </Col>
            </Row>
            <Row justify="center" align="middle">
              <Col span={18} offset={6}>
                <Button
                  type="primary"
                  htmlType="submit"
                  shape="round"
                  loading={submitting}
                >
                  {id ? text.updateUser : text.addUser}
                </Button>
              </Col>
            </Row>
          </Form>
        </div>
      </div>

      {/* Notification modal */}
      <Modal
        open={isModalVisible}
        onCancel={onCloseModal}
        centered
        width="575px"
        footer={
          <Row justify="center" align="middle">
            <Col>
              <Button className="light" onClick={onCloseModal}>
                {text.cancelButton}
              </Button>
            </Col>
          </Row>
        }
        bodystyle={{ textAlign: "center" }}
      >
        <img src="/assets/user.svg" height="80" />
        <br />
        <br />
        <p>{text.existingApproverTitle}</p>
        <Table
          columns={[
            {
              title: text.formColumn,
              dataIndex: "form",
            },
            {
              title: text.administrationLabel,
              dataIndex: "administration",
            },
          ]}
          dataSource={modalContent}
          rowKey="id"
          pagination={false}
        />
        <br />
        <p>{text.existingApproverDescription}</p>
      </Modal>
    </div>
  );
};

export default AddUser;
