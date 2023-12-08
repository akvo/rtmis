import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router } from "react-router-dom";
import { createBrowserHistory } from "history";
import { CookiesProvider } from "react-cookie";
import "antd/dist/antd.min.css";
import "./index.scss"; // Only for overriding antd
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { Alert } from "antd";

const history = createBrowserHistory();

const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

const Application = () => {
  if (isMobileDevice()) {
    return (
      <Alert
        message="This application is only available on desktop."
        type="warning"
      />
    );
  }

  return (
    <CookiesProvider>
      <Router history={history}>
        <App />
      </Router>
    </CookiesProvider>
  );
};

ReactDOM.render(<Application />, document.getElementById("root"));

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
