import React from 'react'
import './SkillBreakdown.css'

export default function SkillBreakdown() {
  // TODO: Replace with API call to fetch user skill data from backend
  // const skills = await axios.get('http://localhost:5000/api/user/skills', { withCredentials: true })
  const skills = [
    { name: 'Vocabulary', value: 85 },
    { name: 'Grammar', value: 72 },
    { name: 'Speed', value: 65 },
    { name: 'Accuracy', value: 90 },
    { name: 'Expression', value: 78 },
    { name: 'Receptive', value: 82 }
  ]

  return (
    <div className="skill-breakdown">
      <div className="skill-header">
        <h3 className="skill-title">Skill Breakdown</h3>
        <p className="skill-subtitle">Your proficiency across different ISL categories.</p>
      </div>

      <div className="skill-radar">
        <svg viewBox="0 0 200 200" className="radar-svg">
          {/* Grid circles */}
          <circle cx="100" cy="100" r="30" className="radar-circle" />
          <circle cx="100" cy="100" r="60" className="radar-circle" />
          <circle cx="100" cy="100" r="90" className="radar-circle" />

          {/* Axis lines */}
          {skills.map((skill, index) => {
            const angle = (index / skills.length) * 2 * Math.PI - Math.PI / 2
            const x = 100 + 90 * Math.cos(angle)
            const y = 100 + 90 * Math.sin(angle)
            return (
              <line key={`axis-${index}`} x1="100" y1="100" x2={x} y2={y} className="radar-axis" />
            )
          })}

          {/* Data polygon */}
          <polygon
            points={skills
              .map((skill, index) => {
                const angle = (index / skills.length) * 2 * Math.PI - Math.PI / 2
                const radius = (skill.value / 100) * 90
                const x = 100 + radius * Math.cos(angle)
                const y = 100 + radius * Math.sin(angle)
                return `${x},${y}`
              })
              .join(' ')}
            className="radar-polygon"
          />

          {/* Labels */}
          {skills.map((skill, index) => {
            const angle = (index / skills.length) * 2 * Math.PI - Math.PI / 2
            const x = 100 + 110 * Math.cos(angle)
            const y = 100 + 110 * Math.sin(angle)
            return (
              <text
                key={`label-${index}`}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="radar-label"
              >
                {skill.name}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
