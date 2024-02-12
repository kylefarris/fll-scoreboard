import * as m from 'mithril';

const apiBaseUrl = 'https://api.fllgameday.org/tabulation'

export default class Tabulation {
    static matches = [
        { id: 'practice', name: 'Practice' },
        { id: 'match1', name: 'Match 1' },
        { id: 'match2', name: 'Match 2' },
        { id: 'match3', name: 'Match 3' }
    ];
    static refInfo = {
        eventId: null
    };
    static teams = [];
    static commitForm = {
        refCode: '',
        teamId: null,
        matchId: null,
        score: null,
        missions: {},
    };

    static async commit() {
        const result = await m.request({
            method: 'POST',
            url: `${apiBaseUrl}/commit`,
            body: Tabulation.commitForm,
        });

        console.log('Score Commited Result: ', result);
    }

    static async getRefInfo() {
        this.refInfo = await m.request({
            method: 'POST',
            url: `${apiBaseUrl}/login`,
            body: { refCode: Tabulation.commitForm.refCode },
        });

        Tabulation.getTeams();
    }

    static async getTeams() {
        if (!Tabulation.refInfo?.eventId) {
            console.error('No Referee info yet', Tabulation.refInfo);
            return false;
        }
        this.teams = await m.request({
            method: 'GET',
            url: `${apiBaseUrl}/teams/`,
        });
    }
}
