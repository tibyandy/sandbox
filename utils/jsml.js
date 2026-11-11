// JavaScript Markup Language
//
// Uso 1. JSML.fromNode(domElement)
// Uso 2. JSML.fromHtml(htmlString)
// Uso 3. JSML(jsObject).asNode
// Uso 4. JSML(jsObject).asHtml

// Exemplo 1: let jsObject1 = JSML.fromNode(document)
// Exemplo 2: let p = JSML.fromHtml('<p>foo, <span style="color:red">red <b>+bold</b></span><br><img src="/x.jpg" height=24><hr>bla</p>')
// Exemplo 3 e 4: let jsml = JSML({html:[{head:[{title:["yay"]}]},{body:[{style:"background:#000;color:#fff"},{p:["yay ",{b:["bold"]}]}]}]})
//   console.log(jsml.asHtml)
//   document.documentElement.replaceWith(jsml.asNode)
//
const JSML = (function () {
    // Função principal que envelopa o objeto para os Usos 3 e 4
    function JSMLInstance(jsObject) {
        if (!(this instanceof JSMLInstance)) {
            return new JSMLInstance(jsObject);
        }
        this._data = jsObject;
    }

    // ==========================================
    // MÉTODOS PRIVADOS DE CONVERSÃO
    // ==========================================

    function _htmlToJson(node) {
        if (node.nodeType === 3) {
            return node.nodeValue;
        }
        if (node.nodeType === 9) {
            node = node.documentElement;
        }

        const tagName = node.tagName.toLowerCase();
        const result = {};

        let attrs = null;
        if (node.attributes && node.attributes.length > 0) {
            attrs = {};
            for (let attr of node.attributes) {
                let val = attr.value;
                if (!isNaN(val) && val.trim() !== "") val = Number(val);
                attrs[attr.name] = val;
            }
        }

        const childNodes = Array.from(node.childNodes).filter(c =>
            c.nodeType === 1 || (c.nodeType === 3 && c.nodeValue !== "")
        );

        if (childNodes.length === 0) {
            result[tagName] = attrs ? attrs : 0;
            return result;
        }

        const childrenArray = [];
        if (attrs) {
            childrenArray.push(attrs);
        }

        childNodes.forEach(child => {
            childrenArray.push(_htmlToJson(child));
        });

        result[tagName] = childrenArray;
        return result;
    }

    function _jsonToHtml(jsonObj) {
        if (typeof jsonObj === "string") {
            return document.createTextNode(jsonObj);
        }

        try {
            const tagName = Object.keys(jsonObj)[0];
            const value = jsonObj[tagName];
            const element = document.createElement(tagName);

            if (typeof value === "number" || (typeof value === "object" && !Array.isArray(value))) {
                if (typeof value === "object" && value !== null) {
                    for (let attr in value) {
                        element.setAttribute(attr, value[attr]);
                    }
                }
                return element;
            }

            if (Array.isArray(value)) {
                value.forEach((item, index) => {
                    if (index === 0 && typeof item === "object" && !Array.isArray(item) && Object.keys(item).length > 0) {
                        const firstKey = Object.keys(item)[0];
                        if (typeof item[firstKey] !== "object" && !Array.isArray(item[firstKey])) {
                            for (let attr in item) {
                                element.setAttribute(attr, item[attr]);
                            }
                            return;
                        }
                    }
                    element.appendChild(_jsonToHtml(item));
                });
            }

            return element;
        } catch (e) {
            console.error('Error parsing object', JSON.stringify(jsonObj), e)
        }
    }

    // ==========================================
    // INTERFACE PÚBLICA ESTÁTICA (USOS 1 E 2)
    // ==========================================

    JSMLInstance.fromNode = function (domElement) {
        return _htmlToJson(domElement);
    };

    JSMLInstance.fromHtml = function (htmlString) {
        const template = document.createElement('template');
        template.innerHTML = htmlString.trim();
        if (htmlString.toLowerCase().includes('<html')) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlString, 'text/html');
            return _htmlToJson(doc.documentElement);
        }
        return _htmlToJson(template.content.firstElementChild);
    };

    // ==========================================
    // GETTERS DE INSTÂNCIA (USOS 3 E 4)
    // ==========================================

    Object.defineProperty(JSMLInstance.prototype, 'asNode', {
        get: function () {
            return _jsonToHtml(this._data);
        },
        configurable: true
    });

    Object.defineProperty(JSMLInstance.prototype, 'asHtml', {
        get: function () {
            const dom = _jsonToHtml(this._data);
            if (dom.nodeType === 3) return dom.nodeValue;
            return dom.outerHTML;
        },
        configurable: true
    });

    return JSMLInstance;
})();