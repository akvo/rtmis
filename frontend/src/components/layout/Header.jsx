import React, { useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { Row, Col, Space, Button, Dropdown } from "antd";
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
  const dashboards = window?.powerBIDashboard;

  const signOut = useCallback(async () => {
    eraseCookieFromAllPaths("AUTH_TOKEN");
    store.update((s) => {
      s.isLoggedIn = false;
      s.user = null;
    });
    navigate("login");
  }, [navigate]);

  const accessUserMenu = useMemo(() => {
    const userMenu = [
      {
        key: "controlCenter",
        label: (
          <Link
            key="controlCenter"
            className="usermenu-menu-item"
            to="/control-center"
          >
            {text?.controlCenter}
          </Link>
        ),
      },
      {
        key: "profile",
        label: (
          <Link
            key="profile"
            className="usermenu-menu-item"
            to="/control-center/profile"
          >
            {text?.myProfile}
          </Link>
        ),
      },
      {
        key: "signOut",
        danger: true,
        label: (
          <a
            key="signOut"
            className="usermenu-menu-item"
            onClick={() => {
              signOut();
            }}
          >
            {text?.signOut}
          </a>
        ),
      },
    ];
    if (!config.checkAccess(user?.role_detail, "control-center")) {
      return userMenu.filter((menu) => menu.key !== "controlCenter");
    }
    return userMenu;
  }, [text, user, signOut]);

  const DashboardMenu = useMemo(() => {
    return dashboards?.map((d) => {
      return {
        key: d.name,
        label: (
          <Link
            key={`${d.name}`}
            to={`/${d.page}/${d.path}`}
            className="dropdown-menu-item"
          >
            {d.name}
          </Link>
        ),
      };
    });
  }, [dashboards]);

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
              <Dropdown menu={{ items: DashboardMenu }}>
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
              {/* <a className="dev">Monitoring</a> */}
              {/* <Link className="dev" to="/how-we-work">
              How We Work
            </Link> */}
              {/* <Link className="dev" to="/news-events">
                {text?.newsEvents}
              </Link> */}
            </Space>
          </div>
          <div className="account">
            {isLoggedIn ? (
              <Dropdown menu={{ items: accessUserMenu }}>
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
                <Button type="primary" shape="round">
                  {text?.login}
                </Button>
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
