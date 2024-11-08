import * as m from 'mithril';
import scorecard from '../models/Scorecard';
import { NumericHashReader } from '../utils/NumericHashReader';
import { years } from '../global';

export default class BackupTabulationsPage implements m.ClassComponent {
  view() {
    const backups = Object.keys({ ...localStorage }).filter(v => {
      try {
        return ('commitForm' in JSON.parse(localStorage?.[v]))
      } catch (_err) {
        return false;
      }
    });
    return [
      m('header.scoreboard__header', [
        m('i.header-block.fas.fa-bars.sidenav-trigger', {
          'data-target': 'menu',
        }),
        m('h1.scoreboard__header__title.header-block', [
          m('em', 'FLL Gameday'),
          ' Calculator',
        ]),
      ]),
      m('.backups-page', [
        m('h1', 'Local Tabulation Backups'),
        m('div.info', [
          m('i', { ariaHidden: 'true', class: 'fas fa-info' }),
          m('p',
            `Whenever a scorecard is submitted with a referee code, the tabulation is saved locally on this device (and this device only)
            before being saved on Gameday servers. This is for extra security/backup in case the server is experiencing issues or wifi is
            no longer working.`
          )
        ]),
        m('ul.backups-list', backups.map(v => {
          try {
            const tab = JSON.parse(localStorage[v]);
            const gpKey = scorecard.getGpKey();
            const gpScore = tab.commitForm.missions[gpKey];

            const hashReader = new NumericHashReader(tab.commitForm.missions);
            const scoreHash = hashReader.encode(tab.commitForm.missions);

            // Handle cases where season name is set to 'Unknown Season' (now deprecated)
            const seasonName = (tab?.seasonName ?? 'Unknown Season') === 'Unknown Season' ? years[0].data.meta.slug : tab.seasonName;

            return m('li', [
              m('div.backup-title', [
                m(
                  m.route.Link, {
                    href: `/${seasonName.toLowerCase() ?? `${years[0].data.meta.slug}`}#${scoreHash}`,
                    className: 'waves-effect',
                    onclick() {
                      scorecard.commitForm = tab.commitForm;
                    }
                  },
                  `${tab.teamName} - ${tab.matchName}`
                ),
                m('div.backup-score', [
                  m('strong', 'Score: '),
                  m('span', tab.commitForm.score),
                  m('span', ' | '),
                  m('strong', 'GP: '),
                  m('span', gpScore),
                ]),
              ]),
              m('div.backup-meta', [
                m(
                  'small',
                  [
                    m('u', `Scored By: ${tab.refName}`),
                    m('br'),
                    m('span', tab.eventName),
                    m('br'),
                    m('span', `at ${new Date(tab.ts).toLocaleString()}`),
                  ]
                ),
                m('button.delete-backup', {
                  onclick() {
                    if (confirm('Delete this backup?')) {
                      localStorage.removeItem(v);
                    }
                  }
                }, [
                  m('i', { ariaHidden: 'true', class: 'fa fa-trash' }),
                ])
              ]),
            ])
          } catch (err) {
            // console.error('Could not parse stored tabulation.');
            return '';
          }
        })),
        m(
          'div.no-backups',
          { style: `display: ${backups.length ? 'none' : 'block'};` },
          'There are currently no locally-backed-up tabulations to view.'
        ),
        m('div.backups-danger-zone', { style: `display: ${backups.length ? 'block' : 'none'};` }, [
          m('h3', 'Danger Zone!'),
          m('p', 'Be careful what you press in this area! What happens here cannot be undone!'),
          m('button.delete-all-backups', {
            onclick() {
              if (confirm('Are you sure you want to clear out all locally backed-up tabulations?')) {
                localStorage.clear();
              }
            }
          }, [
            m('i', { ariaHidden: 'true', class: 'fa fa-trash' }),
            ' Delete All Local Backups',
          ])
        ]),
      ]),
    ];
  }
}
