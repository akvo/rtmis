import React, { useState } from "react";
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
import { useNavigate } from "react-router-dom";
import { api, store, config } from "../../lib";
import { Breadcrumbs } from "../../components";
import { takeRight } from "lodash";
import { useNotification } from "../../util/hooks";

const { Option } = Select;

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
    title: "Add User",
  },
];

const AddUser = () => {
  const [submitting, setSubmitting] = useState(false);
  const [showAdministration, setShowAdministration] = useState(false);
  const [form] = Form.useForm();
  const { user: authUser, administration } = store.useState((s) => s);
  const navigate = useNavigate();
  const { notify } = useNotification();

  const onFinish = (values) => {
    setSubmitting(true);
    const admin = takeRight(administration, 1)?.[0];
    api
      .post("user/", {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        administration: admin.id,
        role: values.role,
      })
      .then(() => {
        notify({
          type: "success",
          message: "User added",
        });
        setSubmitting(false);
        navigate("/users");
      })
      .catch((err) => {
        notify({
          type: "error",
          message: err.response?.data?.message || "User could not be added",
        });
        setSubmitting(false);
      });
  };

  const onChange = (a) => {
    if (a?.role === authUser.role.id) {
      setShowAdministration(false);
    } else {
      setShowAdministration(true);
    }
  };

  const allowedRole = config.roles.filter((r) => r.id >= authUser.role.id);

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
          email: "",
          role: null,
          county: null,
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
              name="organization"
              label="Organization"
              rules={[{ required: false }]}
            >
              <Select disabled placeholder="Select one.." allowClear>
                <Option value="1">MOH</Option>
                <Option value="2">UNICEF</Option>
              </Select>
            </Form.Item>
          </div>
          <div className="form-row">
            <Form.Item
              name="role"
              label="Role"
              rules={[{ required: true, message: "Please select a Role" }]}
            >
              <Select placeholder="Select one..">
                {allowedRole.map((r, ri) => (
                  <Option key={ri} value={r.id}>
                    {r.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          {showAdministration && (
            <div className="form-row-adm">
              <AdministrationDropdown
                direction="vertical"
                withLabel={true}
                size="large"
                width="100%"
              />
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
              Add User
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default AddUser;
