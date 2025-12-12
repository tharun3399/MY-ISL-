import React from 'react'
import './LearningActivity.css'

export default function LearningActivity() {
  // TODO: Replace with API call to fetch weekly learning activity from backend
  // const activities = await axios.get('http://localhost:5000/api/user/activity', { withCredentials: true })
  const activities = [
    { id: 1, day: 'Monday', minutes: 45 },
    { id: 2, day: 'Tuesday', minutes: 60 },
    { id: 3, day: 'Wednesday', minutes: 30 },
    { id: 4, day: 'Thursday', minutes: 75 },
    { id: 5, day: 'Friday', minutes: 50 },
    { id: 6, day: 'Saturday', minutes: 90 },
    { id: 7, day: 'Sunday', minutes: 40 }
  ]

  const maxMinutes = Math.max(...activities.map(a => a.minutes))

  return (
    <div className="learning-activity">
      <div className="activity-header">
        <h3 className="activity-title">📊 Learning Activity</h3>
        <span className="activity-period">This Week</span>
      </div>

      <div className="activity-chart">
        {activities.map(activity => (
          <div key={activity.id} className="chart-bar-container">
            <div className="chart-bar-wrapper">
              <div
                className="chart-bar"
                style={{
                  height: `${(activity.minutes / maxMinutes) * 150}px`
                }}
              ></div>
              <span className="chart-label">{activity.day.slice(0, 3)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="activity-footer">
        <div className="activity-stat">
          <span className="stat-name">Total Time</span>
          <span className="stat-val">
            {activities.reduce((sum, a) => sum + a.minutes, 0)} mins
          </span>
        </div>
        <div className="activity-stat">
          <span className="stat-name">Average</span>
          <span className="stat-val">
            {Math.round(activities.reduce((sum, a) => sum + a.minutes, 0) / activities.length)} mins
          </span>
        </div>
        <div className="activity-stat">
          <span className="stat-name">Best Day</span>
          <span className="stat-val">
            {activities.find(a => a.minutes === maxMinutes)?.day.slice(0, 3)}
          </span>
        </div>
      </div>
    </div>
  )
}
