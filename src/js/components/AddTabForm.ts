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

        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        const teamSelectOptions: ISelectOptions<any> = {
            dropdownOptions: { container: document.body }, // So the select is not hidden
            label: 'Team',
            placeholder: "Choose a Team to Score",
            id: "new-team-id",
            isMandatory: true,
            options: identity.teams.map((v) => ({
                id: v.id,
                label: v.prettyName,
            })),
            onchange: scorecard.getTeamMatches.bind(scorecard),
        };

        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        const tableSelectOptions: ISelectOptions<any> = {
            dropdownOptions: { container: document.body }, // So the select is not hidden
            placeholder: "Choose the Table You're At",
            label: 'Table',
            id: "new-table-id",
            isMandatory: true,
            options: identity.tables.map((v) => ({
                id: v.id,
                label: v.name,
            })),
            onchange: null,
        };

        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        const matchSelectOptions: ISelectOptions<any> = {
            dropdownOptions: { container: document.body }, // So the select is not hidden
            placeholder: "Choose Match to Score",
            label: 'Match',
            id: "new-match-id",
            isMandatory: true,
            options: scorecard.teamMatches,
            onchange: null,
        };

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
                    m(Select, teamSelectOptions),
                    m(Select, matchSelectOptions),
                    m(Select, tableSelectOptions),
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
                        if (i === 0) el.value = teamSelectOptions.placeholder;
                        else if (i === 1) el.value = matchSelectOptions.placeholder;
                        else if (i === 2) el.value = tableSelectOptions.placeholder;
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
