import React from "react";
import PropTypes from "prop-types";
import { Row, Col } from "antd";
import { useLocation } from "react-router-dom";

const Footer = ({ className = "footer", ...props }) => {
  const location = useLocation();
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
          <h3>About Data</h3>
          <p>
            The data contained in the RUSH platform is aggregated from both
            primary and secondary data sources. The data is updated on monthly
            basis.
          </p>
        </Col>
        <Col span={6}>
          <h3>Contact</h3>
          <ul>
            <li>Phone : xxxxxxxxxx</li>
            <li>Email : xxx@gmail.com</li>
          </ul>
        </Col>
        <Col span={4}>
          <h3>Quick Links</h3>
          <ul>
            <li>
              <a
                target="_blank"
                rel="noreferrer"
                href="https://washdata.org/how-we-work/about-jmp#:~:text=Background,hygiene%20(WASH)%20since%201990"
              >
                JMP
              </a>
            </li>
            <li>
              <a
                target="_blank"
                rel="noreferrer"
                href="https://www.communityledtotalsanitation.org/country/kenya"
              >
                CLTS
              </a>
            </li>
            <li>
              <a
                target="_blank"
                rel="noreferrer"
                href="https://www.who.int/teams/environment-climate-change-and-health/water-sanitation-and-health/monitoring-and-evidence/wash-systems-monitoring/un-water-global-analysis-and-assessment-of-sanitation-and-drinking-water"
              >
                GLASS
              </a>
            </li>
          </ul>
        </Col>
      </Row>
      <Row className="end" align="top" justify="space-between" {...props}>
        <Col>Copyright 2021</Col>
      </Row>
    </div>
  );
};

Footer.propTypes = {
  className: PropTypes.string,
};

export default Footer;
