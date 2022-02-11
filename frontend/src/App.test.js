import { render, screen } from "@testing-library/react";
import TestApp from "./TestApp";
import "@testing-library/jest-dom";

describe("App", () => {
  test("test if the login button exists", () => {
    render(<TestApp />);
    const linkElement = screen.getByText(/Log In/i);
    expect(linkElement).toBeInTheDocument();
  });
});
