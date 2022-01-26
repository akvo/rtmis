import React from "react";
import PropTypes from "prop-types";

const Header = ({ children, className = "header", ...props }) => {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};

Header.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.element,
    PropTypes.node,
  ]).isRequired,
  className: PropTypes.string,
};

export default Header;
