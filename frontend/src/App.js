import "./App.scss";
import React, { useEffect, useState } from "react";
import {
  Route,
  Routes,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
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
} from "./pages";
import { useCookies } from "react-cookie";
import { store, api, config } from "./lib";
import { Layout, PageLoader } from "./components";
import { useNotification } from "./util/hooks";
import { timeDiffHours, eraseCookieFromAllPaths } from "./util/date";
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
      <Route exact path="/form/:formId" element={<Forms />} />
      <Route exact path="/dashboard/:formId" element={<Dashboard />} />
      <Route exact path="/glaas/:formId" element={<Glaas />} />
      <Route path="/users" element={<Private element={Users} alias="user" />} />
      <Route
        path="/organisations"
        element={<Private element={Organisations} alias="organisation" />}
      />
      <Route
        path="/user/add"
        element={<Private element={AddUser} alias="user" />}
      />
      <Route
        path="/user/:id"
        element={<Private element={AddUser} alias="user" />}
      />
      <Route
        path="/organisation/add"
        element={<Private element={AddOrganisation} alias="organisation" />}
      />
      <Route
        path="/organisation/:id"
        element={<Private element={AddOrganisation} alias="organisation" />}
      />
      <Route
        path="/control-center"
        element={<Private element={ControlCenter} alias="control-center" />}
      />
      <Route
        path="/settings"
        element={<Private element={Settings} alias="settings" />}
      />
      <Route
        path="/data/manage"
        element={<Private element={ManageData} alias="data" />}
      />
      <Route
        path="/data/export"
        element={<Private element={ExportData} alias="data" />}
      />
      <Route
        path="/data/upload"
        element={<Private element={UploadData} alias="data" />}
      />
      <Route
        path="/data/visualisation"
        element={<Private element={Visualisation} alias="visualisation" />}
      />
      <Route
        path="/questionnaires"
        element={<Private element={Questionnaires} alias="questionnaires" />}
      />
      <Route
        path="/questionnaires/admin"
        element={
          <Private element={QuestionnairesAdmin} alias="questionnaires" />
        }
      />
      <Route
        path="/approvals"
        element={<Private element={Approvals} alias="approvals" />}
      />
      <Route
        path="/data/submissions"
        element={<Private element={Submissions} alias="data" />}
      />
      <Route
        path="/approvers/tree"
        element={<Private element={ApproversTree} alias="approvers" />}
      />
      <Route
        path="/profile"
        element={<Private element={Profile} alias="profile" />}
      />
      <Route
        path="/reports"
        element={<Private element={Reports} alias="reports" />}
      />
      <Route
        path="/report/:templateId"
        element={<Private element={Report} alias="reports" />}
      />
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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { notify } = useNotification();
  const pageLocation = useLocation();

  const public_state = config.allowedGlobal
    .map((x) => location.pathname.includes(x))
    .filter((x) => x)?.length;

  document.addEventListener(
    "click",
    () => {
      if (isLoggedIn && authUser?.last_login) {
        const expired = timeDiffHours(authUser.last_login);
        if (expired >= 4) {
          eraseCookieFromAllPaths("AUTH_TOKEN");
          store.update((s) => {
            s.isLoggedIn = false;
            s.user = null;
          });
          navigate("login");
        }
      }
    },
    { passive: true }
  );

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
      store.update((s) => {
        s.administration = [
          config.fn.administration(authUser.administration.id),
        ];
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
