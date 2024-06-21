import * as m from 'mithril';
import Tabulation from '../models/Tabulation';
import { NumericHashReader } from '../utils/NumericHashReader';

export default class BackupTabulationsPage implements m.ClassComponent {
  view() {
    const backups = Object.keys({ ...localStorage }).filter(v => {
      try {
        return ('commitForm' in JSON.parse(localStorage?.[v]))
      } catch (_err) {
        return false;
      }
    });
    console.log('Backups: ', backups);
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
            console.log('Tab:', tab);
            const gpKey = Object.keys(tab.commitForm.missions).find(v => /professionalism$/.test(v));
            const gpScore = tab.commitForm.missions[gpKey];

            const hashReader = new NumericHashReader(tab.commitForm.missions);
            const scoreHash = hashReader.encode(tab.commitForm.missions);
            console.log('The Score Hash: ', scoreHash);

            const seasonName = (tab?.seasonName ?? 'Unknown Season') === 'Unknown Season' ? 'masterpiece' : tab.seasonName;

            return m('li', [
              m('div.backup-title', [
                m(
                  m.route.Link, {
                    href: `/${seasonName.toLowerCase() ?? 'masterpiece'}#${scoreHash}`,
                    className: 'waves-effect',
                    onclick() {
                      Tabulation.commitForm = tab.commitForm;
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
