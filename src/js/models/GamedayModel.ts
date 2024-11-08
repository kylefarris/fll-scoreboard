import * as m from 'mithril';
import { config } from '../global';
import type { SwalOptions } from 'sweetalert/typings/modules/options';
import type { ButtonList, ButtonOptions } from 'sweetalert/typings/modules/options/buttons';

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
        let errorTitle: string = null;

        // For network/API errors
        if (err instanceof Error && 'code' in err) {
            if (err.response.title) {
                errorTitle = err.response.title;
            }

            switch (err.code) {
                case 401:
                    if (errorTitle === null) errorTitle = 'Not Authenticated';
                    this.reset();
                    break;
                case 403:
                    if (errorTitle === null) errorTitle = 'Access Denied';
                    this.errorMsg = err.response.detail;
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
            const errorConfig: Partial<SwalOptions> = {
                text: this.errorMsg,
                icon: 'error',
                dangerMode: true,
                buttons: {
                    confirm: true,
                },
            };
            if (errorTitle) errorConfig.title = errorTitle;
            swal(errorConfig);
        }
    }

    /**
     * This is essentially a no-op at this base model level. Can be overwritten by child classes.
     */
    reset() {
        this.errorMsg = '';
    }
}