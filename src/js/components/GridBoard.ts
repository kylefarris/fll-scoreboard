import * as m from 'mithril';
import OverlayOptionBoolean from './OverlayOptionBoolean';
import OverlayOptionNumber from './OverlayOptionNumber';
import type { AbstractScorer, MissionObject, Year } from '../interfaces/ChallengeYear';
import Configuration from '../utils/Configuration';
import CommitForm from './CommitForm';
import trans from '../helpers/trans';
import NoEquipmentIndicator from './NoEquipmentIndicator';
import identity from '../models/Identity';
import scorecard from '../models/Scorecard';

interface GridBoardAttrs {
  data: Year
  score: number,
  missions: MissionObject
  focused_mission: number
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  scorer: AbstractScorer<MissionObject, any>
  focusMission: (mission: number) => void
}

export default class GridBoard implements m.ClassComponent<GridBoardAttrs> {
  view(vnode: m.Vnode<GridBoardAttrs>) {
    const { data, missions, focused_mission, score, scorer, focusMission } = vnode.attrs;

    // Only show the scoregrid if the user is not authenticated or the app is offline.
    // or if they ARE authenticated and they have actually initialized a new tabulation.
    // Otherwise show them a message informing them of what to do.
    if (
      identity.isAuthenticated && scorecard.tabulation.id === null && !identity.noEvents && !identity.errorMsg
    ) {
      return m('div#no-match-started', [
        m('img.calcbot', {
          src: `${Configuration.imagePath}calcbot.png`,
          alt: 'cute robot',
          height: 235,
        }),
        identity.chosenEvent ?
          m('span', [
            'You must ',
            m('a', { className: 'modal-trigger', href: "#new-match-modal" }, ['start a match']),
            ' before you can score a team!'
          ]) :
          m('div#event-picker', [
            m('label', { for: 'event-chooser' }, ['Choose the event you are at:']),
            m(
              'select#event-chooser',
              { onchange(e) { identity.setActiveEvent(e.target.value) } },
              [
                m('option', { value: '', disabled: true, selected: true }, ['Choose Event']),
                ...identity.events.map(v => m('option', { value: v.id }, [v.name]))
              ],
            ),
          ]),
      ]);
    }

    if (identity.authChecked) {
      return m('.scoreboard__grid', {
        className: focused_mission !== -1 ? ' --overlay-open' : '',
      }, data.missions.map((mission, missionIndex) => {
        return [
          m('.scoreboard__grid__mission',
            {
              style: `display: ${mission.number === 'GP' && scorecard.commitForm.scoreLocked ? 'none' : 'block'};`,
            },
            [
              mission.no_equipment_constraint ? m(NoEquipmentIndicator) : null,
              m('.number', {
                onclick() {
                  focusMission(missionIndex);
                },
              }, mission.number === null ? 'PM' : (mission.number === 'GP' ? 'GP' : `M${(`0${mission.number}`).slice(-2)}`)),
              m('.title', trans(mission.title)),
              mission.description ? m('.description', trans(mission.description)) : null,
            ]
          ),
          mission.tasks.map(task => task.options.map((option, optionIndex) => m(`.scoreboard__grid__option${optionIndex > 0 ? '.part-of-previous-task' : ''}`,
          {
            style: `display: ${mission.number === 'GP' && scorecard.commitForm.scoreLocked ? 'none' : 'flex'};`,
          },
          [
            m('div', trans(option.title)),
            option.type === 'boolean' ? m(OverlayOptionBoolean, {
              task,
              option,
              missions,
              controlOnly: true,
            }) : (option.type === 'number' ? m(OverlayOptionNumber, {
              option,
              missions,
              controlOnly: true,
            }) : m('span', `err type ${option.type}`)),
          ]))),
          mission.constraints ? m('.constraints', m('ul.browser-default', mission.constraints.map(constraint => m('li', trans(constraint))))) : null,
        ];
      }),
      (identity.isAuthenticated && identity.chosenEvent ? m(CommitForm, { score, missions, scorer }) : null),
      );
    }
  }
}
