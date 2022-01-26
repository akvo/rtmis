import React from "react";
import PropTypes from "prop-types";

const Footer = ({ children, className = "footer", ...props }) => {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};

Footer.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.element,
    PropTypes.node,
  ]).isRequired,
  className: PropTypes.string,
};

export default Footer;
