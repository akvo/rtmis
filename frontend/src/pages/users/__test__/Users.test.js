import { render, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import { act } from "react-dom/test-utils";
import axios from "axios";
import Users from "../Users";
import AddUser from "../../add-user/AddUser";

jest.mock("axios");

describe("pages/Users", () => {
  test("test Users page", async () => {
    const fakeUsers = [
      {
        id: 140,
        first_name: "North Sakwa",
        last_name: "Approver",
        email: "northsakwa1450@test.com",
        administration: {
          id: 1450,
          name: "North Sakwa",
          level: 3,
        },
        organisation: {
          id: 1,
          name: "Onja",
        },
        trained: false,
        role: {
          id: 3,
          value: "Data Approver",
        },
        phone_number: null,
        designation: null,
        invite: "MTQw:1oEnm1:0dLIwEUEKXQHVCdacAXQH7PTwjUnPkQ0cjAwoZKY4zw",
        forms: [
          {
            id: 563350033,
            name: "WASH in Schools",
          },
        ],
        last_login: null,
      },
      {
        id: 139,
        first_name: "Siaya",
        last_name: "Admin",
        email: "siaya39@test.com",
        administration: {
          id: 39,
          name: "Siaya",
          level: 1,
        },
        organisation: {
          id: 1,
          name: "Onja",
        },
        trained: false,
        role: {
          id: 2,
          value: "County Admin",
        },
        phone_number: null,
        designation: null,
        invite: "MTM5:1oEnm1:dSrgiMfWol19wuD1oXO7-_Uyo_FuQKN1x1cfencaacc",
        forms: [
          {
            id: 563350033,
            name: "WASH in Schools",
          },
        ],
        last_login: null,
      },
    ];

    const fakeOrganisation = [
      {
        id: 1,
        name: "Onja",
        attributes: [
          {
            type_id: 1,
            name: "member",
          },
        ],
        users: 22,
      },
    ];

    axios.mockResolvedValue({ status: 200, data: fakeUsers });
    axios.mockResolvedValueOnce({ status: 200, data: fakeOrganisation });

    let wrapper;
    await act(async () => {
      wrapper = render(<Users />, { wrapper: MemoryRouter });
    });

    const { container, getByTestId } = wrapper;
    expect(container.querySelector(".ant-table-tbody")).toBeDefined();

    const addUser = getByTestId("add-user");
    expect(addUser).toHaveAttribute("href", "/user/add");

    let addUserPage;
    await act(async () => {
      fireEvent.click(addUser, { button: 0 });
      addUserPage = render(<AddUser />, { wrapper: MemoryRouter });
    });

    expect(container).toMatchSnapshot();
    expect(addUserPage.asFragment()).toMatchSnapshot("addUserPage");
  });
});
