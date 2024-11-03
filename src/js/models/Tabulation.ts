import * as m from 'mithril';
import { years } from '../global';

const apiBaseUrl = 'https://api.fllgameday.org/tabulation';

export interface Runs {
    match1: number,
    match2: number,
    match3: number,
    practice: number,
}

export interface Team {
    id: number,
    name: string,
    runs: Runs,
}

export interface Season {
    id: number,
    name: string,
    maxScore: number,
    active: boolean,
    startDate: Date,
    endDate: Date,
}

export interface RefEvent {
    id: string,
    name: string,
    teams: Array<Team>,
    season: Season,
}

export interface Referee {
    id: string,
    name: string,
    role: string,
}

export interface RefInfo {
    id: string,
    eventId: string,
    volunteerId: string,
    event: RefEvent,
    volunteer: Referee,
}

export interface TeamList {
    id: number,
    name: string,
}

export interface CommitResult {
    success: boolean,
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    results: any,
    error: string,
}

export interface CommitForm {
    teamNumber: number,
    teamMemberInitials: string,
    scoreApproved: boolean,
    refCode: string,
    teamId: string,
    matchId: string,
    score: number,
    gpScore: number,
    // biome-ignore lint/complexity/noBannedTypes: <explanation>
    missions: Object,
    scoreLocked: boolean,
}

export interface GamedayScoreboard {
    id: number,
}

const runNameMapping = {
    match1: 'Match 1',
    match2: 'Match 2',
    match3: 'Match 3',
    practice: 'Practice',
}

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export default class Tabulation {
    static matches = [];
    static committing = false;
    static noWifi = false;
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
        gpScore: 3,
        missions: {},
        scoreLocked: false,
    };
    static refError: string = null;
    static teamError: string = null;
    static validTeamNumber: boolean = null;

    static async commit() {
        try {
            // Set the Gracious Professionalism score
            const gpKey = Object.keys(Tabulation.commitForm.missions).find(v => /professionalism$/.test(v));
            if (gpKey) Tabulation.commitForm.gpScore = Tabulation.commitForm.missions[gpKey];

            // Store local backup of the tabulation
            const team = Tabulation?.refInfo?.event?.teams?.find(v => v.id === Number.parseInt(Tabulation?.commitForm?.teamId, 10)) ?? {
                name: `Unknown Team #${Tabulation.commitForm.teamId}`,
            };
            // console.log('Team Info: ', team);
            const key = `${Tabulation.commitForm.teamId}-${team.name}-${Tabulation.commitForm.matchId}-${Tabulation?.refInfo?.eventId ?? 'unknown' }`;
            // console.log('Local Save Key: ', key);
            const data = {
                commitForm: Tabulation.commitForm,
                teamName: team.name,
                teamId: Tabulation.commitForm.teamId,
                matchId: Tabulation.commitForm.matchId,
                matchName: runNameMapping[Tabulation.commitForm.matchId],
                eventName: Tabulation.refInfo?.event?.name ?? 'Unknown Event',
                eventId: Tabulation.refInfo?.event?.id ?? 'unknown-event-id',
                refName: Tabulation.refInfo?.volunteer?.name ?? `Referee ${Tabulation.commitForm.refCode}`,
                refRole: Tabulation.refInfo?.volunteer?.role ?? 'Referee',
                seasonName: Tabulation.refInfo?.event?.season?.name ?? years[0].data.meta.slug,
                ts: new Date(),
            }
            // console.log('Local Save Data: ', data);

            if (localStorage.getItem(key)) {
                if (confirm("There is already a complete local backup of this team's match. Are you sure you want to overwrite it?")) {
                    localStorage.setItem(key, JSON.stringify(data));
                } else {
                    if (!confirm('Do you still want to submit to this score to the server?')) {
                        return new Error('Saving score was cancelled by the user. Score was not saved locally or on Gameday servers.');
                    }
                }
            } else {
                // console.log('Backup stored locally');
                localStorage.setItem(key, JSON.stringify(data));
            }

            // Send tabulation to the server
            const result: CommitResult = await m.request({
                method: 'POST',
                url: `${apiBaseUrl}/commit`,
                body: Tabulation.commitForm,
                responseType: 'json',
                extract: (xhr) => xhr.response,
            });

            if (result && result?.success === true && result?.results?.newTabulationResult?.inserted === 1 && result?.results?.scoreUpdateResult?.replaced === 1) {
                // Reset the commit form
                Tabulation.resetCommitForm();
                return true;
            }

            if (Tabulation.noWifi) {
                Tabulation.resetCommitForm();
                return true;
            }

            return new Error(result.error);
        } catch (err) {
            // @todo Show some errors
            if (err.code === 403) {
                return new Error('The scoreboard has been locked. No updates are currently allowed. Please try again later.');
            }

            if (Tabulation.noWifi) {
                console.log('Error caught while no wifi: ', err);
                return true;
            }

            // console.error(`${err.code}: ${err.response?.error ?? 'Unknown Error'}`);
            return false;
        }
    }

    static async checkConnectivity() {
        try {
            const result:GamedayScoreboard = await m.request({
                method: 'GET',
                url: 'https://api.fllgameday.org/scoreboard/3EBE2C161BFB',
                responseType: 'json',
            });

            if (Array.isArray(result) && result.length > 0 && result[0]?.id) {
                console.log('Connection is back!');
                Tabulation.noWifi = false;
                return true;
            }
            console.log('Connection is still not working');
            console.log(result);
            return false;
        } catch (err) {
            console.log('No connection still');
            Tabulation.noWifi = true;
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
        Tabulation.commitForm.scoreLocked = false;
        Tabulation.commitForm.gpScore = 3;
    }

    static async getRefInfo(unlock = false) {
        if (!/^[A-Z0-9]{6}$/i.test(Tabulation.commitForm.refCode)) return;

        try {
            const result: RefInfo = await m.request({
                method: 'POST',
                url: `${apiBaseUrl}/login`,
                body: { refCode: Tabulation.commitForm.refCode.toUpperCase() },
            });

            Tabulation.noWifi = false;

            if (result?.eventId) {
                Tabulation.refError = null;
                Tabulation.refInfo = result;
                // Get teams from the Ref Info and only show ones that still have runs left
                Tabulation.teams = Tabulation.refInfo.event.teams
                    .filter(v => Object.values(v.runs).some(x => x === null))
                    .map(v => ({ id: v.id, name: v.name }));
                
                Tabulation.teams.unshift({ id: 0, name: '' });
                
                // Pre-choose team based on the code provided by the team (should be possible)
                // biome-ignore lint/suspicious/noDoubleEquals: <explanation>
                if (Tabulation.teams.some(v => v.id == Tabulation.commitForm.teamNumber)) {
                    console.log('Pre-selecting team: ', Tabulation.commitForm.teamNumber);
                    setTimeout(() => {
                        Tabulation.commitForm.teamId = Tabulation.commitForm.teamNumber.toString();
                    }, 0);
                } else {
                    console.log(
                        'Team-provided team number does not match any valid teams for the event.',
                        Tabulation.teams.map(v => v.id),
                        Tabulation.commitForm.teamNumber,
                        Tabulation.teams.some(v => v.id === Tabulation.commitForm.teamNumber),
                        // biome-ignore lint/suspicious/noDoubleEquals: <explanation>
                        Tabulation.teams.some(v => v.id == Tabulation.commitForm.teamNumber)
                    );
                }
            } else {
                console.error('No ref: ', result);
            }
        }  catch (err) {
            console.error('Ref Error:', err?.code, err?.response);
            if (err?.code === 0 && err?.response === null) {
                console.log('No internet connectivity');
                Tabulation.noWifi = true;
                
                if (unlock === false) {
                    Tabulation.commitForm.teamId = Tabulation.commitForm?.teamNumber?.toString();
                    Tabulation.matches = Object.keys(runNameMapping).map(v => ({
                        id: v,
                        name: runNameMapping[v],
                    }));
                    // Put practice match at the top
                    const practiceIndex = Tabulation.matches.findIndex(v => v.name === 'Practice');
                    if (practiceIndex > 0) {
                        Tabulation.matches.unshift(Tabulation.matches.splice(practiceIndex, 1)[0]);
                    }

                    // Pre-select Practice match
                    Tabulation.commitForm.matchId = Tabulation.matches[0].id;
                }
            }
            Tabulation.refError = err?.response?.err ?? 'No internet connectivity!';
            Tabulation.resetRef(err?.response?.err);
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

        // If practice run is in the list, put it at the top
        const practiceIndex = Tabulation.matches.findIndex(v => v.name === 'Practice');
        if (practiceIndex > 0) {
            Tabulation.matches.unshift(Tabulation.matches.splice(practiceIndex, 1)[0]);
        }

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
