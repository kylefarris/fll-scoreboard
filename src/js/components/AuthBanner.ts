import * as m from 'mithril';
import identity from '../models/Identity';

export default class AuthBanner implements m.ClassComponent {
    view(vnode: m.Vnode) {
        return m('div.authentication-notice', {
            
          }, [
            `Welcome ${identity.me.firstName}! `,
            identity.chosenEvent ? `You are refereeing ${identity.chosenEvent.name}.` : identity.eventsFetchError,
          ]
        );
    }
}