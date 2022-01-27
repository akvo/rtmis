import React from "react";
import PropTypes from "prop-types";
import { Row, Col, Button, Space } from "antd";
import { Link, useLocation } from "react-router-dom";
import { config } from "../../lib";

const Footer = ({ className = "footer", ...props }) => {
  const location = useLocation();
  if (location.pathname === "/login") {
    return "";
  }
  return (
    <div className={className}>
      <Row align="top" justify="space-between" {...props}>
        <Col span={6}>
          <h3>About Data</h3>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin a
            gravida arcu. Donec et tristique augue. Nullam neque magna,
            imperdiet in fermentum sit amet, sollicitudin quis sapien. Morbi
            ullamcorper tincidunt ligula, et malesuada purus.
          </p>
        </Col>
        <Col span={4}>
          <h3>Contact</h3>
          <ul>
            <li>Phone : +254 123436789</li>
            <li>Email : info@nashrtmis.co.ke</li>
          </ul>
          <Button type="primary" size="small">
            Contact Us
          </Button>
        </Col>
        <Col span={4}>
          <h3>Quick Links</h3>
          <ul>
            <li> JMP </li>
            <li> CLTS </li>
            <li> GLASS </li>
          </ul>
        </Col>
        <Col span={3}>
          <div className="footer-logo">
            <img src={config.siteLogo} alt={config.siteLogo} />
            <h3>MOH</h3>
          </div>
        </Col>
      </Row>
      <Row className="end" align="top" justify="space-between" {...props}>
        <Col>Copyright 2021</Col>
        <Col>
          <Space>
            <Link to="/">Terms of Service</Link>
            <Link to="/">Privacy Policy</Link>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

Footer.propTypes = {
  className: PropTypes.string,
};

export default Footer;
