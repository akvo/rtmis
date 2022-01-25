import "./App.css";
import api from "./util/api";
import { Row, Col, Button } from "antd";
import Chart from "./chart";
import { chartData } from "./util/dummy";

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
      <Row>
        <Col md={12}>
          <Button onClick={apiTest}> Test API </Button>
          <Button onClick={loginTest}> Login </Button>
        </Col>
      </Row>
      <Row>
        <Col md={12}>
          <Chart title={"Test"} type="BAR" data={chartData} />
          <Chart title={"Test"} type="BAR" data={chartData} />
        </Col>
      </Row>
    </div>
  );
}

export default App;
