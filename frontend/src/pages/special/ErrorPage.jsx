import React from "react";
import "./style.scss";
import { Button } from "antd";
import { Link } from "react-router-dom";
import backgroundImage from "../../assets/banner.png";
import PropTypes from "prop-types";

const bgStyles = {
  wrapper: {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  },
};

const ErrorPage = ({ status, message, description }) => {
  return (
    <div id="error">
      <div className="wrapper" style={bgStyles.wrapper}>
        <h1>Error {status}</h1>
        <h2>
          {message ||
            (status === 404
              ? "Oops this page is not available"
              : status === 401
              ? "You are not authorised to access this page"
              : "An unknown error occurred")}
        </h2>
        <p>
          {description ||
            (status === 404
              ? "Please check the URL again or let us take you back to the RTMIS homepage"
              : status === 401
              ? "Please verify your credentials for the requested resource"
              : "")}
        </p>
        <Link to="/">
          <Button ghost>Back to Homepage</Button>
        </Link>
      </div>
    </div>
  );
};

ErrorPage.propTypes = {
  status: PropTypes.number,
  message: PropTypes.string,
  description: PropTypes.string,
};

export default ErrorPage;
