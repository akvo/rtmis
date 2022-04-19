import React from "react";
import PropTypes from "prop-types";
import { Row, Col, Space, Button, Menu, Dropdown } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { config, store } from "../../lib";

const Header = ({ className = "header", ...props }) => {
  const { isLoggedIn, user } = store.useState();
  const [cookies, removeCookie] = useCookies(["AUTH_TOKEN"]);
  const navigate = useNavigate();
  const location = useLocation();

  const signOut = async () => {
    store.update((s) => {
      if (cookies["AUTH_TOKEN"]) {
        removeCookie("AUTH_TOKEN", "");
      }
      s.isLoggedIn = false;
      s.user = null;
    });
    navigate("login");
  };

  const userMenu = (
    <Menu>
      {config.checkAccess(user?.role_detail, "control-center") && (
        <Menu.Item key="controlCenter">
          <Link to="/control-center">Control Center</Link>
        </Menu.Item>
      )}
      <Menu.Item key="profile">
        <Link to="/profile">My Profile</Link>
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

  if (
    location.pathname.includes("/login") ||
    location.pathname.includes("/forgot-password")
  ) {
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
          <Link className="dev" to="/data/visualisation">
            Data
          </Link>
          <a className="dev">Reports</a>
          <a className="dev">Monitoring</a>
          <Link className="dev" to="/how-we-work">
            How We Work
          </Link>
          <Link className="dev" to="/news-events">
            News {"&"} Events
          </Link>
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
              {user?.name || ""}
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
