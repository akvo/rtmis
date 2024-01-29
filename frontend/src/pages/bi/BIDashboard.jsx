import React from "react";
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
            return null;
        }
      })}
    </div>
  );
};

export default React.memo(BIDashboard);
