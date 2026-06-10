import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [data, setData] = useState(0);

  useEffect(() => {
    axios
      .get("/api")
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        console.error("Error fetching data from the server", err);
      });
  }, []);

  return (
    <>
    {data.message ? <h1>{data.message}</h1> : <p>Loading...</p>}
    </>
  );
}

export default App;
