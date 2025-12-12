import React,{useState} from 'react'
import { useNavigate } from 'react-router-dom';



async function handleClick() {
    console.log('Button clicked! Fetching all details...');
    const api = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    const details = await fetch(api);
    const data = await details.json();
    console.log('Details fetched:', data);
}


function Test() {

    const navigate = useNavigate();

    function handleGet() {
    navigate('/register');
}

    const [count, setCount] = useState(0);

    function getDetails() {
        console.log('Getting all details...');
    }
    function increment() {
        setCount(count + 1);
    }
  return (
    <div>
        <h1>Test Component</h1>
        <br />
        <p>This is a test component.</p>
        <button type='button' style={{color: 'red', fontSize: 12}} onClick={handleGet}>Click Me to get all details</button>
        <br />
        <p>Count: {count}</p>
        <button type='button' onClick={increment}>Increment Count</button>
        <br />
        <button type='button' onClick={handleClick}>get all </button>
    </div>
  )
}

export default Test