import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { createMemoryHistory } from "history";
import { CookiesProvider } from "react-cookie";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
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

describe("App", () => {
  test("test if the login button exists", () => {
    render(<TestApp />);
    const linkElement = screen.getByText(/Log In/i);
    expect(linkElement).toBeInTheDocument();
  });

  test("test if the login form exists", () => {
    render(<TestApp />);
    userEvent.click(screen.getByText(/Log In/i), { button: 0 });
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Please enter your account details/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByText(/Remember me/i)).toBeInTheDocument();
    expect(screen.getByText(/Forgot password/i)).toBeInTheDocument();
  });

  test("test if the registration form is checking the endpoint", () => {
    render(<TestApp entryPoint={"/login/abcd"} />);
    expect(screen.getByText(/Verifying/i)).toBeInTheDocument();
  });
});
