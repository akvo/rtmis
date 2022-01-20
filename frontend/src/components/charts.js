import {Component} from "react";
// import {  BarChart } from 'echarts';
import ReactECharts from "echarts-for-react";
import * as echarts from 'echarts';

type Props = {

  style: React.CSSProperties;
  chartOption:string
};

const Chart = props =>{
   const { style, chartOption } = props;
      return (
        <div>
           <ReactECharts
             option={chartOption}
             style={style}
           />
         </div>
       );
    };

export default Chart;
