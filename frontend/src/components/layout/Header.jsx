import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Row, Col, Space, Button, Menu, Dropdown } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaChevronDown } from "react-icons/fa";
import { config, store, uiText } from "../../lib";
import { eraseCookieFromAllPaths } from "../../util/date";

const VerticalLine = () => (
  <svg
    width="4"
    height="46"
    viewBox="0 0 4 51"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      width="4"
      height="16.6667"
      transform="matrix(-1 0 0 1 4 0.5)"
      fill="black"
    />
    <rect
      width="4"
      height="16.6667"
      transform="matrix(-1 0 0 1 4 17.1665)"
      fill="#BE0000"
    />
    <rect
      width="4"
      height="16.6667"
      transform="matrix(-1 0 0 1 4 33.8335)"
      fill="#006818"
    />
    <rect
      width="4"
      height="2.38095"
      transform="matrix(-1 0 0 1 4 16.373)"
      fill="white"
    />
    <rect
      width="4"
      height="2.38095"
      transform="matrix(-1 0 0 1 4 33.0396)"
      fill="white"
    />
  </svg>
);

const Header = ({ className = "header", ...props }) => {
  const { isLoggedIn, user } = store.useState();
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);
  const dashboards = window?.dashboard;
  const reports = window?.reports;

  const signOut = async () => {
    eraseCookieFromAllPaths("AUTH_TOKEN");
    store.update((s) => {
      s.isLoggedIn = false;
      s.user = null;
    });
    navigate("login");
  };

  const userMenu = (
    <Menu>
      {config.checkAccess(user?.role_detail, "control-center") && (
        <Menu.Item key="controlCenter">
          <Link to="/control-center">{text?.controlCenter}</Link>
        </Menu.Item>
      )}
      <Menu.Item key="profile">
        <Link to="/profile">{text?.myProfile}</Link>
      </Menu.Item>
      <Menu.Item key="signOut" danger>
        <a
          onClick={() => {
            signOut();
          }}
        >
          {text?.signOut}
        </a>
      </Menu.Item>
    </Menu>
  );

  const DashboardMenu = (
    <Menu>
      {dashboards?.map((d) => (
        <Menu.Item key={`${d.name}`} className="dashboard-menu-item">
          <Link to={`/${d.page}/${d.form_id}`}>{d.name}</Link>
        </Menu.Item>
      ))}
    </Menu>
  );

  const ReportsMenu = (
    <Menu>
      {reports?.map((d) => (
        <Menu.Item key={`${d.name}`} className="dashboard-menu-item">
          <Link to={`/${d.page}/${d.form_id}`}>{d.name}</Link>
        </Menu.Item>
      ))}
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
      <Col>
        <div className="logo">
          <Link to="/">
            <div className="logo-wrapper">
              <img
                className="small-logo"
                src={config.siteLogo}
                alt={config.siteLogo}
              />
              <VerticalLine />
              <h1>
                {config.siteTitle}
                <small>{config.siteSubTitle}</small>
              </h1>
            </div>
          </Link>
        </div>
      </Col>
      {!location.pathname.includes("/report/") && (
        <Col>
          <div className="navigation">
            <Space>
              {/* old dashboard */}
              {/* <Link to="/data/visualisation">{text?.dashboards}</Link> */}
              <Link className="dev" to="/reports">
                {text?.reports}
              </Link>
              <Dropdown overlay={DashboardMenu}>
                <a
                  className="ant-dropdown-link"
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                >
                  {text?.dashboards}
                  <FaChevronDown />
                </a>
              </Dropdown>
              <Dropdown overlay={ReportsMenu}>
                <a
                  className="ant-dropdown-link"
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                >
                  {text?.reports}
                  <FaChevronDown />
                </a>
              </Dropdown>
              {/* <a className="dev">Monitoring</a> */}
              {/* <Link className="dev" to="/how-we-work">
              How We Work
            </Link> */}
              <Link className="dev" to="/news-events">
                {text?.newsEvents}
              </Link>
            </Space>
          </div>
          <div className="account">
            {isLoggedIn ? (
              <Dropdown overlay={userMenu}>
                <a
                  className="ant-dropdown-link"
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                >
                  {user?.name || ""}
                  <span className="role">, {user?.role?.value || ""}</span>
                  <span className="icon">
                    <UserOutlined />
                  </span>
                </a>
              </Dropdown>
            ) : (
              <Link to={"/login"}>
                <Button type="primary">{text?.login}</Button>
              </Link>
            )}
          </div>
        </Col>
      )}
    </Row>
  );
};

Header.propTypes = {
  className: PropTypes.string,
};

export default Header;
