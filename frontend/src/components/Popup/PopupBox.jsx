import React from "react";
import "./PopupBox.css";
import { useNavigate } from "react-router-dom";

const PopupBox = ({ onClose }) => {
  const navigate = useNavigate();
  return (
    <div className="popup-overlay">
      <div className="popup-box">
        <h2>🎉 You have learnt 5 sentences in ISL</h2>
        <p>
          Yay! Want to learn more? <br />
          Sign up here:
        </p>
        <button
          className="signup-btn"
          onClick={() => navigate("/register")}
        >
          Sign Up
        </button>
        <button className="close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default PopupBox;
