import React, { useState } from "react";
import { Form, Input, Button, Checkbox } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

const checkBoxOptions = [
  "Lowercase Character",
  "Numbers",
  "Special Characters",
];

const RegistrationForm = () => {
  const [checkedList, setCheckedList] = useState([]);
  const onFinish = (values) => {
    // TODO: PUSH TO API
    console.info("Received values of form: ", values);
  };

  const onChange = ({ target }) => {
    const lowerCase = /[a-z]/;
    const numeric = /\d/;
    const specialChars = /[-._!"`'#%&,:;<>=@{}~$()*+/?[\]^|]/;
    let criteria = [];
    if (numeric.test(target.value)) {
      criteria = ["Numbers"];
    }
    if (lowerCase.test(target.value)) {
      criteria = [...criteria, "Lowercase Character"];
    }
    if (specialChars.test(target.value)) {
      criteria = [...criteria, "Special Characters"];
    }
    setCheckedList(criteria);
  };

  return (
    <>
      <Checkbox.Group options={checkBoxOptions} value={checkedList} />
      <Form
        name="registration-form"
        layout="vertical"
        initialValues={{
          remember: true,
        }}
        onFinish={onFinish}
        onChange={onChange}
      >
        <Form.Item
          name="password"
          label="Password"
          rules={[
            {
              required: true,
              message: "Please input your Password!",
            },
          ]}
          hasFeedback
        >
          <Input.Password
            prefix={<UserOutlined className="site-form-item-icon" />}
            placeholder="Password"
          />
        </Form.Item>
        <Form.Item
          name="confirm"
          label="Confirm Password"
          dependencies={["password"]}
          hasFeedback
          rules={[
            {
              required: true,
              message: "Please input your Password!",
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error("The two passwords that you entered do not match!")
                );
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="site-form-item-icon" />}
            placeholder="Confirm Password"
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Set New Password
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default RegistrationForm;
