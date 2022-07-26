export const generateAdvanceFilterURL = (advancedFilters, url) => {
  const queryUrlPrefix = url.includes("?") ? "&" : "?";
  const options = advancedFilters
    .map(({ id, label }) => {
      const query = encodeURIComponent(`${id}||${label.toLowerCase()}`);
      return `options=${query}`;
    })
    .join("&");
  url += `${queryUrlPrefix}${options}`;
  return url;
};
