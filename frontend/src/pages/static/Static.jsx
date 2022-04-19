import React from "react";
import "./style.scss";
import { Card } from "antd";
const levels = ["h1", "h2", "h3", "h4"];

const Static = ({ title, data }) => {
  const Heading = ({ title, level }) => {
    const TagName = levels[level || 2] || "h3";
    return <TagName>{title}</TagName>;
  };
  return (
    <div id="static">
      <h1>{title}</h1>
      <Card className="list">
        {data.map((u, uI) => (
          <div key={uI} className="list-item">
            <Heading level={u.level} title={u.title} />
            {u.body?.map((b, bI) => (
              <p key={`p-${bI}`}>{b}</p>
            ))}
          </div>
        ))}
      </Card>
    </div>
  );
};

export default React.memo(Static);
