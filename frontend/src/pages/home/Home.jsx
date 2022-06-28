import React from "react";
import "./style.scss";
import { Tabs } from "antd";
import { HomeDataChart, HomeAdministrationChart } from "../../components";
const { TabPane } = Tabs;

const Home = () => {
  const { highlights } = window;

  return (
    <div id="home">
      <div className="highlights">
        <h1>Highlights</h1>
        <div className="body">
          <Tabs defaultActiveKey="1" centered>
            {highlights?.map((highlight, index) => (
              <TabPane tab={highlight.name} key={index + 1}>
                <h4 className="highlight-title">{highlight.description}</h4>
                <div style={{ borderColor: "red", borderWidth: 1 }}>
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
