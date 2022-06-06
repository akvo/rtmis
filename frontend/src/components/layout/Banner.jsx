import React from "react";
import { Row, Col, Button } from "antd";
import { Link, useLocation } from "react-router-dom";
import ComingSoon from "./custom/ComingSoon";
import Countdown from "react-countdown";

const styles = {
  banner: {
    backgroundImage: `url("/assets/banner.png")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  },
};
const renderer = ({ days, hours, minutes, seconds, completed }) => {
  if (completed) {
    return "";
  }
  return (
    <Row align="bottom" gutter={[6, 6]}>
      <Col>
        <div>Days</div>
        <div>{days}</div>
      </Col>
      <Col>:</Col>
      <Col>
        <div>Hours</div>
        <div>{hours}</div>
      </Col>
      <Col>:</Col>
      <Col>
        <div>Minutes</div>
        <div>{minutes}</div>
      </Col>
      <Col>:</Col>
      <Col>
        <div>Seconds</div>
        <div>{seconds}</div>
      </Col>
    </Row>
  );
};

const HomeBanner = () => {
  return (
    <>
      <h1>
        Welcome to the Rural Urban
        <br />
        Sanitation and Hygiene (RUSH)
        <br />
        monitoring platform
        <br />
        <small>Updated sanitation and hygiene estimates across Kenya</small>
      </h1>
      <div className="launching">
        <h4>Launching in:</h4>
        <Countdown date="2022-07-01" renderer={renderer} />
      </div>
      <Button size="large" ghost>
        <Link to="/data/visualisation">Explore the Data</Link>
      </Button>
    </>
  );
};

const ErrorBanner = ({ status, message, description }) => {
  return (
    <>
      <h1>
        Error {status}
        <br />
        <small>
          {message ||
            (status === 404
              ? "Oops this page is not available"
              : status === 401
              ? "You are not authorised to access this page"
              : "An unknown error occurred")}
          <br />
          {description ||
            (status === 404
              ? "Please check the URL again or let us take you back to the RTMIS homepage"
              : status === 401
              ? "Please verify your credentials for the requested resource"
              : "")}
        </small>
      </h1>
      <Link to="/">
        <Button ghost>Back to Homepage</Button>
      </Link>
    </>
  );
};

const ComingSoonBanner = () => {
  return (
    <>
      <h1>
        Welcome to the National
        <br />
        Sanitation and Hygiene
        <br />
        Real-Time Monitoring System
      </h1>
      <ComingSoon />
    </>
  );
};

const Banner = () => {
  const { pathname } = useLocation();

  if (
    pathname !== "/" &&
    pathname !== "/not-found" &&
    pathname !== "/coming-soon"
  ) {
    return "";
  }

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
