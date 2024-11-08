import * as m from "mithril";
import {
    ModalPanel,
    Select,
    type ISelectOptions,
} from "mithril-materialized";
import scorecard from "../models/Scorecard";
import identity from "../models/Identity";

export default class StartTabForm implements m.ClassComponent {
    oninit(vnode: m.Vnode) {}
    view(vnode: m.Vnode) {
        return m(ModalPanel, {
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
                    m(Select, {
                        dropdownOptions: { container: document.body }, // So the select is not hidden
                        placeholder: "Choose a Team to Score",
                        id: "new-team-id",
                        isMandatory: true,
                        options: identity.teams.map((v) => ({
                            id: v.id,
                            label: v.prettyName,
                        })),
                        onchange: null,
                        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                    } as ISelectOptions<any>),
                    m(Select, {
                        dropdownOptions: { container: document.body }, // So the select is not hidden
                        placeholder: "Choose Match to Score",
                        id: "new-match-id",
                        isMandatory: true,
                        options: [
                            { id: "practice", label: "Practice" },
                            { id: "match1", label: "Match 1" },
                            { id: "match2", label: "Match 2" },
                            { id: "match3", label: "Match 3" },
                            { id: "tieBreaker", label: "Tie Breaker" },
                        ],
                        onchange: null,
                        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                    } as ISelectOptions<any>),
                    m(Select, {
                        dropdownOptions: { container: document.body }, // So the select is not hidden
                        placeholder: "Choose the Table  You're At",
                        id: "new-table-id",
                        isMandatory: true,
                        options: identity.tables.map((v) => ({
                            id: v.id,
                            label: v.name,
                        })),
                        onchange: null,
                        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                    } as ISelectOptions<any>),
                    m('input#referee-id[type="hidden"]', {
                        value: identity.refereeId,
                    })
                ]
            ),
            options: { opacity: 0.7 },
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

                        scorecard.init(teamId, matchId, tableId, refereeId);
                    },
                },
            ],
        });
    }
}
