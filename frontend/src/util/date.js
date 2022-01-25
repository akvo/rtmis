import moment from "moment";

export const getDateRange = ({
  startDate,
  endDate,
  type = "months",
  dateFormat = "MMMM DD, YYYY",
}) => {
  let fromDate = moment(startDate);
  let toDate = moment(endDate);
  let diff = toDate.diff(fromDate, type);
  let range = [];
  for (let i = 0; i < diff; i++) {
    range.push(moment(startDate).add(i, type));
  }
  return range.map((r) => r.format(dateFormat));
};
