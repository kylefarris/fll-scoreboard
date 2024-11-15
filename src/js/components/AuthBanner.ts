import * as m from 'mithril';
import identity from '../models/Identity';
import icon from '../helpers/icon';

export default class AuthBanner implements m.ClassComponent {
    view(vnode: m.Vnode) {
        return m('div.authentication-notice', {
            className: identity.noEvents || identity.errorMsg ? 'no-events' : '',
          }, [
            m('div', { style: 'margin-right: 10px;' }, [ icon(identity.noEvents || identity.errorMsg ? 'exclamation-triangle' : 'flag-checkered') ]),
            identity.chosenEvent && !identity.errorMsg ? `You are refereeing "${identity.chosenEvent.name}"` : (
              identity.noEvents ? `${identity.me.firstName}, you curently have no events to referee!` : (
                identity.noEvents ? `${identity.me.firstName}, you are not currently a referee on any active events.` :
                `${identity.me.firstName}, you are not currently a referee on an event even though you are listed with the referee volunteer role.`
              )
            ),
          ]
        );
    }
}
