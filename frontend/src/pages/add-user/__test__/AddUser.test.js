import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import { act } from "react-dom/test-utils";
import axios from "axios";
import AddUser from "../AddUser";
import Users from "../../users/Users";

jest.mock("axios");

describe("pages/add-user", () => {
  test("test AddUser page", async () => {
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

    axios.mockResolvedValueOnce({ status: 200, data: fakeOrganisation });
    const { container } = render(<AddUser />, { wrapper: MemoryRouter });
    jest.fn(() => {});

    // Name
    const name = screen.getByTestId("name");
    await act(async () => {
      fireEvent.change(name, { target: { value: "Fanilo" } });
    });
    expect(name.value).toBe("Fanilo");

    // Last name
    const lastName = screen.getByTestId("last-name");
    await act(async () => {
      fireEvent.change(lastName, { target: { value: "Tokiniaina" } });
    });
    expect(lastName.value).toBe("Tokiniaina");

    // Email
    const email = screen.getByTestId("email");
    await act(async () => {
      fireEvent.change(email, { target: { value: "fanilo@gmail.com" } });
    });
    expect(email.value).toBe("fanilo@gmail.com");

    // Phone number
    const phoneNumber = screen.getByTestId("phone-number");
    await act(async () => {
      fireEvent.change(phoneNumber, { target: { value: "+261348113468" } });
    });
    expect(phoneNumber.value).toBe("+261348113468");

    const addUserBtn = screen.getByTestId("add-user-btn");
    let userPage;
    await act(async () => {
      fireEvent.click(addUserBtn);
      axios.mockResolvedValue({ status: 200, data: fakeUsers });
      axios.mockResolvedValueOnce({ status: 200, data: fakeOrganisation });
      userPage = render(<Users />, { wrapper: MemoryRouter });
    });

    expect(container).toMatchSnapshot();
    expect(userPage.asFragment()).toMatchSnapshot("userPage");
  });
});
