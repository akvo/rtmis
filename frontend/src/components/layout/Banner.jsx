import React, { useMemo } from "react";
import { Row, Col, Button } from "antd";
import { Link, useLocation } from "react-router-dom";
import ComingSoon from "./custom/ComingSoon";
import Countdown from "react-countdown";
import { uiText, store } from "../../lib";

const styles = {
  banner: {
    backgroundImage: `url("/assets/banner.png")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  },
};

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

  const HomeBanner = () => {
    return (
      <>
        <h1>
          {text?.welcome}
          <br />
          <small>{text?.welcomeDesc}</small>
        </h1>
        <div className="launching">
          <h4>{text?.countdownTitle}</h4>
          <Countdown date="2022-07-15T09:00:00" renderer={renderer} />
        </div>
        <Button size="large" ghost>
          <Link to="/data/visualisation">{text?.welcomeCta}</Link>
        </Button>
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
          <Button ghost>{text?.backHome}</Button>
        </Link>
      </>
    );
  };

  const renderer = ({ days, hours, minutes, seconds, completed }) => {
    if (completed) {
      return "";
    }
    return (
      <Row align="bottom" gutter={[6, 6]}>
        <Col>
          <div>{text?.days}</div>
          <div>{days}</div>
        </Col>
        <Col>:</Col>
        <Col>
          <div>{text?.hours}</div>
          <div>{hours}</div>
        </Col>
        <Col>:</Col>
        <Col>
          <div>{text?.minutes}</div>
          <div>{minutes}</div>
        </Col>
        <Col>:</Col>
        <Col>
          <div>{text?.seconds}</div>
          <div>{seconds}</div>
        </Col>
      </Row>
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
    <div style={styles.banner}>
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
