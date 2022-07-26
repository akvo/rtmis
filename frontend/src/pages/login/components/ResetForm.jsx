import React, { useState, useMemo } from "react";
import { Form, Input, Button } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { api, store, uiText } from "../../../lib";
import { useNotification } from "../../../util/hooks";

const ResetForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { notify } = useNotification();
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const onFinish = (values) => {
    setLoading(true);
    api
      .post("user/forgot-password", {
        email: values.email,
      })
      .then(() => {
        notify({
          type: "success",
          message: text.instructionsMailed,
        });
        navigate("/login");
      })
      .catch((err) => {
        if (err?.response?.status === 401 || err?.response?.status === 400) {
          notify({
            type: "error",
            message: err.response.data?.message,
          });
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Form
      name="login-form"
      layout="vertical"
      initialValues={{
        email: "",
      }}
      onFinish={onFinish}
    >
      <Form.Item
        name="email"
        label="Email Address"
        rules={[
          {
            type: "email",
            required: true,
            message: text.valEmail,
          },
        ]}
      >
        <Input
          prefix={<UserOutlined className="site-form-item-icon" />}
          placeholder="Email"
        />
      </Form.Item>
      <Form.Item style={{ marginTop: 8 }}>
        <Button type="primary" htmlType="submit" loading={loading}>
          {text.sendInstructions}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ResetForm;
