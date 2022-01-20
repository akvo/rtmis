import logo from './logo.svg';
import './App.css';
import api from './util/api';


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
function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <p>
          <button onClick={apiTest}> Test API </button>
        </p>
        <p>
          <button onClick={loginTest}> Login </button>
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
