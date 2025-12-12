import React from 'react'
import './PracticePromo.css'

export default function PracticePromo() {
  return (
    <div className="practice-promo">
      <div className="promo-content">
        <h3 className="promo-title">Ready to practice real signs?</h3>
        <p className="promo-subtitle">
          Our AI camera detects your hand movements in real-time to give instant feedback.
        </p>
        <button className="promo-btn">Open Practice Mode</button>
      </div>
      <div className="promo-decoration"></div>
    </div>
  )
}
