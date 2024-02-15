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
    static commitForm = {
        refCode: '',
        teamId: null,
        matchId: null,
        score: null,
        missions: {},
    };
    static refError: Error = null;

    static async commit() {
        try {
            const result: CommitResult = await m.request({
                method: 'POST',
                url: `${apiBaseUrl}/commit`,
                body: Tabulation.commitForm,
            });

            if (result && result?.success === true && result?.results?.newTabulationResult?.inserted === 1 && result?.results?.scoreUpdateResult?.replaced === 1) {
                // Reset the commit form
                this.commitForm.refCode = '';
                this.commitForm.teamId = null;
                this.commitForm.matchId = null;

                return true;
            }

            return false;
        } catch (err) {
            // @todo Show some errors
            return false;
        }
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
            }
        }  catch (err) {
            Tabulation.refError = err;
        }
    }

    static async getMatches() {
        if (!Tabulation.refInfo?.event?.teams) {
            console.error('No Referee info yet', Tabulation.refInfo);
            return [];
        }

        if (!Tabulation.commitForm.teamId) return []

        const team = Tabulation.refInfo.event.teams.find(v => v.id == Tabulation.commitForm.teamId);
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
}
