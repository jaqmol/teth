/**
 * @copyright (c) 2017 Ronny Reichmann
 * @license MIT
 * @desc Conduct virtual HTML elements based on Snabbdom.
 * @author Ronny Reichmann
 * @desc For every HTML element a function is exported to create nested virtual
 *       DOM elements that in a later phase are fed into Snabbdom for lightning
 *       fast rendering.
 *       1. To create an element call a corresponding constructor-function:
 *          | let virtualDivElem = div('#element-a1.selected')
 *          A constructor-function can take a selector.
 *       2. Classes, attributes, styles, event-listeners and content can
 *          be added by chaning calls:
 *          | div('#element-a1')
 *          |   .class({'selected', isSelected})
 *          |   .attrib({alt: 'The first element'})
 *          |   .on({click: ev => processClickOn('element-a1'))
 *          |   .content('Here comes the content')
 *       3. Calls to attrib(), class(), style(), on() and hook() must be called with
 *          object literals:
 *          | <...>.class({selected: isSelected})
 *          |      .class({hidden: isHidden, dark: isDark})
 *          Note: All values from calls to the same function will
 *                be merged: The example above assigns all 3 classes (selected,
 *                hidden, dark) to the virtual DOM element.
 *       4. Instance methods:
 *          1. attrib({key: value [, ...]})
 *                Set attributes of the DOM element.
 *          2. class({key: value [, ...]})
 *                Set classes of the DOM element. Keys are names of classes,
 *                values must correspond to boolean values. Evaluation to true
 *                will cause the class name to be added.
 *          3. style({key: value [, ...]})
 *                Set styles of the DOM element. Keys are style-names in camel-
 *                case (not in hyphen-notation as found in CSS,
 *                and not in Pascal-case) as usual when setting styles on DOM
 *                elements from JavaScript.
 *          4. on({key: value [, ...]})
 *                Set event callbacks on the DOM element. Keys are names of
 *                events, values are callback functions. Every virtual DOM
 *                element needs it's own callback function for a given event
 *                type. Sharing a directly assign callback between DOM elements
 *                is not supported. Do call shared callbacks indirectly from
 *                within in directly attached callback function.
 *          4. hook({key: value [, ...]})
 *                Set callbacks for rendering hooks. The following hooks exist:
 *                Name      | Triggered when            | Arguments to callback
 *                -------------------------------------------------------------
 *                pre       | the rendering process     | none
 *                          | begins                    |
 *                init      | a vnode has been added    | vnode
 *                create    | a DOM element has been    | emptyVnode, vnode
 *                          | created based on a vnode  |
 *                insert    | an element has been       | vnode
 *                          | inserted into the DOM     |
 *                prepatch  | an element is about to be | oldVnode, vnode
 *                          | rendered                  |
 *                update    | an element is being       | oldVnode, vnode
 *                          | updated                   |
 *                postpatch | an element has been       | oldVnode, vnode
 *                          | rendered                  |
 *                destroy   | an element is directly or | vnode
 *                          | indirectly being removed  |
 *                remove    | an element is directly    | vnode, removeCallback
 *                          | being removed from the    |
 *                          | DOM                       |
 *                post      | the render process is     | none
 *                          | done                      |
 *          5. content(<string> | <Array<Virtual-DOM-Elements>> | <Virtual-DOM-Elements-1> [, <V-DOM-Elem-N>])
 *                This function is the only one that doesn't support
 *                key-value-pairs. Attributes can be strings, an array of
 *                virtual DOM elements or the call arguments themselves are
 *                virtual DOM elements.
 */

const allTagNames = [
  'head', 'title', 'base', 'link', 'meta', 'style', 'script', 'noscript',
  'body', 'section', 'nav', 'article', 'aside', 'h1', 'h2', 'h3', 'h4', 'h5',
  'h6', 'header', 'footer', 'address', 'main', 'p', 'hr', 'pre', 'blockquote',
  'ol', 'ul', 'li', 'dl', 'dt', 'dd', 'figure', 'figcaption', 'div', 'a', 'em',
  'strong', 'small', 's', 'cite', 'q', 'dfn', 'abbr', 'data', 'time', 'code',
  'var', 'samp', 'kbd', 'sub', 'sup', 'i', 'b', 'u', 'mark', 'ruby', 'rt',
  'rp', 'bdi', 'bdo', 'span', 'br', 'wbr', 'ins', 'del', 'img', 'iframe',
  'embed', 'object', 'param', 'video', 'audio', 'source', 'track', 'canvas',
  'map', 'area', 'svg', 'math', 'table', 'caption', 'colgroup', 'col', 'tbody',
  'thead', 'tfoot', 'tr', 'td', 'th', 'form', 'fieldset', 'legend', 'label',
  'input', 'button', 'select', 'datalist', 'optgroup', 'option', 'textarea',
  'keygen', 'output', 'progress', 'meter', 'details', 'summary', 'command',
  'menu', 'dialog'
]

const ensureContent = args => {
  return (args.length === 1) &&
    ((typeof args[0] === 'string') || (args[0] instanceof Array))
    ? args[0]
    : args
}

// const parseSelector = selector => {
//   const regex = /(#[a-zA-Z\-_]+)|(.[a-zA-Z\-_]+)/g
//   const parsed = { classes: [] }
//   let result
//   while ((result = regex.exec(selector)) !== null) {
//     if (result.indexOf('.') === 0) parsed.classes.push(result.slice(1))
//     else if (result.indexOf('#') === 0) parsed.id = result.slice(1)
//   }
//   return parsed
// }

/**
 * @typedef VirtualElementComposit
 * @type {VirtualElementComposit}
 * @prop {function} attrib
 * @prop {function} prop
 * @prop {function} class
 * @prop {function} style
 * @prop {function} on
 * @prop {function} hook
 * @prop {function} content
 * @desc Create (virtual) HTML elements. Use chainable functions to define:
 *       - Attributes: attribe({AttributeLiteral})
 *       - Properties: prop({PropertyLiteral})
 *       - CSS classes: class({ClassLiteral})
 *       - Styles: style({StyleLiteral})
 *       - Event callbacks: on({EventLiteral})
 *       - Render event callbacks: hook({HookLiteral})
 *       - Content: content(String|String[]|{VirtualElementComposit}|{VirtualElementComposit}[])
 */
/**
 * @typedef AttributeLiteral
 * @type {AttributeLiteral}
 * @desc Object literal representing DOM element attributes and values.
 *       Attribute names are expressed in camelCase, values as strings.
 */
/**
 * @typedef PropertyLiteral
 * @type {PropertyLiteral}
 * @desc Object literal representing DOM element properties and values.
 */
/**
 * @typedef ClassLiteral
 * @type {ClassLiteral}
 * @desc Object literal representing DOM element classes.
 *       Class names are expressed in camelCase, classes are added if their values evaluate to true.
 */
/**
 * @typedef StyleLiteral
 * @type {StyleLiteral}
 * @desc Object literal representing DOM element's directly assigned CSS styles.
 *       Style names are expressed in camelCase, values as strings.
 */
/**
 * @typedef EventLiteral
 * @type {EventLiteral}
 * @desc Object literal representing DOM element event listeners / callbacks.
 *       Event names are expressed in camelCase, values are callback-functions.
 */
/**
 * @typedef HookLiteral
 * @type {HookLiteral}
 * @desc Object literal representing rendering process event listeners / callbacks.
 *       Event names as follows, values are callback-functions.
 *       Name      | Triggered when            | Arguments to callback
 *       -------------------------------------------------------------
 *       pre       | the rendering process     | none
 *                 | begins                    |
 *       init      | a vnode has been added    | vnode
 *       create    | a DOM element has been    | emptyVnode, vnode
 *                 | created based on a vnode  |
 *       insert    | an element has been       | vnode
 *                 | inserted into the DOM     |
 *       prepatch  | an element is about to be | oldVnode, vnode
 *                 | rendered                  |
 *       update    | an element is being       | oldVnode, vnode
 *                 | updated                   |
 *       postpatch | an element has been       | oldVnode, vnode
 *                 | rendered                  |
 *       destroy   | an element is directly or | vnode
 *                 | indirectly being removed  |
 *       remove    | an element is directly    | vnode, removeCallback
 *                 | being removed from the    |
 *                 | DOM                       |
 *       post      | the render process is     | none
 *                 | done                      |
 */

/**
 * Virtual element compose function
 * @constructor
 * @arg {GenerateCallback} generate - Initialize a pipe composit and generate values on the stream asynchronously.
 * @returns {PipeComposit}
 */
function composeVirtualElem (name) {
  return selector => {
    const data = {}
    let content
    const composit = {}
    composit.attrib = literal => {
      data.attrs = Object.assign(data.attrs || {}, literal)
      return composit
    }
    composit.prop = literal => {
      data.props = Object.assign(data.props || {}, literal)
      return composit
    }
    composit.class = literal => {
      data.class = Object.assign(data.class || {}, literal)
      return composit
    }
    composit.style = literal => {
      data.style = Object.assign(data.style || {}, literal)
      return composit
    }
    composit.on = literal => {
      data.on = Object.assign(data.on || {}, literal)
      return composit
    }
    composit.hook = literal => {
      data.hook = Object.assign(data.hook || {}, literal)
      return composit
    }
    composit.content = (...args) => {
      content = ensureContent(args)
      return composit
    }
    composit._state = () => {
      const state = {name, selector, data}
      if (!content) return state
      state.content = content instanceof Array
        ? content.map(c => c._state ? c._state() : '' + c)
        : '' + content
      return Object.freeze(state)
    }
    return Object.freeze(composit)
  }
}

function genericVirtualElemConstructor (selector) {
  // Assuming format "<tag-name>[#<optional-id>][.<optional-classes>]"
  const indexes = [selector.indexOf('.'), selector.indexOf('#')].filter(idx => idx > -1)
  indexes.sort()
  if (indexes.length) {
    const sep = indexes[0] // first dot or hash
    const head = selector.substring(0, sep) // tag name
    const tail = selector.substring(sep) // the rest, aka id and classes
    return composeVirtualElem(head)(tail)
  } else return composeVirtualElem(selector)() // presumably only tag name
}

const virtualElemConstructors = allTagNames.reduce((acc, name) => {
  acc[name] = composeVirtualElem(name)
  return acc
}, {h: genericVirtualElemConstructor})

module.exports = Object.freeze(virtualElemConstructors)
