import "./App.scss";
import React from "react";
import { Layout } from "./components";

const App = () => {
  return (
    <Layout>
      <Layout.Header>Test</Layout.Header>
      <Layout.Body>
        <div>test</div>
      </Layout.Body>
      <Layout.Footer>Test</Layout.Footer>
    </Layout>
  );
};

export default App;
