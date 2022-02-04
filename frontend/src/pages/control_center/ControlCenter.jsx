import React, { useEffect } from "react";
import "./style.scss";
import { Row, Col, Card, Button } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { api, store } from "../../lib";

const datasets = [
  {
    title: "Manage Data",
    buttonLabel: "Manage Data",
    description:
      "Open defecation free (ODF) is a term used to describe communities that have shifted to using toilets instead of open defecation. This can happen, for example, after community-led total sanitation programs have been implemented.",
    link: "/",
  },
  {
    title: "Exports",
    buttonLabel: "Data Exports",
    description:
      "Community-led total sanitation (CLTS) is an approach used mainly in developing countries to improve sanitation and hygiene practices in a community. The approach tries to achieve behavior change in mainly rural people by a process of “triggering”, leading to spontaneous and long-term abandonment of open defecation practices.",
    link: "/",
  },
  {
    title: "Data Uploads",
    buttonLabel: "Data Uploads",
    description:
      "WASH is an acronym that stands for “water, sanitation and hygiene”.Universal, affordable and sustainable access to WASH is a key public health issue within international development and is the focus of the first two targets of Sustainable Development Goal 6 (SDG 6).",
    link: "/",
  },
  {
    title: "User Management",
    buttonLabel: "Manage User",
    description:
      "WASH is an acronym that stands for “water, sanitation and hygiene”.Universal, affordable and sustainable access to WASH is a key public health issue within international development and is the focus of the first two targets of Sustainable Development Goal 6 (SDG 6).",
    link: "/",
  },
];

const ControlCenter = () => {
  const { isLoggedIn } = store.useState();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  });

  const init = () => {
    // Test with an auth route here
    let url = `v1/health/check/`;
    api
      .get(url)
      .then((res) => {})
      .catch((err) => {
        console.error(err.response.data.message);
      });
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <div id="conter-center">
      <h1>Control Center</h1>
      <Row gutter={16}>
        {datasets.map((dataset, index) => (
          <Col className="card-wrapper" span={12} key={index}>
            <Card title={dataset.title} bordered={false} hoverable>
              <p>{dataset.description}</p>
              <Link to={dataset.link} className="explore">
                <Button type="primary">{dataset.buttonLabel}</Button>
              </Link>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default React.memo(ControlCenter);
