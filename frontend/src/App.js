import "./App.scss";
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Layout } from "./components";
import { Home, Login, ControlCenter, Users, Forms } from "./pages";
// import { PrivateRoute } from "./util/auth";
import { CookiesProvider } from "react-cookie";
// import AppRoutes from "./AppRoutes";

const App = () => {
  // const loggedIn = store.useState((s) => s.isLoggedIn);

  return (
    <CookiesProvider>
      {/* <AppRoutes></AppRoutes> */}
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
              {/* <Route
                exact
                path="/control-center"
                element={ControlCenter}
                // render={(props) =>
                //   loggedIn === true ? <ControlCenter /> : <Login />
                // }
              /> */}
              <Route exact path="/users" element={<Users />} />
              <Route exact path="/control-center" element={<ControlCenter />} />
            </Routes>
          </Layout.Body>
          <Layout.Footer />
        </Layout>
      </Router>
    </CookiesProvider>
  );
};

export default App;
