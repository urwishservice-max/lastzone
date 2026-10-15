import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ExperienceProvider } from './context/ExperienceContext';
import LandingPage from './pages/LandingPage';
import PlayPage from './pages/PlayPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LeaderboardPage from './pages/LeaderboardPage';
import WeaponsPage from './pages/WeaponsPage';

import FriendsPage from './pages/FriendsPage';
import TournamentPage from './pages/TournamentPage';
import ScraperPage from './pages/ScraperPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Preserved Spartan 3D Scrollytelling Experience */}
          <Route
            path="/"
            element={
              <ExperienceProvider>
                <LandingPage />
              </ExperienceProvider>
            }
          />

          {/* Real Unity WebGL Game Combat Sector */}
          <Route path="/play" element={<PlayPage />} />

          {/* Spartan Weapons & JS Event Handling Laboratory */}
          <Route path="/weapons" element={<WeaponsPage />} />

          {/* User Authentication & Operative Enlistment */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Persistent Global Rankings & Personal Best */}
          <Route path="/leaderboard" element={<LeaderboardPage />} />

          {/* Drag & Drop Friends Tactical Network Tree */}
          <Route path="/friends" element={<FriendsPage />} />

          {/* Tournament Match Center & Player Combat Profile History */}
          <Route path="/tournaments" element={<TournamentPage />} />

          {/* Operative Profile Link Scraper */}
          <Route path="/scraper" element={<ScraperPage />} />

          {/* Fallback to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
