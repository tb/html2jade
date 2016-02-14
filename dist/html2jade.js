"use strict";

var _parser = require("./parser");

var Converter,
    Ent,
    FS,
    Output,
    Path,
    StreamOutput,
    StringOutput,
    Writer,
    applyOptions,
    doNotEncode,
    entOptions,
    isNode,
    isValidJadeClassName,
    isValidJadeId,
    nspaces,
    publicIdDocTypeNames,
    scope,
    systemIdDocTypeNames,
    useTabs,
    validJadeClassRegExp,
    validJadeIdRegExp,
    extend = function extend(child, parent) {
  for (var key in parent) {
    if (hasProp.call(parent, key)) child[key] = parent[key];
  }function ctor() {
    this.constructor = child;
  }ctor.prototype = parent.prototype;child.prototype = new ctor();child.__super__ = parent.prototype;return child;
},
    hasProp = {}.hasOwnProperty;

isNode = false;

if (typeof module !== "undefined" && module !== null) {
  isNode = true;
}

scope = typeof exports !== "undefined" && exports !== null ? exports : undefined.Html2Jade != null ? undefined.Html2Jade : undefined.Html2Jade = {};

if (isNode) {
  FS = require("fs");
  Path = require("path");
  Ent = require("he");
} else {
  Ent = he;
  window.Html2Jade = scope;
}

nspaces = 2;

useTabs = false;

doNotEncode = false;

entOptions = {
  useNamedReferences: true
};

validJadeIdRegExp = /^[\w\-]+$/;

validJadeClassRegExp = /^[\w\-]+$/;

isValidJadeId = function isValidJadeId(id) {
  id = id ? id.trim() : "";
  return id && validJadeIdRegExp.test(id);
};

isValidJadeClassName = function isValidJadeClassName(className) {
  className = className ? className.trim() : "";
  return className && validJadeClassRegExp.test(className);
};

Writer = function () {
  function Writer(options) {
    var ref, ref1, ref2;
    if (options == null) {
      options = {};
    }
    this.wrapLength = (ref = options.wrapLength) != null ? ref : 80;
    this.scalate = (ref1 = options.scalate) != null ? ref1 : false;
    this.attrSep = this.scalate || options.noattrcomma ? ' ' : ', ';
    if (options.double) {
      this.attrQuote = '"';
      this.nonAttrQuote = "'";
    } else {
      this.attrQuote = "'";
      this.nonAttrQuote = '"';
    }
    this.attrQuoteEscaped = "\\" + this.attrQuote;
    this.noEmptyPipe = (ref2 = options.noemptypipe) != null ? ref2 : false;
  }

  Writer.prototype.tagHead = function (node) {
    var result, validClassNames;
    result = node.tagName !== 'DIV' ? node.tagName.toLowerCase() : '';
    if (node.id && isValidJadeId(node.id)) {
      result += "#" + node.id;
    }
    if (node.hasAttribute('class') && node.getAttribute('class').length > 0) {
      validClassNames = node.getAttribute('class').split(/\s+/).filter(function (item) {
        return item && isValidJadeClassName(item);
      });
      result += '.' + validClassNames.join('.');
    }
    if (result.length === 0) {
      result = 'div';
    }
    return result;
  };

  Writer.prototype.tagAttr = function (node, indents) {
    var attr, attrName, attrValue, attrs, invalidClassNames, j, len, result;
    if (indents == null) {
      indents = '';
    }
    attrs = node.attributes;
    if (!attrs || attrs.length === 0) {
      return '';
    } else {
      result = [];
      for (j = 0, len = attrs.length; j < len; j++) {
        attr = attrs[j];
        if (attr && attr.nodeName) {
          attrName = attr.nodeName;
          attrValue = attr.nodeValue;
          if (attrName === 'id' && isValidJadeId(attrValue)) {} else if (attrName === 'class') {
            invalidClassNames = node.getAttribute('class').split(/\s+/).filter(function (item) {
              return item && !isValidJadeClassName(item);
            });
            if (invalidClassNames.length > 0) {
              result.push(this.buildTagAttr(attrName, invalidClassNames.join(' ')));
            }
          } else {
            attrValue = attrValue.replace(/(\r|\n)\s*/g, "\\$1" + indents);
            result.push(this.buildTagAttr(attrName, attrValue));
          }
        }
      }
      if (result.length > 0) {
        return "(" + result.join(this.attrSep) + ")";
      } else {
        return '';
      }
    }
  };

  Writer.prototype.buildTagAttr = function (attrName, attrValue) {
    if (attrValue.indexOf(this.attrQuote) === -1) {
      return attrName + "=" + this.attrQuote + attrValue + this.attrQuote;
    } else if (attrValue.indexOf(this.nonAttrQuote) === -1) {
      return attrName + "=" + this.nonAttrQuote + attrValue + this.nonAttrQuote;
    } else {
      attrValue = attrValue.replace(new RegExp(this.attrQuote, 'g'), this.attrQuoteEscaped);
      return attrName + "=" + this.attrQuote + attrValue + this.attrQuote;
    }
  };

  Writer.prototype.tagText = function (node) {
    var data, ref;
    if (((ref = node.firstChild) != null ? ref.nodeType : void 0) !== 3) {
      return null;
    } else if (node.firstChild !== node.lastChild) {
      return null;
    } else {
      data = node.firstChild.data;
      if (data.length > this.wrapLength || data.match(/\r|\n/)) {
        return null;
      } else {
        return data;
      }
    }
  };

  Writer.prototype.forEachChild = function (parent, cb) {
    var child, results;
    if (parent) {
      child = parent.firstChild;
      results = [];
      while (child) {
        cb(child);
        results.push(child = child.nextSibling);
      }
      return results;
    }
  };

  Writer.prototype.writeTextContent = function (node, output, options) {
    output.enter();
    this.forEachChild(node, function (_this) {
      return function (child) {
        return _this.writeText(child, output, options);
      };
    }(this));
    return output.leave();
  };

  Writer.prototype.writeText = function (node, output, options) {
    var data, lines;
    if (node.nodeType === 3) {
      data = node.data || '';
      if (data.length > 0) {
        lines = data.split(/\r|\n/);
        return lines.forEach(function (_this) {
          return function (line) {
            return _this.writeTextLine(node, line, output, options);
          };
        }(this));
      }
    }
  };

  Writer.prototype.writeTextLine = function (node, line, output, options) {
    var encodeEntityRef, escapeBackslash, lines, pipe, prefix, ref, ref1, ref2, ref3, ref4, ref5, ref6, trim, wrap;
    if (options == null) {
      options = {};
    }
    pipe = (ref = options.pipe) != null ? ref : true;
    trim = (ref1 = options.trim) != null ? ref1 : false;
    wrap = (ref2 = options.wrap) != null ? ref2 : true;
    encodeEntityRef = (ref3 = options.encodeEntityRef) != null ? ref3 : false;
    escapeBackslash = (ref4 = options.escapeBackslash) != null ? ref4 : false;
    if (pipe && this.noEmptyPipe && line.trim().length === 0) {
      return;
    }
    prefix = pipe ? '| ' : '';
    if ((node != null ? (ref5 = node.previousSibling) != null ? ref5.nodeType : void 0 : void 0) !== 1) {
      line = line.trimLeft();
    }
    if ((node != null ? (ref6 = node.nextSibling) != null ? ref6.nodeType : void 0 : void 0) !== 1) {
      line = line.trimRight();
    }
    if (line) {
      if (encodeEntityRef) {
        line = Ent.encode(line, entOptions);
      }
      if (escapeBackslash) {
        line = line.replace("\\", "\\\\");
      }
      if (!wrap || line.length <= this.wrapLength) {
        return output.writeln(prefix + line);
      } else {
        lines = this.breakLine(line);
        if (lines.length === 1) {
          return output.writeln(prefix + line);
        } else {
          return lines.forEach(function (_this) {
            return function (line) {
              return _this.writeTextLine(node, line, output, options);
            };
          }(this));
        }
      }
    }
  };

  Writer.prototype.breakLine = function (line) {
    var lines, word, words;
    if (!line || line.length === 0) {
      return [];
    }
    if (line.search(/\s+/ === -1)) {
      return [line];
    }
    lines = [];
    words = line.split(/\s+/);
    line = '';
    while (words.length) {
      word = words.shift();
      if (line.length + word.length > this.wrapLength) {
        lines.push(line);
        line = word;
      } else if (line.length) {
        line += ' ' + word;
      } else {
        line = word;
      }
    }
    if (line.length) {
      lines.push(line);
    }
    return lines;
  };

  return Writer;
}();

publicIdDocTypeNames = {
  "-//W3C//DTD XHTML 1.0 Transitional//EN": "transitional",
  "-//W3C//DTD XHTML 1.0 Strict//EN": "strict",
  "-//W3C//DTD XHTML 1.0 Frameset//EN": "frameset",
  "-//W3C//DTD XHTML 1.1//EN": "1.1",
  "-//W3C//DTD XHTML Basic 1.1//EN": "basic",
  "-//WAPFORUM//DTD XHTML Mobile 1.2//EN": "mobile"
};

systemIdDocTypeNames = {
  "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd": "transitional",
  "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd": "strict",
  "http://www.w3.org/TR/xhtml1/DTD/xhtml1-frameset.dtd": "frameset",
  "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd": "1.1",
  "http://www.w3.org/TR/xhtml-basic/xhtml-basic11.dtd": "basic",
  "http://www.openmobilealliance.org/tech/DTD/xhtml-mobile12.dtd": "mobile"
};

Converter = function () {
  function Converter(options1) {
    var ref, ref1;
    this.options = options1 != null ? options1 : {};
    this.scalate = (ref = this.options.scalate) != null ? ref : false;
    this.writer = (ref1 = this.options.writer) != null ? ref1 : new Writer(this.options);
  }

  Converter.prototype.document = function (document, output) {
    var docTypeName, doctype, htmlEls, publicId, systemId;
    if (document.doctype != null) {
      doctype = document.doctype;
      docTypeName = void 0;
      publicId = doctype.publicId;
      systemId = doctype.systemId;
      if (publicId != null && publicIdDocTypeNames[publicId] != null) {
        docTypeName = publicIdDocTypeNames[publicId];
      } else if (systemId != null && systemIdDocTypeNames[systemId] != null) {
        docTypeName = systemIdDocTypeNames[systemId] != null;
      } else if (doctype.name != null && doctype.name.toLowerCase() === 'html') {
        docTypeName = 'html';
      }
      if (docTypeName != null) {
        output.writeln('doctype ' + docTypeName);
      }
    }
    if (document.documentElement) {
      return this.children(document, output, false);
    } else {
      htmlEls = document.getElementsByTagName('html');
      if (htmlEls.length > 0) {
        return this.element(htmlEls[0], output);
      }
    }
  };

  Converter.prototype.element = function (node, output) {
    var firstline, tagAttr, tagHead, tagName, tagText;
    if (!(node != null ? node.tagName : void 0)) {
      return;
    }
    tagName = node.tagName.toLowerCase();
    tagHead = this.writer.tagHead(node);
    tagAttr = this.writer.tagAttr(node, output.indents);
    tagText = this.writer.tagText(node);
    if (tagName === 'script' || tagName === 'style') {
      if (node.hasAttribute('src')) {
        output.writeln(tagHead + tagAttr);
        return this.writer.writeTextContent(node, output, {
          pipe: false,
          wrap: false
        });
      } else if (tagName === 'script') {
        return this.script(node, output, tagHead, tagAttr);
      } else if (tagName === 'style') {
        return this.style(node, output, tagHead, tagAttr);
      }
    } else if (tagName === 'conditional') {
      output.writeln('//' + node.getAttribute('condition'));
      return this.children(node, output);
    } else if (['pre'].indexOf(tagName) !== -1) {
      output.writeln(tagHead + tagAttr + '.');
      output.enter();
      firstline = true;
      this.writer.forEachChild(node, function (_this) {
        return function (child) {
          var data;
          if (child.nodeType === 3) {
            data = child.data;
            if (data != null && data.length > 0) {
              if (firstline) {
                if (data.search(/\r\n|\r|\n/) === 0) {
                  data = data.replace(/\r\n|\r|\n/, '');
                }
                data = '\\n' + data;
                firstline = false;
              }
              data = data.replace(/\t/g, '\\t');
              data = data.replace(/\r\n|\r|\n/g, '\n' + output.indents);
              return output.write(data);
            }
          }
        };
      }(this));
      output.writeln();
      return output.leave();
    } else if (this.options.bodyless && (tagName === 'html' || tagName === 'body')) {
      return this.children(node, output, false);
    } else if (tagText) {
      if (doNotEncode) {
        return output.writeln(tagHead + tagAttr + ' ' + tagText);
      } else {
        return output.writeln(tagHead + tagAttr + ' ' + Ent.encode(tagText, entOptions));
      }
    } else {
      output.writeln(tagHead + tagAttr);
      return this.children(node, output);
    }
  };

  Converter.prototype.children = function (parent, output, indent) {
    if (indent == null) {
      indent = true;
    }
    if (indent) {
      output.enter();
    }
    this.writer.forEachChild(parent, function (_this) {
      return function (child) {
        var nodeType;
        nodeType = child.nodeType;
        if (nodeType === 1) {
          return _this.element(child, output);
        } else if (nodeType === 3) {
          if (parent._nodeName === 'code') {
            return _this.text(child, output, {
              encodeEntityRef: true,
              pipe: true
            });
          } else {
            return _this.text(child, output, doNotEncode ? {
              encodeEntityRef: false
            } : {
              encodeEntityRef: true
            });
          }
        } else if (nodeType === 8) {
          return _this.comment(child, output);
        }
      };
    }(this));
    if (indent) {
      return output.leave();
    }
  };

  Converter.prototype.text = function (node, output, options) {
    node.normalize();
    return this.writer.writeText(node, output, options);
  };

  Converter.prototype.comment = function (node, output) {
    var condition, data, lines;
    condition = node.data.match(/\s*\[(if\s+[^\]]+)\]/);
    if (!condition) {
      data = node.data || '';
      if (data.length === 0 || data.search(/\r|\n/) === -1) {
        return output.writeln("// " + data.trim());
      } else {
        output.writeln('//');
        output.enter();
        lines = data.split(/\r|\n/);
        lines.forEach(function (_this) {
          return function (line) {
            return _this.writer.writeTextLine(node, line, output, {
              pipe: false,
              trim: true,
              wrap: false
            });
          };
        }(this));
        return output.leave();
      }
    } else {
      return this.conditional(node, condition[1], output);
    }
  };

  Converter.prototype.conditional = function (node, condition, output) {
    var conditionalElem, innerHTML;
    innerHTML = node.textContent.trim().replace(/\s*\[if\s+[^\]]+\]>\s*/, '').replace('<![endif]', '');
    if (innerHTML.indexOf("<!") === 0) {
      condition = " [" + condition + "] <!";
      innerHTML = null;
    }
    conditionalElem = node.ownerDocument.createElement('conditional');
    conditionalElem.setAttribute('condition', condition);
    if (innerHTML) {
      conditionalElem.innerHTML = innerHTML;
    }
    return node.parentNode.insertBefore(conditionalElem, node.nextSibling);
  };

  Converter.prototype.script = function (node, output, tagHead, tagAttr) {
    if (this.scalate) {
      output.writeln(':javascript');
      return this.writer.writeTextContent(node, output, {
        pipe: false,
        wrap: false
      });
    } else {
      output.writeln("" + tagHead + tagAttr + ".");
      return this.writer.writeTextContent(node, output, {
        pipe: false,
        trim: true,
        wrap: false,
        escapeBackslash: true
      });
    }
  };

  Converter.prototype.style = function (node, output, tagHead, tagAttr) {
    if (this.scalate) {
      output.writeln(':css');
      return this.writer.writeTextContent(node, output, {
        pipe: false,
        wrap: false
      });
    } else {
      output.writeln("" + tagHead + tagAttr + ".");
      return this.writer.writeTextContent(node, output, {
        pipe: false,
        trim: true,
        wrap: false
      });
    }
  };

  return Converter;
}();

Output = function () {
  function Output() {
    this.indents = '';
  }

  Output.prototype.enter = function () {
    var i, j, ref, results;
    if (useTabs) {
      return this.indents += '\t';
    } else {
      results = [];
      for (i = j = 1, ref = nspaces; 1 <= ref ? j <= ref : j >= ref; i = 1 <= ref ? ++j : --j) {
        results.push(this.indents += ' ');
      }
      return results;
    }
  };

  Output.prototype.leave = function () {
    if (useTabs) {
      return this.indents = this.indents.substring(1);
    } else {
      return this.indents = this.indents.substring(nspaces);
    }
  };

  Output.prototype.write = function (data, indent) {
    if (indent == null) {
      indent = true;
    }
  };

  Output.prototype.writeln = function (data, indent) {
    if (indent == null) {
      indent = true;
    }
  };

  return Output;
}();

StringOutput = function (superClass) {
  extend(StringOutput, superClass);

  function StringOutput() {
    StringOutput.__super__.constructor.apply(this, arguments);
    this.fragments = [];
  }

  StringOutput.prototype.write = function (data, indent) {
    if (indent == null) {
      indent = true;
    }
    if (data == null) {
      data = '';
    }
    if (indent) {
      return this.fragments.push(this.indents + data);
    } else {
      return this.fragments.push(data);
    }
  };

  StringOutput.prototype.writeln = function (data, indent) {
    if (indent == null) {
      indent = true;
    }
    if (data == null) {
      data = '';
    }
    if (indent) {
      return this.fragments.push(this.indents + data + '\n');
    } else {
      return this.fragments.push(data + '\n');
    }
  };

  StringOutput.prototype.final = function () {
    var result;
    result = this.fragments.join('');
    this.fragments = [];
    return result;
  };

  return StringOutput;
}(Output);

StreamOutput = function (superClass) {
  extend(StreamOutput, superClass);

  function StreamOutput(stream) {
    this.stream = stream;
    StreamOutput.__super__.constructor.apply(this, arguments);
  }

  StreamOutput.prototype.write = function (data, indent) {
    if (indent == null) {
      indent = true;
    }
    if (data == null) {
      data = '';
    }
    if (indent) {
      return this.stream.write(this.indents + data);
    } else {
      return this.stream.write(data);
    }
  };

  StreamOutput.prototype.writeln = function (data, indent) {
    if (indent == null) {
      indent = true;
    }
    if (data == null) {
      data = '';
    }
    if (indent) {
      return this.stream.write(this.indents + data + '\n');
    } else {
      return this.stream.write(data + '\n');
    }
  };

  return StreamOutput;
}(Output);

scope.Output = Output;

scope.StringOutput = StringOutput;

scope.Converter = Converter;

scope.Writer = Writer;

applyOptions = function applyOptions(options) {
  entOptions.useNamedReferences = !options.numeric;
  if (options.nspaces) {
    nspaces = options.nspaces;
  }
  if (options.tabs) {
    useTabs = true;
  }
  if (options.donotencode) {
    return doNotEncode = true;
  }
};

if (typeof exports !== "undefined" && exports !== null) {
  scope.Parser = _parser.Parser;
  scope.StreamOutput = StreamOutput;
  scope.convert = function (input, output, options) {
    if (options == null) {
      options = {};
    }
    applyOptions(options);
    if (options.parser == null) {
      options.parser = new _parser.Parser(options);
    }
    return options.parser.parse(input, function (errors, window) {
      if (errors != null ? errors.length : void 0) {
        return errors;
      } else {
        if (output == null) {
          output = new StreamOutput(process.stdout);
        }
        if (options.converter == null) {
          options.converter = new Converter(options);
        }
        return options.converter.document(window.document, output);
      }
    });
  };
}

scope.convertHtml = function (html, options, cb) {
  if (options == null) {
    options = {};
  }
  applyOptions(options);
  if (options.parser == null) {
    options.parser = new _parser.Parser(options);
  }
  return options.parser.parse(html, function (errors, window) {
    var output, ref;
    if (errors != null ? errors.length : void 0) {
      return errors;
    } else {
      output = (ref = options.output) != null ? ref : new StringOutput();
      if (options.converter == null) {
        options.converter = new Converter(options);
      }
      options.converter.document(window.document, output);
      if (cb != null) {
        return cb(null, output.final());
      }
    }
  });
};

scope.convertDocument = function (document, options, cb) {
  var output, ref;
  if (options == null) {
    options = {};
  }
  applyOptions(options);
  output = (ref = options.output) != null ? ref : new StringOutput();
  if (options.converter == null) {
    options.converter = new Converter(options);
  }
  options.converter.document(document, output);
  if (cb != null) {
    return cb(null, output.final());
  }
};