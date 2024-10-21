import React, { useState, useEffect, useRef, useCallback } from 'react'
import cls from 'classnames'
import download from 'downloadjs'
import getIsMobile from 'is-mobile'
import Slider from 'rc-slider/lib/Slider'
import Switch from 'rc-switch'
import { createPortal } from 'react-dom'
import Draggable from 'react-draggable'
import Sortable, { Swap } from 'sortablejs'
import AudioListsPanel from './components/AudioListsPanel'
import CircleProcessBar from './components/CircleProcessBar'
import ProgressBar from './components/ProgressBar'
import {
  AnimatePauseIcon,
  AnimatePlayIcon,
  ArrowDownIcon,
  CloseIcon,
  DeleteIcon,
  DownloadIcon,
  EmptyIcon,
  FaMinusSquareOIcon,
  LoadIcon,
  LoopIcon,
  LyricIcon,
  NextAudioIcon,
  OrderPlayIcon,
  PlayListsIcon,
  PrevAudioIcon,
  ReloadIcon,
  RepeatIcon,
  ShufflePlayIcon,
  VolumeMuteIcon,
  VolumeUnmuteIcon,
} from './components/Icon'
import Loading from './components/Loading'
import AudioPlayerMobile from './components/PlayerMobile'
import PlayModel from './components/PlayModel'
import { AUDIO_LIST_REMOVE_ANIMATE_TIME } from './config/animate'
import { SPACE_BAR_KEYCODE } from './config/keycode'
import LOCALE from './config/locale'
import { MEDIA_QUERY } from './config/mediaQuery'
import { MODE } from './config/mode'
import { AUDIO_NETWORK_STATE, AUDIO_READY_STATE } from './config/audioState'
import PLAY_MODE from './config/playMode'
import PROP_TYPES from './config/propTypes'
import {
  PROGRESS_BAR_SLIDER_OPTIONS,
  VOLUME_BAR_SLIDER_OPTIONS,
} from './config/slider'
import { THEME } from './config/theme'
import { VOLUME_FADE } from './config/volumeFade'
import {
  DEFAULT_PLAY_INDEX,
  DEFAULT_VOLUME,
  DEFAULT_REMOVE_ID,
  PLAYER_KEY,
} from './config/player'
import SORTABLE_CONFIG from './config/sortable'
import LOCALE_CONFIG from './locale'
import Lyric from './lyric'
import {
  adjustVolume,
  arrayEqual,
  createRandomNum,
  formatTime,
  isSafari,
  uuId,
} from './utils'

Sortable.mount(new Swap())

const IS_MOBILE = getIsMobile()

const DEFAULT_ICON = {
  pause: <AnimatePauseIcon />,
  play: <AnimatePlayIcon />,
  destroy: <CloseIcon />,
  close: <CloseIcon />,
  delete: <DeleteIcon size={24} />,
  download: <DownloadIcon size={26} />,
  toggle: <FaMinusSquareOIcon />,
  lyric: <LyricIcon />,
  volume: <VolumeUnmuteIcon size={26} />,
  mute: <VolumeMuteIcon size={26} />,
  next: <NextAudioIcon />,
  prev: <PrevAudioIcon />,
  playLists: <PlayListsIcon />,
  reload: <ReloadIcon size={22} />,
  loop: <LoopIcon size={26} />,
  order: <OrderPlayIcon size={26} />,
  orderLoop: <RepeatIcon size={26} />,
  shuffle: <ShufflePlayIcon size={26} />,
  loading: <LoadIcon />,
  packUpPanelMobile: <ArrowDownIcon size={26} />,
  empty: <EmptyIcon />,
}

const ReactJkMusicPlayer = (props) => {
  const [state, setState] = useState({
    audioLists: props.audioLists || [],
    playId: '',
    name: '',
    cover: '',
    singer: '',
    category: '',
    musicSrc: '',
    lyric: '',
    currentLyric: '',
    isMobile: IS_MOBILE,
    toggle: props.mode === MODE.FULL,
    playing: false,
    currentTime: 0,
    soundValue: DEFAULT_VOLUME,
    moveX: 0,
    moveY: 0,
    loading: false,
    audioListsPanelVisible: false,
    playModelNameVisible: false,
    theme: props.theme || THEME.DARK,
    playMode: props.playMode || props.defaultPlayMode || '',
    currentAudioVolume: 0,
    initAnimate: false,
    isInitAutoPlay: props.autoPlay,
    isInitRemember: false,
    loadedProgress: 0,
    removeId: DEFAULT_REMOVE_ID,
    isNeedMobileHack: IS_MOBILE,
    audioLyricVisible: false,
    isAutoPlayWhenUserClicked: false,
    playIndex: props.playIndex || props.defaultPlayIndex || DEFAULT_PLAY_INDEX,
    canPlay: false,
    currentVolumeFade: VOLUME_FADE.NONE,
    currentVolumeFadeInterval: undefined,
    updateIntervalEndVolume: undefined,
    isAudioSeeking: false,
    isResetCoverRotate: false,
  })

  console.log('props___________', props)
  console.log('State', state)

  const [audio, setAudio] = useState(null)

  const playerRef = useRef()
  const audioRef = useRef(null)
  const destroyBtnRef = useRef()
  const [sortable, setSortable] = useState(null)
  // eslint-disable-next-line no-use-before-define
  const locale = getLocale()

  const shouldShowPlayIcon =
    !state.playing || state.currentVolumeFade === VOLUME_FADE.OUT

  function onAudioListsSortEnd({ oldIndex, newIndex }) {
    if (oldIndex === newIndex) {
      return
    }

    const updatedAudioLists = [...state.audioLists]
    const item = updatedAudioLists.splice(oldIndex, 1)[0]
    updatedAudioLists.splice(newIndex, 0, item)

    setState((prevState) => ({
      ...prevState,
      audioLists: updatedAudioLists,
      playId: oldIndex === state.playId ? newIndex : state.playId,
    }))
  }

  useEffect(() => {
    const element = document.querySelector(`.${SORTABLE_CONFIG.selector}`)
    if (element) {
      setSortable(
        new Sortable(element, {
          onEnd: onAudioListsSortEnd,
          ...SORTABLE_CONFIG,
          ...props.sortableOptions,
        }),
      )
    }

    return () => {
      sortable?.destroy()
    }
  }, [props.sortableOptions, SORTABLE_CONFIG.selector])

  function audioDuration() {
    const { audioLists, playId } = state
    if (!audioLists.length || !audio) {
      return 0
    }
    const { duration } =
      audioLists.find((currentAudio) => currentAudio[PLAYER_KEY] === playId) ||
      {}

    return Math.max(Number(duration) || audio.duration || 0, 0)
  }

  const onTogglePlay = () => {
    setState((prevState) => ({
      ...prevState,
      playing: !prevState.playing,
    }))

    if (state.playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
  }

  const onProgressChange = (currentTime) => {
    if (audioRef.current) {
      audioRef.current.currentTime = currentTime
    }
    setState((prevState) => ({
      ...prevState,
      currentTime,
      isAudioSeeking: true,
    }))
  }

  const onAudioSeeked = () => {
    setState((prevState) => ({ ...prevState, isAudioSeeking: false }))
  }

  const onAudioDownload = () => {
    if (state.musicSrc) {
      download(state.musicSrc)
    }
  }

  function getCurrentPlayIndex() {
    return state.audioLists.findIndex(
      (currentAudio) => currentAudio[PLAYER_KEY] === state.playId,
    )
  }

  function getBaseAudioInfo() {
    const {
      cover,
      name,
      musicSrc,
      soundValue,
      lyric,
      audioLists,
      currentLyric,
    } = state

    const {
      currentTime,
      muted,
      networkState,
      readyState,
      played,
      paused,
      ended,
      startDate,
    } = audio || {}

    const currentPlayIndex = getCurrentPlayIndex()
    const currentAudioListInfo = audioLists[currentPlayIndex] || {}

    return {
      ...currentAudioListInfo,
      cover,
      name,
      musicSrc,
      volume: soundValue,
      currentTime,
      duration: audioDuration,
      muted,
      networkState,
      readyState,
      played,
      paused,
      ended,
      startDate,
      lyric,
      currentLyric,
      playIndex: currentPlayIndex,
    }
  }

  function getLocale() {
    const { locale: propsLocale } = props
    if (typeof propsLocale === 'string') {
      return LOCALE_CONFIG[props.locale]
    }
    return propsLocale ? { ...LOCALE_CONFIG[LOCALE.en_US], ...propsLocale } : {}
  }

  function getAudioTitle() {
    const { audioTitle } = getLocale() || {}
    const { name, singer } = state
    if (typeof audioTitle === 'function' && this.audio) {
      return audioTitle(this.getBaseAudioInfo())
    }
    return audioTitle || `${name}${singer ? ` - ${singer}` : ''}`
  }

  function renderAudioTitle() {
    const { isMobile, name } = state
    if (props.renderAudioTitle) {
      return props.renderAudioTitle(getBaseAudioInfo(), isMobile)
    }
    return isMobile ? name : getAudioTitle()
  }

  function onCoverClick(mode = MODE.FULL) {
    const { showMiniModeCover } = props
    const { cover } = state
    if (!showMiniModeCover && mode === MODE.MINI) {
      return
    }
    if (props.onCoverClick && cover) {
      props.onCoverClick(mode, state.audioLists, getBaseAudioInfo())
    }
  }

  function audioListsPlay(playId, ignore = false) {
    const {
      playId: currentPlayId,
      playing,
      audioLists,
      loading,
      canPlay,
    } = state
    if (audioLists.length === 0) {
      // eslint-disable-next-line no-console
      console.warn('Ваш плейлист пуст и не может быть воспроизведен!')
      return
    }
    if (loading && playId === currentPlayId) {
      return
    }
    const playIndex = audioLists.findIndex(
      (currentAudio) => currentAudio[PLAYER_KEY] === playId,
    )
    const {
      name,
      cover,
      musicSrc,
      singer,
      lyric = '',
      category = '',
    } = audioLists[playIndex] || {}

    // const loadAudio = (originMusicSrc) => {
    //   this.setState(
    //     {
    //       name,
    //       cover,
    //       musicSrc: originMusicSrc,
    //       singer,
    //       category,
    //       playId,
    //       lyric,
    //       currentTime: 0,
    //       playing: false,
    //       loading: true,
    //       canPlay: false,
    //       loadedProgress: 0,
    //       playIndex,
    //       isAutoPlayWhenUserClicked: true,
    //     },
    //     () => {
    //       this.lyric && this.lyric.stop()
    //       this.audio.load()
    //       this.updateMediaSessionMetadata()
    //       setTimeout(() => {
    //         this.initLyricParser()
    //       }, 0)
    //     },
    //   )
    // }
    const loadAudio = (originMusicSrc) => {
      setState((prevState) => ({
        ...prevState,
        name,
        cover,
        musicSrc: originMusicSrc,
        singer,
        category,
        playId,
        lyric,
        currentTime: 0,
        playing: false,
        loading: true,
        canPlay: false,
        loadedProgress: 0,
        playIndex,
        isAutoPlayWhenUserClicked: true,
      }))
      audioRef.current.load()
    }
    // 如果点击当前项 就暂停 或者播放
    if (playId === currentPlayId && !ignore) {
      setState((prevState) => ({
        ...prevState,
        playing: !playing,
      }))
      if (!playing && canPlay) {
        audioRef.current.play()
      } else {
        audioRef.current.pause()
      }
      return
    }

    props.onAudioPlayTrackChange &&
      props.onAudioPlayTrackChange(playId, audioLists, getBaseAudioInfo())
    this.props.onPlayIndexChange && this.props.onPlayIndexChange(playIndex)

    switch (typeof musicSrc) {
      case 'function':
        musicSrc().then(loadAudio, (error) => console.error(error))
        break
      default:
        loadAudio(musicSrc)
    }
  }

  function handlePlay(playMode, isNext = true) {
    const { playId, audioLists } = state
    const audioListsLen = audioLists.length
    if (!audioListsLen) {
      return
    }
    const currentPlayIndex = getCurrentPlayIndex()

    switch (playMode) {
      // 顺序播放
      case PLAY_MODE.order:
        // 拖拽排序后 或者 正常播放 到最后一首歌 就暂停
        if (currentPlayIndex === audioListsLen - 1) {
          audio.pause()
          return
        }

        this.audioListsPlay(
          isNext
            ? audioLists[currentPlayIndex + 1][PLAYER_KEY]
            : audioLists[currentPlayIndex - 1][PLAYER_KEY],
        )
        break

      // 列表循环
      case PLAY_MODE.orderLoop:
        if (isNext) {
          if (currentPlayIndex === audioListsLen - 1) {
            return audioListsPlay(audioLists[0][PLAYER_KEY])
          }
          audioListsPlay(audioLists[currentPlayIndex + 1][PLAYER_KEY])
        } else {
          if (currentPlayIndex === 0) {
            return audioListsPlay(audioLists[audioListsLen - 1][PLAYER_KEY])
          }
          audioListsPlay(audioLists[currentPlayIndex - 1][PLAYER_KEY])
        }
        break

      // 单曲循环
      case PLAY_MODE.singleLoop:
        audio.currentTime = 0
        audioListsPlay(playId, true)
        break

      // 随机播放
      case PLAY_MODE.shufflePlay:
        {
          let randomIndex = createRandomNum(0, audioListsLen - 1)
          if (randomIndex === this.getCurrentPlayIndex()) {
            randomIndex = this.getPlayIndex(randomIndex + 1)
          }
          const randomPlayId = (audioLists[randomIndex] || {})[PLAYER_KEY]
          audioListsPlay(randomPlayId, true)
        }
        break
      default:
        break
    }
  }

  function audioPrevAndNextBasePlayHandle(isNext = true) {
    const { playMode } = state
    let _playMode = ''
    switch (playMode) {
      case PLAY_MODE.shufflePlay:
        _playMode = playMode
        break
      default:
        _playMode = PLAY_MODE.orderLoop
        break
    }
    handlePlay(_playMode, isNext)
  }

  function onPlayPrevAudio() {
    const { restartCurrentOnPrev } = props
    if (restartCurrentOnPrev && audio.currentTime > 1) {
      audio.currentTime = 0
      return
    }

    audioPrevAndNextBasePlayHandle(false)
  }

  function onPlayNextAudio() {
    audioPrevAndNextBasePlayHandle(true)
  }

  const formattedCurrentTime = formatTime(state.currentTime)

  return createPortal(
    <div
      className={cls('react-jinke-music-player-main', {
        'light-theme': state.theme === THEME.LIGHT,
        'dark-theme': state.theme === THEME.DARK,
      })}
      ref={playerRef}
      tabIndex="-1"
    >
      {/* <div className="controls">
        <button type="button" onClick={onTogglePlay}>
          {state.playing ? <AnimatePauseIcon /> : <AnimatePlayIcon />}
        </button>
        <span onClick={onAudioDownload}>
          <DownloadIcon />
        </span>
      </div> */}
      <div
        className={cls('music-player-panel', 'translate', {
          'glass-bg': props.glassBg,
        })}
      >
        <section className="panel-content">
          {(!state.autoHiddenCover ||
            (state.autoHiddenCover && state.cover)) && (
            <div
              className={cls('img-content', 'img-rotate', {
                'img-rotate-pause': !state.playing || !state.cover,
                'img-rotate-reset': state.isResetCoverRotate,
              })}
              style={{ backgroundImage: `url(${state.cover})` }}
              onClick={() => onCoverClick()}
            />
          )}
          <div className="progress-bar-content">
            <span className="audio-title" title={state.audioTitle}>
              {renderAudioTitle()}
              <span className="tag" title={state.category}>
                {state.category}
              </span>
            </span>
            <section className="audio-main">
              <span className="current-time" title={formattedCurrentTime}>
                {state.loading ? '--' : formattedCurrentTime}
              </span>
              <div className="progress-bar">
                <ProgressBar
                  showProgressLoadBar={props.showProgressLoadBar}
                  state={state}
                  audioRef={audioRef}
                  onProgressChange={onProgressChange}
                  onAudioSeeked={onAudioSeeked}
                  PROGRESS_BAR_SLIDER_OPTIONS={PROGRESS_BAR_SLIDER_OPTIONS}
                />
              </div>
            </section>
          </div>
          <div className="player-content">
            {!props.showPlay ? (
              state.loading && <Loading />
            ) : (
              <span className="group">
                <span
                  className="group prev-audio"
                  title={locale.previousTrackText}
                  onClick={onPlayPrevAudio}
                >
                  <PrevAudioIcon />
                </span>
                {state.loading ? (
                  <span
                    className="group loading-icon"
                    title={locale.loadingText}
                  >
                    <Loading />
                  </span>
                ) : (
                  <span
                    className="group play-btn"
                    onClick={onTogglePlay}
                    title={
                      shouldShowPlayIcon
                        ? locale.clickToPlayText
                        : locale.clickToPauseText
                    }
                  >
                    {shouldShowPlayIcon ? (
                      <AnimatePlayIcon />
                    ) : (
                      <AnimatePauseIcon />
                    )}
                  </span>
                )}
                <span
                  className="group next-audio"
                  title={locale.nextTrackText}
                  onClick={onPlayNextAudio}
                >
                  <NextAudioIcon />
                </span>
              </span>
            )}

            {/* {ReloadComponent}
            {DownloadComponent}
            {ThemeSwitchComponent}
            {extendsContent || null} */}

            {/* 音量控制 */}
            {/* <span className="group play-sounds" title={locale.volumeText}>
              {soundValue === 0 ? (
                <span className="sounds-icon" onClick={this.onResetVolume}>
                  {this.iconMap.mute}
                </span>
              ) : (
                <span className="sounds-icon" onClick={this.onAudioMute}>
                  {this.iconMap.volume}
                </span>
              )}
              <Slider
                value={soundValue}
                onChange={this.onAudioSoundChange}
                className="sound-operation"
                {...VOLUME_BAR_SLIDER_OPTIONS}
              />
            </span> */}

            {/* {PlayModeComponent}

            {LyricComponent} */}

            {/* <span
              className="group audio-lists-btn"
              title={locale.playListsText}
              onClick={this.openAudioListsPanel}
            >
              <span className="audio-lists-icon">{this.iconMap.playLists}</span>
              <span className="audio-lists-num">{audioLists.length}</span>
            </span> */}

            {/* {toggleMode && (
              <span
                className="group hide-panel"
                title={locale.toggleMiniModeText}
                onClick={this.onHidePanel}
              >
                {this.iconMap.toggle}
              </span>
            )} */}

            {/* {DestroyComponent} */}
          </div>
        </section>
      </div>
      <audio ref={audioRef} src={state.musicSrc} />
    </div>,
    document.body,
  )
}

export default ReactJkMusicPlayer
