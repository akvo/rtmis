import React from "react";
import PropTypes from "prop-types";

const Body = ({ children, className = "body", ...props }) => {
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
