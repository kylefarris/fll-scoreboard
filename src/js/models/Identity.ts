import * as m from 'mithril';
import { config } from '../global';

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
    roles: Array<UserRole>,
    verified: boolean,
};

export interface EventTeam {
    id: string,
    name: string,
    customTeamId: string,
};

export interface GamedayEvent {
    id: string,
    name: string,
    startDate: Date,
    endDate: Date,
    Teams: Array<EventTeam>,
    isCurrent: boolean,
    isFuture: boolean,
    isPast: boolean,
    lockScoreboard: boolean,
    active: boolean,
};

class Identity {
    isAuthenticated: boolean;
    me: Me;
    events: Array<GamedayEvent>;
    noEvents: boolean;
    errorMsg: string;
    chosenEvent: GamedayEvent;

    constructor() {
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
                    roles: result.roles,
                    verified: result.verified,
                }
                this.isAuthenticated = true;
            }
        } catch (_err) {
            this.isAuthenticated = false;
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
                url:`${config.apiBaseUrl}/me/referee-events`,
                responseType: 'json',
                withCredentials: true,
            });

            if (Array.isArray(result) && result.length > 0) {
                this.events = result;
                this.noEvents = false;
                
                // If there is only one event in the list occurs today, set that one as the "chosen" event
                if (result.length === 1) this.chosenEvent = this.events[0];
            } else if (Array.isArray(result) && result.length === 0) {
                this.noEvents = true;
            }
        } catch (err) {
            this.handleErrors(err);
            // console.log('Error: ', { message: err.response.detail, code: err.code });
            // console.log('Oops...', err);
            // this.eventsFetchError = err.replace('Error:', '').trim();
        }
    }

    handleErrors(err) {
        if (err?.code) {
            switch (err.code) {
                case 401:
                    this.reset();
                    break;
                case 403:
                    this.errorMsg = `403 - ${err.response.title}: ${err.response.detail}`;
                    break;
                default:
                    break;
            }
        }
    }

    reset() {
        this.isAuthenticated = false;
        this.noEvents = null;
        this.errorMsg = null;
        this.events = [];
        this.chosenEvent = null;
        this.me = {
            id: '',
            email: '',
            firstName: '',
            impersonation: null,
            lastName: '',
            roles: [],
            verified: null,
        };
    }
};

const identity = new Identity();

export default identity;
