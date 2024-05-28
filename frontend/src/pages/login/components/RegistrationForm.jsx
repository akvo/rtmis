import React, { useState, useMemo } from "react";
import { Form, Input, Button, Checkbox } from "antd";
import { api, store, config, uiText } from "../../../lib";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../../util/hooks";
import { reloadData } from "../../../util/form";

const RegistrationForm = (props) => {
  const { invite } = props;
  const [checkedList, setCheckedList] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { notify } = useNotification();
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const checkBoxOptions = [
    { name: text.passwordRule1, re: /[a-z]/ },
    { name: text.passwordRule2, re: /\d/ },
    {
      name: text.passwordRule3,
      re: /[-._!`'#%&,:;<>=@{}~$()*+/?[\]^|]/,
    },
    { name: text.passwordRule4, re: /[A-Z]/ },
    { name: text.passwordRule5, re: /^\S*$/ },
    { name: text.passwordRule6, re: /(?=.{8,})/ },
  ];
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
        const designation = config.designations.find(
          (d) => d.id === parseInt(res.data?.designation)
        );
        store.update((s) => {
          s.isLoggedIn = true;
          s.user = {
            ...res.data,
            role_detail: role_details,
            designation: designation,
          };
        });
        reloadData(res.data);
        setLoading(false);
        notify({
          type: "success",
          message: text.passwordUpdateSuccess,
        });
        setTimeout(() => {
          navigate("/control-center/profile");
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
              message: text.passwordRequired,
            },
            () => ({
              validator() {
                if (checkedList.length === 6) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error(text.passwordCriteriaError));
              },
            }),
          ]}
          hasFeedback
        >
          <Input.Password placeholder="Password" />
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
                return Promise.reject(new Error(text.passwordMatchError));
              },
            }),
          ]}
        >
          <Input.Password placeholder="Confirm Password" />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            shape="round"
          >
            Set New Password
          </Button>
        </Form.Item>
        <p className="disclaimer">{text.accountDisclaimer}</p>
      </Form>
    </>
  );
};

export default RegistrationForm;
