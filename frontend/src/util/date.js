import moment from "moment";

export const getDateRange = ({
  startDate,
  endDate,
  type = "months",
  dateFormat = "MMMM DD, YYYY",
}) => {
  const fromDate = moment(startDate);
  const toDate = moment(endDate);
  const diff = toDate.diff(fromDate, type);
  const range = [];
  for (let i = 0; i < diff; i++) {
    range.push(moment(startDate).add(i, type));
  }
  return range.map((r) => r.format(dateFormat));
};

export const timeDiffHours = (last_activity) => {
  const last = moment.unix(last_activity);
  const now = moment.utc();
  const duration = moment.duration(now.diff(last));
  return duration.asHours();
};
