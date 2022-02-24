import React from "react";
import "./style.scss";
import backgroundImage from "../../assets/banner.png";
import Countdown from "react-countdown";
import { Row, Col } from "antd";

const bgStyles = {
  wrapper: {
    backgroundImage: `url(${backgroundImage})`,
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
    <Row align="bottom">
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

const ComingSoon = () => {
  return (
    <div id="comingSoon">
      <div className="wrapper" style={bgStyles.wrapper}>
        <h1>
          Welcome to the National Sanitation and Hygiene Real Time Monitoring
          system
        </h1>
        <h2>Launching in:</h2>
        <div className="countdown-wrap">
          <Countdown date="2022-07-01" renderer={renderer} />
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
