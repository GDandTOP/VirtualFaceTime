import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import IndexScreen from '../screens/IndexScreen';
import WaitingScreen from '../screens/WaitingScreen';
import VideoCallScreen from '../screens/VideoCallScreen';
import { MatchData } from '../services/matchingService';

type Screen = 'index' | 'waiting' | 'videoCall';

export default function AppNavigator() {
  const [screen, setScreen] = useState<Screen>('index');
  const [uid, setUid] = useState<string>('');
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  // 최근 통화한 유저 uid 목록 (최대 3명) — 재매칭 방지에 사용
  const [recentContacts, setRecentContacts] = useState<string[]>([]);

  const handleStart = (userId: string) => {
    setUid(userId);
    setScreen('waiting');
  };

  const handleMatched = (data: MatchData) => {
    setMatchData(data);
    setScreen('videoCall');
  };

  const handleCancel = () => {
    setScreen('index');
  };

  const handleCallEnd = (partnerUid: string) => {
    setRecentContacts(prev => {
      const updated = [partnerUid, ...prev.filter(id => id !== partnerUid)];
      return updated.slice(0, 3);
    });
    setMatchData(null);
    setScreen('waiting');
  };

  // 영상통화 화면에서는 밝은 상태바, 그 외에는 어두운 상태바
  const statusBarStyle = screen === 'videoCall' ? 'light' : 'dark';

  return (
    <>
      <StatusBar style={statusBarStyle} />
      {screen === 'index' && (
        <IndexScreen onStart={handleStart} />
      )}
      {screen === 'waiting' && (
        <WaitingScreen
          uid={uid}
          recentContacts={recentContacts}
          onMatched={handleMatched}
          onCancel={handleCancel}
        />
      )}
      {screen === 'videoCall' && matchData && (
        <VideoCallScreen
          uid={uid}
          matchData={matchData}
          onCallEnd={handleCallEnd}
        />
      )}
    </>
  );
}
