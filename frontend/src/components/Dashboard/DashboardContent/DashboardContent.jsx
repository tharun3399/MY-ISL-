import React from 'react'
import WelcomeCard from '../WelcomeCard/WelcomeCard'
import StatsCards from '../StatsCards/StatsCards'
import LearningActivity from '../LearningActivity/LearningActivity'
import CommunityRanks from '../CommunityRanks/CommunityRanks'
import PracticePromo from '../PracticePromo/PracticePromo'
import './DashboardContent.css'

export default function DashboardContent({ user, stats, screenSize }) {
  return (
    <div className={`dashboard-content-wrapper dashboard-content-${screenSize}`}>
      <WelcomeCard 
        userName={user.name || 'User'} 
        streak={stats.dailyStreak} 
        rank={stats.rank} 
      />
      
      <StatsCards stats={stats} />
      
      <div className="dashboard-sections">
        <div className="dashboard-section-row">
          <div className="dashboard-section-item">
            <LearningActivity />
          </div>
          <div className="dashboard-section-item">
            <CommunityRanks />
          </div>
        </div>

        <div className="dashboard-section-row">
          <div className="dashboard-section-item">
            <PracticePromo />
          </div>
        </div>
      </div>
    </div>
  )
}
