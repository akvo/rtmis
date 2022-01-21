const Line = (data, chartTitle, extra) => {
  data = !data ? [] : data;
  data = data.map((x) => ({
    ...x,
  }));
  let yAxisVal = [];
  let seriesData = [];
  let yAxis = {
    type: "value",
  };

  if (data.length > 0) {
    yAxisVal = data?.map((x) => x.value || x.name);
    const hasNaN = data.map((x) => x.value || x.name).filter((x) => isNaN(x));
    if (hasNaN.length) {
      yAxis = {
        type: "category",
        data: yAxisVal,
      };
    }
    seriesData = data.map((x) => {
      const value = x.value || x.name;
      return [x.name, value || null];
    });
  }
  let option = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },
    xAxis: {
      type: "category",
    },
    yAxis: {
      ...yAxis,
    },
    series: [
      {
        data: seriesData,
        type: "line",
      },
    ],
  };
  return option;
};

export default Line;
