import * as m from 'mithril';
import identity from '../models/Identity';
import icon from '../helpers/icon';

export default class AuthBanner implements m.ClassComponent {
    view(vnode: m.Vnode) {
        return m('div.authentication-notice', {
            className: identity.noEvents ? 'no-events' : '',
          }, [
            m('div', { style: 'margin-right: 10px;' }, [ icon(identity.noEvents ? 'exclamation-triangle' : 'flag-checkered') ]),
            identity.chosenEvent ? `You are refereeing "${identity.chosenEvent.name}"` : (
              identity.noEvents ? `${identity.me.firstName}, you curently have no events to referee!` : ''),
          ]
        );
    }
}
