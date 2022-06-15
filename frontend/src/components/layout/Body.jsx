import React from "react";
import PropTypes from "prop-types";
import { useLocation } from "react-router-dom";

const Body = ({ children, className = "body", ...props }) => {
  const { pathname } = useLocation();
  if (["/not-found", "/coming-soon"].includes(pathname)) {
    return "";
  }
  if (pathname === "/") {
    className += " body-home";
  }
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};

Body.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.element,
    PropTypes.node,
  ]).isRequired,
  className: PropTypes.string,
};

export default Body;
