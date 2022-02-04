import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Navigate,
  Routes,
} from "react-router-dom";
import { Home, Login, ControlCenter, Users, Forms } from "./pages";
import { createBrowserHistory } from "history";
import { useCookies } from "react-cookie";
import { store } from "./lib";
import { Layout } from "./components";

function AppRoutes() {
  const history = createBrowserHistory();

  const loggedInUser = store.useState((state) => state.user);
  const [cookies, setCookie] = useCookies(["user"]);
  useEffect(() => {
    if (loggedInUser && cookies["user"] == "undefined") {
      setCookie("user", loggedInUser, { path: "/" });
    } else if (!loggedInUser && cookies["user"] != "undefined") {
      store.update((s) => {
        s.loggedIn = true;
        s.user = JSON.stringify(cookies["user"]);
      });
    }
  });

  return (
    <>
      <Router history={history}>
        <Layout>
          <Layout.Header />
          <Layout.Banner />
          <Layout.Body>
            <Routes>
              <Route exact path="/" element={<Home />} />
              <Route exact path="/login" element={<Login />} />
              <Route exact path="/login/:invitationId" element={<Login />} />
              <Route exact path="/data" element={<Home />} />
              <Route exact path="/form/:formId" element={<Forms />} />
              <Route exact path="/users" element={<Users />} />
              {/* <Route exact path="/control-center" element={<ControlCenter />} /> */}
              <Route
                path="/control-center"
                element={
                  loggedInUser ? <Navigate to="/login" /> : <ControlCenter />
                }
              />
            </Routes>
          </Layout.Body>
          <Layout.Footer />
        </Layout>
      </Router>
    </>
  );
}

export default AppRoutes;
