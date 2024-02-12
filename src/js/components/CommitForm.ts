import * as m from 'mithril';
import { MissionObject } from '../interfaces/ChallengeYear';
import Tabulation from '../models/Tabulation';
import { AbstractScorer } from '../interfaces/ChallengeYear';

interface CommitFormAttrs {
  missions: MissionObject
  score: number,
  scorer: AbstractScorer<MissionObject, any>,
}

export default class CommitForm implements m.ClassComponent<CommitFormAttrs> {
  oninit(vnode: m.Vnode<CommitFormAttrs, this>) {
    const { score, missions } = vnode.attrs;
    Tabulation.commitForm.score = score;
    Tabulation.commitForm.missions = missions;
  }
  view(vnode: m.Vnode<CommitFormAttrs, this>) {
    const { scorer, missions } = vnode.attrs;

    return m(
      '.gameday-form',
      [
        m('p', 'Once the team has verified the score with you, please provide the necessary information to officially submit this score the FLL Gameday system.'),
        m(
          'form.commit-tabulation',
          {
            async onsubmit(e) {
              e.preventDefault();
              try {
                const result = await Tabulation.commit();
                if (result === true) {
                  const initial = scorer.initialMissionsState();
                  Object.keys(initial).forEach(key => {
                    missions[key] = initial[key];
                  });

                  M.toast({
                    html: 'Score Received!',
                    classes: 'green text-white',
                  });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              } catch (err) {
                M.toast({
                    html: err,
                    classes: 'red text-white',
                  });
              }
            },
          },
          [
            m('.field-group', [
              m('label', 'Your Referee Code'),
              m('input', {
                type: 'password',
                name: 'refCode',
                class: 'input-field',
                async onblur(e) {
                  // console.log('Supposed to be doing stuff.', e.target.value, Tabulation.commitForm.refCode);
                  if (Tabulation.commitForm.refCode === e.target.value || !e.target.value?.length) return;
                  Tabulation.commitForm.refCode = e.target.value.toUpperCase();
                  await Tabulation.getRefInfo();
                },
                value: Tabulation.commitForm.refCode,
              }),
            ]),
            m('.field-group', [
              m('label', 'Team Scored'),
              m('select', {
                name: 'teamId',
                disabled: !Tabulation.refInfo?.eventId,
                oninput(e) {
                  Tabulation.commitForm.teamId = e.target.value;
                  Tabulation.getMatches();
                },
                value: Tabulation.commitForm.teamId,
              }, Tabulation.teams.map(v => {
                return m('option', { value: v.id }, v.id ? `${v.id} - ${v.name}` : '')
              })),
            ]),
            m('.field-group', [
              m('label', 'Match Scored'),
              m('select', {
                name: 'matchId',
                disabled: !Tabulation.refInfo?.eventId || !Tabulation.commitForm.teamId,
                oninput(e) {
                  Tabulation.commitForm.matchId = e.target.value;
                },
                value: Tabulation.commitForm.matchId,
              }, Tabulation.matches.map(v => {
                return m('option', { value: v.id }, v.name)
              })),
            ]),
            m(
              'button',
              {
                type: 'submit',
                disabled: !Tabulation.refInfo?.eventId || !Tabulation.commitForm.teamId || !Tabulation.commitForm.matchId
              },
              'Submit Score'
            )
          ]
        ),
      ]
    )
  }
}
