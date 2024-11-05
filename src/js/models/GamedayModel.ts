import * as m from 'mithril';
import { config } from '../global';

declare const swal: (options: object) => void;

interface RequestError extends Error {
    code: number,
    response: {
        title: 'string',
        detail: 'string',
    },
}

export default class GamedayModel {
    errorMsg: string;
    noWifi: boolean;

    constructor() {
        this.errorMsg = '';
        this.noWifi = false;
    }

    /**
     * Quick and easy function to verify that the calculator has internet
     * connectivity to the API server.
     *
     * @returns {boolean}
     */
    async checkConnectivity() {
        try {
            const result = await m.request({
                method: 'GET',
                url: `${config.apiBaseUrl}/public/seasons`,
                responseType: 'json',
            });

            if (Array.isArray(result) && result.length > 0 && result[0]?.id) {
                console.log('Connection is back!');
                this.noWifi = false;
                return true;
            }
            console.log('Connection is still not working');
            console.log(result);
            this.noWifi = true;
            return false;
        } catch (_err) {
            console.log('No connection still');
            this.noWifi = true;
            return false;
        }
    }

    /**
     * Figures out how to handle errors send from the API server.
     *
     * @param {string|RequestError|Error} err - The error to handle
     */
    handleErrors(err: string | RequestError | Error): void {
        // For network/API errors
        if (err instanceof Error && 'code' in err) {
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
        } else if (err instanceof Error && !('code' in err)) {
            this.errorMsg = err.message;
        }

        // For local errors
        else if (typeof err === 'string') {
            this.errorMsg = err;
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

    /**
     * This is essentially a no-op at this base model level. Can be overwritten by child classes.
     */
    reset() {
        this.errorMsg = '';
    }
}