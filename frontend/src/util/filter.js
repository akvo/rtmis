export const generateAdvanceFilterURL = (advancedFilters) => {
  const options = advancedFilters
    .map(({ id, label }) => {
      const query = encodeURIComponent(`${id}||${label.toLowerCase()}`);
      return `options=${query}`;
    })
    .join("&");
  return `&${options}`;
};
