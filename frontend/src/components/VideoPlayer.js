import React, { useState, useRef, useEffect } from 'react';
import './VideoPlayer.css';

const VideoPlayer = ({ videoUrl, onVideoComplete, courseId, moduleId, videoId }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [watchedPercentage, setWatchedPercentage] = useState(0);
  const [isYouTubeVideo, setIsYouTubeVideo] = useState(false);
  const [youTubeVideoId, setYouTubeVideoId] = useState(null);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check if the URL is a YouTube URL and extract video ID
  useEffect(() => {
    if (videoUrl) {
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = videoUrl.match(youtubeRegex);
      
      if (match) {
        setIsYouTubeVideo(true);
        setYouTubeVideoId(match[1]);
      } else {
        setIsYouTubeVideo(false);
        setYouTubeVideoId(null);
      }
    }
  }, [videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      setCurrentTime(video.currentTime);
      const progressPercent = (video.currentTime / video.duration) * 100;
      setProgress(progressPercent);
      setWatchedPercentage(progressPercent);
    };

    const updateDuration = () => {
      setDuration(video.duration);
    };

    const handleVideoEnd = () => {
      setIsCompleted(true);
      setWatchedPercentage(100);
      // Mark video as completed when 95% or more is watched
      if (onVideoComplete) {
        onVideoComplete({
          courseId,
          moduleId,
          videoId,
          watchedPercentage: 100,
          completed: true
        });
      }
    };

    // Check if user watched at least 90% to mark as completed
    const checkCompletion = () => {
      if (video.currentTime / video.duration >= 0.9 && !isCompleted) {
        setIsCompleted(true);
        if (onVideoComplete) {
          onVideoComplete({
            courseId,
            moduleId,
            videoId,
            watchedPercentage: (video.currentTime / video.duration) * 100,
            completed: true
          });
        }
      }
    };

    // Set initial volume
    video.volume = volume;
    
    // Set initial styles
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';
    video.style.display = 'block';

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('timeupdate', checkCompletion);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', handleVideoEnd);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('timeupdate', checkCompletion);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', handleVideoEnd);
    };
  }, [courseId, moduleId, videoId, onVideoComplete, isCompleted, volume]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * video.duration;
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const toggleFullscreen = () => {
    const videoContainer = videoRef.current?.parentElement;
    if (!videoContainer) return;

    if (!document.fullscreenElement) {
      if (videoContainer.requestFullscreen) {
        videoContainer.requestFullscreen();
      } else if (videoContainer.webkitRequestFullscreen) {
        videoContainer.webkitRequestFullscreen();
      } else if (videoContainer.mozRequestFullScreen) {
        videoContainer.mozRequestFullScreen();
      } else if (videoContainer.msRequestFullscreen) {
        videoContainer.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!videoRef.current) return;
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          videoRef.current.currentTime += 5;
          break;
        case 'ArrowLeft':
          e.preventDefault();
          videoRef.current.currentTime -= 5;
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(prev => Math.min(1, prev + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(prev => Math.max(0, prev - 0.1));
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [togglePlay, toggleFullscreen]);

  // Handle YouTube video completion (simplified tracking)
  const handleYouTubeComplete = () => {
    setIsCompleted(true);
    setWatchedPercentage(100);
    if (onVideoComplete) {
      onVideoComplete({
        courseId,
        moduleId,
        videoId,
        watchedPercentage: 100,
        completed: true
      });
    }
  };

  return (
    <div className="video-player-container">
      <div className="video-wrapper">
        {isYouTubeVideo ? (
          // YouTube Embed
          <div className="youtube-container">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youTubeVideoId}?rel=0&modestbranding=1&showinfo=0&fs=1&iv_load_policy=3&controls=1&disablekb=0&playsinline=1&loop=1&playlist=${youTubeVideoId}`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="youtube-iframe"
              referrerPolicy="strict-origin-when-cross-origin"
            ></iframe>
            
          </div>
        ) : (
          // Direct Video File
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              className="video-element"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              controlsList="nodownload"
              onContextMenu={(e) => e.preventDefault()} // Disable right-click
              controls={false} // Remove native controls to use custom controls
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            
            {/* Custom Controls for direct videos */}
            <div className="video-controls">
              <button className="play-pause-btn" onClick={togglePlay}>
                {isPlaying ? '⏸' : '▶'}
              </button>
              
              <div className="progress-container" onClick={handleSeek}>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="time-display">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
              
              <div className="volume-control">
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1" 
                  value={volume}
                  onChange={handleVolumeChange}
                  className="volume-slider"
                />
              </div>
              
              <button className="fullscreen-btn" onClick={toggleFullscreen}>
                {isFullscreen ? '⛶' : '⛶'}
              </button>
              
              {isCompleted && (
                <div className="completion-badge">
                  ✓ Completed
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      {!videoUrl && (
        <div className="video-info">
          <div className="no-video-error">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎬</div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>Video Not Available</h3>
              <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0 0 1rem 0' }}>
                This video content is not currently available.
              </p>
              <div style={{ 
                background: 'rgba(102, 126, 234, 0.1)', 
                padding: '0.75rem', 
                borderRadius: '6px', 
                border: '1px solid rgba(102, 126, 234, 0.2)' 
              }}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569' }}>
                  <strong>Tip:</strong> Contact your instructor or administrator for assistance.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
