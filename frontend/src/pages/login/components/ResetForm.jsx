import React, { useState } from "react";
import { Form, Input, Button, message } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { api, store } from "../../../lib";

const ResetForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = (values) => {
    setLoading(true);
    api
      .post("login/", {
        email: values.email,
        password: values.password,
      })
      .then((res) => {
        api.setToken(res.data.token);
        store.update((s) => {
          s.isLoggedIn = true;
          s.user = res.data;
        });
        api
          .get("forms/", {
            headers: { Authorization: `Bearer ${res.data.token}` },
          })
          .then((res) => {
            store.update((s) => {
              s.forms = res.data;
            });
            setLoading(false);
            navigate("/profile");
          })
          .catch((err) => {
            setLoading(false);
            console.error(err);
            navigate("/profile");
          });
      })
      .catch((err) => {
        if (err.response.status === 401 || err.response.status === 400) {
          setLoading(false);
          message.error(err.response.data.message);
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
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Send Instructions
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ResetForm;
