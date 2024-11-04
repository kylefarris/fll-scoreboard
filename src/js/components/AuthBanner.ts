import * as m from 'mithril';
import identity from '../models/Identity';
import icon from '../helpers/icon';

export default class AuthBanner implements m.ClassComponent {
    view(vnode: m.Vnode) {
        return m('div.authentication-notice', {
            // maybe some props in the future?
          }, [
            m('div', { style: 'margin-right: 10px;' }, [ icon('flag-checkered') ]),
            identity.chosenEvent ? `You are refereeing "${identity.chosenEvent.name}"` : identity.errorMsg,
          ]
        );
    }
}
