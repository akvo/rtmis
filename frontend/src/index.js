import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router } from "react-router-dom";
import { createBrowserHistory } from "history";
import { CookiesProvider } from "react-cookie";
import "antd/dist/antd.min.css";
import "./index.scss"; // Only for overriding antd
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { Modal } from "antd";

const history = createBrowserHistory();

const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

const Application = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    const mobileWarningShown = localStorage.getItem("mobileWarningShown");
    if (isMobileDevice() && !mobileWarningShown) {
      setIsModalVisible(true);
    }
  }, []);

  const handleOk = () => {
    setIsModalVisible(false);
    localStorage.setItem("mobileWarningShown", "true");
  };

  const handleClose = () => {
    setIsModalVisible(false);
  };

  return (
    <>
      <Modal
        title="Mobile Device Disclaimer"
        open={isModalVisible}
        onOk={handleOk}
        cancelButtonProps={{ style: { display: "none" } }}
        okText="Proceed"
        onCancel={handleClose}
      >
        <p style={{ margin: "0px" }}>
          This website is optimized for desktop and laptop devices. If you are
          using a mobile device, you may experience performance issues and
          limitations.
        </p>
      </Modal>

      <CookiesProvider>
        <Router history={history}>
          <App />
        </Router>
      </CookiesProvider>
    </>
  );
};

ReactDOM.render(<Application />, document.getElementById("root"));

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
