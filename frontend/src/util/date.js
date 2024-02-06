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

export const eraseCookieFromAllPaths = (name) => {
  var pathBits = location.pathname.split("/");
  var pathCurrent = " path=";
  document.cookie = name + "=; expires=Thu, 01-Jan-1970 00:00:01 GMT;";

  for (var i = 0; i < pathBits.length; i++) {
    pathCurrent += (pathCurrent.substr(-1) !== "/" ? "/" : "") + pathBits[i];
    document.cookie =
      name + "=; expires=Thu, 01-Jan-1970 00:00:01 GMT;" + pathCurrent + ";";
  }
};

export const getTimeDifferenceText = (targetDate, format) => {
  const targetDateTime = moment(targetDate, format);
  const currentDateTime = moment();
  const timeDifference = currentDateTime.diff(targetDateTime, "seconds");
  const secondsInADay = 86400; // 24 hours * 60 minutes * 60 seconds

  if (timeDifference < secondsInADay) {
    const hoursAgo = Math.floor(timeDifference / 3600);
    return hoursAgo <= 1 ? "an hour ago" : `${hoursAgo} hours ago`;
  }
  const daysAgo = Math.floor(timeDifference / secondsInADay);
  return daysAgo === 1 ? "a day ago" : `${daysAgo} days ago`;
};
