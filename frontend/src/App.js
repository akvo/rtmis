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
  ApproversTree,
  Profile,
  ExportData,
  UploadData,
} from "./pages";
import { message } from "antd";
import { useCookies } from "react-cookie";
import { store, api } from "./lib";
import { Layout, PageLoader } from "./components";

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
          Promise.all([api.get("forms/"), api.get("levels/")])
            .then((res) => {
              store.update((s) => {
                s.forms = res[0].data;
                s.levels = res[1].data;
              });
              setLoading(false);
            })
            .catch((e) => {
              setLoading(false);
              console.error(e);
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

  return (
    <Layout>
      <Layout.Header />
      <Layout.Banner />
      <Layout.Body>
        {loading ? (
          <PageLoader message="Initializing. Please wait.." />
        ) : (
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
              path="/approvers/tree"
              element={authUser ? <ApproversTree /> : <Navigate to="/login" />}
            />
            <Route
              path="/profile"
              element={authUser ? <Profile /> : <Navigate to="/login" />}
            />
            <Route
              path="/data/export"
              element={authUser ? <ExportData /> : <Navigate to="/login" />}
            />
            <Route
              path="/data/upload"
              element={authUser ? <UploadData /> : <Navigate to="/login" />}
            />
            <Route exact path="/coming-soon" element={<div />} />
            <Route exact path="/not-found" element={<div />} />
            <Route path="*" element={<Navigate replace to="/not-found" />} />
          </Routes>
        )}
      </Layout.Body>
      <Layout.Footer />
    </Layout>
  );
};

export default App;
