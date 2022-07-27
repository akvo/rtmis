import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import Forms from "../Forms";

jest.mock("axios");

describe("pages/forms", () => {
  test("test form when adding new data", async () => {
    const fakeForm = {
      name: "CLTS",
      question_group: [
        {
          name: "Location",
          question: [
            {
              id: 9747540291,
              name: "location",
              order: 1,
              type: "cascade",
              required: true,
              api: {
                endpoint: "/api/v1/administration",
                list: "children",
                initial: 1,
              },
              meta: true,
            },
          ],
        },
        {
          name: "Village Information",
          question: [
            {
              id: 569070281,
              name: "Village",
              order: 1,
              type: "text",
              required: true,
              meta: true,
            },
            {
              id: 567440335,
              name: "Number of households in the Village",
              order: 2,
              type: "number",
              required: true,
              meta: false,
            },
            {
              id: 571070201,
              name: "Take GPS Location of Village",
              order: 3,
              type: "geo",
              required: true,
              center: {
                lat: 9.145,
                lng: 40.4897,
              },
              meta: true,
            },
          ],
        },
        {
          name: "CLTS Intervention Information",
          question: [
            {
              id: 494780324,
              name: "Implementing partner",
              order: 1,
              type: "option",
              required: true,
              option: [
                {
                  id: 10755,
                  name: "Amref",
                  order: 1,
                },
                {
                  id: 10756,
                  name: "Amref and Local Government",
                  order: 2,
                },
                {
                  id: 10757,
                  name: "Other",
                  order: 3,
                },
              ],
              meta: false,
            },
            {
              id: 559830326,
              name: "Date Triggered",
              order: 2,
              type: "date",
              required: false,
              meta: false,
            },
            {
              id: 569070282,
              name: "Number of Latrines at Triggering?",
              order: 3,
              type: "number",
              required: false,
              meta: false,
            },
            {
              id: 569090299,
              name: "Presence of Handwashing Facility with Water and Soap",
              order: 4,
              type: "option",
              required: false,
              option: [
                {
                  id: 10758,
                  name: "Yes",
                  order: 1,
                },
                {
                  id: 10759,
                  name: "No",
                  order: 2,
                },
              ],
              meta: false,
            },
            {
              id: 571070202,
              name: "No Visible Feces were Found in Environment",
              order: 5,
              type: "option",
              required: false,
              option: [
                {
                  id: 10760,
                  name: "Yes",
                  order: 1,
                },
                {
                  id: 10761,
                  name: "No",
                  order: 2,
                },
              ],
              meta: false,
            },
            {
              id: 557710260,
              name: "School Children had Access to Toilets in the Schools",
              order: 6,
              type: "option",
              required: false,
              option: [
                {
                  id: 10762,
                  name: "Yes",
                  order: 1,
                },
                {
                  id: 10763,
                  name: "No",
                  order: 2,
                },
              ],
              meta: false,
            },
            {
              id: 573010345,
              name: "Public Toilets were Available in Public Places",
              order: 7,
              type: "option",
              required: false,
              option: [
                {
                  id: 10764,
                  name: "Yes",
                  order: 1,
                },
                {
                  id: 10765,
                  name: "No",
                  order: 2,
                },
              ],
              meta: false,
            },
            {
              id: 557710261,
              name: "Toilets were Available for Passengers",
              order: 8,
              type: "option",
              required: false,
              option: [
                {
                  id: 10766,
                  name: "Yes",
                  order: 1,
                },
                {
                  id: 10767,
                  name: "No",
                  order: 2,
                },
              ],
              meta: false,
            },
            {
              id: 557690351,
              name: "Date Verified",
              order: 9,
              type: "date",
              required: false,
              meta: false,
            },
            {
              id: 569090301,
              name: "Number of Latrines at Verification Date",
              order: 10,
              type: "number",
              required: false,
              meta: false,
            },
            {
              id: 583770042,
              name: "Latrine Type of Most Latrines at Verification Date",
              order: 11,
              type: "option",
              required: true,
              option: [
                {
                  id: 10768,
                  name: "Bucket",
                  order: 1,
                },
                {
                  id: 10769,
                  name: "Container-based sanitation",
                  order: 2,
                },
                {
                  id: 10770,
                  name: "Flush/pour flush to piped sewer system",
                  order: 3,
                },
                {
                  id: 10771,
                  name: "Flush/pour flush to septic tank",
                  order: 4,
                },
                {
                  id: 10772,
                  name: "Flush/pour flush to pit latrine",
                  order: 5,
                },
                {
                  id: 10773,
                  name: "Flush/pour flush to open drain",
                  order: 6,
                },
                {
                  id: 10774,
                  name: "Hanging toilet/latrine",
                  order: 7,
                },
                {
                  id: 10775,
                  name: "Pit latrine with slab",
                  order: 8,
                },
                {
                  id: 10776,
                  name: "Pit latrine without slab/open pit",
                  order: 9,
                },
                {
                  id: 10777,
                  name: "Twin pit offset latrine",
                  order: 10,
                },
                {
                  id: 10778,
                  name: "Twin pit with latrine slab",
                  order: 11,
                },
                {
                  id: 10779,
                  name: "Twin pit without slab",
                  order: 12,
                },
                {
                  id: 10780,
                  name: "Ventilated improved pit latrine (VIP) with slab",
                  order: 13,
                },
                {
                  id: 10781,
                  name: "Other composting latrine",
                  order: 14,
                },
              ],
              meta: false,
            },
            {
              id: 557700349,
              name: "Open Defecation Status",
              order: 12,
              type: "option",
              required: false,
              option: [
                {
                  id: 10782,
                  name: "Open Defecation",
                  order: 1,
                },
                {
                  id: 10783,
                  name: "Triggered",
                  order: 2,
                },
                {
                  id: 10784,
                  name: "Declared ODF",
                  order: 3,
                },
                {
                  id: 10785,
                  name: "Verified ODF",
                  order: 4,
                },
              ],
              meta: false,
            },
          ],
        },
      ],
    };

    axios.mockResolvedValueOnce({ status: 200, data: fakeForm });
    const { container } = render(<Forms />, { wrapper: MemoryRouter });
    expect(
      screen.getByText(/Please fill up the webform below/i)
    ).toBeInTheDocument();

    expect(container).toMatchSnapshot();
  });
});
