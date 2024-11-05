import * as m from 'mithril';
import { ModalPanel, Select, type ISelectOptions, type IInputOption } from 'mithril-materialized';
import icon from '../helpers/icon';
import trans from '../helpers/trans';
import OverlayMission from './OverlayMission';
// import TopViewField from './TopViewField';
import Configuration from '../utils/Configuration';
import {texts} from '../global';
import type {AbstractScorer, MissionObject, Year} from '../interfaces/ChallengeYear';
import GridBoard from './GridBoard';
import scorecard from '../models/Scorecard';
import identity from '../models/Identity';

export interface ScoreboardAttrs {
  missions: MissionObject
  data: Year
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  scorer: AbstractScorer<MissionObject, any>
}

export default class Scoreboard implements m.ClassComponent<ScoreboardAttrs> {
  focused_mission = -1
  missionsCount: number
  gridMode = false
  scorecard: typeof scorecard;

  oninit(vnode: m.Vnode<ScoreboardAttrs>) {
    // Need to copy this value because it will be used in a callback without access to vnode
    this.missionsCount = vnode.attrs.data.missions.length;

    this.gridMode = window.localStorage.getItem('gridMode') === '1';

    // The index of the mission to display in extended format
    // If the viewport is large enough we open the first mission in the wizard
    if (!this.gridMode && window.innerWidth > Configuration.openOverlayWhenInnerWidthGreatherThan) {
      this.focused_mission = 0;
    }
  }

  focusMission(mission: string | number) {
    let newIndex = this.focused_mission;

    switch (mission) {
      case 'next':
        if (newIndex < this.missionsCount - 1) {
          newIndex++;
        } else {
          newIndex = -1;
        }
        break;
      case 'prev':
        if (newIndex > -1) {
          newIndex--;
        }
        break;
      case 'close':
        newIndex = -1;
        break;
      default:
        newIndex = typeof mission === 'string' ? Number.parseInt(mission) : mission;
    }

    this.focused_mission = newIndex;
  }

  showCreateNewMatch() {
    alert('Working!');
  }

  view(vnode: m.Vnode<ScoreboardAttrs>) {
    const {missions, data, scorer} = vnode.attrs;
    const output = scorer.computeMissions(missions);
    const score = output.score;

    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const style: any = {
      '--challenge-main-color': data.meta.colors.main,
      '--challenge-missions-color': data.meta.colors.missions,
      '--challenge-scoring-color': data.meta.colors.scoring,
      '--challenge-penalties-color': data.meta.colors.penalties,
    }

    if (data.meta.no_equipment_constraint_icon) {
      style['--challenge-no-equipment-constraint-image'] = `url(${Configuration.imagePath}${data.meta.no_equipment_constraint_icon})`;
    }

    return m('div', {
      style,
    }, [
      m(ModalPanel, {
        id: 'new-match-modal',
        title: 'Start Tabulation of a New Match',
        description: m(
          '.row', // So the content has enough vertical space
          [
            m(Select, {
              dropdownOptions: { container: document.body }, // So the select is not hidden
              placeholder: 'Choose a Team to Score',
              id: 'new-team-id',
              isMandatory: true,
              options: identity.teams.map(v => ({ id: v.id, label: v.prettyName })),
              onchange: null,
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            } as ISelectOptions<any>),
            m(Select, {
              dropdownOptions: { container: document.body }, // So the select is not hidden
              placeholder: 'Choose Match to Score',
              id: 'new-match-id',
              isMandatory: true,
              options: [
                { id: 'practice', label: 'Practice' },
                { id: 'match1', label: 'Match 1' },
                { id: 'match2', label: 'Match 2' },
                { id: 'match3', label: 'Match 3' },
                { id: 'tieBreaker', label: 'Tie Breaker' },
              ],
              onchange: null,
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            } as ISelectOptions<any>),
            m(Select, {
              dropdownOptions: { container: document.body }, // So the select is not hidden
              placeholder: "Choose the Table  You're At",
              id: 'new-table-id',
              isMandatory: true,
              options: identity.tables.map(v => ({ id: v.id, label: v.name })),
              onchange: null,
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            } as ISelectOptions<any>),
          ]
        ),
        options: { opacity: 0.7 },
        buttons: [
          { label: 'Cancel', },
          { label: 'Create', onclick: (e) =>  {
            e.preventDefault();
            const teamId = (<HTMLSelectElement>document.getElementById('new-team-id')).value;
            const matchId = (<HTMLSelectElement>document.getElementById('new-match-id')).value;
            const tableId = (<HTMLSelectElement>document.getElementById('new-table-id')).value;

            scorecard.init(teamId, matchId, tableId);
          }},
        ],
      }),
      m('header.scoreboard__header', [
        m('i.header-block.fas.fa-bars.sidenav-trigger', {
          'data-target': 'menu',
        }),
        m('img.logo', {
          src: Configuration.imagePath + data.meta.logo,
          alt: `${data.meta.title} season logo`,
        }),
        m('.header-block.score', `Score: ${score}`),
        (
          identity.isAuthenticated && identity.chosenEvent ?
            m(
              'button.start_new_tabulation.header-block',
              { className: 'modal-trigger', href: "#new-match-modal" },
              [icon('plus-square'), 'New Match']
            ) :
            m(
              'h1.scoreboard__header__title.header-block',
              [m('em', 'FLL Gameday'), ' Calculator']
            )
        ),
        m('.overlay-nav', {
          className: this.focused_mission !== -1 ? ' active' : '',
        }, [
          m('button.header-block.nav-prev.waves-effect', {
            onclick: () => {
              this.focusMission('prev');
            },
          }, [icon('chevron-left'), ' ', trans(texts.strings.prev)]),
          m('button.header-block.nav-next.waves-effect', {
            onclick: () => {
              this.focusMission('next');
            },
          }, [trans(texts.strings.next), ' ', icon('chevron-right')]),
          m('button.header-block.nav-close.waves-effect', {
            onclick: () => {
              this.focusMission('close');
            },
          }, [trans(texts.strings.close), ' ', icon('close')]),
        ]),
        m('button.header-block.start-overlay', {
          className: this.focused_mission === -1 ? ' active' : '',
          onclick: () => {
            this.focusMission(0);
          },
        }, [icon('magic'), ' ', trans(texts.strings.launch_wizard)]),
      ]),
      m('.scoreboard__warnings', output.warnings.map(
        warning => {
          const warning_key = Object.keys(scorer.warnings).find(key => scorer.warnings[key] === warning);

          let warning_data = null;

          if (warning_key && (warning_key in data.warnings)) {
            warning_data = data.warnings[warning_key];
          } else {
            warning_data = texts.strings.unknown_warning;
          }

          return m('.scoreboard__warning', {
            onclick: () => {
              if (warning_data.mission) {
                const index = data.missions.findIndex(mission => mission.number === warning_data.mission);

                if (index !== -1) {
                  this.focusMission(index);
                }
              }
            },
          }, trans(warning_data).replace('%warning%', warning));
        }
      )),
      m('.offline-error', {
        style: `visibility: ${scorecard.noWifi ? 'visible' : 'hidden'}`
      }, [
        m('span', 'No Internet Connectivity! Local Save Mode Only! '),
        m('a', {
          href: '#',
          async onclick(e) {
            e.preventDefault();
            const result = await scorecard.checkConnectivity();
            if (result) {
              M.toast({
                html: 'Connection Restored!',
                classes: 'green text-white',
              });
            } else {
              M.toast({
                html: 'Connection still not available!',
                classes: 'red text-white',
              });
            }
          }
        }, 'Check Connection')
      ]),
      m(GridBoard, {
        data,
        missions,
        score,
        scorer,
        focused_mission: this.focused_mission,
        focusMission: this.focusMission.bind(this),
        showCreateNewMatch: this.showCreateNewMatch.bind(this),
      }),
      m('.scoreboard__overlay', {
        className: this.focused_mission !== -1 ? ' --open' : '',
      }, data.missions.map(
        (mission, key) => m(OverlayMission, {
          mission,
          key,
          missions,
          focused_mission: this.focused_mission,
        })
      )),
      m('.tools', [
        m('button.btn.btn-larger', {
          onclick() {
            if (window.confirm('Are you sure you want to start over??')) {
              const initial = scorer.initialMissionsState();
              for (const key in initial) {
                missions[key] = initial[key];
              }

              scorecard.reset();
            }
          },
        }, [
          icon('eraser'),
          ' ',
          trans(texts.strings.reset),
        ]),
      ]),
    ]);
  }
}
