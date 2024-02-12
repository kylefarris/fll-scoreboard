import * as m from 'mithril';
import { MissionObject } from '../interfaces/ChallengeYear';
import Tabulation from '../models/Tabulation';

interface CommitFormAttrs {
  missions: MissionObject
  score: number,
}

export default class CommitForm implements m.ClassComponent<CommitFormAttrs> {
  oninit(vnode: m.Vnode<CommitFormAttrs, this>) {
    const { score, missions } = vnode.attrs;
    Tabulation.commitForm.score = score;
    Tabulation.commitForm.missions = missions;
  }
  view() {
    return m(
      '.gameday-form',
      [
        m('p', 'Once the team has verified the score with you, please provide the necessary information to officially submit this score the FLL Gameday system.'),
        m(
          'form.commit-tabulation',
          {
            async onsubmit(e) {
                e.preventDefault();
                await Tabulation.commit();
            },
          },
          [
            m('input[type=hidden]', { type: 'hidden', name: 'score', value: Tabulation.commitForm.score }),
            m('input[type=hidden]', { type: 'hidden', name:'missions', value: Tabulation.commitForm.missions }),
            m('.field-group', [
              m('label', 'Your Referee Code'),
              m('input', {
                type: 'password',
                name: 'refCode',
                class: 'input-field',
                async onblur(e) {
                  if (Tabulation.commitForm.refCode === e.target.value || !e.target.value?.length) return;
                  Tabulation.commitForm.refCode = e.target.value;
                  await Tabulation.getRefInfo();
                },
                value: Tabulation.commitForm.refCode,
              }),
            ]),
            m('.field-group', [
              m('label', 'Team Scored'),
              m('select', {
                name: 'teamId',
                oninput(e) {
                  Tabulation.commitForm.teamId = e.target.value;
                },
                value: Tabulation.commitForm.teamId,
              }, Tabulation.teams.map(v => {
                return m('option', { value: v.id }, `${v.id} - ${v.name}`)
              })),
            ]),
            m('.field-group', [
              m('label', 'Match Scored'),
              m('select', {
                name: 'matchId',
                oninput(e) {
                  Tabulation.commitForm.teamId = e.target.value;
                },
                value: Tabulation.commitForm.teamId,
              }, Tabulation.matches.map(v => {
                return m('option', { value: v.id }, v.name)
              })),
            ]),
            m(
              'button',
              { type: 'submit' },
              'Submit Score'
            )
          ]
        ),
      ]
    )
  }
}
