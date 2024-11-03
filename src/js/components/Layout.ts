import * as m from 'mithril';
import Menu from './Menu';
import AuthBanner from './AuthBanner';
import identity from '../models/Identity';

export default class Layout implements m.ClassComponent {
  view(vnode: m.Vnode) {
    return m('div', { className: identity.isAuthenticated ? 'is-authenticated' : '' }, [
      identity.isAuthenticated ? m(AuthBanner) : null,
      m(Menu),
      vnode.children,
    ]);
  }
}