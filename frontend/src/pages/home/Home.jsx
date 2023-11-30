import React, { useEffect, useMemo } from "react";
import "./style.scss";
import { Row, Col, Space, Button, Collapse } from "antd";
import { FiCheckCircle } from "react-icons/fi";
import { ContactForm, HomeAdministrationChart } from "../../components";

import { HomeMap } from "./components";
import { queue, store, uiText } from "../../lib";
// const { TabPane } = Tabs;

// const partners = ["us-aid.png", "japan.png", "unicef.png"];
const { Panel } = Collapse;

export const Visuals = ({ current, mapValues, setMapValues }) => {
  return (
    <div>
      <div className="map-wrapper">
        {current?.maps?.form_id && (
          <HomeMap
            markerData={{ features: [] }}
            style={{ height: 532 }}
            current={current}
            mapValues={mapValues}
          />
        )}
      </div>
      <Collapse
        bordered={false}
        className="chart-collapse"
        style={{ display: "none" }}
      >
        <Panel
          header="Explore county-wise details"
          forceRender
          className="chart-panel"
        >
          <div className="chart-wrapper">
            {current?.charts?.map(
              (hc, hcI) =>
                (hc.type === "ADMINISTRATION" || hc.type === "CRITERIA") && (
                  <HomeAdministrationChart
                    key={`chart-${hc.id}-${hcI}`}
                    formId={hc.form_id}
                    setup={hc}
                    index={hcI + 1}
                    setMapValues={setMapValues}
                    identifier={current?.name}
                  />
                )
            )}
          </div>
        </Panel>
      </Collapse>
    </div>
  );
};

const Home = () => {
  // const { highlights } = window;
  // const [currentHighlight, setCurrentHighlight] = useState(highlights?.[0]);
  // const [mapValues, setMapValues] = useState([]);
  const language = store.useState((s) => s.language);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  // const onTabClick = (active) => {
  //   setCurrentHighlight(highlights.find((x) => x.name === active));
  //   queue.update((q) => {
  //     q.next = 1;
  //     q.wait = null;
  //   });
  // };

  useEffect(() => {
    queue.update((q) => {
      q.next = 1;
      q.wait = null;
    });
  }, []);

  return (
    <div id="home">
      <div className="home-odd about">
        <Row>
          <Col span={10}>
            <h1>About RUSH</h1>
          </Col>
          <Col span={14}>
            <p>
              The Kenya Rural Urban Sanitation and Hygiene (RUSH) platform is a
              real-time monitoring and information system owned by the Ministry
              of Health. The platform aggregates quantitative and qualitative
              data from county and national levels and facilitates data
              analysis, report generation and visualizations.
            </p>
            <Button type="link">Learn more</Button>
            {/* <h1>Partners</h1>
            <Row align="middle" justify="center" style={{ marginTop: "24px" }}>
              <Space size={50} align="center">
                {partners.map((p) => (
                  <Image
                    key={p}
                    alt={p}
                    src={`/assets/partners/${p}`}
                    width={160}
                    preview={false}
                  />
                ))}
              </Space>
            </Row> */}
          </Col>
        </Row>
      </div>
      <div className="home-even highlights">
        <div className="body">
          <Row justify="space-between">
            <Col lg={10}>
              <div className="report-wrapper">
                <div className="description">
                  <h1>Real Time Management Information System</h1>
                  <p>
                    The Kenya Rural Urban Sanitation and Hygiene (RUSH) platform
                    is a real-time monitoring and information system owned by
                    the Ministry of Health. The platform aggregates quantitative
                    and qualitative data from county and national levels and
                    facilitates data analysis, report generation and
                    visualizations.
                  </p>
                </div>
                <ul>
                  <li>
                    <FiCheckCircle />
                    <span>Report generation and visualizations.</span>
                  </li>
                </ul>
                <Button type="primary">{text.welcomeCta}</Button>
              </div>
            </Col>
            <Col lg={8}>
              <img
                src={"/assets/rtmis-girl-washing-her-hands.png"}
                alt="Girl washing her hands"
              />
            </Col>
          </Row>
        </div>
        <div className="body" id="home-visualisation">
          {/* <Tabs
            defaultActiveKey={highlights?.[0]?.name}
            onTabClick={onTabClick}
            centered
          >
            {highlights?.map((highlight) => (
              <TabPane tab={highlight.name} key={highlight.name}>
                <p className="highlight-title">{highlight.description}</p>
              </TabPane>
            ))}
          </Tabs>
          <Visuals
            current={currentHighlight}
            mapValues={mapValues}
            setMapValues={setMapValues}
          /> */}
          {/* TODO Visualisation */}
          <div className="todo-visualisation">
            <em>The Visualisation will be here</em>
          </div>
        </div>
      </div>
      <div className="home-odd contact">
        <h1>Contact Us</h1>
        <Row align="middle">
          <Space direction="vertical">
            <h3>Get in touch with us for support or feedback.</h3>
            <Button
              type="primary"
              onClick={() => {
                store.update((s) => {
                  s.showContactFormModal = true;
                });
              }}
            >
              Send Feedback
            </Button>
          </Space>
        </Row>
      </div>
      <ContactForm />
    </div>
  );
};

export default React.memo(Home);
