import React, { useState } from "react";
import { Form, Input, Button, Checkbox } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
// import { useCookies } from "react-cookie";
import { api, store } from "../../lib";

const LoginForm = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState(null);
  // const [setCookie] = useCookies(["user"]);

  const onFinish = (values) => {
    let url = `v1/login/`;
    let postData = {
      email: values.email,
      password: values.password,
    };
    api
      .post(url, postData)
      .then((res) => {
        console.log(res.data);
        if (res.status === 200) {
          api.setToken(res.token);
          let userData = {
            name: res.data.name,
            email: res.data.email,
            invite: res.data.invite,
          };
          store.update((s) => {
            s.isLoggedIn = true;
            s.user = userData;
          });
          // let d = new Date();
          // d.setTime(d.getTime() + (minutes*60*1000));
          // setCookie("user", userData, { path: "/" });
          // TODO: Get cookie set
          navigate("/");
        } else {
          setMessage(res.message);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  };

  return (
    <>
      {message && <div className="error-message">{message}</div>}
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
    </>
  );
};

export default LoginForm;
