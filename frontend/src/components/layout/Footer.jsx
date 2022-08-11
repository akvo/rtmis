import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Row, Col } from "antd";
import { useLocation } from "react-router-dom";
import { uiText, store } from "../../lib";

window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      onchange: null,
      addListener: function () {},
      removeListener: function () {},
      addEventListener: function () {},
      removeEventListener: function () {},
      dispatchEvent: function () {},
    };
  };

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
        <Col span={8}>
          <h2>{text?.footerAboutTitle}</h2>
          <p>{text?.footerAboutDescription}</p>
        </Col>
        <Col span={4}>
          <h2>{text?.footerExternalLinkTitle}</h2>
          {!!text?.footerExternalLinkItems && (
            <ul>
              {text.footerExternalLinkItems.map((x, xi) => (
                <li key={`ext-link-${xi}`}>
                  <a target="_blank" rel="noreferrer" href={x.url}>
                    {x.text}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Col>
        <Col span={4}>
          <h2>{text?.footerResourcesTitle}</h2>
          {!!text?.footerResourcesItems && (
            <ul>
              {text.footerResourcesItems.map((x, xi) => (
                <li key={`ext-link-${xi}`}>
                  <a target="_blank" rel="noreferrer" href={x.url}>
                    {x.text}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Col>
        <Col span={6}>
          <h2>{text?.footerContactTitle}</h2>
          <p>{text?.footerContactAddress}</p>
          <ul>
            <li>
              Phone:
              <a
                target="_blank"
                rel="noreferrer"
                href={`tel:${text?.footerContactPhone}`}
              >
                {text?.footerContactPhone}
              </a>
            </li>
            <li>
              Email:
              <a
                target="_blank"
                rel="noreferrer"
                href={`mailto:${text?.footerContactEmail}`}
              >
                {text?.footerContactEmail}
              </a>
            </li>
            {/*
            <li>
              <a
                className="ant-btn ant-btn-sm ant-btn-ghost"
                target="_blank"
                rel="noreferrer"
                href={text?.footerContactFeedback?.url}
              >
                <b>{text?.footerContactFeedback?.text}</b>
              </a>
            </li>
            */}
          </ul>
        </Col>
      </Row>
      <Row className="end" align="top" justify="space-between" {...props}>
        <Col>{text?.copyright}</Col>
        <Col>
          <a href="https://www.akvo.org" target="_blank" rel="noreferrer">
            Akvo
          </a>
        </Col>
      </Row>
    </div>
  );
};

Footer.propTypes = {
  className: PropTypes.string,
};

export default Footer;
