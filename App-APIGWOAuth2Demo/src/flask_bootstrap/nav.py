from hashlib import sha1
from dominate import tags
from visitor import Visitor


class BootstrapRenderer(Visitor):
    def __init__(self, html5=True, id=None):
        self.html5 = html5
        self._in_dropdown = False
        self.id = id

    def visit_NavbarBrand(self, node):
        item = tags.a(href=node.get_url(), title=node.text, _class='navbar-brand')
        item['class'] = 'navbar-brand'
        if node.kwargs.get('class_'):
            item['class'] += (' ' + self.kwargs['class_'])
        if node.img:
            item.add(tags.img(src=node.img, _class='d-inline-block align-top'))
            if node.text:
                node.text = ' ' + node.text
        if node.text:
            item.add_raw_string(node.text)
        return item

    def visit_Navbar(self, node):
        # create a navbar id that is somewhat fixed, but do not leak any
        # information about memory contents to the outside
        node_id = self.id or sha1(str(id(node)).encode()).hexdigest()

        root = tags.nav(_class='navbar') if self.html5 else tags.div(role='navigation',  _class='navbar')
        if node.kwargs.get('class_'):
            root['class'] += (' ' + node.kwargs['class_'])
        if node.kwargs.get('id'):
            root['id'] = node.kwargs['id']

        # title may also have a 'get_url()' method, in which case we render
        # a brand-link
        if node.title is not None:
            if hasattr(node.title, 'img'):
                root.add(self.visit(node.title))
            elif hasattr(node.title, 'get_url'):
                root.add(tags.a(node.title.text, _class='navbar-brand',
                                href=node.title.get_url()))
            else:
                root.add(tags.span(node.title, _class='navbar-brand'))

        # collapse button
        if node.kwargs.get('responsive') in (None, True):
            btn = root.add(tags.button())
            btn['type'] = 'button'
            btn['class'] = 'navbar-toggler navbar-toggler-right'
            btn['data-toggle'] = 'collapse'
            btn['data-target'] = '#' + node_id
            btn['aria-expanded'] = 'false'
            btn['aria-controls'] = 'navbar'
            btn['aria-label'] = 'Toggle navigation'
            btn.add(tags.span(_class='navbar-toggler-icon'))

        bar = root.add(tags.div(
            _class='collapse navbar-collapse',
            id=node_id,
        ))
        item_list = bar.add(tags.div(_class='navbar-nav mr-auto'))
        item_list_right = bar.add(tags.div(_class='navbar-nav'))

        for item in node.items:
            if item.kwargs.get('align') == 'right':
                item_list_right.add(self.visit(item))
            else:
                item_list.add(self.visit(item))

        return root

    # def visit_Navbar(self, node):
    #     # create a navbar id that is somewhat fixed, but do not leak any
    #     # information about memory contents to the outside
    #     node_id = self.id or sha1(str(id(node)).encode()).hexdigest()
    #
    #     root = tags.nav() if self.html5 else tags.div(role='navigation')
    #     root['class'] = 'navbar navbar-expand-lg'
    #
    #     if 'classes' in self.kwargs:
    #         root['class'] += (' ' + ' '.join(self.kwargs['classes']))
    #
    #     # title may also have a 'get_url()' method, in which case we render
    #     # a brand-link
    #     if node.title is not None:
    #         if hasattr(node.title, 'get_url'):
    #             root.add(tags.a(node.title.text, _class='navbar-brand',
    #                             href=node.title.get_url()))
    #         else:
    #             root.add(tags.span(node.title, _class='navbar-brand'))
    #
    #     # collapse button
    #     btn = root.add(tags.button())
    #     btn['type'] = 'button'
    #     btn['class'] = 'navbar-toggler navbar-toggler-right'
    #     btn['data-toggle'] = 'collapse'
    #     btn['data-target'] = '#' + node_id
    #     btn['aria-expanded'] = 'false'
    #     btn['aria-controls'] = 'navbar'
    #     btn['aria-label'] = 'Toggle navigation'
    #
    #     btn.add(tags.span(_class='navbar-toggler-icon'))
    #
    #     bar = root.add(tags.div(
    #         _class='navbar-collapse collapse',
    #         id=node_id,
    #     ))
    #     bar_list = bar.add(tags.div(_class='navbar-nav'))
    #
    #     for item in node.items:
    #         bar_list.add(self.visit(item))
    #
    #     return root

    def visit_Text(self, node):
        if not self._in_dropdown:
            return tags.span(node.text, _class='navbar-text')
        return tags.h6(node.text, _class='dropdown-header')

    def visit_Link(self, node):
        if self._in_dropdown:
            return tags.a(node.text, href=node.get_url(),
                          _class='dropdown-item')
        else:
            return tags.a(node.text, href=node.get_url(),
                          _class='nav-item nav-link')

    def visit_Separator(self, node):
        if not self._in_dropdown:
            raise RuntimeError('Cannot render separator outside Subgroup.')
        return tags.div(_class='dropdown-divider')

    def visit_Subgroup(self, node):
        if not self._in_dropdown:
            div = tags.div(_class='nav-item dropdown')
            if node.active:
                div['class'] += ' active'
            a = div.add(tags.a(node.title, href='#',
                               _class='nav-link dropdown-toggle'))
            a['data-toggle'] = 'dropdown'
            a['role'] = 'button'
            a['aria-haspopup'] = 'true'
            a['aria-expanded'] = 'false'

            menu = div.add(tags.div(_class='dropdown-menu'))

            self._in_dropdown = True
            for item in node.items:
                menu.add(self.visit(item))
            self._in_dropdown = False

            return div
        else:
            raise RuntimeError('Cannot render nested Subgroups')

    def visit_View(self, node):
        item = tags.a(href=node.get_url(), title=node.text,
                      _class='nav-item nav-link')

        if node.kwargs.get('icon'):
            item.add(tags.span(_class='fas fa-{}'.format(node.kwargs.get('icon'))))
            node.text = ' ' + node.text

        item.add_raw_string(node.text)

        if node.kwargs.get('class_'):
            item['class'] += (' ' + node.kwargs['class_'])

        if node.active:
            item['class'] += ' active'

        return item
