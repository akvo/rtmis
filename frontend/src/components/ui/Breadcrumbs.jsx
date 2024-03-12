import React from "react";
import { Breadcrumb } from "antd";
import { Link } from "react-router-dom";
import "./style.scss";

const Breadcrumbs = ({ pagePath }) => {
  if (pagePath.length < 1) {
    return "";
  }
  return (
    <Breadcrumb>
      {pagePath.map((path, pathIndex) => (
        <Breadcrumb.Item key={pathIndex}>
          {path.link ? (
            <Link to={path.link}>{path.title}</Link>
          ) : (
            <>{path.title}</>
          )}
        </Breadcrumb.Item>
      ))}
    </Breadcrumb>
  );
};

export default React.memo(Breadcrumbs);
