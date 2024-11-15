import * as m from "mithril";
import type { MissionObject } from "../interfaces/ChallengeYear";
import scorecard from "../models/Scorecard";
import type { AbstractScorer } from "../interfaces/ChallengeYear";

interface CommitFormAttrs {
    missions: MissionObject;
    score: number;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    scorer: AbstractScorer<MissionObject, any>;
}

export default class CommitForm implements m.ClassComponent<CommitFormAttrs> {
    oninit(vnode: m.Vnode<CommitFormAttrs, this>) {
        const { score, missions } = vnode.attrs;
        scorecard.commitForm.score = score;
        scorecard.commitForm.missions = missions;
    }
    view(vnode: m.Vnode<CommitFormAttrs, this>) {
        const { scorer, missions, score } = vnode.attrs;

        // Update missions and score into model each time they change
        scorecard.commitForm.score = score;
        scorecard.commitForm.missions = missions;

        return m("div", [
            m(".form-lock", [
                m(
                    "p",
                    "Before handing the calculator over to the team to verify their score, you will need to lock the scores. Your referee code will be required to unlock it."
                ),
                m(
                    "button.lock-btn",
                    {
                        async onclick() {
                            await scorecard.toggleLock();
                        },
                    },
                    [
                        m("i", { ariaHidden: "true", class: "fa fa-lock" }),
                        ` ${
                            scorecard.commitForm.scoreLocked ? "Unl" : "L"
                        }ock Scores`,
                    ]
                ),
            ]),
            m(
                ".team-signature-form",
                {
                    style: `display: ${
                        scorecard.commitForm.scoreLocked ||
                        scorecard.commitForm.scoreApproved
                            ? "block"
                            : "none"
                    };`,
                },
                [
                    m("h3", "Team Zone"),
                    m(
                        "p",
                        'Please verify the results. Once you are satisfied, type intials into the field below and press "Approve Score".'
                    ),
                    m(
                        "p",
                        "Once you approve the results, you cannot change your mind!"
                    ),
                    m(
                        "form",
                        {
                            onsubmit(e) {
                                e.preventDefault();
                                scorecard.commitForm.scoreApproved = true;
                            },
                        },
                        [
                            m(".field-group", [
                                m("label", "Your Initials"),
                                m("input", {
                                    type: "text",
                                    name: "teamMemberInitials",
                                    class: "input-field",
                                    maxlength: 3,
                                    readonly:
                                        scorecard.commitForm.scoreApproved,
                                    // oninput(e) {
                                    //     scorecard.commitForm.teamMemberInitials =
                                    //         e.target.value
                                    //             .replace(/[^A-Z]/gi, "")
                                    //             .toUpperCase();
                                    // },
                                    onblur(e) {
                                        scorecard.commitForm.teamMemberInitials =
                                            e.target.value.toUpperCase();
                                    },
                                    value: scorecard.commitForm
                                        .teamMemberInitials,
                                }),
                            ]),
                            m(
                                "button",
                                {
                                    type: "submit",
                                    disabled:
                                        scorecard.commitForm.teamMemberInitials.trim()
                                            .length < 2 ||
                                        scorecard.commitForm.scoreApproved,
                                },
                                "Approve Score"
                            ),
                        ]
                    ),
                ]
            ),
            m(
                ".gameday-form",
                {
                    style: `display: ${
                        scorecard.commitForm.scoreApproved ? "block" : "none"
                    };`,
                },
                [
                    m("h3", "Referee Zone"),
                    m(
                        "p",
                        "Once the team has verified the score with you, please provide the necessary information to officially submit this score to the FLL Gameday system."
                    ),
                    m(
                        "form.commit-tabulation",
                        {
                            async onsubmit(e: Event) {
                                e.preventDefault();

                                // Verify that all required fields are provided
                                if (scorecard.checkFormSubmitable()) {
                                    try {
                                        // Submit the final tabulation
                                        const result = await scorecard.commit();

                                        if (result === true) {
                                            const initial = scorer.initialMissionsState();
                                            for (const key in initial) {
                                                missions[key] = initial[key];
                                            }

                                            window.scrollTo({
                                                top: 0,
                                                behavior: "smooth",
                                            });
                                            M.toast({
                                                html: scorecard.noWifi
                                                    ? "Score Saved Locally Only"
                                                    : "Score Received!",
                                                classes: "black text-white",
                                            });
                                        }
                                    } catch (err) {
                                        M.toast({
                                            html: err,
                                            classes: "red text-white",
                                        });
                                    }
                                }
                            },
                        },
                        [
                            m(".field-group", [
                                scorecard.refError
                                    ? m("small.error-info", scorecard.refError)
                                    : undefined,
                                m("label", "Your Referee Code"),
                                m("input", {
                                    type: "text",
                                    name: "refCode",
                                    maxlength: 6,
                                    disabled:
                                        !scorecard.commitForm.scoreApproved,
                                    class: `input-field${
                                        scorecard.refError !== null
                                            ? " invalid"
                                            : ""
                                    }`,
                                    // async onblur(e) {
                                    //     scorecard.commitForm.refCode =
                                    //         e.target.value.toUpperCase();

                                    //     if (e.target.value.length === 6) {
                                    //         await scorecard.isRefCodeValid();
                                    //     } else {
                                    //         scorecard.refError = null;
                                    //     }
                                    // },
                                    async oninput(e) {
                                        scorecard.commitForm.refCode = e.target.value.toUpperCase();
                                        if (/^[A-Z0-9]{6}$/.test(e.target.value.toUpperCase())) {
                                            await scorecard.isRefCodeValid();
                                        }
                                    },
                                    value: scorecard.commitForm.refCode,
                                }),
                            ]),
                            m(
                                "button",
                                {
                                    type: "submit",
                                    disabled:
                                        (
                                            !scorecard.commitForm.teamMemberInitials ||
                                            !/^[A-Z0-9]{6}$/.test(scorecard.commitForm.refCode) ||
                                            scorecard.refError ||
                                            scorecard.committing
                                        ) &&
                                        !scorecard.noWifi,
                                },
                                "Submit Score"
                            ),
                        ]
                    ),
                ]
            ),
        ]);
    }
}
