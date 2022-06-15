import React, { useState } from "react";
import { Form, Input, Button, Checkbox, notification } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { api, store, config } from "../../../lib";
import { useNotification } from "../../../util/hooks";
import { reloadData } from "../../../util/form";

const LoginForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { notify } = useNotification();

  const onFinish = (values) => {
    setLoading(true);
    api
      .post("login", {
        email: values.email,
        password: values.password,
      })
      .then((res) => {
        api.setToken(res.data.token);
        const role_details = config.roles.find(
          (r) => r.id === res.data.role.id
        );
        if (
          res.data.forms.length === 0 &&
          role_details.name !== "Super Admin"
        ) {
          notification.open({
            message: "Please contact the administrator",
            description:
              "You don't have any form assignment, please contact the administrator",
          });
        }
        store.update((s) => {
          s.isLoggedIn = true;
          s.selectedForm = null;
          s.user = { ...res.data, role_detail: role_details };
        });
        reloadData(res.data);
        setLoading(false);
        navigate("/profile");
      })
      .catch((err) => {
        if (err.response.status === 401 || err.response.status === 400) {
          setLoading(false);
          notify({
            type: "error",
            message: err.response?.data?.message,
          });
        }
      });
  };

  return (
    <Form
      name="login-form"
      layout="vertical"
      initialValues={{
        remember: true,
      }}
      onFinish={onFinish}
    >
      <Form.Item
        name="email"
        label="Email Address"
        rules={[
          {
            required: true,
            message: "Please input your Username!",
          },
        ]}
      >
        <Input
          prefix={<UserOutlined className="site-form-item-icon" />}
          placeholder="Email"
        />
      </Form.Item>
      <Form.Item
        name="password"
        label="Password"
        disabled={loading}
        rules={[
          {
            required: true,
            message: "Please input your Password!",
          },
        ]}
      >
        <Input.Password
          prefix={<LockOutlined className="site-form-item-icon" />}
          disabled={loading}
          placeholder="Password"
        />
      </Form.Item>
      <Form.Item>
        <Form.Item name="remember" valuePropName="checked" noStyle>
          <Checkbox>Remember me</Checkbox>
        </Form.Item>
        <Link className="login-form-forgot" to="/forgot-password">
          Forgot password
        </Link>
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Log in
        </Button>
      </Form.Item>
      <p className="disclaimer">
        The user is accountable for his/her account and in case there are any
        changes (Transfers, retirement, any kind of leave, resignation etc) this
        should be communicated to the County Administrator or National Super
        Admin who might be able to assign the roles to the new officer.
      </p>
    </Form>
  );
};

export default LoginForm;
