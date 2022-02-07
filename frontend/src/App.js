import "./App.scss";
import React, { useEffect, useState } from "react";
import { Route, Navigate, Routes } from "react-router-dom";
import { Home, Login, ControlCenter, Users, AddUser, Forms } from "./pages";
import { useCookies } from "react-cookie";
import { store, api } from "./lib";
import { Layout } from "./components";

const App = () => {
  const authUser = store.useState((state) => state.user);
  const [cookies, setCookie] = useCookies(["user"]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authUser && !cookies.user) {
      setCookie("user", authUser, { path: "/" });
      setLoading(false);
    } else if (!authUser && cookies && cookies.user) {
      api.setToken(cookies.AUTH_TOKEN);
      store.update((s) => {
        s.isLoggedIn = true;
        s.user = cookies.user;
      });
      setLoading(false);
    }
    setLoading(false);
  }, [authUser, cookies, setCookie]);

  if (loading) {
    return "Loading";
  }

  return (
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
          <Route
            path="/users"
            element={authUser ? <Users /> : <Navigate to="/login" />}
          />
          <Route
            path="/user/add"
            element={authUser ? <AddUser /> : <Navigate to="/login" />}
          />
          <Route
            path="/control-center"
            element={authUser ? <ControlCenter /> : <Navigate to="/login" />}
          />
        </Routes>
      </Layout.Body>
      <Layout.Footer />
    </Layout>
  );
};

export default App;
