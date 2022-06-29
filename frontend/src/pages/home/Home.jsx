import React from "react";
import "./style.scss";
import { Tabs } from "antd";
import {
  HomeDataChart,
  HomeAdministrationChart,
  HomeMap,
} from "../../components";
const { TabPane } = Tabs;

const Home = () => {
  const { highlights } = window;

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
          <Tabs defaultActiveKey="1" centered>
            {highlights?.map((highlight, index) => (
              <TabPane tab={highlight.name} key={index + 1}>
                <p className="highlight-title">{highlight.description}</p>
                {highlight?.map && (
                  <div className="map-wrapper">
                    <HomeMap
                      markerData={{ features: [] }}
                      style={{ height: 600 }}
                      current={highlight}
                    />
                  </div>
                )}
                <div className="chart-wrapper">
                  {highlight.charts?.map((hc, hcI) =>
                    hc.type === "ADMINISTRATION" || hc.type === "CRITERIA" ? (
                      <HomeAdministrationChart
                        key={`chart-${hc.id}-${hcI}`}
                        formId={hc.form_id}
                        config={hc}
                      />
                    ) : (
                      <HomeDataChart
                        key={`chart-${hc.form_id}-${hcI}`}
                        formId={hc.form_id}
                        config={hc}
                      />
                    )
                  )}
                </div>
              </TabPane>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Home);
