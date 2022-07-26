import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import AddOrganisation from "../AddOrganisation";
import { act } from "react-dom/test-utils";
import axios from "axios";
import Organisations from "../../organisations/Organisations";

jest.mock("axios");

describe("pages/add-organisation", () => {
  test("test AddOrganisation page", async () => {
    const fakeResult = [
      {
        id: 1,
        name: "Onja",
        attributes: [
          {
            type_id: 1,
            name: "member",
          },
        ],
        users: 26,
      },
    ];
    axios.post.mockResolvedValue({ status: 200, data: fakeResult });

    const addOrgPage = render(<AddOrganisation />, { wrapper: MemoryRouter });

    jest.fn(() => {});
    const orgName = screen.getByTestId("organisation-name");
    await act(async () => {
      fireEvent.change(orgName, { target: { value: "Onja Mada" } });
    });
    expect(orgName.value).toBe("Onja Mada");

    let organisation;
    await act(async () => {
      organisation = render(<Organisations />, { wrapper: MemoryRouter });
    });

    expect(addOrgPage.asFragment()).toMatchSnapshot("addOrgPage");
    expect(organisation.asFragment()).toMatchSnapshot("organisation");
  });
});
