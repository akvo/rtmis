import "./App.scss";
import api from "./util/api";
import { Row, Col, Button, Space } from "antd";
import { Chart } from "./components";
import { dummy } from "./util";

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

const { chartData } = dummy;

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
        <Col span={24} align="center">
          <Space>
            <Button onClick={apiTest}> Test API </Button>
            <Button onClick={loginTest}> Login </Button>
          </Space>
        </Col>
      </Row>
      <Row>
        <Chart span={12} title={"Test"} type="BAR" data={chartData} />
        <Chart span={6} title={"Test"} type="PIE" data={chartData} />
        <Chart span={6} title={"Test"} type="PIE" data={chartData} />
      </Row>
    </div>
  );
}

export default App;
