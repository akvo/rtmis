import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ControlCenter from "../ControlCenter";
import { MemoryRouter } from "react-router-dom";

describe("Control center", () => {
  test("test elements in a card", () => {
    render(<ControlCenter />, { wrapper: MemoryRouter });
    expect(screen.getByText("Control Center")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Instant access to all the administration pages and overview panels for data approvals."
      )
    ).toBeInTheDocument();
  });
});
