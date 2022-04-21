import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { api, store, config } from "../../lib";
import { Breadcrumbs } from "../../components";
import { takeRight } from "lodash";
import { useNotification } from "../../util/hooks";

const { Option } = Select;

const AddUser = () => {
  const [submitting, setSubmitting] = useState(false);
  const [showAdministration, setShowAdministration] = useState(false);
  const [showForms, setShowForms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allowedForms, setAllowedForms] = useState([]);
  const [form] = Form.useForm();
  const {
    user: authUser,
    administration,
    levels,
    loadingAdministration,
    forms,
    loadingForm,
  } = store.useState((s) => s);
  const navigate = useNavigate();
  const { notify } = useNotification();
  const { id } = useParams();

  const pagePath = [
    {
      title: "Control Center",
      link: "/control-center",
    },
    {
      title: "Manage Users",
      link: "/users",
    },
    {
      title: id ? "Edit User" : "Add User",
    },
  ];

  const onFinish = (values) => {
    setSubmitting(true);
    const admin = takeRight(administration, 1)?.[0];
    api[id ? "put" : "post"](id ? `user/${id}` : "user", {
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      administration: admin.id,
      phone_number: values.phone_number,
      designation: values.designation,
      role: values.role,
      forms: values.forms,
    })
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

  const allowedRole = useMemo(() => {
    return config.roles.filter((r) => r.id >= authUser.role.id);
  }, [authUser]);

  const checkRole = useCallback(() => {
    const admin = takeRight(administration, 1)?.[0];
    const role = form.getFieldValue("role");
    const allowed_level = allowedRole.find(
      (a) => a.id === role
    )?.administration_level;
    form.setFieldsValue({
      administration: allowed_level?.includes(administration.length)
        ? admin?.id
        : null,
    });
  }, [administration, allowedRole, form]);

  const onChange = (a) => {
    if (a?.role === 1) {
      setShowAdministration(false);
      setShowForms(false);
      checkRole(administration);
    }
    if (a?.role > 1) {
      setShowAdministration(true);
      form.setFieldsValue({ forms: [] });
      setShowForms(true);
      checkRole(administration);
    }
    if (a?.role < 3) {
      setAllowedForms(forms);
    } else {
      setAllowedForms(forms.filter((f) => f.type === 1));
    }
  };

  useEffect(() => {
    checkRole(administration);
  }, [administration, checkRole]);

  useEffect(() => {
    const fetchData = (adminId, acc) => {
      api.get(`administration/${adminId}`).then((res) => {
        acc.unshift({
          id: res.data.id,
          name: res.data.name,
          levelName: res.data.level_name,
          children: res.data.children,
          childLevelName: res.data.children_level_name,
        });
        if (res.data.level > 0) {
          fetchData(res.data.parent, acc);
        } else {
          store.update((s) => {
            s.administration = acc;
          });
          store.update((s) => {
            s.loadingAdministration = false;
          });
        }
      });
    };
    if (id) {
      try {
        store.update((s) => {
          s.loadingAdministration = true;
        });
        setShowAdministration(true);
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
          });
          if (res.data?.role > 1) {
            setShowForms(true);
            if (res.data?.role < 3) {
              setAllowedForms(forms);
            } else {
              setAllowedForms(forms.filter((f) => f.type === 1));
            }
          }
          setLoading(false);
          fetchData(res.data.administration, []);
        });
      } catch (error) {
        notify({ type: "error", message: "Failed to load user data" });
        setLoading(false);
      }
    }
  }, [id, form, forms, notify]);

  return (
    <div id="add-user">
      <Row justify="space-between">
        <Col>
          <Breadcrumbs pagePath={pagePath} />
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
        }}
        onValuesChange={onChange}
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
                    message: "First name is required",
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
                    message: "Last name is required",
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
                  message: "Please enter a valid Email Address",
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
                  message: "Phone number is required",
                },
              ]}
            >
              <Input />
            </Form.Item>
          </div>
          <div className="form-row">
            <Form.Item
              name="organization"
              label="Organization"
              rules={[{ required: false }]}
            >
              <Select
                getPopupContainer={(trigger) => trigger.parentNode}
                disabled
                placeholder="Select one.."
                allowClear
              >
                <Option value="1">MOH</Option>
                <Option value="2">UNICEF</Option>
              </Select>
            </Form.Item>
          </div>
          <div className="form-row">
            <Form.Item
              name="designation"
              label="Designation"
              rules={[
                { required: true, message: "Please select a Designation" },
              ]}
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
            <Form.Item
              name="role"
              label="Role"
              rules={[{ required: true, message: "Please select a Role" }]}
            >
              <Select
                getPopupContainer={(trigger) => trigger.parentNode}
                placeholder="Select one.."
              >
                {allowedRole.map((r, ri) => (
                  <Option key={ri} value={r.id}>
                    {r.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <Form.Item noStyle shouldUpdate>
            {(f) => {
              return f.getFieldValue("role") > 1 ? (
                <Form.Item
                  name="administration"
                  label="Administration"
                  rules={[
                    { required: true, message: "" },
                    {
                      validator() {
                        const role = allowedRole.find(
                          (a) => a.id === form.getFieldValue("role")
                        );
                        const allowed_levels = role?.administration_level;
                        const adm_length =
                          authUser.role.value === "Admin"
                            ? administration.length + 1
                            : administration.length;
                        if (allowed_levels?.includes(adm_length)) {
                          return Promise.resolve();
                        }
                        const level_names = levels
                          .filter((l) => allowed_levels.includes(l.id))
                          .map((l) => l.name)
                          .join("/");
                        return Promise.reject(
                          `${role.name} Level is allowed with ${level_names} administration`
                        );
                      },
                    },
                  ]}
                  className="form-row hidden-field"
                >
                  <Input hidden />
                </Form.Item>
              ) : null;
            }}
          </Form.Item>
          {showAdministration && (
            <div className="form-row-adm">
              {loadingAdministration ? (
                <p style={{ paddingLeft: 12, color: "#6b6b6f" }}>Loading..</p>
              ) : (
                <AdministrationDropdown
                  direction="vertical"
                  withLabel={true}
                  persist={true}
                  size="large"
                  width="100%"
                />
              )}
            </div>
          )}
          {showForms && (
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
        <Row justify="space-between">
          <Col>
            <Row>
              <Checkbox id="informUser" className="dev" onChange={() => {}}>
                Inform User of Changes
              </Checkbox>
            </Row>
          </Col>
          <Col>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {id ? "Update User" : "Add User"}
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default AddUser;
