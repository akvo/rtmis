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
  Visualisation,
} from "./pages";
import { useCookies } from "react-cookie";
import { store, api } from "./lib";
import { Layout, PageLoader } from "./components";
import { useNotification } from "./util/hooks";

const App = () => {
  const { user: authUser, isLoggedIn } = store.useState((state) => state);
  const [cookies, removeCookie] = useCookies(["AUTH_TOKEN"]);
  const [loading, setLoading] = useState(true);
  const { notify } = useNotification();

  useEffect(() => {
    if (!location.pathname.includes("/login")) {
      if (!authUser && !isLoggedIn && cookies && !!cookies.AUTH_TOKEN) {
        api
          .get("profile/", {
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
              notify({
                type: "error",
                message: "Your session has expired",
              });
              removeCookie("AUTH_TOKEN");
              store.update((s) => {
                s.isLoggedIn = false;
                s.user = null;
              });
            }
            setLoading(false);
            console.error(err);
          });
      } else if (!cookies.AUTH_TOKEN) {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [authUser, isLoggedIn, removeCookie, cookies, notify]);

  const ProtectedRoute = ({ children }) => {
    if (!authUser) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

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
              element={
                <ProtectedRoute>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/add"
              element={
                <ProtectedRoute>
                  <AddUser />
                </ProtectedRoute>
              }
            />
            <Route
              path="/control-center"
              element={
                <ProtectedRoute>
                  <ControlCenter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/data/manage"
              element={
                <ProtectedRoute>
                  <ManageData />
                </ProtectedRoute>
              }
            />
            <Route
              path="/questionnaires"
              element={
                <ProtectedRoute>
                  <Questionnaires />
                </ProtectedRoute>
              }
            />
            <Route
              path="/questionnaires/admin"
              element={
                <ProtectedRoute>
                  <QuestionnairesAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/approvals"
              element={
                <ProtectedRoute>
                  <Approvals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/approvers/tree"
              element={
                <ProtectedRoute>
                  <ApproversTree />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/data/export"
              element={
                <ProtectedRoute>
                  <ExportData />
                </ProtectedRoute>
              }
            />
            <Route
              path="/data/upload"
              element={
                <ProtectedRoute>
                  <UploadData />
                </ProtectedRoute>
              }
            />
            <Route
              path="/visualisation"
              element={
                <ProtectedRoute>
                  <Visualisation />
                </ProtectedRoute>
              }
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
