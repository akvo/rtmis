import React from "react";
import { Breadcrumb, Typography } from "antd";
import { Link } from "react-router-dom";
import "./style.scss";

const { Title } = Typography;

const Breadcrumbs = ({ pagePath }) => {
  if (pagePath.length < 1) {
    return "";
  }

  return (
    <Breadcrumb
      separator={
        <h2 className="ant-typography" style={{ display: "inline" }}>
          {">"}
        </h2>
      }
    >
      {pagePath.map((path, pathIndex) => (
        <Breadcrumb.Item key={pathIndex}>
          {path.link ? (
            <Link to={path.link}>
              <Title style={{ display: "inline" }} level={pathIndex + 1}>
                {path.title}
              </Title>
            </Link>
          ) : (
            <Title style={{ display: "inline" }} level={pathIndex + 1}>
              {path.title}
            </Title>
          )}
        </Breadcrumb.Item>
      ))}
    </Breadcrumb>
  );
};

export default React.memo(Breadcrumbs);
