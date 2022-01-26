import "./App.scss";
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { createBrowserHistory } from "history";
import { Layout } from "./components";
import { Home } from "./pages";

const history = createBrowserHistory();

const App = () => {
  const showBanner = history.location.pathname === "/";
  return (
    <Router history={history}>
      <Layout>
        <Layout.Header title="Ministry of Health" />
        {showBanner && <Layout.Banner />}
        <Layout.Body>
          <Routes>
            <Route exact path="/" element={<Home />} />
            <Route exact path="/data" element={<Home />} />
          </Routes>
        </Layout.Body>
        <Layout.Footer>Test</Layout.Footer>
      </Layout>
    </Router>
  );
};

export default App;
