import React from "react";
import { Row, Col, Button } from "antd";
import backgroundImage from "../../assets/banner.png";
import { Link, useLocation } from "react-router-dom";
import ComingSoon from "./custom/ComingSoon";

const styles = {
  banner: {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  },
};

const HomeBanner = () => {
  return (
    <>
      <h1>
        Welcome to the National
        <br />
        Sanitation and Hygiene
        <br />
        Real-Time Monitoring System
        <br />
        <small>Updated estimates for WASH in households accross Kenya</small>
      </h1>
      <Button size="large" ghost className="dev">
        Explore the Data
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
