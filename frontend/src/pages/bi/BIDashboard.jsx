import React from "react";
import { Affix } from "antd";
import ResponsiveEmbed from "react-responsive-embed";
import { useParams } from "react-router-dom";
import "./style.scss";

const BIDashboard = () => {
  const { path } = useParams();
  const powerBIDashboard = window?.powerBIDashboard;
  const current = powerBIDashboard?.find((x) => x.path === path);

  return (
    <div id="powerbi-dashboard">
      {current?.content.map((c, ci) => {
        const componentKey = `${c.key}-${ci}`;
        switch (c.key) {
          case "embed":
            return (
              <div
                key={componentKey}
                className="main-wrapper"
                style={c?.style ? c.style : {}}
              >
                <ResponsiveEmbed src={c.link} />
                <div className="blank-white" />
              </div>
            );
          default:
            return (
              <Affix key={componentKey} className="wrapper">
                <div className="page-title-wrapper">
                  <h1 style={c?.style ? c.style : {}}>{c.text}</h1>
                </div>
              </Affix>
            );
        }
      })}
    </div>
  );
};

export default React.memo(BIDashboard);
