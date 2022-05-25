import React from "react";
import "./style.scss";
//import { Row, Col, Card, Button, Tabs } from "antd";
import { Tabs } from "antd";
// import { Link } from "react-router-dom";
// import { RightOutlined } from "@ant-design/icons";
// import { Map } from "../../components";
// import { geoMarker } from "../../util/geoMarker";
const { TabPane } = Tabs;

// const datasets = [
//   {
//     title: "ODF",
//     description:
//       "Open defecation free (ODF) is a term used to describe communities that have shifted to using toilets instead of open defecation. This can happen, for example, after community-led total sanitation programs have been implemented.",
//     link: "/",
//   },
//   {
//     title: "CLTS",
//     description:
//       "Community-led total sanitation (CLTS) is an approach used mainly in developing countries to improve sanitation and hygiene practices in a community. The approach tries to achieve behavior change in mainly rural people by a process of “triggering”, leading to spontaneous and long-term abandonment of open defecation practices.",
//     link: "/",
//   },
//   {
//     title: "WASH",
//     description:
//       "WASH is an acronym that stands for “water, sanitation and hygiene”.Universal, affordable and sustainable access to WASH is a key public health issue within international development and is the focus of the first two targets of Sustainable Development Goal 6 (SDG 6).",
//     link: "/",
//   },
// ];

const Home = () => {
  const { highlights } = window;

  return (
    <div id="home">
      {/* <div className="datasets">
        <h1>Datasets</h1>
        <Row gutter={16}>
          {datasets.map((dataset, index) => (
            <Col className="card-wrapper" span={8} key={index} align="center">
              <Card title={dataset.title} bordered={false} hoverable>
                <p>{dataset.description}</p>
                <Link to={dataset.link} className="read-more dev">
                  Read More
                  <RightOutlined />
                </Link>
                <Link to={dataset.link} className="explore">
                  <Button className="dev">Explore The Data</Button>
                </Link>
              </Card>
            </Col>
          ))}
        </Row>
      </div> */}
      <div className="highlights">
        <h1>Highlights</h1>
        <div className="body">
          <Tabs defaultActiveKey="1" centered className="dev">
            {highlights.map((highlight, index) => (
              <TabPane tab={highlight.name} key={index + 1}>
                {highlight.description}
              </TabPane>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Home);
