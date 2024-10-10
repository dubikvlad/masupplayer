import React from 'react'
import { FaHeadphonesIcon } from '../components/Icon'

export default {
  playModeText: {
    order: 'По порядку',
    orderLoop: 'Зацикливание',
    singleLoop: 'Повтор одного трека',
    shufflePlay: 'В случайном порядке',
  },
  openText: 'Открыть',
  closeText: 'Закрыть',
  emptyText: 'Нет музыки',
  clickToPlayText: 'Играть',
  clickToPauseText: 'Пауза',
  nextTrackText: 'Следующий трек',
  previousTrackText: 'Предыдущий трек',
  reloadText: 'Заново',
  volumeText: 'Громкость',
  playListsText: 'Плейлист',
  toggleLyricText: 'Toggle lyric',
  toggleMiniModeText: 'Свернуть',
  destroyText: 'Закрыть',
  downloadText: 'Скачать',
  lightThemeText: 'L',
  darkThemeText: 'D',
  switchThemeText: 'Dark/Light mode',
  removeAudioListsText: 'Удалить все треки',
  clickToDeleteText: (name) => `Нажать для удаления ${name}`,
  controllerTitle: <FaHeadphonesIcon />,
  emptyLyricText: 'No lyric',
  loadingText: 'Загрузка',
}
