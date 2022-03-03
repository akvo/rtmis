import React, { useEffect, useState } from "react";
import "./style.scss";
import { Row, Col, Spin } from "antd";
import { LoginForm, RegistrationForm, ResetForm } from "./components";
import { Link, useParams } from "react-router-dom";
import backgroundImage from "../../assets/banner.png";
import { api, config } from "../../lib";

const styles = {
  side: {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  },
};

const Login = () => {
  const { invitationId } = useParams();
  const [invitedUser, setInvitedUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!location.pathname.includes("forgot-password") && invitationId) {
      setLoading(true);
      api
        .get(`invitation/${invitationId}/`)
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
      <div className="background" style={styles.side} />
      <div className="logo">
        <Link to="/">
          <img src={config.siteLogo} alt={config.siteLogo} />
          <h1>{config.siteTitle}</h1>
        </Link>
      </div>
      <Row className="wrapper" align="middle">
        <Col span={12} className="left-side">
          <div className="title">
            <h1>
              Welcome to the National
              <br />
              Sanitation and Hygiene
              <br />
              Real-Time Monitoring System
            </h1>
          </div>
        </Col>
        <Col span={12} className="right-side">
          {location.pathname.includes("forgot-password") ? (
            <>
              <h1>
                Reset your password
                <br />
                <small>
                  Enter the email associated with your account and we&apos;ll
                  Send an email with instructions to reset your password
                </small>
              </h1>
              <ResetForm />
            </>
          ) : (
            <>
              {loading ? (
                <div>
                  <Spin />
                  <h2>
                    Verifying
                    <br />
                    <small>Please wait..</small>
                  </h2>
                </div>
              ) : (
                <>
                  {invitationId ? (
                    <div>
                      {invitedUser ? (
                        // TODO
                        <>
                          <h1 data-testid="welcome-title">
                            Welcome to RTMIS, {invitedUser.name}
                            <br />
                            <small>
                              Set your own password including the following
                              criteria
                            </small>
                          </h1>
                          <RegistrationForm invite={invitedUser.invite} />
                        </>
                      ) : (
                        <div>
                          <h1>
                            Invalid Invite Code
                            <br />
                            <small>
                              Lorem, ipsum dolor sit amet consectetur
                              adipisicing elit. Autem provident voluptatum cum
                              numquam, quidem vitae, qui quam beatae
                              exercitationem ullam perferendis! Nobis in aut
                              fuga voluptate harum, tempore distinctio optio.
                            </small>
                          </h1>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <h1>
                        Welcome back
                        <br />
                        <small>Please enter your account details</small>
                      </h1>
                      <LoginForm />
                    </>
                  )}
                </>
              )}
            </>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default Login;
