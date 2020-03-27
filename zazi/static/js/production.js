function bootstrapView() {
    var a;
    try {
        applyBranding(); 
        $(".language_dropdown").on("click", ".dropdown-menu-item", changeAllRequests);
        $(".response-name li").click(changeResponse);
        $("body").on("click", ".is-expandable", showInModal);

        $(".shared-environment-dropdown li").on("click", function() {
            setEnvironmentMeta($(this))
        });
        $(".environment-dropdown li").on("click", function() {
            var a, b = $(this).data("environment-id"),
                c = $(".active-environment").data("environment-id"),
                d = localStorage.getItem("lang_preference") || "cURL";
            b !== c && (0 === b ? (a = getInitialCollectionJson(), setEnvironmentMeta($(this)), populateDataIntoTemplate("doc-sidebar", a), updateLanguage(d, !0), attachHandlers()) : (initialJson.collection.meta.lang = d, displayCollectionWithEnvironment.bind($(this))(b), updateLanguage(d, !0)), highlightVisibleSnippets())
        });

    } catch (b) {
        console.error(b)
    }
}

function populateScope() {
    var a, b = $("#script-data-scope");
    a = b.data(), _.forEach(a, function(a, b) {
        var c = _.camelCase(b.replace(/^var/i, ""));
        b.match(/^var/) && !_.has(scope, c) && (scope[c] = a)
    })
}

function applyBranding() {
    $identity = $(".branded-logo"), $identity.css("background-image", 'url("' + $identity.data("identity-href") + '")').removeData("identity-href")
}

function enforceTableWidth() {
    $(".md-table-container").each(function(a, b) {
        var c = b.querySelector("tr").cells.length;
        $(this).css("width", 150 * c)
    })
}

function populateDataIntoTemplate(a, b) {
    var c = Handlebars.templates[a],
        d = $("#doc-body");
    d.html(c(b)).removeClass("is-loading"), prepareView(), setTimeout(function() {
        enforceTableWidth()
    }), $(".response-name .dropdown-menu li").click(changeResponse)
}

function prepareView() {
    beautifyResponse(), bindScrollHandler(), scrollToHash()
}

function scrollToHash() {
    var a = window.location.hash,
        b = $(a),
        c = $("html, body");
    b.length && c.scrollTop(b.offset().top)
}

function attachHandlers() {
    $body = $("body"), $(".response-name li").click(changeResponse), $(".language_dropdown").on("click", ".dropdown-menu-item", changeAllRequests), $body.on("click", ".is-expandable", showInModal), $(".shared-environment-dropdown li").on("click", function() {
        setEnvironmentMeta($(this))
    }), $(".environment-dropdown li").on("click", function() {
        var a, b = $(this).data("environment-id"),
            c = $(".active-environment").data("environment-id"),
            d = localStorage.getItem("lang_preference") || "cURL";
        b !== c && (0 === b ? (a = getInitialCollectionJson(), setEnvironmentMeta($(this)), populateDataIntoTemplate("doc-sidebar", a), updateLanguage(d, !0), attachHandlers()) : (initialJson.collection.meta.lang = d, displayCollectionWithEnvironment.bind($(this))(b), updateLanguage(d, !0)), highlightVisibleSnippets())
    }), bindPublishButtonHandler(), $("#unpublish_button").on("click", function() {
        var a = $("#unpublish_collection");
        setTimeout(function() {
            a.submit()
        }, 500)
    }), new Clipboard(".copy-text");
    var a = new Clipboard(".copy-request");
    a.on("success", function(a) {
        $(a.trigger).addClass("copied"), setTimeout(function() {
            $(a.trigger).removeClass("copied")
        }, 1e3), a.clearSelection()
    }), $(".settings-toggle").on("click", function() {
        $("#mobile-controls").toggleClass("is-visible")
    }), $body.on("mouseenter", ".click-to-expand-wrapper", function(a) {
        var b = $(a.target).closest(".click-to-expand-wrapper"),
            c = b.outerHeight();
        c > 198 && b.addClass("is-expandable")
    })
}

function attachSidebarHandlers() {
    $(".folder .toggle-folder-collapse").on("click", toggleFolderState), $(".folder-link>a").on("click", activateFolder), $(".pm-doc-sprite-folder").on("click", function() {
        $(this).siblings(".folder-link").find("a")[0].click()
    }), $("body").on("click", "#menu-toggle", function() {
        $("body").toggleClass("nav-open")
    }).on("click", ".nav a", function() {
        setTimeout(function() {
            $("body").removeClass("nav-open"), scrollToHash()
        }, 0)
    })
}

function activateFolder() {
    var a = $(this),
        b = $(this).closest(".folder"),
        c = $(".folder-link>a");
    b.hasClass("open") ? a.hasClass("active") && collapseFolder(b) : (c.removeClass("active-folder"), expandFolder(b))
}

function bindScrollHandler() {
    $(window).on("scroll resize pm-notification-closed", adjustDocumentPadding.bind(this, $(".pm-message-persistent"))).on("scroll", _.debounce(highlightVisibleSnippets, 50))
}

function adjustDocumentPadding(a) {
    var b = $(window).scrollTop(),
        c = a.parents(".pm-persistent-notification-container"),
        d = 70,
        e = 0;
    a && a.length && (e = a.outerHeight()), b > d ? (b = d, c.addClass("is-fixed")) : c.removeClass("is-fixed"), $(".sidebar").css("padding-top", d + e - b + "px"), $(".container-fluid").css("padding-top", e + "px")
}

function displayCollectionWithEnvironment(a) {
    var b, c = environmentMapping[a];
    setEnvironmentMeta($(this)), resolveEnvironmentValues(c), b = substituteObjectVars(collectionJson, c), populateDataIntoTemplate("doc-sidebar", b), attachHandlers()
}

function setEnvironmentMeta(a) {
    $(".active-environment").text(a.text()).data("environment-id", a.data("environment-id"))
}

function getInitialCollectionJson() {
    return initialJson.collection
}

function getInitialJson(a) {
    var b, c = $('meta[name="cmodelID"]').attr("content"),
        d = $('meta[name="ownerId"]').attr("content"),
        e = $('meta[name="publishedId"]').attr("content"),
        f = $(".active-lang:visible").text() || "cURL";
    try {
        f = localStorage.getItem("lang_preference") || f
    } catch (g) {
        console.log("Failed to get from localstorage with error => ", g)
    }
    b = !c && d && e ? scope.host + "/api/collection/" + d + "/" + e + "?lang=" + f : scope.host + "/api/collection/" + c + "?lang=" + f, updateLanguage(f, !0), c || d && e ? $.getJSON(b).done(function(b, c, d) {
        return console.log("getInitialJson.done", arguments), a(b)
    }).fail(function(b, c, d) {
        return console.log("getInitialJson.fail", arguments), a({})
    }) : a({})
}

function highlightParentFolder(a) {
    var b = a.parent().hasClass("folder-link"),
        c = a.closest(".folder"),
        d = c.find(".folder-link:first a");
    return b ? void $(".folder-link a").removeClass("active-folder") : void(0 !== c.length && (d.hasClass("active-folder") || ($(".folder-link a").removeClass("active-folder"), d.addClass("active-folder"))))
}

function openFolder(a) {
    a.toggleClass("open").find("ul:first").toggleClass("display-requests")
}

function showInModal() {
    var a = $(this).clone(),
        b = a.css("width");
    a.removeClass("is-expandable"), $("#rawBodyModal").addClass("white-background").modal().find(".modal-body").empty().append(a).css("width", b || "auto")
}

function collapseFolder(a) {
    return a.removeClass("user-opened open").find("ul:first").removeClass("display-requests"), !0
}

function expandFolder(a) {
    return a.addClass("open user-opened").find("ul:first").addClass("display-requests user-opened"), !0
}

function toggleFolderState() {
    var a = $(this).closest(".folder");
    a.hasClass("open") && collapseFolder(a) || expandFolder(a)
}

function beautifyResponse() {
    var a, b;
    _.forEach($(".formatted-responses"), function(c) {
        c = $(c), a = c.text(), b = c.attr("data-lang");
        try {
            a = JSON.parse(a), a = JSON.stringify(a, null, 2)
        } catch (d) {}
        populateSnippet(c, a, b)
    })
}

function updateLanguage(a, b) {
    2 === $(".active-lang").length ? ($(".active-lang").text(a), !b && $('.formatted-requests[data-lang="' + a + '"][data-id$="_0"]').show()) : setTimeout(function(c) {
        updateLanguage(a, b)
    }, 500)
}

function changeResponse() {
    var a = $(this),
        b = a.data("request-info"),
        c = a.data("request-name");
    $(".formatted-requests[data-id^=" + c + "]").hide(), $(".formatted-responses[data-id^=" + c + "]").hide(), $(".response-status[data-id^=" + c + "]").hide(), $(".formatted-requests[data-id=" + b + '][data-lang="' + $(".active-lang:first").text() + '"]').show(), $(".formatted-responses[data-id=" + b + "]").show(), $(".response-status[data-id=" + b + "]").show(), $("#" + c + "_dropdown .response-name-label").text(a.text()), highlightVisibleSnippets()
}

function changeAllRequests() {
    var a, b = $(this).text(),
        c = $(".formatted-requests:visible");
    $(".active-lang").text(b);
    try {
        localStorage.setItem("lang_preference", b)
    } catch (d) {
        console.log("Failed to set localStorage with error => ", d)
    }
    $(".formatted-requests").hide(), _.forEach(c, function(c) {
        setTimeout(function() {
            a = $(c).data("id"), $('.formatted-requests[data-lang="' + b + '"][data-id="' + a + '"]').show()
        }, 0)
    }), setTimeout(function() {
        highlightVisibleSnippets()
    }, 0)
}

function populateSnippet(a, b, c) {
    var d = ["html", "xml"];
    d.indexOf(c) >= 0 ? a.html('<pre class="click-to-expand-wrapper is-snippet-wrapper"><code class="language-markup"></code></pre>') : a.html('<pre class="click-to-expand-wrapper is-snippet-wrapper"><code class="language-javascript"></code></pre>'), a.find("code").text(b)
}

function getParameterByName(a) {
    var b = RegExp("[?&]" + a + "=([^&]*)").exec(window.location.search);
    return b && decodeURIComponent(b[1].replace(/\+/g, " "))
}

function buildEnvironmentMapping(a) {
    _.forEach(a, function(a) {
        environmentMapping[a.id] = convertArrayToFlatObject(a.values)
    })
}

function convertArrayToFlatObject(a) {
    return _.reduce(a, function(a, b) {
        return a[b.key] = b.value, a
    }, {})
}

function resolveEnvironmentValues(a) {
    _.times(20, function() {
        _.forEach(a, function(b, c) {
            a[c] = "string" == typeof b ? b.replace(templatePattern, function(b, c) {
                var d = a[c];
                return d && d.toString && "function" != typeof d ? d.toString() : b
            }) : void 0
        })
    })
}

function substituteObjectVars(a, b) {
    var c = this,
        d = a;
    return "boolean" == typeof a || "number" == typeof a || null === a ? a : (d = _.reduce(a, function(a, d, e) {
        var f = c.substituteVars(e, b),
            g = d;
        return _.isString(d) ? (g = c.substituteVars(d, b), g.match("http://https?://") && (g = g.replace(/http:\/\/http/gi, "http"))) : g = _.isArray(d) ? _.map(d, function(a) {
            return _.isString(a) ? c.substituteVars(a, b) : c.substituteObjectVars(a, b)
        }) : c.substituteObjectVars(d, b), a[f] = g, a
    }, {}), collectionVariantsExist = !_.isEqual(a, d) || collectionVariantsExist, d)
}

function substituteVars(a, b) {
    return "string" != typeof a ? a : ("object" == typeof b && null !== b || (b = {}), a.replace(templatePattern, function(a, c) {
        var d = b[c];
        return d && d.toString && "function" != typeof d ? d.toString() : a
    }))
}

function buildToC() {
    var a = $(".collection-description h1");
    a.each(function(a, b) {
        var c, d = _.get($(b), "0.textContent"),
            e = {
                lower: !0
            },
            f = slug(d, e),
            g = Handlebars.templates["toc-item"],
            h = $(".toc ul"),
            i = {};
        !f && (f = "section"), toc.hasOwnProperty(f) ? (toc[f]++, f = [f, toc[f]].join("-")) : toc[f] = 1, i.id = f, i.name = d, b.id = i.id, c = g(i), $(c).appendTo(h)
    })
}

function showLiveDocBanner() {
    var a = window.location.hostname;
    !a.match(/documenter.*\.getpostman\.com/) && a.match(/\.getpostman\.com$/) && $("#live-documentation-banner").removeClass("is-hidden")
}

function bindPublishButtonHandler() {
    var a = $("#initiate_publish_button");
    a && a[0] && a[0].hasAttribute("href") && a.on("click", modifyPublishURL) || a.on("click", togglePublishTooltip)
}

function togglePublishTooltip() {
    $(".tt-block-publish").toggleClass("in")
}

function modifyPublishURL() {
    var a = window.location.pathname,
        b = a.split("/").slice(-1)[0].split("-"),
        c = b[0],
        d = b.slice(1).join("-"),
        e = $.param({
            collection_id: d,
            owner: c,
            collection_name: initialJson.collection.info.name
        }),
        f = $(this).attr("href").indexOf("meta") > 0 ? $(this).attr("href") : $(this).attr("href") + "?meta=" + window.btoa(e);
    $(this).attr("href", f)
}

function fetchCustomDomains() {
    var a = ($(".custom-domain-error-message"), $(".custom-domain-activity-indicator"));
    $.get({
        url: scope.host + "/domains",
        headers: {
            Accept: "application/json"
        }
    }).done(function(a) {
        renderCustomDomainDropdownItems(a.result || a.domains)
    }).fail(function(a) {
        var b = JSON.parse(a.responseText),
            c = $(".public-url"),
            d = $(".publish-section-custom-domain h5"),
            e = "Something went wrong while loading your custom domains.";
        console.log(_.get(b, "error", e)), c.show(), d.hide()
    }).always(function() {
        a.hide()
    })
}

function renderCustomDomainDropdownItems(a) {
    var b, c = [],
        d = $(".publish-section-custom-domain .dropdown"),
        e = $(".publish-section-custom-domain .dropdown-menu"),
        f = $("#custom_domain_fqdn"),
        g = f.val(),
        h = $(".public-url"),
        i = $(".slug-url");
    _.forEach(a, function(a) {
        var d = "",
            e = $(".publish-section-custom-domain .dropdown-menu li:first-child").clone(),
            f = !1;
        a.fqdn === g && (b = a, f = !0), !a.verified && (d = "(unverified)"), !f && _.get(a, "upstream.url") && (d = "(unavailable)"), _.assign(a, {
            label: a.fqdn + " " + d
        }), e.data("domain-id", a.id).data("domain-fqdn", a.fqdn).data("domain-collection-id", _.get(a, "publishData.collectionId")).data("domain-owner-id", _.get(a, "publishData.owner")).text(a.label), c.push(e)
    }), d.show(), e.append(c), h.show(), b && i.text("https://" + b.fqdn).attr("href", "https://" + b.fqdn), b && selectCustomDomain(b)
}

function selectCustomDomain(a) {
    var b = $("#custom_domain_id"),
        c = $("#custom_domain_fqdn"),
        d = $(".publish-section-custom-domain .dropdown-button");
    b.val(a.id), c.val(a.fqdn), d.text(a.label), toggleDomainHelpTextVisibility(a.label)
}

function toggleDomainHelpTextVisibility(a, b) {
    var c = $(".publish-button"),
        d = {
            unverified: {
                el: $("#custom-domain-message__is-unverified")
            },
            unavailable: {
                el: $("#custom-domain-message__is-unavailable"),
                renderer: function() {
                    var a = $(".custom-domain-message__helptext"),
                        d = b.data(),
                        e = urlPrefix + "/collection/view/" + d.domainOwnerId + "-" + d.domainCollectionId;
                    d.domainOwnerId == scope.userId ? a.addClass("is-owner").find("a").attr("href", e) : a.removeClass("is-owner"), c.attr("disabled", "disabled")
                }
            }
        };
    _.isString(a) && _.forEach(d, function(b, d) {
        c.attr("disabled", null), a.match(new RegExp("\\(" + d + "\\)$")) ? (b.el.show(), "function" == typeof b.renderer && b.renderer()) : b.el.hide()
    })
}

function bindPublishPageHandlers() {
    $("body").on("click", ".publish-section-custom-domain li", function() {
        var a = $(this),
            b = a.text();
        $(".publish-section-custom-domain .dropdown-button").text(b), $("#custom_domain_id").val(a.data("domain-id")), $("#custom_domain_fqdn").val(a.data("domain-fqdn")), toggleDomainHelpTextVisibility(b, a)
    }).on("click", ".shared-environment-dropdown li", function() {
        $(".shared-environment-dropdown .dropdown-button").text($(this).text()), $("#environment_template_id").val($(this).data("environment-id")), $("#environment_owner").val($(this).data("owner"))
    }).on("click", ".publish-button", publishDocumentation).on("click", ".unpublish-button", unpublishDocumentation)
}

function publishDocumentation() {
    var a = $("#update-collection-form"),
        b = a.data("meta"),
        c = a.data("publish-action");
    a.attr("action", c + "?meta=" + b).submit()
}

function unpublishDocumentation() {
    var a = $("#update-collection-form"),
        b = a.data("meta"),
        c = a.data("unpublish-action");
    a.attr("action", c + "?meta=" + b).submit()
}

function highlightVisibleSnippets() {
    var a = document.querySelectorAll("pre code"),
        b = [],
        c = document.querySelectorAll("pre code.is-highlighted");
    _.forEach(a, function(a) {
        elementIsVisible(a) && b.push(a)
    }), _.forEach(c, function(a) {
        var c;
        _.indexOf(b, a) === -1 && (c = $(a), c.text(c.text()).removeClass("is-highlighted"))
    }), _.forEach(b, function(a) {
        _.indexOf(c, a) === -1 && ($(a).addClass("is-highlighted"), Prism.highlightElement(a))
    })
}

function elementIsVisible(a) {
    var b, c, d = a.getBoundingClientRect(a),
        e = {
            height: window.innerHeight,
            widht: window.innerWidth
        };
    return b = d.top < e.height && d.top > 0 || d.bottom < e.height && d.bottom > 0, c = d.top < 0 && d.bottom > e.height, b || c
}! function(a) {
    if ("object" == typeof exports && "undefined" != typeof module) module.exports = a();
    else if ("function" == typeof define && define.amd) define([], a);
    else {
        var b;
        b = "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : this, b.Clipboard = a()
    }
}(function() {
    var a;
    return function b(a, c, d) {
        function e(g, h) {
            if (!c[g]) {
                if (!a[g]) {
                    var i = "function" == typeof require && require;
                    if (!h && i) return i(g, !0);
                    if (f) return f(g, !0);
                    var j = new Error("Cannot find module '" + g + "'");
                    throw j.code = "MODULE_NOT_FOUND", j
                }
                var k = c[g] = {
                    exports: {}
                };
                a[g][0].call(k.exports, function(b) {
                    var c = a[g][1][b];
                    return e(c ? c : b)
                }, k, k.exports, b, a, c, d)
            }
            return c[g].exports
        }
        for (var f = "function" == typeof require && require, g = 0; g < d.length; g++) e(d[g]);
        return e
    }({
        1: [function(a, b, c) {
            var d = a("matches-selector");
            b.exports = function(a, b, c) {
                for (var e = c ? a : a.parentNode; e && e !== document;) {
                    if (d(e, b)) return e;
                    e = e.parentNode
                }
            }
        }, {
            "matches-selector": 5
        }],
        2: [function(a, b, c) {
            function d(a, b, c, d, f) {
                var g = e.apply(this, arguments);
                return a.addEventListener(c, g, f), {
                    destroy: function() {
                        a.removeEventListener(c, g, f)
                    }
                }
            }

            function e(a, b, c, d) {
                return function(c) {
                    c.delegateTarget = f(c.target, b, !0), c.delegateTarget && d.call(a, c)
                }
            }
            var f = a("closest");
            b.exports = d
        }, {
            closest: 1
        }],
        3: [function(a, b, c) {
            c.node = function(a) {
                return void 0 !== a && a instanceof HTMLElement && 1 === a.nodeType
            }, c.nodeList = function(a) {
                var b = Object.prototype.toString.call(a);
                return void 0 !== a && ("[object NodeList]" === b || "[object HTMLCollection]" === b) && "length" in a && (0 === a.length || c.node(a[0]))
            }, c.string = function(a) {
                return "string" == typeof a || a instanceof String
            }, c.fn = function(a) {
                var b = Object.prototype.toString.call(a);
                return "[object Function]" === b
            }
        }, {}],
        4: [function(a, b, c) {
            function d(a, b, c) {
                if (!a && !b && !c) throw new Error("Missing required arguments");
                if (!h.string(b)) throw new TypeError("Second argument must be a String");
                if (!h.fn(c)) throw new TypeError("Third argument must be a Function");
                if (h.node(a)) return e(a, b, c);
                if (h.nodeList(a)) return f(a, b, c);
                if (h.string(a)) return g(a, b, c);
                throw new TypeError("First argument must be a String, HTMLElement, HTMLCollection, or NodeList")
            }

            function e(a, b, c) {
                return a.addEventListener(b, c), {
                    destroy: function() {
                        a.removeEventListener(b, c)
                    }
                }
            }

            function f(a, b, c) {
                return Array.prototype.forEach.call(a, function(a) {
                    a.addEventListener(b, c)
                }), {
                    destroy: function() {
                        Array.prototype.forEach.call(a, function(a) {
                            a.removeEventListener(b, c)
                        })
                    }
                }
            }

            function g(a, b, c) {
                return i(document.body, a, b, c)
            }
            var h = a("./is"),
                i = a("delegate");
            b.exports = d
        }, {
            "./is": 3,
            delegate: 2
        }],
        5: [function(a, b, c) {
            function d(a, b) {
                if (f) return f.call(a, b);
                for (var c = a.parentNode.querySelectorAll(b), d = 0; d < c.length; ++d)
                    if (c[d] == a) return !0;
                return !1
            }
            var e = Element.prototype,
                f = e.matchesSelector || e.webkitMatchesSelector || e.mozMatchesSelector || e.msMatchesSelector || e.oMatchesSelector;
            b.exports = d
        }, {}],
        6: [function(a, b, c) {
            function d(a) {
                var b;
                if ("INPUT" === a.nodeName || "TEXTAREA" === a.nodeName) a.focus(), a.setSelectionRange(0, a.value.length), b = a.value;
                else {
                    a.hasAttribute("contenteditable") && a.focus();
                    var c = window.getSelection(),
                        d = document.createRange();
                    d.selectNodeContents(a), c.removeAllRanges(), c.addRange(d), b = c.toString()
                }
                return b
            }
            b.exports = d
        }, {}],
        7: [function(a, b, c) {
            function d() {}
            d.prototype = {
                on: function(a, b, c) {
                    var d = this.e || (this.e = {});
                    return (d[a] || (d[a] = [])).push({
                        fn: b,
                        ctx: c
                    }), this
                },
                once: function(a, b, c) {
                    function d() {
                        e.off(a, d), b.apply(c, arguments)
                    }
                    var e = this;
                    return d._ = b, this.on(a, d, c)
                },
                emit: function(a) {
                    var b = [].slice.call(arguments, 1),
                        c = ((this.e || (this.e = {}))[a] || []).slice(),
                        d = 0,
                        e = c.length;
                    for (d; e > d; d++) c[d].fn.apply(c[d].ctx, b);
                    return this
                },
                off: function(a, b) {
                    var c = this.e || (this.e = {}),
                        d = c[a],
                        e = [];
                    if (d && b)
                        for (var f = 0, g = d.length; g > f; f++) d[f].fn !== b && d[f].fn._ !== b && e.push(d[f]);
                    return e.length ? c[a] = e : delete c[a], this
                }
            }, b.exports = d
        }, {}],
        8: [function(b, c, d) {
            ! function(e, f) {
                if ("function" == typeof a && a.amd) a(["module", "select"], f);
                else if ("undefined" != typeof d) f(c, b("select"));
                else {
                    var g = {
                        exports: {}
                    };
                    f(g, e.select), e.clipboardAction = g.exports
                }
            }(this, function(a, b) {
                "use strict";

                function c(a) {
                    return a && a.__esModule ? a : {
                        "default": a
                    }
                }

                function d(a, b) {
                    if (!(a instanceof b)) throw new TypeError("Cannot call a class as a function")
                }
                var e = c(b),
                    f = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(a) {
                        return typeof a
                    } : function(a) {
                        return a && "function" == typeof Symbol && a.constructor === Symbol ? "symbol" : typeof a
                    },
                    g = function() {
                        function a(a, b) {
                            for (var c = 0; c < b.length; c++) {
                                var d = b[c];
                                d.enumerable = d.enumerable || !1, d.configurable = !0, "value" in d && (d.writable = !0), Object.defineProperty(a, d.key, d)
                            }
                        }
                        return function(b, c, d) {
                            return c && a(b.prototype, c), d && a(b, d), b
                        }
                    }(),
                    h = function() {
                        function a(b) {
                            d(this, a), this.resolveOptions(b), this.initSelection()
                        }
                        return a.prototype.resolveOptions = function() {
                            var a = arguments.length <= 0 || void 0 === arguments[0] ? {} : arguments[0];
                            this.action = a.action, this.emitter = a.emitter, this.target = a.target, this.text = a.text, this.trigger = a.trigger, this.selectedText = ""
                        }, a.prototype.initSelection = function() {
                            if (this.text && this.target) throw new Error('Multiple attributes declared, use either "target" or "text"');
                            if (this.text) this.selectFake();
                            else {
                                if (!this.target) throw new Error('Missing required attributes, use either "target" or "text"');
                                this.selectTarget()
                            }
                        }, a.prototype.selectFake = function() {
                            var a = this,
                                b = "rtl" == document.documentElement.getAttribute("dir");
                            this.removeFake(), this.fakeHandler = document.body.addEventListener("click", function() {
                                return a.removeFake()
                            }), this.fakeElem = document.createElement("textarea"), this.fakeElem.style.fontSize = "12pt", this.fakeElem.style.border = "0", this.fakeElem.style.padding = "0", this.fakeElem.style.margin = "0", this.fakeElem.style.position = "fixed", this.fakeElem.style[b ? "right" : "left"] = "-9999px", this.fakeElem.style.top = (window.pageYOffset || document.documentElement.scrollTop) + "px", this.fakeElem.setAttribute("readonly", ""), this.fakeElem.value = this.text, document.body.appendChild(this.fakeElem), this.selectedText = (0, e["default"])(this.fakeElem), this.copyText()
                        }, a.prototype.removeFake = function() {
                            this.fakeHandler && (document.body.removeEventListener("click"), this.fakeHandler = null), this.fakeElem && (document.body.removeChild(this.fakeElem), this.fakeElem = null)
                        }, a.prototype.selectTarget = function() {
                            this.selectedText = (0, e["default"])(this.target), this.copyText()
                        }, a.prototype.copyText = function() {
                            var a = void 0;
                            try {
                                a = document.execCommand(this.action)
                            } catch (b) {
                                a = !1
                            }
                            this.handleResult(a)
                        }, a.prototype.handleResult = function(a) {
                            a ? this.emitter.emit("success", {
                                action: this.action,
                                text: this.selectedText,
                                trigger: this.trigger,
                                clearSelection: this.clearSelection.bind(this)
                            }) : this.emitter.emit("error", {
                                action: this.action,
                                trigger: this.trigger,
                                clearSelection: this.clearSelection.bind(this)
                            })
                        }, a.prototype.clearSelection = function() {
                            this.target && this.target.blur(), window.getSelection().removeAllRanges()
                        }, a.prototype.destroy = function() {
                            this.removeFake()
                        }, g(a, [{
                            key: "action",
                            set: function() {
                                var a = arguments.length <= 0 || void 0 === arguments[0] ? "copy" : arguments[0];
                                if (this._action = a, "copy" !== this._action && "cut" !== this._action) throw new Error('Invalid "action" value, use either "copy" or "cut"')
                            },
                            get: function() {
                                return this._action
                            }
                        }, {
                            key: "target",
                            set: function(a) {
                                if (void 0 !== a) {
                                    if (!a || "object" !== ("undefined" == typeof a ? "undefined" : f(a)) || 1 !== a.nodeType) throw new Error('Invalid "target" value, use a valid Element');
                                    this._target = a
                                }
                            },
                            get: function() {
                                return this._target
                            }
                        }]), a
                    }();
                a.exports = h
            })
        }, {
            select: 6
        }],
        9: [function(b, c, d) {
            ! function(e, f) {
                if ("function" == typeof a && a.amd) a(["module", "./clipboard-action", "tiny-emitter", "good-listener"], f);
                else if ("undefined" != typeof d) f(c, b("./clipboard-action"), b("tiny-emitter"), b("good-listener"));
                else {
                    var g = {
                        exports: {}
                    };
                    f(g, e.clipboardAction, e.tinyEmitter, e.goodListener), e.clipboard = g.exports
                }
            }(this, function(a, b, c, d) {
                "use strict";

                function e(a) {
                    return a && a.__esModule ? a : {
                        "default": a
                    }
                }

                function f(a, b) {
                    if (!(a instanceof b)) throw new TypeError("Cannot call a class as a function")
                }

                function g(a, b) {
                    if (!a) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                    return !b || "object" != typeof b && "function" != typeof b ? a : b
                }

                function h(a, b) {
                    if ("function" != typeof b && null !== b) throw new TypeError("Super expression must either be null or a function, not " + typeof b);
                    a.prototype = Object.create(b && b.prototype, {
                        constructor: {
                            value: a,
                            enumerable: !1,
                            writable: !0,
                            configurable: !0
                        }
                    }), b && (Object.setPrototypeOf ? Object.setPrototypeOf(a, b) : a.__proto__ = b)
                }

                function i(a, b) {
                    var c = "data-clipboard-" + a;
                    if (b.hasAttribute(c)) return b.getAttribute(c)
                }
                var j = e(b),
                    k = e(c),
                    l = e(d),
                    m = function(a) {
                        function b(c, d) {
                            f(this, b);
                            var e = g(this, a.call(this));
                            return e.resolveOptions(d), e.listenClick(c), e
                        }
                        return h(b, a), b.prototype.resolveOptions = function() {
                            var a = arguments.length <= 0 || void 0 === arguments[0] ? {} : arguments[0];
                            this.action = "function" == typeof a.action ? a.action : this.defaultAction, this.target = "function" == typeof a.target ? a.target : this.defaultTarget, this.text = "function" == typeof a.text ? a.text : this.defaultText
                        }, b.prototype.listenClick = function(a) {
                            var b = this;
                            this.listener = (0, l["default"])(a, "click", function(a) {
                                return b.onClick(a)
                            })
                        }, b.prototype.onClick = function(a) {
                            var b = a.delegateTarget || a.currentTarget;
                            this.clipboardAction && (this.clipboardAction = null), this.clipboardAction = new j["default"]({
                                action: this.action(b),
                                target: this.target(b),
                                text: this.text(b),
                                trigger: b,
                                emitter: this
                            })
                        }, b.prototype.defaultAction = function(a) {
                            return i("action", a)
                        }, b.prototype.defaultTarget = function(a) {
                            var b = i("target", a);
                            return b ? document.querySelector(b) : void 0
                        }, b.prototype.defaultText = function(a) {
                            return i("text", a)
                        }, b.prototype.destroy = function() {
                            this.listener.destroy(), this.clipboardAction && (this.clipboardAction.destroy(), this.clipboardAction = null)
                        }, b
                    }(k["default"]);
                a.exports = m
            })
        }, {
            "./clipboard-action": 8,
            "good-listener": 4,
            "tiny-emitter": 7
        }]
    }, {}, [9])(9)
}), ! function(a, b) {
    "object" == typeof exports && "object" == typeof module ? module.exports = b() : "function" == typeof define && define.amd ? define([], b) : "object" == typeof exports ? exports.Handlebars = b() : a.Handlebars = b()
}(this, function() {
    return function(a) {
        function b(d) {
            if (c[d]) return c[d].exports;
            var e = c[d] = {
                exports: {},
                id: d,
                loaded: !1
            };
            return a[d].call(e.exports, e, e.exports, b), e.loaded = !0, e.exports
        }
        var c = {};
        return b.m = a, b.c = c, b.p = "", b(0)
    }([function(a, b, c) {
        "use strict";

        function d() {
            var a = new h.HandlebarsEnvironment;
            return n.extend(a, h), a.SafeString = j["default"], a.Exception = l["default"], a.Utils = n, a.escapeExpression = n.escapeExpression, a.VM = p, a.template = function(b) {
                return p.template(b, a)
            }, a
        }
        var e = c(1)["default"],
            f = c(2)["default"];
        b.__esModule = !0;
        var g = c(3),
            h = e(g),
            i = c(17),
            j = f(i),
            k = c(5),
            l = f(k),
            m = c(4),
            n = e(m),
            o = c(18),
            p = e(o),
            q = c(19),
            r = f(q),
            s = d();
        s.create = d, r["default"](s), s["default"] = s, b["default"] = s, a.exports = b["default"]
    }, function(a, b) {
        "use strict";
        b["default"] = function(a) {
            if (a && a.__esModule) return a;
            var b = {};
            if (null != a)
                for (var c in a) Object.prototype.hasOwnProperty.call(a, c) && (b[c] = a[c]);
            return b["default"] = a, b
        }, b.__esModule = !0
    }, function(a, b) {
        "use strict";
        b["default"] = function(a) {
            return a && a.__esModule ? a : {
                "default": a
            }
        }, b.__esModule = !0
    }, function(a, b, c) {
        "use strict";

        function d(a, b, c) {
            this.helpers = a || {}, this.partials = b || {}, this.decorators = c || {}, i.registerDefaultHelpers(this), j.registerDefaultDecorators(this)
        }
        var e = c(2)["default"];
        b.__esModule = !0, b.HandlebarsEnvironment = d;
        var f = c(4),
            g = c(5),
            h = e(g),
            i = c(6),
            j = c(14),
            k = c(16),
            l = e(k),
            m = "4.0.5";
        b.VERSION = m;
        var n = 7;
        b.COMPILER_REVISION = n;
        var o = {
            1: "<= 1.0.rc.2",
            2: "== 1.0.0-rc.3",
            3: "== 1.0.0-rc.4",
            4: "== 1.x.x",
            5: "== 2.0.0-alpha.x",
            6: ">= 2.0.0-beta.1",
            7: ">= 4.0.0"
        };
        b.REVISION_CHANGES = o;
        var p = "[object Object]";
        d.prototype = {
            constructor: d,
            logger: l["default"],
            log: l["default"].log,
            registerHelper: function(a, b) {
                if (f.toString.call(a) === p) {
                    if (b) throw new h["default"]("Arg not supported with multiple helpers");
                    f.extend(this.helpers, a)
                } else this.helpers[a] = b
            },
            unregisterHelper: function(a) {
                delete this.helpers[a]
            },
            registerPartial: function(a, b) {
                if (f.toString.call(a) === p) f.extend(this.partials, a);
                else {
                    if ("undefined" == typeof b) throw new h["default"]('Attempting to register a partial called "' + a + '" as undefined');
                    this.partials[a] = b
                }
            },
            unregisterPartial: function(a) {
                delete this.partials[a]
            },
            registerDecorator: function(a, b) {
                if (f.toString.call(a) === p) {
                    if (b) throw new h["default"]("Arg not supported with multiple decorators");
                    f.extend(this.decorators, a)
                } else this.decorators[a] = b
            },
            unregisterDecorator: function(a) {
                delete this.decorators[a]
            }
        };
        var q = l["default"].log;
        b.log = q, b.createFrame = f.createFrame, b.logger = l["default"]
    }, function(a, b) {
        "use strict";

        function c(a) {
            return k[a]
        }

        function d(a) {
            for (var b = 1; b < arguments.length; b++)
                for (var c in arguments[b]) Object.prototype.hasOwnProperty.call(arguments[b], c) && (a[c] = arguments[b][c]);
            return a
        }

        function e(a, b) {
            for (var c = 0, d = a.length; d > c; c++)
                if (a[c] === b) return c;
            return -1
        }

        function f(a) {
            if ("string" != typeof a) {
                if (a && a.toHTML) return a.toHTML();
                if (null == a) return "";
                if (!a) return a + "";
                a = "" + a
            }
            return m.test(a) ? a.replace(l, c) : a
        }

        function g(a) {
            return !a && 0 !== a || !(!p(a) || 0 !== a.length)
        }

        function h(a) {
            var b = d({}, a);
            return b._parent = a, b
        }

        function i(a, b) {
            return a.path = b, a
        }

        function j(a, b) {
            return (a ? a + "." : "") + b
        }
        b.__esModule = !0, b.extend = d, b.indexOf = e, b.escapeExpression = f, b.isEmpty = g, b.createFrame = h, b.blockParams = i, b.appendContextPath = j;
        var k = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#x27;",
                "`": "&#x60;",
                "=": "&#x3D;"
            },
            l = /[&<>"'`=]/g,
            m = /[&<>"'`=]/,
            n = Object.prototype.toString;
        b.toString = n;
        var o = function(a) {
            return "function" == typeof a
        };
        o(/x/) && (b.isFunction = o = function(a) {
            return "function" == typeof a && "[object Function]" === n.call(a)
        }), b.isFunction = o;
        var p = Array.isArray || function(a) {
            return !(!a || "object" != typeof a) && "[object Array]" === n.call(a)
        };
        b.isArray = p
    }, function(a, b) {
        "use strict";

        function c(a, b) {
            var e = b && b.loc,
                f = void 0,
                g = void 0;
            e && (f = e.start.line, g = e.start.column, a += " - " + f + ":" + g);
            for (var h = Error.prototype.constructor.call(this, a), i = 0; i < d.length; i++) this[d[i]] = h[d[i]];
            Error.captureStackTrace && Error.captureStackTrace(this, c), e && (this.lineNumber = f, this.column = g)
        }
        b.__esModule = !0;
        var d = ["description", "fileName", "lineNumber", "message", "name", "number", "stack"];
        c.prototype = new Error, b["default"] = c, a.exports = b["default"]
    }, function(a, b, c) {
        "use strict";

        function d(a) {
            g["default"](a), i["default"](a), k["default"](a), m["default"](a), o["default"](a), q["default"](a), s["default"](a)
        }
        var e = c(2)["default"];
        b.__esModule = !0, b.registerDefaultHelpers = d;
        var f = c(7),
            g = e(f),
            h = c(8),
            i = e(h),
            j = c(9),
            k = e(j),
            l = c(10),
            m = e(l),
            n = c(11),
            o = e(n),
            p = c(12),
            q = e(p),
            r = c(13),
            s = e(r)
    }, function(a, b, c) {
        "use strict";
        b.__esModule = !0;
        var d = c(4);
        b["default"] = function(a) {
            a.registerHelper("blockHelperMissing", function(b, c) {
                var e = c.inverse,
                    f = c.fn;
                if (b === !0) return f(this);
                if (b === !1 || null == b) return e(this);
                if (d.isArray(b)) return b.length > 0 ? (c.ids && (c.ids = [c.name]), a.helpers.each(b, c)) : e(this);
                if (c.data && c.ids) {
                    var g = d.createFrame(c.data);
                    g.contextPath = d.appendContextPath(c.data.contextPath, c.name), c = {
                        data: g
                    }
                }
                return f(b, c)
            })
        }, a.exports = b["default"]
    }, function(a, b, c) {
        "use strict";
        var d = c(2)["default"];
        b.__esModule = !0;
        var e = c(4),
            f = c(5),
            g = d(f);
        b["default"] = function(a) {
            a.registerHelper("each", function(a, b) {
                function c(b, c, f) {
                    j && (j.key = b, j.index = c, j.first = 0 === c, j.last = !!f, k && (j.contextPath = k + b)), i += d(a[b], {
                        data: j,
                        blockParams: e.blockParams([a[b], b], [k + b, null])
                    })
                }
                if (!b) throw new g["default"]("Must pass iterator to #each");
                var d = b.fn,
                    f = b.inverse,
                    h = 0,
                    i = "",
                    j = void 0,
                    k = void 0;
                if (b.data && b.ids && (k = e.appendContextPath(b.data.contextPath, b.ids[0]) + "."), e.isFunction(a) && (a = a.call(this)), b.data && (j = e.createFrame(b.data)), a && "object" == typeof a)
                    if (e.isArray(a))
                        for (var l = a.length; l > h; h++) h in a && c(h, h, h === a.length - 1);
                    else {
                        var m = void 0;
                        for (var n in a) a.hasOwnProperty(n) && (void 0 !== m && c(m, h - 1), m = n, h++);
                        void 0 !== m && c(m, h - 1, !0)
                    }
                return 0 === h && (i = f(this)), i
            })
        }, a.exports = b["default"]
    }, function(a, b, c) {
        "use strict";
        var d = c(2)["default"];
        b.__esModule = !0;
        var e = c(5),
            f = d(e);
        b["default"] = function(a) {
            a.registerHelper("helperMissing", function() {
                if (1 !== arguments.length) throw new f["default"]('Missing helper: "' + arguments[arguments.length - 1].name + '"')
            })
        }, a.exports = b["default"]
    }, function(a, b, c) {
        "use strict";
        b.__esModule = !0;
        var d = c(4);
        b["default"] = function(a) {
            a.registerHelper("if", function(a, b) {
                return d.isFunction(a) && (a = a.call(this)), !b.hash.includeZero && !a || d.isEmpty(a) ? b.inverse(this) : b.fn(this)
            }), a.registerHelper("unless", function(b, c) {
                return a.helpers["if"].call(this, b, {
                    fn: c.inverse,
                    inverse: c.fn,
                    hash: c.hash
                })
            })
        }, a.exports = b["default"]
    }, function(a, b) {
        "use strict";
        b.__esModule = !0, b["default"] = function(a) {
            a.registerHelper("log", function() {
                for (var b = [void 0], c = arguments[arguments.length - 1], d = 0; d < arguments.length - 1; d++) b.push(arguments[d]);
                var e = 1;
                null != c.hash.level ? e = c.hash.level : c.data && null != c.data.level && (e = c.data.level), b[0] = e, a.log.apply(a, b)
            })
        }, a.exports = b["default"]
    }, function(a, b) {
        "use strict";
        b.__esModule = !0, b["default"] = function(a) {
            a.registerHelper("lookup", function(a, b) {
                return a && a[b]
            })
        }, a.exports = b["default"]
    }, function(a, b, c) {
        "use strict";
        b.__esModule = !0;
        var d = c(4);
        b["default"] = function(a) {
            a.registerHelper("with", function(a, b) {
                d.isFunction(a) && (a = a.call(this));
                var c = b.fn;
                if (d.isEmpty(a)) return b.inverse(this);
                var e = b.data;
                return b.data && b.ids && (e = d.createFrame(b.data), e.contextPath = d.appendContextPath(b.data.contextPath, b.ids[0])), c(a, {
                    data: e,
                    blockParams: d.blockParams([a], [e && e.contextPath])
                })
            })
        }, a.exports = b["default"]
    }, function(a, b, c) {
        "use strict";

        function d(a) {
            g["default"](a)
        }
        var e = c(2)["default"];
        b.__esModule = !0, b.registerDefaultDecorators = d;
        var f = c(15),
            g = e(f)
    }, function(a, b, c) {
        "use strict";
        b.__esModule = !0;
        var d = c(4);
        b["default"] = function(a) {
            a.registerDecorator("inline", function(a, b, c, e) {
                var f = a;
                return b.partials || (b.partials = {}, f = function(e, f) {
                    var g = c.partials;
                    c.partials = d.extend({}, g, b.partials);
                    var h = a(e, f);
                    return c.partials = g, h
                }), b.partials[e.args[0]] = e.fn, f
            })
        }, a.exports = b["default"]
    }, function(a, b, c) {
        "use strict";
        b.__esModule = !0;
        var d = c(4),
            e = {
                methodMap: ["debug", "info", "warn", "error"],
                level: "info",
                lookupLevel: function(a) {
                    if ("string" == typeof a) {
                        var b = d.indexOf(e.methodMap, a.toLowerCase());
                        a = b >= 0 ? b : parseInt(a, 10)
                    }
                    return a
                },
                log: function(a) {
                    if (a = e.lookupLevel(a), "undefined" != typeof console && e.lookupLevel(e.level) <= a) {
                        var b = e.methodMap[a];
                        console[b] || (b = "log");
                        for (var c = arguments.length, d = Array(c > 1 ? c - 1 : 0), f = 1; c > f; f++) d[f - 1] = arguments[f];
                        console[b].apply(console, d)
                    }
                }
            };
        b["default"] = e, a.exports = b["default"]
    }, function(a, b) {
        "use strict";

        function c(a) {
            this.string = a
        }
        b.__esModule = !0, c.prototype.toString = c.prototype.toHTML = function() {
            return "" + this.string
        }, b["default"] = c, a.exports = b["default"]
    }, function(a, b, c) {
        "use strict";

        function d(a) {
            var b = a && a[0] || 1,
                c = r.COMPILER_REVISION;
            if (b !== c) {
                if (c > b) {
                    var d = r.REVISION_CHANGES[c],
                        e = r.REVISION_CHANGES[b];
                    throw new q["default"]("Template was precompiled with an older version of Handlebars than the current runtime. Please update your precompiler to a newer version (" + d + ") or downgrade your runtime to an older version (" + e + ").")
                }
                throw new q["default"]("Template was precompiled with a newer version of Handlebars than the current runtime. Please update your runtime to a newer version (" + a[1] + ").")
            }
        }

        function e(a, b) {
            function c(c, d, e) {
                e.hash && (d = o.extend({}, d, e.hash), e.ids && (e.ids[0] = !0)), c = b.VM.resolvePartial.call(this, c, d, e);
                var f = b.VM.invokePartial.call(this, c, d, e);
                if (null == f && b.compile && (e.partials[e.name] = b.compile(c, a.compilerOptions, b), f = e.partials[e.name](d, e)), null != f) {
                    if (e.indent) {
                        for (var g = f.split("\n"), h = 0, i = g.length; i > h && (g[h] || h + 1 !== i); h++) g[h] = e.indent + g[h];
                        f = g.join("\n")
                    }
                    return f
                }
                throw new q["default"]("The partial " + e.name + " could not be compiled when running in runtime-only mode")
            }

            function d(b) {
                function c(b) {
                    return "" + a.main(e, b, e.helpers, e.partials, g, i, h)
                }
                var f = arguments.length <= 1 || void 0 === arguments[1] ? {} : arguments[1],
                    g = f.data;
                d._setup(f), !f.partial && a.useData && (g = j(b, g));
                var h = void 0,
                    i = a.useBlockParams ? [] : void 0;
                return a.useDepths && (h = f.depths ? b !== f.depths[0] ? [b].concat(f.depths) : f.depths : [b]), (c = k(a.main, c, e, f.depths || [], g, i))(b, f)
            }
            if (!b) throw new q["default"]("No environment passed to template");
            if (!a || !a.main) throw new q["default"]("Unknown template object: " + typeof a);
            a.main.decorator = a.main_d, b.VM.checkRevision(a.compiler);
            var e = {
                strict: function(a, b) {
                    if (!(b in a)) throw new q["default"]('"' + b + '" not defined in ' + a);
                    return a[b]
                },
                lookup: function(a, b) {
                    for (var c = a.length, d = 0; c > d; d++)
                        if (a[d] && null != a[d][b]) return a[d][b]
                },
                lambda: function(a, b) {
                    return "function" == typeof a ? a.call(b) : a
                },
                escapeExpression: o.escapeExpression,
                invokePartial: c,
                fn: function(b) {
                    var c = a[b];
                    return c.decorator = a[b + "_d"], c
                },
                programs: [],
                program: function(a, b, c, d, e) {
                    var g = this.programs[a],
                        h = this.fn(a);
                    return b || e || d || c ? g = f(this, a, h, b, c, d, e) : g || (g = this.programs[a] = f(this, a, h)), g
                },
                data: function(a, b) {
                    for (; a && b--;) a = a._parent;
                    return a
                },
                merge: function(a, b) {
                    var c = a || b;
                    return a && b && a !== b && (c = o.extend({}, b, a)), c
                },
                noop: b.VM.noop,
                compilerInfo: a.compiler
            };
            return d.isTop = !0, d._setup = function(c) {
                c.partial ? (e.helpers = c.helpers, e.partials = c.partials, e.decorators = c.decorators) : (e.helpers = e.merge(c.helpers, b.helpers), a.usePartial && (e.partials = e.merge(c.partials, b.partials)), (a.usePartial || a.useDecorators) && (e.decorators = e.merge(c.decorators, b.decorators)))
            }, d._child = function(b, c, d, g) {
                if (a.useBlockParams && !d) throw new q["default"]("must pass block params");
                if (a.useDepths && !g) throw new q["default"]("must pass parent depths");
                return f(e, b, a[b], c, 0, d, g)
            }, d
        }

        function f(a, b, c, d, e, f, g) {
            function h(b) {
                var e = arguments.length <= 1 || void 0 === arguments[1] ? {} : arguments[1],
                    h = g;
                return g && b !== g[0] && (h = [b].concat(g)), c(a, b, a.helpers, a.partials, e.data || d, f && [e.blockParams].concat(f), h)
            }
            return h = k(c, h, a, g, d, f), h.program = b, h.depth = g ? g.length : 0, h.blockParams = e || 0, h
        }

        function g(a, b, c) {
            return a ? a.call || c.name || (c.name = a, a = c.partials[a]) : a = "@partial-block" === c.name ? c.data["partial-block"] : c.partials[c.name], a
        }

        function h(a, b, c) {
            c.partial = !0, c.ids && (c.data.contextPath = c.ids[0] || c.data.contextPath);
            var d = void 0;
            if (c.fn && c.fn !== i && (c.data = r.createFrame(c.data), d = c.data["partial-block"] = c.fn, d.partials && (c.partials = o.extend({}, c.partials, d.partials))), void 0 === a && d && (a = d), void 0 === a) throw new q["default"]("The partial " + c.name + " could not be found");
            return a instanceof Function ? a(b, c) : void 0
        }

        function i() {
            return ""
        }

        function j(a, b) {
            return b && "root" in b || (b = b ? r.createFrame(b) : {}, b.root = a), b
        }

        function k(a, b, c, d, e, f) {
            if (a.decorator) {
                var g = {};
                b = a.decorator(b, g, c, d && d[0], e, f, d), o.extend(b, g)
            }
            return b
        }
        var l = c(1)["default"],
            m = c(2)["default"];
        b.__esModule = !0, b.checkRevision = d, b.template = e, b.wrapProgram = f, b.resolvePartial = g, b.invokePartial = h, b.noop = i;
        var n = c(4),
            o = l(n),
            p = c(5),
            q = m(p),
            r = c(3)
    }, function(a, b) {
        (function(c) {
            "use strict";
            b.__esModule = !0, b["default"] = function(a) {
                var b = "undefined" != typeof c ? c : window,
                    d = b.Handlebars;
                a.noConflict = function() {
                    return b.Handlebars === a && (b.Handlebars = d), a
                }
            }, a.exports = b["default"]
        }).call(b, function() {
            return this
        }())
    }])
}), Handlebars.registerHelper("ifeq", function(a, b, c) {
        return a == b ? c.fn(this) : c.inverse(this)
    }), Handlebars.registerHelper("ifnoteq", function(a, b, c) {
        return a != b ? c.fn(this) : c.inverse(this)
    }), Handlebars.registerHelper("ifIsFolder", function(a) {
        return this.hasOwnProperty("item") ? a.fn(this) : a.inverse(this)
    }), Handlebars.registerHelper("generateRequestID", function(a) {
        var b = [];
        for (var c in a.hash) b.push(a.hash[c]);
        return new Handlebars.SafeString(b.join("_").replace(/\s+/g, ""))
    }), Handlebars.registerHelper("sanitise_snippet", function(a, b) {
        var c = b;
        return "cURL" === a ? (c = c.replace(/\\n|\\r/g, "\n"), c = c.replace(/\\t/g, "    ")) : b
    }), Handlebars.registerHelper("ifempty", function(a, b) {
        return _.isEmpty(a) ? b.fn(this) : b.inverse(this)
    }), Handlebars.registerHelper("ifnotempty", function(a, b) {
        return _.isEmpty(a) ? b.inverse(this) : b.fn(this)
    }), Handlebars.registerHelper("get", function(a, b, c) {
        return _.get(a, b)
    }), Handlebars.registerHelper("hasRequestBody", function(a, b) {
        return !a || _.isEmpty(a) ? b.inverse(this) : _.isPlainObject(a) ? a.mode ? a.mode && (_.isPlainObject(a.mode) && _.isEmpty(a[a.mode]) || !a[a.mode]) ? b.inverse(this) : b.fn(this) : b.inverse(this) : b.fn(this)
    }), Handlebars.registerHelper("checkrequestauth", function(a, b) {
        return _.isEmpty(a) || "noauth" === a.type ? b.inverse(this) : b.fn(this)
    }), Handlebars.registerHelper("checkQueryParam", function(a, b) {
        return a ? b.inverse(this) : b.fn(this)
    }), ! function(a, b) {
        "use strict";
        "object" == typeof module && "object" == typeof module.exports ? module.exports = a.document ? b(a, !0) : function(a) {
            if (!a.document) throw new Error("jQuery requires a window with a document");
            return b(a)
        } : b(a)
    }("undefined" != typeof window ? window : this, function(a, b) {
        "use strict";

        function c(a, b, c) {
            var d, e = (b = b || ga).createElement("script");
            if (e.text = a, c)
                for (d in ua) c[d] && (e[d] = c[d]);
            b.head.appendChild(e).parentNode.removeChild(e)
        }

        function d(a) {
            return null == a ? a + "" : "object" == typeof a || "function" == typeof a ? ma[na.call(a)] || "object" : typeof a
        }

        function e(a) {
            var b = !!a && "length" in a && a.length,
                c = d(a);
            return !sa(a) && !ta(a) && ("array" === c || 0 === b || "number" == typeof b && b > 0 && b - 1 in a)
        }

        function f(a, b) {
            return a.nodeName && a.nodeName.toLowerCase() === b.toLowerCase()
        }

        function g(a, b, c) {
            return sa(b) ? va.grep(a, function(a, d) {
                return !!b.call(a, d, a) !== c
            }) : b.nodeType ? va.grep(a, function(a) {
                return a === b !== c
            }) : "string" != typeof b ? va.grep(a, function(a) {
                return la.call(b, a) > -1 !== c
            }) : va.filter(b, a, c)
        }

        function h(a, b) {
            for (;
                (a = a[b]) && 1 !== a.nodeType;);
            return a
        }

        function i(a) {
            var b = {};
            return va.each(a.match(Ga) || [], function(a, c) {
                b[c] = !0
            }), b
        }

        function j(a) {
            return a
        }

        function k(a) {
            throw a
        }

        function l(a, b, c, d) {
            var e;
            try {
                a && sa(e = a.promise) ? e.call(a).done(b).fail(c) : a && sa(e = a.then) ? e.call(a, b, c) : b.apply(void 0, [a].slice(d))
            } catch (a) {
                c.apply(void 0, [a])
            }
        }

        function m() {
            ga.removeEventListener("DOMContentLoaded", m), a.removeEventListener("load", m), va.ready()
        }

        function n(a, b) {
            return b.toUpperCase()
        }

        function o(a) {
            return a.replace(Ka, "ms-").replace(La, n)
        }

        function p() {
            this.expando = va.expando + p.uid++
        }

        function q(a) {
            return "true" === a || "false" !== a && ("null" === a ? null : a === +a + "" ? +a : Pa.test(a) ? JSON.parse(a) : a)
        }

        function r(a, b, c) {
            var d;
            if (void 0 === c && 1 === a.nodeType)
                if (d = "data-" + b.replace(Qa, "-$&").toLowerCase(), "string" == typeof(c = a.getAttribute(d))) {
                    try {
                        c = q(c)
                    } catch (a) {}
                    Oa.set(a, b, c)
                } else c = void 0;
            return c
        }

        function s(a, b, c, d) {
            var e, f, g = 20,
                h = d ? function() {
                    return d.cur()
                } : function() {
                    return va.css(a, b, "")
                },
                i = h(),
                j = c && c[3] || (va.cssNumber[b] ? "" : "px"),
                k = (va.cssNumber[b] || "px" !== j && +i) && Sa.exec(va.css(a, b));
            if (k && k[3] !== j) {
                for (i /= 2, j = j || k[3], k = +i || 1; g--;) va.style(a, b, k + j), (1 - f) * (1 - (f = h() / i || .5)) <= 0 && (g = 0), k /= f;
                k *= 2, va.style(a, b, k + j), c = c || []
            }
            return c && (k = +k || +i || 0, e = c[1] ? k + (c[1] + 1) * c[2] : +c[2], d && (d.unit = j, d.start = k, d.end = e)), e
        }

        function t(a) {
            var b, c = a.ownerDocument,
                d = a.nodeName,
                e = Wa[d];
            return e || (b = c.body.appendChild(c.createElement(d)), e = va.css(b, "display"), b.parentNode.removeChild(b), "none" === e && (e = "block"), Wa[d] = e, e)
        }

        function u(a, b) {
            for (var c, d, e = [], f = 0, g = a.length; f < g; f++)(d = a[f]).style && (c = d.style.display, b ? ("none" === c && (e[f] = Na.get(d, "display") || null, e[f] || (d.style.display = "")), "" === d.style.display && Ua(d) && (e[f] = t(d))) : "none" !== c && (e[f] = "none", Na.set(d, "display", c)));
            for (f = 0; f < g; f++) null != e[f] && (a[f].style.display = e[f]);
            return a
        }

        function v(a, b) {
            var c;
            return c = "undefined" != typeof a.getElementsByTagName ? a.getElementsByTagName(b || "*") : "undefined" != typeof a.querySelectorAll ? a.querySelectorAll(b || "*") : [], void 0 === b || b && f(a, b) ? va.merge([a], c) : c
        }

        function w(a, b) {
            for (var c = 0, d = a.length; c < d; c++) Na.set(a[c], "globalEval", !b || Na.get(b[c], "globalEval"))
        }

        function x(a, b, c, e, f) {
            for (var g, h, i, j, k, l, m = b.createDocumentFragment(), n = [], o = 0, p = a.length; o < p; o++)
                if ((g = a[o]) || 0 === g)
                    if ("object" === d(g)) va.merge(n, g.nodeType ? [g] : g);
                    else if (_a.test(g)) {
                for (h = h || m.appendChild(b.createElement("div")), i = (Ya.exec(g) || ["", ""])[1].toLowerCase(), j = $a[i] || $a._default, h.innerHTML = j[1] + va.htmlPrefilter(g) + j[2], l = j[0]; l--;) h = h.lastChild;
                va.merge(n, h.childNodes), (h = m.firstChild).textContent = ""
            } else n.push(b.createTextNode(g));
            for (m.textContent = "", o = 0; g = n[o++];)
                if (e && va.inArray(g, e) > -1) f && f.push(g);
                else if (k = va.contains(g.ownerDocument, g), h = v(m.appendChild(g), "script"), k && w(h), c)
                for (l = 0; g = h[l++];) Za.test(g.type || "") && c.push(g);
            return m
        }

        function y() {
            return !0
        }

        function z() {
            return !1
        }

        function A() {
            try {
                return ga.activeElement
            } catch (a) {}
        }

        function B(a, b, c, d, e, f) {
            var g, h;
            if ("object" == typeof b) {
                "string" != typeof c && (d = d || c, c = void 0);
                for (h in b) B(a, h, c, d, b[h], f);
                return a
            }
            if (null == d && null == e ? (e = c, d = c = void 0) : null == e && ("string" == typeof c ? (e = d, d = void 0) : (e = d, d = c, c = void 0)), !1 === e) e = z;
            else if (!e) return a;
            return 1 === f && (g = e, (e = function(a) {
                return va().off(a), g.apply(this, arguments)
            }).guid = g.guid || (g.guid = va.guid++)), a.each(function() {
                va.event.add(this, b, e, d, c)
            })
        }

        function C(a, b) {
            return f(a, "table") && f(11 !== b.nodeType ? b : b.firstChild, "tr") ? va(a).children("tbody")[0] || a : a
        }

        function D(a) {
            return a.type = (null !== a.getAttribute("type")) + "/" + a.type, a
        }

        function E(a) {
            return "true/" === (a.type || "").slice(0, 5) ? a.type = a.type.slice(5) : a.removeAttribute("type"), a
        }

        function F(a, b) {
            var c, d, e, f, g, h, i, j;
            if (1 === b.nodeType) {
                if (Na.hasData(a) && (f = Na.access(a), g = Na.set(b, f), j = f.events)) {
                    delete g.handle, g.events = {};
                    for (e in j)
                        for (c = 0, d = j[e].length; c < d; c++) va.event.add(b, e, j[e][c])
                }
                Oa.hasData(a) && (h = Oa.access(a), i = va.extend({}, h), Oa.set(b, i))
            }
        }

        function G(a, b) {
            var c = b.nodeName.toLowerCase();
            "input" === c && Xa.test(a.type) ? b.checked = a.checked : "input" !== c && "textarea" !== c || (b.defaultValue = a.defaultValue)
        }

        function H(a, b, d, e) {
            b = ja.apply([], b);
            var f, g, h, i, j, k, l = 0,
                m = a.length,
                n = m - 1,
                o = b[0],
                p = sa(o);
            if (p || m > 1 && "string" == typeof o && !ra.checkClone && gb.test(o)) return a.each(function(c) {
                var f = a.eq(c);
                p && (b[0] = o.call(this, c, f.html())), H(f, b, d, e)
            });
            if (m && (f = x(b, a[0].ownerDocument, !1, a, e), g = f.firstChild, 1 === f.childNodes.length && (f = g), g || e)) {
                for (i = (h = va.map(v(f, "script"), D)).length; l < m; l++) j = f, l !== n && (j = va.clone(j, !0, !0), i && va.merge(h, v(j, "script"))), d.call(a[l], j, l);
                if (i)
                    for (k = h[h.length - 1].ownerDocument, va.map(h, E), l = 0; l < i; l++) j = h[l], Za.test(j.type || "") && !Na.access(j, "globalEval") && va.contains(k, j) && (j.src && "module" !== (j.type || "").toLowerCase() ? va._evalUrl && va._evalUrl(j.src) : c(j.textContent.replace(hb, ""), k, j))
            }
            return a
        }

        function I(a, b, c) {
            for (var d, e = b ? va.filter(b, a) : a, f = 0; null != (d = e[f]); f++) c || 1 !== d.nodeType || va.cleanData(v(d)), d.parentNode && (c && va.contains(d.ownerDocument, d) && w(v(d, "script")), d.parentNode.removeChild(d));
            return a
        }

        function J(a, b, c) {
            var d, e, f, g, h = a.style;
            return (c = c || jb(a)) && ("" !== (g = c.getPropertyValue(b) || c[b]) || va.contains(a.ownerDocument, a) || (g = va.style(a, b)), !ra.pixelBoxStyles() && ib.test(g) && kb.test(b) && (d = h.width, e = h.minWidth, f = h.maxWidth, h.minWidth = h.maxWidth = h.width = g, g = c.width, h.width = d, h.minWidth = e, h.maxWidth = f)), void 0 !== g ? g + "" : g
        }

        function K(a, b) {
            return {
                get: function() {
                    return a() ? void delete this.get : (this.get = b).apply(this, arguments)
                }
            }
        }

        function L(a) {
            if (a in qb) return a;
            for (var b = a[0].toUpperCase() + a.slice(1), c = pb.length; c--;)
                if ((a = pb[c] + b) in qb) return a
        }

        function M(a) {
            var b = va.cssProps[a];
            return b || (b = va.cssProps[a] = L(a) || a), b
        }

        function N(a, b, c) {
            var d = Sa.exec(b);
            return d ? Math.max(0, d[2] - (c || 0)) + (d[3] || "px") : b
        }

        function O(a, b, c, d, e, f) {
            var g = "width" === b ? 1 : 0,
                h = 0,
                i = 0;
            if (c === (d ? "border" : "content")) return 0;
            for (; g < 4; g += 2) "margin" === c && (i += va.css(a, c + Ta[g], !0, e)), d ? ("content" === c && (i -= va.css(a, "padding" + Ta[g], !0, e)), "margin" !== c && (i -= va.css(a, "border" + Ta[g] + "Width", !0, e))) : (i += va.css(a, "padding" + Ta[g], !0, e), "padding" !== c ? i += va.css(a, "border" + Ta[g] + "Width", !0, e) : h += va.css(a, "border" + Ta[g] + "Width", !0, e));
            return !d && f >= 0 && (i += Math.max(0, Math.ceil(a["offset" + b[0].toUpperCase() + b.slice(1)] - f - i - h - .5))), i
        }

        function P(a, b, c) {
            var d = jb(a),
                e = J(a, b, d),
                f = "border-box" === va.css(a, "boxSizing", !1, d),
                g = f;
            if (ib.test(e)) {
                if (!c) return e;
                e = "auto"
            }
            return g = g && (ra.boxSizingReliable() || e === a.style[b]), ("auto" === e || !parseFloat(e) && "inline" === va.css(a, "display", !1, d)) && (e = a["offset" + b[0].toUpperCase() + b.slice(1)], g = !0), (e = parseFloat(e) || 0) + O(a, b, c || (f ? "border" : "content"), g, d, e) + "px"
        }

        function Q(a, b, c, d, e) {
            return new Q.prototype.init(a, b, c, d, e)
        }

        function R() {
            sb && (!1 === ga.hidden && a.requestAnimationFrame ? a.requestAnimationFrame(R) : a.setTimeout(R, va.fx.interval), va.fx.tick())
        }

        function S() {
            return a.setTimeout(function() {
                rb = void 0
            }), rb = Date.now()
        }

        function T(a, b) {
            var c, d = 0,
                e = {
                    height: a
                };
            for (b = b ? 1 : 0; d < 4; d += 2 - b) e["margin" + (c = Ta[d])] = e["padding" + c] = a;
            return b && (e.opacity = e.width = a), e
        }

        function U(a, b, c) {
            for (var d, e = (X.tweeners[b] || []).concat(X.tweeners["*"]), f = 0, g = e.length; f < g; f++)
                if (d = e[f].call(c, b, a)) return d
        }

        function V(a, b, c) {
            var d, e, f, g, h, i, j, k, l = "width" in b || "height" in b,
                m = this,
                n = {},
                o = a.style,
                p = a.nodeType && Ua(a),
                q = Na.get(a, "fxshow");
            c.queue || (null == (g = va._queueHooks(a, "fx")).unqueued && (g.unqueued = 0, h = g.empty.fire, g.empty.fire = function() {
                g.unqueued || h()
            }), g.unqueued++, m.always(function() {
                m.always(function() {
                    g.unqueued--, va.queue(a, "fx").length || g.empty.fire()
                })
            }));
            for (d in b)
                if (e = b[d], tb.test(e)) {
                    if (delete b[d], f = f || "toggle" === e, e === (p ? "hide" : "show")) {
                        if ("show" !== e || !q || void 0 === q[d]) continue;
                        p = !0
                    }
                    n[d] = q && q[d] || va.style(a, d)
                }
            if ((i = !va.isEmptyObject(b)) || !va.isEmptyObject(n)) {
                l && 1 === a.nodeType && (c.overflow = [o.overflow, o.overflowX, o.overflowY], null == (j = q && q.display) && (j = Na.get(a, "display")), "none" === (k = va.css(a, "display")) && (j ? k = j : (u([a], !0), j = a.style.display || j, k = va.css(a, "display"), u([a]))), ("inline" === k || "inline-block" === k && null != j) && "none" === va.css(a, "float") && (i || (m.done(function() {
                    o.display = j
                }), null == j && (k = o.display, j = "none" === k ? "" : k)), o.display = "inline-block")), c.overflow && (o.overflow = "hidden", m.always(function() {
                    o.overflow = c.overflow[0], o.overflowX = c.overflow[1], o.overflowY = c.overflow[2]
                })), i = !1;
                for (d in n) i || (q ? "hidden" in q && (p = q.hidden) : q = Na.access(a, "fxshow", {
                    display: j
                }), f && (q.hidden = !p), p && u([a], !0), m.done(function() {
                    p || u([a]), Na.remove(a, "fxshow");
                    for (d in n) va.style(a, d, n[d])
                })), i = U(p ? q[d] : 0, d, m), d in q || (q[d] = i.start, p && (i.end = i.start, i.start = 0))
            }
        }

        function W(a, b) {
            var c, d, e, f, g;
            for (c in a)
                if (d = o(c), e = b[d], f = a[c], Array.isArray(f) && (e = f[1], f = a[c] = f[0]), c !== d && (a[d] = f, delete a[c]), (g = va.cssHooks[d]) && "expand" in g) {
                    f = g.expand(f), delete a[d];
                    for (c in f) c in a || (a[c] = f[c], b[c] = e)
                } else b[d] = e
        }

        function X(a, b, c) {
            var d, e, f = 0,
                g = X.prefilters.length,
                h = va.Deferred().always(function() {
                    delete i.elem
                }),
                i = function() {
                    if (e) return !1;
                    for (var b = rb || S(), c = Math.max(0, j.startTime + j.duration - b), d = 1 - (c / j.duration || 0), f = 0, g = j.tweens.length; f < g; f++) j.tweens[f].run(d);
                    return h.notifyWith(a, [j, d, c]), d < 1 && g ? c : (g || h.notifyWith(a, [j, 1, 0]), h.resolveWith(a, [j]), !1)
                },
                j = h.promise({
                    elem: a,
                    props: va.extend({}, b),
                    opts: va.extend(!0, {
                        specialEasing: {},
                        easing: va.easing._default
                    }, c),
                    originalProperties: b,
                    originalOptions: c,
                    startTime: rb || S(),
                    duration: c.duration,
                    tweens: [],
                    createTween: function(b, c) {
                        var d = va.Tween(a, j.opts, b, c, j.opts.specialEasing[b] || j.opts.easing);
                        return j.tweens.push(d), d
                    },
                    stop: function(b) {
                        var c = 0,
                            d = b ? j.tweens.length : 0;
                        if (e) return this;
                        for (e = !0; c < d; c++) j.tweens[c].run(1);
                        return b ? (h.notifyWith(a, [j, 1, 0]), h.resolveWith(a, [j, b])) : h.rejectWith(a, [j, b]), this
                    }
                }),
                k = j.props;
            for (W(k, j.opts.specialEasing); f < g; f++)
                if (d = X.prefilters[f].call(j, a, k, j.opts)) return sa(d.stop) && (va._queueHooks(j.elem, j.opts.queue).stop = d.stop.bind(d)), d;
            return va.map(k, U, j), sa(j.opts.start) && j.opts.start.call(a, j), j.progress(j.opts.progress).done(j.opts.done, j.opts.complete).fail(j.opts.fail).always(j.opts.always), va.fx.timer(va.extend(i, {
                elem: a,
                anim: j,
                queue: j.opts.queue
            })), j
        }

        function Y(a) {
            return (a.match(Ga) || []).join(" ")
        }

        function Z(a) {
            return a.getAttribute && a.getAttribute("class") || ""
        }

        function $(a) {
            return Array.isArray(a) ? a : "string" == typeof a ? a.match(Ga) || [] : []
        }

        function _(a, b, c, e) {
            var f;
            if (Array.isArray(b)) va.each(b, function(b, d) {
                c || Fb.test(a) ? e(a, d) : _(a + "[" + ("object" == typeof d && null != d ? b : "") + "]", d, c, e)
            });
            else if (c || "object" !== d(b)) e(a, b);
            else
                for (f in b) _(a + "[" + f + "]", b[f], c, e)
        }

        function aa(a) {
            return function(b, c) {
                "string" != typeof b && (c = b, b = "*");
                var d, e = 0,
                    f = b.toLowerCase().match(Ga) || [];
                if (sa(c))
                    for (; d = f[e++];) "+" === d[0] ? (d = d.slice(1) || "*", (a[d] = a[d] || []).unshift(c)) : (a[d] = a[d] || []).push(c)
            }
        }

        function ba(a, b, c, d) {
            function e(h) {
                var i;
                return f[h] = !0, va.each(a[h] || [], function(a, h) {
                    var j = h(b, c, d);
                    return "string" != typeof j || g || f[j] ? g ? !(i = j) : void 0 : (b.dataTypes.unshift(j), e(j), !1)
                }), i
            }
            var f = {},
                g = a === Rb;
            return e(b.dataTypes[0]) || !f["*"] && e("*")
        }

        function ca(a, b) {
            var c, d, e = va.ajaxSettings.flatOptions || {};
            for (c in b) void 0 !== b[c] && ((e[c] ? a : d || (d = {}))[c] = b[c]);
            return d && va.extend(!0, a, d), a
        }

        function da(a, b, c) {
            for (var d, e, f, g, h = a.contents, i = a.dataTypes;
                "*" === i[0];) i.shift(), void 0 === d && (d = a.mimeType || b.getResponseHeader("Content-Type"));
            if (d)
                for (e in h)
                    if (h[e] && h[e].test(d)) {
                        i.unshift(e);
                        break
                    }
            if (i[0] in c) f = i[0];
            else {
                for (e in c) {
                    if (!i[0] || a.converters[e + " " + i[0]]) {
                        f = e;
                        break
                    }
                    g || (g = e)
                }
                f = f || g
            }
            if (f) return f !== i[0] && i.unshift(f), c[f]
        }

        function ea(a, b, c, d) {
            var e, f, g, h, i, j = {},
                k = a.dataTypes.slice();
            if (k[1])
                for (g in a.converters) j[g.toLowerCase()] = a.converters[g];
            for (f = k.shift(); f;)
                if (a.responseFields[f] && (c[a.responseFields[f]] = b), !i && d && a.dataFilter && (b = a.dataFilter(b, a.dataType)), i = f, f = k.shift())
                    if ("*" === f) f = i;
                    else if ("*" !== i && i !== f) {
                if (!(g = j[i + " " + f] || j["* " + f]))
                    for (e in j)
                        if ((h = e.split(" "))[1] === f && (g = j[i + " " + h[0]] || j["* " + h[0]])) {
                            !0 === g ? g = j[e] : !0 !== j[e] && (f = h[0], k.unshift(h[1]));
                            break
                        }
                if (!0 !== g)
                    if (g && a["throws"]) b = g(b);
                    else try {
                        b = g(b)
                    } catch (a) {
                        return {
                            state: "parsererror",
                            error: g ? a : "No conversion from " + i + " to " + f
                        }
                    }
            }
            return {
                state: "success",
                data: b
            }
        }
        var fa = [],
            ga = a.document,
            ha = Object.getPrototypeOf,
            ia = fa.slice,
            ja = fa.concat,
            ka = fa.push,
            la = fa.indexOf,
            ma = {},
            na = ma.toString,
            oa = ma.hasOwnProperty,
            pa = oa.toString,
            qa = pa.call(Object),
            ra = {},
            sa = function(a) {
                return "function" == typeof a && "number" != typeof a.nodeType
            },
            ta = function(a) {
                return null != a && a === a.window
            },
            ua = {
                type: !0,
                src: !0,
                noModule: !0
            },
            va = function(a, b) {
                return new va.fn.init(a, b)
            },
            wa = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
        va.fn = va.prototype = {
            jquery: "3.3.1",
            constructor: va,
            length: 0,
            toArray: function() {
                return ia.call(this)
            },
            get: function(a) {
                return null == a ? ia.call(this) : a < 0 ? this[a + this.length] : this[a]
            },
            pushStack: function(a) {
                var b = va.merge(this.constructor(), a);
                return b.prevObject = this, b
            },
            each: function(a) {
                return va.each(this, a)
            },
            map: function(a) {
                return this.pushStack(va.map(this, function(b, c) {
                    return a.call(b, c, b)
                }))
            },
            slice: function() {
                return this.pushStack(ia.apply(this, arguments))
            },
            first: function() {
                return this.eq(0)
            },
            last: function() {
                return this.eq(-1)
            },
            eq: function(a) {
                var b = this.length,
                    c = +a + (a < 0 ? b : 0);
                return this.pushStack(c >= 0 && c < b ? [this[c]] : [])
            },
            end: function() {
                return this.prevObject || this.constructor()
            },
            push: ka,
            sort: fa.sort,
            splice: fa.splice
        }, va.extend = va.fn.extend = function() {
            var a, b, c, d, e, f, g = arguments[0] || {},
                h = 1,
                i = arguments.length,
                j = !1;
            for ("boolean" == typeof g && (j = g, g = arguments[h] || {}, h++), "object" == typeof g || sa(g) || (g = {}), h === i && (g = this, h--); h < i; h++)
                if (null != (a = arguments[h]))
                    for (b in a) c = g[b], g !== (d = a[b]) && (j && d && (va.isPlainObject(d) || (e = Array.isArray(d))) ? (e ? (e = !1, f = c && Array.isArray(c) ? c : []) : f = c && va.isPlainObject(c) ? c : {}, g[b] = va.extend(j, f, d)) : void 0 !== d && (g[b] = d));
            return g
        }, va.extend({
            expando: "jQuery" + ("3.3.1" + Math.random()).replace(/\D/g, ""),
            isReady: !0,
            error: function(a) {
                throw new Error(a)
            },
            noop: function() {},
            isPlainObject: function(a) {
                var b, c;
                return !(!a || "[object Object]" !== na.call(a) || (b = ha(a)) && ("function" != typeof(c = oa.call(b, "constructor") && b.constructor) || pa.call(c) !== qa))
            },
            isEmptyObject: function(a) {
                var b;
                for (b in a) return !1;
                return !0
            },
            globalEval: function(a) {
                c(a)
            },
            each: function(a, b) {
                var c, d = 0;
                if (e(a))
                    for (c = a.length; d < c && !1 !== b.call(a[d], d, a[d]); d++);
                else
                    for (d in a)
                        if (!1 === b.call(a[d], d, a[d])) break; return a
            },
            trim: function(a) {
                return null == a ? "" : (a + "").replace(wa, "")
            },
            makeArray: function(a, b) {
                var c = b || [];
                return null != a && (e(Object(a)) ? va.merge(c, "string" == typeof a ? [a] : a) : ka.call(c, a)), c
            },
            inArray: function(a, b, c) {
                return null == b ? -1 : la.call(b, a, c)
            },
            merge: function(a, b) {
                for (var c = +b.length, d = 0, e = a.length; d < c; d++) a[e++] = b[d];
                return a.length = e, a
            },
            grep: function(a, b, c) {
                for (var d, e = [], f = 0, g = a.length, h = !c; f < g; f++)(d = !b(a[f], f)) !== h && e.push(a[f]);
                return e
            },
            map: function(a, b, c) {
                var d, f, g = 0,
                    h = [];
                if (e(a))
                    for (d = a.length; g < d; g++) null != (f = b(a[g], g, c)) && h.push(f);
                else
                    for (g in a) null != (f = b(a[g], g, c)) && h.push(f);
                return ja.apply([], h)
            },
            guid: 1,
            support: ra
        }), "function" == typeof Symbol && (va.fn[Symbol.iterator] = fa[Symbol.iterator]), va.each("Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "), function(a, b) {
            ma["[object " + b + "]"] = b.toLowerCase()
        });
        var xa = function(a) {
            function b(a, b, c, d) {
                var e, f, g, h, i, j, k, m = b && b.ownerDocument,
                    o = b ? b.nodeType : 9;
                if (c = c || [], "string" != typeof a || !a || 1 !== o && 9 !== o && 11 !== o) return c;
                if (!d && ((b ? b.ownerDocument || b : P) !== H && G(b), b = b || H, J)) {
                    if (11 !== o && (i = ra.exec(a)))
                        if (e = i[1]) {
                            if (9 === o) {
                                if (!(g = b.getElementById(e))) return c;
                                if (g.id === e) return c.push(g), c
                            } else if (m && (g = m.getElementById(e)) && N(b, g) && g.id === e) return c.push(g), c
                        } else {
                            if (i[2]) return $.apply(c, b.getElementsByTagName(a)), c;
                            if ((e = i[3]) && w.getElementsByClassName && b.getElementsByClassName) return $.apply(c, b.getElementsByClassName(e)), c
                        }
                    if (w.qsa && !U[a + " "] && (!K || !K.test(a))) {
                        if (1 !== o) m = b, k = a;
                        else if ("object" !== b.nodeName.toLowerCase()) {
                            for ((h = b.getAttribute("id")) ? h = h.replace(va, wa) : b.setAttribute("id", h = O), f = (j = A(a)).length; f--;) j[f] = "#" + h + " " + n(j[f]);
                            k = j.join(","), m = sa.test(a) && l(b.parentNode) || b
                        }
                        if (k) try {
                            return $.apply(c, m.querySelectorAll(k)), c
                        } catch (a) {} finally {
                            h === O && b.removeAttribute("id")
                        }
                    }
                }
                return C(a.replace(ha, "$1"), b, c, d)
            }

            function c() {
                function a(c, d) {
                    return b.push(c + " ") > x.cacheLength && delete a[b.shift()], a[c + " "] = d
                }
                var b = [];
                return a
            }

            function d(a) {
                return a[O] = !0, a
            }

            function e(a) {
                var b = H.createElement("fieldset");
                try {
                    return !!a(b)
                } catch (a) {
                    return !1
                } finally {
                    b.parentNode && b.parentNode.removeChild(b), b = null
                }
            }

            function f(a, b) {
                for (var c = a.split("|"), d = c.length; d--;) x.attrHandle[c[d]] = b
            }

            function g(a, b) {
                var c = b && a,
                    d = c && 1 === a.nodeType && 1 === b.nodeType && a.sourceIndex - b.sourceIndex;
                if (d) return d;
                if (c)
                    for (; c = c.nextSibling;)
                        if (c === b) return -1;
                return a ? 1 : -1
            }

            function h(a) {
                return function(b) {
                    return "input" === b.nodeName.toLowerCase() && b.type === a
                }
            }

            function i(a) {
                return function(b) {
                    var c = b.nodeName.toLowerCase();
                    return ("input" === c || "button" === c) && b.type === a
                }
            }

            function j(a) {
                return function(b) {
                    return "form" in b ? b.parentNode && !1 === b.disabled ? "label" in b ? "label" in b.parentNode ? b.parentNode.disabled === a : b.disabled === a : b.isDisabled === a || b.isDisabled !== !a && ya(b) === a : b.disabled === a : "label" in b && b.disabled === a
                }
            }

            function k(a) {
                return d(function(b) {
                    return b = +b, d(function(c, d) {
                        for (var e, f = a([], c.length, b), g = f.length; g--;) c[e = f[g]] && (c[e] = !(d[e] = c[e]))
                    })
                })
            }

            function l(a) {
                return a && "undefined" != typeof a.getElementsByTagName && a
            }

            function m() {}

            function n(a) {
                for (var b = 0, c = a.length, d = ""; b < c; b++) d += a[b].value;
                return d
            }

            function o(a, b, c) {
                var d = b.dir,
                    e = b.next,
                    f = e || d,
                    g = c && "parentNode" === f,
                    h = R++;
                return b.first ? function(b, c, e) {
                    for (; b = b[d];)
                        if (1 === b.nodeType || g) return a(b, c, e);
                    return !1
                } : function(b, c, i) {
                    var j, k, l, m = [Q, h];
                    if (i) {
                        for (; b = b[d];)
                            if ((1 === b.nodeType || g) && a(b, c, i)) return !0
                    } else
                        for (; b = b[d];)
                            if (1 === b.nodeType || g)
                                if (l = b[O] || (b[O] = {}), k = l[b.uniqueID] || (l[b.uniqueID] = {}), e && e === b.nodeName.toLowerCase()) b = b[d] || b;
                                else {
                                    if ((j = k[f]) && j[0] === Q && j[1] === h) return m[2] = j[2];
                                    if (k[f] = m, m[2] = a(b, c, i)) return !0
                                } return !1
                }
            }

            function p(a) {
                return a.length > 1 ? function(b, c, d) {
                    for (var e = a.length; e--;)
                        if (!a[e](b, c, d)) return !1;
                    return !0
                } : a[0]
            }

            function q(a, c, d) {
                for (var e = 0, f = c.length; e < f; e++) b(a, c[e], d);
                return d
            }

            function r(a, b, c, d, e) {
                for (var f, g = [], h = 0, i = a.length, j = null != b; h < i; h++)(f = a[h]) && (c && !c(f, d, e) || (g.push(f), j && b.push(h)));
                return g
            }

            function s(a, b, c, e, f, g) {
                return e && !e[O] && (e = s(e)), f && !f[O] && (f = s(f, g)), d(function(d, g, h, i) {
                    var j, k, l, m = [],
                        n = [],
                        o = g.length,
                        p = d || q(b || "*", h.nodeType ? [h] : h, []),
                        s = !a || !d && b ? p : r(p, m, a, h, i),
                        t = c ? f || (d ? a : o || e) ? [] : g : s;
                    if (c && c(s, t, h, i), e)
                        for (j = r(t, n), e(j, [], h, i), k = j.length; k--;)(l = j[k]) && (t[n[k]] = !(s[n[k]] = l));
                    if (d) {
                        if (f || a) {
                            if (f) {
                                for (j = [], k = t.length; k--;)(l = t[k]) && j.push(s[k] = l);
                                f(null, t = [], j, i)
                            }
                            for (k = t.length; k--;)(l = t[k]) && (j = f ? aa(d, l) : m[k]) > -1 && (d[j] = !(g[j] = l))
                        }
                    } else t = r(t === g ? t.splice(o, t.length) : t), f ? f(null, g, t, i) : $.apply(g, t)
                })
            }

            function t(a) {
                for (var b, c, d, e = a.length, f = x.relative[a[0].type], g = f || x.relative[" "], h = f ? 1 : 0, i = o(function(a) {
                        return a === b
                    }, g, !0), j = o(function(a) {
                        return aa(b, a) > -1
                    }, g, !0), k = [function(a, c, d) {
                        var e = !f && (d || c !== D) || ((b = c).nodeType ? i(a, c, d) : j(a, c, d));
                        return b = null, e
                    }]; h < e; h++)
                    if (c = x.relative[a[h].type]) k = [o(p(k), c)];
                    else {
                        if ((c = x.filter[a[h].type].apply(null, a[h].matches))[O]) {
                            for (d = ++h; d < e && !x.relative[a[d].type]; d++);
                            return s(h > 1 && p(k), h > 1 && n(a.slice(0, h - 1).concat({
                                value: " " === a[h - 2].type ? "*" : ""
                            })).replace(ha, "$1"), c, h < d && t(a.slice(h, d)), d < e && t(a = a.slice(d)), d < e && n(a))
                        }
                        k.push(c)
                    }
                return p(k)
            }

            function u(a, c) {
                var e = c.length > 0,
                    f = a.length > 0,
                    g = function(d, g, h, i, j) {
                        var k, l, m, n = 0,
                            o = "0",
                            p = d && [],
                            q = [],
                            s = D,
                            t = d || f && x.find.TAG("*", j),
                            u = Q += null == s ? 1 : Math.random() || .1,
                            v = t.length;
                        for (j && (D = g === H || g || j); o !== v && null != (k = t[o]); o++) {
                            if (f && k) {
                                for (l = 0, g || k.ownerDocument === H || (G(k), h = !J); m = a[l++];)
                                    if (m(k, g || H, h)) {
                                        i.push(k);
                                        break
                                    }
                                j && (Q = u)
                            }
                            e && ((k = !m && k) && n--, d && p.push(k))
                        }
                        if (n += o, e && o !== n) {
                            for (l = 0; m = c[l++];) m(p, q, g, h);
                            if (d) {
                                if (n > 0)
                                    for (; o--;) p[o] || q[o] || (q[o] = Y.call(i));
                                q = r(q)
                            }
                            $.apply(i, q), j && !d && q.length > 0 && n + c.length > 1 && b.uniqueSort(i)
                        }
                        return j && (Q = u, D = s), p
                    };
                return e ? d(g) : g
            }
            var v, w, x, y, z, A, B, C, D, E, F, G, H, I, J, K, L, M, N, O = "sizzle" + 1 * new Date,
                P = a.document,
                Q = 0,
                R = 0,
                S = c(),
                T = c(),
                U = c(),
                V = function(a, b) {
                    return a === b && (F = !0), 0
                },
                W = {}.hasOwnProperty,
                X = [],
                Y = X.pop,
                Z = X.push,
                $ = X.push,
                _ = X.slice,
                aa = function(a, b) {
                    for (var c = 0, d = a.length; c < d; c++)
                        if (a[c] === b) return c;
                    return -1
                },
                ba = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",
                ca = "[\\x20\\t\\r\\n\\f]",
                da = "(?:\\\\.|[\\w-]|[^\0-\\xa0])+",
                ea = "\\[" + ca + "*(" + da + ")(?:" + ca + "*([*^$|!~]?=)" + ca + "*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + da + "))|)" + ca + "*\\]",
                fa = ":(" + da + ")(?:\\((('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|((?:\\\\.|[^\\\\()[\\]]|" + ea + ")*)|.*)\\)|)",
                ga = new RegExp(ca + "+", "g"),
                ha = new RegExp("^" + ca + "+|((?:^|[^\\\\])(?:\\\\.)*)" + ca + "+$", "g"),
                ia = new RegExp("^" + ca + "*," + ca + "*"),
                ja = new RegExp("^" + ca + "*([>+~]|" + ca + ")" + ca + "*"),
                ka = new RegExp("=" + ca + "*([^\\]'\"]*?)" + ca + "*\\]", "g"),
                la = new RegExp(fa),
                ma = new RegExp("^" + da + "$"),
                na = {
                    ID: new RegExp("^#(" + da + ")"),
                    CLASS: new RegExp("^\\.(" + da + ")"),
                    TAG: new RegExp("^(" + da + "|[*])"),
                    ATTR: new RegExp("^" + ea),
                    PSEUDO: new RegExp("^" + fa),
                    CHILD: new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + ca + "*(even|odd|(([+-]|)(\\d*)n|)" + ca + "*(?:([+-]|)" + ca + "*(\\d+)|))" + ca + "*\\)|)", "i"),
                    bool: new RegExp("^(?:" + ba + ")$", "i"),
                    needsContext: new RegExp("^" + ca + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + ca + "*((?:-\\d)?\\d*)" + ca + "*\\)|)(?=[^-]|$)", "i")
                },
                oa = /^(?:input|select|textarea|button)$/i,
                pa = /^h\d$/i,
                qa = /^[^{]+\{\s*\[native \w/,
                ra = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,
                sa = /[+~]/,
                ta = new RegExp("\\\\([\\da-f]{1,6}" + ca + "?|(" + ca + ")|.)", "ig"),
                ua = function(a, b, c) {
                    var d = "0x" + b - 65536;
                    return d !== d || c ? b : d < 0 ? String.fromCharCode(d + 65536) : String.fromCharCode(d >> 10 | 55296, 1023 & d | 56320)
                },
                va = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\0-\x1f\x7f-\uFFFF\w-]/g,
                wa = function(a, b) {
                    return b ? "\0" === a ? "�" : a.slice(0, -1) + "\\" + a.charCodeAt(a.length - 1).toString(16) + " " : "\\" + a
                },
                xa = function() {
                    G()
                },
                ya = o(function(a) {
                    return !0 === a.disabled && ("form" in a || "label" in a)
                }, {
                    dir: "parentNode",
                    next: "legend"
                });
            try {
                $.apply(X = _.call(P.childNodes), P.childNodes), X[P.childNodes.length].nodeType
            } catch (a) {
                $ = {
                    apply: X.length ? function(a, b) {
                        Z.apply(a, _.call(b))
                    } : function(a, b) {
                        for (var c = a.length, d = 0; a[c++] = b[d++];);
                        a.length = c - 1
                    }
                }
            }
            w = b.support = {}, z = b.isXML = function(a) {
                var b = a && (a.ownerDocument || a).documentElement;
                return !!b && "HTML" !== b.nodeName
            }, G = b.setDocument = function(a) {
                var b, c, d = a ? a.ownerDocument || a : P;
                return d !== H && 9 === d.nodeType && d.documentElement ? (H = d, I = H.documentElement, J = !z(H), P !== H && (c = H.defaultView) && c.top !== c && (c.addEventListener ? c.addEventListener("unload", xa, !1) : c.attachEvent && c.attachEvent("onunload", xa)), w.attributes = e(function(a) {
                    return a.className = "i", !a.getAttribute("className")
                }), w.getElementsByTagName = e(function(a) {
                    return a.appendChild(H.createComment("")), !a.getElementsByTagName("*").length
                }), w.getElementsByClassName = qa.test(H.getElementsByClassName), w.getById = e(function(a) {
                    return I.appendChild(a).id = O, !H.getElementsByName || !H.getElementsByName(O).length
                }), w.getById ? (x.filter.ID = function(a) {
                    var b = a.replace(ta, ua);
                    return function(a) {
                        return a.getAttribute("id") === b
                    }
                }, x.find.ID = function(a, b) {
                    if ("undefined" != typeof b.getElementById && J) {
                        var c = b.getElementById(a);
                        return c ? [c] : []
                    }
                }) : (x.filter.ID = function(a) {
                    var b = a.replace(ta, ua);
                    return function(a) {
                        var c = "undefined" != typeof a.getAttributeNode && a.getAttributeNode("id");
                        return c && c.value === b
                    }
                }, x.find.ID = function(a, b) {
                    if ("undefined" != typeof b.getElementById && J) {
                        var c, d, e, f = b.getElementById(a);
                        if (f) {
                            if ((c = f.getAttributeNode("id")) && c.value === a) return [f];
                            for (e = b.getElementsByName(a), d = 0; f = e[d++];)
                                if ((c = f.getAttributeNode("id")) && c.value === a) return [f]
                        }
                        return []
                    }
                }), x.find.TAG = w.getElementsByTagName ? function(a, b) {
                    return "undefined" != typeof b.getElementsByTagName ? b.getElementsByTagName(a) : w.qsa ? b.querySelectorAll(a) : void 0
                } : function(a, b) {
                    var c, d = [],
                        e = 0,
                        f = b.getElementsByTagName(a);
                    if ("*" === a) {
                        for (; c = f[e++];) 1 === c.nodeType && d.push(c);
                        return d
                    }
                    return f
                }, x.find.CLASS = w.getElementsByClassName && function(a, b) {
                    if ("undefined" != typeof b.getElementsByClassName && J) return b.getElementsByClassName(a)
                }, L = [], K = [], (w.qsa = qa.test(H.querySelectorAll)) && (e(function(a) {
                    I.appendChild(a).innerHTML = "<a id='" + O + "'></a><select id='" + O + "-\r\\' msallowcapture=''><option selected=''></option></select>", a.querySelectorAll("[msallowcapture^='']").length && K.push("[*^$]=" + ca + "*(?:''|\"\")"), a.querySelectorAll("[selected]").length || K.push("\\[" + ca + "*(?:value|" + ba + ")"), a.querySelectorAll("[id~=" + O + "-]").length || K.push("~="), a.querySelectorAll(":checked").length || K.push(":checked"), a.querySelectorAll("a#" + O + "+*").length || K.push(".#.+[+~]")
                }), e(function(a) {
                    a.innerHTML = "<a href='' disabled='disabled'></a><select disabled='disabled'><option/></select>";
                    var b = H.createElement("input");
                    b.setAttribute("type", "hidden"), a.appendChild(b).setAttribute("name", "D"), a.querySelectorAll("[name=d]").length && K.push("name" + ca + "*[*^$|!~]?="),
                        2 !== a.querySelectorAll(":enabled").length && K.push(":enabled", ":disabled"), I.appendChild(a).disabled = !0, 2 !== a.querySelectorAll(":disabled").length && K.push(":enabled", ":disabled"), a.querySelectorAll("*,:x"), K.push(",.*:")
                })), (w.matchesSelector = qa.test(M = I.matches || I.webkitMatchesSelector || I.mozMatchesSelector || I.oMatchesSelector || I.msMatchesSelector)) && e(function(a) {
                    w.disconnectedMatch = M.call(a, "*"), M.call(a, "[s!='']:x"), L.push("!=", fa)
                }), K = K.length && new RegExp(K.join("|")), L = L.length && new RegExp(L.join("|")), b = qa.test(I.compareDocumentPosition), N = b || qa.test(I.contains) ? function(a, b) {
                    var c = 9 === a.nodeType ? a.documentElement : a,
                        d = b && b.parentNode;
                    return a === d || !(!d || 1 !== d.nodeType || !(c.contains ? c.contains(d) : a.compareDocumentPosition && 16 & a.compareDocumentPosition(d)))
                } : function(a, b) {
                    if (b)
                        for (; b = b.parentNode;)
                            if (b === a) return !0;
                    return !1
                }, V = b ? function(a, b) {
                    if (a === b) return F = !0, 0;
                    var c = !a.compareDocumentPosition - !b.compareDocumentPosition;
                    return c || (1 & (c = (a.ownerDocument || a) === (b.ownerDocument || b) ? a.compareDocumentPosition(b) : 1) || !w.sortDetached && b.compareDocumentPosition(a) === c ? a === H || a.ownerDocument === P && N(P, a) ? -1 : b === H || b.ownerDocument === P && N(P, b) ? 1 : E ? aa(E, a) - aa(E, b) : 0 : 4 & c ? -1 : 1)
                } : function(a, b) {
                    if (a === b) return F = !0, 0;
                    var c, d = 0,
                        e = a.parentNode,
                        f = b.parentNode,
                        h = [a],
                        i = [b];
                    if (!e || !f) return a === H ? -1 : b === H ? 1 : e ? -1 : f ? 1 : E ? aa(E, a) - aa(E, b) : 0;
                    if (e === f) return g(a, b);
                    for (c = a; c = c.parentNode;) h.unshift(c);
                    for (c = b; c = c.parentNode;) i.unshift(c);
                    for (; h[d] === i[d];) d++;
                    return d ? g(h[d], i[d]) : h[d] === P ? -1 : i[d] === P ? 1 : 0
                }, H) : H
            }, b.matches = function(a, c) {
                return b(a, null, null, c)
            }, b.matchesSelector = function(a, c) {
                if ((a.ownerDocument || a) !== H && G(a), c = c.replace(ka, "='$1']"), w.matchesSelector && J && !U[c + " "] && (!L || !L.test(c)) && (!K || !K.test(c))) try {
                    var d = M.call(a, c);
                    if (d || w.disconnectedMatch || a.document && 11 !== a.document.nodeType) return d
                } catch (a) {}
                return b(c, H, null, [a]).length > 0
            }, b.contains = function(a, b) {
                return (a.ownerDocument || a) !== H && G(a), N(a, b)
            }, b.attr = function(a, b) {
                (a.ownerDocument || a) !== H && G(a);
                var c = x.attrHandle[b.toLowerCase()],
                    d = c && W.call(x.attrHandle, b.toLowerCase()) ? c(a, b, !J) : void 0;
                return void 0 !== d ? d : w.attributes || !J ? a.getAttribute(b) : (d = a.getAttributeNode(b)) && d.specified ? d.value : null
            }, b.escape = function(a) {
                return (a + "").replace(va, wa)
            }, b.error = function(a) {
                throw new Error("Syntax error, unrecognized expression: " + a)
            }, b.uniqueSort = function(a) {
                var b, c = [],
                    d = 0,
                    e = 0;
                if (F = !w.detectDuplicates, E = !w.sortStable && a.slice(0), a.sort(V), F) {
                    for (; b = a[e++];) b === a[e] && (d = c.push(e));
                    for (; d--;) a.splice(c[d], 1)
                }
                return E = null, a
            }, y = b.getText = function(a) {
                var b, c = "",
                    d = 0,
                    e = a.nodeType;
                if (e) {
                    if (1 === e || 9 === e || 11 === e) {
                        if ("string" == typeof a.textContent) return a.textContent;
                        for (a = a.firstChild; a; a = a.nextSibling) c += y(a)
                    } else if (3 === e || 4 === e) return a.nodeValue
                } else
                    for (; b = a[d++];) c += y(b);
                return c
            }, (x = b.selectors = {
                cacheLength: 50,
                createPseudo: d,
                match: na,
                attrHandle: {},
                find: {},
                relative: {
                    ">": {
                        dir: "parentNode",
                        first: !0
                    },
                    " ": {
                        dir: "parentNode"
                    },
                    "+": {
                        dir: "previousSibling",
                        first: !0
                    },
                    "~": {
                        dir: "previousSibling"
                    }
                },
                preFilter: {
                    ATTR: function(a) {
                        return a[1] = a[1].replace(ta, ua), a[3] = (a[3] || a[4] || a[5] || "").replace(ta, ua), "~=" === a[2] && (a[3] = " " + a[3] + " "), a.slice(0, 4)
                    },
                    CHILD: function(a) {
                        return a[1] = a[1].toLowerCase(), "nth" === a[1].slice(0, 3) ? (a[3] || b.error(a[0]), a[4] = +(a[4] ? a[5] + (a[6] || 1) : 2 * ("even" === a[3] || "odd" === a[3])), a[5] = +(a[7] + a[8] || "odd" === a[3])) : a[3] && b.error(a[0]), a
                    },
                    PSEUDO: function(a) {
                        var b, c = !a[6] && a[2];
                        return na.CHILD.test(a[0]) ? null : (a[3] ? a[2] = a[4] || a[5] || "" : c && la.test(c) && (b = A(c, !0)) && (b = c.indexOf(")", c.length - b) - c.length) && (a[0] = a[0].slice(0, b), a[2] = c.slice(0, b)), a.slice(0, 3))
                    }
                },
                filter: {
                    TAG: function(a) {
                        var b = a.replace(ta, ua).toLowerCase();
                        return "*" === a ? function() {
                            return !0
                        } : function(a) {
                            return a.nodeName && a.nodeName.toLowerCase() === b
                        }
                    },
                    CLASS: function(a) {
                        var b = S[a + " "];
                        return b || (b = new RegExp("(^|" + ca + ")" + a + "(" + ca + "|$)")) && S(a, function(a) {
                            return b.test("string" == typeof a.className && a.className || "undefined" != typeof a.getAttribute && a.getAttribute("class") || "")
                        })
                    },
                    ATTR: function(a, c, d) {
                        return function(e) {
                            var f = b.attr(e, a);
                            return null == f ? "!=" === c : !c || (f += "", "=" === c ? f === d : "!=" === c ? f !== d : "^=" === c ? d && 0 === f.indexOf(d) : "*=" === c ? d && f.indexOf(d) > -1 : "$=" === c ? d && f.slice(-d.length) === d : "~=" === c ? (" " + f.replace(ga, " ") + " ").indexOf(d) > -1 : "|=" === c && (f === d || f.slice(0, d.length + 1) === d + "-"))
                        }
                    },
                    CHILD: function(a, b, c, d, e) {
                        var f = "nth" !== a.slice(0, 3),
                            g = "last" !== a.slice(-4),
                            h = "of-type" === b;
                        return 1 === d && 0 === e ? function(a) {
                            return !!a.parentNode
                        } : function(b, c, i) {
                            var j, k, l, m, n, o, p = f !== g ? "nextSibling" : "previousSibling",
                                q = b.parentNode,
                                r = h && b.nodeName.toLowerCase(),
                                s = !i && !h,
                                t = !1;
                            if (q) {
                                if (f) {
                                    for (; p;) {
                                        for (m = b; m = m[p];)
                                            if (h ? m.nodeName.toLowerCase() === r : 1 === m.nodeType) return !1;
                                        o = p = "only" === a && !o && "nextSibling"
                                    }
                                    return !0
                                }
                                if (o = [g ? q.firstChild : q.lastChild], g && s) {
                                    for (t = (n = (j = (k = (l = (m = q)[O] || (m[O] = {}))[m.uniqueID] || (l[m.uniqueID] = {}))[a] || [])[0] === Q && j[1]) && j[2], m = n && q.childNodes[n]; m = ++n && m && m[p] || (t = n = 0) || o.pop();)
                                        if (1 === m.nodeType && ++t && m === b) {
                                            k[a] = [Q, n, t];
                                            break
                                        }
                                } else if (s && (t = n = (j = (k = (l = (m = b)[O] || (m[O] = {}))[m.uniqueID] || (l[m.uniqueID] = {}))[a] || [])[0] === Q && j[1]), !1 === t)
                                    for (;
                                        (m = ++n && m && m[p] || (t = n = 0) || o.pop()) && ((h ? m.nodeName.toLowerCase() !== r : 1 !== m.nodeType) || !++t || (s && ((k = (l = m[O] || (m[O] = {}))[m.uniqueID] || (l[m.uniqueID] = {}))[a] = [Q, t]), m !== b)););
                                return (t -= e) === d || t % d == 0 && t / d >= 0
                            }
                        }
                    },
                    PSEUDO: function(a, c) {
                        var e, f = x.pseudos[a] || x.setFilters[a.toLowerCase()] || b.error("unsupported pseudo: " + a);
                        return f[O] ? f(c) : f.length > 1 ? (e = [a, a, "", c], x.setFilters.hasOwnProperty(a.toLowerCase()) ? d(function(a, b) {
                            for (var d, e = f(a, c), g = e.length; g--;) a[d = aa(a, e[g])] = !(b[d] = e[g])
                        }) : function(a) {
                            return f(a, 0, e)
                        }) : f
                    }
                },
                pseudos: {
                    not: d(function(a) {
                        var b = [],
                            c = [],
                            e = B(a.replace(ha, "$1"));
                        return e[O] ? d(function(a, b, c, d) {
                            for (var f, g = e(a, null, d, []), h = a.length; h--;)(f = g[h]) && (a[h] = !(b[h] = f))
                        }) : function(a, d, f) {
                            return b[0] = a, e(b, null, f, c), b[0] = null, !c.pop()
                        }
                    }),
                    has: d(function(a) {
                        return function(c) {
                            return b(a, c).length > 0
                        }
                    }),
                    contains: d(function(a) {
                        return a = a.replace(ta, ua),
                            function(b) {
                                return (b.textContent || b.innerText || y(b)).indexOf(a) > -1
                            }
                    }),
                    lang: d(function(a) {
                        return ma.test(a || "") || b.error("unsupported lang: " + a), a = a.replace(ta, ua).toLowerCase(),
                            function(b) {
                                var c;
                                do
                                    if (c = J ? b.lang : b.getAttribute("xml:lang") || b.getAttribute("lang")) return (c = c.toLowerCase()) === a || 0 === c.indexOf(a + "-");
                                while ((b = b.parentNode) && 1 === b.nodeType);
                                return !1
                            }
                    }),
                    target: function(b) {
                        var c = a.location && a.location.hash;
                        return c && c.slice(1) === b.id
                    },
                    root: function(a) {
                        return a === I
                    },
                    focus: function(a) {
                        return a === H.activeElement && (!H.hasFocus || H.hasFocus()) && !!(a.type || a.href || ~a.tabIndex)
                    },
                    enabled: j(!1),
                    disabled: j(!0),
                    checked: function(a) {
                        var b = a.nodeName.toLowerCase();
                        return "input" === b && !!a.checked || "option" === b && !!a.selected
                    },
                    selected: function(a) {
                        return a.parentNode && a.parentNode.selectedIndex, !0 === a.selected
                    },
                    empty: function(a) {
                        for (a = a.firstChild; a; a = a.nextSibling)
                            if (a.nodeType < 6) return !1;
                        return !0
                    },
                    parent: function(a) {
                        return !x.pseudos.empty(a)
                    },
                    header: function(a) {
                        return pa.test(a.nodeName)
                    },
                    input: function(a) {
                        return oa.test(a.nodeName)
                    },
                    button: function(a) {
                        var b = a.nodeName.toLowerCase();
                        return "input" === b && "button" === a.type || "button" === b
                    },
                    text: function(a) {
                        var b;
                        return "input" === a.nodeName.toLowerCase() && "text" === a.type && (null == (b = a.getAttribute("type")) || "text" === b.toLowerCase())
                    },
                    first: k(function() {
                        return [0]
                    }),
                    last: k(function(a, b) {
                        return [b - 1]
                    }),
                    eq: k(function(a, b, c) {
                        return [c < 0 ? c + b : c]
                    }),
                    even: k(function(a, b) {
                        for (var c = 0; c < b; c += 2) a.push(c);
                        return a
                    }),
                    odd: k(function(a, b) {
                        for (var c = 1; c < b; c += 2) a.push(c);
                        return a
                    }),
                    lt: k(function(a, b, c) {
                        for (var d = c < 0 ? c + b : c; --d >= 0;) a.push(d);
                        return a
                    }),
                    gt: k(function(a, b, c) {
                        for (var d = c < 0 ? c + b : c; ++d < b;) a.push(d);
                        return a
                    })
                }
            }).pseudos.nth = x.pseudos.eq;
            for (v in {
                    radio: !0,
                    checkbox: !0,
                    file: !0,
                    password: !0,
                    image: !0
                }) x.pseudos[v] = h(v);
            for (v in {
                    submit: !0,
                    reset: !0
                }) x.pseudos[v] = i(v);
            return m.prototype = x.filters = x.pseudos, x.setFilters = new m, A = b.tokenize = function(a, c) {
                var d, e, f, g, h, i, j, k = T[a + " "];
                if (k) return c ? 0 : k.slice(0);
                for (h = a, i = [], j = x.preFilter; h;) {
                    d && !(e = ia.exec(h)) || (e && (h = h.slice(e[0].length) || h), i.push(f = [])), d = !1, (e = ja.exec(h)) && (d = e.shift(), f.push({
                        value: d,
                        type: e[0].replace(ha, " ")
                    }), h = h.slice(d.length));
                    for (g in x.filter) !(e = na[g].exec(h)) || j[g] && !(e = j[g](e)) || (d = e.shift(), f.push({
                        value: d,
                        type: g,
                        matches: e
                    }), h = h.slice(d.length));
                    if (!d) break
                }
                return c ? h.length : h ? b.error(a) : T(a, i).slice(0)
            }, B = b.compile = function(a, b) {
                var c, d = [],
                    e = [],
                    f = U[a + " "];
                if (!f) {
                    for (b || (b = A(a)), c = b.length; c--;)(f = t(b[c]))[O] ? d.push(f) : e.push(f);
                    (f = U(a, u(e, d))).selector = a
                }
                return f
            }, C = b.select = function(a, b, c, d) {
                var e, f, g, h, i, j = "function" == typeof a && a,
                    k = !d && A(a = j.selector || a);
                if (c = c || [], 1 === k.length) {
                    if ((f = k[0] = k[0].slice(0)).length > 2 && "ID" === (g = f[0]).type && 9 === b.nodeType && J && x.relative[f[1].type]) {
                        if (!(b = (x.find.ID(g.matches[0].replace(ta, ua), b) || [])[0])) return c;
                        j && (b = b.parentNode), a = a.slice(f.shift().value.length)
                    }
                    for (e = na.needsContext.test(a) ? 0 : f.length; e-- && (g = f[e], !x.relative[h = g.type]);)
                        if ((i = x.find[h]) && (d = i(g.matches[0].replace(ta, ua), sa.test(f[0].type) && l(b.parentNode) || b))) {
                            if (f.splice(e, 1), !(a = d.length && n(f))) return $.apply(c, d), c;
                            break
                        }
                }
                return (j || B(a, k))(d, b, !J, c, !b || sa.test(a) && l(b.parentNode) || b), c
            }, w.sortStable = O.split("").sort(V).join("") === O, w.detectDuplicates = !!F, G(), w.sortDetached = e(function(a) {
                return 1 & a.compareDocumentPosition(H.createElement("fieldset"))
            }), e(function(a) {
                return a.innerHTML = "<a href='#'></a>", "#" === a.firstChild.getAttribute("href")
            }) || f("type|href|height|width", function(a, b, c) {
                if (!c) return a.getAttribute(b, "type" === b.toLowerCase() ? 1 : 2)
            }), w.attributes && e(function(a) {
                return a.innerHTML = "<input/>", a.firstChild.setAttribute("value", ""), "" === a.firstChild.getAttribute("value")
            }) || f("value", function(a, b, c) {
                if (!c && "input" === a.nodeName.toLowerCase()) return a.defaultValue
            }), e(function(a) {
                return null == a.getAttribute("disabled")
            }) || f(ba, function(a, b, c) {
                var d;
                if (!c) return !0 === a[b] ? b.toLowerCase() : (d = a.getAttributeNode(b)) && d.specified ? d.value : null
            }), b
        }(a);
        va.find = xa, va.expr = xa.selectors, va.expr[":"] = va.expr.pseudos, va.uniqueSort = va.unique = xa.uniqueSort, va.text = xa.getText, va.isXMLDoc = xa.isXML, va.contains = xa.contains, va.escapeSelector = xa.escape;
        var ya = function(a, b, c) {
                for (var d = [], e = void 0 !== c;
                    (a = a[b]) && 9 !== a.nodeType;)
                    if (1 === a.nodeType) {
                        if (e && va(a).is(c)) break;
                        d.push(a)
                    }
                return d
            },
            za = function(a, b) {
                for (var c = []; a; a = a.nextSibling) 1 === a.nodeType && a !== b && c.push(a);
                return c
            },
            Aa = va.expr.match.needsContext,
            Ba = /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i;
        va.filter = function(a, b, c) {
            var d = b[0];
            return c && (a = ":not(" + a + ")"), 1 === b.length && 1 === d.nodeType ? va.find.matchesSelector(d, a) ? [d] : [] : va.find.matches(a, va.grep(b, function(a) {
                return 1 === a.nodeType
            }))
        }, va.fn.extend({
            find: function(a) {
                var b, c, d = this.length,
                    e = this;
                if ("string" != typeof a) return this.pushStack(va(a).filter(function() {
                    for (b = 0; b < d; b++)
                        if (va.contains(e[b], this)) return !0
                }));
                for (c = this.pushStack([]), b = 0; b < d; b++) va.find(a, e[b], c);
                return d > 1 ? va.uniqueSort(c) : c
            },
            filter: function(a) {
                return this.pushStack(g(this, a || [], !1))
            },
            not: function(a) {
                return this.pushStack(g(this, a || [], !0))
            },
            is: function(a) {
                return !!g(this, "string" == typeof a && Aa.test(a) ? va(a) : a || [], !1).length
            }
        });
        var Ca, Da = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/;
        (va.fn.init = function(a, b, c) {
            var d, e;
            if (!a) return this;
            if (c = c || Ca, "string" == typeof a) {
                if (!(d = "<" === a[0] && ">" === a[a.length - 1] && a.length >= 3 ? [null, a, null] : Da.exec(a)) || !d[1] && b) return !b || b.jquery ? (b || c).find(a) : this.constructor(b).find(a);
                if (d[1]) {
                    if (b = b instanceof va ? b[0] : b, va.merge(this, va.parseHTML(d[1], b && b.nodeType ? b.ownerDocument || b : ga, !0)), Ba.test(d[1]) && va.isPlainObject(b))
                        for (d in b) sa(this[d]) ? this[d](b[d]) : this.attr(d, b[d]);
                    return this
                }
                return (e = ga.getElementById(d[2])) && (this[0] = e, this.length = 1), this
            }
            return a.nodeType ? (this[0] = a, this.length = 1, this) : sa(a) ? void 0 !== c.ready ? c.ready(a) : a(va) : va.makeArray(a, this)
        }).prototype = va.fn, Ca = va(ga);
        var Ea = /^(?:parents|prev(?:Until|All))/,
            Fa = {
                children: !0,
                contents: !0,
                next: !0,
                prev: !0
            };
        va.fn.extend({
            has: function(a) {
                var b = va(a, this),
                    c = b.length;
                return this.filter(function() {
                    for (var a = 0; a < c; a++)
                        if (va.contains(this, b[a])) return !0
                })
            },
            closest: function(a, b) {
                var c, d = 0,
                    e = this.length,
                    f = [],
                    g = "string" != typeof a && va(a);
                if (!Aa.test(a))
                    for (; d < e; d++)
                        for (c = this[d]; c && c !== b; c = c.parentNode)
                            if (c.nodeType < 11 && (g ? g.index(c) > -1 : 1 === c.nodeType && va.find.matchesSelector(c, a))) {
                                f.push(c);
                                break
                            }
                return this.pushStack(f.length > 1 ? va.uniqueSort(f) : f)
            },
            index: function(a) {
                return a ? "string" == typeof a ? la.call(va(a), this[0]) : la.call(this, a.jquery ? a[0] : a) : this[0] && this[0].parentNode ? this.first().prevAll().length : -1
            },
            add: function(a, b) {
                return this.pushStack(va.uniqueSort(va.merge(this.get(), va(a, b))))
            },
            addBack: function(a) {
                return this.add(null == a ? this.prevObject : this.prevObject.filter(a))
            }
        }), va.each({
            parent: function(a) {
                var b = a.parentNode;
                return b && 11 !== b.nodeType ? b : null
            },
            parents: function(a) {
                return ya(a, "parentNode")
            },
            parentsUntil: function(a, b, c) {
                return ya(a, "parentNode", c)
            },
            next: function(a) {
                return h(a, "nextSibling")
            },
            prev: function(a) {
                return h(a, "previousSibling")
            },
            nextAll: function(a) {
                return ya(a, "nextSibling")
            },
            prevAll: function(a) {
                return ya(a, "previousSibling")
            },
            nextUntil: function(a, b, c) {
                return ya(a, "nextSibling", c)
            },
            prevUntil: function(a, b, c) {
                return ya(a, "previousSibling", c)
            },
            siblings: function(a) {
                return za((a.parentNode || {}).firstChild, a)
            },
            children: function(a) {
                return za(a.firstChild)
            },
            contents: function(a) {
                return f(a, "iframe") ? a.contentDocument : (f(a, "template") && (a = a.content || a), va.merge([], a.childNodes))
            }
        }, function(a, b) {
            va.fn[a] = function(c, d) {
                var e = va.map(this, b, c);
                return "Until" !== a.slice(-5) && (d = c), d && "string" == typeof d && (e = va.filter(d, e)), this.length > 1 && (Fa[a] || va.uniqueSort(e), Ea.test(a) && e.reverse()), this.pushStack(e)
            }
        });
        var Ga = /[^\x20\t\r\n\f]+/g;
        va.Callbacks = function(a) {
            a = "string" == typeof a ? i(a) : va.extend({}, a);
            var b, c, e, f, g = [],
                h = [],
                j = -1,
                k = function() {
                    for (f = f || a.once, e = b = !0; h.length; j = -1)
                        for (c = h.shift(); ++j < g.length;) !1 === g[j].apply(c[0], c[1]) && a.stopOnFalse && (j = g.length, c = !1);
                    a.memory || (c = !1), b = !1, f && (g = c ? [] : "")
                },
                l = {
                    add: function() {
                        return g && (c && !b && (j = g.length - 1, h.push(c)), function e(b) {
                            va.each(b, function(b, c) {
                                sa(c) ? a.unique && l.has(c) || g.push(c) : c && c.length && "string" !== d(c) && e(c)
                            })
                        }(arguments), c && !b && k()), this
                    },
                    remove: function() {
                        return va.each(arguments, function(a, b) {
                            for (var c;
                                (c = va.inArray(b, g, c)) > -1;) g.splice(c, 1), c <= j && j--
                        }), this
                    },
                    has: function(a) {
                        return a ? va.inArray(a, g) > -1 : g.length > 0
                    },
                    empty: function() {
                        return g && (g = []), this
                    },
                    disable: function() {
                        return f = h = [], g = c = "", this
                    },
                    disabled: function() {
                        return !g
                    },
                    lock: function() {
                        return f = h = [], c || b || (g = c = ""), this
                    },
                    locked: function() {
                        return !!f
                    },
                    fireWith: function(a, c) {
                        return f || (c = [a, (c = c || []).slice ? c.slice() : c], h.push(c), b || k()), this
                    },
                    fire: function() {
                        return l.fireWith(this, arguments), this
                    },
                    fired: function() {
                        return !!e
                    }
                };
            return l
        }, va.extend({
            Deferred: function(b) {
                var c = [
                        ["notify", "progress", va.Callbacks("memory"), va.Callbacks("memory"), 2],
                        ["resolve", "done", va.Callbacks("once memory"), va.Callbacks("once memory"), 0, "resolved"],
                        ["reject", "fail", va.Callbacks("once memory"), va.Callbacks("once memory"), 1, "rejected"]
                    ],
                    d = "pending",
                    e = {
                        state: function() {
                            return d
                        },
                        always: function() {
                            return f.done(arguments).fail(arguments), this
                        },
                        "catch": function(a) {
                            return e.then(null, a)
                        },
                        pipe: function() {
                            var a = arguments;
                            return va.Deferred(function(b) {
                                va.each(c, function(c, d) {
                                    var e = sa(a[d[4]]) && a[d[4]];
                                    f[d[1]](function() {
                                        var a = e && e.apply(this, arguments);
                                        a && sa(a.promise) ? a.promise().progress(b.notify).done(b.resolve).fail(b.reject) : b[d[0] + "With"](this, e ? [a] : arguments)
                                    })
                                }), a = null
                            }).promise()
                        },
                        then: function(b, d, e) {
                            function f(b, c, d, e) {
                                return function() {
                                    var h = this,
                                        i = arguments,
                                        l = function() {
                                            var a, l;
                                            if (!(b < g)) {
                                                if ((a = d.apply(h, i)) === c.promise()) throw new TypeError("Thenable self-resolution");
                                                l = a && ("object" == typeof a || "function" == typeof a) && a.then, sa(l) ? e ? l.call(a, f(g, c, j, e), f(g, c, k, e)) : (g++, l.call(a, f(g, c, j, e), f(g, c, k, e), f(g, c, j, c.notifyWith))) : (d !== j && (h = void 0, i = [a]), (e || c.resolveWith)(h, i))
                                            }
                                        },
                                        m = e ? l : function() {
                                            try {
                                                l()
                                            } catch (a) {
                                                va.Deferred.exceptionHook && va.Deferred.exceptionHook(a, m.stackTrace), b + 1 >= g && (d !== k && (h = void 0, i = [a]), c.rejectWith(h, i))
                                            }
                                        };
                                    b ? m() : (va.Deferred.getStackHook && (m.stackTrace = va.Deferred.getStackHook()), a.setTimeout(m))
                                }
                            }
                            var g = 0;
                            return va.Deferred(function(a) {
                                c[0][3].add(f(0, a, sa(e) ? e : j, a.notifyWith)), c[1][3].add(f(0, a, sa(b) ? b : j)), c[2][3].add(f(0, a, sa(d) ? d : k))
                            }).promise()
                        },
                        promise: function(a) {
                            return null != a ? va.extend(a, e) : e
                        }
                    },
                    f = {};
                return va.each(c, function(a, b) {
                    var g = b[2],
                        h = b[5];
                    e[b[1]] = g.add, h && g.add(function() {
                        d = h
                    }, c[3 - a][2].disable, c[3 - a][3].disable, c[0][2].lock, c[0][3].lock), g.add(b[3].fire), f[b[0]] = function() {
                        return f[b[0] + "With"](this === f ? void 0 : this, arguments), this
                    }, f[b[0] + "With"] = g.fireWith
                }), e.promise(f), b && b.call(f, f), f
            },
            when: function(a) {
                var b = arguments.length,
                    c = b,
                    d = Array(c),
                    e = ia.call(arguments),
                    f = va.Deferred(),
                    g = function(a) {
                        return function(c) {
                            d[a] = this, e[a] = arguments.length > 1 ? ia.call(arguments) : c, --b || f.resolveWith(d, e)
                        }
                    };
                if (b <= 1 && (l(a, f.done(g(c)).resolve, f.reject, !b), "pending" === f.state() || sa(e[c] && e[c].then))) return f.then();
                for (; c--;) l(e[c], g(c), f.reject);
                return f.promise()
            }
        });
        var Ha = /^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;
        va.Deferred.exceptionHook = function(b, c) {
            a.console && a.console.warn && b && Ha.test(b.name) && a.console.warn("jQuery.Deferred exception: " + b.message, b.stack, c)
        }, va.readyException = function(b) {
            a.setTimeout(function() {
                throw b
            })
        };
        var Ia = va.Deferred();
        va.fn.ready = function(a) {
            return Ia.then(a)["catch"](function(a) {
                va.readyException(a)
            }), this
        }, va.extend({
            isReady: !1,
            readyWait: 1,
            ready: function(a) {
                (!0 === a ? --va.readyWait : va.isReady) || (va.isReady = !0, !0 !== a && --va.readyWait > 0 || Ia.resolveWith(ga, [va]))
            }
        }), va.ready.then = Ia.then, "complete" === ga.readyState || "loading" !== ga.readyState && !ga.documentElement.doScroll ? a.setTimeout(va.ready) : (ga.addEventListener("DOMContentLoaded", m), a.addEventListener("load", m));
        var Ja = function(a, b, c, e, f, g, h) {
                var i = 0,
                    j = a.length,
                    k = null == c;
                if ("object" === d(c)) {
                    f = !0;
                    for (i in c) Ja(a, b, i, c[i], !0, g, h)
                } else if (void 0 !== e && (f = !0, sa(e) || (h = !0), k && (h ? (b.call(a, e), b = null) : (k = b, b = function(a, b, c) {
                        return k.call(va(a), c)
                    })), b))
                    for (; i < j; i++) b(a[i], c, h ? e : e.call(a[i], i, b(a[i], c)));
                return f ? a : k ? b.call(a) : j ? b(a[0], c) : g
            },
            Ka = /^-ms-/,
            La = /-([a-z])/g,
            Ma = function(a) {
                return 1 === a.nodeType || 9 === a.nodeType || !+a.nodeType
            };
        p.uid = 1, p.prototype = {
            cache: function(a) {
                var b = a[this.expando];
                return b || (b = {}, Ma(a) && (a.nodeType ? a[this.expando] = b : Object.defineProperty(a, this.expando, {
                    value: b,
                    configurable: !0
                }))), b
            },
            set: function(a, b, c) {
                var d, e = this.cache(a);
                if ("string" == typeof b) e[o(b)] = c;
                else
                    for (d in b) e[o(d)] = b[d];
                return e
            },
            get: function(a, b) {
                return void 0 === b ? this.cache(a) : a[this.expando] && a[this.expando][o(b)]
            },
            access: function(a, b, c) {
                return void 0 === b || b && "string" == typeof b && void 0 === c ? this.get(a, b) : (this.set(a, b, c), void 0 !== c ? c : b)
            },
            remove: function(a, b) {
                var c, d = a[this.expando];
                if (void 0 !== d) {
                    if (void 0 !== b) {
                        c = (b = Array.isArray(b) ? b.map(o) : (b = o(b)) in d ? [b] : b.match(Ga) || []).length;
                        for (; c--;) delete d[b[c]]
                    }(void 0 === b || va.isEmptyObject(d)) && (a.nodeType ? a[this.expando] = void 0 : delete a[this.expando])
                }
            },
            hasData: function(a) {
                var b = a[this.expando];
                return void 0 !== b && !va.isEmptyObject(b)
            }
        };
        var Na = new p,
            Oa = new p,
            Pa = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
            Qa = /[A-Z]/g;
        va.extend({
            hasData: function(a) {
                return Oa.hasData(a) || Na.hasData(a)
            },
            data: function(a, b, c) {
                return Oa.access(a, b, c)
            },
            removeData: function(a, b) {
                Oa.remove(a, b)
            },
            _data: function(a, b, c) {
                return Na.access(a, b, c)
            },
            _removeData: function(a, b) {
                Na.remove(a, b)
            }
        }), va.fn.extend({
            data: function(a, b) {
                var c, d, e, f = this[0],
                    g = f && f.attributes;
                if (void 0 === a) {
                    if (this.length && (e = Oa.get(f), 1 === f.nodeType && !Na.get(f, "hasDataAttrs"))) {
                        for (c = g.length; c--;) g[c] && 0 === (d = g[c].name).indexOf("data-") && (d = o(d.slice(5)), r(f, d, e[d]));
                        Na.set(f, "hasDataAttrs", !0)
                    }
                    return e
                }
                return "object" == typeof a ? this.each(function() {
                    Oa.set(this, a)
                }) : Ja(this, function(b) {
                    var c;
                    if (f && void 0 === b) {
                        if (void 0 !== (c = Oa.get(f, a))) return c;
                        if (void 0 !== (c = r(f, a))) return c
                    } else this.each(function() {
                        Oa.set(this, a, b)
                    })
                }, null, b, arguments.length > 1, null, !0)
            },
            removeData: function(a) {
                return this.each(function() {
                    Oa.remove(this, a)
                })
            }
        }), va.extend({
            queue: function(a, b, c) {
                var d;
                if (a) return b = (b || "fx") + "queue", d = Na.get(a, b), c && (!d || Array.isArray(c) ? d = Na.access(a, b, va.makeArray(c)) : d.push(c)), d || []
            },
            dequeue: function(a, b) {
                b = b || "fx";
                var c = va.queue(a, b),
                    d = c.length,
                    e = c.shift(),
                    f = va._queueHooks(a, b),
                    g = function() {
                        va.dequeue(a, b)
                    };
                "inprogress" === e && (e = c.shift(), d--), e && ("fx" === b && c.unshift("inprogress"), delete f.stop, e.call(a, g, f)), !d && f && f.empty.fire()
            },
            _queueHooks: function(a, b) {
                var c = b + "queueHooks";
                return Na.get(a, c) || Na.access(a, c, {
                    empty: va.Callbacks("once memory").add(function() {
                        Na.remove(a, [b + "queue", c])
                    })
                })
            }
        }), va.fn.extend({
            queue: function(a, b) {
                var c = 2;
                return "string" != typeof a && (b = a, a = "fx", c--), arguments.length < c ? va.queue(this[0], a) : void 0 === b ? this : this.each(function() {
                    var c = va.queue(this, a, b);
                    va._queueHooks(this, a), "fx" === a && "inprogress" !== c[0] && va.dequeue(this, a)
                })
            },
            dequeue: function(a) {
                return this.each(function() {
                    va.dequeue(this, a)
                })
            },
            clearQueue: function(a) {
                return this.queue(a || "fx", [])
            },
            promise: function(a, b) {
                var c, d = 1,
                    e = va.Deferred(),
                    f = this,
                    g = this.length,
                    h = function() {
                        --d || e.resolveWith(f, [f])
                    };
                for ("string" != typeof a && (b = a, a = void 0), a = a || "fx"; g--;)(c = Na.get(f[g], a + "queueHooks")) && c.empty && (d++, c.empty.add(h));
                return h(), e.promise(b)
            }
        });
        var Ra = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,
            Sa = new RegExp("^(?:([+-])=|)(" + Ra + ")([a-z%]*)$", "i"),
            Ta = ["Top", "Right", "Bottom", "Left"],
            Ua = function(a, b) {
                return "none" === (a = b || a).style.display || "" === a.style.display && va.contains(a.ownerDocument, a) && "none" === va.css(a, "display")
            },
            Va = function(a, b, c, d) {
                var e, f, g = {};
                for (f in b) g[f] = a.style[f], a.style[f] = b[f];
                e = c.apply(a, d || []);
                for (f in b) a.style[f] = g[f];
                return e
            },
            Wa = {};
        va.fn.extend({
            show: function() {
                return u(this, !0)
            },
            hide: function() {
                return u(this)
            },
            toggle: function(a) {
                return "boolean" == typeof a ? a ? this.show() : this.hide() : this.each(function() {
                    Ua(this) ? va(this).show() : va(this).hide()
                })
            }
        });
        var Xa = /^(?:checkbox|radio)$/i,
            Ya = /<([a-z][^\/\0>\x20\t\r\n\f]+)/i,
            Za = /^$|^module$|\/(?:java|ecma)script/i,
            $a = {
                option: [1, "<select multiple='multiple'>", "</select>"],
                thead: [1, "<table>", "</table>"],
                col: [2, "<table><colgroup>", "</colgroup></table>"],
                tr: [2, "<table><tbody>", "</tbody></table>"],
                td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],
                _default: [0, "", ""]
            };
        $a.optgroup = $a.option, $a.tbody = $a.tfoot = $a.colgroup = $a.caption = $a.thead, $a.th = $a.td;
        var _a = /<|&#?\w+;/;
        ! function() {
            var a = ga.createDocumentFragment().appendChild(ga.createElement("div")),
                b = ga.createElement("input");
            b.setAttribute("type", "radio"), b.setAttribute("checked", "checked"), b.setAttribute("name", "t"), a.appendChild(b), ra.checkClone = a.cloneNode(!0).cloneNode(!0).lastChild.checked, a.innerHTML = "<textarea>x</textarea>", ra.noCloneChecked = !!a.cloneNode(!0).lastChild.defaultValue
        }();
        var ab = ga.documentElement,
            bb = /^key/,
            cb = /^(?:mouse|pointer|contextmenu|drag|drop)|click/,
            db = /^([^.]*)(?:\.(.+)|)/;
        va.event = {
            global: {},
            add: function(a, b, c, d, e) {
                var f, g, h, i, j, k, l, m, n, o, p, q = Na.get(a);
                if (q)
                    for (c.handler && (c = (f = c).handler, e = f.selector), e && va.find.matchesSelector(ab, e), c.guid || (c.guid = va.guid++), (i = q.events) || (i = q.events = {}), (g = q.handle) || (g = q.handle = function(b) {
                            return "undefined" != typeof va && va.event.triggered !== b.type ? va.event.dispatch.apply(a, arguments) : void 0
                        }), j = (b = (b || "").match(Ga) || [""]).length; j--;) n = p = (h = db.exec(b[j]) || [])[1], o = (h[2] || "").split(".").sort(), n && (l = va.event.special[n] || {}, n = (e ? l.delegateType : l.bindType) || n, l = va.event.special[n] || {}, k = va.extend({
                        type: n,
                        origType: p,
                        data: d,
                        handler: c,
                        guid: c.guid,
                        selector: e,
                        needsContext: e && va.expr.match.needsContext.test(e),
                        namespace: o.join(".")
                    }, f), (m = i[n]) || ((m = i[n] = []).delegateCount = 0, l.setup && !1 !== l.setup.call(a, d, o, g) || a.addEventListener && a.addEventListener(n, g)), l.add && (l.add.call(a, k), k.handler.guid || (k.handler.guid = c.guid)), e ? m.splice(m.delegateCount++, 0, k) : m.push(k), va.event.global[n] = !0)
            },
            remove: function(a, b, c, d, e) {
                var f, g, h, i, j, k, l, m, n, o, p, q = Na.hasData(a) && Na.get(a);
                if (q && (i = q.events)) {
                    for (j = (b = (b || "").match(Ga) || [""]).length; j--;)
                        if (h = db.exec(b[j]) || [], n = p = h[1], o = (h[2] || "").split(".").sort(), n) {
                            for (l = va.event.special[n] || {}, m = i[n = (d ? l.delegateType : l.bindType) || n] || [], h = h[2] && new RegExp("(^|\\.)" + o.join("\\.(?:.*\\.|)") + "(\\.|$)"), g = f = m.length; f--;) k = m[f], !e && p !== k.origType || c && c.guid !== k.guid || h && !h.test(k.namespace) || d && d !== k.selector && ("**" !== d || !k.selector) || (m.splice(f, 1), k.selector && m.delegateCount--, l.remove && l.remove.call(a, k));
                            g && !m.length && (l.teardown && !1 !== l.teardown.call(a, o, q.handle) || va.removeEvent(a, n, q.handle), delete i[n])
                        } else
                            for (n in i) va.event.remove(a, n + b[j], c, d, !0);
                    va.isEmptyObject(i) && Na.remove(a, "handle events")
                }
            },
            dispatch: function(a) {
                var b, c, d, e, f, g, h = va.event.fix(a),
                    i = new Array(arguments.length),
                    j = (Na.get(this, "events") || {})[h.type] || [],
                    k = va.event.special[h.type] || {};
                for (i[0] = h, b = 1; b < arguments.length; b++) i[b] = arguments[b];
                if (h.delegateTarget = this, !k.preDispatch || !1 !== k.preDispatch.call(this, h)) {
                    for (g = va.event.handlers.call(this, h, j), b = 0;
                        (e = g[b++]) && !h.isPropagationStopped();)
                        for (h.currentTarget = e.elem, c = 0;
                            (f = e.handlers[c++]) && !h.isImmediatePropagationStopped();) h.rnamespace && !h.rnamespace.test(f.namespace) || (h.handleObj = f, h.data = f.data, void 0 !== (d = ((va.event.special[f.origType] || {}).handle || f.handler).apply(e.elem, i)) && !1 === (h.result = d) && (h.preventDefault(), h.stopPropagation()));
                    return k.postDispatch && k.postDispatch.call(this, h), h.result
                }
            },
            handlers: function(a, b) {
                var c, d, e, f, g, h = [],
                    i = b.delegateCount,
                    j = a.target;
                if (i && j.nodeType && !("click" === a.type && a.button >= 1))
                    for (; j !== this; j = j.parentNode || this)
                        if (1 === j.nodeType && ("click" !== a.type || !0 !== j.disabled)) {
                            for (f = [], g = {}, c = 0; c < i; c++) void 0 === g[e = (d = b[c]).selector + " "] && (g[e] = d.needsContext ? va(e, this).index(j) > -1 : va.find(e, this, null, [j]).length), g[e] && f.push(d);
                            f.length && h.push({
                                elem: j,
                                handlers: f
                            })
                        }
                return j = this, i < b.length && h.push({
                    elem: j,
                    handlers: b.slice(i)
                }), h
            },
            addProp: function(a, b) {
                Object.defineProperty(va.Event.prototype, a, {
                    enumerable: !0,
                    configurable: !0,
                    get: sa(b) ? function() {
                        if (this.originalEvent) return b(this.originalEvent)
                    } : function() {
                        if (this.originalEvent) return this.originalEvent[a]
                    },
                    set: function(b) {
                        Object.defineProperty(this, a, {
                            enumerable: !0,
                            configurable: !0,
                            writable: !0,
                            value: b
                        })
                    }
                })
            },
            fix: function(a) {
                return a[va.expando] ? a : new va.Event(a)
            },
            special: {
                load: {
                    noBubble: !0
                },
                focus: {
                    trigger: function() {
                        if (this !== A() && this.focus) return this.focus(), !1
                    },
                    delegateType: "focusin"
                },
                blur: {
                    trigger: function() {
                        if (this === A() && this.blur) return this.blur(), !1
                    },
                    delegateType: "focusout"
                },
                click: {
                    trigger: function() {
                        if ("checkbox" === this.type && this.click && f(this, "input")) return this.click(), !1
                    },
                    _default: function(a) {
                        return f(a.target, "a")
                    }
                },
                beforeunload: {
                    postDispatch: function(a) {
                        void 0 !== a.result && a.originalEvent && (a.originalEvent.returnValue = a.result)
                    }
                }
            }
        }, va.removeEvent = function(a, b, c) {
            a.removeEventListener && a.removeEventListener(b, c)
        }, va.Event = function(a, b) {
            return this instanceof va.Event ? (a && a.type ? (this.originalEvent = a, this.type = a.type, this.isDefaultPrevented = a.defaultPrevented || void 0 === a.defaultPrevented && !1 === a.returnValue ? y : z, this.target = a.target && 3 === a.target.nodeType ? a.target.parentNode : a.target, this.currentTarget = a.currentTarget, this.relatedTarget = a.relatedTarget) : this.type = a, b && va.extend(this, b), this.timeStamp = a && a.timeStamp || Date.now(), this[va.expando] = !0, void 0) : new va.Event(a, b)
        }, va.Event.prototype = {
            constructor: va.Event,
            isDefaultPrevented: z,
            isPropagationStopped: z,
            isImmediatePropagationStopped: z,
            isSimulated: !1,
            preventDefault: function() {
                var a = this.originalEvent;
                this.isDefaultPrevented = y, a && !this.isSimulated && a.preventDefault()
            },
            stopPropagation: function() {
                var a = this.originalEvent;
                this.isPropagationStopped = y, a && !this.isSimulated && a.stopPropagation()
            },
            stopImmediatePropagation: function() {
                var a = this.originalEvent;
                this.isImmediatePropagationStopped = y, a && !this.isSimulated && a.stopImmediatePropagation(), this.stopPropagation()
            }
        }, va.each({
            altKey: !0,
            bubbles: !0,
            cancelable: !0,
            changedTouches: !0,
            ctrlKey: !0,
            detail: !0,
            eventPhase: !0,
            metaKey: !0,
            pageX: !0,
            pageY: !0,
            shiftKey: !0,
            view: !0,
            "char": !0,
            charCode: !0,
            key: !0,
            keyCode: !0,
            button: !0,
            buttons: !0,
            clientX: !0,
            clientY: !0,
            offsetX: !0,
            offsetY: !0,
            pointerId: !0,
            pointerType: !0,
            screenX: !0,
            screenY: !0,
            targetTouches: !0,
            toElement: !0,
            touches: !0,
            which: function(a) {
                var b = a.button;
                return null == a.which && bb.test(a.type) ? null != a.charCode ? a.charCode : a.keyCode : !a.which && void 0 !== b && cb.test(a.type) ? 1 & b ? 1 : 2 & b ? 3 : 4 & b ? 2 : 0 : a.which
            }
        }, va.event.addProp), va.each({
            mouseenter: "mouseover",
            mouseleave: "mouseout",
            pointerenter: "pointerover",
            pointerleave: "pointerout"
        }, function(a, b) {
            va.event.special[a] = {
                delegateType: b,
                bindType: b,
                handle: function(a) {
                    var c, d = this,
                        e = a.relatedTarget,
                        f = a.handleObj;
                    return e && (e === d || va.contains(d, e)) || (a.type = f.origType, c = f.handler.apply(this, arguments), a.type = b), c
                }
            }
        }), va.fn.extend({
            on: function(a, b, c, d) {
                return B(this, a, b, c, d)
            },
            one: function(a, b, c, d) {
                return B(this, a, b, c, d, 1)
            },
            off: function(a, b, c) {
                var d, e;
                if (a && a.preventDefault && a.handleObj) return d = a.handleObj, va(a.delegateTarget).off(d.namespace ? d.origType + "." + d.namespace : d.origType, d.selector, d.handler), this;
                if ("object" == typeof a) {
                    for (e in a) this.off(e, b, a[e]);
                    return this
                }
                return !1 !== b && "function" != typeof b || (c = b, b = void 0), !1 === c && (c = z), this.each(function() {
                    va.event.remove(this, a, c, b)
                })
            }
        });
        var eb = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([a-z][^\/\0>\x20\t\r\n\f]*)[^>]*)\/>/gi,
            fb = /<script|<style|<link/i,
            gb = /checked\s*(?:[^=]|=\s*.checked.)/i,
            hb = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;
        va.extend({
            htmlPrefilter: function(a) {
                return a.replace(eb, "<$1></$2>")
            },
            clone: function(a, b, c) {
                var d, e, f, g, h = a.cloneNode(!0),
                    i = va.contains(a.ownerDocument, a);
                if (!(ra.noCloneChecked || 1 !== a.nodeType && 11 !== a.nodeType || va.isXMLDoc(a)))
                    for (g = v(h), d = 0, e = (f = v(a)).length; d < e; d++) G(f[d], g[d]);
                if (b)
                    if (c)
                        for (f = f || v(a), g = g || v(h), d = 0, e = f.length; d < e; d++) F(f[d], g[d]);
                    else F(a, h);
                return (g = v(h, "script")).length > 0 && w(g, !i && v(a, "script")), h
            },
            cleanData: function(a) {
                for (var b, c, d, e = va.event.special, f = 0; void 0 !== (c = a[f]); f++)
                    if (Ma(c)) {
                        if (b = c[Na.expando]) {
                            if (b.events)
                                for (d in b.events) e[d] ? va.event.remove(c, d) : va.removeEvent(c, d, b.handle);
                            c[Na.expando] = void 0
                        }
                        c[Oa.expando] && (c[Oa.expando] = void 0)
                    }
            }
        }), va.fn.extend({
            detach: function(a) {
                return I(this, a, !0)
            },
            remove: function(a) {
                return I(this, a)
            },
            text: function(a) {
                return Ja(this, function(a) {
                    return void 0 === a ? va.text(this) : this.empty().each(function() {
                        1 !== this.nodeType && 11 !== this.nodeType && 9 !== this.nodeType || (this.textContent = a)
                    })
                }, null, a, arguments.length)
            },
            append: function() {
                return H(this, arguments, function(a) {
                    1 !== this.nodeType && 11 !== this.nodeType && 9 !== this.nodeType || C(this, a).appendChild(a)
                })
            },
            prepend: function() {
                return H(this, arguments, function(a) {
                    if (1 === this.nodeType || 11 === this.nodeType || 9 === this.nodeType) {
                        var b = C(this, a);
                        b.insertBefore(a, b.firstChild)
                    }
                })
            },
            before: function() {
                return H(this, arguments, function(a) {
                    this.parentNode && this.parentNode.insertBefore(a, this)
                })
            },
            after: function() {
                return H(this, arguments, function(a) {
                    this.parentNode && this.parentNode.insertBefore(a, this.nextSibling)
                })
            },
            empty: function() {
                for (var a, b = 0; null != (a = this[b]); b++) 1 === a.nodeType && (va.cleanData(v(a, !1)), a.textContent = "");
                return this
            },
            clone: function(a, b) {
                return a = null != a && a, b = null == b ? a : b, this.map(function() {
                    return va.clone(this, a, b)
                })
            },
            html: function(a) {
                return Ja(this, function(a) {
                    var b = this[0] || {},
                        c = 0,
                        d = this.length;
                    if (void 0 === a && 1 === b.nodeType) return b.innerHTML;
                    if ("string" == typeof a && !fb.test(a) && !$a[(Ya.exec(a) || ["", ""])[1].toLowerCase()]) {
                        a = va.htmlPrefilter(a);
                        try {
                            for (; c < d; c++) 1 === (b = this[c] || {}).nodeType && (va.cleanData(v(b, !1)), b.innerHTML = a);
                            b = 0
                        } catch (a) {}
                    }
                    b && this.empty().append(a)
                }, null, a, arguments.length)
            },
            replaceWith: function() {
                var a = [];
                return H(this, arguments, function(b) {
                    var c = this.parentNode;
                    va.inArray(this, a) < 0 && (va.cleanData(v(this)), c && c.replaceChild(b, this))
                }, a)
            }
        }), va.each({
            appendTo: "append",
            prependTo: "prepend",
            insertBefore: "before",
            insertAfter: "after",
            replaceAll: "replaceWith"
        }, function(a, b) {
            va.fn[a] = function(a) {
                for (var c, d = [], e = va(a), f = e.length - 1, g = 0; g <= f; g++) c = g === f ? this : this.clone(!0), va(e[g])[b](c), ka.apply(d, c.get());
                return this.pushStack(d)
            }
        });
        var ib = new RegExp("^(" + Ra + ")(?!px)[a-z%]+$", "i"),
            jb = function(b) {
                var c = b.ownerDocument.defaultView;
                return c && c.opener || (c = a), c.getComputedStyle(b)
            },
            kb = new RegExp(Ta.join("|"), "i");
        ! function() {
            function b() {
                if (j) {
                    i.style.cssText = "position:absolute;left:-11111px;width:60px;margin-top:1px;padding:0;border:0",
                        j.style.cssText = "position:relative;display:block;box-sizing:border-box;overflow:scroll;margin:auto;border:1px;padding:1px;width:60%;top:1%", ab.appendChild(i).appendChild(j);
                    var b = a.getComputedStyle(j);
                    d = "1%" !== b.top, h = 12 === c(b.marginLeft), j.style.right = "60%", g = 36 === c(b.right), e = 36 === c(b.width), j.style.position = "absolute", f = 36 === j.offsetWidth || "absolute", ab.removeChild(i), j = null
                }
            }

            function c(a) {
                return Math.round(parseFloat(a))
            }
            var d, e, f, g, h, i = ga.createElement("div"),
                j = ga.createElement("div");
            j.style && (j.style.backgroundClip = "content-box", j.cloneNode(!0).style.backgroundClip = "", ra.clearCloneStyle = "content-box" === j.style.backgroundClip, va.extend(ra, {
                boxSizingReliable: function() {
                    return b(), e
                },
                pixelBoxStyles: function() {
                    return b(), g
                },
                pixelPosition: function() {
                    return b(), d
                },
                reliableMarginLeft: function() {
                    return b(), h
                },
                scrollboxSize: function() {
                    return b(), f
                }
            }))
        }();
        var lb = /^(none|table(?!-c[ea]).+)/,
            mb = /^--/,
            nb = {
                position: "absolute",
                visibility: "hidden",
                display: "block"
            },
            ob = {
                letterSpacing: "0",
                fontWeight: "400"
            },
            pb = ["Webkit", "Moz", "ms"],
            qb = ga.createElement("div").style;
        va.extend({
            cssHooks: {
                opacity: {
                    get: function(a, b) {
                        if (b) {
                            var c = J(a, "opacity");
                            return "" === c ? "1" : c
                        }
                    }
                }
            },
            cssNumber: {
                animationIterationCount: !0,
                columnCount: !0,
                fillOpacity: !0,
                flexGrow: !0,
                flexShrink: !0,
                fontWeight: !0,
                lineHeight: !0,
                opacity: !0,
                order: !0,
                orphans: !0,
                widows: !0,
                zIndex: !0,
                zoom: !0
            },
            cssProps: {},
            style: function(a, b, c, d) {
                if (a && 3 !== a.nodeType && 8 !== a.nodeType && a.style) {
                    var e, f, g, h = o(b),
                        i = mb.test(b),
                        j = a.style;
                    if (i || (b = M(h)), g = va.cssHooks[b] || va.cssHooks[h], void 0 === c) return g && "get" in g && void 0 !== (e = g.get(a, !1, d)) ? e : j[b];
                    "string" == (f = typeof c) && (e = Sa.exec(c)) && e[1] && (c = s(a, b, e), f = "number"), null != c && c === c && ("number" === f && (c += e && e[3] || (va.cssNumber[h] ? "" : "px")), ra.clearCloneStyle || "" !== c || 0 !== b.indexOf("background") || (j[b] = "inherit"), g && "set" in g && void 0 === (c = g.set(a, c, d)) || (i ? j.setProperty(b, c) : j[b] = c))
                }
            },
            css: function(a, b, c, d) {
                var e, f, g, h = o(b);
                return mb.test(b) || (b = M(h)), (g = va.cssHooks[b] || va.cssHooks[h]) && "get" in g && (e = g.get(a, !0, c)), void 0 === e && (e = J(a, b, d)), "normal" === e && b in ob && (e = ob[b]), "" === c || c ? (f = parseFloat(e), !0 === c || isFinite(f) ? f || 0 : e) : e
            }
        }), va.each(["height", "width"], function(a, b) {
            va.cssHooks[b] = {
                get: function(a, c, d) {
                    if (c) return !lb.test(va.css(a, "display")) || a.getClientRects().length && a.getBoundingClientRect().width ? P(a, b, d) : Va(a, nb, function() {
                        return P(a, b, d)
                    })
                },
                set: function(a, c, d) {
                    var e, f = jb(a),
                        g = "border-box" === va.css(a, "boxSizing", !1, f),
                        h = d && O(a, b, d, g, f);
                    return g && ra.scrollboxSize() === f.position && (h -= Math.ceil(a["offset" + b[0].toUpperCase() + b.slice(1)] - parseFloat(f[b]) - O(a, b, "border", !1, f) - .5)), h && (e = Sa.exec(c)) && "px" !== (e[3] || "px") && (a.style[b] = c, c = va.css(a, b)), N(a, c, h)
                }
            }
        }), va.cssHooks.marginLeft = K(ra.reliableMarginLeft, function(a, b) {
            if (b) return (parseFloat(J(a, "marginLeft")) || a.getBoundingClientRect().left - Va(a, {
                marginLeft: 0
            }, function() {
                return a.getBoundingClientRect().left
            })) + "px"
        }), va.each({
            margin: "",
            padding: "",
            border: "Width"
        }, function(a, b) {
            va.cssHooks[a + b] = {
                expand: function(c) {
                    for (var d = 0, e = {}, f = "string" == typeof c ? c.split(" ") : [c]; d < 4; d++) e[a + Ta[d] + b] = f[d] || f[d - 2] || f[0];
                    return e
                }
            }, "margin" !== a && (va.cssHooks[a + b].set = N)
        }), va.fn.extend({
            css: function(a, b) {
                return Ja(this, function(a, b, c) {
                    var d, e, f = {},
                        g = 0;
                    if (Array.isArray(b)) {
                        for (d = jb(a), e = b.length; g < e; g++) f[b[g]] = va.css(a, b[g], !1, d);
                        return f
                    }
                    return void 0 !== c ? va.style(a, b, c) : va.css(a, b)
                }, a, b, arguments.length > 1)
            }
        }), va.Tween = Q, Q.prototype = {
            constructor: Q,
            init: function(a, b, c, d, e, f) {
                this.elem = a, this.prop = c, this.easing = e || va.easing._default, this.options = b, this.start = this.now = this.cur(), this.end = d, this.unit = f || (va.cssNumber[c] ? "" : "px")
            },
            cur: function() {
                var a = Q.propHooks[this.prop];
                return a && a.get ? a.get(this) : Q.propHooks._default.get(this)
            },
            run: function(a) {
                var b, c = Q.propHooks[this.prop];
                return this.options.duration ? this.pos = b = va.easing[this.easing](a, this.options.duration * a, 0, 1, this.options.duration) : this.pos = b = a, this.now = (this.end - this.start) * b + this.start, this.options.step && this.options.step.call(this.elem, this.now, this), c && c.set ? c.set(this) : Q.propHooks._default.set(this), this
            }
        }, Q.prototype.init.prototype = Q.prototype, Q.propHooks = {
            _default: {
                get: function(a) {
                    var b;
                    return 1 !== a.elem.nodeType || null != a.elem[a.prop] && null == a.elem.style[a.prop] ? a.elem[a.prop] : (b = va.css(a.elem, a.prop, "")) && "auto" !== b ? b : 0
                },
                set: function(a) {
                    va.fx.step[a.prop] ? va.fx.step[a.prop](a) : 1 !== a.elem.nodeType || null == a.elem.style[va.cssProps[a.prop]] && !va.cssHooks[a.prop] ? a.elem[a.prop] = a.now : va.style(a.elem, a.prop, a.now + a.unit)
                }
            }
        }, Q.propHooks.scrollTop = Q.propHooks.scrollLeft = {
            set: function(a) {
                a.elem.nodeType && a.elem.parentNode && (a.elem[a.prop] = a.now)
            }
        }, va.easing = {
            linear: function(a) {
                return a
            },
            swing: function(a) {
                return .5 - Math.cos(a * Math.PI) / 2
            },
            _default: "swing"
        }, va.fx = Q.prototype.init, va.fx.step = {};
        var rb, sb, tb = /^(?:toggle|show|hide)$/,
            ub = /queueHooks$/;
        va.Animation = va.extend(X, {
                tweeners: {
                    "*": [function(a, b) {
                        var c = this.createTween(a, b);
                        return s(c.elem, a, Sa.exec(b), c), c
                    }]
                },
                tweener: function(a, b) {
                    sa(a) ? (b = a, a = ["*"]) : a = a.match(Ga);
                    for (var c, d = 0, e = a.length; d < e; d++) c = a[d], X.tweeners[c] = X.tweeners[c] || [], X.tweeners[c].unshift(b)
                },
                prefilters: [V],
                prefilter: function(a, b) {
                    b ? X.prefilters.unshift(a) : X.prefilters.push(a)
                }
            }), va.speed = function(a, b, c) {
                var d = a && "object" == typeof a ? va.extend({}, a) : {
                    complete: c || !c && b || sa(a) && a,
                    duration: a,
                    easing: c && b || b && !sa(b) && b
                };
                return va.fx.off ? d.duration = 0 : "number" != typeof d.duration && (d.duration in va.fx.speeds ? d.duration = va.fx.speeds[d.duration] : d.duration = va.fx.speeds._default), null != d.queue && !0 !== d.queue || (d.queue = "fx"), d.old = d.complete, d.complete = function() {
                    sa(d.old) && d.old.call(this), d.queue && va.dequeue(this, d.queue)
                }, d
            }, va.fn.extend({
                fadeTo: function(a, b, c, d) {
                    return this.filter(Ua).css("opacity", 0).show().end().animate({
                        opacity: b
                    }, a, c, d)
                },
                animate: function(a, b, c, d) {
                    var e = va.isEmptyObject(a),
                        f = va.speed(b, c, d),
                        g = function() {
                            var b = X(this, va.extend({}, a), f);
                            (e || Na.get(this, "finish")) && b.stop(!0)
                        };
                    return g.finish = g, e || !1 === f.queue ? this.each(g) : this.queue(f.queue, g)
                },
                stop: function(a, b, c) {
                    var d = function(a) {
                        var b = a.stop;
                        delete a.stop, b(c)
                    };
                    return "string" != typeof a && (c = b, b = a, a = void 0), b && !1 !== a && this.queue(a || "fx", []), this.each(function() {
                        var b = !0,
                            e = null != a && a + "queueHooks",
                            f = va.timers,
                            g = Na.get(this);
                        if (e) g[e] && g[e].stop && d(g[e]);
                        else
                            for (e in g) g[e] && g[e].stop && ub.test(e) && d(g[e]);
                        for (e = f.length; e--;) f[e].elem !== this || null != a && f[e].queue !== a || (f[e].anim.stop(c), b = !1, f.splice(e, 1));
                        !b && c || va.dequeue(this, a)
                    })
                },
                finish: function(a) {
                    return !1 !== a && (a = a || "fx"), this.each(function() {
                        var b, c = Na.get(this),
                            d = c[a + "queue"],
                            e = c[a + "queueHooks"],
                            f = va.timers,
                            g = d ? d.length : 0;
                        for (c.finish = !0, va.queue(this, a, []), e && e.stop && e.stop.call(this, !0), b = f.length; b--;) f[b].elem === this && f[b].queue === a && (f[b].anim.stop(!0), f.splice(b, 1));
                        for (b = 0; b < g; b++) d[b] && d[b].finish && d[b].finish.call(this);
                        delete c.finish
                    })
                }
            }), va.each(["toggle", "show", "hide"], function(a, b) {
                var c = va.fn[b];
                va.fn[b] = function(a, d, e) {
                    return null == a || "boolean" == typeof a ? c.apply(this, arguments) : this.animate(T(b, !0), a, d, e)
                }
            }), va.each({
                slideDown: T("show"),
                slideUp: T("hide"),
                slideToggle: T("toggle"),
                fadeIn: {
                    opacity: "show"
                },
                fadeOut: {
                    opacity: "hide"
                },
                fadeToggle: {
                    opacity: "toggle"
                }
            }, function(a, b) {
                va.fn[a] = function(a, c, d) {
                    return this.animate(b, a, c, d)
                }
            }), va.timers = [], va.fx.tick = function() {
                var a, b = 0,
                    c = va.timers;
                for (rb = Date.now(); b < c.length; b++)(a = c[b])() || c[b] !== a || c.splice(b--, 1);
                c.length || va.fx.stop(), rb = void 0
            }, va.fx.timer = function(a) {
                va.timers.push(a), va.fx.start()
            }, va.fx.interval = 13, va.fx.start = function() {
                sb || (sb = !0, R())
            }, va.fx.stop = function() {
                sb = null
            }, va.fx.speeds = {
                slow: 600,
                fast: 200,
                _default: 400
            }, va.fn.delay = function(b, c) {
                return b = va.fx ? va.fx.speeds[b] || b : b, c = c || "fx", this.queue(c, function(c, d) {
                    var e = a.setTimeout(c, b);
                    d.stop = function() {
                        a.clearTimeout(e)
                    }
                })
            },
            function() {
                var a = ga.createElement("input"),
                    b = ga.createElement("select").appendChild(ga.createElement("option"));
                a.type = "checkbox", ra.checkOn = "" !== a.value, ra.optSelected = b.selected, (a = ga.createElement("input")).value = "t", a.type = "radio", ra.radioValue = "t" === a.value
            }();
        var vb, wb = va.expr.attrHandle;
        va.fn.extend({
            attr: function(a, b) {
                return Ja(this, va.attr, a, b, arguments.length > 1)
            },
            removeAttr: function(a) {
                return this.each(function() {
                    va.removeAttr(this, a)
                })
            }
        }), va.extend({
            attr: function(a, b, c) {
                var d, e, f = a.nodeType;
                if (3 !== f && 8 !== f && 2 !== f) return "undefined" == typeof a.getAttribute ? va.prop(a, b, c) : (1 === f && va.isXMLDoc(a) || (e = va.attrHooks[b.toLowerCase()] || (va.expr.match.bool.test(b) ? vb : void 0)), void 0 !== c ? null === c ? void va.removeAttr(a, b) : e && "set" in e && void 0 !== (d = e.set(a, c, b)) ? d : (a.setAttribute(b, c + ""), c) : e && "get" in e && null !== (d = e.get(a, b)) ? d : null == (d = va.find.attr(a, b)) ? void 0 : d)
            },
            attrHooks: {
                type: {
                    set: function(a, b) {
                        if (!ra.radioValue && "radio" === b && f(a, "input")) {
                            var c = a.value;
                            return a.setAttribute("type", b), c && (a.value = c), b
                        }
                    }
                }
            },
            removeAttr: function(a, b) {
                var c, d = 0,
                    e = b && b.match(Ga);
                if (e && 1 === a.nodeType)
                    for (; c = e[d++];) a.removeAttribute(c)
            }
        }), vb = {
            set: function(a, b, c) {
                return !1 === b ? va.removeAttr(a, c) : a.setAttribute(c, c), c
            }
        }, va.each(va.expr.match.bool.source.match(/\w+/g), function(a, b) {
            var c = wb[b] || va.find.attr;
            wb[b] = function(a, b, d) {
                var e, f, g = b.toLowerCase();
                return d || (f = wb[g], wb[g] = e, e = null != c(a, b, d) ? g : null, wb[g] = f), e
            }
        });
        var xb = /^(?:input|select|textarea|button)$/i,
            yb = /^(?:a|area)$/i;
        va.fn.extend({
            prop: function(a, b) {
                return Ja(this, va.prop, a, b, arguments.length > 1)
            },
            removeProp: function(a) {
                return this.each(function() {
                    delete this[va.propFix[a] || a]
                })
            }
        }), va.extend({
            prop: function(a, b, c) {
                var d, e, f = a.nodeType;
                if (3 !== f && 8 !== f && 2 !== f) return 1 === f && va.isXMLDoc(a) || (b = va.propFix[b] || b, e = va.propHooks[b]), void 0 !== c ? e && "set" in e && void 0 !== (d = e.set(a, c, b)) ? d : a[b] = c : e && "get" in e && null !== (d = e.get(a, b)) ? d : a[b]
            },
            propHooks: {
                tabIndex: {
                    get: function(a) {
                        var b = va.find.attr(a, "tabindex");
                        return b ? parseInt(b, 10) : xb.test(a.nodeName) || yb.test(a.nodeName) && a.href ? 0 : -1
                    }
                }
            },
            propFix: {
                "for": "htmlFor",
                "class": "className"
            }
        }), ra.optSelected || (va.propHooks.selected = {
            get: function(a) {
                var b = a.parentNode;
                return b && b.parentNode && b.parentNode.selectedIndex, null
            },
            set: function(a) {
                var b = a.parentNode;
                b && (b.selectedIndex, b.parentNode && b.parentNode.selectedIndex)
            }
        }), va.each(["tabIndex", "readOnly", "maxLength", "cellSpacing", "cellPadding", "rowSpan", "colSpan", "useMap", "frameBorder", "contentEditable"], function() {
            va.propFix[this.toLowerCase()] = this
        }), va.fn.extend({
            addClass: function(a) {
                var b, c, d, e, f, g, h, i = 0;
                if (sa(a)) return this.each(function(b) {
                    va(this).addClass(a.call(this, b, Z(this)))
                });
                if ((b = $(a)).length)
                    for (; c = this[i++];)
                        if (e = Z(c), d = 1 === c.nodeType && " " + Y(e) + " ") {
                            for (g = 0; f = b[g++];) d.indexOf(" " + f + " ") < 0 && (d += f + " ");
                            e !== (h = Y(d)) && c.setAttribute("class", h)
                        }
                return this
            },
            removeClass: function(a) {
                var b, c, d, e, f, g, h, i = 0;
                if (sa(a)) return this.each(function(b) {
                    va(this).removeClass(a.call(this, b, Z(this)))
                });
                if (!arguments.length) return this.attr("class", "");
                if ((b = $(a)).length)
                    for (; c = this[i++];)
                        if (e = Z(c), d = 1 === c.nodeType && " " + Y(e) + " ") {
                            for (g = 0; f = b[g++];)
                                for (; d.indexOf(" " + f + " ") > -1;) d = d.replace(" " + f + " ", " ");
                            e !== (h = Y(d)) && c.setAttribute("class", h)
                        }
                return this
            },
            toggleClass: function(a, b) {
                var c = typeof a,
                    d = "string" === c || Array.isArray(a);
                return "boolean" == typeof b && d ? b ? this.addClass(a) : this.removeClass(a) : sa(a) ? this.each(function(c) {
                    va(this).toggleClass(a.call(this, c, Z(this), b), b)
                }) : this.each(function() {
                    var b, e, f, g;
                    if (d)
                        for (e = 0, f = va(this), g = $(a); b = g[e++];) f.hasClass(b) ? f.removeClass(b) : f.addClass(b);
                    else void 0 !== a && "boolean" !== c || ((b = Z(this)) && Na.set(this, "__className__", b), this.setAttribute && this.setAttribute("class", b || !1 === a ? "" : Na.get(this, "__className__") || ""))
                })
            },
            hasClass: function(a) {
                var b, c, d = 0;
                for (b = " " + a + " "; c = this[d++];)
                    if (1 === c.nodeType && (" " + Y(Z(c)) + " ").indexOf(b) > -1) return !0;
                return !1
            }
        });
        var zb = /\r/g;
        va.fn.extend({
            val: function(a) {
                var b, c, d, e = this[0];
                return arguments.length ? (d = sa(a), this.each(function(c) {
                    var e;
                    1 === this.nodeType && (null == (e = d ? a.call(this, c, va(this).val()) : a) ? e = "" : "number" == typeof e ? e += "" : Array.isArray(e) && (e = va.map(e, function(a) {
                        return null == a ? "" : a + ""
                    })), (b = va.valHooks[this.type] || va.valHooks[this.nodeName.toLowerCase()]) && "set" in b && void 0 !== b.set(this, e, "value") || (this.value = e))
                })) : e ? (b = va.valHooks[e.type] || va.valHooks[e.nodeName.toLowerCase()]) && "get" in b && void 0 !== (c = b.get(e, "value")) ? c : "string" == typeof(c = e.value) ? c.replace(zb, "") : null == c ? "" : c : void 0
            }
        }), va.extend({
            valHooks: {
                option: {
                    get: function(a) {
                        var b = va.find.attr(a, "value");
                        return null != b ? b : Y(va.text(a))
                    }
                },
                select: {
                    get: function(a) {
                        var b, c, d, e = a.options,
                            g = a.selectedIndex,
                            h = "select-one" === a.type,
                            i = h ? null : [],
                            j = h ? g + 1 : e.length;
                        for (d = g < 0 ? j : h ? g : 0; d < j; d++)
                            if (((c = e[d]).selected || d === g) && !c.disabled && (!c.parentNode.disabled || !f(c.parentNode, "optgroup"))) {
                                if (b = va(c).val(), h) return b;
                                i.push(b)
                            }
                        return i
                    },
                    set: function(a, b) {
                        for (var c, d, e = a.options, f = va.makeArray(b), g = e.length; g--;)((d = e[g]).selected = va.inArray(va.valHooks.option.get(d), f) > -1) && (c = !0);
                        return c || (a.selectedIndex = -1), f
                    }
                }
            }
        }), va.each(["radio", "checkbox"], function() {
            va.valHooks[this] = {
                set: function(a, b) {
                    if (Array.isArray(b)) return a.checked = va.inArray(va(a).val(), b) > -1
                }
            }, ra.checkOn || (va.valHooks[this].get = function(a) {
                return null === a.getAttribute("value") ? "on" : a.value
            })
        }), ra.focusin = "onfocusin" in a;
        var Ab = /^(?:focusinfocus|focusoutblur)$/,
            Bb = function(a) {
                a.stopPropagation()
            };
        va.extend(va.event, {
            trigger: function(b, c, d, e) {
                var f, g, h, i, j, k, l, m, n = [d || ga],
                    o = oa.call(b, "type") ? b.type : b,
                    p = oa.call(b, "namespace") ? b.namespace.split(".") : [];
                if (g = m = h = d = d || ga, 3 !== d.nodeType && 8 !== d.nodeType && !Ab.test(o + va.event.triggered) && (o.indexOf(".") > -1 && (o = (p = o.split(".")).shift(), p.sort()), j = o.indexOf(":") < 0 && "on" + o, b = b[va.expando] ? b : new va.Event(o, "object" == typeof b && b), b.isTrigger = e ? 2 : 3, b.namespace = p.join("."), b.rnamespace = b.namespace ? new RegExp("(^|\\.)" + p.join("\\.(?:.*\\.|)") + "(\\.|$)") : null, b.result = void 0, b.target || (b.target = d), c = null == c ? [b] : va.makeArray(c, [b]), l = va.event.special[o] || {}, e || !l.trigger || !1 !== l.trigger.apply(d, c))) {
                    if (!e && !l.noBubble && !ta(d)) {
                        for (i = l.delegateType || o, Ab.test(i + o) || (g = g.parentNode); g; g = g.parentNode) n.push(g), h = g;
                        h === (d.ownerDocument || ga) && n.push(h.defaultView || h.parentWindow || a)
                    }
                    for (f = 0;
                        (g = n[f++]) && !b.isPropagationStopped();) m = g, b.type = f > 1 ? i : l.bindType || o, (k = (Na.get(g, "events") || {})[b.type] && Na.get(g, "handle")) && k.apply(g, c), (k = j && g[j]) && k.apply && Ma(g) && (b.result = k.apply(g, c), !1 === b.result && b.preventDefault());
                    return b.type = o, e || b.isDefaultPrevented() || l._default && !1 !== l._default.apply(n.pop(), c) || !Ma(d) || j && sa(d[o]) && !ta(d) && ((h = d[j]) && (d[j] = null), va.event.triggered = o, b.isPropagationStopped() && m.addEventListener(o, Bb), d[o](), b.isPropagationStopped() && m.removeEventListener(o, Bb), va.event.triggered = void 0, h && (d[j] = h)), b.result
                }
            },
            simulate: function(a, b, c) {
                var d = va.extend(new va.Event, c, {
                    type: a,
                    isSimulated: !0
                });
                va.event.trigger(d, null, b)
            }
        }), va.fn.extend({
            trigger: function(a, b) {
                return this.each(function() {
                    va.event.trigger(a, b, this)
                })
            },
            triggerHandler: function(a, b) {
                var c = this[0];
                if (c) return va.event.trigger(a, b, c, !0)
            }
        }), ra.focusin || va.each({
            focus: "focusin",
            blur: "focusout"
        }, function(a, b) {
            var c = function(a) {
                va.event.simulate(b, a.target, va.event.fix(a))
            };
            va.event.special[b] = {
                setup: function() {
                    var d = this.ownerDocument || this,
                        e = Na.access(d, b);
                    e || d.addEventListener(a, c, !0), Na.access(d, b, (e || 0) + 1)
                },
                teardown: function() {
                    var d = this.ownerDocument || this,
                        e = Na.access(d, b) - 1;
                    e ? Na.access(d, b, e) : (d.removeEventListener(a, c, !0), Na.remove(d, b))
                }
            }
        });
        var Cb = a.location,
            Db = Date.now(),
            Eb = /\?/;
        va.parseXML = function(a) {
            var b;
            if (!a || "string" != typeof a) return null;
            try {
                b = (new c.DOMParser).parseFromString(a, "text/xml")
            } catch (c) {
                b = void 0
            }
            return b && !b.getElementsByTagName("parsererror").length || va.error("Invalid XML: " + a), b
        };
        var Fb = /\[\]$/,
            Gb = /\r?\n/g,
            Hb = /^(?:submit|button|image|reset|file)$/i,
            Ib = /^(?:input|select|textarea|keygen)/i;
        va.param = function(a, b) {
            var c, d = [],
                e = function(a, b) {
                    var c = sa(b) ? b() : b;
                    d[d.length] = encodeURIComponent(a) + "=" + encodeURIComponent(null == c ? "" : c)
                };
            if (Array.isArray(a) || a.jquery && !va.isPlainObject(a)) va.each(a, function() {
                e(this.name, this.value)
            });
            else
                for (c in a) _(c, a[c], b, e);
            return d.join("&")
        }, va.fn.extend({
            serialize: function() {
                return va.param(this.serializeArray())
            },
            serializeArray: function() {
                return this.map(function() {
                    var a = va.prop(this, "elements");
                    return a ? va.makeArray(a) : this
                }).filter(function() {
                    var a = this.type;
                    return this.name && !va(this).is(":disabled") && Ib.test(this.nodeName) && !Hb.test(a) && (this.checked || !Xa.test(a))
                }).map(function(a, b) {
                    var c = va(this).val();
                    return null == c ? null : Array.isArray(c) ? va.map(c, function(a) {
                        return {
                            name: b.name,
                            value: a.replace(Gb, "\r\n")
                        }
                    }) : {
                        name: b.name,
                        value: c.replace(Gb, "\r\n")
                    }
                }).get()
            }
        });
        var Jb = /%20/g,
            Kb = /#.*$/,
            Lb = /([?&])_=[^&]*/,
            Mb = /^(.*?):[ \t]*([^\r\n]*)$/gm,
            Nb = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
            Ob = /^(?:GET|HEAD)$/,
            Pb = /^\/\//,
            Qb = {},
            Rb = {},
            Sb = "*/".concat("*"),
            Tb = ga.createElement("a");
        Tb.href = Cb.href, va.extend({
            active: 0,
            lastModified: {},
            etag: {},
            ajaxSettings: {
                url: Cb.href,
                type: "GET",
                isLocal: Nb.test(Cb.protocol),
                global: !0,
                processData: !0,
                async: !0,
                contentType: "application/x-www-form-urlencoded; charset=UTF-8",
                accepts: {
                    "*": Sb,
                    text: "text/plain",
                    html: "text/html",
                    xml: "application/xml, text/xml",
                    json: "application/json, text/javascript"
                },
                contents: {
                    xml: /\bxml\b/,
                    html: /\bhtml/,
                    json: /\bjson\b/
                },
                responseFields: {
                    xml: "responseXML",
                    text: "responseText",
                    json: "responseJSON"
                },
                converters: {
                    "* text": String,
                    "text html": !0,
                    "text json": JSON.parse,
                    "text xml": va.parseXML
                },
                flatOptions: {
                    url: !0,
                    context: !0
                }
            },
            ajaxSetup: function(a, b) {
                return b ? ca(ca(a, va.ajaxSettings), b) : ca(va.ajaxSettings, a)
            },
            ajaxPrefilter: aa(Qb),
            ajaxTransport: aa(Rb),
            ajax: function(a, b) {
                function c(a, b, c, g) {
                    var i, l, m, t, u, v = b;
                    j || (j = !0, h && x.clearTimeout(h), d = void 0, f = g || "", w.readyState = a > 0 ? 4 : 0, i = a >= 200 && a < 300 || 304 === a, c && (t = da(n, w, c)), t = ea(n, t, w, i), i ? (n.ifModified && ((u = w.getResponseHeader("Last-Modified")) && (va.lastModified[e] = u), (u = w.getResponseHeader("etag")) && (va.etag[e] = u)), 204 === a || "HEAD" === n.type ? v = "nocontent" : 304 === a ? v = "notmodified" : (v = t.state, l = t.data, i = !(m = t.error))) : (m = v, !a && v || (v = "error", a < 0 && (a = 0))), w.status = a, w.statusText = (b || v) + "", i ? q.resolveWith(o, [l, v, w]) : q.rejectWith(o, [w, v, m]), w.statusCode(s), s = void 0, k && p.trigger(i ? "ajaxSuccess" : "ajaxError", [w, n, i ? l : m]), r.fireWith(o, [w, v]), k && (p.trigger("ajaxComplete", [w, n]), --va.active || va.event.trigger("ajaxStop")))
                }
                "object" == typeof a && (b = a, a = void 0), b = b || {};
                var d, e, f, g, h, i, j, k, l, m, n = va.ajaxSetup({}, b),
                    o = n.context || n,
                    p = n.context && (o.nodeType || o.jquery) ? va(o) : va.event,
                    q = va.Deferred(),
                    r = va.Callbacks("once memory"),
                    s = n.statusCode || {},
                    t = {},
                    u = {},
                    v = "canceled",
                    w = {
                        readyState: 0,
                        getResponseHeader: function(a) {
                            var b;
                            if (j) {
                                if (!g)
                                    for (g = {}; b = Mb.exec(f);) g[b[1].toLowerCase()] = b[2];
                                b = g[a.toLowerCase()]
                            }
                            return null == b ? null : b
                        },
                        getAllResponseHeaders: function() {
                            return j ? f : null
                        },
                        setRequestHeader: function(a, b) {
                            return null == j && (a = u[a.toLowerCase()] = u[a.toLowerCase()] || a, t[a] = b), this
                        },
                        overrideMimeType: function(a) {
                            return null == j && (n.mimeType = a), this
                        },
                        statusCode: function(a) {
                            var b;
                            if (a)
                                if (j) w.always(a[w.status]);
                                else
                                    for (b in a) s[b] = [s[b], a[b]];
                            return this
                        },
                        abort: function(a) {
                            var b = a || v;
                            return d && d.abort(b), c(0, b), this
                        }
                    };
                if (q.promise(w), n.url = ((a || n.url || Cb.href) + "").replace(Pb, Cb.protocol + "//"), n.type = b.method || b.type || n.method || n.type, n.dataTypes = (n.dataType || "*").toLowerCase().match(Ga) || [""], null == n.crossDomain) {
                    i = ga.createElement("a");
                    try {
                        i.href = n.url, i.href = i.href, n.crossDomain = Tb.protocol + "//" + Tb.host != i.protocol + "//" + i.host
                    } catch (x) {
                        n.crossDomain = !0
                    }
                }
                if (n.data && n.processData && "string" != typeof n.data && (n.data = va.param(n.data, n.traditional)), ba(Qb, n, b, w), j) return w;
                (k = va.event && n.global) && 0 == va.active++ && va.event.trigger("ajaxStart"), n.type = n.type.toUpperCase(), n.hasContent = !Ob.test(n.type), e = n.url.replace(Kb, ""), n.hasContent ? n.data && n.processData && 0 === (n.contentType || "").indexOf("application/x-www-form-urlencoded") && (n.data = n.data.replace(Jb, "+")) : (m = n.url.slice(e.length), n.data && (n.processData || "string" == typeof n.data) && (e += (Eb.test(e) ? "&" : "?") + n.data, delete n.data), !1 === n.cache && (e = e.replace(Lb, "$1"), m = (Eb.test(e) ? "&" : "?") + "_=" + Db++ + m), n.url = e + m), n.ifModified && (va.lastModified[e] && w.setRequestHeader("If-Modified-Since", va.lastModified[e]), va.etag[e] && w.setRequestHeader("If-None-Match", va.etag[e])), (n.data && n.hasContent && !1 !== n.contentType || b.contentType) && w.setRequestHeader("Content-Type", n.contentType), w.setRequestHeader("Accept", n.dataTypes[0] && n.accepts[n.dataTypes[0]] ? n.accepts[n.dataTypes[0]] + ("*" !== n.dataTypes[0] ? ", " + Sb + "; q=0.01" : "") : n.accepts["*"]);
                for (l in n.headers) w.setRequestHeader(l, n.headers[l]);
                if (n.beforeSend && (!1 === n.beforeSend.call(o, w, n) || j)) return w.abort();
                if (v = "abort", r.add(n.complete), w.done(n.success), w.fail(n.error), d = ba(Rb, n, b, w)) {
                    if (w.readyState = 1, k && p.trigger("ajaxSend", [w, n]), j) return w;
                    n.async && n.timeout > 0 && (h = x.setTimeout(function() {
                        w.abort("timeout")
                    }, n.timeout));
                    try {
                        j = !1, d.send(t, c)
                    } catch (x) {
                        if (j) throw x;
                        c(-1, x)
                    }
                } else c(-1, "No Transport");
                return w
            },
            getJSON: function(a, b, c) {
                return va.get(a, b, c, "json")
            },
            getScript: function(a, b) {
                return va.get(a, void 0, b, "script")
            }
        }), va.each(["get", "post"], function(a, b) {
            va[b] = function(a, c, d, e) {
                return sa(c) && (e = e || d, d = c, c = void 0), va.ajax(va.extend({
                    url: a,
                    type: b,
                    dataType: e,
                    data: c,
                    success: d
                }, va.isPlainObject(a) && a))
            }
        }), va._evalUrl = function(a) {
            return va.ajax({
                url: a,
                type: "GET",
                dataType: "script",
                cache: !0,
                async: !1,
                global: !1,
                "throws": !0
            })
        }, va.fn.extend({
            wrapAll: function(a) {
                var b;
                return this[0] && (sa(a) && (a = a.call(this[0])), b = va(a, this[0].ownerDocument).eq(0).clone(!0), this[0].parentNode && b.insertBefore(this[0]), b.map(function() {
                    for (var a = this; a.firstElementChild;) a = a.firstElementChild;
                    return a
                }).append(this)), this
            },
            wrapInner: function(a) {
                return sa(a) ? this.each(function(b) {
                    va(this).wrapInner(a.call(this, b))
                }) : this.each(function() {
                    var b = va(this),
                        c = b.contents();
                    c.length ? c.wrapAll(a) : b.append(a)
                })
            },
            wrap: function(a) {
                var b = sa(a);
                return this.each(function(c) {
                    va(this).wrapAll(b ? a.call(this, c) : a)
                })
            },
            unwrap: function(a) {
                return this.parent(a).not("body").each(function() {
                    va(this).replaceWith(this.childNodes)
                }), this
            }
        }), va.expr.pseudos.hidden = function(a) {
            return !va.expr.pseudos.visible(a)
        }, va.expr.pseudos.visible = function(a) {
            return !!(a.offsetWidth || a.offsetHeight || a.getClientRects().length)
        }, va.ajaxSettings.xhr = function() {
            try {
                return new a.XMLHttpRequest
            } catch (a) {}
        };
        var Ub = {
                0: 200,
                1223: 204
            },
            Vb = va.ajaxSettings.xhr();
        ra.cors = !!Vb && "withCredentials" in Vb, ra.ajax = Vb = !!Vb, va.ajaxTransport(function(a) {
            var b, c;
            if (ra.cors || Vb && !a.crossDomain) return {
                send: function(d, e) {
                    var f, g = a.xhr();
                    if (g.open(a.type, a.url, a.async, a.username, a.password), a.xhrFields)
                        for (f in a.xhrFields) g[f] = a.xhrFields[f];
                    a.mimeType && g.overrideMimeType && g.overrideMimeType(a.mimeType), a.crossDomain || d["X-Requested-With"] || (d["X-Requested-With"] = "XMLHttpRequest");
                    for (f in d) g.setRequestHeader(f, d[f]);
                    b = function(a) {
                        return function() {
                            b && (b = c = g.onload = g.onerror = g.onabort = g.ontimeout = g.onreadystatechange = null, "abort" === a ? g.abort() : "error" === a ? "number" != typeof g.status ? e(0, "error") : e(g.status, g.statusText) : e(Ub[g.status] || g.status, g.statusText, "text" !== (g.responseType || "text") || "string" != typeof g.responseText ? {
                                binary: g.response
                            } : {
                                text: g.responseText
                            }, g.getAllResponseHeaders()))
                        }
                    }, g.onload = b(), c = g.onerror = g.ontimeout = b("error"), void 0 !== g.onabort ? g.onabort = c : g.onreadystatechange = function() {
                        4 === g.readyState && h.setTimeout(function() {
                            b && c()
                        })
                    }, b = b("abort");
                    try {
                        g.send(a.hasContent && a.data || null)
                    } catch (h) {
                        if (b) throw h
                    }
                },
                abort: function() {
                    b && b()
                }
            }
        }), va.ajaxPrefilter(function(a) {
            a.crossDomain && (a.contents.script = !1)
        }), va.ajaxSetup({
            accepts: {
                script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
            },
            contents: {
                script: /\b(?:java|ecma)script\b/
            },
            converters: {
                "text script": function(a) {
                    return va.globalEval(a), a
                }
            }
        }), va.ajaxPrefilter("script", function(a) {
            void 0 === a.cache && (a.cache = !1), a.crossDomain && (a.type = "GET")
        }), va.ajaxTransport("script", function(a) {
            if (a.crossDomain) {
                var b, c;
                return {
                    send: function(d, e) {
                        b = va("<script>").prop({
                            charset: a.scriptCharset,
                            src: a.url
                        }).on("load error", c = function(a) {
                            b.remove(), c = null, a && e("error" === a.type ? 404 : 200, a.type)
                        }), ga.head.appendChild(b[0])
                    },
                    abort: function() {
                        c && c()
                    }
                }
            }
        });
        var Wb = [],
            Xb = /(=)\?(?=&|$)|\?\?/;
        va.ajaxSetup({
            jsonp: "callback",
            jsonpCallback: function() {
                var a = Wb.pop() || va.expando + "_" + Db++;
                return this[a] = !0, a
            }
        }), va.ajaxPrefilter("json jsonp", function(b, c, d) {
            var e, f, g, h = !1 !== b.jsonp && (Xb.test(b.url) ? "url" : "string" == typeof b.data && 0 === (b.contentType || "").indexOf("application/x-www-form-urlencoded") && Xb.test(b.data) && "data");
            if (h || "jsonp" === b.dataTypes[0]) return e = b.jsonpCallback = sa(b.jsonpCallback) ? b.jsonpCallback() : b.jsonpCallback, h ? b[h] = b[h].replace(Xb, "$1" + e) : !1 !== b.jsonp && (b.url += (Eb.test(b.url) ? "&" : "?") + b.jsonp + "=" + e), b.converters["script json"] = function() {
                return g || va.error(e + " was not called"), g[0]
            }, b.dataTypes[0] = "json", f = a[e], a[e] = function() {
                g = arguments
            }, d.always(function() {
                void 0 === f ? va(a).removeProp(e) : a[e] = f, b[e] && (b.jsonpCallback = c.jsonpCallback, Wb.push(e)), g && sa(f) && f(g[0]), g = f = void 0
            }), "script"
        }), ra.createHTMLDocument = function() {
            var a = ga.implementation.createHTMLDocument("").body;
            return a.innerHTML = "<form></form><form></form>", 2 === a.childNodes.length
        }(), va.parseHTML = function(a, b, c) {
            if ("string" != typeof a) return [];
            "boolean" == typeof b && (c = b, b = !1);
            var d, e, f;
            return b || (ra.createHTMLDocument ? ((d = (b = ga.implementation.createHTMLDocument("")).createElement("base")).href = ga.location.href, b.head.appendChild(d)) : b = ga), e = Ba.exec(a), f = !c && [], e ? [b.createElement(e[1])] : (e = x([a], b, f), f && f.length && va(f).remove(), va.merge([], e.childNodes))
        }, va.fn.load = function(a, b, c) {
            var d, e, f, g = this,
                h = a.indexOf(" ");
            return h > -1 && (d = Y(a.slice(h)), a = a.slice(0, h)), sa(b) ? (c = b, b = void 0) : b && "object" == typeof b && (e = "POST"), g.length > 0 && va.ajax({
                url: a,
                type: e || "GET",
                dataType: "html",
                data: b
            }).done(function(a) {
                f = arguments, g.html(d ? va("<div>").append(va.parseHTML(a)).find(d) : a)
            }).always(c && function(a, b) {
                g.each(function() {
                    c.apply(this, f || [a.responseText, b, a])
                })
            }), this
        }, va.each(["ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend"], function(a, b) {
            va.fn[b] = function(a) {
                return this.on(b, a)
            }
        }), va.expr.pseudos.animated = function(a) {
            return va.grep(va.timers, function(b) {
                return a === b.elem
            }).length
        }, va.offset = {
            setOffset: function(a, b, c) {
                var d, e, f, g, h, i, j, k = va.css(a, "position"),
                    l = va(a),
                    m = {};
                "static" === k && (a.style.position = "relative"), h = l.offset(), f = va.css(a, "top"), i = va.css(a, "left"), (j = ("absolute" === k || "fixed" === k) && (f + i).indexOf("auto") > -1) ? (g = (d = l.position()).top, e = d.left) : (g = parseFloat(f) || 0, e = parseFloat(i) || 0), sa(b) && (b = b.call(a, c, va.extend({}, h))), null != b.top && (m.top = b.top - h.top + g), null != b.left && (m.left = b.left - h.left + e), "using" in b ? b.using.call(a, m) : l.css(m)
            }
        }, va.fn.extend({
            offset: function(a) {
                if (arguments.length) return void 0 === a ? this : this.each(function(b) {
                    va.offset.setOffset(this, a, b)
                });
                var b, c, d = this[0];
                return d ? d.getClientRects().length ? (b = d.getBoundingClientRect(), c = d.ownerDocument.defaultView, {
                    top: b.top + c.pageYOffset,
                    left: b.left + c.pageXOffset
                }) : {
                    top: 0,
                    left: 0
                } : void 0
            },
            position: function() {
                if (this[0]) {
                    var a, b, c, d = this[0],
                        e = {
                            top: 0,
                            left: 0
                        };
                    if ("fixed" === va.css(d, "position")) b = d.getBoundingClientRect();
                    else {
                        for (b = this.offset(), c = d.ownerDocument, a = d.offsetParent || c.documentElement; a && (a === c.body || a === c.documentElement) && "static" === va.css(a, "position");) a = a.parentNode;
                        a && a !== d && 1 === a.nodeType && ((e = va(a).offset()).top += va.css(a, "borderTopWidth", !0), e.left += va.css(a, "borderLeftWidth", !0))
                    }
                    return {
                        top: b.top - e.top - va.css(d, "marginTop", !0),
                        left: b.left - e.left - va.css(d, "marginLeft", !0)
                    }
                }
            },
            offsetParent: function() {
                return this.map(function() {
                    for (var a = this.offsetParent; a && "static" === va.css(a, "position");) a = a.offsetParent;
                    return a || ab
                })
            }
        }), va.each({
            scrollLeft: "pageXOffset",
            scrollTop: "pageYOffset"
        }, function(a, b) {
            var c = "pageYOffset" === b;
            va.fn[a] = function(d) {
                return Ja(this, function(a, d, e) {
                    var f;
                    return ta(a) ? f = a : 9 === a.nodeType && (f = a.defaultView), void 0 === e ? f ? f[b] : a[d] : void(f ? f.scrollTo(c ? f.pageXOffset : e, c ? e : f.pageYOffset) : a[d] = e)
                }, a, d, arguments.length)
            }
        }), va.each(["top", "left"], function(a, b) {
            va.cssHooks[b] = K(ra.pixelPosition, function(a, c) {
                if (c) return c = J(a, b), ib.test(c) ? va(a).position()[b] + "px" : c
            })
        }), va.each({
            Height: "height",
            Width: "width"
        }, function(a, b) {
            va.each({
                padding: "inner" + a,
                content: b,
                "": "outer" + a
            }, function(c, d) {
                va.fn[d] = function(e, f) {
                    var g = arguments.length && (c || "boolean" != typeof e),
                        h = c || (!0 === e || !0 === f ? "margin" : "border");
                    return Ja(this, function(b, c, e) {
                        var f;
                        return ta(b) ? 0 === d.indexOf("outer") ? b["inner" + a] : b.document.documentElement["client" + a] : 9 === b.nodeType ? (f = b.documentElement, Math.max(b.body["scroll" + a], f["scroll" + a], b.body["offset" + a], f["offset" + a], f["client" + a])) : void 0 === e ? va.css(b, c, h) : va.style(b, c, e, h)
                    }, b, g ? e : void 0, g)
                }
            })
        }), va.each("blur focus focusin focusout resize scroll click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup contextmenu".split(" "), function(a, b) {
            va.fn[b] = function(a, c) {
                return arguments.length > 0 ? this.on(b, null, a, c) : this.trigger(b)
            }
        }), va.fn.extend({
            hover: function(a, b) {
                return this.mouseenter(a).mouseleave(b || a)
            }
        }), va.fn.extend({
            bind: function(a, b, c) {
                return this.on(a, null, b, c)
            },
            unbind: function(a, b) {
                return this.off(a, null, b)
            },
            delegate: function(a, b, c, d) {
                return this.on(b, a, c, d)
            },
            undelegate: function(a, b, c) {
                return 1 === arguments.length ? this.off(a, "**") : this.off(b, a || "**", c)
            }
        }), va.proxy = function(a, b) {
            var c, d, e;
            if ("string" == typeof b && (c = a[b], b = a, a = c), sa(a)) return d = ia.call(arguments, 2), e = function() {
                return a.apply(b || this, d.concat(ia.call(arguments)))
            }, e.guid = a.guid = a.guid || va.guid++, e
        }, va.holdReady = function(a) {
            a ? va.readyWait++ : va.ready(!0)
        }, va.isArray = Array.isArray, va.parseJSON = JSON.parse, va.nodeName = f, va.isFunction = sa, va.isWindow = ta, va.camelCase = o, va.type = d, va.now = Date.now, va.isNumeric = function(a) {
            var b = va.type(a);
            return ("number" === b || "string" === b) && !isNaN(a - parseFloat(a))
        }, "function" == typeof define && define.amd && define("jquery", [], function() {
            return va
        });
        var Yb = a.jQuery,
            Zb = a.$;
        return va.noConflict = function(b) {
            return a.$ === va && (a.$ = Zb), b && a.jQuery === va && (a.jQuery = Yb), va
        }, b || (a.jQuery = a.$ = va), va
    }),
    function() {
        function a(a, b) {
            if (a !== b) {
                var c = null === a,
                    d = a === u,
                    e = a === a,
                    f = null === b,
                    g = b === u,
                    h = b === b;
                if (a > b && !f || !e || c && !g && h || d && h) return 1;
                if (a < b && !c || !h || f && !d && e || g && e) return -1
            }
            return 0
        }

        function b(a, b, c) {
            for (var d = a.length, e = c ? d : -1; c ? e-- : ++e < d;)
                if (b(a[e], e, a)) return e;
            return -1
        }

        function c(a, b, c) {
            if (b !== b) return m(a, c);
            c -= 1;
            for (var d = a.length; ++c < d;)
                if (a[c] === b) return c;
            return -1
        }

        function d(a) {
            return "function" == typeof a || !1
        }

        function e(a) {
            return null == a ? "" : a + ""
        }

        function f(a, b) {
            for (var c = -1, d = a.length; ++c < d && -1 < b.indexOf(a.charAt(c)););
            return c
        }

        function g(a, b) {
            for (var c = a.length; c-- && -1 < b.indexOf(a.charAt(c)););
            return c
        }

        function h(b, c) {
            return a(b.a, c.a) || b.b - c.b
        }

        function i(a) {
            return Ja[a]
        }

        function j(a) {
            return Ka[a]
        }

        function k(a, b, c) {
            return b ? a = Na[a] : c && (a = Oa[a]), "\\" + a
        }

        function l(a) {
            return "\\" + Oa[a]
        }

        function m(a, b, c) {
            var d = a.length;
            for (b += c ? 0 : -1; c ? b-- : ++b < d;) {
                var e = a[b];
                if (e !== e) return b
            }
            return -1
        }

        function n(a) {
            return !!a && "object" == typeof a
        }

        function o(a) {
            return 160 >= a && 9 <= a && 13 >= a || 32 == a || 160 == a || 5760 == a || 6158 == a || 8192 <= a && (8202 >= a || 8232 == a || 8233 == a || 8239 == a || 8287 == a || 12288 == a || 65279 == a)
        }

        function p(a, b) {
            for (var c = -1, d = a.length, e = -1, f = []; ++c < d;) a[c] === b && (a[c] = N, f[++e] = c);
            return f
        }

        function q(a) {
            for (var b = -1, c = a.length; ++b < c && o(a.charCodeAt(b)););
            return b
        }

        function r(a) {
            for (var b = a.length; b-- && o(a.charCodeAt(b)););
            return b
        }

        function s(a) {
            return La[a]
        }

        function t(o) {
            function Ja(a) {
                if (n(a) && !(Bf(a) || a instanceof Ma)) {
                    if (a instanceof La) return a;
                    if (_d.call(a, "__chain__") && _d.call(a, "__wrapped__")) return Pc(a)
                }
                return new La(a)
            }

            function Ka() {}

            function La(a, b, c) {
                this.__wrapped__ = a, this.__actions__ = c || [], this.__chain__ = !!b
            }

            function Ma(a) {
                this.__wrapped__ = a, this.__actions__ = [], this.__dir__ = 1, this.__filtered__ = !1, this.__iteratees__ = [], this.__takeCount__ = Ae, this.__views__ = []
            }

            function Na() {
                this.__data__ = {}
            }

            function Oa(a) {
                var b = a ? a.length : 0;
                for (this.data = {
                        hash: pe(null),
                        set: new je
                    }; b--;) this.push(a[b])
            }

            function Pa(a, b) {
                var c = a.data;
                return ("string" == typeof b || pd(b) ? c.set.has(b) : c.hash[b]) ? 0 : -1
            }

            function Qa(a, b) {
                var c = -1,
                    d = a.length;
                for (b || (b = Nd(d)); ++c < d;) b[c] = a[c];
                return b
            }

            function Ra(a, b) {
                for (var c = -1, d = a.length; ++c < d && !1 !== b(a[c], c, a););
                return a
            }

            function Sa(a, b) {
                for (var c = -1, d = a.length; ++c < d;)
                    if (!b(a[c], c, a)) return !1;
                return !0
            }

            function Ta(a, b) {
                for (var c = -1, d = a.length, e = -1, f = []; ++c < d;) {
                    var g = a[c];
                    b(g, c, a) && (f[++e] = g)
                }
                return f
            }

            function Wa(a, b) {
                for (var c = -1, d = a.length, e = Nd(d); ++c < d;) e[c] = b(a[c], c, a);
                return e
            }

            function Xa(a, b) {
                for (var c = -1, d = b.length, e = a.length; ++c < d;) a[e + c] = b[c];
                return a
            }

            function Ya(a, b, c, d) {
                var e = -1,
                    f = a.length;
                for (d && f && (c = a[++e]); ++e < f;) c = b(c, a[e], e, a);
                return c
            }

            function Za(a, b) {
                for (var c = -1, d = a.length; ++c < d;)
                    if (b(a[c], c, a)) return !0;
                return !1
            }

            function $a(a, b, c, d) {
                return a !== u && _d.call(d, c) ? a : b
            }

            function _a(a, b, c) {
                for (var d = -1, e = Mf(b), f = e.length; ++d < f;) {
                    var g = e[d],
                        h = a[g],
                        i = c(h, b[g], g, a, b);
                    (i === i ? i === h : h !== h) && (h !== u || g in a) || (a[g] = i)
                }
                return a
            }

            function ab(a, b) {
                return null == b ? a : cb(b, Mf(b), a)
            }

            function bb(a, b) {
                for (var c = -1, d = null == a, e = !d && Cc(a), f = e ? a.length : 0, g = b.length, h = Nd(g); ++c < g;) {
                    var i = b[c];
                    h[c] = e ? Dc(i, f) ? a[i] : u : d ? u : a[i]
                }
                return h
            }

            function cb(a, b, c) {
                c || (c = {});
                for (var d = -1, e = b.length; ++d < e;) {
                    var f = b[d];
                    c[f] = a[f]
                }
                return c
            }

            function db(a, b, c) {
                var d = typeof a;
                return "function" == d ? b === u ? a : Nb(a, b, c) : null == a ? Id : "object" == d ? ub(a) : b === u ? Md(a) : vb(a, b)
            }

            function eb(a, b, c, d, e, f, g) {
                var h;
                if (c && (h = e ? c(a, d, e) : c(a)), h !== u) return h;
                if (!pd(a)) return a;
                if (d = Bf(a)) {
                    if (h = yc(a), !b) return Qa(a, h)
                } else {
                    var i = be.call(a),
                        j = i == T;
                    if (i != V && i != O && (!j || e)) return Ia[i] ? Ac(a, i, b) : e ? a : {};
                    if (h = zc(j ? {} : a), !b) return ab(h, a)
                }
                for (f || (f = []), g || (g = []), e = f.length; e--;)
                    if (f[e] == a) return g[e];
                return f.push(a), g.push(h), (d ? Ra : nb)(a, function(d, e) {
                    h[e] = eb(d, b, c, e, a, f, g)
                }), h
            }

            function fb(a, b, c) {
                if ("function" != typeof a) throw new Wd(M);
                return ke(function() {
                    a.apply(u, c)
                }, b)
            }

            function gb(a, b) {
                var d = a ? a.length : 0,
                    e = [];
                if (!d) return e;
                var f = -1,
                    g = vc(),
                    h = g === c,
                    i = h && b.length >= J && pe && je ? new Oa(b) : null,
                    j = b.length;
                i && (g = Pa, h = !1, b = i);
                a: for (; ++f < d;)
                    if (i = a[f], h && i === i) {
                        for (var k = j; k--;)
                            if (b[k] === i) continue a;
                        e.push(i)
                    } else 0 > g(b, i, 0) && e.push(i);
                return e
            }

            function hb(a, b) {
                var c = !0;
                return He(a, function(a, d, e) {
                    return c = !!b(a, d, e)
                }), c
            }

            function ib(a, b, c, d) {
                var e = d,
                    f = e;
                return He(a, function(a, g, h) {
                    g = +b(a, g, h), (c(g, e) || g === d && g === f) && (e = g, f = a)
                }), f
            }

            function jb(a, b) {
                var c = [];
                return He(a, function(a, d, e) {
                    b(a, d, e) && c.push(a)
                }), c
            }

            function kb(a, b, c, d) {
                var e;
                return c(a, function(a, c, f) {
                    return b(a, c, f) ? (e = d ? c : a, !1) : void 0
                }), e
            }

            function lb(a, b, c, d) {
                d || (d = []);
                for (var e = -1, f = a.length; ++e < f;) {
                    var g = a[e];
                    n(g) && Cc(g) && (c || Bf(g) || ld(g)) ? b ? lb(g, b, c, d) : Xa(d, g) : c || (d[d.length] = g)
                }
                return d
            }

            function mb(a, b) {
                Je(a, b, Ad)
            }

            function nb(a, b) {
                return Je(a, b, Mf)
            }

            function ob(a, b) {
                return Ke(a, b, Mf)
            }

            function pb(a, b) {
                for (var c = -1, d = b.length, e = -1, f = []; ++c < d;) {
                    var g = b[c];
                    od(a[g]) && (f[++e] = g)
                }
                return f
            }

            function qb(a, b, c) {
                if (null != a) {
                    c !== u && c in Nc(a) && (b = [c]), c = 0;
                    for (var d = b.length; null != a && c < d;) a = a[b[c++]];
                    return c && c == d ? a : u
                }
            }

            function rb(a, b, c, d, e, f) {
                if (a === b) a = !0;
                else if (null == a || null == b || !pd(a) && !n(b)) a = a !== a && b !== b;
                else a: {
                    var g = rb,
                        h = Bf(a),
                        i = Bf(b),
                        j = P,
                        k = P;
                    h || (j = be.call(a), j == O ? j = V : j != V && (h = vd(a))), i || (k = be.call(b), k == O ? k = V : k != V && vd(b));
                    var l = j == V,
                        i = k == V,
                        k = j == k;
                    if (!k || h || l) {
                        if (!d && (j = l && _d.call(a, "__wrapped__"), i = i && _d.call(b, "__wrapped__"), j || i)) {
                            a = g(j ? a.value() : a, i ? b.value() : b, c, d, e, f);
                            break a
                        }
                        if (k) {
                            for (e || (e = []), f || (f = []), j = e.length; j--;)
                                if (e[j] == a) {
                                    a = f[j] == b;
                                    break a
                                }
                            e.push(a), f.push(b), a = (h ? qc : sc)(a, b, g, c, d, e, f), e.pop(), f.pop()
                        } else a = !1
                    } else a = rc(a, b, j)
                }
                return a
            }

            function sb(a, b, c) {
                var d = b.length,
                    e = d,
                    f = !c;
                if (null == a) return !e;
                for (a = Nc(a); d--;) {
                    var g = b[d];
                    if (f && g[2] ? g[1] !== a[g[0]] : !(g[0] in a)) return !1
                }
                for (; ++d < e;) {
                    var g = b[d],
                        h = g[0],
                        i = a[h],
                        j = g[1];
                    if (f && g[2]) {
                        if (i === u && !(h in a)) return !1
                    } else if (g = c ? c(i, j, h) : u, g === u ? !rb(j, i, c, !0) : !g) return !1
                }
                return !0
            }

            function tb(a, b) {
                var c = -1,
                    d = Cc(a) ? Nd(a.length) : [];
                return He(a, function(a, e, f) {
                    d[++c] = b(a, e, f)
                }), d
            }

            function ub(a) {
                var b = wc(a);
                if (1 == b.length && b[0][2]) {
                    var c = b[0][0],
                        d = b[0][1];
                    return function(a) {
                        return null != a && (a[c] === d && (d !== u || c in Nc(a)))
                    }
                }
                return function(a) {
                    return sb(a, b)
                }
            }

            function vb(a, b) {
                var c = Bf(a),
                    d = Fc(a) && b === b && !pd(b),
                    e = a + "";
                return a = Oc(a),
                    function(f) {
                        if (null == f) return !1;
                        var g = e;
                        if (f = Nc(f), !(!c && d || g in f)) {
                            if (f = 1 == a.length ? f : qb(f, Cb(a, 0, -1)), null == f) return !1;
                            g = Uc(a), f = Nc(f)
                        }
                        return f[g] === b ? b !== u || g in f : rb(b, f[g], u, !0)
                    }
            }

            function wb(a, b, c, d, e) {
                if (!pd(a)) return a;
                var f = Cc(b) && (Bf(b) || vd(b)),
                    g = f ? u : Mf(b);
                return Ra(g || b, function(h, i) {
                    if (g && (i = h, h = b[i]), n(h)) {
                        d || (d = []), e || (e = []);
                        a: {
                            for (var j = i, k = d, l = e, m = k.length, o = b[j]; m--;)
                                if (k[m] == o) {
                                    a[j] = l[m];
                                    break a
                                }
                            var m = a[j],
                                p = c ? c(m, o, j, a, b) : u,
                                q = p === u;
                            q && (p = o, Cc(o) && (Bf(o) || vd(o)) ? p = Bf(m) ? m : Cc(m) ? Qa(m) : [] : sd(o) || ld(o) ? p = ld(m) ? yd(m) : sd(m) ? m : {} : q = !1), k.push(o), l.push(p), q ? a[j] = wb(p, o, c, k, l) : (p === p ? p !== m : m === m) && (a[j] = p)
                        }
                    } else j = a[i], k = c ? c(j, h, i, a, b) : u, (l = k === u) && (k = h), k === u && (!f || i in a) || !l && (k === k ? k === j : j !== j) || (a[i] = k)
                }), a
            }

            function xb(a) {
                return function(b) {
                    return null == b ? u : b[a]
                }
            }

            function yb(a) {
                var b = a + "";
                return a = Oc(a),
                    function(c) {
                        return qb(c, a, b)
                    }
            }

            function zb(a, b) {
                for (var c = a ? b.length : 0; c--;) {
                    var d = b[c];
                    if (d != e && Dc(d)) {
                        var e = d;
                        le.call(a, d, 1)
                    }
                }
            }

            function Ab(a, b) {
                return a + qe(ye() * (b - a + 1))
            }

            function Bb(a, b, c, d, e) {
                return e(a, function(a, e, f) {
                    c = d ? (d = !1, a) : b(c, a, e, f)
                }), c
            }

            function Cb(a, b, c) {
                var d = -1,
                    e = a.length;
                for (b = null == b ? 0 : +b || 0, 0 > b && (b = -b > e ? 0 : e + b), c = c === u || c > e ? e : +c || 0, 0 > c && (c += e), e = b > c ? 0 : c - b >>> 0, b >>>= 0, c = Nd(e); ++d < e;) c[d] = a[d + b];
                return c
            }

            function Db(a, b) {
                var c;
                return He(a, function(a, d, e) {
                    return c = b(a, d, e), !c
                }), !!c
            }

            function Eb(a, b) {
                var c = a.length;
                for (a.sort(b); c--;) a[c] = a[c].c;
                return a
            }

            function Fb(b, c, d) {
                var e = tc(),
                    f = -1;
                return c = Wa(c, function(a) {
                    return e(a)
                }), b = tb(b, function(a) {
                    return {
                        a: Wa(c, function(b) {
                            return b(a)
                        }),
                        b: ++f,
                        c: a
                    }
                }), Eb(b, function(b, c) {
                    var e;
                    a: {
                        for (var f = -1, g = b.a, h = c.a, i = g.length, j = d.length; ++f < i;)
                            if (e = a(g[f], h[f])) {
                                if (f >= j) break a;
                                f = d[f], e *= "asc" === f || !0 === f ? 1 : -1;
                                break a
                            }
                        e = b.b - c.b
                    }
                    return e
                })
            }

            function Gb(a, b) {
                var c = 0;
                return He(a, function(a, d, e) {
                    c += +b(a, d, e) || 0
                }), c
            }

            function Hb(a, b) {
                var d = -1,
                    e = vc(),
                    f = a.length,
                    g = e === c,
                    h = g && f >= J,
                    i = h && pe && je ? new Oa((void 0)) : null,
                    j = [];
                i ? (e = Pa, g = !1) : (h = !1, i = b ? [] : j);
                a: for (; ++d < f;) {
                    var k = a[d],
                        l = b ? b(k, d, a) : k;
                    if (g && k === k) {
                        for (var m = i.length; m--;)
                            if (i[m] === l) continue a;
                        b && i.push(l), j.push(k)
                    } else 0 > e(i, l, 0) && ((b || h) && i.push(l), j.push(k))
                }
                return j
            }

            function Ib(a, b) {
                for (var c = -1, d = b.length, e = Nd(d); ++c < d;) e[c] = a[b[c]];
                return e
            }

            function Jb(a, b, c, d) {
                for (var e = a.length, f = d ? e : -1;
                    (d ? f-- : ++f < e) && b(a[f], f, a););
                return c ? Cb(a, d ? 0 : f, d ? f + 1 : e) : Cb(a, d ? f + 1 : 0, d ? e : f)
            }

            function Kb(a, b) {
                var c = a;
                c instanceof Ma && (c = c.value());
                for (var d = -1, e = b.length; ++d < e;) var f = b[d],
                    c = f.func.apply(f.thisArg, Xa([c], f.args));
                return c
            }

            function Lb(a, b, c) {
                var d = 0,
                    e = a ? a.length : d;
                if ("number" == typeof b && b === b && e <= Ce) {
                    for (; d < e;) {
                        var f = d + e >>> 1,
                            g = a[f];
                        (c ? g <= b : g < b) && null !== g ? d = f + 1 : e = f
                    }
                    return e
                }
                return Mb(a, b, Id, c)
            }

            function Mb(a, b, c, d) {
                b = c(b);
                for (var e = 0, f = a ? a.length : 0, g = b !== b, h = null === b, i = b === u; e < f;) {
                    var j = qe((e + f) / 2),
                        k = c(a[j]),
                        l = k !== u,
                        m = k === k;
                    (g ? m || d : h ? m && l && (d || null != k) : i ? m && (d || l) : null == k ? 0 : d ? k <= b : k < b) ? e = j + 1: f = j
                }
                return ve(f, Be)
            }

            function Nb(a, b, c) {
                if ("function" != typeof a) return Id;
                if (b === u) return a;
                switch (c) {
                    case 1:
                        return function(c) {
                            return a.call(b, c)
                        };
                    case 3:
                        return function(c, d, e) {
                            return a.call(b, c, d, e)
                        };
                    case 4:
                        return function(c, d, e, f) {
                            return a.call(b, c, d, e, f)
                        };
                    case 5:
                        return function(c, d, e, f, g) {
                            return a.call(b, c, d, e, f, g)
                        }
                }
                return function() {
                    return a.apply(b, arguments)
                }
            }

            function Ob(a) {
                var b = new ee(a.byteLength);
                return new me(b).set(new me(a)), b
            }

            function Pb(a, b, c) {
                for (var d = c.length, e = -1, f = ue(a.length - d, 0), g = -1, h = b.length, i = Nd(h + f); ++g < h;) i[g] = b[g];
                for (; ++e < d;) i[c[e]] = a[e];
                for (; f--;) i[g++] = a[e++];
                return i
            }

            function Qb(a, b, c) {
                for (var d = -1, e = c.length, f = -1, g = ue(a.length - e, 0), h = -1, i = b.length, j = Nd(g + i); ++f < g;) j[f] = a[f];
                for (g = f; ++h < i;) j[g + h] = b[h];
                for (; ++d < e;) j[g + c[d]] = a[f++];
                return j
            }

            function Rb(a, b) {
                return function(c, d, e) {
                    var f = b ? b() : {};
                    if (d = tc(d, e, 3), Bf(c)) {
                        e = -1;
                        for (var g = c.length; ++e < g;) {
                            var h = c[e];
                            a(f, h, d(h, e, c), c)
                        }
                    } else He(c, function(b, c, e) {
                        a(f, b, d(b, c, e), e)
                    });
                    return f
                }
            }

            function Sb(a) {
                return jd(function(b, c) {
                    var d = -1,
                        e = null == b ? 0 : c.length,
                        f = 2 < e ? c[e - 2] : u,
                        g = 2 < e ? c[2] : u,
                        h = 1 < e ? c[e - 1] : u;
                    for ("function" == typeof f ? (f = Nb(f, h, 5), e -= 2) : (f = "function" == typeof h ? h : u, e -= f ? 1 : 0), g && Ec(c[0], c[1], g) && (f = 3 > e ? u : f, e = 1); ++d < e;)(g = c[d]) && a(b, g, f);
                    return b
                })
            }

            function Tb(a, b) {
                return function(c, d) {
                    var e = c ? Ne(c) : 0;
                    if (!Hc(e)) return a(c, d);
                    for (var f = b ? e : -1, g = Nc(c);
                        (b ? f-- : ++f < e) && !1 !== d(g[f], f, g););
                    return c
                }
            }

            function Ub(a) {
                return function(b, c, d) {
                    var e = Nc(b);
                    d = d(b);
                    for (var f = d.length, g = a ? f : -1; a ? g-- : ++g < f;) {
                        var h = d[g];
                        if (!1 === c(e[h], h, e)) break
                    }
                    return b
                }
            }

            function Vb(a, b) {
                function c() {
                    return (this && this !== Ua && this instanceof c ? d : a).apply(b, arguments)
                }
                var d = Xb(a);
                return c
            }

            function Wb(a) {
                return function(b) {
                    var c = -1;
                    b = Gd(Dd(b));
                    for (var d = b.length, e = ""; ++c < d;) e = a(e, b[c], c);
                    return e
                }
            }

            function Xb(a) {
                return function() {
                    var b = arguments;
                    switch (b.length) {
                        case 0:
                            return new a;
                        case 1:
                            return new a(b[0]);
                        case 2:
                            return new a(b[0], b[1]);
                        case 3:
                            return new a(b[0], b[1], b[2]);
                        case 4:
                            return new a(b[0], b[1], b[2], b[3]);
                        case 5:
                            return new a(b[0], b[1], b[2], b[3], b[4]);
                        case 6:
                            return new a(b[0], b[1], b[2], b[3], b[4], b[5]);
                        case 7:
                            return new a(b[0], b[1], b[2], b[3], b[4], b[5], b[6])
                    }
                    var c = Ge(a.prototype),
                        b = a.apply(c, b);
                    return pd(b) ? b : c
                }
            }

            function Yb(a) {
                function b(c, d, e) {
                    return e && Ec(c, d, e) && (d = u), c = pc(c, a, u, u, u, u, u, d), c.placeholder = b.placeholder, c
                }
                return b
            }

            function Zb(a, b) {
                return jd(function(c) {
                    var d = c[0];
                    return null == d ? d : (c.push(b), a.apply(u, c))
                })
            }

            function $b(a, b) {
                return function(c, d, e) {
                    if (e && Ec(c, d, e) && (d = u), d = tc(d, e, 3), 1 == d.length) {
                        e = c = Bf(c) ? c : Mc(c);
                        for (var f = d, g = -1, h = e.length, i = b, j = i; ++g < h;) {
                            var k = e[g],
                                l = +f(k);
                            a(l, i) && (i = l, j = k)
                        }
                        if (e = j, !c.length || e !== b) return e
                    }
                    return ib(c, d, a, b)
                }
            }

            function _b(a, c) {
                return function(d, e, f) {
                    return e = tc(e, f, 3), Bf(d) ? (e = b(d, e, c), -1 < e ? d[e] : u) : kb(d, e, a)
                }
            }

            function ac(a) {
                return function(c, d, e) {
                    return c && c.length ? (d = tc(d, e, 3), b(c, d, a)) : -1
                }
            }

            function bc(a) {
                return function(b, c, d) {
                    return c = tc(c, d, 3), kb(b, c, a, !0)
                }
            }

            function cc(a) {
                return function() {
                    for (var b, c = arguments.length, d = a ? c : -1, e = 0, f = Nd(c); a ? d-- : ++d < c;) {
                        var g = f[e++] = arguments[d];
                        if ("function" != typeof g) throw new Wd(M);
                        !b && La.prototype.thru && "wrapper" == uc(g) && (b = new La([], (!0)))
                    }
                    for (d = b ? -1 : c; ++d < c;) {
                        var g = f[d],
                            e = uc(g),
                            h = "wrapper" == e ? Me(g) : u;
                        b = h && Gc(h[0]) && h[1] == (D | z | B | E) && !h[4].length && 1 == h[9] ? b[uc(h[0])].apply(b, h[3]) : 1 == g.length && Gc(g) ? b[e]() : b.thru(g)
                    }
                    return function() {
                        var a = arguments,
                            d = a[0];
                        if (b && 1 == a.length && Bf(d) && d.length >= J) return b.plant(d).value();
                        for (var e = 0, a = c ? f[e].apply(this, a) : d; ++e < c;) a = f[e].call(this, a);
                        return a
                    }
                }
            }

            function dc(a, b) {
                return function(c, d, e) {
                    return "function" == typeof d && e === u && Bf(c) ? a(c, d) : b(c, Nb(d, e, 3))
                }
            }

            function ec(a) {
                return function(b, c, d) {
                    return ("function" != typeof c || d !== u) && (c = Nb(c, d, 3)), a(b, c, Ad)
                }
            }

            function fc(a) {
                return function(b, c, d) {
                    return ("function" != typeof c || d !== u) && (c = Nb(c, d, 3)), a(b, c)
                }
            }

            function gc(a) {
                return function(b, c, d) {
                    var e = {};
                    return c = tc(c, d, 3), nb(b, function(b, d, f) {
                        f = c(b, d, f), d = a ? f : d, b = a ? b : f, e[d] = b
                    }), e
                }
            }

            function hc(a) {
                return function(b, c, d) {
                    return b = e(b), (a ? b : "") + lc(b, c, d) + (a ? "" : b)
                }
            }

            function ic(a) {
                var b = jd(function(c, d) {
                    var e = p(d, b.placeholder);
                    return pc(c, a, u, d, e)
                });
                return b
            }

            function jc(a, b) {
                return function(c, d, e, f) {
                    var g = 3 > arguments.length;
                    return "function" == typeof d && f === u && Bf(c) ? a(c, d, e, g) : Bb(c, tc(d, f, 4), e, g, b)
                }
            }

            function kc(a, b, c, d, e, f, g, h, i, j) {
                function k() {
                    for (var t = arguments.length, v = t, y = Nd(t); v--;) y[v] = arguments[v];
                    if (d && (y = Pb(y, d, e)), f && (y = Qb(y, f, g)), o || r) {
                        var v = k.placeholder,
                            z = p(y, v),
                            t = t - z.length;
                        if (t < j) {
                            var A = h ? Qa(h) : u,
                                t = ue(j - t, 0),
                                D = o ? z : u,
                                z = o ? u : z,
                                E = o ? y : u,
                                y = o ? u : y;
                            return b |= o ? B : C, b &= ~(o ? C : B), q || (b &= ~(w | x)), y = [a, b, c, E, D, y, z, A, i, t], A = kc.apply(u, y), Gc(a) && Oe(A, y), A.placeholder = v, A
                        }
                    }
                    if (v = m ? c : this, A = n ? v[a] : a, h)
                        for (t = y.length, D = ve(h.length, t), z = Qa(y); D--;) E = h[D], y[D] = Dc(E, t) ? z[E] : u;
                    return l && i < y.length && (y.length = i), this && this !== Ua && this instanceof k && (A = s || Xb(a)), A.apply(v, y)
                }
                var l = b & D,
                    m = b & w,
                    n = b & x,
                    o = b & z,
                    q = b & y,
                    r = b & A,
                    s = n ? u : Xb(a);
                return k
            }

            function lc(a, b, c) {
                return a = a.length, b = +b, a < b && se(b) ? (b -= a, c = null == c ? " " : c + "", Ed(c, oe(b / c.length)).slice(0, b)) : ""
            }

            function mc(a, b, c, d) {
                function e() {
                    for (var b = -1, h = arguments.length, i = -1, j = d.length, k = Nd(j + h); ++i < j;) k[i] = d[i];
                    for (; h--;) k[i++] = arguments[++b];
                    return (this && this !== Ua && this instanceof e ? g : a).apply(f ? c : this, k)
                }
                var f = b & w,
                    g = Xb(a);
                return e
            }

            function nc(a) {
                var b = Rd[a];
                return function(a, c) {
                    return (c = c === u ? 0 : +c || 0) ? (c = he(10, c), b(a * c) / c) : b(a)
                }
            }

            function oc(a) {
                return function(b, c, d, e) {
                    var f = tc(d);
                    return null == d && f === db ? Lb(b, c, a) : Mb(b, c, f(d, e, 1), a)
                }
            }

            function pc(a, b, c, d, e, f, g, h) {
                var i = b & x;
                if (!i && "function" != typeof a) throw new Wd(M);
                var j = d ? d.length : 0;
                if (j || (b &= ~(B | C), d = e = u), j -= e ? e.length : 0, b & C) {
                    var k = d,
                        l = e;
                    d = e = u
                }
                var m = i ? u : Me(a);
                return c = [a, b, c, d, e, k, l, f, g, h], m && (d = c[1], b = m[1], h = d | b, e = b == D && d == z || b == D && d == E && c[7].length <= m[8] || b == (D | E) && d == z, (h < D || e) && (b & w && (c[2] = m[2], h |= d & w ? 0 : y), (d = m[3]) && (e = c[3], c[3] = e ? Pb(e, d, m[4]) : Qa(d), c[4] = e ? p(c[3], N) : Qa(m[4])), (d = m[5]) && (e = c[5], c[5] = e ? Qb(e, d, m[6]) : Qa(d), c[6] = e ? p(c[5], N) : Qa(m[6])), (d = m[7]) && (c[7] = Qa(d)), b & D && (c[8] = null == c[8] ? m[8] : ve(c[8], m[8])), null == c[9] && (c[9] = m[9]), c[0] = m[0], c[1] = h), b = c[1], h = c[9]), c[9] = null == h ? i ? 0 : a.length : ue(h - j, 0) || 0, (m ? Le : Oe)(b == w ? Vb(c[0], c[2]) : b != B && b != (w | B) || c[4].length ? kc.apply(u, c) : mc.apply(u, c), c)
            }

            function qc(a, b, c, d, e, f, g) {
                var h = -1,
                    i = a.length,
                    j = b.length;
                if (i != j && (!e || j <= i)) return !1;
                for (; ++h < i;) {
                    var k = a[h],
                        j = b[h],
                        l = d ? d(e ? j : k, e ? k : j, h) : u;
                    if (l !== u) {
                        if (l) continue;
                        return !1
                    }
                    if (e) {
                        if (!Za(b, function(a) {
                                return k === a || c(k, a, d, e, f, g)
                            })) return !1
                    } else if (k !== j && !c(k, j, d, e, f, g)) return !1
                }
                return !0
            }

            function rc(a, b, c) {
                switch (c) {
                    case Q:
                    case R:
                        return +a == +b;
                    case S:
                        return a.name == b.name && a.message == b.message;
                    case U:
                        return a != +a ? b != +b : a == +b;
                    case W:
                    case X:
                        return a == b + ""
                }
                return !1
            }

            function sc(a, b, c, d, e, f, g) {
                var h = Mf(a),
                    i = h.length,
                    j = Mf(b).length;
                if (i != j && !e) return !1;
                for (j = i; j--;) {
                    var k = h[j];
                    if (!(e ? k in b : _d.call(b, k))) return !1
                }
                for (var l = e; ++j < i;) {
                    var k = h[j],
                        m = a[k],
                        n = b[k],
                        o = d ? d(e ? n : m, e ? m : n, k) : u;
                    if (o === u ? !c(m, n, d, e, f, g) : !o) return !1;
                    l || (l = "constructor" == k)
                }
                return !(!l && (c = a.constructor, d = b.constructor, c != d && "constructor" in a && "constructor" in b && !("function" == typeof c && c instanceof c && "function" == typeof d && d instanceof d)))
            }

            function tc(a, b, c) {
                var d = Ja.callback || Hd,
                    d = d === Hd ? db : d;
                return c ? d(a, b, c) : d
            }

            function uc(a) {
                for (var b = a.name + "", c = Fe[b], d = c ? c.length : 0; d--;) {
                    var e = c[d],
                        f = e.func;
                    if (null == f || f == a) return e.name
                }
                return b
            }

            function vc(a, b, d) {
                var e = Ja.indexOf || Tc,
                    e = e === Tc ? c : e;
                return a ? e(a, b, d) : e
            }

            function wc(a) {
                a = Bd(a);
                for (var b = a.length; b--;) {
                    var c = a[b][1];
                    a[b][2] = c === c && !pd(c)
                }
                return a
            }

            function xc(a, b) {
                var c = null == a ? u : a[b];
                return qd(c) ? c : u
            }

            function yc(a) {
                var b = a.length,
                    c = new a.constructor(b);
                return b && "string" == typeof a[0] && _d.call(a, "index") && (c.index = a.index, c.input = a.input), c
            }

            function zc(a) {
                return a = a.constructor, "function" == typeof a && a instanceof a || (a = Td), new a
            }

            function Ac(a, b, c) {
                var d = a.constructor;
                switch (b) {
                    case Y:
                        return Ob(a);
                    case Q:
                    case R:
                        return new d((+a));
                    case Z:
                    case $:
                    case _:
                    case aa:
                    case ba:
                    case ca:
                    case da:
                    case ea:
                    case fa:
                        return b = a.buffer, new d(c ? Ob(b) : b, a.byteOffset, a.length);
                    case U:
                    case X:
                        return new d(a);
                    case W:
                        var e = new d(a.source, ya.exec(a));
                        e.lastIndex = a.lastIndex
                }
                return e
            }

            function Bc(a, b, c) {
                return null == a || Fc(b, a) || (b = Oc(b), a = 1 == b.length ? a : qb(a, Cb(b, 0, -1)), b = Uc(b)), b = null == a ? a : a[b], null == b ? u : b.apply(a, c)
            }

            function Cc(a) {
                return null != a && Hc(Ne(a))
            }

            function Dc(a, b) {
                return a = "number" == typeof a || Ba.test(a) ? +a : -1, b = null == b ? De : b, -1 < a && 0 == a % 1 && a < b
            }

            function Ec(a, b, c) {
                if (!pd(c)) return !1;
                var d = typeof b;
                return !!("number" == d ? Cc(c) && Dc(b, c.length) : "string" == d && b in c) && (b = c[b], a === a ? a === b : b !== b)
            }

            function Fc(a, b) {
                var c = typeof a;
                return !!("string" == c && ra.test(a) || "number" == c) || !Bf(a) && (!qa.test(a) || null != b && a in Nc(b))
            }

            function Gc(a) {
                var b = uc(a),
                    c = Ja[b];
                return "function" == typeof c && b in Ma.prototype && (a === c || (b = Me(c), !!b && a === b[0]))
            }

            function Hc(a) {
                return "number" == typeof a && -1 < a && 0 == a % 1 && a <= De
            }

            function Ic(a, b) {
                return a === u ? b : Cf(a, b, Ic)
            }

            function Jc(a, b) {
                a = Nc(a);
                for (var c = -1, d = b.length, e = {}; ++c < d;) {
                    var f = b[c];
                    f in a && (e[f] = a[f])
                }
                return e
            }

            function Kc(a, b) {
                var c = {};
                return mb(a, function(a, d, e) {
                    b(a, d, e) && (c[d] = a)
                }), c
            }

            function Lc(a) {
                for (var b = Ad(a), c = b.length, d = c && a.length, e = !!d && Hc(d) && (Bf(a) || ld(a)), f = -1, g = []; ++f < c;) {
                    var h = b[f];
                    (e && Dc(h, d) || _d.call(a, h)) && g.push(h)
                }
                return g
            }

            function Mc(a) {
                return null == a ? [] : Cc(a) ? pd(a) ? a : Td(a) : Cd(a)
            }

            function Nc(a) {
                return pd(a) ? a : Td(a)
            }

            function Oc(a) {
                if (Bf(a)) return a;
                var b = [];
                return e(a).replace(sa, function(a, c, d, e) {
                    b.push(d ? e.replace(wa, "$1") : c || a)
                }), b
            }

            function Pc(a) {
                return a instanceof Ma ? a.clone() : new La(a.__wrapped__, a.__chain__, Qa(a.__actions__))
            }

            function Qc(a, b, c) {
                return a && a.length ? ((c ? Ec(a, b, c) : null == b) && (b = 1), Cb(a, 0 > b ? 0 : b)) : []
            }

            function Rc(a, b, c) {
                var d = a ? a.length : 0;
                return d ? ((c ? Ec(a, b, c) : null == b) && (b = 1), b = d - (+b || 0), Cb(a, 0, 0 > b ? 0 : b)) : []
            }

            function Sc(a) {
                return a ? a[0] : u
            }

            function Tc(a, b, d) {
                var e = a ? a.length : 0;
                if (!e) return -1;
                if ("number" == typeof d) d = 0 > d ? ue(e + d, 0) : d;
                else if (d) return d = Lb(a, b), d < e && (b === b ? b === a[d] : a[d] !== a[d]) ? d : -1;
                return c(a, b, d || 0)
            }

            function Uc(a) {
                var b = a ? a.length : 0;
                return b ? a[b - 1] : u
            }

            function Vc(a) {
                return Qc(a, 1)
            }

            function Wc(a, b, d, e) {
                if (!a || !a.length) return [];
                null != b && "boolean" != typeof b && (e = d, d = Ec(a, b, e) ? u : b, b = !1);
                var f = tc();
                if ((null != d || f !== db) && (d = f(d, e, 3)), b && vc() === c) {
                    b = d;
                    var g;
                    d = -1, e = a.length;
                    for (var f = -1, h = []; ++d < e;) {
                        var i = a[d],
                            j = b ? b(i, d, a) : i;
                        d && g === j || (g = j, h[++f] = i)
                    }
                    a = h
                } else a = Hb(a, d);
                return a
            }

            function Xc(a) {
                if (!a || !a.length) return [];
                var b = -1,
                    c = 0;
                a = Ta(a, function(a) {
                    return Cc(a) ? (c = ue(a.length, c), !0) : void 0
                });
                for (var d = Nd(c); ++b < c;) d[b] = Wa(a, xb(b));
                return d
            }

            function Yc(a, b, c) {
                return a && a.length ? (a = Xc(a), null == b ? a : (b = Nb(b, c, 4), Wa(a, function(a) {
                    return Ya(a, b, u, !0)
                }))) : []
            }

            function Zc(a, b) {
                var c = -1,
                    d = a ? a.length : 0,
                    e = {};
                for (!d || b || Bf(a[0]) || (b = []); ++c < d;) {
                    var f = a[c];
                    b ? e[f] = b[c] : f && (e[f[0]] = f[1])
                }
                return e
            }

            function $c(a) {
                return a = Ja(a), a.__chain__ = !0, a
            }

            function _c(a, b, c) {
                return b.call(c, a)
            }

            function ad(a, b, c) {
                var d = Bf(a) ? Sa : hb;
                return c && Ec(a, b, c) && (b = u), ("function" != typeof b || c !== u) && (b = tc(b, c, 3)), d(a, b)
            }

            function bd(a, b, c) {
                var d = Bf(a) ? Ta : jb;
                return b = tc(b, c, 3), d(a, b)
            }

            function cd(a, b, c, d) {
                var e = a ? Ne(a) : 0;
                return Hc(e) || (a = Cd(a), e = a.length), c = "number" != typeof c || d && Ec(b, c, d) ? 0 : 0 > c ? ue(e + c, 0) : c || 0, "string" == typeof a || !Bf(a) && ud(a) ? c <= e && -1 < a.indexOf(b, c) : !!e && -1 < vc(a, b, c)
            }

            function dd(a, b, c) {
                var d = Bf(a) ? Wa : tb;
                return b = tc(b, c, 3), d(a, b)
            }

            function ed(a, b, c) {
                if (c ? Ec(a, b, c) : null == b) {
                    a = Mc(a);
                    var d = a.length;
                    return 0 < d ? a[Ab(0, d - 1)] : u
                }
                c = -1, a = xd(a);
                var d = a.length,
                    e = d - 1;
                for (b = ve(0 > b ? 0 : +b || 0, d); ++c < b;) {
                    var d = Ab(c, e),
                        f = a[d];
                    a[d] = a[c], a[c] = f
                }
                return a.length = b, a
            }

            function fd(a, b, c) {
                var d = Bf(a) ? Za : Db;
                return c && Ec(a, b, c) && (b = u), ("function" != typeof b || c !== u) && (b = tc(b, c, 3)), d(a, b)
            }

            function gd(a, b) {
                var c;
                if ("function" != typeof b) {
                    if ("function" != typeof a) throw new Wd(M);
                    var d = a;
                    a = b, b = d
                }
                return function() {
                    return 0 < --a && (c = b.apply(this, arguments)), 1 >= a && (b = u), c
                }
            }

            function hd(a, b, c) {
                function d(b, c) {
                    c && fe(c), i = m = n = u, b && (o = nf(), j = a.apply(l, h), m || i || (h = l = u))
                }

                function e() {
                    var a = b - (nf() - k);
                    0 >= a || a > b ? d(n, i) : m = ke(e, a)
                }

                function f() {
                    d(q, m)
                }

                function g() {
                    if (h = arguments, k = nf(), l = this, n = q && (m || !r), !1 === p) var c = r && !m;
                    else {
                        i || r || (o = k);
                        var d = p - (k - o),
                            g = 0 >= d || d > p;
                        g ? (i && (i = fe(i)), o = k, j = a.apply(l, h)) : i || (i = ke(f, d))
                    }
                    return g && m ? m = fe(m) : m || b === p || (m = ke(e, b)), c && (g = !0, j = a.apply(l, h)), !g || m || i || (h = l = u), j
                }
                var h, i, j, k, l, m, n, o = 0,
                    p = !1,
                    q = !0;
                if ("function" != typeof a) throw new Wd(M);
                if (b = 0 > b ? 0 : +b || 0, !0 === c) var r = !0,
                    q = !1;
                else pd(c) && (r = !!c.leading, p = "maxWait" in c && ue(+c.maxWait || 0, b), q = "trailing" in c ? !!c.trailing : q);
                return g.cancel = function() {
                    m && fe(m), i && fe(i), o = 0, i = m = n = u
                }, g
            }

            function id(a, b) {
                function c() {
                    var d = arguments,
                        e = b ? b.apply(this, d) : d[0],
                        f = c.cache;
                    return f.has(e) ? f.get(e) : (d = a.apply(this, d), c.cache = f.set(e, d), d)
                }
                if ("function" != typeof a || b && "function" != typeof b) throw new Wd(M);
                return c.cache = new id.Cache, c
            }

            function jd(a, b) {
                if ("function" != typeof a) throw new Wd(M);
                return b = ue(b === u ? a.length - 1 : +b || 0, 0),
                    function() {
                        for (var c = arguments, d = -1, e = ue(c.length - b, 0), f = Nd(e); ++d < e;) f[d] = c[b + d];
                        switch (b) {
                            case 0:
                                return a.call(this, f);
                            case 1:
                                return a.call(this, c[0], f);
                            case 2:
                                return a.call(this, c[0], c[1], f)
                        }
                        for (e = Nd(b + 1), d = -1; ++d < b;) e[d] = c[d];
                        return e[b] = f, a.apply(this, e)
                    }
            }

            function kd(a, b) {
                return a > b
            }

            function ld(a) {
                return n(a) && Cc(a) && _d.call(a, "callee") && !ie.call(a, "callee")
            }

            function md(a, b, c, d) {
                return d = (c = "function" == typeof c ? Nb(c, d, 3) : u) ? c(a, b) : u, d === u ? rb(a, b, c) : !!d
            }

            function nd(a) {
                return n(a) && "string" == typeof a.message && be.call(a) == S
            }

            function od(a) {
                return pd(a) && be.call(a) == T
            }

            function pd(a) {
                var b = typeof a;
                return !!a && ("object" == b || "function" == b)
            }

            function qd(a) {
                return null != a && (od(a) ? de.test($d.call(a)) : n(a) && Aa.test(a))
            }

            function rd(a) {
                return "number" == typeof a || n(a) && be.call(a) == U
            }

            function sd(a) {
                var b;
                if (!n(a) || be.call(a) != V || ld(a) || !(_d.call(a, "constructor") || (b = a.constructor, "function" != typeof b || b instanceof b))) return !1;
                var c;
                return mb(a, function(a, b) {
                    c = b
                }), c === u || _d.call(a, c)
            }

            function td(a) {
                return pd(a) && be.call(a) == W
            }

            function ud(a) {
                return "string" == typeof a || n(a) && be.call(a) == X
            }

            function vd(a) {
                return n(a) && Hc(a.length) && !!Ha[be.call(a)]
            }

            function wd(a, b) {
                return a < b
            }

            function xd(a) {
                var b = a ? Ne(a) : 0;
                return Hc(b) ? b ? Qa(a) : [] : Cd(a)
            }

            function yd(a) {
                return cb(a, Ad(a))
            }

            function zd(a) {
                return pb(a, Ad(a))
            }

            function Ad(a) {
                if (null == a) return [];
                pd(a) || (a = Td(a));
                for (var b = a.length, b = b && Hc(b) && (Bf(a) || ld(a)) && b || 0, c = a.constructor, d = -1, c = "function" == typeof c && c.prototype === a, e = Nd(b), f = 0 < b; ++d < b;) e[d] = d + "";
                for (var g in a) f && Dc(g, b) || "constructor" == g && (c || !_d.call(a, g)) || e.push(g);
                return e
            }

            function Bd(a) {
                a = Nc(a);
                for (var b = -1, c = Mf(a), d = c.length, e = Nd(d); ++b < d;) {
                    var f = c[b];
                    e[b] = [f, a[f]]
                }
                return e
            }

            function Cd(a) {
                return Ib(a, Mf(a))
            }

            function Dd(a) {
                return (a = e(a)) && a.replace(Ca, i).replace(va, "")
            }

            function Ed(a, b) {
                var c = "";
                if (a = e(a), b = +b, 1 > b || !a || !se(b)) return c;
                do b % 2 && (c += a), b = qe(b / 2), a += a; while (b);
                return c
            }

            function Fd(a, b, c) {
                var d = a;
                return (a = e(a)) ? (c ? Ec(d, b, c) : null == b) ? a.slice(q(a), r(a) + 1) : (b += "", a.slice(f(a, b), g(a, b) + 1)) : a
            }

            function Gd(a, b, c) {
                return c && Ec(a, b, c) && (b = u), a = e(a), a.match(b || Fa) || []
            }

            function Hd(a, b, c) {
                return c && Ec(a, b, c) && (b = u), n(a) ? Jd(a) : db(a, b)
            }

            function Id(a) {
                return a
            }

            function Jd(a) {
                return ub(eb(a, !0))
            }

            function Kd(a, b, c) {
                if (null == c) {
                    var d = pd(b),
                        e = d ? Mf(b) : u;
                    ((e = e && e.length ? pb(b, e) : u) ? e.length : d) || (e = !1, c = b, b = a, a = this)
                }
                e || (e = pb(b, Mf(b)));
                var f = !0,
                    d = -1,
                    g = od(a),
                    h = e.length;
                !1 === c ? f = !1 : pd(c) && "chain" in c && (f = c.chain);
                for (; ++d < h;) {
                    c = e[d];
                    var i = b[c];
                    a[c] = i, g && (a.prototype[c] = function(b) {
                        return function() {
                            var c = this.__chain__;
                            if (f || c) {
                                var d = a(this.__wrapped__);
                                return (d.__actions__ = Qa(this.__actions__)).push({
                                    func: b,
                                    args: arguments,
                                    thisArg: a
                                }), d.__chain__ = c, d
                            }
                            return b.apply(a, Xa([this.value()], arguments))
                        }
                    }(i))
                }
                return a
            }

            function Ld() {}

            function Md(a) {
                return Fc(a) ? xb(a) : yb(a)
            }
            o = o ? Va.defaults(Ua.Object(), o, Va.pick(Ua, Ga)) : Ua;
            var Nd = o.Array,
                Od = o.Date,
                Pd = o.Error,
                Qd = o.Function,
                Rd = o.Math,
                Sd = o.Number,
                Td = o.Object,
                Ud = o.RegExp,
                Vd = o.String,
                Wd = o.TypeError,
                Xd = Nd.prototype,
                Yd = Td.prototype,
                Zd = Vd.prototype,
                $d = Qd.prototype.toString,
                _d = Yd.hasOwnProperty,
                ae = 0,
                be = Yd.toString,
                ce = Ua._,
                de = Ud("^" + $d.call(_d).replace(/[\\^$.*+?()[\]{}|]/g, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"),
                ee = o.ArrayBuffer,
                fe = o.clearTimeout,
                ge = o.parseFloat,
                he = Rd.pow,
                ie = Yd.propertyIsEnumerable,
                je = xc(o, "Set"),
                ke = o.setTimeout,
                le = Xd.splice,
                me = o.Uint8Array,
                ne = xc(o, "WeakMap"),
                oe = Rd.ceil,
                pe = xc(Td, "create"),
                qe = Rd.floor,
                re = xc(Nd, "isArray"),
                se = o.isFinite,
                te = xc(Td, "keys"),
                ue = Rd.max,
                ve = Rd.min,
                we = xc(Od, "now"),
                xe = o.parseInt,
                ye = Rd.random,
                ze = Sd.NEGATIVE_INFINITY,
                Ae = Sd.POSITIVE_INFINITY,
                Be = 4294967294,
                Ce = 2147483647,
                De = 9007199254740991,
                Ee = ne && new ne,
                Fe = {};
            Ja.support = {}, Ja.templateSettings = {
                escape: na,
                evaluate: oa,
                interpolate: pa,
                variable: "",
                imports: {
                    _: Ja
                }
            };
            var Ge = function() {
                    function a() {}
                    return function(b) {
                        if (pd(b)) {
                            a.prototype = b;
                            var c = new a;
                            a.prototype = u
                        }
                        return c || {}
                    }
                }(),
                He = Tb(nb),
                Ie = Tb(ob, !0),
                Je = Ub(),
                Ke = Ub(!0),
                Le = Ee ? function(a, b) {
                    return Ee.set(a, b), a
                } : Id,
                Me = Ee ? function(a) {
                    return Ee.get(a)
                } : Ld,
                Ne = xb("length"),
                Oe = function() {
                    var a = 0,
                        b = 0;
                    return function(c, d) {
                        var e = nf(),
                            f = I - (e - b);
                        if (b = e, 0 < f) {
                            if (++a >= H) return c
                        } else a = 0;
                        return Le(c, d)
                    }
                }(),
                Pe = jd(function(a, b) {
                    return n(a) && Cc(a) ? gb(a, lb(b, !1, !0)) : []
                }),
                Qe = ac(),
                Re = ac(!0),
                Se = jd(function(a) {
                    for (var b = a.length, d = b, e = Nd(k), f = vc(), g = f === c, h = []; d--;) {
                        var i = a[d] = Cc(i = a[d]) ? i : [];
                        e[d] = g && 120 <= i.length && pe && je ? new Oa(d && i) : null
                    }
                    var g = a[0],
                        j = -1,
                        k = g ? g.length : 0,
                        l = e[0];
                    a: for (; ++j < k;)
                        if (i = g[j], 0 > (l ? Pa(l, i) : f(h, i, 0))) {
                            for (d = b; --d;) {
                                var m = e[d];
                                if (0 > (m ? Pa(m, i) : f(a[d], i, 0))) continue a
                            }
                            l && l.push(i), h.push(i)
                        }
                    return h
                }),
                Te = jd(function(b, c) {
                    c = lb(c);
                    var d = bb(b, c);
                    return zb(b, c.sort(a)), d
                }),
                Ue = oc(),
                Ve = oc(!0),
                We = jd(function(a) {
                    return Hb(lb(a, !1, !0))
                }),
                Xe = jd(function(a, b) {
                    return Cc(a) ? gb(a, b) : []
                }),
                Ye = jd(Xc),
                Ze = jd(function(a) {
                    var b = a.length,
                        c = 2 < b ? a[b - 2] : u,
                        d = 1 < b ? a[b - 1] : u;
                    return 2 < b && "function" == typeof c ? b -= 2 : (c = 1 < b && "function" == typeof d ? (--b, d) : u, d = u), a.length = b, Yc(a, c, d)
                }),
                $e = jd(function(a) {
                    return a = lb(a), this.thru(function(b) {
                        b = Bf(b) ? b : [Nc(b)];
                        for (var c = a, d = -1, e = b.length, f = -1, g = c.length, h = Nd(e + g); ++d < e;) h[d] = b[d];
                        for (; ++f < g;) h[d++] = c[f];
                        return h
                    })
                }),
                _e = jd(function(a, b) {
                    return bb(a, lb(b))
                }),
                af = Rb(function(a, b, c) {
                    _d.call(a, c) ? ++a[c] : a[c] = 1
                }),
                bf = _b(He),
                cf = _b(Ie, !0),
                df = dc(Ra, He),
                ef = dc(function(a, b) {
                    for (var c = a.length; c-- && !1 !== b(a[c], c, a););
                    return a
                }, Ie),
                ff = Rb(function(a, b, c) {
                    _d.call(a, c) ? a[c].push(b) : a[c] = [b]
                }),
                gf = Rb(function(a, b, c) {
                    a[c] = b
                }),
                hf = jd(function(a, b, c) {
                    var d = -1,
                        e = "function" == typeof b,
                        f = Fc(b),
                        g = Cc(a) ? Nd(a.length) : [];
                    return He(a, function(a) {
                        var h = e ? b : f && null != a ? a[b] : u;
                        g[++d] = h ? h.apply(a, c) : Bc(a, b, c)
                    }), g
                }),
                jf = Rb(function(a, b, c) {
                    a[c ? 0 : 1].push(b)
                }, function() {
                    return [
                        [],
                        []
                    ]
                }),
                kf = jc(Ya, He),
                lf = jc(function(a, b, c, d) {
                    var e = a.length;
                    for (d && e && (c = a[--e]); e--;) c = b(c, a[e], e, a);
                    return c
                }, Ie),
                mf = jd(function(a, b) {
                    if (null == a) return [];
                    var c = b[2];
                    return c && Ec(b[0], b[1], c) && (b.length = 1), Fb(a, lb(b), [])
                }),
                nf = we || function() {
                    return (new Od).getTime()
                },
                of = jd(function(a, b, c) {
                    var d = w;
                    if (c.length) var e = p(c, of.placeholder),
                        d = d | B;
                    return pc(a, d, b, c, e)
                }),
                pf = jd(function(a, b) {
                    b = b.length ? lb(b) : zd(a);
                    for (var c = -1, d = b.length; ++c < d;) {
                        var e = b[c];
                        a[e] = pc(a[e], w, a)
                    }
                    return a
                }),
                qf = jd(function(a, b, c) {
                    var d = w | x;
                    if (c.length) var e = p(c, qf.placeholder),
                        d = d | B;
                    return pc(b, d, a, c, e)
                }),
                rf = Yb(z),
                sf = Yb(A),
                tf = jd(function(a, b) {
                    return fb(a, 1, b)
                }),
                uf = jd(function(a, b, c) {
                    return fb(a, b, c)
                }),
                vf = cc(),
                wf = cc(!0),
                xf = jd(function(a, b) {
                    if (b = lb(b), "function" != typeof a || !Sa(b, d)) throw new Wd(M);
                    var c = b.length;
                    return jd(function(d) {
                        for (var e = ve(d.length, c); e--;) d[e] = b[e](d[e]);
                        return a.apply(this, d)
                    })
                }),
                yf = ic(B),
                zf = ic(C),
                Af = jd(function(a, b) {
                    return pc(a, E, u, u, u, lb(b))
                }),
                Bf = re || function(a) {
                    return n(a) && Hc(a.length) && be.call(a) == P
                },
                Cf = Sb(wb),
                Df = Sb(function(a, b, c) {
                    return c ? _a(a, b, c) : ab(a, b)
                }),
                Ef = Zb(Df, function(a, b) {
                    return a === u ? b : a
                }),
                Ff = Zb(Cf, Ic),
                Gf = bc(nb),
                Hf = bc(ob),
                If = ec(Je),
                Jf = ec(Ke),
                Kf = fc(nb),
                Lf = fc(ob),
                Mf = te ? function(a) {
                    var b = null == a ? u : a.constructor;
                    return "function" == typeof b && b.prototype === a || "function" != typeof a && Cc(a) ? Lc(a) : pd(a) ? te(a) : []
                } : Lc,
                Nf = gc(!0),
                Of = gc(),
                Pf = jd(function(a, b) {
                    if (null == a) return {};
                    if ("function" != typeof b[0]) return b = Wa(lb(b), Vd), Jc(a, gb(Ad(a), b));
                    var c = Nb(b[0], b[1], 3);
                    return Kc(a, function(a, b, d) {
                        return !c(a, b, d)
                    })
                }),
                Qf = jd(function(a, b) {
                    return null == a ? {} : "function" == typeof b[0] ? Kc(a, Nb(b[0], b[1], 3)) : Jc(a, lb(b))
                }),
                Rf = Wb(function(a, b, c) {
                    return b = b.toLowerCase(), a + (c ? b.charAt(0).toUpperCase() + b.slice(1) : b)
                }),
                Sf = Wb(function(a, b, c) {
                    return a + (c ? "-" : "") + b.toLowerCase()
                }),
                Tf = hc(),
                Uf = hc(!0),
                Vf = Wb(function(a, b, c) {
                    return a + (c ? "_" : "") + b.toLowerCase()
                }),
                Wf = Wb(function(a, b, c) {
                    return a + (c ? " " : "") + (b.charAt(0).toUpperCase() + b.slice(1))
                }),
                Xf = jd(function(a, b) {
                    try {
                        return a.apply(u, b)
                    } catch (c) {
                        return nd(c) ? c : new Pd(c)
                    }
                }),
                Yf = jd(function(a, b) {
                    return function(c) {
                        return Bc(c, a, b)
                    }
                }),
                Zf = jd(function(a, b) {
                    return function(c) {
                        return Bc(a, c, b)
                    }
                }),
                $f = nc("ceil"),
                _f = nc("floor"),
                ag = $b(kd, ze),
                bg = $b(wd, Ae),
                cg = nc("round");
            return Ja.prototype = Ka.prototype, La.prototype = Ge(Ka.prototype), La.prototype.constructor = La, Ma.prototype = Ge(Ka.prototype), Ma.prototype.constructor = Ma, Na.prototype["delete"] = function(a) {
                    return this.has(a) && delete this.__data__[a]
                }, Na.prototype.get = function(a) {
                    return "__proto__" == a ? u : this.__data__[a]
                }, Na.prototype.has = function(a) {
                    return "__proto__" != a && _d.call(this.__data__, a)
                }, Na.prototype.set = function(a, b) {
                    return "__proto__" != a && (this.__data__[a] = b), this
                }, Oa.prototype.push = function(a) {
                    var b = this.data;
                    "string" == typeof a || pd(a) ? b.set.add(a) : b.hash[a] = !0
                }, id.Cache = Na, Ja.after = function(a, b) {
                    if ("function" != typeof b) {
                        if ("function" != typeof a) throw new Wd(M);
                        var c = a;
                        a = b, b = c
                    }
                    return a = se(a = +a) ? a : 0,
                        function() {
                            return 1 > --a ? b.apply(this, arguments) : void 0
                        }
                }, Ja.ary = function(a, b, c) {
                    return c && Ec(a, b, c) && (b = u), b = a && null == b ? a.length : ue(+b || 0, 0), pc(a, D, u, u, u, u, b)
                }, Ja.assign = Df, Ja.at = _e, Ja.before = gd, Ja.bind = of, Ja.bindAll = pf, Ja.bindKey = qf, Ja.callback = Hd, Ja.chain = $c, Ja.chunk = function(a, b, c) {
                    b = (c ? Ec(a, b, c) : null == b) ? 1 : ue(qe(b) || 1, 1), c = 0;
                    for (var d = a ? a.length : 0, e = -1, f = Nd(oe(d / b)); c < d;) f[++e] = Cb(a, c, c += b);
                    return f
                }, Ja.compact = function(a) {
                    for (var b = -1, c = a ? a.length : 0, d = -1, e = []; ++b < c;) {
                        var f = a[b];
                        f && (e[++d] = f)
                    }
                    return e
                }, Ja.constant = function(a) {
                    return function() {
                        return a
                    }
                }, Ja.countBy = af, Ja.create = function(a, b, c) {
                    var d = Ge(a);
                    return c && Ec(a, b, c) && (b = u), b ? ab(d, b) : d
                }, Ja.curry = rf, Ja.curryRight = sf, Ja.debounce = hd, Ja.defaults = Ef, Ja.defaultsDeep = Ff, Ja.defer = tf, Ja.delay = uf, Ja.difference = Pe, Ja.drop = Qc, Ja.dropRight = Rc, Ja.dropRightWhile = function(a, b, c) {
                    return a && a.length ? Jb(a, tc(b, c, 3), !0, !0) : []
                }, Ja.dropWhile = function(a, b, c) {
                    return a && a.length ? Jb(a, tc(b, c, 3), !0) : []
                }, Ja.fill = function(a, b, c, d) {
                    var e = a ? a.length : 0;
                    if (!e) return [];
                    for (c && "number" != typeof c && Ec(a, b, c) && (c = 0, d = e), e = a.length, c = null == c ? 0 : +c || 0, 0 > c && (c = -c > e ? 0 : e + c), d = d === u || d > e ? e : +d || 0, 0 > d && (d += e), e = c > d ? 0 : d >>> 0, c >>>= 0; c < e;) a[c++] = b;
                    return a
                }, Ja.filter = bd, Ja.flatten = function(a, b, c) {
                    var d = a ? a.length : 0;
                    return c && Ec(a, b, c) && (b = !1), d ? lb(a, b) : []
                }, Ja.flattenDeep = function(a) {
                    return a && a.length ? lb(a, !0) : []
                }, Ja.flow = vf, Ja.flowRight = wf, Ja.forEach = df, Ja.forEachRight = ef, Ja.forIn = If, Ja.forInRight = Jf, Ja.forOwn = Kf, Ja.forOwnRight = Lf, Ja.functions = zd, Ja.groupBy = ff, Ja.indexBy = gf, Ja.initial = function(a) {
                    return Rc(a, 1)
                }, Ja.intersection = Se, Ja.invert = function(a, b, c) {
                    c && Ec(a, b, c) && (b = u), c = -1;
                    for (var d = Mf(a), e = d.length, f = {}; ++c < e;) {
                        var g = d[c],
                            h = a[g];
                        b ? _d.call(f, h) ? f[h].push(g) : f[h] = [g] : f[h] = g
                    }
                    return f
                }, Ja.invoke = hf, Ja.keys = Mf, Ja.keysIn = Ad, Ja.map = dd, Ja.mapKeys = Nf, Ja.mapValues = Of, Ja.matches = Jd, Ja.matchesProperty = function(a, b) {
                    return vb(a, eb(b, !0))
                }, Ja.memoize = id, Ja.merge = Cf, Ja.method = Yf, Ja.methodOf = Zf, Ja.mixin = Kd, Ja.modArgs = xf, Ja.negate = function(a) {
                    if ("function" != typeof a) throw new Wd(M);
                    return function() {
                        return !a.apply(this, arguments)
                    }
                }, Ja.omit = Pf, Ja.once = function(a) {
                    return gd(2, a)
                }, Ja.pairs = Bd, Ja.partial = yf, Ja.partialRight = zf, Ja.partition = jf, Ja.pick = Qf, Ja.pluck = function(a, b) {
                    return dd(a, Md(b))
                }, Ja.property = Md, Ja.propertyOf = function(a) {
                    return function(b) {
                        return qb(a, Oc(b), b + "")
                    }
                }, Ja.pull = function() {
                    var a = arguments,
                        b = a[0];
                    if (!b || !b.length) return b;
                    for (var c = 0, d = vc(), e = a.length; ++c < e;)
                        for (var f = 0, g = a[c]; - 1 < (f = d(b, g, f));) le.call(b, f, 1);
                    return b
                }, Ja.pullAt = Te, Ja.range = function(a, b, c) {
                    c && Ec(a, b, c) && (b = c = u), a = +a || 0, c = null == c ? 1 : +c || 0, null == b ? (b = a, a = 0) : b = +b || 0;
                    var d = -1;
                    b = ue(oe((b - a) / (c || 1)), 0);
                    for (var e = Nd(b); ++d < b;) e[d] = a, a += c;
                    return e
                }, Ja.rearg = Af, Ja.reject = function(a, b, c) {
                    var d = Bf(a) ? Ta : jb;
                    return b = tc(b, c, 3), d(a, function(a, c, d) {
                        return !b(a, c, d)
                    })
                }, Ja.remove = function(a, b, c) {
                    var d = [];
                    if (!a || !a.length) return d;
                    var e = -1,
                        f = [],
                        g = a.length;
                    for (b = tc(b, c, 3); ++e < g;) c = a[e], b(c, e, a) && (d.push(c), f.push(e));
                    return zb(a, f), d
                }, Ja.rest = Vc, Ja.restParam = jd, Ja.set = function(a, b, c) {
                    if (null == a) return a;
                    var d = b + "";
                    b = null != a[d] || Fc(b, a) ? [d] : Oc(b);
                    for (var d = -1, e = b.length, f = e - 1, g = a; null != g && ++d < e;) {
                        var h = b[d];
                        pd(g) && (d == f ? g[h] = c : null == g[h] && (g[h] = Dc(b[d + 1]) ? [] : {})), g = g[h]
                    }
                    return a
                }, Ja.shuffle = function(a) {
                    return ed(a, Ae)
                }, Ja.slice = function(a, b, c) {
                    var d = a ? a.length : 0;
                    return d ? (c && "number" != typeof c && Ec(a, b, c) && (b = 0, c = d), Cb(a, b, c)) : []
                }, Ja.sortBy = function(a, b, c) {
                    if (null == a) return [];
                    c && Ec(a, b, c) && (b = u);
                    var d = -1;
                    return b = tc(b, c, 3), a = tb(a, function(a, c, e) {
                        return {
                            a: b(a, c, e),
                            b: ++d,
                            c: a
                        }
                    }), Eb(a, h)
                }, Ja.sortByAll = mf, Ja.sortByOrder = function(a, b, c, d) {
                    return null == a ? [] : (d && Ec(b, c, d) && (c = u), Bf(b) || (b = null == b ? [] : [b]), Bf(c) || (c = null == c ? [] : [c]), Fb(a, b, c))
                }, Ja.spread = function(a) {
                    if ("function" != typeof a) throw new Wd(M);
                    return function(b) {
                        return a.apply(this, b)
                    }
                }, Ja.take = function(a, b, c) {
                    return a && a.length ? ((c ? Ec(a, b, c) : null == b) && (b = 1), Cb(a, 0, 0 > b ? 0 : b)) : []
                }, Ja.takeRight = function(a, b, c) {
                    var d = a ? a.length : 0;
                    return d ? ((c ? Ec(a, b, c) : null == b) && (b = 1), b = d - (+b || 0), Cb(a, 0 > b ? 0 : b)) : []
                }, Ja.takeRightWhile = function(a, b, c) {
                    return a && a.length ? Jb(a, tc(b, c, 3), !1, !0) : []
                }, Ja.takeWhile = function(a, b, c) {
                    return a && a.length ? Jb(a, tc(b, c, 3)) : []
                },
                Ja.tap = function(a, b, c) {
                    return b.call(c, a), a
                }, Ja.throttle = function(a, b, c) {
                    var d = !0,
                        e = !0;
                    if ("function" != typeof a) throw new Wd(M);
                    return !1 === c ? d = !1 : pd(c) && (d = "leading" in c ? !!c.leading : d, e = "trailing" in c ? !!c.trailing : e), hd(a, b, {
                        leading: d,
                        maxWait: +b,
                        trailing: e
                    })
                }, Ja.thru = _c, Ja.times = function(a, b, c) {
                    if (a = qe(a), 1 > a || !se(a)) return [];
                    var d = -1,
                        e = Nd(ve(a, 4294967295));
                    for (b = Nb(b, c, 1); ++d < a;) 4294967295 > d ? e[d] = b(d) : b(d);
                    return e
                }, Ja.toArray = xd, Ja.toPlainObject = yd, Ja.transform = function(a, b, c, d) {
                    var e = Bf(a) || vd(a);
                    return b = tc(b, d, 4), null == c && (e || pd(a) ? (d = a.constructor, c = e ? Bf(a) ? new d : [] : Ge(od(d) ? d.prototype : u)) : c = {}), (e ? Ra : nb)(a, function(a, d, e) {
                        return b(c, a, d, e)
                    }), c
                }, Ja.union = We, Ja.uniq = Wc, Ja.unzip = Xc, Ja.unzipWith = Yc, Ja.values = Cd, Ja.valuesIn = function(a) {
                    return Ib(a, Ad(a))
                }, Ja.where = function(a, b) {
                    return bd(a, ub(b))
                }, Ja.without = Xe, Ja.wrap = function(a, b) {
                    return b = null == b ? Id : b, pc(b, B, u, [a], [])
                }, Ja.xor = function() {
                    for (var a = -1, b = arguments.length; ++a < b;) {
                        var c = arguments[a];
                        if (Cc(c)) var d = d ? Xa(gb(d, c), gb(c, d)) : c
                    }
                    return d ? Hb(d) : []
                }, Ja.zip = Ye, Ja.zipObject = Zc, Ja.zipWith = Ze, Ja.backflow = wf, Ja.collect = dd, Ja.compose = wf, Ja.each = df, Ja.eachRight = ef, Ja.extend = Df, Ja.iteratee = Hd, Ja.methods = zd, Ja.object = Zc, Ja.select = bd, Ja.tail = Vc, Ja.unique = Wc, Kd(Ja, Ja), Ja.add = function(a, b) {
                    return (+a || 0) + (+b || 0)
                }, Ja.attempt = Xf, Ja.camelCase = Rf, Ja.capitalize = function(a) {
                    return (a = e(a)) && a.charAt(0).toUpperCase() + a.slice(1)
                }, Ja.ceil = $f, Ja.clone = function(a, b, c, d) {
                    return b && "boolean" != typeof b && Ec(a, b, c) ? b = !1 : "function" == typeof b && (d = c, c = b, b = !1), "function" == typeof c ? eb(a, b, Nb(c, d, 3)) : eb(a, b)
                }, Ja.cloneDeep = function(a, b, c) {
                    return "function" == typeof b ? eb(a, !0, Nb(b, c, 3)) : eb(a, !0)
                }, Ja.deburr = Dd, Ja.endsWith = function(a, b, c) {
                    a = e(a), b += "";
                    var d = a.length;
                    return c = c === u ? d : ve(0 > c ? 0 : +c || 0, d), c -= b.length, 0 <= c && a.indexOf(b, c) == c
                }, Ja.escape = function(a) {
                    return (a = e(a)) && ma.test(a) ? a.replace(ka, j) : a
                }, Ja.escapeRegExp = function(a) {
                    return (a = e(a)) && ua.test(a) ? a.replace(ta, k) : a || "(?:)"
                }, Ja.every = ad, Ja.find = bf, Ja.findIndex = Qe, Ja.findKey = Gf, Ja.findLast = cf, Ja.findLastIndex = Re, Ja.findLastKey = Hf, Ja.findWhere = function(a, b) {
                    return bf(a, ub(b))
                }, Ja.first = Sc, Ja.floor = _f, Ja.get = function(a, b, c) {
                    return a = null == a ? u : qb(a, Oc(b), b + ""), a === u ? c : a
                }, Ja.gt = kd, Ja.gte = function(a, b) {
                    return a >= b
                }, Ja.has = function(a, b) {
                    if (null == a) return !1;
                    var c = _d.call(a, b);
                    if (!c && !Fc(b)) {
                        if (b = Oc(b), a = 1 == b.length ? a : qb(a, Cb(b, 0, -1)), null == a) return !1;
                        b = Uc(b), c = _d.call(a, b)
                    }
                    return c || Hc(a.length) && Dc(b, a.length) && (Bf(a) || ld(a))
                }, Ja.identity = Id, Ja.includes = cd, Ja.indexOf = Tc, Ja.inRange = function(a, b, c) {
                    return b = +b || 0, c === u ? (c = b, b = 0) : c = +c || 0, a >= ve(b, c) && a < ue(b, c)
                }, Ja.isArguments = ld, Ja.isArray = Bf, Ja.isBoolean = function(a) {
                    return !0 === a || !1 === a || n(a) && be.call(a) == Q
                }, Ja.isDate = function(a) {
                    return n(a) && be.call(a) == R
                }, Ja.isElement = function(a) {
                    return !!a && 1 === a.nodeType && n(a) && !sd(a)
                }, Ja.isEmpty = function(a) {
                    return null == a || (Cc(a) && (Bf(a) || ud(a) || ld(a) || n(a) && od(a.splice)) ? !a.length : !Mf(a).length)
                }, Ja.isEqual = md, Ja.isError = nd, Ja.isFinite = function(a) {
                    return "number" == typeof a && se(a)
                }, Ja.isFunction = od, Ja.isMatch = function(a, b, c, d) {
                    return c = "function" == typeof c ? Nb(c, d, 3) : u, sb(a, wc(b), c)
                }, Ja.isNaN = function(a) {
                    return rd(a) && a != +a
                }, Ja.isNative = qd, Ja.isNull = function(a) {
                    return null === a
                }, Ja.isNumber = rd, Ja.isObject = pd, Ja.isPlainObject = sd, Ja.isRegExp = td, Ja.isString = ud, Ja.isTypedArray = vd, Ja.isUndefined = function(a) {
                    return a === u
                }, Ja.kebabCase = Sf, Ja.last = Uc, Ja.lastIndexOf = function(a, b, c) {
                    var d = a ? a.length : 0;
                    if (!d) return -1;
                    var e = d;
                    if ("number" == typeof c) e = (0 > c ? ue(d + c, 0) : ve(c || 0, d - 1)) + 1;
                    else if (c) return e = Lb(a, b, !0) - 1, a = a[e], (b === b ? b === a : a !== a) ? e : -1;
                    if (b !== b) return m(a, e, !0);
                    for (; e--;)
                        if (a[e] === b) return e;
                    return -1
                }, Ja.lt = wd, Ja.lte = function(a, b) {
                    return a <= b
                }, Ja.max = ag, Ja.min = bg, Ja.noConflict = function() {
                    return Ua._ = ce, this
                }, Ja.noop = Ld, Ja.now = nf, Ja.pad = function(a, b, c) {
                    a = e(a), b = +b;
                    var d = a.length;
                    return d < b && se(b) ? (d = (b - d) / 2, b = qe(d), d = oe(d), c = lc("", d, c), c.slice(0, b) + a + c) : a
                }, Ja.padLeft = Tf, Ja.padRight = Uf, Ja.parseInt = function(a, b, c) {
                    return (c ? Ec(a, b, c) : null == b) ? b = 0 : b && (b = +b), a = Fd(a), xe(a, b || (za.test(a) ? 16 : 10))
                }, Ja.random = function(a, b, c) {
                    c && Ec(a, b, c) && (b = c = u);
                    var d = null == a,
                        e = null == b;
                    return null == c && (e && "boolean" == typeof a ? (c = a, a = 1) : "boolean" == typeof b && (c = b, e = !0)), d && e && (b = 1, e = !1), a = +a || 0, e ? (b = a, a = 0) : b = +b || 0, c || a % 1 || b % 1 ? (c = ye(), ve(a + c * (b - a + ge("1e-" + ((c + "").length - 1))), b)) : Ab(a, b)
                }, Ja.reduce = kf, Ja.reduceRight = lf, Ja.repeat = Ed, Ja.result = function(a, b, c) {
                    var d = null == a ? u : a[b];
                    return d === u && (null == a || Fc(b, a) || (b = Oc(b), a = 1 == b.length ? a : qb(a, Cb(b, 0, -1)), d = null == a ? u : a[Uc(b)]), d = d === u ? c : d), od(d) ? d.call(a) : d
                }, Ja.round = cg, Ja.runInContext = t, Ja.size = function(a) {
                    var b = a ? Ne(a) : 0;
                    return Hc(b) ? b : Mf(a).length
                }, Ja.snakeCase = Vf, Ja.some = fd, Ja.sortedIndex = Ue, Ja.sortedLastIndex = Ve, Ja.startCase = Wf, Ja.startsWith = function(a, b, c) {
                    return a = e(a), c = null == c ? 0 : ve(0 > c ? 0 : +c || 0, a.length), a.lastIndexOf(b, c) == c
                }, Ja.sum = function(a, b, c) {
                    if (c && Ec(a, b, c) && (b = u), b = tc(b, c, 3), 1 == b.length) {
                        a = Bf(a) ? a : Mc(a), c = a.length;
                        for (var d = 0; c--;) d += +b(a[c]) || 0;
                        a = d
                    } else a = Gb(a, b);
                    return a
                }, Ja.template = function(a, b, c) {
                    var d = Ja.templateSettings;
                    c && Ec(a, b, c) && (b = c = u), a = e(a), b = _a(ab({}, c || b), d, $a), c = _a(ab({}, b.imports), d.imports, $a);
                    var f, g, h = Mf(c),
                        i = Ib(c, h),
                        j = 0;
                    c = b.interpolate || Da;
                    var k = "__p+='";
                    c = Ud((b.escape || Da).source + "|" + c.source + "|" + (c === pa ? xa : Da).source + "|" + (b.evaluate || Da).source + "|$", "g");
                    var m = "sourceURL" in b ? "//# sourceURL=" + b.sourceURL + "\n" : "";
                    if (a.replace(c, function(b, c, d, e, h, i) {
                            return d || (d = e), k += a.slice(j, i).replace(Ea, l), c && (f = !0, k += "'+__e(" + c + ")+'"), h && (g = !0, k += "';" + h + ";\n__p+='"), d && (k += "'+((__t=(" + d + "))==null?'':__t)+'"), j = i + b.length, b
                        }), k += "';", (b = b.variable) || (k = "with(obj){" + k + "}"), k = (g ? k.replace(ga, "") : k).replace(ha, "$1").replace(ia, "$1;"), k = "function(" + (b || "obj") + "){" + (b ? "" : "obj||(obj={});") + "var __t,__p=''" + (f ? ",__e=_.escape" : "") + (g ? ",__j=Array.prototype.join;function print(){__p+=__j.call(arguments,'')}" : ";") + k + "return __p}", b = Xf(function() {
                            return Qd(h, m + "return " + k).apply(u, i)
                        }), b.source = k, nd(b)) throw b;
                    return b
                }, Ja.trim = Fd, Ja.trimLeft = function(a, b, c) {
                    var d = a;
                    return (a = e(a)) ? a.slice((c ? Ec(d, b, c) : null == b) ? q(a) : f(a, b + "")) : a
                }, Ja.trimRight = function(a, b, c) {
                    var d = a;
                    return (a = e(a)) ? (c ? Ec(d, b, c) : null == b) ? a.slice(0, r(a) + 1) : a.slice(0, g(a, b + "") + 1) : a
                }, Ja.trunc = function(a, b, c) {
                    c && Ec(a, b, c) && (b = u);
                    var d = F;
                    if (c = G, null != b)
                        if (pd(b)) {
                            var f = "separator" in b ? b.separator : f,
                                d = "length" in b ? +b.length || 0 : d;
                            c = "omission" in b ? e(b.omission) : c
                        } else d = +b || 0;
                    if (a = e(a), d >= a.length) return a;
                    if (d -= c.length, 1 > d) return c;
                    if (b = a.slice(0, d), null == f) return b + c;
                    if (td(f)) {
                        if (a.slice(d).search(f)) {
                            var g, h = a.slice(0, d);
                            for (f.global || (f = Ud(f.source, (ya.exec(f) || "") + "g")), f.lastIndex = 0; a = f.exec(h);) g = a.index;
                            b = b.slice(0, null == g ? d : g)
                        }
                    } else a.indexOf(f, d) != d && (f = b.lastIndexOf(f), -1 < f && (b = b.slice(0, f)));
                    return b + c
                }, Ja.unescape = function(a) {
                    return (a = e(a)) && la.test(a) ? a.replace(ja, s) : a
                }, Ja.uniqueId = function(a) {
                    var b = ++ae;
                    return e(a) + b
                }, Ja.words = Gd, Ja.all = ad, Ja.any = fd, Ja.contains = cd, Ja.eq = md, Ja.detect = bf, Ja.foldl = kf, Ja.foldr = lf, Ja.head = Sc, Ja.include = cd, Ja.inject = kf, Kd(Ja, function() {
                    var a = {};
                    return nb(Ja, function(b, c) {
                        Ja.prototype[c] || (a[c] = b)
                    }), a
                }(), !1), Ja.sample = ed, Ja.prototype.sample = function(a) {
                    return this.__chain__ || null != a ? this.thru(function(b) {
                        return ed(b, a)
                    }) : ed(this.value())
                }, Ja.VERSION = v, Ra("bind bindKey curry curryRight partial partialRight".split(" "), function(a) {
                    Ja[a].placeholder = Ja
                }), Ra(["drop", "take"], function(a, b) {
                    Ma.prototype[a] = function(c) {
                        var d = this.__filtered__;
                        if (d && !b) return new Ma(this);
                        c = null == c ? 1 : ue(qe(c) || 0, 0);
                        var e = this.clone();
                        return d ? e.__takeCount__ = ve(e.__takeCount__, c) : e.__views__.push({
                            size: c,
                            type: a + (0 > e.__dir__ ? "Right" : "")
                        }), e
                    }, Ma.prototype[a + "Right"] = function(b) {
                        return this.reverse()[a](b).reverse()
                    }
                }), Ra(["filter", "map", "takeWhile"], function(a, b) {
                    var c = b + 1,
                        d = c != L;
                    Ma.prototype[a] = function(a, b) {
                        var e = this.clone();
                        return e.__iteratees__.push({
                            iteratee: tc(a, b, 1),
                            type: c
                        }), e.__filtered__ = e.__filtered__ || d, e
                    }
                }), Ra(["first", "last"], function(a, b) {
                    var c = "take" + (b ? "Right" : "");
                    Ma.prototype[a] = function() {
                        return this[c](1).value()[0]
                    }
                }), Ra(["initial", "rest"], function(a, b) {
                    var c = "drop" + (b ? "" : "Right");
                    Ma.prototype[a] = function() {
                        return this.__filtered__ ? new Ma(this) : this[c](1)
                    }
                }), Ra(["pluck", "where"], function(a, b) {
                    var c = b ? "filter" : "map",
                        d = b ? ub : Md;
                    Ma.prototype[a] = function(a) {
                        return this[c](d(a))
                    }
                }), Ma.prototype.compact = function() {
                    return this.filter(Id)
                }, Ma.prototype.reject = function(a, b) {
                    return a = tc(a, b, 1), this.filter(function(b) {
                        return !a(b)
                    })
                }, Ma.prototype.slice = function(a, b) {
                    a = null == a ? 0 : +a || 0;
                    var c = this;
                    return c.__filtered__ && (0 < a || 0 > b) ? new Ma(c) : (0 > a ? c = c.takeRight(-a) : a && (c = c.drop(a)), b !== u && (b = +b || 0, c = 0 > b ? c.dropRight(-b) : c.take(b - a)), c)
                }, Ma.prototype.takeRightWhile = function(a, b) {
                    return this.reverse().takeWhile(a, b).reverse()
                }, Ma.prototype.toArray = function() {
                    return this.take(Ae)
                }, nb(Ma.prototype, function(a, b) {
                    var c = /^(?:filter|map|reject)|While$/.test(b),
                        d = /^(?:first|last)$/.test(b),
                        e = Ja[d ? "take" + ("last" == b ? "Right" : "") : b];
                    e && (Ja.prototype[b] = function() {
                        function b(a) {
                            return d && g ? e(a, 1)[0] : e.apply(u, Xa([a], f))
                        }
                        var f = d ? [1] : arguments,
                            g = this.__chain__,
                            h = this.__wrapped__,
                            i = !!this.__actions__.length,
                            j = h instanceof Ma,
                            k = f[0],
                            l = j || Bf(h);
                        return l && c && "function" == typeof k && 1 != k.length && (j = l = !1), k = {
                            func: _c,
                            args: [b],
                            thisArg: u
                        }, i = j && !i, d && !g ? i ? (h = h.clone(), h.__actions__.push(k), a.call(h)) : e.call(u, this.value())[0] : !d && l ? (h = i ? h : new Ma(this), h = a.apply(h, f), h.__actions__.push(k), new La(h, g)) : this.thru(b)
                    })
                }), Ra("join pop push replace shift sort splice split unshift".split(" "), function(a) {
                    var b = (/^(?:replace|split)$/.test(a) ? Zd : Xd)[a],
                        c = /^(?:push|sort|unshift)$/.test(a) ? "tap" : "thru",
                        d = /^(?:join|pop|replace|shift)$/.test(a);
                    Ja.prototype[a] = function() {
                        var a = arguments;
                        return d && !this.__chain__ ? b.apply(this.value(), a) : this[c](function(c) {
                            return b.apply(c, a)
                        })
                    }
                }), nb(Ma.prototype, function(a, b) {
                    var c = Ja[b];
                    if (c) {
                        var d = c.name + "";
                        (Fe[d] || (Fe[d] = [])).push({
                            name: b,
                            func: c
                        })
                    }
                }), Fe[kc(u, x).name] = [{
                    name: "wrapper",
                    func: u
                }], Ma.prototype.clone = function() {
                    var a = new Ma(this.__wrapped__);
                    return a.__actions__ = Qa(this.__actions__), a.__dir__ = this.__dir__, a.__filtered__ = this.__filtered__, a.__iteratees__ = Qa(this.__iteratees__), a.__takeCount__ = this.__takeCount__, a.__views__ = Qa(this.__views__), a
                }, Ma.prototype.reverse = function() {
                    if (this.__filtered__) {
                        var a = new Ma(this);
                        a.__dir__ = -1, a.__filtered__ = !0
                    } else a = this.clone(), a.__dir__ *= -1;
                    return a
                }, Ma.prototype.value = function() {
                    var a, b = this.__wrapped__.value(),
                        c = this.__dir__,
                        d = Bf(b),
                        e = 0 > c,
                        f = d ? b.length : 0;
                    a = f;
                    for (var g = this.__views__, h = 0, i = -1, j = g.length; ++i < j;) {
                        var k = g[i],
                            l = k.size;
                        switch (k.type) {
                            case "drop":
                                h += l;
                                break;
                            case "dropRight":
                                a -= l;
                                break;
                            case "take":
                                a = ve(a, h + l);
                                break;
                            case "takeRight":
                                h = ue(h, a - l)
                        }
                    }
                    if (a = {
                            start: h,
                            end: a
                        }, g = a.start, h = a.end, a = h - g, e = e ? h : g - 1, g = this.__iteratees__, h = g.length, i = 0, j = ve(a, this.__takeCount__), !d || f < J || f == a && j == a) return Kb(b, this.__actions__);
                    d = [];
                    a: for (; a-- && i < j;) {
                        for (e += c, f = -1, k = b[e]; ++f < h;) {
                            var m = g[f],
                                l = m.type,
                                m = m.iteratee(k);
                            if (l == L) k = m;
                            else if (!m) {
                                if (l == K) continue a;
                                break a
                            }
                        }
                        d[i++] = k
                    }
                    return d
                }, Ja.prototype.chain = function() {
                    return $c(this)
                }, Ja.prototype.commit = function() {
                    return new La(this.value(), this.__chain__)
                }, Ja.prototype.concat = $e, Ja.prototype.plant = function(a) {
                    for (var b, c = this; c instanceof Ka;) {
                        var d = Pc(c);
                        b ? e.__wrapped__ = d : b = d;
                        var e = d,
                            c = c.__wrapped__
                    }
                    return e.__wrapped__ = a, b
                }, Ja.prototype.reverse = function() {
                    function a(a) {
                        return a.reverse()
                    }
                    var b = this.__wrapped__;
                    return b instanceof Ma ? (this.__actions__.length && (b = new Ma(this)), b = b.reverse(), b.__actions__.push({
                        func: _c,
                        args: [a],
                        thisArg: u
                    }), new La(b, this.__chain__)) : this.thru(a)
                }, Ja.prototype.toString = function() {
                    return this.value() + ""
                }, Ja.prototype.run = Ja.prototype.toJSON = Ja.prototype.valueOf = Ja.prototype.value = function() {
                    return Kb(this.__wrapped__, this.__actions__)
                }, Ja.prototype.collect = Ja.prototype.map, Ja.prototype.head = Ja.prototype.first, Ja.prototype.select = Ja.prototype.filter, Ja.prototype.tail = Ja.prototype.rest, Ja
        }
        var u, v = "3.10.1",
            w = 1,
            x = 2,
            y = 4,
            z = 8,
            A = 16,
            B = 32,
            C = 64,
            D = 128,
            E = 256,
            F = 30,
            G = "...",
            H = 150,
            I = 16,
            J = 200,
            K = 1,
            L = 2,
            M = "Expected a function",
            N = "__lodash_placeholder__",
            O = "[object Arguments]",
            P = "[object Array]",
            Q = "[object Boolean]",
            R = "[object Date]",
            S = "[object Error]",
            T = "[object Function]",
            U = "[object Number]",
            V = "[object Object]",
            W = "[object RegExp]",
            X = "[object String]",
            Y = "[object ArrayBuffer]",
            Z = "[object Float32Array]",
            $ = "[object Float64Array]",
            _ = "[object Int8Array]",
            aa = "[object Int16Array]",
            ba = "[object Int32Array]",
            ca = "[object Uint8Array]",
            da = "[object Uint8ClampedArray]",
            ea = "[object Uint16Array]",
            fa = "[object Uint32Array]",
            ga = /\b__p\+='';/g,
            ha = /\b(__p\+=)''\+/g,
            ia = /(__e\(.*?\)|\b__t\))\+'';/g,
            ja = /&(?:amp|lt|gt|quot|#39|#96);/g,
            ka = /[&<>"'`]/g,
            la = RegExp(ja.source),
            ma = RegExp(ka.source),
            na = /<%-([\s\S]+?)%>/g,
            oa = /<%([\s\S]+?)%>/g,
            pa = /<%=([\s\S]+?)%>/g,
            qa = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\n\\]|\\.)*?\1)\]/,
            ra = /^\w*$/,
            sa = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\n\\]|\\.)*?)\2)\]/g,
            ta = /^[:!,]|[\\^$.*+?()[\]{}|\/]|(^[0-9a-fA-Fnrtuvx])|([\n\r\u2028\u2029])/g,
            ua = RegExp(ta.source),
            va = /[\u0300-\u036f\ufe20-\ufe23]/g,
            wa = /\\(\\)?/g,
            xa = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g,
            ya = /\w*$/,
            za = /^0[xX]/,
            Aa = /^\[object .+?Constructor\]$/,
            Ba = /^\d+$/,
            Ca = /[\xc0-\xd6\xd8-\xde\xdf-\xf6\xf8-\xff]/g,
            Da = /($^)/,
            Ea = /['\n\r\u2028\u2029\\]/g,
            Fa = RegExp("[A-Z\\xc0-\\xd6\\xd8-\\xde]+(?=[A-Z\\xc0-\\xd6\\xd8-\\xde][a-z\\xdf-\\xf6\\xf8-\\xff]+)|[A-Z\\xc0-\\xd6\\xd8-\\xde]?[a-z\\xdf-\\xf6\\xf8-\\xff]+|[A-Z\\xc0-\\xd6\\xd8-\\xde]+|[0-9]+", "g"),
            Ga = "Array ArrayBuffer Date Error Float32Array Float64Array Function Int8Array Int16Array Int32Array Math Number Object RegExp Set String _ clearTimeout isFinite parseFloat parseInt setTimeout TypeError Uint8Array Uint8ClampedArray Uint16Array Uint32Array WeakMap".split(" "),
            Ha = {};
        Ha[Z] = Ha[$] = Ha[_] = Ha[aa] = Ha[ba] = Ha[ca] = Ha[da] = Ha[ea] = Ha[fa] = !0, Ha[O] = Ha[P] = Ha[Y] = Ha[Q] = Ha[R] = Ha[S] = Ha[T] = Ha["[object Map]"] = Ha[U] = Ha[V] = Ha[W] = Ha["[object Set]"] = Ha[X] = Ha["[object WeakMap]"] = !1;
        var Ia = {};
        Ia[O] = Ia[P] = Ia[Y] = Ia[Q] = Ia[R] = Ia[Z] = Ia[$] = Ia[_] = Ia[aa] = Ia[ba] = Ia[U] = Ia[V] = Ia[W] = Ia[X] = Ia[ca] = Ia[da] = Ia[ea] = Ia[fa] = !0, Ia[S] = Ia[T] = Ia["[object Map]"] = Ia["[object Set]"] = Ia["[object WeakMap]"] = !1;
        var Ja = {
                "À": "A",
                "Á": "A",
                "Â": "A",
                "Ã": "A",
                "Ä": "A",
                "Å": "A",
                "à": "a",
                "á": "a",
                "â": "a",
                "ã": "a",
                "ä": "a",
                "å": "a",
                "Ç": "C",
                "ç": "c",
                "Ð": "D",
                "ð": "d",
                "È": "E",
                "É": "E",
                "Ê": "E",
                "Ë": "E",
                "è": "e",
                "é": "e",
                "ê": "e",
                "ë": "e",
                "Ì": "I",
                "Í": "I",
                "Î": "I",
                "Ï": "I",
                "ì": "i",
                "í": "i",
                "î": "i",
                "ï": "i",
                "Ñ": "N",
                "ñ": "n",
                "Ò": "O",
                "Ó": "O",
                "Ô": "O",
                "Õ": "O",
                "Ö": "O",
                "Ø": "O",
                "ò": "o",
                "ó": "o",
                "ô": "o",
                "õ": "o",
                "ö": "o",
                "ø": "o",
                "Ù": "U",
                "Ú": "U",
                "Û": "U",
                "Ü": "U",
                "ù": "u",
                "ú": "u",
                "û": "u",
                "ü": "u",
                "Ý": "Y",
                "ý": "y",
                "ÿ": "y",
                "Æ": "Ae",
                "æ": "ae",
                "Þ": "Th",
                "þ": "th",
                "ß": "ss"
            },
            Ka = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
                "`": "&#96;"
            },
            La = {
                "&amp;": "&",
                "&lt;": "<",
                "&gt;": ">",
                "&quot;": '"',
                "&#39;": "'",
                "&#96;": "`"
            },
            Ma = {
                "function": !0,
                object: !0
            },
            Na = {
                0: "x30",
                1: "x31",
                2: "x32",
                3: "x33",
                4: "x34",
                5: "x35",
                6: "x36",
                7: "x37",
                8: "x38",
                9: "x39",
                A: "x41",
                B: "x42",
                C: "x43",
                D: "x44",
                E: "x45",
                F: "x46",
                a: "x61",
                b: "x62",
                c: "x63",
                d: "x64",
                e: "x65",
                f: "x66",
                n: "x6e",
                r: "x72",
                t: "x74",
                u: "x75",
                v: "x76",
                x: "x78"
            },
            Oa = {
                "\\": "\\",
                "'": "'",
                "\n": "n",
                "\r": "r",
                "\u2028": "u2028",
                "\u2029": "u2029"
            },
            Pa = Ma[typeof exports] && exports && !exports.nodeType && exports,
            Qa = Ma[typeof module] && module && !module.nodeType && module,
            Ra = Ma[typeof self] && self && self.Object && self,
            Sa = Ma[typeof window] && window && window.Object && window,
            Ta = Qa && Qa.exports === Pa && Pa,
            Ua = Pa && Qa && "object" == typeof global && global && global.Object && global || Sa !== (this && this.window) && Sa || Ra || this,
            Va = t();
        "function" == typeof define && "object" == typeof define.amd && define.amd ? (Ua._ = Va, define(function() {
            return Va
        })) : Pa && Qa ? Ta ? (Qa.exports = Va)._ = Va : Pa._ = Va : Ua._ = Va
    }.call(this);
var _self = "undefined" != typeof window ? window : "undefined" != typeof WorkerGlobalScope && self instanceof WorkerGlobalScope ? self : {},
    Prism = function() {
        var a = /\blang(?:uage)?-(?!\*)(\w+)\b/i,
            b = _self.Prism = {
                util: {
                    encode: function(a) {
                        return a instanceof c ? new c(a.type, b.util.encode(a.content), a.alias) : "Array" === b.util.type(a) ? a.map(b.util.encode) : a.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\u00a0/g, " ")
                    },
                    type: function(a) {
                        return Object.prototype.toString.call(a).match(/\[object (\w+)\]/)[1]
                    },
                    clone: function(a) {
                        var c = b.util.type(a);
                        switch (c) {
                            case "Object":
                                var d = {};
                                for (var e in a) a.hasOwnProperty(e) && (d[e] = b.util.clone(a[e]));
                                return d;
                            case "Array":
                                return a.map && a.map(function(a) {
                                    return b.util.clone(a)
                                })
                        }
                        return a
                    }
                },
                languages: {
                    extend: function(a, c) {
                        var d = b.util.clone(b.languages[a]);
                        for (var e in c) d[e] = c[e];
                        return d
                    },
                    insertBefore: function(a, c, d, e) {
                        e = e || b.languages;
                        var f = e[a];
                        if (2 == arguments.length) {
                            d = arguments[1];
                            for (var g in d) d.hasOwnProperty(g) && (f[g] = d[g]);
                            return f
                        }
                        var h = {};
                        for (var i in f)
                            if (f.hasOwnProperty(i)) {
                                if (i == c)
                                    for (var g in d) d.hasOwnProperty(g) && (h[g] = d[g]);
                                h[i] = f[i]
                            }
                        return b.languages.DFS(b.languages, function(b, c) {
                            c === e[a] && b != a && (this[b] = h)
                        }), e[a] = h
                    },
                    DFS: function(a, c, d) {
                        for (var e in a) a.hasOwnProperty(e) && (c.call(a, e, a[e], d || e), "Object" === b.util.type(a[e]) ? b.languages.DFS(a[e], c) : "Array" === b.util.type(a[e]) && b.languages.DFS(a[e], c, e))
                    }
                },
                plugins: {},
                highlightAll: function(a, c) {
                    for (var d, e = document.querySelectorAll('code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'), f = 0; d = e[f++];) b.highlightElement(d, a === !0, c)
                },
                highlightElement: function(c, d, e) {
                    for (var f, g, h = c; h && !a.test(h.className);) h = h.parentNode;
                    h && (f = (h.className.match(a) || [, ""])[1], g = b.languages[f]), c.className = c.className.replace(a, "").replace(/\s+/g, " ") + " language-" + f, h = c.parentNode, /pre/i.test(h.nodeName) && (h.className = h.className.replace(a, "").replace(/\s+/g, " ") + " language-" + f);
                    var i = c.textContent,
                        j = {
                            element: c,
                            language: f,
                            grammar: g,
                            code: i
                        };
                    if (!i || !g) return void b.hooks.run("complete", j);
                    if (b.hooks.run("before-highlight", j), d && _self.Worker) {
                        var k = new Worker(b.filename);
                        k.onmessage = function(a) {
                            j.highlightedCode = a.data, b.hooks.run("before-insert", j), j.element.innerHTML = j.highlightedCode, e && e.call(j.element), b.hooks.run("after-highlight", j), b.hooks.run("complete", j)
                        }, k.postMessage(JSON.stringify({
                            language: j.language,
                            code: j.code,
                            immediateClose: !0
                        }))
                    } else j.highlightedCode = b.highlight(j.code, j.grammar, j.language), b.hooks.run("before-insert", j), j.element.innerHTML = j.highlightedCode, e && e.call(c), b.hooks.run("after-highlight", j), b.hooks.run("complete", j)
                },
                highlight: function(a, d, e) {
                    var f = b.tokenize(a, d);
                    return c.stringify(b.util.encode(f), e)
                },
                tokenize: function(a, c, d) {
                    var e = b.Token,
                        f = [a],
                        g = c.rest;
                    if (g) {
                        for (var h in g) c[h] = g[h];
                        delete c.rest
                    }
                    a: for (var h in c)
                        if (c.hasOwnProperty(h) && c[h]) {
                            var i = c[h];
                            i = "Array" === b.util.type(i) ? i : [i];
                            for (var j = 0; j < i.length; ++j) {
                                var k = i[j],
                                    l = k.inside,
                                    m = !!k.lookbehind,
                                    n = 0,
                                    o = k.alias;
                                k = k.pattern || k;
                                for (var p = 0; p < f.length; p++) {
                                    var q = f[p];
                                    if (f.length > a.length) break a;
                                    if (!(q instanceof e)) {
                                        k.lastIndex = 0;
                                        var r = k.exec(q);
                                        if (r) {
                                            m && (n = r[1].length);
                                            var s = r.index - 1 + n,
                                                r = r[0].slice(n),
                                                t = r.length,
                                                u = s + t,
                                                v = q.slice(0, s + 1),
                                                w = q.slice(u + 1),
                                                x = [p, 1];
                                            v && x.push(v);
                                            var y = new e(h, l ? b.tokenize(r, l) : r, o);
                                            x.push(y), w && x.push(w), Array.prototype.splice.apply(f, x)
                                        }
                                    }
                                }
                            }
                        }
                    return f
                },
                hooks: {
                    all: {},
                    add: function(a, c) {
                        var d = b.hooks.all;
                        d[a] = d[a] || [], d[a].push(c)
                    },
                    run: function(a, c) {
                        var d = b.hooks.all[a];
                        if (d && d.length)
                            for (var e, f = 0; e = d[f++];) e(c)
                    }
                }
            },
            c = b.Token = function(a, b, c) {
                this.type = a, this.content = b, this.alias = c
            };
        if (c.stringify = function(a, d, e) {
                if ("string" == typeof a) return a;
                if ("Array" === b.util.type(a)) return a.map(function(b) {
                    return c.stringify(b, d, a)
                }).join("");
                var f = {
                    type: a.type,
                    content: c.stringify(a.content, d, e),
                    tag: "span",
                    classes: ["token", a.type],
                    attributes: {},
                    language: d,
                    parent: e
                };
                if ("comment" == f.type && (f.attributes.spellcheck = "true"), a.alias) {
                    var g = "Array" === b.util.type(a.alias) ? a.alias : [a.alias];
                    Array.prototype.push.apply(f.classes, g)
                }
                b.hooks.run("wrap", f);
                var h = "";
                for (var i in f.attributes) h += (h ? " " : "") + i + '="' + (f.attributes[i] || "") + '"';
                return "<" + f.tag + ' class="' + f.classes.join(" ") + '" ' + h + ">" + f.content + "</" + f.tag + ">"
            }, !_self.document) return _self.addEventListener ? (_self.addEventListener("message", function(a) {
            var c = JSON.parse(a.data),
                d = c.language,
                e = c.code,
                f = c.immediateClose;
            _self.postMessage(b.highlight(e, b.languages[d], d)), f && _self.close()
        }, !1), _self.Prism) : _self.Prism;
        var d = document.getElementsByTagName("script");
        return d = d[d.length - 1], d && (b.filename = d.src, document.addEventListener && !d.hasAttribute("data-manual") && document.addEventListener("DOMContentLoaded", b.highlightAll)), _self.Prism
    }();
if ("undefined" != typeof module && module.exports && (module.exports = Prism), "undefined" != typeof global && (global.Prism = Prism), Prism.languages.markup = {
        comment: /<!--[\w\W]*?-->/,
        prolog: /<\?[\w\W]+?\?>/,
        doctype: /<!DOCTYPE[\w\W]+?>/,
        cdata: /<!\[CDATA\[[\w\W]*?]]>/i,
        tag: {
            pattern: /<\/?(?!\d)[^\s>\/=.$<]+(?:\s+[^\s>\/=]+(?:=(?:("|')(?:\\\1|\\?(?!\1)[\w\W])*\1|[^\s'">=]+))?)*\s*\/?>/i,
            inside: {
                tag: {
                    pattern: /^<\/?[^\s>\/]+/i,
                    inside: {
                        punctuation: /^<\/?/,
                        namespace: /^[^\s>\/:]+:/
                    }
                },
                "attr-value": {
                    pattern: /=(?:('|")[\w\W]*?(\1)|[^\s>]+)/i,
                    inside: {
                        punctuation: /[=>"']/
                    }
                },
                punctuation: /\/?>/,
                "attr-name": {
                    pattern: /[^\s>\/]+/,
                    inside: {
                        namespace: /^[^\s>\/:]+:/
                    }
                }
            }
        },
        entity: /&#?[\da-z]{1,8};/i
    }, Prism.hooks.add("wrap", function(a) {
        "entity" === a.type && (a.attributes.title = a.content.replace(/&amp;/, "&"))
    }), Prism.languages.xml = Prism.languages.markup, Prism.languages.html = Prism.languages.markup, Prism.languages.mathml = Prism.languages.markup, Prism.languages.svg = Prism.languages.markup, Prism.languages.css = {
        comment: /\/\*[\w\W]*?\*\//,
        atrule: {
            pattern: /@[\w-]+?.*?(;|(?=\s*\{))/i,
            inside: {
                rule: /@[\w-]+/
            }
        },
        url: /url\((?:(["'])(\\(?:\r\n|[\w\W])|(?!\1)[^\\\r\n])*\1|.*?)\)/i,
        selector: /[^\{\}\s][^\{\};]*?(?=\s*\{)/,
        string: /("|')(\\(?:\r\n|[\w\W])|(?!\1)[^\\\r\n])*\1/,
        property: /(\b|\B)[\w-]+(?=\s*:)/i,
        important: /\B!important\b/i,
        "function": /[-a-z0-9]+(?=\()/i,
        punctuation: /[(){};:]/
    }, Prism.languages.css.atrule.inside.rest = Prism.util.clone(Prism.languages.css), Prism.languages.markup && (Prism.languages.insertBefore("markup", "tag", {
        style: {
            pattern: /(<style[\w\W]*?>)[\w\W]*?(?=<\/style>)/i,
            lookbehind: !0,
            inside: Prism.languages.css,
            alias: "language-css"
        }
    }), Prism.languages.insertBefore("inside", "attr-value", {
        "style-attr": {
            pattern: /\s*style=("|').*?\1/i,
            inside: {
                "attr-name": {
                    pattern: /^\s*style/i,
                    inside: Prism.languages.markup.tag.inside
                },
                punctuation: /^\s*=\s*['"]|['"]\s*$/,
                "attr-value": {
                    pattern: /.+/i,
                    inside: Prism.languages.css
                }
            },
            alias: "language-css"
        }
    }, Prism.languages.markup.tag)), Prism.languages.clike = {
        comment: [{
            pattern: /(^|[^\\])\/\*[\w\W]*?\*\//,
            lookbehind: !0
        }, {
            pattern: /(^|[^\\:])\/\/.*/,
            lookbehind: !0
        }],
        string: /(["'])(\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
        "class-name": {
            pattern: /((?:\b(?:class|interface|extends|implements|trait|instanceof|new)\s+)|(?:catch\s+\())[a-z0-9_\.\\]+/i,
            lookbehind: !0,
            inside: {
                punctuation: /(\.|\\)/
            }
        },
        keyword: /\b(if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,
        "boolean": /\b(true|false)\b/,
        "function": /[a-z0-9_]+(?=\()/i,
        number: /\b-?(?:0x[\da-f]+|\d*\.?\d+(?:e[+-]?\d+)?)\b/i,
        operator: /--?|\+\+?|!=?=?|<=?|>=?|==?=?|&&?|\|\|?|\?|\*|\/|~|\^|%/,
        punctuation: /[{}[\];(),.:]/
    }, Prism.languages.javascript = Prism.languages.extend("clike", {
        keyword: /\b(as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|var|void|while|with|yield)\b/,
        number: /\b-?(0x[\dA-Fa-f]+|0b[01]+|0o[0-7]+|\d*\.?\d+([Ee][+-]?\d+)?|NaN|Infinity)\b/,
        "function": /[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*(?=\()/i
    }), Prism.languages.insertBefore("javascript", "keyword", {
        regex: {
            pattern: /(^|[^\/])\/(?!\/)(\[.+?]|\\.|[^\/\\\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})]))/,
            lookbehind: !0
        }
    }), Prism.languages.insertBefore("javascript", "class-name", {
        "template-string": {
            pattern: /`(?:\\`|\\?[^`])*`/,
            inside: {
                interpolation: {
                    pattern: /\$\{[^}]+\}/,
                    inside: {
                        "interpolation-punctuation": {
                            pattern: /^\$\{|\}$/,
                            alias: "punctuation"
                        },
                        rest: Prism.languages.javascript
                    }
                },
                string: /[\s\S]+/
            }
        }
    }), Prism.languages.markup && Prism.languages.insertBefore("markup", "tag", {
        script: {
            pattern: /(<script[\w\W]*?>)[\w\W]*?(?=<\/script>)/i,
            lookbehind: !0,
            inside: Prism.languages.javascript,
            alias: "language-javascript"
        }
    }), Prism.languages.js = Prism.languages.javascript, function() {
        "undefined" != typeof self && self.Prism && self.document && document.querySelector && (self.Prism.fileHighlight = function() {
            var a = {
                js: "javascript",
                html: "markup",
                svg: "markup",
                xml: "markup",
                py: "python",
                rb: "ruby",
                ps1: "powershell",
                psm1: "powershell"
            };
            Array.prototype.forEach && Array.prototype.slice.call(document.querySelectorAll("pre[data-src]")).forEach(function(b) {
                for (var c, d = b.getAttribute("data-src"), e = b, f = /\blang(?:uage)?-(?!\*)(\w+)\b/i; e && !f.test(e.className);) e = e.parentNode;
                if (e && (c = (b.className.match(f) || [, ""])[1]), !c) {
                    var g = (d.match(/\.(\w+)$/) || [, ""])[1];
                    c = a[g] || g
                }
                var h = document.createElement("code");
                h.className = "language-" + c, b.textContent = "", h.textContent = "Loading…", b.appendChild(h);
                var i = new XMLHttpRequest;
                i.open("GET", d, !0), i.onreadystatechange = function() {
                    4 == i.readyState && (i.status < 400 && i.responseText ? (h.textContent = i.responseText, Prism.highlightElement(h)) : i.status >= 400 ? h.textContent = "✖ Error " + i.status + " while fetching file: " + i.statusText : h.textContent = "✖ Error: File does not exist or is empty")
                }, i.send(null)
            })
        }, self.Prism.fileHighlight())
    }(), function(a) {
        function b(a) {
            return d ? d[a] : (d = require("unicode/category/So"), e = ["sign", "cross", "of", "symbol", "staff", "hand", "black", "white"].map(function(a) {
                return new RegExp(a, "gi")
            }), d[a])
        }

        function c(a, d) {
            a = a.toString(), "string" == typeof d && (d = {
                replacement: d
            }), d = d || {}, d.mode = d.mode || c.defaults.mode;
            for (var f, g = c.defaults.modes[d.mode], h = ["replacement", "multicharmap", "charmap", "remove", "lower"], i = 0, j = h.length; i < j; i++) f = h[i], d[f] = f in d ? d[f] : g[f];
            "undefined" == typeof d.symbols && (d.symbols = g.symbols);
            var k = [];
            for (var f in d.multicharmap)
                if (d.multicharmap.hasOwnProperty(f)) {
                    var l = f.length;
                    k.indexOf(l) === -1 && k.push(l)
                }
            for (var m, n, o, p = "", i = 0, j = a.length; i < j; i++) {
                if (o = a[i], !k.some(function(b) {
                        var c = a.substr(i, b);
                        return !!d.multicharmap[c] && (i += b - 1, o = d.multicharmap[c], !0)
                    }) && (d.charmap[o] ? (o = d.charmap[o], m = o.charCodeAt(0)) : m = a.charCodeAt(i), d.symbols && (n = b(m)))) {
                    o = n.name.toLowerCase();
                    for (var q = 0, r = e.length; q < r; q++) o = o.replace(e[q], "");
                    o = o.replace(/^\s+|\s+$/g, "")
                }
                o = o.replace(/[^\w\s\-\.\_~]/g, ""), d.remove && (o = o.replace(d.remove, "")), p += o
            }
            return p = p.replace(/^\s+|\s+$/g, ""), p = p.replace(/[-\s]+/g, d.replacement), p = p.replace(d.replacement + "$", ""), d.lower && (p = p.toLowerCase()), p
        }
        var d, e;
        if (c.defaults = {
                mode: "pretty"
            }, c.multicharmap = c.defaults.multicharmap = {
                "<3": "love",
                "&&": "and",
                "||": "or",
                "w/": "with"
            }, c.charmap = c.defaults.charmap = {
                "À": "A",
                "Á": "A",
                "Â": "A",
                "Ã": "A",
                "Ä": "A",
                "Å": "A",
                "Æ": "AE",
                "Ç": "C",
                "È": "E",
                "É": "E",
                "Ê": "E",
                "Ë": "E",
                "Ì": "I",
                "Í": "I",
                "Î": "I",
                "Ï": "I",
                "Ð": "D",
                "Ñ": "N",
                "Ò": "O",
                "Ó": "O",
                "Ô": "O",
                "Õ": "O",
                "Ö": "O",
                "Ő": "O",
                "Ø": "O",
                "Ù": "U",
                "Ú": "U",
                "Û": "U",
                "Ü": "U",
                "Ű": "U",
                "Ý": "Y",
                "Þ": "TH",
                "ß": "ss",
                "à": "a",
                "á": "a",
                "â": "a",
                "ã": "a",
                "ä": "a",
                "å": "a",
                "æ": "ae",
                "ç": "c",
                "è": "e",
                "é": "e",
                "ê": "e",
                "ë": "e",
                "ì": "i",
                "í": "i",
                "î": "i",
                "ï": "i",
                "ð": "d",
                "ñ": "n",
                "ò": "o",
                "ó": "o",
                "ô": "o",
                "õ": "o",
                "ö": "o",
                "ő": "o",
                "ø": "o",
                "ù": "u",
                "ú": "u",
                "û": "u",
                "ü": "u",
                "ű": "u",
                "ý": "y",
                "þ": "th",
                "ÿ": "y",
                "ẞ": "SS",
                "α": "a",
                "β": "b",
                "γ": "g",
                "δ": "d",
                "ε": "e",
                "ζ": "z",
                "η": "h",
                "θ": "8",
                "ι": "i",
                "κ": "k",
                "λ": "l",
                "μ": "m",
                "ν": "n",
                "ξ": "3",
                "ο": "o",
                "π": "p",
                "ρ": "r",
                "σ": "s",
                "τ": "t",
                "υ": "y",
                "φ": "f",
                "χ": "x",
                "ψ": "ps",
                "ω": "w",
                "ά": "a",
                "έ": "e",
                "ί": "i",
                "ό": "o",
                "ύ": "y",
                "ή": "h",
                "ώ": "w",
                "ς": "s",
                "ϊ": "i",
                "ΰ": "y",
                "ϋ": "y",
                "ΐ": "i",
                "Α": "A",
                "Β": "B",
                "Γ": "G",
                "Δ": "D",
                "Ε": "E",
                "Ζ": "Z",
                "Η": "H",
                "Θ": "8",
                "Ι": "I",
                "Κ": "K",
                "Λ": "L",
                "Μ": "M",
                "Ν": "N",
                "Ξ": "3",
                "Ο": "O",
                "Π": "P",
                "Ρ": "R",
                "Σ": "S",
                "Τ": "T",
                "Υ": "Y",
                "Φ": "F",
                "Χ": "X",
                "Ψ": "PS",
                "Ω": "W",
                "Ά": "A",
                "Έ": "E",
                "Ί": "I",
                "Ό": "O",
                "Ύ": "Y",
                "Ή": "H",
                "Ώ": "W",
                "Ϊ": "I",
                "Ϋ": "Y",
                "ş": "s",
                "Ş": "S",
                "ı": "i",
                "İ": "I",
                "ğ": "g",
                "Ğ": "G",
                "а": "a",
                "б": "b",
                "в": "v",
                "г": "g",
                "д": "d",
                "е": "e",
                "ё": "yo",
                "ж": "zh",
                "з": "z",
                "и": "i",
                "й": "j",
                "к": "k",
                "л": "l",
                "м": "m",
                "н": "n",
                "о": "o",
                "п": "p",
                "р": "r",
                "с": "s",
                "т": "t",
                "у": "u",
                "ф": "f",
                "х": "h",
                "ц": "c",
                "ч": "ch",
                "ш": "sh",
                "щ": "sh",
                "ъ": "u",
                "ы": "y",
                "ь": "",
                "э": "e",
                "ю": "yu",
                "я": "ya",
                "А": "A",
                "Б": "B",
                "В": "V",
                "Г": "G",
                "Д": "D",
                "Е": "E",
                "Ё": "Yo",
                "Ж": "Zh",
                "З": "Z",
                "И": "I",
                "Й": "J",
                "К": "K",
                "Л": "L",
                "М": "M",
                "Н": "N",
                "О": "O",
                "П": "P",
                "Р": "R",
                "С": "S",
                "Т": "T",
                "У": "U",
                "Ф": "F",
                "Х": "H",
                "Ц": "C",
                "Ч": "Ch",
                "Ш": "Sh",
                "Щ": "Sh",
                "Ъ": "U",
                "Ы": "Y",
                "Ь": "",
                "Э": "E",
                "Ю": "Yu",
                "Я": "Ya",
                "Є": "Ye",
                "І": "I",
                "Ї": "Yi",
                "Ґ": "G",
                "є": "ye",
                "і": "i",
                "ї": "yi",
                "ґ": "g",
                "č": "c",
                "ď": "d",
                "ě": "e",
                "ň": "n",
                "ř": "r",
                "š": "s",
                "ť": "t",
                "ů": "u",
                "ž": "z",
                "Č": "C",
                "Ď": "D",
                "Ě": "E",
                "Ň": "N",
                "Ř": "R",
                "Š": "S",
                "Ť": "T",
                "Ů": "U",
                "Ž": "Z",
                "ą": "a",
                "ć": "c",
                "ę": "e",
                "ł": "l",
                "ń": "n",
                "ś": "s",
                "ź": "z",
                "ż": "z",
                "Ą": "A",
                "Ć": "C",
                "Ę": "E",
                "Ł": "L",
                "Ń": "N",
                "Ś": "S",
                "Ź": "Z",
                "Ż": "Z",
                "ā": "a",
                "ē": "e",
                "ģ": "g",
                "ī": "i",
                "ķ": "k",
                "ļ": "l",
                "ņ": "n",
                "ū": "u",
                "Ā": "A",
                "Ē": "E",
                "Ģ": "G",
                "Ī": "I",
                "Ķ": "K",
                "Ļ": "L",
                "Ņ": "N",
                "Ū": "U",
                "ė": "e",
                "į": "i",
                "ų": "u",
                "Ė": "E",
                "Į": "I",
                "Ų": "U",
                "ț": "t",
                "Ț": "T",
                "ţ": "t",
                "Ţ": "T",
                "ș": "s",
                "Ș": "S",
                "ă": "a",
                "Ă": "A",
                "Ạ": "A",
                "Ả": "A",
                "Ầ": "A",
                "Ấ": "A",
                "Ậ": "A",
                "Ẩ": "A",
                "Ẫ": "A",
                "Ằ": "A",
                "Ắ": "A",
                "Ặ": "A",
                "Ẳ": "A",
                "Ẵ": "A",
                "Ẹ": "E",
                "Ẻ": "E",
                "Ẽ": "E",
                "Ề": "E",
                "Ế": "E",
                "Ệ": "E",
                "Ể": "E",
                "Ễ": "E",
                "Ị": "I",
                "Ỉ": "I",
                "Ĩ": "I",
                "Ọ": "O",
                "Ỏ": "O",
                "Ồ": "O",
                "Ố": "O",
                "Ộ": "O",
                "Ổ": "O",
                "Ỗ": "O",
                "Ơ": "O",
                "Ờ": "O",
                "Ớ": "O",
                "Ợ": "O",
                "Ở": "O",
                "Ỡ": "O",
                "Ụ": "U",
                "Ủ": "U",
                "Ũ": "U",
                "Ư": "U",
                "Ừ": "U",
                "Ứ": "U",
                "Ự": "U",
                "Ử": "U",
                "Ữ": "U",
                "Ỳ": "Y",
                "Ỵ": "Y",
                "Ỷ": "Y",
                "Ỹ": "Y",
                "Đ": "D",
                "ạ": "a",
                "ả": "a",
                "ầ": "a",
                "ấ": "a",
                "ậ": "a",
                "ẩ": "a",
                "ẫ": "a",
                "ằ": "a",
                "ắ": "a",
                "ặ": "a",
                "ẳ": "a",
                "ẵ": "a",
                "ẹ": "e",
                "ẻ": "e",
                "ẽ": "e",
                "ề": "e",
                "ế": "e",
                "ệ": "e",
                "ể": "e",
                "ễ": "e",
                "ị": "i",
                "ỉ": "i",
                "ĩ": "i",
                "ọ": "o",
                "ỏ": "o",
                "ồ": "o",
                "ố": "o",
                "ộ": "o",
                "ổ": "o",
                "ỗ": "o",
                "ơ": "o",
                "ờ": "o",
                "ớ": "o",
                "ợ": "o",
                "ở": "o",
                "ỡ": "o",
                "ụ": "u",
                "ủ": "u",
                "ũ": "u",
                "ư": "u",
                "ừ": "u",
                "ứ": "u",
                "ự": "u",
                "ử": "u",
                "ữ": "u",
                "ỳ": "y",
                "ỵ": "y",
                "ỷ": "y",
                "ỹ": "y",
                "đ": "d",
                "€": "euro",
                "₢": "cruzeiro",
                "₣": "french franc",
                "£": "pound",
                "₤": "lira",
                "₥": "mill",
                "₦": "naira",
                "₧": "peseta",
                "₨": "rupee",
                "₩": "won",
                "₪": "new shequel",
                "₫": "dong",
                "₭": "kip",
                "₮": "tugrik",
                "₯": "drachma",
                "₰": "penny",
                "₱": "peso",
                "₲": "guarani",
                "₳": "austral",
                "₴": "hryvnia",
                "₵": "cedi",
                "¢": "cent",
                "¥": "yen",
                "元": "yuan",
                "円": "yen",
                "﷼": "rial",
                "₠": "ecu",
                "¤": "currency",
                "฿": "baht",
                $: "dollar",
                "₹": "indian rupee",
                "©": "(c)",
                "œ": "oe",
                "Œ": "OE",
                "∑": "sum",
                "®": "(r)",
                "†": "+",
                "“": '"',
                "”": '"',
                "‘": "'",
                "’": "'",
                "∂": "d",
                "ƒ": "f",
                "™": "tm",
                "℠": "sm",
                "…": "...",
                "˚": "o",
                "º": "o",
                "ª": "a",
                "•": "*",
                "∆": "delta",
                "∞": "infinity",
                "♥": "love",
                "&": "and",
                "|": "or",
                "<": "less",
                ">": "greater"
            }, c.defaults.modes = {
                rfc3986: {
                    replacement: "-",
                    symbols: !0,
                    remove: null,
                    lower: !0,
                    charmap: c.defaults.charmap,
                    multicharmap: c.defaults.multicharmap
                },
                pretty: {
                    replacement: "-",
                    symbols: !0,
                    remove: /[.]/g,
                    lower: !1,
                    charmap: c.defaults.charmap,
                    multicharmap: c.defaults.multicharmap
                }
            }, "undefined" != typeof define && define.amd) {
            for (var f in c.defaults.modes) c.defaults.modes.hasOwnProperty(f) && (c.defaults.modes[f].symbols = !1);
            define([], function() {
                return c
            })
        } else if ("undefined" != typeof module && module.exports) b(), module.exports = c;
        else {
            for (var f in c.defaults.modes) c.defaults.modes.hasOwnProperty(f) && (c.defaults.modes[f].symbols = !1);
            a.slug = c
        }
    }(this), ! function(a) {
        var b, c, d = "0.4.2",
            e = "hasOwnProperty",
            f = /[\.\/]/,
            g = /\s*,\s*/,
            h = "*",
            i = function(a, b) {
                return a - b
            },
            j = {
                n: {}
            },
            k = function() {
                for (var a = 0, b = this.length; b > a; a++)
                    if ("undefined" != typeof this[a]) return this[a]
            },
            l = function() {
                for (var a = this.length; --a;)
                    if ("undefined" != typeof this[a]) return this[a]
            },
            m = function(a, d) {
                a = String(a);
                var e, f = c,
                    g = Array.prototype.slice.call(arguments, 2),
                    h = m.listeners(a),
                    j = 0,
                    n = [],
                    o = {},
                    p = [],
                    q = b;
                p.firstDefined = k, p.lastDefined = l, b = a, c = 0;
                for (var r = 0, s = h.length; s > r; r++) "zIndex" in h[r] && (n.push(h[r].zIndex), h[r].zIndex < 0 && (o[h[r].zIndex] = h[r]));
                for (n.sort(i); n[j] < 0;)
                    if (e = o[n[j++]], p.push(e.apply(d, g)), c) return c = f, p;
                for (r = 0; s > r; r++)
                    if (e = h[r], "zIndex" in e)
                        if (e.zIndex == n[j]) {
                            if (p.push(e.apply(d, g)), c) break;
                            do
                                if (j++, e = o[n[j]], e && p.push(e.apply(d, g)), c) break;
                            while (e)
                        } else o[e.zIndex] = e;
                else if (p.push(e.apply(d, g)), c) break;
                return c = f, b = q, p
            };
        m._events = j, m.listeners = function(a) {
            var b, c, d, e, g, i, k, l, m = a.split(f),
                n = j,
                o = [n],
                p = [];
            for (e = 0, g = m.length; g > e; e++) {
                for (l = [], i = 0, k = o.length; k > i; i++)
                    for (n = o[i].n, c = [n[m[e]], n[h]], d = 2; d--;) b = c[d], b && (l.push(b), p = p.concat(b.f || []));
                o = l
            }
            return p
        }, m.on = function(a, b) {
            if (a = String(a), "function" != typeof b) return function() {};
            for (var c = a.split(g), d = 0, e = c.length; e > d; d++) ! function(a) {
                for (var c, d = a.split(f), e = j, g = 0, h = d.length; h > g; g++) e = e.n,
                    e = e.hasOwnProperty(d[g]) && e[d[g]] || (e[d[g]] = {
                        n: {}
                    });
                for (e.f = e.f || [], g = 0, h = e.f.length; h > g; g++)
                    if (e.f[g] == b) {
                        c = !0;
                        break
                    }!c && e.f.push(b)
            }(c[d]);
            return function(a) {
                +a == +a && (b.zIndex = +a)
            }
        }, m.f = function(a) {
            var b = [].slice.call(arguments, 1);
            return function() {
                m.apply(null, [a, null].concat(b).concat([].slice.call(arguments, 0)))
            }
        }, m.stop = function() {
            c = 1
        }, m.nt = function(a) {
            return a ? new RegExp("(?:\\.|\\/|^)" + a + "(?:\\.|\\/|$)").test(b) : b
        }, m.nts = function() {
            return b.split(f)
        }, m.off = m.unbind = function(a, b) {
            if (!a) return void(m._events = j = {
                n: {}
            });
            var c = a.split(g);
            if (c.length > 1)
                for (var d = 0, i = c.length; i > d; d++) m.off(c[d], b);
            else {
                c = a.split(f);
                var k, l, n, d, i, o, p, q = [j];
                for (d = 0, i = c.length; i > d; d++)
                    for (o = 0; o < q.length; o += n.length - 2) {
                        if (n = [o, 1], k = q[o].n, c[d] != h) k[c[d]] && n.push(k[c[d]]);
                        else
                            for (l in k) k[e](l) && n.push(k[l]);
                        q.splice.apply(q, n)
                    }
                for (d = 0, i = q.length; i > d; d++)
                    for (k = q[d]; k.n;) {
                        if (b) {
                            if (k.f) {
                                for (o = 0, p = k.f.length; p > o; o++)
                                    if (k.f[o] == b) {
                                        k.f.splice(o, 1);
                                        break
                                    }!k.f.length && delete k.f
                            }
                            for (l in k.n)
                                if (k.n[e](l) && k.n[l].f) {
                                    var r = k.n[l].f;
                                    for (o = 0, p = r.length; p > o; o++)
                                        if (r[o] == b) {
                                            r.splice(o, 1);
                                            break
                                        }!r.length && delete k.n[l].f
                                }
                        } else {
                            delete k.f;
                            for (l in k.n) k.n[e](l) && k.n[l].f && delete k.n[l].f
                        }
                        k = k.n
                    }
            }
        }, m.once = function(a, b) {
            var c = function() {
                return m.unbind(a, c), b.apply(this, arguments)
            };
            return m.on(a, c)
        }, m.version = d, m.toString = function() {
            return "You are running Eve " + d
        }, "undefined" != typeof module && module.exports ? module.exports = m : "function" == typeof define && define.amd ? define("eve", [], function() {
            return m
        }) : a.eve = m
    }(this), function(a, b) {
        if ("function" == typeof define && define.amd) define(["eve"], function(c) {
            return b(a, c)
        });
        else if ("undefined" != typeof exports) {
            var c = require("eve");
            module.exports = b(a, c)
        } else b(a, a.eve)
    }(window || this, function(a, b) {
        var c = function(b) {
                var c = {},
                    d = a.requestAnimationFrame || a.webkitRequestAnimationFrame || a.mozRequestAnimationFrame || a.oRequestAnimationFrame || a.msRequestAnimationFrame || function(a) {
                        setTimeout(a, 16)
                    },
                    e = Array.isArray || function(a) {
                        return a instanceof Array || "[object Array]" == Object.prototype.toString.call(a)
                    },
                    f = 0,
                    g = "M" + (+new Date).toString(36),
                    h = function() {
                        return g + (f++).toString(36)
                    },
                    i = Date.now || function() {
                        return +new Date
                    },
                    j = function(a) {
                        var b = this;
                        if (null == a) return b.s;
                        var c = b.s - a;
                        b.b += b.dur * c, b.B += b.dur * c, b.s = a
                    },
                    k = function(a) {
                        var b = this;
                        return null == a ? b.spd : void(b.spd = a)
                    },
                    l = function(a) {
                        var b = this;
                        return null == a ? b.dur : (b.s = b.s * a / b.dur, void(b.dur = a))
                    },
                    m = function() {
                        var a = this;
                        delete c[a.id], a.update(), b("mina.stop." + a.id, a)
                    },
                    n = function() {
                        var a = this;
                        a.pdif || (delete c[a.id], a.update(), a.pdif = a.get() - a.b)
                    },
                    o = function() {
                        var a = this;
                        a.pdif && (a.b = a.get() - a.pdif, delete a.pdif, c[a.id] = a)
                    },
                    p = function() {
                        var a, b = this;
                        if (e(b.start)) {
                            a = [];
                            for (var c = 0, d = b.start.length; d > c; c++) a[c] = +b.start[c] + (b.end[c] - b.start[c]) * b.easing(b.s)
                        } else a = +b.start + (b.end - b.start) * b.easing(b.s);
                        b.set(a)
                    },
                    q = function() {
                        var a = 0;
                        for (var e in c)
                            if (c.hasOwnProperty(e)) {
                                var f = c[e],
                                    g = f.get();
                                a++, f.s = (g - f.b) / (f.dur / f.spd), f.s >= 1 && (delete c[e], f.s = 1, a--, function(a) {
                                    setTimeout(function() {
                                        b("mina.finish." + a.id, a)
                                    })
                                }(f)), f.update()
                            }
                        a && d(q)
                    },
                    r = function(a, b, e, f, g, i, s) {
                        var t = {
                            id: h(),
                            start: a,
                            end: b,
                            b: e,
                            s: 0,
                            dur: f - e,
                            spd: 1,
                            get: g,
                            set: i,
                            easing: s || r.linear,
                            status: j,
                            speed: k,
                            duration: l,
                            stop: m,
                            pause: n,
                            resume: o,
                            update: p
                        };
                        c[t.id] = t;
                        var u, v = 0;
                        for (u in c)
                            if (c.hasOwnProperty(u) && (v++, 2 == v)) break;
                        return 1 == v && d(q), t
                    };
                return r.time = i, r.getById = function(a) {
                    return c[a] || null
                }, r.linear = function(a) {
                    return a
                }, r.easeout = function(a) {
                    return Math.pow(a, 1.7)
                }, r.easein = function(a) {
                    return Math.pow(a, .48)
                }, r.easeinout = function(a) {
                    if (1 == a) return 1;
                    if (0 == a) return 0;
                    var b = .48 - a / 1.04,
                        c = Math.sqrt(.1734 + b * b),
                        d = c - b,
                        e = Math.pow(Math.abs(d), 1 / 3) * (0 > d ? -1 : 1),
                        f = -c - b,
                        g = Math.pow(Math.abs(f), 1 / 3) * (0 > f ? -1 : 1),
                        h = e + g + .5;
                    return 3 * (1 - h) * h * h + h * h * h
                }, r.backin = function(a) {
                    if (1 == a) return 1;
                    var b = 1.70158;
                    return a * a * ((b + 1) * a - b)
                }, r.backout = function(a) {
                    if (0 == a) return 0;
                    a -= 1;
                    var b = 1.70158;
                    return a * a * ((b + 1) * a + b) + 1
                }, r.elastic = function(a) {
                    return a == !!a ? a : Math.pow(2, -10 * a) * Math.sin(2 * (a - .075) * Math.PI / .3) + 1
                }, r.bounce = function(a) {
                    var b, c = 7.5625,
                        d = 2.75;
                    return 1 / d > a ? b = c * a * a : 2 / d > a ? (a -= 1.5 / d, b = c * a * a + .75) : 2.5 / d > a ? (a -= 2.25 / d, b = c * a * a + .9375) : (a -= 2.625 / d, b = c * a * a + .984375), b
                }, a.mina = r, r
            }("undefined" == typeof b ? function() {} : b),
            d = function(a) {
                function c(a, b) {
                    if (a) {
                        if (a.nodeType) return w(a);
                        if (e(a, "array") && c.set) return c.set.apply(c, a);
                        if (a instanceof s) return a;
                        if (null == b) return a = y.doc.querySelector(String(a)), w(a)
                    }
                    return a = null == a ? "100%" : a, b = null == b ? "100%" : b, new v(a, b)
                }

                function d(a, b) {
                    if (b) {
                        if ("#text" == a && (a = y.doc.createTextNode(b.text || b["#text"] || "")), "#comment" == a && (a = y.doc.createComment(b.text || b["#text"] || "")), "string" == typeof a && (a = d(a)), "string" == typeof b) return 1 == a.nodeType ? "xlink:" == b.substring(0, 6) ? a.getAttributeNS(T, b.substring(6)) : "xml:" == b.substring(0, 4) ? a.getAttributeNS(U, b.substring(4)) : a.getAttribute(b) : "text" == b ? a.nodeValue : null;
                        if (1 == a.nodeType) {
                            for (var c in b)
                                if (b[z](c)) {
                                    var e = A(b[c]);
                                    e ? "xlink:" == c.substring(0, 6) ? a.setAttributeNS(T, c.substring(6), e) : "xml:" == c.substring(0, 4) ? a.setAttributeNS(U, c.substring(4), e) : a.setAttribute(c, e) : a.removeAttribute(c)
                                }
                        } else "text" in b && (a.nodeValue = b.text)
                    } else a = y.doc.createElementNS(U, a);
                    return a
                }

                function e(a, b) {
                    return b = A.prototype.toLowerCase.call(b), "finite" == b ? isFinite(a) : !("array" != b || !(a instanceof Array || Array.isArray && Array.isArray(a))) || ("null" == b && null === a || b == typeof a && null !== a || "object" == b && a === Object(a) || J.call(a).slice(8, -1).toLowerCase() == b)
                }

                function f(a) {
                    if ("function" == typeof a || Object(a) !== a) return a;
                    var b = new a.constructor;
                    for (var c in a) a[z](c) && (b[c] = f(a[c]));
                    return b
                }

                function h(a, b) {
                    for (var c = 0, d = a.length; d > c; c++)
                        if (a[c] === b) return a.push(a.splice(c, 1)[0])
                }

                function i(a, b, c) {
                    function d() {
                        var e = Array.prototype.slice.call(arguments, 0),
                            f = e.join("␀"),
                            g = d.cache = d.cache || {},
                            i = d.count = d.count || [];
                        return g[z](f) ? (h(i, f), c ? c(g[f]) : g[f]) : (i.length >= 1e3 && delete g[i.shift()], i.push(f), g[f] = a.apply(b, e), c ? c(g[f]) : g[f])
                    }
                    return d
                }

                function j(a, b, c, d, e, f) {
                    if (null == e) {
                        var g = a - c,
                            h = b - d;
                        return g || h ? (180 + 180 * D.atan2(-h, -g) / H + 360) % 360 : 0
                    }
                    return j(a, b, e, f) - j(c, d, e, f)
                }

                function k(a) {
                    return a % 360 * H / 180
                }

                function l(a) {
                    return 180 * a / H % 360
                }

                function m(a) {
                    var b = [];
                    return a = a.replace(/(?:^|\s)(\w+)\(([^)]+)\)/g, function(a, c, d) {
                        return d = d.split(/\s*,\s*|\s+/), "rotate" == c && 1 == d.length && d.push(0, 0), "scale" == c && (d.length > 2 ? d = d.slice(0, 2) : 2 == d.length && d.push(0, 0), 1 == d.length && d.push(d[0], 0, 0)), b.push("skewX" == c ? ["m", 1, 0, D.tan(k(d[0])), 1, 0, 0] : "skewY" == c ? ["m", 1, D.tan(k(d[0])), 0, 1, 0, 0] : [c.charAt(0)].concat(d)), a
                    }), b
                }

                function n(a, b) {
                    var d = aa(a),
                        e = new c.Matrix;
                    if (d)
                        for (var f = 0, g = d.length; g > f; f++) {
                            var h, i, j, k, l, m = d[f],
                                n = m.length,
                                o = A(m[0]).toLowerCase(),
                                p = m[0] != o,
                                q = p ? e.invert() : 0;
                            "t" == o && 2 == n ? e.translate(m[1], 0) : "t" == o && 3 == n ? p ? (h = q.x(0, 0), i = q.y(0, 0), j = q.x(m[1], m[2]), k = q.y(m[1], m[2]), e.translate(j - h, k - i)) : e.translate(m[1], m[2]) : "r" == o ? 2 == n ? (l = l || b, e.rotate(m[1], l.x + l.width / 2, l.y + l.height / 2)) : 4 == n && (p ? (j = q.x(m[2], m[3]), k = q.y(m[2], m[3]), e.rotate(m[1], j, k)) : e.rotate(m[1], m[2], m[3])) : "s" == o ? 2 == n || 3 == n ? (l = l || b, e.scale(m[1], m[n - 1], l.x + l.width / 2, l.y + l.height / 2)) : 4 == n ? p ? (j = q.x(m[2], m[3]), k = q.y(m[2], m[3]), e.scale(m[1], m[1], j, k)) : e.scale(m[1], m[1], m[2], m[3]) : 5 == n && (p ? (j = q.x(m[3], m[4]), k = q.y(m[3], m[4]), e.scale(m[1], m[2], j, k)) : e.scale(m[1], m[2], m[3], m[4])) : "m" == o && 7 == n && e.add(m[1], m[2], m[3], m[4], m[5], m[6])
                        }
                    return e
                }

                function o(a) {
                    var b = a.node.ownerSVGElement && w(a.node.ownerSVGElement) || a.node.parentNode && w(a.node.parentNode) || c.select("svg") || c(0, 0),
                        d = b.select("defs"),
                        e = null != d && d.node;
                    return e || (e = u("defs", b.node).node), e
                }

                function p(a) {
                    return a.node.ownerSVGElement && w(a.node.ownerSVGElement) || c.select("svg")
                }

                function q(a, b, c) {
                    function e(a) {
                        if (null == a) return I;
                        if (a == +a) return a;
                        d(j, {
                            width: a
                        });
                        try {
                            return j.getBBox().width
                        } catch (b) {
                            return 0
                        }
                    }

                    function f(a) {
                        if (null == a) return I;
                        if (a == +a) return a;
                        d(j, {
                            height: a
                        });
                        try {
                            return j.getBBox().height
                        } catch (b) {
                            return 0
                        }
                    }

                    function g(d, e) {
                        null == b ? i[d] = e(a.attr(d) || 0) : d == b && (i = e(null == c ? a.attr(d) || 0 : c))
                    }
                    var h = p(a).node,
                        i = {},
                        j = h.querySelector(".svg---mgr");
                    switch (j || (j = d("rect"), d(j, {
                        x: -9e9,
                        y: -9e9,
                        width: 10,
                        height: 10,
                        "class": "svg---mgr",
                        fill: "none"
                    }), h.appendChild(j)), a.type) {
                        case "rect":
                            g("rx", e), g("ry", f);
                        case "image":
                            g("width", e), g("height", f);
                        case "text":
                            g("x", e), g("y", f);
                            break;
                        case "circle":
                            g("cx", e), g("cy", f), g("r", e);
                            break;
                        case "ellipse":
                            g("cx", e), g("cy", f), g("rx", e), g("ry", f);
                            break;
                        case "line":
                            g("x1", e), g("x2", e), g("y1", f), g("y2", f);
                            break;
                        case "marker":
                            g("refX", e), g("markerWidth", e), g("refY", f), g("markerHeight", f);
                            break;
                        case "radialGradient":
                            g("fx", e), g("fy", f);
                            break;
                        case "tspan":
                            g("dx", e), g("dy", f);
                            break;
                        default:
                            g(b, e)
                    }
                    return h.removeChild(j), i
                }

                function r(a) {
                    e(a, "array") || (a = Array.prototype.slice.call(arguments, 0));
                    for (var b = 0, c = 0, d = this.node; this[b];) delete this[b++];
                    for (b = 0; b < a.length; b++) "set" == a[b].type ? a[b].forEach(function(a) {
                        d.appendChild(a.node)
                    }) : d.appendChild(a[b].node);
                    var f = d.childNodes;
                    for (b = 0; b < f.length; b++) this[c++] = w(f[b]);
                    return this
                }

                function s(a) {
                    if (a.snap in V) return V[a.snap];
                    var b;
                    try {
                        b = a.ownerSVGElement
                    } catch (c) {}
                    this.node = a, b && (this.paper = new v(b)), this.type = a.tagName || a.nodeName;
                    var d = this.id = S(this);
                    if (this.anims = {}, this._ = {
                            transform: []
                        }, a.snap = d, V[d] = this, "g" == this.type && (this.add = r), this.type in {
                            g: 1,
                            mask: 1,
                            pattern: 1,
                            symbol: 1
                        })
                        for (var e in v.prototype) v.prototype[z](e) && (this[e] = v.prototype[e])
                }

                function t(a) {
                    this.node = a
                }

                function u(a, b) {
                    var c = d(a);
                    b.appendChild(c);
                    var e = w(c);
                    return e
                }

                function v(a, b) {
                    var c, e, f, g = v.prototype;
                    if (a && "svg" == a.tagName) {
                        if (a.snap in V) return V[a.snap];
                        var h = a.ownerDocument;
                        c = new s(a), e = a.getElementsByTagName("desc")[0], f = a.getElementsByTagName("defs")[0], e || (e = d("desc"), e.appendChild(h.createTextNode("Created with Snap")), c.node.appendChild(e)), f || (f = d("defs"), c.node.appendChild(f)), c.defs = f;
                        for (var i in g) g[z](i) && (c[i] = g[i]);
                        c.paper = c.root = c
                    } else c = u("svg", y.doc.body), d(c.node, {
                        height: b,
                        version: 1.1,
                        width: a,
                        xmlns: U
                    });
                    return c
                }

                function w(a) {
                    return a ? a instanceof s || a instanceof t ? a : a.tagName && "svg" == a.tagName.toLowerCase() ? new v(a) : a.tagName && "object" == a.tagName.toLowerCase() && "image/svg+xml" == a.type ? new v(a.contentDocument.getElementsByTagName("svg")[0]) : new s(a) : a
                }

                function x(a, b) {
                    for (var c = 0, d = a.length; d > c; c++) {
                        var e = {
                                type: a[c].type,
                                attr: a[c].attr()
                            },
                            f = a[c].children();
                        b.push(e), f.length && x(f, e.childNodes = [])
                    }
                }
                c.version = "0.4.0", c.toString = function() {
                    return "Snap v" + this.version
                }, c._ = {};
                var y = {
                    win: a.window,
                    doc: a.window.document
                };
                c._.glob = y;
                var z = "hasOwnProperty",
                    A = String,
                    B = parseFloat,
                    C = parseInt,
                    D = Math,
                    E = D.max,
                    F = D.min,
                    G = D.abs,
                    H = (D.pow, D.PI),
                    I = (D.round, ""),
                    J = Object.prototype.toString,
                    K = /^\s*((#[a-f\d]{6})|(#[a-f\d]{3})|rgba?\(\s*([\d\.]+%?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+%?)?)\s*\)|hsba?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?%?)\s*\)|hsla?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?%?)\s*\))\s*$/i,
                    L = (c._.separator = /[,\s]+/, /[\s]*,[\s]*/),
                    M = {
                        hs: 1,
                        rg: 1
                    },
                    N = /([a-z])[\s,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\s]*,?[\s]*)+)/gi,
                    O = /([rstm])[\s,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\s]*,?[\s]*)+)/gi,
                    P = /(-?\d*\.?\d*(?:e[\-+]?\\d+)?)[\s]*,?[\s]*/gi,
                    Q = 0,
                    R = "S" + (+new Date).toString(36),
                    S = function(a) {
                        return (a && a.type ? a.type : I) + R + (Q++).toString(36)
                    },
                    T = "http://www.w3.org/1999/xlink",
                    U = "http://www.w3.org/2000/svg",
                    V = {};
                c.url = function(a) {
                    return "url('#" + a + "')"
                }, c._.$ = d, c._.id = S, c.format = function() {
                    var a = /\{([^\}]+)\}/g,
                        b = /(?:(?:^|\.)(.+?)(?=\[|\.|$|\()|\[('|")(.+?)\2\])(\(\))?/g,
                        c = function(a, c, d) {
                            var e = d;
                            return c.replace(b, function(a, b, c, d, f) {
                                b = b || d, e && (b in e && (e = e[b]), "function" == typeof e && f && (e = e()))
                            }), e = (null == e || e == d ? a : e) + ""
                        };
                    return function(b, d) {
                        return A(b).replace(a, function(a, b) {
                            return c(a, b, d)
                        })
                    }
                }(), c._.clone = f, c._.cacher = i, c.rad = k, c.deg = l, c.sin = function(a) {
                    return D.sin(c.rad(a))
                }, c.tan = function(a) {
                    return D.tan(c.rad(a))
                }, c.cos = function(a) {
                    return D.cos(c.rad(a))
                }, c.asin = function(a) {
                    return c.deg(D.asin(a))
                }, c.acos = function(a) {
                    return c.deg(D.acos(a))
                }, c.atan = function(a) {
                    return c.deg(D.atan(a))
                }, c.atan2 = function(a) {
                    return c.deg(D.atan2(a))
                }, c.angle = j, c.len = function(a, b, d, e) {
                    return Math.sqrt(c.len2(a, b, d, e))
                }, c.len2 = function(a, b, c, d) {
                    return (a - c) * (a - c) + (b - d) * (b - d)
                }, c.closestPoint = function(a, b, c) {
                    function d(a) {
                        var d = a.x - b,
                            e = a.y - c;
                        return d * d + e * e
                    }
                    for (var e, f, g, h, i = a.node, j = i.getTotalLength(), k = j / i.pathSegList.numberOfItems * .125, l = 1 / 0, m = 0; j >= m; m += k)(h = d(g = i.getPointAtLength(m))) < l && (e = g, f = m, l = h);
                    for (k *= .5; k > .5;) {
                        var n, o, p, q, r, s;
                        (p = f - k) >= 0 && (r = d(n = i.getPointAtLength(p))) < l ? (e = n, f = p, l = r) : (q = f + k) <= j && (s = d(o = i.getPointAtLength(q))) < l ? (e = o, f = q, l = s) : k *= .5
                    }
                    return e = {
                        x: e.x,
                        y: e.y,
                        length: f,
                        distance: Math.sqrt(l)
                    }
                }, c.is = e, c.snapTo = function(a, b, c) {
                    if (c = e(c, "finite") ? c : 10, e(a, "array")) {
                        for (var d = a.length; d--;)
                            if (G(a[d] - b) <= c) return a[d]
                    } else {
                        a = +a;
                        var f = b % a;
                        if (c > f) return b - f;
                        if (f > a - c) return b - f + a
                    }
                    return b
                }, c.getRGB = i(function(a) {
                    if (!a || (a = A(a)).indexOf("-") + 1) return {
                        r: -1,
                        g: -1,
                        b: -1,
                        hex: "none",
                        error: 1,
                        toString: Z
                    };
                    if ("none" == a) return {
                        r: -1,
                        g: -1,
                        b: -1,
                        hex: "none",
                        toString: Z
                    };
                    if (!(M[z](a.toLowerCase().substring(0, 2)) || "#" == a.charAt()) && (a = W(a)), !a) return {
                        r: -1,
                        g: -1,
                        b: -1,
                        hex: "none",
                        error: 1,
                        toString: Z
                    };
                    var b, d, f, g, h, i, j = a.match(K);
                    return j ? (j[2] && (f = C(j[2].substring(5), 16), d = C(j[2].substring(3, 5), 16), b = C(j[2].substring(1, 3), 16)), j[3] && (f = C((h = j[3].charAt(3)) + h, 16), d = C((h = j[3].charAt(2)) + h, 16), b = C((h = j[3].charAt(1)) + h, 16)), j[4] && (i = j[4].split(L), b = B(i[0]), "%" == i[0].slice(-1) && (b *= 2.55), d = B(i[1]), "%" == i[1].slice(-1) && (d *= 2.55), f = B(i[2]), "%" == i[2].slice(-1) && (f *= 2.55), "rgba" == j[1].toLowerCase().slice(0, 4) && (g = B(i[3])), i[3] && "%" == i[3].slice(-1) && (g /= 100)), j[5] ? (i = j[5].split(L), b = B(i[0]), "%" == i[0].slice(-1) && (b /= 100), d = B(i[1]), "%" == i[1].slice(-1) && (d /= 100), f = B(i[2]), "%" == i[2].slice(-1) && (f /= 100), ("deg" == i[0].slice(-3) || "°" == i[0].slice(-1)) && (b /= 360), "hsba" == j[1].toLowerCase().slice(0, 4) && (g = B(i[3])), i[3] && "%" == i[3].slice(-1) && (g /= 100), c.hsb2rgb(b, d, f, g)) : j[6] ? (i = j[6].split(L), b = B(i[0]), "%" == i[0].slice(-1) && (b /= 100), d = B(i[1]), "%" == i[1].slice(-1) && (d /= 100), f = B(i[2]), "%" == i[2].slice(-1) && (f /= 100), ("deg" == i[0].slice(-3) || "°" == i[0].slice(-1)) && (b /= 360), "hsla" == j[1].toLowerCase().slice(0, 4) && (g = B(i[3])), i[3] && "%" == i[3].slice(-1) && (g /= 100), c.hsl2rgb(b, d, f, g)) : (b = F(D.round(b), 255), d = F(D.round(d), 255), f = F(D.round(f), 255), g = F(E(g, 0), 1), j = {
                        r: b,
                        g: d,
                        b: f,
                        toString: Z
                    }, j.hex = "#" + (16777216 | f | d << 8 | b << 16).toString(16).slice(1), j.opacity = e(g, "finite") ? g : 1, j)) : {
                        r: -1,
                        g: -1,
                        b: -1,
                        hex: "none",
                        error: 1,
                        toString: Z
                    }
                }, c), c.hsb = i(function(a, b, d) {
                    return c.hsb2rgb(a, b, d).hex
                }), c.hsl = i(function(a, b, d) {
                    return c.hsl2rgb(a, b, d).hex
                }), c.rgb = i(function(a, b, c, d) {
                    if (e(d, "finite")) {
                        var f = D.round;
                        return "rgba(" + [f(a), f(b), f(c), +d.toFixed(2)] + ")"
                    }
                    return "#" + (16777216 | c | b << 8 | a << 16).toString(16).slice(1)
                });
                var W = function(a) {
                        var b = y.doc.getElementsByTagName("head")[0] || y.doc.getElementsByTagName("svg")[0],
                            c = "rgb(255, 0, 0)";
                        return (W = i(function(a) {
                            if ("red" == a.toLowerCase()) return c;
                            b.style.color = c, b.style.color = a;
                            var d = y.doc.defaultView.getComputedStyle(b, I).getPropertyValue("color");
                            return d == c ? null : d
                        }))(a)
                    },
                    X = function() {
                        return "hsb(" + [this.h, this.s, this.b] + ")"
                    },
                    Y = function() {
                        return "hsl(" + [this.h, this.s, this.l] + ")"
                    },
                    Z = function() {
                        return 1 == this.opacity || null == this.opacity ? this.hex : "rgba(" + [this.r, this.g, this.b, this.opacity] + ")"
                    },
                    $ = function(a, b, d) {
                        if (null == b && e(a, "object") && "r" in a && "g" in a && "b" in a && (d = a.b, b = a.g, a = a.r), null == b && e(a, string)) {
                            var f = c.getRGB(a);
                            a = f.r, b = f.g, d = f.b
                        }
                        return (a > 1 || b > 1 || d > 1) && (a /= 255, b /= 255, d /= 255), [a, b, d]
                    },
                    _ = function(a, b, d, f) {
                        a = D.round(255 * a), b = D.round(255 * b), d = D.round(255 * d);
                        var g = {
                            r: a,
                            g: b,
                            b: d,
                            opacity: e(f, "finite") ? f : 1,
                            hex: c.rgb(a, b, d),
                            toString: Z
                        };
                        return e(f, "finite") && (g.opacity = f), g
                    };
                c.color = function(a) {
                    var b;
                    return e(a, "object") && "h" in a && "s" in a && "b" in a ? (b = c.hsb2rgb(a), a.r = b.r, a.g = b.g, a.b = b.b, a.opacity = 1, a.hex = b.hex) : e(a, "object") && "h" in a && "s" in a && "l" in a ? (b = c.hsl2rgb(a), a.r = b.r, a.g = b.g, a.b = b.b, a.opacity = 1, a.hex = b.hex) : (e(a, "string") && (a = c.getRGB(a)), e(a, "object") && "r" in a && "g" in a && "b" in a && !("error" in a) ? (b = c.rgb2hsl(a), a.h = b.h, a.s = b.s, a.l = b.l, b = c.rgb2hsb(a), a.v = b.b) : (a = {
                        hex: "none"
                    }, a.r = a.g = a.b = a.h = a.s = a.v = a.l = -1, a.error = 1)), a.toString = Z, a
                }, c.hsb2rgb = function(a, b, c, d) {
                    e(a, "object") && "h" in a && "s" in a && "b" in a && (c = a.b, b = a.s, d = a.o, a = a.h), a *= 360;
                    var f, g, h, i, j;
                    return a = a % 360 / 60, j = c * b, i = j * (1 - G(a % 2 - 1)), f = g = h = c - j, a = ~~a, f += [j, i, 0, 0, i, j][a], g += [i, j, j, i, 0, 0][a], h += [0, 0, i, j, j, i][a], _(f, g, h, d)
                }, c.hsl2rgb = function(a, b, c, d) {
                    e(a, "object") && "h" in a && "s" in a && "l" in a && (c = a.l, b = a.s, a = a.h), (a > 1 || b > 1 || c > 1) && (a /= 360, b /= 100, c /= 100), a *= 360;
                    var f, g, h, i, j;
                    return a = a % 360 / 60, j = 2 * b * (.5 > c ? c : 1 - c), i = j * (1 - G(a % 2 - 1)), f = g = h = c - j / 2, a = ~~a, f += [j, i, 0, 0, i, j][a], g += [i, j, j, i, 0, 0][a], h += [0, 0, i, j, j, i][a], _(f, g, h, d)
                }, c.rgb2hsb = function(a, b, c) {
                    c = $(a, b, c), a = c[0], b = c[1], c = c[2];
                    var d, e, f, g;
                    return f = E(a, b, c), g = f - F(a, b, c), d = 0 == g ? null : f == a ? (b - c) / g : f == b ? (c - a) / g + 2 : (a - b) / g + 4, d = (d + 360) % 6 * 60 / 360, e = 0 == g ? 0 : g / f, {
                        h: d,
                        s: e,
                        b: f,
                        toString: X
                    }
                }, c.rgb2hsl = function(a, b, c) {
                    c = $(a, b, c), a = c[0], b = c[1], c = c[2];
                    var d, e, f, g, h, i;
                    return g = E(a, b, c), h = F(a, b, c), i = g - h, d = 0 == i ? null : g == a ? (b - c) / i : g == b ? (c - a) / i + 2 : (a - b) / i + 4, d = (d + 360) % 6 * 60 / 360, f = (g + h) / 2, e = 0 == i ? 0 : .5 > f ? i / (2 * f) : i / (2 - 2 * f), {
                        h: d,
                        s: e,
                        l: f,
                        toString: Y
                    }
                }, c.parsePathString = function(a) {
                    if (!a) return null;
                    var b = c.path(a);
                    if (b.arr) return c.path.clone(b.arr);
                    var d = {
                            a: 7,
                            c: 6,
                            o: 2,
                            h: 1,
                            l: 2,
                            m: 2,
                            r: 4,
                            q: 4,
                            s: 4,
                            t: 2,
                            v: 1,
                            u: 3,
                            z: 0
                        },
                        f = [];
                    return e(a, "array") && e(a[0], "array") && (f = c.path.clone(a)), f.length || A(a).replace(N, function(a, b, c) {
                        var e = [],
                            g = b.toLowerCase();
                        if (c.replace(P, function(a, b) {
                                b && e.push(+b)
                            }), "m" == g && e.length > 2 && (f.push([b].concat(e.splice(0, 2))), g = "l", b = "m" == b ? "l" : "L"), "o" == g && 1 == e.length && f.push([b, e[0]]), "r" == g) f.push([b].concat(e));
                        else
                            for (; e.length >= d[g] && (f.push([b].concat(e.splice(0, d[g]))), d[g]););
                    }), f.toString = c.path.toString, b.arr = c.path.clone(f), f
                };
                var aa = c.parseTransformString = function(a) {
                    if (!a) return null;
                    var b = [];
                    return e(a, "array") && e(a[0], "array") && (b = c.path.clone(a)), b.length || A(a).replace(O, function(a, c, d) {
                        var e = [];
                        c.toLowerCase(), d.replace(P, function(a, b) {
                            b && e.push(+b)
                        }), b.push([c].concat(e))
                    }), b.toString = c.path.toString, b
                };
                c._.svgTransform2string = m, c._.rgTransform = /^[a-z][\s]*-?\.?\d/i, c._.transform2matrix = n, c._unit2px = q, y.doc.contains || y.doc.compareDocumentPosition ? function(a, b) {
                    var c = 9 == a.nodeType ? a.documentElement : a,
                        d = b && b.parentNode;
                    return a == d || !(!d || 1 != d.nodeType || !(c.contains ? c.contains(d) : a.compareDocumentPosition && 16 & a.compareDocumentPosition(d)))
                } : function(a, b) {
                    if (b)
                        for (; b;)
                            if (b = b.parentNode, b == a) return !0;
                    return !1
                }, c._.getSomeDefs = o, c._.getSomeSVG = p, c.select = function(a) {
                    return a = A(a).replace(/([^\\]):/g, "$1\\:"), w(y.doc.querySelector(a))
                }, c.selectAll = function(a) {
                    for (var b = y.doc.querySelectorAll(a), d = (c.set || Array)(), e = 0; e < b.length; e++) d.push(w(b[e]));
                    return d
                }, setInterval(function() {
                    for (var a in V)
                        if (V[z](a)) {
                            var b = V[a],
                                c = b.node;
                            ("svg" != b.type && !c.ownerSVGElement || "svg" == b.type && (!c.parentNode || "ownerSVGElement" in c.parentNode && !c.ownerSVGElement)) && delete V[a]
                        }
                }, 1e4), s.prototype.attr = function(a, c) {
                    var d = this,
                        f = d.node;
                    if (!a) {
                        if (1 != f.nodeType) return {
                            text: f.nodeValue
                        };
                        for (var g = f.attributes, h = {}, i = 0, j = g.length; j > i; i++) h[g[i].nodeName] = g[i].nodeValue;
                        return h
                    }
                    if (e(a, "string")) {
                        if (!(arguments.length > 1)) return b("snap.util.getattr." + a, d).firstDefined();
                        var k = {};
                        k[a] = c, a = k
                    }
                    for (var l in a) a[z](l) && b("snap.util.attr." + l, d, a[l]);
                    return d
                }, c.parse = function(a) {
                    var b = y.doc.createDocumentFragment(),
                        c = !0,
                        d = y.doc.createElement("div");
                    if (a = A(a), a.match(/^\s*<\s*svg(?:\s|>)/) || (a = "<svg>" + a + "</svg>", c = !1), d.innerHTML = a, a = d.getElementsByTagName("svg")[0])
                        if (c) b = a;
                        else
                            for (; a.firstChild;) b.appendChild(a.firstChild);
                    return new t(b)
                }, c.fragment = function() {
                    for (var a = Array.prototype.slice.call(arguments, 0), b = y.doc.createDocumentFragment(), d = 0, e = a.length; e > d; d++) {
                        var f = a[d];
                        f.node && f.node.nodeType && b.appendChild(f.node), f.nodeType && b.appendChild(f), "string" == typeof f && b.appendChild(c.parse(f).node)
                    }
                    return new t(b)
                }, c._.make = u, c._.wrap = w, v.prototype.el = function(a, b) {
                    var c = u(a, this.node);
                    return b && c.attr(b), c
                }, s.prototype.children = function() {
                    for (var a = [], b = this.node.childNodes, d = 0, e = b.length; e > d; d++) a[d] = c(b[d]);
                    return a
                }, s.prototype.toJSON = function() {
                    var a = [];
                    return x([this], a), a[0]
                }, b.on("snap.util.getattr", function() {
                    var a = b.nt();
                    a = a.substring(a.lastIndexOf(".") + 1);
                    var c = a.replace(/[A-Z]/g, function(a) {
                        return "-" + a.toLowerCase()
                    });
                    return ba[z](c) ? this.node.ownerDocument.defaultView.getComputedStyle(this.node, null).getPropertyValue(c) : d(this.node, a)
                });
                var ba = {
                    "alignment-baseline": 0,
                    "baseline-shift": 0,
                    clip: 0,
                    "clip-path": 0,
                    "clip-rule": 0,
                    color: 0,
                    "color-interpolation": 0,
                    "color-interpolation-filters": 0,
                    "color-profile": 0,
                    "color-rendering": 0,
                    cursor: 0,
                    direction: 0,
                    display: 0,
                    "dominant-baseline": 0,
                    "enable-background": 0,
                    fill: 0,
                    "fill-opacity": 0,
                    "fill-rule": 0,
                    filter: 0,
                    "flood-color": 0,
                    "flood-opacity": 0,
                    font: 0,
                    "font-family": 0,
                    "font-size": 0,
                    "font-size-adjust": 0,
                    "font-stretch": 0,
                    "font-style": 0,
                    "font-variant": 0,
                    "font-weight": 0,
                    "glyph-orientation-horizontal": 0,
                    "glyph-orientation-vertical": 0,
                    "image-rendering": 0,
                    kerning: 0,
                    "letter-spacing": 0,
                    "lighting-color": 0,
                    marker: 0,
                    "marker-end": 0,
                    "marker-mid": 0,
                    "marker-start": 0,
                    mask: 0,
                    opacity: 0,
                    overflow: 0,
                    "pointer-events": 0,
                    "shape-rendering": 0,
                    "stop-color": 0,
                    "stop-opacity": 0,
                    stroke: 0,
                    "stroke-dasharray": 0,
                    "stroke-dashoffset": 0,
                    "stroke-linecap": 0,
                    "stroke-linejoin": 0,
                    "stroke-miterlimit": 0,
                    "stroke-opacity": 0,
                    "stroke-width": 0,
                    "text-anchor": 0,
                    "text-decoration": 0,
                    "text-rendering": 0,
                    "unicode-bidi": 0,
                    visibility: 0,
                    "word-spacing": 0,
                    "writing-mode": 0
                };
                b.on("snap.util.attr", function(a) {
                        var c = b.nt(),
                            e = {};
                        c = c.substring(c.lastIndexOf(".") + 1), e[c] = a;
                        var f = c.replace(/-(\w)/gi, function(a, b) {
                                return b.toUpperCase()
                            }),
                            g = c.replace(/[A-Z]/g, function(a) {
                                return "-" + a.toLowerCase()
                            });
                        ba[z](g) ? this.node.style[f] = null == a ? I : a : d(this.node, e)
                    }),
                    function() {}(v.prototype), c.ajax = function(a, c, d, f) {
                        var g = new XMLHttpRequest,
                            h = S();
                        if (g) {
                            if (e(c, "function")) f = d, d = c, c = null;
                            else if (e(c, "object")) {
                                var i = [];
                                for (var j in c) c.hasOwnProperty(j) && i.push(encodeURIComponent(j) + "=" + encodeURIComponent(c[j]));
                                c = i.join("&")
                            }
                            return g.open(c ? "POST" : "GET", a, !0), c && (g.setRequestHeader("X-Requested-With", "XMLHttpRequest"), g.setRequestHeader("Content-type", "application/x-www-form-urlencoded")), d && (b.once("snap.ajax." + h + ".0", d), b.once("snap.ajax." + h + ".200", d), b.once("snap.ajax." + h + ".304", d)), g.onreadystatechange = function() {
                                4 == g.readyState && b("snap.ajax." + h + "." + g.status, f, g)
                            }, 4 == g.readyState ? g : (g.send(c), g)
                        }
                    }, c.load = function(a, b, d) {
                        c.ajax(a, function(a) {
                            var e = c.parse(a.responseText);
                            d ? b.call(d, e) : b(e)
                        })
                    };
                var ca = function(a) {
                    var b = a.getBoundingClientRect(),
                        c = a.ownerDocument,
                        d = c.body,
                        e = c.documentElement,
                        f = e.clientTop || d.clientTop || 0,
                        h = e.clientLeft || d.clientLeft || 0,
                        i = b.top + (g.win.pageYOffset || e.scrollTop || d.scrollTop) - f,
                        j = b.left + (g.win.pageXOffset || e.scrollLeft || d.scrollLeft) - h;
                    return {
                        y: i,
                        x: j
                    }
                };
                return c.getElementByPoint = function(a, b) {
                    var c = this,
                        d = (c.canvas, y.doc.elementFromPoint(a, b));
                    if (y.win.opera && "svg" == d.tagName) {
                        var e = ca(d),
                            f = d.createSVGRect();
                        f.x = a - e.x, f.y = b - e.y, f.width = f.height = 1;
                        var g = d.getIntersectionList(f, null);
                        g.length && (d = g[g.length - 1])
                    }
                    return d ? w(d) : null
                }, c.plugin = function(a) {
                    a(c, s, v, y, t)
                }, y.win.Snap = c, c
            }(a || this);
        return d.plugin(function(d, e, f, g, h) {
            function i(a, b) {
                if (null == b) {
                    var c = !0;
                    if (b = a.node.getAttribute("linearGradient" == a.type || "radialGradient" == a.type ? "gradientTransform" : "pattern" == a.type ? "patternTransform" : "transform"), !b) return new d.Matrix;
                    b = d._.svgTransform2string(b)
                } else b = d._.rgTransform.test(b) ? o(b).replace(/\.{3}|\u2026/g, a._.transform || "") : d._.svgTransform2string(b), n(b, "array") && (b = d.path ? d.path.toString.call(b) : o(b)), a._.transform = b;
                var e = d._.transform2matrix(b, a.getBBox(1));
                return c ? e : void(a.matrix = e)
            }

            function j(a) {
                function b(a, b) {
                    var c = q(a.node, b);
                    c = c && c.match(f), c = c && c[2], c && "#" == c.charAt() && (c = c.substring(1), c && (h[c] = (h[c] || []).concat(function(c) {
                        var d = {};
                        d[b] = URL(c), q(a.node, d)
                    })))
                }

                function c(a) {
                    var b = q(a.node, "xlink:href");
                    b && "#" == b.charAt() && (b = b.substring(1), b && (h[b] = (h[b] || []).concat(function(b) {
                        a.attr("xlink:href", "#" + b)
                    })))
                }
                for (var d, e = a.selectAll("*"), f = /^\s*url\(("|'|)(.*)\1\)\s*$/, g = [], h = {}, i = 0, j = e.length; j > i; i++) {
                    d = e[i], b(d, "fill"), b(d, "stroke"), b(d, "filter"), b(d, "mask"), b(d, "clip-path"), c(d);
                    var k = q(d.node, "id");
                    k && (q(d.node, {
                        id: d.id
                    }), g.push({
                        old: k,
                        id: d.id
                    }))
                }
                for (i = 0, j = g.length; j > i; i++) {
                    var l = h[g[i].old];
                    if (l)
                        for (var m = 0, n = l.length; n > m; m++) l[m](g[i].id)
                }
            }

            function k(a, b, c) {
                return function(d) {
                    var e = d.slice(a, b);
                    return 1 == e.length && (e = e[0]), c ? c(e) : e
                }
            }

            function l(a) {
                return function() {
                    var b = a ? "<" + this.type : "",
                        c = this.node.attributes,
                        d = this.node.childNodes;
                    if (a)
                        for (var e = 0, f = c.length; f > e; e++) b += " " + c[e].name + '="' + c[e].value.replace(/"/g, '\\"') + '"';
                    if (d.length) {
                        for (a && (b += ">"), e = 0, f = d.length; f > e; e++) 3 == d[e].nodeType ? b += d[e].nodeValue : 1 == d[e].nodeType && (b += u(d[e]).toString());
                        a && (b += "</" + this.type + ">")
                    } else a && (b += "/>");
                    return b
                }
            }
            var m = e.prototype,
                n = d.is,
                o = String,
                p = d._unit2px,
                q = d._.$,
                r = d._.make,
                s = d._.getSomeDefs,
                t = "hasOwnProperty",
                u = d._.wrap;
            m.getBBox = function(a) {
                if (!d.Matrix || !d.path) return this.node.getBBox();
                var b = this,
                    c = new d.Matrix;
                if (b.removed) return d._.box();
                for (;
                    "use" == b.type;)
                    if (a || (c = c.add(b.transform().localMatrix.translate(b.attr("x") || 0, b.attr("y") || 0))), b.original) b = b.original;
                    else {
                        var e = b.attr("xlink:href");
                        b = b.original = b.node.ownerDocument.getElementById(e.substring(e.indexOf("#") + 1))
                    }
                var f = b._,
                    g = d.path.get[b.type] || d.path.get.deflt;
                try {
                    return a ? (f.bboxwt = g ? d.path.getBBox(b.realPath = g(b)) : d._.box(b.node.getBBox()), d._.box(f.bboxwt)) : (b.realPath = g(b), b.matrix = b.transform().localMatrix, f.bbox = d.path.getBBox(d.path.map(b.realPath, c.add(b.matrix))), d._.box(f.bbox))
                } catch (h) {
                    return d._.box()
                }
            };
            var v = function() {
                return this.string
            };
            m.transform = function(a) {
                var b = this._;
                if (null == a) {
                    for (var c, e = this, f = new d.Matrix(this.node.getCTM()), g = i(this), h = [g], j = new d.Matrix, k = g.toTransformString(), l = o(g) == o(this.matrix) ? o(b.transform) : k;
                        "svg" != e.type && (e = e.parent());) h.push(i(e));
                    for (c = h.length; c--;) j.add(h[c]);
                    return {
                        string: l,
                        globalMatrix: f,
                        totalMatrix: j,
                        localMatrix: g,
                        diffMatrix: f.clone().add(g.invert()),
                        global: f.toTransformString(),
                        total: j.toTransformString(),
                        local: k,
                        toString: v
                    }
                }
                return a instanceof d.Matrix ? (this.matrix = a, this._.transform = a.toTransformString()) : i(this, a), this.node && ("linearGradient" == this.type || "radialGradient" == this.type ? q(this.node, {
                    gradientTransform: this.matrix
                }) : "pattern" == this.type ? q(this.node, {
                    patternTransform: this.matrix
                }) : q(this.node, {
                    transform: this.matrix
                })), this
            }, m.parent = function() {
                return u(this.node.parentNode)
            }, m.append = m.add = function(a) {
                if (a) {
                    if ("set" == a.type) {
                        var b = this;
                        return a.forEach(function(a) {
                            b.add(a)
                        }), this
                    }
                    a = u(a), this.node.appendChild(a.node), a.paper = this.paper
                }
                return this
            }, m.appendTo = function(a) {
                return a && (a = u(a), a.append(this)), this
            }, m.prepend = function(a) {
                if (a) {
                    if ("set" == a.type) {
                        var b, c = this;
                        return a.forEach(function(a) {
                            b ? b.after(a) : c.prepend(a), b = a
                        }), this
                    }
                    a = u(a);
                    var d = a.parent();
                    this.node.insertBefore(a.node, this.node.firstChild), this.add && this.add(), a.paper = this.paper, this.parent() && this.parent().add(), d && d.add()
                }
                return this
            }, m.prependTo = function(a) {
                return a = u(a), a.prepend(this), this
            }, m.before = function(a) {
                if ("set" == a.type) {
                    var b = this;
                    return a.forEach(function(a) {
                        var c = a.parent();
                        b.node.parentNode.insertBefore(a.node, b.node), c && c.add()
                    }), this.parent().add(), this
                }
                a = u(a);
                var c = a.parent();
                return this.node.parentNode.insertBefore(a.node, this.node), this.parent() && this.parent().add(), c && c.add(), a.paper = this.paper, this
            }, m.after = function(a) {
                a = u(a);
                var b = a.parent();
                return this.node.nextSibling ? this.node.parentNode.insertBefore(a.node, this.node.nextSibling) : this.node.parentNode.appendChild(a.node), this.parent() && this.parent().add(), b && b.add(), a.paper = this.paper, this
            }, m.insertBefore = function(a) {
                a = u(a);
                var b = this.parent();
                return a.node.parentNode.insertBefore(this.node, a.node), this.paper = a.paper, b && b.add(), a.parent() && a.parent().add(), this
            }, m.insertAfter = function(a) {
                a = u(a);
                var b = this.parent();
                return a.node.parentNode.insertBefore(this.node, a.node.nextSibling), this.paper = a.paper, b && b.add(), a.parent() && a.parent().add(), this
            }, m.remove = function() {
                var a = this.parent();
                return this.node.parentNode && this.node.parentNode.removeChild(this.node), delete this.paper, this.removed = !0, a && a.add(), this
            }, m.select = function(a) {
                return u(this.node.querySelector(a))
            }, m.selectAll = function(a) {
                for (var b = this.node.querySelectorAll(a), c = (d.set || Array)(), e = 0; e < b.length; e++) c.push(u(b[e]));
                return c
            }, m.asPX = function(a, b) {
                return null == b && (b = this.attr(a)), +p(this, a, b)
            }, m.use = function() {
                var a, b = this.node.id;
                return b || (b = this.id, q(this.node, {
                    id: b
                })), a = "linearGradient" == this.type || "radialGradient" == this.type || "pattern" == this.type ? r(this.type, this.node.parentNode) : r("use", this.node.parentNode), q(a.node, {
                    "xlink:href": "#" + b
                }), a.original = this, a
            }, m.clone = function() {
                var a = u(this.node.cloneNode(!0));
                return q(a.node, "id") && q(a.node, {
                    id: a.id
                }), j(a), a.insertAfter(this), a
            }, m.toDefs = function() {
                var a = s(this);
                return a.appendChild(this.node), this
            }, m.pattern = m.toPattern = function(a, b, c, d) {
                var e = r("pattern", s(this));
                return null == a && (a = this.getBBox()), n(a, "object") && "x" in a && (b = a.y, c = a.width, d = a.height, a = a.x), q(e.node, {
                    x: a,
                    y: b,
                    width: c,
                    height: d,
                    patternUnits: "userSpaceOnUse",
                    id: e.id,
                    viewBox: [a, b, c, d].join(" ")
                }), e.node.appendChild(this.node), e
            }, m.marker = function(a, b, c, d, e, f) {
                var g = r("marker", s(this));
                return null == a && (a = this.getBBox()), n(a, "object") && "x" in a && (b = a.y, c = a.width, d = a.height, e = a.refX || a.cx, f = a.refY || a.cy, a = a.x), q(g.node, {
                    viewBox: [a, b, c, d].join(" "),
                    markerWidth: c,
                    markerHeight: d,
                    orient: "auto",
                    refX: e || 0,
                    refY: f || 0,
                    id: g.id
                }), g.node.appendChild(this.node), g
            };
            var w = function(a, b, d, e) {
                "function" != typeof d || d.length || (e = d, d = c.linear), this.attr = a, this.dur = b, d && (this.easing = d), e && (this.callback = e)
            };
            d._.Animation = w, d.animation = function(a, b, c, d) {
                return new w(a, b, c, d)
            }, m.inAnim = function() {
                var a = this,
                    b = [];
                for (var c in a.anims) a.anims[t](c) && ! function(a) {
                    b.push({
                        anim: new w(a._attrs, a.dur, a.easing, a._callback),
                        mina: a,
                        curStatus: a.status(),
                        status: function(b) {
                            return a.status(b)
                        },
                        stop: function() {
                            a.stop()
                        }
                    })
                }(a.anims[c]);
                return b
            }, d.animate = function(a, d, e, f, g, h) {
                "function" != typeof g || g.length || (h = g, g = c.linear);
                var i = c.time(),
                    j = c(a, d, i, i + f, c.time, e, g);
                return h && b.once("mina.finish." + j.id, h), j
            }, m.stop = function() {
                for (var a = this.inAnim(), b = 0, c = a.length; c > b; b++) a[b].stop();
                return this
            }, m.animate = function(a, d, e, f) {
                "function" != typeof e || e.length || (f = e, e = c.linear), a instanceof w && (f = a.callback, e = a.easing, d = a.dur, a = a.attr);
                var g, h, i, j, l = [],
                    m = [],
                    p = {},
                    q = this;
                for (var r in a)
                    if (a[t](r)) {
                        q.equal ? (j = q.equal(r, o(a[r])), g = j.from, h = j.to, i = j.f) : (g = +q.attr(r), h = +a[r]);
                        var s = n(g, "array") ? g.length : 1;
                        p[r] = k(l.length, l.length + s, i), l = l.concat(g), m = m.concat(h)
                    }
                var u = c.time(),
                    v = c(l, m, u, u + d, c.time, function(a) {
                        var b = {};
                        for (var c in p) p[t](c) && (b[c] = p[c](a));
                        q.attr(b)
                    }, e);
                return q.anims[v.id] = v, v._attrs = a, v._callback = f, b("snap.animcreated." + q.id, v), b.once("mina.finish." + v.id, function() {
                    delete q.anims[v.id], f && f.call(q)
                }), b.once("mina.stop." + v.id, function() {
                    delete q.anims[v.id]
                }), q
            };
            var x = {};
            m.data = function(a, c) {
                var e = x[this.id] = x[this.id] || {};
                if (0 == arguments.length) return b("snap.data.get." + this.id, this, e, null), e;
                if (1 == arguments.length) {
                    if (d.is(a, "object")) {
                        for (var f in a) a[t](f) && this.data(f, a[f]);
                        return this
                    }
                    return b("snap.data.get." + this.id, this, e[a], a), e[a]
                }
                return e[a] = c, b("snap.data.set." + this.id, this, c, a), this
            }, m.removeData = function(a) {
                return null == a ? x[this.id] = {} : x[this.id] && delete x[this.id][a], this
            }, m.outerSVG = m.toString = l(1), m.innerSVG = l(), m.toDataURL = function() {
                if (a && a.btoa) {
                    var b = this.getBBox(),
                        c = d.format('<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{width}" height="{height}" viewBox="{x} {y} {width} {height}">{contents}</svg>', {
                            x: +b.x.toFixed(3),
                            y: +b.y.toFixed(3),
                            width: +b.width.toFixed(3),
                            height: +b.height.toFixed(3),
                            contents: this.outerSVG()
                        });
                    return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(c)))
                }
            }, h.prototype.select = m.select, h.prototype.selectAll = m.selectAll
        }), d.plugin(function(a) {
            function b(a, b, d, e, f, g) {
                return null == b && "[object SVGMatrix]" == c.call(a) ? (this.a = a.a, this.b = a.b, this.c = a.c, this.d = a.d, this.e = a.e, void(this.f = a.f)) : void(null != a ? (this.a = +a, this.b = +b, this.c = +d, this.d = +e, this.e = +f, this.f = +g) : (this.a = 1, this.b = 0, this.c = 0, this.d = 1, this.e = 0, this.f = 0))
            }
            var c = Object.prototype.toString,
                d = String,
                e = Math,
                f = "";
            ! function(c) {
                function g(a) {
                    return a[0] * a[0] + a[1] * a[1]
                }

                function h(a) {
                    var b = e.sqrt(g(a));
                    a[0] && (a[0] /= b), a[1] && (a[1] /= b)
                }
                c.add = function(a, c, d, e, f, g) {
                    var h, i, j, k, l = [
                            [],
                            [],
                            []
                        ],
                        m = [
                            [this.a, this.c, this.e],
                            [this.b, this.d, this.f],
                            [0, 0, 1]
                        ],
                        n = [
                            [a, d, f],
                            [c, e, g],
                            [0, 0, 1]
                        ];
                    for (a && a instanceof b && (n = [
                            [a.a, a.c, a.e],
                            [a.b, a.d, a.f],
                            [0, 0, 1]
                        ]), h = 0; 3 > h; h++)
                        for (i = 0; 3 > i; i++) {
                            for (k = 0, j = 0; 3 > j; j++) k += m[h][j] * n[j][i];
                            l[h][i] = k
                        }
                    return this.a = l[0][0], this.b = l[1][0], this.c = l[0][1], this.d = l[1][1], this.e = l[0][2], this.f = l[1][2], this
                }, c.invert = function() {
                    var a = this,
                        c = a.a * a.d - a.b * a.c;
                    return new b(a.d / c, -a.b / c, -a.c / c, a.a / c, (a.c * a.f - a.d * a.e) / c, (a.b * a.e - a.a * a.f) / c)
                }, c.clone = function() {
                    return new b(this.a, this.b, this.c, this.d, this.e, this.f)
                }, c.translate = function(a, b) {
                    return this.add(1, 0, 0, 1, a, b)
                }, c.scale = function(a, b, c, d) {
                    return null == b && (b = a), (c || d) && this.add(1, 0, 0, 1, c, d), this.add(a, 0, 0, b, 0, 0), (c || d) && this.add(1, 0, 0, 1, -c, -d), this
                }, c.rotate = function(b, c, d) {
                    b = a.rad(b), c = c || 0, d = d || 0;
                    var f = +e.cos(b).toFixed(9),
                        g = +e.sin(b).toFixed(9);
                    return this.add(f, g, -g, f, c, d), this.add(1, 0, 0, 1, -c, -d)
                }, c.x = function(a, b) {
                    return a * this.a + b * this.c + this.e
                }, c.y = function(a, b) {
                    return a * this.b + b * this.d + this.f
                }, c.get = function(a) {
                    return +this[d.fromCharCode(97 + a)].toFixed(4)
                }, c.toString = function() {
                    return "matrix(" + [this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5)].join() + ")"
                }, c.offset = function() {
                    return [this.e.toFixed(4), this.f.toFixed(4)]
                }, c.determinant = function() {
                    return this.a * this.d - this.b * this.c
                }, c.split = function() {
                    var b = {};
                    b.dx = this.e, b.dy = this.f;
                    var c = [
                        [this.a, this.c],
                        [this.b, this.d]
                    ];
                    b.scalex = e.sqrt(g(c[0])), h(c[0]), b.shear = c[0][0] * c[1][0] + c[0][1] * c[1][1], c[1] = [c[1][0] - c[0][0] * b.shear, c[1][1] - c[0][1] * b.shear], b.scaley = e.sqrt(g(c[1])), h(c[1]), b.shear /= b.scaley, this.determinant() < 0 && (b.scalex = -b.scalex);
                    var d = -c[0][1],
                        f = c[1][1];
                    return 0 > f ? (b.rotate = a.deg(e.acos(f)), 0 > d && (b.rotate = 360 - b.rotate)) : b.rotate = a.deg(e.asin(d)), b.isSimple = !(+b.shear.toFixed(9) || b.scalex.toFixed(9) != b.scaley.toFixed(9) && b.rotate), b.isSuperSimple = !+b.shear.toFixed(9) && b.scalex.toFixed(9) == b.scaley.toFixed(9) && !b.rotate, b.noRotation = !+b.shear.toFixed(9) && !b.rotate, b
                }, c.toTransformString = function(a) {
                    var b = a || this.split();
                    return +b.shear.toFixed(9) ? "m" + [this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5)] : (b.scalex = +b.scalex.toFixed(4), b.scaley = +b.scaley.toFixed(4), b.rotate = +b.rotate.toFixed(4), (b.dx || b.dy ? "t" + [+b.dx.toFixed(4), +b.dy.toFixed(4)] : f) + (1 != b.scalex || 1 != b.scaley ? "s" + [b.scalex, b.scaley, 0, 0] : f) + (b.rotate ? "r" + [+b.rotate.toFixed(4), 0, 0] : f))
                }
            }(b.prototype), a.Matrix = b, a.matrix = function(a, c, d, e, f, g) {
                return new b(a, c, d, e, f, g)
            }
        }), d.plugin(function(a, c, d, e, f) {
            function g(d) {
                return function(e) {
                    if (b.stop(), e instanceof f && 1 == e.node.childNodes.length && ("radialGradient" == e.node.firstChild.tagName || "linearGradient" == e.node.firstChild.tagName || "pattern" == e.node.firstChild.tagName) && (e = e.node.firstChild, n(this).appendChild(e), e = l(e)), e instanceof c)
                        if ("radialGradient" == e.type || "linearGradient" == e.type || "pattern" == e.type) {
                            e.node.id || p(e.node, {
                                id: e.id
                            });
                            var g = q(e.node.id)
                        } else g = e.attr(d);
                    else if (g = a.color(e), g.error) {
                        var h = a(n(this).ownerSVGElement).gradient(e);
                        h ? (h.node.id || p(h.node, {
                            id: h.id
                        }), g = q(h.node.id)) : g = e
                    } else g = r(g);
                    var i = {};
                    i[d] = g, p(this.node, i), this.node.style[d] = t
                }
            }

            function h(a) {
                b.stop(), a == +a && (a += "px"), this.node.style.fontSize = a
            }

            function i(a) {
                for (var b = [], c = a.childNodes, d = 0, e = c.length; e > d; d++) {
                    var f = c[d];
                    3 == f.nodeType && b.push(f.nodeValue), "tspan" == f.tagName && b.push(1 == f.childNodes.length && 3 == f.firstChild.nodeType ? f.firstChild.nodeValue : i(f))
                }
                return b
            }

            function j() {
                return b.stop(), this.node.style.fontSize
            }
            var k = a._.make,
                l = a._.wrap,
                m = a.is,
                n = a._.getSomeDefs,
                o = /^url\(#?([^)]+)\)$/,
                p = a._.$,
                q = a.url,
                r = String,
                s = a._.separator,
                t = "";
            b.on("snap.util.attr.mask", function(a) {
                    if (a instanceof c || a instanceof f) {
                        if (b.stop(), a instanceof f && 1 == a.node.childNodes.length && (a = a.node.firstChild, n(this).appendChild(a), a = l(a)), "mask" == a.type) var d = a;
                        else d = k("mask", n(this)), d.node.appendChild(a.node);
                        !d.node.id && p(d.node, {
                            id: d.id
                        }), p(this.node, {
                            mask: q(d.id)
                        })
                    }
                }),
                function(a) {
                    b.on("snap.util.attr.clip", a), b.on("snap.util.attr.clip-path", a), b.on("snap.util.attr.clipPath", a)
                }(function(a) {
                    if (a instanceof c || a instanceof f) {
                        if (b.stop(), "clipPath" == a.type) var d = a;
                        else d = k("clipPath", n(this)), d.node.appendChild(a.node), !d.node.id && p(d.node, {
                            id: d.id
                        });
                        p(this.node, {
                            "clip-path": q(d.node.id || d.id)
                        })
                    }
                }), b.on("snap.util.attr.fill", g("fill")), b.on("snap.util.attr.stroke", g("stroke"));
            var u = /^([lr])(?:\(([^)]*)\))?(.*)$/i;
            b.on("snap.util.grad.parse", function(a) {
                    a = r(a);
                    var b = a.match(u);
                    if (!b) return null;
                    var c = b[1],
                        d = b[2],
                        e = b[3];
                    return d = d.split(/\s*,\s*/).map(function(a) {
                        return +a == a ? +a : a
                    }), 1 == d.length && 0 == d[0] && (d = []), e = e.split("-"), e = e.map(function(a) {
                        a = a.split(":");
                        var b = {
                            color: a[0]
                        };
                        return a[1] && (b.offset = parseFloat(a[1])), b
                    }), {
                        type: c,
                        params: d,
                        stops: e
                    }
                }), b.on("snap.util.attr.d", function(c) {
                    b.stop(), m(c, "array") && m(c[0], "array") && (c = a.path.toString.call(c)), c = r(c), c.match(/[ruo]/i) && (c = a.path.toAbsolute(c)), p(this.node, {
                        d: c
                    })
                })(-1), b.on("snap.util.attr.#text", function(a) {
                    b.stop(), a = r(a);
                    for (var c = e.doc.createTextNode(a); this.node.firstChild;) this.node.removeChild(this.node.firstChild);
                    this.node.appendChild(c)
                })(-1), b.on("snap.util.attr.path", function(a) {
                    b.stop(), this.attr({
                        d: a
                    })
                })(-1), b.on("snap.util.attr.class", function(a) {
                    b.stop(), this.node.className.baseVal = a
                })(-1), b.on("snap.util.attr.viewBox", function(a) {
                    var c;
                    c = m(a, "object") && "x" in a ? [a.x, a.y, a.width, a.height].join(" ") : m(a, "array") ? a.join(" ") : a, p(this.node, {
                        viewBox: c
                    }), b.stop()
                })(-1), b.on("snap.util.attr.transform", function(a) {
                    this.transform(a), b.stop()
                })(-1), b.on("snap.util.attr.r", function(a) {
                    "rect" == this.type && (b.stop(), p(this.node, {
                        rx: a,
                        ry: a
                    }))
                })(-1), b.on("snap.util.attr.textpath", function(a) {
                    if (b.stop(), "text" == this.type) {
                        var d, e, f;
                        if (!a && this.textPath) {
                            for (e = this.textPath; e.node.firstChild;) this.node.appendChild(e.node.firstChild);
                            return e.remove(), void delete this.textPath
                        }
                        if (m(a, "string")) {
                            var g = n(this),
                                h = l(g.parentNode).path(a);
                            g.appendChild(h.node), d = h.id, h.attr({
                                id: d
                            })
                        } else a = l(a), a instanceof c && (d = a.attr("id"), d || (d = a.id, a.attr({
                            id: d
                        })));
                        if (d)
                            if (e = this.textPath, f = this.node, e) e.attr({
                                "xlink:href": "#" + d
                            });
                            else {
                                for (e = p("textPath", {
                                        "xlink:href": "#" + d
                                    }); f.firstChild;) e.appendChild(f.firstChild);
                                f.appendChild(e), this.textPath = l(e)
                            }
                    }
                })(-1), b.on("snap.util.attr.text", function(a) {
                    if ("text" == this.type) {
                        for (var c = this.node, d = function(a) {
                                var b = p("tspan");
                                if (m(a, "array"))
                                    for (var c = 0; c < a.length; c++) b.appendChild(d(a[c]));
                                else b.appendChild(e.doc.createTextNode(a));
                                return b.normalize && b.normalize(), b
                            }; c.firstChild;) c.removeChild(c.firstChild);
                        for (var f = d(a); f.firstChild;) c.appendChild(f.firstChild)
                    }
                    b.stop()
                })(-1), b.on("snap.util.attr.fontSize", h)(-1), b.on("snap.util.attr.font-size", h)(-1), b.on("snap.util.getattr.transform", function() {
                    return b.stop(), this.transform()
                })(-1), b.on("snap.util.getattr.textpath", function() {
                    return b.stop(), this.textPath
                })(-1),
                function() {
                    function c(c) {
                        return function() {
                            b.stop();
                            var d = e.doc.defaultView.getComputedStyle(this.node, null).getPropertyValue("marker-" + c);
                            return "none" == d ? d : a(e.doc.getElementById(d.match(o)[1]))
                        }
                    }

                    function d(a) {
                        return function(c) {
                            b.stop();
                            var d = "marker" + a.charAt(0).toUpperCase() + a.substring(1);
                            if ("" == c || !c) return void(this.node.style[d] = "none");
                            if ("marker" == c.type) {
                                var e = c.node.id;
                                return e || p(c.node, {
                                    id: c.id
                                }), void(this.node.style[d] = q(e))
                            }
                        }
                    }
                    b.on("snap.util.getattr.marker-end", c("end"))(-1), b.on("snap.util.getattr.markerEnd", c("end"))(-1), b.on("snap.util.getattr.marker-start", c("start"))(-1), b.on("snap.util.getattr.markerStart", c("start"))(-1), b.on("snap.util.getattr.marker-mid", c("mid"))(-1), b.on("snap.util.getattr.markerMid", c("mid"))(-1), b.on("snap.util.attr.marker-end", d("end"))(-1), b.on("snap.util.attr.markerEnd", d("end"))(-1), b.on("snap.util.attr.marker-start", d("start"))(-1), b.on("snap.util.attr.markerStart", d("start"))(-1), b.on("snap.util.attr.marker-mid", d("mid"))(-1), b.on("snap.util.attr.markerMid", d("mid"))(-1)
                }(), b.on("snap.util.getattr.r", function() {
                    return "rect" == this.type && p(this.node, "rx") == p(this.node, "ry") ? (b.stop(), p(this.node, "rx")) : void 0
                })(-1), b.on("snap.util.getattr.text", function() {
                    if ("text" == this.type || "tspan" == this.type) {
                        b.stop();
                        var a = i(this.node);
                        return 1 == a.length ? a[0] : a
                    }
                })(-1), b.on("snap.util.getattr.#text", function() {
                    return this.node.textContent
                })(-1), b.on("snap.util.getattr.viewBox", function() {
                    b.stop();
                    var c = p(this.node, "viewBox");
                    return c ? (c = c.split(s), a._.box(+c[0], +c[1], +c[2], +c[3])) : void 0
                })(-1), b.on("snap.util.getattr.points", function() {
                    var a = p(this.node, "points");
                    return b.stop(), a ? a.split(s) : void 0
                })(-1), b.on("snap.util.getattr.path", function() {
                    var a = p(this.node, "d");
                    return b.stop(), a
                })(-1), b.on("snap.util.getattr.class", function() {
                    return this.node.className.baseVal
                })(-1), b.on("snap.util.getattr.fontSize", j)(-1), b.on("snap.util.getattr.font-size", j)(-1)
        }), d.plugin(function(a, b) {
            var c = /\S+/g,
                d = String,
                e = b.prototype;
            e.addClass = function(a) {
                var b, e, f, g, h = d(a || "").match(c) || [],
                    i = this.node,
                    j = i.className.baseVal,
                    k = j.match(c) || [];
                if (h.length) {
                    for (b = 0; f = h[b++];) e = k.indexOf(f), ~e || k.push(f);
                    g = k.join(" "), j != g && (i.className.baseVal = g)
                }
                return this
            }, e.removeClass = function(a) {
                var b, e, f, g, h = d(a || "").match(c) || [],
                    i = this.node,
                    j = i.className.baseVal,
                    k = j.match(c) || [];
                if (k.length) {
                    for (b = 0; f = h[b++];) e = k.indexOf(f), ~e && k.splice(e, 1);
                    g = k.join(" "), j != g && (i.className.baseVal = g)
                }
                return this
            }, e.hasClass = function(a) {
                var b = this.node,
                    d = b.className.baseVal,
                    e = d.match(c) || [];
                return !!~e.indexOf(a)
            }, e.toggleClass = function(a, b) {
                if (null != b) return b ? this.addClass(a) : this.removeClass(a);
                var d, e, f, g, h = (a || "").match(c) || [],
                    i = this.node,
                    j = i.className.baseVal,
                    k = j.match(c) || [];
                for (d = 0; f = h[d++];) e = k.indexOf(f), ~e ? k.splice(e, 1) : k.push(f);
                return g = k.join(" "), j != g && (i.className.baseVal = g), this
            }
        }), d.plugin(function() {
            function a(a) {
                return a
            }

            function c(a) {
                return function(b) {
                    return +b.toFixed(3) + a
                }
            }
            var d = {
                    "+": function(a, b) {
                        return a + b
                    },
                    "-": function(a, b) {
                        return a - b
                    },
                    "/": function(a, b) {
                        return a / b
                    },
                    "*": function(a, b) {
                        return a * b
                    }
                },
                e = String,
                f = /[a-z]+$/i,
                g = /^\s*([+\-\/*])\s*=\s*([\d.eE+\-]+)\s*([^\d\s]+)?\s*$/;
            b.on("snap.util.attr", function(a) {
                var c = e(a).match(g);
                if (c) {
                    var h = b.nt(),
                        i = h.substring(h.lastIndexOf(".") + 1),
                        j = this.attr(i),
                        k = {};
                    b.stop();
                    var l = c[3] || "",
                        m = j.match(f),
                        n = d[c[1]];
                    if (m && m == l ? a = n(parseFloat(j), +c[2]) : (j = this.asPX(i), a = n(this.asPX(i), this.asPX(i, c[2] + l))), isNaN(j) || isNaN(a)) return;
                    k[i] = a, this.attr(k)
                }
            })(-10), b.on("snap.util.equal", function(h, i) {
                var j = e(this.attr(h) || ""),
                    k = e(i).match(g);
                if (k) {
                    b.stop();
                    var l = k[3] || "",
                        m = j.match(f),
                        n = d[k[1]];
                    return m && m == l ? {
                        from: parseFloat(j),
                        to: n(parseFloat(j), +k[2]),
                        f: c(m)
                    } : (j = this.asPX(h), {
                        from: j,
                        to: n(j, this.asPX(h, k[2] + l)),
                        f: a
                    })
                }
            })(-10)
        }), d.plugin(function(c, d, e, f) {
            var g = e.prototype,
                h = c.is;
            g.rect = function(a, b, c, d, e, f) {
                var g;
                return null == f && (f = e), h(a, "object") && "[object Object]" == a ? g = a : null != a && (g = {
                    x: a,
                    y: b,
                    width: c,
                    height: d
                }, null != e && (g.rx = e, g.ry = f)), this.el("rect", g)
            }, g.circle = function(a, b, c) {
                var d;
                return h(a, "object") && "[object Object]" == a ? d = a : null != a && (d = {
                    cx: a,
                    cy: b,
                    r: c
                }), this.el("circle", d)
            };
            var i = function() {
                function a() {
                    this.parentNode.removeChild(this)
                }
                return function(b, c) {
                    var d = f.doc.createElement("img"),
                        e = f.doc.body;
                    d.style.cssText = "position:absolute;left:-9999em;top:-9999em", d.onload = function() {
                        c.call(d), d.onload = d.onerror = null, e.removeChild(d)
                    }, d.onerror = a, e.appendChild(d), d.src = b
                }
            }();
            g.image = function(a, b, d, e, f) {
                    var g = this.el("image");
                    if (h(a, "object") && "src" in a) g.attr(a);
                    else if (null != a) {
                        var j = {
                            "xlink:href": a,
                            preserveAspectRatio: "none"
                        };
                        null != b && null != d && (j.x = b, j.y = d), null != e && null != f ? (j.width = e, j.height = f) : i(a, function() {
                            c._.$(g.node, {
                                width: this.offsetWidth,
                                height: this.offsetHeight
                            })
                        }), c._.$(g.node, j)
                    }
                    return g
                }, g.ellipse = function(a, b, c, d) {
                    var e;
                    return h(a, "object") && "[object Object]" == a ? e = a : null != a && (e = {
                        cx: a,
                        cy: b,
                        rx: c,
                        ry: d
                    }), this.el("ellipse", e)
                }, g.path = function(a) {
                    var b;
                    return h(a, "object") && !h(a, "array") ? b = a : a && (b = {
                        d: a
                    }), this.el("path", b)
                }, g.group = g.g = function(a) {
                    var b = this.el("g");
                    return 1 == arguments.length && a && !a.type ? b.attr(a) : arguments.length && b.add(Array.prototype.slice.call(arguments, 0)), b
                }, g.svg = function(a, b, c, d, e, f, g, i) {
                    var j = {};
                    return h(a, "object") && null == b ? j = a : (null != a && (j.x = a), null != b && (j.y = b), null != c && (j.width = c), null != d && (j.height = d), null != e && null != f && null != g && null != i && (j.viewBox = [e, f, g, i])), this.el("svg", j)
                }, g.mask = function(a) {
                    var b = this.el("mask");
                    return 1 == arguments.length && a && !a.type ? b.attr(a) : arguments.length && b.add(Array.prototype.slice.call(arguments, 0)), b
                }, g.ptrn = function(a, b, c, d, e, f, g, i) {
                    if (h(a, "object")) var j = a;
                    else j = {
                        patternUnits: "userSpaceOnUse"
                    }, a && (j.x = a), b && (j.y = b), null != c && (j.width = c), null != d && (j.height = d), j.viewBox = null != e && null != f && null != g && null != i ? [e, f, g, i] : [a || 0, b || 0, c || 0, d || 0];
                    return this.el("pattern", j)
                }, g.use = function(a) {
                    return null != a ? (a instanceof d && (a.attr("id") || a.attr({
                        id: c._.id(a)
                    }), a = a.attr("id")), "#" == String(a).charAt() && (a = a.substring(1)), this.el("use", {
                        "xlink:href": "#" + a
                    })) : d.prototype.use.call(this)
                }, g.symbol = function(a, b, c, d) {
                    var e = {};
                    return null != a && null != b && null != c && null != d && (e.viewBox = [a, b, c, d]), this.el("symbol", e)
                }, g.text = function(a, b, c) {
                    var d = {};
                    return h(a, "object") ? d = a : null != a && (d = {
                        x: a,
                        y: b,
                        text: c || ""
                    }), this.el("text", d)
                }, g.line = function(a, b, c, d) {
                    var e = {};
                    return h(a, "object") ? e = a : null != a && (e = {
                        x1: a,
                        x2: c,
                        y1: b,
                        y2: d
                    }), this.el("line", e)
                }, g.polyline = function(a) {
                    arguments.length > 1 && (a = Array.prototype.slice.call(arguments, 0));
                    var b = {};
                    return h(a, "object") && !h(a, "array") ? b = a : null != a && (b = {
                        points: a
                    }), this.el("polyline", b)
                }, g.polygon = function(a) {
                    arguments.length > 1 && (a = Array.prototype.slice.call(arguments, 0));
                    var b = {};
                    return h(a, "object") && !h(a, "array") ? b = a : null != a && (b = {
                        points: a
                    }), this.el("polygon", b)
                },
                function() {
                    function d() {
                        return this.selectAll("stop")
                    }

                    function e(a, b) {
                        var d = k("stop"),
                            e = {
                                offset: +b + "%"
                            };
                        return a = c.color(a), e["stop-color"] = a.hex, a.opacity < 1 && (e["stop-opacity"] = a.opacity), k(d, e), this.node.appendChild(d), this
                    }

                    function f() {
                        if ("linearGradient" == this.type) {
                            var a = k(this.node, "x1") || 0,
                                b = k(this.node, "x2") || 1,
                                d = k(this.node, "y1") || 0,
                                e = k(this.node, "y2") || 0;
                            return c._.box(a, d, math.abs(b - a), math.abs(e - d))
                        }
                        var f = this.node.cx || .5,
                            g = this.node.cy || .5,
                            h = this.node.r || 0;
                        return c._.box(f - h, g - h, 2 * h, 2 * h)
                    }

                    function h(a, c) {
                        function d(a, b) {
                            for (var c = (b - l) / (a - m), d = m; a > d; d++) g[d].offset = +(+l + c * (d - m)).toFixed(2);
                            m = a, l = b
                        }
                        var e, f = b("snap.util.grad.parse", null, c).firstDefined();
                        if (!f) return null;
                        f.params.unshift(a), e = "l" == f.type.toLowerCase() ? i.apply(0, f.params) : j.apply(0, f.params), f.type != f.type.toLowerCase() && k(e.node, {
                            gradientUnits: "userSpaceOnUse"
                        });
                        var g = f.stops,
                            h = g.length,
                            l = 0,
                            m = 0;
                        h--;
                        for (var n = 0; h > n; n++) "offset" in g[n] && d(n, g[n].offset);
                        for (g[h].offset = g[h].offset || 100, d(h, g[h].offset), n = 0; h >= n; n++) {
                            var o = g[n];
                            e.addStop(o.color, o.offset)
                        }
                        return e
                    }

                    function i(a, b, g, h, i) {
                        var j = c._.make("linearGradient", a);
                        return j.stops = d, j.addStop = e, j.getBBox = f, null != b && k(j.node, {
                            x1: b,
                            y1: g,
                            x2: h,
                            y2: i
                        }), j
                    }

                    function j(a, b, g, h, i, j) {
                        var l = c._.make("radialGradient", a);
                        return l.stops = d, l.addStop = e, l.getBBox = f, null != b && k(l.node, {
                            cx: b,
                            cy: g,
                            r: h
                        }), null != i && null != j && k(l.node, {
                            fx: i,
                            fy: j
                        }), l
                    }
                    var k = c._.$;
                    g.gradient = function(a) {
                        return h(this.defs, a)
                    }, g.gradientLinear = function(a, b, c, d) {
                        return i(this.defs, a, b, c, d)
                    }, g.gradientRadial = function(a, b, c, d, e) {
                        return j(this.defs, a, b, c, d, e)
                    }, g.toString = function() {
                        var a, b = this.node.ownerDocument,
                            d = b.createDocumentFragment(),
                            e = b.createElement("div"),
                            f = this.node.cloneNode(!0);
                        return d.appendChild(e), e.appendChild(f), c._.$(f, {
                            xmlns: "http://www.w3.org/2000/svg"
                        }), a = e.innerHTML, d.removeChild(d.firstChild), a
                    }, g.toDataURL = function() {
                        return a && a.btoa ? "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(this))) : void 0
                    }, g.clear = function() {
                        for (var a, b = this.node.firstChild; b;) a = b.nextSibling, "defs" != b.tagName ? b.parentNode.removeChild(b) : g.clear.call({
                            node: b
                        }), b = a
                    }
                }()
        }), d.plugin(function(a, b) {
            function c(a) {
                var b = c.ps = c.ps || {};
                return b[a] ? b[a].sleep = 100 : b[a] = {
                    sleep: 100
                }, setTimeout(function() {
                    for (var c in b) b[K](c) && c != a && (b[c].sleep--, !b[c].sleep && delete b[c])
                }), b[a]
            }

            function d(a, b, c, d) {
                return null == a && (a = b = c = d = 0), null == b && (b = a.y, c = a.width, d = a.height, a = a.x), {
                    x: a,
                    y: b,
                    width: c,
                    w: c,
                    height: d,
                    h: d,
                    x2: a + c,
                    y2: b + d,
                    cx: a + c / 2,
                    cy: b + d / 2,
                    r1: N.min(c, d) / 2,
                    r2: N.max(c, d) / 2,
                    r0: N.sqrt(c * c + d * d) / 2,
                    path: w(a, b, c, d),
                    vb: [a, b, c, d].join(" ")
                }
            }

            function e() {
                return this.join(",").replace(L, "$1")
            }

            function f(a) {
                var b = J(a);
                return b.toString = e, b
            }

            function g(a, b, c, d, e, f, g, h, j) {
                return null == j ? n(a, b, c, d, e, f, g, h) : i(a, b, c, d, e, f, g, h, o(a, b, c, d, e, f, g, h, j))
            }

            function h(c, d) {
                function e(a) {
                    return +(+a).toFixed(3)
                }
                return a._.cacher(function(a, f, h) {
                    a instanceof b && (a = a.attr("d")), a = E(a);
                    for (var j, k, l, m, n, o = "", p = {}, q = 0, r = 0, s = a.length; s > r; r++) {
                        if (l = a[r], "M" == l[0]) j = +l[1], k = +l[2];
                        else {
                            if (m = g(j, k, l[1], l[2], l[3], l[4], l[5], l[6]), q + m > f) {
                                if (d && !p.start) {
                                    if (n = g(j, k, l[1], l[2], l[3], l[4], l[5], l[6], f - q), o += ["C" + e(n.start.x), e(n.start.y), e(n.m.x), e(n.m.y), e(n.x), e(n.y)], h) return o;
                                    p.start = o, o = ["M" + e(n.x), e(n.y) + "C" + e(n.n.x), e(n.n.y), e(n.end.x), e(n.end.y), e(l[5]), e(l[6])].join(), q += m, j = +l[5], k = +l[6];
                                    continue
                                }
                                if (!c && !d) return n = g(j, k, l[1], l[2], l[3], l[4], l[5], l[6], f - q)
                            }
                            q += m, j = +l[5], k = +l[6]
                        }
                        o += l.shift() + l
                    }
                    return p.end = o, n = c ? q : d ? p : i(j, k, l[0], l[1], l[2], l[3], l[4], l[5], 1)
                }, null, a._.clone)
            }

            function i(a, b, c, d, e, f, g, h, i) {
                var j = 1 - i,
                    k = R(j, 3),
                    l = R(j, 2),
                    m = i * i,
                    n = m * i,
                    o = k * a + 3 * l * i * c + 3 * j * i * i * e + n * g,
                    p = k * b + 3 * l * i * d + 3 * j * i * i * f + n * h,
                    q = a + 2 * i * (c - a) + m * (e - 2 * c + a),
                    r = b + 2 * i * (d - b) + m * (f - 2 * d + b),
                    s = c + 2 * i * (e - c) + m * (g - 2 * e + c),
                    t = d + 2 * i * (f - d) + m * (h - 2 * f + d),
                    u = j * a + i * c,
                    v = j * b + i * d,
                    w = j * e + i * g,
                    x = j * f + i * h,
                    y = 90 - 180 * N.atan2(q - s, r - t) / O;
                return {
                    x: o,
                    y: p,
                    m: {
                        x: q,
                        y: r
                    },
                    n: {
                        x: s,
                        y: t
                    },
                    start: {
                        x: u,
                        y: v
                    },
                    end: {
                        x: w,
                        y: x
                    },
                    alpha: y
                }
            }

            function j(b, c, e, f, g, h, i, j) {
                a.is(b, "array") || (b = [b, c, e, f, g, h, i, j]);
                var k = D.apply(null, b);
                return d(k.min.x, k.min.y, k.max.x - k.min.x, k.max.y - k.min.y)
            }

            function k(a, b, c) {
                return b >= a.x && b <= a.x + a.width && c >= a.y && c <= a.y + a.height
            }

            function l(a, b) {
                return a = d(a), b = d(b), k(b, a.x, a.y) || k(b, a.x2, a.y) || k(b, a.x, a.y2) || k(b, a.x2, a.y2) || k(a, b.x, b.y) || k(a, b.x2, b.y) || k(a, b.x, b.y2) || k(a, b.x2, b.y2) || (a.x < b.x2 && a.x > b.x || b.x < a.x2 && b.x > a.x) && (a.y < b.y2 && a.y > b.y || b.y < a.y2 && b.y > a.y)
            }

            function m(a, b, c, d, e) {
                var f = -3 * b + 9 * c - 9 * d + 3 * e,
                    g = a * f + 6 * b - 12 * c + 6 * d;
                return a * g - 3 * b + 3 * c
            }

            function n(a, b, c, d, e, f, g, h, i) {
                null == i && (i = 1), i = i > 1 ? 1 : 0 > i ? 0 : i;
                for (var j = i / 2, k = 12, l = [-.1252, .1252, -.3678, .3678, -.5873, .5873, -.7699, .7699, -.9041, .9041, -.9816, .9816], n = [.2491, .2491, .2335, .2335, .2032, .2032, .1601, .1601, .1069, .1069, .0472, .0472], o = 0, p = 0; k > p; p++) {
                    var q = j * l[p] + j,
                        r = m(q, a, c, e, g),
                        s = m(q, b, d, f, h),
                        t = r * r + s * s;
                    o += n[p] * N.sqrt(t)
                }
                return j * o
            }

            function o(a, b, c, d, e, f, g, h, i) {
                if (!(0 > i || n(a, b, c, d, e, f, g, h) < i)) {
                    var j, k = 1,
                        l = k / 2,
                        m = k - l,
                        o = .01;
                    for (j = n(a, b, c, d, e, f, g, h, m); S(j - i) > o;) l /= 2, m += (i > j ? 1 : -1) * l, j = n(a, b, c, d, e, f, g, h, m);
                    return m
                }
            }

            function p(a, b, c, d, e, f, g, h) {
                if (!(Q(a, c) < P(e, g) || P(a, c) > Q(e, g) || Q(b, d) < P(f, h) || P(b, d) > Q(f, h))) {
                    var i = (a * d - b * c) * (e - g) - (a - c) * (e * h - f * g),
                        j = (a * d - b * c) * (f - h) - (b - d) * (e * h - f * g),
                        k = (a - c) * (f - h) - (b - d) * (e - g);
                    if (k) {
                        var l = i / k,
                            m = j / k,
                            n = +l.toFixed(2),
                            o = +m.toFixed(2);
                        if (!(n < +P(a, c).toFixed(2) || n > +Q(a, c).toFixed(2) || n < +P(e, g).toFixed(2) || n > +Q(e, g).toFixed(2) || o < +P(b, d).toFixed(2) || o > +Q(b, d).toFixed(2) || o < +P(f, h).toFixed(2) || o > +Q(f, h).toFixed(2))) return {
                            x: l,
                            y: m
                        }
                    }
                }
            }

            function q(a, b, c) {
                var d = j(a),
                    e = j(b);
                if (!l(d, e)) return c ? 0 : [];
                for (var f = n.apply(0, a), g = n.apply(0, b), h = ~~(f / 8), k = ~~(g / 8), m = [], o = [], q = {}, r = c ? 0 : [], s = 0; h + 1 > s; s++) {
                    var t = i.apply(0, a.concat(s / h));
                    m.push({
                        x: t.x,
                        y: t.y,
                        t: s / h
                    })
                }
                for (s = 0; k + 1 > s; s++) t = i.apply(0, b.concat(s / k)), o.push({
                    x: t.x,
                    y: t.y,
                    t: s / k
                });
                for (s = 0; h > s; s++)
                    for (var u = 0; k > u; u++) {
                        var v = m[s],
                            w = m[s + 1],
                            x = o[u],
                            y = o[u + 1],
                            z = S(w.x - v.x) < .001 ? "y" : "x",
                            A = S(y.x - x.x) < .001 ? "y" : "x",
                            B = p(v.x, v.y, w.x, w.y, x.x, x.y, y.x, y.y);
                        if (B) {
                            if (q[B.x.toFixed(4)] == B.y.toFixed(4)) continue;
                            q[B.x.toFixed(4)] = B.y.toFixed(4);
                            var C = v.t + S((B[z] - v[z]) / (w[z] - v[z])) * (w.t - v.t),
                                D = x.t + S((B[A] - x[A]) / (y[A] - x[A])) * (y.t - x.t);
                            C >= 0 && 1 >= C && D >= 0 && 1 >= D && (c ? r++ : r.push({
                                x: B.x,
                                y: B.y,
                                t1: C,
                                t2: D
                            }))
                        }
                    }
                return r
            }

            function r(a, b) {
                return t(a, b)
            }

            function s(a, b) {
                return t(a, b, 1)
            }

            function t(a, b, c) {
                a = E(a), b = E(b);
                for (var d, e, f, g, h, i, j, k, l, m, n = c ? 0 : [], o = 0, p = a.length; p > o; o++) {
                    var r = a[o];
                    if ("M" == r[0]) d = h = r[1], e = i = r[2];
                    else {
                        "C" == r[0] ? (l = [d, e].concat(r.slice(1)), d = l[6], e = l[7]) : (l = [d, e, d, e, h, i, h, i], d = h, e = i);
                        for (var s = 0, t = b.length; t > s; s++) {
                            var u = b[s];
                            if ("M" == u[0]) f = j = u[1], g = k = u[2];
                            else {
                                "C" == u[0] ? (m = [f, g].concat(u.slice(1)), f = m[6], g = m[7]) : (m = [f, g, f, g, j, k, j, k], f = j, g = k);
                                var v = q(l, m, c);
                                if (c) n += v;
                                else {
                                    for (var w = 0, x = v.length; x > w; w++) v[w].segment1 = o, v[w].segment2 = s, v[w].bez1 = l, v[w].bez2 = m;
                                    n = n.concat(v)
                                }
                            }
                        }
                    }
                }
                return n
            }

            function u(a, b, c) {
                var d = v(a);
                return k(d, b, c) && t(a, [
                    ["M", b, c],
                    ["H", d.x2 + 10]
                ], 1) % 2 == 1
            }

            function v(a) {
                var b = c(a);
                if (b.bbox) return J(b.bbox);
                if (!a) return d();
                a = E(a);
                for (var e, f = 0, g = 0, h = [], i = [], j = 0, k = a.length; k > j; j++)
                    if (e = a[j], "M" == e[0]) f = e[1], g = e[2], h.push(f), i.push(g);
                    else {
                        var l = D(f, g, e[1], e[2], e[3], e[4], e[5], e[6]);
                        h = h.concat(l.min.x, l.max.x), i = i.concat(l.min.y, l.max.y), f = e[5], g = e[6]
                    }
                var m = P.apply(0, h),
                    n = P.apply(0, i),
                    o = Q.apply(0, h),
                    p = Q.apply(0, i),
                    q = d(m, n, o - m, p - n);
                return b.bbox = J(q), q
            }

            function w(a, b, c, d, f) {
                if (f) return [
                    ["M", +a + +f, b],
                    ["l", c - 2 * f, 0],
                    ["a", f, f, 0, 0, 1, f, f],
                    ["l", 0, d - 2 * f],
                    ["a", f, f, 0, 0, 1, -f, f],
                    ["l", 2 * f - c, 0],
                    ["a", f, f, 0, 0, 1, -f, -f],
                    ["l", 0, 2 * f - d],
                    ["a", f, f, 0, 0, 1, f, -f],
                    ["z"]
                ];
                var g = [
                    ["M", a, b],
                    ["l", c, 0],
                    ["l", 0, d],
                    ["l", -c, 0],
                    ["z"]
                ];
                return g.toString = e, g
            }

            function x(a, b, c, d, f) {
                if (null == f && null == d && (d = c), a = +a, b = +b, c = +c, d = +d, null != f) var g = Math.PI / 180,
                    h = a + c * Math.cos(-d * g),
                    i = a + c * Math.cos(-f * g),
                    j = b + c * Math.sin(-d * g),
                    k = b + c * Math.sin(-f * g),
                    l = [
                        ["M", h, j],
                        ["A", c, c, 0, +(f - d > 180), 0, i, k]
                    ];
                else l = [
                    ["M", a, b],
                    ["m", 0, -d],
                    ["a", c, d, 0, 1, 1, 0, 2 * d],
                    ["a", c, d, 0, 1, 1, 0, -2 * d],
                    ["z"]
                ];
                return l.toString = e, l
            }

            function y(b) {
                var d = c(b),
                    g = String.prototype.toLowerCase;
                if (d.rel) return f(d.rel);
                a.is(b, "array") && a.is(b && b[0], "array") || (b = a.parsePathString(b));
                var h = [],
                    i = 0,
                    j = 0,
                    k = 0,
                    l = 0,
                    m = 0;
                "M" == b[0][0] && (i = b[0][1], j = b[0][2], k = i, l = j, m++, h.push(["M", i, j]));
                for (var n = m, o = b.length; o > n; n++) {
                    var p = h[n] = [],
                        q = b[n];
                    if (q[0] != g.call(q[0])) switch (p[0] = g.call(q[0]), p[0]) {
                        case "a":
                            p[1] = q[1], p[2] = q[2], p[3] = q[3], p[4] = q[4], p[5] = q[5], p[6] = +(q[6] - i).toFixed(3), p[7] = +(q[7] - j).toFixed(3);
                            break;
                        case "v":
                            p[1] = +(q[1] - j).toFixed(3);
                            break;
                        case "m":
                            k = q[1], l = q[2];
                        default:
                            for (var r = 1, s = q.length; s > r; r++) p[r] = +(q[r] - (r % 2 ? i : j)).toFixed(3)
                    } else {
                        p = h[n] = [], "m" == q[0] && (k = q[1] + i, l = q[2] + j);
                        for (var t = 0, u = q.length; u > t; t++) h[n][t] = q[t]
                    }
                    var v = h[n].length;
                    switch (h[n][0]) {
                        case "z":
                            i = k, j = l;
                            break;
                        case "h":
                            i += +h[n][v - 1];
                            break;
                        case "v":
                            j += +h[n][v - 1];
                            break;
                        default:
                            i += +h[n][v - 2], j += +h[n][v - 1]
                    }
                }
                return h.toString = e, d.rel = f(h), h
            }

            function z(b) {
                var d = c(b);
                if (d.abs) return f(d.abs);
                if (I(b, "array") && I(b && b[0], "array") || (b = a.parsePathString(b)), !b || !b.length) return [
                    ["M", 0, 0]
                ];
                var g, h = [],
                    i = 0,
                    j = 0,
                    k = 0,
                    l = 0,
                    m = 0;
                "M" == b[0][0] && (i = +b[0][1], j = +b[0][2], k = i, l = j, m++, h[0] = ["M", i, j]);
                for (var n, o, p = 3 == b.length && "M" == b[0][0] && "R" == b[1][0].toUpperCase() && "Z" == b[2][0].toUpperCase(), q = m, r = b.length; r > q; q++) {
                    if (h.push(n = []), o = b[q], g = o[0], g != g.toUpperCase()) switch (n[0] = g.toUpperCase(), n[0]) {
                            case "A":
                                n[1] = o[1], n[2] = o[2], n[3] = o[3], n[4] = o[4], n[5] = o[5], n[6] = +o[6] + i, n[7] = +o[7] + j;
                                break;
                            case "V":
                                n[1] = +o[1] + j;
                                break;
                            case "H":
                                n[1] = +o[1] + i;
                                break;
                            case "R":
                                for (var s = [i, j].concat(o.slice(1)), t = 2, u = s.length; u > t; t++) s[t] = +s[t] + i, s[++t] = +s[t] + j;
                                h.pop(), h = h.concat(G(s, p));
                                break;
                            case "O":
                                h.pop(), s = x(i, j, o[1], o[2]), s.push(s[0]), h = h.concat(s);
                                break;
                            case "U":
                                h.pop(), h = h.concat(x(i, j, o[1], o[2], o[3])), n = ["U"].concat(h[h.length - 1].slice(-2));
                                break;
                            case "M":
                                k = +o[1] + i, l = +o[2] + j;
                            default:
                                for (t = 1, u = o.length; u > t; t++) n[t] = +o[t] + (t % 2 ? i : j)
                        } else if ("R" == g) s = [i, j].concat(o.slice(1)), h.pop(), h = h.concat(G(s, p)), n = ["R"].concat(o.slice(-2));
                        else if ("O" == g) h.pop(), s = x(i, j, o[1], o[2]), s.push(s[0]), h = h.concat(s);
                    else if ("U" == g) h.pop(), h = h.concat(x(i, j, o[1], o[2], o[3])), n = ["U"].concat(h[h.length - 1].slice(-2));
                    else
                        for (var v = 0, w = o.length; w > v; v++) n[v] = o[v];
                    if (g = g.toUpperCase(), "O" != g) switch (n[0]) {
                        case "Z":
                            i = +k, j = +l;
                            break;
                        case "H":
                            i = n[1];
                            break;
                        case "V":
                            j = n[1];
                            break;
                        case "M":
                            k = n[n.length - 2], l = n[n.length - 1];
                        default:
                            i = n[n.length - 2], j = n[n.length - 1]
                    }
                }
                return h.toString = e, d.abs = f(h), h
            }

            function A(a, b, c, d) {
                return [a, b, c, d, c, d]
            }

            function B(a, b, c, d, e, f) {
                var g = 1 / 3,
                    h = 2 / 3;
                return [g * a + h * c, g * b + h * d, g * e + h * c, g * f + h * d, e, f]
            }

            function C(b, c, d, e, f, g, h, i, j, k) {
                var l, m = 120 * O / 180,
                    n = O / 180 * (+f || 0),
                    o = [],
                    p = a._.cacher(function(a, b, c) {
                        var d = a * N.cos(c) - b * N.sin(c),
                            e = a * N.sin(c) + b * N.cos(c);
                        return {
                            x: d,
                            y: e
                        }
                    });
                if (k) y = k[0], z = k[1], w = k[2], x = k[3];
                else {
                    l = p(b, c, -n), b = l.x, c = l.y, l = p(i, j, -n), i = l.x, j = l.y;
                    var q = (N.cos(O / 180 * f), N.sin(O / 180 * f), (b - i) / 2),
                        r = (c - j) / 2,
                        s = q * q / (d * d) + r * r / (e * e);
                    s > 1 && (s = N.sqrt(s), d = s * d, e = s * e);
                    var t = d * d,
                        u = e * e,
                        v = (g == h ? -1 : 1) * N.sqrt(S((t * u - t * r * r - u * q * q) / (t * r * r + u * q * q))),
                        w = v * d * r / e + (b + i) / 2,
                        x = v * -e * q / d + (c + j) / 2,
                        y = N.asin(((c - x) / e).toFixed(9)),
                        z = N.asin(((j - x) / e).toFixed(9));
                    y = w > b ? O - y : y, z = w > i ? O - z : z, 0 > y && (y = 2 * O + y), 0 > z && (z = 2 * O + z), h && y > z && (y -= 2 * O), !h && z > y && (z -= 2 * O)
                }
                var A = z - y;
                if (S(A) > m) {
                    var B = z,
                        D = i,
                        E = j;
                    z = y + m * (h && z > y ? 1 : -1), i = w + d * N.cos(z), j = x + e * N.sin(z), o = C(i, j, d, e, f, 0, h, D, E, [z, B, w, x])
                }
                A = z - y;
                var F = N.cos(y),
                    G = N.sin(y),
                    H = N.cos(z),
                    I = N.sin(z),
                    J = N.tan(A / 4),
                    K = 4 / 3 * d * J,
                    L = 4 / 3 * e * J,
                    M = [b, c],
                    P = [b + K * G, c - L * F],
                    Q = [i + K * I, j - L * H],
                    R = [i, j];
                if (P[0] = 2 * M[0] - P[0], P[1] = 2 * M[1] - P[1], k) return [P, Q, R].concat(o);
                o = [P, Q, R].concat(o).join().split(",");
                for (var T = [], U = 0, V = o.length; V > U; U++) T[U] = U % 2 ? p(o[U - 1], o[U], n).y : p(o[U], o[U + 1], n).x;
                return T
            }

            function D(a, b, c, d, e, f, g, h) {
                for (var i, j, k, l, m, n, o, p, q = [], r = [
                        [],
                        []
                    ], s = 0; 2 > s; ++s)
                    if (0 == s ? (j = 6 * a - 12 * c + 6 * e, i = -3 * a + 9 * c - 9 * e + 3 * g, k = 3 * c - 3 * a) : (j = 6 * b - 12 * d + 6 * f, i = -3 * b + 9 * d - 9 * f + 3 * h, k = 3 * d - 3 * b), S(i) < 1e-12) {
                        if (S(j) < 1e-12) continue;
                        l = -k / j, l > 0 && 1 > l && q.push(l)
                    } else o = j * j - 4 * k * i, p = N.sqrt(o), 0 > o || (m = (-j + p) / (2 * i), m > 0 && 1 > m && q.push(m), n = (-j - p) / (2 * i), n > 0 && 1 > n && q.push(n));
                for (var t, u = q.length, v = u; u--;) l = q[u], t = 1 - l, r[0][u] = t * t * t * a + 3 * t * t * l * c + 3 * t * l * l * e + l * l * l * g, r[1][u] = t * t * t * b + 3 * t * t * l * d + 3 * t * l * l * f + l * l * l * h;
                return r[0][v] = a, r[1][v] = b, r[0][v + 1] = g, r[1][v + 1] = h, r[0].length = r[1].length = v + 2, {
                    min: {
                        x: P.apply(0, r[0]),
                        y: P.apply(0, r[1])
                    },
                    max: {
                        x: Q.apply(0, r[0]),
                        y: Q.apply(0, r[1])
                    }
                }
            }

            function E(a, b) {
                var d = !b && c(a);
                if (!b && d.curve) return f(d.curve);
                for (var e = z(a), g = b && z(b), h = {
                        x: 0,
                        y: 0,
                        bx: 0,
                        by: 0,
                        X: 0,
                        Y: 0,
                        qx: null,
                        qy: null
                    }, i = {
                        x: 0,
                        y: 0,
                        bx: 0,
                        by: 0,
                        X: 0,
                        Y: 0,
                        qx: null,
                        qy: null
                    }, j = (function(a, b, c) {
                        var d, e;
                        if (!a) return ["C", b.x, b.y, b.x, b.y, b.x, b.y];
                        switch (!(a[0] in {
                            T: 1,
                            Q: 1
                        }) && (b.qx = b.qy = null), a[0]) {
                            case "M":
                                b.X = a[1], b.Y = a[2];
                                break;
                            case "A":
                                a = ["C"].concat(C.apply(0, [b.x, b.y].concat(a.slice(1))));
                                break;
                            case "S":
                                "C" == c || "S" == c ? (d = 2 * b.x - b.bx, e = 2 * b.y - b.by) : (d = b.x, e = b.y), a = ["C", d, e].concat(a.slice(1));
                                break;
                            case "T":
                                "Q" == c || "T" == c ? (b.qx = 2 * b.x - b.qx, b.qy = 2 * b.y - b.qy) : (b.qx = b.x, b.qy = b.y), a = ["C"].concat(B(b.x, b.y, b.qx, b.qy, a[1], a[2]));
                                break;
                            case "Q":
                                b.qx = a[1], b.qy = a[2], a = ["C"].concat(B(b.x, b.y, a[1], a[2], a[3], a[4]));
                                break;
                            case "L":
                                a = ["C"].concat(A(b.x, b.y, a[1], a[2]));
                                break;
                            case "H":
                                a = ["C"].concat(A(b.x, b.y, a[1], b.y));
                                break;
                            case "V":
                                a = ["C"].concat(A(b.x, b.y, b.x, a[1]));
                                break;
                            case "Z":
                                a = ["C"].concat(A(b.x, b.y, b.X, b.Y))
                        }
                        return a
                    }), k = function(a, b) {
                        if (a[b].length > 7) {
                            a[b].shift();
                            for (var c = a[b]; c.length;) m[b] = "A", g && (n[b] = "A"), a.splice(b++, 0, ["C"].concat(c.splice(0, 6)));
                            a.splice(b, 1), r = Q(e.length, g && g.length || 0)
                        }
                    }, l = function(a, b, c, d, f) {
                        a && b && "M" == a[f][0] && "M" != b[f][0] && (b.splice(f, 0, ["M", d.x, d.y]), c.bx = 0, c.by = 0, c.x = a[f][1], c.y = a[f][2], r = Q(e.length, g && g.length || 0))
                    }, m = [], n = [], o = "", p = "", q = 0, r = Q(e.length, g && g.length || 0); r > q; q++) {
                    e[q] && (o = e[q][0]), "C" != o && (m[q] = o, q && (p = m[q - 1])), e[q] = j(e[q], h, p), "A" != m[q] && "C" == o && (m[q] = "C"), k(e, q), g && (g[q] && (o = g[q][0]), "C" != o && (n[q] = o, q && (p = n[q - 1])), g[q] = j(g[q], i, p), "A" != n[q] && "C" == o && (n[q] = "C"), k(g, q)), l(e, g, h, i, q), l(g, e, i, h, q);
                    var s = e[q],
                        t = g && g[q],
                        u = s.length,
                        v = g && t.length;
                    h.x = s[u - 2], h.y = s[u - 1], h.bx = M(s[u - 4]) || h.x, h.by = M(s[u - 3]) || h.y, i.bx = g && (M(t[v - 4]) || i.x), i.by = g && (M(t[v - 3]) || i.y), i.x = g && t[v - 2], i.y = g && t[v - 1]
                }
                return g || (d.curve = f(e)), g ? [e, g] : e
            }

            function F(a, b) {
                if (!b) return a;
                var c, d, e, f, g, h, i;
                for (a = E(a), e = 0, g = a.length; g > e; e++)
                    for (i = a[e], f = 1, h = i.length; h > f; f += 2) c = b.x(i[f], i[f + 1]), d = b.y(i[f], i[f + 1]), i[f] = c, i[f + 1] = d;
                return a
            }

            function G(a, b) {
                for (var c = [], d = 0, e = a.length; e - 2 * !b > d; d += 2) {
                    var f = [{
                        x: +a[d - 2],
                        y: +a[d - 1]
                    }, {
                        x: +a[d],
                        y: +a[d + 1]
                    }, {
                        x: +a[d + 2],
                        y: +a[d + 3]
                    }, {
                        x: +a[d + 4],
                        y: +a[d + 5]
                    }];
                    b ? d ? e - 4 == d ? f[3] = {
                        x: +a[0],
                        y: +a[1]
                    } : e - 2 == d && (f[2] = {
                        x: +a[0],
                        y: +a[1]
                    }, f[3] = {
                        x: +a[2],
                        y: +a[3]
                    }) : f[0] = {
                        x: +a[e - 2],
                        y: +a[e - 1]
                    } : e - 4 == d ? f[3] = f[2] : d || (f[0] = {
                        x: +a[d],
                        y: +a[d + 1]
                    }), c.push(["C", (-f[0].x + 6 * f[1].x + f[2].x) / 6, (-f[0].y + 6 * f[1].y + f[2].y) / 6, (f[1].x + 6 * f[2].x - f[3].x) / 6, (f[1].y + 6 * f[2].y - f[3].y) / 6, f[2].x, f[2].y])
                }
                return c
            }
            var H = b.prototype,
                I = a.is,
                J = a._.clone,
                K = "hasOwnProperty",
                L = /,?([a-z]),?/gi,
                M = parseFloat,
                N = Math,
                O = N.PI,
                P = N.min,
                Q = N.max,
                R = N.pow,
                S = N.abs,
                T = h(1),
                U = h(),
                V = h(0, 1),
                W = a._unit2px,
                X = {
                    path: function(a) {
                        return a.attr("path")
                    },
                    circle: function(a) {
                        var b = W(a);
                        return x(b.cx, b.cy, b.r)
                    },
                    ellipse: function(a) {
                        var b = W(a);
                        return x(b.cx || 0, b.cy || 0, b.rx, b.ry)
                    },
                    rect: function(a) {
                        var b = W(a);
                        return w(b.x || 0, b.y || 0, b.width, b.height, b.rx, b.ry)
                    },
                    image: function(a) {
                        var b = W(a);
                        return w(b.x || 0, b.y || 0, b.width, b.height)
                    },
                    line: function(a) {
                        return "M" + [a.attr("x1") || 0, a.attr("y1") || 0, a.attr("x2"), a.attr("y2")]
                    },
                    polyline: function(a) {
                        return "M" + a.attr("points")
                    },
                    polygon: function(a) {
                        return "M" + a.attr("points") + "z"
                    },
                    deflt: function(a) {
                        var b = a.node.getBBox();
                        return w(b.x, b.y, b.width, b.height)
                    }
                };
            a.path = c, a.path.getTotalLength = T, a.path.getPointAtLength = U, a.path.getSubpath = function(a, b, c) {
                if (this.getTotalLength(a) - c < 1e-6) return V(a, b).end;
                var d = V(a, c, 1);
                return b ? V(d, b).end : d
            }, H.getTotalLength = function() {
                return this.node.getTotalLength ? this.node.getTotalLength() : void 0
            }, H.getPointAtLength = function(a) {
                return U(this.attr("d"), a)
            }, H.getSubpath = function(b, c) {
                return a.path.getSubpath(this.attr("d"), b, c)
            }, a._.box = d, a.path.findDotsAtSegment = i, a.path.bezierBBox = j, a.path.isPointInsideBBox = k, a.closest = function(b, c, e, f) {
                for (var g = 100, h = d(b - g / 2, c - g / 2, g, g), i = [], j = e[0].hasOwnProperty("x") ? function(a) {
                        return {
                            x: e[a].x,
                            y: e[a].y
                        }
                    } : function(a) {
                        return {
                            x: e[a],
                            y: f[a]
                        }
                    }, l = 0; 1e6 >= g && !l;) {
                    for (var m = 0, n = e.length; n > m; m++) {
                        var o = j(m);
                        if (k(h, o.x, o.y)) {
                            l++, i.push(o);
                            break
                        }
                    }
                    l || (g *= 2, h = d(b - g / 2, c - g / 2, g, g))
                }
                if (1e6 != g) {
                    var p, q = 1 / 0;
                    for (m = 0, n = i.length; n > m; m++) {
                        var r = a.len(b, c, i[m].x, i[m].y);
                        q > r && (q = r, i[m].len = r, p = i[m])
                    }
                    return p
                }
            }, a.path.isBBoxIntersect = l, a.path.intersection = r, a.path.intersectionNumber = s, a.path.isPointInside = u, a.path.getBBox = v, a.path.get = X, a.path.toRelative = y, a.path.toAbsolute = z, a.path.toCubic = E, a.path.map = F, a.path.toString = e, a.path.clone = f
        }), d.plugin(function(a) {
            var d = Math.max,
                e = Math.min,
                f = function(a) {
                    if (this.items = [], this.bindings = {}, this.length = 0, this.type = "set", a)
                        for (var b = 0, c = a.length; c > b; b++) a[b] && (this[this.items.length] = this.items[this.items.length] = a[b], this.length++)
                },
                g = f.prototype;
            g.push = function() {
                for (var a, b, c = 0, d = arguments.length; d > c; c++) a = arguments[c], a && (b = this.items.length, this[b] = this.items[b] = a, this.length++);
                return this
            }, g.pop = function() {
                return this.length && delete this[this.length--], this.items.pop()
            }, g.forEach = function(a, b) {
                for (var c = 0, d = this.items.length; d > c; c++)
                    if (a.call(b, this.items[c], c) === !1) return this;
                return this
            }, g.animate = function(d, e, f, g) {
                "function" != typeof f || f.length || (g = f, f = c.linear), d instanceof a._.Animation && (g = d.callback, f = d.easing, e = f.dur, d = d.attr);
                var h = arguments;
                if (a.is(d, "array") && a.is(h[h.length - 1], "array")) var i = !0;
                var j, k = function() {
                        j ? this.b = j : j = this.b
                    },
                    l = 0,
                    m = this,
                    n = g && function() {
                        ++l == m.length && g.call(this)
                    };
                return this.forEach(function(a, c) {
                    b.once("snap.animcreated." + a.id, k), i ? h[c] && a.animate.apply(a, h[c]) : a.animate(d, e, f, n)
                })
            }, g.remove = function() {
                for (; this.length;) this.pop().remove();
                return this
            }, g.bind = function(a, b, c) {
                var d = {};
                if ("function" == typeof b) this.bindings[a] = b;
                else {
                    var e = c || a;
                    this.bindings[a] = function(a) {
                        d[e] = a, b.attr(d)
                    }
                }
                return this
            }, g.attr = function(a) {
                var b = {};
                for (var c in a) this.bindings[c] ? this.bindings[c](a[c]) : b[c] = a[c];
                for (var d = 0, e = this.items.length; e > d; d++) this.items[d].attr(b);
                return this
            }, g.clear = function() {
                for (; this.length;) this.pop()
            }, g.splice = function(a, b) {
                a = 0 > a ? d(this.length + a, 0) : a, b = d(0, e(this.length - a, b));
                var c, g = [],
                    h = [],
                    i = [];
                for (c = 2; c < arguments.length; c++) i.push(arguments[c]);
                for (c = 0; b > c; c++) h.push(this[a + c]);
                for (; c < this.length - a; c++) g.push(this[a + c]);
                var j = i.length;
                for (c = 0; c < j + g.length; c++) this.items[a + c] = this[a + c] = j > c ? i[c] : g[c - j];
                for (c = this.items.length = this.length -= b - j; this[c];) delete this[c++];
                return new f(h)
            }, g.exclude = function(a) {
                for (var b = 0, c = this.length; c > b; b++)
                    if (this[b] == a) return this.splice(b, 1), !0;
                return !1
            }, g.insertAfter = function(a) {
                for (var b = this.items.length; b--;) this.items[b].insertAfter(a);
                return this
            }, g.getBBox = function() {
                for (var a = [], b = [], c = [], f = [], g = this.items.length; g--;)
                    if (!this.items[g].removed) {
                        var h = this.items[g].getBBox();
                        a.push(h.x), b.push(h.y), c.push(h.x + h.width), f.push(h.y + h.height)
                    }
                return a = e.apply(0, a), b = e.apply(0, b), c = d.apply(0, c), f = d.apply(0, f), {
                    x: a,
                    y: b,
                    x2: c,
                    y2: f,
                    width: c - a,
                    height: f - b,
                    cx: a + (c - a) / 2,
                    cy: b + (f - b) / 2
                }
            }, g.clone = function(a) {
                a = new f;
                for (var b = 0, c = this.items.length; c > b; b++) a.push(this.items[b].clone());
                return a
            }, g.toString = function() {
                return "Snap‘s set"
            }, g.type = "set", a.Set = f, a.set = function() {
                var a = new f;
                return arguments.length && a.push.apply(a, Array.prototype.slice.call(arguments, 0)), a
            }
        }), d.plugin(function(a, c) {
            function d(a) {
                var b = a[0];
                switch (b.toLowerCase()) {
                    case "t":
                        return [b, 0, 0];
                    case "m":
                        return [b, 1, 0, 0, 1, 0, 0];
                    case "r":
                        return 4 == a.length ? [b, 0, a[2], a[3]] : [b, 0];
                    case "s":
                        return 5 == a.length ? [b, 1, 1, a[3], a[4]] : 3 == a.length ? [b, 1, 1] : [b, 1]
                }
            }

            function e(b, c, e) {
                c = p(c).replace(/\.{3}|\u2026/g, b), b = a.parseTransformString(b) || [], c = a.parseTransformString(c) || [];
                for (var f, g, h, i, l = Math.max(b.length, c.length), m = [], n = [], o = 0; l > o; o++) {
                    if (h = b[o] || d(c[o]), i = c[o] || d(h), h[0] != i[0] || "r" == h[0].toLowerCase() && (h[2] != i[2] || h[3] != i[3]) || "s" == h[0].toLowerCase() && (h[3] != i[3] || h[4] != i[4])) {
                        b = a._.transform2matrix(b, e()), c = a._.transform2matrix(c, e()), m = [
                            ["m", b.a, b.b, b.c, b.d, b.e, b.f]
                        ], n = [
                            ["m", c.a, c.b, c.c, c.d, c.e, c.f]
                        ];
                        break
                    }
                    for (m[o] = [], n[o] = [], f = 0, g = Math.max(h.length, i.length); g > f; f++) f in h && (m[o][f] = h[f]), f in i && (n[o][f] = i[f])
                }
                return {
                    from: k(m),
                    to: k(n),
                    f: j(m)
                }
            }

            function f(a) {
                return a
            }

            function g(a) {
                return function(b) {
                    return +b.toFixed(3) + a
                }
            }

            function h(a) {
                return a.join(" ")
            }

            function i(b) {
                return a.rgb(b[0], b[1], b[2])
            }

            function j(a) {
                var b, c, d, e, f, g, h = 0,
                    i = [];
                for (b = 0, c = a.length; c > b; b++) {
                    for (f = "[", g = ['"' + a[b][0] + '"'], d = 1, e = a[b].length; e > d; d++) g[d] = "val[" + h++ + "]";
                    f += g + "]", i[b] = f
                }
                return Function("val", "return Snap.path.toString.call([" + i + "])")
            }

            function k(a) {
                for (var b = [], c = 0, d = a.length; d > c; c++)
                    for (var e = 1, f = a[c].length; f > e; e++) b.push(a[c][e]);
                return b
            }

            function l(a) {
                return isFinite(parseFloat(a))
            }

            function m(b, c) {
                return !(!a.is(b, "array") || !a.is(c, "array")) && b.toString() == c.toString()
            }
            var n = {},
                o = /[a-z]+$/i,
                p = String;
            n.stroke = n.fill = "colour", c.prototype.equal = function(a, c) {
                return b("snap.util.equal", this, a, c).firstDefined()
            }, b.on("snap.util.equal", function(b, c) {
                var d, q, r = p(this.attr(b) || ""),
                    s = this;
                if (l(r) && l(c)) return {
                    from: parseFloat(r),
                    to: parseFloat(c),
                    f: f
                };
                if ("colour" == n[b]) return d = a.color(r), q = a.color(c), {
                    from: [d.r, d.g, d.b, d.opacity],
                    to: [q.r, q.g, q.b, q.opacity],
                    f: i
                };
                if ("viewBox" == b) return d = this.attr(b).vb.split(" ").map(Number), q = c.split(" ").map(Number), {
                    from: d,
                    to: q,
                    f: h
                };
                if ("transform" == b || "gradientTransform" == b || "patternTransform" == b) return c instanceof a.Matrix && (c = c.toTransformString()), a._.rgTransform.test(c) || (c = a._.svgTransform2string(c)), e(r, c, function() {
                    return s.getBBox(1)
                });
                if ("d" == b || "path" == b) return d = a.path.toCubic(r, c), {
                    from: k(d[0]),
                    to: k(d[1]),
                    f: j(d[0])
                };
                if ("points" == b) return d = p(r).split(a._.separator), q = p(c).split(a._.separator), {
                    from: d,
                    to: q,
                    f: function(a) {
                        return a
                    }
                };
                var t = r.match(o),
                    u = p(c).match(o);
                return t && m(t, u) ? {
                    from: parseFloat(r),
                    to: parseFloat(c),
                    f: g(t)
                } : {
                    from: this.asPX(b),
                    to: this.asPX(b, c),
                    f: f
                }
            })
        }), d.plugin(function(a, c, d, e) {
            for (var f = c.prototype, g = "hasOwnProperty", h = ("createTouch" in e.doc), i = ["click", "dblclick", "mousedown", "mousemove", "mouseout", "mouseover", "mouseup", "touchstart", "touchmove", "touchend", "touchcancel"], j = {
                    mousedown: "touchstart",
                    mousemove: "touchmove",
                    mouseup: "touchend"
                }, k = (function(a, b) {
                    var c = "y" == a ? "scrollTop" : "scrollLeft",
                        d = b && b.node ? b.node.ownerDocument : e.doc;
                    return d[c in d.documentElement ? "documentElement" : "body"][c]
                }), l = function() {
                    return this.originalEvent.preventDefault()
                }, m = function() {
                    return this.originalEvent.stopPropagation()
                }, n = function(a, b, c, d) {
                    var e = h && j[b] ? j[b] : b,
                        f = function(e) {
                            var f = k("y", d),
                                i = k("x", d);
                            if (h && j[g](b))
                                for (var n = 0, o = e.targetTouches && e.targetTouches.length; o > n; n++)
                                    if (e.targetTouches[n].target == a || a.contains(e.targetTouches[n].target)) {
                                        var p = e;
                                        e = e.targetTouches[n], e.originalEvent = p, e.preventDefault = l, e.stopPropagation = m;
                                        break
                                    }
                            var q = e.clientX + i,
                                r = e.clientY + f;
                            return c.call(d, e, q, r)
                        };
                    return b !== e && a.addEventListener(b, f, !1), a.addEventListener(e, f, !1),
                        function() {
                            return b !== e && a.removeEventListener(b, f, !1), a.removeEventListener(e, f, !1), !0
                        }
                }, o = [], p = function(a) {
                    for (var c, d = a.clientX, e = a.clientY, f = k("y"), g = k("x"), i = o.length; i--;) {
                        if (c = o[i], h) {
                            for (var j, l = a.touches && a.touches.length; l--;)
                                if (j = a.touches[l], j.identifier == c.el._drag.id || c.el.node.contains(j.target)) {
                                    d = j.clientX, e = j.clientY, (a.originalEvent ? a.originalEvent : a).preventDefault();
                                    break
                                }
                        } else a.preventDefault();
                        var m = c.el.node;
                        m.nextSibling, m.parentNode, m.style.display, d += g, e += f, b("snap.drag.move." + c.el.id, c.move_scope || c.el, d - c.el._drag.x, e - c.el._drag.y, d, e, a)
                    }
                }, q = function(c) {
                    a.unmousemove(p).unmouseup(q);
                    for (var d, e = o.length; e--;) d = o[e], d.el._drag = {}, b("snap.drag.end." + d.el.id, d.end_scope || d.start_scope || d.move_scope || d.el, c), b.off("snap.drag.*." + d.el.id);
                    o = []
                }, r = i.length; r--;) ! function(b) {
                a[b] = f[b] = function(c, d) {
                    if (a.is(c, "function")) this.events = this.events || [], this.events.push({
                        name: b,
                        f: c,
                        unbind: n(this.node || document, b, c, d || this)
                    });
                    else
                        for (var e = 0, f = this.events.length; f > e; e++)
                            if (this.events[e].name == b) try {
                                this.events[e].f.call(this)
                            } catch (g) {}
                            return this
                }, a["un" + b] = f["un" + b] = function(a) {
                    for (var c = this.events || [], d = c.length; d--;)
                        if (c[d].name == b && (c[d].f == a || !a)) return c[d].unbind(), c.splice(d, 1), !c.length && delete this.events, this;
                    return this
                }
            }(i[r]);
            f.hover = function(a, b, c, d) {
                return this.mouseover(a, c).mouseout(b, d || c)
            }, f.unhover = function(a, b) {
                return this.unmouseover(a).unmouseout(b)
            };
            var s = [];
            f.drag = function(c, d, e, f, g, h) {
                function i(i, j, l) {
                    (i.originalEvent || i).preventDefault(), k._drag.x = j, k._drag.y = l, k._drag.id = i.identifier, !o.length && a.mousemove(p).mouseup(q), o.push({
                        el: k,
                        move_scope: f,
                        start_scope: g,
                        end_scope: h
                    }), d && b.on("snap.drag.start." + k.id, d), c && b.on("snap.drag.move." + k.id, c), e && b.on("snap.drag.end." + k.id, e), b("snap.drag.start." + k.id, g || f || k, j, l, i)
                }

                function j(a, c, d) {
                    b("snap.draginit." + k.id, k, a, c, d)
                }
                var k = this;
                if (!arguments.length) {
                    var l;
                    return k.drag(function(a, b) {
                        this.attr({
                            transform: l + (l ? "T" : "t") + [a, b]
                        })
                    }, function() {
                        l = this.transform().local
                    })
                }
                return b.on("snap.draginit." + k.id, i), k._drag = {}, s.push({
                    el: k,
                    start: i,
                    init: j
                }), k.mousedown(j), k
            }, f.undrag = function() {
                for (var c = s.length; c--;) s[c].el == this && (this.unmousedown(s[c].init), s.splice(c, 1), b.unbind("snap.drag.*." + this.id), b.unbind("snap.draginit." + this.id));
                return !s.length && a.unmousemove(p).unmouseup(q), this
            }
        }), d.plugin(function(a, c, d) {
            var e = (c.prototype, d.prototype),
                f = /^\s*url\((.+)\)/,
                g = String,
                h = a._.$;
            a.filter = {}, e.filter = function(b) {
                var d = this;
                "svg" != d.type && (d = d.paper);
                var e = a.parse(g(b)),
                    f = a._.id(),
                    i = (d.node.offsetWidth, d.node.offsetHeight, h("filter"));
                return h(i, {
                    id: f,
                    filterUnits: "userSpaceOnUse"
                }), i.appendChild(e.node), d.defs.appendChild(i), new c(i)
            }, b.on("snap.util.getattr.filter", function() {
                b.stop();
                var c = h(this.node, "filter");
                if (c) {
                    var d = g(c).match(f);
                    return d && a.select(d[1])
                }
            }), b.on("snap.util.attr.filter", function(d) {
                if (d instanceof c && "filter" == d.type) {
                    b.stop();
                    var e = d.node.id;
                    e || (h(d.node, {
                        id: d.id
                    }), e = d.id), h(this.node, {
                        filter: a.url(e)
                    })
                }
                d && "none" != d || (b.stop(), this.node.removeAttribute("filter"))
            }), a.filter.blur = function(b, c) {
                null == b && (b = 2);
                var d = null == c ? b : [b, c];
                return a.format('<feGaussianBlur stdDeviation="{def}"/>', {
                    def: d
                })
            }, a.filter.blur.toString = function() {
                return this()
            }, a.filter.shadow = function(b, c, d, e, f) {
                return "string" == typeof d && (e = d, f = e, d = 4), "string" != typeof e && (f = e, e = "#000"), e = e || "#000", null == d && (d = 4), null == f && (f = 1), null == b && (b = 0, c = 2), null == c && (c = b), e = a.color(e), a.format('<feGaussianBlur in="SourceAlpha" stdDeviation="{blur}"/><feOffset dx="{dx}" dy="{dy}" result="offsetblur"/><feFlood flood-color="{color}"/><feComposite in2="offsetblur" operator="in"/><feComponentTransfer><feFuncA type="linear" slope="{opacity}"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>', {
                    color: e,
                    dx: b,
                    dy: c,
                    blur: d,
                    opacity: f
                })
            }, a.filter.shadow.toString = function() {
                return this()
            }, a.filter.grayscale = function(b) {
                return null == b && (b = 1), a.format('<feColorMatrix type="matrix" values="{a} {b} {c} 0 0 {d} {e} {f} 0 0 {g} {b} {h} 0 0 0 0 0 1 0"/>', {
                    a: .2126 + .7874 * (1 - b),
                    b: .7152 - .7152 * (1 - b),
                    c: .0722 - .0722 * (1 - b),
                    d: .2126 - .2126 * (1 - b),
                    e: .7152 + .2848 * (1 - b),
                    f: .0722 - .0722 * (1 - b),
                    g: .2126 - .2126 * (1 - b),
                    h: .0722 + .9278 * (1 - b)
                })
            }, a.filter.grayscale.toString = function() {
                return this()
            }, a.filter.sepia = function(b) {
                return null == b && (b = 1), a.format('<feColorMatrix type="matrix" values="{a} {b} {c} 0 0 {d} {e} {f} 0 0 {g} {h} {i} 0 0 0 0 0 1 0"/>', {
                    a: .393 + .607 * (1 - b),
                    b: .769 - .769 * (1 - b),
                    c: .189 - .189 * (1 - b),
                    d: .349 - .349 * (1 - b),
                    e: .686 + .314 * (1 - b),
                    f: .168 - .168 * (1 - b),
                    g: .272 - .272 * (1 - b),
                    h: .534 - .534 * (1 - b),
                    i: .131 + .869 * (1 - b)
                })
            }, a.filter.sepia.toString = function() {
                return this()
            }, a.filter.saturate = function(b) {
                return null == b && (b = 1), a.format('<feColorMatrix type="saturate" values="{amount}"/>', {
                    amount: 1 - b
                })
            }, a.filter.saturate.toString = function() {
                return this()
            }, a.filter.hueRotate = function(b) {
                return b = b || 0, a.format('<feColorMatrix type="hueRotate" values="{angle}"/>', {
                    angle: b
                })
            }, a.filter.hueRotate.toString = function() {
                return this()
            }, a.filter.invert = function(b) {
                return null == b && (b = 1), a.format('<feComponentTransfer><feFuncR type="table" tableValues="{amount} {amount2}"/><feFuncG type="table" tableValues="{amount} {amount2}"/><feFuncB type="table" tableValues="{amount} {amount2}"/></feComponentTransfer>', {
                    amount: b,
                    amount2: 1 - b
                })
            }, a.filter.invert.toString = function() {
                return this()
            }, a.filter.brightness = function(b) {
                return null == b && (b = 1), a.format('<feComponentTransfer><feFuncR type="linear" slope="{amount}"/><feFuncG type="linear" slope="{amount}"/><feFuncB type="linear" slope="{amount}"/></feComponentTransfer>', {
                    amount: b
                })
            }, a.filter.brightness.toString = function() {
                return this()
            }, a.filter.contrast = function(b) {
                return null == b && (b = 1), a.format('<feComponentTransfer><feFuncR type="linear" slope="{amount}" intercept="{amount2}"/><feFuncG type="linear" slope="{amount}" intercept="{amount2}"/><feFuncB type="linear" slope="{amount}" intercept="{amount2}"/></feComponentTransfer>', {
                    amount: b,
                    amount2: .5 - b / 2
                })
            }, a.filter.contrast.toString = function() {
                return this()
            }
        }), d.plugin(function(a, b) {
            var c = a._.box,
                d = a.is,
                e = /^[^a-z]*([tbmlrc])/i,
                f = function() {
                    return "T" + this.dx + "," + this.dy
                };
            b.prototype.getAlign = function(a, b) {
                null == b && d(a, "string") && (b = a, a = null), a = a || this.paper;
                var g = a.getBBox ? a.getBBox() : c(a),
                    h = this.getBBox(),
                    i = {};
                switch (b = b && b.match(e), b = b ? b[1].toLowerCase() : "c") {
                    case "t":
                        i.dx = 0, i.dy = g.y - h.y;
                        break;
                    case "b":
                        i.dx = 0, i.dy = g.y2 - h.y2;
                        break;
                    case "m":
                        i.dx = 0, i.dy = g.cy - h.cy;
                        break;
                    case "l":
                        i.dx = g.x - h.x, i.dy = 0;
                        break;
                    case "r":
                        i.dx = g.x2 - h.x2, i.dy = 0;
                        break;
                    default:
                        i.dx = g.cx - h.cx, i.dy = 0
                }
                return i.toString = f, i
            }, b.prototype.align = function(a, b) {
                return this.transform("..." + this.getAlign(a, b))
            }
        }), d
    }), this.Handlebars = this.Handlebars || {}, this.Handlebars.templates = this.Handlebars.templates || {}, Handlebars.registerPartial("_folder-doc-info", Handlebars.template({
        compiler: [7, ">= 4.0.0"],
        main: function(a, b, c, d, e) {
            var f, g, h = null != b ? b : {},
                i = c.helperMissing,
                j = "function";
            return '<div class="api-information">\n  <div class="folder-name"><p>' + a.escapeExpression((g = null != (g = c.name || (null != b ? b.name : b)) ? g : i, typeof g === j ? g.call(h, {
                name: "name",
                hash: {},
                data: e
            }) : g)) + '</p></div>\n  <div class="folder-description">' + (null != (g = null != (g = c.description || (null != b ? b.description : b)) ? g : i, f = typeof g === j ? g.call(h, {
                name: "description",
                hash: {},
                data: e
            }) : g) ? f : "") + "</div>\n</div>\n"
        },
        useData: !0
    })), Handlebars.registerPartial("_folder-doc", Handlebars.template({
        1: function(a, b, c, d, e) {
            var f;
            return '  <div class="col-md-6 col-xs-12 section">\n    ' + (null != (f = a.invokePartial(d["_folder-doc-info"], b, {
                name: "_folder-doc-info",
                data: e,
                helpers: c,
                partials: d,
                decorators: a.decorators
            })) ? f : "") + "  </div>\n"
        },
        compiler: [7, ">= 4.0.0"],
        main: function(a, b, c, d, e) {
            var f;
            return null != (f = c["if"].call(null != b ? b : {}, null != b ? b.item : b, {
                name: "if",
                hash: {},
                fn: a.program(1, e, 0),
                inverse: a.program(1, e, 0),
                data: e
            })) ? f : ""
        },
        usePartial: !0,
        useData: !0
    })), Handlebars.registerPartial("_folder-sidebar", Handlebars.template({
        compiler: [7, ">= 4.0.0"],
        main: function(a, b, c, d, e) {
            return '<div class="col-md-6 col-xs-12 examples folder-examples"></div>\n'
        },
        useData: !0
    })), Handlebars.registerPartial("_folder", Handlebars.template({
        compiler: [7, ">= 4.0.0"],
        main: function(a, b, c, d, e) {
            var f, g;
            return '<div class="row row-no-padding row-eq-height" id="' + a.escapeExpression((g = null != (g = c._postman_id || (null != b ? b._postman_id : b)) ? g : c.helperMissing, "function" == typeof g ? g.call(null != b ? b : {}, {
                name: "_postman_id",
                hash: {},
                data: e
            }) : g)) + '">\n  ' + (null != (f = a.invokePartial(d["_folder-doc"], b, {
                name: "_folder-doc",
                data: e,
                helpers: c,
                partials: d,
                decorators: a.decorators
            })) ? f : "") + "  " + (null != (f = a.invokePartial(d["_folder-sidebar"], b, {
                name: "_folder-sidebar",
                data: e,
                helpers: c,
                partials: d,
                decorators: a.decorators
            })) ? f : "") + "</div>\n"
        },
        usePartial: !0,
        useData: !0
    })), Handlebars.registerPartial("_introduction-doc", Handlebars.template({
        compiler: [7, ">= 4.0.0"],
        main: function(a, b, c, d, e) {
            var f, g, h = null != b ? b : {},
                i = c.helperMissing,
                j = "function";
            return '<div class="col-md-6 col-xs-12 section">\n  <div class="api-information">\n    <div class="collection-name">\n      <p>' + a.escapeExpression((g = null != (g = c.name || (null != b ? b.name : b)) ? g : i, typeof g === j ? g.call(h, {
                name: "name",
                hash: {},
                data: e
            }) : g)) + '</p>\n    </div>\n    <div class="collection-description">' + (null != (g = null != (g = c.description || (null != b ? b.description : b)) ? g : i, f = typeof g === j ? g.call(h, {
                name: "description",
                hash: {},
                data: e
            }) : g) ? f : "") + "</div>\n  </div>\n</div>\n"
        },
        useData: !0
    })), Handlebars.registerPartial("_introduction-sidebar", Handlebars.template({
        1: function(a, b, c, d, e) {
            var f;
            return '    <div class="language hidden-xs hidden-sm">\n      <div class="language-heading">Language</div>\n      <div class="btn-group languages">\n        <button type="button" class="btn btn-default dropdown-toggle language-button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\n          <div class="active-lang ellipsis">' + a.escapeExpression(a.lambda(null != (f = null != (f = null != b ? b.languages : b) ? f[0] : f) ? f.name : f, b)) + '</div>\n          <span class="pm-doc-sprite pm-doc-sprite-dropdown-caret"></span>\n        </button>\n        <ul class="dropdown-menu dropdown-menu-right language_dropdown">\n' + (null != (f = c.each.call(null != b ? b : {}, null != b ? b.languages : b, {
                name: "each",
                hash: {},
                fn: a.program(2, e, 0),
                inverse: a.noop,
                data: e
            })) ? f : "") + "        </ul>\n      </div>\n    </div>\n"
        },
        2: function(a, b, c, d, e) {
            var f, g = null != b ? b : {},
                h = c.helperMissing,
                i = "function",
                j = a.escapeExpression;
            return '          <li class="dropdown-menu-item" data-snippetname=' + j((f = null != (f = c.target || (null != b ? b.target : b)) ? f : h, typeof f === i ? f.call(g, {
                name: "target",
                hash: {},
                data: e
            }) : f)) + ":" + j((f = null != (f = c.client || (null != b ? b.client : b)) ? f : h, typeof f === i ? f.call(g, {
                name: "client",
                hash: {},
                data: e
            }) : f)) + ">" + j((f = null != (f = c.name || (null != b ? b.name : b)) ? f : h, typeof f === i ? f.call(g, {
                name: "name",
                hash: {},
                data: e
            }) : f)) + "</li>\n"
        },
        compiler: [7, ">= 4.0.0"],
        main: function(a, b, c, d, e) {
            var f;
            return '<div class="col-md-6 col-xs-12 examples">\n' + (null != (f = c["if"].call(null != b ? b : {}, null != b ? b.languages : b, {
                name: "if",
                hash: {},
                fn: a.program(1, e, 0),
                inverse: a.noop,
                data: e
            })) ? f : "") + "</div>\n"
        },
        useData: !0
    })), Handlebars.registerPartial("_introduction", Handlebars.template({
        compiler: [7, ">= 4.0.0"],
        main: function(a, b, c, d, e) {
            var f;
            return '<div class="row row-no-padding row-eq-height" id="intro">\n  ' + (null != (f = a.invokePartial(d["_introduction-doc"], b, {
                name: "_introduction-doc",
                data: e,
                helpers: c,
                partials: d,
                decorators: a.decorators
            })) ? f : "") + "  " + (null != (f = a.invokePartial(d["_introduction-sidebar"], b, {
                name: "_introduction-sidebar",
                data: e,
                helpers: c,
                partials: d,
                decorators: a.decorators
            })) ? f : "") + "</div>\n"
        },
        usePartial: !0,
        useData: !0
    })), Handlebars.registerPartial("_item", Handlebars.template({
        compiler: [7, ">= 4.0.0"],
        main: function(a, b, c, d, e) {
            var f, g;
            return '<div class="row row-no-padding row-eq-height" id="' + a.escapeExpression((g = null != (g = c._postman_id || (null != b ? b._postman_id : b)) ? g : c.helperMissing, "function" == typeof g ? g.call(null != b ? b : {}, {
                name: "_postman_id",
                hash: {},
                data: e
            }) : g)) + '">\n  ' + (null != (f = a.invokePartial(d["_request-doc"], b, {
                name: "_request-doc",
                data: e,
                helpers: c,
                partials: d,
                decorators: a.decorators
            })) ? f : "") + "  " + (null != (f = a.invokePartial(d["_request-sidebar"], b, {
                name: "_request-sidebar",
                data: e,
                helpers: c,
                partials: d,
                decorators: a.decorators
            })) ? f : "") + "</div>\n"
        },
        usePartial: !0,
        useData: !0
    })), Handlebars.registerPartial("_new-item", Handlebars.template({
        1: function(a, b, c, d, e) {
            var f;
            return "  " + (null != (f = a.invokePartial(d._folder, b, {
                name: "_folder",
                data: e,
                helpers: c,
                partials: d,
                decorators: a.decorators
            })) ? f : "") + (null != (f = c.each.call(null != b ? b : {}, null != b ? b.item : b, {
                name: "each",
                hash: {},
                fn: a.program(2, e, 0),
                inverse: a.noop,
                data: e
            })) ? f : "")
        },
        2: function(a, b, c, d, e) {
            var f;
            return "  \t" + (null != (f = a.invokePartial(d["_new-item"], b, {
                name: "_new-item",
                data: e,
                helpers: c,
                partials: d,
                decorators: a.decorators
            })) ? f : "")
        },
        4: function(a, b, c, d, e) {
            var f;
            return "  " + (null != (f = a.invokePartial(d._request, b, {
                name: "_request",
                data: e,
                helpers: c,
                partials: d,
                decorators: a.decorators
            })) ? f : "")
        },
        compiler: [7, ">= 4.0.0"],
        main: function(a, b, c, d, e) {
            var f, g, h, i = "";
            return g = null != (g = c.ifIsFolder || (null != b ? b.ifIsFolder : b)) ? g : c.helperMissing, h = {
                name: "ifIsFolder",
                hash: {},
                fn: a.program(1, e, 0),
                inverse: a.program(4, e, 0),
                data: e
            }, f = "function" == typeof g ? g.call(null != b ? b : {}, h) : g, c.ifIsFolder || (f = c.blockHelperMissing.call(b, f, h)), null != f && (i += f), i
        },
        usePartial: !0,
        useData: !0
    })), Handlebars.registerPartial("_request-doc", Handlebars.template({
        1: function(a, b, c, d, e) {
            return '          <span class="lock-icon"></span>\n'
        },
        3: function(a, b, c, d, e) {
            return ""
        },
        5: function(a, b, c, d, e) {
            var f;
            return '      <div class="headers">\n        <div class="heading">HEADERS</div>\n        <hr>\n' + (null != (f = c.each.call(null != b ? b : {}, null != (f = null != b ? b.request : b) ? f.header : f, {
                name: "each",
                hash: {},
                fn: a.program(6, e, 0),
                inverse: a.noop,
                data: e
            })) ? f : "") + "      </div>\n"
        },
        6: function(a, b, c, d, e) {
            var f, g, h = null != b ? b : {},
                i = c.helperMissing,
                j = "function",
                k = a.escapeExpression;
            return '          <div class="param row">\n            <div class="name col-md-3 col-xs-12">' + k((g = null != (g = c.key || (null != b ? b.key : b)) ? g : i, typeof g === j ? g.call(h, {
                name: "key",
                hash: {},
                data: e
            }) : g)) + '</div>\n            <div class="value col-md-9 col-xs-12">' + k((g = null != (g = c.value || (null != b ? b.value : b)) ? g : i, typeof g === j ? g.call(h, {
                name: "value",
                hash: {},
                data: e
            }) : g)) + "</div>\n" + (null != (f = c["if"].call(h, null != b ? b.description : b, {
                name: "if",
                hash: {},
                fn: a.program(7, e, 0),
                inverse: a.noop,
                data: e
            })) ? f : "") + "          </div>\n"
        },
        7: function(a, b, c, d, e) {
            var f, g;
            return '              <div class="description col-md-9 col-xs-12">' + (null != (g = null != (g = c.description || (null != b ? b.description : b)) ? g : c.helperMissing, f = "function" == typeof g ? g.call(null != b ? b : {}, {
                name: "description",
                hash: {},
                data: e
            }) : g) ? f : "") + "</div>\n"
        },
        9: function(a, b, c, d, e) {
            var f;
            return '      <div class="query-params">\n        <div class="heading">PARAMS</div>\n        <hr>\n' + (null != (f = c.each.call(null != b ? b : {}, null != (f = null != (f = null != b ? b.request : b) ? f.urlObject : f) ? f.query : f, {
                name: "each",
                hash: {},
                fn: a.program(10, e, 0),
                inverse: a.noop,
                data: e
            })) ? f : "") + "      </div>\n"
        },
        10: function(a, b, c, d, e) {
            var f;
            return null != (f = (c.checkQueryParam || b && b.checkQueryParam || c.helperMissing).call(null != b ? b : {}, null != b ? b.disabled : b, {
                name: "checkQueryParam",
                hash: {},
                fn: a.program(11, e, 0),
                inverse: a.noop,
                data: e
            })) ? f : ""
        },
        11: function(a, b, c, d, e) {
            var f, g, h = null != b ? b : {},
                i = c.helperMissing,
                j = "function",
                k = a.escapeExpression;
            return '            <div class="param row">\n              <div class="name col-md-3 col-xs-12">' + k((g = null != (g = c.key || (null != b ? b.key : b)) ? g : i, typeof g === j ? g.call(h, {
                name: "key",
                hash: {},
                data: e
            }) : g)) + '</div>\n              <div class="value col-md-9 col-xs-12">' + k((g = null != (g = c.value || (null != b ? b.value : b)) ? g : i, typeof g === j ? g.call(h, {
                name: "value",
                hash: {},
                data: e
            }) : g)) + "</div>\n" + (null != (f = c["if"].call(h, null != (f = null != b ? b.description : b) ? f.content : f, {
                name: "if",
                hash: {},
                fn: a.program(12, e, 0),
                inverse: a.noop,
                data: e
            })) ? f : "") + "            </div>\n"
        },
        12: function(a, b, c, d, e) {
            var f;
            return '                <div class="description col-md-9 col-xs-12"><p>' + (null != (f = a.lambda(null != (f = null != b ? b.description : b) ? f.content : f, b)) ? f : "") + "</p></div>\n"
        },
        14: function(a, b, c, d, e) {
            var f;
            return '      <div class="path-variables">\n        <div class="heading">PATH VARIABLES</div>\n        <hr>\n' + (null != (f = c.each.call(null != b ? b : {}, null != (f = null != (f = null != b ? b.request : b) ? f.urlObject : f) ? f.variable : f, {
                name: "each",
                hash: {},
                fn: a.program(11, e, 0),
                inverse: a.noop,
                data: e
            })) ? f : "") + "      </div>\n"
        },
        16: function(a, b, c, d, e) {
            var f;
            return '      <div class="request-body">\n        <div class="body-heading">BODY</div>\n' + (null != (f = (c.ifeq || b && b.ifeq || c.helperMissing).call(null != b ? b : {}, null != (f = null != (f = null != b ? b.request : b) ? f.body : f) ? f.mode : f, "raw", {
                name: "ifeq",
                hash: {},
                fn: a.program(17, e, 0),
                inverse: a.program(22, e, 0),
                data: e
            })) ? f : "") + "      </div>\n"
        },
        17: function(a, b, c, d, e) {
            var f;
            return '          <hr>\n          <div class = "raw-body code-snippet">\n' + (null != (f = (c.ifeq || b && b.ifeq || c.helperMissing).call(null != b ? b : {}, null != (f = null != (f = null != (f = null != b ? b.request : b) ? f.header : f) ? f[0] : f) ? f.value : f, "text/xml", {
                name: "ifeq",
                hash: {},
                fn: a.program(18, e, 0),
                inverse: a.program(20, e, 0),
                data: e
            })) ? f : "") + "          </div>\n\n"
        },
        18: function(a, b, c, d, e) {
            var f;
            return '              <pre class="body-block click-to-expand-wrapper is-snippet-wrapper"><code class="body-block language-xml">' + a.escapeExpression(a.lambda(null != (f = null != (f = null != b ? b.request : b) ? f.body : f) ? f.raw : f, b)) + "</code></pre>\n"
        },
        20: function(a, b, c, d, e) {
            var f;
            return '            <pre class="body-block click-to-expand-wrapper is-snippet-wrapper"><code class="body-block language-javascript">' + a.escapeExpression(a.lambda(null != (f = null != (f = null != b ? b.request : b) ? f.body : f) ? f.raw : f, b)) + "</code></pre>\n"
        },
        22: function(a, b, c, d, e) {
            var f, g = null != b ? b : {},
                h = c.helperMissing;
            return (null != (f = (c.ifeq || b && b.ifeq || h).call(g, null != (f = null != (f = null != b ? b.request : b) ? f.body : f) ? f.mode : f, "formdata", {
                name: "ifeq",
                hash: {},
                fn: a.program(23, e, 0),
                inverse: a.noop,
                data: e
            })) ? f : "") + "\n" + (null != (f = (c.ifeq || b && b.ifeq || h).call(g, null != (f = null != (f = null != b ? b.request : b) ? f.body : f) ? f.mode : f, "urlencoded", {
                name: "ifeq",
                hash: {},
                fn: a.program(27, e, 0),
                inverse: a.noop,
                data: e
            })) ? f : "")
        },
        23: function(a, b, c, d, e) {
            var f;
            return "            <hr>\n" + (null != (f = c.each.call(null != b ? b : {}, null != (f = null != (f = null != b ? b.request : b) ? f.body : f) ? f.formdata : f, {
                name: "each",
                hash: {},
                fn: a.program(24, e, 0),
                inverse: a.noop,
                data: e
            })) ? f : "")
        },
        24: function(a, b, c, d, e) {
            var f, g, h = null != b ? b : {},
                i = c.helperMissing,
                j = "function",
                k = a.escapeExpression;
            return '              <div class="param row">\n                <div class="name col-md-3 col-xs-12">' + k((g = null != (g = c.key || (null != b ? b.key : b)) ? g : i, typeof g === j ? g.call(h, {
                name: "key",
                hash: {},
                data: e
            }) : g)) + '</div>\n                <div class="value col-md-9 col-xs-12">' + k((g = null != (g = c.value || (null != b ? b.value : b)) ? g : i, typeof g === j ? g.call(h, {
                name: "value",
                hash: {},
                data: e
            }) : g)) + "</div>\n" + (null != (f = c["if"].call(h, null != b ? b.description : b, {
                name: "if",
                hash: {},
                fn: a.program(25, e, 0),
                inverse: a.noop,
                data: e
            })) ? f : "") + "              </div>\n"
        },
        25: function(a, b, c, d, e) {
            var f, g;
            return '                  <div class="description col-md-9 col-xs-12">' + (null != (g = null != (g = c.description || (null != b ? b.description : b)) ? g : c.helperMissing, f = "function" == typeof g ? g.call(null != b ? b : {}, {
                name: "description",
                hash: {},
                data: e
            }) : g) ? f : "") + "</div>\n"
        },
        27: function(a, b, c, d, e) {
            var f;
            return "            <hr>\n" + (null != (f = c.each.call(null != b ? b : {}, null != (f = null != (f = null != b ? b.request : b) ? f.body : f) ? f.urlencoded : f, {
                name: "each",
                hash: {},
                fn: a.program(24, e, 0),
                inverse: a.noop,
                data: e
            })) ? f : "")
        },
        29: function(a, b, c, d, e) {
            var f;
            return '      <div class="attributes">\n         <div class="attr-heading">URL Params</div>\n' + (null != (f = c.each.call(null != b ? b : {}, null != b ? b.attributes : b, {
                name: "each",
                hash: {},
                fn: a.program(30, e, 0),
                inverse: a.noop,
                data: e
            })) ? f : "") + "      </div>\n"
        },
        30: function(a, b, c, d, e) {
            var f, g, h = null != b ? b : {},
                i = c.helperMissing,
                j = "function";
            return '          <hr>\n          <div class = "attr-name"><b>' + a.escapeExpression((g = null != (g = c.name || (null != b ? b.name : b)) ? g : i, typeof g === j ? g.call(h, {
                name: "name",
                hash: {},
                data: e
            }) : g)) + '</b> </div>\n          <div class="attr-description">' + (null != (g = null != (g = c.description || (null != b ? b.description : b)) ? g : i, f = typeof g === j ? g.call(h, {
                name: "description",
                hash: {},
                data: e
            }) : g) ? f : "") + "</div>\n"
        },
        compiler: [7, ">= 4.0.0"],
        main: function(a, b, c, d, e) {
            var f, g, h = a.lambda,
                i = a.escapeExpression,
                j = null != b ? b : {},
                k = c.helperMissing;
            return '<div class="col-md-6 col-xs-12 section">\n  <div class="api-information">\n    <div class="heading">\n      <div class="name">\n        <span class="' + i(h(null != (f = null != b ? b.request : b) ? f.method : f, b)) + ' method">' + i(h(null != (f = null != b ? b.request : b) ? f.method : f, b)) + "</span>\n        " + i((g = null != (g = c.name || (null != b ? b.name : b)) ? g : k, "function" == typeof g ? g.call(j, {
                name: "name",
                hash: {},
                data: e
            }) : g)) + "\n" + (null != (f = (c.checkrequestauth || b && b.checkrequestauth || k).call(j, null != (f = null != b ? b.request : b) ? f.auth : f, {
                name: "checkrequestauth",
                hash: {},
                fn: a.program(1, e, 0),
                inverse: a.noop,
                data: e
            })) ? f : "") + '      </div>\n    </div>\n    <div class="url">' + i(h(null != (f = null != b ? b.request : b) ? f.urlRaw : f, b)) + '</div>\n    <div class="description">' + (null != (f = h(null != (f = null != b ? b.request : b) ? f.description : f, b)) ? f : "") + "</div>\n\n" + (null != (f = c["if"].call(j, null != b ? b.authorization : b, {
                name: "if",
                hash: {},
                fn: a.program(3, e, 0),
                inverse: a.noop,
                data: e
            })) ? f : "") + (null != (f = c["if"].call(j, null != (f = null != b ? b.request : b) ? f.header : f, {
                name: "if",
                hash: {},
                fn: a.program(5, e, 0),
                inverse: a.noop,
                data: e
            })) ? f : "") + "\n" + (null != (f = c["if"].call(j, null != (f = null != (f = null != b ? b.request : b) ? f.urlObject : f) ? f.query : f, {
                name: "if",
                hash: {},
                fn: a.program(9, e, 0),
                inverse: a.noop,
                data: e
            })) ? f : "") + "\n" + (null != (f = c["if"].call(j, null != (f = null != (f = null != b ? b.request : b) ? f.urlObject : f) ? f.variable : f, {
                name: "if",
                hash: {},
                fn: a.program(14, e, 0),
                inverse: a.noop,
                data: e
            })) ? f : "") + "\n" + (null != (f = (c.hasRequestBody || b && b.hasRequestBody || k).call(j, null != (f = null != b ? b.request : b) ? f.body : f, {
                name: "hasRequestBody",
                hash: {},
                fn: a.program(16, e, 0),
                inverse: a.noop,
                data: e
            })) ? f : "") + "\n" + (null != (f = c["if"].call(j, null != (f = null != b ? b.request : b) ? f.params : f, {
                name: "if",
                hash: {},
                fn: a.program(29, e, 0),
                inverse: a.noop,
                data: e
            })) ? f : "") + "  </div>\n  <br><br>\n</div>\n\n\n"
        },
        useData: !0
    })), Handlebars.registerPartial("_request-sidebar", Handlebars.template({
        1: function(a, b, c, d, e, f, g) {
            var h, i = null != b ? b : {};
            return '\n    <div class="sample-request">\n      <div class="heading"><span>Example Request</span></div>\n\n      <div class="responses-index">\n' + (null != (h = (c.ifeq || b && b.ifeq || c.helperMissing).call(i, null != (h = null != b ? b.sample : b) ? h.length : h, 1, {
                name: "ifeq",
                hash: {},
                fn: a.program(2, e, 0, f, g),
                inverse: a.program(4, e, 0, f, g),
                data: e
            })) ? h : "") + '      </div>\n    </div>\n\n    <div class="request code-snippet">\n' + (null != (h = c.each.call(i, null != b ? b.sample : b, {
                name: "each",
                hash: {},
                fn: a.program(7, e, 0, f, g),
                inverse: a.noop,
                data: e
            })) ? h : "") + "    </div>\n\n" + (null != (h = c["if"].call(i, null != (h = null != (h = null != (h = null != b ? b.sample : b) ? h[0] : h) ? h.response : h) ? h.body : h, {
                name: "if",
                hash: {},
                fn: a.program(12, e, 0, f, g),
                inverse: a.noop,
                data: e
            })) ? h : "")
        },
        2: function(a, b, c, d, e) {
            var f;
            return '          <div class="response-name"><span>' + a.escapeExpression(a.lambda(null != (f = null != (f = null != b ? b.sample : b) ? f[0] : f) ? f.name : f, b)) + "</span></div>\n"
        },
        4: function(a, b, c, d, e, f, g) {
            var h, i, j = null != b ? b : {},
                k = c.helperMissing,
                l = "function",
                m = a.escapeExpression;
            return '          <div class="dropdown response-name">\n            <button class="btn dropdown-toggle responses-dropdown truncate" type="button" id="' + m((i = null != (i = c._postman_id || (null != b ? b._postman_id : b)) ? i : k, typeof i === l ? i.call(j, {
                name: "_postman_id",
                hash: {},
                data: e
            }) : i)) + '_dropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">\n              <span class="response-name-label">' + m(a.lambda(null != (h = null != (h = null != b ? b.sample : b) ? h[0] : h) ? h.name : h, b)) + '</span>\n              <span class="caret"></span>\n            </button>\n            <ul class="dropdown-menu" aria-labelledby="' + m((i = null != (i = c._postman_id || (null != b ? b._postman_id : b)) ? i : k, typeof i === l ? i.call(j, {
                name: "_postman_id",
                hash: {},
                data: e
            }) : i)) + '_dropdown">\n' + (null != (h = c.each.call(j, null != b ? b.sample : b, {
                name: "each",
                hash: {},
                fn: a.program(5, e, 0, f, g),
                inverse: a.noop,
                data: e
            })) ? h : "") + "            </ul>\n          </div>\n"
        },
        5: function(a, b, c, d, e, f, g) {
            var h, i = a.lambda,
                j = a.escapeExpression,
                k = null != b ? b : {},
                l = c.helperMissing,
                m = "function";
            return '                <li class="truncate" data-request-info="' + j(i(null != g[1] ? g[1]._postman_id : g[1], b)) + "_" + j((h = null != (h = c.index || e && e.index) ? h : l, typeof h === m ? h.call(k, {
                name: "index",
                hash: {},
                data: e
            }) : h)) + '" data-request-name="' + j(i(null != g[1] ? g[1]._postman_id : g[1], b)) + '">' + j((h = null != (h = c.name || (null != b ? b.name : b)) ? h : l, typeof h === m ? h.call(k, {
                name: "name",
                hash: {},
                data: e
            }) : h)) + "</li>\n"
        },
        7: function(a, b, c, d, e, f, g) {
            var h;
            return null != (h = c.each.call(null != b ? b : {}, null != b ? b.snippet : b, {
                name: "each",
                hash: {},
                fn: a.program(8, e, 0, f, g),
                inverse: a.noop,
                data: e
            })) ? h : ""
        },
        8: function(a, b, c, d, e, f, g) {
            var h, i, j = null != b ? b : {},
                k = c.helperMissing,
                l = a.escapeExpression,
                m = a.lambda;
            return '          <div class="formatted-requests ' + (null != (h = c.unless.call(j, a.data(e, 1) && a.data(e, 1).index, {
                name: "unless",
                hash: {},
                fn: a.program(9, e, 0, f, g),
                inverse: a.noop,
                data: e
            })) ? h : "") + '" data-lang="' + l((i = null != (i = c.key || e && e.key) ? i : k, "function" == typeof i ? i.call(j, {
                name: "key",
                hash: {},
                data: e
            }) : i)) + '" data-id="' + l(m(null != g[2] ? g[2]._postman_id : g[2], b)) + "_" + l(m(a.data(e, 1) && a.data(e, 1).index, b)) + '">\n            <pre class="click-to-expand-wrapper is-snippet-wrapper"><button class="btn btn-sm pull-right copy-request copy-request-modal" data-clipboard-target="#' + (null != (h = (c.generateRequestID || b && b.generateRequestID || k).call(j, {
                name: "generateRequestID",
                hash: {
                    lang: e && e.key,
                    requestId: a.data(e, 1) && a.data(e, 1).index,
                    request: null != g[2] ? g[2]._postman_id : g[2]
                },
                data: e
            })) ? h : "") + '" data-before-copy="Copy to Clipboard" data-after-copy="Copied"></button><code class="language-javascript" id="' + (null != (h = (c.generateRequestID || b && b.generateRequestID || k).call(j, {
                name: "generateRequestID",
                hash: {
                    lang: e && e.key,
                    requestId: a.data(e, 1) && a.data(e, 1).index,
                    request: null != g[2] ? g[2]._postman_id : g[2]
                },
                data: e
            })) ? h : "") + '">' + l((c.sanitise_snippet || b && b.sanitise_snippet || k).call(j, e && e.key, b, {
                name: "sanitise_snippet",
                hash: {},
                data: e
            })) + '</code></pre>\n            <!-- Button over the expand overlay -->\n            <button class="btn btn-sm pull-right copy-request" data-clipboard-target="#' + (null != (h = (c.generateRequestID || b && b.generateRequestID || k).call(j, {
                name: "generateRequestID",
                hash: {
                    lang: e && e.key,
                    requestId: a.data(e, 1) && a.data(e, 1).index,
                    request: null != g[2] ? g[2]._postman_id : g[2]
                },
                data: e
            })) ? h : "") + '" data-before-copy="Copy to Clipboard" data-after-copy="Copied"></button>\n          </div>\n'
        },
        9: function(a, b, c, d, e) {
            var f;
            return null != (f = (c.ifeq || b && b.ifeq || c.helperMissing).call(null != b ? b : {}, (f = (f = e && e.root) && f.meta) && f.lang, e && e.key, {
                name: "ifeq",
                hash: {},
                fn: a.program(10, e, 0),
                inverse: a.noop,
                data: e
            })) ? f : ""
        },
        10: function(a, b, c, d, e) {
            return "is-default"
        },
        12: function(a, b, c, d, e, f, g) {
            var h, i = null != b ? b : {};
            return '      <div class="sample-response">\n        <div class="heading">\n          <span>Example Response</span>\n        </div>\n        <div class="responses-index">\n' + (null != (h = c.each.call(i, null != b ? b.response : b, {
                name: "each",
                hash: {},
                fn: a.program(13, e, 0, f, g),
                inverse: a.noop,
                data: e
            })) ? h : "") + '        </div>\n      </div>\n      <div class="responses code-snippet">\n' + (null != (h = c.each.call(i, null != b ? b.sample : b, {
                name: "each",
                hash: {},
                fn: a.program(18, e, 0, f, g),
                inverse: a.noop,
                data: e
            })) ? h : "") + "      </div>\n"
        },
        13: function(a, b, c, d, e, f, g) {
            var h;
            return null != (h = c["if"].call(null != b ? b : {}, e && e.index, {
                name: "if",
                hash: {},
                fn: a.program(14, e, 0, f, g),
                inverse: a.program(16, e, 0, f, g),
                data: e
            })) ? h : ""
        },
        14: function(a, b, c, d, e, f, g) {
            var h, i = a.escapeExpression,
                j = null != b ? b : {},
                k = c.helperMissing,
                l = "function";
            return '              <div class="response-status" data-id="' + i(a.lambda(null != g[1] ? g[1]._postman_id : g[1], b)) + "_" + i((h = null != (h = c.index || e && e.index) ? h : k, typeof h === l ? h.call(j, {
                name: "index",
                hash: {},
                data: e
            }) : h)) + '"><span>' + i((h = null != (h = c.code || (null != b ? b.code : b)) ? h : k, typeof h === l ? h.call(j, {
                name: "code",
                hash: {},
                data: e
            }) : h)) + " " + i((h = null != (h = c.status || (null != b ? b.status : b)) ? h : k, typeof h === l ? h.call(j, {
                name: "status",
                hash: {},
                data: e
            }) : h)) + "</span></div>\n"
        },
        16: function(a, b, c, d, e, f, g) {
            var h, i = a.escapeExpression,
                j = null != b ? b : {},
                k = c.helperMissing,
                l = "function";
            return '              <div class="response-status is-default" data-id="' + i(a.lambda(null != g[1] ? g[1]._postman_id : g[1], b)) + "_" + i((h = null != (h = c.index || e && e.index) ? h : k, typeof h === l ? h.call(j, {
                name: "index",
                hash: {},
                data: e
            }) : h)) + '"><span>' + i((h = null != (h = c.code || (null != b ? b.code : b)) ? h : k, typeof h === l ? h.call(j, {
                name: "code",
                hash: {},
                data: e
            }) : h)) + " " + i((h = null != (h = c.status || (null != b ? b.status : b)) ? h : k, typeof h === l ? h.call(j, {
                name: "status",
                hash: {},
                data: e
            }) : h)) + "</span></div>\n"
        },
        18: function(a, b, c, d, e, f, g) {
            var h;
            return null != (h = c["if"].call(null != b ? b : {}, e && e.index, {
                name: "if",
                hash: {},
                fn: a.program(19, e, 0, f, g),
                inverse: a.program(21, e, 0, f, g),
                data: e
            })) ? h : ""
        },
        19: function(a, b, c, d, e, f, g) {
            var h, i, j = a.lambda,
                k = a.escapeExpression;
            return '            <div class="formatted-responses" data-id="' + k(j(null != g[1] ? g[1]._postman_id : g[1], b)) + "_" + k((i = null != (i = c.index || e && e.index) ? i : c.helperMissing, "function" == typeof i ? i.call(null != b ? b : {}, {
                name: "index",
                hash: {},
                data: e
            }) : i)) + '" data-lang="' + k(j(null != (h = null != b ? b.response : b) ? h._postman_previewlanguage : h, b)) + '">' + k(j(null != (h = null != b ? b.response : b) ? h.body : h, b)) + "</div>\n"
        },
        21: function(a, b, c, d, e, f, g) {
            var h, i, j = a.lambda,
                k = a.escapeExpression;
            return '            <div class="formatted-responses is-default" data-id="' + k(j(null != g[1] ? g[1]._postman_id : g[1], b)) + "_" + k((i = null != (i = c.index || e && e.index) ? i : c.helperMissing, "function" == typeof i ? i.call(null != b ? b : {}, {
                name: "index",
                hash: {},
                data: e
            }) : i)) + '" data-lang="' + k(j(null != (h = null != b ? b.response : b) ? h._postman_previewlanguage : h, b)) + '">' + k(j(null != (h = null != b ? b.response : b) ? h.body : h, b)) + "</div>\n"
        },
        compiler: [7, ">= 4.0.0"],
        main: function(a, b, c, d, e, f, g) {
            var h;
            return '<div class="col-md-6 col-xs-12 examples">' + (null != (h = c["if"].call(null != b ? b : {}, null != b ? b.sample : b, {
                name: "if",
                hash: {},
                fn: a.program(1, e, 0, f, g),
                inverse: a.noop,
                data: e
            })) ? h : "") + "</div>\n"
        },
        useData: !0,
        useDepths: !0
    })), Handlebars.registerPartial("_request", Handlebars.template({
        compiler: [7, ">= 4.0.0"],
        main: function(a, b, c, d, e) {
            var f, g;
            return '<div class="row row-no-padding row-eq-height" id="' + a.escapeExpression((g = null != (g = c._postman_id || (null != b ? b._postman_id : b)) ? g : c.helperMissing, "function" == typeof g ? g.call(null != b ? b : {}, {
                name: "_postman_id",
                hash: {},
                data: e
            }) : g)) + '">\n  ' + (null != (f = a.invokePartial(d["_request-doc"], b, {
                name: "_request-doc",
                data: e,
                helpers: c,
                partials: d,
                decorators: a.decorators
            })) ? f : "") + "  " + (null != (f = a.invokePartial(d["_request-sidebar"], b, {
                name: "_request-sidebar",
                data: e,
                helpers: c,
                partials: d,
                decorators: a.decorators
            })) ? f : "") + "</div>\n"
        },
        usePartial: !0,
        useData: !0
    })), this.Handlebars.templates["doc-sidebar"] = Handlebars.template({
        1: function(a, b, c, d, e) {
            var f;
            return "  " + (null != (f = a.invokePartial(d._introduction, b, {
                name: "_introduction",
                data: e,
                helpers: c,
                partials: d,
                decorators: a.decorators
            })) ? f : "")
        },
        3: function(a, b, c, d, e) {
            var f;
            return "  " + (null != (f = a.invokePartial(d["_new-item"], b, {
                name: "_new-item",
                data: e,
                helpers: c,
                partials: d,
                decorators: a.decorators
            })) ? f : "")
        },
        compiler: [7, ">= 4.0.0"],
        main: function(a, b, c, d, e) {
            var f, g = null != b ? b : {};
            return (null != (f = c["with"].call(g, null != b ? b.info : b, {
                name: "with",
                hash: {},
                fn: a.program(1, e, 0),
                inverse: a.noop,
                data: e
            })) ? f : "") + (null != (f = c.each.call(g, null != b ? b.item : b, {
                name: "each",
                hash: {},
                fn: a.program(3, e, 0),
                inverse: a.noop,
                data: e
            })) ? f : "")
        },
        usePartial: !0,
        useData: !0
    }), this.Handlebars.templates["toc-item"] = Handlebars.template({
        compiler: [7, ">= 4.0.0"],
        main: function(a, b, c, d, e) {
            var f, g = null != b ? b : {},
                h = c.helperMissing,
                i = "function",
                j = a.escapeExpression;
            return '<li class="request heading">\n  <a class="nav-link dropdown-item" href=\'#' + j((f = null != (f = c.id || (null != b ? b.id : b)) ? f : h, typeof f === i ? f.call(g, {
                name: "id",
                hash: {},
                data: e
            }) : f)) + '\'>\n    <div class="request-name">' + j((f = null != (f = c.name || (null != b ? b.name : b)) ? f : h, typeof f === i ? f.call(g, {
                name: "name",
                hash: {},
                data: e
            }) : f)) + "</div>\n  </a>\n</li>\n"
        },
        useData: !0
    }), "undefined" == typeof jQuery) throw new Error("Bootstrap's JavaScript requires jQuery"); + function(a) {
    "use strict";
    var b = a.fn.jquery.split(" ")[0].split(".");
    if (b[0] < 2 && b[1] < 9 || 1 == b[0] && 9 == b[1] && b[2] < 1 || b[0] > 3) throw new Error("Bootstrap's JavaScript requires jQuery version 1.9.1 or higher, but lower than version 4")
}(jQuery), + function(a) {
    "use strict";

    function b() {
        var a = document.createElement("bootstrap"),
            b = {
                WebkitTransition: "webkitTransitionEnd",
                MozTransition: "transitionend",
                OTransition: "oTransitionEnd otransitionend",
                transition: "transitionend"
            };
        for (var c in b)
            if (void 0 !== a.style[c]) return {
                end: b[c]
            };
        return !1
    }
    a.fn.emulateTransitionEnd = function(b) {
        var c = !1,
            d = this;
        a(this).one("bsTransitionEnd", function() {
            c = !0
        });
        var e = function() {
            c || a(d).trigger(a.support.transition.end)
        };
        return setTimeout(e, b), this
    }, a(function() {
        a.support.transition = b(), a.support.transition && (a.event.special.bsTransitionEnd = {
            bindType: a.support.transition.end,
            delegateType: a.support.transition.end,
            handle: function(b) {
                if (a(b.target).is(this)) return b.handleObj.handler.apply(this, arguments)
            }
        })
    })
}(jQuery), + function(a) {
    "use strict";

    function b(b) {
        return this.each(function() {
            var c = a(this),
                e = c.data("bs.alert");
            e || c.data("bs.alert", e = new d(this)), "string" == typeof b && e[b].call(c)
        })
    }
    var c = '[data-dismiss="alert"]',
        d = function(b) {
            a(b).on("click", c, this.close)
        };
    d.VERSION = "3.3.7", d.TRANSITION_DURATION = 150, d.prototype.close = function(b) {
        function c() {
            g.detach().trigger("closed.bs.alert").remove()
        }
        var e = a(this),
            f = e.attr("data-target");
        f || (f = e.attr("href"), f = f && f.replace(/.*(?=#[^\s]*$)/, ""));
        var g = a("#" === f ? [] : f);
        b && b.preventDefault(), g.length || (g = e.closest(".alert")), g.trigger(b = a.Event("close.bs.alert")), b.isDefaultPrevented() || (g.removeClass("in"), a.support.transition && g.hasClass("fade") ? g.one("bsTransitionEnd", c).emulateTransitionEnd(d.TRANSITION_DURATION) : c())
    };
    var e = a.fn.alert;
    a.fn.alert = b, a.fn.alert.Constructor = d, a.fn.alert.noConflict = function() {
        return a.fn.alert = e, this
    }, a(document).on("click.bs.alert.data-api", c, d.prototype.close)
}(jQuery), + function(a) {
    "use strict";

    function b(b) {
        return this.each(function() {
            var d = a(this),
                e = d.data("bs.button"),
                f = "object" == typeof b && b;
            e || d.data("bs.button", e = new c(this, f)), "toggle" == b ? e.toggle() : b && e.setState(b)
        })
    }
    var c = function(b, d) {
        this.$element = a(b), this.options = a.extend({}, c.DEFAULTS, d), this.isLoading = !1
    };
    c.VERSION = "3.3.7", c.DEFAULTS = {
        loadingText: "loading..."
    }, c.prototype.setState = function(b) {
        var c = "disabled",
            d = this.$element,
            e = d.is("input") ? "val" : "html",
            f = d.data();
        b += "Text", null == f.resetText && d.data("resetText", d[e]()), setTimeout(a.proxy(function() {
            d[e](null == f[b] ? this.options[b] : f[b]), "loadingText" == b ? (this.isLoading = !0, d.addClass(c).attr(c, c).prop(c, !0)) : this.isLoading && (this.isLoading = !1, d.removeClass(c).removeAttr(c).prop(c, !1))
        }, this), 0)
    }, c.prototype.toggle = function() {
        var a = !0,
            b = this.$element.closest('[data-toggle="buttons"]');
        if (b.length) {
            var c = this.$element.find("input");
            "radio" == c.prop("type") ? (c.prop("checked") && (a = !1), b.find(".active").removeClass("active"), this.$element.addClass("active")) : "checkbox" == c.prop("type") && (c.prop("checked") !== this.$element.hasClass("active") && (a = !1), this.$element.toggleClass("active")), c.prop("checked", this.$element.hasClass("active")), a && c.trigger("change")
        } else this.$element.attr("aria-pressed", !this.$element.hasClass("active")), this.$element.toggleClass("active")
    };
    var d = a.fn.button;
    a.fn.button = b, a.fn.button.Constructor = c, a.fn.button.noConflict = function() {
        return a.fn.button = d, this
    }, a(document).on("click.bs.button.data-api", '[data-toggle^="button"]', function(c) {
        var d = a(c.target).closest(".btn");
        b.call(d, "toggle"), a(c.target).is('input[type="radio"], input[type="checkbox"]') || (c.preventDefault(), d.is("input,button") ? d.trigger("focus") : d.find("input:visible,button:visible").first().trigger("focus"))
    }).on("focus.bs.button.data-api blur.bs.button.data-api", '[data-toggle^="button"]', function(b) {
        a(b.target).closest(".btn").toggleClass("focus", /^focus(in)?$/.test(b.type))
    })
}(jQuery), + function(a) {
    "use strict";

    function b(b) {
        return this.each(function() {
            var d = a(this),
                e = d.data("bs.carousel"),
                f = a.extend({}, c.DEFAULTS, d.data(), "object" == typeof b && b),
                g = "string" == typeof b ? b : f.slide;
            e || d.data("bs.carousel", e = new c(this, f)), "number" == typeof b ? e.to(b) : g ? e[g]() : f.interval && e.pause().cycle()
        })
    }
    var c = function(b, c) {
        this.$element = a(b), this.$indicators = this.$element.find(".carousel-indicators"), this.options = c, this.paused = null, this.sliding = null, this.interval = null, this.$active = null, this.$items = null, this.options.keyboard && this.$element.on("keydown.bs.carousel", a.proxy(this.keydown, this)), "hover" == this.options.pause && !("ontouchstart" in document.documentElement) && this.$element.on("mouseenter.bs.carousel", a.proxy(this.pause, this)).on("mouseleave.bs.carousel", a.proxy(this.cycle, this))
    };
    c.VERSION = "3.3.7", c.TRANSITION_DURATION = 600, c.DEFAULTS = {
        interval: 5e3,
        pause: "hover",
        wrap: !0,
        keyboard: !0
    }, c.prototype.keydown = function(a) {
        if (!/input|textarea/i.test(a.target.tagName)) {
            switch (a.which) {
                case 37:
                    this.prev();
                    break;
                case 39:
                    this.next();
                    break;
                default:
                    return
            }
            a.preventDefault()
        }
    }, c.prototype.cycle = function(b) {
        return b || (this.paused = !1), this.interval && clearInterval(this.interval), this.options.interval && !this.paused && (this.interval = setInterval(a.proxy(this.next, this), this.options.interval)), this
    }, c.prototype.getItemIndex = function(a) {
        return this.$items = a.parent().children(".item"), this.$items.index(a || this.$active)
    }, c.prototype.getItemForDirection = function(a, b) {
        var c = this.getItemIndex(b),
            d = "prev" == a && 0 === c || "next" == a && c == this.$items.length - 1;
        if (d && !this.options.wrap) return b;
        var e = "prev" == a ? -1 : 1,
            f = (c + e) % this.$items.length;
        return this.$items.eq(f)
    }, c.prototype.to = function(a) {
        var b = this,
            c = this.getItemIndex(this.$active = this.$element.find(".item.active"));
        if (!(a > this.$items.length - 1 || a < 0)) return this.sliding ? this.$element.one("slid.bs.carousel", function() {
            b.to(a)
        }) : c == a ? this.pause().cycle() : this.slide(a > c ? "next" : "prev", this.$items.eq(a))
    }, c.prototype.pause = function(b) {
        return b || (this.paused = !0), this.$element.find(".next, .prev").length && a.support.transition && (this.$element.trigger(a.support.transition.end), this.cycle(!0)), this.interval = clearInterval(this.interval), this
    }, c.prototype.next = function() {
        if (!this.sliding) return this.slide("next")
    }, c.prototype.prev = function() {
        if (!this.sliding) return this.slide("prev")
    }, c.prototype.slide = function(b, d) {
        var e = this.$element.find(".item.active"),
            f = d || this.getItemForDirection(b, e),
            g = this.interval,
            h = "next" == b ? "left" : "right",
            i = this;
        if (f.hasClass("active")) return this.sliding = !1;
        var j = f[0],
            k = a.Event("slide.bs.carousel", {
                relatedTarget: j,
                direction: h
            });
        if (this.$element.trigger(k), !k.isDefaultPrevented()) {
            if (this.sliding = !0, g && this.pause(), this.$indicators.length) {
                this.$indicators.find(".active").removeClass("active");
                var l = a(this.$indicators.children()[this.getItemIndex(f)]);
                l && l.addClass("active")
            }
            var m = a.Event("slid.bs.carousel", {
                relatedTarget: j,
                direction: h
            });
            return a.support.transition && this.$element.hasClass("slide") ? (f.addClass(b), f[0].offsetWidth, e.addClass(h), f.addClass(h), e.one("bsTransitionEnd", function() {
                f.removeClass([b, h].join(" ")).addClass("active"), e.removeClass(["active", h].join(" ")), i.sliding = !1, setTimeout(function() {
                    i.$element.trigger(m)
                }, 0)
            }).emulateTransitionEnd(c.TRANSITION_DURATION)) : (e.removeClass("active"), f.addClass("active"), this.sliding = !1, this.$element.trigger(m)), g && this.cycle(), this
        }
    };
    var d = a.fn.carousel;
    a.fn.carousel = b, a.fn.carousel.Constructor = c, a.fn.carousel.noConflict = function() {
        return a.fn.carousel = d, this
    };
    var e = function(c) {
        var d, e = a(this),
            f = a(e.attr("data-target") || (d = e.attr("href")) && d.replace(/.*(?=#[^\s]+$)/, ""));
        if (f.hasClass("carousel")) {
            var g = a.extend({}, f.data(), e.data()),
                h = e.attr("data-slide-to");
            h && (g.interval = !1), b.call(f, g), h && f.data("bs.carousel").to(h), c.preventDefault()
        }
    };
    a(document).on("click.bs.carousel.data-api", "[data-slide]", e).on("click.bs.carousel.data-api", "[data-slide-to]", e), a(window).on("load", function() {
        a('[data-ride="carousel"]').each(function() {
            var c = a(this);
            b.call(c, c.data())
        })
    })
}(jQuery), + function(a) {
    "use strict";

    function b(b) {
        var c, d = b.attr("data-target") || (c = b.attr("href")) && c.replace(/.*(?=#[^\s]+$)/, "");
        return a(d)
    }

    function c(b) {
        return this.each(function() {
            var c = a(this),
                e = c.data("bs.collapse"),
                f = a.extend({}, d.DEFAULTS, c.data(), "object" == typeof b && b);
            !e && f.toggle && /show|hide/.test(b) && (f.toggle = !1), e || c.data("bs.collapse", e = new d(this, f)), "string" == typeof b && e[b]()
        })
    }
    var d = function(b, c) {
        this.$element = a(b), this.options = a.extend({}, d.DEFAULTS, c), this.$trigger = a('[data-toggle="collapse"][href="#' + b.id + '"],[data-toggle="collapse"][data-target="#' + b.id + '"]'), this.transitioning = null, this.options.parent ? this.$parent = this.getParent() : this.addAriaAndCollapsedClass(this.$element, this.$trigger), this.options.toggle && this.toggle()
    };
    d.VERSION = "3.3.7", d.TRANSITION_DURATION = 350, d.DEFAULTS = {
        toggle: !0
    }, d.prototype.dimension = function() {
        var a = this.$element.hasClass("width");
        return a ? "width" : "height"
    }, d.prototype.show = function() {
        if (!this.transitioning && !this.$element.hasClass("in")) {
            var b, e = this.$parent && this.$parent.children(".panel").children(".in, .collapsing");
            if (!(e && e.length && (b = e.data("bs.collapse"), b && b.transitioning))) {
                var f = a.Event("show.bs.collapse");
                if (this.$element.trigger(f), !f.isDefaultPrevented()) {
                    e && e.length && (c.call(e, "hide"), b || e.data("bs.collapse", null));
                    var g = this.dimension();
                    this.$element.removeClass("collapse").addClass("collapsing")[g](0).attr("aria-expanded", !0), this.$trigger.removeClass("collapsed").attr("aria-expanded", !0), this.transitioning = 1;
                    var h = function() {
                        this.$element.removeClass("collapsing").addClass("collapse in")[g](""), this.transitioning = 0, this.$element.trigger("shown.bs.collapse")
                    };
                    if (!a.support.transition) return h.call(this);
                    var i = a.camelCase(["scroll", g].join("-"));
                    this.$element.one("bsTransitionEnd", a.proxy(h, this)).emulateTransitionEnd(d.TRANSITION_DURATION)[g](this.$element[0][i])
                }
            }
        }
    }, d.prototype.hide = function() {
        if (!this.transitioning && this.$element.hasClass("in")) {
            var b = a.Event("hide.bs.collapse");
            if (this.$element.trigger(b), !b.isDefaultPrevented()) {
                var c = this.dimension();
                this.$element[c](this.$element[c]())[0].offsetHeight, this.$element.addClass("collapsing").removeClass("collapse in").attr("aria-expanded", !1), this.$trigger.addClass("collapsed").attr("aria-expanded", !1), this.transitioning = 1;
                var e = function() {
                    this.transitioning = 0, this.$element.removeClass("collapsing").addClass("collapse").trigger("hidden.bs.collapse")
                };
                return a.support.transition ? void this.$element[c](0).one("bsTransitionEnd", a.proxy(e, this)).emulateTransitionEnd(d.TRANSITION_DURATION) : e.call(this)
            }
        }
    }, d.prototype.toggle = function() {
        this[this.$element.hasClass("in") ? "hide" : "show"]()
    }, d.prototype.getParent = function() {
        return a(this.options.parent).find('[data-toggle="collapse"][data-parent="' + this.options.parent + '"]').each(a.proxy(function(c, d) {
            var e = a(d);
            this.addAriaAndCollapsedClass(b(e), e)
        }, this)).end()
    }, d.prototype.addAriaAndCollapsedClass = function(a, b) {
        var c = a.hasClass("in");
        a.attr("aria-expanded", c), b.toggleClass("collapsed", !c).attr("aria-expanded", c)
    };
    var e = a.fn.collapse;
    a.fn.collapse = c, a.fn.collapse.Constructor = d, a.fn.collapse.noConflict = function() {
        return a.fn.collapse = e, this
    }, a(document).on("click.bs.collapse.data-api", '[data-toggle="collapse"]', function(d) {
        var e = a(this);
        e.attr("data-target") || d.preventDefault();
        var f = b(e),
            g = f.data("bs.collapse"),
            h = g ? "toggle" : e.data();
        c.call(f, h)
    })
}(jQuery), + function(a) {
    "use strict";

    function b(b) {
        var c = b.attr("data-target");
        c || (c = b.attr("href"), c = c && /#[A-Za-z]/.test(c) && c.replace(/.*(?=#[^\s]*$)/, ""));
        var d = c && a(c);
        return d && d.length ? d : b.parent()
    }

    function c(c) {
        c && 3 === c.which || (a(e).remove(), a(f).each(function() {
            var d = a(this),
                e = b(d),
                f = {
                    relatedTarget: this
                };
            e.hasClass("open") && (c && "click" == c.type && /input|textarea/i.test(c.target.tagName) && a.contains(e[0], c.target) || (e.trigger(c = a.Event("hide.bs.dropdown", f)), c.isDefaultPrevented() || (d.attr("aria-expanded", "false"), e.removeClass("open").trigger(a.Event("hidden.bs.dropdown", f)))))
        }))
    }

    function d(b) {
        return this.each(function() {
            var c = a(this),
                d = c.data("bs.dropdown");
            d || c.data("bs.dropdown", d = new g(this)), "string" == typeof b && d[b].call(c)
        })
    }
    var e = ".dropdown-backdrop",
        f = '[data-toggle="dropdown"]',
        g = function(b) {
            a(b).on("click.bs.dropdown", this.toggle)
        };
    g.VERSION = "3.3.7", g.prototype.toggle = function(d) {
        var e = a(this);
        if (!e.is(".disabled, :disabled")) {
            var f = b(e),
                g = f.hasClass("open");
            if (c(), !g) {
                "ontouchstart" in document.documentElement && !f.closest(".navbar-nav").length && a(document.createElement("div")).addClass("dropdown-backdrop").insertAfter(a(this)).on("click", c);
                var h = {
                    relatedTarget: this
                };
                if (f.trigger(d = a.Event("show.bs.dropdown", h)), d.isDefaultPrevented()) return;
                e.trigger("focus").attr("aria-expanded", "true"), f.toggleClass("open").trigger(a.Event("shown.bs.dropdown", h))
            }
            return !1
        }
    }, g.prototype.keydown = function(c) {
        if (/(38|40|27|32)/.test(c.which) && !/input|textarea/i.test(c.target.tagName)) {
            var d = a(this);
            if (c.preventDefault(), c.stopPropagation(), !d.is(".disabled, :disabled")) {
                var e = b(d),
                    g = e.hasClass("open");
                if (!g && 27 != c.which || g && 27 == c.which) return 27 == c.which && e.find(f).trigger("focus"), d.trigger("click");
                var h = " li:not(.disabled):visible a",
                    i = e.find(".dropdown-menu" + h);
                if (i.length) {
                    var j = i.index(c.target);
                    38 == c.which && j > 0 && j--, 40 == c.which && j < i.length - 1 && j++, ~j || (j = 0), i.eq(j).trigger("focus")
                }
            }
        }
    };
    var h = a.fn.dropdown;
    a.fn.dropdown = d, a.fn.dropdown.Constructor = g, a.fn.dropdown.noConflict = function() {
        return a.fn.dropdown = h, this
    }, a(document).on("click.bs.dropdown.data-api", c).on("click.bs.dropdown.data-api", ".dropdown form", function(a) {
        a.stopPropagation()
    }).on("click.bs.dropdown.data-api", f, g.prototype.toggle).on("keydown.bs.dropdown.data-api", f, g.prototype.keydown).on("keydown.bs.dropdown.data-api", ".dropdown-menu", g.prototype.keydown)
}(jQuery), + function(a) {
    "use strict";

    function b(b, d) {
        return this.each(function() {
            var e = a(this),
                f = e.data("bs.modal"),
                g = a.extend({}, c.DEFAULTS, e.data(), "object" == typeof b && b);
            f || e.data("bs.modal", f = new c(this, g)), "string" == typeof b ? f[b](d) : g.show && f.show(d)
        })
    }
    var c = function(b, c) {
        this.options = c, this.$body = a(document.body), this.$element = a(b), this.$dialog = this.$element.find(".modal-dialog"), this.$backdrop = null, this.isShown = null, this.originalBodyPad = null, this.scrollbarWidth = 0, this.ignoreBackdropClick = !1, this.options.remote && this.$element.find(".modal-content").load(this.options.remote, a.proxy(function() {
            this.$element.trigger("loaded.bs.modal")
        }, this))
    };
    c.VERSION = "3.3.7", c.TRANSITION_DURATION = 300, c.BACKDROP_TRANSITION_DURATION = 150, c.DEFAULTS = {
        backdrop: !0,
        keyboard: !0,
        show: !0
    }, c.prototype.toggle = function(a) {
        return this.isShown ? this.hide() : this.show(a)
    }, c.prototype.show = function(b) {
        var d = this,
            e = a.Event("show.bs.modal", {
                relatedTarget: b
            });
        this.$element.trigger(e), this.isShown || e.isDefaultPrevented() || (this.isShown = !0, this.checkScrollbar(), this.setScrollbar(), this.$body.addClass("modal-open"), this.escape(), this.resize(), this.$element.on("click.dismiss.bs.modal", '[data-dismiss="modal"]', a.proxy(this.hide, this)), this.$dialog.on("mousedown.dismiss.bs.modal", function() {
            d.$element.one("mouseup.dismiss.bs.modal", function(b) {
                a(b.target).is(d.$element) && (d.ignoreBackdropClick = !0)
            })
        }), this.backdrop(function() {
            var e = a.support.transition && d.$element.hasClass("fade");
            d.$element.parent().length || d.$element.appendTo(d.$body), d.$element.show().scrollTop(0), d.adjustDialog(), e && d.$element[0].offsetWidth, d.$element.addClass("in"), d.enforceFocus();
            var f = a.Event("shown.bs.modal", {
                relatedTarget: b
            });
            e ? d.$dialog.one("bsTransitionEnd", function() {
                d.$element.trigger("focus").trigger(f)
            }).emulateTransitionEnd(c.TRANSITION_DURATION) : d.$element.trigger("focus").trigger(f)
        }))
    }, c.prototype.hide = function(b) {
        b && b.preventDefault(), b = a.Event("hide.bs.modal"), this.$element.trigger(b), this.isShown && !b.isDefaultPrevented() && (this.isShown = !1, this.escape(), this.resize(), a(document).off("focusin.bs.modal"), this.$element.removeClass("in").off("click.dismiss.bs.modal").off("mouseup.dismiss.bs.modal"), this.$dialog.off("mousedown.dismiss.bs.modal"), a.support.transition && this.$element.hasClass("fade") ? this.$element.one("bsTransitionEnd", a.proxy(this.hideModal, this)).emulateTransitionEnd(c.TRANSITION_DURATION) : this.hideModal())
    }, c.prototype.enforceFocus = function() {
        a(document).off("focusin.bs.modal").on("focusin.bs.modal", a.proxy(function(a) {
            document === a.target || this.$element[0] === a.target || this.$element.has(a.target).length || this.$element.trigger("focus")
        }, this))
    }, c.prototype.escape = function() {
        this.isShown && this.options.keyboard ? this.$element.on("keydown.dismiss.bs.modal", a.proxy(function(a) {
            27 == a.which && this.hide()
        }, this)) : this.isShown || this.$element.off("keydown.dismiss.bs.modal")
    }, c.prototype.resize = function() {
        this.isShown ? a(window).on("resize.bs.modal", a.proxy(this.handleUpdate, this)) : a(window).off("resize.bs.modal")
    }, c.prototype.hideModal = function() {
        var a = this;
        this.$element.hide(), this.backdrop(function() {
            a.$body.removeClass("modal-open"), a.resetAdjustments(), a.resetScrollbar(), a.$element.trigger("hidden.bs.modal")
        })
    }, c.prototype.removeBackdrop = function() {
        this.$backdrop && this.$backdrop.remove(), this.$backdrop = null
    }, c.prototype.backdrop = function(b) {
        var d = this,
            e = this.$element.hasClass("fade") ? "fade" : "";
        if (this.isShown && this.options.backdrop) {
            var f = a.support.transition && e;
            if (this.$backdrop = a(document.createElement("div")).addClass("modal-backdrop " + e).appendTo(this.$body), this.$element.on("click.dismiss.bs.modal", a.proxy(function(a) {
                    return this.ignoreBackdropClick ? void(this.ignoreBackdropClick = !1) : void(a.target === a.currentTarget && ("static" == this.options.backdrop ? this.$element[0].focus() : this.hide()))
                }, this)), f && this.$backdrop[0].offsetWidth, this.$backdrop.addClass("in"), !b) return;
            f ? this.$backdrop.one("bsTransitionEnd", b).emulateTransitionEnd(c.BACKDROP_TRANSITION_DURATION) : b()
        } else if (!this.isShown && this.$backdrop) {
            this.$backdrop.removeClass("in");
            var g = function() {
                d.removeBackdrop(), b && b()
            };
            a.support.transition && this.$element.hasClass("fade") ? this.$backdrop.one("bsTransitionEnd", g).emulateTransitionEnd(c.BACKDROP_TRANSITION_DURATION) : g()
        } else b && b()
    }, c.prototype.handleUpdate = function() {
        this.adjustDialog()
    }, c.prototype.adjustDialog = function() {
        var a = this.$element[0].scrollHeight > document.documentElement.clientHeight;
        this.$element.css({
            paddingLeft: !this.bodyIsOverflowing && a ? this.scrollbarWidth : "",
            paddingRight: this.bodyIsOverflowing && !a ? this.scrollbarWidth : ""
        })
    }, c.prototype.resetAdjustments = function() {
        this.$element.css({
            paddingLeft: "",
            paddingRight: ""
        })
    }, c.prototype.checkScrollbar = function() {
        var a = window.innerWidth;
        if (!a) {
            var b = document.documentElement.getBoundingClientRect();
            a = b.right - Math.abs(b.left)
        }
        this.bodyIsOverflowing = document.body.clientWidth < a, this.scrollbarWidth = this.measureScrollbar()
    }, c.prototype.setScrollbar = function() {
        var a = parseInt(this.$body.css("padding-right") || 0, 10);
        this.originalBodyPad = document.body.style.paddingRight || "", this.bodyIsOverflowing && this.$body.css("padding-right", a + this.scrollbarWidth)
    }, c.prototype.resetScrollbar = function() {
        this.$body.css("padding-right", this.originalBodyPad)
    }, c.prototype.measureScrollbar = function() {
        var a = document.createElement("div");
        a.className = "modal-scrollbar-measure", this.$body.append(a);
        var b = a.offsetWidth - a.clientWidth;
        return this.$body[0].removeChild(a), b
    };
    var d = a.fn.modal;
    a.fn.modal = b, a.fn.modal.Constructor = c, a.fn.modal.noConflict = function() {
        return a.fn.modal = d, this
    }, a(document).on("click.bs.modal.data-api", '[data-toggle="modal"]', function(c) {
        var d = a(this),
            e = d.attr("href"),
            f = a(d.attr("data-target") || e && e.replace(/.*(?=#[^\s]+$)/, "")),
            g = f.data("bs.modal") ? "toggle" : a.extend({
                remote: !/#/.test(e) && e
            }, f.data(), d.data());
        d.is("a") && c.preventDefault(), f.one("show.bs.modal", function(a) {
            a.isDefaultPrevented() || f.one("hidden.bs.modal", function() {
                d.is(":visible") && d.trigger("focus")
            })
        }), b.call(f, g, this)
    })
}(jQuery), + function(a) {
    "use strict";

    function b(b) {
        return this.each(function() {
            var d = a(this),
                e = d.data("bs.tooltip"),
                f = "object" == typeof b && b;
            !e && /destroy|hide/.test(b) || (e || d.data("bs.tooltip", e = new c(this, f)), "string" == typeof b && e[b]())
        })
    }
    var c = function(a, b) {
        this.type = null, this.options = null, this.enabled = null, this.timeout = null, this.hoverState = null, this.$element = null, this.inState = null, this.init("tooltip", a, b)
    };
    c.VERSION = "3.3.7", c.TRANSITION_DURATION = 150, c.DEFAULTS = {
        animation: !0,
        placement: "top",
        selector: !1,
        template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
        trigger: "hover focus",
        title: "",
        delay: 0,
        html: !1,
        container: !1,
        viewport: {
            selector: "body",
            padding: 0
        }
    }, c.prototype.init = function(b, c, d) {
        if (this.enabled = !0, this.type = b, this.$element = a(c), this.options = this.getOptions(d), this.$viewport = this.options.viewport && a(a.isFunction(this.options.viewport) ? this.options.viewport.call(this, this.$element) : this.options.viewport.selector || this.options.viewport), this.inState = {
                click: !1,
                hover: !1,
                focus: !1
            }, this.$element[0] instanceof document.constructor && !this.options.selector) throw new Error("`selector` option must be specified when initializing " + this.type + " on the window.document object!");
        for (var e = this.options.trigger.split(" "), f = e.length; f--;) {
            var g = e[f];
            if ("click" == g) this.$element.on("click." + this.type, this.options.selector, a.proxy(this.toggle, this));
            else if ("manual" != g) {
                var h = "hover" == g ? "mouseenter" : "focusin",
                    i = "hover" == g ? "mouseleave" : "focusout";
                this.$element.on(h + "." + this.type, this.options.selector, a.proxy(this.enter, this)), this.$element.on(i + "." + this.type, this.options.selector, a.proxy(this.leave, this))
            }
        }
        this.options.selector ? this._options = a.extend({}, this.options, {
            trigger: "manual",
            selector: ""
        }) : this.fixTitle()
    }, c.prototype.getDefaults = function() {
        return c.DEFAULTS
    }, c.prototype.getOptions = function(b) {
        return b = a.extend({}, this.getDefaults(), this.$element.data(), b), b.delay && "number" == typeof b.delay && (b.delay = {
            show: b.delay,
            hide: b.delay
        }), b
    }, c.prototype.getDelegateOptions = function() {
        var b = {},
            c = this.getDefaults();
        return this._options && a.each(this._options, function(a, d) {
            c[a] != d && (b[a] = d)
        }), b
    }, c.prototype.enter = function(b) {
        var c = b instanceof this.constructor ? b : a(b.currentTarget).data("bs." + this.type);
        return c || (c = new this.constructor(b.currentTarget, this.getDelegateOptions()), a(b.currentTarget).data("bs." + this.type, c)), b instanceof a.Event && (c.inState["focusin" == b.type ? "focus" : "hover"] = !0), c.tip().hasClass("in") || "in" == c.hoverState ? void(c.hoverState = "in") : (clearTimeout(c.timeout), c.hoverState = "in", c.options.delay && c.options.delay.show ? void(c.timeout = setTimeout(function() {
            "in" == c.hoverState && c.show()
        }, c.options.delay.show)) : c.show())
    }, c.prototype.isInStateTrue = function() {
        for (var a in this.inState)
            if (this.inState[a]) return !0;
        return !1
    }, c.prototype.leave = function(b) {
        var c = b instanceof this.constructor ? b : a(b.currentTarget).data("bs." + this.type);
        if (c || (c = new this.constructor(b.currentTarget, this.getDelegateOptions()), a(b.currentTarget).data("bs." + this.type, c)), b instanceof a.Event && (c.inState["focusout" == b.type ? "focus" : "hover"] = !1), !c.isInStateTrue()) return clearTimeout(c.timeout), c.hoverState = "out", c.options.delay && c.options.delay.hide ? void(c.timeout = setTimeout(function() {
            "out" == c.hoverState && c.hide()
        }, c.options.delay.hide)) : c.hide()
    }, c.prototype.show = function() {
        var b = a.Event("show.bs." + this.type);
        if (this.hasContent() && this.enabled) {
            this.$element.trigger(b);
            var d = a.contains(this.$element[0].ownerDocument.documentElement, this.$element[0]);
            if (b.isDefaultPrevented() || !d) return;
            var e = this,
                f = this.tip(),
                g = this.getUID(this.type);
            this.setContent(), f.attr("id", g), this.$element.attr("aria-describedby", g), this.options.animation && f.addClass("fade");
            var h = "function" == typeof this.options.placement ? this.options.placement.call(this, f[0], this.$element[0]) : this.options.placement,
                i = /\s?auto?\s?/i,
                j = i.test(h);
            j && (h = h.replace(i, "") || "top"), f.detach().css({
                top: 0,
                left: 0,
                display: "block"
            }).addClass(h).data("bs." + this.type, this), this.options.container ? f.appendTo(this.options.container) : f.insertAfter(this.$element), this.$element.trigger("inserted.bs." + this.type);
            var k = this.getPosition(),
                l = f[0].offsetWidth,
                m = f[0].offsetHeight;
            if (j) {
                var n = h,
                    o = this.getPosition(this.$viewport);
                h = "bottom" == h && k.bottom + m > o.bottom ? "top" : "top" == h && k.top - m < o.top ? "bottom" : "right" == h && k.right + l > o.width ? "left" : "left" == h && k.left - l < o.left ? "right" : h, f.removeClass(n).addClass(h)
            }
            var p = this.getCalculatedOffset(h, k, l, m);
            this.applyPlacement(p, h);
            var q = function() {
                var a = e.hoverState;
                e.$element.trigger("shown.bs." + e.type), e.hoverState = null, "out" == a && e.leave(e)
            };
            a.support.transition && this.$tip.hasClass("fade") ? f.one("bsTransitionEnd", q).emulateTransitionEnd(c.TRANSITION_DURATION) : q()
        }
    }, c.prototype.applyPlacement = function(b, c) {
        var d = this.tip(),
            e = d[0].offsetWidth,
            f = d[0].offsetHeight,
            g = parseInt(d.css("margin-top"), 10),
            h = parseInt(d.css("margin-left"), 10);
        isNaN(g) && (g = 0), isNaN(h) && (h = 0), b.top += g, b.left += h, a.offset.setOffset(d[0], a.extend({
            using: function(a) {
                d.css({
                    top: Math.round(a.top),
                    left: Math.round(a.left)
                })
            }
        }, b), 0), d.addClass("in");
        var i = d[0].offsetWidth,
            j = d[0].offsetHeight;
        "top" == c && j != f && (b.top = b.top + f - j);
        var k = this.getViewportAdjustedDelta(c, b, i, j);
        k.left ? b.left += k.left : b.top += k.top;
        var l = /top|bottom/.test(c),
            m = l ? 2 * k.left - e + i : 2 * k.top - f + j,
            n = l ? "offsetWidth" : "offsetHeight";
        d.offset(b), this.replaceArrow(m, d[0][n], l)
    }, c.prototype.replaceArrow = function(a, b, c) {
        this.arrow().css(c ? "left" : "top", 50 * (1 - a / b) + "%").css(c ? "top" : "left", "")
    }, c.prototype.setContent = function() {
        var a = this.tip(),
            b = this.getTitle();
        a.find(".tooltip-inner")[this.options.html ? "html" : "text"](b), a.removeClass("fade in top bottom left right")
    }, c.prototype.hide = function(b) {
        function d() {
            "in" != e.hoverState && f.detach(), e.$element && e.$element.removeAttr("aria-describedby").trigger("hidden.bs." + e.type), b && b()
        }
        var e = this,
            f = a(this.$tip),
            g = a.Event("hide.bs." + this.type);
        if (this.$element.trigger(g), !g.isDefaultPrevented()) return f.removeClass("in"), a.support.transition && f.hasClass("fade") ? f.one("bsTransitionEnd", d).emulateTransitionEnd(c.TRANSITION_DURATION) : d(), this.hoverState = null, this
    }, c.prototype.fixTitle = function() {
        var a = this.$element;
        (a.attr("title") || "string" != typeof a.attr("data-original-title")) && a.attr("data-original-title", a.attr("title") || "").attr("title", "")
    }, c.prototype.hasContent = function() {
        return this.getTitle()
    }, c.prototype.getPosition = function(b) {
        b = b || this.$element;
        var c = b[0],
            d = "BODY" == c.tagName,
            e = c.getBoundingClientRect();
        null == e.width && (e = a.extend({}, e, {
            width: e.right - e.left,
            height: e.bottom - e.top
        }));
        var f = window.SVGElement && c instanceof window.SVGElement,
            g = d ? {
                top: 0,
                left: 0
            } : f ? null : b.offset(),
            h = {
                scroll: d ? document.documentElement.scrollTop || document.body.scrollTop : b.scrollTop()
            },
            i = d ? {
                width: a(window).width(),
                height: a(window).height()
            } : null;
        return a.extend({}, e, h, i, g)
    }, c.prototype.getCalculatedOffset = function(a, b, c, d) {
        return "bottom" == a ? {
            top: b.top + b.height,
            left: b.left + b.width / 2 - c / 2
        } : "top" == a ? {
            top: b.top - d,
            left: b.left + b.width / 2 - c / 2
        } : "left" == a ? {
            top: b.top + b.height / 2 - d / 2,
            left: b.left - c
        } : {
            top: b.top + b.height / 2 - d / 2,
            left: b.left + b.width
        }
    }, c.prototype.getViewportAdjustedDelta = function(a, b, c, d) {
        var e = {
            top: 0,
            left: 0
        };
        if (!this.$viewport) return e;
        var f = this.options.viewport && this.options.viewport.padding || 0,
            g = this.getPosition(this.$viewport);
        if (/right|left/.test(a)) {
            var h = b.top - f - g.scroll,
                i = b.top + f - g.scroll + d;
            h < g.top ? e.top = g.top - h : i > g.top + g.height && (e.top = g.top + g.height - i)
        } else {
            var j = b.left - f,
                k = b.left + f + c;
            j < g.left ? e.left = g.left - j : k > g.right && (e.left = g.left + g.width - k)
        }
        return e
    }, c.prototype.getTitle = function() {
        var a, b = this.$element,
            c = this.options;
        return a = b.attr("data-original-title") || ("function" == typeof c.title ? c.title.call(b[0]) : c.title)
    }, c.prototype.getUID = function(a) {
        do a += ~~(1e6 * Math.random()); while (document.getElementById(a));
        return a
    }, c.prototype.tip = function() {
        if (!this.$tip && (this.$tip = a(this.options.template), 1 != this.$tip.length)) throw new Error(this.type + " `template` option must consist of exactly 1 top-level element!");
        return this.$tip
    }, c.prototype.arrow = function() {
        return this.$arrow = this.$arrow || this.tip().find(".tooltip-arrow")
    }, c.prototype.enable = function() {
        this.enabled = !0
    }, c.prototype.disable = function() {
        this.enabled = !1
    }, c.prototype.toggleEnabled = function() {
        this.enabled = !this.enabled
    }, c.prototype.toggle = function(b) {
        var c = this;
        b && (c = a(b.currentTarget).data("bs." + this.type), c || (c = new this.constructor(b.currentTarget, this.getDelegateOptions()), a(b.currentTarget).data("bs." + this.type, c))),
            b ? (c.inState.click = !c.inState.click, c.isInStateTrue() ? c.enter(c) : c.leave(c)) : c.tip().hasClass("in") ? c.leave(c) : c.enter(c)
    }, c.prototype.destroy = function() {
        var a = this;
        clearTimeout(this.timeout), this.hide(function() {
            a.$element.off("." + a.type).removeData("bs." + a.type), a.$tip && a.$tip.detach(), a.$tip = null, a.$arrow = null, a.$viewport = null, a.$element = null
        })
    };
    var d = a.fn.tooltip;
    a.fn.tooltip = b, a.fn.tooltip.Constructor = c, a.fn.tooltip.noConflict = function() {
        return a.fn.tooltip = d, this
    }
}(jQuery), + function(a) {
    "use strict";

    function b(b) {
        return this.each(function() {
            var d = a(this),
                e = d.data("bs.popover"),
                f = "object" == typeof b && b;
            !e && /destroy|hide/.test(b) || (e || d.data("bs.popover", e = new c(this, f)), "string" == typeof b && e[b]())
        })
    }
    var c = function(a, b) {
        this.init("popover", a, b)
    };
    if (!a.fn.tooltip) throw new Error("Popover requires tooltip.js");
    c.VERSION = "3.3.7", c.DEFAULTS = a.extend({}, a.fn.tooltip.Constructor.DEFAULTS, {
        placement: "right",
        trigger: "click",
        content: "",
        template: '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
    }), c.prototype = a.extend({}, a.fn.tooltip.Constructor.prototype), c.prototype.constructor = c, c.prototype.getDefaults = function() {
        return c.DEFAULTS
    }, c.prototype.setContent = function() {
        var a = this.tip(),
            b = this.getTitle(),
            c = this.getContent();
        a.find(".popover-title")[this.options.html ? "html" : "text"](b), a.find(".popover-content").children().detach().end()[this.options.html ? "string" == typeof c ? "html" : "append" : "text"](c), a.removeClass("fade top bottom left right in"), a.find(".popover-title").html() || a.find(".popover-title").hide()
    }, c.prototype.hasContent = function() {
        return this.getTitle() || this.getContent()
    }, c.prototype.getContent = function() {
        var a = this.$element,
            b = this.options;
        return a.attr("data-content") || ("function" == typeof b.content ? b.content.call(a[0]) : b.content)
    }, c.prototype.arrow = function() {
        return this.$arrow = this.$arrow || this.tip().find(".arrow")
    };
    var d = a.fn.popover;
    a.fn.popover = b, a.fn.popover.Constructor = c, a.fn.popover.noConflict = function() {
        return a.fn.popover = d, this
    }
}(jQuery), + function(a) {
    "use strict";

    function b(c, d) {
        this.$body = a(document.body), this.$scrollElement = a(a(c).is(document.body) ? window : c), this.options = a.extend({}, b.DEFAULTS, d), this.selector = (this.options.target || "") + " .nav-link.dropdown-item", this.offsets = [], this.targets = [], this.activeTarget = null, this.scrollHeight = 0, this.$scrollElement.on("scroll.bs.scrollspy", a.proxy(this.process, this)), this.refresh(), this.process()
    }

    function c(c) {
        return this.each(function() {
            var d = a(this),
                e = d.data("bs.scrollspy"),
                f = "object" == typeof c && c;
            e || d.data("bs.scrollspy", e = new b(this, f)), "string" == typeof c && e[c]()
        })
    }
    b.VERSION = "3.3.7", b.DEFAULTS = {
        offset: 10
    }, b.prototype.getScrollHeight = function() {
        return this.$scrollElement[0].scrollHeight || Math.max(this.$body[0].scrollHeight, document.documentElement.scrollHeight)
    }, b.prototype.refresh = function() {
        var b = this,
            c = "offset",
            d = 0;
        this.offsets = [], this.targets = [], this.scrollHeight = this.getScrollHeight(), a.isWindow(this.$scrollElement[0]) || (c = "position", d = this.$scrollElement.scrollTop()), this.$body.find(this.selector).map(function() {
            var b = a(this),
                e = b.data("target") || b.attr("href"),
                f = /^#./.test(e) && a(e);
            return f && f.length && f.is(":visible") && [
                [f[c]().top + d, e]
            ] || null
        }).sort(function(a, b) {
            return a[0] - b[0]
        }).each(function() {
            b.offsets.push(this[0]), b.targets.push(this[1])
        })
    }, b.prototype.process = function() {
        var a, b = this.$scrollElement.scrollTop() + this.options.offset,
            c = this.getScrollHeight(),
            d = this.options.offset + c - this.$scrollElement.height(),
            e = this.offsets,
            f = this.targets,
            g = this.activeTarget;
        if (this.scrollHeight != c && this.refresh(), b >= d) return g != (a = f[f.length - 1]) && this.activate(a);
        if (g && b < e[0]) return this.activeTarget = null, this.clear();
        for (a = e.length; a--;) g != f[a] && b >= e[a] && (void 0 === e[a + 1] || b < e[a + 1]) && this.activate(f[a])
    }, b.prototype.activate = function(b) {
        this.activeTarget = b, this.clear();
        var c = this.selector + '[data-target="' + b + '"],' + this.selector + '[href="' + b + '"]',
            d = a(c).addClass("active");
        d.parent(".dropdown-menu").length && (d = d.closest("li.dropdown").addClass("active")), d.trigger("activate.bs.scrollspy")
    }, b.prototype.clear = function() {
        a(this.selector).removeClass("active")
    };
    var d = a.fn.scrollspy;
    a.fn.scrollspy = c, a.fn.scrollspy.Constructor = b, a.fn.scrollspy.noConflict = function() {
        return a.fn.scrollspy = d, this
    }, a(window).on("load.bs.scrollspy.data-api", function() {
        a('[data-spy="scroll"]').each(function() {
            var b = a(this);
            c.call(b, b.data())
        })
    })
}(jQuery), + function(a) {
    "use strict";

    function b(b) {
        return this.each(function() {
            var d = a(this),
                e = d.data("bs.tab");
            e || d.data("bs.tab", e = new c(this)), "string" == typeof b && e[b]()
        })
    }
    var c = function(b) {
        this.element = a(b)
    };
    c.VERSION = "3.3.7", c.TRANSITION_DURATION = 150, c.prototype.show = function() {
        var b = this.element,
            c = b.closest("ul:not(.dropdown-menu)"),
            d = b.data("target");
        if (d || (d = b.attr("href"), d = d && d.replace(/.*(?=#[^\s]*$)/, "")), !b.parent("li").hasClass("active")) {
            var e = c.find(".active:last a"),
                f = a.Event("hide.bs.tab", {
                    relatedTarget: b[0]
                }),
                g = a.Event("show.bs.tab", {
                    relatedTarget: e[0]
                });
            if (e.trigger(f), b.trigger(g), !g.isDefaultPrevented() && !f.isDefaultPrevented()) {
                var h = a(d);
                this.activate(b.closest("li"), c), this.activate(h, h.parent(), function() {
                    e.trigger({
                        type: "hidden.bs.tab",
                        relatedTarget: b[0]
                    }), b.trigger({
                        type: "shown.bs.tab",
                        relatedTarget: e[0]
                    })
                })
            }
        }
    }, c.prototype.activate = function(b, d, e) {
        function f() {
            g.removeClass("active").find("> .dropdown-menu > .active").removeClass("active").end().find('[data-toggle="tab"]').attr("aria-expanded", !1), b.addClass("active").find('[data-toggle="tab"]').attr("aria-expanded", !0), h ? (b[0].offsetWidth, b.addClass("in")) : b.removeClass("fade"), b.parent(".dropdown-menu").length && b.closest("li.dropdown").addClass("active").end().find('[data-toggle="tab"]').attr("aria-expanded", !0), e && e()
        }
        var g = d.find("> .active"),
            h = e && a.support.transition && (g.length && g.hasClass("fade") || !!d.find("> .fade").length);
        g.length && h ? g.one("bsTransitionEnd", f).emulateTransitionEnd(c.TRANSITION_DURATION) : f(), g.removeClass("in")
    };
    var d = a.fn.tab;
    a.fn.tab = b, a.fn.tab.Constructor = c, a.fn.tab.noConflict = function() {
        return a.fn.tab = d, this
    };
    var e = function(c) {
        c.preventDefault(), b.call(a(this), "show")
    };
    a(document).on("click.bs.tab.data-api", '[data-toggle="tab"]', e).on("click.bs.tab.data-api", '[data-toggle="pill"]', e)
}(jQuery), + function(a) {
    "use strict";

    function b(b) {
        return this.each(function() {
            var d = a(this),
                e = d.data("bs.affix"),
                f = "object" == typeof b && b;
            e || d.data("bs.affix", e = new c(this, f)), "string" == typeof b && e[b]()
        })
    }
    var c = function(b, d) {
        this.options = a.extend({}, c.DEFAULTS, d), this.$target = a(this.options.target).on("scroll.bs.affix.data-api", a.proxy(this.checkPosition, this)).on("click.bs.affix.data-api", a.proxy(this.checkPositionWithEventLoop, this)), this.$element = a(b), this.affixed = null, this.unpin = null, this.pinnedOffset = null, this.checkPosition()
    };
    c.VERSION = "3.3.7", c.RESET = "affix affix-top affix-bottom", c.DEFAULTS = {
        offset: 0,
        target: window
    }, c.prototype.getState = function(a, b, c, d) {
        var e = this.$target.scrollTop(),
            f = this.$element.offset(),
            g = this.$target.height();
        if (null != c && "top" == this.affixed) return e < c && "top";
        if ("bottom" == this.affixed) return null != c ? !(e + this.unpin <= f.top) && "bottom" : !(e + g <= a - d) && "bottom";
        var h = null == this.affixed,
            i = h ? e : f.top,
            j = h ? g : b;
        return null != c && e <= c ? "top" : null != d && i + j >= a - d && "bottom"
    }, c.prototype.getPinnedOffset = function() {
        if (this.pinnedOffset) return this.pinnedOffset;
        this.$element.removeClass(c.RESET).addClass("affix");
        var a = this.$target.scrollTop(),
            b = this.$element.offset();
        return this.pinnedOffset = b.top - a
    }, c.prototype.checkPositionWithEventLoop = function() {
        setTimeout(a.proxy(this.checkPosition, this), 1)
    }, c.prototype.checkPosition = function() {
        if (this.$element.is(":visible")) {
            var b = this.$element.height(),
                d = this.options.offset,
                e = d.top,
                f = d.bottom,
                g = Math.max(a(document).height(), a(document.body).height());
            "object" != typeof d && (f = e = d), "function" == typeof e && (e = d.top(this.$element)), "function" == typeof f && (f = d.bottom(this.$element));
            var h = this.getState(g, b, e, f);
            if (this.affixed != h) {
                null != this.unpin && this.$element.css("top", "");
                var i = "affix" + (h ? "-" + h : ""),
                    j = a.Event(i + ".bs.affix");
                if (this.$element.trigger(j), j.isDefaultPrevented()) return;
                this.affixed = h, this.unpin = "bottom" == h ? this.getPinnedOffset() : null, this.$element.removeClass(c.RESET).addClass(i).trigger(i.replace("affix", "affixed") + ".bs.affix")
            }
            "bottom" == h && this.$element.offset({
                top: g - b - f
            })
        }
    };
    var d = a.fn.affix;
    a.fn.affix = b, a.fn.affix.Constructor = c, a.fn.affix.noConflict = function() {
        return a.fn.affix = d, this
    }, a(window).on("load", function() {
        a('[data-spy="affix"]').each(function() {
            var c = a(this),
                d = c.data();
            d.offset = d.offset || {}, null != d.offsetBottom && (d.offset.bottom = d.offsetBottom), null != d.offsetTop && (d.offset.top = d.offsetTop), b.call(c, d)
        })
    })
}(jQuery), ! function(a, b) {
    var c = {
        msgs: [],
        pmNotificationClosed: void 0,
        wrapperDom: '<div class="pm-persistent-notification-container"></div><div class="pm-global-notification-container"></div>',
        messageDom: function(a, b, c) {
            return ['<div id="', a, '"><div class="pm-global-notification ', b, '">', c, '<div class="pm-global-notification-close">×</div></div></div>'].join("")
        },
        messageTypes: {
            success: "pm-global-success",
            warning: "pm-global-warning",
            error: "pm-global-error",
            notify: "pm-global-notify",
            "default": "pm-global-error"
        },
        show: function(a, b) {
            var d, e, f = document.getElementsByClassName("pm-global-notification-container")[0],
                g = document.getElementsByClassName("pm-persistent-notification-container")[0];
            a.body && (d = c.extractClass(a), e = ["mid_", (new Date).getTime()].join(""), a.persist ? (d += " pm-message-persistent", g.insertAdjacentHTML("beforeend", c.messageDom(e, d, a.body))) : (f.insertAdjacentHTML("beforeend", c.messageDom(e, d, a.body)), c.assignTimeout(e)))
        },
        showAll: function() {
            c.msgs.forEach(c.show), c.msgs.splice(0)
        },
        queue: function(a) {
            c.msgs.push(a)
        },
        extractClass: function(a) {
            return c.messageTypes[a.type] || c.messageTypes["default"]
        },
        assignTimeout: function(a) {
            setTimeout(function() {
                var b = document.getElementById(a);
                b && b.parentElement.removeChild(b)
            }, 5e3)
        },
        attachEventHandler: function(a, b, c) {
            return a && a.addEventListener(b, c)
        },
        createCustomEvent: function(a, b, c) {
            var d = document.createEvent("Event");
            return d.initEvent(a, b, c), d
        },
        closeMessageHandler: function(a) {
            var b;
            a.target.className.indexOf("pm-global-notification-close") > -1 && (b = a.target.parentElement.parentElement, b.parentElement.removeChild(b), document.dispatchEvent(c.pmNotificationClosed))
        },
        bootstrap: function(a) {
            document.body.insertAdjacentHTML("beforeend", c.wrapperDom), c.attachEventHandler(document.body, "click", c.closeMessageHandler), c.pmNotificationClosed = c.createCustomEvent("pm-notification-closed", !0, !0), "function" == typeof a && a()
        }
    };
}(window, "messenger"), ! function() {
    function a() {
        var a = Array.prototype.slice.apply(document.querySelectorAll(".custom-color"));
        a.forEach(function(a) {
            var b = m[$(a).data("target")],
                c = $(a).data("value"),
                d = c ? "#" + c : b;
            m[$(a).data("target")] = d, $(a).val(c || b.substr(1)), $(a).siblings(".color-preview").css("background-color", d)
        }), n = m
    }

    function b() {
        $(".custom-color").on("keyup change", function(a) {
            var b = a.target.value,
                c = /^([A-Fa-f0-9]{6})$/;
            c.test(b) && ($(this).siblings(".color-preview").css("background-color", "#" + b), n[$(this).data("target")] = "#" + b, e(n))
        }), $("#customization-toggle").on("click", function() {
            $(".customization").toggle(), $(l).toggle();
            var b = $(this),
                c = $(".customization").is(":visible"),
                d = b.children(".customization-status");
            $(".custom-color"), $(".color-preview");
            d.text(c ? "Hide" : "Show"), a(), e(m)
        }), $(".theme").on("mousedown", function(a) {
            $(".custom-color").val(a.target.dataset.color.substr(1)), $(".custom-color").trigger("change")
        })
    }

    function c(a) {
        return parseInt(a.substr(1), 16) > 8388607.5 ? "light" : "dark"
    }

    function d(a, b) {
        b = b || n, topbarVariant = c(b["top-bar"]), rightSidebarVariant = c(b["right-sidebar"]);
        var d = Snap(a),
            e = ("dark" === rightSidebarVariant ? g : h, "dark" === rightSidebarVariant ? "0.1" : "0.3", $(".team-logo").data("identity-href"));
        if (d) {
            d.clear();
            var i = d.rect(0, 0, "100%", 170),
                j = d.rect(0, 40, "100%", 130),
                k = d.rect(0, 40, "20%", 130),
                l = d.rect(10, 60, "15%", 10, 3),
                m = d.rect(10, 80, "10%", 10, 3),
                o = d.rect(10, 110, "15%", 10, 3),
                p = d.rect(10, 130, "10%", 10, 3),
                q = d.rect("25%", 60, "30%", 10, 3),
                r = d.rect("25%", 80, "15%", 10, 3);
            mainAreaContent3 = d.rect("25%", 110, "15%", 10, 3), rightSidebar = d.rect("60%", 40, "40%", 130), rightSidebarContent1 = d.rect("60%", 60, "40%", 50), rightSidebarContent2 = d.rect("60%", 120, "40%", 50), header = d.rect(0, 0, "100%", 40), logo = d.image(e || "/docs-assets/images/logo-glyph.png", 10, 5, 85, 30), headerOptions = d.rect("85%", 12, 40, 15, 3), i.attr({
                stroke: "#D8D8D8",
                strokeWidth: 1
            }), j.attr({
                fill: g
            }), k.attr({
                fill: f,
                opacity: "0.05"
            }), l.attr({
                fill: h,
                opacity: "0.2"
            }), m.attr({
                fill: h,
                opacity: "0.2"
            }), o.attr({
                fill: h,
                opacity: "0.2"
            }), p.attr({
                fill: h,
                opacity: "0.2"
            }), q.attr({
                fill: h,
                opacity: "0.2"
            }), r.attr({
                fill: h,
                opacity: "0.2"
            }), mainAreaContent3.attr({
                fill: b.highlight
            }), rightSidebar.attr({
                fill: b["right-sidebar"]
            }), rightSidebarContent1.attr({
                fill: "dark" === rightSidebarVariant ? g : h,
                opacity: "dark" === rightSidebarVariant ? "0.1" : "0.3"
            }), rightSidebarContent2.attr({
                fill: "dark" === rightSidebarVariant ? g : h,
                opacity: "dark" === rightSidebarVariant ? "0.1" : "0.3"
            }), header.attr({
                fill: b["top-bar"],
                stroke: "dark" === topbarVariant ? g : h,
                strokeWidth: 1,
                strokeOpacity: "dark" === topbarVariant ? "0.1" : "0.3"
            }), logo.attr({
                preserveAspectRatio: "xMinYMin"
            }), headerOptions.attr({
                fill: "dark" === topbarVariant ? g : h,
                opacity: "dark" === topbarVariant ? "0.1" : "0.3"
            })
        }
    }

    function e(a) {
        d(j, a), d(k, a)
    }
    var f = "#303030",
        g = "#FFFFFF",
        h = "#000000",
        i = "#EF5B25",
        j = "#documenter-preview",
        k = "#documenter-preview-mobile",
        l = ".documenter-preview",
        m = {
            "top-bar": g,
            "right-sidebar": f,
            highlight: i
        },
        n = {};
    $(l).length && (a(), b(), d(j), d(k))
}();
var initialJson, collectionJson, environmentMapping = {},
    envLabel, scope = {},
    toc = {},
    privateDocUrl, activeFolder, collectionVariantsExist = !1,
    templatePattern = /\{?\{\{\s*(.*?)\s*\}\}\}?/g;
$(document).ready(bootstrapView);