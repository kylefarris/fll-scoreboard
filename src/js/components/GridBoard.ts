import * as m from 'mithril';
import OverlayOptionBoolean from './OverlayOptionBoolean';
import OverlayOptionNumber from './OverlayOptionNumber';
import type {AbstractScorer, MissionObject, Year} from '../interfaces/ChallengeYear';
import CommitForm from './CommitForm';
import Tabulation from '../models/Tabulation';
import trans from '../helpers/trans';
import NoEquipmentIndicator from './NoEquipmentIndicator';
import identity from '../models/Identity';

interface GridBoardAttrs {
  data: Year
  score: number,
  missions: MissionObject
  focused_mission: number
  scorer: AbstractScorer<MissionObject, any>
  focusMission: (mission: number) => void
}

export default class GridBoard implements m.ClassComponent<GridBoardAttrs> {
  view(vnode: m.Vnode<GridBoardAttrs>) {
    const {data, missions, focused_mission, score, scorer, focusMission} = vnode.attrs;

    return m('.scoreboard__grid', {
      className: focused_mission !== -1 ? ' --overlay-open' : '',
    }, data.missions.map((mission, missionIndex) => {
      return [
        m('.scoreboard__grid__mission',
          {
            style: `display: ${mission.number === 'GP' && Tabulation.commitForm.scoreLocked ? 'none' : 'block'};`,
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
          style: `display: ${mission.number === 'GP' && Tabulation.commitForm.scoreLocked ? 'none' : 'flex'};`,
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
    (identity.isAuthenticated ? m(CommitForm, { score, missions, scorer }) : null),
    );
  }
}
