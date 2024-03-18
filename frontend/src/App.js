import "./App.scss";
import React, { useEffect, useState } from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import {
  Home,
  Login,
  ControlCenterLayout,
  Users,
  AddUser,
  Forms,
  ManageData,
  Approvals,
  ApproversTree,
  Profile,
  UploadData,
  NewsEvents,
  HowWeWork,
  Terms,
  Privacy,
  Reports,
  Report,
  Submissions,
  Settings,
  Organisations,
  AddOrganisation,
  Dashboard,
  Glaas,
  ReportDashboard,
  GlaasReportDashboard,
  MobileAssignment,
  AddAssignment,
  MasterData,
  MasterDataAttributes,
  ManageEntityTypes,
  AddAdministration,
  AddAttribute,
  AddEntity,
  EntityData,
  AddEntityData,
  ControlCenter,
  UploadAdministrationData,
  DownloadAdministrationData,
  BIDashboard,
  MonitoringDetail,
  Downloads,
  // Visualisation,
} from "./pages";
import { useCookies } from "react-cookie";
import { store, api, config } from "./lib";
import { Layout, PageLoader } from "./components";
import { useNotification } from "./util/hooks";
import { eraseCookieFromAllPaths } from "./util/date";
import { reloadData } from "./util/form";

const Private = ({ element: Element, alias }) => {
  const { user: authUser } = store.useState((state) => state);
  if (authUser) {
    const page_access = authUser?.role_detail?.page_access;
    return page_access.includes(alias) ? (
      <Element />
    ) : (
      <Navigate to="/not-found" />
    );
  }
  return <Navigate to="/login" />;
};

const RouteList = () => {
  return (
    <Routes>
      <Route exact path="/" element={<Home />} />
      <Route exact path="/login" element={<Login />} />
      <Route exact path="/login/:invitationId" element={<Login />} />
      <Route exact path="/forgot-password" element={<Login />} />
      <Route exact path="/data" element={<Home />} />
      <Route exact path="/dashboard/:formId" element={<Dashboard />} />
      <Route exact path="/glaas/:formId" element={<Glaas />} />
      <Route
        exact
        path="/report-dashboard/:formId"
        element={<ReportDashboard />}
      />
      <Route
        exact
        path="/glaas-report-dashboard/:formId"
        element={<GlaasReportDashboard />}
      />
      <Route
        path="/control-center"
        element={
          <Private element={ControlCenterLayout} alias="control-center" />
        }
      >
        <Route
          path="users/add"
          element={<Private element={AddUser} alias="user" />}
        />
        <Route
          path="users/:id"
          element={<Private element={AddUser} alias="user" />}
        />
        <Route
          index
          element={<Private element={ControlCenter} alias="control-center" />}
        />
        <Route
          path="users"
          element={<Private element={Users} alias="user" />}
        />
        <Route
          path="approvers/tree"
          element={<Private element={ApproversTree} alias="approvers" />}
        />
        <Route
          path="data"
          element={<Private element={ManageData} alias="data" />}
        />
        <Route
          path="data/:form/monitoring/:parentId"
          element={<Private element={MonitoringDetail} alias="data" />}
        />
        <Route
          path="master-data/administration"
          element={<Private element={MasterData} alias="master-data" />}
        />
        <Route
          path="master-data/administration/upload"
          element={
            <Private element={UploadAdministrationData} alias="master-data" />
          }
        />
        <Route
          path="master-data/administration/download"
          element={
            <Private element={DownloadAdministrationData} alias="master-data" />
          }
        />
        <Route
          path="master-data/administration/add"
          element={<Private element={AddAdministration} alias="master-data" />}
        />
        <Route
          path="master-data/administration/:id"
          element={<Private element={AddAdministration} alias="master-data" />}
        />
        <Route
          path="master-data/attributes"
          element={
            <Private element={MasterDataAttributes} alias="master-data" />
          }
        />
        <Route
          path="master-data/attributes/add"
          element={<Private element={AddAttribute} alias="master-data" />}
        />
        <Route
          path="master-data/attributes/:id"
          element={<Private element={AddAttribute} alias="master-data" />}
        />
        <Route
          path="master-data/entity-types"
          element={<Private element={ManageEntityTypes} alias="master-data" />}
        />
        <Route
          path="master-data/entity-types/add"
          element={<Private element={AddEntity} alias="master-data" />}
        />
        <Route
          path="master-data/entity-types/:id"
          element={<Private element={AddEntity} alias="master-data" />}
        />
        <Route
          path="master-data/entities"
          element={<Private element={EntityData} alias="master-data" />}
        />
        <Route
          path="master-data/entities/add"
          element={<Private element={AddEntityData} alias="master-data" />}
        />
        <Route
          path="master-data/entities/:id"
          element={<Private element={AddEntityData} alias="master-data" />}
        />
        <Route
          path="data/upload"
          element={<Private element={UploadData} alias="data" />}
        />
        <Route
          path="data/submissions"
          element={<Private element={Submissions} alias="data" />}
        />
        <Route
          path="approvals"
          element={<Private element={Approvals} alias="approvals" />}
        />
        <Route
          path="master-data/organisations/add"
          element={<Private element={AddOrganisation} alias="organisation" />}
        />
        <Route
          path="master-data/organisations/:id"
          element={<Private element={AddOrganisation} alias="organisation" />}
        />
        <Route
          path="master-data/organisations"
          element={<Private element={Organisations} alias="organisation" />}
        />
        <Route
          path="mobile-assignment"
          element={<Private element={MobileAssignment} alias="mobile" />}
        />
        <Route
          path="mobile-assignment/add"
          element={<Private element={AddAssignment} alias="mobile" />}
        />
        <Route
          path="mobile-assignment/:id"
          element={<Private element={AddAssignment} alias="mobile" />}
        />
        <Route exact path="form/:formId" element={<Forms />} />
        <Route
          path="profile"
          element={<Private element={Profile} alias="profile" />}
        />
      </Route>
      <Route
        path="/downloads"
        element={<Private element={Downloads} alias="downloads" />}
      />
      <Route
        path="/settings"
        element={<Private element={Settings} alias="settings" />}
      />
      <Route
        path="/reports"
        element={<Private element={Reports} alias="reports" />}
      />
      <Route
        path="/report/:templateId"
        element={<Private element={Report} alias="reports" />}
      />
      <Route path="/bi/:path" element={<BIDashboard />} />
      <Route path="/news-events" element={<NewsEvents />} />
      <Route path="/how-we-work" element={<HowWeWork />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy-policy" element={<Privacy />} />
      <Route exact path="/coming-soon" element={<div />} />
      <Route exact path="/not-found" element={<div />} />
      <Route path="*" element={<Navigate replace to="/not-found" />} />
    </Routes>
  );
};

const App = () => {
  const { user: authUser, isLoggedIn } = store.useState((state) => state);
  const [cookies] = useCookies(["AUTH_TOKEN"]);
  const [loading, setLoading] = useState(true);
  const { notify } = useNotification();
  const pageLocation = useLocation();

  const public_state = config.allowedGlobal
    .map((x) => location.pathname.includes(x))
    .filter((x) => x)?.length;

  // detect location change to reset advanced filters
  useEffect(() => {
    store.update((s) => {
      s.advancedFilters = [];
      s.showAdvancedFilters = false;
    });
  }, [pageLocation]);

  useEffect(() => {
    if (!location.pathname.includes("/login")) {
      if (!authUser && !isLoggedIn && cookies && !!cookies.AUTH_TOKEN) {
        api
          .get("profile", {
            headers: { Authorization: `Bearer ${cookies.AUTH_TOKEN}` },
          })
          .then((res) => {
            const role_details = config.roles.find(
              (r) => r.id === res.data.role.id
            );
            const designation = config.designations.find(
              (d) => d.id === parseInt(res.data?.designation)
            );
            store.update((s) => {
              s.isLoggedIn = true;
              s.user = {
                ...res.data,
                designation: designation,
                role_detail: role_details,
              };
            });
            reloadData(res.data);
            api.setToken(cookies.AUTH_TOKEN);
            setLoading(false);
          })
          .catch((err) => {
            if (err.response.status === 401) {
              notify({
                type: "error",
                message: "Your session has expired",
              });
              store.update((s) => {
                s.isLoggedIn = false;
                s.user = null;
              });
              eraseCookieFromAllPaths("AUTH_TOKEN");
            }
            setLoading(false);
            console.error(err);
          });
      } else if (!cookies.AUTH_TOKEN) {
        setLoading(false);
        eraseCookieFromAllPaths("AUTH_TOKEN");
      }
    } else {
      setLoading(false);
    }
  }, [authUser, isLoggedIn, cookies, notify]);

  useEffect(() => {
    if (isLoggedIn && !public_state) {
      config.fn.administration(authUser.administration.id).then((res) => {
        store.update((s) => {
          s.administration = [res];
        });
      });
    }
  }, [authUser, isLoggedIn, public_state]);

  const isHome = location.pathname === "/";

  const isPublic = config.allowedGlobal
    .map((x) => location.pathname.includes(x))
    .filter((x) => x)?.length;

  return (
    <Layout>
      <Layout.Header />
      <Layout.Banner />
      <Layout.Body>
        {loading && !isHome && !isPublic ? (
          <PageLoader message="Initializing. Please wait.." />
        ) : (
          <RouteList />
        )}
      </Layout.Body>
      <Layout.Footer />
    </Layout>
  );
};

export default App;
