import React, { useRef, useEffect, useState } from "react";
import "./style.scss";
import { Modal, Button, Form, Input, Space } from "antd";
import { useNotification } from "../../util/hooks";
import { store, api } from "../../lib";

const ContactForm = () => {
  const [form] = Form.useForm();
  const submitButton = useRef();
  const { notify } = useNotification();
  const [reloadCaptcha, setReloadCaptcha] = useState(true);
  const [captchaValue, setCaptchaValue] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const showContactFormModal = store.useState((s) => s.showContactFormModal);

  useEffect(() => {
    if (reloadCaptcha) {
      const captchaNumber = document.getElementById("captcha-number");
      if (captchaNumber && captchaNumber.childNodes[0]) {
        captchaNumber.removeChild(captchaNumber.childNodes[0]);
      }
      if (captchaNumber) {
        const validatorX = Math.floor(Math.random() * 9) + 1;
        const validatorY = Math.floor(Math.random() * 9) + 1;
        const canv = document.createElement("canvas");
        canv.width = 100;
        canv.height = 50;
        const ctx = canv.getContext("2d");
        if (ctx) {
          ctx.font = "35px Assistant, sans-serif";
          ctx.textAlign = "center";
          ctx.strokeText(validatorX + "+" + validatorY, 50, 35);
        }
        setCaptchaValue(validatorX + validatorY);
        captchaNumber.appendChild(canv);
      }
      setReloadCaptcha(false);
    }
  }, [reloadCaptcha]);

  const handleOk = () => {
    submitButton.current.click();
  };

  const handleCancel = () => {
    store.update((s) => {
      s.showContactFormModal = false;
    });
    setTimeout(() => {
      form.resetFields();
      setReloadCaptcha(true);
    }, 500);
  };

  const handleOnFormFinish = (payload) => {
    setSubmitting(true);
    api
      .post("/feedback", payload)
      .then(() => {
        notify({
          type: "success",
          message: "Feedback was sent successfully.",
        });
        handleCancel();
      })
      .catch(() => {
        notify({
          type: "error",
          message: "Oops, something went wrong.",
        });
      })
      .finally(() => {
        setReloadCaptcha(true);
        setSubmitting(false);
      });
  };

  return (
    <Modal
      className="contact-form-modal"
      title="Please use this form for registering your feedback / issues."
      open={showContactFormModal}
      width={600}
      centered
      destroyOnClose
      onOk={handleOk}
      onCancel={handleCancel}
      forceRender
      footer={[
        <Button
          key="submit"
          type="primary"
          loading={submitting}
          shape="round"
          onClick={handleOk}
        >
          Send
        </Button>,
        <Button shape="round" key="back" onClick={handleCancel}>
          Cancel
        </Button>,
      ]}
    >
      <Form
        form={form}
        name="contact-form"
        layout="vertical"
        scrollToFirstError={true}
        onFinish={handleOnFormFinish}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Please input your name." }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: "Please input your email." }]}
          >
            <Input type="email" />
          </Form.Item>
          <Form.Item
            label="Message"
            name="message"
            rules={[{ required: true, message: "Please input your message." }]}
          >
            <Input.TextArea rows={5} />
          </Form.Item>
          {/* Captcha */}
          <Space size="large">
            <div id="captcha-number" />
            <Form.Item
              label="Captcha"
              name="captcha"
              rules={[
                { required: true, message: "Please input captcha." },
                () => ({
                  validator(_, value) {
                    if (!value || Number(value) === Number(captchaValue)) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Wrong captcha value."));
                  },
                }),
              ]}
            >
              <Input />
            </Form.Item>
          </Space>
          <Form.Item style={{ display: "none" }}>
            <Button type="primary" htmlType="submit" ref={submitButton}>
              Submit
            </Button>
          </Form.Item>
        </Space>
      </Form>
    </Modal>
  );
};

export default ContactForm;
