import * as m from "mithril";
import type { MissionObject } from '../interfaces/ChallengeYear';
import {
    ModalPanel,
    Select,
    type ISelectOptions,
} from "mithril-materialized";
import scorecard from "../models/Scorecard";
import identity from "../models/Identity";
import { config } from "../global";

interface StartTabFormAttrs {
    missions: MissionObject
}

export default class StartTabForm implements m.ClassComponent<StartTabFormAttrs> {
    oninit(vnode: m.Vnode<StartTabFormAttrs, this>) {
        const { missions } = vnode.attrs;
    }
    view(vnode: m.Vnode<StartTabFormAttrs, this>) {
        const { missions } = vnode.attrs;

        const modal = m(ModalPanel, {
            id: "new-match-modal",
            title: "Start Tabulation of a New Match",
            description: m(
                ".row", // So the content has enough vertical space
                [
                    m('p', [
                        m('small', [
                            m.trust('If you choose a team and match that you&mdash;and only you&mdash;have already started, your progress from that tabulation will be restored instead of a new tabulation record being created (unless that team/match combo has already been officially submitted).')
                        ]),
                    ]),
                    m('label', { for: 'new-team-id' }, ["Team You're Scoring"]),
                    m(
                        'select#new-team-id.select-dropdown',
                        {  onchange: scorecard.getTeamMatches.bind(scorecard) },
                        identity.teams.map((v) => {
                            return m('option', { value: v.id }, [v.prettyName]);
                        })
                    ),
                    m('label', { for: 'new-match-id' }, ['Match to Score']),
                    m('select#new-match-id.select-dropdown',
                        scorecard.teamMatches.map((v) => {
                            return m('option', { value: v.id }, [v.label]);
                        }),
                    ),
                    m('label', { for: 'new-table-id' }, ["Table You're At"]),
                    m('select#new-table-id.select-dropdown',
                        identity.tables.map((v) => {
                            return m('option', { value: v.id }, [v.name]);
                        }),
                    ),
                    m('input#referee-id[type="hidden"]', {
                        value: identity.refereeId,
                    })
                ]
            ),
            options: {
                opacity: 0.7,
                onOpenStart() {
                    const dropdowns = Array.from(document.getElementsByClassName('select-dropdown'));
                    dropdowns.forEach((el: HTMLSelectElement, i) => {
                        el.selectedIndex = -1;
                    });

                    const teamField: HTMLElement = document.getElementById("new-team-id");
                    const matchField: HTMLElement = document.getElementById("new-match-id");
                    const tableField: HTMLElement = document.getElementById("new-table-id");

                    // @ts-ignore
                    teamField.value = null;
                    // @ts-ignore
                    matchField.value = null;
                    // @ts-ignore
                    tableField.value = null;
                },
            },
            buttons: [
                { label: "Cancel" },
                {
                    label: "Create",
                    onclick: (e) => {
                        e.preventDefault();
                        const teamId = (<HTMLSelectElement>(
                            document.getElementById("new-team-id")
                        )).value;
                        const matchId = (<HTMLSelectElement>(
                            document.getElementById("new-match-id")
                        )).value;
                        const tableId = (<HTMLSelectElement>(
                            document.getElementById("new-table-id")
                        )).value;
                        const refereeId = (<HTMLSelectElement>(
                            document.getElementById("referee-id")
                        )).value;

                        scorecard.init(teamId, matchId, tableId, refereeId, missions);
                    },
                },
            ],
        });

        return modal;
    }
}
