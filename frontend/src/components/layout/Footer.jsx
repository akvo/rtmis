import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Row, Col } from "antd";
import { useLocation } from "react-router-dom";
import { uiText, store, config } from "../../lib";

const Footer = ({ className = "footer", ...props }) => {
  const location = useLocation();
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);
  if (location.pathname.includes("/report/")) {
    return "";
  }
  return (
    <div className={className}>
      <Row align="top" justify="space-between" {...props}>
        <Col lg={8} className="about-wrapper">
          <img
            className="small-logo"
            src={config.siteLogo}
            alt={config.siteLogo}
          />
          <p>{text?.footerAboutDescription}</p>
          <p>{text?.footerDonorSupport}</p>
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
                style={{ paddingLeft: 3 }}
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
                style={{ paddingLeft: 3 }}
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
        <Col>
          <ul className="list-inline">
            {text.footerLegalLinkItems.map((x, xi) => (
              <li key={`lgl-link-${xi}`}>
                <a target="_blank" rel="noreferrer" href={x.url}>
                  {x.text}
                </a>
              </li>
            ))}
          </ul>
        </Col>
        <Col>{text?.copyright}</Col>
      </Row>
    </div>
  );
};

Footer.propTypes = {
  className: PropTypes.string,
};

export default Footer;
