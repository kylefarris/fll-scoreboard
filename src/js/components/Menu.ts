import * as m from 'mithril';
import Link from './Link';
import lang from '../helpers/lang';
import { texts, years } from '../global';
import identity from '../models/Identity';
import icon from '../helpers/icon';

export default class Menu implements m.ClassComponent {
  oncreate(vnode: m.VnodeDOM) {
    M.Sidenav.init(vnode.dom);
  }

  onremove(vnode: m.VnodeDOM) {
    M.Sidenav.getInstance(vnode.dom).destroy();
  }

  view(vnode: m.Vnode) {
    return m('ul.sidenav#menu', {
      onclick() {
        M.Sidenav.getInstance((vnode as m.VnodeDOM).dom).close();
      },
    }, [
      years.map(year => m(Link, {
        href: `/${year.data.meta.slug}`,
      }, `${year.data.meta.year} ${year.data.meta.title}`)),
      m(Link, {
        href: '/credits',
      }, 'Credits'),
      m('li.hr'),
      (
        identity.isAuthenticated ?
          m('li', { className: 'welcome-msg' }, `Welcome ${identity.me.firstName}!`) :
          null
      ),
      (identity.isAuthenticated ? 
        m(
          'li',
          { className: 'logout-btn'},
          [
            m('a', {
              href: 'http://localhost:5420/logout',
              className: 'waves-effect',
            }, [
              'Logout',
              icon('sign-out-alt'),
            ]),
          ]
        ) :
        m(
          'li',
          { className: 'login-btn'},
          [
            m('a', {
              href: `http://localhost:5420/login/${btoa(`http://${window.location.host}`)}`,
              className: 'waves-effect',
            }, [
              'Login',
              icon('sign-in-alt'),
          ]),
          ]
        )
      ),
      m(
        'li',
        { className: 'restore-btn'},
        [
          m(m.route.Link, {
            href: '/backups',
            className: 'waves-effect',
          }, 'View Stored Backups'),
        ]
      ),
      m('li.expand'),
      Object.keys(texts.locales).map(
        locale => m('li', {
          className: lang.getLang() === locale ? 'active' : '',
        }, m('a.waves-effect', {
          href: '#',
          onclick() {
            lang.setLang(locale);
          },
        }, texts.locales[locale]))
      ),
    ]);
  }
}
