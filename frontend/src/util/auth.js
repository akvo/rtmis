// import React from "react";
import {
  // Navigate,
  Outlet,
} from "react-router-dom";

// import { store } from "../lib";

export function PrivateRoute() {
  return <Outlet />;
  // const auth = store.useState((s) => s.isLoggedIn);
  // return auth ? <Outlet /> : <Navigate to="/login" />;
}
