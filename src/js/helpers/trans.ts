import lang from './lang';
import type { TranslatedText } from '../interfaces/ChallengeYear';

export default function trans(data: TranslatedText) {
  return data[lang.getLang()];
}
