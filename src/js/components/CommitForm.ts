import * as m from 'mithril';
import { MissionObject } from '../interfaces/ChallengeYear';
import Tabulation from '../models/Tabulation';
import { AbstractScorer } from '../interfaces/ChallengeYear';

interface CommitFormAttrs {
  missions: MissionObject
  score: number,
  scorer: AbstractScorer<MissionObject, any>,
}

// const uuidRgx = new RegExp(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
const matchKeys = ['match1', 'match2', 'match3', 'practice'];

function fail(msg) {
  M.toast({
    html: msg,
    classes: 'red text-white',
  });
}

export default class CommitForm implements m.ClassComponent<CommitFormAttrs> {
  oninit(vnode: m.Vnode<CommitFormAttrs, this>) {
    const { score, missions } = vnode.attrs;
    Tabulation.commitForm.score = score;
    Tabulation.commitForm.missions = missions;
  }
  view(vnode: m.Vnode<CommitFormAttrs, this>) {
    const { scorer, missions, score } = vnode.attrs;

    // Update missions and score into model each time they change
    Tabulation.commitForm.score = score;
    Tabulation.commitForm.missions = missions;

    return m(
      '.gameday-form',
      [
        m('p', 'Once the team has verified the score with you, please provide the necessary information to officially submit this score the FLL Gameday system.'),
        m(
          'form.commit-tabulation',
          {
            async onsubmit(e) {
              e.preventDefault();

              // Verify that all required fields are provided
              if (Tabulation.commitForm.score === null) return fail('No score to send!');
              if (Object.keys(Tabulation.commitForm.missions).length === 0) return fail('No missions have been scored!');
              if (!Tabulation.commitForm.refCode || !/^[A-Z0-9]{6}$/.test(Tabulation.commitForm.refCode)) return fail('Invalid Referee Code provided!');
              if (!Tabulation.commitForm.teamId || !/^\d{5}$/.test(Tabulation.commitForm?.teamId?.toString())) return fail('No/Invalid "Team Scored" selected!');
              if (!Tabulation.commitForm.matchId || !matchKeys.includes(Tabulation.commitForm.matchId)) return fail('No/Invalid "Match Scored" value.');

              // console.log('Tabulation Data: ', Tabulation.commitForm);
              // return;

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
                type: 'text',
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
