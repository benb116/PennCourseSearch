var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

!function (a, b, c) {
  "use strict";
  function h(a, b, c) {
    var e,
        d = a.runtimeStyle && a.runtimeStyle[b],
        f = a.style;return !/^-?[0-9]+\.?[0-9]*(?:px)?$/i.test(c) && /^-?\d/.test(c) && (e = f.left, d && (a.runtimeStyle.left = a.currentStyle.left), f.left = "fontSize" === b ? "1em" : c || 0, c = f.pixelLeft + "px", f.left = e, d && (a.runtimeStyle.left = d)), /^(thin|medium|thick)$/i.test(c) ? c : Math.round(parseFloat(c)) + "px";
  }function i(a) {
    return parseInt(a, 10);
  }function j(a, b, e, f) {
    if (a = (a || "").split(","), a = a[f || 0] || a[0] || "auto", a = d.Util.trimText(a).split(" "), "backgroundSize" !== e || a[0] && !a[0].match(/cover|contain|auto/)) {
      if (a[0] = -1 === a[0].indexOf("%") ? h(b, e + "X", a[0]) : a[0], a[1] === c) {
        if ("backgroundSize" === e) return a[1] = "auto", a;a[1] = a[0];
      }a[1] = -1 === a[1].indexOf("%") ? h(b, e + "Y", a[1]) : a[1];
    } else ;return a;
  }function k(a, b, c, e, f, g) {
    var i,
        j,
        k,
        l,
        h = d.Util.getCSS(b, a, f);if (1 === h.length && (l = h[0], h = [], h[0] = l, h[1] = l), -1 !== h[0].toString().indexOf("%")) k = parseFloat(h[0]) / 100, j = c.width * k, "backgroundSize" !== a && (j -= (g || e).width * k);else if ("backgroundSize" === a) {
      if ("auto" === h[0]) j = e.width;else if (/contain|cover/.test(h[0])) {
        var m = d.Util.resizeBounds(e.width, e.height, c.width, c.height, h[0]);j = m.width, i = m.height;
      } else j = parseInt(h[0], 10);
    } else j = parseInt(h[0], 10);return "auto" === h[1] ? i = j / e.width * e.height : -1 !== h[1].toString().indexOf("%") ? (k = parseFloat(h[1]) / 100, i = c.height * k, "backgroundSize" !== a && (i -= (g || e).height * k)) : i = parseInt(h[1], 10), [j, i];
  }function l(a, b) {
    var c = [];return { storage: c, width: a, height: b, clip: function clip() {
        c.push({ type: "function", name: "clip", arguments: arguments });
      }, translate: function translate() {
        c.push({ type: "function", name: "translate", arguments: arguments });
      }, fill: function fill() {
        c.push({ type: "function", name: "fill", arguments: arguments });
      }, save: function save() {
        c.push({ type: "function", name: "save", arguments: arguments });
      }, restore: function restore() {
        c.push({ type: "function", name: "restore", arguments: arguments });
      }, fillRect: function fillRect() {
        c.push({ type: "function", name: "fillRect", arguments: arguments });
      }, createPattern: function createPattern() {
        c.push({ type: "function", name: "createPattern", arguments: arguments });
      }, drawShape: function drawShape() {
        var a = [];return c.push({ type: "function", name: "drawShape", arguments: a }), { moveTo: function moveTo() {
            a.push({ name: "moveTo", arguments: arguments });
          }, lineTo: function lineTo() {
            a.push({ name: "lineTo", arguments: arguments });
          }, arcTo: function arcTo() {
            a.push({ name: "arcTo", arguments: arguments });
          }, bezierCurveTo: function bezierCurveTo() {
            a.push({ name: "bezierCurveTo", arguments: arguments });
          }, quadraticCurveTo: function quadraticCurveTo() {
            a.push({ name: "quadraticCurveTo", arguments: arguments });
          } };
      }, drawImage: function drawImage() {
        c.push({ type: "function", name: "drawImage", arguments: arguments });
      }, fillText: function fillText() {
        c.push({ type: "function", name: "fillText", arguments: arguments });
      }, setVariable: function setVariable(a, b) {
        return c.push({ type: "variable", name: a, arguments: b }), b;
      } };
  }function m(a) {
    return { zindex: a, children: [] };
  }var e,
      f,
      d = {};d.Util = {}, d.Util.log = function (b) {
    d.logging && a.console && a.console.log && a.console.log(b);
  }, d.Util.trimText = function (a) {
    return function (b) {
      return a ? a.apply(b) : ((b || "") + "").replace(/^\s+|\s+$/g, "");
    };
  }(String.prototype.trim), d.Util.asFloat = function (a) {
    return parseFloat(a);
  }, function () {
    var a = /((rgba|rgb)\([^\)]+\)(\s-?\d+px){0,})/g,
        b = /(-?\d+px)|(#.+)|(rgb\(.+\))|(rgba\(.+\))/g;d.Util.parseTextShadows = function (c) {
      if (!c || "none" === c) return [];for (var d = c.match(a), e = [], f = 0; d && f < d.length; f++) {
        var g = d[f].match(b);e.push({ color: g[0], offsetX: g[1] ? g[1].replace("px", "") : 0, offsetY: g[2] ? g[2].replace("px", "") : 0, blur: g[3] ? g[3].replace("px", "") : 0 });
      }return e;
    };
  }(), d.Util.parseBackgroundImage = function (a) {
    var c,
        d,
        e,
        f,
        g,
        i,
        l,
        m,
        b = " \r\n ",
        h = [],
        j = 0,
        k = 0,
        n = function n() {
      c && ('"' === d.substr(0, 1) && (d = d.substr(1, d.length - 2)), d && m.push(d), "-" === c.substr(0, 1) && (f = c.indexOf("-", 1) + 1) > 0 && (e = c.substr(0, f), c = c.substr(f)), h.push({ prefix: e, method: c.toLowerCase(), value: g, args: m })), m = [], c = e = d = g = "";
    };n();for (var o = 0, p = a.length; p > o; o++) {
      if (i = a[o], !(0 === j && b.indexOf(i) > -1)) {
        switch (i) {case '"':
            l ? l === i && (l = null) : l = i;break;case "(":
            if (l) break;if (0 === j) {
              j = 1, g += i;continue;
            }k++;break;case ")":
            if (l) break;if (1 === j) {
              if (0 === k) {
                j = 0, g += i, n();continue;
              }k--;
            }break;case ",":
            if (l) break;if (0 === j) {
              n();continue;
            }if (1 === j && 0 === k && !c.match(/^url$/i)) {
              m.push(d), d = "", g += i;continue;
            }}g += i, 0 === j ? c += i : d += i;
      }
    }return n(), h;
  }, d.Util.Bounds = function (a) {
    var b,
        c = {};return a.getBoundingClientRect && (b = a.getBoundingClientRect(), c.top = b.top, c.bottom = b.bottom || b.top + b.height, c.left = b.left, c.width = a.offsetWidth, c.height = a.offsetHeight), c;
  }, d.Util.OffsetBounds = function (a) {
    var b = a.offsetParent ? d.Util.OffsetBounds(a.offsetParent) : { top: 0, left: 0 };return { top: a.offsetTop + b.top, bottom: a.offsetTop + a.offsetHeight + b.top, left: a.offsetLeft + b.left, width: a.offsetWidth, height: a.offsetHeight };
  }, d.Util.getCSS = function (a, c, d) {
    e !== a && (f = b.defaultView.getComputedStyle(a, null));var g = f[c];if (/^background(Size|Position)$/.test(c)) return j(g, a, c, d);if (/border(Top|Bottom)(Left|Right)Radius/.test(c)) {
      var h = g.split(" ");return h.length <= 1 && (h[1] = h[0]), h.map(i);
    }return g;
  }, d.Util.resizeBounds = function (a, b, c, d, e) {
    var h,
        i,
        f = c / d,
        g = a / b;return e && "auto" !== e ? g > f ^ "contain" === e ? (i = d, h = d * g) : (h = c, i = c / g) : (h = c, i = d), { width: h, height: i };
  }, d.Util.BackgroundPosition = function (a, b, c, d, e) {
    var f = k("backgroundPosition", a, b, c, d, e);return { left: f[0], top: f[1] };
  }, d.Util.BackgroundSize = function (a, b, c, d) {
    var e = k("backgroundSize", a, b, c, d);return { width: e[0], height: e[1] };
  }, d.Util.Extend = function (a, b) {
    for (var c in a) {
      a.hasOwnProperty(c) && (b[c] = a[c]);
    }return b;
  }, d.Util.Children = function (a) {
    var b;try {
      b = a.nodeName && "IFRAME" === a.nodeName.toUpperCase() ? a.contentDocument || a.contentWindow.document : function (a) {
        var b = [];return null !== a && function (a, b) {
          var d = a.length,
              e = 0;if ("number" == typeof b.length) for (var f = b.length; f > e; e++) {
            a[d++] = b[e];
          } else for (; b[e] !== c;) {
            a[d++] = b[e++];
          }return a.length = d, a;
        }(b, a), b;
      }(a.childNodes);
    } catch (e) {
      d.Util.log("html2canvas.Util.Children failed with exception: " + e.message), b = [];
    }return b;
  }, d.Util.isTransparent = function (a) {
    return "transparent" === a || "rgba(0, 0, 0, 0)" === a;
  }, d.Util.Font = function () {
    var a = {};return function (b, d, e) {
      if (a[b + "-" + d] !== c) return a[b + "-" + d];var j,
          k,
          l,
          f = e.createElement("div"),
          g = e.createElement("img"),
          h = e.createElement("span"),
          i = "Hidden Text";return f.style.visibility = "hidden", f.style.fontFamily = b, f.style.fontSize = d, f.style.margin = 0, f.style.padding = 0, e.body.appendChild(f), g.src = "data:image/gif;base64,R0lGODlhAQABAIABAP///wAAACwAAAAAAQABAAACAkQBADs=", g.width = 1, g.height = 1, g.style.margin = 0, g.style.padding = 0, g.style.verticalAlign = "baseline", h.style.fontFamily = b, h.style.fontSize = d, h.style.margin = 0, h.style.padding = 0, h.appendChild(e.createTextNode(i)), f.appendChild(h), f.appendChild(g), j = g.offsetTop - h.offsetTop + 1, f.removeChild(h), f.appendChild(e.createTextNode(i)), f.style.lineHeight = "normal", g.style.verticalAlign = "super", k = g.offsetTop - f.offsetTop + 1, l = { baseline: j, lineWidth: 1, middle: k }, a[b + "-" + d] = l, e.body.removeChild(f), l;
    };
  }(), function () {
    function f(b) {
      return function (c) {
        try {
          b.addColorStop(c.stop, c.color);
        } catch (d) {
          a.log(["failed to add color stop: ", d, "; tried to add: ", c]);
        }
      };
    }var a = d.Util,
        c = {};d.Generate = c;var e = [/^(-webkit-linear-gradient)\(([a-z\s]+)([\w\d\.\s,%\(\)]+)\)$/, /^(-o-linear-gradient)\(([a-z\s]+)([\w\d\.\s,%\(\)]+)\)$/, /^(-webkit-gradient)\((linear|radial),\s((?:\d{1,3}%?)\s(?:\d{1,3}%?),\s(?:\d{1,3}%?)\s(?:\d{1,3}%?))([\w\d\.\s,%\(\)\-]+)\)$/, /^(-moz-linear-gradient)\(((?:\d{1,3}%?)\s(?:\d{1,3}%?))([\w\d\.\s,%\(\)]+)\)$/, /^(-webkit-radial-gradient)\(((?:\d{1,3}%?)\s(?:\d{1,3}%?)),\s(\w+)\s([a-z\-]+)([\w\d\.\s,%\(\)]+)\)$/, /^(-moz-radial-gradient)\(((?:\d{1,3}%?)\s(?:\d{1,3}%?)),\s(\w+)\s?([a-z\-]*)([\w\d\.\s,%\(\)]+)\)$/, /^(-o-radial-gradient)\(((?:\d{1,3}%?)\s(?:\d{1,3}%?)),\s(\w+)\s([a-z\-]+)([\w\d\.\s,%\(\)]+)\)$/];c.parseGradient = function (a, b) {
      var c,
          d,
          g,
          h,
          i,
          j,
          k,
          l,
          m,
          n,
          o,
          p,
          f = e.length;for (d = 0; f > d && !(g = a.match(e[d])); d += 1) {}if (g) switch (g[1]) {case "-webkit-linear-gradient":case "-o-linear-gradient":
          if (c = { type: "linear", x0: null, y0: null, x1: null, y1: null, colorStops: [] }, i = g[2].match(/\w+/g)) for (j = i.length, d = 0; j > d; d += 1) {
            switch (i[d]) {case "top":
                c.y0 = 0, c.y1 = b.height;break;case "right":
                c.x0 = b.width, c.x1 = 0;break;case "bottom":
                c.y0 = b.height, c.y1 = 0;break;case "left":
                c.x0 = 0, c.x1 = b.width;}
          }if (null === c.x0 && null === c.x1 && (c.x0 = c.x1 = b.width / 2), null === c.y0 && null === c.y1 && (c.y0 = c.y1 = b.height / 2), i = g[3].match(/((?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\)(?:\s\d{1,3}(?:%|px))?)+/g)) for (j = i.length, k = 1 / Math.max(j - 1, 1), d = 0; j > d; d += 1) {
            l = i[d].match(/((?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\))\s*(\d{1,3})?(%|px)?/), l[2] ? (h = parseFloat(l[2]), h /= "%" === l[3] ? 100 : b.width) : h = d * k, c.colorStops.push({ color: l[1], stop: h });
          }break;case "-webkit-gradient":
          if (c = { type: "radial" === g[2] ? "circle" : g[2], x0: 0, y0: 0, x1: 0, y1: 0, colorStops: [] }, i = g[3].match(/(\d{1,3})%?\s(\d{1,3})%?,\s(\d{1,3})%?\s(\d{1,3})%?/), i && (c.x0 = i[1] * b.width / 100, c.y0 = i[2] * b.height / 100, c.x1 = i[3] * b.width / 100, c.y1 = i[4] * b.height / 100), i = g[4].match(/((?:from|to|color-stop)\((?:[0-9\.]+,\s)?(?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\)\))+/g)) for (j = i.length, d = 0; j > d; d += 1) {
            l = i[d].match(/(from|to|color-stop)\(([0-9\.]+)?(?:,\s)?((?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\))\)/), h = parseFloat(l[2]), "from" === l[1] && (h = 0), "to" === l[1] && (h = 1), c.colorStops.push({ color: l[3], stop: h });
          }break;case "-moz-linear-gradient":
          if (c = { type: "linear", x0: 0, y0: 0, x1: 0, y1: 0, colorStops: [] }, i = g[2].match(/(\d{1,3})%?\s(\d{1,3})%?/), i && (c.x0 = i[1] * b.width / 100, c.y0 = i[2] * b.height / 100, c.x1 = b.width - c.x0, c.y1 = b.height - c.y0), i = g[3].match(/((?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\)(?:\s\d{1,3}%)?)+/g)) for (j = i.length, k = 1 / Math.max(j - 1, 1), d = 0; j > d; d += 1) {
            l = i[d].match(/((?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\))\s*(\d{1,3})?(%)?/), l[2] ? (h = parseFloat(l[2]), l[3] && (h /= 100)) : h = d * k, c.colorStops.push({ color: l[1], stop: h });
          }break;case "-webkit-radial-gradient":case "-moz-radial-gradient":case "-o-radial-gradient":
          if (c = { type: "circle", x0: 0, y0: 0, x1: b.width, y1: b.height, cx: 0, cy: 0, rx: 0, ry: 0, colorStops: [] }, i = g[2].match(/(\d{1,3})%?\s(\d{1,3})%?/), i && (c.cx = i[1] * b.width / 100, c.cy = i[2] * b.height / 100), i = g[3].match(/\w+/), l = g[4].match(/[a-z\-]*/), i && l) switch (l[0]) {case "farthest-corner":case "cover":case "":
              m = Math.sqrt(Math.pow(c.cx, 2) + Math.pow(c.cy, 2)), n = Math.sqrt(Math.pow(c.cx, 2) + Math.pow(c.y1 - c.cy, 2)), o = Math.sqrt(Math.pow(c.x1 - c.cx, 2) + Math.pow(c.y1 - c.cy, 2)), p = Math.sqrt(Math.pow(c.x1 - c.cx, 2) + Math.pow(c.cy, 2)), c.rx = c.ry = Math.max(m, n, o, p);break;case "closest-corner":
              m = Math.sqrt(Math.pow(c.cx, 2) + Math.pow(c.cy, 2)), n = Math.sqrt(Math.pow(c.cx, 2) + Math.pow(c.y1 - c.cy, 2)), o = Math.sqrt(Math.pow(c.x1 - c.cx, 2) + Math.pow(c.y1 - c.cy, 2)), p = Math.sqrt(Math.pow(c.x1 - c.cx, 2) + Math.pow(c.cy, 2)), c.rx = c.ry = Math.min(m, n, o, p);break;case "farthest-side":
              "circle" === i[0] ? c.rx = c.ry = Math.max(c.cx, c.cy, c.x1 - c.cx, c.y1 - c.cy) : (c.type = i[0], c.rx = Math.max(c.cx, c.x1 - c.cx), c.ry = Math.max(c.cy, c.y1 - c.cy));break;case "closest-side":case "contain":
              "circle" === i[0] ? c.rx = c.ry = Math.min(c.cx, c.cy, c.x1 - c.cx, c.y1 - c.cy) : (c.type = i[0], c.rx = Math.min(c.cx, c.x1 - c.cx), c.ry = Math.min(c.cy, c.y1 - c.cy));}if (i = g[5].match(/((?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\)(?:\s\d{1,3}(?:%|px))?)+/g)) for (j = i.length, k = 1 / Math.max(j - 1, 1), d = 0; j > d; d += 1) {
            l = i[d].match(/((?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\))\s*(\d{1,3})?(%|px)?/), l[2] ? (h = parseFloat(l[2]), h /= "%" === l[3] ? 100 : b.width) : h = d * k, c.colorStops.push({ color: l[1], stop: h });
          }}return c;
    }, c.Gradient = function (a, c) {
      if (0 !== c.width && 0 !== c.height) {
        var h,
            i,
            e = b.createElement("canvas"),
            g = e.getContext("2d");if (e.width = c.width, e.height = c.height, h = d.Generate.parseGradient(a, c)) switch (h.type) {case "linear":
            i = g.createLinearGradient(h.x0, h.y0, h.x1, h.y1), h.colorStops.forEach(f(i)), g.fillStyle = i, g.fillRect(0, 0, c.width, c.height);break;case "circle":
            i = g.createRadialGradient(h.cx, h.cy, 0, h.cx, h.cy, h.rx), h.colorStops.forEach(f(i)), g.fillStyle = i, g.fillRect(0, 0, c.width, c.height);break;case "ellipse":
            var j = b.createElement("canvas"),
                k = j.getContext("2d"),
                l = Math.max(h.rx, h.ry),
                m = 2 * l;j.width = j.height = m, i = k.createRadialGradient(h.rx, h.ry, 0, h.rx, h.ry, l), h.colorStops.forEach(f(i)), k.fillStyle = i, k.fillRect(0, 0, m, m), g.fillStyle = h.colorStops[h.colorStops.length - 1].color, g.fillRect(0, 0, e.width, e.height), g.drawImage(j, h.cx - h.rx, h.cy - h.ry, 2 * h.rx, 2 * h.ry);}return e;
      }
    }, c.ListAlpha = function (a) {
      var c,
          b = "";do {
        c = a % 26, b = String.fromCharCode(c + 64) + b, a /= 26;
      } while (26 * a > 26);return b;
    }, c.ListRoman = function (a) {
      var e,
          b = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"],
          c = [1e3, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1],
          d = "",
          f = b.length;if (0 >= a || a >= 4e3) return a;for (e = 0; f > e; e += 1) {
        for (; a >= c[e];) {
          a -= c[e], d += b[e];
        }
      }return d;
    };
  }(), d.Parse = function (e, f) {
    function s() {
      return Math.max(Math.max(i.body.scrollWidth, i.documentElement.scrollWidth), Math.max(i.body.offsetWidth, i.documentElement.offsetWidth), Math.max(i.body.clientWidth, i.documentElement.clientWidth));
    }function t() {
      return Math.max(Math.max(i.body.scrollHeight, i.documentElement.scrollHeight), Math.max(i.body.offsetHeight, i.documentElement.offsetHeight), Math.max(i.body.clientHeight, i.documentElement.clientHeight));
    }function u(a, b) {
      var c = parseInt(p(a, b), 10);return isNaN(c) ? 0 : c;
    }function v(a, b, c, d, e, f) {
      "transparent" !== f && (a.setVariable("fillStyle", f), a.fillRect(b, c, d, e), h += 1);
    }function w(a, b, c) {
      return a.length > 0 ? b + c.toUpperCase() : void 0;
    }function x(a, b) {
      switch (b) {case "lowercase":
          return a.toLowerCase();case "capitalize":
          return a.replace(/(^|\s|:|-|\(|\))([a-z])/g, w);case "uppercase":
          return a.toUpperCase();default:
          return a;}
    }function y(a) {
      return (/^(normal|none|0px)$/.test(a)
      );
    }function z(a, b, c, d) {
      null !== a && j.trimText(a).length > 0 && (d.fillText(a, b, c), h += 1);
    }function A(a, b, c, d) {
      var e = !1,
          f = p(b, "fontWeight"),
          g = p(b, "fontFamily"),
          h = p(b, "fontSize"),
          k = j.parseTextShadows(p(b, "textShadow"));switch (parseInt(f, 10)) {case 401:
          f = "bold";break;case 400:
          f = "normal";}return a.setVariable("fillStyle", d), a.setVariable("font", [p(b, "fontStyle"), p(b, "fontVariant"), f, h, g].join(" ")), a.setVariable("textAlign", e ? "right" : "left"), k.length && (a.setVariable("shadowColor", k[0].color), a.setVariable("shadowOffsetX", k[0].offsetX), a.setVariable("shadowOffsetY", k[0].offsetY), a.setVariable("shadowBlur", k[0].blur)), "none" !== c ? j.Font(g, h, i) : void 0;
    }function B(a, b, c, d, e) {
      switch (b) {case "underline":
          v(a, c.left, Math.round(c.top + d.baseline + d.lineWidth), c.width, 1, e);break;case "overline":
          v(a, c.left, Math.round(c.top), c.width, 1, e);break;case "line-through":
          v(a, c.left, Math.ceil(c.top + d.middle + d.lineWidth), c.width, 1, e);}
    }function C(a, b, c, d, e) {
      var f;if (k.rangeBounds && !e) ("none" !== c || 0 !== j.trimText(b).length) && (f = D(b, a.node, a.textOffset)), a.textOffset += b.length;else if (a.node && "string" == typeof a.node.nodeValue) {
        var g = d ? a.node.splitText(b.length) : null;f = E(a.node, e), a.node = g;
      }return f;
    }function D(a, b, c) {
      var d = i.createRange();return d.setStart(b, c), d.setEnd(b, c + a.length), d.getBoundingClientRect();
    }function E(a, b) {
      var c = a.parentNode,
          d = i.createElement("wrapper"),
          e = a.cloneNode(!0);d.appendChild(a.cloneNode(!0)), c.replaceChild(d, a);var f = b ? j.OffsetBounds(d) : j.Bounds(d);return c.replaceChild(e, d), f;
    }function F(a, b, c) {
      var i,
          k,
          d = c.ctx,
          e = p(a, "color"),
          g = p(a, "textDecoration"),
          h = p(a, "textAlign"),
          l = { node: b, textOffset: 0 };j.trimText(b.nodeValue).length > 0 && (b.nodeValue = x(b.nodeValue, p(a, "textTransform")), h = h.replace(["-webkit-auto"], ["auto"]), k = !f.letterRendering && /^(left|right|justify|auto)$/.test(h) && y(p(a, "letterSpacing")) ? b.nodeValue.split(/(\b| )/) : b.nodeValue.split(""), i = A(d, a, g, e), f.chinese && k.forEach(function (a, b) {
        /.*[\u4E00-\u9FA5].*$/.test(a) && (a = a.split(""), a.unshift(b, 1), k.splice.apply(k, a));
      }), k.forEach(function (a, b) {
        var f = C(l, a, g, b < k.length - 1, c.transform.matrix);f && (z(a, f.left, f.bottom, d), B(d, g, f, i, e));
      }));
    }function G(a, b) {
      var d,
          e,
          c = i.createElement("boundelement");return c.style.display = "inline", d = a.style.listStyleType, a.style.listStyleType = "none", c.appendChild(i.createTextNode(b)), a.insertBefore(c, a.firstChild), e = j.Bounds(c), a.removeChild(c), a.style.listStyleType = d, e;
    }function H(a) {
      var b = -1,
          c = 1,
          d = a.parentNode.childNodes;if (a.parentNode) {
        for (; d[++b] !== a;) {
          1 === d[b].nodeType && c++;
        }return c;
      }return -1;
    }function I(a, b) {
      var e,
          c = H(a);switch (b) {case "decimal":
          e = c;break;case "decimal-leading-zero":
          e = 1 === c.toString().length ? c = "0" + c.toString() : c.toString();break;case "upper-roman":
          e = d.Generate.ListRoman(c);break;case "lower-roman":
          e = d.Generate.ListRoman(c).toLowerCase();break;case "lower-alpha":
          e = d.Generate.ListAlpha(c).toLowerCase();break;case "upper-alpha":
          e = d.Generate.ListAlpha(c);}return e + ". ";
    }function J(a, b, c) {
      var d,
          e,
          h,
          f = b.ctx,
          g = p(a, "listStyleType");if (/^(decimal|decimal-leading-zero|upper-alpha|upper-latin|upper-roman|lower-alpha|lower-greek|lower-latin|lower-roman)$/i.test(g)) {
        if (e = I(a, g), h = G(a, e), A(f, a, "none", p(a, "color")), "inside" !== p(a, "listStylePosition")) return;f.setVariable("textAlign", "left"), d = c.left, z(e, d, h.bottom, f);
      }
    }function K(a) {
      var b = e[a];return b && b.succeeded === !0 ? b.img : !1;
    }function L(a, b) {
      var c = Math.max(a.left, b.left),
          d = Math.max(a.top, b.top),
          e = Math.min(a.left + a.width, b.left + b.width),
          f = Math.min(a.top + a.height, b.top + b.height);return { left: c, top: d, width: e - c, height: f - d };
    }function M(a, b, c) {
      var d,
          e = "static" !== b.cssPosition,
          f = e ? p(a, "zIndex") : "auto",
          g = p(a, "opacity"),
          h = "none" !== p(a, "cssFloat");b.zIndex = d = m(f), d.isPositioned = e, d.isFloated = h, d.opacity = g, d.ownStacking = "auto" !== f || 1 > g, c && c.zIndex.children.push(b);
    }function N(a, b, c, d, e) {
      var f = u(b, "paddingLeft"),
          g = u(b, "paddingTop"),
          h = u(b, "paddingRight"),
          i = u(b, "paddingBottom");$(a, c, 0, 0, c.width, c.height, d.left + f + e[3].width, d.top + g + e[0].width, d.width - (e[1].width + e[3].width + f + h), d.height - (e[0].width + e[2].width + g + i));
    }function O(a) {
      return ["Top", "Right", "Bottom", "Left"].map(function (b) {
        return { width: u(a, "border" + b + "Width"), color: p(a, "border" + b + "Color") };
      });
    }function P(a) {
      return ["TopLeft", "TopRight", "BottomRight", "BottomLeft"].map(function (b) {
        return p(a, "border" + b + "Radius");
      });
    }function R(a, b, c, d) {
      var e = function e(a, b, c) {
        return { x: a.x + (b.x - a.x) * c, y: a.y + (b.y - a.y) * c };
      };return { start: a, startControl: b, endControl: c, end: d, subdivide: function subdivide(f) {
          var g = e(a, b, f),
              h = e(b, c, f),
              i = e(c, d, f),
              j = e(g, h, f),
              k = e(h, i, f),
              l = e(j, k, f);return [R(a, g, j, l), R(l, k, i, d)];
        }, curveTo: function curveTo(a) {
          a.push(["bezierCurve", b.x, b.y, c.x, c.y, d.x, d.y]);
        }, curveToReversed: function curveToReversed(d) {
          d.push(["bezierCurve", c.x, c.y, b.x, b.y, a.x, a.y]);
        } };
    }function S(a, b, c, d, e, f, g) {
      b[0] > 0 || b[1] > 0 ? (a.push(["line", d[0].start.x, d[0].start.y]), d[0].curveTo(a), d[1].curveTo(a)) : a.push(["line", f, g]), (c[0] > 0 || c[1] > 0) && a.push(["line", e[0].start.x, e[0].start.y]);
    }function T(a, b, c, d, e, f, g) {
      var h = [];return b[0] > 0 || b[1] > 0 ? (h.push(["line", d[1].start.x, d[1].start.y]), d[1].curveTo(h)) : h.push(["line", a.c1[0], a.c1[1]]), c[0] > 0 || c[1] > 0 ? (h.push(["line", f[0].start.x, f[0].start.y]), f[0].curveTo(h), h.push(["line", g[0].end.x, g[0].end.y]), g[0].curveToReversed(h)) : (h.push(["line", a.c2[0], a.c2[1]]), h.push(["line", a.c3[0], a.c3[1]])), b[0] > 0 || b[1] > 0 ? (h.push(["line", e[1].end.x, e[1].end.y]), e[1].curveToReversed(h)) : h.push(["line", a.c4[0], a.c4[1]]), h;
    }function U(a, b, c) {
      var d = a.left,
          e = a.top,
          f = a.width,
          g = a.height,
          h = b[0][0],
          i = b[0][1],
          j = b[1][0],
          k = b[1][1],
          l = b[2][0],
          m = b[2][1],
          n = b[3][0],
          o = b[3][1],
          p = f - j,
          q = g - m,
          r = f - l,
          s = g - o;return { topLeftOuter: Q(d, e, h, i).topLeft.subdivide(.5), topLeftInner: Q(d + c[3].width, e + c[0].width, Math.max(0, h - c[3].width), Math.max(0, i - c[0].width)).topLeft.subdivide(.5), topRightOuter: Q(d + p, e, j, k).topRight.subdivide(.5), topRightInner: Q(d + Math.min(p, f + c[3].width), e + c[0].width, p > f + c[3].width ? 0 : j - c[3].width, k - c[0].width).topRight.subdivide(.5), bottomRightOuter: Q(d + r, e + q, l, m).bottomRight.subdivide(.5), bottomRightInner: Q(d + Math.min(r, f + c[3].width), e + Math.min(q, g + c[0].width), Math.max(0, l - c[1].width), Math.max(0, m - c[2].width)).bottomRight.subdivide(.5), bottomLeftOuter: Q(d, e + s, n, o).bottomLeft.subdivide(.5), bottomLeftInner: Q(d + c[3].width, e + s, Math.max(0, n - c[3].width), Math.max(0, o - c[2].width)).bottomLeft.subdivide(.5) };
    }function V(a, b, c, d, e) {
      var f = p(a, "backgroundClip"),
          g = [];switch (f) {case "content-box":case "padding-box":
          S(g, d[0], d[1], b.topLeftInner, b.topRightInner, e.left + c[3].width, e.top + c[0].width), S(g, d[1], d[2], b.topRightInner, b.bottomRightInner, e.left + e.width - c[1].width, e.top + c[0].width), S(g, d[2], d[3], b.bottomRightInner, b.bottomLeftInner, e.left + e.width - c[1].width, e.top + e.height - c[2].width), S(g, d[3], d[0], b.bottomLeftInner, b.topLeftInner, e.left + c[3].width, e.top + e.height - c[2].width);break;default:
          S(g, d[0], d[1], b.topLeftOuter, b.topRightOuter, e.left, e.top), S(g, d[1], d[2], b.topRightOuter, b.bottomRightOuter, e.left + e.width, e.top), S(g, d[2], d[3], b.bottomRightOuter, b.bottomLeftOuter, e.left + e.width, e.top + e.height), S(g, d[3], d[0], b.bottomLeftOuter, b.topLeftOuter, e.left, e.top + e.height);}return g;
    }function W(a, b, c) {
      var h,
          i,
          j,
          k,
          l,
          m,
          d = b.left,
          e = b.top,
          f = b.width,
          g = b.height,
          n = P(a),
          o = U(b, n, c),
          p = { clip: V(a, o, c, n, b), borders: [] };for (h = 0; 4 > h; h++) {
        if (c[h].width > 0) {
          switch (i = d, j = e, k = f, l = g - c[2].width, h) {case 0:
              l = c[0].width, m = T({ c1: [i, j], c2: [i + k, j], c3: [i + k - c[1].width, j + l], c4: [i + c[3].width, j + l] }, n[0], n[1], o.topLeftOuter, o.topLeftInner, o.topRightOuter, o.topRightInner);break;case 1:
              i = d + f - c[1].width, k = c[1].width, m = T({ c1: [i + k, j], c2: [i + k, j + l + c[2].width], c3: [i, j + l], c4: [i, j + c[0].width] }, n[1], n[2], o.topRightOuter, o.topRightInner, o.bottomRightOuter, o.bottomRightInner);break;case 2:
              j = j + g - c[2].width, l = c[2].width, m = T({ c1: [i + k, j + l], c2: [i, j + l], c3: [i + c[3].width, j], c4: [i + k - c[3].width, j] }, n[2], n[3], o.bottomRightOuter, o.bottomRightInner, o.bottomLeftOuter, o.bottomLeftInner);break;case 3:
              k = c[3].width, m = T({ c1: [i, j + l + c[2].width], c2: [i, j], c3: [i + k, j + c[0].width], c4: [i + k, j + l] }, n[3], n[0], o.bottomLeftOuter, o.bottomLeftInner, o.topLeftOuter, o.topLeftInner);}p.borders.push({ args: m, color: c[h].color });
        }
      }return p;
    }function X(a, b) {
      var c = a.drawShape();return b.forEach(function (a, b) {
        c[0 === b ? "moveTo" : a[0] + "To"].apply(null, a.slice(1));
      }), c;
    }function Y(a, b, c) {
      "transparent" !== c && (a.setVariable("fillStyle", c), X(a, b), a.fill(), h += 1);
    }function Z(a, b, c) {
      var f,
          g,
          d = i.createElement("valuewrap"),
          e = ["lineHeight", "textAlign", "fontFamily", "color", "fontSize", "paddingLeft", "paddingTop", "width", "height", "border", "borderLeftWidth", "borderTopWidth"];e.forEach(function (b) {
        try {
          d.style[b] = p(a, b);
        } catch (c) {
          j.log("html2canvas: Parse: Exception caught in renderFormValue: " + c.message);
        }
      }), d.style.borderColor = "black", d.style.borderStyle = "solid", d.style.display = "block", d.style.position = "absolute", (/^(submit|reset|button|text|password)$/.test(a.type) || "SELECT" === a.nodeName) && (d.style.lineHeight = p(a, "height")), d.style.top = b.top + "px", d.style.left = b.left + "px", f = "SELECT" === a.nodeName ? (a.options[a.selectedIndex] || 0).text : a.value, f || (f = a.placeholder), g = i.createTextNode(f), d.appendChild(g), o.appendChild(d), F(a, g, c), o.removeChild(d);
    }function $(a) {
      a.drawImage.apply(a, Array.prototype.slice.call(arguments, 1)), h += 1;
    }function _(c, d) {
      var e = a.getComputedStyle(c, d);if (e && e.content && "none" !== e.content && "-moz-alt-content" !== e.content && "none" !== e.display) {
        var f = e.content + "",
            g = f.substr(0, 1);g === f.substr(f.length - 1) && g.match(/'|"/) && (f = f.substr(1, f.length - 2));var h = "url" === f.substr(0, 3),
            i = b.createElement(h ? "img" : "span");return i.className = q + "-before " + q + "-after", Object.keys(e).filter(ab).forEach(function (a) {
          try {
            i.style[a] = e[a];
          } catch (b) {
            j.log(["Tried to assign readonly property ", a, "Error:", b]);
          }
        }), h ? i.src = j.parseBackgroundImage(f)[0].args[0] : i.innerHTML = f, i;
      }
    }function ab(b) {
      return isNaN(a.parseInt(b, 10));
    }function bb(a, b) {
      var c = _(a, ":before"),
          d = _(a, ":after");(c || d) && (c && (a.className += " " + q + "-before", a.parentNode.insertBefore(c, a), rb(c, b, !0), a.parentNode.removeChild(c), a.className = a.className.replace(q + "-before", "").trim()), d && (a.className += " " + q + "-after", a.appendChild(d), rb(d, b, !0), a.removeChild(d), a.className = a.className.replace(q + "-after", "").trim()));
    }function cb(a, b, c, d) {
      var e = Math.round(d.left + c.left),
          f = Math.round(d.top + c.top);a.createPattern(b), a.translate(e, f), a.fill(), a.translate(-e, -f);
    }function db(a, b, c, d, e, f, g, h) {
      var i = [];i.push(["line", Math.round(e), Math.round(f)]), i.push(["line", Math.round(e + g), Math.round(f)]), i.push(["line", Math.round(e + g), Math.round(h + f)]), i.push(["line", Math.round(e), Math.round(h + f)]), X(a, i), a.save(), a.clip(), cb(a, b, c, d), a.restore();
    }function eb(a, b, c) {
      v(a, b.left, b.top, b.width, b.height, c);
    }function fb(a, b, c, d, e) {
      var f = j.BackgroundSize(a, b, d, e),
          g = j.BackgroundPosition(a, b, d, e, f),
          h = p(a, "backgroundRepeat").split(",").map(j.trimText);switch (d = hb(d, f), h = h[e] || h[0]) {case "repeat-x":
          db(c, d, g, b, b.left, b.top + g.top, 99999, d.height);break;case "repeat-y":
          db(c, d, g, b, b.left + g.left, b.top, d.width, 99999);break;case "no-repeat":
          db(c, d, g, b, b.left + g.left, b.top + g.top, d.width, d.height);break;default:
          cb(c, d, g, { top: b.top, left: b.left, width: d.width, height: d.height });}
    }function gb(a, b, c) {
      for (var f, d = p(a, "backgroundImage"), e = j.parseBackgroundImage(d), g = e.length; g--;) {
        if (d = e[g], d.args && 0 !== d.args.length) {
          var h = "url" === d.method ? d.args[0] : d.value;f = K(h), f ? fb(a, b, c, f, g) : j.log("html2canvas: Error loading background:", d);
        }
      }
    }function hb(a, b) {
      if (a.width === b.width && a.height === b.height) return a;var c,
          d = i.createElement("canvas");return d.width = b.width, d.height = b.height, c = d.getContext("2d"), $(c, a, 0, 0, a.width, a.height, 0, 0, b.width, b.height), d;
    }function ib(a, b, c) {
      return a.setVariable("globalAlpha", p(b, "opacity") * (c ? c.opacity : 1));
    }function jb(a) {
      return a.replace("px", "");
    }function lb(a) {
      var c = p(a, "transform") || p(a, "-webkit-transform") || p(a, "-moz-transform") || p(a, "-ms-transform") || p(a, "-o-transform"),
          d = p(a, "transform-origin") || p(a, "-webkit-transform-origin") || p(a, "-moz-transform-origin") || p(a, "-ms-transform-origin") || p(a, "-o-transform-origin") || "0px 0px";d = d.split(" ").map(jb).map(j.asFloat);var e;if (c && "none" !== c) {
        var f = c.match(kb);if (f) switch (f[1]) {case "matrix":
            e = f[2].split(",").map(j.trimText).map(j.asFloat);}
      }return { origin: d, matrix: e };
    }function mb(a, b, c, d) {
      var e = l(b ? c.width : s(), b ? c.height : t()),
          g = { ctx: e, opacity: ib(e, a, b), cssPosition: p(a, "position"), borders: O(a), transform: d, clip: b && b.clip ? j.Extend({}, b.clip) : null };return M(a, g, b), f.useOverflow === !0 && /(hidden|scroll|auto)/.test(p(a, "overflow")) === !0 && /(BODY)/i.test(a.nodeName) === !1 && (g.clip = g.clip ? L(g.clip, c) : c), g;
    }function nb(a, b, c) {
      var d = { left: b.left + a[3].width, top: b.top + a[0].width, width: b.width - (a[1].width + a[3].width), height: b.height - (a[0].width + a[2].width) };return c && (d = L(d, c)), d;
    }function ob(a, b) {
      var c = b.matrix ? j.OffsetBounds(a) : j.Bounds(a);return b.origin[0] += c.left, b.origin[1] += c.top, c;
    }function pb(a, b, c, d) {
      var g,
          e = lb(a, b),
          f = ob(a, e),
          h = mb(a, b, f, e),
          i = h.borders,
          k = h.ctx,
          l = nb(i, f, h.clip),
          m = W(a, f, i),
          o = n.test(a.nodeName) ? "#efefef" : p(a, "backgroundColor");switch (X(k, m.clip), k.save(), k.clip(), l.height > 0 && l.width > 0 && !d ? (eb(k, f, o), gb(a, l, k)) : d && (h.backgroundColor = o), k.restore(), m.borders.forEach(function (a) {
        Y(k, a.args, a.color);
      }), c || bb(a, h), a.nodeName) {case "IMG":
          (g = K(a.getAttribute("src"))) ? N(k, a, g, f, i) : j.log("html2canvas: Error loading <img>:" + a.getAttribute("src"));break;case "INPUT":
          /^(text|url|email|submit|button|reset)$/.test(a.type) && (a.value || a.placeholder || "").length > 0 && Z(a, f, h);break;case "TEXTAREA":
          (a.value || a.placeholder || "").length > 0 && Z(a, f, h);break;case "SELECT":
          (a.options || a.placeholder || "").length > 0 && Z(a, f, h);break;case "LI":
          J(a, h, l);break;case "CANVAS":
          N(k, a, a, f, i);}return h;
    }function qb(a) {
      return "none" !== p(a, "display") && "hidden" !== p(a, "visibility") && !a.hasAttribute("data-html2canvas-ignore");
    }function rb(a, b, c) {
      qb(a) && (b = pb(a, b, c, !1) || b, n.test(a.nodeName) || sb(a, b, c));
    }function sb(a, b, c) {
      j.Children(a).forEach(function (d) {
        d.nodeType === d.ELEMENT_NODE ? rb(d, b, c) : d.nodeType === d.TEXT_NODE && F(a, d, b);
      });
    }function tb() {
      var a = p(b.documentElement, "backgroundColor"),
          c = j.isTransparent(a) && g === b.body,
          d = pb(g, null, !1, c);return sb(g, d), c && (a = d.backgroundColor), o.removeChild(r), { backgroundColor: a, stack: d };
    }a.scroll(0, 0);var g = f.elements === c ? b.body : f.elements[0],
        h = 0,
        i = g.ownerDocument,
        j = d.Util,
        k = j.Support(f, i),
        n = new RegExp("(" + f.ignoreElements + ")"),
        o = i.body,
        p = j.getCSS,
        q = "___html2canvas___pseudoelement",
        r = i.createElement("style");r.innerHTML = "." + q + '-before:before { content: "" !important; display: none !important; }' + "." + q + '-after:after { content: "" !important; display: none !important; }', o.appendChild(r), e = e || {};var Q = function (a) {
      return function (b, c, d, e) {
        var f = d * a,
            g = e * a,
            h = b + d,
            i = c + e;return { topLeft: R({ x: b, y: i }, { x: b, y: i - g }, { x: h - f, y: c }, { x: h, y: c }), topRight: R({ x: b, y: c }, { x: b + f, y: c }, { x: h, y: i - g }, { x: h, y: i }), bottomRight: R({ x: h, y: c }, { x: h, y: c + g }, { x: b + f, y: i }, { x: b, y: i }), bottomLeft: R({ x: h, y: i }, { x: h - f, y: i }, { x: b, y: c + g }, { x: b, y: c }) };
      };
    }(4 * ((Math.sqrt(2) - 1) / 3)),
        kb = /(matrix)\((.+)\)/;return tb();
  }, d.Preload = function (e) {
    function s(a) {
      p.href = a, p.href = p.href;var b = p.protocol + p.host;return b === g;
    }function t() {
      h.log("html2canvas: start: images: " + f.numLoaded + " / " + f.numTotal + " (failed: " + f.numFailed + ")"), !f.firstRun && f.numLoaded >= f.numTotal && (h.log("Finished loading images: # " + f.numTotal + " (failed: " + f.numFailed + ")"), "function" == typeof e.complete && e.complete(f));
    }function u(b, d, g) {
      var h,
          j,
          i = e.proxy;p.href = b, b = p.href, h = "html2canvas_" + k++, g.callbackname = h, i += i.indexOf("?") > -1 ? "&" : "?", i += "url=" + encodeURIComponent(b) + "&callback=" + h, j = m.createElement("script"), a[h] = function (b) {
        "error:" === b.substring(0, 6) ? (g.succeeded = !1, f.numLoaded++, f.numFailed++, t()) : (B(d, g), d.src = b), a[h] = c;try {
          delete a[h];
        } catch (e) {}j.parentNode.removeChild(j), j = null, delete g.script, delete g.callbackname;
      }, j.setAttribute("type", "text/javascript"), j.setAttribute("src", i), g.script = j, a.document.body.appendChild(j);
    }function v(b, c) {
      var e = a.getComputedStyle(b, c),
          f = e.content;"url" === f.substr(0, 3) && i.loadImage(d.Util.parseBackgroundImage(f)[0].args[0]), z(e.backgroundImage, b);
    }function w(a) {
      v(a, ":before"), v(a, ":after");
    }function x(a, b) {
      var e = d.Generate.Gradient(a, b);e !== c && (f[a] = { img: e, succeeded: !0 }, f.numTotal++, f.numLoaded++, t());
    }function y(a) {
      return a && a.method && a.args && a.args.length > 0;
    }function z(a, b) {
      var e;d.Util.parseBackgroundImage(a).filter(y).forEach(function (a) {
        "url" === a.method ? i.loadImage(a.args[0]) : a.method.match(/\-?gradient$/) && (e === c && (e = d.Util.Bounds(b)), x(a.value, e));
      });
    }function A(a) {
      var b = !1;try {
        h.Children(a).forEach(A);
      } catch (d) {}try {
        b = a.nodeType;
      } catch (e) {
        b = !1, h.log("html2canvas: failed to access some element's nodeType - Exception: " + e.message);
      }if (1 === b || b === c) {
        w(a);try {
          z(h.getCSS(a, "backgroundImage"), a);
        } catch (d) {
          h.log("html2canvas: failed to get background-image - Exception: " + d.message);
        }z(a);
      }
    }function B(b, d) {
      b.onload = function () {
        d.timer !== c && a.clearTimeout(d.timer), f.numLoaded++, d.succeeded = !0, b.onerror = b.onload = null, t();
      }, b.onerror = function () {
        if ("anonymous" === b.crossOrigin && (a.clearTimeout(d.timer), e.proxy)) {
          var c = b.src;return b = new Image(), d.img = b, b.src = c, u(b.src, b, d), void 0;
        }f.numLoaded++, f.numFailed++, d.succeeded = !1, b.onerror = b.onload = null, t();
      };
    }var g,
        i,
        j,
        r,
        f = { numLoaded: 0, numFailed: 0, numTotal: 0, cleanupDone: !1 },
        h = d.Util,
        k = 0,
        l = e.elements[0] || b.body,
        m = l.ownerDocument,
        n = l.getElementsByTagName("img"),
        o = n.length,
        p = m.createElement("a"),
        q = function (a) {
      return a.crossOrigin !== c;
    }(new Image());for (p.href = a.location.href, g = p.protocol + p.host, i = { loadImage: function loadImage(a) {
        var b, d;a && f[a] === c && (b = new Image(), a.match(/data:image\/.*;base64,/i) ? (b.src = a.replace(/url\(['"]{0,}|['"]{0,}\)$/gi, ""), d = f[a] = { img: b }, f.numTotal++, B(b, d)) : s(a) || e.allowTaint === !0 ? (d = f[a] = { img: b }, f.numTotal++, B(b, d), b.src = a) : q && !e.allowTaint && e.useCORS ? (b.crossOrigin = "anonymous", d = f[a] = { img: b }, f.numTotal++, B(b, d), b.src = a) : e.proxy && (d = f[a] = { img: b }, f.numTotal++, u(a, b, d)));
      }, cleanupDOM: function cleanupDOM(d) {
        var g, i;if (!f.cleanupDone) {
          d && "string" == typeof d ? h.log("html2canvas: Cleanup because: " + d) : h.log("html2canvas: Cleanup after timeout: " + e.timeout + " ms.");for (i in f) {
            if (f.hasOwnProperty(i) && (g = f[i], "object" == (typeof g === "undefined" ? "undefined" : _typeof(g)) && g.callbackname && g.succeeded === c)) {
              a[g.callbackname] = c;try {
                delete a[g.callbackname];
              } catch (j) {}g.script && g.script.parentNode && (g.script.setAttribute("src", "about:blank"), g.script.parentNode.removeChild(g.script)), f.numLoaded++, f.numFailed++, h.log("html2canvas: Cleaned up failed img: '" + i + "' Steps: " + f.numLoaded + " / " + f.numTotal);
            }
          }a.stop !== c ? a.stop() : b.execCommand !== c && b.execCommand("Stop", !1), b.close !== c && b.close(), f.cleanupDone = !0, d && "string" == typeof d || t();
        }
      }, renderingDone: function renderingDone() {
        r && a.clearTimeout(r);
      } }, e.timeout > 0 && (r = a.setTimeout(i.cleanupDOM, e.timeout)), h.log("html2canvas: Preload starts: finding background-images"), f.firstRun = !0, A(l), h.log("html2canvas: Preload: Finding images"), j = 0; o > j; j += 1) {
      i.loadImage(n[j].getAttribute("src"));
    }return f.firstRun = !1, h.log("html2canvas: Preload: Done."), f.numTotal === f.numLoaded && t(), i;
  }, d.Renderer = function (a, e) {
    function f(a) {
      function e(a) {
        Object.keys(a).sort().forEach(function (c) {
          var d = [],
              f = [],
              g = [],
              h = [];a[c].forEach(function (a) {
            a.node.zIndex.isPositioned || a.node.zIndex.opacity < 1 ? g.push(a) : a.node.zIndex.isFloated ? f.push(a) : d.push(a);
          }), function i(a) {
            a.forEach(function (a) {
              h.push(a), a.children && i(a.children);
            });
          }(d.concat(f, g)), h.forEach(function (a) {
            a.context ? e(a.context) : b.push(a.node);
          });
        });
      }var d,
          b = [];return d = function (a) {
        function d(a, b, e) {
          var f = "auto" === b.zIndex.zindex ? 0 : Number(b.zIndex.zindex),
              g = a,
              h = b.zIndex.isPositioned,
              i = b.zIndex.isFloated,
              j = { node: b },
              k = e;b.zIndex.ownStacking ? (g = j.context = { "!": [{ node: b, children: [] }] }, k = c) : (h || i) && (k = j.children = []), 0 === f && e ? e.push(j) : (a[f] || (a[f] = []), a[f].push(j)), b.zIndex.children.forEach(function (a) {
            d(g, a, k);
          });
        }var b = {};return d(b, a), b;
      }(a), e(d), b;
    }function g(a) {
      var b;if ("string" == typeof e.renderer && d.Renderer[a] !== c) b = d.Renderer[a](e);else {
        if ("function" != typeof a) throw new Error("Unknown renderer");b = a(e);
      }if ("function" != typeof b) throw new Error("Invalid renderer defined");return b;
    }return g(e.renderer)(a, e, b, f(a.stack), d);
  }, d.Util.Support = function (a, b) {
    function e() {
      var a = new Image(),
          e = b.createElement("canvas"),
          f = e.getContext === c ? !1 : e.getContext("2d");if (f === !1) return !1;e.width = e.height = 10, a.src = ["data:image/svg+xml,", "<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'>", "<foreignObject width='10' height='10'>", "<div xmlns='http://www.w3.org/1999/xhtml' style='width:10;height:10;'>", "sup", "</div>", "</foreignObject>", "</svg>"].join("");try {
        f.drawImage(a, 0, 0), e.toDataURL();
      } catch (g) {
        return !1;
      }return d.Util.log("html2canvas: Parse: SVG powered rendering available"), !0;
    }function f() {
      var a,
          c,
          d,
          e,
          f = !1;return b.createRange && (a = b.createRange(), a.getBoundingClientRect && (c = b.createElement("boundtest"), c.style.height = "123px", c.style.display = "block", b.body.appendChild(c), a.selectNode(c), d = a.getBoundingClientRect(), e = d.height, 123 === e && (f = !0), b.body.removeChild(c))), f;
    }return { rangeBounds: f(), svgRendering: a.svgRendering && e() };
  }, a.html2canvas = function (b, c) {
    b = b.length ? b : [b];var e,
        f,
        g = { logging: !1, elements: b, background: "#fff", proxy: null, timeout: 0, useCORS: !1, allowTaint: !1, svgRendering: !1, ignoreElements: "IFRAME|OBJECT|PARAM", useOverflow: !0, letterRendering: !1, chinese: !1, width: null, height: null, taintTest: !0, renderer: "Canvas" };return g = d.Util.Extend(c, g), d.logging = g.logging, g.complete = function (a) {
      ("function" != typeof g.onpreloaded || g.onpreloaded(a) !== !1) && (e = d.Parse(a, g), ("function" != typeof g.onparsed || g.onparsed(e) !== !1) && (f = d.Renderer(e, g), "function" == typeof g.onrendered && g.onrendered(f)));
    }, a.setTimeout(function () {
      d.Preload(g);
    }, 0), { render: function render(a, b) {
        return d.Renderer(a, d.Util.Extend(b, g));
      }, parse: function parse(a, b) {
        return d.Parse(a, d.Util.Extend(b, g));
      }, preload: function preload(a) {
        return d.Preload(d.Util.Extend(a, g));
      }, log: d.Util.log };
  }, a.html2canvas.log = d.Util.log, a.html2canvas.Renderer = { Canvas: c }, d.Renderer.Canvas = function (a) {
    function k(a, b) {
      a.beginPath(), b.forEach(function (b) {
        a[b.name].apply(a, b.arguments);
      }), a.closePath();
    }function l(a) {
      if (-1 === f.indexOf(a.arguments[0].src)) {
        h.drawImage(a.arguments[0], 0, 0);try {
          h.getImageData(0, 0, 1, 1);
        } catch (b) {
          return g = e.createElement("canvas"), h = g.getContext("2d"), !1;
        }f.push(a.arguments[0].src);
      }return !0;
    }function m(b, c) {
      switch (c.type) {case "variable":
          b[c.name] = c.arguments;break;case "function":
          switch (c.name) {case "createPattern":
              if (c.arguments[0].width > 0 && c.arguments[0].height > 0) try {
                b.fillStyle = b.createPattern(c.arguments[0], "repeat");
              } catch (d) {
                i.log("html2canvas: Renderer: Error creating pattern", d.message);
              }break;case "drawShape":
              k(b, c.arguments);break;case "drawImage":
              c.arguments[8] > 0 && c.arguments[7] > 0 && (!a.taintTest || a.taintTest && l(c)) && b.drawImage.apply(b, c.arguments);break;default:
              b[c.name].apply(b, c.arguments);}}
    }a = a || {};var e = b,
        f = [],
        g = b.createElement("canvas"),
        h = g.getContext("2d"),
        i = d.Util,
        j = a.canvas || e.createElement("canvas");return function (a, b, d, e, f) {
      var h,
          k,
          l,
          g = j.getContext("2d"),
          n = a.stack;return j.width = j.style.width = b.width || n.ctx.width, j.height = j.style.height = b.height || n.ctx.height, l = g.fillStyle, g.fillStyle = i.isTransparent(n.backgroundColor) && b.background !== c ? b.background : a.backgroundColor, g.fillRect(0, 0, j.width, j.height), g.fillStyle = l, e.forEach(function (a) {
        g.textBaseline = "bottom", g.save(), a.transform.matrix && (g.translate(a.transform.origin[0], a.transform.origin[1]), g.transform.apply(g, a.transform.matrix), g.translate(-a.transform.origin[0], -a.transform.origin[1])), a.clip && (g.beginPath(), g.rect(a.clip.left, a.clip.top, a.clip.width, a.clip.height), g.clip()), a.ctx.storage && a.ctx.storage.forEach(function (a) {
          m(g, a);
        }), g.restore();
      }), i.log("html2canvas: Renderer: Canvas renderer done - returning canvas obj"), 1 === b.elements.length && "object" == _typeof(b.elements[0]) && "BODY" !== b.elements[0].nodeName ? (k = f.Util.Bounds(b.elements[0]), h = d.createElement("canvas"), h.width = Math.ceil(k.width), h.height = Math.ceil(k.height), g = h.getContext("2d"), g.drawImage(j, k.left, k.top, k.width, k.height, 0, 0, k.width, k.height), j = null, h) : j;
    };
  };
}(window, document);