import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import Users from "../Users";
import { userEvent } from "@testing-library/user-event";

describe("pages/Users", () => {
  test("test Manage users", () => {
    const { container, getByTestId } = render(<Users />, { wrapper: MemoryRouter });
    const manageUsers = container.querySelector(".ant-tabs-tab");
    userEvent.click(manageUsers);
    waitFor(() => {
      expect(container.querySelector("#users")).toBeDefined();
    })
    expect(container).toMatchSnapshot();
  });
});
