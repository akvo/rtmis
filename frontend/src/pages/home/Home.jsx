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

const serviceContent = (text) => [
  {
    image: "service-1.svg",
    text: text.service1Text,
  },
  {
    image: "service-2.svg",
    text: text.service2Text,
  },
  {
    image: "service-3.svg",
    text: text.service3Text,
  },
];

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
      <div className="home-even highlights">
        <div className="body">
          <Row justify="space-evenly">
            {serviceContent(text).map((s, si) => (
              <Col key={`service-${si}`} span={6}>
                <Space size="middle">
                  <div
                    style={{
                      backgroundColor: "#E8EEF8",
                      padding: "18px",
                      borderRadius: "50px",
                    }}
                  >
                    <img
                      src={`/assets/services/${s.image}`}
                      alt={s.text}
                      style={{
                        width: "32px",
                        height: "32px",
                      }}
                    />
                  </div>
                  <div style={{ fontSize: "14px" }}>{s.text}</div>
                </Space>
              </Col>
            ))}
          </Row>
        </div>
      </div>
      <div className="home-odd about">
        <Row>
          <Col span={10}>
            <h1>{text.aboutRush}</h1>
          </Col>
          <Col span={14}>
            <p>{text.aboutText}</p>
            {/*
            <Button type="link">{text.learnMoreButton}</Button>
            <h1>Partners</h1>
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
          <Row gutter={24} justify="space-between">
            <Col lg={10}>
              <div className="report-wrapper">
                <div className="description">
                  <h1>{text.realTime}</h1>
                  <p>{text.aboutText}</p>
                </div>
                <ul>
                  <li className="inline">
                    <Space align="center">
                      <FiCheckCircle />
                      <span>{text.frameworkText}</span>
                    </Space>
                  </li>
                  <li className="inline">
                    <Space align="center">
                      <FiCheckCircle />
                      <span>{text.reportText}</span>
                    </Space>
                  </li>
                </ul>
                {/*
                <Button type="primary" shape="round">
                  {text.welcomeCta}
                </Button>
                */}
              </div>
            </Col>
            <Col lg={14}>
              <div className="report-visual-wrapper">
                <img
                  src={"/assets/rtmis-girl-washing-her-hands.png"}
                  alt="Girl washing her hands"
                  style={{
                    webkitTransform: "scaleX(-1)",
                    transform: "scaleX(-1)",
                    marginRight: "-50px",
                    maxWidth: "820px",
                  }}
                />
              </div>
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
        </div>
      </div>
      <div className="home-odd contact">
        <h2>{text.contactText}</h2>
        <Row align="middle" justify="center">
          <Space direction="vertical" align="center">
            <h3>{text.contactDesText}</h3>
            <Button
              shape="round"
              type="primary"
              onClick={() => {
                store.update((s) => {
                  s.showContactFormModal = true;
                });
              }}
            >
              {text.feedbackBtn}
            </Button>
          </Space>
        </Row>
      </div>
      <ContactForm />
    </div>
  );
};

export default React.memo(Home);
