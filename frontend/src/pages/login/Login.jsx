import React, { useEffect } from "react";
import "./style.scss";
import { Row, Col } from "antd";
import LoginForm from "./LoginForm";
import RegistrationForm from "./RegistrationForm";
import { Link, useParams, useNavigate } from "react-router-dom";
import backgroundImage from "../../assets/banner.png";
import { api, config, store } from "../../lib";

const styles = {
  side: {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  },
};

const Login = (props) => {
  const navigate = useNavigate();
  const { invitationId } = useParams();

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/control-center");
    }
  });

  if (invitationId != null) {
    api
      .post("v1/verify/invite/", { invite: invitationId })
      .then((res) => {
        let userData = {
          name: res.data.name,
          invite: invitationId,
        };
        store.update((s) => {
          s.user = userData;
        });
      })
      .catch((err) => {
        console.error(err.response.data.message);
      });
  }

  // TODO: Check invitation ID to Server using API
  let { isLoggedIn, user } = store.useState();
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
          <h1>
            Welcome{" "}
            {invitationId
              ? "to RTMIS " + (user != null ? user.name : "")
              : "Back"}
            <br />
            <small>
              {invitationId
                ? "Set your own password including the following criteria"
                : "Please enter your account details"}
            </small>
          </h1>
          {invitationId ? <RegistrationForm /> : <LoginForm />}
        </Col>
      </Row>
    </div>
  );
};

export default Login;
