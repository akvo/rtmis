import React from "react";
import ResponsiveEmbed from "react-responsive-embed";
import { useParams } from "react-router-dom";
import "./style.scss";

const BIDashboard = () => {
  const { path } = useParams();
  const powerBIDashboard = window?.powerBIDashboard;
  const current = powerBIDashboard?.find((x) => x.path === path);

  const title = current?.content?.find((x) => x.key === "title")?.text || null;

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
                {title ? (
                  <div
                    className="body"
                    style={{ paddingTop: "12px", paddingBottom: "12px" }}
                  >
                    <h1>{title}</h1>
                  </div>
                ) : (
                  ""
                )}
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
