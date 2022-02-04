import React from "react";
import { Form, Input, Button, Checkbox } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { api, store } from "../../lib";

const LoginForm = () => {
  const navigate = useNavigate();
  const onFinish = (values) => {
    let url = `v1/login/`;
    let postData = {
      email: values.email,
      password: values.password,
    };
    api
      .post(url, postData, { credentials: "include" })
      .then((res) => {
        api.setToken(res.data.token);
        let userData = {
          name: res.data.name,
          email: res.data.email,
          invite: res.data.invite,
        };
        // TODO: Refresh token
        store.update((s) => {
          s.isLoggedIn = true;
          s.user = userData;
        });
        navigate("/control-center");
      })
      .catch((err) => {
        console.error(err.response.data.message);
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
        rules={[
          {
            required: true,
            message: "Please input your Password!",
          },
        ]}
      >
        <Input.Password
          prefix={<LockOutlined className="site-form-item-icon" />}
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
        <Button type="primary" htmlType="submit">
          Log in
        </Button>
      </Form.Item>
    </Form>
  );
};

export default LoginForm;
