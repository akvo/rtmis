import React, { useState } from "react";
import { Form, Input, Button } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { api, store, config } from "../../../lib";
import { getFormUrl } from "../../../util/form";
import { useNotification } from "../../../util/hooks";

const ResetForm = () => {
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
        store.update((s) => {
          s.isLoggedIn = true;
          s.user = { ...res.data, role_detail: role_details };
        });
        Promise.all([api.get(getFormUrl(role_details)), api.get("levels")])
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
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Send Instructions
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ResetForm;
