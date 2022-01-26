import React from "react";
import PropTypes from "prop-types";
import { Row, Col, Space } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

const Header = ({ title = "Site Title", className = "header", ...props }) => {
  return (
    <Row
      className={className}
      align="middle"
      justify="space-between"
      {...props}
    >
      <Col>
        <img className="logo" src="/logo.png" />
        <h1 className="title">{title}</h1>
      </Col>
      <Col className="navigation">
        <Space>
          <Link to="/"> Data</Link>
          <Link to="/"> Reports</Link>
          <Link to="/"> Monitoring</Link>
          <Link to="/"> How We Work</Link>
        </Space>
      </Col>
      <Col className="menu">
        <a href={"/menu"}>
          John Doe
          <span className="icon">
            <UserOutlined />
          </span>
        </a>
      </Col>
    </Row>
  );
};

Header.propTypes = {
  title: PropTypes.string,
  className: PropTypes.string,
};

export default Header;
