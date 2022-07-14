import { render, screen } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import "@testing-library/jest-dom";
import ControlCenter from "../ControlCenter";
import { MemoryRouter } from 'react-router-dom';
import TestApp from '../../../TestApp';

jest.mock("axios");

describe("Control center", () => {
  test("test elements in a card", () => {
    render(<ControlCenter />, { wrapper: MemoryRouter });
    expect(screen.getByText("Control Center")).toBeInTheDocument();
    expect(
      screen.getByText("Instant access to all the administration pages and overview panels for data approvals.")
    ).toBeInTheDocument();
    expect(screen.getByText("User Management")).toHaveTagName("h2");
    expect(screen.getByText("MANAGE USERS")).toHaveAttribute("href");
    expect(container).toMatchSnapshot();
  });
});
