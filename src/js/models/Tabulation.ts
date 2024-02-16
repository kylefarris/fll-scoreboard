import * as m from 'mithril';

const apiBaseUrl = 'https://api.fllgameday.org/tabulation';

export interface Runs {
    match1: Number,
    match2: Number,
    match3: Number,
    practice: Number,
}

export interface Team {
    id: Number,
    name: String,
    runs: Runs,
}

export interface RefEvent {
    id: String,
    name: String,
    teams: Array<Team>,
}

export interface Referee {
    id: String,
    name: String,
    role: String,
}

export interface RefInfo {
    id: String,
    eventId: String,
    volunteerId: String,
    event: RefEvent,
    volunteer: Referee
}

export interface TeamList {
    id: Number,
    name: String,
}

export interface CommitResult {
    success: Boolean,
    results: any,
}

export interface CommitForm {
    teamNumber: Number,
    teamMemberInitials: string,
    scoreApproved: Boolean,
    refCode: string,
    teamId: string,
    matchId: string,
    score: Number,
    missions: Object,
}

const runNameMapping = {
    match1: 'Match 1',
    match2: 'Match 2',
    match3: 'Match 3',
    practice: 'Practice',
}

export default class Tabulation {
    static matches = [];
    static refInfo: RefInfo = {
        id: null,
        eventId: null,
        volunteerId: null,
        event: null,
        volunteer: null,
    };
    static teams: Array<TeamList> = [];
    static commitForm: CommitForm = {
        teamNumber: null,
        teamMemberInitials: '',
        scoreApproved: false,
        refCode: '',
        teamId: null,
        matchId: null,
        score: null,
        missions: {},
    };
    static refError: String = null;
    static teamError: String = null;
    static validTeamNumber: Boolean = null;

    static async commit() {
        try {
            const result: CommitResult = await m.request({
                method: 'POST',
                url: `${apiBaseUrl}/commit`,
                body: Tabulation.commitForm,
            });

            if (result && result?.success === true && result?.results?.newTabulationResult?.inserted === 1 && result?.results?.scoreUpdateResult?.replaced === 1) {
                // Reset the commit form
                Tabulation.resetCommitForm();

                return true;
            }

            return false;
        } catch (err) {
            // @todo Show some errors
            return false;
        }
    }

    static resetCommitForm() {
        Tabulation.commitForm.teamNumber = null;
        Tabulation.commitForm.teamMemberInitials = '';
        Tabulation.commitForm.scoreApproved = false;
        Tabulation.commitForm.refCode = '';
        Tabulation.commitForm.teamId = null;
        Tabulation.commitForm.matchId = null;
        Tabulation.commitForm.teamNumber = null;
        Tabulation.commitForm.teamMemberInitials = '';
    }

    static async getRefInfo() {
        if (!/^[A-Z0-9]{6}$/.test(Tabulation.commitForm.refCode)) return;

        try {
            const result: RefInfo = await m.request({
                method: 'POST',
                url: `${apiBaseUrl}/login`,
                body: { refCode: Tabulation.commitForm.refCode },
            });

            if (result?.eventId) {
                Tabulation.refInfo = result;
                // Get teams from the Ref Info and only show ones that still have runs left
                Tabulation.teams = Tabulation.refInfo.event.teams
                    .filter(v => Object.values(v.runs).some(x => x === null))
                    .map(v => ({ id: v.id, name: v.name }));
                
                Tabulation.teams.unshift({ id: 0, name: '' });
                
                // Pre-choose team based on the code provided by the team (should be possible)
                if (Tabulation.teams.some(v => v.id == Tabulation.commitForm.teamNumber)) {
                    console.log('Pre-selecting team: ', Tabulation.commitForm.teamNumber);
                    setTimeout(() => Tabulation.commitForm.teamId = Tabulation.commitForm.teamNumber.toString(), 0);
                } else {
                    console.log(
                        'Come on man...',
                        Tabulation.teams.map(v => v.id),
                        Tabulation.commitForm.teamNumber,
                        Tabulation.teams.some(v => v.id === Tabulation.commitForm.teamNumber),
                        Tabulation.teams.some(v => v.id == Tabulation.commitForm.teamNumber)
                    );
                }
            } else {
                console.error('No ref: ', result);
            }
        }  catch (err) {
            console.error('Ref ERror:', err.code, err.response);
            Tabulation.refError = err.response.err;
            Tabulation.resetRef(err.response.err);
        }
    }

    static async getMatches() {
        if (!Tabulation.refInfo?.event?.teams) {
            console.error('No Referee info yet', Tabulation.refInfo);
            return [];
        }

        if (!Tabulation.commitForm.teamId) return []

        const team = Tabulation.refInfo.event.teams.find(v => v.id.toString() === Tabulation.commitForm.teamId);
        if (!team?.id) {
            console.error('No team found!', Tabulation.commitForm);
            return [];
        }

        // Get all un-scored matches for the selected team
        Tabulation.matches = Object.keys(team.runs)
            .filter(v => team.runs[v] === null)
            .map(v => ({ id: v, name: runNameMapping[v] }));

        Tabulation.commitForm.matchId = Tabulation.matches[0].id;
    }

    static resetRef(err = null) {
        Tabulation.refInfo.id = null;
        Tabulation.refInfo.eventId = null;
        Tabulation.refInfo.volunteerId = null;
        Tabulation.refInfo.event = null;
        Tabulation.refInfo.volunteer = null;
        Tabulation.refError = err;
    }

    static validateTeamNumber() {
        if (Tabulation.commitForm.teamId === Tabulation.commitForm.teamNumber.toString()) {
            Tabulation.validTeamNumber = true;
            Tabulation.teamError = null;
        } else {
            Tabulation.validTeamNumber = false;
            Tabulation.teamError = 'Warning: Team-provided number and selected team do not match!';
        }
    }
}
