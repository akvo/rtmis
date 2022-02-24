import React from "react";
import "./style.scss";
import Countdown from "react-countdown";
import { Row, Col } from "antd";

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
    <div className="coming-soon">
      <h2>Launching in:</h2>
      <div className="countdown-wrap">
        <Countdown date="2022-07-01" renderer={renderer} />
      </div>
    </div>
  );
};

export default ComingSoon;
