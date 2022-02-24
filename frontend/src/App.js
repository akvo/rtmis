import "./App.scss";
import React, { useEffect, useState } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import {
  Home,
  Login,
  ControlCenter,
  Users,
  AddUser,
  Forms,
  ManageData,
  Questionnaires,
  QuestionnairesAdmin,
  Approvals,
  Approvers,
  ApproversTree,
  Profile,
  ComingSoon,
} from "./pages";
import { message, Spin } from "antd";
import { useCookies } from "react-cookie";
import { store, api } from "./lib";
import { Layout } from "./components";

const App = () => {
  const { user: authUser, isLoggedIn } = store.useState((state) => state);
  const [cookies, removeCookie] = useCookies(["AUTH_TOKEN"]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (
      !location.pathname.includes("/login") &&
      !authUser &&
      !isLoggedIn &&
      cookies &&
      cookies.AUTH_TOKEN
    ) {
      api
        .get("get/profile/", {
          headers: { Authorization: `Bearer ${cookies.AUTH_TOKEN}` },
        })
        .then((res) => {
          store.update((s) => {
            s.isLoggedIn = true;
            s.user = res.data;
          });
          api.setToken(cookies.AUTH_TOKEN);
          api
            .get("forms/", {
              headers: { Authorization: `Bearer ${cookies.AUTH_TOKEN}` },
            })
            .then((res) => {
              store.update((s) => {
                s.forms = res.data;
              });
              setLoading(false);
            })
            .catch((err) => {
              setLoading(false);
              console.error(err);
            });
        })
        .catch((err) => {
          if (err.response.status === 401) {
            message.error("Your session has expired");
            removeCookie("AUTH_TOKEN");
            store.update((s) => {
              s.isLoggedIn = false;
              s.user = null;
            });
          }
          setLoading(false);
          console.error(err);
        });
    } else {
      setLoading(false);
    }
  }, [authUser, isLoggedIn, removeCookie, cookies]);

  if (loading) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin />
        <h3 style={{ marginTop: 8 }}>Loading</h3>
      </div>
    );
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
          <Route exact path="/forgot-password" element={<Login />} />
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
          <Route
            path="/data/manage"
            element={authUser ? <ManageData /> : <Navigate to="/login" />}
          />
          <Route
            path="/questionnaires"
            element={authUser ? <Questionnaires /> : <Navigate to="/login" />}
          />
          <Route
            path="/questionnaires/admin"
            element={
              authUser ? <QuestionnairesAdmin /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/approvals"
            element={authUser ? <Approvals /> : <Navigate to="/login" />}
          />
          <Route
            path="/approvers"
            element={authUser ? <Approvers /> : <Navigate to="/login" />}
          />
          <Route
            path="/approvers/tree"
            element={authUser ? <ApproversTree /> : <Navigate to="/login" />}
          />
          <Route
            path="/profile"
            element={authUser ? <Profile /> : <Navigate to="/login" />}
          />
          <Route exact path="/coming-soon" element={<div />} />
          <Route exact path="/old-coming-soon" element={<ComingSoon />} />
          <Route exact path="/not-found" element={<div />} />
          <Route path="*" element={<Navigate replace to="/not-found" />} />
        </Routes>
      </Layout.Body>
      <Layout.Footer />
    </Layout>
  );
};

export default App;
