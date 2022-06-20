import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Row, Col } from "antd";
import { useLocation } from "react-router-dom";
import { uiText, store } from "../../lib";

const Footer = ({ className = "footer", ...props }) => {
  const location = useLocation();
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);
  if (
    location.pathname.includes("/login") ||
    location.pathname.includes("/report/")
  ) {
    return "";
  }
  return (
    <div className={className}>
      <Row align="top" justify="space-between" {...props}>
        <Col span={6}>
          <h3>{text?.footer1Title}</h3>
          <p>{text?.footer1Text}</p>
        </Col>
        <Col span={6}>
          <h3>{text?.footer2Title}</h3>
          <ul>
            <li>
              <a
                target="_blank"
                rel="noreferrer"
                href="https://docs.google.com/forms/d/e/1FAIpQLSf5rjD66CCcMWYgFwkNp8Xb1lRJoec1CwhhPnjOd-mU84ktPA/viewform"
              >
                <b>Feedback Form</b>
              </a>
            </li>
          </ul>
        </Col>
        <Col span={4}>
          <h3>{text?.footer3Title}</h3>
          <ul>
            <li>
              <a target="_blank" rel="noreferrer" href={text?.footer3Link1}>
                {text?.footer3Text1}
              </a>
            </li>
            <li>
              <a target="_blank" rel="noreferrer" href={text?.footer3Link2}>
                {text?.footer3Text2}
              </a>
            </li>
            <li>
              <a target="_blank" rel="noreferrer" href={text?.footer3Link3}>
                {text?.footer3Text3}
              </a>
            </li>
          </ul>
        </Col>
      </Row>
      <Row className="end" align="top" justify="space-between" {...props}>
        <Col>{text?.copyright}</Col>
      </Row>
    </div>
  );
};

Footer.propTypes = {
  className: PropTypes.string,
};

export default Footer;
