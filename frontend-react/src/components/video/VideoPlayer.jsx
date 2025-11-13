// frontend-react/src/components/video/VideoPlayer.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const PlayerContainer = styled.div`
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
`;

const IFrame = styled.iframe`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
`;

const VideoInfo = styled.div`
  margin-top: 16px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const VideoTitle = styled.h3`
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
`;

const VideoDescription = styled.p`
  font-size: 14px;
  color: #666;
  line-height: 1.6;
`;

const VideoMeta = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 12px;
  font-size: 13px;
  color: #999;
`;

const Badge = styled.span`
  padding: 4px 12px;
  background: ${props => props.color || '#667eea'};
  color: white;
  border-radius: 12px;
  font-weight: 600;
  font-size: 12px;
`;

const VideoPlayer = ({ video, onView }) => {
  const [hasViewed, setHasViewed] = useState(false);

  useEffect(() => {
    // Record view after 3 seconds
    if (!hasViewed && video) {
      const timer = setTimeout(() => {
        if (onView) {
          onView(video._id);
        }
        setHasViewed(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [video, hasViewed, onView]);

  if (!video) {
    return <div>Video bulunamadı</div>;
  }

  return (
    <>
      <PlayerContainer>
        <IFrame
          src={`${video.embedUrl}?autoplay=0&rel=0&modestbranding=1`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </PlayerContainer>
      
      <VideoInfo>
        <VideoTitle>{video.title}</VideoTitle>
        <VideoDescription>{video.description}</VideoDescription>
        <VideoMeta>
          <Badge color="#667eea">{video.topic}</Badge>
          <Badge color={
            video.difficulty === 'Kolay' ? '#10b981' :
            video.difficulty === 'Orta' ? '#f59e0b' :
            video.difficulty === 'Zor' ? '#ef4444' :
            '#6b7280'
          }>
            {video.difficulty}
          </Badge>
          {video.classLevel !== 'Tümü' && (
            <Badge color="#8b5cf6">{video.classLevel}. Sınıf</Badge>
          )}
          <span>👁️ {video.viewCount} görüntüleme</span>
          {video.duration > 0 && (
            <span>⏱️ {Math.floor(video.duration / 60)} dk</span>
          )}
        </VideoMeta>
      </VideoInfo>
    </>
  );
};

export default VideoPlayer;
