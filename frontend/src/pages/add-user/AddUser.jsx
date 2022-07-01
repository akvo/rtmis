import React, { useState, useEffect, useMemo } from "react";
import "./style.scss";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Divider,
  Input,
  Select,
  Checkbox,
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
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(null);
  const [level, setLevel] = useState(null);
  const [adminError, setAdminError] = useState(null);
  const [levelError, setLevelError] = useState(false);
  const [form] = Form.useForm();
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);
  const {
    user: authUser,
    administration,
    forms,
    loadingForm,
  } = store.useState((s) => s);
  const navigate = useNavigate();
  const { notify } = useNotification();
  const { id } = useParams();

  const [organisations, setOrganisations] = useState([]);

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
      link: "/users",
    },
    {
      title: id ? text.editUser : text.addUser,
    },
  ];

  const allowedRoles = useMemo(() => {
    const lookUp = authUser.role?.id === 2 ? 3 : authUser.role?.id || 4;
    return config.roles.filter((r) => r.id >= lookUp);
  }, [authUser]);

  const onFinish = (values) => {
    if ([3, 5].includes(values.role)) {
      if (level === null) {
        setLevelError(true);
        return;
      }
      if (administration.length !== level) {
        setAdminError(
          `Please select a ${window.levels.find((l) => l.id === level)?.name}`
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
        navigate("/users");
      })
      .catch((err) => {
        notify({
          type: "error",
          message:
            err?.response?.data?.message ||
            `User could not be ${id ? "updated" : "added"}`,
        });
        setSubmitting(false);
      });
  };

  const onRoleChange = (r) => {
    setRole(r);
    setLevel(null);
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
    setLevel(l);
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
    const fetchData = (adminId, acc, roleRes) => {
      const adm = config.fn.administration(adminId);
      acc.unshift(adm);
      if (adm.level > 0) {
        fetchData(adm.parent, acc, roleRes);
      } else {
        store.update((s) => {
          s.administration = acc;
        });
        if ([3, 5].includes(roleRes)) {
          setLevel(
            window.levels.find((l) => l.name === takeRight(acc, 1)[0].levelName)
              .level + 1
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
          });
          setRole(res.data?.role);
          setLoading(false);
          fetchData(res.data.administration, [], res.data?.role);
        });
      } catch (error) {
        notify({ type: "error", message: text.errorUserLoad });
        setLoading(false);
      }
    }
  }, [id, form, forms, notify, text.errorUserLoad]);

  const allowedLevels = useMemo(() => {
    const admLevels =
      allowedRoles.find((r) => r.id === role)?.administration_level || [];
    return window.levels?.filter((l) => admLevels.includes(l.level + 1)) || [];
  }, [role, allowedRoles]);

  const allowedForms = useMemo(() => {
    return role < 3 ? forms : forms.filter((f) => f.type === 1);
  }, [role, forms]);

  return (
    <div id="add-user">
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
        <Card bodyStyle={{ padding: 0 }}>
          <Row className="form-row">
            <Col span={12}>
              <Form.Item
                label="First name"
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
            </Col>
            <Col span={12}>
              <Form.Item
                label="Last name"
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
            </Col>
          </Row>
          <div className="form-row">
            <Form.Item
              label="Email Address"
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
              label="Phone Number"
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
              label="Organization"
              rules={[{ required: true, message: text.valOrganization }]}
            >
              <Select
                getPopupContainer={(trigger) => trigger.parentNode}
                placeholder="Select one.."
                allowClear
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
              label="Designation"
              rules={[{ required: true, message: text.valDesignation }]}
            >
              <Select
                placeholder="Select one.."
                getPopupContainer={(trigger) => trigger.parentNode}
              >
                {config?.designations?.map((d, di) => (
                  <Option key={di} value={d.id}>
                    {d.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <div className="form-row">
            <Form.Item name="trained" valuePropName="checked">
              <Checkbox>Trained</Checkbox>
            </Form.Item>
          </div>
          <div className="form-row">
            <Form.Item
              name="role"
              label="Role"
              rules={[{ required: true, message: text.valRole }]}
            >
              <Select
                getPopupContainer={(trigger) => trigger.parentNode}
                placeholder="Select one.."
                onChange={onRoleChange}
              >
                {allowedRoles.map((r, ri) => (
                  <Option key={ri} value={r.id}>
                    {r.name}
                    <span className="opt-desc">{r.description}</span>
                  </Option>
                ))}
              </Select>
            </Form.Item>
            {role && (
              <span className="role-description">
                {config.roles.find((r) => r.id === role)?.description}
              </span>
            )}
          </div>
          {(role === 3 || role === 5) && (
            <div className="form-row">
              <Form.Item label="Administration Level">
                <Select
                  value={level}
                  getPopupContainer={(trigger) => trigger.parentNode}
                  placeholder="Select one.."
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
                    Please select an administration level
                  </div>
                )}
              </Form.Item>
            </div>
          )}
          {([2, 4].includes(role) || ([3, 5].includes(role) && level > 1)) && (
            <div className="form-row-adm">
              <h3>Administration</h3>
              {!!adminError && <div className="text-error">{adminError}</div>}
              <AdministrationDropdown
                direction="vertical"
                withLabel={true}
                persist={true}
                size="large"
                width="100%"
                onChange={onAdminChange}
                maxLevel={
                  [3, 5].includes(role)
                    ? level
                    : max(
                        allowedRoles?.find((r) => r.id === role)
                          ?.administration_level
                      ) || null
                }
              />
            </div>
          )}
          {[2, 3, 4].includes(role) && (
            <div className="form-row" style={{ marginTop: 24 }}>
              {loadingForm || loading ? (
                <>
                  <div className="ant-form-item-label">
                    <label title="Questionnaires">Questionnaires</label>
                  </div>
                  <p style={{ paddingLeft: 12, color: "#6b6b6f" }}>Loading..</p>
                </>
              ) : (
                <Form.Item
                  name="forms"
                  label="Questionnaires"
                  rules={[{ required: false }]}
                >
                  <Select
                    mode="multiple"
                    getPopupContainer={(trigger) => trigger.parentNode}
                    placeholder="Select.."
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
        </Card>
        <Row justify="end" align="middle">
          <Col>
            <Form.Item
              id="informUser"
              valuePropName="checked"
              name="inform_user"
              rules={[{ required: false }]}
            >
              <Checkbox>{text.informUser}</Checkbox>
            </Form.Item>
          </Col>
          <Col>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {id ? text.updateUser : text.addUser}
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default AddUser;
