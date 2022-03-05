import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Login from './login/Login';
import Home from './home/Home';
import useToken from './useToken';
import React from 'react';


function App() {
  const { setToken } = useToken();

  if (localStorage.getItem('token') === null) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Login setToken={setToken} />} />
          <Route path='/login' element={<Login setToken={setToken} />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home ref={(element) => {window.helloComponent = element}}/>} />
        <Route path='/login' element={<Home ref={(element) => {window.helloComponent = element}}/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
