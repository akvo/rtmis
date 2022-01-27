import React from "react";
import "./style.scss";
import { Row, Col } from "antd";
import LoginForm from "./LoginForm";
import backgroundImage from "../../assets/banner.png";
import { config } from "../../lib";

const styles = {
  side: {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  },
};

const Login = () => {
  return (
    <div id="login">
      <div className="background" style={styles.side} />
      <div className="logo">
        <img src={config.siteLogo} alt={config.siteLogo} />
        <h1>{config.siteTitle}</h1>
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
            Welcome Back
            <br />
            <small>Please enter your account details</small>
          </h1>
          <LoginForm />
        </Col>
      </Row>
    </div>
  );
};

export default Login;
