import React, { useMemo } from "react";
import "./style.scss";
import Countdown from "react-countdown";
import { Row, Col } from "antd";
import { store, uiText } from "../../../lib";

const ComingSoon = () => {
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const renderer = ({ days, hours, minutes, seconds, completed }) => {
    if (completed) {
      return "";
    }
    return (
      <Row align="bottom">
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
  return (
    <div id="coming-soon">
      <h2>{text?.countdownTitle}</h2>
      <div className="countdown-wrap">
        <Countdown date="2022-07-01" renderer={renderer} />
      </div>
    </div>
  );
};

export default ComingSoon;
