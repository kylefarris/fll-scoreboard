import * as m from 'mithril';
import identity from '../models/Identity';
import icon from '../helpers/icon';

export default class AuthBanner implements m.ClassComponent {
    view(vnode: m.Vnode) {
        return m('div.authentication-notice', {
            className: identity.noEvents || identity.errorMsg ? 'no-events' : '',
          }, [
            m('div', { style: 'margin-right: 10px;' }, [ icon(identity.noEvents || identity.errorMsg ? 'exclamation-triangle' : 'flag-checkered') ]),
            m('span',
              identity.chosenEvent && !identity.errorMsg ? [`You are refereeing "${identity.chosenEvent.name}"`, (identity.events.length > 1 ? m('a.change-link', { href: '#', onclick() { identity.setActiveEvent(null); } }, ['Change']) : '')] : [(
                identity.noEvents ? `${identity.me.firstName}, you curently have no events to referee!` : (
                  identity.noEvents ? `${identity.me.firstName}, you are not currently a referee on any active events.` : (
                    identity.events.length > 1 ? `${identity.me.firstName}, you are scheduled for multiple events today. Please choose the event you are currently at.` :
                      `${identity.me.firstName}, you are not currently a referee on an event even though you are listed with the referee volunteer role.`
                  )
                )
              )]
            )
          ]);
    }
}
