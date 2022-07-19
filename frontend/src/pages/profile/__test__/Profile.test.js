import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import Profile from "../Profile";

describe("pages/Profile", () => {
  test("test profile heading", () => {
    const { container, getByTestId } = render(<Profile />, {
      wrapper: MemoryRouter,
    });
    expect(
      screen.getByText(
        "This page shows your current user setup. It also shows the most important activities for your current user setup"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("My Profile")).toBeInTheDocument();
    expect(getByTestId("name")).toBeInTheDocument();
    expect(getByTestId("role")).toBeInTheDocument();
    expect(getByTestId("organisation")).toBeInTheDocument();
    expect(getByTestId("designation")).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });
});
