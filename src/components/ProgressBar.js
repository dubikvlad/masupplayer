import React from 'react'
import Slider from 'rc-slider/lib/Slider'

function ProgressBar({
  showProgressLoadBar,
  state,
  audioRef,
  onProgressChange,
  onAudioSeeked,
  PROGRESS_BAR_SLIDER_OPTIONS,
}) {
  return (
    <>
      {showProgressLoadBar && (
        <div
          className="progress-load-bar"
          style={{ width: `${Math.min(state.loadedProgress, 100)}%` }}
        />
      )}
      <Slider
        max={Math.ceil(audioRef.current?.duration || 0)}
        defaultValue={0}
        value={Math.ceil(state.currentTime)}
        onChange={onProgressChange}
        onAfterChange={onAudioSeeked}
        {...PROGRESS_BAR_SLIDER_OPTIONS}
      />
    </>
  )
}

export default ProgressBar
