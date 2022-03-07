import React, { useState } from "react";
import { Form, Input, Button, Checkbox } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { api, store } from "../../../lib";
import { useNotification } from "../../../util/hooks";

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
        store.update((s) => {
          s.isLoggedIn = true;
          s.user = res.data;
        });
        Promise.all([api.get("forms"), api.get("levels")])
          .then((res) => {
            store.update((s) => {
              s.forms = res[0].data;
              s.levels = res[1].data;
            });
            setLoading(false);
            navigate("/profile");
          })
          .catch((e) => {
            setLoading(false);
            console.error(e);
            navigate("/profile");
          });
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
    </Form>
  );
};

export default LoginForm;
