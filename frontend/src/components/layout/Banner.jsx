import React, { useMemo } from "react";
import { Row, Col, Button, Dropdown, Menu } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";
import ComingSoon from "./custom/ComingSoon";
import Countdown from "react-countdown";
import moment from "moment";
import { uiText, store } from "../../lib";

const Banner = () => {
  const { pathname } = useLocation();
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  if (
    pathname !== "/" &&
    pathname !== "/not-found" &&
    pathname !== "/coming-soon"
  ) {
    return "";
  }

  const renderer = ({ days, hours, minutes, seconds, completed }) => {
    if (completed) {
      return "";
    }
    const futureDate = moment().add(days, "days");
    const duration = moment.duration(futureDate.diff(moment()));
    const year = duration.years();
    const month = duration.months();
    const day = duration.days();
    return (
      <Row className="countdown" align="bottom" gutter={[6, 6]}>
        <Col className="countdown-col">
          <div className="countdown-timer">{year}</div>
          <div className="countdown-text">
            {text?.year}
            {year !== 1 && "s"}
          </div>
        </Col>
        <Col className="countdown-col">
          <div className="countdown-timer">{month}</div>
          <div className="countdown-text">
            {text?.month}
            {month !== 1 && "s"}
          </div>
        </Col>
        <Col className="countdown-col">
          <div className="countdown-timer">{day}</div>
          <div className="countdown-text">
            {text?.day}
            {day !== 1 && "s"}
          </div>
        </Col>
        <Col className="countdown-col">
          <div className="countdown-timer">{hours}</div>
          <div className="countdown-text">
            {text?.hour}
            {hours !== 1 && "s"}
          </div>
        </Col>
        <Col className="countdown-col">
          <div className="countdown-timer">{minutes}</div>
          <div className="countdown-text">
            {text?.minute}
            {minutes !== 1 && "s"}
          </div>
        </Col>
        <Col className="countdown-col">
          <div className="countdown-timer">{seconds}</div>
          <div className="countdown-text">
            {text?.second}
            {seconds !== 1 && "s"}
          </div>
        </Col>
      </Row>
    );
  };

  const HomeBanner = () => {
    /*
    const scrollToView = () => {
      const section = document.querySelector("#home-visualisation");
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    */
    const DashboardMenu = (
      <Menu>
        {window?.powerBIDashboard?.map((d) => (
          <Menu.Item
            key={`${d.name}`}
            style={{ fontSize: 16, fontStyle: "italic", padding: 10 }}
          >
            <Link to={`/${d.page}/${d.path}`}>{d.name}</Link>
          </Menu.Item>
        ))}
      </Menu>
    );
    return (
      <>
        <h1 className="welcome">{text?.welcome}</h1>
        <div className="launching">
          <h4>{text?.countdownTitle}</h4>
          <Countdown date="2030-12-31T23:59:59" renderer={renderer} />
        </div>
        <Row>
          {/*
          <Button
            type="primary"
            onClick={() => scrollToView()}
            className="btn-explore-national-data"
            shape="round"
          >
            {text?.welcomeCta}
          </Button>
          */}
          <Dropdown overlay={DashboardMenu}>
            <Button
              shape="round"
              icon={<PlusOutlined />}
              onClick={(e) => e.preventDefault()}
              className="btn-dashboard"
            >
              Comprehensive Dashboards
            </Button>
          </Dropdown>
        </Row>
      </>
    );
  };

  const ErrorBanner = ({ status, message, description }) => {
    return (
      <>
        <h1>
          {text?.error} {status}
          <br />
          <small>
            {message ||
              (status === 404
                ? text?.errorPageNA
                : status === 401
                ? text?.errorAuth
                : text?.errorUnknown)}
            <br />
            {description ||
              (status === 404
                ? text?.errorURL
                : status === 401
                ? text?.errorVerifyCreds
                : "")}
          </small>
        </h1>
        <Link to="/">
          <Button size="large">{text?.backHome}</Button>
        </Link>
      </>
    );
  };

  const ComingSoonBanner = () => {
    return (
      <>
        <h1>{text?.welcome}</h1>
        <ComingSoon />
      </>
    );
  };

  return (
    <div className="hero">
      <Row className="banner" align="middle">
        <Col span={20}>
          {pathname === "/not-found" ? (
            <ErrorBanner status={404} />
          ) : pathname === "/coming-soon" ? (
            <ComingSoonBanner />
          ) : (
            <HomeBanner />
          )}
        </Col>
      </Row>
    </div>
  );
};

export default Banner;
