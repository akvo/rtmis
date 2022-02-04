import React from "react";
import PropTypes from "prop-types";
import { Row, Col, Space, Button, Menu, Dropdown } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { config, store } from "../../lib";

const Header = ({ className = "header", ...props }) => {
  const { isLoggedIn, user } = store.useState();
  const navigate = useNavigate();

  const signOut = async () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    store.update((s) => {
      s.isLoggedIn = false;
      s.user = null;
    });
    navigate("login");
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="controlCenter">
        <Link to="/control-center">Control Center</Link>
      </Menu.Item>
      <Menu.Item key="signOut" danger>
        <a
          onClick={() => {
            signOut();
          }}
        >
          Sign out
        </a>
      </Menu.Item>
    </Menu>
  );

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
      <Col className="account">
        {isLoggedIn ? (
          <Dropdown overlay={userMenu}>
            <a
              className="ant-dropdown-link"
              onClick={(e) => {
                e.preventDefault();
              }}
            >
              {user?.name}
              <span className="icon">
                <UserOutlined />
              </span>
            </a>
          </Dropdown>
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
