import * as m from 'mithril';

interface LinkAttrs {
    href: string
  }

export default class Link implements m.ClassComponent<LinkAttrs> {
    view(vnode: m.Vnode<LinkAttrs>) {
        const currentPathWithoutHash = m.route.get().split('#')[0];

        return m('li', {
            className: currentPathWithoutHash === vnode.attrs.href ? ' active' : '',
        }, m(m.route.Link, {
            href: vnode.attrs.href,
            className: 'waves-effect',
        }, vnode.children));
    }
}
