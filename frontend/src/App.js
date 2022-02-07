import "./App.scss";
import React from "react";
import { CookiesProvider } from "react-cookie";
import AppRoutes from "./AppRoutes";

const App = () => {
  return (
    <CookiesProvider>
      <AppRoutes></AppRoutes>
    </CookiesProvider>
  );
};

export default App;
