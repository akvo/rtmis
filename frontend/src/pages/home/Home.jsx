import React from "react";
import "./style.scss";
import { Tabs } from "antd";
import { HomeDataChart, HomeAdministrationChart } from "../../components";
const { TabPane } = Tabs;

const Home = () => {
  const { highlights } = window;

  return (
    <div id="home">
      <div className="home-even about">
        <h1>About RUSH</h1>
        <p>
          The Kenya Rural Urban Sanitation and Hygiene (RUSH) platform is a
          real-time monitoring and information system owned by the Ministry of
          Health. The platform aggregates quantitative and qualitative data from
          county and national levels and facilitates data analysis, report
          generation and visualizations.
        </p>
      </div>
      <div className="home-odd about">
        <h1>About the data</h1>
        <p>
          All the data contained in the RUSH platform is aggregated from both
          primary and secondary data sources from the 47 counties in Kenya. The
          data is updated on a monthly basis.
        </p>
      </div>
      <div className="home-even highlights">
        <h1>Highlights</h1>
        <div className="body">
          <Tabs defaultActiveKey="1" centered>
            {highlights?.map((highlight, index) => (
              <TabPane tab={highlight.name} key={index + 1}>
                <p className="highlight-title">{highlight.description}</p>
                <div>
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
