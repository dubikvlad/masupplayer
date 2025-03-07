/* eslint-disable camelcase */
import LOCALE from '../config/locale'
import en_US from './en_US'
import zh_CN from './zh_CN'
import ru_RU from './ru_RU'

const locale = {
  [LOCALE.en_US]: en_US,
  [LOCALE.zh_CN]: zh_CN,
  [LOCALE.ru_RU]: ru_RU,
}

export default locale
