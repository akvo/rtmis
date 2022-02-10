import { MemoryRouter } from "react-router-dom";
import { CookiesProvider } from "react-cookie";
import App from "./App";

window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
    };
  };

const TestApp = ({ entryPoint = "/" }) => {
  return (
    <CookiesProvider>
      <MemoryRouter initialEntries={[entryPoint]}>
        <App />
      </MemoryRouter>
    </CookiesProvider>
  );
};

export default TestApp;
