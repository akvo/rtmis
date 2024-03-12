import React, { useEffect, useState, useMemo } from "react";
import "./style.scss";
import { Row, Col, Spin } from "antd";
import { LoginForm, RegistrationForm, ResetForm } from "./components";
import { ContactForm } from "../../components";
import { useParams } from "react-router-dom";
import { api, store, uiText } from "../../lib";

const ContactUsText = () => (
  <p className="contact-text">
    Please enter your account details <br /> Having trouble accessing the
    platform? Please{" "}
    <a
      href="#"
      onClick={() => {
        store.update((s) => {
          s.showContactFormModal = true;
        });
      }}
    >
      contact
    </a>
    .
  </p>
);

const Login = () => {
  const { invitationId } = useParams();
  const [invitedUser, setInvitedUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  useEffect(() => {
    if (!location.pathname.includes("forgot-password") && invitationId) {
      setLoading(true);
      api
        .get(`invitation/${invitationId}`)
        .then((res) => {
          setInvitedUser({
            name: res.data.name,
            invite: invitationId,
          });
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [invitationId]);

  return (
    <div id="login">
      <Row className="wrapper" align="middle">
        <Col span={24} className="right-side">
          {location.pathname.includes("forgot-password") ? (
            <div className="login-form-container">
              <h1>{text.forgotTitle}</h1>
              <p className="contact-text">{text.forgotDesc}</p>
              <ResetForm />
            </div>
          ) : (
            <>
              {loading ? (
                <div className="loading-container">
                  <Spin />
                  <h2>{text.loginLoadingTex}</h2>
                </div>
              ) : (
                <>
                  {invitationId ? (
                    <div>
                      {invitedUser ? (
                        <div className="login-form-container">
                          <div className="login-content">
                            <h1 data-testid="welcome-title">
                              {text.welcomeShort}, {invitedUser.name}
                            </h1>
                            <p className="contact-text">{text.resetHint}</p>
                          </div>
                          <RegistrationForm invite={invitedUser.invite} />
                        </div>
                      ) : (
                        <div>
                          <h1>
                            {text.invalidInviteTitle}
                            <br />
                            <small>{text.invalidInviteDesc}</small>
                          </h1>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="login-form-container">
                      <img src="./logo-black.png" alt="login-logo" />
                      <div className="login-content">
                        <h1>{text.loginTitle}</h1>
                        <ContactUsText />
                      </div>
                      <LoginForm />
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </Col>
      </Row>
      <ContactForm />
    </div>
  );
};

export default Login;
