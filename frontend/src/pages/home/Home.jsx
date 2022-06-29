import React, { useState } from "react";
import "./style.scss";
import { Tabs } from "antd";
import {
  HomeDataChart,
  HomeAdministrationChart,
  HomeMap,
} from "../../components";
const { TabPane } = Tabs;

const Visuals = ({ current, nextCall, setNextCall }) => {
  return (
    <div>
      <div className="map-wrapper">
        {current?.maps && (
          <HomeMap
            markerData={{ features: [] }}
            style={{ height: 600 }}
            current={current}
          />
        )}
      </div>
      <div className="chart-wrapper">
        {current?.charts?.map((hc, hcI) =>
          hc.type === "ADMINISTRATION" || hc.type === "CRITERIA" ? (
            <HomeAdministrationChart
              key={`chart-${hc.id}-${hcI}`}
              formId={hc.form_id}
              config={hc}
              runNow={nextCall === hcI}
              nextCall={() => setNextCall(hcI + 1)}
            />
          ) : (
            <HomeDataChart
              key={`chart-${hc.form_id}-${hcI}`}
              formId={hc.form_id}
              config={hc}
              runNow={nextCall === hcI}
              nextCall={() => setNextCall(hcI + 1)}
            />
          )
        )}
      </div>
    </div>
  );
};

const Home = () => {
  const { highlights } = window;
  const [currentHighlight, setCurrentHighlight] = useState(highlights?.[0]);
  const [nextCall, setNextCall] = useState(0);

  const onTabClick = (active) => {
    setCurrentHighlight(highlights.find((x) => x.name === active));
    setNextCall(0);
  };

  return (
    <div id="home">
      <div className="home-odd about">
        <h1>About RUSH</h1>
        <p>
          The Kenya Rural Urban Sanitation and Hygiene (RUSH) platform is a
          real-time monitoring and information system owned by the Ministry of
          Health. The platform aggregates quantitative and qualitative data from
          county and national levels and facilitates data analysis, report
          generation and visualizations.
        </p>
      </div>
      <div className="home-even highlights">
        <div className="body">
          <Tabs
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
            nextCall={nextCall}
            setNextCall={setNextCall}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(Home);
