import * as m from 'mithril';
import { config } from '../global';
import GamedayModel from './GamedayModel';
import type { EventVolunteer } from './Scorecard';

declare const swal: (options: object) => void; 

export interface Role {
    id: string,
    description: string,
    name: string,
};

export interface UserRole {
    Organization: object,
    Pdo: object,
    Role: Role,
    Team: object,
    id: string,
    metadata: object,
    organizationId: string,
    pdoId: string,
    requested: boolean,
    requestedOn: Date,
    roleId: string,
    teamId: string,
    userId: string,
};

export interface Me {
    id: string,
    email: string,
    firstName: string,
    impersonation: Me,
    lastName: string,
    name: string,
    roles: Array<UserRole>,
    verified: boolean,
};

export interface EventTeam {
    id: string,
    name: string,
    prettyName: string,
    customTeamId: string,
};

export interface Season {
    name: string,
}

export interface GamedayEvent {
    id: string,
    name: string,
    startDate: Date,
    endDate: Date,
    Teams: Array<EventTeam>,
    Season: Season,
    isCurrent: boolean,
    isFuture: boolean,
    isPast: boolean,
    lockScoreboard: boolean,
    active: boolean,
};

export interface Table {
    id: string,
    name: string,
}

export type Referee = {
    id: string,
    EventVolunteer: EventVolunteer,
}

class Identity extends GamedayModel {
    authChecked: boolean;
    isAuthenticated: boolean;
    me: Me;
    events: Array<GamedayEvent>;
    teams: Array<EventTeam>;
    tables: Array<Table>;
    noEvents: boolean;
    errorMsg: string;
    chosenEvent: GamedayEvent;
    refereeId: string;

    constructor() {
        super();
        this.reset();
    }

    /**
     * Authenticates a user by making a request to the `me` endpoint
     * of the Gameday API. If the result does not fail and the is an
     * object containing an `id` property, the user must be logged in.
     * If not, that's okay, we just won't set `isAuthenticated` to true.
     */
    async authenticate() {
        try {
            const result: Me = await m.request({
                method: 'GET',
                url:`${config.apiBaseUrl}/me`,
                responseType: 'json',
                withCredentials: true,
            });
    
            if (result?.id) {
                this.me = {
                    id: result.id,
                    email: result.email,
                    firstName: result.firstName,
                    impersonation: result.impersonation,
                    lastName: result.lastName,
                    name: `${result.firstName} ${result.lastName}`.trim(),
                    roles: result.roles,
                    verified: result.verified,
                }
                this.isAuthenticated = true;
                this.fetchEvents();
            }
        } catch (_err) {
            this.isAuthenticated = false;
        } finally {
            this.authChecked = true;
            const footer: Partial<HTMLElement> = document.getElementsByClassName('scoreboard__footer')[0];
            footer.style.visibility = 'visible';
        }
    }

    /**
     * Get all events that the logged-in user is scheduled to referee.
     */
    async fetchEvents() {
        if (!this.isAuthenticated) this.events = [];
        
        try {
            const result: GamedayEvent = await m.request({
                method: 'GET',
                url:`${config.apiBaseUrl}/tabulation/referee-events`,
                responseType: 'json',
                withCredentials: true,
            });

            if (Array.isArray(result) && result.length > 0) {
                this.events = result;
                this.noEvents = false;
                
                // If there is only one event in the list that occurs today, set that one as the "chosen" event
                if (result.length === 1) {
                    this.chosenEvent = this.events[0];

                    // biome-ignore lint/complexity/noForEach: <explanation>
                    Array.from(document.getElementsByClassName('year-link')).forEach((link: HTMLAnchorElement) => {
                        // Hide all season's in the menu other than the one for this session
                        const slug = link.href.split('/').pop();
                        if (identity.chosenEvent.Season.name.toLowerCase() !== slug) {
                            link.style.display = 'none';
                        } else {
                            link.style.display = 'block';
                        }

                        // If the season calculator isn't on the correct season URL already, make sure it is...
                        const seasonSlug = identity.chosenEvent.Season.name.toLowerCase();
                        if (window.location.pathname !== `/${seasonSlug}`) {
                            m.route.set(`/${seasonSlug}`);
                        }
                    });

                    // And fetch all teams & tables for that event as well as the referee ID for the logged in user
                    // if that's available.
                    const [teams, tables, referee] = await Promise.all([
                        m.request<Array<EventTeam>>({
                            method: 'GET',
                            url:`${config.apiBaseUrl}/tabulation/${this.chosenEvent.id}/teams`,
                            responseType: 'json',
                            withCredentials: true,
                        }),
                        m.request<Array<Table>>({
                            method: 'GET',
                            url: `${config.apiBaseUrl}/tabulation/${this.chosenEvent.id}/tables`,
                            responseType: 'json',
                            withCredentials: true,
                        }),
                        m.request<Referee>({
                            method: 'GET',
                            url: `${config.apiBaseUrl}/me/referee/${this.chosenEvent.id}`,
                            responseType: 'json',
                            withCredentials: true,
                        })
                    ]);
                    
                    this.teams = teams;
                    this.tables = tables;

                    if (referee?.id) {
                        this.refereeId = referee.id;
                    } else {
                        throw new Error('You are not a referee for this event! Find the Event Coordinator and make sure they generate your referee code!');
                    }
                } else {
                    // Future: Show some interface for them to choose an event they are scoring at
                }
            } else if (Array.isArray(result) && result.length === 0) {
                this.noEvents = true;
            }
        } catch (err) {
            this.handleErrors(err);
        }
    }

    /**
     * Figures out how to handle errors sent from the API server.
     *
     * @param {Error} err - The error to handle
     */
    handleErrors(err) {
        if (err?.code) {
            switch (err.code) {
                case 401:
                    this.reset();
                    break;
                case 403:
                    // this.errorMsg = `403 - ${err.response.title}: ${err.response.detail}`;
                    this.errorMsg = err.response.detail;
                    break;
                default:
                    this.errorMsg = err.message;
                    break;
            }
        } else {
            this.errorMsg = err.message;
        }

        // If we have an error message, show it in our pop-up
        if (this.errorMsg) {
            swal({
                text: this.errorMsg,
                icon: 'error',
                button: {
                    text: 'OK',
                    value: true,
                    visible: true,
                    className: "ok-btn",
                    closeModal: true,
                  }
            });
        }
    }

    reset() {
        this.authChecked = false;
        this.isAuthenticated = false;
        this.noEvents = null;
        this.errorMsg = null;
        this.events = [];
        this.teams = [];
        this.tables = [];
        this.chosenEvent = null;
        this.refereeId = null;
        this.me = {
            id: '',
            email: '',
            firstName: '',
            impersonation: null,
            lastName: '',
            roles: [],
            verified: null,
            name: '',
        };
    }
};

const identity = new Identity();

export default identity;
