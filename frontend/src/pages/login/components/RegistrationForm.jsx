import React, { useState } from "react";
import { Form, Input, Button, Checkbox } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { api, store, config } from "../../../lib";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../../util/hooks";

const checkBoxOptions = [
  { name: "Lowercase Character", re: /[a-z]/ },
  { name: "Numbers", re: /\d/ },
  {
    name: "Special Character ( -._!`'#%&,:;<>=@{}~$()*+/?[]^|] )",
    re: /[-._!`'#%&,:;<>=@{}~$()*+/?[\]^|]/,
  },
  { name: "Uppercase Character", re: /[A-Z]/ },
  { name: "No White Space", re: /^\S*$/ },
  { name: "Minimum 8 Character", re: /(?=.{8,})/ },
];
const RegistrationForm = (props) => {
  const { invite } = props;
  const [checkedList, setCheckedList] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { notify } = useNotification();

  const onFinish = (values) => {
    const postData = {
      invite,
      password: values.password,
      confirm_password: values.confirm,
    };
    setLoading(true);
    api
      .put("user/set-password", postData)
      .then((res) => {
        api.setToken(res.data.token);
        const role_details = config.roles.find(
          (r) => r.id === res.data.role.id
        );
        store.update((s) => {
          s.isLoggedIn = true;
          s.user = { ...res.data, role_detail: role_details };
          s.forms = role_details.filter_form
            ? window.forms.filter((x) => x.type === role_details.filter_form)
            : window.forms;
        });
        setLoading(false);
        notify({
          type: "success",
          message: "Password updated successfully",
        });
        setTimeout(() => {
          navigate("/profile");
        }, [2000]);
      })
      .catch((err) => {
        notify({
          type: "error",
          message: err.response?.data?.message,
        });
        setLoading(false);
      });
  };

  const onChange = ({ target }) => {
    const criteria = checkBoxOptions
      .map((x) => {
        const available = x.re.test(target.value);
        return available ? x.name : false;
      })
      .filter((x) => x);
    setCheckedList(criteria);
  };

  return (
    <>
      <Checkbox.Group
        options={checkBoxOptions.map((x) => x.name)}
        value={checkedList}
      />
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
            () => ({
              validator() {
                if (checkedList.length === 6) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("False Password Criteria"));
              },
            }),
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
              message: "Please Confirm Password!",
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
          <Button type="primary" htmlType="submit" loading={loading}>
            Set New Password
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default RegistrationForm;
