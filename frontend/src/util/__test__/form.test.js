import { sortArray, reloadData } from "../form";
import dummy from "../dummy";

describe("util/form", () => {
  test("test if sortArray returns a sorted array", () => {
    const sortedArr = [
      { name: "Var A", stack: "Stack 1", value: 10 },
      { name: "Var B", stack: "Stack 2", value: 13 },
      { name: "Var C", stack: "Stack 2", value: 20 },
      { name: "Var D", stack: "Stack 1", value: 24 },
      { name: "Var E", stack: "Stack 2", value: 14 },
    ];

    const result = dummy.chartData.sort(sortArray);
    expect(result).toEqual(sortedArr);
  });

  test("test filterFormByAssigment", () => {
    const user = {
      email: "toky@gmail.com",
      name: "Fanilo Toky",
      administration: {
        id: 1,
        name: "Kenya",
        level: 0,
      },
      trained: false,
      role: {
        id: 1,
        value: "Super Admin",
      },
      phone_number: null,
      designation: null,
      forms: [],
      organisation: {
        name: "",
      },
      last_login: 1657261779.703082,
      token:
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNjU3MzA0OTc5LCJpYXQiOjE2NTcyNjE3NzksImp0aSI6IjVlOTdhNTdlY2ZhZTQ0ZDliNDZkZWEyYTRjMTRiYzc3IiwidXNlcl9pZCI6MX0.bGMSdjnF274-ijR7LFlw6dknY89VKO6tcQrRnWzOaq0",
      invite: "MQ:1o9hUh:AD-nLOnaQt2zkb6171io6SensyBqcdsjJKa3lzXrtZ8",
    };

    const result = reloadData(user);
    expect(result).toBeUndefined();
  });
});
