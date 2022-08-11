import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Link, MemoryRouter } from "react-router-dom";
import UserTab from "../tabs/UserTab";
import { Button } from "antd";

describe("components/UserTab", () => {
  test("test if UserTab has two tabs and add user", () => {
    const { container } = render(
      <UserTab
        tabBarExtraContent={
          <Link to="/user/add">
            <Button type="primary">Add new user</Button>
          </Link>
        }
      />,
      { wrapper: MemoryRouter }
    );
    const addUser = container.querySelector(`[href="/user/add"]`);
    expect(screen.getByText("Manage Users")).toBeInTheDocument();
    expect(addUser).toHaveAttribute("href", "/user/add");
    expect(container).toMatchSnapshot();
  });
});
