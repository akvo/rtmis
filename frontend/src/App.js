import "./App.scss";
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { createBrowserHistory } from "history";
import { Layout } from "./components";
import { Home, Login } from "./pages";

const history = createBrowserHistory();

const App = () => {
  return (
    <Router history={history}>
      <Layout>
        <Layout.Header />
        <Layout.Banner />
        <Layout.Body>
          <Routes>
            <Route exact path="/" element={<Home />} />
            <Route exact path="/login" element={<Login />} />
            <Route exact path="/data" element={<Home />} />
          </Routes>
        </Layout.Body>
        <Layout.Footer />
      </Layout>
    </Router>
  );
};

export default App;
