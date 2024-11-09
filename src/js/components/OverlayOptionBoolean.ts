import * as m from 'mithril';
import OverlayImageGallery from './OverlayImageGallery';
import icon from '../helpers/icon';
import trans from '../helpers/trans';
import scorecard from '../models/Scorecard';
import {texts} from '../global';
import type {MissionObject, Option, Task} from '../interfaces/ChallengeYear';

interface OverlayOptionBooleanAttrs {
  task: Task
  option: Option
  missions: MissionObject
  controlOnly?: boolean
}

export default class OverlayOptionBoolean implements m.ClassComponent<OverlayOptionBooleanAttrs> {
  view(vnode: m.Vnode<OverlayOptionBooleanAttrs>) {
    const {task, option, missions, controlOnly} = vnode.attrs;

    return m('label.scoreboard__option', [
      m('input[type=checkbox]', {
        checked: missions[option.handle],
        onchange() {
          // Prevent if the scoring is locked by a ref
          if (scorecard.commitForm.scoreLocked) return false;

          // We need to edit all the other options of that task,
          // switch the state of this option and disable all the others
          // biome-ignore lint/complexity/noForEach: <explanation>
          task.options.forEach(check_option => {
            if (check_option.handle === option.handle) {
              missions[check_option.handle] = !missions[option.handle];
            } else {
              missions[check_option.handle] = false;
            }
          });

          // Save progress after small delay to make sure score is calculated
          setTimeout(scorecard.saveProgress.bind(scorecard), 300);
        },
      }),
      m('.field-box.waves-effect', {
        className: missions[option.handle] ? ' active' : '',
      }, [
        controlOnly ? null : m(OverlayImageGallery, {
          images: option.images,
        }),
        m('.description', [
          m('span.fake-checkbox', icon('check')),
          m('span.title', trans(controlOnly ? texts.strings.yes : option.title)),
          option.points ? m('span.points', `+${option.points}`) :null,
          option.variable_points ? m('span.points', icon('asterisk')):null,
        ]),
      ]),
    ]);
  }
}
