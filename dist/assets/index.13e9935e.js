import {
    d as f,
    o as c,
    c as d,
    a as t,
    t as p,
    w as k,
    b as L,
    n as j,
    e as W,
    f as G,
    g as K,
    i as N,
    r as D,
    F as R,
    h as v,
    j as T,
    k as y,
    l as g,
    u as X,
    m as b,
    v as $,
    p as I,
    q as C,
    s as J,
    x as Q,
    y as Z,
    z as tt,
    A as et,
    B as st,
    C as A,
    D as V,
    E,
    G as ot,
    H as nt,
} from "./vendor.62e4ae61.js"
const at = function () {
    const a = document.createElement("link").relList
    if (a && a.supports && a.supports("modulepreload")) return
    for (const s of document.querySelectorAll('link[rel="modulepreload"]')) n(s)
    new MutationObserver((s) => {
        for (const i of s)
            if (i.type === "childList")
                for (const r of i.addedNodes) r.tagName === "LINK" && r.rel === "modulepreload" && n(r)
    }).observe(document, { childList: !0, subtree: !0 })
    function e(s) {
        const i = {}
        return (
            s.integrity && (i.integrity = s.integrity),
            s.referrerpolicy && (i.referrerPolicy = s.referrerpolicy),
            s.crossorigin === "use-credentials"
                ? (i.credentials = "include")
                : s.crossorigin === "anonymous"
                ? (i.credentials = "omit")
                : (i.credentials = "same-origin"),
            i
        )
    }
    function n(s) {
        if (s.ep) return
        s.ep = !0
        const i = e(s)
        fetch(s.href, i)
    }
}
at()
const lt = t("div", { class: "modal-background" }, null, -1),
    it = { class: "modal-card" },
    rt = { key: 0, class: "modal-card-head" },
    ct = { class: "modal-card-title" },
    ut = { key: 1, class: "modal-card-body" },
    dt = { key: 2, class: "modal-card-foot" },
    _t = f({
        props: { showModal: Boolean, modalTitle: String, modalContent: String, modalFooter: String },
        emits: ["toggleModal"],
        setup(l) {
            return (a, e) => (
                c(),
                d(
                    "div",
                    { class: j(["modal", { "is-active": l.showModal }]) },
                    [
                        lt,
                        t("div", it, [
                            l.modalTitle
                                ? (c(),
                                  d("div", rt, [
                                      t("p", ct, p(l.modalTitle), 1),
                                      t("button", {
                                          class: "delete",
                                          onClick: e[0] || (e[0] = k((n) => a.$emit("toggleModal"), ["prevent"])),
                                      }),
                                  ]))
                                : L("", !0),
                            l.modalContent ? (c(), d("div", ut, [t("p", null, p(l.modalContent), 1)])) : L("", !0),
                            l.modalFooter ? (c(), d("div", dt, [t("p", null, p(l.modalFooter), 1)])) : L("", !0),
                        ]),
                    ],
                    2
                )
            )
        },
    })
var F = (l, a) => {
    const e = l.__vccOpts || l
    for (const [n, s] of a) e[n] = s
    return e
}
const mt = {},
    pt = { class: "box content" },
    vt = W(
        '<h2>Popular Topics</h2><ul class="mx-4"><li class="my-1">TypeScript</li><li class="my-1">Vue</li><li class="my-1">C#</li><li class="my-1">Python</li><li class="my-1">Unity</li></ul><h2>Places</h2><ul class="mx-4"><li class="my-1">Profile</li><li class="my-1">Hot</li><li class="my-1">Local</li><li class="my-1">Top Ever</li></ul><h2>Rules</h2><ol class="mx-4"><li class="my-1">Upvote things that are high quailty, topical, well formed, helpful, and provide solid discussion upon a certain topic. We do not disencentivize discussion.</li><li class="my-1">Mark things as misleading when this are not inherently wrong, but might guide someone in the wrong direction, or stray away from the initial topics of the original discussion.</li><li class="my-1">Downvote only if something blatantly off topic or contains hateful or discriminatory language or rhetoric. Downvotes are not for disagreements. </li></ol>',
        6
    ),
    ht = [vt]
function gt(l, a) {
    return c(), d("div", pt, ht)
}
var ft = F(mt, [["render", gt]])
const bt = {
        state: { session: { user: null, authenticated: !1 } },
        plugins: [G({ storage: sessionStorage })],
        getters: {
            getSession(l) {
                return l.session
            },
            getCurrentUser(l) {
                return l.session.user
            },
            getCurrentUserId(l) {
                return l.session.user ? l.session.user.user_id : -1
            },
        },
        mutations: {
            login(l, a) {
                l.session = a
            },
            logout(l) {
                l.session.authenticated = !1
            },
        },
    },
    h = K(bt)
const $t = { class: "media-left mr-0 mb-auto" },
    yt = { class: "container p-2" },
    wt = ["onClick"],
    xt = ["onClick"],
    kt = ["onClick"],
    Ct = ["onClick"],
    Pt = { class: "card-header has-background-light" },
    St = { class: "card-header-title is-size-4 p-1 px-4" },
    Ut = { class: "tags py-2" },
    Mt = { class: "tag is-medium is-primary is-light" },
    Vt = { class: "tag is-medium is-info is-light" },
    Lt = f({
        props: { posts: null },
        setup(l) {
            const a = N("toggleModal")
            function e(o) {
                return o > 999 ? (o / 1e3).toFixed(0) + "k" : o
            }
            function n(o) {
                if (!h.getters.getSession.authenticated) return a("You must be logged in to vote."), !1
                const _ = h.getters.getCurrentUserId
                return o.votes.users.includes(_) ? (a("You may only vote on a post once."), !1) : !0
            }
            function s(o) {
                !n(o) ||
                    (console.log("Upvoted post!"), (o.votes.upvotes += 1), o.votes.users.push(h.getters.getCurrentUserId))
            }
            function i(o) {
                !n(o) ||
                    (console.log("Post marked misleading..."),
                    (o.votes.misleading += 1),
                    o.votes.users.push(h.getters.getCurrentUserId))
            }
            function r(o) {
                !n(o) ||
                    (console.log("Downvoted post!"),
                    (o.votes.downvotes += 1),
                    o.votes.users.push(h.getters.getCurrentUserId))
            }
            function u(o) {
                M.push(`/posts/${o.post_id}`)
            }
            return (o, _) => (
                c(!0),
                d(
                    R,
                    null,
                    D(l.posts, (m) => {
                        var w, P, S, U
                        return (
                            c(),
                            d("div", { class: "media box p-0 my-4", key: m.post_id }, [
                                t("div", $t, [
                                    t("div", yt, [
                                        t(
                                            "p",
                                            {
                                                onClick: (x) => s(m),
                                                class: "vote is-size-6 has-text-centered has-text-weight-bold has-text-primary",
                                            },
                                            p(e((w = m.votes) == null ? void 0 : w.upvotes)),
                                            9,
                                            wt
                                        ),
                                        t(
                                            "p",
                                            {
                                                onClick: (x) => i(m),
                                                class: "vote is-size-6 has-text-centered has-text-weight-bold has-text-warning",
                                            },
                                            p(e((P = m.votes) == null ? void 0 : P.misleading)),
                                            9,
                                            xt
                                        ),
                                        t(
                                            "p",
                                            {
                                                onClick: (x) => r(m),
                                                class: "vote is-size-6 has-text-centered has-text-weight-bold has-text-danger",
                                            },
                                            p(e((S = m.votes) == null ? void 0 : S.downvotes)),
                                            9,
                                            kt
                                        ),
                                    ]),
                                ]),
                                t(
                                    "div",
                                    { class: "media-content", onClick: (x) => u(m) },
                                    [
                                        t("header", Pt, [t("p", St, p(m.title), 1)]),
                                        t("div", Ut, [
                                            t("span", Mt, "u/" + p((U = m.user) == null ? void 0 : U.username), 1),
                                            t("span", Vt, p(m.time), 1),
                                        ]),
                                    ],
                                    8,
                                    Ct
                                ),
                            ])
                        )
                    }),
                    128
                )
            )
        },
    })
var O = F(Lt, [["__scopeId", "data-v-a1ce0f28"]])
const Nt = { class: "navbar box p-1 is-flex is-flex-direction-row" },
    Rt = { class: "navbar-brand" },
    Ft = f({
        emits: ["sort"],
        setup(l) {
            return (a, e) => (
                c(),
                d("div", Nt, [
                    t("div", Rt, [
                        t(
                            "p",
                            { class: "navbar-item px-4", onClick: e[0] || (e[0] = (n) => a.$emit("sort", "hot")) },
                            "Hot"
                        ),
                        t(
                            "p",
                            { class: "navbar-item px-4", onClick: e[1] || (e[1] = (n) => a.$emit("sort", "top")) },
                            "Top"
                        ),
                        t(
                            "p",
                            { class: "navbar-item px-4", onClick: e[2] || (e[2] = (n) => a.$emit("sort", "new")) },
                            "New"
                        ),
                    ]),
                ])
            )
        },
    }),
    Tt = { class: "columns p-4" },
    It = { class: "column" },
    Bt = { class: "column is-4" },
    qt = f({
        setup(l) {
            const a = v([])
            function e(n) {
                a.value.sort((s, i) => {
                    if (n == "new") return s.time < i.time ? 1 : -1
                    if (n == "top") {
                        const r = s.votes.upvotes - s.votes.downvotes - s.votes.misleading / 2,
                            u = i.votes.upvotes - i.votes.downvotes - i.votes.misleading / 2
                        return r < u ? 1 : -1
                    } else return 0
                })
            }
            return (
                T(async () => {
                    const n = await y.get("https://doxforeverything.herokuapp.com/posts")
                    ;(a.value = n.data), e("top")
                }),
                (n, s) => (
                    c(),
                    d("div", Tt, [
                        t("div", It, [g(Ft, { onSort: e }), g(O, { posts: a.value }, null, 8, ["posts"])]),
                        t("div", Bt, [g(ft)]),
                    ])
                )
            )
        },
    }),
    zt = {}
function Dt(l, a) {
    return c(), d("h1", null, "About!")
}
var At = F(zt, [["render", Dt]])
const Et = { key: 0, class: "box m-5" },
    Ot = { key: 1, class: "box content m-5" },
    Ht = t("i", null, "There are no comments yet...", -1),
    Yt = [Ht],
    H = f({
        props: { comments: null },
        setup(l) {
            return (a, e) =>
                l.comments.length > 0
                    ? (c(),
                      d("div", Et, [
                          (c(!0),
                          d(
                              R,
                              null,
                              D(l.comments, (n) => {
                                  var s
                                  return (
                                      c(),
                                      d("div", { class: "block content", key: n.comment_id }, [
                                          t("h5", null, "u/" + p((s = n.user) == null ? void 0 : s.username), 1),
                                          t("p", null, p(n.content), 1),
                                      ])
                                  )
                              }),
                              128
                          )),
                      ]))
                    : (c(), d("div", Ot, Yt))
        },
    }),
    jt = { class: "box m-5 has-background-light" },
    Wt = { class: "block content" },
    Gt = { class: "mb-1" },
    Kt = { class: "is-flex is-flex-direction-row" },
    Xt = { class: "has-text-primary" },
    Jt = { class: "has-text-warning px-4" },
    Qt = { class: "has-text-danger pr-4" },
    Zt = { class: "block" },
    te = { class: "block" },
    ee = { key: 0 },
    se = f({
        setup(l) {
            const a = X(),
                e = v(),
                n = v([]),
                s = v(""),
                i = v(!1)
            function r() {
                i.value = !i.value
            }
            async function u() {
                var o, _, m, w
                await y.post(
                    "https://doxforeverything.herokuapp.com/newComment",
                    new URLSearchParams({
                        user_id: h.getters.getSession.user.user_id,
                        post_id: String((o = e.value) == null ? void 0 : o.post_id),
                        reply_to: String((_ = e.value) == null ? void 0 : _.post_id),
                        content: s.value,
                    })
                ),
                    n.value.push({
                        comment_id: 0,
                        user_id: h.getters.getSession.user.user_id,
                        user: h.getters.getCurrentUser,
                        post_id: Number((m = e.value) == null ? void 0 : m.post_id),
                        reply_to: Number((w = e.value) == null ? void 0 : w.post_id),
                        content: s.value,
                        time: "",
                        votes: { upvotes: 1, misleading: 0, downvotes: 0, users: [] },
                    }),
                    r(),
                    (s.value = "")
            }
            return (
                T(async () => {
                    const o = await y.get(`https://doxforeverything.herokuapp.com/posts/${a.params.post_id}`)
                    e.value = o.data
                    const _ = await y.get(`https://doxforeverything.herokuapp.com/posts/${a.params.post_id}/comments`)
                    ;(n.value = _.data), console.log(n.value)
                }),
                (o, _) => {
                    var m, w, P, S, U, x, q, z
                    return (
                        c(),
                        d(
                            R,
                            null,
                            [
                                t("div", jt, [
                                    t("div", Wt, [
                                        t("h2", Gt, p((m = e.value) == null ? void 0 : m.title), 1),
                                        t("div", Kt, [
                                            t("p", Xt, p((w = e.value) == null ? void 0 : w.votes.upvotes), 1),
                                            t("p", Jt, p((P = e.value) == null ? void 0 : P.votes.misleading), 1),
                                            t("p", Qt, p((S = e.value) == null ? void 0 : S.votes.downvotes), 1),
                                            t("p", null, p((U = e.value) == null ? void 0 : U.time), 1),
                                            t(
                                                "p",
                                                null,
                                                p(
                                                    (q = (x = e.value) == null ? void 0 : x.user) == null
                                                        ? void 0
                                                        : q.username
                                                ),
                                                1
                                            ),
                                        ]),
                                        t("div", Zt, [t("p", null, p((z = e.value) == null ? void 0 : z.content), 1)]),
                                    ]),
                                    t("div", te, [
                                        t("button", { class: "button is-primary", onClick: r }, "Comment"),
                                        i.value
                                            ? (c(),
                                              d("div", ee, [
                                                  b(
                                                      t(
                                                          "textarea",
                                                          {
                                                              cols: "30",
                                                              rows: "10",
                                                              "onUpdate:modelValue": _[0] || (_[0] = (Y) => (s.value = Y)),
                                                          },
                                                          null,
                                                          512
                                                      ),
                                                      [[$, s.value]]
                                                  ),
                                                  t("button", { class: "button", onClick: u }, "Submit"),
                                              ]))
                                            : L("", !0),
                                    ]),
                                ]),
                                g(H, { comments: n.value }, null, 8, ["comments"]),
                            ],
                            64
                        )
                    )
                }
            )
        },
    }),
    oe = { key: 0, class: "box m-5 has-background-light" },
    ne = { class: "block content" },
    ae = t("h2", null, "Title", -1),
    le = { class: "block content" },
    ie = t("h4", null, "Content", -1),
    re = ["onClick"],
    ce = { key: 1, class: "box m-5" },
    ue = t("p", null, "You must create an account to post...", -1),
    de = [ue],
    _e = f({
        setup(l) {
            const a = I(() => h.state.session),
                e = v(""),
                n = v(""),
                s = N("toggleModal")
            async function i() {
                try {
                    const r = await y.post(
                        "https://doxforeverything.herokuapp.com/newPost",
                        new URLSearchParams({ title: e.value, content: n.value, user_id: h.getters.getSession.user.user_id })
                    )
                    console.log(r.data), M.push(`/posts/${r.data.post_id}`)
                } catch (r) {
                    console.log(r), s("Failed to upload post...")
                }
            }
            return (r, u) =>
                C(a).authenticated
                    ? (c(),
                      d("form", oe, [
                          t("div", ne, [
                              ae,
                              b(
                                  t(
                                      "input",
                                      { class: "input", "onUpdate:modelValue": u[0] || (u[0] = (o) => (e.value = o)) },
                                      null,
                                      512
                                  ),
                                  [[$, e.value]]
                              ),
                          ]),
                          t("div", le, [
                              ie,
                              b(
                                  t(
                                      "textarea",
                                      {
                                          class: "textarea",
                                          rows: "12",
                                          "onUpdate:modelValue": u[1] || (u[1] = (o) => (n.value = o)),
                                      },
                                      null,
                                      512
                                  ),
                                  [[$, n.value]]
                              ),
                          ]),
                          t("button", { class: "button", onClick: k(i, ["prevent"]) }, "Post", 8, re),
                      ]))
                    : (c(), d("div", ce, de))
        },
    }),
    me = f({
        setup(l) {
            return (a, e) => (c(), J(_e))
        },
    })
const B = (l) => (Q("data-v-5e8b07fb"), (l = l()), Z(), l),
    pe = { key: 0 },
    ve = { class: "box m-5" },
    he = { class: "title" },
    ge = { class: "box m-5 scrollable" },
    fe = B(() => t("p", { class: "title" }, "Posts", -1)),
    be = { class: "box m-5 scrollable" },
    $e = B(() => t("p", { class: "title" }, "Comments", -1)),
    ye = { key: 1, class: "box m-5" },
    we = B(() => t("p", null, "Not logged in.", -1)),
    xe = [we],
    ke = f({
        setup(l) {
            const a = I(() => h.state.session),
                e = v([]),
                n = v([])
            return (
                T(async () => {
                    var r, u
                    const s = await y.get(
                        `https://doxforeverything.herokuapp.com/users/${
                            (r = a.value.user) == null ? void 0 : r.user_id
                        }/posts`
                    )
                    e.value = s.data
                    const i = await y.get(
                        `https://doxforeverything.herokuapp.com/users/${
                            (u = a.value.user) == null ? void 0 : u.user_id
                        }/comments`
                    )
                    n.value = i.data
                }),
                (s, i) => {
                    var r
                    return C(a).authenticated
                        ? (c(),
                          d("div", pe, [
                              t("div", ve, [t("p", he, p((r = C(a).user) == null ? void 0 : r.username), 1)]),
                              t("div", ge, [fe, g(O, { posts: e.value }, null, 8, ["posts"])]),
                              t("div", be, [$e, g(H, { comments: n.value }, null, 8, ["comments"])]),
                          ]))
                        : (c(), d("div", ye, xe))
                }
            )
        },
    })
var Ce = F(ke, [["__scopeId", "data-v-5e8b07fb"]])
const Pe = { class: "columns my-6 is-centered" },
    Se = { class: "column box p-6 is-5" },
    Ue = { class: "field" },
    Me = t("label", { class: "label" }, "Email", -1),
    Ve = { class: "control" },
    Le = { class: "field" },
    Ne = t("label", { class: "label" }, "Username", -1),
    Re = { class: "control" },
    Fe = { class: "field" },
    Te = t("label", { class: "label" }, "Password", -1),
    Ie = { class: "control" },
    Be = { class: "field" },
    qe = t("label", { class: "label" }, "Confirm Password", -1),
    ze = { class: "control" },
    De = { class: "field columns is-centered is-grouped mt-6" },
    Ae = { class: "control" },
    Ee = ["onClick"],
    Oe = t("div", { class: "control" }, [t("button", { class: "button is-danger" }, "Cancel")], -1),
    He = { class: "control" },
    Ye = f({
        setup(l) {
            const a = N("toggleModal"),
                e = v(""),
                n = v(""),
                s = v(""),
                i = v("")
            v(!0)
            async function r() {
                if (e.value == "" || n.value == "" || s.value == "" || i.value == "") {
                    a("Please supply all fields to register.")
                    return
                }
                if (s.value != i.value) {
                    a("Passwords do not match.")
                    return
                }
                try {
                    const u = await y.post(
                        "https://doxforeverything.herokuapp.com/newUser",
                        new URLSearchParams({ email: e.value, username: n.value, password: await tt.hash(s.value, 10) })
                    )
                } catch {
                    a("Failed to register user.")
                    return
                }
                a("User registered sucessfully!"), (e.value = ""), (n.value = ""), (s.value = ""), (i.value = "")
            }
            return (u, o) => (
                c(),
                d("div", Pe, [
                    t("form", Se, [
                        t("div", Ue, [
                            Me,
                            t("div", Ve, [
                                b(
                                    t(
                                        "input",
                                        {
                                            class: "input",
                                            required: "",
                                            type: "text",
                                            "onUpdate:modelValue": o[0] || (o[0] = (_) => (e.value = _)),
                                        },
                                        null,
                                        512
                                    ),
                                    [[$, e.value]]
                                ),
                            ]),
                        ]),
                        t("div", Le, [
                            Ne,
                            t("div", Re, [
                                b(
                                    t(
                                        "input",
                                        {
                                            class: "input",
                                            required: "",
                                            type: "text",
                                            "onUpdate:modelValue": o[1] || (o[1] = (_) => (n.value = _)),
                                        },
                                        null,
                                        512
                                    ),
                                    [[$, n.value]]
                                ),
                            ]),
                        ]),
                        t("div", Fe, [
                            Te,
                            t("div", Ie, [
                                b(
                                    t(
                                        "input",
                                        {
                                            class: "input",
                                            required: "",
                                            type: "password",
                                            "onUpdate:modelValue": o[2] || (o[2] = (_) => (s.value = _)),
                                        },
                                        null,
                                        512
                                    ),
                                    [[$, s.value]]
                                ),
                            ]),
                        ]),
                        t("div", Be, [
                            qe,
                            t("div", ze, [
                                b(
                                    t(
                                        "input",
                                        {
                                            class: "input",
                                            required: "",
                                            type: "password",
                                            "onUpdate:modelValue": o[3] || (o[3] = (_) => (i.value = _)),
                                        },
                                        null,
                                        512
                                    ),
                                    [[$, i.value]]
                                ),
                            ]),
                        ]),
                        t("div", De, [
                            t("div", Ae, [
                                t("button", { class: "button is-primary", onClick: k(r, ["prevent"]) }, "Register", 8, Ee),
                            ]),
                            Oe,
                            t("div", He, [
                                t(
                                    "button",
                                    {
                                        class: "button is-warning",
                                        onClick:
                                            o[4] ||
                                            (o[4] = k(
                                                (_) =>
                                                    C(a)(
                                                        "Failed to do something...",
                                                        "Additional information about the issue",
                                                        "Buttons and stuff"
                                                    ),
                                                ["prevent"]
                                            )),
                                    },
                                    "Modal"
                                ),
                            ]),
                        ]),
                    ]),
                ])
            )
        },
    }),
    M = et({
        history: st(),
        routes: [
            { name: "Home", path: "/", component: qt },
            { name: "About", path: "/about", component: At },
            { name: "Post", path: "/posts/:post_id", component: se },
            { name: "Editor", path: "/editor", component: me },
            { name: "Register", path: "/register", component: Ye },
            { name: "Profile", path: "/profile", component: Ce },
        ],
    }),
    je = { class: "navbar has-background-primary" },
    We = { class: "navbar-brand" },
    Ge = E("DOX"),
    Ke = t("p", { class: "navbar-item is-size-4 has-text-weight-semibold pl-0" }, "For Everything", -1),
    Xe = { class: "navbar-menu is-active" },
    Je = { class: "navbar-end" },
    Qe = { key: 0, class: "navbar-item field is-grouped" },
    Ze = ["onClick"],
    ts = E("Register"),
    es = { key: 1, class: "navbar-item" },
    ss = { class: "button has-text-weight-bold has-background-primary-light" },
    os = t("button", { class: "button mx-2" }, "New Post", -1),
    ns = ["onClick"],
    as = f({
        setup(l) {
            const a = I(() => h.state.session),
                e = v(""),
                n = v(""),
                s = N("toggleModal")
            async function i() {
                try {
                    const u = await y.post(
                        "https://doxforeverything.herokuapp.com/authenticate",
                        new URLSearchParams({ username: e.value, password: n.value })
                    )
                    h.commit("login", u.data), (e.value = ""), (n.value = ""), M.push("/")
                } catch (u) {
                    console.log(u), s("Failed to login...", "Double check you typed in your username and password correctly")
                }
            }
            function r() {
                h.commit("logout"), M.push("/")
            }
            return (u, o) => {
                const _ = A("router-link")
                return (
                    c(),
                    d("nav", je, [
                        t("div", We, [
                            g(
                                _,
                                { class: "navbar-item my-auto is-size-2 has-text-weight-bold has-text-dark", to: "/" },
                                { default: V(() => [Ge]), _: 1 }
                            ),
                            Ke,
                        ]),
                        t("div", Xe, [
                            t("div", Je, [
                                C(a).authenticated
                                    ? (c(),
                                      d("div", es, [
                                          g(
                                              _,
                                              { to: "/profile" },
                                              {
                                                  default: V(() => {
                                                      var m
                                                      return [
                                                          t(
                                                              "button",
                                                              ss,
                                                              p((m = C(a).user) == null ? void 0 : m.username),
                                                              1
                                                          ),
                                                      ]
                                                  }),
                                                  _: 1,
                                              }
                                          ),
                                          g(_, { to: "/editor" }, { default: V(() => [os]), _: 1 }),
                                          t("button", { class: "button", onClick: k(r, ["prevent"]) }, "Logout", 8, ns),
                                      ]))
                                    : (c(),
                                      d("form", Qe, [
                                          b(
                                              t(
                                                  "input",
                                                  {
                                                      class: "input",
                                                      type: "username",
                                                      placeholder: "username",
                                                      "onUpdate:modelValue": o[0] || (o[0] = (m) => (e.value = m)),
                                                      required: "",
                                                  },
                                                  null,
                                                  512
                                              ),
                                              [[$, e.value]]
                                          ),
                                          b(
                                              t(
                                                  "input",
                                                  {
                                                      class: "input ml-2 mr-1",
                                                      type: "password",
                                                      placeholder: "password",
                                                      "onUpdate:modelValue": o[1] || (o[1] = (m) => (n.value = m)),
                                                      required: "",
                                                  },
                                                  null,
                                                  512
                                              ),
                                              [[$, n.value]]
                                          ),
                                          t(
                                              "button",
                                              { type: "submit", class: "button ml-1 mr-2", onClick: k(i, ["prevent"]) },
                                              "Login",
                                              8,
                                              Ze
                                          ),
                                          g(
                                              _,
                                              { class: "navbar-item button", to: "/register" },
                                              { default: V(() => [ts]), _: 1 }
                                          ),
                                      ])),
                            ]),
                        ]),
                    ])
                )
            }
        },
    }),
    ls = f({
        setup(l) {
            const a = v(!1),
                e = v(""),
                n = v(""),
                s = v("")
            function i(r, u, o) {
                r && (e.value = r), u && (n.value = u), o && (s.value = o), (a.value = !a.value)
            }
            return (
                ot("toggleModal", i),
                (r, u) => {
                    const o = A("router-view")
                    return (
                        c(),
                        d(
                            R,
                            null,
                            [
                                g(as),
                                t("div", null, [g(o)]),
                                g(
                                    _t,
                                    {
                                        "show-modal": a.value,
                                        "modal-title": e.value,
                                        "modal-content": n.value,
                                        "modal-footer": s.value,
                                        onToggleModal: i,
                                    },
                                    null,
                                    8,
                                    ["show-modal", "modal-title", "modal-content", "modal-footer"]
                                ),
                            ],
                            64
                        )
                    )
                }
            )
        },
    })
nt(ls).use(M).use(h).mount("#app")
