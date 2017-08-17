(function webpackUniversalModuleDefinition(root, factory) {
    if (typeof exports === "object" && typeof module === "object") module.exports = factory(require("vitrarius")); else if (typeof define === "function" && define.amd) define([ "vitrarius" ], factory); else if (typeof exports === "object") exports["silhouette"] = factory(require("vitrarius")); else root["silhouette"] = factory(root["vitrarius"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_1__) {
    return function(modules) {
        var installedModules = {};
        function __webpack_require__(moduleId) {
            if (installedModules[moduleId]) {
                return installedModules[moduleId].exports;
            }
            var module = installedModules[moduleId] = {
                i: moduleId,
                l: false,
                exports: {}
            };
            modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
            module.l = true;
            return module.exports;
        }
        __webpack_require__.m = modules;
        __webpack_require__.c = installedModules;
        __webpack_require__.d = function(exports, name, getter) {
            if (!__webpack_require__.o(exports, name)) {
                Object.defineProperty(exports, name, {
                    configurable: false,
                    enumerable: true,
                    get: getter
                });
            }
        };
        __webpack_require__.n = function(module) {
            var getter = module && module.__esModule ? function getDefault() {
                return module["default"];
            } : function getModuleExports() {
                return module;
            };
            __webpack_require__.d(getter, "a", getter);
            return getter;
        };
        __webpack_require__.o = function(object, property) {
            return Object.prototype.hasOwnProperty.call(object, property);
        };
        __webpack_require__.p = "";
        return __webpack_require__(__webpack_require__.s = 0);
    }([ function(module, exports, __webpack_require__) {
        "use strict";
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        exports.create = create;
        var _vitrarius = __webpack_require__(1);
        const __DEFINE__ = Symbol("__DEFINE__");
        const __REMOVE__ = Symbol("__REMOVE__");
        const __path__ = Symbol("path");
        const __reducers__ = Symbol("reducers");
        const __push__ = Symbol("push");
        const __store__ = Symbol("store");
        const __root__ = Symbol("root");
        const __create__ = Symbol("create");
        function diff(pat, trg) {
            if (!(pat instanceof Object || pat instanceof Array)) {
                return !!trg;
            }
            return Object.keys(pat).reduce((a, k) => a && trg[k] && diff(pat[k], trg[k]), trg !== undefined);
        }
        function defineSilhouette() {
            class Silhouette {
                [__create__](parent, member) {
                    let sil = new Silhouette();
                    sil[__path__] = parent ? [ ...parent[__path__], member ] : [];
                    sil[__reducers__] = {};
                    if (parent !== undefined) {
                        parent[member] = sil;
                    }
                    return sil;
                }
                define(val, ...path) {
                    if (!(0, _vitrarius.view)((0, _vitrarius.compose)(...path.map(k => (0, _vitrarius.lens)(o => o[k], (o, r) => r)), diff.bind(null, val)), this)) {
                        this[__store__].dispatch({
                            type: __DEFINE__,
                            val: val,
                            path: [ ...this[__path__], ...path ]
                        });
                    }
                }
                remove(...path) {
                    this[__store__].dispatch({
                        type: __REMOVE__,
                        path: [ ...this[__path__], ...path ]
                    });
                }
                dispatch(type, payload, locally = false) {
                    this[__store__].dispatch(Object.assign({
                        type: type,
                        [__path__]: locally ? this[__path__] : []
                    }, payload));
                }
                extend(type, reducer, compose = false) {
                    if (type instanceof Object) {}
                    this[__reducers__][type] = reducer;
                }
                [__push__]() {}
            }
            return Silhouette;
        }
        function contort({state: state, sil: sil, action: action}) {
            let transitional = state;
            if (sil[__reducers__][action.type]) {
                transitional = sil[__reducers__][action.type](state, action);
            }
            if (transitional === undefined) {
                throw new Error("Reducer returned undefined; are you missing a return statement?");
            }
            if (transitional !== state) {
                Object.keys(sil).forEach(key => {
                    if (!transitional.hasOwnProperty(key)) {
                        sil[key][__push__]({
                            done: true
                        });
                        delete sil[key];
                    }
                });
                Object.keys(transitional).forEach(key => {
                    if (!sil.hasOwnProperty(key)) {
                        sil[__create__](sil, key);
                    }
                });
            }
            let itr = Object.keys(transitional)[Symbol.iterator]();
            let fun = frag => {
                let member = itr.next().value;
                return {
                    state: frag,
                    action: action,
                    sil: sil[member] || sil[__create__](sil, member)
                };
            };
            let final = (0, _vitrarius.view)((0, _vitrarius.compose)((0, _vitrarius.each)(), fun, contort), transitional);
            if (final != state) {
                sil[__push__]({
                    done: false,
                    value: final
                });
            }
            return final;
        }
        function traverse(member) {
            return (0, _vitrarius.optic)(({state: state, sil: sil, action: action}, next) => {
                return (0, _vitrarius.view)((0, _vitrarius.compose)(member, fragment => {
                    if (!sil[member]) {
                        sil[__create__](sil, member);
                    }
                    let ret = next({
                        state: fragment || {},
                        sil: sil[member],
                        action: action
                    });
                    if (ret !== state) {
                        sil[member][__push__]({
                            done: false,
                            value: ret
                        });
                    }
                    return ret;
                }), state);
            });
        }
        function repsert(val) {
            return (0, _vitrarius.optic)(({state: state, sil: sil}) => {
                Object.keys(val).forEach(key => {
                    if (!sil || !sil.hasOwnProperty(key)) {
                        sil[__create__](sil, key);
                        (0, _vitrarius.view)(repsert(val[key]), {
                            state: undefined,
                            sil: sil[key]
                        });
                    }
                });
                if (val !== state) {
                    sil[__push__]({
                        done: false,
                        value: val
                    });
                }
                return val;
            });
        }
        function erase(member) {
            return (0, _vitrarius.optic)(({state: state, sil: sil}) => {
                let _state = state;
                if (state.hasOwnProperty(member)) {
                    _state = Object.keys(state).reduce((a, k) => {
                        a[k] = state[k];
                        return a;
                    }, {});
                    delete _state[member];
                    sil[member][__push__]({
                        done: true
                    });
                    delete sil[member];
                }
                return _state;
            });
        }
        function globalReducer(S, state = {}, action) {
            let path, payload, val, sil = S.prototype[__root__];
            switch (action.type) {
              case __DEFINE__:
                ({val: val, path: path} = action);
                let _define = (0, _vitrarius.compose)(...path.map(traverse), repsert(val));
                return (0, _vitrarius.view)(_define, {
                    state: state,
                    sil: sil
                });

              case __REMOVE__:
                ({path: path} = action);
                let eraser = erase(path.pop());
                let remove = (0, _vitrarius.compose)(...path.map(traverse), eraser);
                return (0, _vitrarius.view)(remove, {
                    state: state,
                    sil: sil
                });

              default:
                path = action[__path__] || [];
                let dispatch = (0, _vitrarius.compose)(...path.map(traverse), contort);
                return (0, _vitrarius.view)(dispatch, {
                    state: state,
                    sil: sil,
                    action: action
                });
            }
        }
        function create(...plugins) {
            let namespace = {
                Silhouette: defineSilhouette(),
                createStore(reducer) {
                    let state = {};
                    return {
                        dispatch(action) {
                            state = reducer(state, action);
                        }
                    };
                },
                createSil(store) {
                    let sil = namespace.Silhouette.prototype[__create__]();
                    namespace.Silhouette.prototype[__store__] = store;
                    namespace.Silhouette.prototype[__root__] = sil;
                    return sil;
                },
                symbols: {
                    __push__: __push__,
                    __create__: __create__,
                    __reducers__: __reducers__,
                    __path__: __path__,
                    __store__: __store__,
                    __root__: __root__,
                    __DEFINE__: __DEFINE__,
                    __REMOVE__: __REMOVE__
                }
            };
            Object.keys(namespace).filter(key => namespace[key] instanceof Function).forEach(key => {
                plugins.map(p => p[key]).filter(f => f).reverse().forEach(f => {
                    namespace[key] = f(namespace[key], namespace);
                });
            });
            let reducer = globalReducer.bind(undefined, namespace.Silhouette);
            let store = namespace.createStore(reducer);
            return namespace.createSil(store);
        }
    }, function(module, exports) {
        module.exports = __WEBPACK_EXTERNAL_MODULE_1__;
    } ]);
});