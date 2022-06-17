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
import { AdministrationDropdownUserPage } from "../../components";
import { useNavigate, useParams } from "react-router-dom";
import { api, store, config, uiText } from "../../lib";
import { Breadcrumbs, DescriptionPanel } from "../../components";
import { takeRight, dropRight } from "lodash";
import { useNotification } from "../../util/hooks";
import { AddUserTour } from "./components";

const { Option } = Select;

const descriptionData =
  " Lorem ipsum dolor sit, amet consectetur adipisicing elit. Velit amet omnis dolores. Ad eveniet ex beatae dolorum placeat impedit iure quaerat neque sit, quasi magni provident aliquam harum cupiditate iste?";

const AddUser = () => {
  const [submitting, setSubmitting] = useState(false);
  const [showAdministration, setShowAdministration] = useState(false);
  const [showForms, setShowForms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allowedForms, setAllowedForms] = useState([]);
  const [description, setDescription] = useState("");
  const [form] = Form.useForm();
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);
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
      inform_user: values.inform_user,
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
    const lookUp = authUser.role?.id === 2 ? 3 : authUser.role?.id || 4;
    return config.roles.filter((r) => r.id >= lookUp);
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
    if (a?.role === 5) {
      setShowForms(false);
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
        notify({ type: "error", message: text.errorUserLoad });
        setLoading(false);
      }
    }
  }, [id, form, forms, notify, text.errorUserLoad]);

  const roleDescription = (e) => {
    const role = config.roles.filter((data) => data.id === e);
    setDescription(role[0].description);
    if (e === 2) {
      if (administration.length === 3) {
        store.update((s) => {
          s.administrationLevel = null;
          s.administration = dropRight(administration, 1);
        });
      } else if (administration.length === 4) {
        store.update((s) => {
          s.administrationLevel = null;
          s.administration = dropRight(administration, 2);
        });
      }
    }
  };
  return (
    <div id="add-user">
      <Row justify="space-between">
        <Col>
          <Row justify="space-between">
            <Breadcrumbs pagePath={pagePath} />
            <AddUserTour />
          </Row>
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
            <Form.Item
              name="role"
              label="Role"
              rules={[{ required: true, message: text.valRole }]}
            >
              <Select
                getPopupContainer={(trigger) => trigger.parentNode}
                placeholder="Select one.."
                onChange={roleDescription}
              >
                {allowedRole.map((r, ri) => (
                  <Option key={ri} value={r.id}>
                    {r.name}
                    <span className="opt-desc">{r.description}</span>
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <span className="role-description">
              {description ? description : ""}
            </span>
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
                          authUser.role.value === "County Admin"
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
                <AdministrationDropdownUserPage
                  direction="vertical"
                  withLabel={true}
                  persist={true}
                  size="large"
                  width="100%"
                  role={form.getFieldValue("role")}
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
