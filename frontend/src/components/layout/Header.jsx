import React from "react";
import PropTypes from "prop-types";
import { Row, Col, Space, Button } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";
import { config, store } from "../../lib";

const Header = ({ className = "header", ...props }) => {
  const { isLoggedIn } = store.useState();
  const location = useLocation();
  if (location.pathname.includes("/login")) {
    return "";
  }
  return (
    <Row
      className={className}
      align="middle"
      justify="space-between"
      {...props}
    >
      <Col className="logo">
        <Link to="/">
          <img src={config.siteLogo} alt={config.siteLogo} />
          <h1>{config.siteTitle}</h1>
        </Link>
      </Col>
      <Col className="navigation">
        <Space>
          <Link to="/">Data</Link>
          <Link to="/">Reports</Link>
          <Link to="/">Monitoring</Link>
          <Link to="/">How We Work</Link>
        </Space>
      </Col>
      <Col className="menu">
        {isLoggedIn ? (
          <Link to={"/"}>
            John Doe
            <span className="icon">
              <UserOutlined />
            </span>
          </Link>
        ) : (
          <Link to={"/login"}>
            <Button type="primary" size="small">
              Log in
            </Button>
          </Link>
        )}
      </Col>
    </Row>
  );
};

Header.propTypes = {
  className: PropTypes.string,
};

export default Header;
