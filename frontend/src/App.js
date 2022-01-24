import "./App.css";
import api from "./util/api";
import Chart from "./components/charts";

const apiTest = () => {
  api
    .get("test/")
    .then((res) => {
      console.info(res.data.message);
    })
    .catch((err) => {
      console.error(err);
    });
};

const data = [
  {
    name: "Var A",
    group: "Group 1",
    value: 10,
  },
  {
    name: "Var B",
    group: "Group 2",
    value: 13,
  },
  {
    name: "Var C",
    group: "Group 2",
    value: 20,
  },
  {
    name: "Var D",
    group: "Group 1",
    value: 24,
  },
  {
    name: "Var E",
    group: "Group 2",
    value: 14,
  },
];

const loginTest = () => {
  let formData = new FormData();
  formData.append("username", "admin");
  formData.append("password", "Test105*");
  api
    .post("login/", formData)
    .then((res) => {
      api.setToken(res.data.token);
    })
    .catch((err) => {
      console.error(err);
    });
};

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
        <Chart type="LINE" data={data} height={300} width={300} />
        <Chart type="BAR" data={data} height={300} width={300} />
      </header>
    </div>
  );
}

export default App;
