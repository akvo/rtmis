import logo from './logo.svg';
import './App.css';
import api from './util/api';
import Chart from './components/charts'


const apiTest = () => {
  api
    .get('test/')
    .then((res) => {
      alert(res.data.message)
    })
    .catch((err) => {
      console.log(err)
    });
};
const loginTest = () => {
  let formData = new FormData();
  formData.append("username","admin")
  formData.append("password","Test105*")
  api
    .post('login/',formData)
    .then((res) => {
      console.log(res.data.token)
      // api.setToken(res.data.token);

    })
    .catch((err) => {
      console.log(err)
    });
};

const chartStyle = { height: '300px', width: '500px' }
const chartOption1 = {
    dataset: {
      source: [
        ["Total", "Male", "Female"],
        ["subject 1", 4, 1],
        ["subject 2", 2, 4],
        ["subject 3", 3, 6],
        ["subject 4", 5, 3],
      ],
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },
    legend: {
      data: ["Male", "Female"],
    },

    xAxis: {
      type: "category",
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        type: "line",
        stack: "total",
        label: {
          show: true,
        }
      },
      {
        type: "bar",
        stack: "total",
        label: {
          show: true,
        }
      }
    ],
  }
const chartOption2 = {
  dataset: {
    source: [
      ["Total", "Male"],
      ["subject 1", 4],
      ["subject 2", 2],
      ["subject 3", 3],
      ["subject 4", 5],
    ],
  },
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow",
    },
  },
  legend: {
    data: ["Male", "Female"],
  },

  xAxis: {
    type: "category",
  },
  yAxis: {
    type: "value",
  },
  series: [
    {
      type: "line",
      stack: "total",
      label: {
        show: true,
      }
    }
  ],
}
function App() {
  return (
    <div className="App">
      <header className="App-header">
        <p>
          <button onClick={apiTest}> Test API </button>
        </p>
        <p>
          <button onClick={loginTest}> Login </button>
        </p>
        <Chart chartOption={chartOption1} style={chartStyle}/>
        <Chart chartOption={chartOption2} style={chartStyle}/>
      </header>
    </div>
  );
}

export default App;
