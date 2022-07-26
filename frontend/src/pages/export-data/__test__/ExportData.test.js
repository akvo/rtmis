import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import ExportData from "../ExportData";
import { act } from "react-dom/test-utils";

jest.mock("axios");

describe("page/manage-data", () => {
  test("test if ManageData has a list of data", async () => {
    const downloadedData = [
      {
        id: 6,
        task_id: "f5075b46833c41d199916ec5a62eb5eb",
        type: "download",
        status: "failed",
        info: {
          form_id: 974754029,
          administration: 1,
        },
        attempt: 2,
        created_by: 1,
        created: "26-07-2022 06:29:43",
        result:
          "download-clts-220726-2e9077ce-0f1a-4838-80c7-b08c65426eb0.xlsx",
        available: null,
      },
    ];

    axios.mockResolvedValueOnce({ status: 200, data: downloadedData });
    let wrapper;
    await act(async () => {
      wrapper = render(<ExportData />, { wrapper: MemoryRouter });
    });
    const { container } = wrapper;
    expect(screen.getByText(/Control Center/i)).toBeInTheDocument();
    const tab = screen.getByText("Downloaded Data");
    expect(tab).toHaveAttribute("aria-selected", "false");

    const firstRow = container.querySelector(".ant-table-tbody");
    expect(firstRow.querySelector(".ant-table-cell")).toBeDefined();

    expect(container).toMatchSnapshot();
  });
});
