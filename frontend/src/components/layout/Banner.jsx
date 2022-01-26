import React from "react";
import { Row, Col, Button } from "antd";
import backgroundImage from "../../assets/banner.png";

const styles = {
  banner: {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  },
};

const Banner = () => {
  return (
    <div style={styles.banner}>
      <Row className="banner">
        <Col span={20}>
          <h1>
            Welcome to the National
            <br />
            Sanitation and Hygiene
            <br />
            Real-Time Monitoring System
            <br />
            <small>
              Updated estimates for WASH in households accross Kenya
            </small>
          </h1>
          <Button size="large" ghost>
            Explore the Data
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default Banner;
