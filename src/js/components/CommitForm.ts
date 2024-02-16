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

    return m('div', [
      m('.team-signature-form', [
        m('h3', 'Team Zone'),
        m('p', 'Please verify the results. Once you are satisfied, type your team number and your intials into the fields below and press "Approve Score".'),
        m('p', 'Once you approve the results, you cannot change your mind!'),
        m(
          'form',
          {
            onsubmit(e) {
              e.preventDefault();
              Tabulation.commitForm.scoreApproved = true;
            },
          },
          [
            m('.field-group', [
              m('label', 'Your Team Number'),
              m('input', {
                type: 'number',
                name: 'teamNumber',
                class: 'input-field',
                max: 99999,
                async oninput(e) {
                  Tabulation.commitForm.teamNumber = parseInt(e.target.value, 10);

                  // Re-check matching codes if team code is changed after approving
                  if (Tabulation.commitForm.refCode && Tabulation.commitForm.teamId) {
                    Tabulation.validateTeamNumber();
                  }
                },
                value: Tabulation.commitForm.teamNumber,
              }),
            ]),
            m('.field-group', [
              m('label', 'Your Initials'),
              m('input', {
                type: 'text',
                name: 'teamMemberInitials',
                class: 'input-field',
                maxlength: 3,
                oninput(e) {
                  Tabulation.commitForm.teamMemberInitials = e.target.value;
                },
                value: Tabulation.commitForm.teamMemberInitials,
              }),
            ]),
            m(
              'button',
              {
                type: 'submit',
                disabled: !Tabulation.commitForm.teamNumber || Tabulation.commitForm.teamMemberInitials.length < 2 || Tabulation.commitForm.scoreApproved
              },
              'Approve Score'
            )
          ]
        )
      ]),
      m('.gameday-form',
      [
        m('h3', 'Referee Zone'),
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
                maxlength: 6,
                disabled: !Tabulation.commitForm.scoreApproved,
                class: `input-field${Tabulation.refError !== null ? ' invalid' : ''}`,
                async oninput(e) {
                  // Tabulation.commitForm.refCode = e.target.value.toUpperCase();

                  if (e.target.value.length === 6) {
                    await Tabulation.getRefInfo();
                    setTimeout(() => {
                      if (Tabulation.refError !== null) {
                        fail(Tabulation.refError.toString());
                        Tabulation.resetRef(Tabulation.refError);
                      }
                    }, 0);
                  } else {
                    Tabulation.resetRef();
                  }
                },
                value: Tabulation.commitForm.refCode,
              }),
            ]),
            m('.field-group', [
              m('label', 'Team Scored'),
              Tabulation.teamError ? m('small.error-info', Tabulation.teamError) : undefined,
              m('select', {
                name: 'teamId',
                disabled: !Tabulation.refInfo?.eventId || Tabulation.commitForm.refCode.length !== 6,
                class: Tabulation.validTeamNumber === false ? 'invalid' : '',
                oninput(e) {
                  Tabulation.commitForm.teamId = e.target.value;
                  Tabulation.validateTeamNumber();
                  if (Tabulation.validTeamNumber) {
                    Tabulation.getMatches();
                  } else {
                    fail(Tabulation.teamError);
                  }
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
      ])
    ])
  }
}
