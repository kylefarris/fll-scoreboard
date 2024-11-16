import * as m from 'mithril';
import { NumericHashReader } from '../utils/NumericHashReader';
import { config, years } from '../global';
import type { YearLink } from '../global';
import GamedayModel from './GamedayModel';
import identity from './Identity';
import type {AbstractScorer, Mission, MissionObject } from '../interfaces/ChallengeYear';

const runNameMapping = {
    match1: 'Match 1',
    match2: 'Match 2',
    match3: 'Match 3',
    practice: 'Practice',
}

export interface Team {
    id: string,
    teamNumber: string,
    name: string,
    size: number,
    country: string,
    region: string,
    city: string,
    active: boolean,
    foundingDate: Date,
    inactiveDate: Date,
}

export interface League {
    name: string,
}

export interface Season {
    name: string,
}

export interface GamedayEvent {
    id: string,
    name: string,
    startDate: Date,
    endDate: Date,
    active: boolean,
    Season: Season,
    League: League,
}

export interface EventTeam {
    id: string,
    name: string,
    teamSize: number,
    customTeamId: string,
    Team: Team,
    Event: GamedayEvent,
}

export interface User {
    id: string,
    firstName: string,
    lastName: string,
}

export interface Volunteer {
    id: string,
    firstName: string,
    lastName: string,
    User: User,
}

export interface VolunteerRole {
    id: string,
    name: string,
}

export interface EventVolunteer {
    id: string,
    Volunteer: Volunteer,
    VolunteerRole: VolunteerRole,
}

export interface Referee {
    id: string,
    EventVolunteer: EventVolunteer,
}

export interface TablePair {
    id: string,
    table1: string,
    table2: string,
}

export interface Table {
    id: string,
    name: string,
}

export interface Tabulation {
    id: string,
    EventTeam: EventTeam,
    Referee: Referee,
    Table: Table,
    matchId: string
    score: number,
    gpScore: number,
    scoreApproved: boolean,
    teamMemberInitials: string,
    teamNumber: number,
    tab: object,
    createdAt: Date,
    updatedAt: Date,
}

export interface CommitForm {
    teamMemberInitials: string,
    scoreApproved: boolean,
    refCode: string,
    score: number,
    gpScore: number,
    missions: object,
    scoreLocked: boolean,
}

export interface CommitResult {
    success: boolean,
    error: string,
}

export interface RefValidationResult {
    valid: boolean,
}

export interface MatchOption {
    id: string,
    label: string,
}

class Scorecard extends GamedayModel {
    public committing: boolean;
    public refError: string;
    public teamError: string;
    public validTeamNumber: boolean;
    public tabulation: Tabulation;
    public commitForm: CommitForm;
    public eventTeamId: string;
    public matchId: string;
    public tableId: string;
    public refereeId: string;
    public teamMatches: MatchOption[];

    constructor() {
        super();
        this.reset();
    }

    /**
     * Determines the gracious professionalism key from the list of missions.
     */
    public getGpKey(): string {
        return Object.keys(this.commitForm.missions).find(v => /professionalism$/.test(v));
    }

    /**
     * Allows a referee to cancel working on a specific tabulation for whatever reason.
     * Progress of the tabulation 
     */
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    public  cancelTabulation(scorer: AbstractScorer<MissionObject, any>, missions: MissionObject): void {
        if (window.confirm('Are you sure you want to cancel this match? You can continue where you left off by restarting it later.')) {
            this.reset();

            const initial = scorer.initialMissionsState();
            for (const key in initial) {
                missions[key] = initial[key];
            }
            // window.history.pushState('', document.title, window.location.pathname);
        }
    }

    /**
     * Checks whether the commit for is in a state that is sufficient
     * for submission to the the API server as a complete tabulation
     */
    public checkFormSubmitable(): boolean {
        const errorIntro = 'Cannot Submit Scorecard:';

        if (this.commitForm.score === null) {
            this.handleErrors(`${errorIntro} No score to send!`);
            return false;
        }
        if (Object.keys(this.commitForm.missions).length === 0) {
            this.handleErrors(`${errorIntro} No missions have been scored!`);
            return false;
        }
        if (!this.commitForm.refCode || !/^[A-Z0-9]{6}$/.test(this.commitForm.refCode)) {
            this.handleErrors(`${errorIntro} Invalid Referee Code provided! Should be 6 alphanumeric characters!`);
            return false;
        }
        if (!this.commitForm.scoreApproved) {
            this.handleErrors(`${errorIntro} Team has not approved the score!`);
            return false;
        }
        if (!this.commitForm.teamMemberInitials || !/[A-Z .]{2,6}/.test(this.commitForm.teamMemberInitials.trim().toUpperCase())) {
            this.handleErrors(`${errorIntro} No/Invalid team initials. Should be 2-3 letters.`);
            return false;
        }

        return true;
    }

    /**
     * Makes the final submission of this scorecard to the API.
     *
     * @returns {Promise<boolean>}
     */
    public async commit(): Promise<boolean> {
        this.committing = true;
        
        try {
            // Set the Gracious Professionalism score
            const gpKey = this.getGpKey();
            if (gpKey) this.commitForm.gpScore = this.commitForm.missions[gpKey];

            // Store local backup of the tabulation
            const team = this.tabulation.EventTeam;
            const key = this.tabulation.id;
            
            const data = {
                commitForm: this.commitForm,
                teamName: team.name,
                eventTeamId: this.eventTeamId,
                matchId: this.matchId,
                matchName: runNameMapping[this.matchId],
                eventName: this.tabulation.EventTeam.Event.name,
                eventId: this.tabulation.EventTeam.Event.id,
                refName: identity.me.name,
                refRole: identity.me.roles?.[0] ?? 'Referee',
                seasonName: this.tabulation.EventTeam.Event.Season.name ?? years[0].data.meta.slug,
                ts: new Date(),
            }
            // console.log('Local Save Data: ', data);

            if (localStorage.getItem(key)) {
                if (window.confirm("There is already a complete local backup of this team's match. Are you sure you want to overwrite it?")) {
                    localStorage.setItem(key, JSON.stringify(data));
                } else if (!window.confirm('Do you still want to submit to this score to the server?')) {
                    throw new Error('Saving score was cancelled by the user. Score was not saved locally or on Gameday servers.');
                }
            } else {
                // console.log('Backup stored locally');
                localStorage.setItem(key, JSON.stringify(data));
            }

            // Send tabulation to the server
            const result: Tabulation = await m.request({
                method: 'POST',
                url: `${config.apiBaseUrl}/tabulation/${this.tabulation.id}/commit`,
                body: this.commitForm,
                responseType: 'json',
                withCredentials: true,
                extract: (xhr) => xhr.response,
            });

            if (result?.id === this.tabulation.id && result?.scoreApproved === true) {
                // Reset the commit form
                this.reset();
                return true;
            }

            if (this.noWifi) {
                this.reset();
                return true;
            }
        } catch (err) {
            this.handleErrors(err);

            if (this.noWifi) {
                console.log('Error caught while no wifi: ', err);
                return true;
            }

            // console.error(`${err.code}: ${err.response?.error ?? 'Unknown Error'}`);
            return false;
        } finally {
            this.committing = false;
        }
    }

    /**
     * Get a dropdown-compatible list of all matches that a team has not yet already
     * had a fully-submitted tabulation record for.
     *
     * @public
     * @async
     * @param {Event} e - ID of the event Team to get get matches of
     * @returns {Promise<MatchOption[]>} Dropdown-compatible list of matches a team can be scored on
     */
    public async getTeamMatches(e): Promise<MatchOption[]> {
        const eventTeamId: string = e.target.value;
        const teamMatches: [] = await m.request({
            method: 'GET',
            url: `${config.apiBaseUrl}/tabulation/${eventTeamId}/unscored-matches`,
            responseType: 'json',
            withCredentials: true,
        });

        this.teamMatches = teamMatches.map((v) => ({
            id: config.matchTypesInverted[v],
            label: v
        }));

        // document.getElementById('new-match-id').innerHTML = this.teamMatches.map((v, i) => {
        //     return `<option value="${v.id}" ${i === 0 ? 'selected' : ''}>${v.label}</option>`;
        // }).join('');

        return this.teamMatches;
    }

    /**
     * Resets the current scorecard by fetching an instance from the server. The 
     * tabulation instance from the server could be a new/fresh scorecard or could
     * be one that was already started.
     *
     * @param {string} eventTeamId - ID of the event team to create new scorecard for
     * @param {string} matchId - ID of the match to create scorecard for
     * @param {string} tableId - ID of the table the match is being held at
     * @param {string} refereeId - ID of the referee doing the scoring
     */
    public async init(eventTeamId: string, matchId: string, tableId: string, refereeId: string, missions: MissionObject) {
        try {
            if (!eventTeamId) throw new Error('No team selected!');
            if (!matchId) throw new Error('No match selected!');
            if (!tableId) throw new Error('No table selected!');
            if (!refereeId) throw new Error("It doesn't look like you are a valid and active referee for this event!");

            const result: Tabulation = await m.request({
                method: 'GET',
                url:`${config.apiBaseUrl}/tabulation/new/${eventTeamId}/${matchId}/${tableId}/${refereeId}`,
                responseType: 'json',
                withCredentials: true,
            });

            if (result?.id) {
                this.reset();

                this.eventTeamId = eventTeamId;
                this.matchId = matchId;
                this.tableId = tableId;
                this.refereeId = refereeId;

                // The order of keys gets messed up in the database when stored so we need to make sure
                // they are correct again for the chosen season.
                const seasonYear: YearLink = years.find(v => v.data.meta.slug === result.EventTeam.Event.Season.name.toLocaleLowerCase());
                const seasonMissions = seasonYear.scorer.initialMissionsState();
                const missionKeys = Object.keys(seasonMissions);
                const missionMap = new Map();
                
                for (const missionKey of missionKeys) {
                    const value = missionKey in result.tab ? result.tab[missionKey] : seasonMissions[missionKey];
                    missionMap.set(missionKey, value);
                }

                const fixedTabulation = Object.fromEntries(missionMap);

                this.tabulation = {
                    id: result.id,
                    EventTeam: result.EventTeam,
                    Referee: result.Referee,
                    Table: result.Table,
                    matchId: result.matchId,
                    score: result.score,
                    gpScore: result.gpScore,
                    scoreApproved: result.scoreApproved,
                    teamMemberInitials: result.teamMemberInitials,
                    teamNumber: result.teamNumber,
                    tab: fixedTabulation,
                    createdAt: result.createdAt,
                    updatedAt: result.updatedAt,
                };

                this.commitForm = {
                    teamMemberInitials: result.teamMemberInitials ?? '',
                    scoreApproved: result.scoreApproved ?? false,
                    refCode: '',
                    score: result.score ?? 50,
                    gpScore: result.gpScore ?? 3,
                    missions: fixedTabulation,
                    scoreLocked: false,
                }

                // Set the page hash to store the scoring state
                const hashReader = new NumericHashReader(this.commitForm.missions);
                const scoreHash = hashReader.encode(this.commitForm.missions);
                location.hash = `#${scoreHash}`;

                // Update the state of each mission based on our stored or initial tabulation
                for (const attr in this.commitForm.missions) {
                    missions[attr] = this.commitForm.missions[attr];
                }
            } else {
                throw new Error('Could not initialize new match.');
            }
        } catch (err) {
            this.handleErrors(err);
        }
    }

    /**
     * A slightly-less nuclear reset option that keeps the current tabulation but
     * resets all the scoring.
     */
    public resetScore() {
        this.tabulation.scoreApproved = false;
        this.tabulation.teamMemberInitials = null;
        this.tabulation.teamNumber = null;
        this.tabulation.tab = {};
        
        this.commitForm.teamMemberInitials = '';
        this.commitForm.scoreApproved = false;
        this.commitForm.refCode = '';
        this.commitForm.score = 0;
        this.commitForm.gpScore = 3;
        this.commitForm.missions = {};
        this.commitForm.scoreLocked = false;

        this.committing = false;
        this.refError = null;
        this.teamError = null;
        this.errorMsg = null;

        this.saveProgress();
    }

    /**
     * Resets the scorecard back to default settings
     */
    public reset() {
        this.committing = false;
        this.refError = null;
        this.teamError = null;
        this.eventTeamId = null;
        this.matchId = null;
        this.tableId = null;
        this.teamMatches = [];
        this.tabulation = {
            id: null,
            EventTeam: null,
            Referee: null,
            Table: null,
            matchId: null,
            score: 0,
            gpScore: 3,
            scoreApproved: false,
            teamMemberInitials: null,
            teamNumber: null,
            tab: null,
            createdAt: null,
            updatedAt: null,
        };
        this.commitForm = {
            teamMemberInitials: '',
            scoreApproved: false,
            refCode: '',
            score: 0,
            gpScore: 3,
            missions: {},
            scoreLocked: false,
        }
        this.errorMsg = null;
    }

    /**
     * Determines whether the current referee code is valid or not.
     *
     * @returns {Promise<boolean>}
     */
    public async isRefCodeValid(): Promise<boolean> {
        // Make sure there is a ref code first
        if (!this.commitForm.refCode) return false;
    
        try {
            // Have the API verify its validity
            const result: RefValidationResult = await m.request({
                method: 'POST',
                url: `${config.apiBaseUrl}/tabulation/${this.tabulation.id}/verify-ref-code`,
                body: { refCode: this.commitForm.refCode.toUpperCase() },
                withCredentials: true,
            });

            if (result?.valid === true) {
                this.refError = null;
                return true;
            }
            this.refError = 'Invalid referee code.';
            return false;
        } catch (err) {
            this.refError = err;
            this.handleErrors(err);
            return false;
        }
    }

    /**
     * Saves any progress with the tabulation to the server & LocalStorage without
     * actually officially submitting the final tabulation.
     */
    public async saveProgress(): Promise<void> {
        const data = {
            tab: this.commitForm.missions,
            score: this.commitForm.score,
            gpScore: 3,
        };
        
        const gpKey = this.getGpKey();
        if (gpKey) data.gpScore = this.commitForm.missions[gpKey];

        await m.request({
            method: 'PATCH',
            url: `${config.apiBaseUrl}/tabulation/${this.tabulation.id}`,
            body: data,
            withCredentials: true,
        });
    }

    /**
     * Toggles locked state of the score board. A valid referee code is required to
     * unlock the scoreboard. No authorization is required to lock it in the first place.
     */
    public async toggleLock(): Promise<void> {
        try {
            // Locking doesn't require any special privileges
            if (this.commitForm.scoreLocked === false) this.commitForm.scoreLocked = true;

            // ... but unlocking needs authorization
            else {
                // Collect the referee code to unlock
                const refCode = prompt('Provide your referee code to unlock scoring:');

                // If it matches the format of a valid referee code
                if (/^[A-Z0-9]{6}$/i.test(refCode?.trim() ?? '')) {
                    this.commitForm.refCode = refCode.toUpperCase().trim();

                    // Verify that the referee code is valid for the logged in user
                    const codeIsValid: boolean = await this.isRefCodeValid();
                    if (codeIsValid) {
                        this.commitForm.scoreLocked = false;
                    } else {
                        this.handleErrors('Referee code does not match');
                    }
                } else if (refCode) {
                    this.handleErrors('Invalid referee code provided! Should be 6 letters and numbers.');
                }
            }
        } catch (err) {
            this.handleErrors(err);
        }
    }
}

export default new Scorecard();
