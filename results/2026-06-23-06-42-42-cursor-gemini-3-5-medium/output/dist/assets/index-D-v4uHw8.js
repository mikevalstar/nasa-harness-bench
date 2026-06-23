(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))i(a);new MutationObserver(a=>{for(const s of a)if(s.type==="childList")for(const r of s.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&i(r)}).observe(document,{childList:!0,subtree:!0});function n(a){const s={};return a.integrity&&(s.integrity=a.integrity),a.referrerPolicy&&(s.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?s.credentials="include":a.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(a){if(a.ep)return;a.ep=!0;const s=n(a);fetch(a.href,s)}})();var j0={exports:{}},ou={};/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var Cy=Symbol.for("react.transitional.element"),Dy=Symbol.for("react.fragment");function X0(e,t,n){var i=null;if(n!==void 0&&(i=""+n),t.key!==void 0&&(i=""+t.key),"key"in t){n={};for(var a in t)a!=="key"&&(n[a]=t[a])}else n=t;return t=n.ref,{$$typeof:Cy,type:e,key:i,ref:t!==void 0?t:null,props:n}}ou.Fragment=Dy;ou.jsx=X0;ou.jsxs=X0;j0.exports=ou;var A=j0.exports,W0={exports:{}},kt={};/**
 * @license React
 * react.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var Gd=Symbol.for("react.transitional.element"),Ny=Symbol.for("react.portal"),Uy=Symbol.for("react.fragment"),Ly=Symbol.for("react.strict_mode"),Oy=Symbol.for("react.profiler"),Py=Symbol.for("react.consumer"),zy=Symbol.for("react.context"),Iy=Symbol.for("react.forward_ref"),By=Symbol.for("react.suspense"),Fy=Symbol.for("react.memo"),q0=Symbol.for("react.lazy"),Hy=Symbol.for("react.activity"),sm=Symbol.iterator;function Gy(e){return e===null||typeof e!="object"?null:(e=sm&&e[sm]||e["@@iterator"],typeof e=="function"?e:null)}var Y0={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},Z0=Object.assign,K0={};function Ur(e,t,n){this.props=e,this.context=t,this.refs=K0,this.updater=n||Y0}Ur.prototype.isReactComponent={};Ur.prototype.setState=function(e,t){if(typeof e!="object"&&typeof e!="function"&&e!=null)throw Error("takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,e,t,"setState")};Ur.prototype.forceUpdate=function(e){this.updater.enqueueForceUpdate(this,e,"forceUpdate")};function Q0(){}Q0.prototype=Ur.prototype;function Vd(e,t,n){this.props=e,this.context=t,this.refs=K0,this.updater=n||Y0}var kd=Vd.prototype=new Q0;kd.constructor=Vd;Z0(kd,Ur.prototype);kd.isPureReactComponent=!0;var rm=Array.isArray;function th(){}var Ee={H:null,A:null,T:null,S:null},J0=Object.prototype.hasOwnProperty;function jd(e,t,n){var i=n.ref;return{$$typeof:Gd,type:e,key:t,ref:i!==void 0?i:null,props:n}}function Vy(e,t){return jd(e.type,t,e.props)}function Xd(e){return typeof e=="object"&&e!==null&&e.$$typeof===Gd}function ky(e){var t={"=":"=0",":":"=2"};return"$"+e.replace(/[=:]/g,function(n){return t[n]})}var om=/\/+/g;function Lu(e,t){return typeof e=="object"&&e!==null&&e.key!=null?ky(""+e.key):t.toString(36)}function jy(e){switch(e.status){case"fulfilled":return e.value;case"rejected":throw e.reason;default:switch(typeof e.status=="string"?e.then(th,th):(e.status="pending",e.then(function(t){e.status==="pending"&&(e.status="fulfilled",e.value=t)},function(t){e.status==="pending"&&(e.status="rejected",e.reason=t)})),e.status){case"fulfilled":return e.value;case"rejected":throw e.reason}}throw e}function Bs(e,t,n,i,a){var s=typeof e;(s==="undefined"||s==="boolean")&&(e=null);var r=!1;if(e===null)r=!0;else switch(s){case"bigint":case"string":case"number":r=!0;break;case"object":switch(e.$$typeof){case Gd:case Ny:r=!0;break;case q0:return r=e._init,Bs(r(e._payload),t,n,i,a)}}if(r)return a=a(e),r=i===""?"."+Lu(e,0):i,rm(a)?(n="",r!=null&&(n=r.replace(om,"$&/")+"/"),Bs(a,t,n,"",function(c){return c})):a!=null&&(Xd(a)&&(a=Vy(a,n+(a.key==null||e&&e.key===a.key?"":(""+a.key).replace(om,"$&/")+"/")+r)),t.push(a)),1;r=0;var o=i===""?".":i+":";if(rm(e))for(var l=0;l<e.length;l++)i=e[l],s=o+Lu(i,l),r+=Bs(i,t,n,s,a);else if(l=Gy(e),typeof l=="function")for(e=l.call(e),l=0;!(i=e.next()).done;)i=i.value,s=o+Lu(i,l++),r+=Bs(i,t,n,s,a);else if(s==="object"){if(typeof e.then=="function")return Bs(jy(e),t,n,i,a);throw t=String(e),Error("Objects are not valid as a React child (found: "+(t==="[object Object]"?"object with keys {"+Object.keys(e).join(", ")+"}":t)+"). If you meant to render a collection of children, use an array instead.")}return r}function cl(e,t,n){if(e==null)return e;var i=[],a=0;return Bs(e,i,"","",function(s){return t.call(n,s,a++)}),i}function Xy(e){if(e._status===-1){var t=e._result;t=t(),t.then(function(n){(e._status===0||e._status===-1)&&(e._status=1,e._result=n)},function(n){(e._status===0||e._status===-1)&&(e._status=2,e._result=n)}),e._status===-1&&(e._status=0,e._result=t)}if(e._status===1)return e._result.default;throw e._result}var lm=typeof reportError=="function"?reportError:function(e){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var t=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof e=="object"&&e!==null&&typeof e.message=="string"?String(e.message):String(e),error:e});if(!window.dispatchEvent(t))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",e);return}console.error(e)},Wy={map:cl,forEach:function(e,t,n){cl(e,function(){t.apply(this,arguments)},n)},count:function(e){var t=0;return cl(e,function(){t++}),t},toArray:function(e){return cl(e,function(t){return t})||[]},only:function(e){if(!Xd(e))throw Error("React.Children.only expected to receive a single React element child.");return e}};kt.Activity=Hy;kt.Children=Wy;kt.Component=Ur;kt.Fragment=Uy;kt.Profiler=Oy;kt.PureComponent=Vd;kt.StrictMode=Ly;kt.Suspense=By;kt.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=Ee;kt.__COMPILER_RUNTIME={__proto__:null,c:function(e){return Ee.H.useMemoCache(e)}};kt.cache=function(e){return function(){return e.apply(null,arguments)}};kt.cacheSignal=function(){return null};kt.cloneElement=function(e,t,n){if(e==null)throw Error("The argument must be a React element, but you passed "+e+".");var i=Z0({},e.props),a=e.key;if(t!=null)for(s in t.key!==void 0&&(a=""+t.key),t)!J0.call(t,s)||s==="key"||s==="__self"||s==="__source"||s==="ref"&&t.ref===void 0||(i[s]=t[s]);var s=arguments.length-2;if(s===1)i.children=n;else if(1<s){for(var r=Array(s),o=0;o<s;o++)r[o]=arguments[o+2];i.children=r}return jd(e.type,a,i)};kt.createContext=function(e){return e={$$typeof:zy,_currentValue:e,_currentValue2:e,_threadCount:0,Provider:null,Consumer:null},e.Provider=e,e.Consumer={$$typeof:Py,_context:e},e};kt.createElement=function(e,t,n){var i,a={},s=null;if(t!=null)for(i in t.key!==void 0&&(s=""+t.key),t)J0.call(t,i)&&i!=="key"&&i!=="__self"&&i!=="__source"&&(a[i]=t[i]);var r=arguments.length-2;if(r===1)a.children=n;else if(1<r){for(var o=Array(r),l=0;l<r;l++)o[l]=arguments[l+2];a.children=o}if(e&&e.defaultProps)for(i in r=e.defaultProps,r)a[i]===void 0&&(a[i]=r[i]);return jd(e,s,a)};kt.createRef=function(){return{current:null}};kt.forwardRef=function(e){return{$$typeof:Iy,render:e}};kt.isValidElement=Xd;kt.lazy=function(e){return{$$typeof:q0,_payload:{_status:-1,_result:e},_init:Xy}};kt.memo=function(e,t){return{$$typeof:Fy,type:e,compare:t===void 0?null:t}};kt.startTransition=function(e){var t=Ee.T,n={};Ee.T=n;try{var i=e(),a=Ee.S;a!==null&&a(n,i),typeof i=="object"&&i!==null&&typeof i.then=="function"&&i.then(th,lm)}catch(s){lm(s)}finally{t!==null&&n.types!==null&&(t.types=n.types),Ee.T=t}};kt.unstable_useCacheRefresh=function(){return Ee.H.useCacheRefresh()};kt.use=function(e){return Ee.H.use(e)};kt.useActionState=function(e,t,n){return Ee.H.useActionState(e,t,n)};kt.useCallback=function(e,t){return Ee.H.useCallback(e,t)};kt.useContext=function(e){return Ee.H.useContext(e)};kt.useDebugValue=function(){};kt.useDeferredValue=function(e,t){return Ee.H.useDeferredValue(e,t)};kt.useEffect=function(e,t){return Ee.H.useEffect(e,t)};kt.useEffectEvent=function(e){return Ee.H.useEffectEvent(e)};kt.useId=function(){return Ee.H.useId()};kt.useImperativeHandle=function(e,t,n){return Ee.H.useImperativeHandle(e,t,n)};kt.useInsertionEffect=function(e,t){return Ee.H.useInsertionEffect(e,t)};kt.useLayoutEffect=function(e,t){return Ee.H.useLayoutEffect(e,t)};kt.useMemo=function(e,t){return Ee.H.useMemo(e,t)};kt.useOptimistic=function(e,t){return Ee.H.useOptimistic(e,t)};kt.useReducer=function(e,t,n){return Ee.H.useReducer(e,t,n)};kt.useRef=function(e){return Ee.H.useRef(e)};kt.useState=function(e){return Ee.H.useState(e)};kt.useSyncExternalStore=function(e,t,n){return Ee.H.useSyncExternalStore(e,t,n)};kt.useTransition=function(){return Ee.H.useTransition()};kt.version="19.2.7";W0.exports=kt;var pt=W0.exports,$0={exports:{}},lu={},t_={exports:{}},e_={};/**
 * @license React
 * scheduler.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */(function(e){function t(N,G){var O=N.length;N.push(G);t:for(;0<O;){var nt=O-1>>>1,Z=N[nt];if(0<a(Z,G))N[nt]=G,N[O]=Z,O=nt;else break t}}function n(N){return N.length===0?null:N[0]}function i(N){if(N.length===0)return null;var G=N[0],O=N.pop();if(O!==G){N[0]=O;t:for(var nt=0,Z=N.length,it=Z>>>1;nt<it;){var yt=2*(nt+1)-1,Ct=N[yt],k=yt+1,K=N[k];if(0>a(Ct,O))k<Z&&0>a(K,Ct)?(N[nt]=K,N[k]=O,nt=k):(N[nt]=Ct,N[yt]=O,nt=yt);else if(k<Z&&0>a(K,O))N[nt]=K,N[k]=O,nt=k;else break t}}return G}function a(N,G){var O=N.sortIndex-G.sortIndex;return O!==0?O:N.id-G.id}if(e.unstable_now=void 0,typeof performance=="object"&&typeof performance.now=="function"){var s=performance;e.unstable_now=function(){return s.now()}}else{var r=Date,o=r.now();e.unstable_now=function(){return r.now()-o}}var l=[],c=[],h=1,d=null,f=3,p=!1,v=!1,S=!1,m=!1,u=typeof setTimeout=="function"?setTimeout:null,g=typeof clearTimeout=="function"?clearTimeout:null,_=typeof setImmediate<"u"?setImmediate:null;function y(N){for(var G=n(c);G!==null;){if(G.callback===null)i(c);else if(G.startTime<=N)i(c),G.sortIndex=G.expirationTime,t(l,G);else break;G=n(c)}}function L(N){if(S=!1,y(N),!v)if(n(l)!==null)v=!0,T||(T=!0,q());else{var G=n(c);G!==null&&et(L,G.startTime-N)}}var T=!1,R=-1,U=5,X=-1;function x(){return m?!0:!(e.unstable_now()-X<U)}function E(){if(m=!1,T){var N=e.unstable_now();X=N;var G=!0;try{t:{v=!1,S&&(S=!1,g(R),R=-1),p=!0;var O=f;try{e:{for(y(N),d=n(l);d!==null&&!(d.expirationTime>N&&x());){var nt=d.callback;if(typeof nt=="function"){d.callback=null,f=d.priorityLevel;var Z=nt(d.expirationTime<=N);if(N=e.unstable_now(),typeof Z=="function"){d.callback=Z,y(N),G=!0;break e}d===n(l)&&i(l),y(N)}else i(l);d=n(l)}if(d!==null)G=!0;else{var it=n(c);it!==null&&et(L,it.startTime-N),G=!1}}break t}finally{d=null,f=O,p=!1}G=void 0}}finally{G?q():T=!1}}}var q;if(typeof _=="function")q=function(){_(E)};else if(typeof MessageChannel<"u"){var W=new MessageChannel,J=W.port2;W.port1.onmessage=E,q=function(){J.postMessage(null)}}else q=function(){u(E,0)};function et(N,G){R=u(function(){N(e.unstable_now())},G)}e.unstable_IdlePriority=5,e.unstable_ImmediatePriority=1,e.unstable_LowPriority=4,e.unstable_NormalPriority=3,e.unstable_Profiling=null,e.unstable_UserBlockingPriority=2,e.unstable_cancelCallback=function(N){N.callback=null},e.unstable_forceFrameRate=function(N){0>N||125<N?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):U=0<N?Math.floor(1e3/N):5},e.unstable_getCurrentPriorityLevel=function(){return f},e.unstable_next=function(N){switch(f){case 1:case 2:case 3:var G=3;break;default:G=f}var O=f;f=G;try{return N()}finally{f=O}},e.unstable_requestPaint=function(){m=!0},e.unstable_runWithPriority=function(N,G){switch(N){case 1:case 2:case 3:case 4:case 5:break;default:N=3}var O=f;f=N;try{return G()}finally{f=O}},e.unstable_scheduleCallback=function(N,G,O){var nt=e.unstable_now();switch(typeof O=="object"&&O!==null?(O=O.delay,O=typeof O=="number"&&0<O?nt+O:nt):O=nt,N){case 1:var Z=-1;break;case 2:Z=250;break;case 5:Z=1073741823;break;case 4:Z=1e4;break;default:Z=5e3}return Z=O+Z,N={id:h++,callback:G,priorityLevel:N,startTime:O,expirationTime:Z,sortIndex:-1},O>nt?(N.sortIndex=O,t(c,N),n(l)===null&&N===n(c)&&(S?(g(R),R=-1):S=!0,et(L,O-nt))):(N.sortIndex=Z,t(l,N),v||p||(v=!0,T||(T=!0,q()))),N},e.unstable_shouldYield=x,e.unstable_wrapCallback=function(N){var G=f;return function(){var O=f;f=G;try{return N.apply(this,arguments)}finally{f=O}}}})(e_);t_.exports=e_;var qy=t_.exports,n_={exports:{}},fn={};/**
 * @license React
 * react-dom.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var Yy=pt;function i_(e){var t="https://react.dev/errors/"+e;if(1<arguments.length){t+="?args[]="+encodeURIComponent(arguments[1]);for(var n=2;n<arguments.length;n++)t+="&args[]="+encodeURIComponent(arguments[n])}return"Minified React error #"+e+"; visit "+t+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function Qi(){}var un={d:{f:Qi,r:function(){throw Error(i_(522))},D:Qi,C:Qi,L:Qi,m:Qi,X:Qi,S:Qi,M:Qi},p:0,findDOMNode:null},Zy=Symbol.for("react.portal");function Ky(e,t,n){var i=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:Zy,key:i==null?null:""+i,children:e,containerInfo:t,implementation:n}}var co=Yy.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;function cu(e,t){if(e==="font")return"";if(typeof t=="string")return t==="use-credentials"?t:""}fn.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=un;fn.createPortal=function(e,t){var n=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!t||t.nodeType!==1&&t.nodeType!==9&&t.nodeType!==11)throw Error(i_(299));return Ky(e,t,null,n)};fn.flushSync=function(e){var t=co.T,n=un.p;try{if(co.T=null,un.p=2,e)return e()}finally{co.T=t,un.p=n,un.d.f()}};fn.preconnect=function(e,t){typeof e=="string"&&(t?(t=t.crossOrigin,t=typeof t=="string"?t==="use-credentials"?t:"":void 0):t=null,un.d.C(e,t))};fn.prefetchDNS=function(e){typeof e=="string"&&un.d.D(e)};fn.preinit=function(e,t){if(typeof e=="string"&&t&&typeof t.as=="string"){var n=t.as,i=cu(n,t.crossOrigin),a=typeof t.integrity=="string"?t.integrity:void 0,s=typeof t.fetchPriority=="string"?t.fetchPriority:void 0;n==="style"?un.d.S(e,typeof t.precedence=="string"?t.precedence:void 0,{crossOrigin:i,integrity:a,fetchPriority:s}):n==="script"&&un.d.X(e,{crossOrigin:i,integrity:a,fetchPriority:s,nonce:typeof t.nonce=="string"?t.nonce:void 0})}};fn.preinitModule=function(e,t){if(typeof e=="string")if(typeof t=="object"&&t!==null){if(t.as==null||t.as==="script"){var n=cu(t.as,t.crossOrigin);un.d.M(e,{crossOrigin:n,integrity:typeof t.integrity=="string"?t.integrity:void 0,nonce:typeof t.nonce=="string"?t.nonce:void 0})}}else t==null&&un.d.M(e)};fn.preload=function(e,t){if(typeof e=="string"&&typeof t=="object"&&t!==null&&typeof t.as=="string"){var n=t.as,i=cu(n,t.crossOrigin);un.d.L(e,n,{crossOrigin:i,integrity:typeof t.integrity=="string"?t.integrity:void 0,nonce:typeof t.nonce=="string"?t.nonce:void 0,type:typeof t.type=="string"?t.type:void 0,fetchPriority:typeof t.fetchPriority=="string"?t.fetchPriority:void 0,referrerPolicy:typeof t.referrerPolicy=="string"?t.referrerPolicy:void 0,imageSrcSet:typeof t.imageSrcSet=="string"?t.imageSrcSet:void 0,imageSizes:typeof t.imageSizes=="string"?t.imageSizes:void 0,media:typeof t.media=="string"?t.media:void 0})}};fn.preloadModule=function(e,t){if(typeof e=="string")if(t){var n=cu(t.as,t.crossOrigin);un.d.m(e,{as:typeof t.as=="string"&&t.as!=="script"?t.as:void 0,crossOrigin:n,integrity:typeof t.integrity=="string"?t.integrity:void 0})}else un.d.m(e)};fn.requestFormReset=function(e){un.d.r(e)};fn.unstable_batchedUpdates=function(e,t){return e(t)};fn.useFormState=function(e,t,n){return co.H.useFormState(e,t,n)};fn.useFormStatus=function(){return co.H.useHostTransitionStatus()};fn.version="19.2.7";function a_(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(a_)}catch(e){console.error(e)}}a_(),n_.exports=fn;var Qy=n_.exports;/**
 * @license React
 * react-dom-client.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var Fe=qy,s_=pt,Jy=Qy;function $(e){var t="https://react.dev/errors/"+e;if(1<arguments.length){t+="?args[]="+encodeURIComponent(arguments[1]);for(var n=2;n<arguments.length;n++)t+="&args[]="+encodeURIComponent(arguments[n])}return"Minified React error #"+e+"; visit "+t+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function r_(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function Ho(e){var t=e,n=e;if(e.alternate)for(;t.return;)t=t.return;else{e=t;do t=e,t.flags&4098&&(n=t.return),e=t.return;while(e)}return t.tag===3?n:null}function o_(e){if(e.tag===13){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function l_(e){if(e.tag===31){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function cm(e){if(Ho(e)!==e)throw Error($(188))}function $y(e){var t=e.alternate;if(!t){if(t=Ho(e),t===null)throw Error($(188));return t!==e?null:e}for(var n=e,i=t;;){var a=n.return;if(a===null)break;var s=a.alternate;if(s===null){if(i=a.return,i!==null){n=i;continue}break}if(a.child===s.child){for(s=a.child;s;){if(s===n)return cm(a),e;if(s===i)return cm(a),t;s=s.sibling}throw Error($(188))}if(n.return!==i.return)n=a,i=s;else{for(var r=!1,o=a.child;o;){if(o===n){r=!0,n=a,i=s;break}if(o===i){r=!0,i=a,n=s;break}o=o.sibling}if(!r){for(o=s.child;o;){if(o===n){r=!0,n=s,i=a;break}if(o===i){r=!0,i=s,n=a;break}o=o.sibling}if(!r)throw Error($(189))}}if(n.alternate!==i)throw Error($(190))}if(n.tag!==3)throw Error($(188));return n.stateNode.current===n?e:t}function c_(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e;for(e=e.child;e!==null;){if(t=c_(e),t!==null)return t;e=e.sibling}return null}var be=Object.assign,tS=Symbol.for("react.element"),ul=Symbol.for("react.transitional.element"),io=Symbol.for("react.portal"),Gs=Symbol.for("react.fragment"),u_=Symbol.for("react.strict_mode"),eh=Symbol.for("react.profiler"),f_=Symbol.for("react.consumer"),Pi=Symbol.for("react.context"),Wd=Symbol.for("react.forward_ref"),nh=Symbol.for("react.suspense"),ih=Symbol.for("react.suspense_list"),qd=Symbol.for("react.memo"),aa=Symbol.for("react.lazy"),ah=Symbol.for("react.activity"),eS=Symbol.for("react.memo_cache_sentinel"),um=Symbol.iterator;function Gr(e){return e===null||typeof e!="object"?null:(e=um&&e[um]||e["@@iterator"],typeof e=="function"?e:null)}var nS=Symbol.for("react.client.reference");function sh(e){if(e==null)return null;if(typeof e=="function")return e.$$typeof===nS?null:e.displayName||e.name||null;if(typeof e=="string")return e;switch(e){case Gs:return"Fragment";case eh:return"Profiler";case u_:return"StrictMode";case nh:return"Suspense";case ih:return"SuspenseList";case ah:return"Activity"}if(typeof e=="object")switch(e.$$typeof){case io:return"Portal";case Pi:return e.displayName||"Context";case f_:return(e._context.displayName||"Context")+".Consumer";case Wd:var t=e.render;return e=e.displayName,e||(e=t.displayName||t.name||"",e=e!==""?"ForwardRef("+e+")":"ForwardRef"),e;case qd:return t=e.displayName||null,t!==null?t:sh(e.type)||"Memo";case aa:t=e._payload,e=e._init;try{return sh(e(t))}catch{}}return null}var ao=Array.isArray,Pt=s_.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,ie=Jy.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,ts={pending:!1,data:null,method:null,action:null},rh=[],Vs=-1;function yi(e){return{current:e}}function Xe(e){0>Vs||(e.current=rh[Vs],rh[Vs]=null,Vs--)}function _e(e,t){Vs++,rh[Vs]=e.current,e.current=t}var vi=yi(null),To=yi(null),_a=yi(null),bc=yi(null);function Tc(e,t){switch(_e(_a,t),_e(To,e),_e(vi,null),t.nodeType){case 9:case 11:e=(e=t.documentElement)&&(e=e.namespaceURI)?gg(e):0;break;default:if(e=t.tagName,t=t.namespaceURI)t=gg(t),e=Nx(t,e);else switch(e){case"svg":e=1;break;case"math":e=2;break;default:e=0}}Xe(vi),_e(vi,e)}function mr(){Xe(vi),Xe(To),Xe(_a)}function oh(e){e.memoizedState!==null&&_e(bc,e);var t=vi.current,n=Nx(t,e.type);t!==n&&(_e(To,e),_e(vi,n))}function Ac(e){To.current===e&&(Xe(vi),Xe(To)),bc.current===e&&(Xe(bc),zo._currentValue=ts)}var Ou,fm;function ja(e){if(Ou===void 0)try{throw Error()}catch(n){var t=n.stack.trim().match(/\n( *(at )?)/);Ou=t&&t[1]||"",fm=-1<n.stack.indexOf(`
    at`)?" (<anonymous>)":-1<n.stack.indexOf("@")?"@unknown:0:0":""}return`
`+Ou+e+fm}var Pu=!1;function zu(e,t){if(!e||Pu)return"";Pu=!0;var n=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{var i={DetermineComponentFrameRoot:function(){try{if(t){var d=function(){throw Error()};if(Object.defineProperty(d.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(d,[])}catch(p){var f=p}Reflect.construct(e,[],d)}else{try{d.call()}catch(p){f=p}e.call(d.prototype)}}else{try{throw Error()}catch(p){f=p}(d=e())&&typeof d.catch=="function"&&d.catch(function(){})}}catch(p){if(p&&f&&typeof p.stack=="string")return[p.stack,f.stack]}return[null,null]}};i.DetermineComponentFrameRoot.displayName="DetermineComponentFrameRoot";var a=Object.getOwnPropertyDescriptor(i.DetermineComponentFrameRoot,"name");a&&a.configurable&&Object.defineProperty(i.DetermineComponentFrameRoot,"name",{value:"DetermineComponentFrameRoot"});var s=i.DetermineComponentFrameRoot(),r=s[0],o=s[1];if(r&&o){var l=r.split(`
`),c=o.split(`
`);for(a=i=0;i<l.length&&!l[i].includes("DetermineComponentFrameRoot");)i++;for(;a<c.length&&!c[a].includes("DetermineComponentFrameRoot");)a++;if(i===l.length||a===c.length)for(i=l.length-1,a=c.length-1;1<=i&&0<=a&&l[i]!==c[a];)a--;for(;1<=i&&0<=a;i--,a--)if(l[i]!==c[a]){if(i!==1||a!==1)do if(i--,a--,0>a||l[i]!==c[a]){var h=`
`+l[i].replace(" at new "," at ");return e.displayName&&h.includes("<anonymous>")&&(h=h.replace("<anonymous>",e.displayName)),h}while(1<=i&&0<=a);break}}}finally{Pu=!1,Error.prepareStackTrace=n}return(n=e?e.displayName||e.name:"")?ja(n):""}function iS(e,t){switch(e.tag){case 26:case 27:case 5:return ja(e.type);case 16:return ja("Lazy");case 13:return e.child!==t&&t!==null?ja("Suspense Fallback"):ja("Suspense");case 19:return ja("SuspenseList");case 0:case 15:return zu(e.type,!1);case 11:return zu(e.type.render,!1);case 1:return zu(e.type,!0);case 31:return ja("Activity");default:return""}}function hm(e){try{var t="",n=null;do t+=iS(e,n),n=e,e=e.return;while(e);return t}catch(i){return`
Error generating stack: `+i.message+`
`+i.stack}}var lh=Object.prototype.hasOwnProperty,Yd=Fe.unstable_scheduleCallback,Iu=Fe.unstable_cancelCallback,aS=Fe.unstable_shouldYield,sS=Fe.unstable_requestPaint,Pn=Fe.unstable_now,rS=Fe.unstable_getCurrentPriorityLevel,h_=Fe.unstable_ImmediatePriority,d_=Fe.unstable_UserBlockingPriority,Rc=Fe.unstable_NormalPriority,oS=Fe.unstable_LowPriority,p_=Fe.unstable_IdlePriority,lS=Fe.log,cS=Fe.unstable_setDisableYieldValue,Go=null,zn=null;function ha(e){if(typeof lS=="function"&&cS(e),zn&&typeof zn.setStrictMode=="function")try{zn.setStrictMode(Go,e)}catch{}}var In=Math.clz32?Math.clz32:hS,uS=Math.log,fS=Math.LN2;function hS(e){return e>>>=0,e===0?32:31-(uS(e)/fS|0)|0}var fl=256,hl=262144,dl=4194304;function Xa(e){var t=e&42;if(t!==0)return t;switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:return 64;case 128:return 128;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:return e&261888;case 262144:case 524288:case 1048576:case 2097152:return e&3932160;case 4194304:case 8388608:case 16777216:case 33554432:return e&62914560;case 67108864:return 67108864;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 0;default:return e}}function uu(e,t,n){var i=e.pendingLanes;if(i===0)return 0;var a=0,s=e.suspendedLanes,r=e.pingedLanes;e=e.warmLanes;var o=i&134217727;return o!==0?(i=o&~s,i!==0?a=Xa(i):(r&=o,r!==0?a=Xa(r):n||(n=o&~e,n!==0&&(a=Xa(n))))):(o=i&~s,o!==0?a=Xa(o):r!==0?a=Xa(r):n||(n=i&~e,n!==0&&(a=Xa(n)))),a===0?0:t!==0&&t!==a&&!(t&s)&&(s=a&-a,n=t&-t,s>=n||s===32&&(n&4194048)!==0)?t:a}function Vo(e,t){return(e.pendingLanes&~(e.suspendedLanes&~e.pingedLanes)&t)===0}function dS(e,t){switch(e){case 1:case 2:case 4:case 8:case 64:return t+250;case 16:case 32:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t+5e3;case 4194304:case 8388608:case 16777216:case 33554432:return-1;case 67108864:case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function m_(){var e=dl;return dl<<=1,!(dl&62914560)&&(dl=4194304),e}function Bu(e){for(var t=[],n=0;31>n;n++)t.push(e);return t}function ko(e,t){e.pendingLanes|=t,t!==268435456&&(e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0)}function pS(e,t,n,i,a,s){var r=e.pendingLanes;e.pendingLanes=n,e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0,e.expiredLanes&=n,e.entangledLanes&=n,e.errorRecoveryDisabledLanes&=n,e.shellSuspendCounter=0;var o=e.entanglements,l=e.expirationTimes,c=e.hiddenUpdates;for(n=r&~n;0<n;){var h=31-In(n),d=1<<h;o[h]=0,l[h]=-1;var f=c[h];if(f!==null)for(c[h]=null,h=0;h<f.length;h++){var p=f[h];p!==null&&(p.lane&=-536870913)}n&=~d}i!==0&&g_(e,i,0),s!==0&&a===0&&e.tag!==0&&(e.suspendedLanes|=s&~(r&~t))}function g_(e,t,n){e.pendingLanes|=t,e.suspendedLanes&=~t;var i=31-In(t);e.entangledLanes|=t,e.entanglements[i]=e.entanglements[i]|1073741824|n&261930}function __(e,t){var n=e.entangledLanes|=t;for(e=e.entanglements;n;){var i=31-In(n),a=1<<i;a&t|e[i]&t&&(e[i]|=t),n&=~a}}function v_(e,t){var n=t&-t;return n=n&42?1:Zd(n),n&(e.suspendedLanes|t)?0:n}function Zd(e){switch(e){case 2:e=1;break;case 8:e=4;break;case 32:e=16;break;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:e=128;break;case 268435456:e=134217728;break;default:e=0}return e}function Kd(e){return e&=-e,2<e?8<e?e&134217727?32:268435456:8:2}function x_(){var e=ie.p;return e!==0?e:(e=window.event,e===void 0?32:Vx(e.type))}function dm(e,t){var n=ie.p;try{return ie.p=e,t()}finally{ie.p=n}}var Oa=Math.random().toString(36).slice(2),Ze="__reactFiber$"+Oa,En="__reactProps$"+Oa,Lr="__reactContainer$"+Oa,ch="__reactEvents$"+Oa,mS="__reactListeners$"+Oa,gS="__reactHandles$"+Oa,pm="__reactResources$"+Oa,jo="__reactMarker$"+Oa;function Qd(e){delete e[Ze],delete e[En],delete e[ch],delete e[mS],delete e[gS]}function ks(e){var t=e[Ze];if(t)return t;for(var n=e.parentNode;n;){if(t=n[Lr]||n[Ze]){if(n=t.alternate,t.child!==null||n!==null&&n.child!==null)for(e=Sg(e);e!==null;){if(n=e[Ze])return n;e=Sg(e)}return t}e=n,n=e.parentNode}return null}function Or(e){if(e=e[Ze]||e[Lr]){var t=e.tag;if(t===5||t===6||t===13||t===31||t===26||t===27||t===3)return e}return null}function so(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e.stateNode;throw Error($(33))}function ar(e){var t=e[pm];return t||(t=e[pm]={hoistableStyles:new Map,hoistableScripts:new Map}),t}function je(e){e[jo]=!0}var y_=new Set,S_={};function ds(e,t){gr(e,t),gr(e+"Capture",t)}function gr(e,t){for(S_[e]=t,e=0;e<t.length;e++)y_.add(t[e])}var _S=RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"),mm={},gm={};function vS(e){return lh.call(gm,e)?!0:lh.call(mm,e)?!1:_S.test(e)?gm[e]=!0:(mm[e]=!0,!1)}function tc(e,t,n){if(vS(t))if(n===null)e.removeAttribute(t);else{switch(typeof n){case"undefined":case"function":case"symbol":e.removeAttribute(t);return;case"boolean":var i=t.toLowerCase().slice(0,5);if(i!=="data-"&&i!=="aria-"){e.removeAttribute(t);return}}e.setAttribute(t,""+n)}}function pl(e,t,n){if(n===null)e.removeAttribute(t);else{switch(typeof n){case"undefined":case"function":case"symbol":case"boolean":e.removeAttribute(t);return}e.setAttribute(t,""+n)}}function Mi(e,t,n,i){if(i===null)e.removeAttribute(n);else{switch(typeof i){case"undefined":case"function":case"symbol":case"boolean":e.removeAttribute(n);return}e.setAttributeNS(t,n,""+i)}}function Wn(e){switch(typeof e){case"bigint":case"boolean":case"number":case"string":case"undefined":return e;case"object":return e;default:return""}}function M_(e){var t=e.type;return(e=e.nodeName)&&e.toLowerCase()==="input"&&(t==="checkbox"||t==="radio")}function xS(e,t,n){var i=Object.getOwnPropertyDescriptor(e.constructor.prototype,t);if(!e.hasOwnProperty(t)&&typeof i<"u"&&typeof i.get=="function"&&typeof i.set=="function"){var a=i.get,s=i.set;return Object.defineProperty(e,t,{configurable:!0,get:function(){return a.call(this)},set:function(r){n=""+r,s.call(this,r)}}),Object.defineProperty(e,t,{enumerable:i.enumerable}),{getValue:function(){return n},setValue:function(r){n=""+r},stopTracking:function(){e._valueTracker=null,delete e[t]}}}}function uh(e){if(!e._valueTracker){var t=M_(e)?"checked":"value";e._valueTracker=xS(e,t,""+e[t])}}function E_(e){if(!e)return!1;var t=e._valueTracker;if(!t)return!0;var n=t.getValue(),i="";return e&&(i=M_(e)?e.checked?"true":"false":e.value),e=i,e!==n?(t.setValue(e),!0):!1}function wc(e){if(e=e||(typeof document<"u"?document:void 0),typeof e>"u")return null;try{return e.activeElement||e.body}catch{return e.body}}var yS=/[\n"\\]/g;function Zn(e){return e.replace(yS,function(t){return"\\"+t.charCodeAt(0).toString(16)+" "})}function fh(e,t,n,i,a,s,r,o){e.name="",r!=null&&typeof r!="function"&&typeof r!="symbol"&&typeof r!="boolean"?e.type=r:e.removeAttribute("type"),t!=null?r==="number"?(t===0&&e.value===""||e.value!=t)&&(e.value=""+Wn(t)):e.value!==""+Wn(t)&&(e.value=""+Wn(t)):r!=="submit"&&r!=="reset"||e.removeAttribute("value"),t!=null?hh(e,r,Wn(t)):n!=null?hh(e,r,Wn(n)):i!=null&&e.removeAttribute("value"),a==null&&s!=null&&(e.defaultChecked=!!s),a!=null&&(e.checked=a&&typeof a!="function"&&typeof a!="symbol"),o!=null&&typeof o!="function"&&typeof o!="symbol"&&typeof o!="boolean"?e.name=""+Wn(o):e.removeAttribute("name")}function b_(e,t,n,i,a,s,r,o){if(s!=null&&typeof s!="function"&&typeof s!="symbol"&&typeof s!="boolean"&&(e.type=s),t!=null||n!=null){if(!(s!=="submit"&&s!=="reset"||t!=null)){uh(e);return}n=n!=null?""+Wn(n):"",t=t!=null?""+Wn(t):n,o||t===e.value||(e.value=t),e.defaultValue=t}i=i??a,i=typeof i!="function"&&typeof i!="symbol"&&!!i,e.checked=o?e.checked:!!i,e.defaultChecked=!!i,r!=null&&typeof r!="function"&&typeof r!="symbol"&&typeof r!="boolean"&&(e.name=r),uh(e)}function hh(e,t,n){t==="number"&&wc(e.ownerDocument)===e||e.defaultValue===""+n||(e.defaultValue=""+n)}function sr(e,t,n,i){if(e=e.options,t){t={};for(var a=0;a<n.length;a++)t["$"+n[a]]=!0;for(n=0;n<e.length;n++)a=t.hasOwnProperty("$"+e[n].value),e[n].selected!==a&&(e[n].selected=a),a&&i&&(e[n].defaultSelected=!0)}else{for(n=""+Wn(n),t=null,a=0;a<e.length;a++){if(e[a].value===n){e[a].selected=!0,i&&(e[a].defaultSelected=!0);return}t!==null||e[a].disabled||(t=e[a])}t!==null&&(t.selected=!0)}}function T_(e,t,n){if(t!=null&&(t=""+Wn(t),t!==e.value&&(e.value=t),n==null)){e.defaultValue!==t&&(e.defaultValue=t);return}e.defaultValue=n!=null?""+Wn(n):""}function A_(e,t,n,i){if(t==null){if(i!=null){if(n!=null)throw Error($(92));if(ao(i)){if(1<i.length)throw Error($(93));i=i[0]}n=i}n==null&&(n=""),t=n}n=Wn(t),e.defaultValue=n,i=e.textContent,i===n&&i!==""&&i!==null&&(e.value=i),uh(e)}function _r(e,t){if(t){var n=e.firstChild;if(n&&n===e.lastChild&&n.nodeType===3){n.nodeValue=t;return}}e.textContent=t}var SS=new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));function _m(e,t,n){var i=t.indexOf("--")===0;n==null||typeof n=="boolean"||n===""?i?e.setProperty(t,""):t==="float"?e.cssFloat="":e[t]="":i?e.setProperty(t,n):typeof n!="number"||n===0||SS.has(t)?t==="float"?e.cssFloat=n:e[t]=(""+n).trim():e[t]=n+"px"}function R_(e,t,n){if(t!=null&&typeof t!="object")throw Error($(62));if(e=e.style,n!=null){for(var i in n)!n.hasOwnProperty(i)||t!=null&&t.hasOwnProperty(i)||(i.indexOf("--")===0?e.setProperty(i,""):i==="float"?e.cssFloat="":e[i]="");for(var a in t)i=t[a],t.hasOwnProperty(a)&&n[a]!==i&&_m(e,a,i)}else for(var s in t)t.hasOwnProperty(s)&&_m(e,s,t[s])}function Jd(e){if(e.indexOf("-")===-1)return!1;switch(e){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var MS=new Map([["acceptCharset","accept-charset"],["htmlFor","for"],["httpEquiv","http-equiv"],["crossOrigin","crossorigin"],["accentHeight","accent-height"],["alignmentBaseline","alignment-baseline"],["arabicForm","arabic-form"],["baselineShift","baseline-shift"],["capHeight","cap-height"],["clipPath","clip-path"],["clipRule","clip-rule"],["colorInterpolation","color-interpolation"],["colorInterpolationFilters","color-interpolation-filters"],["colorProfile","color-profile"],["colorRendering","color-rendering"],["dominantBaseline","dominant-baseline"],["enableBackground","enable-background"],["fillOpacity","fill-opacity"],["fillRule","fill-rule"],["floodColor","flood-color"],["floodOpacity","flood-opacity"],["fontFamily","font-family"],["fontSize","font-size"],["fontSizeAdjust","font-size-adjust"],["fontStretch","font-stretch"],["fontStyle","font-style"],["fontVariant","font-variant"],["fontWeight","font-weight"],["glyphName","glyph-name"],["glyphOrientationHorizontal","glyph-orientation-horizontal"],["glyphOrientationVertical","glyph-orientation-vertical"],["horizAdvX","horiz-adv-x"],["horizOriginX","horiz-origin-x"],["imageRendering","image-rendering"],["letterSpacing","letter-spacing"],["lightingColor","lighting-color"],["markerEnd","marker-end"],["markerMid","marker-mid"],["markerStart","marker-start"],["overlinePosition","overline-position"],["overlineThickness","overline-thickness"],["paintOrder","paint-order"],["panose-1","panose-1"],["pointerEvents","pointer-events"],["renderingIntent","rendering-intent"],["shapeRendering","shape-rendering"],["stopColor","stop-color"],["stopOpacity","stop-opacity"],["strikethroughPosition","strikethrough-position"],["strikethroughThickness","strikethrough-thickness"],["strokeDasharray","stroke-dasharray"],["strokeDashoffset","stroke-dashoffset"],["strokeLinecap","stroke-linecap"],["strokeLinejoin","stroke-linejoin"],["strokeMiterlimit","stroke-miterlimit"],["strokeOpacity","stroke-opacity"],["strokeWidth","stroke-width"],["textAnchor","text-anchor"],["textDecoration","text-decoration"],["textRendering","text-rendering"],["transformOrigin","transform-origin"],["underlinePosition","underline-position"],["underlineThickness","underline-thickness"],["unicodeBidi","unicode-bidi"],["unicodeRange","unicode-range"],["unitsPerEm","units-per-em"],["vAlphabetic","v-alphabetic"],["vHanging","v-hanging"],["vIdeographic","v-ideographic"],["vMathematical","v-mathematical"],["vectorEffect","vector-effect"],["vertAdvY","vert-adv-y"],["vertOriginX","vert-origin-x"],["vertOriginY","vert-origin-y"],["wordSpacing","word-spacing"],["writingMode","writing-mode"],["xmlnsXlink","xmlns:xlink"],["xHeight","x-height"]]),ES=/^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;function ec(e){return ES.test(""+e)?"javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')":e}function zi(){}var dh=null;function $d(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var js=null,rr=null;function vm(e){var t=Or(e);if(t&&(e=t.stateNode)){var n=e[En]||null;t:switch(e=t.stateNode,t.type){case"input":if(fh(e,n.value,n.defaultValue,n.defaultValue,n.checked,n.defaultChecked,n.type,n.name),t=n.name,n.type==="radio"&&t!=null){for(n=e;n.parentNode;)n=n.parentNode;for(n=n.querySelectorAll('input[name="'+Zn(""+t)+'"][type="radio"]'),t=0;t<n.length;t++){var i=n[t];if(i!==e&&i.form===e.form){var a=i[En]||null;if(!a)throw Error($(90));fh(i,a.value,a.defaultValue,a.defaultValue,a.checked,a.defaultChecked,a.type,a.name)}}for(t=0;t<n.length;t++)i=n[t],i.form===e.form&&E_(i)}break t;case"textarea":T_(e,n.value,n.defaultValue);break t;case"select":t=n.value,t!=null&&sr(e,!!n.multiple,t,!1)}}}var Fu=!1;function w_(e,t,n){if(Fu)return e(t,n);Fu=!0;try{var i=e(t);return i}finally{if(Fu=!1,(js!==null||rr!==null)&&(Mu(),js&&(t=js,e=rr,rr=js=null,vm(t),e)))for(t=0;t<e.length;t++)vm(e[t])}}function Ao(e,t){var n=e.stateNode;if(n===null)return null;var i=n[En]||null;if(i===null)return null;n=i[t];t:switch(t){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(i=!i.disabled)||(e=e.type,i=!(e==="button"||e==="input"||e==="select"||e==="textarea")),e=!i;break t;default:e=!1}if(e)return null;if(n&&typeof n!="function")throw Error($(231,t,typeof n));return n}var ki=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),ph=!1;if(ki)try{var Vr={};Object.defineProperty(Vr,"passive",{get:function(){ph=!0}}),window.addEventListener("test",Vr,Vr),window.removeEventListener("test",Vr,Vr)}catch{ph=!1}var da=null,tp=null,nc=null;function C_(){if(nc)return nc;var e,t=tp,n=t.length,i,a="value"in da?da.value:da.textContent,s=a.length;for(e=0;e<n&&t[e]===a[e];e++);var r=n-e;for(i=1;i<=r&&t[n-i]===a[s-i];i++);return nc=a.slice(e,1<i?1-i:void 0)}function ic(e){var t=e.keyCode;return"charCode"in e?(e=e.charCode,e===0&&t===13&&(e=13)):e=t,e===10&&(e=13),32<=e||e===13?e:0}function ml(){return!0}function xm(){return!1}function bn(e){function t(n,i,a,s,r){this._reactName=n,this._targetInst=a,this.type=i,this.nativeEvent=s,this.target=r,this.currentTarget=null;for(var o in e)e.hasOwnProperty(o)&&(n=e[o],this[o]=n?n(s):s[o]);return this.isDefaultPrevented=(s.defaultPrevented!=null?s.defaultPrevented:s.returnValue===!1)?ml:xm,this.isPropagationStopped=xm,this}return be(t.prototype,{preventDefault:function(){this.defaultPrevented=!0;var n=this.nativeEvent;n&&(n.preventDefault?n.preventDefault():typeof n.returnValue!="unknown"&&(n.returnValue=!1),this.isDefaultPrevented=ml)},stopPropagation:function(){var n=this.nativeEvent;n&&(n.stopPropagation?n.stopPropagation():typeof n.cancelBubble!="unknown"&&(n.cancelBubble=!0),this.isPropagationStopped=ml)},persist:function(){},isPersistent:ml}),t}var ps={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},fu=bn(ps),Xo=be({},ps,{view:0,detail:0}),bS=bn(Xo),Hu,Gu,kr,hu=be({},Xo,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:ep,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return"movementX"in e?e.movementX:(e!==kr&&(kr&&e.type==="mousemove"?(Hu=e.screenX-kr.screenX,Gu=e.screenY-kr.screenY):Gu=Hu=0,kr=e),Hu)},movementY:function(e){return"movementY"in e?e.movementY:Gu}}),ym=bn(hu),TS=be({},hu,{dataTransfer:0}),AS=bn(TS),RS=be({},Xo,{relatedTarget:0}),Vu=bn(RS),wS=be({},ps,{animationName:0,elapsedTime:0,pseudoElement:0}),CS=bn(wS),DS=be({},ps,{clipboardData:function(e){return"clipboardData"in e?e.clipboardData:window.clipboardData}}),NS=bn(DS),US=be({},ps,{data:0}),Sm=bn(US),LS={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},OS={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},PS={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function zS(e){var t=this.nativeEvent;return t.getModifierState?t.getModifierState(e):(e=PS[e])?!!t[e]:!1}function ep(){return zS}var IS=be({},Xo,{key:function(e){if(e.key){var t=LS[e.key]||e.key;if(t!=="Unidentified")return t}return e.type==="keypress"?(e=ic(e),e===13?"Enter":String.fromCharCode(e)):e.type==="keydown"||e.type==="keyup"?OS[e.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:ep,charCode:function(e){return e.type==="keypress"?ic(e):0},keyCode:function(e){return e.type==="keydown"||e.type==="keyup"?e.keyCode:0},which:function(e){return e.type==="keypress"?ic(e):e.type==="keydown"||e.type==="keyup"?e.keyCode:0}}),BS=bn(IS),FS=be({},hu,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),Mm=bn(FS),HS=be({},Xo,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:ep}),GS=bn(HS),VS=be({},ps,{propertyName:0,elapsedTime:0,pseudoElement:0}),kS=bn(VS),jS=be({},hu,{deltaX:function(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0},deltaY:function(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0}),XS=bn(jS),WS=be({},ps,{newState:0,oldState:0}),qS=bn(WS),YS=[9,13,27,32],np=ki&&"CompositionEvent"in window,uo=null;ki&&"documentMode"in document&&(uo=document.documentMode);var ZS=ki&&"TextEvent"in window&&!uo,D_=ki&&(!np||uo&&8<uo&&11>=uo),Em=" ",bm=!1;function N_(e,t){switch(e){case"keyup":return YS.indexOf(t.keyCode)!==-1;case"keydown":return t.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function U_(e){return e=e.detail,typeof e=="object"&&"data"in e?e.data:null}var Xs=!1;function KS(e,t){switch(e){case"compositionend":return U_(t);case"keypress":return t.which!==32?null:(bm=!0,Em);case"textInput":return e=t.data,e===Em&&bm?null:e;default:return null}}function QS(e,t){if(Xs)return e==="compositionend"||!np&&N_(e,t)?(e=C_(),nc=tp=da=null,Xs=!1,e):null;switch(e){case"paste":return null;case"keypress":if(!(t.ctrlKey||t.altKey||t.metaKey)||t.ctrlKey&&t.altKey){if(t.char&&1<t.char.length)return t.char;if(t.which)return String.fromCharCode(t.which)}return null;case"compositionend":return D_&&t.locale!=="ko"?null:t.data;default:return null}}var JS={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function Tm(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t==="input"?!!JS[e.type]:t==="textarea"}function L_(e,t,n,i){js?rr?rr.push(i):rr=[i]:js=i,t=Wc(t,"onChange"),0<t.length&&(n=new fu("onChange","change",null,n,i),e.push({event:n,listeners:t}))}var fo=null,Ro=null;function $S(e){wx(e,0)}function du(e){var t=so(e);if(E_(t))return e}function Am(e,t){if(e==="change")return t}var O_=!1;if(ki){var ku;if(ki){var ju="oninput"in document;if(!ju){var Rm=document.createElement("div");Rm.setAttribute("oninput","return;"),ju=typeof Rm.oninput=="function"}ku=ju}else ku=!1;O_=ku&&(!document.documentMode||9<document.documentMode)}function wm(){fo&&(fo.detachEvent("onpropertychange",P_),Ro=fo=null)}function P_(e){if(e.propertyName==="value"&&du(Ro)){var t=[];L_(t,Ro,e,$d(e)),w_($S,t)}}function tM(e,t,n){e==="focusin"?(wm(),fo=t,Ro=n,fo.attachEvent("onpropertychange",P_)):e==="focusout"&&wm()}function eM(e){if(e==="selectionchange"||e==="keyup"||e==="keydown")return du(Ro)}function nM(e,t){if(e==="click")return du(t)}function iM(e,t){if(e==="input"||e==="change")return du(t)}function aM(e,t){return e===t&&(e!==0||1/e===1/t)||e!==e&&t!==t}var Fn=typeof Object.is=="function"?Object.is:aM;function wo(e,t){if(Fn(e,t))return!0;if(typeof e!="object"||e===null||typeof t!="object"||t===null)return!1;var n=Object.keys(e),i=Object.keys(t);if(n.length!==i.length)return!1;for(i=0;i<n.length;i++){var a=n[i];if(!lh.call(t,a)||!Fn(e[a],t[a]))return!1}return!0}function Cm(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function Dm(e,t){var n=Cm(e);e=0;for(var i;n;){if(n.nodeType===3){if(i=e+n.textContent.length,e<=t&&i>=t)return{node:n,offset:t-e};e=i}t:{for(;n;){if(n.nextSibling){n=n.nextSibling;break t}n=n.parentNode}n=void 0}n=Cm(n)}}function z_(e,t){return e&&t?e===t?!0:e&&e.nodeType===3?!1:t&&t.nodeType===3?z_(e,t.parentNode):"contains"in e?e.contains(t):e.compareDocumentPosition?!!(e.compareDocumentPosition(t)&16):!1:!1}function I_(e){e=e!=null&&e.ownerDocument!=null&&e.ownerDocument.defaultView!=null?e.ownerDocument.defaultView:window;for(var t=wc(e.document);t instanceof e.HTMLIFrameElement;){try{var n=typeof t.contentWindow.location.href=="string"}catch{n=!1}if(n)e=t.contentWindow;else break;t=wc(e.document)}return t}function ip(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t&&(t==="input"&&(e.type==="text"||e.type==="search"||e.type==="tel"||e.type==="url"||e.type==="password")||t==="textarea"||e.contentEditable==="true")}var sM=ki&&"documentMode"in document&&11>=document.documentMode,Ws=null,mh=null,ho=null,gh=!1;function Nm(e,t,n){var i=n.window===n?n.document:n.nodeType===9?n:n.ownerDocument;gh||Ws==null||Ws!==wc(i)||(i=Ws,"selectionStart"in i&&ip(i)?i={start:i.selectionStart,end:i.selectionEnd}:(i=(i.ownerDocument&&i.ownerDocument.defaultView||window).getSelection(),i={anchorNode:i.anchorNode,anchorOffset:i.anchorOffset,focusNode:i.focusNode,focusOffset:i.focusOffset}),ho&&wo(ho,i)||(ho=i,i=Wc(mh,"onSelect"),0<i.length&&(t=new fu("onSelect","select",null,t,n),e.push({event:t,listeners:i}),t.target=Ws)))}function Ia(e,t){var n={};return n[e.toLowerCase()]=t.toLowerCase(),n["Webkit"+e]="webkit"+t,n["Moz"+e]="moz"+t,n}var qs={animationend:Ia("Animation","AnimationEnd"),animationiteration:Ia("Animation","AnimationIteration"),animationstart:Ia("Animation","AnimationStart"),transitionrun:Ia("Transition","TransitionRun"),transitionstart:Ia("Transition","TransitionStart"),transitioncancel:Ia("Transition","TransitionCancel"),transitionend:Ia("Transition","TransitionEnd")},Xu={},B_={};ki&&(B_=document.createElement("div").style,"AnimationEvent"in window||(delete qs.animationend.animation,delete qs.animationiteration.animation,delete qs.animationstart.animation),"TransitionEvent"in window||delete qs.transitionend.transition);function ms(e){if(Xu[e])return Xu[e];if(!qs[e])return e;var t=qs[e],n;for(n in t)if(t.hasOwnProperty(n)&&n in B_)return Xu[e]=t[n];return e}var F_=ms("animationend"),H_=ms("animationiteration"),G_=ms("animationstart"),rM=ms("transitionrun"),oM=ms("transitionstart"),lM=ms("transitioncancel"),V_=ms("transitionend"),k_=new Map,_h="abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");_h.push("scrollEnd");function fi(e,t){k_.set(e,t),ds(t,[e])}var Cc=typeof reportError=="function"?reportError:function(e){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var t=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof e=="object"&&e!==null&&typeof e.message=="string"?String(e.message):String(e),error:e});if(!window.dispatchEvent(t))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",e);return}console.error(e)},Xn=[],Ys=0,ap=0;function pu(){for(var e=Ys,t=ap=Ys=0;t<e;){var n=Xn[t];Xn[t++]=null;var i=Xn[t];Xn[t++]=null;var a=Xn[t];Xn[t++]=null;var s=Xn[t];if(Xn[t++]=null,i!==null&&a!==null){var r=i.pending;r===null?a.next=a:(a.next=r.next,r.next=a),i.pending=a}s!==0&&j_(n,a,s)}}function mu(e,t,n,i){Xn[Ys++]=e,Xn[Ys++]=t,Xn[Ys++]=n,Xn[Ys++]=i,ap|=i,e.lanes|=i,e=e.alternate,e!==null&&(e.lanes|=i)}function sp(e,t,n,i){return mu(e,t,n,i),Dc(e)}function gs(e,t){return mu(e,null,null,t),Dc(e)}function j_(e,t,n){e.lanes|=n;var i=e.alternate;i!==null&&(i.lanes|=n);for(var a=!1,s=e.return;s!==null;)s.childLanes|=n,i=s.alternate,i!==null&&(i.childLanes|=n),s.tag===22&&(e=s.stateNode,e===null||e._visibility&1||(a=!0)),e=s,s=s.return;return e.tag===3?(s=e.stateNode,a&&t!==null&&(a=31-In(n),e=s.hiddenUpdates,i=e[a],i===null?e[a]=[t]:i.push(t),t.lane=n|536870912),s):null}function Dc(e){if(50<Mo)throw Mo=0,Bh=null,Error($(185));for(var t=e.return;t!==null;)e=t,t=e.return;return e.tag===3?e.stateNode:null}var Zs={};function cM(e,t,n,i){this.tag=e,this.key=n,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.refCleanup=this.ref=null,this.pendingProps=t,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=i,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function Ln(e,t,n,i){return new cM(e,t,n,i)}function rp(e){return e=e.prototype,!(!e||!e.isReactComponent)}function Hi(e,t){var n=e.alternate;return n===null?(n=Ln(e.tag,t,e.key,e.mode),n.elementType=e.elementType,n.type=e.type,n.stateNode=e.stateNode,n.alternate=e,e.alternate=n):(n.pendingProps=t,n.type=e.type,n.flags=0,n.subtreeFlags=0,n.deletions=null),n.flags=e.flags&65011712,n.childLanes=e.childLanes,n.lanes=e.lanes,n.child=e.child,n.memoizedProps=e.memoizedProps,n.memoizedState=e.memoizedState,n.updateQueue=e.updateQueue,t=e.dependencies,n.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext},n.sibling=e.sibling,n.index=e.index,n.ref=e.ref,n.refCleanup=e.refCleanup,n}function X_(e,t){e.flags&=65011714;var n=e.alternate;return n===null?(e.childLanes=0,e.lanes=t,e.child=null,e.subtreeFlags=0,e.memoizedProps=null,e.memoizedState=null,e.updateQueue=null,e.dependencies=null,e.stateNode=null):(e.childLanes=n.childLanes,e.lanes=n.lanes,e.child=n.child,e.subtreeFlags=0,e.deletions=null,e.memoizedProps=n.memoizedProps,e.memoizedState=n.memoizedState,e.updateQueue=n.updateQueue,e.type=n.type,t=n.dependencies,e.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext}),e}function ac(e,t,n,i,a,s){var r=0;if(i=e,typeof e=="function")rp(e)&&(r=1);else if(typeof e=="string")r=pE(e,n,vi.current)?26:e==="html"||e==="head"||e==="body"?27:5;else t:switch(e){case ah:return e=Ln(31,n,t,a),e.elementType=ah,e.lanes=s,e;case Gs:return es(n.children,a,s,t);case u_:r=8,a|=24;break;case eh:return e=Ln(12,n,t,a|2),e.elementType=eh,e.lanes=s,e;case nh:return e=Ln(13,n,t,a),e.elementType=nh,e.lanes=s,e;case ih:return e=Ln(19,n,t,a),e.elementType=ih,e.lanes=s,e;default:if(typeof e=="object"&&e!==null)switch(e.$$typeof){case Pi:r=10;break t;case f_:r=9;break t;case Wd:r=11;break t;case qd:r=14;break t;case aa:r=16,i=null;break t}r=29,n=Error($(130,e===null?"null":typeof e,"")),i=null}return t=Ln(r,n,t,a),t.elementType=e,t.type=i,t.lanes=s,t}function es(e,t,n,i){return e=Ln(7,e,i,t),e.lanes=n,e}function Wu(e,t,n){return e=Ln(6,e,null,t),e.lanes=n,e}function W_(e){var t=Ln(18,null,null,0);return t.stateNode=e,t}function qu(e,t,n){return t=Ln(4,e.children!==null?e.children:[],e.key,t),t.lanes=n,t.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},t}var Um=new WeakMap;function Kn(e,t){if(typeof e=="object"&&e!==null){var n=Um.get(e);return n!==void 0?n:(t={value:e,source:t,stack:hm(t)},Um.set(e,t),t)}return{value:e,source:t,stack:hm(t)}}var Ks=[],Qs=0,Nc=null,Co=0,qn=[],Yn=0,wa=null,mi=1,gi="";function Li(e,t){Ks[Qs++]=Co,Ks[Qs++]=Nc,Nc=e,Co=t}function q_(e,t,n){qn[Yn++]=mi,qn[Yn++]=gi,qn[Yn++]=wa,wa=e;var i=mi;e=gi;var a=32-In(i)-1;i&=~(1<<a),n+=1;var s=32-In(t)+a;if(30<s){var r=a-a%5;s=(i&(1<<r)-1).toString(32),i>>=r,a-=r,mi=1<<32-In(t)+a|n<<a|i,gi=s+e}else mi=1<<s|n<<a|i,gi=e}function op(e){e.return!==null&&(Li(e,1),q_(e,1,0))}function lp(e){for(;e===Nc;)Nc=Ks[--Qs],Ks[Qs]=null,Co=Ks[--Qs],Ks[Qs]=null;for(;e===wa;)wa=qn[--Yn],qn[Yn]=null,gi=qn[--Yn],qn[Yn]=null,mi=qn[--Yn],qn[Yn]=null}function Y_(e,t){qn[Yn++]=mi,qn[Yn++]=gi,qn[Yn++]=wa,mi=t.id,gi=t.overflow,wa=e}var Ke=null,Me=null,$t=!1,va=null,Qn=!1,vh=Error($(519));function Ca(e){var t=Error($(418,1<arguments.length&&arguments[1]!==void 0&&arguments[1]?"text":"HTML",""));throw Do(Kn(t,e)),vh}function Lm(e){var t=e.stateNode,n=e.type,i=e.memoizedProps;switch(t[Ze]=e,t[En]=i,n){case"dialog":Kt("cancel",t),Kt("close",t);break;case"iframe":case"object":case"embed":Kt("load",t);break;case"video":case"audio":for(n=0;n<Oo.length;n++)Kt(Oo[n],t);break;case"source":Kt("error",t);break;case"img":case"image":case"link":Kt("error",t),Kt("load",t);break;case"details":Kt("toggle",t);break;case"input":Kt("invalid",t),b_(t,i.value,i.defaultValue,i.checked,i.defaultChecked,i.type,i.name,!0);break;case"select":Kt("invalid",t);break;case"textarea":Kt("invalid",t),A_(t,i.value,i.defaultValue,i.children)}n=i.children,typeof n!="string"&&typeof n!="number"&&typeof n!="bigint"||t.textContent===""+n||i.suppressHydrationWarning===!0||Dx(t.textContent,n)?(i.popover!=null&&(Kt("beforetoggle",t),Kt("toggle",t)),i.onScroll!=null&&Kt("scroll",t),i.onScrollEnd!=null&&Kt("scrollend",t),i.onClick!=null&&(t.onclick=zi),t=!0):t=!1,t||Ca(e,!0)}function Om(e){for(Ke=e.return;Ke;)switch(Ke.tag){case 5:case 31:case 13:Qn=!1;return;case 27:case 3:Qn=!0;return;default:Ke=Ke.return}}function Ms(e){if(e!==Ke)return!1;if(!$t)return Om(e),$t=!0,!1;var t=e.tag,n;if((n=t!==3&&t!==27)&&((n=t===5)&&(n=e.type,n=!(n!=="form"&&n!=="button")||kh(e.type,e.memoizedProps)),n=!n),n&&Me&&Ca(e),Om(e),t===13){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error($(317));Me=yg(e)}else if(t===31){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error($(317));Me=yg(e)}else t===27?(t=Me,Pa(e.type)?(e=qh,qh=null,Me=e):Me=t):Me=Ke?ti(e.stateNode.nextSibling):null;return!0}function ss(){Me=Ke=null,$t=!1}function Yu(){var e=va;return e!==null&&(_n===null?_n=e:_n.push.apply(_n,e),va=null),e}function Do(e){va===null?va=[e]:va.push(e)}var xh=yi(null),_s=null,Ii=null;function oa(e,t,n){_e(xh,t._currentValue),t._currentValue=n}function Gi(e){e._currentValue=xh.current,Xe(xh)}function yh(e,t,n){for(;e!==null;){var i=e.alternate;if((e.childLanes&t)!==t?(e.childLanes|=t,i!==null&&(i.childLanes|=t)):i!==null&&(i.childLanes&t)!==t&&(i.childLanes|=t),e===n)break;e=e.return}}function Sh(e,t,n,i){var a=e.child;for(a!==null&&(a.return=e);a!==null;){var s=a.dependencies;if(s!==null){var r=a.child;s=s.firstContext;t:for(;s!==null;){var o=s;s=a;for(var l=0;l<t.length;l++)if(o.context===t[l]){s.lanes|=n,o=s.alternate,o!==null&&(o.lanes|=n),yh(s.return,n,e),i||(r=null);break t}s=o.next}}else if(a.tag===18){if(r=a.return,r===null)throw Error($(341));r.lanes|=n,s=r.alternate,s!==null&&(s.lanes|=n),yh(r,n,e),r=null}else r=a.child;if(r!==null)r.return=a;else for(r=a;r!==null;){if(r===e){r=null;break}if(a=r.sibling,a!==null){a.return=r.return,r=a;break}r=r.return}a=r}}function Pr(e,t,n,i){e=null;for(var a=t,s=!1;a!==null;){if(!s){if(a.flags&524288)s=!0;else if(a.flags&262144)break}if(a.tag===10){var r=a.alternate;if(r===null)throw Error($(387));if(r=r.memoizedProps,r!==null){var o=a.type;Fn(a.pendingProps.value,r.value)||(e!==null?e.push(o):e=[o])}}else if(a===bc.current){if(r=a.alternate,r===null)throw Error($(387));r.memoizedState.memoizedState!==a.memoizedState.memoizedState&&(e!==null?e.push(zo):e=[zo])}a=a.return}e!==null&&Sh(t,e,n,i),t.flags|=262144}function Uc(e){for(e=e.firstContext;e!==null;){if(!Fn(e.context._currentValue,e.memoizedValue))return!0;e=e.next}return!1}function rs(e){_s=e,Ii=null,e=e.dependencies,e!==null&&(e.firstContext=null)}function Qe(e){return Z_(_s,e)}function gl(e,t){return _s===null&&rs(e),Z_(e,t)}function Z_(e,t){var n=t._currentValue;if(t={context:t,memoizedValue:n,next:null},Ii===null){if(e===null)throw Error($(308));Ii=t,e.dependencies={lanes:0,firstContext:t},e.flags|=524288}else Ii=Ii.next=t;return n}var uM=typeof AbortController<"u"?AbortController:function(){var e=[],t=this.signal={aborted:!1,addEventListener:function(n,i){e.push(i)}};this.abort=function(){t.aborted=!0,e.forEach(function(n){return n()})}},fM=Fe.unstable_scheduleCallback,hM=Fe.unstable_NormalPriority,Pe={$$typeof:Pi,Consumer:null,Provider:null,_currentValue:null,_currentValue2:null,_threadCount:0};function cp(){return{controller:new uM,data:new Map,refCount:0}}function Wo(e){e.refCount--,e.refCount===0&&fM(hM,function(){e.controller.abort()})}var po=null,Mh=0,vr=0,or=null;function dM(e,t){if(po===null){var n=po=[];Mh=0,vr=Op(),or={status:"pending",value:void 0,then:function(i){n.push(i)}}}return Mh++,t.then(Pm,Pm),t}function Pm(){if(--Mh===0&&po!==null){or!==null&&(or.status="fulfilled");var e=po;po=null,vr=0,or=null;for(var t=0;t<e.length;t++)(0,e[t])()}}function pM(e,t){var n=[],i={status:"pending",value:null,reason:null,then:function(a){n.push(a)}};return e.then(function(){i.status="fulfilled",i.value=t;for(var a=0;a<n.length;a++)(0,n[a])(t)},function(a){for(i.status="rejected",i.reason=a,a=0;a<n.length;a++)(0,n[a])(void 0)}),i}var zm=Pt.S;Pt.S=function(e,t){cx=Pn(),typeof t=="object"&&t!==null&&typeof t.then=="function"&&dM(e,t),zm!==null&&zm(e,t)};var ns=yi(null);function up(){var e=ns.current;return e!==null?e:ge.pooledCache}function sc(e,t){t===null?_e(ns,ns.current):_e(ns,t.pool)}function K_(){var e=up();return e===null?null:{parent:Pe._currentValue,pool:e}}var zr=Error($(460)),fp=Error($(474)),gu=Error($(542)),Lc={then:function(){}};function Im(e){return e=e.status,e==="fulfilled"||e==="rejected"}function Q_(e,t,n){switch(n=e[n],n===void 0?e.push(t):n!==t&&(t.then(zi,zi),t=n),t.status){case"fulfilled":return t.value;case"rejected":throw e=t.reason,Fm(e),e;default:if(typeof t.status=="string")t.then(zi,zi);else{if(e=ge,e!==null&&100<e.shellSuspendCounter)throw Error($(482));e=t,e.status="pending",e.then(function(i){if(t.status==="pending"){var a=t;a.status="fulfilled",a.value=i}},function(i){if(t.status==="pending"){var a=t;a.status="rejected",a.reason=i}})}switch(t.status){case"fulfilled":return t.value;case"rejected":throw e=t.reason,Fm(e),e}throw is=t,zr}}function Wa(e){try{var t=e._init;return t(e._payload)}catch(n){throw n!==null&&typeof n=="object"&&typeof n.then=="function"?(is=n,zr):n}}var is=null;function Bm(){if(is===null)throw Error($(459));var e=is;return is=null,e}function Fm(e){if(e===zr||e===gu)throw Error($(483))}var lr=null,No=0;function _l(e){var t=No;return No+=1,lr===null&&(lr=[]),Q_(lr,e,t)}function jr(e,t){t=t.props.ref,e.ref=t!==void 0?t:null}function vl(e,t){throw t.$$typeof===tS?Error($(525)):(e=Object.prototype.toString.call(t),Error($(31,e==="[object Object]"?"object with keys {"+Object.keys(t).join(", ")+"}":e)))}function J_(e){function t(u,g){if(e){var _=u.deletions;_===null?(u.deletions=[g],u.flags|=16):_.push(g)}}function n(u,g){if(!e)return null;for(;g!==null;)t(u,g),g=g.sibling;return null}function i(u){for(var g=new Map;u!==null;)u.key!==null?g.set(u.key,u):g.set(u.index,u),u=u.sibling;return g}function a(u,g){return u=Hi(u,g),u.index=0,u.sibling=null,u}function s(u,g,_){return u.index=_,e?(_=u.alternate,_!==null?(_=_.index,_<g?(u.flags|=67108866,g):_):(u.flags|=67108866,g)):(u.flags|=1048576,g)}function r(u){return e&&u.alternate===null&&(u.flags|=67108866),u}function o(u,g,_,y){return g===null||g.tag!==6?(g=Wu(_,u.mode,y),g.return=u,g):(g=a(g,_),g.return=u,g)}function l(u,g,_,y){var L=_.type;return L===Gs?h(u,g,_.props.children,y,_.key):g!==null&&(g.elementType===L||typeof L=="object"&&L!==null&&L.$$typeof===aa&&Wa(L)===g.type)?(g=a(g,_.props),jr(g,_),g.return=u,g):(g=ac(_.type,_.key,_.props,null,u.mode,y),jr(g,_),g.return=u,g)}function c(u,g,_,y){return g===null||g.tag!==4||g.stateNode.containerInfo!==_.containerInfo||g.stateNode.implementation!==_.implementation?(g=qu(_,u.mode,y),g.return=u,g):(g=a(g,_.children||[]),g.return=u,g)}function h(u,g,_,y,L){return g===null||g.tag!==7?(g=es(_,u.mode,y,L),g.return=u,g):(g=a(g,_),g.return=u,g)}function d(u,g,_){if(typeof g=="string"&&g!==""||typeof g=="number"||typeof g=="bigint")return g=Wu(""+g,u.mode,_),g.return=u,g;if(typeof g=="object"&&g!==null){switch(g.$$typeof){case ul:return _=ac(g.type,g.key,g.props,null,u.mode,_),jr(_,g),_.return=u,_;case io:return g=qu(g,u.mode,_),g.return=u,g;case aa:return g=Wa(g),d(u,g,_)}if(ao(g)||Gr(g))return g=es(g,u.mode,_,null),g.return=u,g;if(typeof g.then=="function")return d(u,_l(g),_);if(g.$$typeof===Pi)return d(u,gl(u,g),_);vl(u,g)}return null}function f(u,g,_,y){var L=g!==null?g.key:null;if(typeof _=="string"&&_!==""||typeof _=="number"||typeof _=="bigint")return L!==null?null:o(u,g,""+_,y);if(typeof _=="object"&&_!==null){switch(_.$$typeof){case ul:return _.key===L?l(u,g,_,y):null;case io:return _.key===L?c(u,g,_,y):null;case aa:return _=Wa(_),f(u,g,_,y)}if(ao(_)||Gr(_))return L!==null?null:h(u,g,_,y,null);if(typeof _.then=="function")return f(u,g,_l(_),y);if(_.$$typeof===Pi)return f(u,g,gl(u,_),y);vl(u,_)}return null}function p(u,g,_,y,L){if(typeof y=="string"&&y!==""||typeof y=="number"||typeof y=="bigint")return u=u.get(_)||null,o(g,u,""+y,L);if(typeof y=="object"&&y!==null){switch(y.$$typeof){case ul:return u=u.get(y.key===null?_:y.key)||null,l(g,u,y,L);case io:return u=u.get(y.key===null?_:y.key)||null,c(g,u,y,L);case aa:return y=Wa(y),p(u,g,_,y,L)}if(ao(y)||Gr(y))return u=u.get(_)||null,h(g,u,y,L,null);if(typeof y.then=="function")return p(u,g,_,_l(y),L);if(y.$$typeof===Pi)return p(u,g,_,gl(g,y),L);vl(g,y)}return null}function v(u,g,_,y){for(var L=null,T=null,R=g,U=g=0,X=null;R!==null&&U<_.length;U++){R.index>U?(X=R,R=null):X=R.sibling;var x=f(u,R,_[U],y);if(x===null){R===null&&(R=X);break}e&&R&&x.alternate===null&&t(u,R),g=s(x,g,U),T===null?L=x:T.sibling=x,T=x,R=X}if(U===_.length)return n(u,R),$t&&Li(u,U),L;if(R===null){for(;U<_.length;U++)R=d(u,_[U],y),R!==null&&(g=s(R,g,U),T===null?L=R:T.sibling=R,T=R);return $t&&Li(u,U),L}for(R=i(R);U<_.length;U++)X=p(R,u,U,_[U],y),X!==null&&(e&&X.alternate!==null&&R.delete(X.key===null?U:X.key),g=s(X,g,U),T===null?L=X:T.sibling=X,T=X);return e&&R.forEach(function(E){return t(u,E)}),$t&&Li(u,U),L}function S(u,g,_,y){if(_==null)throw Error($(151));for(var L=null,T=null,R=g,U=g=0,X=null,x=_.next();R!==null&&!x.done;U++,x=_.next()){R.index>U?(X=R,R=null):X=R.sibling;var E=f(u,R,x.value,y);if(E===null){R===null&&(R=X);break}e&&R&&E.alternate===null&&t(u,R),g=s(E,g,U),T===null?L=E:T.sibling=E,T=E,R=X}if(x.done)return n(u,R),$t&&Li(u,U),L;if(R===null){for(;!x.done;U++,x=_.next())x=d(u,x.value,y),x!==null&&(g=s(x,g,U),T===null?L=x:T.sibling=x,T=x);return $t&&Li(u,U),L}for(R=i(R);!x.done;U++,x=_.next())x=p(R,u,U,x.value,y),x!==null&&(e&&x.alternate!==null&&R.delete(x.key===null?U:x.key),g=s(x,g,U),T===null?L=x:T.sibling=x,T=x);return e&&R.forEach(function(q){return t(u,q)}),$t&&Li(u,U),L}function m(u,g,_,y){if(typeof _=="object"&&_!==null&&_.type===Gs&&_.key===null&&(_=_.props.children),typeof _=="object"&&_!==null){switch(_.$$typeof){case ul:t:{for(var L=_.key;g!==null;){if(g.key===L){if(L=_.type,L===Gs){if(g.tag===7){n(u,g.sibling),y=a(g,_.props.children),y.return=u,u=y;break t}}else if(g.elementType===L||typeof L=="object"&&L!==null&&L.$$typeof===aa&&Wa(L)===g.type){n(u,g.sibling),y=a(g,_.props),jr(y,_),y.return=u,u=y;break t}n(u,g);break}else t(u,g);g=g.sibling}_.type===Gs?(y=es(_.props.children,u.mode,y,_.key),y.return=u,u=y):(y=ac(_.type,_.key,_.props,null,u.mode,y),jr(y,_),y.return=u,u=y)}return r(u);case io:t:{for(L=_.key;g!==null;){if(g.key===L)if(g.tag===4&&g.stateNode.containerInfo===_.containerInfo&&g.stateNode.implementation===_.implementation){n(u,g.sibling),y=a(g,_.children||[]),y.return=u,u=y;break t}else{n(u,g);break}else t(u,g);g=g.sibling}y=qu(_,u.mode,y),y.return=u,u=y}return r(u);case aa:return _=Wa(_),m(u,g,_,y)}if(ao(_))return v(u,g,_,y);if(Gr(_)){if(L=Gr(_),typeof L!="function")throw Error($(150));return _=L.call(_),S(u,g,_,y)}if(typeof _.then=="function")return m(u,g,_l(_),y);if(_.$$typeof===Pi)return m(u,g,gl(u,_),y);vl(u,_)}return typeof _=="string"&&_!==""||typeof _=="number"||typeof _=="bigint"?(_=""+_,g!==null&&g.tag===6?(n(u,g.sibling),y=a(g,_),y.return=u,u=y):(n(u,g),y=Wu(_,u.mode,y),y.return=u,u=y),r(u)):n(u,g)}return function(u,g,_,y){try{No=0;var L=m(u,g,_,y);return lr=null,L}catch(R){if(R===zr||R===gu)throw R;var T=Ln(29,R,null,u.mode);return T.lanes=y,T.return=u,T}finally{}}}var os=J_(!0),$_=J_(!1),sa=!1;function hp(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,lanes:0,hiddenCallbacks:null},callbacks:null}}function Eh(e,t){e=e.updateQueue,t.updateQueue===e&&(t.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,callbacks:null})}function xa(e){return{lane:e,tag:0,payload:null,callback:null,next:null}}function ya(e,t,n){var i=e.updateQueue;if(i===null)return null;if(i=i.shared,ne&2){var a=i.pending;return a===null?t.next=t:(t.next=a.next,a.next=t),i.pending=t,t=Dc(e),j_(e,null,n),t}return mu(e,i,t,n),Dc(e)}function mo(e,t,n){if(t=t.updateQueue,t!==null&&(t=t.shared,(n&4194048)!==0)){var i=t.lanes;i&=e.pendingLanes,n|=i,t.lanes=n,__(e,n)}}function Zu(e,t){var n=e.updateQueue,i=e.alternate;if(i!==null&&(i=i.updateQueue,n===i)){var a=null,s=null;if(n=n.firstBaseUpdate,n!==null){do{var r={lane:n.lane,tag:n.tag,payload:n.payload,callback:null,next:null};s===null?a=s=r:s=s.next=r,n=n.next}while(n!==null);s===null?a=s=t:s=s.next=t}else a=s=t;n={baseState:i.baseState,firstBaseUpdate:a,lastBaseUpdate:s,shared:i.shared,callbacks:i.callbacks},e.updateQueue=n;return}e=n.lastBaseUpdate,e===null?n.firstBaseUpdate=t:e.next=t,n.lastBaseUpdate=t}var bh=!1;function go(){if(bh){var e=or;if(e!==null)throw e}}function _o(e,t,n,i){bh=!1;var a=e.updateQueue;sa=!1;var s=a.firstBaseUpdate,r=a.lastBaseUpdate,o=a.shared.pending;if(o!==null){a.shared.pending=null;var l=o,c=l.next;l.next=null,r===null?s=c:r.next=c,r=l;var h=e.alternate;h!==null&&(h=h.updateQueue,o=h.lastBaseUpdate,o!==r&&(o===null?h.firstBaseUpdate=c:o.next=c,h.lastBaseUpdate=l))}if(s!==null){var d=a.baseState;r=0,h=c=l=null,o=s;do{var f=o.lane&-536870913,p=f!==o.lane;if(p?(Jt&f)===f:(i&f)===f){f!==0&&f===vr&&(bh=!0),h!==null&&(h=h.next={lane:0,tag:o.tag,payload:o.payload,callback:null,next:null});t:{var v=e,S=o;f=t;var m=n;switch(S.tag){case 1:if(v=S.payload,typeof v=="function"){d=v.call(m,d,f);break t}d=v;break t;case 3:v.flags=v.flags&-65537|128;case 0:if(v=S.payload,f=typeof v=="function"?v.call(m,d,f):v,f==null)break t;d=be({},d,f);break t;case 2:sa=!0}}f=o.callback,f!==null&&(e.flags|=64,p&&(e.flags|=8192),p=a.callbacks,p===null?a.callbacks=[f]:p.push(f))}else p={lane:f,tag:o.tag,payload:o.payload,callback:o.callback,next:null},h===null?(c=h=p,l=d):h=h.next=p,r|=f;if(o=o.next,o===null){if(o=a.shared.pending,o===null)break;p=o,o=p.next,p.next=null,a.lastBaseUpdate=p,a.shared.pending=null}}while(!0);h===null&&(l=d),a.baseState=l,a.firstBaseUpdate=c,a.lastBaseUpdate=h,s===null&&(a.shared.lanes=0),Na|=r,e.lanes=r,e.memoizedState=d}}function tv(e,t){if(typeof e!="function")throw Error($(191,e));e.call(t)}function ev(e,t){var n=e.callbacks;if(n!==null)for(e.callbacks=null,e=0;e<n.length;e++)tv(n[e],t)}var xr=yi(null),Oc=yi(0);function Hm(e,t){e=qi,_e(Oc,e),_e(xr,t),qi=e|t.baseLanes}function Th(){_e(Oc,qi),_e(xr,xr.current)}function dp(){qi=Oc.current,Xe(xr),Xe(Oc)}var Hn=yi(null),$n=null;function la(e){var t=e.alternate;_e(De,De.current&1),_e(Hn,e),$n===null&&(t===null||xr.current!==null||t.memoizedState!==null)&&($n=e)}function Ah(e){_e(De,De.current),_e(Hn,e),$n===null&&($n=e)}function nv(e){e.tag===22?(_e(De,De.current),_e(Hn,e),$n===null&&($n=e)):ca()}function ca(){_e(De,De.current),_e(Hn,Hn.current)}function Nn(e){Xe(Hn),$n===e&&($n=null),Xe(De)}var De=yi(0);function Pc(e){for(var t=e;t!==null;){if(t.tag===13){var n=t.memoizedState;if(n!==null&&(n=n.dehydrated,n===null||Xh(n)||Wh(n)))return t}else if(t.tag===19&&(t.memoizedProps.revealOrder==="forwards"||t.memoizedProps.revealOrder==="backwards"||t.memoizedProps.revealOrder==="unstable_legacy-backwards"||t.memoizedProps.revealOrder==="together")){if(t.flags&128)return t}else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return null;t=t.return}t.sibling.return=t.return,t=t.sibling}return null}var ji=0,jt=null,he=null,Le=null,zc=!1,cr=!1,ls=!1,Ic=0,Uo=0,ur=null,mM=0;function Re(){throw Error($(321))}function pp(e,t){if(t===null)return!1;for(var n=0;n<t.length&&n<e.length;n++)if(!Fn(e[n],t[n]))return!1;return!0}function mp(e,t,n,i,a,s){return ji=s,jt=t,t.memoizedState=null,t.updateQueue=null,t.lanes=0,Pt.H=e===null||e.memoizedState===null?Lv:Ap,ls=!1,s=n(i,a),ls=!1,cr&&(s=av(t,n,i,a)),iv(e),s}function iv(e){Pt.H=Lo;var t=he!==null&&he.next!==null;if(ji=0,Le=he=jt=null,zc=!1,Uo=0,ur=null,t)throw Error($(300));e===null||ze||(e=e.dependencies,e!==null&&Uc(e)&&(ze=!0))}function av(e,t,n,i){jt=e;var a=0;do{if(cr&&(ur=null),Uo=0,cr=!1,25<=a)throw Error($(301));if(a+=1,Le=he=null,e.updateQueue!=null){var s=e.updateQueue;s.lastEffect=null,s.events=null,s.stores=null,s.memoCache!=null&&(s.memoCache.index=0)}Pt.H=Ov,s=t(n,i)}while(cr);return s}function gM(){var e=Pt.H,t=e.useState()[0];return t=typeof t.then=="function"?qo(t):t,e=e.useState()[0],(he!==null?he.memoizedState:null)!==e&&(jt.flags|=1024),t}function gp(){var e=Ic!==0;return Ic=0,e}function _p(e,t,n){t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~n}function vp(e){if(zc){for(e=e.memoizedState;e!==null;){var t=e.queue;t!==null&&(t.pending=null),e=e.next}zc=!1}ji=0,Le=he=jt=null,cr=!1,Uo=Ic=0,ur=null}function on(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return Le===null?jt.memoizedState=Le=e:Le=Le.next=e,Le}function Ne(){if(he===null){var e=jt.alternate;e=e!==null?e.memoizedState:null}else e=he.next;var t=Le===null?jt.memoizedState:Le.next;if(t!==null)Le=t,he=e;else{if(e===null)throw jt.alternate===null?Error($(467)):Error($(310));he=e,e={memoizedState:he.memoizedState,baseState:he.baseState,baseQueue:he.baseQueue,queue:he.queue,next:null},Le===null?jt.memoizedState=Le=e:Le=Le.next=e}return Le}function _u(){return{lastEffect:null,events:null,stores:null,memoCache:null}}function qo(e){var t=Uo;return Uo+=1,ur===null&&(ur=[]),e=Q_(ur,e,t),t=jt,(Le===null?t.memoizedState:Le.next)===null&&(t=t.alternate,Pt.H=t===null||t.memoizedState===null?Lv:Ap),e}function vu(e){if(e!==null&&typeof e=="object"){if(typeof e.then=="function")return qo(e);if(e.$$typeof===Pi)return Qe(e)}throw Error($(438,String(e)))}function xp(e){var t=null,n=jt.updateQueue;if(n!==null&&(t=n.memoCache),t==null){var i=jt.alternate;i!==null&&(i=i.updateQueue,i!==null&&(i=i.memoCache,i!=null&&(t={data:i.data.map(function(a){return a.slice()}),index:0})))}if(t==null&&(t={data:[],index:0}),n===null&&(n=_u(),jt.updateQueue=n),n.memoCache=t,n=t.data[t.index],n===void 0)for(n=t.data[t.index]=Array(e),i=0;i<e;i++)n[i]=eS;return t.index++,n}function Xi(e,t){return typeof t=="function"?t(e):t}function rc(e){var t=Ne();return yp(t,he,e)}function yp(e,t,n){var i=e.queue;if(i===null)throw Error($(311));i.lastRenderedReducer=n;var a=e.baseQueue,s=i.pending;if(s!==null){if(a!==null){var r=a.next;a.next=s.next,s.next=r}t.baseQueue=a=s,i.pending=null}if(s=e.baseState,a===null)e.memoizedState=s;else{t=a.next;var o=r=null,l=null,c=t,h=!1;do{var d=c.lane&-536870913;if(d!==c.lane?(Jt&d)===d:(ji&d)===d){var f=c.revertLane;if(f===0)l!==null&&(l=l.next={lane:0,revertLane:0,gesture:null,action:c.action,hasEagerState:c.hasEagerState,eagerState:c.eagerState,next:null}),d===vr&&(h=!0);else if((ji&f)===f){c=c.next,f===vr&&(h=!0);continue}else d={lane:0,revertLane:c.revertLane,gesture:null,action:c.action,hasEagerState:c.hasEagerState,eagerState:c.eagerState,next:null},l===null?(o=l=d,r=s):l=l.next=d,jt.lanes|=f,Na|=f;d=c.action,ls&&n(s,d),s=c.hasEagerState?c.eagerState:n(s,d)}else f={lane:d,revertLane:c.revertLane,gesture:c.gesture,action:c.action,hasEagerState:c.hasEagerState,eagerState:c.eagerState,next:null},l===null?(o=l=f,r=s):l=l.next=f,jt.lanes|=d,Na|=d;c=c.next}while(c!==null&&c!==t);if(l===null?r=s:l.next=o,!Fn(s,e.memoizedState)&&(ze=!0,h&&(n=or,n!==null)))throw n;e.memoizedState=s,e.baseState=r,e.baseQueue=l,i.lastRenderedState=s}return a===null&&(i.lanes=0),[e.memoizedState,i.dispatch]}function Ku(e){var t=Ne(),n=t.queue;if(n===null)throw Error($(311));n.lastRenderedReducer=e;var i=n.dispatch,a=n.pending,s=t.memoizedState;if(a!==null){n.pending=null;var r=a=a.next;do s=e(s,r.action),r=r.next;while(r!==a);Fn(s,t.memoizedState)||(ze=!0),t.memoizedState=s,t.baseQueue===null&&(t.baseState=s),n.lastRenderedState=s}return[s,i]}function sv(e,t,n){var i=jt,a=Ne(),s=$t;if(s){if(n===void 0)throw Error($(407));n=n()}else n=t();var r=!Fn((he||a).memoizedState,n);if(r&&(a.memoizedState=n,ze=!0),a=a.queue,Sp(lv.bind(null,i,a,e),[e]),a.getSnapshot!==t||r||Le!==null&&Le.memoizedState.tag&1){if(i.flags|=2048,yr(9,{destroy:void 0},ov.bind(null,i,a,n,t),null),ge===null)throw Error($(349));s||ji&127||rv(i,t,n)}return n}function rv(e,t,n){e.flags|=16384,e={getSnapshot:t,value:n},t=jt.updateQueue,t===null?(t=_u(),jt.updateQueue=t,t.stores=[e]):(n=t.stores,n===null?t.stores=[e]:n.push(e))}function ov(e,t,n,i){t.value=n,t.getSnapshot=i,cv(t)&&uv(e)}function lv(e,t,n){return n(function(){cv(t)&&uv(e)})}function cv(e){var t=e.getSnapshot;e=e.value;try{var n=t();return!Fn(e,n)}catch{return!0}}function uv(e){var t=gs(e,2);t!==null&&xn(t,e,2)}function Rh(e){var t=on();if(typeof e=="function"){var n=e;if(e=n(),ls){ha(!0);try{n()}finally{ha(!1)}}}return t.memoizedState=t.baseState=e,t.queue={pending:null,lanes:0,dispatch:null,lastRenderedReducer:Xi,lastRenderedState:e},t}function fv(e,t,n,i){return e.baseState=n,yp(e,he,typeof i=="function"?i:Xi)}function _M(e,t,n,i,a){if(yu(e))throw Error($(485));if(e=t.action,e!==null){var s={payload:a,action:e,next:null,isTransition:!0,status:"pending",value:null,reason:null,listeners:[],then:function(r){s.listeners.push(r)}};Pt.T!==null?n(!0):s.isTransition=!1,i(s),n=t.pending,n===null?(s.next=t.pending=s,hv(t,s)):(s.next=n.next,t.pending=n.next=s)}}function hv(e,t){var n=t.action,i=t.payload,a=e.state;if(t.isTransition){var s=Pt.T,r={};Pt.T=r;try{var o=n(a,i),l=Pt.S;l!==null&&l(r,o),Gm(e,t,o)}catch(c){wh(e,t,c)}finally{s!==null&&r.types!==null&&(s.types=r.types),Pt.T=s}}else try{s=n(a,i),Gm(e,t,s)}catch(c){wh(e,t,c)}}function Gm(e,t,n){n!==null&&typeof n=="object"&&typeof n.then=="function"?n.then(function(i){Vm(e,t,i)},function(i){return wh(e,t,i)}):Vm(e,t,n)}function Vm(e,t,n){t.status="fulfilled",t.value=n,dv(t),e.state=n,t=e.pending,t!==null&&(n=t.next,n===t?e.pending=null:(n=n.next,t.next=n,hv(e,n)))}function wh(e,t,n){var i=e.pending;if(e.pending=null,i!==null){i=i.next;do t.status="rejected",t.reason=n,dv(t),t=t.next;while(t!==i)}e.action=null}function dv(e){e=e.listeners;for(var t=0;t<e.length;t++)(0,e[t])()}function pv(e,t){return t}function km(e,t){if($t){var n=ge.formState;if(n!==null){t:{var i=jt;if($t){if(Me){e:{for(var a=Me,s=Qn;a.nodeType!==8;){if(!s){a=null;break e}if(a=ti(a.nextSibling),a===null){a=null;break e}}s=a.data,a=s==="F!"||s==="F"?a:null}if(a){Me=ti(a.nextSibling),i=a.data==="F!";break t}}Ca(i)}i=!1}i&&(t=n[0])}}return n=on(),n.memoizedState=n.baseState=t,i={pending:null,lanes:0,dispatch:null,lastRenderedReducer:pv,lastRenderedState:t},n.queue=i,n=Dv.bind(null,jt,i),i.dispatch=n,i=Rh(!1),s=Tp.bind(null,jt,!1,i.queue),i=on(),a={state:t,dispatch:null,action:e,pending:null},i.queue=a,n=_M.bind(null,jt,a,s,n),a.dispatch=n,i.memoizedState=e,[t,n,!1]}function jm(e){var t=Ne();return mv(t,he,e)}function mv(e,t,n){if(t=yp(e,t,pv)[0],e=rc(Xi)[0],typeof t=="object"&&t!==null&&typeof t.then=="function")try{var i=qo(t)}catch(r){throw r===zr?gu:r}else i=t;t=Ne();var a=t.queue,s=a.dispatch;return n!==t.memoizedState&&(jt.flags|=2048,yr(9,{destroy:void 0},vM.bind(null,a,n),null)),[i,s,e]}function vM(e,t){e.action=t}function Xm(e){var t=Ne(),n=he;if(n!==null)return mv(t,n,e);Ne(),t=t.memoizedState,n=Ne();var i=n.queue.dispatch;return n.memoizedState=e,[t,i,!1]}function yr(e,t,n,i){return e={tag:e,create:n,deps:i,inst:t,next:null},t=jt.updateQueue,t===null&&(t=_u(),jt.updateQueue=t),n=t.lastEffect,n===null?t.lastEffect=e.next=e:(i=n.next,n.next=e,e.next=i,t.lastEffect=e),e}function gv(){return Ne().memoizedState}function oc(e,t,n,i){var a=on();jt.flags|=e,a.memoizedState=yr(1|t,{destroy:void 0},n,i===void 0?null:i)}function xu(e,t,n,i){var a=Ne();i=i===void 0?null:i;var s=a.memoizedState.inst;he!==null&&i!==null&&pp(i,he.memoizedState.deps)?a.memoizedState=yr(t,s,n,i):(jt.flags|=e,a.memoizedState=yr(1|t,s,n,i))}function Wm(e,t){oc(8390656,8,e,t)}function Sp(e,t){xu(2048,8,e,t)}function xM(e){jt.flags|=4;var t=jt.updateQueue;if(t===null)t=_u(),jt.updateQueue=t,t.events=[e];else{var n=t.events;n===null?t.events=[e]:n.push(e)}}function _v(e){var t=Ne().memoizedState;return xM({ref:t,nextImpl:e}),function(){if(ne&2)throw Error($(440));return t.impl.apply(void 0,arguments)}}function vv(e,t){return xu(4,2,e,t)}function xv(e,t){return xu(4,4,e,t)}function yv(e,t){if(typeof t=="function"){e=e();var n=t(e);return function(){typeof n=="function"?n():t(null)}}if(t!=null)return e=e(),t.current=e,function(){t.current=null}}function Sv(e,t,n){n=n!=null?n.concat([e]):null,xu(4,4,yv.bind(null,t,e),n)}function Mp(){}function Mv(e,t){var n=Ne();t=t===void 0?null:t;var i=n.memoizedState;return t!==null&&pp(t,i[1])?i[0]:(n.memoizedState=[e,t],e)}function Ev(e,t){var n=Ne();t=t===void 0?null:t;var i=n.memoizedState;if(t!==null&&pp(t,i[1]))return i[0];if(i=e(),ls){ha(!0);try{e()}finally{ha(!1)}}return n.memoizedState=[i,t],i}function Ep(e,t,n){return n===void 0||ji&1073741824&&!(Jt&261930)?e.memoizedState=t:(e.memoizedState=n,e=fx(),jt.lanes|=e,Na|=e,n)}function bv(e,t,n,i){return Fn(n,t)?n:xr.current!==null?(e=Ep(e,n,i),Fn(e,t)||(ze=!0),e):!(ji&42)||ji&1073741824&&!(Jt&261930)?(ze=!0,e.memoizedState=n):(e=fx(),jt.lanes|=e,Na|=e,t)}function Tv(e,t,n,i,a){var s=ie.p;ie.p=s!==0&&8>s?s:8;var r=Pt.T,o={};Pt.T=o,Tp(e,!1,t,n);try{var l=a(),c=Pt.S;if(c!==null&&c(o,l),l!==null&&typeof l=="object"&&typeof l.then=="function"){var h=pM(l,i);vo(e,t,h,Bn(e))}else vo(e,t,i,Bn(e))}catch(d){vo(e,t,{then:function(){},status:"rejected",reason:d},Bn())}finally{ie.p=s,r!==null&&o.types!==null&&(r.types=o.types),Pt.T=r}}function yM(){}function Ch(e,t,n,i){if(e.tag!==5)throw Error($(476));var a=Av(e).queue;Tv(e,a,t,ts,n===null?yM:function(){return Rv(e),n(i)})}function Av(e){var t=e.memoizedState;if(t!==null)return t;t={memoizedState:ts,baseState:ts,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:Xi,lastRenderedState:ts},next:null};var n={};return t.next={memoizedState:n,baseState:n,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:Xi,lastRenderedState:n},next:null},e.memoizedState=t,e=e.alternate,e!==null&&(e.memoizedState=t),t}function Rv(e){var t=Av(e);t.next===null&&(t=e.alternate.memoizedState),vo(e,t.next.queue,{},Bn())}function bp(){return Qe(zo)}function wv(){return Ne().memoizedState}function Cv(){return Ne().memoizedState}function SM(e){for(var t=e.return;t!==null;){switch(t.tag){case 24:case 3:var n=Bn();e=xa(n);var i=ya(t,e,n);i!==null&&(xn(i,t,n),mo(i,t,n)),t={cache:cp()},e.payload=t;return}t=t.return}}function MM(e,t,n){var i=Bn();n={lane:i,revertLane:0,gesture:null,action:n,hasEagerState:!1,eagerState:null,next:null},yu(e)?Nv(t,n):(n=sp(e,t,n,i),n!==null&&(xn(n,e,i),Uv(n,t,i)))}function Dv(e,t,n){var i=Bn();vo(e,t,n,i)}function vo(e,t,n,i){var a={lane:i,revertLane:0,gesture:null,action:n,hasEagerState:!1,eagerState:null,next:null};if(yu(e))Nv(t,a);else{var s=e.alternate;if(e.lanes===0&&(s===null||s.lanes===0)&&(s=t.lastRenderedReducer,s!==null))try{var r=t.lastRenderedState,o=s(r,n);if(a.hasEagerState=!0,a.eagerState=o,Fn(o,r))return mu(e,t,a,0),ge===null&&pu(),!1}catch{}finally{}if(n=sp(e,t,a,i),n!==null)return xn(n,e,i),Uv(n,t,i),!0}return!1}function Tp(e,t,n,i){if(i={lane:2,revertLane:Op(),gesture:null,action:i,hasEagerState:!1,eagerState:null,next:null},yu(e)){if(t)throw Error($(479))}else t=sp(e,n,i,2),t!==null&&xn(t,e,2)}function yu(e){var t=e.alternate;return e===jt||t!==null&&t===jt}function Nv(e,t){cr=zc=!0;var n=e.pending;n===null?t.next=t:(t.next=n.next,n.next=t),e.pending=t}function Uv(e,t,n){if(n&4194048){var i=t.lanes;i&=e.pendingLanes,n|=i,t.lanes=n,__(e,n)}}var Lo={readContext:Qe,use:vu,useCallback:Re,useContext:Re,useEffect:Re,useImperativeHandle:Re,useLayoutEffect:Re,useInsertionEffect:Re,useMemo:Re,useReducer:Re,useRef:Re,useState:Re,useDebugValue:Re,useDeferredValue:Re,useTransition:Re,useSyncExternalStore:Re,useId:Re,useHostTransitionStatus:Re,useFormState:Re,useActionState:Re,useOptimistic:Re,useMemoCache:Re,useCacheRefresh:Re};Lo.useEffectEvent=Re;var Lv={readContext:Qe,use:vu,useCallback:function(e,t){return on().memoizedState=[e,t===void 0?null:t],e},useContext:Qe,useEffect:Wm,useImperativeHandle:function(e,t,n){n=n!=null?n.concat([e]):null,oc(4194308,4,yv.bind(null,t,e),n)},useLayoutEffect:function(e,t){return oc(4194308,4,e,t)},useInsertionEffect:function(e,t){oc(4,2,e,t)},useMemo:function(e,t){var n=on();t=t===void 0?null:t;var i=e();if(ls){ha(!0);try{e()}finally{ha(!1)}}return n.memoizedState=[i,t],i},useReducer:function(e,t,n){var i=on();if(n!==void 0){var a=n(t);if(ls){ha(!0);try{n(t)}finally{ha(!1)}}}else a=t;return i.memoizedState=i.baseState=a,e={pending:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:a},i.queue=e,e=e.dispatch=MM.bind(null,jt,e),[i.memoizedState,e]},useRef:function(e){var t=on();return e={current:e},t.memoizedState=e},useState:function(e){e=Rh(e);var t=e.queue,n=Dv.bind(null,jt,t);return t.dispatch=n,[e.memoizedState,n]},useDebugValue:Mp,useDeferredValue:function(e,t){var n=on();return Ep(n,e,t)},useTransition:function(){var e=Rh(!1);return e=Tv.bind(null,jt,e.queue,!0,!1),on().memoizedState=e,[!1,e]},useSyncExternalStore:function(e,t,n){var i=jt,a=on();if($t){if(n===void 0)throw Error($(407));n=n()}else{if(n=t(),ge===null)throw Error($(349));Jt&127||rv(i,t,n)}a.memoizedState=n;var s={value:n,getSnapshot:t};return a.queue=s,Wm(lv.bind(null,i,s,e),[e]),i.flags|=2048,yr(9,{destroy:void 0},ov.bind(null,i,s,n,t),null),n},useId:function(){var e=on(),t=ge.identifierPrefix;if($t){var n=gi,i=mi;n=(i&~(1<<32-In(i)-1)).toString(32)+n,t="_"+t+"R_"+n,n=Ic++,0<n&&(t+="H"+n.toString(32)),t+="_"}else n=mM++,t="_"+t+"r_"+n.toString(32)+"_";return e.memoizedState=t},useHostTransitionStatus:bp,useFormState:km,useActionState:km,useOptimistic:function(e){var t=on();t.memoizedState=t.baseState=e;var n={pending:null,lanes:0,dispatch:null,lastRenderedReducer:null,lastRenderedState:null};return t.queue=n,t=Tp.bind(null,jt,!0,n),n.dispatch=t,[e,t]},useMemoCache:xp,useCacheRefresh:function(){return on().memoizedState=SM.bind(null,jt)},useEffectEvent:function(e){var t=on(),n={impl:e};return t.memoizedState=n,function(){if(ne&2)throw Error($(440));return n.impl.apply(void 0,arguments)}}},Ap={readContext:Qe,use:vu,useCallback:Mv,useContext:Qe,useEffect:Sp,useImperativeHandle:Sv,useInsertionEffect:vv,useLayoutEffect:xv,useMemo:Ev,useReducer:rc,useRef:gv,useState:function(){return rc(Xi)},useDebugValue:Mp,useDeferredValue:function(e,t){var n=Ne();return bv(n,he.memoizedState,e,t)},useTransition:function(){var e=rc(Xi)[0],t=Ne().memoizedState;return[typeof e=="boolean"?e:qo(e),t]},useSyncExternalStore:sv,useId:wv,useHostTransitionStatus:bp,useFormState:jm,useActionState:jm,useOptimistic:function(e,t){var n=Ne();return fv(n,he,e,t)},useMemoCache:xp,useCacheRefresh:Cv};Ap.useEffectEvent=_v;var Ov={readContext:Qe,use:vu,useCallback:Mv,useContext:Qe,useEffect:Sp,useImperativeHandle:Sv,useInsertionEffect:vv,useLayoutEffect:xv,useMemo:Ev,useReducer:Ku,useRef:gv,useState:function(){return Ku(Xi)},useDebugValue:Mp,useDeferredValue:function(e,t){var n=Ne();return he===null?Ep(n,e,t):bv(n,he.memoizedState,e,t)},useTransition:function(){var e=Ku(Xi)[0],t=Ne().memoizedState;return[typeof e=="boolean"?e:qo(e),t]},useSyncExternalStore:sv,useId:wv,useHostTransitionStatus:bp,useFormState:Xm,useActionState:Xm,useOptimistic:function(e,t){var n=Ne();return he!==null?fv(n,he,e,t):(n.baseState=e,[e,n.queue.dispatch])},useMemoCache:xp,useCacheRefresh:Cv};Ov.useEffectEvent=_v;function Qu(e,t,n,i){t=e.memoizedState,n=n(i,t),n=n==null?t:be({},t,n),e.memoizedState=n,e.lanes===0&&(e.updateQueue.baseState=n)}var Dh={enqueueSetState:function(e,t,n){e=e._reactInternals;var i=Bn(),a=xa(i);a.payload=t,n!=null&&(a.callback=n),t=ya(e,a,i),t!==null&&(xn(t,e,i),mo(t,e,i))},enqueueReplaceState:function(e,t,n){e=e._reactInternals;var i=Bn(),a=xa(i);a.tag=1,a.payload=t,n!=null&&(a.callback=n),t=ya(e,a,i),t!==null&&(xn(t,e,i),mo(t,e,i))},enqueueForceUpdate:function(e,t){e=e._reactInternals;var n=Bn(),i=xa(n);i.tag=2,t!=null&&(i.callback=t),t=ya(e,i,n),t!==null&&(xn(t,e,n),mo(t,e,n))}};function qm(e,t,n,i,a,s,r){return e=e.stateNode,typeof e.shouldComponentUpdate=="function"?e.shouldComponentUpdate(i,s,r):t.prototype&&t.prototype.isPureReactComponent?!wo(n,i)||!wo(a,s):!0}function Ym(e,t,n,i){e=t.state,typeof t.componentWillReceiveProps=="function"&&t.componentWillReceiveProps(n,i),typeof t.UNSAFE_componentWillReceiveProps=="function"&&t.UNSAFE_componentWillReceiveProps(n,i),t.state!==e&&Dh.enqueueReplaceState(t,t.state,null)}function cs(e,t){var n=t;if("ref"in t){n={};for(var i in t)i!=="ref"&&(n[i]=t[i])}if(e=e.defaultProps){n===t&&(n=be({},n));for(var a in e)n[a]===void 0&&(n[a]=e[a])}return n}function Pv(e){Cc(e)}function zv(e){console.error(e)}function Iv(e){Cc(e)}function Bc(e,t){try{var n=e.onUncaughtError;n(t.value,{componentStack:t.stack})}catch(i){setTimeout(function(){throw i})}}function Zm(e,t,n){try{var i=e.onCaughtError;i(n.value,{componentStack:n.stack,errorBoundary:t.tag===1?t.stateNode:null})}catch(a){setTimeout(function(){throw a})}}function Nh(e,t,n){return n=xa(n),n.tag=3,n.payload={element:null},n.callback=function(){Bc(e,t)},n}function Bv(e){return e=xa(e),e.tag=3,e}function Fv(e,t,n,i){var a=n.type.getDerivedStateFromError;if(typeof a=="function"){var s=i.value;e.payload=function(){return a(s)},e.callback=function(){Zm(t,n,i)}}var r=n.stateNode;r!==null&&typeof r.componentDidCatch=="function"&&(e.callback=function(){Zm(t,n,i),typeof a!="function"&&(Sa===null?Sa=new Set([this]):Sa.add(this));var o=i.stack;this.componentDidCatch(i.value,{componentStack:o!==null?o:""})})}function EM(e,t,n,i,a){if(n.flags|=32768,i!==null&&typeof i=="object"&&typeof i.then=="function"){if(t=n.alternate,t!==null&&Pr(t,n,a,!0),n=Hn.current,n!==null){switch(n.tag){case 31:case 13:return $n===null?kc():n.alternate===null&&we===0&&(we=3),n.flags&=-257,n.flags|=65536,n.lanes=a,i===Lc?n.flags|=16384:(t=n.updateQueue,t===null?n.updateQueue=new Set([i]):t.add(i),cf(e,i,a)),!1;case 22:return n.flags|=65536,i===Lc?n.flags|=16384:(t=n.updateQueue,t===null?(t={transitions:null,markerInstances:null,retryQueue:new Set([i])},n.updateQueue=t):(n=t.retryQueue,n===null?t.retryQueue=new Set([i]):n.add(i)),cf(e,i,a)),!1}throw Error($(435,n.tag))}return cf(e,i,a),kc(),!1}if($t)return t=Hn.current,t!==null?(!(t.flags&65536)&&(t.flags|=256),t.flags|=65536,t.lanes=a,i!==vh&&(e=Error($(422),{cause:i}),Do(Kn(e,n)))):(i!==vh&&(t=Error($(423),{cause:i}),Do(Kn(t,n))),e=e.current.alternate,e.flags|=65536,a&=-a,e.lanes|=a,i=Kn(i,n),a=Nh(e.stateNode,i,a),Zu(e,a),we!==4&&(we=2)),!1;var s=Error($(520),{cause:i});if(s=Kn(s,n),So===null?So=[s]:So.push(s),we!==4&&(we=2),t===null)return!0;i=Kn(i,n),n=t;do{switch(n.tag){case 3:return n.flags|=65536,e=a&-a,n.lanes|=e,e=Nh(n.stateNode,i,e),Zu(n,e),!1;case 1:if(t=n.type,s=n.stateNode,(n.flags&128)===0&&(typeof t.getDerivedStateFromError=="function"||s!==null&&typeof s.componentDidCatch=="function"&&(Sa===null||!Sa.has(s))))return n.flags|=65536,a&=-a,n.lanes|=a,a=Bv(a),Fv(a,e,n,i),Zu(n,a),!1}n=n.return}while(n!==null);return!1}var Rp=Error($(461)),ze=!1;function Ye(e,t,n,i){t.child=e===null?$_(t,null,n,i):os(t,e.child,n,i)}function Km(e,t,n,i,a){n=n.render;var s=t.ref;if("ref"in i){var r={};for(var o in i)o!=="ref"&&(r[o]=i[o])}else r=i;return rs(t),i=mp(e,t,n,r,s,a),o=gp(),e!==null&&!ze?(_p(e,t,a),Wi(e,t,a)):($t&&o&&op(t),t.flags|=1,Ye(e,t,i,a),t.child)}function Qm(e,t,n,i,a){if(e===null){var s=n.type;return typeof s=="function"&&!rp(s)&&s.defaultProps===void 0&&n.compare===null?(t.tag=15,t.type=s,Hv(e,t,s,i,a)):(e=ac(n.type,null,i,t,t.mode,a),e.ref=t.ref,e.return=t,t.child=e)}if(s=e.child,!wp(e,a)){var r=s.memoizedProps;if(n=n.compare,n=n!==null?n:wo,n(r,i)&&e.ref===t.ref)return Wi(e,t,a)}return t.flags|=1,e=Hi(s,i),e.ref=t.ref,e.return=t,t.child=e}function Hv(e,t,n,i,a){if(e!==null){var s=e.memoizedProps;if(wo(s,i)&&e.ref===t.ref)if(ze=!1,t.pendingProps=i=s,wp(e,a))e.flags&131072&&(ze=!0);else return t.lanes=e.lanes,Wi(e,t,a)}return Uh(e,t,n,i,a)}function Gv(e,t,n,i){var a=i.children,s=e!==null?e.memoizedState:null;if(e===null&&t.stateNode===null&&(t.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),i.mode==="hidden"){if(t.flags&128){if(s=s!==null?s.baseLanes|n:n,e!==null){for(i=t.child=e.child,a=0;i!==null;)a=a|i.lanes|i.childLanes,i=i.sibling;i=a&~s}else i=0,t.child=null;return Jm(e,t,s,n,i)}if(n&536870912)t.memoizedState={baseLanes:0,cachePool:null},e!==null&&sc(t,s!==null?s.cachePool:null),s!==null?Hm(t,s):Th(),nv(t);else return i=t.lanes=536870912,Jm(e,t,s!==null?s.baseLanes|n:n,n,i)}else s!==null?(sc(t,s.cachePool),Hm(t,s),ca(),t.memoizedState=null):(e!==null&&sc(t,null),Th(),ca());return Ye(e,t,a,n),t.child}function ro(e,t){return e!==null&&e.tag===22||t.stateNode!==null||(t.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),t.sibling}function Jm(e,t,n,i,a){var s=up();return s=s===null?null:{parent:Pe._currentValue,pool:s},t.memoizedState={baseLanes:n,cachePool:s},e!==null&&sc(t,null),Th(),nv(t),e!==null&&Pr(e,t,i,!0),t.childLanes=a,null}function lc(e,t){return t=Fc({mode:t.mode,children:t.children},e.mode),t.ref=e.ref,e.child=t,t.return=e,t}function $m(e,t,n){return os(t,e.child,null,n),e=lc(t,t.pendingProps),e.flags|=2,Nn(t),t.memoizedState=null,e}function bM(e,t,n){var i=t.pendingProps,a=(t.flags&128)!==0;if(t.flags&=-129,e===null){if($t){if(i.mode==="hidden")return e=lc(t,i),t.lanes=536870912,ro(null,e);if(Ah(t),(e=Me)?(e=Lx(e,Qn),e=e!==null&&e.data==="&"?e:null,e!==null&&(t.memoizedState={dehydrated:e,treeContext:wa!==null?{id:mi,overflow:gi}:null,retryLane:536870912,hydrationErrors:null},n=W_(e),n.return=t,t.child=n,Ke=t,Me=null)):e=null,e===null)throw Ca(t);return t.lanes=536870912,null}return lc(t,i)}var s=e.memoizedState;if(s!==null){var r=s.dehydrated;if(Ah(t),a)if(t.flags&256)t.flags&=-257,t=$m(e,t,n);else if(t.memoizedState!==null)t.child=e.child,t.flags|=128,t=null;else throw Error($(558));else if(ze||Pr(e,t,n,!1),a=(n&e.childLanes)!==0,ze||a){if(i=ge,i!==null&&(r=v_(i,n),r!==0&&r!==s.retryLane))throw s.retryLane=r,gs(e,r),xn(i,e,r),Rp;kc(),t=$m(e,t,n)}else e=s.treeContext,Me=ti(r.nextSibling),Ke=t,$t=!0,va=null,Qn=!1,e!==null&&Y_(t,e),t=lc(t,i),t.flags|=4096;return t}return e=Hi(e.child,{mode:i.mode,children:i.children}),e.ref=t.ref,t.child=e,e.return=t,e}function cc(e,t){var n=t.ref;if(n===null)e!==null&&e.ref!==null&&(t.flags|=4194816);else{if(typeof n!="function"&&typeof n!="object")throw Error($(284));(e===null||e.ref!==n)&&(t.flags|=4194816)}}function Uh(e,t,n,i,a){return rs(t),n=mp(e,t,n,i,void 0,a),i=gp(),e!==null&&!ze?(_p(e,t,a),Wi(e,t,a)):($t&&i&&op(t),t.flags|=1,Ye(e,t,n,a),t.child)}function tg(e,t,n,i,a,s){return rs(t),t.updateQueue=null,n=av(t,i,n,a),iv(e),i=gp(),e!==null&&!ze?(_p(e,t,s),Wi(e,t,s)):($t&&i&&op(t),t.flags|=1,Ye(e,t,n,s),t.child)}function eg(e,t,n,i,a){if(rs(t),t.stateNode===null){var s=Zs,r=n.contextType;typeof r=="object"&&r!==null&&(s=Qe(r)),s=new n(i,s),t.memoizedState=s.state!==null&&s.state!==void 0?s.state:null,s.updater=Dh,t.stateNode=s,s._reactInternals=t,s=t.stateNode,s.props=i,s.state=t.memoizedState,s.refs={},hp(t),r=n.contextType,s.context=typeof r=="object"&&r!==null?Qe(r):Zs,s.state=t.memoizedState,r=n.getDerivedStateFromProps,typeof r=="function"&&(Qu(t,n,r,i),s.state=t.memoizedState),typeof n.getDerivedStateFromProps=="function"||typeof s.getSnapshotBeforeUpdate=="function"||typeof s.UNSAFE_componentWillMount!="function"&&typeof s.componentWillMount!="function"||(r=s.state,typeof s.componentWillMount=="function"&&s.componentWillMount(),typeof s.UNSAFE_componentWillMount=="function"&&s.UNSAFE_componentWillMount(),r!==s.state&&Dh.enqueueReplaceState(s,s.state,null),_o(t,i,s,a),go(),s.state=t.memoizedState),typeof s.componentDidMount=="function"&&(t.flags|=4194308),i=!0}else if(e===null){s=t.stateNode;var o=t.memoizedProps,l=cs(n,o);s.props=l;var c=s.context,h=n.contextType;r=Zs,typeof h=="object"&&h!==null&&(r=Qe(h));var d=n.getDerivedStateFromProps;h=typeof d=="function"||typeof s.getSnapshotBeforeUpdate=="function",o=t.pendingProps!==o,h||typeof s.UNSAFE_componentWillReceiveProps!="function"&&typeof s.componentWillReceiveProps!="function"||(o||c!==r)&&Ym(t,s,i,r),sa=!1;var f=t.memoizedState;s.state=f,_o(t,i,s,a),go(),c=t.memoizedState,o||f!==c||sa?(typeof d=="function"&&(Qu(t,n,d,i),c=t.memoizedState),(l=sa||qm(t,n,l,i,f,c,r))?(h||typeof s.UNSAFE_componentWillMount!="function"&&typeof s.componentWillMount!="function"||(typeof s.componentWillMount=="function"&&s.componentWillMount(),typeof s.UNSAFE_componentWillMount=="function"&&s.UNSAFE_componentWillMount()),typeof s.componentDidMount=="function"&&(t.flags|=4194308)):(typeof s.componentDidMount=="function"&&(t.flags|=4194308),t.memoizedProps=i,t.memoizedState=c),s.props=i,s.state=c,s.context=r,i=l):(typeof s.componentDidMount=="function"&&(t.flags|=4194308),i=!1)}else{s=t.stateNode,Eh(e,t),r=t.memoizedProps,h=cs(n,r),s.props=h,d=t.pendingProps,f=s.context,c=n.contextType,l=Zs,typeof c=="object"&&c!==null&&(l=Qe(c)),o=n.getDerivedStateFromProps,(c=typeof o=="function"||typeof s.getSnapshotBeforeUpdate=="function")||typeof s.UNSAFE_componentWillReceiveProps!="function"&&typeof s.componentWillReceiveProps!="function"||(r!==d||f!==l)&&Ym(t,s,i,l),sa=!1,f=t.memoizedState,s.state=f,_o(t,i,s,a),go();var p=t.memoizedState;r!==d||f!==p||sa||e!==null&&e.dependencies!==null&&Uc(e.dependencies)?(typeof o=="function"&&(Qu(t,n,o,i),p=t.memoizedState),(h=sa||qm(t,n,h,i,f,p,l)||e!==null&&e.dependencies!==null&&Uc(e.dependencies))?(c||typeof s.UNSAFE_componentWillUpdate!="function"&&typeof s.componentWillUpdate!="function"||(typeof s.componentWillUpdate=="function"&&s.componentWillUpdate(i,p,l),typeof s.UNSAFE_componentWillUpdate=="function"&&s.UNSAFE_componentWillUpdate(i,p,l)),typeof s.componentDidUpdate=="function"&&(t.flags|=4),typeof s.getSnapshotBeforeUpdate=="function"&&(t.flags|=1024)):(typeof s.componentDidUpdate!="function"||r===e.memoizedProps&&f===e.memoizedState||(t.flags|=4),typeof s.getSnapshotBeforeUpdate!="function"||r===e.memoizedProps&&f===e.memoizedState||(t.flags|=1024),t.memoizedProps=i,t.memoizedState=p),s.props=i,s.state=p,s.context=l,i=h):(typeof s.componentDidUpdate!="function"||r===e.memoizedProps&&f===e.memoizedState||(t.flags|=4),typeof s.getSnapshotBeforeUpdate!="function"||r===e.memoizedProps&&f===e.memoizedState||(t.flags|=1024),i=!1)}return s=i,cc(e,t),i=(t.flags&128)!==0,s||i?(s=t.stateNode,n=i&&typeof n.getDerivedStateFromError!="function"?null:s.render(),t.flags|=1,e!==null&&i?(t.child=os(t,e.child,null,a),t.child=os(t,null,n,a)):Ye(e,t,n,a),t.memoizedState=s.state,e=t.child):e=Wi(e,t,a),e}function ng(e,t,n,i){return ss(),t.flags|=256,Ye(e,t,n,i),t.child}var Ju={dehydrated:null,treeContext:null,retryLane:0,hydrationErrors:null};function $u(e){return{baseLanes:e,cachePool:K_()}}function tf(e,t,n){return e=e!==null?e.childLanes&~n:0,t&&(e|=On),e}function Vv(e,t,n){var i=t.pendingProps,a=!1,s=(t.flags&128)!==0,r;if((r=s)||(r=e!==null&&e.memoizedState===null?!1:(De.current&2)!==0),r&&(a=!0,t.flags&=-129),r=(t.flags&32)!==0,t.flags&=-33,e===null){if($t){if(a?la(t):ca(),(e=Me)?(e=Lx(e,Qn),e=e!==null&&e.data!=="&"?e:null,e!==null&&(t.memoizedState={dehydrated:e,treeContext:wa!==null?{id:mi,overflow:gi}:null,retryLane:536870912,hydrationErrors:null},n=W_(e),n.return=t,t.child=n,Ke=t,Me=null)):e=null,e===null)throw Ca(t);return Wh(e)?t.lanes=32:t.lanes=536870912,null}var o=i.children;return i=i.fallback,a?(ca(),a=t.mode,o=Fc({mode:"hidden",children:o},a),i=es(i,a,n,null),o.return=t,i.return=t,o.sibling=i,t.child=o,i=t.child,i.memoizedState=$u(n),i.childLanes=tf(e,r,n),t.memoizedState=Ju,ro(null,i)):(la(t),Lh(t,o))}var l=e.memoizedState;if(l!==null&&(o=l.dehydrated,o!==null)){if(s)t.flags&256?(la(t),t.flags&=-257,t=ef(e,t,n)):t.memoizedState!==null?(ca(),t.child=e.child,t.flags|=128,t=null):(ca(),o=i.fallback,a=t.mode,i=Fc({mode:"visible",children:i.children},a),o=es(o,a,n,null),o.flags|=2,i.return=t,o.return=t,i.sibling=o,t.child=i,os(t,e.child,null,n),i=t.child,i.memoizedState=$u(n),i.childLanes=tf(e,r,n),t.memoizedState=Ju,t=ro(null,i));else if(la(t),Wh(o)){if(r=o.nextSibling&&o.nextSibling.dataset,r)var c=r.dgst;r=c,i=Error($(419)),i.stack="",i.digest=r,Do({value:i,source:null,stack:null}),t=ef(e,t,n)}else if(ze||Pr(e,t,n,!1),r=(n&e.childLanes)!==0,ze||r){if(r=ge,r!==null&&(i=v_(r,n),i!==0&&i!==l.retryLane))throw l.retryLane=i,gs(e,i),xn(r,e,i),Rp;Xh(o)||kc(),t=ef(e,t,n)}else Xh(o)?(t.flags|=192,t.child=e.child,t=null):(e=l.treeContext,Me=ti(o.nextSibling),Ke=t,$t=!0,va=null,Qn=!1,e!==null&&Y_(t,e),t=Lh(t,i.children),t.flags|=4096);return t}return a?(ca(),o=i.fallback,a=t.mode,l=e.child,c=l.sibling,i=Hi(l,{mode:"hidden",children:i.children}),i.subtreeFlags=l.subtreeFlags&65011712,c!==null?o=Hi(c,o):(o=es(o,a,n,null),o.flags|=2),o.return=t,i.return=t,i.sibling=o,t.child=i,ro(null,i),i=t.child,o=e.child.memoizedState,o===null?o=$u(n):(a=o.cachePool,a!==null?(l=Pe._currentValue,a=a.parent!==l?{parent:l,pool:l}:a):a=K_(),o={baseLanes:o.baseLanes|n,cachePool:a}),i.memoizedState=o,i.childLanes=tf(e,r,n),t.memoizedState=Ju,ro(e.child,i)):(la(t),n=e.child,e=n.sibling,n=Hi(n,{mode:"visible",children:i.children}),n.return=t,n.sibling=null,e!==null&&(r=t.deletions,r===null?(t.deletions=[e],t.flags|=16):r.push(e)),t.child=n,t.memoizedState=null,n)}function Lh(e,t){return t=Fc({mode:"visible",children:t},e.mode),t.return=e,e.child=t}function Fc(e,t){return e=Ln(22,e,null,t),e.lanes=0,e}function ef(e,t,n){return os(t,e.child,null,n),e=Lh(t,t.pendingProps.children),e.flags|=2,t.memoizedState=null,e}function ig(e,t,n){e.lanes|=t;var i=e.alternate;i!==null&&(i.lanes|=t),yh(e.return,t,n)}function nf(e,t,n,i,a,s){var r=e.memoizedState;r===null?e.memoizedState={isBackwards:t,rendering:null,renderingStartTime:0,last:i,tail:n,tailMode:a,treeForkCount:s}:(r.isBackwards=t,r.rendering=null,r.renderingStartTime=0,r.last=i,r.tail=n,r.tailMode=a,r.treeForkCount=s)}function kv(e,t,n){var i=t.pendingProps,a=i.revealOrder,s=i.tail;i=i.children;var r=De.current,o=(r&2)!==0;if(o?(r=r&1|2,t.flags|=128):r&=1,_e(De,r),Ye(e,t,i,n),i=$t?Co:0,!o&&e!==null&&e.flags&128)t:for(e=t.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&ig(e,n,t);else if(e.tag===19)ig(e,n,t);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break t;for(;e.sibling===null;){if(e.return===null||e.return===t)break t;e=e.return}e.sibling.return=e.return,e=e.sibling}switch(a){case"forwards":for(n=t.child,a=null;n!==null;)e=n.alternate,e!==null&&Pc(e)===null&&(a=n),n=n.sibling;n=a,n===null?(a=t.child,t.child=null):(a=n.sibling,n.sibling=null),nf(t,!1,a,n,s,i);break;case"backwards":case"unstable_legacy-backwards":for(n=null,a=t.child,t.child=null;a!==null;){if(e=a.alternate,e!==null&&Pc(e)===null){t.child=a;break}e=a.sibling,a.sibling=n,n=a,a=e}nf(t,!0,n,null,s,i);break;case"together":nf(t,!1,null,null,void 0,i);break;default:t.memoizedState=null}return t.child}function Wi(e,t,n){if(e!==null&&(t.dependencies=e.dependencies),Na|=t.lanes,!(n&t.childLanes))if(e!==null){if(Pr(e,t,n,!1),(n&t.childLanes)===0)return null}else return null;if(e!==null&&t.child!==e.child)throw Error($(153));if(t.child!==null){for(e=t.child,n=Hi(e,e.pendingProps),t.child=n,n.return=t;e.sibling!==null;)e=e.sibling,n=n.sibling=Hi(e,e.pendingProps),n.return=t;n.sibling=null}return t.child}function wp(e,t){return e.lanes&t?!0:(e=e.dependencies,!!(e!==null&&Uc(e)))}function TM(e,t,n){switch(t.tag){case 3:Tc(t,t.stateNode.containerInfo),oa(t,Pe,e.memoizedState.cache),ss();break;case 27:case 5:oh(t);break;case 4:Tc(t,t.stateNode.containerInfo);break;case 10:oa(t,t.type,t.memoizedProps.value);break;case 31:if(t.memoizedState!==null)return t.flags|=128,Ah(t),null;break;case 13:var i=t.memoizedState;if(i!==null)return i.dehydrated!==null?(la(t),t.flags|=128,null):n&t.child.childLanes?Vv(e,t,n):(la(t),e=Wi(e,t,n),e!==null?e.sibling:null);la(t);break;case 19:var a=(e.flags&128)!==0;if(i=(n&t.childLanes)!==0,i||(Pr(e,t,n,!1),i=(n&t.childLanes)!==0),a){if(i)return kv(e,t,n);t.flags|=128}if(a=t.memoizedState,a!==null&&(a.rendering=null,a.tail=null,a.lastEffect=null),_e(De,De.current),i)break;return null;case 22:return t.lanes=0,Gv(e,t,n,t.pendingProps);case 24:oa(t,Pe,e.memoizedState.cache)}return Wi(e,t,n)}function jv(e,t,n){if(e!==null)if(e.memoizedProps!==t.pendingProps)ze=!0;else{if(!wp(e,n)&&!(t.flags&128))return ze=!1,TM(e,t,n);ze=!!(e.flags&131072)}else ze=!1,$t&&t.flags&1048576&&q_(t,Co,t.index);switch(t.lanes=0,t.tag){case 16:t:{var i=t.pendingProps;if(e=Wa(t.elementType),t.type=e,typeof e=="function")rp(e)?(i=cs(e,i),t.tag=1,t=eg(null,t,e,i,n)):(t.tag=0,t=Uh(null,t,e,i,n));else{if(e!=null){var a=e.$$typeof;if(a===Wd){t.tag=11,t=Km(null,t,e,i,n);break t}else if(a===qd){t.tag=14,t=Qm(null,t,e,i,n);break t}}throw t=sh(e)||e,Error($(306,t,""))}}return t;case 0:return Uh(e,t,t.type,t.pendingProps,n);case 1:return i=t.type,a=cs(i,t.pendingProps),eg(e,t,i,a,n);case 3:t:{if(Tc(t,t.stateNode.containerInfo),e===null)throw Error($(387));i=t.pendingProps;var s=t.memoizedState;a=s.element,Eh(e,t),_o(t,i,null,n);var r=t.memoizedState;if(i=r.cache,oa(t,Pe,i),i!==s.cache&&Sh(t,[Pe],n,!0),go(),i=r.element,s.isDehydrated)if(s={element:i,isDehydrated:!1,cache:r.cache},t.updateQueue.baseState=s,t.memoizedState=s,t.flags&256){t=ng(e,t,i,n);break t}else if(i!==a){a=Kn(Error($(424)),t),Do(a),t=ng(e,t,i,n);break t}else{switch(e=t.stateNode.containerInfo,e.nodeType){case 9:e=e.body;break;default:e=e.nodeName==="HTML"?e.ownerDocument.body:e}for(Me=ti(e.firstChild),Ke=t,$t=!0,va=null,Qn=!0,n=$_(t,null,i,n),t.child=n;n;)n.flags=n.flags&-3|4096,n=n.sibling}else{if(ss(),i===a){t=Wi(e,t,n);break t}Ye(e,t,i,n)}t=t.child}return t;case 26:return cc(e,t),e===null?(n=Eg(t.type,null,t.pendingProps,null))?t.memoizedState=n:$t||(n=t.type,e=t.pendingProps,i=qc(_a.current).createElement(n),i[Ze]=t,i[En]=e,Je(i,n,e),je(i),t.stateNode=i):t.memoizedState=Eg(t.type,e.memoizedProps,t.pendingProps,e.memoizedState),null;case 27:return oh(t),e===null&&$t&&(i=t.stateNode=Ox(t.type,t.pendingProps,_a.current),Ke=t,Qn=!0,a=Me,Pa(t.type)?(qh=a,Me=ti(i.firstChild)):Me=a),Ye(e,t,t.pendingProps.children,n),cc(e,t),e===null&&(t.flags|=4194304),t.child;case 5:return e===null&&$t&&((a=i=Me)&&(i=eE(i,t.type,t.pendingProps,Qn),i!==null?(t.stateNode=i,Ke=t,Me=ti(i.firstChild),Qn=!1,a=!0):a=!1),a||Ca(t)),oh(t),a=t.type,s=t.pendingProps,r=e!==null?e.memoizedProps:null,i=s.children,kh(a,s)?i=null:r!==null&&kh(a,r)&&(t.flags|=32),t.memoizedState!==null&&(a=mp(e,t,gM,null,null,n),zo._currentValue=a),cc(e,t),Ye(e,t,i,n),t.child;case 6:return e===null&&$t&&((e=n=Me)&&(n=nE(n,t.pendingProps,Qn),n!==null?(t.stateNode=n,Ke=t,Me=null,e=!0):e=!1),e||Ca(t)),null;case 13:return Vv(e,t,n);case 4:return Tc(t,t.stateNode.containerInfo),i=t.pendingProps,e===null?t.child=os(t,null,i,n):Ye(e,t,i,n),t.child;case 11:return Km(e,t,t.type,t.pendingProps,n);case 7:return Ye(e,t,t.pendingProps,n),t.child;case 8:return Ye(e,t,t.pendingProps.children,n),t.child;case 12:return Ye(e,t,t.pendingProps.children,n),t.child;case 10:return i=t.pendingProps,oa(t,t.type,i.value),Ye(e,t,i.children,n),t.child;case 9:return a=t.type._context,i=t.pendingProps.children,rs(t),a=Qe(a),i=i(a),t.flags|=1,Ye(e,t,i,n),t.child;case 14:return Qm(e,t,t.type,t.pendingProps,n);case 15:return Hv(e,t,t.type,t.pendingProps,n);case 19:return kv(e,t,n);case 31:return bM(e,t,n);case 22:return Gv(e,t,n,t.pendingProps);case 24:return rs(t),i=Qe(Pe),e===null?(a=up(),a===null&&(a=ge,s=cp(),a.pooledCache=s,s.refCount++,s!==null&&(a.pooledCacheLanes|=n),a=s),t.memoizedState={parent:i,cache:a},hp(t),oa(t,Pe,a)):(e.lanes&n&&(Eh(e,t),_o(t,null,null,n),go()),a=e.memoizedState,s=t.memoizedState,a.parent!==i?(a={parent:i,cache:i},t.memoizedState=a,t.lanes===0&&(t.memoizedState=t.updateQueue.baseState=a),oa(t,Pe,i)):(i=s.cache,oa(t,Pe,i),i!==a.cache&&Sh(t,[Pe],n,!0))),Ye(e,t,t.pendingProps.children,n),t.child;case 29:throw t.pendingProps}throw Error($(156,t.tag))}function Ei(e){e.flags|=4}function af(e,t,n,i,a){if((t=(e.mode&32)!==0)&&(t=!1),t){if(e.flags|=16777216,(a&335544128)===a)if(e.stateNode.complete)e.flags|=8192;else if(px())e.flags|=8192;else throw is=Lc,fp}else e.flags&=-16777217}function ag(e,t){if(t.type!=="stylesheet"||t.state.loading&4)e.flags&=-16777217;else if(e.flags|=16777216,!Ix(t))if(px())e.flags|=8192;else throw is=Lc,fp}function xl(e,t){t!==null&&(e.flags|=4),e.flags&16384&&(t=e.tag!==22?m_():536870912,e.lanes|=t,Sr|=t)}function Xr(e,t){if(!$t)switch(e.tailMode){case"hidden":t=e.tail;for(var n=null;t!==null;)t.alternate!==null&&(n=t),t=t.sibling;n===null?e.tail=null:n.sibling=null;break;case"collapsed":n=e.tail;for(var i=null;n!==null;)n.alternate!==null&&(i=n),n=n.sibling;i===null?t||e.tail===null?e.tail=null:e.tail.sibling=null:i.sibling=null}}function ye(e){var t=e.alternate!==null&&e.alternate.child===e.child,n=0,i=0;if(t)for(var a=e.child;a!==null;)n|=a.lanes|a.childLanes,i|=a.subtreeFlags&65011712,i|=a.flags&65011712,a.return=e,a=a.sibling;else for(a=e.child;a!==null;)n|=a.lanes|a.childLanes,i|=a.subtreeFlags,i|=a.flags,a.return=e,a=a.sibling;return e.subtreeFlags|=i,e.childLanes=n,t}function AM(e,t,n){var i=t.pendingProps;switch(lp(t),t.tag){case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return ye(t),null;case 1:return ye(t),null;case 3:return n=t.stateNode,i=null,e!==null&&(i=e.memoizedState.cache),t.memoizedState.cache!==i&&(t.flags|=2048),Gi(Pe),mr(),n.pendingContext&&(n.context=n.pendingContext,n.pendingContext=null),(e===null||e.child===null)&&(Ms(t)?Ei(t):e===null||e.memoizedState.isDehydrated&&!(t.flags&256)||(t.flags|=1024,Yu())),ye(t),null;case 26:var a=t.type,s=t.memoizedState;return e===null?(Ei(t),s!==null?(ye(t),ag(t,s)):(ye(t),af(t,a,null,i,n))):s?s!==e.memoizedState?(Ei(t),ye(t),ag(t,s)):(ye(t),t.flags&=-16777217):(e=e.memoizedProps,e!==i&&Ei(t),ye(t),af(t,a,e,i,n)),null;case 27:if(Ac(t),n=_a.current,a=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==i&&Ei(t);else{if(!i){if(t.stateNode===null)throw Error($(166));return ye(t),null}e=vi.current,Ms(t)?Lm(t):(e=Ox(a,i,n),t.stateNode=e,Ei(t))}return ye(t),null;case 5:if(Ac(t),a=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==i&&Ei(t);else{if(!i){if(t.stateNode===null)throw Error($(166));return ye(t),null}if(s=vi.current,Ms(t))Lm(t);else{var r=qc(_a.current);switch(s){case 1:s=r.createElementNS("http://www.w3.org/2000/svg",a);break;case 2:s=r.createElementNS("http://www.w3.org/1998/Math/MathML",a);break;default:switch(a){case"svg":s=r.createElementNS("http://www.w3.org/2000/svg",a);break;case"math":s=r.createElementNS("http://www.w3.org/1998/Math/MathML",a);break;case"script":s=r.createElement("div"),s.innerHTML="<script><\/script>",s=s.removeChild(s.firstChild);break;case"select":s=typeof i.is=="string"?r.createElement("select",{is:i.is}):r.createElement("select"),i.multiple?s.multiple=!0:i.size&&(s.size=i.size);break;default:s=typeof i.is=="string"?r.createElement(a,{is:i.is}):r.createElement(a)}}s[Ze]=t,s[En]=i;t:for(r=t.child;r!==null;){if(r.tag===5||r.tag===6)s.appendChild(r.stateNode);else if(r.tag!==4&&r.tag!==27&&r.child!==null){r.child.return=r,r=r.child;continue}if(r===t)break t;for(;r.sibling===null;){if(r.return===null||r.return===t)break t;r=r.return}r.sibling.return=r.return,r=r.sibling}t.stateNode=s;t:switch(Je(s,a,i),a){case"button":case"input":case"select":case"textarea":i=!!i.autoFocus;break t;case"img":i=!0;break t;default:i=!1}i&&Ei(t)}}return ye(t),af(t,t.type,e===null?null:e.memoizedProps,t.pendingProps,n),null;case 6:if(e&&t.stateNode!=null)e.memoizedProps!==i&&Ei(t);else{if(typeof i!="string"&&t.stateNode===null)throw Error($(166));if(e=_a.current,Ms(t)){if(e=t.stateNode,n=t.memoizedProps,i=null,a=Ke,a!==null)switch(a.tag){case 27:case 5:i=a.memoizedProps}e[Ze]=t,e=!!(e.nodeValue===n||i!==null&&i.suppressHydrationWarning===!0||Dx(e.nodeValue,n)),e||Ca(t,!0)}else e=qc(e).createTextNode(i),e[Ze]=t,t.stateNode=e}return ye(t),null;case 31:if(n=t.memoizedState,e===null||e.memoizedState!==null){if(i=Ms(t),n!==null){if(e===null){if(!i)throw Error($(318));if(e=t.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error($(557));e[Ze]=t}else ss(),!(t.flags&128)&&(t.memoizedState=null),t.flags|=4;ye(t),e=!1}else n=Yu(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=n),e=!0;if(!e)return t.flags&256?(Nn(t),t):(Nn(t),null);if(t.flags&128)throw Error($(558))}return ye(t),null;case 13:if(i=t.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(a=Ms(t),i!==null&&i.dehydrated!==null){if(e===null){if(!a)throw Error($(318));if(a=t.memoizedState,a=a!==null?a.dehydrated:null,!a)throw Error($(317));a[Ze]=t}else ss(),!(t.flags&128)&&(t.memoizedState=null),t.flags|=4;ye(t),a=!1}else a=Yu(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=a),a=!0;if(!a)return t.flags&256?(Nn(t),t):(Nn(t),null)}return Nn(t),t.flags&128?(t.lanes=n,t):(n=i!==null,e=e!==null&&e.memoizedState!==null,n&&(i=t.child,a=null,i.alternate!==null&&i.alternate.memoizedState!==null&&i.alternate.memoizedState.cachePool!==null&&(a=i.alternate.memoizedState.cachePool.pool),s=null,i.memoizedState!==null&&i.memoizedState.cachePool!==null&&(s=i.memoizedState.cachePool.pool),s!==a&&(i.flags|=2048)),n!==e&&n&&(t.child.flags|=8192),xl(t,t.updateQueue),ye(t),null);case 4:return mr(),e===null&&Pp(t.stateNode.containerInfo),ye(t),null;case 10:return Gi(t.type),ye(t),null;case 19:if(Xe(De),i=t.memoizedState,i===null)return ye(t),null;if(a=(t.flags&128)!==0,s=i.rendering,s===null)if(a)Xr(i,!1);else{if(we!==0||e!==null&&e.flags&128)for(e=t.child;e!==null;){if(s=Pc(e),s!==null){for(t.flags|=128,Xr(i,!1),e=s.updateQueue,t.updateQueue=e,xl(t,e),t.subtreeFlags=0,e=n,n=t.child;n!==null;)X_(n,e),n=n.sibling;return _e(De,De.current&1|2),$t&&Li(t,i.treeForkCount),t.child}e=e.sibling}i.tail!==null&&Pn()>Gc&&(t.flags|=128,a=!0,Xr(i,!1),t.lanes=4194304)}else{if(!a)if(e=Pc(s),e!==null){if(t.flags|=128,a=!0,e=e.updateQueue,t.updateQueue=e,xl(t,e),Xr(i,!0),i.tail===null&&i.tailMode==="hidden"&&!s.alternate&&!$t)return ye(t),null}else 2*Pn()-i.renderingStartTime>Gc&&n!==536870912&&(t.flags|=128,a=!0,Xr(i,!1),t.lanes=4194304);i.isBackwards?(s.sibling=t.child,t.child=s):(e=i.last,e!==null?e.sibling=s:t.child=s,i.last=s)}return i.tail!==null?(e=i.tail,i.rendering=e,i.tail=e.sibling,i.renderingStartTime=Pn(),e.sibling=null,n=De.current,_e(De,a?n&1|2:n&1),$t&&Li(t,i.treeForkCount),e):(ye(t),null);case 22:case 23:return Nn(t),dp(),i=t.memoizedState!==null,e!==null?e.memoizedState!==null!==i&&(t.flags|=8192):i&&(t.flags|=8192),i?n&536870912&&!(t.flags&128)&&(ye(t),t.subtreeFlags&6&&(t.flags|=8192)):ye(t),n=t.updateQueue,n!==null&&xl(t,n.retryQueue),n=null,e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(n=e.memoizedState.cachePool.pool),i=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(i=t.memoizedState.cachePool.pool),i!==n&&(t.flags|=2048),e!==null&&Xe(ns),null;case 24:return n=null,e!==null&&(n=e.memoizedState.cache),t.memoizedState.cache!==n&&(t.flags|=2048),Gi(Pe),ye(t),null;case 25:return null;case 30:return null}throw Error($(156,t.tag))}function RM(e,t){switch(lp(t),t.tag){case 1:return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 3:return Gi(Pe),mr(),e=t.flags,e&65536&&!(e&128)?(t.flags=e&-65537|128,t):null;case 26:case 27:case 5:return Ac(t),null;case 31:if(t.memoizedState!==null){if(Nn(t),t.alternate===null)throw Error($(340));ss()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 13:if(Nn(t),e=t.memoizedState,e!==null&&e.dehydrated!==null){if(t.alternate===null)throw Error($(340));ss()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 19:return Xe(De),null;case 4:return mr(),null;case 10:return Gi(t.type),null;case 22:case 23:return Nn(t),dp(),e!==null&&Xe(ns),e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 24:return Gi(Pe),null;case 25:return null;default:return null}}function Xv(e,t){switch(lp(t),t.tag){case 3:Gi(Pe),mr();break;case 26:case 27:case 5:Ac(t);break;case 4:mr();break;case 31:t.memoizedState!==null&&Nn(t);break;case 13:Nn(t);break;case 19:Xe(De);break;case 10:Gi(t.type);break;case 22:case 23:Nn(t),dp(),e!==null&&Xe(ns);break;case 24:Gi(Pe)}}function Yo(e,t){try{var n=t.updateQueue,i=n!==null?n.lastEffect:null;if(i!==null){var a=i.next;n=a;do{if((n.tag&e)===e){i=void 0;var s=n.create,r=n.inst;i=s(),r.destroy=i}n=n.next}while(n!==a)}}catch(o){ue(t,t.return,o)}}function Da(e,t,n){try{var i=t.updateQueue,a=i!==null?i.lastEffect:null;if(a!==null){var s=a.next;i=s;do{if((i.tag&e)===e){var r=i.inst,o=r.destroy;if(o!==void 0){r.destroy=void 0,a=t;var l=n,c=o;try{c()}catch(h){ue(a,l,h)}}}i=i.next}while(i!==s)}}catch(h){ue(t,t.return,h)}}function Wv(e){var t=e.updateQueue;if(t!==null){var n=e.stateNode;try{ev(t,n)}catch(i){ue(e,e.return,i)}}}function qv(e,t,n){n.props=cs(e.type,e.memoizedProps),n.state=e.memoizedState;try{n.componentWillUnmount()}catch(i){ue(e,t,i)}}function xo(e,t){try{var n=e.ref;if(n!==null){switch(e.tag){case 26:case 27:case 5:var i=e.stateNode;break;case 30:i=e.stateNode;break;default:i=e.stateNode}typeof n=="function"?e.refCleanup=n(i):n.current=i}}catch(a){ue(e,t,a)}}function _i(e,t){var n=e.ref,i=e.refCleanup;if(n!==null)if(typeof i=="function")try{i()}catch(a){ue(e,t,a)}finally{e.refCleanup=null,e=e.alternate,e!=null&&(e.refCleanup=null)}else if(typeof n=="function")try{n(null)}catch(a){ue(e,t,a)}else n.current=null}function Yv(e){var t=e.type,n=e.memoizedProps,i=e.stateNode;try{t:switch(t){case"button":case"input":case"select":case"textarea":n.autoFocus&&i.focus();break t;case"img":n.src?i.src=n.src:n.srcSet&&(i.srcset=n.srcSet)}}catch(a){ue(e,e.return,a)}}function sf(e,t,n){try{var i=e.stateNode;ZM(i,e.type,n,t),i[En]=t}catch(a){ue(e,e.return,a)}}function Zv(e){return e.tag===5||e.tag===3||e.tag===26||e.tag===27&&Pa(e.type)||e.tag===4}function rf(e){t:for(;;){for(;e.sibling===null;){if(e.return===null||Zv(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.tag===27&&Pa(e.type)||e.flags&2||e.child===null||e.tag===4)continue t;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function Oh(e,t,n){var i=e.tag;if(i===5||i===6)e=e.stateNode,t?(n.nodeType===9?n.body:n.nodeName==="HTML"?n.ownerDocument.body:n).insertBefore(e,t):(t=n.nodeType===9?n.body:n.nodeName==="HTML"?n.ownerDocument.body:n,t.appendChild(e),n=n._reactRootContainer,n!=null||t.onclick!==null||(t.onclick=zi));else if(i!==4&&(i===27&&Pa(e.type)&&(n=e.stateNode,t=null),e=e.child,e!==null))for(Oh(e,t,n),e=e.sibling;e!==null;)Oh(e,t,n),e=e.sibling}function Hc(e,t,n){var i=e.tag;if(i===5||i===6)e=e.stateNode,t?n.insertBefore(e,t):n.appendChild(e);else if(i!==4&&(i===27&&Pa(e.type)&&(n=e.stateNode),e=e.child,e!==null))for(Hc(e,t,n),e=e.sibling;e!==null;)Hc(e,t,n),e=e.sibling}function Kv(e){var t=e.stateNode,n=e.memoizedProps;try{for(var i=e.type,a=t.attributes;a.length;)t.removeAttributeNode(a[0]);Je(t,i,n),t[Ze]=e,t[En]=n}catch(s){ue(e,e.return,s)}}var Oi=!1,Oe=!1,of=!1,sg=typeof WeakSet=="function"?WeakSet:Set,ke=null;function wM(e,t){if(e=e.containerInfo,Gh=Qc,e=I_(e),ip(e)){if("selectionStart"in e)var n={start:e.selectionStart,end:e.selectionEnd};else t:{n=(n=e.ownerDocument)&&n.defaultView||window;var i=n.getSelection&&n.getSelection();if(i&&i.rangeCount!==0){n=i.anchorNode;var a=i.anchorOffset,s=i.focusNode;i=i.focusOffset;try{n.nodeType,s.nodeType}catch{n=null;break t}var r=0,o=-1,l=-1,c=0,h=0,d=e,f=null;e:for(;;){for(var p;d!==n||a!==0&&d.nodeType!==3||(o=r+a),d!==s||i!==0&&d.nodeType!==3||(l=r+i),d.nodeType===3&&(r+=d.nodeValue.length),(p=d.firstChild)!==null;)f=d,d=p;for(;;){if(d===e)break e;if(f===n&&++c===a&&(o=r),f===s&&++h===i&&(l=r),(p=d.nextSibling)!==null)break;d=f,f=d.parentNode}d=p}n=o===-1||l===-1?null:{start:o,end:l}}else n=null}n=n||{start:0,end:0}}else n=null;for(Vh={focusedElem:e,selectionRange:n},Qc=!1,ke=t;ke!==null;)if(t=ke,e=t.child,(t.subtreeFlags&1028)!==0&&e!==null)e.return=t,ke=e;else for(;ke!==null;){switch(t=ke,s=t.alternate,e=t.flags,t.tag){case 0:if(e&4&&(e=t.updateQueue,e=e!==null?e.events:null,e!==null))for(n=0;n<e.length;n++)a=e[n],a.ref.impl=a.nextImpl;break;case 11:case 15:break;case 1:if(e&1024&&s!==null){e=void 0,n=t,a=s.memoizedProps,s=s.memoizedState,i=n.stateNode;try{var v=cs(n.type,a);e=i.getSnapshotBeforeUpdate(v,s),i.__reactInternalSnapshotBeforeUpdate=e}catch(S){ue(n,n.return,S)}}break;case 3:if(e&1024){if(e=t.stateNode.containerInfo,n=e.nodeType,n===9)jh(e);else if(n===1)switch(e.nodeName){case"HEAD":case"HTML":case"BODY":jh(e);break;default:e.textContent=""}}break;case 5:case 26:case 27:case 6:case 4:case 17:break;default:if(e&1024)throw Error($(163))}if(e=t.sibling,e!==null){e.return=t.return,ke=e;break}ke=t.return}}function Qv(e,t,n){var i=n.flags;switch(n.tag){case 0:case 11:case 15:Ti(e,n),i&4&&Yo(5,n);break;case 1:if(Ti(e,n),i&4)if(e=n.stateNode,t===null)try{e.componentDidMount()}catch(r){ue(n,n.return,r)}else{var a=cs(n.type,t.memoizedProps);t=t.memoizedState;try{e.componentDidUpdate(a,t,e.__reactInternalSnapshotBeforeUpdate)}catch(r){ue(n,n.return,r)}}i&64&&Wv(n),i&512&&xo(n,n.return);break;case 3:if(Ti(e,n),i&64&&(e=n.updateQueue,e!==null)){if(t=null,n.child!==null)switch(n.child.tag){case 27:case 5:t=n.child.stateNode;break;case 1:t=n.child.stateNode}try{ev(e,t)}catch(r){ue(n,n.return,r)}}break;case 27:t===null&&i&4&&Kv(n);case 26:case 5:Ti(e,n),t===null&&i&4&&Yv(n),i&512&&xo(n,n.return);break;case 12:Ti(e,n);break;case 31:Ti(e,n),i&4&&tx(e,n);break;case 13:Ti(e,n),i&4&&ex(e,n),i&64&&(e=n.memoizedState,e!==null&&(e=e.dehydrated,e!==null&&(n=IM.bind(null,n),iE(e,n))));break;case 22:if(i=n.memoizedState!==null||Oi,!i){t=t!==null&&t.memoizedState!==null||Oe,a=Oi;var s=Oe;Oi=i,(Oe=t)&&!s?Ni(e,n,(n.subtreeFlags&8772)!==0):Ti(e,n),Oi=a,Oe=s}break;case 30:break;default:Ti(e,n)}}function Jv(e){var t=e.alternate;t!==null&&(e.alternate=null,Jv(t)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(t=e.stateNode,t!==null&&Qd(t)),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}var Te=null,gn=!1;function bi(e,t,n){for(n=n.child;n!==null;)$v(e,t,n),n=n.sibling}function $v(e,t,n){if(zn&&typeof zn.onCommitFiberUnmount=="function")try{zn.onCommitFiberUnmount(Go,n)}catch{}switch(n.tag){case 26:Oe||_i(n,t),bi(e,t,n),n.memoizedState?n.memoizedState.count--:n.stateNode&&(n=n.stateNode,n.parentNode.removeChild(n));break;case 27:Oe||_i(n,t);var i=Te,a=gn;Pa(n.type)&&(Te=n.stateNode,gn=!1),bi(e,t,n),Eo(n.stateNode),Te=i,gn=a;break;case 5:Oe||_i(n,t);case 6:if(i=Te,a=gn,Te=null,bi(e,t,n),Te=i,gn=a,Te!==null)if(gn)try{(Te.nodeType===9?Te.body:Te.nodeName==="HTML"?Te.ownerDocument.body:Te).removeChild(n.stateNode)}catch(s){ue(n,t,s)}else try{Te.removeChild(n.stateNode)}catch(s){ue(n,t,s)}break;case 18:Te!==null&&(gn?(e=Te,vg(e.nodeType===9?e.body:e.nodeName==="HTML"?e.ownerDocument.body:e,n.stateNode),Tr(e)):vg(Te,n.stateNode));break;case 4:i=Te,a=gn,Te=n.stateNode.containerInfo,gn=!0,bi(e,t,n),Te=i,gn=a;break;case 0:case 11:case 14:case 15:Da(2,n,t),Oe||Da(4,n,t),bi(e,t,n);break;case 1:Oe||(_i(n,t),i=n.stateNode,typeof i.componentWillUnmount=="function"&&qv(n,t,i)),bi(e,t,n);break;case 21:bi(e,t,n);break;case 22:Oe=(i=Oe)||n.memoizedState!==null,bi(e,t,n),Oe=i;break;default:bi(e,t,n)}}function tx(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null))){e=e.dehydrated;try{Tr(e)}catch(n){ue(t,t.return,n)}}}function ex(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null&&(e=e.dehydrated,e!==null))))try{Tr(e)}catch(n){ue(t,t.return,n)}}function CM(e){switch(e.tag){case 31:case 13:case 19:var t=e.stateNode;return t===null&&(t=e.stateNode=new sg),t;case 22:return e=e.stateNode,t=e._retryCache,t===null&&(t=e._retryCache=new sg),t;default:throw Error($(435,e.tag))}}function yl(e,t){var n=CM(e);t.forEach(function(i){if(!n.has(i)){n.add(i);var a=BM.bind(null,e,i);i.then(a,a)}})}function hn(e,t){var n=t.deletions;if(n!==null)for(var i=0;i<n.length;i++){var a=n[i],s=e,r=t,o=r;t:for(;o!==null;){switch(o.tag){case 27:if(Pa(o.type)){Te=o.stateNode,gn=!1;break t}break;case 5:Te=o.stateNode,gn=!1;break t;case 3:case 4:Te=o.stateNode.containerInfo,gn=!0;break t}o=o.return}if(Te===null)throw Error($(160));$v(s,r,a),Te=null,gn=!1,s=a.alternate,s!==null&&(s.return=null),a.return=null}if(t.subtreeFlags&13886)for(t=t.child;t!==null;)nx(t,e),t=t.sibling}var oi=null;function nx(e,t){var n=e.alternate,i=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:hn(t,e),dn(e),i&4&&(Da(3,e,e.return),Yo(3,e),Da(5,e,e.return));break;case 1:hn(t,e),dn(e),i&512&&(Oe||n===null||_i(n,n.return)),i&64&&Oi&&(e=e.updateQueue,e!==null&&(i=e.callbacks,i!==null&&(n=e.shared.hiddenCallbacks,e.shared.hiddenCallbacks=n===null?i:n.concat(i))));break;case 26:var a=oi;if(hn(t,e),dn(e),i&512&&(Oe||n===null||_i(n,n.return)),i&4){var s=n!==null?n.memoizedState:null;if(i=e.memoizedState,n===null)if(i===null)if(e.stateNode===null){t:{i=e.type,n=e.memoizedProps,a=a.ownerDocument||a;e:switch(i){case"title":s=a.getElementsByTagName("title")[0],(!s||s[jo]||s[Ze]||s.namespaceURI==="http://www.w3.org/2000/svg"||s.hasAttribute("itemprop"))&&(s=a.createElement(i),a.head.insertBefore(s,a.querySelector("head > title"))),Je(s,i,n),s[Ze]=e,je(s),i=s;break t;case"link":var r=Tg("link","href",a).get(i+(n.href||""));if(r){for(var o=0;o<r.length;o++)if(s=r[o],s.getAttribute("href")===(n.href==null||n.href===""?null:n.href)&&s.getAttribute("rel")===(n.rel==null?null:n.rel)&&s.getAttribute("title")===(n.title==null?null:n.title)&&s.getAttribute("crossorigin")===(n.crossOrigin==null?null:n.crossOrigin)){r.splice(o,1);break e}}s=a.createElement(i),Je(s,i,n),a.head.appendChild(s);break;case"meta":if(r=Tg("meta","content",a).get(i+(n.content||""))){for(o=0;o<r.length;o++)if(s=r[o],s.getAttribute("content")===(n.content==null?null:""+n.content)&&s.getAttribute("name")===(n.name==null?null:n.name)&&s.getAttribute("property")===(n.property==null?null:n.property)&&s.getAttribute("http-equiv")===(n.httpEquiv==null?null:n.httpEquiv)&&s.getAttribute("charset")===(n.charSet==null?null:n.charSet)){r.splice(o,1);break e}}s=a.createElement(i),Je(s,i,n),a.head.appendChild(s);break;default:throw Error($(468,i))}s[Ze]=e,je(s),i=s}e.stateNode=i}else Ag(a,e.type,e.stateNode);else e.stateNode=bg(a,i,e.memoizedProps);else s!==i?(s===null?n.stateNode!==null&&(n=n.stateNode,n.parentNode.removeChild(n)):s.count--,i===null?Ag(a,e.type,e.stateNode):bg(a,i,e.memoizedProps)):i===null&&e.stateNode!==null&&sf(e,e.memoizedProps,n.memoizedProps)}break;case 27:hn(t,e),dn(e),i&512&&(Oe||n===null||_i(n,n.return)),n!==null&&i&4&&sf(e,e.memoizedProps,n.memoizedProps);break;case 5:if(hn(t,e),dn(e),i&512&&(Oe||n===null||_i(n,n.return)),e.flags&32){a=e.stateNode;try{_r(a,"")}catch(v){ue(e,e.return,v)}}i&4&&e.stateNode!=null&&(a=e.memoizedProps,sf(e,a,n!==null?n.memoizedProps:a)),i&1024&&(of=!0);break;case 6:if(hn(t,e),dn(e),i&4){if(e.stateNode===null)throw Error($(162));i=e.memoizedProps,n=e.stateNode;try{n.nodeValue=i}catch(v){ue(e,e.return,v)}}break;case 3:if(hc=null,a=oi,oi=Yc(t.containerInfo),hn(t,e),oi=a,dn(e),i&4&&n!==null&&n.memoizedState.isDehydrated)try{Tr(t.containerInfo)}catch(v){ue(e,e.return,v)}of&&(of=!1,ix(e));break;case 4:i=oi,oi=Yc(e.stateNode.containerInfo),hn(t,e),dn(e),oi=i;break;case 12:hn(t,e),dn(e);break;case 31:hn(t,e),dn(e),i&4&&(i=e.updateQueue,i!==null&&(e.updateQueue=null,yl(e,i)));break;case 13:hn(t,e),dn(e),e.child.flags&8192&&e.memoizedState!==null!=(n!==null&&n.memoizedState!==null)&&(Su=Pn()),i&4&&(i=e.updateQueue,i!==null&&(e.updateQueue=null,yl(e,i)));break;case 22:a=e.memoizedState!==null;var l=n!==null&&n.memoizedState!==null,c=Oi,h=Oe;if(Oi=c||a,Oe=h||l,hn(t,e),Oe=h,Oi=c,dn(e),i&8192)t:for(t=e.stateNode,t._visibility=a?t._visibility&-2:t._visibility|1,a&&(n===null||l||Oi||Oe||qa(e)),n=null,t=e;;){if(t.tag===5||t.tag===26){if(n===null){l=n=t;try{if(s=l.stateNode,a)r=s.style,typeof r.setProperty=="function"?r.setProperty("display","none","important"):r.display="none";else{o=l.stateNode;var d=l.memoizedProps.style,f=d!=null&&d.hasOwnProperty("display")?d.display:null;o.style.display=f==null||typeof f=="boolean"?"":(""+f).trim()}}catch(v){ue(l,l.return,v)}}}else if(t.tag===6){if(n===null){l=t;try{l.stateNode.nodeValue=a?"":l.memoizedProps}catch(v){ue(l,l.return,v)}}}else if(t.tag===18){if(n===null){l=t;try{var p=l.stateNode;a?xg(p,!0):xg(l.stateNode,!1)}catch(v){ue(l,l.return,v)}}}else if((t.tag!==22&&t.tag!==23||t.memoizedState===null||t===e)&&t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break t;for(;t.sibling===null;){if(t.return===null||t.return===e)break t;n===t&&(n=null),t=t.return}n===t&&(n=null),t.sibling.return=t.return,t=t.sibling}i&4&&(i=e.updateQueue,i!==null&&(n=i.retryQueue,n!==null&&(i.retryQueue=null,yl(e,n))));break;case 19:hn(t,e),dn(e),i&4&&(i=e.updateQueue,i!==null&&(e.updateQueue=null,yl(e,i)));break;case 30:break;case 21:break;default:hn(t,e),dn(e)}}function dn(e){var t=e.flags;if(t&2){try{for(var n,i=e.return;i!==null;){if(Zv(i)){n=i;break}i=i.return}if(n==null)throw Error($(160));switch(n.tag){case 27:var a=n.stateNode,s=rf(e);Hc(e,s,a);break;case 5:var r=n.stateNode;n.flags&32&&(_r(r,""),n.flags&=-33);var o=rf(e);Hc(e,o,r);break;case 3:case 4:var l=n.stateNode.containerInfo,c=rf(e);Oh(e,c,l);break;default:throw Error($(161))}}catch(h){ue(e,e.return,h)}e.flags&=-3}t&4096&&(e.flags&=-4097)}function ix(e){if(e.subtreeFlags&1024)for(e=e.child;e!==null;){var t=e;ix(t),t.tag===5&&t.flags&1024&&t.stateNode.reset(),e=e.sibling}}function Ti(e,t){if(t.subtreeFlags&8772)for(t=t.child;t!==null;)Qv(e,t.alternate,t),t=t.sibling}function qa(e){for(e=e.child;e!==null;){var t=e;switch(t.tag){case 0:case 11:case 14:case 15:Da(4,t,t.return),qa(t);break;case 1:_i(t,t.return);var n=t.stateNode;typeof n.componentWillUnmount=="function"&&qv(t,t.return,n),qa(t);break;case 27:Eo(t.stateNode);case 26:case 5:_i(t,t.return),qa(t);break;case 22:t.memoizedState===null&&qa(t);break;case 30:qa(t);break;default:qa(t)}e=e.sibling}}function Ni(e,t,n){for(n=n&&(t.subtreeFlags&8772)!==0,t=t.child;t!==null;){var i=t.alternate,a=e,s=t,r=s.flags;switch(s.tag){case 0:case 11:case 15:Ni(a,s,n),Yo(4,s);break;case 1:if(Ni(a,s,n),i=s,a=i.stateNode,typeof a.componentDidMount=="function")try{a.componentDidMount()}catch(c){ue(i,i.return,c)}if(i=s,a=i.updateQueue,a!==null){var o=i.stateNode;try{var l=a.shared.hiddenCallbacks;if(l!==null)for(a.shared.hiddenCallbacks=null,a=0;a<l.length;a++)tv(l[a],o)}catch(c){ue(i,i.return,c)}}n&&r&64&&Wv(s),xo(s,s.return);break;case 27:Kv(s);case 26:case 5:Ni(a,s,n),n&&i===null&&r&4&&Yv(s),xo(s,s.return);break;case 12:Ni(a,s,n);break;case 31:Ni(a,s,n),n&&r&4&&tx(a,s);break;case 13:Ni(a,s,n),n&&r&4&&ex(a,s);break;case 22:s.memoizedState===null&&Ni(a,s,n),xo(s,s.return);break;case 30:break;default:Ni(a,s,n)}t=t.sibling}}function Cp(e,t){var n=null;e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(n=e.memoizedState.cachePool.pool),e=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(e=t.memoizedState.cachePool.pool),e!==n&&(e!=null&&e.refCount++,n!=null&&Wo(n))}function Dp(e,t){e=null,t.alternate!==null&&(e=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==e&&(t.refCount++,e!=null&&Wo(e))}function ii(e,t,n,i){if(t.subtreeFlags&10256)for(t=t.child;t!==null;)ax(e,t,n,i),t=t.sibling}function ax(e,t,n,i){var a=t.flags;switch(t.tag){case 0:case 11:case 15:ii(e,t,n,i),a&2048&&Yo(9,t);break;case 1:ii(e,t,n,i);break;case 3:ii(e,t,n,i),a&2048&&(e=null,t.alternate!==null&&(e=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==e&&(t.refCount++,e!=null&&Wo(e)));break;case 12:if(a&2048){ii(e,t,n,i),e=t.stateNode;try{var s=t.memoizedProps,r=s.id,o=s.onPostCommit;typeof o=="function"&&o(r,t.alternate===null?"mount":"update",e.passiveEffectDuration,-0)}catch(l){ue(t,t.return,l)}}else ii(e,t,n,i);break;case 31:ii(e,t,n,i);break;case 13:ii(e,t,n,i);break;case 23:break;case 22:s=t.stateNode,r=t.alternate,t.memoizedState!==null?s._visibility&2?ii(e,t,n,i):yo(e,t):s._visibility&2?ii(e,t,n,i):(s._visibility|=2,Fs(e,t,n,i,(t.subtreeFlags&10256)!==0||!1)),a&2048&&Cp(r,t);break;case 24:ii(e,t,n,i),a&2048&&Dp(t.alternate,t);break;default:ii(e,t,n,i)}}function Fs(e,t,n,i,a){for(a=a&&((t.subtreeFlags&10256)!==0||!1),t=t.child;t!==null;){var s=e,r=t,o=n,l=i,c=r.flags;switch(r.tag){case 0:case 11:case 15:Fs(s,r,o,l,a),Yo(8,r);break;case 23:break;case 22:var h=r.stateNode;r.memoizedState!==null?h._visibility&2?Fs(s,r,o,l,a):yo(s,r):(h._visibility|=2,Fs(s,r,o,l,a)),a&&c&2048&&Cp(r.alternate,r);break;case 24:Fs(s,r,o,l,a),a&&c&2048&&Dp(r.alternate,r);break;default:Fs(s,r,o,l,a)}t=t.sibling}}function yo(e,t){if(t.subtreeFlags&10256)for(t=t.child;t!==null;){var n=e,i=t,a=i.flags;switch(i.tag){case 22:yo(n,i),a&2048&&Cp(i.alternate,i);break;case 24:yo(n,i),a&2048&&Dp(i.alternate,i);break;default:yo(n,i)}t=t.sibling}}var oo=8192;function Es(e,t,n){if(e.subtreeFlags&oo)for(e=e.child;e!==null;)sx(e,t,n),e=e.sibling}function sx(e,t,n){switch(e.tag){case 26:Es(e,t,n),e.flags&oo&&e.memoizedState!==null&&mE(n,oi,e.memoizedState,e.memoizedProps);break;case 5:Es(e,t,n);break;case 3:case 4:var i=oi;oi=Yc(e.stateNode.containerInfo),Es(e,t,n),oi=i;break;case 22:e.memoizedState===null&&(i=e.alternate,i!==null&&i.memoizedState!==null?(i=oo,oo=16777216,Es(e,t,n),oo=i):Es(e,t,n));break;default:Es(e,t,n)}}function rx(e){var t=e.alternate;if(t!==null&&(e=t.child,e!==null)){t.child=null;do t=e.sibling,e.sibling=null,e=t;while(e!==null)}}function Wr(e){var t=e.deletions;if(e.flags&16){if(t!==null)for(var n=0;n<t.length;n++){var i=t[n];ke=i,lx(i,e)}rx(e)}if(e.subtreeFlags&10256)for(e=e.child;e!==null;)ox(e),e=e.sibling}function ox(e){switch(e.tag){case 0:case 11:case 15:Wr(e),e.flags&2048&&Da(9,e,e.return);break;case 3:Wr(e);break;case 12:Wr(e);break;case 22:var t=e.stateNode;e.memoizedState!==null&&t._visibility&2&&(e.return===null||e.return.tag!==13)?(t._visibility&=-3,uc(e)):Wr(e);break;default:Wr(e)}}function uc(e){var t=e.deletions;if(e.flags&16){if(t!==null)for(var n=0;n<t.length;n++){var i=t[n];ke=i,lx(i,e)}rx(e)}for(e=e.child;e!==null;){switch(t=e,t.tag){case 0:case 11:case 15:Da(8,t,t.return),uc(t);break;case 22:n=t.stateNode,n._visibility&2&&(n._visibility&=-3,uc(t));break;default:uc(t)}e=e.sibling}}function lx(e,t){for(;ke!==null;){var n=ke;switch(n.tag){case 0:case 11:case 15:Da(8,n,t);break;case 23:case 22:if(n.memoizedState!==null&&n.memoizedState.cachePool!==null){var i=n.memoizedState.cachePool.pool;i!=null&&i.refCount++}break;case 24:Wo(n.memoizedState.cache)}if(i=n.child,i!==null)i.return=n,ke=i;else t:for(n=e;ke!==null;){i=ke;var a=i.sibling,s=i.return;if(Jv(i),i===n){ke=null;break t}if(a!==null){a.return=s,ke=a;break t}ke=s}}}var DM={getCacheForType:function(e){var t=Qe(Pe),n=t.data.get(e);return n===void 0&&(n=e(),t.data.set(e,n)),n},cacheSignal:function(){return Qe(Pe).controller.signal}},NM=typeof WeakMap=="function"?WeakMap:Map,ne=0,ge=null,Qt=null,Jt=0,ce=0,Dn=null,pa=!1,Ir=!1,Np=!1,qi=0,we=0,Na=0,as=0,Up=0,On=0,Sr=0,So=null,_n=null,Ph=!1,Su=0,cx=0,Gc=1/0,Vc=null,Sa=null,Be=0,Ma=null,Mr=null,Vi=0,zh=0,Ih=null,ux=null,Mo=0,Bh=null;function Bn(){return ne&2&&Jt!==0?Jt&-Jt:Pt.T!==null?Op():x_()}function fx(){if(On===0)if(!(Jt&536870912)||$t){var e=hl;hl<<=1,!(hl&3932160)&&(hl=262144),On=e}else On=536870912;return e=Hn.current,e!==null&&(e.flags|=32),On}function xn(e,t,n){(e===ge&&(ce===2||ce===9)||e.cancelPendingCommit!==null)&&(Er(e,0),ma(e,Jt,On,!1)),ko(e,n),(!(ne&2)||e!==ge)&&(e===ge&&(!(ne&2)&&(as|=n),we===4&&ma(e,Jt,On,!1)),Si(e))}function hx(e,t,n){if(ne&6)throw Error($(327));var i=!n&&(t&127)===0&&(t&e.expiredLanes)===0||Vo(e,t),a=i?OM(e,t):lf(e,t,!0),s=i;do{if(a===0){Ir&&!i&&ma(e,t,0,!1);break}else{if(n=e.current.alternate,s&&!UM(n)){a=lf(e,t,!1),s=!1;continue}if(a===2){if(s=t,e.errorRecoveryDisabledLanes&s)var r=0;else r=e.pendingLanes&-536870913,r=r!==0?r:r&536870912?536870912:0;if(r!==0){t=r;t:{var o=e;a=So;var l=o.current.memoizedState.isDehydrated;if(l&&(Er(o,r).flags|=256),r=lf(o,r,!1),r!==2){if(Np&&!l){o.errorRecoveryDisabledLanes|=s,as|=s,a=4;break t}s=_n,_n=a,s!==null&&(_n===null?_n=s:_n.push.apply(_n,s))}a=r}if(s=!1,a!==2)continue}}if(a===1){Er(e,0),ma(e,t,0,!0);break}t:{switch(i=e,s=a,s){case 0:case 1:throw Error($(345));case 4:if((t&4194048)!==t)break;case 6:ma(i,t,On,!pa);break t;case 2:_n=null;break;case 3:case 5:break;default:throw Error($(329))}if((t&62914560)===t&&(a=Su+300-Pn(),10<a)){if(ma(i,t,On,!pa),uu(i,0,!0)!==0)break t;Vi=t,i.timeoutHandle=Ux(rg.bind(null,i,n,_n,Vc,Ph,t,On,as,Sr,pa,s,"Throttled",-0,0),a);break t}rg(i,n,_n,Vc,Ph,t,On,as,Sr,pa,s,null,-0,0)}}break}while(!0);Si(e)}function rg(e,t,n,i,a,s,r,o,l,c,h,d,f,p){if(e.timeoutHandle=-1,d=t.subtreeFlags,d&8192||(d&16785408)===16785408){d={stylesheets:null,count:0,imgCount:0,imgBytes:0,suspenseyImages:[],waitingForImages:!0,waitingForViewTransition:!1,unsuspend:zi},sx(t,s,d);var v=(s&62914560)===s?Su-Pn():(s&4194048)===s?cx-Pn():0;if(v=gE(d,v),v!==null){Vi=s,e.cancelPendingCommit=v(lg.bind(null,e,t,s,n,i,a,r,o,l,h,d,null,f,p)),ma(e,s,r,!c);return}}lg(e,t,s,n,i,a,r,o,l)}function UM(e){for(var t=e;;){var n=t.tag;if((n===0||n===11||n===15)&&t.flags&16384&&(n=t.updateQueue,n!==null&&(n=n.stores,n!==null)))for(var i=0;i<n.length;i++){var a=n[i],s=a.getSnapshot;a=a.value;try{if(!Fn(s(),a))return!1}catch{return!1}}if(n=t.child,t.subtreeFlags&16384&&n!==null)n.return=t,t=n;else{if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return!0;t=t.return}t.sibling.return=t.return,t=t.sibling}}return!0}function ma(e,t,n,i){t&=~Up,t&=~as,e.suspendedLanes|=t,e.pingedLanes&=~t,i&&(e.warmLanes|=t),i=e.expirationTimes;for(var a=t;0<a;){var s=31-In(a),r=1<<s;i[s]=-1,a&=~r}n!==0&&g_(e,n,t)}function Mu(){return ne&6?!0:(Zo(0),!1)}function Lp(){if(Qt!==null){if(ce===0)var e=Qt.return;else e=Qt,Ii=_s=null,vp(e),lr=null,No=0,e=Qt;for(;e!==null;)Xv(e.alternate,e),e=e.return;Qt=null}}function Er(e,t){var n=e.timeoutHandle;n!==-1&&(e.timeoutHandle=-1,JM(n)),n=e.cancelPendingCommit,n!==null&&(e.cancelPendingCommit=null,n()),Vi=0,Lp(),ge=e,Qt=n=Hi(e.current,null),Jt=t,ce=0,Dn=null,pa=!1,Ir=Vo(e,t),Np=!1,Sr=On=Up=as=Na=we=0,_n=So=null,Ph=!1,t&8&&(t|=t&32);var i=e.entangledLanes;if(i!==0)for(e=e.entanglements,i&=t;0<i;){var a=31-In(i),s=1<<a;t|=e[a],i&=~s}return qi=t,pu(),n}function dx(e,t){jt=null,Pt.H=Lo,t===zr||t===gu?(t=Bm(),ce=3):t===fp?(t=Bm(),ce=4):ce=t===Rp?8:t!==null&&typeof t=="object"&&typeof t.then=="function"?6:1,Dn=t,Qt===null&&(we=1,Bc(e,Kn(t,e.current)))}function px(){var e=Hn.current;return e===null?!0:(Jt&4194048)===Jt?$n===null:(Jt&62914560)===Jt||Jt&536870912?e===$n:!1}function mx(){var e=Pt.H;return Pt.H=Lo,e===null?Lo:e}function gx(){var e=Pt.A;return Pt.A=DM,e}function kc(){we=4,pa||(Jt&4194048)!==Jt&&Hn.current!==null||(Ir=!0),!(Na&134217727)&&!(as&134217727)||ge===null||ma(ge,Jt,On,!1)}function lf(e,t,n){var i=ne;ne|=2;var a=mx(),s=gx();(ge!==e||Jt!==t)&&(Vc=null,Er(e,t)),t=!1;var r=we;t:do try{if(ce!==0&&Qt!==null){var o=Qt,l=Dn;switch(ce){case 8:Lp(),r=6;break t;case 3:case 2:case 9:case 6:Hn.current===null&&(t=!0);var c=ce;if(ce=0,Dn=null,Js(e,o,l,c),n&&Ir){r=0;break t}break;default:c=ce,ce=0,Dn=null,Js(e,o,l,c)}}LM(),r=we;break}catch(h){dx(e,h)}while(!0);return t&&e.shellSuspendCounter++,Ii=_s=null,ne=i,Pt.H=a,Pt.A=s,Qt===null&&(ge=null,Jt=0,pu()),r}function LM(){for(;Qt!==null;)_x(Qt)}function OM(e,t){var n=ne;ne|=2;var i=mx(),a=gx();ge!==e||Jt!==t?(Vc=null,Gc=Pn()+500,Er(e,t)):Ir=Vo(e,t);t:do try{if(ce!==0&&Qt!==null){t=Qt;var s=Dn;e:switch(ce){case 1:ce=0,Dn=null,Js(e,t,s,1);break;case 2:case 9:if(Im(s)){ce=0,Dn=null,og(t);break}t=function(){ce!==2&&ce!==9||ge!==e||(ce=7),Si(e)},s.then(t,t);break t;case 3:ce=7;break t;case 4:ce=5;break t;case 7:Im(s)?(ce=0,Dn=null,og(t)):(ce=0,Dn=null,Js(e,t,s,7));break;case 5:var r=null;switch(Qt.tag){case 26:r=Qt.memoizedState;case 5:case 27:var o=Qt;if(r?Ix(r):o.stateNode.complete){ce=0,Dn=null;var l=o.sibling;if(l!==null)Qt=l;else{var c=o.return;c!==null?(Qt=c,Eu(c)):Qt=null}break e}}ce=0,Dn=null,Js(e,t,s,5);break;case 6:ce=0,Dn=null,Js(e,t,s,6);break;case 8:Lp(),we=6;break t;default:throw Error($(462))}}PM();break}catch(h){dx(e,h)}while(!0);return Ii=_s=null,Pt.H=i,Pt.A=a,ne=n,Qt!==null?0:(ge=null,Jt=0,pu(),we)}function PM(){for(;Qt!==null&&!aS();)_x(Qt)}function _x(e){var t=jv(e.alternate,e,qi);e.memoizedProps=e.pendingProps,t===null?Eu(e):Qt=t}function og(e){var t=e,n=t.alternate;switch(t.tag){case 15:case 0:t=tg(n,t,t.pendingProps,t.type,void 0,Jt);break;case 11:t=tg(n,t,t.pendingProps,t.type.render,t.ref,Jt);break;case 5:vp(t);default:Xv(n,t),t=Qt=X_(t,qi),t=jv(n,t,qi)}e.memoizedProps=e.pendingProps,t===null?Eu(e):Qt=t}function Js(e,t,n,i){Ii=_s=null,vp(t),lr=null,No=0;var a=t.return;try{if(EM(e,a,t,n,Jt)){we=1,Bc(e,Kn(n,e.current)),Qt=null;return}}catch(s){if(a!==null)throw Qt=a,s;we=1,Bc(e,Kn(n,e.current)),Qt=null;return}t.flags&32768?($t||i===1?e=!0:Ir||Jt&536870912?e=!1:(pa=e=!0,(i===2||i===9||i===3||i===6)&&(i=Hn.current,i!==null&&i.tag===13&&(i.flags|=16384))),vx(t,e)):Eu(t)}function Eu(e){var t=e;do{if(t.flags&32768){vx(t,pa);return}e=t.return;var n=AM(t.alternate,t,qi);if(n!==null){Qt=n;return}if(t=t.sibling,t!==null){Qt=t;return}Qt=t=e}while(t!==null);we===0&&(we=5)}function vx(e,t){do{var n=RM(e.alternate,e);if(n!==null){n.flags&=32767,Qt=n;return}if(n=e.return,n!==null&&(n.flags|=32768,n.subtreeFlags=0,n.deletions=null),!t&&(e=e.sibling,e!==null)){Qt=e;return}Qt=e=n}while(e!==null);we=6,Qt=null}function lg(e,t,n,i,a,s,r,o,l){e.cancelPendingCommit=null;do bu();while(Be!==0);if(ne&6)throw Error($(327));if(t!==null){if(t===e.current)throw Error($(177));if(s=t.lanes|t.childLanes,s|=ap,pS(e,n,s,r,o,l),e===ge&&(Qt=ge=null,Jt=0),Mr=t,Ma=e,Vi=n,zh=s,Ih=a,ux=i,t.subtreeFlags&10256||t.flags&10256?(e.callbackNode=null,e.callbackPriority=0,FM(Rc,function(){return Ex(),null})):(e.callbackNode=null,e.callbackPriority=0),i=(t.flags&13878)!==0,t.subtreeFlags&13878||i){i=Pt.T,Pt.T=null,a=ie.p,ie.p=2,r=ne,ne|=4;try{wM(e,t,n)}finally{ne=r,ie.p=a,Pt.T=i}}Be=1,xx(),yx(),Sx()}}function xx(){if(Be===1){Be=0;var e=Ma,t=Mr,n=(t.flags&13878)!==0;if(t.subtreeFlags&13878||n){n=Pt.T,Pt.T=null;var i=ie.p;ie.p=2;var a=ne;ne|=4;try{nx(t,e);var s=Vh,r=I_(e.containerInfo),o=s.focusedElem,l=s.selectionRange;if(r!==o&&o&&o.ownerDocument&&z_(o.ownerDocument.documentElement,o)){if(l!==null&&ip(o)){var c=l.start,h=l.end;if(h===void 0&&(h=c),"selectionStart"in o)o.selectionStart=c,o.selectionEnd=Math.min(h,o.value.length);else{var d=o.ownerDocument||document,f=d&&d.defaultView||window;if(f.getSelection){var p=f.getSelection(),v=o.textContent.length,S=Math.min(l.start,v),m=l.end===void 0?S:Math.min(l.end,v);!p.extend&&S>m&&(r=m,m=S,S=r);var u=Dm(o,S),g=Dm(o,m);if(u&&g&&(p.rangeCount!==1||p.anchorNode!==u.node||p.anchorOffset!==u.offset||p.focusNode!==g.node||p.focusOffset!==g.offset)){var _=d.createRange();_.setStart(u.node,u.offset),p.removeAllRanges(),S>m?(p.addRange(_),p.extend(g.node,g.offset)):(_.setEnd(g.node,g.offset),p.addRange(_))}}}}for(d=[],p=o;p=p.parentNode;)p.nodeType===1&&d.push({element:p,left:p.scrollLeft,top:p.scrollTop});for(typeof o.focus=="function"&&o.focus(),o=0;o<d.length;o++){var y=d[o];y.element.scrollLeft=y.left,y.element.scrollTop=y.top}}Qc=!!Gh,Vh=Gh=null}finally{ne=a,ie.p=i,Pt.T=n}}e.current=t,Be=2}}function yx(){if(Be===2){Be=0;var e=Ma,t=Mr,n=(t.flags&8772)!==0;if(t.subtreeFlags&8772||n){n=Pt.T,Pt.T=null;var i=ie.p;ie.p=2;var a=ne;ne|=4;try{Qv(e,t.alternate,t)}finally{ne=a,ie.p=i,Pt.T=n}}Be=3}}function Sx(){if(Be===4||Be===3){Be=0,sS();var e=Ma,t=Mr,n=Vi,i=ux;t.subtreeFlags&10256||t.flags&10256?Be=5:(Be=0,Mr=Ma=null,Mx(e,e.pendingLanes));var a=e.pendingLanes;if(a===0&&(Sa=null),Kd(n),t=t.stateNode,zn&&typeof zn.onCommitFiberRoot=="function")try{zn.onCommitFiberRoot(Go,t,void 0,(t.current.flags&128)===128)}catch{}if(i!==null){t=Pt.T,a=ie.p,ie.p=2,Pt.T=null;try{for(var s=e.onRecoverableError,r=0;r<i.length;r++){var o=i[r];s(o.value,{componentStack:o.stack})}}finally{Pt.T=t,ie.p=a}}Vi&3&&bu(),Si(e),a=e.pendingLanes,n&261930&&a&42?e===Bh?Mo++:(Mo=0,Bh=e):Mo=0,Zo(0)}}function Mx(e,t){(e.pooledCacheLanes&=t)===0&&(t=e.pooledCache,t!=null&&(e.pooledCache=null,Wo(t)))}function bu(){return xx(),yx(),Sx(),Ex()}function Ex(){if(Be!==5)return!1;var e=Ma,t=zh;zh=0;var n=Kd(Vi),i=Pt.T,a=ie.p;try{ie.p=32>n?32:n,Pt.T=null,n=Ih,Ih=null;var s=Ma,r=Vi;if(Be=0,Mr=Ma=null,Vi=0,ne&6)throw Error($(331));var o=ne;if(ne|=4,ox(s.current),ax(s,s.current,r,n),ne=o,Zo(0,!1),zn&&typeof zn.onPostCommitFiberRoot=="function")try{zn.onPostCommitFiberRoot(Go,s)}catch{}return!0}finally{ie.p=a,Pt.T=i,Mx(e,t)}}function cg(e,t,n){t=Kn(n,t),t=Nh(e.stateNode,t,2),e=ya(e,t,2),e!==null&&(ko(e,2),Si(e))}function ue(e,t,n){if(e.tag===3)cg(e,e,n);else for(;t!==null;){if(t.tag===3){cg(t,e,n);break}else if(t.tag===1){var i=t.stateNode;if(typeof t.type.getDerivedStateFromError=="function"||typeof i.componentDidCatch=="function"&&(Sa===null||!Sa.has(i))){e=Kn(n,e),n=Bv(2),i=ya(t,n,2),i!==null&&(Fv(n,i,t,e),ko(i,2),Si(i));break}}t=t.return}}function cf(e,t,n){var i=e.pingCache;if(i===null){i=e.pingCache=new NM;var a=new Set;i.set(t,a)}else a=i.get(t),a===void 0&&(a=new Set,i.set(t,a));a.has(n)||(Np=!0,a.add(n),e=zM.bind(null,e,t,n),t.then(e,e))}function zM(e,t,n){var i=e.pingCache;i!==null&&i.delete(t),e.pingedLanes|=e.suspendedLanes&n,e.warmLanes&=~n,ge===e&&(Jt&n)===n&&(we===4||we===3&&(Jt&62914560)===Jt&&300>Pn()-Su?!(ne&2)&&Er(e,0):Up|=n,Sr===Jt&&(Sr=0)),Si(e)}function bx(e,t){t===0&&(t=m_()),e=gs(e,t),e!==null&&(ko(e,t),Si(e))}function IM(e){var t=e.memoizedState,n=0;t!==null&&(n=t.retryLane),bx(e,n)}function BM(e,t){var n=0;switch(e.tag){case 31:case 13:var i=e.stateNode,a=e.memoizedState;a!==null&&(n=a.retryLane);break;case 19:i=e.stateNode;break;case 22:i=e.stateNode._retryCache;break;default:throw Error($(314))}i!==null&&i.delete(t),bx(e,n)}function FM(e,t){return Yd(e,t)}var jc=null,Hs=null,Fh=!1,Xc=!1,uf=!1,ga=0;function Si(e){e!==Hs&&e.next===null&&(Hs===null?jc=Hs=e:Hs=Hs.next=e),Xc=!0,Fh||(Fh=!0,GM())}function Zo(e,t){if(!uf&&Xc){uf=!0;do for(var n=!1,i=jc;i!==null;){if(e!==0){var a=i.pendingLanes;if(a===0)var s=0;else{var r=i.suspendedLanes,o=i.pingedLanes;s=(1<<31-In(42|e)+1)-1,s&=a&~(r&~o),s=s&201326741?s&201326741|1:s?s|2:0}s!==0&&(n=!0,ug(i,s))}else s=Jt,s=uu(i,i===ge?s:0,i.cancelPendingCommit!==null||i.timeoutHandle!==-1),!(s&3)||Vo(i,s)||(n=!0,ug(i,s));i=i.next}while(n);uf=!1}}function HM(){Tx()}function Tx(){Xc=Fh=!1;var e=0;ga!==0&&QM()&&(e=ga);for(var t=Pn(),n=null,i=jc;i!==null;){var a=i.next,s=Ax(i,t);s===0?(i.next=null,n===null?jc=a:n.next=a,a===null&&(Hs=n)):(n=i,(e!==0||s&3)&&(Xc=!0)),i=a}Be!==0&&Be!==5||Zo(e),ga!==0&&(ga=0)}function Ax(e,t){for(var n=e.suspendedLanes,i=e.pingedLanes,a=e.expirationTimes,s=e.pendingLanes&-62914561;0<s;){var r=31-In(s),o=1<<r,l=a[r];l===-1?(!(o&n)||o&i)&&(a[r]=dS(o,t)):l<=t&&(e.expiredLanes|=o),s&=~o}if(t=ge,n=Jt,n=uu(e,e===t?n:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),i=e.callbackNode,n===0||e===t&&(ce===2||ce===9)||e.cancelPendingCommit!==null)return i!==null&&i!==null&&Iu(i),e.callbackNode=null,e.callbackPriority=0;if(!(n&3)||Vo(e,n)){if(t=n&-n,t===e.callbackPriority)return t;switch(i!==null&&Iu(i),Kd(n)){case 2:case 8:n=d_;break;case 32:n=Rc;break;case 268435456:n=p_;break;default:n=Rc}return i=Rx.bind(null,e),n=Yd(n,i),e.callbackPriority=t,e.callbackNode=n,t}return i!==null&&i!==null&&Iu(i),e.callbackPriority=2,e.callbackNode=null,2}function Rx(e,t){if(Be!==0&&Be!==5)return e.callbackNode=null,e.callbackPriority=0,null;var n=e.callbackNode;if(bu()&&e.callbackNode!==n)return null;var i=Jt;return i=uu(e,e===ge?i:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),i===0?null:(hx(e,i,t),Ax(e,Pn()),e.callbackNode!=null&&e.callbackNode===n?Rx.bind(null,e):null)}function ug(e,t){if(bu())return null;hx(e,t,!0)}function GM(){$M(function(){ne&6?Yd(h_,HM):Tx()})}function Op(){if(ga===0){var e=vr;e===0&&(e=fl,fl<<=1,!(fl&261888)&&(fl=256)),ga=e}return ga}function fg(e){return e==null||typeof e=="symbol"||typeof e=="boolean"?null:typeof e=="function"?e:ec(""+e)}function hg(e,t){var n=t.ownerDocument.createElement("input");return n.name=t.name,n.value=t.value,e.id&&n.setAttribute("form",e.id),t.parentNode.insertBefore(n,t),e=new FormData(e),n.parentNode.removeChild(n),e}function VM(e,t,n,i,a){if(t==="submit"&&n&&n.stateNode===a){var s=fg((a[En]||null).action),r=i.submitter;r&&(t=(t=r[En]||null)?fg(t.formAction):r.getAttribute("formAction"),t!==null&&(s=t,r=null));var o=new fu("action","action",null,i,a);e.push({event:o,listeners:[{instance:null,listener:function(){if(i.defaultPrevented){if(ga!==0){var l=r?hg(a,r):new FormData(a);Ch(n,{pending:!0,data:l,method:a.method,action:s},null,l)}}else typeof s=="function"&&(o.preventDefault(),l=r?hg(a,r):new FormData(a),Ch(n,{pending:!0,data:l,method:a.method,action:s},s,l))},currentTarget:a}]})}}for(var ff=0;ff<_h.length;ff++){var hf=_h[ff],kM=hf.toLowerCase(),jM=hf[0].toUpperCase()+hf.slice(1);fi(kM,"on"+jM)}fi(F_,"onAnimationEnd");fi(H_,"onAnimationIteration");fi(G_,"onAnimationStart");fi("dblclick","onDoubleClick");fi("focusin","onFocus");fi("focusout","onBlur");fi(rM,"onTransitionRun");fi(oM,"onTransitionStart");fi(lM,"onTransitionCancel");fi(V_,"onTransitionEnd");gr("onMouseEnter",["mouseout","mouseover"]);gr("onMouseLeave",["mouseout","mouseover"]);gr("onPointerEnter",["pointerout","pointerover"]);gr("onPointerLeave",["pointerout","pointerover"]);ds("onChange","change click focusin focusout input keydown keyup selectionchange".split(" "));ds("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));ds("onBeforeInput",["compositionend","keypress","textInput","paste"]);ds("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" "));ds("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" "));ds("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var Oo="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),XM=new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Oo));function wx(e,t){t=(t&4)!==0;for(var n=0;n<e.length;n++){var i=e[n],a=i.event;i=i.listeners;t:{var s=void 0;if(t)for(var r=i.length-1;0<=r;r--){var o=i[r],l=o.instance,c=o.currentTarget;if(o=o.listener,l!==s&&a.isPropagationStopped())break t;s=o,a.currentTarget=c;try{s(a)}catch(h){Cc(h)}a.currentTarget=null,s=l}else for(r=0;r<i.length;r++){if(o=i[r],l=o.instance,c=o.currentTarget,o=o.listener,l!==s&&a.isPropagationStopped())break t;s=o,a.currentTarget=c;try{s(a)}catch(h){Cc(h)}a.currentTarget=null,s=l}}}}function Kt(e,t){var n=t[ch];n===void 0&&(n=t[ch]=new Set);var i=e+"__bubble";n.has(i)||(Cx(t,e,2,!1),n.add(i))}function df(e,t,n){var i=0;t&&(i|=4),Cx(n,e,i,t)}var Sl="_reactListening"+Math.random().toString(36).slice(2);function Pp(e){if(!e[Sl]){e[Sl]=!0,y_.forEach(function(n){n!=="selectionchange"&&(XM.has(n)||df(n,!1,e),df(n,!0,e))});var t=e.nodeType===9?e:e.ownerDocument;t===null||t[Sl]||(t[Sl]=!0,df("selectionchange",!1,t))}}function Cx(e,t,n,i){switch(Vx(t)){case 2:var a=xE;break;case 8:a=yE;break;default:a=Fp}n=a.bind(null,t,n,e),a=void 0,!ph||t!=="touchstart"&&t!=="touchmove"&&t!=="wheel"||(a=!0),i?a!==void 0?e.addEventListener(t,n,{capture:!0,passive:a}):e.addEventListener(t,n,!0):a!==void 0?e.addEventListener(t,n,{passive:a}):e.addEventListener(t,n,!1)}function pf(e,t,n,i,a){var s=i;if(!(t&1)&&!(t&2)&&i!==null)t:for(;;){if(i===null)return;var r=i.tag;if(r===3||r===4){var o=i.stateNode.containerInfo;if(o===a)break;if(r===4)for(r=i.return;r!==null;){var l=r.tag;if((l===3||l===4)&&r.stateNode.containerInfo===a)return;r=r.return}for(;o!==null;){if(r=ks(o),r===null)return;if(l=r.tag,l===5||l===6||l===26||l===27){i=s=r;continue t}o=o.parentNode}}i=i.return}w_(function(){var c=s,h=$d(n),d=[];t:{var f=k_.get(e);if(f!==void 0){var p=fu,v=e;switch(e){case"keypress":if(ic(n)===0)break t;case"keydown":case"keyup":p=BS;break;case"focusin":v="focus",p=Vu;break;case"focusout":v="blur",p=Vu;break;case"beforeblur":case"afterblur":p=Vu;break;case"click":if(n.button===2)break t;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":p=ym;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":p=AS;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":p=GS;break;case F_:case H_:case G_:p=CS;break;case V_:p=kS;break;case"scroll":case"scrollend":p=bS;break;case"wheel":p=XS;break;case"copy":case"cut":case"paste":p=NS;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":p=Mm;break;case"toggle":case"beforetoggle":p=qS}var S=(t&4)!==0,m=!S&&(e==="scroll"||e==="scrollend"),u=S?f!==null?f+"Capture":null:f;S=[];for(var g=c,_;g!==null;){var y=g;if(_=y.stateNode,y=y.tag,y!==5&&y!==26&&y!==27||_===null||u===null||(y=Ao(g,u),y!=null&&S.push(Po(g,y,_))),m)break;g=g.return}0<S.length&&(f=new p(f,v,null,n,h),d.push({event:f,listeners:S}))}}if(!(t&7)){t:{if(f=e==="mouseover"||e==="pointerover",p=e==="mouseout"||e==="pointerout",f&&n!==dh&&(v=n.relatedTarget||n.fromElement)&&(ks(v)||v[Lr]))break t;if((p||f)&&(f=h.window===h?h:(f=h.ownerDocument)?f.defaultView||f.parentWindow:window,p?(v=n.relatedTarget||n.toElement,p=c,v=v?ks(v):null,v!==null&&(m=Ho(v),S=v.tag,v!==m||S!==5&&S!==27&&S!==6)&&(v=null)):(p=null,v=c),p!==v)){if(S=ym,y="onMouseLeave",u="onMouseEnter",g="mouse",(e==="pointerout"||e==="pointerover")&&(S=Mm,y="onPointerLeave",u="onPointerEnter",g="pointer"),m=p==null?f:so(p),_=v==null?f:so(v),f=new S(y,g+"leave",p,n,h),f.target=m,f.relatedTarget=_,y=null,ks(h)===c&&(S=new S(u,g+"enter",v,n,h),S.target=_,S.relatedTarget=m,y=S),m=y,p&&v)e:{for(S=WM,u=p,g=v,_=0,y=u;y;y=S(y))_++;y=0;for(var L=g;L;L=S(L))y++;for(;0<_-y;)u=S(u),_--;for(;0<y-_;)g=S(g),y--;for(;_--;){if(u===g||g!==null&&u===g.alternate){S=u;break e}u=S(u),g=S(g)}S=null}else S=null;p!==null&&dg(d,f,p,S,!1),v!==null&&m!==null&&dg(d,m,v,S,!0)}}t:{if(f=c?so(c):window,p=f.nodeName&&f.nodeName.toLowerCase(),p==="select"||p==="input"&&f.type==="file")var T=Am;else if(Tm(f))if(O_)T=iM;else{T=eM;var R=tM}else p=f.nodeName,!p||p.toLowerCase()!=="input"||f.type!=="checkbox"&&f.type!=="radio"?c&&Jd(c.elementType)&&(T=Am):T=nM;if(T&&(T=T(e,c))){L_(d,T,n,h);break t}R&&R(e,f,c),e==="focusout"&&c&&f.type==="number"&&c.memoizedProps.value!=null&&hh(f,"number",f.value)}switch(R=c?so(c):window,e){case"focusin":(Tm(R)||R.contentEditable==="true")&&(Ws=R,mh=c,ho=null);break;case"focusout":ho=mh=Ws=null;break;case"mousedown":gh=!0;break;case"contextmenu":case"mouseup":case"dragend":gh=!1,Nm(d,n,h);break;case"selectionchange":if(sM)break;case"keydown":case"keyup":Nm(d,n,h)}var U;if(np)t:{switch(e){case"compositionstart":var X="onCompositionStart";break t;case"compositionend":X="onCompositionEnd";break t;case"compositionupdate":X="onCompositionUpdate";break t}X=void 0}else Xs?N_(e,n)&&(X="onCompositionEnd"):e==="keydown"&&n.keyCode===229&&(X="onCompositionStart");X&&(D_&&n.locale!=="ko"&&(Xs||X!=="onCompositionStart"?X==="onCompositionEnd"&&Xs&&(U=C_()):(da=h,tp="value"in da?da.value:da.textContent,Xs=!0)),R=Wc(c,X),0<R.length&&(X=new Sm(X,e,null,n,h),d.push({event:X,listeners:R}),U?X.data=U:(U=U_(n),U!==null&&(X.data=U)))),(U=ZS?KS(e,n):QS(e,n))&&(X=Wc(c,"onBeforeInput"),0<X.length&&(R=new Sm("onBeforeInput","beforeinput",null,n,h),d.push({event:R,listeners:X}),R.data=U)),VM(d,e,c,n,h)}wx(d,t)})}function Po(e,t,n){return{instance:e,listener:t,currentTarget:n}}function Wc(e,t){for(var n=t+"Capture",i=[];e!==null;){var a=e,s=a.stateNode;if(a=a.tag,a!==5&&a!==26&&a!==27||s===null||(a=Ao(e,n),a!=null&&i.unshift(Po(e,a,s)),a=Ao(e,t),a!=null&&i.push(Po(e,a,s))),e.tag===3)return i;e=e.return}return[]}function WM(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5&&e.tag!==27);return e||null}function dg(e,t,n,i,a){for(var s=t._reactName,r=[];n!==null&&n!==i;){var o=n,l=o.alternate,c=o.stateNode;if(o=o.tag,l!==null&&l===i)break;o!==5&&o!==26&&o!==27||c===null||(l=c,a?(c=Ao(n,s),c!=null&&r.unshift(Po(n,c,l))):a||(c=Ao(n,s),c!=null&&r.push(Po(n,c,l)))),n=n.return}r.length!==0&&e.push({event:t,listeners:r})}var qM=/\r\n?/g,YM=/\u0000|\uFFFD/g;function pg(e){return(typeof e=="string"?e:""+e).replace(qM,`
`).replace(YM,"")}function Dx(e,t){return t=pg(t),pg(e)===t}function fe(e,t,n,i,a,s){switch(n){case"children":typeof i=="string"?t==="body"||t==="textarea"&&i===""||_r(e,i):(typeof i=="number"||typeof i=="bigint")&&t!=="body"&&_r(e,""+i);break;case"className":pl(e,"class",i);break;case"tabIndex":pl(e,"tabindex",i);break;case"dir":case"role":case"viewBox":case"width":case"height":pl(e,n,i);break;case"style":R_(e,i,s);break;case"data":if(t!=="object"){pl(e,"data",i);break}case"src":case"href":if(i===""&&(t!=="a"||n!=="href")){e.removeAttribute(n);break}if(i==null||typeof i=="function"||typeof i=="symbol"||typeof i=="boolean"){e.removeAttribute(n);break}i=ec(""+i),e.setAttribute(n,i);break;case"action":case"formAction":if(typeof i=="function"){e.setAttribute(n,"javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");break}else typeof s=="function"&&(n==="formAction"?(t!=="input"&&fe(e,t,"name",a.name,a,null),fe(e,t,"formEncType",a.formEncType,a,null),fe(e,t,"formMethod",a.formMethod,a,null),fe(e,t,"formTarget",a.formTarget,a,null)):(fe(e,t,"encType",a.encType,a,null),fe(e,t,"method",a.method,a,null),fe(e,t,"target",a.target,a,null)));if(i==null||typeof i=="symbol"||typeof i=="boolean"){e.removeAttribute(n);break}i=ec(""+i),e.setAttribute(n,i);break;case"onClick":i!=null&&(e.onclick=zi);break;case"onScroll":i!=null&&Kt("scroll",e);break;case"onScrollEnd":i!=null&&Kt("scrollend",e);break;case"dangerouslySetInnerHTML":if(i!=null){if(typeof i!="object"||!("__html"in i))throw Error($(61));if(n=i.__html,n!=null){if(a.children!=null)throw Error($(60));e.innerHTML=n}}break;case"multiple":e.multiple=i&&typeof i!="function"&&typeof i!="symbol";break;case"muted":e.muted=i&&typeof i!="function"&&typeof i!="symbol";break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"defaultValue":case"defaultChecked":case"innerHTML":case"ref":break;case"autoFocus":break;case"xlinkHref":if(i==null||typeof i=="function"||typeof i=="boolean"||typeof i=="symbol"){e.removeAttribute("xlink:href");break}n=ec(""+i),e.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",n);break;case"contentEditable":case"spellCheck":case"draggable":case"value":case"autoReverse":case"externalResourcesRequired":case"focusable":case"preserveAlpha":i!=null&&typeof i!="function"&&typeof i!="symbol"?e.setAttribute(n,""+i):e.removeAttribute(n);break;case"inert":case"allowFullScreen":case"async":case"autoPlay":case"controls":case"default":case"defer":case"disabled":case"disablePictureInPicture":case"disableRemotePlayback":case"formNoValidate":case"hidden":case"loop":case"noModule":case"noValidate":case"open":case"playsInline":case"readOnly":case"required":case"reversed":case"scoped":case"seamless":case"itemScope":i&&typeof i!="function"&&typeof i!="symbol"?e.setAttribute(n,""):e.removeAttribute(n);break;case"capture":case"download":i===!0?e.setAttribute(n,""):i!==!1&&i!=null&&typeof i!="function"&&typeof i!="symbol"?e.setAttribute(n,i):e.removeAttribute(n);break;case"cols":case"rows":case"size":case"span":i!=null&&typeof i!="function"&&typeof i!="symbol"&&!isNaN(i)&&1<=i?e.setAttribute(n,i):e.removeAttribute(n);break;case"rowSpan":case"start":i==null||typeof i=="function"||typeof i=="symbol"||isNaN(i)?e.removeAttribute(n):e.setAttribute(n,i);break;case"popover":Kt("beforetoggle",e),Kt("toggle",e),tc(e,"popover",i);break;case"xlinkActuate":Mi(e,"http://www.w3.org/1999/xlink","xlink:actuate",i);break;case"xlinkArcrole":Mi(e,"http://www.w3.org/1999/xlink","xlink:arcrole",i);break;case"xlinkRole":Mi(e,"http://www.w3.org/1999/xlink","xlink:role",i);break;case"xlinkShow":Mi(e,"http://www.w3.org/1999/xlink","xlink:show",i);break;case"xlinkTitle":Mi(e,"http://www.w3.org/1999/xlink","xlink:title",i);break;case"xlinkType":Mi(e,"http://www.w3.org/1999/xlink","xlink:type",i);break;case"xmlBase":Mi(e,"http://www.w3.org/XML/1998/namespace","xml:base",i);break;case"xmlLang":Mi(e,"http://www.w3.org/XML/1998/namespace","xml:lang",i);break;case"xmlSpace":Mi(e,"http://www.w3.org/XML/1998/namespace","xml:space",i);break;case"is":tc(e,"is",i);break;case"innerText":case"textContent":break;default:(!(2<n.length)||n[0]!=="o"&&n[0]!=="O"||n[1]!=="n"&&n[1]!=="N")&&(n=MS.get(n)||n,tc(e,n,i))}}function Hh(e,t,n,i,a,s){switch(n){case"style":R_(e,i,s);break;case"dangerouslySetInnerHTML":if(i!=null){if(typeof i!="object"||!("__html"in i))throw Error($(61));if(n=i.__html,n!=null){if(a.children!=null)throw Error($(60));e.innerHTML=n}}break;case"children":typeof i=="string"?_r(e,i):(typeof i=="number"||typeof i=="bigint")&&_r(e,""+i);break;case"onScroll":i!=null&&Kt("scroll",e);break;case"onScrollEnd":i!=null&&Kt("scrollend",e);break;case"onClick":i!=null&&(e.onclick=zi);break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"innerHTML":case"ref":break;case"innerText":case"textContent":break;default:if(!S_.hasOwnProperty(n))t:{if(n[0]==="o"&&n[1]==="n"&&(a=n.endsWith("Capture"),t=n.slice(2,a?n.length-7:void 0),s=e[En]||null,s=s!=null?s[n]:null,typeof s=="function"&&e.removeEventListener(t,s,a),typeof i=="function")){typeof s!="function"&&s!==null&&(n in e?e[n]=null:e.hasAttribute(n)&&e.removeAttribute(n)),e.addEventListener(t,i,a);break t}n in e?e[n]=i:i===!0?e.setAttribute(n,""):tc(e,n,i)}}}function Je(e,t,n){switch(t){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"img":Kt("error",e),Kt("load",e);var i=!1,a=!1,s;for(s in n)if(n.hasOwnProperty(s)){var r=n[s];if(r!=null)switch(s){case"src":i=!0;break;case"srcSet":a=!0;break;case"children":case"dangerouslySetInnerHTML":throw Error($(137,t));default:fe(e,t,s,r,n,null)}}a&&fe(e,t,"srcSet",n.srcSet,n,null),i&&fe(e,t,"src",n.src,n,null);return;case"input":Kt("invalid",e);var o=s=r=a=null,l=null,c=null;for(i in n)if(n.hasOwnProperty(i)){var h=n[i];if(h!=null)switch(i){case"name":a=h;break;case"type":r=h;break;case"checked":l=h;break;case"defaultChecked":c=h;break;case"value":s=h;break;case"defaultValue":o=h;break;case"children":case"dangerouslySetInnerHTML":if(h!=null)throw Error($(137,t));break;default:fe(e,t,i,h,n,null)}}b_(e,s,o,l,c,r,a,!1);return;case"select":Kt("invalid",e),i=r=s=null;for(a in n)if(n.hasOwnProperty(a)&&(o=n[a],o!=null))switch(a){case"value":s=o;break;case"defaultValue":r=o;break;case"multiple":i=o;default:fe(e,t,a,o,n,null)}t=s,n=r,e.multiple=!!i,t!=null?sr(e,!!i,t,!1):n!=null&&sr(e,!!i,n,!0);return;case"textarea":Kt("invalid",e),s=a=i=null;for(r in n)if(n.hasOwnProperty(r)&&(o=n[r],o!=null))switch(r){case"value":i=o;break;case"defaultValue":a=o;break;case"children":s=o;break;case"dangerouslySetInnerHTML":if(o!=null)throw Error($(91));break;default:fe(e,t,r,o,n,null)}A_(e,i,a,s);return;case"option":for(l in n)if(n.hasOwnProperty(l)&&(i=n[l],i!=null))switch(l){case"selected":e.selected=i&&typeof i!="function"&&typeof i!="symbol";break;default:fe(e,t,l,i,n,null)}return;case"dialog":Kt("beforetoggle",e),Kt("toggle",e),Kt("cancel",e),Kt("close",e);break;case"iframe":case"object":Kt("load",e);break;case"video":case"audio":for(i=0;i<Oo.length;i++)Kt(Oo[i],e);break;case"image":Kt("error",e),Kt("load",e);break;case"details":Kt("toggle",e);break;case"embed":case"source":case"link":Kt("error",e),Kt("load",e);case"area":case"base":case"br":case"col":case"hr":case"keygen":case"meta":case"param":case"track":case"wbr":case"menuitem":for(c in n)if(n.hasOwnProperty(c)&&(i=n[c],i!=null))switch(c){case"children":case"dangerouslySetInnerHTML":throw Error($(137,t));default:fe(e,t,c,i,n,null)}return;default:if(Jd(t)){for(h in n)n.hasOwnProperty(h)&&(i=n[h],i!==void 0&&Hh(e,t,h,i,n,void 0));return}}for(o in n)n.hasOwnProperty(o)&&(i=n[o],i!=null&&fe(e,t,o,i,n,null))}function ZM(e,t,n,i){switch(t){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"input":var a=null,s=null,r=null,o=null,l=null,c=null,h=null;for(p in n){var d=n[p];if(n.hasOwnProperty(p)&&d!=null)switch(p){case"checked":break;case"value":break;case"defaultValue":l=d;default:i.hasOwnProperty(p)||fe(e,t,p,null,i,d)}}for(var f in i){var p=i[f];if(d=n[f],i.hasOwnProperty(f)&&(p!=null||d!=null))switch(f){case"type":s=p;break;case"name":a=p;break;case"checked":c=p;break;case"defaultChecked":h=p;break;case"value":r=p;break;case"defaultValue":o=p;break;case"children":case"dangerouslySetInnerHTML":if(p!=null)throw Error($(137,t));break;default:p!==d&&fe(e,t,f,p,i,d)}}fh(e,r,o,l,c,h,s,a);return;case"select":p=r=o=f=null;for(s in n)if(l=n[s],n.hasOwnProperty(s)&&l!=null)switch(s){case"value":break;case"multiple":p=l;default:i.hasOwnProperty(s)||fe(e,t,s,null,i,l)}for(a in i)if(s=i[a],l=n[a],i.hasOwnProperty(a)&&(s!=null||l!=null))switch(a){case"value":f=s;break;case"defaultValue":o=s;break;case"multiple":r=s;default:s!==l&&fe(e,t,a,s,i,l)}t=o,n=r,i=p,f!=null?sr(e,!!n,f,!1):!!i!=!!n&&(t!=null?sr(e,!!n,t,!0):sr(e,!!n,n?[]:"",!1));return;case"textarea":p=f=null;for(o in n)if(a=n[o],n.hasOwnProperty(o)&&a!=null&&!i.hasOwnProperty(o))switch(o){case"value":break;case"children":break;default:fe(e,t,o,null,i,a)}for(r in i)if(a=i[r],s=n[r],i.hasOwnProperty(r)&&(a!=null||s!=null))switch(r){case"value":f=a;break;case"defaultValue":p=a;break;case"children":break;case"dangerouslySetInnerHTML":if(a!=null)throw Error($(91));break;default:a!==s&&fe(e,t,r,a,i,s)}T_(e,f,p);return;case"option":for(var v in n)if(f=n[v],n.hasOwnProperty(v)&&f!=null&&!i.hasOwnProperty(v))switch(v){case"selected":e.selected=!1;break;default:fe(e,t,v,null,i,f)}for(l in i)if(f=i[l],p=n[l],i.hasOwnProperty(l)&&f!==p&&(f!=null||p!=null))switch(l){case"selected":e.selected=f&&typeof f!="function"&&typeof f!="symbol";break;default:fe(e,t,l,f,i,p)}return;case"img":case"link":case"area":case"base":case"br":case"col":case"embed":case"hr":case"keygen":case"meta":case"param":case"source":case"track":case"wbr":case"menuitem":for(var S in n)f=n[S],n.hasOwnProperty(S)&&f!=null&&!i.hasOwnProperty(S)&&fe(e,t,S,null,i,f);for(c in i)if(f=i[c],p=n[c],i.hasOwnProperty(c)&&f!==p&&(f!=null||p!=null))switch(c){case"children":case"dangerouslySetInnerHTML":if(f!=null)throw Error($(137,t));break;default:fe(e,t,c,f,i,p)}return;default:if(Jd(t)){for(var m in n)f=n[m],n.hasOwnProperty(m)&&f!==void 0&&!i.hasOwnProperty(m)&&Hh(e,t,m,void 0,i,f);for(h in i)f=i[h],p=n[h],!i.hasOwnProperty(h)||f===p||f===void 0&&p===void 0||Hh(e,t,h,f,i,p);return}}for(var u in n)f=n[u],n.hasOwnProperty(u)&&f!=null&&!i.hasOwnProperty(u)&&fe(e,t,u,null,i,f);for(d in i)f=i[d],p=n[d],!i.hasOwnProperty(d)||f===p||f==null&&p==null||fe(e,t,d,f,i,p)}function mg(e){switch(e){case"css":case"script":case"font":case"img":case"image":case"input":case"link":return!0;default:return!1}}function KM(){if(typeof performance.getEntriesByType=="function"){for(var e=0,t=0,n=performance.getEntriesByType("resource"),i=0;i<n.length;i++){var a=n[i],s=a.transferSize,r=a.initiatorType,o=a.duration;if(s&&o&&mg(r)){for(r=0,o=a.responseEnd,i+=1;i<n.length;i++){var l=n[i],c=l.startTime;if(c>o)break;var h=l.transferSize,d=l.initiatorType;h&&mg(d)&&(l=l.responseEnd,r+=h*(l<o?1:(o-c)/(l-c)))}if(--i,t+=8*(s+r)/(a.duration/1e3),e++,10<e)break}}if(0<e)return t/e/1e6}return navigator.connection&&(e=navigator.connection.downlink,typeof e=="number")?e:5}var Gh=null,Vh=null;function qc(e){return e.nodeType===9?e:e.ownerDocument}function gg(e){switch(e){case"http://www.w3.org/2000/svg":return 1;case"http://www.w3.org/1998/Math/MathML":return 2;default:return 0}}function Nx(e,t){if(e===0)switch(t){case"svg":return 1;case"math":return 2;default:return 0}return e===1&&t==="foreignObject"?0:e}function kh(e,t){return e==="textarea"||e==="noscript"||typeof t.children=="string"||typeof t.children=="number"||typeof t.children=="bigint"||typeof t.dangerouslySetInnerHTML=="object"&&t.dangerouslySetInnerHTML!==null&&t.dangerouslySetInnerHTML.__html!=null}var mf=null;function QM(){var e=window.event;return e&&e.type==="popstate"?e===mf?!1:(mf=e,!0):(mf=null,!1)}var Ux=typeof setTimeout=="function"?setTimeout:void 0,JM=typeof clearTimeout=="function"?clearTimeout:void 0,_g=typeof Promise=="function"?Promise:void 0,$M=typeof queueMicrotask=="function"?queueMicrotask:typeof _g<"u"?function(e){return _g.resolve(null).then(e).catch(tE)}:Ux;function tE(e){setTimeout(function(){throw e})}function Pa(e){return e==="head"}function vg(e,t){var n=t,i=0;do{var a=n.nextSibling;if(e.removeChild(n),a&&a.nodeType===8)if(n=a.data,n==="/$"||n==="/&"){if(i===0){e.removeChild(a),Tr(t);return}i--}else if(n==="$"||n==="$?"||n==="$~"||n==="$!"||n==="&")i++;else if(n==="html")Eo(e.ownerDocument.documentElement);else if(n==="head"){n=e.ownerDocument.head,Eo(n);for(var s=n.firstChild;s;){var r=s.nextSibling,o=s.nodeName;s[jo]||o==="SCRIPT"||o==="STYLE"||o==="LINK"&&s.rel.toLowerCase()==="stylesheet"||n.removeChild(s),s=r}}else n==="body"&&Eo(e.ownerDocument.body);n=a}while(n);Tr(t)}function xg(e,t){var n=e;e=0;do{var i=n.nextSibling;if(n.nodeType===1?t?(n._stashedDisplay=n.style.display,n.style.display="none"):(n.style.display=n._stashedDisplay||"",n.getAttribute("style")===""&&n.removeAttribute("style")):n.nodeType===3&&(t?(n._stashedText=n.nodeValue,n.nodeValue=""):n.nodeValue=n._stashedText||""),i&&i.nodeType===8)if(n=i.data,n==="/$"){if(e===0)break;e--}else n!=="$"&&n!=="$?"&&n!=="$~"&&n!=="$!"||e++;n=i}while(n)}function jh(e){var t=e.firstChild;for(t&&t.nodeType===10&&(t=t.nextSibling);t;){var n=t;switch(t=t.nextSibling,n.nodeName){case"HTML":case"HEAD":case"BODY":jh(n),Qd(n);continue;case"SCRIPT":case"STYLE":continue;case"LINK":if(n.rel.toLowerCase()==="stylesheet")continue}e.removeChild(n)}}function eE(e,t,n,i){for(;e.nodeType===1;){var a=n;if(e.nodeName.toLowerCase()!==t.toLowerCase()){if(!i&&(e.nodeName!=="INPUT"||e.type!=="hidden"))break}else if(i){if(!e[jo])switch(t){case"meta":if(!e.hasAttribute("itemprop"))break;return e;case"link":if(s=e.getAttribute("rel"),s==="stylesheet"&&e.hasAttribute("data-precedence"))break;if(s!==a.rel||e.getAttribute("href")!==(a.href==null||a.href===""?null:a.href)||e.getAttribute("crossorigin")!==(a.crossOrigin==null?null:a.crossOrigin)||e.getAttribute("title")!==(a.title==null?null:a.title))break;return e;case"style":if(e.hasAttribute("data-precedence"))break;return e;case"script":if(s=e.getAttribute("src"),(s!==(a.src==null?null:a.src)||e.getAttribute("type")!==(a.type==null?null:a.type)||e.getAttribute("crossorigin")!==(a.crossOrigin==null?null:a.crossOrigin))&&s&&e.hasAttribute("async")&&!e.hasAttribute("itemprop"))break;return e;default:return e}}else if(t==="input"&&e.type==="hidden"){var s=a.name==null?null:""+a.name;if(a.type==="hidden"&&e.getAttribute("name")===s)return e}else return e;if(e=ti(e.nextSibling),e===null)break}return null}function nE(e,t,n){if(t==="")return null;for(;e.nodeType!==3;)if((e.nodeType!==1||e.nodeName!=="INPUT"||e.type!=="hidden")&&!n||(e=ti(e.nextSibling),e===null))return null;return e}function Lx(e,t){for(;e.nodeType!==8;)if((e.nodeType!==1||e.nodeName!=="INPUT"||e.type!=="hidden")&&!t||(e=ti(e.nextSibling),e===null))return null;return e}function Xh(e){return e.data==="$?"||e.data==="$~"}function Wh(e){return e.data==="$!"||e.data==="$?"&&e.ownerDocument.readyState!=="loading"}function iE(e,t){var n=e.ownerDocument;if(e.data==="$~")e._reactRetry=t;else if(e.data!=="$?"||n.readyState!=="loading")t();else{var i=function(){t(),n.removeEventListener("DOMContentLoaded",i)};n.addEventListener("DOMContentLoaded",i),e._reactRetry=i}}function ti(e){for(;e!=null;e=e.nextSibling){var t=e.nodeType;if(t===1||t===3)break;if(t===8){if(t=e.data,t==="$"||t==="$!"||t==="$?"||t==="$~"||t==="&"||t==="F!"||t==="F")break;if(t==="/$"||t==="/&")return null}}return e}var qh=null;function yg(e){e=e.nextSibling;for(var t=0;e;){if(e.nodeType===8){var n=e.data;if(n==="/$"||n==="/&"){if(t===0)return ti(e.nextSibling);t--}else n!=="$"&&n!=="$!"&&n!=="$?"&&n!=="$~"&&n!=="&"||t++}e=e.nextSibling}return null}function Sg(e){e=e.previousSibling;for(var t=0;e;){if(e.nodeType===8){var n=e.data;if(n==="$"||n==="$!"||n==="$?"||n==="$~"||n==="&"){if(t===0)return e;t--}else n!=="/$"&&n!=="/&"||t++}e=e.previousSibling}return null}function Ox(e,t,n){switch(t=qc(n),e){case"html":if(e=t.documentElement,!e)throw Error($(452));return e;case"head":if(e=t.head,!e)throw Error($(453));return e;case"body":if(e=t.body,!e)throw Error($(454));return e;default:throw Error($(451))}}function Eo(e){for(var t=e.attributes;t.length;)e.removeAttributeNode(t[0]);Qd(e)}var ei=new Map,Mg=new Set;function Yc(e){return typeof e.getRootNode=="function"?e.getRootNode():e.nodeType===9?e:e.ownerDocument}var Zi=ie.d;ie.d={f:aE,r:sE,D:rE,C:oE,L:lE,m:cE,X:fE,S:uE,M:hE};function aE(){var e=Zi.f(),t=Mu();return e||t}function sE(e){var t=Or(e);t!==null&&t.tag===5&&t.type==="form"?Rv(t):Zi.r(e)}var Br=typeof document>"u"?null:document;function Px(e,t,n){var i=Br;if(i&&typeof t=="string"&&t){var a=Zn(t);a='link[rel="'+e+'"][href="'+a+'"]',typeof n=="string"&&(a+='[crossorigin="'+n+'"]'),Mg.has(a)||(Mg.add(a),e={rel:e,crossOrigin:n,href:t},i.querySelector(a)===null&&(t=i.createElement("link"),Je(t,"link",e),je(t),i.head.appendChild(t)))}}function rE(e){Zi.D(e),Px("dns-prefetch",e,null)}function oE(e,t){Zi.C(e,t),Px("preconnect",e,t)}function lE(e,t,n){Zi.L(e,t,n);var i=Br;if(i&&e&&t){var a='link[rel="preload"][as="'+Zn(t)+'"]';t==="image"&&n&&n.imageSrcSet?(a+='[imagesrcset="'+Zn(n.imageSrcSet)+'"]',typeof n.imageSizes=="string"&&(a+='[imagesizes="'+Zn(n.imageSizes)+'"]')):a+='[href="'+Zn(e)+'"]';var s=a;switch(t){case"style":s=br(e);break;case"script":s=Fr(e)}ei.has(s)||(e=be({rel:"preload",href:t==="image"&&n&&n.imageSrcSet?void 0:e,as:t},n),ei.set(s,e),i.querySelector(a)!==null||t==="style"&&i.querySelector(Ko(s))||t==="script"&&i.querySelector(Qo(s))||(t=i.createElement("link"),Je(t,"link",e),je(t),i.head.appendChild(t)))}}function cE(e,t){Zi.m(e,t);var n=Br;if(n&&e){var i=t&&typeof t.as=="string"?t.as:"script",a='link[rel="modulepreload"][as="'+Zn(i)+'"][href="'+Zn(e)+'"]',s=a;switch(i){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":s=Fr(e)}if(!ei.has(s)&&(e=be({rel:"modulepreload",href:e},t),ei.set(s,e),n.querySelector(a)===null)){switch(i){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":if(n.querySelector(Qo(s)))return}i=n.createElement("link"),Je(i,"link",e),je(i),n.head.appendChild(i)}}}function uE(e,t,n){Zi.S(e,t,n);var i=Br;if(i&&e){var a=ar(i).hoistableStyles,s=br(e);t=t||"default";var r=a.get(s);if(!r){var o={loading:0,preload:null};if(r=i.querySelector(Ko(s)))o.loading=5;else{e=be({rel:"stylesheet",href:e,"data-precedence":t},n),(n=ei.get(s))&&zp(e,n);var l=r=i.createElement("link");je(l),Je(l,"link",e),l._p=new Promise(function(c,h){l.onload=c,l.onerror=h}),l.addEventListener("load",function(){o.loading|=1}),l.addEventListener("error",function(){o.loading|=2}),o.loading|=4,fc(r,t,i)}r={type:"stylesheet",instance:r,count:1,state:o},a.set(s,r)}}}function fE(e,t){Zi.X(e,t);var n=Br;if(n&&e){var i=ar(n).hoistableScripts,a=Fr(e),s=i.get(a);s||(s=n.querySelector(Qo(a)),s||(e=be({src:e,async:!0},t),(t=ei.get(a))&&Ip(e,t),s=n.createElement("script"),je(s),Je(s,"link",e),n.head.appendChild(s)),s={type:"script",instance:s,count:1,state:null},i.set(a,s))}}function hE(e,t){Zi.M(e,t);var n=Br;if(n&&e){var i=ar(n).hoistableScripts,a=Fr(e),s=i.get(a);s||(s=n.querySelector(Qo(a)),s||(e=be({src:e,async:!0,type:"module"},t),(t=ei.get(a))&&Ip(e,t),s=n.createElement("script"),je(s),Je(s,"link",e),n.head.appendChild(s)),s={type:"script",instance:s,count:1,state:null},i.set(a,s))}}function Eg(e,t,n,i){var a=(a=_a.current)?Yc(a):null;if(!a)throw Error($(446));switch(e){case"meta":case"title":return null;case"style":return typeof n.precedence=="string"&&typeof n.href=="string"?(t=br(n.href),n=ar(a).hoistableStyles,i=n.get(t),i||(i={type:"style",instance:null,count:0,state:null},n.set(t,i)),i):{type:"void",instance:null,count:0,state:null};case"link":if(n.rel==="stylesheet"&&typeof n.href=="string"&&typeof n.precedence=="string"){e=br(n.href);var s=ar(a).hoistableStyles,r=s.get(e);if(r||(a=a.ownerDocument||a,r={type:"stylesheet",instance:null,count:0,state:{loading:0,preload:null}},s.set(e,r),(s=a.querySelector(Ko(e)))&&!s._p&&(r.instance=s,r.state.loading=5),ei.has(e)||(n={rel:"preload",as:"style",href:n.href,crossOrigin:n.crossOrigin,integrity:n.integrity,media:n.media,hrefLang:n.hrefLang,referrerPolicy:n.referrerPolicy},ei.set(e,n),s||dE(a,e,n,r.state))),t&&i===null)throw Error($(528,""));return r}if(t&&i!==null)throw Error($(529,""));return null;case"script":return t=n.async,n=n.src,typeof n=="string"&&t&&typeof t!="function"&&typeof t!="symbol"?(t=Fr(n),n=ar(a).hoistableScripts,i=n.get(t),i||(i={type:"script",instance:null,count:0,state:null},n.set(t,i)),i):{type:"void",instance:null,count:0,state:null};default:throw Error($(444,e))}}function br(e){return'href="'+Zn(e)+'"'}function Ko(e){return'link[rel="stylesheet"]['+e+"]"}function zx(e){return be({},e,{"data-precedence":e.precedence,precedence:null})}function dE(e,t,n,i){e.querySelector('link[rel="preload"][as="style"]['+t+"]")?i.loading=1:(t=e.createElement("link"),i.preload=t,t.addEventListener("load",function(){return i.loading|=1}),t.addEventListener("error",function(){return i.loading|=2}),Je(t,"link",n),je(t),e.head.appendChild(t))}function Fr(e){return'[src="'+Zn(e)+'"]'}function Qo(e){return"script[async]"+e}function bg(e,t,n){if(t.count++,t.instance===null)switch(t.type){case"style":var i=e.querySelector('style[data-href~="'+Zn(n.href)+'"]');if(i)return t.instance=i,je(i),i;var a=be({},n,{"data-href":n.href,"data-precedence":n.precedence,href:null,precedence:null});return i=(e.ownerDocument||e).createElement("style"),je(i),Je(i,"style",a),fc(i,n.precedence,e),t.instance=i;case"stylesheet":a=br(n.href);var s=e.querySelector(Ko(a));if(s)return t.state.loading|=4,t.instance=s,je(s),s;i=zx(n),(a=ei.get(a))&&zp(i,a),s=(e.ownerDocument||e).createElement("link"),je(s);var r=s;return r._p=new Promise(function(o,l){r.onload=o,r.onerror=l}),Je(s,"link",i),t.state.loading|=4,fc(s,n.precedence,e),t.instance=s;case"script":return s=Fr(n.src),(a=e.querySelector(Qo(s)))?(t.instance=a,je(a),a):(i=n,(a=ei.get(s))&&(i=be({},n),Ip(i,a)),e=e.ownerDocument||e,a=e.createElement("script"),je(a),Je(a,"link",i),e.head.appendChild(a),t.instance=a);case"void":return null;default:throw Error($(443,t.type))}else t.type==="stylesheet"&&!(t.state.loading&4)&&(i=t.instance,t.state.loading|=4,fc(i,n.precedence,e));return t.instance}function fc(e,t,n){for(var i=n.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'),a=i.length?i[i.length-1]:null,s=a,r=0;r<i.length;r++){var o=i[r];if(o.dataset.precedence===t)s=o;else if(s!==a)break}s?s.parentNode.insertBefore(e,s.nextSibling):(t=n.nodeType===9?n.head:n,t.insertBefore(e,t.firstChild))}function zp(e,t){e.crossOrigin==null&&(e.crossOrigin=t.crossOrigin),e.referrerPolicy==null&&(e.referrerPolicy=t.referrerPolicy),e.title==null&&(e.title=t.title)}function Ip(e,t){e.crossOrigin==null&&(e.crossOrigin=t.crossOrigin),e.referrerPolicy==null&&(e.referrerPolicy=t.referrerPolicy),e.integrity==null&&(e.integrity=t.integrity)}var hc=null;function Tg(e,t,n){if(hc===null){var i=new Map,a=hc=new Map;a.set(n,i)}else a=hc,i=a.get(n),i||(i=new Map,a.set(n,i));if(i.has(e))return i;for(i.set(e,null),n=n.getElementsByTagName(e),a=0;a<n.length;a++){var s=n[a];if(!(s[jo]||s[Ze]||e==="link"&&s.getAttribute("rel")==="stylesheet")&&s.namespaceURI!=="http://www.w3.org/2000/svg"){var r=s.getAttribute(t)||"";r=e+r;var o=i.get(r);o?o.push(s):i.set(r,[s])}}return i}function Ag(e,t,n){e=e.ownerDocument||e,e.head.insertBefore(n,t==="title"?e.querySelector("head > title"):null)}function pE(e,t,n){if(n===1||t.itemProp!=null)return!1;switch(e){case"meta":case"title":return!0;case"style":if(typeof t.precedence!="string"||typeof t.href!="string"||t.href==="")break;return!0;case"link":if(typeof t.rel!="string"||typeof t.href!="string"||t.href===""||t.onLoad||t.onError)break;switch(t.rel){case"stylesheet":return e=t.disabled,typeof t.precedence=="string"&&e==null;default:return!0}case"script":if(t.async&&typeof t.async!="function"&&typeof t.async!="symbol"&&!t.onLoad&&!t.onError&&t.src&&typeof t.src=="string")return!0}return!1}function Ix(e){return!(e.type==="stylesheet"&&!(e.state.loading&3))}function mE(e,t,n,i){if(n.type==="stylesheet"&&(typeof i.media!="string"||matchMedia(i.media).matches!==!1)&&!(n.state.loading&4)){if(n.instance===null){var a=br(i.href),s=t.querySelector(Ko(a));if(s){t=s._p,t!==null&&typeof t=="object"&&typeof t.then=="function"&&(e.count++,e=Zc.bind(e),t.then(e,e)),n.state.loading|=4,n.instance=s,je(s);return}s=t.ownerDocument||t,i=zx(i),(a=ei.get(a))&&zp(i,a),s=s.createElement("link"),je(s);var r=s;r._p=new Promise(function(o,l){r.onload=o,r.onerror=l}),Je(s,"link",i),n.instance=s}e.stylesheets===null&&(e.stylesheets=new Map),e.stylesheets.set(n,t),(t=n.state.preload)&&!(n.state.loading&3)&&(e.count++,n=Zc.bind(e),t.addEventListener("load",n),t.addEventListener("error",n))}}var gf=0;function gE(e,t){return e.stylesheets&&e.count===0&&dc(e,e.stylesheets),0<e.count||0<e.imgCount?function(n){var i=setTimeout(function(){if(e.stylesheets&&dc(e,e.stylesheets),e.unsuspend){var s=e.unsuspend;e.unsuspend=null,s()}},6e4+t);0<e.imgBytes&&gf===0&&(gf=62500*KM());var a=setTimeout(function(){if(e.waitingForImages=!1,e.count===0&&(e.stylesheets&&dc(e,e.stylesheets),e.unsuspend)){var s=e.unsuspend;e.unsuspend=null,s()}},(e.imgBytes>gf?50:800)+t);return e.unsuspend=n,function(){e.unsuspend=null,clearTimeout(i),clearTimeout(a)}}:null}function Zc(){if(this.count--,this.count===0&&(this.imgCount===0||!this.waitingForImages)){if(this.stylesheets)dc(this,this.stylesheets);else if(this.unsuspend){var e=this.unsuspend;this.unsuspend=null,e()}}}var Kc=null;function dc(e,t){e.stylesheets=null,e.unsuspend!==null&&(e.count++,Kc=new Map,t.forEach(_E,e),Kc=null,Zc.call(e))}function _E(e,t){if(!(t.state.loading&4)){var n=Kc.get(e);if(n)var i=n.get(null);else{n=new Map,Kc.set(e,n);for(var a=e.querySelectorAll("link[data-precedence],style[data-precedence]"),s=0;s<a.length;s++){var r=a[s];(r.nodeName==="LINK"||r.getAttribute("media")!=="not all")&&(n.set(r.dataset.precedence,r),i=r)}i&&n.set(null,i)}a=t.instance,r=a.getAttribute("data-precedence"),s=n.get(r)||i,s===i&&n.set(null,a),n.set(r,a),this.count++,i=Zc.bind(this),a.addEventListener("load",i),a.addEventListener("error",i),s?s.parentNode.insertBefore(a,s.nextSibling):(e=e.nodeType===9?e.head:e,e.insertBefore(a,e.firstChild)),t.state.loading|=4}}var zo={$$typeof:Pi,Provider:null,Consumer:null,_currentValue:ts,_currentValue2:ts,_threadCount:0};function vE(e,t,n,i,a,s,r,o,l){this.tag=1,this.containerInfo=e,this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.next=this.pendingContext=this.context=this.cancelPendingCommit=null,this.callbackPriority=0,this.expirationTimes=Bu(-1),this.entangledLanes=this.shellSuspendCounter=this.errorRecoveryDisabledLanes=this.expiredLanes=this.warmLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=Bu(0),this.hiddenUpdates=Bu(null),this.identifierPrefix=i,this.onUncaughtError=a,this.onCaughtError=s,this.onRecoverableError=r,this.pooledCache=null,this.pooledCacheLanes=0,this.formState=l,this.incompleteTransitions=new Map}function Bx(e,t,n,i,a,s,r,o,l,c,h,d){return e=new vE(e,t,n,r,l,c,h,d,o),t=1,s===!0&&(t|=24),s=Ln(3,null,null,t),e.current=s,s.stateNode=e,t=cp(),t.refCount++,e.pooledCache=t,t.refCount++,s.memoizedState={element:i,isDehydrated:n,cache:t},hp(s),e}function Fx(e){return e?(e=Zs,e):Zs}function Hx(e,t,n,i,a,s){a=Fx(a),i.context===null?i.context=a:i.pendingContext=a,i=xa(t),i.payload={element:n},s=s===void 0?null:s,s!==null&&(i.callback=s),n=ya(e,i,t),n!==null&&(xn(n,e,t),mo(n,e,t))}function Rg(e,t){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var n=e.retryLane;e.retryLane=n!==0&&n<t?n:t}}function Bp(e,t){Rg(e,t),(e=e.alternate)&&Rg(e,t)}function Gx(e){if(e.tag===13||e.tag===31){var t=gs(e,67108864);t!==null&&xn(t,e,67108864),Bp(e,67108864)}}function wg(e){if(e.tag===13||e.tag===31){var t=Bn();t=Zd(t);var n=gs(e,t);n!==null&&xn(n,e,t),Bp(e,t)}}var Qc=!0;function xE(e,t,n,i){var a=Pt.T;Pt.T=null;var s=ie.p;try{ie.p=2,Fp(e,t,n,i)}finally{ie.p=s,Pt.T=a}}function yE(e,t,n,i){var a=Pt.T;Pt.T=null;var s=ie.p;try{ie.p=8,Fp(e,t,n,i)}finally{ie.p=s,Pt.T=a}}function Fp(e,t,n,i){if(Qc){var a=Yh(i);if(a===null)pf(e,t,i,Jc,n),Cg(e,i);else if(ME(a,e,t,n,i))i.stopPropagation();else if(Cg(e,i),t&4&&-1<SE.indexOf(e)){for(;a!==null;){var s=Or(a);if(s!==null)switch(s.tag){case 3:if(s=s.stateNode,s.current.memoizedState.isDehydrated){var r=Xa(s.pendingLanes);if(r!==0){var o=s;for(o.pendingLanes|=2,o.entangledLanes|=2;r;){var l=1<<31-In(r);o.entanglements[1]|=l,r&=~l}Si(s),!(ne&6)&&(Gc=Pn()+500,Zo(0))}}break;case 31:case 13:o=gs(s,2),o!==null&&xn(o,s,2),Mu(),Bp(s,2)}if(s=Yh(i),s===null&&pf(e,t,i,Jc,n),s===a)break;a=s}a!==null&&i.stopPropagation()}else pf(e,t,i,null,n)}}function Yh(e){return e=$d(e),Hp(e)}var Jc=null;function Hp(e){if(Jc=null,e=ks(e),e!==null){var t=Ho(e);if(t===null)e=null;else{var n=t.tag;if(n===13){if(e=o_(t),e!==null)return e;e=null}else if(n===31){if(e=l_(t),e!==null)return e;e=null}else if(n===3){if(t.stateNode.current.memoizedState.isDehydrated)return t.tag===3?t.stateNode.containerInfo:null;e=null}else t!==e&&(e=null)}}return Jc=e,null}function Vx(e){switch(e){case"beforetoggle":case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"resize":case"seeked":case"submit":case"toggle":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 2;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"scroll":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 8;case"message":switch(rS()){case h_:return 2;case d_:return 8;case Rc:case oS:return 32;case p_:return 268435456;default:return 32}default:return 32}}var Zh=!1,Ea=null,ba=null,Ta=null,Io=new Map,Bo=new Map,ua=[],SE="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");function Cg(e,t){switch(e){case"focusin":case"focusout":Ea=null;break;case"dragenter":case"dragleave":ba=null;break;case"mouseover":case"mouseout":Ta=null;break;case"pointerover":case"pointerout":Io.delete(t.pointerId);break;case"gotpointercapture":case"lostpointercapture":Bo.delete(t.pointerId)}}function qr(e,t,n,i,a,s){return e===null||e.nativeEvent!==s?(e={blockedOn:t,domEventName:n,eventSystemFlags:i,nativeEvent:s,targetContainers:[a]},t!==null&&(t=Or(t),t!==null&&Gx(t)),e):(e.eventSystemFlags|=i,t=e.targetContainers,a!==null&&t.indexOf(a)===-1&&t.push(a),e)}function ME(e,t,n,i,a){switch(t){case"focusin":return Ea=qr(Ea,e,t,n,i,a),!0;case"dragenter":return ba=qr(ba,e,t,n,i,a),!0;case"mouseover":return Ta=qr(Ta,e,t,n,i,a),!0;case"pointerover":var s=a.pointerId;return Io.set(s,qr(Io.get(s)||null,e,t,n,i,a)),!0;case"gotpointercapture":return s=a.pointerId,Bo.set(s,qr(Bo.get(s)||null,e,t,n,i,a)),!0}return!1}function kx(e){var t=ks(e.target);if(t!==null){var n=Ho(t);if(n!==null){if(t=n.tag,t===13){if(t=o_(n),t!==null){e.blockedOn=t,dm(e.priority,function(){wg(n)});return}}else if(t===31){if(t=l_(n),t!==null){e.blockedOn=t,dm(e.priority,function(){wg(n)});return}}else if(t===3&&n.stateNode.current.memoizedState.isDehydrated){e.blockedOn=n.tag===3?n.stateNode.containerInfo:null;return}}}e.blockedOn=null}function pc(e){if(e.blockedOn!==null)return!1;for(var t=e.targetContainers;0<t.length;){var n=Yh(e.nativeEvent);if(n===null){n=e.nativeEvent;var i=new n.constructor(n.type,n);dh=i,n.target.dispatchEvent(i),dh=null}else return t=Or(n),t!==null&&Gx(t),e.blockedOn=n,!1;t.shift()}return!0}function Dg(e,t,n){pc(e)&&n.delete(t)}function EE(){Zh=!1,Ea!==null&&pc(Ea)&&(Ea=null),ba!==null&&pc(ba)&&(ba=null),Ta!==null&&pc(Ta)&&(Ta=null),Io.forEach(Dg),Bo.forEach(Dg)}function Ml(e,t){e.blockedOn===t&&(e.blockedOn=null,Zh||(Zh=!0,Fe.unstable_scheduleCallback(Fe.unstable_NormalPriority,EE)))}var El=null;function Ng(e){El!==e&&(El=e,Fe.unstable_scheduleCallback(Fe.unstable_NormalPriority,function(){El===e&&(El=null);for(var t=0;t<e.length;t+=3){var n=e[t],i=e[t+1],a=e[t+2];if(typeof i!="function"){if(Hp(i||n)===null)continue;break}var s=Or(n);s!==null&&(e.splice(t,3),t-=3,Ch(s,{pending:!0,data:a,method:n.method,action:i},i,a))}}))}function Tr(e){function t(l){return Ml(l,e)}Ea!==null&&Ml(Ea,e),ba!==null&&Ml(ba,e),Ta!==null&&Ml(Ta,e),Io.forEach(t),Bo.forEach(t);for(var n=0;n<ua.length;n++){var i=ua[n];i.blockedOn===e&&(i.blockedOn=null)}for(;0<ua.length&&(n=ua[0],n.blockedOn===null);)kx(n),n.blockedOn===null&&ua.shift();if(n=(e.ownerDocument||e).$$reactFormReplay,n!=null)for(i=0;i<n.length;i+=3){var a=n[i],s=n[i+1],r=a[En]||null;if(typeof s=="function")r||Ng(n);else if(r){var o=null;if(s&&s.hasAttribute("formAction")){if(a=s,r=s[En]||null)o=r.formAction;else if(Hp(a)!==null)continue}else o=r.action;typeof o=="function"?n[i+1]=o:(n.splice(i,3),i-=3),Ng(n)}}}function jx(){function e(s){s.canIntercept&&s.info==="react-transition"&&s.intercept({handler:function(){return new Promise(function(r){return a=r})},focusReset:"manual",scroll:"manual"})}function t(){a!==null&&(a(),a=null),i||setTimeout(n,20)}function n(){if(!i&&!navigation.transition){var s=navigation.currentEntry;s&&s.url!=null&&navigation.navigate(s.url,{state:s.getState(),info:"react-transition",history:"replace"})}}if(typeof navigation=="object"){var i=!1,a=null;return navigation.addEventListener("navigate",e),navigation.addEventListener("navigatesuccess",t),navigation.addEventListener("navigateerror",t),setTimeout(n,100),function(){i=!0,navigation.removeEventListener("navigate",e),navigation.removeEventListener("navigatesuccess",t),navigation.removeEventListener("navigateerror",t),a!==null&&(a(),a=null)}}}function Gp(e){this._internalRoot=e}Tu.prototype.render=Gp.prototype.render=function(e){var t=this._internalRoot;if(t===null)throw Error($(409));var n=t.current,i=Bn();Hx(n,i,e,t,null,null)};Tu.prototype.unmount=Gp.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var t=e.containerInfo;Hx(e.current,2,null,e,null,null),Mu(),t[Lr]=null}};function Tu(e){this._internalRoot=e}Tu.prototype.unstable_scheduleHydration=function(e){if(e){var t=x_();e={blockedOn:null,target:e,priority:t};for(var n=0;n<ua.length&&t!==0&&t<ua[n].priority;n++);ua.splice(n,0,e),n===0&&kx(e)}};var Ug=s_.version;if(Ug!=="19.2.7")throw Error($(527,Ug,"19.2.7"));ie.findDOMNode=function(e){var t=e._reactInternals;if(t===void 0)throw typeof e.render=="function"?Error($(188)):(e=Object.keys(e).join(","),Error($(268,e)));return e=$y(t),e=e!==null?c_(e):null,e=e===null?null:e.stateNode,e};var bE={bundleType:0,version:"19.2.7",rendererPackageName:"react-dom",currentDispatcherRef:Pt,reconcilerVersion:"19.2.7"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"){var bl=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!bl.isDisabled&&bl.supportsFiber)try{Go=bl.inject(bE),zn=bl}catch{}}lu.createRoot=function(e,t){if(!r_(e))throw Error($(299));var n=!1,i="",a=Pv,s=zv,r=Iv;return t!=null&&(t.unstable_strictMode===!0&&(n=!0),t.identifierPrefix!==void 0&&(i=t.identifierPrefix),t.onUncaughtError!==void 0&&(a=t.onUncaughtError),t.onCaughtError!==void 0&&(s=t.onCaughtError),t.onRecoverableError!==void 0&&(r=t.onRecoverableError)),t=Bx(e,1,!1,null,null,n,i,null,a,s,r,jx),e[Lr]=t.current,Pp(e),new Gp(t)};lu.hydrateRoot=function(e,t,n){if(!r_(e))throw Error($(299));var i=!1,a="",s=Pv,r=zv,o=Iv,l=null;return n!=null&&(n.unstable_strictMode===!0&&(i=!0),n.identifierPrefix!==void 0&&(a=n.identifierPrefix),n.onUncaughtError!==void 0&&(s=n.onUncaughtError),n.onCaughtError!==void 0&&(r=n.onCaughtError),n.onRecoverableError!==void 0&&(o=n.onRecoverableError),n.formState!==void 0&&(l=n.formState)),t=Bx(e,1,!0,t,n??null,i,a,l,s,r,o,jx),t.context=Fx(null),n=t.current,i=Bn(),i=Zd(i),a=xa(i),a.callback=null,ya(n,a,i),n=i,t.current.lanes=n,ko(t,n),Si(t),e[Lr]=t.current,Pp(e),new Tu(t)};lu.version="19.2.7";function Xx(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(Xx)}catch(e){console.error(e)}}Xx(),$0.exports=lu;var TE=$0.exports;/**
 * @license lucide-react v0.436.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const AE=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),Wx=(...e)=>e.filter((t,n,i)=>!!t&&i.indexOf(t)===n).join(" ");/**
 * @license lucide-react v0.436.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var RE={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.436.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wE=pt.forwardRef(({color:e="currentColor",size:t=24,strokeWidth:n=2,absoluteStrokeWidth:i,className:a="",children:s,iconNode:r,...o},l)=>pt.createElement("svg",{ref:l,...RE,width:t,height:t,stroke:e,strokeWidth:i?Number(n)*24/Number(t):n,className:Wx("lucide",a),...o},[...r.map(([c,h])=>pt.createElement(c,h)),...Array.isArray(s)?s:[s]]));/**
 * @license lucide-react v0.436.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const We=(e,t)=>{const n=pt.forwardRef(({className:i,...a},s)=>pt.createElement(wE,{ref:s,iconNode:t,className:Wx(`lucide-${AE(e)}`,i),...a}));return n.displayName=`${e}`,n};/**
 * @license lucide-react v0.436.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Lg=We("Activity",[["path",{d:"M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",key:"169zse"}]]);/**
 * @license lucide-react v0.436.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const CE=We("Calendar",[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]]);/**
 * @license lucide-react v0.436.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Og=We("ChevronLeft",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-react v0.436.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Tl=We("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);/**
 * @license lucide-react v0.436.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Al=We("Compass",[["path",{d:"m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z",key:"9ktpf1"}],["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]]);/**
 * @license lucide-react v0.436.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const DE=We("ExternalLink",[["path",{d:"M15 3h6v6",key:"1q9fwt"}],["path",{d:"M10 14 21 3",key:"gplh6r"}],["path",{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",key:"a6xqqp"}]]);/**
 * @license lucide-react v0.436.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const NE=We("Filter",[["polygon",{points:"22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3",key:"1yg77f"}]]);/**
 * @license lucide-react v0.436.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const UE=We("Info",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]]);/**
 * @license lucide-react v0.436.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const LE=We("MapPin",[["path",{d:"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",key:"1r0f0z"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}]]);/**
 * @license lucide-react v0.436.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const OE=We("Pause",[["rect",{x:"14",y:"4",width:"4",height:"16",rx:"1",key:"zuxfzm"}],["rect",{x:"6",y:"4",width:"4",height:"16",rx:"1",key:"1okwgv"}]]);/**
 * @license lucide-react v0.436.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const PE=We("Play",[["polygon",{points:"6 3 20 12 6 21 6 3",key:"1oa8hb"}]]);/**
 * @license lucide-react v0.436.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const zE=We("RotateCcw",[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}]]);/**
 * @license lucide-react v0.436.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const IE=We("Search",[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]]);/**
 * @license lucide-react v0.436.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const BE=We("Share2",[["circle",{cx:"18",cy:"5",r:"3",key:"gq8acd"}],["circle",{cx:"6",cy:"12",r:"3",key:"w7nqdw"}],["circle",{cx:"18",cy:"19",r:"3",key:"1xt0gg"}],["line",{x1:"8.59",x2:"15.42",y1:"13.51",y2:"17.49",key:"47mynk"}],["line",{x1:"15.41",x2:"8.59",y1:"6.51",y2:"10.49",key:"1n3mei"}]]);/**
 * @license lucide-react v0.436.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pg=We("ShieldAlert",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"M12 8v4",key:"1got3b"}],["path",{d:"M12 16h.01",key:"1drbdi"}]]);/**
 * @license lucide-react v0.436.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const zg=We("SlidersVertical",[["line",{x1:"4",x2:"4",y1:"21",y2:"14",key:"1p332r"}],["line",{x1:"4",x2:"4",y1:"10",y2:"3",key:"gb41h5"}],["line",{x1:"12",x2:"12",y1:"21",y2:"12",key:"hf2csr"}],["line",{x1:"12",x2:"12",y1:"8",y2:"3",key:"1kfi7u"}],["line",{x1:"20",x2:"20",y1:"21",y2:"16",key:"1lhrwl"}],["line",{x1:"20",x2:"20",y1:"12",y2:"3",key:"16vvfq"}],["line",{x1:"2",x2:"6",y1:"14",y2:"14",key:"1uebub"}],["line",{x1:"10",x2:"14",y1:"8",y2:"8",key:"1yglbp"}],["line",{x1:"18",x2:"22",y1:"16",y2:"16",key:"1jxqpz"}]]);/**
 * @license lucide-react v0.436.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ig=We("Sparkles",[["path",{d:"M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z",key:"4pj2yx"}],["path",{d:"M20 3v4",key:"1olli1"}],["path",{d:"M22 5h-4",key:"1gvqau"}],["path",{d:"M4 17v2",key:"vumght"}],["path",{d:"M5 18H3",key:"zchphs"}]]);/**
 * @license lucide-react v0.436.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _f=We("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]);/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Vp="169",fr={ROTATE:0,DOLLY:1,PAN:2},$s={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},FE=0,Bg=1,HE=2,qx=1,GE=2,Ui=3,Ua=0,yn=1,pi=2,Aa=0,hr=1,bo=2,Fg=3,Hg=4,VE=5,Za=100,kE=101,jE=102,XE=103,WE=104,qE=200,YE=201,ZE=202,KE=203,Kh=204,Qh=205,QE=206,JE=207,$E=208,tb=209,eb=210,nb=211,ib=212,ab=213,sb=214,Jh=0,$h=1,td=2,Ar=3,ed=4,nd=5,id=6,ad=7,Yx=0,rb=1,ob=2,Ra=0,lb=1,cb=2,ub=3,fb=4,hb=5,db=6,pb=7,Zx=300,Rr=301,wr=302,sd=303,rd=304,Au=306,od=1e3,Qa=1001,ld=1002,Jn=1003,mb=1004,Rl=1005,li=1006,vf=1007,Ja=1008,Yi=1009,Kx=1010,Qx=1011,Fo=1012,kp=1013,us=1014,Bi=1015,Jo=1016,jp=1017,Xp=1018,Cr=1020,Jx=35902,$x=1021,ty=1022,ui=1023,ey=1024,ny=1025,dr=1026,Dr=1027,iy=1028,Wp=1029,ay=1030,qp=1031,Yp=1033,mc=33776,gc=33777,_c=33778,vc=33779,cd=35840,ud=35841,fd=35842,hd=35843,dd=36196,pd=37492,md=37496,gd=37808,_d=37809,vd=37810,xd=37811,yd=37812,Sd=37813,Md=37814,Ed=37815,bd=37816,Td=37817,Ad=37818,Rd=37819,wd=37820,Cd=37821,xc=36492,Dd=36494,Nd=36495,sy=36283,Ud=36284,Ld=36285,Od=36286,gb=3200,_b=3201,ry=0,vb=1,fa="",hi="srgb",za="srgb-linear",Zp="display-p3",Ru="display-p3-linear",$c="linear",Se="srgb",tu="rec709",eu="p3",bs=7680,Gg=519,xb=512,yb=513,Sb=514,oy=515,Mb=516,Eb=517,bb=518,Tb=519,Vg=35044,kg="300 es",Fi=2e3,nu=2001;class vs{addEventListener(t,n){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[t]===void 0&&(i[t]=[]),i[t].indexOf(n)===-1&&i[t].push(n)}hasEventListener(t,n){if(this._listeners===void 0)return!1;const i=this._listeners;return i[t]!==void 0&&i[t].indexOf(n)!==-1}removeEventListener(t,n){if(this._listeners===void 0)return;const a=this._listeners[t];if(a!==void 0){const s=a.indexOf(n);s!==-1&&a.splice(s,1)}}dispatchEvent(t){if(this._listeners===void 0)return;const i=this._listeners[t.type];if(i!==void 0){t.target=this;const a=i.slice(0);for(let s=0,r=a.length;s<r;s++)a[s].call(this,t);t.target=null}}}const tn=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],yc=Math.PI/180,Pd=180/Math.PI;function $o(){const e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(tn[e&255]+tn[e>>8&255]+tn[e>>16&255]+tn[e>>24&255]+"-"+tn[t&255]+tn[t>>8&255]+"-"+tn[t>>16&15|64]+tn[t>>24&255]+"-"+tn[n&63|128]+tn[n>>8&255]+"-"+tn[n>>16&255]+tn[n>>24&255]+tn[i&255]+tn[i>>8&255]+tn[i>>16&255]+tn[i>>24&255]).toLowerCase()}function ln(e,t,n){return Math.max(t,Math.min(n,e))}function Ab(e,t){return(e%t+t)%t}function xf(e,t,n){return(1-n)*e+n*t}function Yr(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return e/4294967295;case Uint16Array:return e/65535;case Uint8Array:return e/255;case Int32Array:return Math.max(e/2147483647,-1);case Int16Array:return Math.max(e/32767,-1);case Int8Array:return Math.max(e/127,-1);default:throw new Error("Invalid component type.")}}function pn(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return Math.round(e*4294967295);case Uint16Array:return Math.round(e*65535);case Uint8Array:return Math.round(e*255);case Int32Array:return Math.round(e*2147483647);case Int16Array:return Math.round(e*32767);case Int8Array:return Math.round(e*127);default:throw new Error("Invalid component type.")}}const Rb={DEG2RAD:yc};class Vt{constructor(t=0,n=0){Vt.prototype.isVector2=!0,this.x=t,this.y=n}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,n){return this.x=t,this.y=n,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,n){switch(t){case 0:this.x=n;break;case 1:this.y=n;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,n){return this.x=t.x+n.x,this.y=t.y+n.y,this}addScaledVector(t,n){return this.x+=t.x*n,this.y+=t.y*n,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,n){return this.x=t.x-n.x,this.y=t.y-n.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const n=this.x,i=this.y,a=t.elements;return this.x=a[0]*n+a[3]*i+a[6],this.y=a[1]*n+a[4]*i+a[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,n){return this.x=Math.max(t.x,Math.min(n.x,this.x)),this.y=Math.max(t.y,Math.min(n.y,this.y)),this}clampScalar(t,n){return this.x=Math.max(t,Math.min(n,this.x)),this.y=Math.max(t,Math.min(n,this.y)),this}clampLength(t,n){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(t,Math.min(n,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const n=Math.sqrt(this.lengthSq()*t.lengthSq());if(n===0)return Math.PI/2;const i=this.dot(t)/n;return Math.acos(ln(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const n=this.x-t.x,i=this.y-t.y;return n*n+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,n){return this.x+=(t.x-this.x)*n,this.y+=(t.y-this.y)*n,this}lerpVectors(t,n,i){return this.x=t.x+(n.x-t.x)*i,this.y=t.y+(n.y-t.y)*i,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,n=0){return this.x=t[n],this.y=t[n+1],this}toArray(t=[],n=0){return t[n]=this.x,t[n+1]=this.y,t}fromBufferAttribute(t,n){return this.x=t.getX(n),this.y=t.getY(n),this}rotateAround(t,n){const i=Math.cos(n),a=Math.sin(n),s=this.x-t.x,r=this.y-t.y;return this.x=s*i-r*a+t.x,this.y=s*a+r*i+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Wt{constructor(t,n,i,a,s,r,o,l,c){Wt.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,n,i,a,s,r,o,l,c)}set(t,n,i,a,s,r,o,l,c){const h=this.elements;return h[0]=t,h[1]=a,h[2]=o,h[3]=n,h[4]=s,h[5]=l,h[6]=i,h[7]=r,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const n=this.elements,i=t.elements;return n[0]=i[0],n[1]=i[1],n[2]=i[2],n[3]=i[3],n[4]=i[4],n[5]=i[5],n[6]=i[6],n[7]=i[7],n[8]=i[8],this}extractBasis(t,n,i){return t.setFromMatrix3Column(this,0),n.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const n=t.elements;return this.set(n[0],n[4],n[8],n[1],n[5],n[9],n[2],n[6],n[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,n){const i=t.elements,a=n.elements,s=this.elements,r=i[0],o=i[3],l=i[6],c=i[1],h=i[4],d=i[7],f=i[2],p=i[5],v=i[8],S=a[0],m=a[3],u=a[6],g=a[1],_=a[4],y=a[7],L=a[2],T=a[5],R=a[8];return s[0]=r*S+o*g+l*L,s[3]=r*m+o*_+l*T,s[6]=r*u+o*y+l*R,s[1]=c*S+h*g+d*L,s[4]=c*m+h*_+d*T,s[7]=c*u+h*y+d*R,s[2]=f*S+p*g+v*L,s[5]=f*m+p*_+v*T,s[8]=f*u+p*y+v*R,this}multiplyScalar(t){const n=this.elements;return n[0]*=t,n[3]*=t,n[6]*=t,n[1]*=t,n[4]*=t,n[7]*=t,n[2]*=t,n[5]*=t,n[8]*=t,this}determinant(){const t=this.elements,n=t[0],i=t[1],a=t[2],s=t[3],r=t[4],o=t[5],l=t[6],c=t[7],h=t[8];return n*r*h-n*o*c-i*s*h+i*o*l+a*s*c-a*r*l}invert(){const t=this.elements,n=t[0],i=t[1],a=t[2],s=t[3],r=t[4],o=t[5],l=t[6],c=t[7],h=t[8],d=h*r-o*c,f=o*l-h*s,p=c*s-r*l,v=n*d+i*f+a*p;if(v===0)return this.set(0,0,0,0,0,0,0,0,0);const S=1/v;return t[0]=d*S,t[1]=(a*c-h*i)*S,t[2]=(o*i-a*r)*S,t[3]=f*S,t[4]=(h*n-a*l)*S,t[5]=(a*s-o*n)*S,t[6]=p*S,t[7]=(i*l-c*n)*S,t[8]=(r*n-i*s)*S,this}transpose(){let t;const n=this.elements;return t=n[1],n[1]=n[3],n[3]=t,t=n[2],n[2]=n[6],n[6]=t,t=n[5],n[5]=n[7],n[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const n=this.elements;return t[0]=n[0],t[1]=n[3],t[2]=n[6],t[3]=n[1],t[4]=n[4],t[5]=n[7],t[6]=n[2],t[7]=n[5],t[8]=n[8],this}setUvTransform(t,n,i,a,s,r,o){const l=Math.cos(s),c=Math.sin(s);return this.set(i*l,i*c,-i*(l*r+c*o)+r+t,-a*c,a*l,-a*(-c*r+l*o)+o+n,0,0,1),this}scale(t,n){return this.premultiply(yf.makeScale(t,n)),this}rotate(t){return this.premultiply(yf.makeRotation(-t)),this}translate(t,n){return this.premultiply(yf.makeTranslation(t,n)),this}makeTranslation(t,n){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,n,0,0,1),this}makeRotation(t){const n=Math.cos(t),i=Math.sin(t);return this.set(n,-i,0,i,n,0,0,0,1),this}makeScale(t,n){return this.set(t,0,0,0,n,0,0,0,1),this}equals(t){const n=this.elements,i=t.elements;for(let a=0;a<9;a++)if(n[a]!==i[a])return!1;return!0}fromArray(t,n=0){for(let i=0;i<9;i++)this.elements[i]=t[i+n];return this}toArray(t=[],n=0){const i=this.elements;return t[n]=i[0],t[n+1]=i[1],t[n+2]=i[2],t[n+3]=i[3],t[n+4]=i[4],t[n+5]=i[5],t[n+6]=i[6],t[n+7]=i[7],t[n+8]=i[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const yf=new Wt;function ly(e){for(let t=e.length-1;t>=0;--t)if(e[t]>=65535)return!0;return!1}function iu(e){return document.createElementNS("http://www.w3.org/1999/xhtml",e)}function wb(){const e=iu("canvas");return e.style.display="block",e}const jg={};function Sc(e){e in jg||(jg[e]=!0,console.warn(e))}function Cb(e,t,n){return new Promise(function(i,a){function s(){switch(e.clientWaitSync(t,e.SYNC_FLUSH_COMMANDS_BIT,0)){case e.WAIT_FAILED:a();break;case e.TIMEOUT_EXPIRED:setTimeout(s,n);break;default:i()}}setTimeout(s,n)})}function Db(e){const t=e.elements;t[2]=.5*t[2]+.5*t[3],t[6]=.5*t[6]+.5*t[7],t[10]=.5*t[10]+.5*t[11],t[14]=.5*t[14]+.5*t[15]}function Nb(e){const t=e.elements;t[11]===-1?(t[10]=-t[10]-1,t[14]=-t[14]):(t[10]=-t[10],t[14]=-t[14]+1)}const Xg=new Wt().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),Wg=new Wt().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),Zr={[za]:{transfer:$c,primaries:tu,luminanceCoefficients:[.2126,.7152,.0722],toReference:e=>e,fromReference:e=>e},[hi]:{transfer:Se,primaries:tu,luminanceCoefficients:[.2126,.7152,.0722],toReference:e=>e.convertSRGBToLinear(),fromReference:e=>e.convertLinearToSRGB()},[Ru]:{transfer:$c,primaries:eu,luminanceCoefficients:[.2289,.6917,.0793],toReference:e=>e.applyMatrix3(Wg),fromReference:e=>e.applyMatrix3(Xg)},[Zp]:{transfer:Se,primaries:eu,luminanceCoefficients:[.2289,.6917,.0793],toReference:e=>e.convertSRGBToLinear().applyMatrix3(Wg),fromReference:e=>e.applyMatrix3(Xg).convertLinearToSRGB()}},Ub=new Set([za,Ru]),oe={enabled:!0,_workingColorSpace:za,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(e){if(!Ub.has(e))throw new Error(`Unsupported working color space, "${e}".`);this._workingColorSpace=e},convert:function(e,t,n){if(this.enabled===!1||t===n||!t||!n)return e;const i=Zr[t].toReference,a=Zr[n].fromReference;return a(i(e))},fromWorkingColorSpace:function(e,t){return this.convert(e,this._workingColorSpace,t)},toWorkingColorSpace:function(e,t){return this.convert(e,t,this._workingColorSpace)},getPrimaries:function(e){return Zr[e].primaries},getTransfer:function(e){return e===fa?$c:Zr[e].transfer},getLuminanceCoefficients:function(e,t=this._workingColorSpace){return e.fromArray(Zr[t].luminanceCoefficients)}};function pr(e){return e<.04045?e*.0773993808:Math.pow(e*.9478672986+.0521327014,2.4)}function Sf(e){return e<.0031308?e*12.92:1.055*Math.pow(e,.41666)-.055}let Ts;class Lb{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let n;if(t instanceof HTMLCanvasElement)n=t;else{Ts===void 0&&(Ts=iu("canvas")),Ts.width=t.width,Ts.height=t.height;const i=Ts.getContext("2d");t instanceof ImageData?i.putImageData(t,0,0):i.drawImage(t,0,0,t.width,t.height),n=Ts}return n.width>2048||n.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),n.toDataURL("image/jpeg",.6)):n.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const n=iu("canvas");n.width=t.width,n.height=t.height;const i=n.getContext("2d");i.drawImage(t,0,0,t.width,t.height);const a=i.getImageData(0,0,t.width,t.height),s=a.data;for(let r=0;r<s.length;r++)s[r]=pr(s[r]/255)*255;return i.putImageData(a,0,0),n}else if(t.data){const n=t.data.slice(0);for(let i=0;i<n.length;i++)n instanceof Uint8Array||n instanceof Uint8ClampedArray?n[i]=Math.floor(pr(n[i]/255)*255):n[i]=pr(n[i]);return{data:n,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let Ob=0;class cy{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Ob++}),this.uuid=$o(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const n=t===void 0||typeof t=="string";if(!n&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const i={uuid:this.uuid,url:""},a=this.data;if(a!==null){let s;if(Array.isArray(a)){s=[];for(let r=0,o=a.length;r<o;r++)a[r].isDataTexture?s.push(Mf(a[r].image)):s.push(Mf(a[r]))}else s=Mf(a);i.url=s}return n||(t.images[this.uuid]=i),i}}function Mf(e){return typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap?Lb.getDataURL(e):e.data?{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let Pb=0;class Sn extends vs{constructor(t=Sn.DEFAULT_IMAGE,n=Sn.DEFAULT_MAPPING,i=Qa,a=Qa,s=li,r=Ja,o=ui,l=Yi,c=Sn.DEFAULT_ANISOTROPY,h=fa){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Pb++}),this.uuid=$o(),this.name="",this.source=new cy(t),this.mipmaps=[],this.mapping=n,this.channel=0,this.wrapS=i,this.wrapT=a,this.magFilter=s,this.minFilter=r,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new Vt(0,0),this.repeat=new Vt(1,1),this.center=new Vt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Wt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){const n=t===void 0||typeof t=="string";if(!n&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const i={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),n||(t.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Zx)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case od:t.x=t.x-Math.floor(t.x);break;case Qa:t.x=t.x<0?0:1;break;case ld:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case od:t.y=t.y-Math.floor(t.y);break;case Qa:t.y=t.y<0?0:1;break;case ld:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}Sn.DEFAULT_IMAGE=null;Sn.DEFAULT_MAPPING=Zx;Sn.DEFAULT_ANISOTROPY=1;class pe{constructor(t=0,n=0,i=0,a=1){pe.prototype.isVector4=!0,this.x=t,this.y=n,this.z=i,this.w=a}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,n,i,a){return this.x=t,this.y=n,this.z=i,this.w=a,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,n){switch(t){case 0:this.x=n;break;case 1:this.y=n;break;case 2:this.z=n;break;case 3:this.w=n;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,n){return this.x=t.x+n.x,this.y=t.y+n.y,this.z=t.z+n.z,this.w=t.w+n.w,this}addScaledVector(t,n){return this.x+=t.x*n,this.y+=t.y*n,this.z+=t.z*n,this.w+=t.w*n,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,n){return this.x=t.x-n.x,this.y=t.y-n.y,this.z=t.z-n.z,this.w=t.w-n.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const n=this.x,i=this.y,a=this.z,s=this.w,r=t.elements;return this.x=r[0]*n+r[4]*i+r[8]*a+r[12]*s,this.y=r[1]*n+r[5]*i+r[9]*a+r[13]*s,this.z=r[2]*n+r[6]*i+r[10]*a+r[14]*s,this.w=r[3]*n+r[7]*i+r[11]*a+r[15]*s,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const n=Math.sqrt(1-t.w*t.w);return n<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/n,this.y=t.y/n,this.z=t.z/n),this}setAxisAngleFromRotationMatrix(t){let n,i,a,s;const l=t.elements,c=l[0],h=l[4],d=l[8],f=l[1],p=l[5],v=l[9],S=l[2],m=l[6],u=l[10];if(Math.abs(h-f)<.01&&Math.abs(d-S)<.01&&Math.abs(v-m)<.01){if(Math.abs(h+f)<.1&&Math.abs(d+S)<.1&&Math.abs(v+m)<.1&&Math.abs(c+p+u-3)<.1)return this.set(1,0,0,0),this;n=Math.PI;const _=(c+1)/2,y=(p+1)/2,L=(u+1)/2,T=(h+f)/4,R=(d+S)/4,U=(v+m)/4;return _>y&&_>L?_<.01?(i=0,a=.707106781,s=.707106781):(i=Math.sqrt(_),a=T/i,s=R/i):y>L?y<.01?(i=.707106781,a=0,s=.707106781):(a=Math.sqrt(y),i=T/a,s=U/a):L<.01?(i=.707106781,a=.707106781,s=0):(s=Math.sqrt(L),i=R/s,a=U/s),this.set(i,a,s,n),this}let g=Math.sqrt((m-v)*(m-v)+(d-S)*(d-S)+(f-h)*(f-h));return Math.abs(g)<.001&&(g=1),this.x=(m-v)/g,this.y=(d-S)/g,this.z=(f-h)/g,this.w=Math.acos((c+p+u-1)/2),this}setFromMatrixPosition(t){const n=t.elements;return this.x=n[12],this.y=n[13],this.z=n[14],this.w=n[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,n){return this.x=Math.max(t.x,Math.min(n.x,this.x)),this.y=Math.max(t.y,Math.min(n.y,this.y)),this.z=Math.max(t.z,Math.min(n.z,this.z)),this.w=Math.max(t.w,Math.min(n.w,this.w)),this}clampScalar(t,n){return this.x=Math.max(t,Math.min(n,this.x)),this.y=Math.max(t,Math.min(n,this.y)),this.z=Math.max(t,Math.min(n,this.z)),this.w=Math.max(t,Math.min(n,this.w)),this}clampLength(t,n){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(t,Math.min(n,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,n){return this.x+=(t.x-this.x)*n,this.y+=(t.y-this.y)*n,this.z+=(t.z-this.z)*n,this.w+=(t.w-this.w)*n,this}lerpVectors(t,n,i){return this.x=t.x+(n.x-t.x)*i,this.y=t.y+(n.y-t.y)*i,this.z=t.z+(n.z-t.z)*i,this.w=t.w+(n.w-t.w)*i,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,n=0){return this.x=t[n],this.y=t[n+1],this.z=t[n+2],this.w=t[n+3],this}toArray(t=[],n=0){return t[n]=this.x,t[n+1]=this.y,t[n+2]=this.z,t[n+3]=this.w,t}fromBufferAttribute(t,n){return this.x=t.getX(n),this.y=t.getY(n),this.z=t.getZ(n),this.w=t.getW(n),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class zb extends vs{constructor(t=1,n=1,i={}){super(),this.isRenderTarget=!0,this.width=t,this.height=n,this.depth=1,this.scissor=new pe(0,0,t,n),this.scissorTest=!1,this.viewport=new pe(0,0,t,n);const a={width:t,height:n,depth:1};i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:li,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},i);const s=new Sn(a,i.mapping,i.wrapS,i.wrapT,i.magFilter,i.minFilter,i.format,i.type,i.anisotropy,i.colorSpace);s.flipY=!1,s.generateMipmaps=i.generateMipmaps,s.internalFormat=i.internalFormat,this.textures=[];const r=i.count;for(let o=0;o<r;o++)this.textures[o]=s.clone(),this.textures[o].isRenderTargetTexture=!0;this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.depthTexture=i.depthTexture,this.samples=i.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,n,i=1){if(this.width!==t||this.height!==n||this.depth!==i){this.width=t,this.height=n,this.depth=i;for(let a=0,s=this.textures.length;a<s;a++)this.textures[a].image.width=t,this.textures[a].image.height=n,this.textures[a].image.depth=i;this.dispose()}this.viewport.set(0,0,t,n),this.scissor.set(0,0,t,n)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let i=0,a=t.textures.length;i<a;i++)this.textures[i]=t.textures[i].clone(),this.textures[i].isRenderTargetTexture=!0;const n=Object.assign({},t.texture.image);return this.texture.source=new cy(n),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class fs extends zb{constructor(t=1,n=1,i={}){super(t,n,i),this.isWebGLRenderTarget=!0}}class uy extends Sn{constructor(t=null,n=1,i=1,a=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:n,height:i,depth:a},this.magFilter=Jn,this.minFilter=Jn,this.wrapR=Qa,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class Ib extends Sn{constructor(t=null,n=1,i=1,a=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:n,height:i,depth:a},this.magFilter=Jn,this.minFilter=Jn,this.wrapR=Qa,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class hs{constructor(t=0,n=0,i=0,a=1){this.isQuaternion=!0,this._x=t,this._y=n,this._z=i,this._w=a}static slerpFlat(t,n,i,a,s,r,o){let l=i[a+0],c=i[a+1],h=i[a+2],d=i[a+3];const f=s[r+0],p=s[r+1],v=s[r+2],S=s[r+3];if(o===0){t[n+0]=l,t[n+1]=c,t[n+2]=h,t[n+3]=d;return}if(o===1){t[n+0]=f,t[n+1]=p,t[n+2]=v,t[n+3]=S;return}if(d!==S||l!==f||c!==p||h!==v){let m=1-o;const u=l*f+c*p+h*v+d*S,g=u>=0?1:-1,_=1-u*u;if(_>Number.EPSILON){const L=Math.sqrt(_),T=Math.atan2(L,u*g);m=Math.sin(m*T)/L,o=Math.sin(o*T)/L}const y=o*g;if(l=l*m+f*y,c=c*m+p*y,h=h*m+v*y,d=d*m+S*y,m===1-o){const L=1/Math.sqrt(l*l+c*c+h*h+d*d);l*=L,c*=L,h*=L,d*=L}}t[n]=l,t[n+1]=c,t[n+2]=h,t[n+3]=d}static multiplyQuaternionsFlat(t,n,i,a,s,r){const o=i[a],l=i[a+1],c=i[a+2],h=i[a+3],d=s[r],f=s[r+1],p=s[r+2],v=s[r+3];return t[n]=o*v+h*d+l*p-c*f,t[n+1]=l*v+h*f+c*d-o*p,t[n+2]=c*v+h*p+o*f-l*d,t[n+3]=h*v-o*d-l*f-c*p,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,n,i,a){return this._x=t,this._y=n,this._z=i,this._w=a,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,n=!0){const i=t._x,a=t._y,s=t._z,r=t._order,o=Math.cos,l=Math.sin,c=o(i/2),h=o(a/2),d=o(s/2),f=l(i/2),p=l(a/2),v=l(s/2);switch(r){case"XYZ":this._x=f*h*d+c*p*v,this._y=c*p*d-f*h*v,this._z=c*h*v+f*p*d,this._w=c*h*d-f*p*v;break;case"YXZ":this._x=f*h*d+c*p*v,this._y=c*p*d-f*h*v,this._z=c*h*v-f*p*d,this._w=c*h*d+f*p*v;break;case"ZXY":this._x=f*h*d-c*p*v,this._y=c*p*d+f*h*v,this._z=c*h*v+f*p*d,this._w=c*h*d-f*p*v;break;case"ZYX":this._x=f*h*d-c*p*v,this._y=c*p*d+f*h*v,this._z=c*h*v-f*p*d,this._w=c*h*d+f*p*v;break;case"YZX":this._x=f*h*d+c*p*v,this._y=c*p*d+f*h*v,this._z=c*h*v-f*p*d,this._w=c*h*d-f*p*v;break;case"XZY":this._x=f*h*d-c*p*v,this._y=c*p*d-f*h*v,this._z=c*h*v+f*p*d,this._w=c*h*d+f*p*v;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+r)}return n===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,n){const i=n/2,a=Math.sin(i);return this._x=t.x*a,this._y=t.y*a,this._z=t.z*a,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(t){const n=t.elements,i=n[0],a=n[4],s=n[8],r=n[1],o=n[5],l=n[9],c=n[2],h=n[6],d=n[10],f=i+o+d;if(f>0){const p=.5/Math.sqrt(f+1);this._w=.25/p,this._x=(h-l)*p,this._y=(s-c)*p,this._z=(r-a)*p}else if(i>o&&i>d){const p=2*Math.sqrt(1+i-o-d);this._w=(h-l)/p,this._x=.25*p,this._y=(a+r)/p,this._z=(s+c)/p}else if(o>d){const p=2*Math.sqrt(1+o-i-d);this._w=(s-c)/p,this._x=(a+r)/p,this._y=.25*p,this._z=(l+h)/p}else{const p=2*Math.sqrt(1+d-i-o);this._w=(r-a)/p,this._x=(s+c)/p,this._y=(l+h)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(t,n){let i=t.dot(n)+1;return i<Number.EPSILON?(i=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=i):(this._x=0,this._y=-t.z,this._z=t.y,this._w=i)):(this._x=t.y*n.z-t.z*n.y,this._y=t.z*n.x-t.x*n.z,this._z=t.x*n.y-t.y*n.x,this._w=i),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(ln(this.dot(t),-1,1)))}rotateTowards(t,n){const i=this.angleTo(t);if(i===0)return this;const a=Math.min(1,n/i);return this.slerp(t,a),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,n){const i=t._x,a=t._y,s=t._z,r=t._w,o=n._x,l=n._y,c=n._z,h=n._w;return this._x=i*h+r*o+a*c-s*l,this._y=a*h+r*l+s*o-i*c,this._z=s*h+r*c+i*l-a*o,this._w=r*h-i*o-a*l-s*c,this._onChangeCallback(),this}slerp(t,n){if(n===0)return this;if(n===1)return this.copy(t);const i=this._x,a=this._y,s=this._z,r=this._w;let o=r*t._w+i*t._x+a*t._y+s*t._z;if(o<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,o=-o):this.copy(t),o>=1)return this._w=r,this._x=i,this._y=a,this._z=s,this;const l=1-o*o;if(l<=Number.EPSILON){const p=1-n;return this._w=p*r+n*this._w,this._x=p*i+n*this._x,this._y=p*a+n*this._y,this._z=p*s+n*this._z,this.normalize(),this}const c=Math.sqrt(l),h=Math.atan2(c,o),d=Math.sin((1-n)*h)/c,f=Math.sin(n*h)/c;return this._w=r*d+this._w*f,this._x=i*d+this._x*f,this._y=a*d+this._y*f,this._z=s*d+this._z*f,this._onChangeCallback(),this}slerpQuaternions(t,n,i){return this.copy(t).slerp(n,i)}random(){const t=2*Math.PI*Math.random(),n=2*Math.PI*Math.random(),i=Math.random(),a=Math.sqrt(1-i),s=Math.sqrt(i);return this.set(a*Math.sin(t),a*Math.cos(t),s*Math.sin(n),s*Math.cos(n))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,n=0){return this._x=t[n],this._y=t[n+1],this._z=t[n+2],this._w=t[n+3],this._onChangeCallback(),this}toArray(t=[],n=0){return t[n]=this._x,t[n+1]=this._y,t[n+2]=this._z,t[n+3]=this._w,t}fromBufferAttribute(t,n){return this._x=t.getX(n),this._y=t.getY(n),this._z=t.getZ(n),this._w=t.getW(n),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class I{constructor(t=0,n=0,i=0){I.prototype.isVector3=!0,this.x=t,this.y=n,this.z=i}set(t,n,i){return i===void 0&&(i=this.z),this.x=t,this.y=n,this.z=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,n){switch(t){case 0:this.x=n;break;case 1:this.y=n;break;case 2:this.z=n;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,n){return this.x=t.x+n.x,this.y=t.y+n.y,this.z=t.z+n.z,this}addScaledVector(t,n){return this.x+=t.x*n,this.y+=t.y*n,this.z+=t.z*n,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,n){return this.x=t.x-n.x,this.y=t.y-n.y,this.z=t.z-n.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,n){return this.x=t.x*n.x,this.y=t.y*n.y,this.z=t.z*n.z,this}applyEuler(t){return this.applyQuaternion(qg.setFromEuler(t))}applyAxisAngle(t,n){return this.applyQuaternion(qg.setFromAxisAngle(t,n))}applyMatrix3(t){const n=this.x,i=this.y,a=this.z,s=t.elements;return this.x=s[0]*n+s[3]*i+s[6]*a,this.y=s[1]*n+s[4]*i+s[7]*a,this.z=s[2]*n+s[5]*i+s[8]*a,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const n=this.x,i=this.y,a=this.z,s=t.elements,r=1/(s[3]*n+s[7]*i+s[11]*a+s[15]);return this.x=(s[0]*n+s[4]*i+s[8]*a+s[12])*r,this.y=(s[1]*n+s[5]*i+s[9]*a+s[13])*r,this.z=(s[2]*n+s[6]*i+s[10]*a+s[14])*r,this}applyQuaternion(t){const n=this.x,i=this.y,a=this.z,s=t.x,r=t.y,o=t.z,l=t.w,c=2*(r*a-o*i),h=2*(o*n-s*a),d=2*(s*i-r*n);return this.x=n+l*c+r*d-o*h,this.y=i+l*h+o*c-s*d,this.z=a+l*d+s*h-r*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const n=this.x,i=this.y,a=this.z,s=t.elements;return this.x=s[0]*n+s[4]*i+s[8]*a,this.y=s[1]*n+s[5]*i+s[9]*a,this.z=s[2]*n+s[6]*i+s[10]*a,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,n){return this.x=Math.max(t.x,Math.min(n.x,this.x)),this.y=Math.max(t.y,Math.min(n.y,this.y)),this.z=Math.max(t.z,Math.min(n.z,this.z)),this}clampScalar(t,n){return this.x=Math.max(t,Math.min(n,this.x)),this.y=Math.max(t,Math.min(n,this.y)),this.z=Math.max(t,Math.min(n,this.z)),this}clampLength(t,n){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(t,Math.min(n,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,n){return this.x+=(t.x-this.x)*n,this.y+=(t.y-this.y)*n,this.z+=(t.z-this.z)*n,this}lerpVectors(t,n,i){return this.x=t.x+(n.x-t.x)*i,this.y=t.y+(n.y-t.y)*i,this.z=t.z+(n.z-t.z)*i,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,n){const i=t.x,a=t.y,s=t.z,r=n.x,o=n.y,l=n.z;return this.x=a*l-s*o,this.y=s*r-i*l,this.z=i*o-a*r,this}projectOnVector(t){const n=t.lengthSq();if(n===0)return this.set(0,0,0);const i=t.dot(this)/n;return this.copy(t).multiplyScalar(i)}projectOnPlane(t){return Ef.copy(this).projectOnVector(t),this.sub(Ef)}reflect(t){return this.sub(Ef.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const n=Math.sqrt(this.lengthSq()*t.lengthSq());if(n===0)return Math.PI/2;const i=this.dot(t)/n;return Math.acos(ln(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const n=this.x-t.x,i=this.y-t.y,a=this.z-t.z;return n*n+i*i+a*a}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,n,i){const a=Math.sin(n)*t;return this.x=a*Math.sin(i),this.y=Math.cos(n)*t,this.z=a*Math.cos(i),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,n,i){return this.x=t*Math.sin(n),this.y=i,this.z=t*Math.cos(n),this}setFromMatrixPosition(t){const n=t.elements;return this.x=n[12],this.y=n[13],this.z=n[14],this}setFromMatrixScale(t){const n=this.setFromMatrixColumn(t,0).length(),i=this.setFromMatrixColumn(t,1).length(),a=this.setFromMatrixColumn(t,2).length();return this.x=n,this.y=i,this.z=a,this}setFromMatrixColumn(t,n){return this.fromArray(t.elements,n*4)}setFromMatrix3Column(t,n){return this.fromArray(t.elements,n*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,n=0){return this.x=t[n],this.y=t[n+1],this.z=t[n+2],this}toArray(t=[],n=0){return t[n]=this.x,t[n+1]=this.y,t[n+2]=this.z,t}fromBufferAttribute(t,n){return this.x=t.getX(n),this.y=t.getY(n),this.z=t.getZ(n),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,n=Math.random()*2-1,i=Math.sqrt(1-n*n);return this.x=i*Math.cos(t),this.y=n,this.z=i*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Ef=new I,qg=new hs;class tl{constructor(t=new I(1/0,1/0,1/0),n=new I(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=n}set(t,n){return this.min.copy(t),this.max.copy(n),this}setFromArray(t){this.makeEmpty();for(let n=0,i=t.length;n<i;n+=3)this.expandByPoint(ai.fromArray(t,n));return this}setFromBufferAttribute(t){this.makeEmpty();for(let n=0,i=t.count;n<i;n++)this.expandByPoint(ai.fromBufferAttribute(t,n));return this}setFromPoints(t){this.makeEmpty();for(let n=0,i=t.length;n<i;n++)this.expandByPoint(t[n]);return this}setFromCenterAndSize(t,n){const i=ai.copy(n).multiplyScalar(.5);return this.min.copy(t).sub(i),this.max.copy(t).add(i),this}setFromObject(t,n=!1){return this.makeEmpty(),this.expandByObject(t,n)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,n=!1){t.updateWorldMatrix(!1,!1);const i=t.geometry;if(i!==void 0){const s=i.getAttribute("position");if(n===!0&&s!==void 0&&t.isInstancedMesh!==!0)for(let r=0,o=s.count;r<o;r++)t.isMesh===!0?t.getVertexPosition(r,ai):ai.fromBufferAttribute(s,r),ai.applyMatrix4(t.matrixWorld),this.expandByPoint(ai);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),wl.copy(t.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),wl.copy(i.boundingBox)),wl.applyMatrix4(t.matrixWorld),this.union(wl)}const a=t.children;for(let s=0,r=a.length;s<r;s++)this.expandByObject(a[s],n);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,n){return n.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,ai),ai.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let n,i;return t.normal.x>0?(n=t.normal.x*this.min.x,i=t.normal.x*this.max.x):(n=t.normal.x*this.max.x,i=t.normal.x*this.min.x),t.normal.y>0?(n+=t.normal.y*this.min.y,i+=t.normal.y*this.max.y):(n+=t.normal.y*this.max.y,i+=t.normal.y*this.min.y),t.normal.z>0?(n+=t.normal.z*this.min.z,i+=t.normal.z*this.max.z):(n+=t.normal.z*this.max.z,i+=t.normal.z*this.min.z),n<=-t.constant&&i>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Kr),Cl.subVectors(this.max,Kr),As.subVectors(t.a,Kr),Rs.subVectors(t.b,Kr),ws.subVectors(t.c,Kr),Ji.subVectors(Rs,As),$i.subVectors(ws,Rs),Ba.subVectors(As,ws);let n=[0,-Ji.z,Ji.y,0,-$i.z,$i.y,0,-Ba.z,Ba.y,Ji.z,0,-Ji.x,$i.z,0,-$i.x,Ba.z,0,-Ba.x,-Ji.y,Ji.x,0,-$i.y,$i.x,0,-Ba.y,Ba.x,0];return!bf(n,As,Rs,ws,Cl)||(n=[1,0,0,0,1,0,0,0,1],!bf(n,As,Rs,ws,Cl))?!1:(Dl.crossVectors(Ji,$i),n=[Dl.x,Dl.y,Dl.z],bf(n,As,Rs,ws,Cl))}clampPoint(t,n){return n.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,ai).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(ai).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Ai[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Ai[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Ai[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Ai[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Ai[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Ai[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Ai[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Ai[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Ai),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}}const Ai=[new I,new I,new I,new I,new I,new I,new I,new I],ai=new I,wl=new tl,As=new I,Rs=new I,ws=new I,Ji=new I,$i=new I,Ba=new I,Kr=new I,Cl=new I,Dl=new I,Fa=new I;function bf(e,t,n,i,a){for(let s=0,r=e.length-3;s<=r;s+=3){Fa.fromArray(e,s);const o=a.x*Math.abs(Fa.x)+a.y*Math.abs(Fa.y)+a.z*Math.abs(Fa.z),l=t.dot(Fa),c=n.dot(Fa),h=i.dot(Fa);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}const Bb=new tl,Qr=new I,Tf=new I;class el{constructor(t=new I,n=-1){this.isSphere=!0,this.center=t,this.radius=n}set(t,n){return this.center.copy(t),this.radius=n,this}setFromPoints(t,n){const i=this.center;n!==void 0?i.copy(n):Bb.setFromPoints(t).getCenter(i);let a=0;for(let s=0,r=t.length;s<r;s++)a=Math.max(a,i.distanceToSquared(t[s]));return this.radius=Math.sqrt(a),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const n=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=n*n}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,n){const i=this.center.distanceToSquared(t);return n.copy(t),i>this.radius*this.radius&&(n.sub(this.center).normalize(),n.multiplyScalar(this.radius).add(this.center)),n}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Qr.subVectors(t,this.center);const n=Qr.lengthSq();if(n>this.radius*this.radius){const i=Math.sqrt(n),a=(i-this.radius)*.5;this.center.addScaledVector(Qr,a/i),this.radius+=a}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Tf.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Qr.copy(t.center).add(Tf)),this.expandByPoint(Qr.copy(t.center).sub(Tf))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}}const Ri=new I,Af=new I,Nl=new I,ta=new I,Rf=new I,Ul=new I,wf=new I;class nl{constructor(t=new I,n=new I(0,0,-1)){this.origin=t,this.direction=n}set(t,n){return this.origin.copy(t),this.direction.copy(n),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,n){return n.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,Ri)),this}closestPointToPoint(t,n){n.subVectors(t,this.origin);const i=n.dot(this.direction);return i<0?n.copy(this.origin):n.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const n=Ri.subVectors(t,this.origin).dot(this.direction);return n<0?this.origin.distanceToSquared(t):(Ri.copy(this.origin).addScaledVector(this.direction,n),Ri.distanceToSquared(t))}distanceSqToSegment(t,n,i,a){Af.copy(t).add(n).multiplyScalar(.5),Nl.copy(n).sub(t).normalize(),ta.copy(this.origin).sub(Af);const s=t.distanceTo(n)*.5,r=-this.direction.dot(Nl),o=ta.dot(this.direction),l=-ta.dot(Nl),c=ta.lengthSq(),h=Math.abs(1-r*r);let d,f,p,v;if(h>0)if(d=r*l-o,f=r*o-l,v=s*h,d>=0)if(f>=-v)if(f<=v){const S=1/h;d*=S,f*=S,p=d*(d+r*f+2*o)+f*(r*d+f+2*l)+c}else f=s,d=Math.max(0,-(r*f+o)),p=-d*d+f*(f+2*l)+c;else f=-s,d=Math.max(0,-(r*f+o)),p=-d*d+f*(f+2*l)+c;else f<=-v?(d=Math.max(0,-(-r*s+o)),f=d>0?-s:Math.min(Math.max(-s,-l),s),p=-d*d+f*(f+2*l)+c):f<=v?(d=0,f=Math.min(Math.max(-s,-l),s),p=f*(f+2*l)+c):(d=Math.max(0,-(r*s+o)),f=d>0?s:Math.min(Math.max(-s,-l),s),p=-d*d+f*(f+2*l)+c);else f=r>0?-s:s,d=Math.max(0,-(r*f+o)),p=-d*d+f*(f+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,d),a&&a.copy(Af).addScaledVector(Nl,f),p}intersectSphere(t,n){Ri.subVectors(t.center,this.origin);const i=Ri.dot(this.direction),a=Ri.dot(Ri)-i*i,s=t.radius*t.radius;if(a>s)return null;const r=Math.sqrt(s-a),o=i-r,l=i+r;return l<0?null:o<0?this.at(l,n):this.at(o,n)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const n=t.normal.dot(this.direction);if(n===0)return t.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(t.normal)+t.constant)/n;return i>=0?i:null}intersectPlane(t,n){const i=this.distanceToPlane(t);return i===null?null:this.at(i,n)}intersectsPlane(t){const n=t.distanceToPoint(this.origin);return n===0||t.normal.dot(this.direction)*n<0}intersectBox(t,n){let i,a,s,r,o,l;const c=1/this.direction.x,h=1/this.direction.y,d=1/this.direction.z,f=this.origin;return c>=0?(i=(t.min.x-f.x)*c,a=(t.max.x-f.x)*c):(i=(t.max.x-f.x)*c,a=(t.min.x-f.x)*c),h>=0?(s=(t.min.y-f.y)*h,r=(t.max.y-f.y)*h):(s=(t.max.y-f.y)*h,r=(t.min.y-f.y)*h),i>r||s>a||((s>i||isNaN(i))&&(i=s),(r<a||isNaN(a))&&(a=r),d>=0?(o=(t.min.z-f.z)*d,l=(t.max.z-f.z)*d):(o=(t.max.z-f.z)*d,l=(t.min.z-f.z)*d),i>l||o>a)||((o>i||i!==i)&&(i=o),(l<a||a!==a)&&(a=l),a<0)?null:this.at(i>=0?i:a,n)}intersectsBox(t){return this.intersectBox(t,Ri)!==null}intersectTriangle(t,n,i,a,s){Rf.subVectors(n,t),Ul.subVectors(i,t),wf.crossVectors(Rf,Ul);let r=this.direction.dot(wf),o;if(r>0){if(a)return null;o=1}else if(r<0)o=-1,r=-r;else return null;ta.subVectors(this.origin,t);const l=o*this.direction.dot(Ul.crossVectors(ta,Ul));if(l<0)return null;const c=o*this.direction.dot(Rf.cross(ta));if(c<0||l+c>r)return null;const h=-o*ta.dot(wf);return h<0?null:this.at(h/r,s)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class ve{constructor(t,n,i,a,s,r,o,l,c,h,d,f,p,v,S,m){ve.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,n,i,a,s,r,o,l,c,h,d,f,p,v,S,m)}set(t,n,i,a,s,r,o,l,c,h,d,f,p,v,S,m){const u=this.elements;return u[0]=t,u[4]=n,u[8]=i,u[12]=a,u[1]=s,u[5]=r,u[9]=o,u[13]=l,u[2]=c,u[6]=h,u[10]=d,u[14]=f,u[3]=p,u[7]=v,u[11]=S,u[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new ve().fromArray(this.elements)}copy(t){const n=this.elements,i=t.elements;return n[0]=i[0],n[1]=i[1],n[2]=i[2],n[3]=i[3],n[4]=i[4],n[5]=i[5],n[6]=i[6],n[7]=i[7],n[8]=i[8],n[9]=i[9],n[10]=i[10],n[11]=i[11],n[12]=i[12],n[13]=i[13],n[14]=i[14],n[15]=i[15],this}copyPosition(t){const n=this.elements,i=t.elements;return n[12]=i[12],n[13]=i[13],n[14]=i[14],this}setFromMatrix3(t){const n=t.elements;return this.set(n[0],n[3],n[6],0,n[1],n[4],n[7],0,n[2],n[5],n[8],0,0,0,0,1),this}extractBasis(t,n,i){return t.setFromMatrixColumn(this,0),n.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(t,n,i){return this.set(t.x,n.x,i.x,0,t.y,n.y,i.y,0,t.z,n.z,i.z,0,0,0,0,1),this}extractRotation(t){const n=this.elements,i=t.elements,a=1/Cs.setFromMatrixColumn(t,0).length(),s=1/Cs.setFromMatrixColumn(t,1).length(),r=1/Cs.setFromMatrixColumn(t,2).length();return n[0]=i[0]*a,n[1]=i[1]*a,n[2]=i[2]*a,n[3]=0,n[4]=i[4]*s,n[5]=i[5]*s,n[6]=i[6]*s,n[7]=0,n[8]=i[8]*r,n[9]=i[9]*r,n[10]=i[10]*r,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,this}makeRotationFromEuler(t){const n=this.elements,i=t.x,a=t.y,s=t.z,r=Math.cos(i),o=Math.sin(i),l=Math.cos(a),c=Math.sin(a),h=Math.cos(s),d=Math.sin(s);if(t.order==="XYZ"){const f=r*h,p=r*d,v=o*h,S=o*d;n[0]=l*h,n[4]=-l*d,n[8]=c,n[1]=p+v*c,n[5]=f-S*c,n[9]=-o*l,n[2]=S-f*c,n[6]=v+p*c,n[10]=r*l}else if(t.order==="YXZ"){const f=l*h,p=l*d,v=c*h,S=c*d;n[0]=f+S*o,n[4]=v*o-p,n[8]=r*c,n[1]=r*d,n[5]=r*h,n[9]=-o,n[2]=p*o-v,n[6]=S+f*o,n[10]=r*l}else if(t.order==="ZXY"){const f=l*h,p=l*d,v=c*h,S=c*d;n[0]=f-S*o,n[4]=-r*d,n[8]=v+p*o,n[1]=p+v*o,n[5]=r*h,n[9]=S-f*o,n[2]=-r*c,n[6]=o,n[10]=r*l}else if(t.order==="ZYX"){const f=r*h,p=r*d,v=o*h,S=o*d;n[0]=l*h,n[4]=v*c-p,n[8]=f*c+S,n[1]=l*d,n[5]=S*c+f,n[9]=p*c-v,n[2]=-c,n[6]=o*l,n[10]=r*l}else if(t.order==="YZX"){const f=r*l,p=r*c,v=o*l,S=o*c;n[0]=l*h,n[4]=S-f*d,n[8]=v*d+p,n[1]=d,n[5]=r*h,n[9]=-o*h,n[2]=-c*h,n[6]=p*d+v,n[10]=f-S*d}else if(t.order==="XZY"){const f=r*l,p=r*c,v=o*l,S=o*c;n[0]=l*h,n[4]=-d,n[8]=c*h,n[1]=f*d+S,n[5]=r*h,n[9]=p*d-v,n[2]=v*d-p,n[6]=o*h,n[10]=S*d+f}return n[3]=0,n[7]=0,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,this}makeRotationFromQuaternion(t){return this.compose(Fb,t,Hb)}lookAt(t,n,i){const a=this.elements;return wn.subVectors(t,n),wn.lengthSq()===0&&(wn.z=1),wn.normalize(),ea.crossVectors(i,wn),ea.lengthSq()===0&&(Math.abs(i.z)===1?wn.x+=1e-4:wn.z+=1e-4,wn.normalize(),ea.crossVectors(i,wn)),ea.normalize(),Ll.crossVectors(wn,ea),a[0]=ea.x,a[4]=Ll.x,a[8]=wn.x,a[1]=ea.y,a[5]=Ll.y,a[9]=wn.y,a[2]=ea.z,a[6]=Ll.z,a[10]=wn.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,n){const i=t.elements,a=n.elements,s=this.elements,r=i[0],o=i[4],l=i[8],c=i[12],h=i[1],d=i[5],f=i[9],p=i[13],v=i[2],S=i[6],m=i[10],u=i[14],g=i[3],_=i[7],y=i[11],L=i[15],T=a[0],R=a[4],U=a[8],X=a[12],x=a[1],E=a[5],q=a[9],W=a[13],J=a[2],et=a[6],N=a[10],G=a[14],O=a[3],nt=a[7],Z=a[11],it=a[15];return s[0]=r*T+o*x+l*J+c*O,s[4]=r*R+o*E+l*et+c*nt,s[8]=r*U+o*q+l*N+c*Z,s[12]=r*X+o*W+l*G+c*it,s[1]=h*T+d*x+f*J+p*O,s[5]=h*R+d*E+f*et+p*nt,s[9]=h*U+d*q+f*N+p*Z,s[13]=h*X+d*W+f*G+p*it,s[2]=v*T+S*x+m*J+u*O,s[6]=v*R+S*E+m*et+u*nt,s[10]=v*U+S*q+m*N+u*Z,s[14]=v*X+S*W+m*G+u*it,s[3]=g*T+_*x+y*J+L*O,s[7]=g*R+_*E+y*et+L*nt,s[11]=g*U+_*q+y*N+L*Z,s[15]=g*X+_*W+y*G+L*it,this}multiplyScalar(t){const n=this.elements;return n[0]*=t,n[4]*=t,n[8]*=t,n[12]*=t,n[1]*=t,n[5]*=t,n[9]*=t,n[13]*=t,n[2]*=t,n[6]*=t,n[10]*=t,n[14]*=t,n[3]*=t,n[7]*=t,n[11]*=t,n[15]*=t,this}determinant(){const t=this.elements,n=t[0],i=t[4],a=t[8],s=t[12],r=t[1],o=t[5],l=t[9],c=t[13],h=t[2],d=t[6],f=t[10],p=t[14],v=t[3],S=t[7],m=t[11],u=t[15];return v*(+s*l*d-a*c*d-s*o*f+i*c*f+a*o*p-i*l*p)+S*(+n*l*p-n*c*f+s*r*f-a*r*p+a*c*h-s*l*h)+m*(+n*c*d-n*o*p-s*r*d+i*r*p+s*o*h-i*c*h)+u*(-a*o*h-n*l*d+n*o*f+a*r*d-i*r*f+i*l*h)}transpose(){const t=this.elements;let n;return n=t[1],t[1]=t[4],t[4]=n,n=t[2],t[2]=t[8],t[8]=n,n=t[6],t[6]=t[9],t[9]=n,n=t[3],t[3]=t[12],t[12]=n,n=t[7],t[7]=t[13],t[13]=n,n=t[11],t[11]=t[14],t[14]=n,this}setPosition(t,n,i){const a=this.elements;return t.isVector3?(a[12]=t.x,a[13]=t.y,a[14]=t.z):(a[12]=t,a[13]=n,a[14]=i),this}invert(){const t=this.elements,n=t[0],i=t[1],a=t[2],s=t[3],r=t[4],o=t[5],l=t[6],c=t[7],h=t[8],d=t[9],f=t[10],p=t[11],v=t[12],S=t[13],m=t[14],u=t[15],g=d*m*c-S*f*c+S*l*p-o*m*p-d*l*u+o*f*u,_=v*f*c-h*m*c-v*l*p+r*m*p+h*l*u-r*f*u,y=h*S*c-v*d*c+v*o*p-r*S*p-h*o*u+r*d*u,L=v*d*l-h*S*l-v*o*f+r*S*f+h*o*m-r*d*m,T=n*g+i*_+a*y+s*L;if(T===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const R=1/T;return t[0]=g*R,t[1]=(S*f*s-d*m*s-S*a*p+i*m*p+d*a*u-i*f*u)*R,t[2]=(o*m*s-S*l*s+S*a*c-i*m*c-o*a*u+i*l*u)*R,t[3]=(d*l*s-o*f*s-d*a*c+i*f*c+o*a*p-i*l*p)*R,t[4]=_*R,t[5]=(h*m*s-v*f*s+v*a*p-n*m*p-h*a*u+n*f*u)*R,t[6]=(v*l*s-r*m*s-v*a*c+n*m*c+r*a*u-n*l*u)*R,t[7]=(r*f*s-h*l*s+h*a*c-n*f*c-r*a*p+n*l*p)*R,t[8]=y*R,t[9]=(v*d*s-h*S*s-v*i*p+n*S*p+h*i*u-n*d*u)*R,t[10]=(r*S*s-v*o*s+v*i*c-n*S*c-r*i*u+n*o*u)*R,t[11]=(h*o*s-r*d*s-h*i*c+n*d*c+r*i*p-n*o*p)*R,t[12]=L*R,t[13]=(h*S*a-v*d*a+v*i*f-n*S*f-h*i*m+n*d*m)*R,t[14]=(v*o*a-r*S*a-v*i*l+n*S*l+r*i*m-n*o*m)*R,t[15]=(r*d*a-h*o*a+h*i*l-n*d*l-r*i*f+n*o*f)*R,this}scale(t){const n=this.elements,i=t.x,a=t.y,s=t.z;return n[0]*=i,n[4]*=a,n[8]*=s,n[1]*=i,n[5]*=a,n[9]*=s,n[2]*=i,n[6]*=a,n[10]*=s,n[3]*=i,n[7]*=a,n[11]*=s,this}getMaxScaleOnAxis(){const t=this.elements,n=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],i=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],a=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(n,i,a))}makeTranslation(t,n,i){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,n,0,0,1,i,0,0,0,1),this}makeRotationX(t){const n=Math.cos(t),i=Math.sin(t);return this.set(1,0,0,0,0,n,-i,0,0,i,n,0,0,0,0,1),this}makeRotationY(t){const n=Math.cos(t),i=Math.sin(t);return this.set(n,0,i,0,0,1,0,0,-i,0,n,0,0,0,0,1),this}makeRotationZ(t){const n=Math.cos(t),i=Math.sin(t);return this.set(n,-i,0,0,i,n,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,n){const i=Math.cos(n),a=Math.sin(n),s=1-i,r=t.x,o=t.y,l=t.z,c=s*r,h=s*o;return this.set(c*r+i,c*o-a*l,c*l+a*o,0,c*o+a*l,h*o+i,h*l-a*r,0,c*l-a*o,h*l+a*r,s*l*l+i,0,0,0,0,1),this}makeScale(t,n,i){return this.set(t,0,0,0,0,n,0,0,0,0,i,0,0,0,0,1),this}makeShear(t,n,i,a,s,r){return this.set(1,i,s,0,t,1,r,0,n,a,1,0,0,0,0,1),this}compose(t,n,i){const a=this.elements,s=n._x,r=n._y,o=n._z,l=n._w,c=s+s,h=r+r,d=o+o,f=s*c,p=s*h,v=s*d,S=r*h,m=r*d,u=o*d,g=l*c,_=l*h,y=l*d,L=i.x,T=i.y,R=i.z;return a[0]=(1-(S+u))*L,a[1]=(p+y)*L,a[2]=(v-_)*L,a[3]=0,a[4]=(p-y)*T,a[5]=(1-(f+u))*T,a[6]=(m+g)*T,a[7]=0,a[8]=(v+_)*R,a[9]=(m-g)*R,a[10]=(1-(f+S))*R,a[11]=0,a[12]=t.x,a[13]=t.y,a[14]=t.z,a[15]=1,this}decompose(t,n,i){const a=this.elements;let s=Cs.set(a[0],a[1],a[2]).length();const r=Cs.set(a[4],a[5],a[6]).length(),o=Cs.set(a[8],a[9],a[10]).length();this.determinant()<0&&(s=-s),t.x=a[12],t.y=a[13],t.z=a[14],si.copy(this);const c=1/s,h=1/r,d=1/o;return si.elements[0]*=c,si.elements[1]*=c,si.elements[2]*=c,si.elements[4]*=h,si.elements[5]*=h,si.elements[6]*=h,si.elements[8]*=d,si.elements[9]*=d,si.elements[10]*=d,n.setFromRotationMatrix(si),i.x=s,i.y=r,i.z=o,this}makePerspective(t,n,i,a,s,r,o=Fi){const l=this.elements,c=2*s/(n-t),h=2*s/(i-a),d=(n+t)/(n-t),f=(i+a)/(i-a);let p,v;if(o===Fi)p=-(r+s)/(r-s),v=-2*r*s/(r-s);else if(o===nu)p=-r/(r-s),v=-r*s/(r-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=c,l[4]=0,l[8]=d,l[12]=0,l[1]=0,l[5]=h,l[9]=f,l[13]=0,l[2]=0,l[6]=0,l[10]=p,l[14]=v,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,n,i,a,s,r,o=Fi){const l=this.elements,c=1/(n-t),h=1/(i-a),d=1/(r-s),f=(n+t)*c,p=(i+a)*h;let v,S;if(o===Fi)v=(r+s)*d,S=-2*d;else if(o===nu)v=s*d,S=-1*d;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-f,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-p,l[2]=0,l[6]=0,l[10]=S,l[14]=-v,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){const n=this.elements,i=t.elements;for(let a=0;a<16;a++)if(n[a]!==i[a])return!1;return!0}fromArray(t,n=0){for(let i=0;i<16;i++)this.elements[i]=t[i+n];return this}toArray(t=[],n=0){const i=this.elements;return t[n]=i[0],t[n+1]=i[1],t[n+2]=i[2],t[n+3]=i[3],t[n+4]=i[4],t[n+5]=i[5],t[n+6]=i[6],t[n+7]=i[7],t[n+8]=i[8],t[n+9]=i[9],t[n+10]=i[10],t[n+11]=i[11],t[n+12]=i[12],t[n+13]=i[13],t[n+14]=i[14],t[n+15]=i[15],t}}const Cs=new I,si=new ve,Fb=new I(0,0,0),Hb=new I(1,1,1),ea=new I,Ll=new I,wn=new I,Yg=new ve,Zg=new hs;class xi{constructor(t=0,n=0,i=0,a=xi.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=n,this._z=i,this._order=a}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,n,i,a=this._order){return this._x=t,this._y=n,this._z=i,this._order=a,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,n=this._order,i=!0){const a=t.elements,s=a[0],r=a[4],o=a[8],l=a[1],c=a[5],h=a[9],d=a[2],f=a[6],p=a[10];switch(n){case"XYZ":this._y=Math.asin(ln(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,p),this._z=Math.atan2(-r,s)):(this._x=Math.atan2(f,c),this._z=0);break;case"YXZ":this._x=Math.asin(-ln(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,p),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-d,s),this._z=0);break;case"ZXY":this._x=Math.asin(ln(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-d,p),this._z=Math.atan2(-r,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-ln(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(f,p),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-r,c));break;case"YZX":this._z=Math.asin(ln(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-d,s)):(this._x=0,this._y=Math.atan2(o,p));break;case"XZY":this._z=Math.asin(-ln(r,-1,1)),Math.abs(r)<.9999999?(this._x=Math.atan2(f,c),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-h,p),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+n)}return this._order=n,i===!0&&this._onChangeCallback(),this}setFromQuaternion(t,n,i){return Yg.makeRotationFromQuaternion(t),this.setFromRotationMatrix(Yg,n,i)}setFromVector3(t,n=this._order){return this.set(t.x,t.y,t.z,n)}reorder(t){return Zg.setFromEuler(this),this.setFromQuaternion(Zg,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],n=0){return t[n]=this._x,t[n+1]=this._y,t[n+2]=this._z,t[n+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}xi.DEFAULT_ORDER="XYZ";class Kp{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let Gb=0;const Kg=new I,Ds=new hs,wi=new ve,Ol=new I,Jr=new I,Vb=new I,kb=new hs,Qg=new I(1,0,0),Jg=new I(0,1,0),$g=new I(0,0,1),t0={type:"added"},jb={type:"removed"},Ns={type:"childadded",child:null},Cf={type:"childremoved",child:null};class an extends vs{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Gb++}),this.uuid=$o(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=an.DEFAULT_UP.clone();const t=new I,n=new xi,i=new hs,a=new I(1,1,1);function s(){i.setFromEuler(n,!1)}function r(){n.setFromQuaternion(i,void 0,!1)}n._onChange(s),i._onChange(r),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:n},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:a},modelViewMatrix:{value:new ve},normalMatrix:{value:new Wt}}),this.matrix=new ve,this.matrixWorld=new ve,this.matrixAutoUpdate=an.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=an.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Kp,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,n){this.quaternion.setFromAxisAngle(t,n)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,n){return Ds.setFromAxisAngle(t,n),this.quaternion.multiply(Ds),this}rotateOnWorldAxis(t,n){return Ds.setFromAxisAngle(t,n),this.quaternion.premultiply(Ds),this}rotateX(t){return this.rotateOnAxis(Qg,t)}rotateY(t){return this.rotateOnAxis(Jg,t)}rotateZ(t){return this.rotateOnAxis($g,t)}translateOnAxis(t,n){return Kg.copy(t).applyQuaternion(this.quaternion),this.position.add(Kg.multiplyScalar(n)),this}translateX(t){return this.translateOnAxis(Qg,t)}translateY(t){return this.translateOnAxis(Jg,t)}translateZ(t){return this.translateOnAxis($g,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(wi.copy(this.matrixWorld).invert())}lookAt(t,n,i){t.isVector3?Ol.copy(t):Ol.set(t,n,i);const a=this.parent;this.updateWorldMatrix(!0,!1),Jr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?wi.lookAt(Jr,Ol,this.up):wi.lookAt(Ol,Jr,this.up),this.quaternion.setFromRotationMatrix(wi),a&&(wi.extractRotation(a.matrixWorld),Ds.setFromRotationMatrix(wi),this.quaternion.premultiply(Ds.invert()))}add(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.add(arguments[n]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(t0),Ns.child=t,this.dispatchEvent(Ns),Ns.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const n=this.children.indexOf(t);return n!==-1&&(t.parent=null,this.children.splice(n,1),t.dispatchEvent(jb),Cf.child=t,this.dispatchEvent(Cf),Cf.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),wi.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),wi.multiply(t.parent.matrixWorld)),t.applyMatrix4(wi),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(t0),Ns.child=t,this.dispatchEvent(Ns),Ns.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,n){if(this[t]===n)return this;for(let i=0,a=this.children.length;i<a;i++){const r=this.children[i].getObjectByProperty(t,n);if(r!==void 0)return r}}getObjectsByProperty(t,n,i=[]){this[t]===n&&i.push(this);const a=this.children;for(let s=0,r=a.length;s<r;s++)a[s].getObjectsByProperty(t,n,i);return i}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Jr,t,Vb),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Jr,kb,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const n=this.matrixWorld.elements;return t.set(n[8],n[9],n[10]).normalize()}raycast(){}traverse(t){t(this);const n=this.children;for(let i=0,a=n.length;i<a;i++)n[i].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const n=this.children;for(let i=0,a=n.length;i<a;i++)n[i].traverseVisible(t)}traverseAncestors(t){const n=this.parent;n!==null&&(t(n),n.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const n=this.children;for(let i=0,a=n.length;i<a;i++)n[i].updateMatrixWorld(t)}updateWorldMatrix(t,n){const i=this.parent;if(t===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),n===!0){const a=this.children;for(let s=0,r=a.length;s<r;s++)a[s].updateWorldMatrix(!1,!0)}}toJSON(t){const n=t===void 0||typeof t=="string",i={};n&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const a={};a.uuid=this.uuid,a.type=this.type,this.name!==""&&(a.name=this.name),this.castShadow===!0&&(a.castShadow=!0),this.receiveShadow===!0&&(a.receiveShadow=!0),this.visible===!1&&(a.visible=!1),this.frustumCulled===!1&&(a.frustumCulled=!1),this.renderOrder!==0&&(a.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(a.userData=this.userData),a.layers=this.layers.mask,a.matrix=this.matrix.toArray(),a.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(a.matrixAutoUpdate=!1),this.isInstancedMesh&&(a.type="InstancedMesh",a.count=this.count,a.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(a.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(a.type="BatchedMesh",a.perObjectFrustumCulled=this.perObjectFrustumCulled,a.sortObjects=this.sortObjects,a.drawRanges=this._drawRanges,a.reservedRanges=this._reservedRanges,a.visibility=this._visibility,a.active=this._active,a.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),a.maxInstanceCount=this._maxInstanceCount,a.maxVertexCount=this._maxVertexCount,a.maxIndexCount=this._maxIndexCount,a.geometryInitialized=this._geometryInitialized,a.geometryCount=this._geometryCount,a.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(a.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(a.boundingSphere={center:a.boundingSphere.center.toArray(),radius:a.boundingSphere.radius}),this.boundingBox!==null&&(a.boundingBox={min:a.boundingBox.min.toArray(),max:a.boundingBox.max.toArray()}));function s(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?a.background=this.background.toJSON():this.background.isTexture&&(a.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(a.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){a.geometry=s(t.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){const d=l[c];s(t.shapes,d)}else s(t.shapes,l)}}if(this.isSkinnedMesh&&(a.bindMode=this.bindMode,a.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(t.skeletons,this.skeleton),a.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(s(t.materials,this.material[l]));a.material=o}else a.material=s(t.materials,this.material);if(this.children.length>0){a.children=[];for(let o=0;o<this.children.length;o++)a.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){a.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];a.animations.push(s(t.animations,l))}}if(n){const o=r(t.geometries),l=r(t.materials),c=r(t.textures),h=r(t.images),d=r(t.shapes),f=r(t.skeletons),p=r(t.animations),v=r(t.nodes);o.length>0&&(i.geometries=o),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),h.length>0&&(i.images=h),d.length>0&&(i.shapes=d),f.length>0&&(i.skeletons=f),p.length>0&&(i.animations=p),v.length>0&&(i.nodes=v)}return i.object=a,i;function r(o){const l=[];for(const c in o){const h=o[c];delete h.metadata,l.push(h)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,n=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),n===!0)for(let i=0;i<t.children.length;i++){const a=t.children[i];this.add(a.clone())}return this}}an.DEFAULT_UP=new I(0,1,0);an.DEFAULT_MATRIX_AUTO_UPDATE=!0;an.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const ri=new I,Ci=new I,Df=new I,Di=new I,Us=new I,Ls=new I,e0=new I,Nf=new I,Uf=new I,Lf=new I,Of=new pe,Pf=new pe,zf=new pe;class ci{constructor(t=new I,n=new I,i=new I){this.a=t,this.b=n,this.c=i}static getNormal(t,n,i,a){a.subVectors(i,n),ri.subVectors(t,n),a.cross(ri);const s=a.lengthSq();return s>0?a.multiplyScalar(1/Math.sqrt(s)):a.set(0,0,0)}static getBarycoord(t,n,i,a,s){ri.subVectors(a,n),Ci.subVectors(i,n),Df.subVectors(t,n);const r=ri.dot(ri),o=ri.dot(Ci),l=ri.dot(Df),c=Ci.dot(Ci),h=Ci.dot(Df),d=r*c-o*o;if(d===0)return s.set(0,0,0),null;const f=1/d,p=(c*l-o*h)*f,v=(r*h-o*l)*f;return s.set(1-p-v,v,p)}static containsPoint(t,n,i,a){return this.getBarycoord(t,n,i,a,Di)===null?!1:Di.x>=0&&Di.y>=0&&Di.x+Di.y<=1}static getInterpolation(t,n,i,a,s,r,o,l){return this.getBarycoord(t,n,i,a,Di)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,Di.x),l.addScaledVector(r,Di.y),l.addScaledVector(o,Di.z),l)}static getInterpolatedAttribute(t,n,i,a,s,r){return Of.setScalar(0),Pf.setScalar(0),zf.setScalar(0),Of.fromBufferAttribute(t,n),Pf.fromBufferAttribute(t,i),zf.fromBufferAttribute(t,a),r.setScalar(0),r.addScaledVector(Of,s.x),r.addScaledVector(Pf,s.y),r.addScaledVector(zf,s.z),r}static isFrontFacing(t,n,i,a){return ri.subVectors(i,n),Ci.subVectors(t,n),ri.cross(Ci).dot(a)<0}set(t,n,i){return this.a.copy(t),this.b.copy(n),this.c.copy(i),this}setFromPointsAndIndices(t,n,i,a){return this.a.copy(t[n]),this.b.copy(t[i]),this.c.copy(t[a]),this}setFromAttributeAndIndices(t,n,i,a){return this.a.fromBufferAttribute(t,n),this.b.fromBufferAttribute(t,i),this.c.fromBufferAttribute(t,a),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return ri.subVectors(this.c,this.b),Ci.subVectors(this.a,this.b),ri.cross(Ci).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return ci.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,n){return ci.getBarycoord(t,this.a,this.b,this.c,n)}getInterpolation(t,n,i,a,s){return ci.getInterpolation(t,this.a,this.b,this.c,n,i,a,s)}containsPoint(t){return ci.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return ci.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,n){const i=this.a,a=this.b,s=this.c;let r,o;Us.subVectors(a,i),Ls.subVectors(s,i),Nf.subVectors(t,i);const l=Us.dot(Nf),c=Ls.dot(Nf);if(l<=0&&c<=0)return n.copy(i);Uf.subVectors(t,a);const h=Us.dot(Uf),d=Ls.dot(Uf);if(h>=0&&d<=h)return n.copy(a);const f=l*d-h*c;if(f<=0&&l>=0&&h<=0)return r=l/(l-h),n.copy(i).addScaledVector(Us,r);Lf.subVectors(t,s);const p=Us.dot(Lf),v=Ls.dot(Lf);if(v>=0&&p<=v)return n.copy(s);const S=p*c-l*v;if(S<=0&&c>=0&&v<=0)return o=c/(c-v),n.copy(i).addScaledVector(Ls,o);const m=h*v-p*d;if(m<=0&&d-h>=0&&p-v>=0)return e0.subVectors(s,a),o=(d-h)/(d-h+(p-v)),n.copy(a).addScaledVector(e0,o);const u=1/(m+S+f);return r=S*u,o=f*u,n.copy(i).addScaledVector(Us,r).addScaledVector(Ls,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}const fy={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},na={h:0,s:0,l:0},Pl={h:0,s:0,l:0};function If(e,t,n){return n<0&&(n+=1),n>1&&(n-=1),n<1/6?e+(t-e)*6*n:n<1/2?t:n<2/3?e+(t-e)*6*(2/3-n):e}class ee{constructor(t,n,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,n,i)}set(t,n,i){if(n===void 0&&i===void 0){const a=t;a&&a.isColor?this.copy(a):typeof a=="number"?this.setHex(a):typeof a=="string"&&this.setStyle(a)}else this.setRGB(t,n,i);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,n=hi){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,oe.toWorkingColorSpace(this,n),this}setRGB(t,n,i,a=oe.workingColorSpace){return this.r=t,this.g=n,this.b=i,oe.toWorkingColorSpace(this,a),this}setHSL(t,n,i,a=oe.workingColorSpace){if(t=Ab(t,1),n=ln(n,0,1),i=ln(i,0,1),n===0)this.r=this.g=this.b=i;else{const s=i<=.5?i*(1+n):i+n-i*n,r=2*i-s;this.r=If(r,s,t+1/3),this.g=If(r,s,t),this.b=If(r,s,t-1/3)}return oe.toWorkingColorSpace(this,a),this}setStyle(t,n=hi){function i(s){s!==void 0&&parseFloat(s)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let a;if(a=/^(\w+)\(([^\)]*)\)/.exec(t)){let s;const r=a[1],o=a[2];switch(r){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,n);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,n);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,n);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(a=/^\#([A-Fa-f\d]+)$/.exec(t)){const s=a[1],r=s.length;if(r===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,n);if(r===6)return this.setHex(parseInt(s,16),n);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,n);return this}setColorName(t,n=hi){const i=fy[t.toLowerCase()];return i!==void 0?this.setHex(i,n):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=pr(t.r),this.g=pr(t.g),this.b=pr(t.b),this}copyLinearToSRGB(t){return this.r=Sf(t.r),this.g=Sf(t.g),this.b=Sf(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=hi){return oe.fromWorkingColorSpace(en.copy(this),t),Math.round(ln(en.r*255,0,255))*65536+Math.round(ln(en.g*255,0,255))*256+Math.round(ln(en.b*255,0,255))}getHexString(t=hi){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,n=oe.workingColorSpace){oe.fromWorkingColorSpace(en.copy(this),n);const i=en.r,a=en.g,s=en.b,r=Math.max(i,a,s),o=Math.min(i,a,s);let l,c;const h=(o+r)/2;if(o===r)l=0,c=0;else{const d=r-o;switch(c=h<=.5?d/(r+o):d/(2-r-o),r){case i:l=(a-s)/d+(a<s?6:0);break;case a:l=(s-i)/d+2;break;case s:l=(i-a)/d+4;break}l/=6}return t.h=l,t.s=c,t.l=h,t}getRGB(t,n=oe.workingColorSpace){return oe.fromWorkingColorSpace(en.copy(this),n),t.r=en.r,t.g=en.g,t.b=en.b,t}getStyle(t=hi){oe.fromWorkingColorSpace(en.copy(this),t);const n=en.r,i=en.g,a=en.b;return t!==hi?`color(${t} ${n.toFixed(3)} ${i.toFixed(3)} ${a.toFixed(3)})`:`rgb(${Math.round(n*255)},${Math.round(i*255)},${Math.round(a*255)})`}offsetHSL(t,n,i){return this.getHSL(na),this.setHSL(na.h+t,na.s+n,na.l+i)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,n){return this.r=t.r+n.r,this.g=t.g+n.g,this.b=t.b+n.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,n){return this.r+=(t.r-this.r)*n,this.g+=(t.g-this.g)*n,this.b+=(t.b-this.b)*n,this}lerpColors(t,n,i){return this.r=t.r+(n.r-t.r)*i,this.g=t.g+(n.g-t.g)*i,this.b=t.b+(n.b-t.b)*i,this}lerpHSL(t,n){this.getHSL(na),t.getHSL(Pl);const i=xf(na.h,Pl.h,n),a=xf(na.s,Pl.s,n),s=xf(na.l,Pl.l,n);return this.setHSL(i,a,s),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const n=this.r,i=this.g,a=this.b,s=t.elements;return this.r=s[0]*n+s[3]*i+s[6]*a,this.g=s[1]*n+s[4]*i+s[7]*a,this.b=s[2]*n+s[5]*i+s[8]*a,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,n=0){return this.r=t[n],this.g=t[n+1],this.b=t[n+2],this}toArray(t=[],n=0){return t[n]=this.r,t[n+1]=this.g,t[n+2]=this.b,t}fromBufferAttribute(t,n){return this.r=t.getX(n),this.g=t.getY(n),this.b=t.getZ(n),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const en=new ee;ee.NAMES=fy;let Xb=0;class xs extends vs{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Xb++}),this.uuid=$o(),this.name="",this.type="Material",this.blending=hr,this.side=Ua,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Kh,this.blendDst=Qh,this.blendEquation=Za,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new ee(0,0,0),this.blendAlpha=0,this.depthFunc=Ar,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Gg,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=bs,this.stencilZFail=bs,this.stencilZPass=bs,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const n in t){const i=t[n];if(i===void 0){console.warn(`THREE.Material: parameter '${n}' has value of undefined.`);continue}const a=this[n];if(a===void 0){console.warn(`THREE.Material: '${n}' is not a property of THREE.${this.type}.`);continue}a&&a.isColor?a.set(i):a&&a.isVector3&&i&&i.isVector3?a.copy(i):this[n]=i}}toJSON(t){const n=t===void 0||typeof t=="string";n&&(t={textures:{},images:{}});const i={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(t).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(t).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(t).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(t).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(t).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==hr&&(i.blending=this.blending),this.side!==Ua&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==Kh&&(i.blendSrc=this.blendSrc),this.blendDst!==Qh&&(i.blendDst=this.blendDst),this.blendEquation!==Za&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==Ar&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Gg&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==bs&&(i.stencilFail=this.stencilFail),this.stencilZFail!==bs&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==bs&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function a(s){const r=[];for(const o in s){const l=s[o];delete l.metadata,r.push(l)}return r}if(n){const s=a(t.textures),r=a(t.images);s.length>0&&(i.textures=s),r.length>0&&(i.images=r)}return i}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const n=t.clippingPlanes;let i=null;if(n!==null){const a=n.length;i=new Array(a);for(let s=0;s!==a;++s)i[s]=n[s].clone()}return this.clippingPlanes=i,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}}class tr extends xs{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new ee(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new xi,this.combine=Yx,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const Ue=new I,zl=new Vt;class cn{constructor(t,n,i=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=n,this.count=t!==void 0?t.length/n:0,this.normalized=i,this.usage=Vg,this.updateRanges=[],this.gpuType=Bi,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,n){this.updateRanges.push({start:t,count:n})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,n,i){t*=this.itemSize,i*=n.itemSize;for(let a=0,s=this.itemSize;a<s;a++)this.array[t+a]=n.array[i+a];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let n=0,i=this.count;n<i;n++)zl.fromBufferAttribute(this,n),zl.applyMatrix3(t),this.setXY(n,zl.x,zl.y);else if(this.itemSize===3)for(let n=0,i=this.count;n<i;n++)Ue.fromBufferAttribute(this,n),Ue.applyMatrix3(t),this.setXYZ(n,Ue.x,Ue.y,Ue.z);return this}applyMatrix4(t){for(let n=0,i=this.count;n<i;n++)Ue.fromBufferAttribute(this,n),Ue.applyMatrix4(t),this.setXYZ(n,Ue.x,Ue.y,Ue.z);return this}applyNormalMatrix(t){for(let n=0,i=this.count;n<i;n++)Ue.fromBufferAttribute(this,n),Ue.applyNormalMatrix(t),this.setXYZ(n,Ue.x,Ue.y,Ue.z);return this}transformDirection(t){for(let n=0,i=this.count;n<i;n++)Ue.fromBufferAttribute(this,n),Ue.transformDirection(t),this.setXYZ(n,Ue.x,Ue.y,Ue.z);return this}set(t,n=0){return this.array.set(t,n),this}getComponent(t,n){let i=this.array[t*this.itemSize+n];return this.normalized&&(i=Yr(i,this.array)),i}setComponent(t,n,i){return this.normalized&&(i=pn(i,this.array)),this.array[t*this.itemSize+n]=i,this}getX(t){let n=this.array[t*this.itemSize];return this.normalized&&(n=Yr(n,this.array)),n}setX(t,n){return this.normalized&&(n=pn(n,this.array)),this.array[t*this.itemSize]=n,this}getY(t){let n=this.array[t*this.itemSize+1];return this.normalized&&(n=Yr(n,this.array)),n}setY(t,n){return this.normalized&&(n=pn(n,this.array)),this.array[t*this.itemSize+1]=n,this}getZ(t){let n=this.array[t*this.itemSize+2];return this.normalized&&(n=Yr(n,this.array)),n}setZ(t,n){return this.normalized&&(n=pn(n,this.array)),this.array[t*this.itemSize+2]=n,this}getW(t){let n=this.array[t*this.itemSize+3];return this.normalized&&(n=Yr(n,this.array)),n}setW(t,n){return this.normalized&&(n=pn(n,this.array)),this.array[t*this.itemSize+3]=n,this}setXY(t,n,i){return t*=this.itemSize,this.normalized&&(n=pn(n,this.array),i=pn(i,this.array)),this.array[t+0]=n,this.array[t+1]=i,this}setXYZ(t,n,i,a){return t*=this.itemSize,this.normalized&&(n=pn(n,this.array),i=pn(i,this.array),a=pn(a,this.array)),this.array[t+0]=n,this.array[t+1]=i,this.array[t+2]=a,this}setXYZW(t,n,i,a,s){return t*=this.itemSize,this.normalized&&(n=pn(n,this.array),i=pn(i,this.array),a=pn(a,this.array),s=pn(s,this.array)),this.array[t+0]=n,this.array[t+1]=i,this.array[t+2]=a,this.array[t+3]=s,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==Vg&&(t.usage=this.usage),t}}class hy extends cn{constructor(t,n,i){super(new Uint16Array(t),n,i)}}class dy extends cn{constructor(t,n,i){super(new Uint32Array(t),n,i)}}class Mn extends cn{constructor(t,n,i){super(new Float32Array(t),n,i)}}let Wb=0;const jn=new ve,Bf=new an,Os=new I,Cn=new tl,$r=new tl,Ve=new I;class nn extends vs{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Wb++}),this.uuid=$o(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(ly(t)?dy:hy)(t,1):this.index=t,this}getAttribute(t){return this.attributes[t]}setAttribute(t,n){return this.attributes[t]=n,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,n,i=0){this.groups.push({start:t,count:n,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(t,n){this.drawRange.start=t,this.drawRange.count=n}applyMatrix4(t){const n=this.attributes.position;n!==void 0&&(n.applyMatrix4(t),n.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const s=new Wt().getNormalMatrix(t);i.applyNormalMatrix(s),i.needsUpdate=!0}const a=this.attributes.tangent;return a!==void 0&&(a.transformDirection(t),a.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return jn.makeRotationFromQuaternion(t),this.applyMatrix4(jn),this}rotateX(t){return jn.makeRotationX(t),this.applyMatrix4(jn),this}rotateY(t){return jn.makeRotationY(t),this.applyMatrix4(jn),this}rotateZ(t){return jn.makeRotationZ(t),this.applyMatrix4(jn),this}translate(t,n,i){return jn.makeTranslation(t,n,i),this.applyMatrix4(jn),this}scale(t,n,i){return jn.makeScale(t,n,i),this.applyMatrix4(jn),this}lookAt(t){return Bf.lookAt(t),Bf.updateMatrix(),this.applyMatrix4(Bf.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Os).negate(),this.translate(Os.x,Os.y,Os.z),this}setFromPoints(t){const n=[];for(let i=0,a=t.length;i<a;i++){const s=t[i];n.push(s.x,s.y,s.z||0)}return this.setAttribute("position",new Mn(n,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new tl);const t=this.attributes.position,n=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new I(-1/0,-1/0,-1/0),new I(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),n)for(let i=0,a=n.length;i<a;i++){const s=n[i];Cn.setFromBufferAttribute(s),this.morphTargetsRelative?(Ve.addVectors(this.boundingBox.min,Cn.min),this.boundingBox.expandByPoint(Ve),Ve.addVectors(this.boundingBox.max,Cn.max),this.boundingBox.expandByPoint(Ve)):(this.boundingBox.expandByPoint(Cn.min),this.boundingBox.expandByPoint(Cn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new el);const t=this.attributes.position,n=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new I,1/0);return}if(t){const i=this.boundingSphere.center;if(Cn.setFromBufferAttribute(t),n)for(let s=0,r=n.length;s<r;s++){const o=n[s];$r.setFromBufferAttribute(o),this.morphTargetsRelative?(Ve.addVectors(Cn.min,$r.min),Cn.expandByPoint(Ve),Ve.addVectors(Cn.max,$r.max),Cn.expandByPoint(Ve)):(Cn.expandByPoint($r.min),Cn.expandByPoint($r.max))}Cn.getCenter(i);let a=0;for(let s=0,r=t.count;s<r;s++)Ve.fromBufferAttribute(t,s),a=Math.max(a,i.distanceToSquared(Ve));if(n)for(let s=0,r=n.length;s<r;s++){const o=n[s],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)Ve.fromBufferAttribute(o,c),l&&(Os.fromBufferAttribute(t,c),Ve.add(Os)),a=Math.max(a,i.distanceToSquared(Ve))}this.boundingSphere.radius=Math.sqrt(a),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,n=this.attributes;if(t===null||n.position===void 0||n.normal===void 0||n.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=n.position,a=n.normal,s=n.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new cn(new Float32Array(4*i.count),4));const r=this.getAttribute("tangent"),o=[],l=[];for(let U=0;U<i.count;U++)o[U]=new I,l[U]=new I;const c=new I,h=new I,d=new I,f=new Vt,p=new Vt,v=new Vt,S=new I,m=new I;function u(U,X,x){c.fromBufferAttribute(i,U),h.fromBufferAttribute(i,X),d.fromBufferAttribute(i,x),f.fromBufferAttribute(s,U),p.fromBufferAttribute(s,X),v.fromBufferAttribute(s,x),h.sub(c),d.sub(c),p.sub(f),v.sub(f);const E=1/(p.x*v.y-v.x*p.y);isFinite(E)&&(S.copy(h).multiplyScalar(v.y).addScaledVector(d,-p.y).multiplyScalar(E),m.copy(d).multiplyScalar(p.x).addScaledVector(h,-v.x).multiplyScalar(E),o[U].add(S),o[X].add(S),o[x].add(S),l[U].add(m),l[X].add(m),l[x].add(m))}let g=this.groups;g.length===0&&(g=[{start:0,count:t.count}]);for(let U=0,X=g.length;U<X;++U){const x=g[U],E=x.start,q=x.count;for(let W=E,J=E+q;W<J;W+=3)u(t.getX(W+0),t.getX(W+1),t.getX(W+2))}const _=new I,y=new I,L=new I,T=new I;function R(U){L.fromBufferAttribute(a,U),T.copy(L);const X=o[U];_.copy(X),_.sub(L.multiplyScalar(L.dot(X))).normalize(),y.crossVectors(T,X);const E=y.dot(l[U])<0?-1:1;r.setXYZW(U,_.x,_.y,_.z,E)}for(let U=0,X=g.length;U<X;++U){const x=g[U],E=x.start,q=x.count;for(let W=E,J=E+q;W<J;W+=3)R(t.getX(W+0)),R(t.getX(W+1)),R(t.getX(W+2))}}computeVertexNormals(){const t=this.index,n=this.getAttribute("position");if(n!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new cn(new Float32Array(n.count*3),3),this.setAttribute("normal",i);else for(let f=0,p=i.count;f<p;f++)i.setXYZ(f,0,0,0);const a=new I,s=new I,r=new I,o=new I,l=new I,c=new I,h=new I,d=new I;if(t)for(let f=0,p=t.count;f<p;f+=3){const v=t.getX(f+0),S=t.getX(f+1),m=t.getX(f+2);a.fromBufferAttribute(n,v),s.fromBufferAttribute(n,S),r.fromBufferAttribute(n,m),h.subVectors(r,s),d.subVectors(a,s),h.cross(d),o.fromBufferAttribute(i,v),l.fromBufferAttribute(i,S),c.fromBufferAttribute(i,m),o.add(h),l.add(h),c.add(h),i.setXYZ(v,o.x,o.y,o.z),i.setXYZ(S,l.x,l.y,l.z),i.setXYZ(m,c.x,c.y,c.z)}else for(let f=0,p=n.count;f<p;f+=3)a.fromBufferAttribute(n,f+0),s.fromBufferAttribute(n,f+1),r.fromBufferAttribute(n,f+2),h.subVectors(r,s),d.subVectors(a,s),h.cross(d),i.setXYZ(f+0,h.x,h.y,h.z),i.setXYZ(f+1,h.x,h.y,h.z),i.setXYZ(f+2,h.x,h.y,h.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let n=0,i=t.count;n<i;n++)Ve.fromBufferAttribute(t,n),Ve.normalize(),t.setXYZ(n,Ve.x,Ve.y,Ve.z)}toNonIndexed(){function t(o,l){const c=o.array,h=o.itemSize,d=o.normalized,f=new c.constructor(l.length*h);let p=0,v=0;for(let S=0,m=l.length;S<m;S++){o.isInterleavedBufferAttribute?p=l[S]*o.data.stride+o.offset:p=l[S]*h;for(let u=0;u<h;u++)f[v++]=c[p++]}return new cn(f,h,d)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const n=new nn,i=this.index.array,a=this.attributes;for(const o in a){const l=a[o],c=t(l,i);n.setAttribute(o,c)}const s=this.morphAttributes;for(const o in s){const l=[],c=s[o];for(let h=0,d=c.length;h<d;h++){const f=c[h],p=t(f,i);l.push(p)}n.morphAttributes[o]=l}n.morphTargetsRelative=this.morphTargetsRelative;const r=this.groups;for(let o=0,l=r.length;o<l;o++){const c=r[o];n.addGroup(c.start,c.count,c.materialIndex)}return n}toJSON(){const t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};const n=this.index;n!==null&&(t.data.index={type:n.array.constructor.name,array:Array.prototype.slice.call(n.array)});const i=this.attributes;for(const l in i){const c=i[l];t.data.attributes[l]=c.toJSON(t.data)}const a={};let s=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],h=[];for(let d=0,f=c.length;d<f;d++){const p=c[d];h.push(p.toJSON(t.data))}h.length>0&&(a[l]=h,s=!0)}s&&(t.data.morphAttributes=a,t.data.morphTargetsRelative=this.morphTargetsRelative);const r=this.groups;r.length>0&&(t.data.groups=JSON.parse(JSON.stringify(r)));const o=this.boundingSphere;return o!==null&&(t.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const n={};this.name=t.name;const i=t.index;i!==null&&this.setIndex(i.clone(n));const a=t.attributes;for(const c in a){const h=a[c];this.setAttribute(c,h.clone(n))}const s=t.morphAttributes;for(const c in s){const h=[],d=s[c];for(let f=0,p=d.length;f<p;f++)h.push(d[f].clone(n));this.morphAttributes[c]=h}this.morphTargetsRelative=t.morphTargetsRelative;const r=t.groups;for(let c=0,h=r.length;c<h;c++){const d=r[c];this.addGroup(d.start,d.count,d.materialIndex)}const o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const n0=new ve,Ha=new nl,Il=new el,i0=new I,Bl=new I,Fl=new I,Hl=new I,Ff=new I,Gl=new I,a0=new I,Vl=new I;class vn extends an{constructor(t=new nn,n=new tr){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=n,this.updateMorphTargets()}copy(t,n){return super.copy(t,n),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const n=this.geometry.morphAttributes,i=Object.keys(n);if(i.length>0){const a=n[i[0]];if(a!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,r=a.length;s<r;s++){const o=a[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}getVertexPosition(t,n){const i=this.geometry,a=i.attributes.position,s=i.morphAttributes.position,r=i.morphTargetsRelative;n.fromBufferAttribute(a,t);const o=this.morphTargetInfluences;if(s&&o){Gl.set(0,0,0);for(let l=0,c=s.length;l<c;l++){const h=o[l],d=s[l];h!==0&&(Ff.fromBufferAttribute(d,t),r?Gl.addScaledVector(Ff,h):Gl.addScaledVector(Ff.sub(n),h))}n.add(Gl)}return n}raycast(t,n){const i=this.geometry,a=this.material,s=this.matrixWorld;a!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Il.copy(i.boundingSphere),Il.applyMatrix4(s),Ha.copy(t.ray).recast(t.near),!(Il.containsPoint(Ha.origin)===!1&&(Ha.intersectSphere(Il,i0)===null||Ha.origin.distanceToSquared(i0)>(t.far-t.near)**2))&&(n0.copy(s).invert(),Ha.copy(t.ray).applyMatrix4(n0),!(i.boundingBox!==null&&Ha.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(t,n,Ha)))}_computeIntersections(t,n,i){let a;const s=this.geometry,r=this.material,o=s.index,l=s.attributes.position,c=s.attributes.uv,h=s.attributes.uv1,d=s.attributes.normal,f=s.groups,p=s.drawRange;if(o!==null)if(Array.isArray(r))for(let v=0,S=f.length;v<S;v++){const m=f[v],u=r[m.materialIndex],g=Math.max(m.start,p.start),_=Math.min(o.count,Math.min(m.start+m.count,p.start+p.count));for(let y=g,L=_;y<L;y+=3){const T=o.getX(y),R=o.getX(y+1),U=o.getX(y+2);a=kl(this,u,t,i,c,h,d,T,R,U),a&&(a.faceIndex=Math.floor(y/3),a.face.materialIndex=m.materialIndex,n.push(a))}}else{const v=Math.max(0,p.start),S=Math.min(o.count,p.start+p.count);for(let m=v,u=S;m<u;m+=3){const g=o.getX(m),_=o.getX(m+1),y=o.getX(m+2);a=kl(this,r,t,i,c,h,d,g,_,y),a&&(a.faceIndex=Math.floor(m/3),n.push(a))}}else if(l!==void 0)if(Array.isArray(r))for(let v=0,S=f.length;v<S;v++){const m=f[v],u=r[m.materialIndex],g=Math.max(m.start,p.start),_=Math.min(l.count,Math.min(m.start+m.count,p.start+p.count));for(let y=g,L=_;y<L;y+=3){const T=y,R=y+1,U=y+2;a=kl(this,u,t,i,c,h,d,T,R,U),a&&(a.faceIndex=Math.floor(y/3),a.face.materialIndex=m.materialIndex,n.push(a))}}else{const v=Math.max(0,p.start),S=Math.min(l.count,p.start+p.count);for(let m=v,u=S;m<u;m+=3){const g=m,_=m+1,y=m+2;a=kl(this,r,t,i,c,h,d,g,_,y),a&&(a.faceIndex=Math.floor(m/3),n.push(a))}}}}function qb(e,t,n,i,a,s,r,o){let l;if(t.side===yn?l=i.intersectTriangle(r,s,a,!0,o):l=i.intersectTriangle(a,s,r,t.side===Ua,o),l===null)return null;Vl.copy(o),Vl.applyMatrix4(e.matrixWorld);const c=n.ray.origin.distanceTo(Vl);return c<n.near||c>n.far?null:{distance:c,point:Vl.clone(),object:e}}function kl(e,t,n,i,a,s,r,o,l,c){e.getVertexPosition(o,Bl),e.getVertexPosition(l,Fl),e.getVertexPosition(c,Hl);const h=qb(e,t,n,i,Bl,Fl,Hl,a0);if(h){const d=new I;ci.getBarycoord(a0,Bl,Fl,Hl,d),a&&(h.uv=ci.getInterpolatedAttribute(a,o,l,c,d,new Vt)),s&&(h.uv1=ci.getInterpolatedAttribute(s,o,l,c,d,new Vt)),r&&(h.normal=ci.getInterpolatedAttribute(r,o,l,c,d,new I),h.normal.dot(i.direction)>0&&h.normal.multiplyScalar(-1));const f={a:o,b:l,c,normal:new I,materialIndex:0};ci.getNormal(Bl,Fl,Hl,f.normal),h.face=f,h.barycoord=d}return h}class il extends nn{constructor(t=1,n=1,i=1,a=1,s=1,r=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:n,depth:i,widthSegments:a,heightSegments:s,depthSegments:r};const o=this;a=Math.floor(a),s=Math.floor(s),r=Math.floor(r);const l=[],c=[],h=[],d=[];let f=0,p=0;v("z","y","x",-1,-1,i,n,t,r,s,0),v("z","y","x",1,-1,i,n,-t,r,s,1),v("x","z","y",1,1,t,i,n,a,r,2),v("x","z","y",1,-1,t,i,-n,a,r,3),v("x","y","z",1,-1,t,n,i,a,s,4),v("x","y","z",-1,-1,t,n,-i,a,s,5),this.setIndex(l),this.setAttribute("position",new Mn(c,3)),this.setAttribute("normal",new Mn(h,3)),this.setAttribute("uv",new Mn(d,2));function v(S,m,u,g,_,y,L,T,R,U,X){const x=y/R,E=L/U,q=y/2,W=L/2,J=T/2,et=R+1,N=U+1;let G=0,O=0;const nt=new I;for(let Z=0;Z<N;Z++){const it=Z*E-W;for(let yt=0;yt<et;yt++){const Ct=yt*x-q;nt[S]=Ct*g,nt[m]=it*_,nt[u]=J,c.push(nt.x,nt.y,nt.z),nt[S]=0,nt[m]=0,nt[u]=T>0?1:-1,h.push(nt.x,nt.y,nt.z),d.push(yt/R),d.push(1-Z/U),G+=1}}for(let Z=0;Z<U;Z++)for(let it=0;it<R;it++){const yt=f+it+et*Z,Ct=f+it+et*(Z+1),k=f+(it+1)+et*(Z+1),K=f+(it+1)+et*Z;l.push(yt,Ct,K),l.push(Ct,k,K),O+=6}o.addGroup(p,O,X),p+=O,f+=G}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new il(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}function Nr(e){const t={};for(const n in e){t[n]={};for(const i in e[n]){const a=e[n][i];a&&(a.isColor||a.isMatrix3||a.isMatrix4||a.isVector2||a.isVector3||a.isVector4||a.isTexture||a.isQuaternion)?a.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[n][i]=null):t[n][i]=a.clone():Array.isArray(a)?t[n][i]=a.slice():t[n][i]=a}}return t}function rn(e){const t={};for(let n=0;n<e.length;n++){const i=Nr(e[n]);for(const a in i)t[a]=i[a]}return t}function Yb(e){const t=[];for(let n=0;n<e.length;n++)t.push(e[n].clone());return t}function py(e){const t=e.getRenderTarget();return t===null?e.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:oe.workingColorSpace}const Zb={clone:Nr,merge:rn};var Kb=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Qb=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class La extends xs{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Kb,this.fragmentShader=Qb,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Nr(t.uniforms),this.uniformsGroups=Yb(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){const n=super.toJSON(t);n.glslVersion=this.glslVersion,n.uniforms={};for(const a in this.uniforms){const r=this.uniforms[a].value;r&&r.isTexture?n.uniforms[a]={type:"t",value:r.toJSON(t).uuid}:r&&r.isColor?n.uniforms[a]={type:"c",value:r.getHex()}:r&&r.isVector2?n.uniforms[a]={type:"v2",value:r.toArray()}:r&&r.isVector3?n.uniforms[a]={type:"v3",value:r.toArray()}:r&&r.isVector4?n.uniforms[a]={type:"v4",value:r.toArray()}:r&&r.isMatrix3?n.uniforms[a]={type:"m3",value:r.toArray()}:r&&r.isMatrix4?n.uniforms[a]={type:"m4",value:r.toArray()}:n.uniforms[a]={value:r}}Object.keys(this.defines).length>0&&(n.defines=this.defines),n.vertexShader=this.vertexShader,n.fragmentShader=this.fragmentShader,n.lights=this.lights,n.clipping=this.clipping;const i={};for(const a in this.extensions)this.extensions[a]===!0&&(i[a]=!0);return Object.keys(i).length>0&&(n.extensions=i),n}}class my extends an{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ve,this.projectionMatrix=new ve,this.projectionMatrixInverse=new ve,this.coordinateSystem=Fi}copy(t,n){return super.copy(t,n),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,n){super.updateWorldMatrix(t,n),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const ia=new I,s0=new Vt,r0=new Vt;class Un extends my{constructor(t=50,n=1,i=.1,a=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=i,this.far=a,this.focus=10,this.aspect=n,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,n){return super.copy(t,n),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const n=.5*this.getFilmHeight()/t;this.fov=Pd*2*Math.atan(n),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(yc*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Pd*2*Math.atan(Math.tan(yc*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,n,i){ia.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(ia.x,ia.y).multiplyScalar(-t/ia.z),ia.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(ia.x,ia.y).multiplyScalar(-t/ia.z)}getViewSize(t,n){return this.getViewBounds(t,s0,r0),n.subVectors(r0,s0)}setViewOffset(t,n,i,a,s,r){this.aspect=t/n,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=n,this.view.offsetX=i,this.view.offsetY=a,this.view.width=s,this.view.height=r,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let n=t*Math.tan(yc*.5*this.fov)/this.zoom,i=2*n,a=this.aspect*i,s=-.5*a;const r=this.view;if(this.view!==null&&this.view.enabled){const l=r.fullWidth,c=r.fullHeight;s+=r.offsetX*a/l,n-=r.offsetY*i/c,a*=r.width/l,i*=r.height/c}const o=this.filmOffset;o!==0&&(s+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+a,n,n-i,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const n=super.toJSON(t);return n.object.fov=this.fov,n.object.zoom=this.zoom,n.object.near=this.near,n.object.far=this.far,n.object.focus=this.focus,n.object.aspect=this.aspect,this.view!==null&&(n.object.view=Object.assign({},this.view)),n.object.filmGauge=this.filmGauge,n.object.filmOffset=this.filmOffset,n}}const Ps=-90,zs=1;class Jb extends an{constructor(t,n,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const a=new Un(Ps,zs,t,n);a.layers=this.layers,this.add(a);const s=new Un(Ps,zs,t,n);s.layers=this.layers,this.add(s);const r=new Un(Ps,zs,t,n);r.layers=this.layers,this.add(r);const o=new Un(Ps,zs,t,n);o.layers=this.layers,this.add(o);const l=new Un(Ps,zs,t,n);l.layers=this.layers,this.add(l);const c=new Un(Ps,zs,t,n);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const t=this.coordinateSystem,n=this.children.concat(),[i,a,s,r,o,l]=n;for(const c of n)this.remove(c);if(t===Fi)i.up.set(0,1,0),i.lookAt(1,0,0),a.up.set(0,1,0),a.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),r.up.set(0,0,1),r.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===nu)i.up.set(0,-1,0),i.lookAt(-1,0,0),a.up.set(0,-1,0),a.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),r.up.set(0,0,-1),r.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const c of n)this.add(c),c.updateMatrixWorld()}update(t,n){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:a}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[s,r,o,l,c,h]=this.children,d=t.getRenderTarget(),f=t.getActiveCubeFace(),p=t.getActiveMipmapLevel(),v=t.xr.enabled;t.xr.enabled=!1;const S=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,t.setRenderTarget(i,0,a),t.render(n,s),t.setRenderTarget(i,1,a),t.render(n,r),t.setRenderTarget(i,2,a),t.render(n,o),t.setRenderTarget(i,3,a),t.render(n,l),t.setRenderTarget(i,4,a),t.render(n,c),i.texture.generateMipmaps=S,t.setRenderTarget(i,5,a),t.render(n,h),t.setRenderTarget(d,f,p),t.xr.enabled=v,i.texture.needsPMREMUpdate=!0}}class gy extends Sn{constructor(t,n,i,a,s,r,o,l,c,h){t=t!==void 0?t:[],n=n!==void 0?n:Rr,super(t,n,i,a,s,r,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class $b extends fs{constructor(t=1,n={}){super(t,t,n),this.isWebGLCubeRenderTarget=!0;const i={width:t,height:t,depth:1},a=[i,i,i,i,i,i];this.texture=new gy(a,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=n.generateMipmaps!==void 0?n.generateMipmaps:!1,this.texture.minFilter=n.minFilter!==void 0?n.minFilter:li}fromEquirectangularTexture(t,n){this.texture.type=n.type,this.texture.colorSpace=n.colorSpace,this.texture.generateMipmaps=n.generateMipmaps,this.texture.minFilter=n.minFilter,this.texture.magFilter=n.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},a=new il(5,5,5),s=new La({name:"CubemapFromEquirect",uniforms:Nr(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:yn,blending:Aa});s.uniforms.tEquirect.value=n;const r=new vn(a,s),o=n.minFilter;return n.minFilter===Ja&&(n.minFilter=li),new Jb(1,10,this).update(t,r),n.minFilter=o,r.geometry.dispose(),r.material.dispose(),this}clear(t,n,i,a){const s=t.getRenderTarget();for(let r=0;r<6;r++)t.setRenderTarget(this,r),t.clear(n,i,a);t.setRenderTarget(s)}}const Hf=new I,t1=new I,e1=new Wt;class ra{constructor(t=new I(1,0,0),n=0){this.isPlane=!0,this.normal=t,this.constant=n}set(t,n){return this.normal.copy(t),this.constant=n,this}setComponents(t,n,i,a){return this.normal.set(t,n,i),this.constant=a,this}setFromNormalAndCoplanarPoint(t,n){return this.normal.copy(t),this.constant=-n.dot(this.normal),this}setFromCoplanarPoints(t,n,i){const a=Hf.subVectors(i,n).cross(t1.subVectors(t,n)).normalize();return this.setFromNormalAndCoplanarPoint(a,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,n){return n.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,n){const i=t.delta(Hf),a=this.normal.dot(i);if(a===0)return this.distanceToPoint(t.start)===0?n.copy(t.start):null;const s=-(t.start.dot(this.normal)+this.constant)/a;return s<0||s>1?null:n.copy(t.start).addScaledVector(i,s)}intersectsLine(t){const n=this.distanceToPoint(t.start),i=this.distanceToPoint(t.end);return n<0&&i>0||i<0&&n>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,n){const i=n||e1.getNormalMatrix(t),a=this.coplanarPoint(Hf).applyMatrix4(t),s=this.normal.applyMatrix3(i).normalize();return this.constant=-a.dot(s),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const Ga=new el,jl=new I;class Qp{constructor(t=new ra,n=new ra,i=new ra,a=new ra,s=new ra,r=new ra){this.planes=[t,n,i,a,s,r]}set(t,n,i,a,s,r){const o=this.planes;return o[0].copy(t),o[1].copy(n),o[2].copy(i),o[3].copy(a),o[4].copy(s),o[5].copy(r),this}copy(t){const n=this.planes;for(let i=0;i<6;i++)n[i].copy(t.planes[i]);return this}setFromProjectionMatrix(t,n=Fi){const i=this.planes,a=t.elements,s=a[0],r=a[1],o=a[2],l=a[3],c=a[4],h=a[5],d=a[6],f=a[7],p=a[8],v=a[9],S=a[10],m=a[11],u=a[12],g=a[13],_=a[14],y=a[15];if(i[0].setComponents(l-s,f-c,m-p,y-u).normalize(),i[1].setComponents(l+s,f+c,m+p,y+u).normalize(),i[2].setComponents(l+r,f+h,m+v,y+g).normalize(),i[3].setComponents(l-r,f-h,m-v,y-g).normalize(),i[4].setComponents(l-o,f-d,m-S,y-_).normalize(),n===Fi)i[5].setComponents(l+o,f+d,m+S,y+_).normalize();else if(n===nu)i[5].setComponents(o,d,S,_).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+n);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Ga.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const n=t.geometry;n.boundingSphere===null&&n.computeBoundingSphere(),Ga.copy(n.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Ga)}intersectsSprite(t){return Ga.center.set(0,0,0),Ga.radius=.7071067811865476,Ga.applyMatrix4(t.matrixWorld),this.intersectsSphere(Ga)}intersectsSphere(t){const n=this.planes,i=t.center,a=-t.radius;for(let s=0;s<6;s++)if(n[s].distanceToPoint(i)<a)return!1;return!0}intersectsBox(t){const n=this.planes;for(let i=0;i<6;i++){const a=n[i];if(jl.x=a.normal.x>0?t.max.x:t.min.x,jl.y=a.normal.y>0?t.max.y:t.min.y,jl.z=a.normal.z>0?t.max.z:t.min.z,a.distanceToPoint(jl)<0)return!1}return!0}containsPoint(t){const n=this.planes;for(let i=0;i<6;i++)if(n[i].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function _y(){let e=null,t=!1,n=null,i=null;function a(s,r){n(s,r),i=e.requestAnimationFrame(a)}return{start:function(){t!==!0&&n!==null&&(i=e.requestAnimationFrame(a),t=!0)},stop:function(){e.cancelAnimationFrame(i),t=!1},setAnimationLoop:function(s){n=s},setContext:function(s){e=s}}}function n1(e){const t=new WeakMap;function n(o,l){const c=o.array,h=o.usage,d=c.byteLength,f=e.createBuffer();e.bindBuffer(l,f),e.bufferData(l,c,h),o.onUploadCallback();let p;if(c instanceof Float32Array)p=e.FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?p=e.HALF_FLOAT:p=e.UNSIGNED_SHORT;else if(c instanceof Int16Array)p=e.SHORT;else if(c instanceof Uint32Array)p=e.UNSIGNED_INT;else if(c instanceof Int32Array)p=e.INT;else if(c instanceof Int8Array)p=e.BYTE;else if(c instanceof Uint8Array)p=e.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)p=e.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:f,type:p,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:d}}function i(o,l,c){const h=l.array,d=l.updateRanges;if(e.bindBuffer(c,o),d.length===0)e.bufferSubData(c,0,h);else{d.sort((p,v)=>p.start-v.start);let f=0;for(let p=1;p<d.length;p++){const v=d[f],S=d[p];S.start<=v.start+v.count+1?v.count=Math.max(v.count,S.start+S.count-v.start):(++f,d[f]=S)}d.length=f+1;for(let p=0,v=d.length;p<v;p++){const S=d[p];e.bufferSubData(c,S.start*h.BYTES_PER_ELEMENT,h,S.start,S.count)}l.clearUpdateRanges()}l.onUploadCallback()}function a(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function s(o){o.isInterleavedBufferAttribute&&(o=o.data);const l=t.get(o);l&&(e.deleteBuffer(l.buffer),t.delete(o))}function r(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const h=t.get(o);(!h||h.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const c=t.get(o);if(c===void 0)t.set(o,n(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,o,l),c.version=o.version}}return{get:a,remove:s,update:r}}class wu extends nn{constructor(t=1,n=1,i=1,a=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:n,widthSegments:i,heightSegments:a};const s=t/2,r=n/2,o=Math.floor(i),l=Math.floor(a),c=o+1,h=l+1,d=t/o,f=n/l,p=[],v=[],S=[],m=[];for(let u=0;u<h;u++){const g=u*f-r;for(let _=0;_<c;_++){const y=_*d-s;v.push(y,-g,0),S.push(0,0,1),m.push(_/o),m.push(1-u/l)}}for(let u=0;u<l;u++)for(let g=0;g<o;g++){const _=g+c*u,y=g+c*(u+1),L=g+1+c*(u+1),T=g+1+c*u;p.push(_,y,T),p.push(y,L,T)}this.setIndex(p),this.setAttribute("position",new Mn(v,3)),this.setAttribute("normal",new Mn(S,3)),this.setAttribute("uv",new Mn(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new wu(t.width,t.height,t.widthSegments,t.heightSegments)}}var i1=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,a1=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,s1=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,r1=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,o1=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,l1=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,c1=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,u1=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,f1=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,h1=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,d1=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,p1=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,m1=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,g1=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,_1=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,v1=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,x1=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,y1=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,S1=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,M1=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,E1=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,b1=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,T1=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,A1=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,R1=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,w1=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,C1=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,D1=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,N1=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,U1=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,L1="gl_FragColor = linearToOutputTexel( gl_FragColor );",O1=`
const mat3 LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = mat3(
	vec3( 0.8224621, 0.177538, 0.0 ),
	vec3( 0.0331941, 0.9668058, 0.0 ),
	vec3( 0.0170827, 0.0723974, 0.9105199 )
);
const mat3 LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = mat3(
	vec3( 1.2249401, - 0.2249404, 0.0 ),
	vec3( - 0.0420569, 1.0420571, 0.0 ),
	vec3( - 0.0196376, - 0.0786361, 1.0982735 )
);
vec4 LinearSRGBToLinearDisplayP3( in vec4 value ) {
	return vec4( value.rgb * LINEAR_SRGB_TO_LINEAR_DISPLAY_P3, value.a );
}
vec4 LinearDisplayP3ToLinearSRGB( in vec4 value ) {
	return vec4( value.rgb * LINEAR_DISPLAY_P3_TO_LINEAR_SRGB, value.a );
}
vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,P1=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,z1=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,I1=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,B1=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,F1=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,H1=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,G1=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,V1=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,k1=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,j1=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,X1=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,W1=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,q1=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Y1=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Z1=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,K1=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Q1=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,J1=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,$1=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,tT=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,eT=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,nT=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,iT=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,aT=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,sT=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,rT=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,oT=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,lT=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,cT=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,uT=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,fT=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,hT=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,dT=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,pT=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,mT=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,gT=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,_T=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,vT=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,xT=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,yT=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,ST=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,MT=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,ET=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,bT=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,TT=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,AT=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,RT=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,wT=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,CT=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,DT=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,NT=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,UT=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,LT=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,OT=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,PT=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,zT=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,IT=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,BT=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,FT=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,HT=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,GT=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,VT=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,kT=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,jT=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,XT=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,WT=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,qT=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,YT=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,ZT=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,KT=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,QT=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,JT=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,$T=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,tA=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,eA=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const nA=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,iA=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,aA=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,sA=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,rA=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,oA=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,lA=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,cA=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,uA=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,fA=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,hA=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,dA=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,pA=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,mA=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,gA=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,_A=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,vA=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,xA=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,yA=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,SA=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,MA=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,EA=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,bA=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,TA=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,AA=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,RA=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,wA=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,CA=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,DA=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,NA=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,UA=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,LA=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,OA=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,PA=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Xt={alphahash_fragment:i1,alphahash_pars_fragment:a1,alphamap_fragment:s1,alphamap_pars_fragment:r1,alphatest_fragment:o1,alphatest_pars_fragment:l1,aomap_fragment:c1,aomap_pars_fragment:u1,batching_pars_vertex:f1,batching_vertex:h1,begin_vertex:d1,beginnormal_vertex:p1,bsdfs:m1,iridescence_fragment:g1,bumpmap_pars_fragment:_1,clipping_planes_fragment:v1,clipping_planes_pars_fragment:x1,clipping_planes_pars_vertex:y1,clipping_planes_vertex:S1,color_fragment:M1,color_pars_fragment:E1,color_pars_vertex:b1,color_vertex:T1,common:A1,cube_uv_reflection_fragment:R1,defaultnormal_vertex:w1,displacementmap_pars_vertex:C1,displacementmap_vertex:D1,emissivemap_fragment:N1,emissivemap_pars_fragment:U1,colorspace_fragment:L1,colorspace_pars_fragment:O1,envmap_fragment:P1,envmap_common_pars_fragment:z1,envmap_pars_fragment:I1,envmap_pars_vertex:B1,envmap_physical_pars_fragment:Z1,envmap_vertex:F1,fog_vertex:H1,fog_pars_vertex:G1,fog_fragment:V1,fog_pars_fragment:k1,gradientmap_pars_fragment:j1,lightmap_pars_fragment:X1,lights_lambert_fragment:W1,lights_lambert_pars_fragment:q1,lights_pars_begin:Y1,lights_toon_fragment:K1,lights_toon_pars_fragment:Q1,lights_phong_fragment:J1,lights_phong_pars_fragment:$1,lights_physical_fragment:tT,lights_physical_pars_fragment:eT,lights_fragment_begin:nT,lights_fragment_maps:iT,lights_fragment_end:aT,logdepthbuf_fragment:sT,logdepthbuf_pars_fragment:rT,logdepthbuf_pars_vertex:oT,logdepthbuf_vertex:lT,map_fragment:cT,map_pars_fragment:uT,map_particle_fragment:fT,map_particle_pars_fragment:hT,metalnessmap_fragment:dT,metalnessmap_pars_fragment:pT,morphinstance_vertex:mT,morphcolor_vertex:gT,morphnormal_vertex:_T,morphtarget_pars_vertex:vT,morphtarget_vertex:xT,normal_fragment_begin:yT,normal_fragment_maps:ST,normal_pars_fragment:MT,normal_pars_vertex:ET,normal_vertex:bT,normalmap_pars_fragment:TT,clearcoat_normal_fragment_begin:AT,clearcoat_normal_fragment_maps:RT,clearcoat_pars_fragment:wT,iridescence_pars_fragment:CT,opaque_fragment:DT,packing:NT,premultiplied_alpha_fragment:UT,project_vertex:LT,dithering_fragment:OT,dithering_pars_fragment:PT,roughnessmap_fragment:zT,roughnessmap_pars_fragment:IT,shadowmap_pars_fragment:BT,shadowmap_pars_vertex:FT,shadowmap_vertex:HT,shadowmask_pars_fragment:GT,skinbase_vertex:VT,skinning_pars_vertex:kT,skinning_vertex:jT,skinnormal_vertex:XT,specularmap_fragment:WT,specularmap_pars_fragment:qT,tonemapping_fragment:YT,tonemapping_pars_fragment:ZT,transmission_fragment:KT,transmission_pars_fragment:QT,uv_pars_fragment:JT,uv_pars_vertex:$T,uv_vertex:tA,worldpos_vertex:eA,background_vert:nA,background_frag:iA,backgroundCube_vert:aA,backgroundCube_frag:sA,cube_vert:rA,cube_frag:oA,depth_vert:lA,depth_frag:cA,distanceRGBA_vert:uA,distanceRGBA_frag:fA,equirect_vert:hA,equirect_frag:dA,linedashed_vert:pA,linedashed_frag:mA,meshbasic_vert:gA,meshbasic_frag:_A,meshlambert_vert:vA,meshlambert_frag:xA,meshmatcap_vert:yA,meshmatcap_frag:SA,meshnormal_vert:MA,meshnormal_frag:EA,meshphong_vert:bA,meshphong_frag:TA,meshphysical_vert:AA,meshphysical_frag:RA,meshtoon_vert:wA,meshtoon_frag:CA,points_vert:DA,points_frag:NA,shadow_vert:UA,shadow_frag:LA,sprite_vert:OA,sprite_frag:PA},ut={common:{diffuse:{value:new ee(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Wt},alphaMap:{value:null},alphaMapTransform:{value:new Wt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Wt}},envmap:{envMap:{value:null},envMapRotation:{value:new Wt},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Wt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Wt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Wt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Wt},normalScale:{value:new Vt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Wt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Wt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Wt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Wt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new ee(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new ee(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Wt},alphaTest:{value:0},uvTransform:{value:new Wt}},sprite:{diffuse:{value:new ee(16777215)},opacity:{value:1},center:{value:new Vt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Wt},alphaMap:{value:null},alphaMapTransform:{value:new Wt},alphaTest:{value:0}}},di={basic:{uniforms:rn([ut.common,ut.specularmap,ut.envmap,ut.aomap,ut.lightmap,ut.fog]),vertexShader:Xt.meshbasic_vert,fragmentShader:Xt.meshbasic_frag},lambert:{uniforms:rn([ut.common,ut.specularmap,ut.envmap,ut.aomap,ut.lightmap,ut.emissivemap,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.fog,ut.lights,{emissive:{value:new ee(0)}}]),vertexShader:Xt.meshlambert_vert,fragmentShader:Xt.meshlambert_frag},phong:{uniforms:rn([ut.common,ut.specularmap,ut.envmap,ut.aomap,ut.lightmap,ut.emissivemap,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.fog,ut.lights,{emissive:{value:new ee(0)},specular:{value:new ee(1118481)},shininess:{value:30}}]),vertexShader:Xt.meshphong_vert,fragmentShader:Xt.meshphong_frag},standard:{uniforms:rn([ut.common,ut.envmap,ut.aomap,ut.lightmap,ut.emissivemap,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.roughnessmap,ut.metalnessmap,ut.fog,ut.lights,{emissive:{value:new ee(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Xt.meshphysical_vert,fragmentShader:Xt.meshphysical_frag},toon:{uniforms:rn([ut.common,ut.aomap,ut.lightmap,ut.emissivemap,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.gradientmap,ut.fog,ut.lights,{emissive:{value:new ee(0)}}]),vertexShader:Xt.meshtoon_vert,fragmentShader:Xt.meshtoon_frag},matcap:{uniforms:rn([ut.common,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.fog,{matcap:{value:null}}]),vertexShader:Xt.meshmatcap_vert,fragmentShader:Xt.meshmatcap_frag},points:{uniforms:rn([ut.points,ut.fog]),vertexShader:Xt.points_vert,fragmentShader:Xt.points_frag},dashed:{uniforms:rn([ut.common,ut.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Xt.linedashed_vert,fragmentShader:Xt.linedashed_frag},depth:{uniforms:rn([ut.common,ut.displacementmap]),vertexShader:Xt.depth_vert,fragmentShader:Xt.depth_frag},normal:{uniforms:rn([ut.common,ut.bumpmap,ut.normalmap,ut.displacementmap,{opacity:{value:1}}]),vertexShader:Xt.meshnormal_vert,fragmentShader:Xt.meshnormal_frag},sprite:{uniforms:rn([ut.sprite,ut.fog]),vertexShader:Xt.sprite_vert,fragmentShader:Xt.sprite_frag},background:{uniforms:{uvTransform:{value:new Wt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Xt.background_vert,fragmentShader:Xt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Wt}},vertexShader:Xt.backgroundCube_vert,fragmentShader:Xt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Xt.cube_vert,fragmentShader:Xt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Xt.equirect_vert,fragmentShader:Xt.equirect_frag},distanceRGBA:{uniforms:rn([ut.common,ut.displacementmap,{referencePosition:{value:new I},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Xt.distanceRGBA_vert,fragmentShader:Xt.distanceRGBA_frag},shadow:{uniforms:rn([ut.lights,ut.fog,{color:{value:new ee(0)},opacity:{value:1}}]),vertexShader:Xt.shadow_vert,fragmentShader:Xt.shadow_frag}};di.physical={uniforms:rn([di.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Wt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Wt},clearcoatNormalScale:{value:new Vt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Wt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Wt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Wt},sheen:{value:0},sheenColor:{value:new ee(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Wt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Wt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Wt},transmissionSamplerSize:{value:new Vt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Wt},attenuationDistance:{value:0},attenuationColor:{value:new ee(0)},specularColor:{value:new ee(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Wt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Wt},anisotropyVector:{value:new Vt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Wt}}]),vertexShader:Xt.meshphysical_vert,fragmentShader:Xt.meshphysical_frag};const Xl={r:0,b:0,g:0},Va=new xi,zA=new ve;function IA(e,t,n,i,a,s,r){const o=new ee(0);let l=s===!0?0:1,c,h,d=null,f=0,p=null;function v(g){let _=g.isScene===!0?g.background:null;return _&&_.isTexture&&(_=(g.backgroundBlurriness>0?n:t).get(_)),_}function S(g){let _=!1;const y=v(g);y===null?u(o,l):y&&y.isColor&&(u(y,1),_=!0);const L=e.xr.getEnvironmentBlendMode();L==="additive"?i.buffers.color.setClear(0,0,0,1,r):L==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,r),(e.autoClear||_)&&(i.buffers.depth.setTest(!0),i.buffers.depth.setMask(!0),i.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function m(g,_){const y=v(_);y&&(y.isCubeTexture||y.mapping===Au)?(h===void 0&&(h=new vn(new il(1,1,1),new La({name:"BackgroundCubeMaterial",uniforms:Nr(di.backgroundCube.uniforms),vertexShader:di.backgroundCube.vertexShader,fragmentShader:di.backgroundCube.fragmentShader,side:yn,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(L,T,R){this.matrixWorld.copyPosition(R.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),a.update(h)),Va.copy(_.backgroundRotation),Va.x*=-1,Va.y*=-1,Va.z*=-1,y.isCubeTexture&&y.isRenderTargetTexture===!1&&(Va.y*=-1,Va.z*=-1),h.material.uniforms.envMap.value=y,h.material.uniforms.flipEnvMap.value=y.isCubeTexture&&y.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=_.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=_.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(zA.makeRotationFromEuler(Va)),h.material.toneMapped=oe.getTransfer(y.colorSpace)!==Se,(d!==y||f!==y.version||p!==e.toneMapping)&&(h.material.needsUpdate=!0,d=y,f=y.version,p=e.toneMapping),h.layers.enableAll(),g.unshift(h,h.geometry,h.material,0,0,null)):y&&y.isTexture&&(c===void 0&&(c=new vn(new wu(2,2),new La({name:"BackgroundMaterial",uniforms:Nr(di.background.uniforms),vertexShader:di.background.vertexShader,fragmentShader:di.background.fragmentShader,side:Ua,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),a.update(c)),c.material.uniforms.t2D.value=y,c.material.uniforms.backgroundIntensity.value=_.backgroundIntensity,c.material.toneMapped=oe.getTransfer(y.colorSpace)!==Se,y.matrixAutoUpdate===!0&&y.updateMatrix(),c.material.uniforms.uvTransform.value.copy(y.matrix),(d!==y||f!==y.version||p!==e.toneMapping)&&(c.material.needsUpdate=!0,d=y,f=y.version,p=e.toneMapping),c.layers.enableAll(),g.unshift(c,c.geometry,c.material,0,0,null))}function u(g,_){g.getRGB(Xl,py(e)),i.buffers.color.setClear(Xl.r,Xl.g,Xl.b,_,r)}return{getClearColor:function(){return o},setClearColor:function(g,_=1){o.set(g),l=_,u(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(g){l=g,u(o,l)},render:S,addToRenderList:m}}function BA(e,t){const n=e.getParameter(e.MAX_VERTEX_ATTRIBS),i={},a=f(null);let s=a,r=!1;function o(x,E,q,W,J){let et=!1;const N=d(W,q,E);s!==N&&(s=N,c(s.object)),et=p(x,W,q,J),et&&v(x,W,q,J),J!==null&&t.update(J,e.ELEMENT_ARRAY_BUFFER),(et||r)&&(r=!1,y(x,E,q,W),J!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(J).buffer))}function l(){return e.createVertexArray()}function c(x){return e.bindVertexArray(x)}function h(x){return e.deleteVertexArray(x)}function d(x,E,q){const W=q.wireframe===!0;let J=i[x.id];J===void 0&&(J={},i[x.id]=J);let et=J[E.id];et===void 0&&(et={},J[E.id]=et);let N=et[W];return N===void 0&&(N=f(l()),et[W]=N),N}function f(x){const E=[],q=[],W=[];for(let J=0;J<n;J++)E[J]=0,q[J]=0,W[J]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:E,enabledAttributes:q,attributeDivisors:W,object:x,attributes:{},index:null}}function p(x,E,q,W){const J=s.attributes,et=E.attributes;let N=0;const G=q.getAttributes();for(const O in G)if(G[O].location>=0){const Z=J[O];let it=et[O];if(it===void 0&&(O==="instanceMatrix"&&x.instanceMatrix&&(it=x.instanceMatrix),O==="instanceColor"&&x.instanceColor&&(it=x.instanceColor)),Z===void 0||Z.attribute!==it||it&&Z.data!==it.data)return!0;N++}return s.attributesNum!==N||s.index!==W}function v(x,E,q,W){const J={},et=E.attributes;let N=0;const G=q.getAttributes();for(const O in G)if(G[O].location>=0){let Z=et[O];Z===void 0&&(O==="instanceMatrix"&&x.instanceMatrix&&(Z=x.instanceMatrix),O==="instanceColor"&&x.instanceColor&&(Z=x.instanceColor));const it={};it.attribute=Z,Z&&Z.data&&(it.data=Z.data),J[O]=it,N++}s.attributes=J,s.attributesNum=N,s.index=W}function S(){const x=s.newAttributes;for(let E=0,q=x.length;E<q;E++)x[E]=0}function m(x){u(x,0)}function u(x,E){const q=s.newAttributes,W=s.enabledAttributes,J=s.attributeDivisors;q[x]=1,W[x]===0&&(e.enableVertexAttribArray(x),W[x]=1),J[x]!==E&&(e.vertexAttribDivisor(x,E),J[x]=E)}function g(){const x=s.newAttributes,E=s.enabledAttributes;for(let q=0,W=E.length;q<W;q++)E[q]!==x[q]&&(e.disableVertexAttribArray(q),E[q]=0)}function _(x,E,q,W,J,et,N){N===!0?e.vertexAttribIPointer(x,E,q,J,et):e.vertexAttribPointer(x,E,q,W,J,et)}function y(x,E,q,W){S();const J=W.attributes,et=q.getAttributes(),N=E.defaultAttributeValues;for(const G in et){const O=et[G];if(O.location>=0){let nt=J[G];if(nt===void 0&&(G==="instanceMatrix"&&x.instanceMatrix&&(nt=x.instanceMatrix),G==="instanceColor"&&x.instanceColor&&(nt=x.instanceColor)),nt!==void 0){const Z=nt.normalized,it=nt.itemSize,yt=t.get(nt);if(yt===void 0)continue;const Ct=yt.buffer,k=yt.type,K=yt.bytesPerElement,lt=k===e.INT||k===e.UNSIGNED_INT||nt.gpuType===kp;if(nt.isInterleavedBufferAttribute){const st=nt.data,xt=st.stride,Et=nt.offset;if(st.isInstancedInterleavedBuffer){for(let Ut=0;Ut<O.locationSize;Ut++)u(O.location+Ut,st.meshPerAttribute);x.isInstancedMesh!==!0&&W._maxInstanceCount===void 0&&(W._maxInstanceCount=st.meshPerAttribute*st.count)}else for(let Ut=0;Ut<O.locationSize;Ut++)m(O.location+Ut);e.bindBuffer(e.ARRAY_BUFFER,Ct);for(let Ut=0;Ut<O.locationSize;Ut++)_(O.location+Ut,it/O.locationSize,k,Z,xt*K,(Et+it/O.locationSize*Ut)*K,lt)}else{if(nt.isInstancedBufferAttribute){for(let st=0;st<O.locationSize;st++)u(O.location+st,nt.meshPerAttribute);x.isInstancedMesh!==!0&&W._maxInstanceCount===void 0&&(W._maxInstanceCount=nt.meshPerAttribute*nt.count)}else for(let st=0;st<O.locationSize;st++)m(O.location+st);e.bindBuffer(e.ARRAY_BUFFER,Ct);for(let st=0;st<O.locationSize;st++)_(O.location+st,it/O.locationSize,k,Z,it*K,it/O.locationSize*st*K,lt)}}else if(N!==void 0){const Z=N[G];if(Z!==void 0)switch(Z.length){case 2:e.vertexAttrib2fv(O.location,Z);break;case 3:e.vertexAttrib3fv(O.location,Z);break;case 4:e.vertexAttrib4fv(O.location,Z);break;default:e.vertexAttrib1fv(O.location,Z)}}}}g()}function L(){U();for(const x in i){const E=i[x];for(const q in E){const W=E[q];for(const J in W)h(W[J].object),delete W[J];delete E[q]}delete i[x]}}function T(x){if(i[x.id]===void 0)return;const E=i[x.id];for(const q in E){const W=E[q];for(const J in W)h(W[J].object),delete W[J];delete E[q]}delete i[x.id]}function R(x){for(const E in i){const q=i[E];if(q[x.id]===void 0)continue;const W=q[x.id];for(const J in W)h(W[J].object),delete W[J];delete q[x.id]}}function U(){X(),r=!0,s!==a&&(s=a,c(s.object))}function X(){a.geometry=null,a.program=null,a.wireframe=!1}return{setup:o,reset:U,resetDefaultState:X,dispose:L,releaseStatesOfGeometry:T,releaseStatesOfProgram:R,initAttributes:S,enableAttribute:m,disableUnusedAttributes:g}}function FA(e,t,n){let i;function a(c){i=c}function s(c,h){e.drawArrays(i,c,h),n.update(h,i,1)}function r(c,h,d){d!==0&&(e.drawArraysInstanced(i,c,h,d),n.update(h,i,d))}function o(c,h,d){if(d===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,h,0,d);let p=0;for(let v=0;v<d;v++)p+=h[v];n.update(p,i,1)}function l(c,h,d,f){if(d===0)return;const p=t.get("WEBGL_multi_draw");if(p===null)for(let v=0;v<c.length;v++)r(c[v],h[v],f[v]);else{p.multiDrawArraysInstancedWEBGL(i,c,0,h,0,f,0,d);let v=0;for(let S=0;S<d;S++)v+=h[S];for(let S=0;S<f.length;S++)n.update(v,i,f[S])}}this.setMode=a,this.render=s,this.renderInstances=r,this.renderMultiDraw=o,this.renderMultiDrawInstances=l}function HA(e,t,n,i){let a;function s(){if(a!==void 0)return a;if(t.has("EXT_texture_filter_anisotropic")===!0){const R=t.get("EXT_texture_filter_anisotropic");a=e.getParameter(R.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else a=0;return a}function r(R){return!(R!==ui&&i.convert(R)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(R){const U=R===Jo&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(R!==Yi&&i.convert(R)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE)&&R!==Bi&&!U)}function l(R){if(R==="highp"){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return"highp";R="mediump"}return R==="mediump"&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=n.precision!==void 0?n.precision:"highp";const h=l(c);h!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);const d=n.logarithmicDepthBuffer===!0,f=n.reverseDepthBuffer===!0&&t.has("EXT_clip_control");if(f===!0){const R=t.get("EXT_clip_control");R.clipControlEXT(R.LOWER_LEFT_EXT,R.ZERO_TO_ONE_EXT)}const p=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),v=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),S=e.getParameter(e.MAX_TEXTURE_SIZE),m=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),u=e.getParameter(e.MAX_VERTEX_ATTRIBS),g=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),_=e.getParameter(e.MAX_VARYING_VECTORS),y=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),L=v>0,T=e.getParameter(e.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:r,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:d,reverseDepthBuffer:f,maxTextures:p,maxVertexTextures:v,maxTextureSize:S,maxCubemapSize:m,maxAttributes:u,maxVertexUniforms:g,maxVaryings:_,maxFragmentUniforms:y,vertexTextures:L,maxSamples:T}}function GA(e){const t=this;let n=null,i=0,a=!1,s=!1;const r=new ra,o=new Wt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(d,f){const p=d.length!==0||f||i!==0||a;return a=f,i=d.length,p},this.beginShadows=function(){s=!0,h(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(d,f){n=h(d,f,0)},this.setState=function(d,f,p){const v=d.clippingPlanes,S=d.clipIntersection,m=d.clipShadows,u=e.get(d);if(!a||v===null||v.length===0||s&&!m)s?h(null):c();else{const g=s?0:i,_=g*4;let y=u.clippingState||null;l.value=y,y=h(v,f,_,p);for(let L=0;L!==_;++L)y[L]=n[L];u.clippingState=y,this.numIntersection=S?this.numPlanes:0,this.numPlanes+=g}};function c(){l.value!==n&&(l.value=n,l.needsUpdate=i>0),t.numPlanes=i,t.numIntersection=0}function h(d,f,p,v){const S=d!==null?d.length:0;let m=null;if(S!==0){if(m=l.value,v!==!0||m===null){const u=p+S*4,g=f.matrixWorldInverse;o.getNormalMatrix(g),(m===null||m.length<u)&&(m=new Float32Array(u));for(let _=0,y=p;_!==S;++_,y+=4)r.copy(d[_]).applyMatrix4(g,o),r.normal.toArray(m,y),m[y+3]=r.constant}l.value=m,l.needsUpdate=!0}return t.numPlanes=S,t.numIntersection=0,m}}function VA(e){let t=new WeakMap;function n(r,o){return o===sd?r.mapping=Rr:o===rd&&(r.mapping=wr),r}function i(r){if(r&&r.isTexture){const o=r.mapping;if(o===sd||o===rd)if(t.has(r)){const l=t.get(r).texture;return n(l,r.mapping)}else{const l=r.image;if(l&&l.height>0){const c=new $b(l.height);return c.fromEquirectangularTexture(e,r),t.set(r,c),r.addEventListener("dispose",a),n(c.texture,r.mapping)}else return null}}return r}function a(r){const o=r.target;o.removeEventListener("dispose",a);const l=t.get(o);l!==void 0&&(t.delete(o),l.dispose())}function s(){t=new WeakMap}return{get:i,dispose:s}}class kA extends my{constructor(t=-1,n=1,i=1,a=-1,s=.1,r=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=n,this.top=i,this.bottom=a,this.near=s,this.far=r,this.updateProjectionMatrix()}copy(t,n){return super.copy(t,n),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,n,i,a,s,r){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=n,this.view.offsetX=i,this.view.offsetY=a,this.view.width=s,this.view.height=r,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),n=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,a=(this.top+this.bottom)/2;let s=i-t,r=i+t,o=a+n,l=a-n;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,r=s+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(s,r,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const n=super.toJSON(t);return n.object.zoom=this.zoom,n.object.left=this.left,n.object.right=this.right,n.object.top=this.top,n.object.bottom=this.bottom,n.object.near=this.near,n.object.far=this.far,this.view!==null&&(n.object.view=Object.assign({},this.view)),n}}const er=4,o0=[.125,.215,.35,.446,.526,.582],Ka=20,Gf=new kA,l0=new ee;let Vf=null,kf=0,jf=0,Xf=!1;const Ya=(1+Math.sqrt(5))/2,Is=1/Ya,c0=[new I(-Ya,Is,0),new I(Ya,Is,0),new I(-Is,0,Ya),new I(Is,0,Ya),new I(0,Ya,-Is),new I(0,Ya,Is),new I(-1,1,-1),new I(1,1,-1),new I(-1,1,1),new I(1,1,1)];class u0{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,n=0,i=.1,a=100){Vf=this._renderer.getRenderTarget(),kf=this._renderer.getActiveCubeFace(),jf=this._renderer.getActiveMipmapLevel(),Xf=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);const s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(t,i,a,s),n>0&&this._blur(s,0,0,n),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(t,n=null){return this._fromTexture(t,n)}fromCubemap(t,n=null){return this._fromTexture(t,n)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=d0(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=h0(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(Vf,kf,jf),this._renderer.xr.enabled=Xf,t.scissorTest=!1,Wl(t,0,0,t.width,t.height)}_fromTexture(t,n){t.mapping===Rr||t.mapping===wr?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),Vf=this._renderer.getRenderTarget(),kf=this._renderer.getActiveCubeFace(),jf=this._renderer.getActiveMipmapLevel(),Xf=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const i=n||this._allocateTargets();return this._textureToCubeUV(t,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),n=4*this._cubeSize,i={magFilter:li,minFilter:li,generateMipmaps:!1,type:Jo,format:ui,colorSpace:za,depthBuffer:!1},a=f0(t,n,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==n){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=f0(t,n,i);const{_lodMax:s}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=jA(s)),this._blurMaterial=XA(s,t,n)}return a}_compileMaterial(t){const n=new vn(this._lodPlanes[0],t);this._renderer.compile(n,Gf)}_sceneToCubeUV(t,n,i,a){const o=new Un(90,1,n,i),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],h=this._renderer,d=h.autoClear,f=h.toneMapping;h.getClearColor(l0),h.toneMapping=Ra,h.autoClear=!1;const p=new tr({name:"PMREM.Background",side:yn,depthWrite:!1,depthTest:!1}),v=new vn(new il,p);let S=!1;const m=t.background;m?m.isColor&&(p.color.copy(m),t.background=null,S=!0):(p.color.copy(l0),S=!0);for(let u=0;u<6;u++){const g=u%3;g===0?(o.up.set(0,l[u],0),o.lookAt(c[u],0,0)):g===1?(o.up.set(0,0,l[u]),o.lookAt(0,c[u],0)):(o.up.set(0,l[u],0),o.lookAt(0,0,c[u]));const _=this._cubeSize;Wl(a,g*_,u>2?_:0,_,_),h.setRenderTarget(a),S&&h.render(v,o),h.render(t,o)}v.geometry.dispose(),v.material.dispose(),h.toneMapping=f,h.autoClear=d,t.background=m}_textureToCubeUV(t,n){const i=this._renderer,a=t.mapping===Rr||t.mapping===wr;a?(this._cubemapMaterial===null&&(this._cubemapMaterial=d0()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=h0());const s=a?this._cubemapMaterial:this._equirectMaterial,r=new vn(this._lodPlanes[0],s),o=s.uniforms;o.envMap.value=t;const l=this._cubeSize;Wl(n,0,0,3*l,2*l),i.setRenderTarget(n),i.render(r,Gf)}_applyPMREM(t){const n=this._renderer,i=n.autoClear;n.autoClear=!1;const a=this._lodPlanes.length;for(let s=1;s<a;s++){const r=Math.sqrt(this._sigmas[s]*this._sigmas[s]-this._sigmas[s-1]*this._sigmas[s-1]),o=c0[(a-s-1)%c0.length];this._blur(t,s-1,s,r,o)}n.autoClear=i}_blur(t,n,i,a,s){const r=this._pingPongRenderTarget;this._halfBlur(t,r,n,i,a,"latitudinal",s),this._halfBlur(r,t,i,i,a,"longitudinal",s)}_halfBlur(t,n,i,a,s,r,o){const l=this._renderer,c=this._blurMaterial;r!=="latitudinal"&&r!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const h=3,d=new vn(this._lodPlanes[a],c),f=c.uniforms,p=this._sizeLods[i]-1,v=isFinite(s)?Math.PI/(2*p):2*Math.PI/(2*Ka-1),S=s/v,m=isFinite(s)?1+Math.floor(h*S):Ka;m>Ka&&console.warn(`sigmaRadians, ${s}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${Ka}`);const u=[];let g=0;for(let R=0;R<Ka;++R){const U=R/S,X=Math.exp(-U*U/2);u.push(X),R===0?g+=X:R<m&&(g+=2*X)}for(let R=0;R<u.length;R++)u[R]=u[R]/g;f.envMap.value=t.texture,f.samples.value=m,f.weights.value=u,f.latitudinal.value=r==="latitudinal",o&&(f.poleAxis.value=o);const{_lodMax:_}=this;f.dTheta.value=v,f.mipInt.value=_-i;const y=this._sizeLods[a],L=3*y*(a>_-er?a-_+er:0),T=4*(this._cubeSize-y);Wl(n,L,T,3*y,2*y),l.setRenderTarget(n),l.render(d,Gf)}}function jA(e){const t=[],n=[],i=[];let a=e;const s=e-er+1+o0.length;for(let r=0;r<s;r++){const o=Math.pow(2,a);n.push(o);let l=1/o;r>e-er?l=o0[r-e+er-1]:r===0&&(l=0),i.push(l);const c=1/(o-2),h=-c,d=1+c,f=[h,h,d,h,d,d,h,h,d,d,h,d],p=6,v=6,S=3,m=2,u=1,g=new Float32Array(S*v*p),_=new Float32Array(m*v*p),y=new Float32Array(u*v*p);for(let T=0;T<p;T++){const R=T%3*2/3-1,U=T>2?0:-1,X=[R,U,0,R+2/3,U,0,R+2/3,U+1,0,R,U,0,R+2/3,U+1,0,R,U+1,0];g.set(X,S*v*T),_.set(f,m*v*T);const x=[T,T,T,T,T,T];y.set(x,u*v*T)}const L=new nn;L.setAttribute("position",new cn(g,S)),L.setAttribute("uv",new cn(_,m)),L.setAttribute("faceIndex",new cn(y,u)),t.push(L),a>er&&a--}return{lodPlanes:t,sizeLods:n,sigmas:i}}function f0(e,t,n){const i=new fs(e,t,n);return i.texture.mapping=Au,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Wl(e,t,n,i,a){e.viewport.set(t,n,i,a),e.scissor.set(t,n,i,a)}function XA(e,t,n){const i=new Float32Array(Ka),a=new I(0,1,0);return new La({name:"SphericalGaussianBlur",defines:{n:Ka,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:a}},vertexShader:Jp(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Aa,depthTest:!1,depthWrite:!1})}function h0(){return new La({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Jp(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Aa,depthTest:!1,depthWrite:!1})}function d0(){return new La({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Jp(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Aa,depthTest:!1,depthWrite:!1})}function Jp(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function WA(e){let t=new WeakMap,n=null;function i(o){if(o&&o.isTexture){const l=o.mapping,c=l===sd||l===rd,h=l===Rr||l===wr;if(c||h){let d=t.get(o);const f=d!==void 0?d.texture.pmremVersion:0;if(o.isRenderTargetTexture&&o.pmremVersion!==f)return n===null&&(n=new u0(e)),d=c?n.fromEquirectangular(o,d):n.fromCubemap(o,d),d.texture.pmremVersion=o.pmremVersion,t.set(o,d),d.texture;if(d!==void 0)return d.texture;{const p=o.image;return c&&p&&p.height>0||h&&p&&a(p)?(n===null&&(n=new u0(e)),d=c?n.fromEquirectangular(o):n.fromCubemap(o),d.texture.pmremVersion=o.pmremVersion,t.set(o,d),o.addEventListener("dispose",s),d.texture):null}}}return o}function a(o){let l=0;const c=6;for(let h=0;h<c;h++)o[h]!==void 0&&l++;return l===c}function s(o){const l=o.target;l.removeEventListener("dispose",s);const c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function r(){t=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:i,dispose:r}}function qA(e){const t={};function n(i){if(t[i]!==void 0)return t[i];let a;switch(i){case"WEBGL_depth_texture":a=e.getExtension("WEBGL_depth_texture")||e.getExtension("MOZ_WEBGL_depth_texture")||e.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":a=e.getExtension("EXT_texture_filter_anisotropic")||e.getExtension("MOZ_EXT_texture_filter_anisotropic")||e.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":a=e.getExtension("WEBGL_compressed_texture_s3tc")||e.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||e.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":a=e.getExtension("WEBGL_compressed_texture_pvrtc")||e.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:a=e.getExtension(i)}return t[i]=a,a}return{has:function(i){return n(i)!==null},init:function(){n("EXT_color_buffer_float"),n("WEBGL_clip_cull_distance"),n("OES_texture_float_linear"),n("EXT_color_buffer_half_float"),n("WEBGL_multisampled_render_to_texture"),n("WEBGL_render_shared_exponent")},get:function(i){const a=n(i);return a===null&&Sc("THREE.WebGLRenderer: "+i+" extension not supported."),a}}}function YA(e,t,n,i){const a={},s=new WeakMap;function r(d){const f=d.target;f.index!==null&&t.remove(f.index);for(const v in f.attributes)t.remove(f.attributes[v]);for(const v in f.morphAttributes){const S=f.morphAttributes[v];for(let m=0,u=S.length;m<u;m++)t.remove(S[m])}f.removeEventListener("dispose",r),delete a[f.id];const p=s.get(f);p&&(t.remove(p),s.delete(f)),i.releaseStatesOfGeometry(f),f.isInstancedBufferGeometry===!0&&delete f._maxInstanceCount,n.memory.geometries--}function o(d,f){return a[f.id]===!0||(f.addEventListener("dispose",r),a[f.id]=!0,n.memory.geometries++),f}function l(d){const f=d.attributes;for(const v in f)t.update(f[v],e.ARRAY_BUFFER);const p=d.morphAttributes;for(const v in p){const S=p[v];for(let m=0,u=S.length;m<u;m++)t.update(S[m],e.ARRAY_BUFFER)}}function c(d){const f=[],p=d.index,v=d.attributes.position;let S=0;if(p!==null){const g=p.array;S=p.version;for(let _=0,y=g.length;_<y;_+=3){const L=g[_+0],T=g[_+1],R=g[_+2];f.push(L,T,T,R,R,L)}}else if(v!==void 0){const g=v.array;S=v.version;for(let _=0,y=g.length/3-1;_<y;_+=3){const L=_+0,T=_+1,R=_+2;f.push(L,T,T,R,R,L)}}else return;const m=new(ly(f)?dy:hy)(f,1);m.version=S;const u=s.get(d);u&&t.remove(u),s.set(d,m)}function h(d){const f=s.get(d);if(f){const p=d.index;p!==null&&f.version<p.version&&c(d)}else c(d);return s.get(d)}return{get:o,update:l,getWireframeAttribute:h}}function ZA(e,t,n){let i;function a(f){i=f}let s,r;function o(f){s=f.type,r=f.bytesPerElement}function l(f,p){e.drawElements(i,p,s,f*r),n.update(p,i,1)}function c(f,p,v){v!==0&&(e.drawElementsInstanced(i,p,s,f*r,v),n.update(p,i,v))}function h(f,p,v){if(v===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,p,0,s,f,0,v);let m=0;for(let u=0;u<v;u++)m+=p[u];n.update(m,i,1)}function d(f,p,v,S){if(v===0)return;const m=t.get("WEBGL_multi_draw");if(m===null)for(let u=0;u<f.length;u++)c(f[u]/r,p[u],S[u]);else{m.multiDrawElementsInstancedWEBGL(i,p,0,s,f,0,S,0,v);let u=0;for(let g=0;g<v;g++)u+=p[g];for(let g=0;g<S.length;g++)n.update(u,i,S[g])}}this.setMode=a,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h,this.renderMultiDrawInstances=d}function KA(e){const t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function i(s,r,o){switch(n.calls++,r){case e.TRIANGLES:n.triangles+=o*(s/3);break;case e.LINES:n.lines+=o*(s/2);break;case e.LINE_STRIP:n.lines+=o*(s-1);break;case e.LINE_LOOP:n.lines+=o*s;break;case e.POINTS:n.points+=o*s;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",r);break}}function a(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:a,update:i}}function QA(e,t,n){const i=new WeakMap,a=new pe;function s(r,o,l){const c=r.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,d=h!==void 0?h.length:0;let f=i.get(o);if(f===void 0||f.count!==d){let x=function(){U.dispose(),i.delete(o),o.removeEventListener("dispose",x)};var p=x;f!==void 0&&f.texture.dispose();const v=o.morphAttributes.position!==void 0,S=o.morphAttributes.normal!==void 0,m=o.morphAttributes.color!==void 0,u=o.morphAttributes.position||[],g=o.morphAttributes.normal||[],_=o.morphAttributes.color||[];let y=0;v===!0&&(y=1),S===!0&&(y=2),m===!0&&(y=3);let L=o.attributes.position.count*y,T=1;L>t.maxTextureSize&&(T=Math.ceil(L/t.maxTextureSize),L=t.maxTextureSize);const R=new Float32Array(L*T*4*d),U=new uy(R,L,T,d);U.type=Bi,U.needsUpdate=!0;const X=y*4;for(let E=0;E<d;E++){const q=u[E],W=g[E],J=_[E],et=L*T*4*E;for(let N=0;N<q.count;N++){const G=N*X;v===!0&&(a.fromBufferAttribute(q,N),R[et+G+0]=a.x,R[et+G+1]=a.y,R[et+G+2]=a.z,R[et+G+3]=0),S===!0&&(a.fromBufferAttribute(W,N),R[et+G+4]=a.x,R[et+G+5]=a.y,R[et+G+6]=a.z,R[et+G+7]=0),m===!0&&(a.fromBufferAttribute(J,N),R[et+G+8]=a.x,R[et+G+9]=a.y,R[et+G+10]=a.z,R[et+G+11]=J.itemSize===4?a.w:1)}}f={count:d,texture:U,size:new Vt(L,T)},i.set(o,f),o.addEventListener("dispose",x)}if(r.isInstancedMesh===!0&&r.morphTexture!==null)l.getUniforms().setValue(e,"morphTexture",r.morphTexture,n);else{let v=0;for(let m=0;m<c.length;m++)v+=c[m];const S=o.morphTargetsRelative?1:1-v;l.getUniforms().setValue(e,"morphTargetBaseInfluence",S),l.getUniforms().setValue(e,"morphTargetInfluences",c)}l.getUniforms().setValue(e,"morphTargetsTexture",f.texture,n),l.getUniforms().setValue(e,"morphTargetsTextureSize",f.size)}return{update:s}}function JA(e,t,n,i){let a=new WeakMap;function s(l){const c=i.render.frame,h=l.geometry,d=t.get(l,h);if(a.get(d)!==c&&(t.update(d),a.set(d,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),a.get(l)!==c&&(n.update(l.instanceMatrix,e.ARRAY_BUFFER),l.instanceColor!==null&&n.update(l.instanceColor,e.ARRAY_BUFFER),a.set(l,c))),l.isSkinnedMesh){const f=l.skeleton;a.get(f)!==c&&(f.update(),a.set(f,c))}return d}function r(){a=new WeakMap}function o(l){const c=l.target;c.removeEventListener("dispose",o),n.remove(c.instanceMatrix),c.instanceColor!==null&&n.remove(c.instanceColor)}return{update:s,dispose:r}}class vy extends Sn{constructor(t,n,i,a,s,r,o,l,c,h=dr){if(h!==dr&&h!==Dr)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");i===void 0&&h===dr&&(i=us),i===void 0&&h===Dr&&(i=Cr),super(null,a,s,r,o,l,h,i,c),this.isDepthTexture=!0,this.image={width:t,height:n},this.magFilter=o!==void 0?o:Jn,this.minFilter=l!==void 0?l:Jn,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){const n=super.toJSON(t);return this.compareFunction!==null&&(n.compareFunction=this.compareFunction),n}}const xy=new Sn,p0=new vy(1,1),yy=new uy,Sy=new Ib,My=new gy,m0=[],g0=[],_0=new Float32Array(16),v0=new Float32Array(9),x0=new Float32Array(4);function Hr(e,t,n){const i=e[0];if(i<=0||i>0)return e;const a=t*n;let s=m0[a];if(s===void 0&&(s=new Float32Array(a),m0[a]=s),t!==0){i.toArray(s,0);for(let r=1,o=0;r!==t;++r)o+=n,e[r].toArray(s,o)}return s}function He(e,t){if(e.length!==t.length)return!1;for(let n=0,i=e.length;n<i;n++)if(e[n]!==t[n])return!1;return!0}function Ge(e,t){for(let n=0,i=t.length;n<i;n++)e[n]=t[n]}function Cu(e,t){let n=g0[t];n===void 0&&(n=new Int32Array(t),g0[t]=n);for(let i=0;i!==t;++i)n[i]=e.allocateTextureUnit();return n}function $A(e,t){const n=this.cache;n[0]!==t&&(e.uniform1f(this.addr,t),n[0]=t)}function t2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(He(n,t))return;e.uniform2fv(this.addr,t),Ge(n,t)}}function e2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else if(t.r!==void 0)(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)&&(e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b);else{if(He(n,t))return;e.uniform3fv(this.addr,t),Ge(n,t)}}function n2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(He(n,t))return;e.uniform4fv(this.addr,t),Ge(n,t)}}function i2(e,t){const n=this.cache,i=t.elements;if(i===void 0){if(He(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),Ge(n,t)}else{if(He(n,i))return;x0.set(i),e.uniformMatrix2fv(this.addr,!1,x0),Ge(n,i)}}function a2(e,t){const n=this.cache,i=t.elements;if(i===void 0){if(He(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),Ge(n,t)}else{if(He(n,i))return;v0.set(i),e.uniformMatrix3fv(this.addr,!1,v0),Ge(n,i)}}function s2(e,t){const n=this.cache,i=t.elements;if(i===void 0){if(He(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),Ge(n,t)}else{if(He(n,i))return;_0.set(i),e.uniformMatrix4fv(this.addr,!1,_0),Ge(n,i)}}function r2(e,t){const n=this.cache;n[0]!==t&&(e.uniform1i(this.addr,t),n[0]=t)}function o2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(He(n,t))return;e.uniform2iv(this.addr,t),Ge(n,t)}}function l2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(He(n,t))return;e.uniform3iv(this.addr,t),Ge(n,t)}}function c2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(He(n,t))return;e.uniform4iv(this.addr,t),Ge(n,t)}}function u2(e,t){const n=this.cache;n[0]!==t&&(e.uniform1ui(this.addr,t),n[0]=t)}function f2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(He(n,t))return;e.uniform2uiv(this.addr,t),Ge(n,t)}}function h2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(He(n,t))return;e.uniform3uiv(this.addr,t),Ge(n,t)}}function d2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(He(n,t))return;e.uniform4uiv(this.addr,t),Ge(n,t)}}function p2(e,t,n){const i=this.cache,a=n.allocateTextureUnit();i[0]!==a&&(e.uniform1i(this.addr,a),i[0]=a);let s;this.type===e.SAMPLER_2D_SHADOW?(p0.compareFunction=oy,s=p0):s=xy,n.setTexture2D(t||s,a)}function m2(e,t,n){const i=this.cache,a=n.allocateTextureUnit();i[0]!==a&&(e.uniform1i(this.addr,a),i[0]=a),n.setTexture3D(t||Sy,a)}function g2(e,t,n){const i=this.cache,a=n.allocateTextureUnit();i[0]!==a&&(e.uniform1i(this.addr,a),i[0]=a),n.setTextureCube(t||My,a)}function _2(e,t,n){const i=this.cache,a=n.allocateTextureUnit();i[0]!==a&&(e.uniform1i(this.addr,a),i[0]=a),n.setTexture2DArray(t||yy,a)}function v2(e){switch(e){case 5126:return $A;case 35664:return t2;case 35665:return e2;case 35666:return n2;case 35674:return i2;case 35675:return a2;case 35676:return s2;case 5124:case 35670:return r2;case 35667:case 35671:return o2;case 35668:case 35672:return l2;case 35669:case 35673:return c2;case 5125:return u2;case 36294:return f2;case 36295:return h2;case 36296:return d2;case 35678:case 36198:case 36298:case 36306:case 35682:return p2;case 35679:case 36299:case 36307:return m2;case 35680:case 36300:case 36308:case 36293:return g2;case 36289:case 36303:case 36311:case 36292:return _2}}function x2(e,t){e.uniform1fv(this.addr,t)}function y2(e,t){const n=Hr(t,this.size,2);e.uniform2fv(this.addr,n)}function S2(e,t){const n=Hr(t,this.size,3);e.uniform3fv(this.addr,n)}function M2(e,t){const n=Hr(t,this.size,4);e.uniform4fv(this.addr,n)}function E2(e,t){const n=Hr(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function b2(e,t){const n=Hr(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function T2(e,t){const n=Hr(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function A2(e,t){e.uniform1iv(this.addr,t)}function R2(e,t){e.uniform2iv(this.addr,t)}function w2(e,t){e.uniform3iv(this.addr,t)}function C2(e,t){e.uniform4iv(this.addr,t)}function D2(e,t){e.uniform1uiv(this.addr,t)}function N2(e,t){e.uniform2uiv(this.addr,t)}function U2(e,t){e.uniform3uiv(this.addr,t)}function L2(e,t){e.uniform4uiv(this.addr,t)}function O2(e,t,n){const i=this.cache,a=t.length,s=Cu(n,a);He(i,s)||(e.uniform1iv(this.addr,s),Ge(i,s));for(let r=0;r!==a;++r)n.setTexture2D(t[r]||xy,s[r])}function P2(e,t,n){const i=this.cache,a=t.length,s=Cu(n,a);He(i,s)||(e.uniform1iv(this.addr,s),Ge(i,s));for(let r=0;r!==a;++r)n.setTexture3D(t[r]||Sy,s[r])}function z2(e,t,n){const i=this.cache,a=t.length,s=Cu(n,a);He(i,s)||(e.uniform1iv(this.addr,s),Ge(i,s));for(let r=0;r!==a;++r)n.setTextureCube(t[r]||My,s[r])}function I2(e,t,n){const i=this.cache,a=t.length,s=Cu(n,a);He(i,s)||(e.uniform1iv(this.addr,s),Ge(i,s));for(let r=0;r!==a;++r)n.setTexture2DArray(t[r]||yy,s[r])}function B2(e){switch(e){case 5126:return x2;case 35664:return y2;case 35665:return S2;case 35666:return M2;case 35674:return E2;case 35675:return b2;case 35676:return T2;case 5124:case 35670:return A2;case 35667:case 35671:return R2;case 35668:case 35672:return w2;case 35669:case 35673:return C2;case 5125:return D2;case 36294:return N2;case 36295:return U2;case 36296:return L2;case 35678:case 36198:case 36298:case 36306:case 35682:return O2;case 35679:case 36299:case 36307:return P2;case 35680:case 36300:case 36308:case 36293:return z2;case 36289:case 36303:case 36311:case 36292:return I2}}class F2{constructor(t,n,i){this.id=t,this.addr=i,this.cache=[],this.type=n.type,this.setValue=v2(n.type)}}class H2{constructor(t,n,i){this.id=t,this.addr=i,this.cache=[],this.type=n.type,this.size=n.size,this.setValue=B2(n.type)}}class G2{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,n,i){const a=this.seq;for(let s=0,r=a.length;s!==r;++s){const o=a[s];o.setValue(t,n[o.id],i)}}}const Wf=/(\w+)(\])?(\[|\.)?/g;function y0(e,t){e.seq.push(t),e.map[t.id]=t}function V2(e,t,n){const i=e.name,a=i.length;for(Wf.lastIndex=0;;){const s=Wf.exec(i),r=Wf.lastIndex;let o=s[1];const l=s[2]==="]",c=s[3];if(l&&(o=o|0),c===void 0||c==="["&&r+2===a){y0(n,c===void 0?new F2(o,e,t):new H2(o,e,t));break}else{let d=n.map[o];d===void 0&&(d=new G2(o),y0(n,d)),n=d}}}class Mc{constructor(t,n){this.seq=[],this.map={};const i=t.getProgramParameter(n,t.ACTIVE_UNIFORMS);for(let a=0;a<i;++a){const s=t.getActiveUniform(n,a),r=t.getUniformLocation(n,s.name);V2(s,r,this)}}setValue(t,n,i,a){const s=this.map[n];s!==void 0&&s.setValue(t,i,a)}setOptional(t,n,i){const a=n[i];a!==void 0&&this.setValue(t,i,a)}static upload(t,n,i,a){for(let s=0,r=n.length;s!==r;++s){const o=n[s],l=i[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,a)}}static seqWithValue(t,n){const i=[];for(let a=0,s=t.length;a!==s;++a){const r=t[a];r.id in n&&i.push(r)}return i}}function S0(e,t,n){const i=e.createShader(t);return e.shaderSource(i,n),e.compileShader(i),i}const k2=37297;let j2=0;function X2(e,t){const n=e.split(`
`),i=[],a=Math.max(t-6,0),s=Math.min(t+6,n.length);for(let r=a;r<s;r++){const o=r+1;i.push(`${o===t?">":" "} ${o}: ${n[r]}`)}return i.join(`
`)}function W2(e){const t=oe.getPrimaries(oe.workingColorSpace),n=oe.getPrimaries(e);let i;switch(t===n?i="":t===eu&&n===tu?i="LinearDisplayP3ToLinearSRGB":t===tu&&n===eu&&(i="LinearSRGBToLinearDisplayP3"),e){case za:case Ru:return[i,"LinearTransferOETF"];case hi:case Zp:return[i,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",e),[i,"LinearTransferOETF"]}}function M0(e,t,n){const i=e.getShaderParameter(t,e.COMPILE_STATUS),a=e.getShaderInfoLog(t).trim();if(i&&a==="")return"";const s=/ERROR: 0:(\d+)/.exec(a);if(s){const r=parseInt(s[1]);return n.toUpperCase()+`

`+a+`

`+X2(e.getShaderSource(t),r)}else return a}function q2(e,t){const n=W2(t);return`vec4 ${e}( vec4 value ) { return ${n[0]}( ${n[1]}( value ) ); }`}function Y2(e,t){let n;switch(t){case lb:n="Linear";break;case cb:n="Reinhard";break;case ub:n="Cineon";break;case fb:n="ACESFilmic";break;case db:n="AgX";break;case pb:n="Neutral";break;case hb:n="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),n="Linear"}return"vec3 "+e+"( vec3 color ) { return "+n+"ToneMapping( color ); }"}const ql=new I;function Z2(){oe.getLuminanceCoefficients(ql);const e=ql.x.toFixed(4),t=ql.y.toFixed(4),n=ql.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${e}, ${t}, ${n} );`,"	return dot( weights, rgb );","}"].join(`
`)}function K2(e){return[e.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",e.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(lo).join(`
`)}function Q2(e){const t=[];for(const n in e){const i=e[n];i!==!1&&t.push("#define "+n+" "+i)}return t.join(`
`)}function J2(e,t){const n={},i=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let a=0;a<i;a++){const s=e.getActiveAttrib(t,a),r=s.name;let o=1;s.type===e.FLOAT_MAT2&&(o=2),s.type===e.FLOAT_MAT3&&(o=3),s.type===e.FLOAT_MAT4&&(o=4),n[r]={type:s.type,location:e.getAttribLocation(t,r),locationSize:o}}return n}function lo(e){return e!==""}function E0(e,t){const n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function b0(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const $2=/^[ \t]*#include +<([\w\d./]+)>/gm;function zd(e){return e.replace($2,eR)}const tR=new Map;function eR(e,t){let n=Xt[t];if(n===void 0){const i=tR.get(t);if(i!==void 0)n=Xt[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,i);else throw new Error("Can not resolve #include <"+t+">")}return zd(n)}const nR=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function T0(e){return e.replace(nR,iR)}function iR(e,t,n,i){let a="";for(let s=parseInt(t);s<parseInt(n);s++)a+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return a}function A0(e){let t=`precision ${e.precision} float;
	precision ${e.precision} int;
	precision ${e.precision} sampler2D;
	precision ${e.precision} samplerCube;
	precision ${e.precision} sampler3D;
	precision ${e.precision} sampler2DArray;
	precision ${e.precision} sampler2DShadow;
	precision ${e.precision} samplerCubeShadow;
	precision ${e.precision} sampler2DArrayShadow;
	precision ${e.precision} isampler2D;
	precision ${e.precision} isampler3D;
	precision ${e.precision} isamplerCube;
	precision ${e.precision} isampler2DArray;
	precision ${e.precision} usampler2D;
	precision ${e.precision} usampler3D;
	precision ${e.precision} usamplerCube;
	precision ${e.precision} usampler2DArray;
	`;return e.precision==="highp"?t+=`
#define HIGH_PRECISION`:e.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:e.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function aR(e){let t="SHADOWMAP_TYPE_BASIC";return e.shadowMapType===qx?t="SHADOWMAP_TYPE_PCF":e.shadowMapType===GE?t="SHADOWMAP_TYPE_PCF_SOFT":e.shadowMapType===Ui&&(t="SHADOWMAP_TYPE_VSM"),t}function sR(e){let t="ENVMAP_TYPE_CUBE";if(e.envMap)switch(e.envMapMode){case Rr:case wr:t="ENVMAP_TYPE_CUBE";break;case Au:t="ENVMAP_TYPE_CUBE_UV";break}return t}function rR(e){let t="ENVMAP_MODE_REFLECTION";if(e.envMap)switch(e.envMapMode){case wr:t="ENVMAP_MODE_REFRACTION";break}return t}function oR(e){let t="ENVMAP_BLENDING_NONE";if(e.envMap)switch(e.combine){case Yx:t="ENVMAP_BLENDING_MULTIPLY";break;case rb:t="ENVMAP_BLENDING_MIX";break;case ob:t="ENVMAP_BLENDING_ADD";break}return t}function lR(e){const t=e.envMapCubeUVHeight;if(t===null)return null;const n=Math.log2(t)-2,i=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,n),7*16)),texelHeight:i,maxMip:n}}function cR(e,t,n,i){const a=e.getContext(),s=n.defines;let r=n.vertexShader,o=n.fragmentShader;const l=aR(n),c=sR(n),h=rR(n),d=oR(n),f=lR(n),p=K2(n),v=Q2(s),S=a.createProgram();let m,u,g=n.glslVersion?"#version "+n.glslVersion+`
`:"";n.isRawShaderMaterial?(m=["#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,v].filter(lo).join(`
`),m.length>0&&(m+=`
`),u=["#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,v].filter(lo).join(`
`),u.length>0&&(u+=`
`)):(m=[A0(n),"#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,v,n.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",n.batching?"#define USE_BATCHING":"",n.batchingColor?"#define USE_BATCHING_COLOR":"",n.instancing?"#define USE_INSTANCING":"",n.instancingColor?"#define USE_INSTANCING_COLOR":"",n.instancingMorph?"#define USE_INSTANCING_MORPH":"",n.useFog&&n.fog?"#define USE_FOG":"",n.useFog&&n.fogExp2?"#define FOG_EXP2":"",n.map?"#define USE_MAP":"",n.envMap?"#define USE_ENVMAP":"",n.envMap?"#define "+h:"",n.lightMap?"#define USE_LIGHTMAP":"",n.aoMap?"#define USE_AOMAP":"",n.bumpMap?"#define USE_BUMPMAP":"",n.normalMap?"#define USE_NORMALMAP":"",n.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",n.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",n.displacementMap?"#define USE_DISPLACEMENTMAP":"",n.emissiveMap?"#define USE_EMISSIVEMAP":"",n.anisotropy?"#define USE_ANISOTROPY":"",n.anisotropyMap?"#define USE_ANISOTROPYMAP":"",n.clearcoatMap?"#define USE_CLEARCOATMAP":"",n.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",n.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",n.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",n.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",n.specularMap?"#define USE_SPECULARMAP":"",n.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",n.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",n.roughnessMap?"#define USE_ROUGHNESSMAP":"",n.metalnessMap?"#define USE_METALNESSMAP":"",n.alphaMap?"#define USE_ALPHAMAP":"",n.alphaHash?"#define USE_ALPHAHASH":"",n.transmission?"#define USE_TRANSMISSION":"",n.transmissionMap?"#define USE_TRANSMISSIONMAP":"",n.thicknessMap?"#define USE_THICKNESSMAP":"",n.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",n.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",n.mapUv?"#define MAP_UV "+n.mapUv:"",n.alphaMapUv?"#define ALPHAMAP_UV "+n.alphaMapUv:"",n.lightMapUv?"#define LIGHTMAP_UV "+n.lightMapUv:"",n.aoMapUv?"#define AOMAP_UV "+n.aoMapUv:"",n.emissiveMapUv?"#define EMISSIVEMAP_UV "+n.emissiveMapUv:"",n.bumpMapUv?"#define BUMPMAP_UV "+n.bumpMapUv:"",n.normalMapUv?"#define NORMALMAP_UV "+n.normalMapUv:"",n.displacementMapUv?"#define DISPLACEMENTMAP_UV "+n.displacementMapUv:"",n.metalnessMapUv?"#define METALNESSMAP_UV "+n.metalnessMapUv:"",n.roughnessMapUv?"#define ROUGHNESSMAP_UV "+n.roughnessMapUv:"",n.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+n.anisotropyMapUv:"",n.clearcoatMapUv?"#define CLEARCOATMAP_UV "+n.clearcoatMapUv:"",n.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+n.clearcoatNormalMapUv:"",n.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+n.clearcoatRoughnessMapUv:"",n.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+n.iridescenceMapUv:"",n.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+n.iridescenceThicknessMapUv:"",n.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+n.sheenColorMapUv:"",n.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+n.sheenRoughnessMapUv:"",n.specularMapUv?"#define SPECULARMAP_UV "+n.specularMapUv:"",n.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+n.specularColorMapUv:"",n.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+n.specularIntensityMapUv:"",n.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+n.transmissionMapUv:"",n.thicknessMapUv?"#define THICKNESSMAP_UV "+n.thicknessMapUv:"",n.vertexTangents&&n.flatShading===!1?"#define USE_TANGENT":"",n.vertexColors?"#define USE_COLOR":"",n.vertexAlphas?"#define USE_COLOR_ALPHA":"",n.vertexUv1s?"#define USE_UV1":"",n.vertexUv2s?"#define USE_UV2":"",n.vertexUv3s?"#define USE_UV3":"",n.pointsUvs?"#define USE_POINTS_UV":"",n.flatShading?"#define FLAT_SHADED":"",n.skinning?"#define USE_SKINNING":"",n.morphTargets?"#define USE_MORPHTARGETS":"",n.morphNormals&&n.flatShading===!1?"#define USE_MORPHNORMALS":"",n.morphColors?"#define USE_MORPHCOLORS":"",n.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+n.morphTextureStride:"",n.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+n.morphTargetsCount:"",n.doubleSided?"#define DOUBLE_SIDED":"",n.flipSided?"#define FLIP_SIDED":"",n.shadowMapEnabled?"#define USE_SHADOWMAP":"",n.shadowMapEnabled?"#define "+l:"",n.sizeAttenuation?"#define USE_SIZEATTENUATION":"",n.numLightProbes>0?"#define USE_LIGHT_PROBES":"",n.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",n.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(lo).join(`
`),u=[A0(n),"#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,v,n.useFog&&n.fog?"#define USE_FOG":"",n.useFog&&n.fogExp2?"#define FOG_EXP2":"",n.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",n.map?"#define USE_MAP":"",n.matcap?"#define USE_MATCAP":"",n.envMap?"#define USE_ENVMAP":"",n.envMap?"#define "+c:"",n.envMap?"#define "+h:"",n.envMap?"#define "+d:"",f?"#define CUBEUV_TEXEL_WIDTH "+f.texelWidth:"",f?"#define CUBEUV_TEXEL_HEIGHT "+f.texelHeight:"",f?"#define CUBEUV_MAX_MIP "+f.maxMip+".0":"",n.lightMap?"#define USE_LIGHTMAP":"",n.aoMap?"#define USE_AOMAP":"",n.bumpMap?"#define USE_BUMPMAP":"",n.normalMap?"#define USE_NORMALMAP":"",n.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",n.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",n.emissiveMap?"#define USE_EMISSIVEMAP":"",n.anisotropy?"#define USE_ANISOTROPY":"",n.anisotropyMap?"#define USE_ANISOTROPYMAP":"",n.clearcoat?"#define USE_CLEARCOAT":"",n.clearcoatMap?"#define USE_CLEARCOATMAP":"",n.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",n.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",n.dispersion?"#define USE_DISPERSION":"",n.iridescence?"#define USE_IRIDESCENCE":"",n.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",n.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",n.specularMap?"#define USE_SPECULARMAP":"",n.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",n.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",n.roughnessMap?"#define USE_ROUGHNESSMAP":"",n.metalnessMap?"#define USE_METALNESSMAP":"",n.alphaMap?"#define USE_ALPHAMAP":"",n.alphaTest?"#define USE_ALPHATEST":"",n.alphaHash?"#define USE_ALPHAHASH":"",n.sheen?"#define USE_SHEEN":"",n.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",n.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",n.transmission?"#define USE_TRANSMISSION":"",n.transmissionMap?"#define USE_TRANSMISSIONMAP":"",n.thicknessMap?"#define USE_THICKNESSMAP":"",n.vertexTangents&&n.flatShading===!1?"#define USE_TANGENT":"",n.vertexColors||n.instancingColor||n.batchingColor?"#define USE_COLOR":"",n.vertexAlphas?"#define USE_COLOR_ALPHA":"",n.vertexUv1s?"#define USE_UV1":"",n.vertexUv2s?"#define USE_UV2":"",n.vertexUv3s?"#define USE_UV3":"",n.pointsUvs?"#define USE_POINTS_UV":"",n.gradientMap?"#define USE_GRADIENTMAP":"",n.flatShading?"#define FLAT_SHADED":"",n.doubleSided?"#define DOUBLE_SIDED":"",n.flipSided?"#define FLIP_SIDED":"",n.shadowMapEnabled?"#define USE_SHADOWMAP":"",n.shadowMapEnabled?"#define "+l:"",n.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",n.numLightProbes>0?"#define USE_LIGHT_PROBES":"",n.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",n.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",n.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",n.toneMapping!==Ra?"#define TONE_MAPPING":"",n.toneMapping!==Ra?Xt.tonemapping_pars_fragment:"",n.toneMapping!==Ra?Y2("toneMapping",n.toneMapping):"",n.dithering?"#define DITHERING":"",n.opaque?"#define OPAQUE":"",Xt.colorspace_pars_fragment,q2("linearToOutputTexel",n.outputColorSpace),Z2(),n.useDepthPacking?"#define DEPTH_PACKING "+n.depthPacking:"",`
`].filter(lo).join(`
`)),r=zd(r),r=E0(r,n),r=b0(r,n),o=zd(o),o=E0(o,n),o=b0(o,n),r=T0(r),o=T0(o),n.isRawShaderMaterial!==!0&&(g=`#version 300 es
`,m=[p,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,u=["#define varying in",n.glslVersion===kg?"":"layout(location = 0) out highp vec4 pc_fragColor;",n.glslVersion===kg?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+u);const _=g+m+r,y=g+u+o,L=S0(a,a.VERTEX_SHADER,_),T=S0(a,a.FRAGMENT_SHADER,y);a.attachShader(S,L),a.attachShader(S,T),n.index0AttributeName!==void 0?a.bindAttribLocation(S,0,n.index0AttributeName):n.morphTargets===!0&&a.bindAttribLocation(S,0,"position"),a.linkProgram(S);function R(E){if(e.debug.checkShaderErrors){const q=a.getProgramInfoLog(S).trim(),W=a.getShaderInfoLog(L).trim(),J=a.getShaderInfoLog(T).trim();let et=!0,N=!0;if(a.getProgramParameter(S,a.LINK_STATUS)===!1)if(et=!1,typeof e.debug.onShaderError=="function")e.debug.onShaderError(a,S,L,T);else{const G=M0(a,L,"vertex"),O=M0(a,T,"fragment");console.error("THREE.WebGLProgram: Shader Error "+a.getError()+" - VALIDATE_STATUS "+a.getProgramParameter(S,a.VALIDATE_STATUS)+`

Material Name: `+E.name+`
Material Type: `+E.type+`

Program Info Log: `+q+`
`+G+`
`+O)}else q!==""?console.warn("THREE.WebGLProgram: Program Info Log:",q):(W===""||J==="")&&(N=!1);N&&(E.diagnostics={runnable:et,programLog:q,vertexShader:{log:W,prefix:m},fragmentShader:{log:J,prefix:u}})}a.deleteShader(L),a.deleteShader(T),U=new Mc(a,S),X=J2(a,S)}let U;this.getUniforms=function(){return U===void 0&&R(this),U};let X;this.getAttributes=function(){return X===void 0&&R(this),X};let x=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return x===!1&&(x=a.getProgramParameter(S,k2)),x},this.destroy=function(){i.releaseStatesOfProgram(this),a.deleteProgram(S),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=j2++,this.cacheKey=t,this.usedTimes=1,this.program=S,this.vertexShader=L,this.fragmentShader=T,this}let uR=0;class fR{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const n=t.vertexShader,i=t.fragmentShader,a=this._getShaderStage(n),s=this._getShaderStage(i),r=this._getShaderCacheForMaterial(t);return r.has(a)===!1&&(r.add(a),a.usedTimes++),r.has(s)===!1&&(r.add(s),s.usedTimes++),this}remove(t){const n=this.materialCache.get(t);for(const i of n)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const n=this.materialCache;let i=n.get(t);return i===void 0&&(i=new Set,n.set(t,i)),i}_getShaderStage(t){const n=this.shaderCache;let i=n.get(t);return i===void 0&&(i=new hR(t),n.set(t,i)),i}}class hR{constructor(t){this.id=uR++,this.code=t,this.usedTimes=0}}function dR(e,t,n,i,a,s,r){const o=new Kp,l=new fR,c=new Set,h=[],d=a.logarithmicDepthBuffer,f=a.reverseDepthBuffer,p=a.vertexTextures;let v=a.precision;const S={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function m(x){return c.add(x),x===0?"uv":`uv${x}`}function u(x,E,q,W,J){const et=W.fog,N=J.geometry,G=x.isMeshStandardMaterial?W.environment:null,O=(x.isMeshStandardMaterial?n:t).get(x.envMap||G),nt=O&&O.mapping===Au?O.image.height:null,Z=S[x.type];x.precision!==null&&(v=a.getMaxPrecision(x.precision),v!==x.precision&&console.warn("THREE.WebGLProgram.getParameters:",x.precision,"not supported, using",v,"instead."));const it=N.morphAttributes.position||N.morphAttributes.normal||N.morphAttributes.color,yt=it!==void 0?it.length:0;let Ct=0;N.morphAttributes.position!==void 0&&(Ct=1),N.morphAttributes.normal!==void 0&&(Ct=2),N.morphAttributes.color!==void 0&&(Ct=3);let k,K,lt,st;if(Z){const sn=di[Z];k=sn.vertexShader,K=sn.fragmentShader}else k=x.vertexShader,K=x.fragmentShader,l.update(x),lt=l.getVertexShaderID(x),st=l.getFragmentShaderID(x);const xt=e.getRenderTarget(),Et=J.isInstancedMesh===!0,Ut=J.isBatchedMesh===!0,qt=!!x.map,bt=!!x.matcap,D=!!O,Yt=!!x.aoMap,Rt=!!x.lightMap,Bt=!!x.bumpMap,Tt=!!x.normalMap,Lt=!!x.displacementMap,ct=!!x.emissiveMap,w=!!x.metalnessMap,M=!!x.roughnessMap,C=x.anisotropy>0,H=x.clearcoat>0,Q=x.dispersion>0,Y=x.iridescence>0,St=x.sheen>0,ot=x.transmission>0,mt=C&&!!x.anisotropyMap,zt=H&&!!x.clearcoatMap,at=H&&!!x.clearcoatNormalMap,ft=H&&!!x.clearcoatRoughnessMap,wt=Y&&!!x.iridescenceMap,Ot=Y&&!!x.iridescenceThicknessMap,vt=St&&!!x.sheenColorMap,Ht=St&&!!x.sheenRoughnessMap,Gt=!!x.specularMap,ae=!!x.specularColorMap,P=!!x.specularIntensityMap,gt=ot&&!!x.transmissionMap,F=ot&&!!x.thicknessMap,tt=!!x.gradientMap,ht=!!x.alphaMap,dt=x.alphaTest>0,Zt=!!x.alphaHash,me=!!x.extensions;let $e=Ra;x.toneMapped&&(xt===null||xt.isXRRenderTarget===!0)&&($e=e.toneMapping);const te={shaderID:Z,shaderType:x.type,shaderName:x.name,vertexShader:k,fragmentShader:K,defines:x.defines,customVertexShaderID:lt,customFragmentShaderID:st,isRawShaderMaterial:x.isRawShaderMaterial===!0,glslVersion:x.glslVersion,precision:v,batching:Ut,batchingColor:Ut&&J._colorsTexture!==null,instancing:Et,instancingColor:Et&&J.instanceColor!==null,instancingMorph:Et&&J.morphTexture!==null,supportsVertexTextures:p,outputColorSpace:xt===null?e.outputColorSpace:xt.isXRRenderTarget===!0?xt.texture.colorSpace:za,alphaToCoverage:!!x.alphaToCoverage,map:qt,matcap:bt,envMap:D,envMapMode:D&&O.mapping,envMapCubeUVHeight:nt,aoMap:Yt,lightMap:Rt,bumpMap:Bt,normalMap:Tt,displacementMap:p&&Lt,emissiveMap:ct,normalMapObjectSpace:Tt&&x.normalMapType===vb,normalMapTangentSpace:Tt&&x.normalMapType===ry,metalnessMap:w,roughnessMap:M,anisotropy:C,anisotropyMap:mt,clearcoat:H,clearcoatMap:zt,clearcoatNormalMap:at,clearcoatRoughnessMap:ft,dispersion:Q,iridescence:Y,iridescenceMap:wt,iridescenceThicknessMap:Ot,sheen:St,sheenColorMap:vt,sheenRoughnessMap:Ht,specularMap:Gt,specularColorMap:ae,specularIntensityMap:P,transmission:ot,transmissionMap:gt,thicknessMap:F,gradientMap:tt,opaque:x.transparent===!1&&x.blending===hr&&x.alphaToCoverage===!1,alphaMap:ht,alphaTest:dt,alphaHash:Zt,combine:x.combine,mapUv:qt&&m(x.map.channel),aoMapUv:Yt&&m(x.aoMap.channel),lightMapUv:Rt&&m(x.lightMap.channel),bumpMapUv:Bt&&m(x.bumpMap.channel),normalMapUv:Tt&&m(x.normalMap.channel),displacementMapUv:Lt&&m(x.displacementMap.channel),emissiveMapUv:ct&&m(x.emissiveMap.channel),metalnessMapUv:w&&m(x.metalnessMap.channel),roughnessMapUv:M&&m(x.roughnessMap.channel),anisotropyMapUv:mt&&m(x.anisotropyMap.channel),clearcoatMapUv:zt&&m(x.clearcoatMap.channel),clearcoatNormalMapUv:at&&m(x.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ft&&m(x.clearcoatRoughnessMap.channel),iridescenceMapUv:wt&&m(x.iridescenceMap.channel),iridescenceThicknessMapUv:Ot&&m(x.iridescenceThicknessMap.channel),sheenColorMapUv:vt&&m(x.sheenColorMap.channel),sheenRoughnessMapUv:Ht&&m(x.sheenRoughnessMap.channel),specularMapUv:Gt&&m(x.specularMap.channel),specularColorMapUv:ae&&m(x.specularColorMap.channel),specularIntensityMapUv:P&&m(x.specularIntensityMap.channel),transmissionMapUv:gt&&m(x.transmissionMap.channel),thicknessMapUv:F&&m(x.thicknessMap.channel),alphaMapUv:ht&&m(x.alphaMap.channel),vertexTangents:!!N.attributes.tangent&&(Tt||C),vertexColors:x.vertexColors,vertexAlphas:x.vertexColors===!0&&!!N.attributes.color&&N.attributes.color.itemSize===4,pointsUvs:J.isPoints===!0&&!!N.attributes.uv&&(qt||ht),fog:!!et,useFog:x.fog===!0,fogExp2:!!et&&et.isFogExp2,flatShading:x.flatShading===!0,sizeAttenuation:x.sizeAttenuation===!0,logarithmicDepthBuffer:d,reverseDepthBuffer:f,skinning:J.isSkinnedMesh===!0,morphTargets:N.morphAttributes.position!==void 0,morphNormals:N.morphAttributes.normal!==void 0,morphColors:N.morphAttributes.color!==void 0,morphTargetsCount:yt,morphTextureStride:Ct,numDirLights:E.directional.length,numPointLights:E.point.length,numSpotLights:E.spot.length,numSpotLightMaps:E.spotLightMap.length,numRectAreaLights:E.rectArea.length,numHemiLights:E.hemi.length,numDirLightShadows:E.directionalShadowMap.length,numPointLightShadows:E.pointShadowMap.length,numSpotLightShadows:E.spotShadowMap.length,numSpotLightShadowsWithMaps:E.numSpotLightShadowsWithMaps,numLightProbes:E.numLightProbes,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:x.dithering,shadowMapEnabled:e.shadowMap.enabled&&q.length>0,shadowMapType:e.shadowMap.type,toneMapping:$e,decodeVideoTexture:qt&&x.map.isVideoTexture===!0&&oe.getTransfer(x.map.colorSpace)===Se,premultipliedAlpha:x.premultipliedAlpha,doubleSided:x.side===pi,flipSided:x.side===yn,useDepthPacking:x.depthPacking>=0,depthPacking:x.depthPacking||0,index0AttributeName:x.index0AttributeName,extensionClipCullDistance:me&&x.extensions.clipCullDistance===!0&&i.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(me&&x.extensions.multiDraw===!0||Ut)&&i.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:x.customProgramCacheKey()};return te.vertexUv1s=c.has(1),te.vertexUv2s=c.has(2),te.vertexUv3s=c.has(3),c.clear(),te}function g(x){const E=[];if(x.shaderID?E.push(x.shaderID):(E.push(x.customVertexShaderID),E.push(x.customFragmentShaderID)),x.defines!==void 0)for(const q in x.defines)E.push(q),E.push(x.defines[q]);return x.isRawShaderMaterial===!1&&(_(E,x),y(E,x),E.push(e.outputColorSpace)),E.push(x.customProgramCacheKey),E.join()}function _(x,E){x.push(E.precision),x.push(E.outputColorSpace),x.push(E.envMapMode),x.push(E.envMapCubeUVHeight),x.push(E.mapUv),x.push(E.alphaMapUv),x.push(E.lightMapUv),x.push(E.aoMapUv),x.push(E.bumpMapUv),x.push(E.normalMapUv),x.push(E.displacementMapUv),x.push(E.emissiveMapUv),x.push(E.metalnessMapUv),x.push(E.roughnessMapUv),x.push(E.anisotropyMapUv),x.push(E.clearcoatMapUv),x.push(E.clearcoatNormalMapUv),x.push(E.clearcoatRoughnessMapUv),x.push(E.iridescenceMapUv),x.push(E.iridescenceThicknessMapUv),x.push(E.sheenColorMapUv),x.push(E.sheenRoughnessMapUv),x.push(E.specularMapUv),x.push(E.specularColorMapUv),x.push(E.specularIntensityMapUv),x.push(E.transmissionMapUv),x.push(E.thicknessMapUv),x.push(E.combine),x.push(E.fogExp2),x.push(E.sizeAttenuation),x.push(E.morphTargetsCount),x.push(E.morphAttributeCount),x.push(E.numDirLights),x.push(E.numPointLights),x.push(E.numSpotLights),x.push(E.numSpotLightMaps),x.push(E.numHemiLights),x.push(E.numRectAreaLights),x.push(E.numDirLightShadows),x.push(E.numPointLightShadows),x.push(E.numSpotLightShadows),x.push(E.numSpotLightShadowsWithMaps),x.push(E.numLightProbes),x.push(E.shadowMapType),x.push(E.toneMapping),x.push(E.numClippingPlanes),x.push(E.numClipIntersection),x.push(E.depthPacking)}function y(x,E){o.disableAll(),E.supportsVertexTextures&&o.enable(0),E.instancing&&o.enable(1),E.instancingColor&&o.enable(2),E.instancingMorph&&o.enable(3),E.matcap&&o.enable(4),E.envMap&&o.enable(5),E.normalMapObjectSpace&&o.enable(6),E.normalMapTangentSpace&&o.enable(7),E.clearcoat&&o.enable(8),E.iridescence&&o.enable(9),E.alphaTest&&o.enable(10),E.vertexColors&&o.enable(11),E.vertexAlphas&&o.enable(12),E.vertexUv1s&&o.enable(13),E.vertexUv2s&&o.enable(14),E.vertexUv3s&&o.enable(15),E.vertexTangents&&o.enable(16),E.anisotropy&&o.enable(17),E.alphaHash&&o.enable(18),E.batching&&o.enable(19),E.dispersion&&o.enable(20),E.batchingColor&&o.enable(21),x.push(o.mask),o.disableAll(),E.fog&&o.enable(0),E.useFog&&o.enable(1),E.flatShading&&o.enable(2),E.logarithmicDepthBuffer&&o.enable(3),E.reverseDepthBuffer&&o.enable(4),E.skinning&&o.enable(5),E.morphTargets&&o.enable(6),E.morphNormals&&o.enable(7),E.morphColors&&o.enable(8),E.premultipliedAlpha&&o.enable(9),E.shadowMapEnabled&&o.enable(10),E.doubleSided&&o.enable(11),E.flipSided&&o.enable(12),E.useDepthPacking&&o.enable(13),E.dithering&&o.enable(14),E.transmission&&o.enable(15),E.sheen&&o.enable(16),E.opaque&&o.enable(17),E.pointsUvs&&o.enable(18),E.decodeVideoTexture&&o.enable(19),E.alphaToCoverage&&o.enable(20),x.push(o.mask)}function L(x){const E=S[x.type];let q;if(E){const W=di[E];q=Zb.clone(W.uniforms)}else q=x.uniforms;return q}function T(x,E){let q;for(let W=0,J=h.length;W<J;W++){const et=h[W];if(et.cacheKey===E){q=et,++q.usedTimes;break}}return q===void 0&&(q=new cR(e,E,x,s),h.push(q)),q}function R(x){if(--x.usedTimes===0){const E=h.indexOf(x);h[E]=h[h.length-1],h.pop(),x.destroy()}}function U(x){l.remove(x)}function X(){l.dispose()}return{getParameters:u,getProgramCacheKey:g,getUniforms:L,acquireProgram:T,releaseProgram:R,releaseShaderCache:U,programs:h,dispose:X}}function pR(){let e=new WeakMap;function t(r){return e.has(r)}function n(r){let o=e.get(r);return o===void 0&&(o={},e.set(r,o)),o}function i(r){e.delete(r)}function a(r,o,l){e.get(r)[o]=l}function s(){e=new WeakMap}return{has:t,get:n,remove:i,update:a,dispose:s}}function mR(e,t){return e.groupOrder!==t.groupOrder?e.groupOrder-t.groupOrder:e.renderOrder!==t.renderOrder?e.renderOrder-t.renderOrder:e.material.id!==t.material.id?e.material.id-t.material.id:e.z!==t.z?e.z-t.z:e.id-t.id}function R0(e,t){return e.groupOrder!==t.groupOrder?e.groupOrder-t.groupOrder:e.renderOrder!==t.renderOrder?e.renderOrder-t.renderOrder:e.z!==t.z?t.z-e.z:e.id-t.id}function w0(){const e=[];let t=0;const n=[],i=[],a=[];function s(){t=0,n.length=0,i.length=0,a.length=0}function r(d,f,p,v,S,m){let u=e[t];return u===void 0?(u={id:d.id,object:d,geometry:f,material:p,groupOrder:v,renderOrder:d.renderOrder,z:S,group:m},e[t]=u):(u.id=d.id,u.object=d,u.geometry=f,u.material=p,u.groupOrder=v,u.renderOrder=d.renderOrder,u.z=S,u.group=m),t++,u}function o(d,f,p,v,S,m){const u=r(d,f,p,v,S,m);p.transmission>0?i.push(u):p.transparent===!0?a.push(u):n.push(u)}function l(d,f,p,v,S,m){const u=r(d,f,p,v,S,m);p.transmission>0?i.unshift(u):p.transparent===!0?a.unshift(u):n.unshift(u)}function c(d,f){n.length>1&&n.sort(d||mR),i.length>1&&i.sort(f||R0),a.length>1&&a.sort(f||R0)}function h(){for(let d=t,f=e.length;d<f;d++){const p=e[d];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:n,transmissive:i,transparent:a,init:s,push:o,unshift:l,finish:h,sort:c}}function gR(){let e=new WeakMap;function t(i,a){const s=e.get(i);let r;return s===void 0?(r=new w0,e.set(i,[r])):a>=s.length?(r=new w0,s.push(r)):r=s[a],r}function n(){e=new WeakMap}return{get:t,dispose:n}}function _R(){const e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case"DirectionalLight":n={direction:new I,color:new ee};break;case"SpotLight":n={position:new I,direction:new I,color:new ee,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":n={position:new I,color:new ee,distance:0,decay:0};break;case"HemisphereLight":n={direction:new I,skyColor:new ee,groundColor:new ee};break;case"RectAreaLight":n={color:new ee,position:new I,halfWidth:new I,halfHeight:new I};break}return e[t.id]=n,n}}}function vR(){const e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case"DirectionalLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Vt};break;case"SpotLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Vt};break;case"PointLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Vt,shadowCameraNear:1,shadowCameraFar:1e3};break}return e[t.id]=n,n}}}let xR=0;function yR(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+(t.map?1:0)-(e.map?1:0)}function SR(e){const t=new _R,n=vR(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new I);const a=new I,s=new ve,r=new ve;function o(c){let h=0,d=0,f=0;for(let X=0;X<9;X++)i.probe[X].set(0,0,0);let p=0,v=0,S=0,m=0,u=0,g=0,_=0,y=0,L=0,T=0,R=0;c.sort(yR);for(let X=0,x=c.length;X<x;X++){const E=c[X],q=E.color,W=E.intensity,J=E.distance,et=E.shadow&&E.shadow.map?E.shadow.map.texture:null;if(E.isAmbientLight)h+=q.r*W,d+=q.g*W,f+=q.b*W;else if(E.isLightProbe){for(let N=0;N<9;N++)i.probe[N].addScaledVector(E.sh.coefficients[N],W);R++}else if(E.isDirectionalLight){const N=t.get(E);if(N.color.copy(E.color).multiplyScalar(E.intensity),E.castShadow){const G=E.shadow,O=n.get(E);O.shadowIntensity=G.intensity,O.shadowBias=G.bias,O.shadowNormalBias=G.normalBias,O.shadowRadius=G.radius,O.shadowMapSize=G.mapSize,i.directionalShadow[p]=O,i.directionalShadowMap[p]=et,i.directionalShadowMatrix[p]=E.shadow.matrix,g++}i.directional[p]=N,p++}else if(E.isSpotLight){const N=t.get(E);N.position.setFromMatrixPosition(E.matrixWorld),N.color.copy(q).multiplyScalar(W),N.distance=J,N.coneCos=Math.cos(E.angle),N.penumbraCos=Math.cos(E.angle*(1-E.penumbra)),N.decay=E.decay,i.spot[S]=N;const G=E.shadow;if(E.map&&(i.spotLightMap[L]=E.map,L++,G.updateMatrices(E),E.castShadow&&T++),i.spotLightMatrix[S]=G.matrix,E.castShadow){const O=n.get(E);O.shadowIntensity=G.intensity,O.shadowBias=G.bias,O.shadowNormalBias=G.normalBias,O.shadowRadius=G.radius,O.shadowMapSize=G.mapSize,i.spotShadow[S]=O,i.spotShadowMap[S]=et,y++}S++}else if(E.isRectAreaLight){const N=t.get(E);N.color.copy(q).multiplyScalar(W),N.halfWidth.set(E.width*.5,0,0),N.halfHeight.set(0,E.height*.5,0),i.rectArea[m]=N,m++}else if(E.isPointLight){const N=t.get(E);if(N.color.copy(E.color).multiplyScalar(E.intensity),N.distance=E.distance,N.decay=E.decay,E.castShadow){const G=E.shadow,O=n.get(E);O.shadowIntensity=G.intensity,O.shadowBias=G.bias,O.shadowNormalBias=G.normalBias,O.shadowRadius=G.radius,O.shadowMapSize=G.mapSize,O.shadowCameraNear=G.camera.near,O.shadowCameraFar=G.camera.far,i.pointShadow[v]=O,i.pointShadowMap[v]=et,i.pointShadowMatrix[v]=E.shadow.matrix,_++}i.point[v]=N,v++}else if(E.isHemisphereLight){const N=t.get(E);N.skyColor.copy(E.color).multiplyScalar(W),N.groundColor.copy(E.groundColor).multiplyScalar(W),i.hemi[u]=N,u++}}m>0&&(e.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=ut.LTC_FLOAT_1,i.rectAreaLTC2=ut.LTC_FLOAT_2):(i.rectAreaLTC1=ut.LTC_HALF_1,i.rectAreaLTC2=ut.LTC_HALF_2)),i.ambient[0]=h,i.ambient[1]=d,i.ambient[2]=f;const U=i.hash;(U.directionalLength!==p||U.pointLength!==v||U.spotLength!==S||U.rectAreaLength!==m||U.hemiLength!==u||U.numDirectionalShadows!==g||U.numPointShadows!==_||U.numSpotShadows!==y||U.numSpotMaps!==L||U.numLightProbes!==R)&&(i.directional.length=p,i.spot.length=S,i.rectArea.length=m,i.point.length=v,i.hemi.length=u,i.directionalShadow.length=g,i.directionalShadowMap.length=g,i.pointShadow.length=_,i.pointShadowMap.length=_,i.spotShadow.length=y,i.spotShadowMap.length=y,i.directionalShadowMatrix.length=g,i.pointShadowMatrix.length=_,i.spotLightMatrix.length=y+L-T,i.spotLightMap.length=L,i.numSpotLightShadowsWithMaps=T,i.numLightProbes=R,U.directionalLength=p,U.pointLength=v,U.spotLength=S,U.rectAreaLength=m,U.hemiLength=u,U.numDirectionalShadows=g,U.numPointShadows=_,U.numSpotShadows=y,U.numSpotMaps=L,U.numLightProbes=R,i.version=xR++)}function l(c,h){let d=0,f=0,p=0,v=0,S=0;const m=h.matrixWorldInverse;for(let u=0,g=c.length;u<g;u++){const _=c[u];if(_.isDirectionalLight){const y=i.directional[d];y.direction.setFromMatrixPosition(_.matrixWorld),a.setFromMatrixPosition(_.target.matrixWorld),y.direction.sub(a),y.direction.transformDirection(m),d++}else if(_.isSpotLight){const y=i.spot[p];y.position.setFromMatrixPosition(_.matrixWorld),y.position.applyMatrix4(m),y.direction.setFromMatrixPosition(_.matrixWorld),a.setFromMatrixPosition(_.target.matrixWorld),y.direction.sub(a),y.direction.transformDirection(m),p++}else if(_.isRectAreaLight){const y=i.rectArea[v];y.position.setFromMatrixPosition(_.matrixWorld),y.position.applyMatrix4(m),r.identity(),s.copy(_.matrixWorld),s.premultiply(m),r.extractRotation(s),y.halfWidth.set(_.width*.5,0,0),y.halfHeight.set(0,_.height*.5,0),y.halfWidth.applyMatrix4(r),y.halfHeight.applyMatrix4(r),v++}else if(_.isPointLight){const y=i.point[f];y.position.setFromMatrixPosition(_.matrixWorld),y.position.applyMatrix4(m),f++}else if(_.isHemisphereLight){const y=i.hemi[S];y.direction.setFromMatrixPosition(_.matrixWorld),y.direction.transformDirection(m),S++}}}return{setup:o,setupView:l,state:i}}function C0(e){const t=new SR(e),n=[],i=[];function a(h){c.camera=h,n.length=0,i.length=0}function s(h){n.push(h)}function r(h){i.push(h)}function o(){t.setup(n)}function l(h){t.setupView(n,h)}const c={lightsArray:n,shadowsArray:i,camera:null,lights:t,transmissionRenderTarget:{}};return{init:a,state:c,setupLights:o,setupLightsView:l,pushLight:s,pushShadow:r}}function MR(e){let t=new WeakMap;function n(a,s=0){const r=t.get(a);let o;return r===void 0?(o=new C0(e),t.set(a,[o])):s>=r.length?(o=new C0(e),r.push(o)):o=r[s],o}function i(){t=new WeakMap}return{get:n,dispose:i}}class ER extends xs{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=gb,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class bR extends xs{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}const TR=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,AR=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function RR(e,t,n){let i=new Qp;const a=new Vt,s=new Vt,r=new pe,o=new ER({depthPacking:_b}),l=new bR,c={},h=n.maxTextureSize,d={[Ua]:yn,[yn]:Ua,[pi]:pi},f=new La({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Vt},radius:{value:4}},vertexShader:TR,fragmentShader:AR}),p=f.clone();p.defines.HORIZONTAL_PASS=1;const v=new nn;v.setAttribute("position",new cn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const S=new vn(v,f),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=qx;let u=this.type;this.render=function(T,R,U){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||T.length===0)return;const X=e.getRenderTarget(),x=e.getActiveCubeFace(),E=e.getActiveMipmapLevel(),q=e.state;q.setBlending(Aa),q.buffers.color.setClear(1,1,1,1),q.buffers.depth.setTest(!0),q.setScissorTest(!1);const W=u!==Ui&&this.type===Ui,J=u===Ui&&this.type!==Ui;for(let et=0,N=T.length;et<N;et++){const G=T[et],O=G.shadow;if(O===void 0){console.warn("THREE.WebGLShadowMap:",G,"has no shadow.");continue}if(O.autoUpdate===!1&&O.needsUpdate===!1)continue;a.copy(O.mapSize);const nt=O.getFrameExtents();if(a.multiply(nt),s.copy(O.mapSize),(a.x>h||a.y>h)&&(a.x>h&&(s.x=Math.floor(h/nt.x),a.x=s.x*nt.x,O.mapSize.x=s.x),a.y>h&&(s.y=Math.floor(h/nt.y),a.y=s.y*nt.y,O.mapSize.y=s.y)),O.map===null||W===!0||J===!0){const it=this.type!==Ui?{minFilter:Jn,magFilter:Jn}:{};O.map!==null&&O.map.dispose(),O.map=new fs(a.x,a.y,it),O.map.texture.name=G.name+".shadowMap",O.camera.updateProjectionMatrix()}e.setRenderTarget(O.map),e.clear();const Z=O.getViewportCount();for(let it=0;it<Z;it++){const yt=O.getViewport(it);r.set(s.x*yt.x,s.y*yt.y,s.x*yt.z,s.y*yt.w),q.viewport(r),O.updateMatrices(G,it),i=O.getFrustum(),y(R,U,O.camera,G,this.type)}O.isPointLightShadow!==!0&&this.type===Ui&&g(O,U),O.needsUpdate=!1}u=this.type,m.needsUpdate=!1,e.setRenderTarget(X,x,E)};function g(T,R){const U=t.update(S);f.defines.VSM_SAMPLES!==T.blurSamples&&(f.defines.VSM_SAMPLES=T.blurSamples,p.defines.VSM_SAMPLES=T.blurSamples,f.needsUpdate=!0,p.needsUpdate=!0),T.mapPass===null&&(T.mapPass=new fs(a.x,a.y)),f.uniforms.shadow_pass.value=T.map.texture,f.uniforms.resolution.value=T.mapSize,f.uniforms.radius.value=T.radius,e.setRenderTarget(T.mapPass),e.clear(),e.renderBufferDirect(R,null,U,f,S,null),p.uniforms.shadow_pass.value=T.mapPass.texture,p.uniforms.resolution.value=T.mapSize,p.uniforms.radius.value=T.radius,e.setRenderTarget(T.map),e.clear(),e.renderBufferDirect(R,null,U,p,S,null)}function _(T,R,U,X){let x=null;const E=U.isPointLight===!0?T.customDistanceMaterial:T.customDepthMaterial;if(E!==void 0)x=E;else if(x=U.isPointLight===!0?l:o,e.localClippingEnabled&&R.clipShadows===!0&&Array.isArray(R.clippingPlanes)&&R.clippingPlanes.length!==0||R.displacementMap&&R.displacementScale!==0||R.alphaMap&&R.alphaTest>0||R.map&&R.alphaTest>0){const q=x.uuid,W=R.uuid;let J=c[q];J===void 0&&(J={},c[q]=J);let et=J[W];et===void 0&&(et=x.clone(),J[W]=et,R.addEventListener("dispose",L)),x=et}if(x.visible=R.visible,x.wireframe=R.wireframe,X===Ui?x.side=R.shadowSide!==null?R.shadowSide:R.side:x.side=R.shadowSide!==null?R.shadowSide:d[R.side],x.alphaMap=R.alphaMap,x.alphaTest=R.alphaTest,x.map=R.map,x.clipShadows=R.clipShadows,x.clippingPlanes=R.clippingPlanes,x.clipIntersection=R.clipIntersection,x.displacementMap=R.displacementMap,x.displacementScale=R.displacementScale,x.displacementBias=R.displacementBias,x.wireframeLinewidth=R.wireframeLinewidth,x.linewidth=R.linewidth,U.isPointLight===!0&&x.isMeshDistanceMaterial===!0){const q=e.properties.get(x);q.light=U}return x}function y(T,R,U,X,x){if(T.visible===!1)return;if(T.layers.test(R.layers)&&(T.isMesh||T.isLine||T.isPoints)&&(T.castShadow||T.receiveShadow&&x===Ui)&&(!T.frustumCulled||i.intersectsObject(T))){T.modelViewMatrix.multiplyMatrices(U.matrixWorldInverse,T.matrixWorld);const W=t.update(T),J=T.material;if(Array.isArray(J)){const et=W.groups;for(let N=0,G=et.length;N<G;N++){const O=et[N],nt=J[O.materialIndex];if(nt&&nt.visible){const Z=_(T,nt,X,x);T.onBeforeShadow(e,T,R,U,W,Z,O),e.renderBufferDirect(U,null,W,Z,T,O),T.onAfterShadow(e,T,R,U,W,Z,O)}}}else if(J.visible){const et=_(T,J,X,x);T.onBeforeShadow(e,T,R,U,W,et,null),e.renderBufferDirect(U,null,W,et,T,null),T.onAfterShadow(e,T,R,U,W,et,null)}}const q=T.children;for(let W=0,J=q.length;W<J;W++)y(q[W],R,U,X,x)}function L(T){T.target.removeEventListener("dispose",L);for(const U in c){const X=c[U],x=T.target.uuid;x in X&&(X[x].dispose(),delete X[x])}}}const wR={[Jh]:$h,[td]:id,[ed]:ad,[Ar]:nd,[$h]:Jh,[id]:td,[ad]:ed,[nd]:Ar};function CR(e){function t(){let P=!1;const gt=new pe;let F=null;const tt=new pe(0,0,0,0);return{setMask:function(ht){F!==ht&&!P&&(e.colorMask(ht,ht,ht,ht),F=ht)},setLocked:function(ht){P=ht},setClear:function(ht,dt,Zt,me,$e){$e===!0&&(ht*=me,dt*=me,Zt*=me),gt.set(ht,dt,Zt,me),tt.equals(gt)===!1&&(e.clearColor(ht,dt,Zt,me),tt.copy(gt))},reset:function(){P=!1,F=null,tt.set(-1,0,0,0)}}}function n(){let P=!1,gt=!1,F=null,tt=null,ht=null;return{setReversed:function(dt){gt=dt},setTest:function(dt){dt?lt(e.DEPTH_TEST):st(e.DEPTH_TEST)},setMask:function(dt){F!==dt&&!P&&(e.depthMask(dt),F=dt)},setFunc:function(dt){if(gt&&(dt=wR[dt]),tt!==dt){switch(dt){case Jh:e.depthFunc(e.NEVER);break;case $h:e.depthFunc(e.ALWAYS);break;case td:e.depthFunc(e.LESS);break;case Ar:e.depthFunc(e.LEQUAL);break;case ed:e.depthFunc(e.EQUAL);break;case nd:e.depthFunc(e.GEQUAL);break;case id:e.depthFunc(e.GREATER);break;case ad:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}tt=dt}},setLocked:function(dt){P=dt},setClear:function(dt){ht!==dt&&(e.clearDepth(dt),ht=dt)},reset:function(){P=!1,F=null,tt=null,ht=null}}}function i(){let P=!1,gt=null,F=null,tt=null,ht=null,dt=null,Zt=null,me=null,$e=null;return{setTest:function(te){P||(te?lt(e.STENCIL_TEST):st(e.STENCIL_TEST))},setMask:function(te){gt!==te&&!P&&(e.stencilMask(te),gt=te)},setFunc:function(te,sn,Tn){(F!==te||tt!==sn||ht!==Tn)&&(e.stencilFunc(te,sn,Tn),F=te,tt=sn,ht=Tn)},setOp:function(te,sn,Tn){(dt!==te||Zt!==sn||me!==Tn)&&(e.stencilOp(te,sn,Tn),dt=te,Zt=sn,me=Tn)},setLocked:function(te){P=te},setClear:function(te){$e!==te&&(e.clearStencil(te),$e=te)},reset:function(){P=!1,gt=null,F=null,tt=null,ht=null,dt=null,Zt=null,me=null,$e=null}}}const a=new t,s=new n,r=new i,o=new WeakMap,l=new WeakMap;let c={},h={},d=new WeakMap,f=[],p=null,v=!1,S=null,m=null,u=null,g=null,_=null,y=null,L=null,T=new ee(0,0,0),R=0,U=!1,X=null,x=null,E=null,q=null,W=null;const J=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let et=!1,N=0;const G=e.getParameter(e.VERSION);G.indexOf("WebGL")!==-1?(N=parseFloat(/^WebGL (\d)/.exec(G)[1]),et=N>=1):G.indexOf("OpenGL ES")!==-1&&(N=parseFloat(/^OpenGL ES (\d)/.exec(G)[1]),et=N>=2);let O=null,nt={};const Z=e.getParameter(e.SCISSOR_BOX),it=e.getParameter(e.VIEWPORT),yt=new pe().fromArray(Z),Ct=new pe().fromArray(it);function k(P,gt,F,tt){const ht=new Uint8Array(4),dt=e.createTexture();e.bindTexture(P,dt),e.texParameteri(P,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(P,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let Zt=0;Zt<F;Zt++)P===e.TEXTURE_3D||P===e.TEXTURE_2D_ARRAY?e.texImage3D(gt,0,e.RGBA,1,1,tt,0,e.RGBA,e.UNSIGNED_BYTE,ht):e.texImage2D(gt+Zt,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,ht);return dt}const K={};K[e.TEXTURE_2D]=k(e.TEXTURE_2D,e.TEXTURE_2D,1),K[e.TEXTURE_CUBE_MAP]=k(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),K[e.TEXTURE_2D_ARRAY]=k(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),K[e.TEXTURE_3D]=k(e.TEXTURE_3D,e.TEXTURE_3D,1,1),a.setClear(0,0,0,1),s.setClear(1),r.setClear(0),lt(e.DEPTH_TEST),s.setFunc(Ar),Rt(!1),Bt(Bg),lt(e.CULL_FACE),D(Aa);function lt(P){c[P]!==!0&&(e.enable(P),c[P]=!0)}function st(P){c[P]!==!1&&(e.disable(P),c[P]=!1)}function xt(P,gt){return h[P]!==gt?(e.bindFramebuffer(P,gt),h[P]=gt,P===e.DRAW_FRAMEBUFFER&&(h[e.FRAMEBUFFER]=gt),P===e.FRAMEBUFFER&&(h[e.DRAW_FRAMEBUFFER]=gt),!0):!1}function Et(P,gt){let F=f,tt=!1;if(P){F=d.get(gt),F===void 0&&(F=[],d.set(gt,F));const ht=P.textures;if(F.length!==ht.length||F[0]!==e.COLOR_ATTACHMENT0){for(let dt=0,Zt=ht.length;dt<Zt;dt++)F[dt]=e.COLOR_ATTACHMENT0+dt;F.length=ht.length,tt=!0}}else F[0]!==e.BACK&&(F[0]=e.BACK,tt=!0);tt&&e.drawBuffers(F)}function Ut(P){return p!==P?(e.useProgram(P),p=P,!0):!1}const qt={[Za]:e.FUNC_ADD,[kE]:e.FUNC_SUBTRACT,[jE]:e.FUNC_REVERSE_SUBTRACT};qt[XE]=e.MIN,qt[WE]=e.MAX;const bt={[qE]:e.ZERO,[YE]:e.ONE,[ZE]:e.SRC_COLOR,[Kh]:e.SRC_ALPHA,[eb]:e.SRC_ALPHA_SATURATE,[$E]:e.DST_COLOR,[QE]:e.DST_ALPHA,[KE]:e.ONE_MINUS_SRC_COLOR,[Qh]:e.ONE_MINUS_SRC_ALPHA,[tb]:e.ONE_MINUS_DST_COLOR,[JE]:e.ONE_MINUS_DST_ALPHA,[nb]:e.CONSTANT_COLOR,[ib]:e.ONE_MINUS_CONSTANT_COLOR,[ab]:e.CONSTANT_ALPHA,[sb]:e.ONE_MINUS_CONSTANT_ALPHA};function D(P,gt,F,tt,ht,dt,Zt,me,$e,te){if(P===Aa){v===!0&&(st(e.BLEND),v=!1);return}if(v===!1&&(lt(e.BLEND),v=!0),P!==VE){if(P!==S||te!==U){if((m!==Za||_!==Za)&&(e.blendEquation(e.FUNC_ADD),m=Za,_=Za),te)switch(P){case hr:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case bo:e.blendFunc(e.ONE,e.ONE);break;case Fg:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case Hg:e.blendFuncSeparate(e.ZERO,e.SRC_COLOR,e.ZERO,e.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",P);break}else switch(P){case hr:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case bo:e.blendFunc(e.SRC_ALPHA,e.ONE);break;case Fg:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case Hg:e.blendFunc(e.ZERO,e.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",P);break}u=null,g=null,y=null,L=null,T.set(0,0,0),R=0,S=P,U=te}return}ht=ht||gt,dt=dt||F,Zt=Zt||tt,(gt!==m||ht!==_)&&(e.blendEquationSeparate(qt[gt],qt[ht]),m=gt,_=ht),(F!==u||tt!==g||dt!==y||Zt!==L)&&(e.blendFuncSeparate(bt[F],bt[tt],bt[dt],bt[Zt]),u=F,g=tt,y=dt,L=Zt),(me.equals(T)===!1||$e!==R)&&(e.blendColor(me.r,me.g,me.b,$e),T.copy(me),R=$e),S=P,U=!1}function Yt(P,gt){P.side===pi?st(e.CULL_FACE):lt(e.CULL_FACE);let F=P.side===yn;gt&&(F=!F),Rt(F),P.blending===hr&&P.transparent===!1?D(Aa):D(P.blending,P.blendEquation,P.blendSrc,P.blendDst,P.blendEquationAlpha,P.blendSrcAlpha,P.blendDstAlpha,P.blendColor,P.blendAlpha,P.premultipliedAlpha),s.setFunc(P.depthFunc),s.setTest(P.depthTest),s.setMask(P.depthWrite),a.setMask(P.colorWrite);const tt=P.stencilWrite;r.setTest(tt),tt&&(r.setMask(P.stencilWriteMask),r.setFunc(P.stencilFunc,P.stencilRef,P.stencilFuncMask),r.setOp(P.stencilFail,P.stencilZFail,P.stencilZPass)),Lt(P.polygonOffset,P.polygonOffsetFactor,P.polygonOffsetUnits),P.alphaToCoverage===!0?lt(e.SAMPLE_ALPHA_TO_COVERAGE):st(e.SAMPLE_ALPHA_TO_COVERAGE)}function Rt(P){X!==P&&(P?e.frontFace(e.CW):e.frontFace(e.CCW),X=P)}function Bt(P){P!==FE?(lt(e.CULL_FACE),P!==x&&(P===Bg?e.cullFace(e.BACK):P===HE?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))):st(e.CULL_FACE),x=P}function Tt(P){P!==E&&(et&&e.lineWidth(P),E=P)}function Lt(P,gt,F){P?(lt(e.POLYGON_OFFSET_FILL),(q!==gt||W!==F)&&(e.polygonOffset(gt,F),q=gt,W=F)):st(e.POLYGON_OFFSET_FILL)}function ct(P){P?lt(e.SCISSOR_TEST):st(e.SCISSOR_TEST)}function w(P){P===void 0&&(P=e.TEXTURE0+J-1),O!==P&&(e.activeTexture(P),O=P)}function M(P,gt,F){F===void 0&&(O===null?F=e.TEXTURE0+J-1:F=O);let tt=nt[F];tt===void 0&&(tt={type:void 0,texture:void 0},nt[F]=tt),(tt.type!==P||tt.texture!==gt)&&(O!==F&&(e.activeTexture(F),O=F),e.bindTexture(P,gt||K[P]),tt.type=P,tt.texture=gt)}function C(){const P=nt[O];P!==void 0&&P.type!==void 0&&(e.bindTexture(P.type,null),P.type=void 0,P.texture=void 0)}function H(){try{e.compressedTexImage2D.apply(e,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function Q(){try{e.compressedTexImage3D.apply(e,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function Y(){try{e.texSubImage2D.apply(e,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function St(){try{e.texSubImage3D.apply(e,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function ot(){try{e.compressedTexSubImage2D.apply(e,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function mt(){try{e.compressedTexSubImage3D.apply(e,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function zt(){try{e.texStorage2D.apply(e,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function at(){try{e.texStorage3D.apply(e,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function ft(){try{e.texImage2D.apply(e,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function wt(){try{e.texImage3D.apply(e,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function Ot(P){yt.equals(P)===!1&&(e.scissor(P.x,P.y,P.z,P.w),yt.copy(P))}function vt(P){Ct.equals(P)===!1&&(e.viewport(P.x,P.y,P.z,P.w),Ct.copy(P))}function Ht(P,gt){let F=l.get(gt);F===void 0&&(F=new WeakMap,l.set(gt,F));let tt=F.get(P);tt===void 0&&(tt=e.getUniformBlockIndex(gt,P.name),F.set(P,tt))}function Gt(P,gt){const tt=l.get(gt).get(P);o.get(gt)!==tt&&(e.uniformBlockBinding(gt,tt,P.__bindingPointIndex),o.set(gt,tt))}function ae(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),c={},O=null,nt={},h={},d=new WeakMap,f=[],p=null,v=!1,S=null,m=null,u=null,g=null,_=null,y=null,L=null,T=new ee(0,0,0),R=0,U=!1,X=null,x=null,E=null,q=null,W=null,yt.set(0,0,e.canvas.width,e.canvas.height),Ct.set(0,0,e.canvas.width,e.canvas.height),a.reset(),s.reset(),r.reset()}return{buffers:{color:a,depth:s,stencil:r},enable:lt,disable:st,bindFramebuffer:xt,drawBuffers:Et,useProgram:Ut,setBlending:D,setMaterial:Yt,setFlipSided:Rt,setCullFace:Bt,setLineWidth:Tt,setPolygonOffset:Lt,setScissorTest:ct,activeTexture:w,bindTexture:M,unbindTexture:C,compressedTexImage2D:H,compressedTexImage3D:Q,texImage2D:ft,texImage3D:wt,updateUBOMapping:Ht,uniformBlockBinding:Gt,texStorage2D:zt,texStorage3D:at,texSubImage2D:Y,texSubImage3D:St,compressedTexSubImage2D:ot,compressedTexSubImage3D:mt,scissor:Ot,viewport:vt,reset:ae}}function D0(e,t,n,i){const a=DR(i);switch(n){case $x:return e*t;case ey:return e*t;case ny:return e*t*2;case iy:return e*t/a.components*a.byteLength;case Wp:return e*t/a.components*a.byteLength;case ay:return e*t*2/a.components*a.byteLength;case qp:return e*t*2/a.components*a.byteLength;case ty:return e*t*3/a.components*a.byteLength;case ui:return e*t*4/a.components*a.byteLength;case Yp:return e*t*4/a.components*a.byteLength;case mc:case gc:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case _c:case vc:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case ud:case hd:return Math.max(e,16)*Math.max(t,8)/4;case cd:case fd:return Math.max(e,8)*Math.max(t,8)/2;case dd:case pd:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case md:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case gd:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case _d:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case vd:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case xd:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case yd:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case Sd:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case Md:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case Ed:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case bd:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case Td:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case Ad:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case Rd:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case wd:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case Cd:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case xc:case Dd:case Nd:return Math.ceil(e/4)*Math.ceil(t/4)*16;case sy:case Ud:return Math.ceil(e/4)*Math.ceil(t/4)*8;case Ld:case Od:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${n} format.`)}function DR(e){switch(e){case Yi:case Kx:return{byteLength:1,components:1};case Fo:case Qx:case Jo:return{byteLength:2,components:1};case jp:case Xp:return{byteLength:2,components:4};case us:case kp:case Bi:return{byteLength:4,components:1};case Jx:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${e}.`)}function NR(e,t,n,i,a,s,r){const o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Vt,h=new WeakMap;let d;const f=new WeakMap;let p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function v(w,M){return p?new OffscreenCanvas(w,M):iu("canvas")}function S(w,M,C){let H=1;const Q=ct(w);if((Q.width>C||Q.height>C)&&(H=C/Math.max(Q.width,Q.height)),H<1)if(typeof HTMLImageElement<"u"&&w instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&w instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&w instanceof ImageBitmap||typeof VideoFrame<"u"&&w instanceof VideoFrame){const Y=Math.floor(H*Q.width),St=Math.floor(H*Q.height);d===void 0&&(d=v(Y,St));const ot=M?v(Y,St):d;return ot.width=Y,ot.height=St,ot.getContext("2d").drawImage(w,0,0,Y,St),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+Q.width+"x"+Q.height+") to ("+Y+"x"+St+")."),ot}else return"data"in w&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+Q.width+"x"+Q.height+")."),w;return w}function m(w){return w.generateMipmaps&&w.minFilter!==Jn&&w.minFilter!==li}function u(w){e.generateMipmap(w)}function g(w,M,C,H,Q=!1){if(w!==null){if(e[w]!==void 0)return e[w];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+w+"'")}let Y=M;if(M===e.RED&&(C===e.FLOAT&&(Y=e.R32F),C===e.HALF_FLOAT&&(Y=e.R16F),C===e.UNSIGNED_BYTE&&(Y=e.R8)),M===e.RED_INTEGER&&(C===e.UNSIGNED_BYTE&&(Y=e.R8UI),C===e.UNSIGNED_SHORT&&(Y=e.R16UI),C===e.UNSIGNED_INT&&(Y=e.R32UI),C===e.BYTE&&(Y=e.R8I),C===e.SHORT&&(Y=e.R16I),C===e.INT&&(Y=e.R32I)),M===e.RG&&(C===e.FLOAT&&(Y=e.RG32F),C===e.HALF_FLOAT&&(Y=e.RG16F),C===e.UNSIGNED_BYTE&&(Y=e.RG8)),M===e.RG_INTEGER&&(C===e.UNSIGNED_BYTE&&(Y=e.RG8UI),C===e.UNSIGNED_SHORT&&(Y=e.RG16UI),C===e.UNSIGNED_INT&&(Y=e.RG32UI),C===e.BYTE&&(Y=e.RG8I),C===e.SHORT&&(Y=e.RG16I),C===e.INT&&(Y=e.RG32I)),M===e.RGB_INTEGER&&(C===e.UNSIGNED_BYTE&&(Y=e.RGB8UI),C===e.UNSIGNED_SHORT&&(Y=e.RGB16UI),C===e.UNSIGNED_INT&&(Y=e.RGB32UI),C===e.BYTE&&(Y=e.RGB8I),C===e.SHORT&&(Y=e.RGB16I),C===e.INT&&(Y=e.RGB32I)),M===e.RGBA_INTEGER&&(C===e.UNSIGNED_BYTE&&(Y=e.RGBA8UI),C===e.UNSIGNED_SHORT&&(Y=e.RGBA16UI),C===e.UNSIGNED_INT&&(Y=e.RGBA32UI),C===e.BYTE&&(Y=e.RGBA8I),C===e.SHORT&&(Y=e.RGBA16I),C===e.INT&&(Y=e.RGBA32I)),M===e.RGB&&C===e.UNSIGNED_INT_5_9_9_9_REV&&(Y=e.RGB9_E5),M===e.RGBA){const St=Q?$c:oe.getTransfer(H);C===e.FLOAT&&(Y=e.RGBA32F),C===e.HALF_FLOAT&&(Y=e.RGBA16F),C===e.UNSIGNED_BYTE&&(Y=St===Se?e.SRGB8_ALPHA8:e.RGBA8),C===e.UNSIGNED_SHORT_4_4_4_4&&(Y=e.RGBA4),C===e.UNSIGNED_SHORT_5_5_5_1&&(Y=e.RGB5_A1)}return(Y===e.R16F||Y===e.R32F||Y===e.RG16F||Y===e.RG32F||Y===e.RGBA16F||Y===e.RGBA32F)&&t.get("EXT_color_buffer_float"),Y}function _(w,M){let C;return w?M===null||M===us||M===Cr?C=e.DEPTH24_STENCIL8:M===Bi?C=e.DEPTH32F_STENCIL8:M===Fo&&(C=e.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):M===null||M===us||M===Cr?C=e.DEPTH_COMPONENT24:M===Bi?C=e.DEPTH_COMPONENT32F:M===Fo&&(C=e.DEPTH_COMPONENT16),C}function y(w,M){return m(w)===!0||w.isFramebufferTexture&&w.minFilter!==Jn&&w.minFilter!==li?Math.log2(Math.max(M.width,M.height))+1:w.mipmaps!==void 0&&w.mipmaps.length>0?w.mipmaps.length:w.isCompressedTexture&&Array.isArray(w.image)?M.mipmaps.length:1}function L(w){const M=w.target;M.removeEventListener("dispose",L),R(M),M.isVideoTexture&&h.delete(M)}function T(w){const M=w.target;M.removeEventListener("dispose",T),X(M)}function R(w){const M=i.get(w);if(M.__webglInit===void 0)return;const C=w.source,H=f.get(C);if(H){const Q=H[M.__cacheKey];Q.usedTimes--,Q.usedTimes===0&&U(w),Object.keys(H).length===0&&f.delete(C)}i.remove(w)}function U(w){const M=i.get(w);e.deleteTexture(M.__webglTexture);const C=w.source,H=f.get(C);delete H[M.__cacheKey],r.memory.textures--}function X(w){const M=i.get(w);if(w.depthTexture&&w.depthTexture.dispose(),w.isWebGLCubeRenderTarget)for(let H=0;H<6;H++){if(Array.isArray(M.__webglFramebuffer[H]))for(let Q=0;Q<M.__webglFramebuffer[H].length;Q++)e.deleteFramebuffer(M.__webglFramebuffer[H][Q]);else e.deleteFramebuffer(M.__webglFramebuffer[H]);M.__webglDepthbuffer&&e.deleteRenderbuffer(M.__webglDepthbuffer[H])}else{if(Array.isArray(M.__webglFramebuffer))for(let H=0;H<M.__webglFramebuffer.length;H++)e.deleteFramebuffer(M.__webglFramebuffer[H]);else e.deleteFramebuffer(M.__webglFramebuffer);if(M.__webglDepthbuffer&&e.deleteRenderbuffer(M.__webglDepthbuffer),M.__webglMultisampledFramebuffer&&e.deleteFramebuffer(M.__webglMultisampledFramebuffer),M.__webglColorRenderbuffer)for(let H=0;H<M.__webglColorRenderbuffer.length;H++)M.__webglColorRenderbuffer[H]&&e.deleteRenderbuffer(M.__webglColorRenderbuffer[H]);M.__webglDepthRenderbuffer&&e.deleteRenderbuffer(M.__webglDepthRenderbuffer)}const C=w.textures;for(let H=0,Q=C.length;H<Q;H++){const Y=i.get(C[H]);Y.__webglTexture&&(e.deleteTexture(Y.__webglTexture),r.memory.textures--),i.remove(C[H])}i.remove(w)}let x=0;function E(){x=0}function q(){const w=x;return w>=a.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+w+" texture units while this GPU supports only "+a.maxTextures),x+=1,w}function W(w){const M=[];return M.push(w.wrapS),M.push(w.wrapT),M.push(w.wrapR||0),M.push(w.magFilter),M.push(w.minFilter),M.push(w.anisotropy),M.push(w.internalFormat),M.push(w.format),M.push(w.type),M.push(w.generateMipmaps),M.push(w.premultiplyAlpha),M.push(w.flipY),M.push(w.unpackAlignment),M.push(w.colorSpace),M.join()}function J(w,M){const C=i.get(w);if(w.isVideoTexture&&Tt(w),w.isRenderTargetTexture===!1&&w.version>0&&C.__version!==w.version){const H=w.image;if(H===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(H.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{Ct(C,w,M);return}}n.bindTexture(e.TEXTURE_2D,C.__webglTexture,e.TEXTURE0+M)}function et(w,M){const C=i.get(w);if(w.version>0&&C.__version!==w.version){Ct(C,w,M);return}n.bindTexture(e.TEXTURE_2D_ARRAY,C.__webglTexture,e.TEXTURE0+M)}function N(w,M){const C=i.get(w);if(w.version>0&&C.__version!==w.version){Ct(C,w,M);return}n.bindTexture(e.TEXTURE_3D,C.__webglTexture,e.TEXTURE0+M)}function G(w,M){const C=i.get(w);if(w.version>0&&C.__version!==w.version){k(C,w,M);return}n.bindTexture(e.TEXTURE_CUBE_MAP,C.__webglTexture,e.TEXTURE0+M)}const O={[od]:e.REPEAT,[Qa]:e.CLAMP_TO_EDGE,[ld]:e.MIRRORED_REPEAT},nt={[Jn]:e.NEAREST,[mb]:e.NEAREST_MIPMAP_NEAREST,[Rl]:e.NEAREST_MIPMAP_LINEAR,[li]:e.LINEAR,[vf]:e.LINEAR_MIPMAP_NEAREST,[Ja]:e.LINEAR_MIPMAP_LINEAR},Z={[xb]:e.NEVER,[Tb]:e.ALWAYS,[yb]:e.LESS,[oy]:e.LEQUAL,[Sb]:e.EQUAL,[bb]:e.GEQUAL,[Mb]:e.GREATER,[Eb]:e.NOTEQUAL};function it(w,M){if(M.type===Bi&&t.has("OES_texture_float_linear")===!1&&(M.magFilter===li||M.magFilter===vf||M.magFilter===Rl||M.magFilter===Ja||M.minFilter===li||M.minFilter===vf||M.minFilter===Rl||M.minFilter===Ja)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),e.texParameteri(w,e.TEXTURE_WRAP_S,O[M.wrapS]),e.texParameteri(w,e.TEXTURE_WRAP_T,O[M.wrapT]),(w===e.TEXTURE_3D||w===e.TEXTURE_2D_ARRAY)&&e.texParameteri(w,e.TEXTURE_WRAP_R,O[M.wrapR]),e.texParameteri(w,e.TEXTURE_MAG_FILTER,nt[M.magFilter]),e.texParameteri(w,e.TEXTURE_MIN_FILTER,nt[M.minFilter]),M.compareFunction&&(e.texParameteri(w,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(w,e.TEXTURE_COMPARE_FUNC,Z[M.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(M.magFilter===Jn||M.minFilter!==Rl&&M.minFilter!==Ja||M.type===Bi&&t.has("OES_texture_float_linear")===!1)return;if(M.anisotropy>1||i.get(M).__currentAnisotropy){const C=t.get("EXT_texture_filter_anisotropic");e.texParameterf(w,C.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(M.anisotropy,a.getMaxAnisotropy())),i.get(M).__currentAnisotropy=M.anisotropy}}}function yt(w,M){let C=!1;w.__webglInit===void 0&&(w.__webglInit=!0,M.addEventListener("dispose",L));const H=M.source;let Q=f.get(H);Q===void 0&&(Q={},f.set(H,Q));const Y=W(M);if(Y!==w.__cacheKey){Q[Y]===void 0&&(Q[Y]={texture:e.createTexture(),usedTimes:0},r.memory.textures++,C=!0),Q[Y].usedTimes++;const St=Q[w.__cacheKey];St!==void 0&&(Q[w.__cacheKey].usedTimes--,St.usedTimes===0&&U(M)),w.__cacheKey=Y,w.__webglTexture=Q[Y].texture}return C}function Ct(w,M,C){let H=e.TEXTURE_2D;(M.isDataArrayTexture||M.isCompressedArrayTexture)&&(H=e.TEXTURE_2D_ARRAY),M.isData3DTexture&&(H=e.TEXTURE_3D);const Q=yt(w,M),Y=M.source;n.bindTexture(H,w.__webglTexture,e.TEXTURE0+C);const St=i.get(Y);if(Y.version!==St.__version||Q===!0){n.activeTexture(e.TEXTURE0+C);const ot=oe.getPrimaries(oe.workingColorSpace),mt=M.colorSpace===fa?null:oe.getPrimaries(M.colorSpace),zt=M.colorSpace===fa||ot===mt?e.NONE:e.BROWSER_DEFAULT_WEBGL;e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,M.flipY),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),e.pixelStorei(e.UNPACK_ALIGNMENT,M.unpackAlignment),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,zt);let at=S(M.image,!1,a.maxTextureSize);at=Lt(M,at);const ft=s.convert(M.format,M.colorSpace),wt=s.convert(M.type);let Ot=g(M.internalFormat,ft,wt,M.colorSpace,M.isVideoTexture);it(H,M);let vt;const Ht=M.mipmaps,Gt=M.isVideoTexture!==!0,ae=St.__version===void 0||Q===!0,P=Y.dataReady,gt=y(M,at);if(M.isDepthTexture)Ot=_(M.format===Dr,M.type),ae&&(Gt?n.texStorage2D(e.TEXTURE_2D,1,Ot,at.width,at.height):n.texImage2D(e.TEXTURE_2D,0,Ot,at.width,at.height,0,ft,wt,null));else if(M.isDataTexture)if(Ht.length>0){Gt&&ae&&n.texStorage2D(e.TEXTURE_2D,gt,Ot,Ht[0].width,Ht[0].height);for(let F=0,tt=Ht.length;F<tt;F++)vt=Ht[F],Gt?P&&n.texSubImage2D(e.TEXTURE_2D,F,0,0,vt.width,vt.height,ft,wt,vt.data):n.texImage2D(e.TEXTURE_2D,F,Ot,vt.width,vt.height,0,ft,wt,vt.data);M.generateMipmaps=!1}else Gt?(ae&&n.texStorage2D(e.TEXTURE_2D,gt,Ot,at.width,at.height),P&&n.texSubImage2D(e.TEXTURE_2D,0,0,0,at.width,at.height,ft,wt,at.data)):n.texImage2D(e.TEXTURE_2D,0,Ot,at.width,at.height,0,ft,wt,at.data);else if(M.isCompressedTexture)if(M.isCompressedArrayTexture){Gt&&ae&&n.texStorage3D(e.TEXTURE_2D_ARRAY,gt,Ot,Ht[0].width,Ht[0].height,at.depth);for(let F=0,tt=Ht.length;F<tt;F++)if(vt=Ht[F],M.format!==ui)if(ft!==null)if(Gt){if(P)if(M.layerUpdates.size>0){const ht=D0(vt.width,vt.height,M.format,M.type);for(const dt of M.layerUpdates){const Zt=vt.data.subarray(dt*ht/vt.data.BYTES_PER_ELEMENT,(dt+1)*ht/vt.data.BYTES_PER_ELEMENT);n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,F,0,0,dt,vt.width,vt.height,1,ft,Zt,0,0)}M.clearLayerUpdates()}else n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,F,0,0,0,vt.width,vt.height,at.depth,ft,vt.data,0,0)}else n.compressedTexImage3D(e.TEXTURE_2D_ARRAY,F,Ot,vt.width,vt.height,at.depth,0,vt.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Gt?P&&n.texSubImage3D(e.TEXTURE_2D_ARRAY,F,0,0,0,vt.width,vt.height,at.depth,ft,wt,vt.data):n.texImage3D(e.TEXTURE_2D_ARRAY,F,Ot,vt.width,vt.height,at.depth,0,ft,wt,vt.data)}else{Gt&&ae&&n.texStorage2D(e.TEXTURE_2D,gt,Ot,Ht[0].width,Ht[0].height);for(let F=0,tt=Ht.length;F<tt;F++)vt=Ht[F],M.format!==ui?ft!==null?Gt?P&&n.compressedTexSubImage2D(e.TEXTURE_2D,F,0,0,vt.width,vt.height,ft,vt.data):n.compressedTexImage2D(e.TEXTURE_2D,F,Ot,vt.width,vt.height,0,vt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Gt?P&&n.texSubImage2D(e.TEXTURE_2D,F,0,0,vt.width,vt.height,ft,wt,vt.data):n.texImage2D(e.TEXTURE_2D,F,Ot,vt.width,vt.height,0,ft,wt,vt.data)}else if(M.isDataArrayTexture)if(Gt){if(ae&&n.texStorage3D(e.TEXTURE_2D_ARRAY,gt,Ot,at.width,at.height,at.depth),P)if(M.layerUpdates.size>0){const F=D0(at.width,at.height,M.format,M.type);for(const tt of M.layerUpdates){const ht=at.data.subarray(tt*F/at.data.BYTES_PER_ELEMENT,(tt+1)*F/at.data.BYTES_PER_ELEMENT);n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,tt,at.width,at.height,1,ft,wt,ht)}M.clearLayerUpdates()}else n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,at.width,at.height,at.depth,ft,wt,at.data)}else n.texImage3D(e.TEXTURE_2D_ARRAY,0,Ot,at.width,at.height,at.depth,0,ft,wt,at.data);else if(M.isData3DTexture)Gt?(ae&&n.texStorage3D(e.TEXTURE_3D,gt,Ot,at.width,at.height,at.depth),P&&n.texSubImage3D(e.TEXTURE_3D,0,0,0,0,at.width,at.height,at.depth,ft,wt,at.data)):n.texImage3D(e.TEXTURE_3D,0,Ot,at.width,at.height,at.depth,0,ft,wt,at.data);else if(M.isFramebufferTexture){if(ae)if(Gt)n.texStorage2D(e.TEXTURE_2D,gt,Ot,at.width,at.height);else{let F=at.width,tt=at.height;for(let ht=0;ht<gt;ht++)n.texImage2D(e.TEXTURE_2D,ht,Ot,F,tt,0,ft,wt,null),F>>=1,tt>>=1}}else if(Ht.length>0){if(Gt&&ae){const F=ct(Ht[0]);n.texStorage2D(e.TEXTURE_2D,gt,Ot,F.width,F.height)}for(let F=0,tt=Ht.length;F<tt;F++)vt=Ht[F],Gt?P&&n.texSubImage2D(e.TEXTURE_2D,F,0,0,ft,wt,vt):n.texImage2D(e.TEXTURE_2D,F,Ot,ft,wt,vt);M.generateMipmaps=!1}else if(Gt){if(ae){const F=ct(at);n.texStorage2D(e.TEXTURE_2D,gt,Ot,F.width,F.height)}P&&n.texSubImage2D(e.TEXTURE_2D,0,0,0,ft,wt,at)}else n.texImage2D(e.TEXTURE_2D,0,Ot,ft,wt,at);m(M)&&u(H),St.__version=Y.version,M.onUpdate&&M.onUpdate(M)}w.__version=M.version}function k(w,M,C){if(M.image.length!==6)return;const H=yt(w,M),Q=M.source;n.bindTexture(e.TEXTURE_CUBE_MAP,w.__webglTexture,e.TEXTURE0+C);const Y=i.get(Q);if(Q.version!==Y.__version||H===!0){n.activeTexture(e.TEXTURE0+C);const St=oe.getPrimaries(oe.workingColorSpace),ot=M.colorSpace===fa?null:oe.getPrimaries(M.colorSpace),mt=M.colorSpace===fa||St===ot?e.NONE:e.BROWSER_DEFAULT_WEBGL;e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,M.flipY),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),e.pixelStorei(e.UNPACK_ALIGNMENT,M.unpackAlignment),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,mt);const zt=M.isCompressedTexture||M.image[0].isCompressedTexture,at=M.image[0]&&M.image[0].isDataTexture,ft=[];for(let tt=0;tt<6;tt++)!zt&&!at?ft[tt]=S(M.image[tt],!0,a.maxCubemapSize):ft[tt]=at?M.image[tt].image:M.image[tt],ft[tt]=Lt(M,ft[tt]);const wt=ft[0],Ot=s.convert(M.format,M.colorSpace),vt=s.convert(M.type),Ht=g(M.internalFormat,Ot,vt,M.colorSpace),Gt=M.isVideoTexture!==!0,ae=Y.__version===void 0||H===!0,P=Q.dataReady;let gt=y(M,wt);it(e.TEXTURE_CUBE_MAP,M);let F;if(zt){Gt&&ae&&n.texStorage2D(e.TEXTURE_CUBE_MAP,gt,Ht,wt.width,wt.height);for(let tt=0;tt<6;tt++){F=ft[tt].mipmaps;for(let ht=0;ht<F.length;ht++){const dt=F[ht];M.format!==ui?Ot!==null?Gt?P&&n.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+tt,ht,0,0,dt.width,dt.height,Ot,dt.data):n.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+tt,ht,Ht,dt.width,dt.height,0,dt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Gt?P&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+tt,ht,0,0,dt.width,dt.height,Ot,vt,dt.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+tt,ht,Ht,dt.width,dt.height,0,Ot,vt,dt.data)}}}else{if(F=M.mipmaps,Gt&&ae){F.length>0&&gt++;const tt=ct(ft[0]);n.texStorage2D(e.TEXTURE_CUBE_MAP,gt,Ht,tt.width,tt.height)}for(let tt=0;tt<6;tt++)if(at){Gt?P&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+tt,0,0,0,ft[tt].width,ft[tt].height,Ot,vt,ft[tt].data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+tt,0,Ht,ft[tt].width,ft[tt].height,0,Ot,vt,ft[tt].data);for(let ht=0;ht<F.length;ht++){const Zt=F[ht].image[tt].image;Gt?P&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+tt,ht+1,0,0,Zt.width,Zt.height,Ot,vt,Zt.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+tt,ht+1,Ht,Zt.width,Zt.height,0,Ot,vt,Zt.data)}}else{Gt?P&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+tt,0,0,0,Ot,vt,ft[tt]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+tt,0,Ht,Ot,vt,ft[tt]);for(let ht=0;ht<F.length;ht++){const dt=F[ht];Gt?P&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+tt,ht+1,0,0,Ot,vt,dt.image[tt]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+tt,ht+1,Ht,Ot,vt,dt.image[tt])}}}m(M)&&u(e.TEXTURE_CUBE_MAP),Y.__version=Q.version,M.onUpdate&&M.onUpdate(M)}w.__version=M.version}function K(w,M,C,H,Q,Y){const St=s.convert(C.format,C.colorSpace),ot=s.convert(C.type),mt=g(C.internalFormat,St,ot,C.colorSpace);if(!i.get(M).__hasExternalTextures){const at=Math.max(1,M.width>>Y),ft=Math.max(1,M.height>>Y);Q===e.TEXTURE_3D||Q===e.TEXTURE_2D_ARRAY?n.texImage3D(Q,Y,mt,at,ft,M.depth,0,St,ot,null):n.texImage2D(Q,Y,mt,at,ft,0,St,ot,null)}n.bindFramebuffer(e.FRAMEBUFFER,w),Bt(M)?o.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,H,Q,i.get(C).__webglTexture,0,Rt(M)):(Q===e.TEXTURE_2D||Q>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&Q<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,H,Q,i.get(C).__webglTexture,Y),n.bindFramebuffer(e.FRAMEBUFFER,null)}function lt(w,M,C){if(e.bindRenderbuffer(e.RENDERBUFFER,w),M.depthBuffer){const H=M.depthTexture,Q=H&&H.isDepthTexture?H.type:null,Y=_(M.stencilBuffer,Q),St=M.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,ot=Rt(M);Bt(M)?o.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,ot,Y,M.width,M.height):C?e.renderbufferStorageMultisample(e.RENDERBUFFER,ot,Y,M.width,M.height):e.renderbufferStorage(e.RENDERBUFFER,Y,M.width,M.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,St,e.RENDERBUFFER,w)}else{const H=M.textures;for(let Q=0;Q<H.length;Q++){const Y=H[Q],St=s.convert(Y.format,Y.colorSpace),ot=s.convert(Y.type),mt=g(Y.internalFormat,St,ot,Y.colorSpace),zt=Rt(M);C&&Bt(M)===!1?e.renderbufferStorageMultisample(e.RENDERBUFFER,zt,mt,M.width,M.height):Bt(M)?o.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,zt,mt,M.width,M.height):e.renderbufferStorage(e.RENDERBUFFER,mt,M.width,M.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function st(w,M){if(M&&M.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(n.bindFramebuffer(e.FRAMEBUFFER,w),!(M.depthTexture&&M.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!i.get(M.depthTexture).__webglTexture||M.depthTexture.image.width!==M.width||M.depthTexture.image.height!==M.height)&&(M.depthTexture.image.width=M.width,M.depthTexture.image.height=M.height,M.depthTexture.needsUpdate=!0),J(M.depthTexture,0);const H=i.get(M.depthTexture).__webglTexture,Q=Rt(M);if(M.depthTexture.format===dr)Bt(M)?o.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,e.DEPTH_ATTACHMENT,e.TEXTURE_2D,H,0,Q):e.framebufferTexture2D(e.FRAMEBUFFER,e.DEPTH_ATTACHMENT,e.TEXTURE_2D,H,0);else if(M.depthTexture.format===Dr)Bt(M)?o.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,e.DEPTH_STENCIL_ATTACHMENT,e.TEXTURE_2D,H,0,Q):e.framebufferTexture2D(e.FRAMEBUFFER,e.DEPTH_STENCIL_ATTACHMENT,e.TEXTURE_2D,H,0);else throw new Error("Unknown depthTexture format")}function xt(w){const M=i.get(w),C=w.isWebGLCubeRenderTarget===!0;if(M.__boundDepthTexture!==w.depthTexture){const H=w.depthTexture;if(M.__depthDisposeCallback&&M.__depthDisposeCallback(),H){const Q=()=>{delete M.__boundDepthTexture,delete M.__depthDisposeCallback,H.removeEventListener("dispose",Q)};H.addEventListener("dispose",Q),M.__depthDisposeCallback=Q}M.__boundDepthTexture=H}if(w.depthTexture&&!M.__autoAllocateDepthBuffer){if(C)throw new Error("target.depthTexture not supported in Cube render targets");st(M.__webglFramebuffer,w)}else if(C){M.__webglDepthbuffer=[];for(let H=0;H<6;H++)if(n.bindFramebuffer(e.FRAMEBUFFER,M.__webglFramebuffer[H]),M.__webglDepthbuffer[H]===void 0)M.__webglDepthbuffer[H]=e.createRenderbuffer(),lt(M.__webglDepthbuffer[H],w,!1);else{const Q=w.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,Y=M.__webglDepthbuffer[H];e.bindRenderbuffer(e.RENDERBUFFER,Y),e.framebufferRenderbuffer(e.FRAMEBUFFER,Q,e.RENDERBUFFER,Y)}}else if(n.bindFramebuffer(e.FRAMEBUFFER,M.__webglFramebuffer),M.__webglDepthbuffer===void 0)M.__webglDepthbuffer=e.createRenderbuffer(),lt(M.__webglDepthbuffer,w,!1);else{const H=w.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,Q=M.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,Q),e.framebufferRenderbuffer(e.FRAMEBUFFER,H,e.RENDERBUFFER,Q)}n.bindFramebuffer(e.FRAMEBUFFER,null)}function Et(w,M,C){const H=i.get(w);M!==void 0&&K(H.__webglFramebuffer,w,w.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),C!==void 0&&xt(w)}function Ut(w){const M=w.texture,C=i.get(w),H=i.get(M);w.addEventListener("dispose",T);const Q=w.textures,Y=w.isWebGLCubeRenderTarget===!0,St=Q.length>1;if(St||(H.__webglTexture===void 0&&(H.__webglTexture=e.createTexture()),H.__version=M.version,r.memory.textures++),Y){C.__webglFramebuffer=[];for(let ot=0;ot<6;ot++)if(M.mipmaps&&M.mipmaps.length>0){C.__webglFramebuffer[ot]=[];for(let mt=0;mt<M.mipmaps.length;mt++)C.__webglFramebuffer[ot][mt]=e.createFramebuffer()}else C.__webglFramebuffer[ot]=e.createFramebuffer()}else{if(M.mipmaps&&M.mipmaps.length>0){C.__webglFramebuffer=[];for(let ot=0;ot<M.mipmaps.length;ot++)C.__webglFramebuffer[ot]=e.createFramebuffer()}else C.__webglFramebuffer=e.createFramebuffer();if(St)for(let ot=0,mt=Q.length;ot<mt;ot++){const zt=i.get(Q[ot]);zt.__webglTexture===void 0&&(zt.__webglTexture=e.createTexture(),r.memory.textures++)}if(w.samples>0&&Bt(w)===!1){C.__webglMultisampledFramebuffer=e.createFramebuffer(),C.__webglColorRenderbuffer=[],n.bindFramebuffer(e.FRAMEBUFFER,C.__webglMultisampledFramebuffer);for(let ot=0;ot<Q.length;ot++){const mt=Q[ot];C.__webglColorRenderbuffer[ot]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,C.__webglColorRenderbuffer[ot]);const zt=s.convert(mt.format,mt.colorSpace),at=s.convert(mt.type),ft=g(mt.internalFormat,zt,at,mt.colorSpace,w.isXRRenderTarget===!0),wt=Rt(w);e.renderbufferStorageMultisample(e.RENDERBUFFER,wt,ft,w.width,w.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+ot,e.RENDERBUFFER,C.__webglColorRenderbuffer[ot])}e.bindRenderbuffer(e.RENDERBUFFER,null),w.depthBuffer&&(C.__webglDepthRenderbuffer=e.createRenderbuffer(),lt(C.__webglDepthRenderbuffer,w,!0)),n.bindFramebuffer(e.FRAMEBUFFER,null)}}if(Y){n.bindTexture(e.TEXTURE_CUBE_MAP,H.__webglTexture),it(e.TEXTURE_CUBE_MAP,M);for(let ot=0;ot<6;ot++)if(M.mipmaps&&M.mipmaps.length>0)for(let mt=0;mt<M.mipmaps.length;mt++)K(C.__webglFramebuffer[ot][mt],w,M,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+ot,mt);else K(C.__webglFramebuffer[ot],w,M,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+ot,0);m(M)&&u(e.TEXTURE_CUBE_MAP),n.unbindTexture()}else if(St){for(let ot=0,mt=Q.length;ot<mt;ot++){const zt=Q[ot],at=i.get(zt);n.bindTexture(e.TEXTURE_2D,at.__webglTexture),it(e.TEXTURE_2D,zt),K(C.__webglFramebuffer,w,zt,e.COLOR_ATTACHMENT0+ot,e.TEXTURE_2D,0),m(zt)&&u(e.TEXTURE_2D)}n.unbindTexture()}else{let ot=e.TEXTURE_2D;if((w.isWebGL3DRenderTarget||w.isWebGLArrayRenderTarget)&&(ot=w.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(ot,H.__webglTexture),it(ot,M),M.mipmaps&&M.mipmaps.length>0)for(let mt=0;mt<M.mipmaps.length;mt++)K(C.__webglFramebuffer[mt],w,M,e.COLOR_ATTACHMENT0,ot,mt);else K(C.__webglFramebuffer,w,M,e.COLOR_ATTACHMENT0,ot,0);m(M)&&u(ot),n.unbindTexture()}w.depthBuffer&&xt(w)}function qt(w){const M=w.textures;for(let C=0,H=M.length;C<H;C++){const Q=M[C];if(m(Q)){const Y=w.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:e.TEXTURE_2D,St=i.get(Q).__webglTexture;n.bindTexture(Y,St),u(Y),n.unbindTexture()}}}const bt=[],D=[];function Yt(w){if(w.samples>0){if(Bt(w)===!1){const M=w.textures,C=w.width,H=w.height;let Q=e.COLOR_BUFFER_BIT;const Y=w.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,St=i.get(w),ot=M.length>1;if(ot)for(let mt=0;mt<M.length;mt++)n.bindFramebuffer(e.FRAMEBUFFER,St.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+mt,e.RENDERBUFFER,null),n.bindFramebuffer(e.FRAMEBUFFER,St.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+mt,e.TEXTURE_2D,null,0);n.bindFramebuffer(e.READ_FRAMEBUFFER,St.__webglMultisampledFramebuffer),n.bindFramebuffer(e.DRAW_FRAMEBUFFER,St.__webglFramebuffer);for(let mt=0;mt<M.length;mt++){if(w.resolveDepthBuffer&&(w.depthBuffer&&(Q|=e.DEPTH_BUFFER_BIT),w.stencilBuffer&&w.resolveStencilBuffer&&(Q|=e.STENCIL_BUFFER_BIT)),ot){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,St.__webglColorRenderbuffer[mt]);const zt=i.get(M[mt]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,zt,0)}e.blitFramebuffer(0,0,C,H,0,0,C,H,Q,e.NEAREST),l===!0&&(bt.length=0,D.length=0,bt.push(e.COLOR_ATTACHMENT0+mt),w.depthBuffer&&w.resolveDepthBuffer===!1&&(bt.push(Y),D.push(Y),e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,D)),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,bt))}if(n.bindFramebuffer(e.READ_FRAMEBUFFER,null),n.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),ot)for(let mt=0;mt<M.length;mt++){n.bindFramebuffer(e.FRAMEBUFFER,St.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+mt,e.RENDERBUFFER,St.__webglColorRenderbuffer[mt]);const zt=i.get(M[mt]).__webglTexture;n.bindFramebuffer(e.FRAMEBUFFER,St.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+mt,e.TEXTURE_2D,zt,0)}n.bindFramebuffer(e.DRAW_FRAMEBUFFER,St.__webglMultisampledFramebuffer)}else if(w.depthBuffer&&w.resolveDepthBuffer===!1&&l){const M=w.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[M])}}}function Rt(w){return Math.min(a.maxSamples,w.samples)}function Bt(w){const M=i.get(w);return w.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&M.__useRenderToTexture!==!1}function Tt(w){const M=r.render.frame;h.get(w)!==M&&(h.set(w,M),w.update())}function Lt(w,M){const C=w.colorSpace,H=w.format,Q=w.type;return w.isCompressedTexture===!0||w.isVideoTexture===!0||C!==za&&C!==fa&&(oe.getTransfer(C)===Se?(H!==ui||Q!==Yi)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",C)),M}function ct(w){return typeof HTMLImageElement<"u"&&w instanceof HTMLImageElement?(c.width=w.naturalWidth||w.width,c.height=w.naturalHeight||w.height):typeof VideoFrame<"u"&&w instanceof VideoFrame?(c.width=w.displayWidth,c.height=w.displayHeight):(c.width=w.width,c.height=w.height),c}this.allocateTextureUnit=q,this.resetTextureUnits=E,this.setTexture2D=J,this.setTexture2DArray=et,this.setTexture3D=N,this.setTextureCube=G,this.rebindTextures=Et,this.setupRenderTarget=Ut,this.updateRenderTargetMipmap=qt,this.updateMultisampleRenderTarget=Yt,this.setupDepthRenderbuffer=xt,this.setupFrameBufferTexture=K,this.useMultisampledRTT=Bt}function UR(e,t){function n(i,a=fa){let s;const r=oe.getTransfer(a);if(i===Yi)return e.UNSIGNED_BYTE;if(i===jp)return e.UNSIGNED_SHORT_4_4_4_4;if(i===Xp)return e.UNSIGNED_SHORT_5_5_5_1;if(i===Jx)return e.UNSIGNED_INT_5_9_9_9_REV;if(i===Kx)return e.BYTE;if(i===Qx)return e.SHORT;if(i===Fo)return e.UNSIGNED_SHORT;if(i===kp)return e.INT;if(i===us)return e.UNSIGNED_INT;if(i===Bi)return e.FLOAT;if(i===Jo)return e.HALF_FLOAT;if(i===$x)return e.ALPHA;if(i===ty)return e.RGB;if(i===ui)return e.RGBA;if(i===ey)return e.LUMINANCE;if(i===ny)return e.LUMINANCE_ALPHA;if(i===dr)return e.DEPTH_COMPONENT;if(i===Dr)return e.DEPTH_STENCIL;if(i===iy)return e.RED;if(i===Wp)return e.RED_INTEGER;if(i===ay)return e.RG;if(i===qp)return e.RG_INTEGER;if(i===Yp)return e.RGBA_INTEGER;if(i===mc||i===gc||i===_c||i===vc)if(r===Se)if(s=t.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(i===mc)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===gc)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===_c)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===vc)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=t.get("WEBGL_compressed_texture_s3tc"),s!==null){if(i===mc)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===gc)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===_c)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===vc)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===cd||i===ud||i===fd||i===hd)if(s=t.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(i===cd)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===ud)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===fd)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===hd)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===dd||i===pd||i===md)if(s=t.get("WEBGL_compressed_texture_etc"),s!==null){if(i===dd||i===pd)return r===Se?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(i===md)return r===Se?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(i===gd||i===_d||i===vd||i===xd||i===yd||i===Sd||i===Md||i===Ed||i===bd||i===Td||i===Ad||i===Rd||i===wd||i===Cd)if(s=t.get("WEBGL_compressed_texture_astc"),s!==null){if(i===gd)return r===Se?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===_d)return r===Se?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===vd)return r===Se?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===xd)return r===Se?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===yd)return r===Se?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===Sd)return r===Se?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===Md)return r===Se?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Ed)return r===Se?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===bd)return r===Se?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===Td)return r===Se?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===Ad)return r===Se?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===Rd)return r===Se?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===wd)return r===Se?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===Cd)return r===Se?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===xc||i===Dd||i===Nd)if(s=t.get("EXT_texture_compression_bptc"),s!==null){if(i===xc)return r===Se?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Dd)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Nd)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===sy||i===Ud||i===Ld||i===Od)if(s=t.get("EXT_texture_compression_rgtc"),s!==null){if(i===xc)return s.COMPRESSED_RED_RGTC1_EXT;if(i===Ud)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Ld)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Od)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===Cr?e.UNSIGNED_INT_24_8:e[i]!==void 0?e[i]:null}return{convert:n}}class LR extends Un{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}}class Yl extends an{constructor(){super(),this.isGroup=!0,this.type="Group"}}const OR={type:"move"};class qf{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Yl,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Yl,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new I,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new I),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Yl,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new I,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new I),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const n=this._hand;if(n)for(const i of t.hand.values())this._getHandJoint(n,i)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,n,i){let a=null,s=null,r=null;const o=this._targetRay,l=this._grip,c=this._hand;if(t&&n.session.visibilityState!=="visible-blurred"){if(c&&t.hand){r=!0;for(const S of t.hand.values()){const m=n.getJointPose(S,i),u=this._getHandJoint(c,S);m!==null&&(u.matrix.fromArray(m.transform.matrix),u.matrix.decompose(u.position,u.rotation,u.scale),u.matrixWorldNeedsUpdate=!0,u.jointRadius=m.radius),u.visible=m!==null}const h=c.joints["index-finger-tip"],d=c.joints["thumb-tip"],f=h.position.distanceTo(d.position),p=.02,v=.005;c.inputState.pinching&&f>p+v?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&f<=p-v&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(s=n.getPose(t.gripSpace,i),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(a=n.getPose(t.targetRaySpace,i),a===null&&s!==null&&(a=s),a!==null&&(o.matrix.fromArray(a.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,a.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(a.linearVelocity)):o.hasLinearVelocity=!1,a.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(a.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(OR)))}return o!==null&&(o.visible=a!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=r!==null),this}_getHandJoint(t,n){if(t.joints[n.jointName]===void 0){const i=new Yl;i.matrixAutoUpdate=!1,i.visible=!1,t.joints[n.jointName]=i,t.add(i)}return t.joints[n.jointName]}}const PR=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,zR=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class IR{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,n,i){if(this.texture===null){const a=new Sn,s=t.properties.get(a);s.__webglTexture=n.texture,(n.depthNear!=i.depthNear||n.depthFar!=i.depthFar)&&(this.depthNear=n.depthNear,this.depthFar=n.depthFar),this.texture=a}}getMesh(t){if(this.texture!==null&&this.mesh===null){const n=t.cameras[0].viewport,i=new La({vertexShader:PR,fragmentShader:zR,uniforms:{depthColor:{value:this.texture},depthWidth:{value:n.z},depthHeight:{value:n.w}}});this.mesh=new vn(new wu(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class BR extends vs{constructor(t,n){super();const i=this;let a=null,s=1,r=null,o="local-floor",l=1,c=null,h=null,d=null,f=null,p=null,v=null;const S=new IR,m=n.getContextAttributes();let u=null,g=null;const _=[],y=[],L=new Vt;let T=null;const R=new Un;R.layers.enable(1),R.viewport=new pe;const U=new Un;U.layers.enable(2),U.viewport=new pe;const X=[R,U],x=new LR;x.layers.enable(1),x.layers.enable(2);let E=null,q=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(k){let K=_[k];return K===void 0&&(K=new qf,_[k]=K),K.getTargetRaySpace()},this.getControllerGrip=function(k){let K=_[k];return K===void 0&&(K=new qf,_[k]=K),K.getGripSpace()},this.getHand=function(k){let K=_[k];return K===void 0&&(K=new qf,_[k]=K),K.getHandSpace()};function W(k){const K=y.indexOf(k.inputSource);if(K===-1)return;const lt=_[K];lt!==void 0&&(lt.update(k.inputSource,k.frame,c||r),lt.dispatchEvent({type:k.type,data:k.inputSource}))}function J(){a.removeEventListener("select",W),a.removeEventListener("selectstart",W),a.removeEventListener("selectend",W),a.removeEventListener("squeeze",W),a.removeEventListener("squeezestart",W),a.removeEventListener("squeezeend",W),a.removeEventListener("end",J),a.removeEventListener("inputsourceschange",et);for(let k=0;k<_.length;k++){const K=y[k];K!==null&&(y[k]=null,_[k].disconnect(K))}E=null,q=null,S.reset(),t.setRenderTarget(u),p=null,f=null,d=null,a=null,g=null,Ct.stop(),i.isPresenting=!1,t.setPixelRatio(T),t.setSize(L.width,L.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(k){s=k,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(k){o=k,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||r},this.setReferenceSpace=function(k){c=k},this.getBaseLayer=function(){return f!==null?f:p},this.getBinding=function(){return d},this.getFrame=function(){return v},this.getSession=function(){return a},this.setSession=async function(k){if(a=k,a!==null){if(u=t.getRenderTarget(),a.addEventListener("select",W),a.addEventListener("selectstart",W),a.addEventListener("selectend",W),a.addEventListener("squeeze",W),a.addEventListener("squeezestart",W),a.addEventListener("squeezeend",W),a.addEventListener("end",J),a.addEventListener("inputsourceschange",et),m.xrCompatible!==!0&&await n.makeXRCompatible(),T=t.getPixelRatio(),t.getSize(L),a.renderState.layers===void 0){const K={antialias:m.antialias,alpha:!0,depth:m.depth,stencil:m.stencil,framebufferScaleFactor:s};p=new XRWebGLLayer(a,n,K),a.updateRenderState({baseLayer:p}),t.setPixelRatio(1),t.setSize(p.framebufferWidth,p.framebufferHeight,!1),g=new fs(p.framebufferWidth,p.framebufferHeight,{format:ui,type:Yi,colorSpace:t.outputColorSpace,stencilBuffer:m.stencil})}else{let K=null,lt=null,st=null;m.depth&&(st=m.stencil?n.DEPTH24_STENCIL8:n.DEPTH_COMPONENT24,K=m.stencil?Dr:dr,lt=m.stencil?Cr:us);const xt={colorFormat:n.RGBA8,depthFormat:st,scaleFactor:s};d=new XRWebGLBinding(a,n),f=d.createProjectionLayer(xt),a.updateRenderState({layers:[f]}),t.setPixelRatio(1),t.setSize(f.textureWidth,f.textureHeight,!1),g=new fs(f.textureWidth,f.textureHeight,{format:ui,type:Yi,depthTexture:new vy(f.textureWidth,f.textureHeight,lt,void 0,void 0,void 0,void 0,void 0,void 0,K),stencilBuffer:m.stencil,colorSpace:t.outputColorSpace,samples:m.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1})}g.isXRRenderTarget=!0,this.setFoveation(l),c=null,r=await a.requestReferenceSpace(o),Ct.setContext(a),Ct.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(a!==null)return a.environmentBlendMode},this.getDepthTexture=function(){return S.getDepthTexture()};function et(k){for(let K=0;K<k.removed.length;K++){const lt=k.removed[K],st=y.indexOf(lt);st>=0&&(y[st]=null,_[st].disconnect(lt))}for(let K=0;K<k.added.length;K++){const lt=k.added[K];let st=y.indexOf(lt);if(st===-1){for(let Et=0;Et<_.length;Et++)if(Et>=y.length){y.push(lt),st=Et;break}else if(y[Et]===null){y[Et]=lt,st=Et;break}if(st===-1)break}const xt=_[st];xt&&xt.connect(lt)}}const N=new I,G=new I;function O(k,K,lt){N.setFromMatrixPosition(K.matrixWorld),G.setFromMatrixPosition(lt.matrixWorld);const st=N.distanceTo(G),xt=K.projectionMatrix.elements,Et=lt.projectionMatrix.elements,Ut=xt[14]/(xt[10]-1),qt=xt[14]/(xt[10]+1),bt=(xt[9]+1)/xt[5],D=(xt[9]-1)/xt[5],Yt=(xt[8]-1)/xt[0],Rt=(Et[8]+1)/Et[0],Bt=Ut*Yt,Tt=Ut*Rt,Lt=st/(-Yt+Rt),ct=Lt*-Yt;if(K.matrixWorld.decompose(k.position,k.quaternion,k.scale),k.translateX(ct),k.translateZ(Lt),k.matrixWorld.compose(k.position,k.quaternion,k.scale),k.matrixWorldInverse.copy(k.matrixWorld).invert(),xt[10]===-1)k.projectionMatrix.copy(K.projectionMatrix),k.projectionMatrixInverse.copy(K.projectionMatrixInverse);else{const w=Ut+Lt,M=qt+Lt,C=Bt-ct,H=Tt+(st-ct),Q=bt*qt/M*w,Y=D*qt/M*w;k.projectionMatrix.makePerspective(C,H,Q,Y,w,M),k.projectionMatrixInverse.copy(k.projectionMatrix).invert()}}function nt(k,K){K===null?k.matrixWorld.copy(k.matrix):k.matrixWorld.multiplyMatrices(K.matrixWorld,k.matrix),k.matrixWorldInverse.copy(k.matrixWorld).invert()}this.updateCamera=function(k){if(a===null)return;let K=k.near,lt=k.far;S.texture!==null&&(S.depthNear>0&&(K=S.depthNear),S.depthFar>0&&(lt=S.depthFar)),x.near=U.near=R.near=K,x.far=U.far=R.far=lt,(E!==x.near||q!==x.far)&&(a.updateRenderState({depthNear:x.near,depthFar:x.far}),E=x.near,q=x.far);const st=k.parent,xt=x.cameras;nt(x,st);for(let Et=0;Et<xt.length;Et++)nt(xt[Et],st);xt.length===2?O(x,R,U):x.projectionMatrix.copy(R.projectionMatrix),Z(k,x,st)};function Z(k,K,lt){lt===null?k.matrix.copy(K.matrixWorld):(k.matrix.copy(lt.matrixWorld),k.matrix.invert(),k.matrix.multiply(K.matrixWorld)),k.matrix.decompose(k.position,k.quaternion,k.scale),k.updateMatrixWorld(!0),k.projectionMatrix.copy(K.projectionMatrix),k.projectionMatrixInverse.copy(K.projectionMatrixInverse),k.isPerspectiveCamera&&(k.fov=Pd*2*Math.atan(1/k.projectionMatrix.elements[5]),k.zoom=1)}this.getCamera=function(){return x},this.getFoveation=function(){if(!(f===null&&p===null))return l},this.setFoveation=function(k){l=k,f!==null&&(f.fixedFoveation=k),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=k)},this.hasDepthSensing=function(){return S.texture!==null},this.getDepthSensingMesh=function(){return S.getMesh(x)};let it=null;function yt(k,K){if(h=K.getViewerPose(c||r),v=K,h!==null){const lt=h.views;p!==null&&(t.setRenderTargetFramebuffer(g,p.framebuffer),t.setRenderTarget(g));let st=!1;lt.length!==x.cameras.length&&(x.cameras.length=0,st=!0);for(let Et=0;Et<lt.length;Et++){const Ut=lt[Et];let qt=null;if(p!==null)qt=p.getViewport(Ut);else{const D=d.getViewSubImage(f,Ut);qt=D.viewport,Et===0&&(t.setRenderTargetTextures(g,D.colorTexture,f.ignoreDepthValues?void 0:D.depthStencilTexture),t.setRenderTarget(g))}let bt=X[Et];bt===void 0&&(bt=new Un,bt.layers.enable(Et),bt.viewport=new pe,X[Et]=bt),bt.matrix.fromArray(Ut.transform.matrix),bt.matrix.decompose(bt.position,bt.quaternion,bt.scale),bt.projectionMatrix.fromArray(Ut.projectionMatrix),bt.projectionMatrixInverse.copy(bt.projectionMatrix).invert(),bt.viewport.set(qt.x,qt.y,qt.width,qt.height),Et===0&&(x.matrix.copy(bt.matrix),x.matrix.decompose(x.position,x.quaternion,x.scale)),st===!0&&x.cameras.push(bt)}const xt=a.enabledFeatures;if(xt&&xt.includes("depth-sensing")){const Et=d.getDepthInformation(lt[0]);Et&&Et.isValid&&Et.texture&&S.init(t,Et,a.renderState)}}for(let lt=0;lt<_.length;lt++){const st=y[lt],xt=_[lt];st!==null&&xt!==void 0&&xt.update(st,K,c||r)}it&&it(k,K),K.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:K}),v=null}const Ct=new _y;Ct.setAnimationLoop(yt),this.setAnimationLoop=function(k){it=k},this.dispose=function(){}}}const ka=new xi,FR=new ve;function HR(e,t){function n(m,u){m.matrixAutoUpdate===!0&&m.updateMatrix(),u.value.copy(m.matrix)}function i(m,u){u.color.getRGB(m.fogColor.value,py(e)),u.isFog?(m.fogNear.value=u.near,m.fogFar.value=u.far):u.isFogExp2&&(m.fogDensity.value=u.density)}function a(m,u,g,_,y){u.isMeshBasicMaterial||u.isMeshLambertMaterial?s(m,u):u.isMeshToonMaterial?(s(m,u),d(m,u)):u.isMeshPhongMaterial?(s(m,u),h(m,u)):u.isMeshStandardMaterial?(s(m,u),f(m,u),u.isMeshPhysicalMaterial&&p(m,u,y)):u.isMeshMatcapMaterial?(s(m,u),v(m,u)):u.isMeshDepthMaterial?s(m,u):u.isMeshDistanceMaterial?(s(m,u),S(m,u)):u.isMeshNormalMaterial?s(m,u):u.isLineBasicMaterial?(r(m,u),u.isLineDashedMaterial&&o(m,u)):u.isPointsMaterial?l(m,u,g,_):u.isSpriteMaterial?c(m,u):u.isShadowMaterial?(m.color.value.copy(u.color),m.opacity.value=u.opacity):u.isShaderMaterial&&(u.uniformsNeedUpdate=!1)}function s(m,u){m.opacity.value=u.opacity,u.color&&m.diffuse.value.copy(u.color),u.emissive&&m.emissive.value.copy(u.emissive).multiplyScalar(u.emissiveIntensity),u.map&&(m.map.value=u.map,n(u.map,m.mapTransform)),u.alphaMap&&(m.alphaMap.value=u.alphaMap,n(u.alphaMap,m.alphaMapTransform)),u.bumpMap&&(m.bumpMap.value=u.bumpMap,n(u.bumpMap,m.bumpMapTransform),m.bumpScale.value=u.bumpScale,u.side===yn&&(m.bumpScale.value*=-1)),u.normalMap&&(m.normalMap.value=u.normalMap,n(u.normalMap,m.normalMapTransform),m.normalScale.value.copy(u.normalScale),u.side===yn&&m.normalScale.value.negate()),u.displacementMap&&(m.displacementMap.value=u.displacementMap,n(u.displacementMap,m.displacementMapTransform),m.displacementScale.value=u.displacementScale,m.displacementBias.value=u.displacementBias),u.emissiveMap&&(m.emissiveMap.value=u.emissiveMap,n(u.emissiveMap,m.emissiveMapTransform)),u.specularMap&&(m.specularMap.value=u.specularMap,n(u.specularMap,m.specularMapTransform)),u.alphaTest>0&&(m.alphaTest.value=u.alphaTest);const g=t.get(u),_=g.envMap,y=g.envMapRotation;_&&(m.envMap.value=_,ka.copy(y),ka.x*=-1,ka.y*=-1,ka.z*=-1,_.isCubeTexture&&_.isRenderTargetTexture===!1&&(ka.y*=-1,ka.z*=-1),m.envMapRotation.value.setFromMatrix4(FR.makeRotationFromEuler(ka)),m.flipEnvMap.value=_.isCubeTexture&&_.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=u.reflectivity,m.ior.value=u.ior,m.refractionRatio.value=u.refractionRatio),u.lightMap&&(m.lightMap.value=u.lightMap,m.lightMapIntensity.value=u.lightMapIntensity,n(u.lightMap,m.lightMapTransform)),u.aoMap&&(m.aoMap.value=u.aoMap,m.aoMapIntensity.value=u.aoMapIntensity,n(u.aoMap,m.aoMapTransform))}function r(m,u){m.diffuse.value.copy(u.color),m.opacity.value=u.opacity,u.map&&(m.map.value=u.map,n(u.map,m.mapTransform))}function o(m,u){m.dashSize.value=u.dashSize,m.totalSize.value=u.dashSize+u.gapSize,m.scale.value=u.scale}function l(m,u,g,_){m.diffuse.value.copy(u.color),m.opacity.value=u.opacity,m.size.value=u.size*g,m.scale.value=_*.5,u.map&&(m.map.value=u.map,n(u.map,m.uvTransform)),u.alphaMap&&(m.alphaMap.value=u.alphaMap,n(u.alphaMap,m.alphaMapTransform)),u.alphaTest>0&&(m.alphaTest.value=u.alphaTest)}function c(m,u){m.diffuse.value.copy(u.color),m.opacity.value=u.opacity,m.rotation.value=u.rotation,u.map&&(m.map.value=u.map,n(u.map,m.mapTransform)),u.alphaMap&&(m.alphaMap.value=u.alphaMap,n(u.alphaMap,m.alphaMapTransform)),u.alphaTest>0&&(m.alphaTest.value=u.alphaTest)}function h(m,u){m.specular.value.copy(u.specular),m.shininess.value=Math.max(u.shininess,1e-4)}function d(m,u){u.gradientMap&&(m.gradientMap.value=u.gradientMap)}function f(m,u){m.metalness.value=u.metalness,u.metalnessMap&&(m.metalnessMap.value=u.metalnessMap,n(u.metalnessMap,m.metalnessMapTransform)),m.roughness.value=u.roughness,u.roughnessMap&&(m.roughnessMap.value=u.roughnessMap,n(u.roughnessMap,m.roughnessMapTransform)),u.envMap&&(m.envMapIntensity.value=u.envMapIntensity)}function p(m,u,g){m.ior.value=u.ior,u.sheen>0&&(m.sheenColor.value.copy(u.sheenColor).multiplyScalar(u.sheen),m.sheenRoughness.value=u.sheenRoughness,u.sheenColorMap&&(m.sheenColorMap.value=u.sheenColorMap,n(u.sheenColorMap,m.sheenColorMapTransform)),u.sheenRoughnessMap&&(m.sheenRoughnessMap.value=u.sheenRoughnessMap,n(u.sheenRoughnessMap,m.sheenRoughnessMapTransform))),u.clearcoat>0&&(m.clearcoat.value=u.clearcoat,m.clearcoatRoughness.value=u.clearcoatRoughness,u.clearcoatMap&&(m.clearcoatMap.value=u.clearcoatMap,n(u.clearcoatMap,m.clearcoatMapTransform)),u.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=u.clearcoatRoughnessMap,n(u.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),u.clearcoatNormalMap&&(m.clearcoatNormalMap.value=u.clearcoatNormalMap,n(u.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(u.clearcoatNormalScale),u.side===yn&&m.clearcoatNormalScale.value.negate())),u.dispersion>0&&(m.dispersion.value=u.dispersion),u.iridescence>0&&(m.iridescence.value=u.iridescence,m.iridescenceIOR.value=u.iridescenceIOR,m.iridescenceThicknessMinimum.value=u.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=u.iridescenceThicknessRange[1],u.iridescenceMap&&(m.iridescenceMap.value=u.iridescenceMap,n(u.iridescenceMap,m.iridescenceMapTransform)),u.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=u.iridescenceThicknessMap,n(u.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),u.transmission>0&&(m.transmission.value=u.transmission,m.transmissionSamplerMap.value=g.texture,m.transmissionSamplerSize.value.set(g.width,g.height),u.transmissionMap&&(m.transmissionMap.value=u.transmissionMap,n(u.transmissionMap,m.transmissionMapTransform)),m.thickness.value=u.thickness,u.thicknessMap&&(m.thicknessMap.value=u.thicknessMap,n(u.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=u.attenuationDistance,m.attenuationColor.value.copy(u.attenuationColor)),u.anisotropy>0&&(m.anisotropyVector.value.set(u.anisotropy*Math.cos(u.anisotropyRotation),u.anisotropy*Math.sin(u.anisotropyRotation)),u.anisotropyMap&&(m.anisotropyMap.value=u.anisotropyMap,n(u.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=u.specularIntensity,m.specularColor.value.copy(u.specularColor),u.specularColorMap&&(m.specularColorMap.value=u.specularColorMap,n(u.specularColorMap,m.specularColorMapTransform)),u.specularIntensityMap&&(m.specularIntensityMap.value=u.specularIntensityMap,n(u.specularIntensityMap,m.specularIntensityMapTransform))}function v(m,u){u.matcap&&(m.matcap.value=u.matcap)}function S(m,u){const g=t.get(u).light;m.referencePosition.value.setFromMatrixPosition(g.matrixWorld),m.nearDistance.value=g.shadow.camera.near,m.farDistance.value=g.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:a}}function GR(e,t,n,i){let a={},s={},r=[];const o=e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS);function l(g,_){const y=_.program;i.uniformBlockBinding(g,y)}function c(g,_){let y=a[g.id];y===void 0&&(v(g),y=h(g),a[g.id]=y,g.addEventListener("dispose",m));const L=_.program;i.updateUBOMapping(g,L);const T=t.render.frame;s[g.id]!==T&&(f(g),s[g.id]=T)}function h(g){const _=d();g.__bindingPointIndex=_;const y=e.createBuffer(),L=g.__size,T=g.usage;return e.bindBuffer(e.UNIFORM_BUFFER,y),e.bufferData(e.UNIFORM_BUFFER,L,T),e.bindBuffer(e.UNIFORM_BUFFER,null),e.bindBufferBase(e.UNIFORM_BUFFER,_,y),y}function d(){for(let g=0;g<o;g++)if(r.indexOf(g)===-1)return r.push(g),g;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function f(g){const _=a[g.id],y=g.uniforms,L=g.__cache;e.bindBuffer(e.UNIFORM_BUFFER,_);for(let T=0,R=y.length;T<R;T++){const U=Array.isArray(y[T])?y[T]:[y[T]];for(let X=0,x=U.length;X<x;X++){const E=U[X];if(p(E,T,X,L)===!0){const q=E.__offset,W=Array.isArray(E.value)?E.value:[E.value];let J=0;for(let et=0;et<W.length;et++){const N=W[et],G=S(N);typeof N=="number"||typeof N=="boolean"?(E.__data[0]=N,e.bufferSubData(e.UNIFORM_BUFFER,q+J,E.__data)):N.isMatrix3?(E.__data[0]=N.elements[0],E.__data[1]=N.elements[1],E.__data[2]=N.elements[2],E.__data[3]=0,E.__data[4]=N.elements[3],E.__data[5]=N.elements[4],E.__data[6]=N.elements[5],E.__data[7]=0,E.__data[8]=N.elements[6],E.__data[9]=N.elements[7],E.__data[10]=N.elements[8],E.__data[11]=0):(N.toArray(E.__data,J),J+=G.storage/Float32Array.BYTES_PER_ELEMENT)}e.bufferSubData(e.UNIFORM_BUFFER,q,E.__data)}}}e.bindBuffer(e.UNIFORM_BUFFER,null)}function p(g,_,y,L){const T=g.value,R=_+"_"+y;if(L[R]===void 0)return typeof T=="number"||typeof T=="boolean"?L[R]=T:L[R]=T.clone(),!0;{const U=L[R];if(typeof T=="number"||typeof T=="boolean"){if(U!==T)return L[R]=T,!0}else if(U.equals(T)===!1)return U.copy(T),!0}return!1}function v(g){const _=g.uniforms;let y=0;const L=16;for(let R=0,U=_.length;R<U;R++){const X=Array.isArray(_[R])?_[R]:[_[R]];for(let x=0,E=X.length;x<E;x++){const q=X[x],W=Array.isArray(q.value)?q.value:[q.value];for(let J=0,et=W.length;J<et;J++){const N=W[J],G=S(N),O=y%L,nt=O%G.boundary,Z=O+nt;y+=nt,Z!==0&&L-Z<G.storage&&(y+=L-Z),q.__data=new Float32Array(G.storage/Float32Array.BYTES_PER_ELEMENT),q.__offset=y,y+=G.storage}}}const T=y%L;return T>0&&(y+=L-T),g.__size=y,g.__cache={},this}function S(g){const _={boundary:0,storage:0};return typeof g=="number"||typeof g=="boolean"?(_.boundary=4,_.storage=4):g.isVector2?(_.boundary=8,_.storage=8):g.isVector3||g.isColor?(_.boundary=16,_.storage=12):g.isVector4?(_.boundary=16,_.storage=16):g.isMatrix3?(_.boundary=48,_.storage=48):g.isMatrix4?(_.boundary=64,_.storage=64):g.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",g),_}function m(g){const _=g.target;_.removeEventListener("dispose",m);const y=r.indexOf(_.__bindingPointIndex);r.splice(y,1),e.deleteBuffer(a[_.id]),delete a[_.id],delete s[_.id]}function u(){for(const g in a)e.deleteBuffer(a[g]);r=[],a={},s={}}return{bind:l,update:c,dispose:u}}class VR{constructor(t={}){const{canvas:n=wb(),context:i=null,depth:a=!0,stencil:s=!1,alpha:r=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:d=!1}=t;this.isWebGLRenderer=!0;let f;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");f=i.getContextAttributes().alpha}else f=r;const p=new Uint32Array(4),v=new Int32Array(4);let S=null,m=null;const u=[],g=[];this.domElement=n,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=hi,this.toneMapping=Ra,this.toneMappingExposure=1;const _=this;let y=!1,L=0,T=0,R=null,U=-1,X=null;const x=new pe,E=new pe;let q=null;const W=new ee(0);let J=0,et=n.width,N=n.height,G=1,O=null,nt=null;const Z=new pe(0,0,et,N),it=new pe(0,0,et,N);let yt=!1;const Ct=new Qp;let k=!1,K=!1;const lt=new ve,st=new ve,xt=new I,Et=new pe,Ut={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let qt=!1;function bt(){return R===null?G:1}let D=i;function Yt(b,z){return n.getContext(b,z)}try{const b={alpha:!0,depth:a,stencil:s,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:d};if("setAttribute"in n&&n.setAttribute("data-engine",`three.js r${Vp}`),n.addEventListener("webglcontextlost",tt,!1),n.addEventListener("webglcontextrestored",ht,!1),n.addEventListener("webglcontextcreationerror",dt,!1),D===null){const z="webgl2";if(D=Yt(z,b),D===null)throw Yt(z)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(b){throw console.error("THREE.WebGLRenderer: "+b.message),b}let Rt,Bt,Tt,Lt,ct,w,M,C,H,Q,Y,St,ot,mt,zt,at,ft,wt,Ot,vt,Ht,Gt,ae,P;function gt(){Rt=new qA(D),Rt.init(),Gt=new UR(D,Rt),Bt=new HA(D,Rt,t,Gt),Tt=new CR(D),Bt.reverseDepthBuffer&&Tt.buffers.depth.setReversed(!0),Lt=new KA(D),ct=new pR,w=new NR(D,Rt,Tt,ct,Bt,Gt,Lt),M=new VA(_),C=new WA(_),H=new n1(D),ae=new BA(D,H),Q=new YA(D,H,Lt,ae),Y=new JA(D,Q,H,Lt),Ot=new QA(D,Bt,w),at=new GA(ct),St=new dR(_,M,C,Rt,Bt,ae,at),ot=new HR(_,ct),mt=new gR,zt=new MR(Rt),wt=new IA(_,M,C,Tt,Y,f,l),ft=new RR(_,Y,Bt),P=new GR(D,Lt,Bt,Tt),vt=new FA(D,Rt,Lt),Ht=new ZA(D,Rt,Lt),Lt.programs=St.programs,_.capabilities=Bt,_.extensions=Rt,_.properties=ct,_.renderLists=mt,_.shadowMap=ft,_.state=Tt,_.info=Lt}gt();const F=new BR(_,D);this.xr=F,this.getContext=function(){return D},this.getContextAttributes=function(){return D.getContextAttributes()},this.forceContextLoss=function(){const b=Rt.get("WEBGL_lose_context");b&&b.loseContext()},this.forceContextRestore=function(){const b=Rt.get("WEBGL_lose_context");b&&b.restoreContext()},this.getPixelRatio=function(){return G},this.setPixelRatio=function(b){b!==void 0&&(G=b,this.setSize(et,N,!1))},this.getSize=function(b){return b.set(et,N)},this.setSize=function(b,z,V=!0){if(F.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}et=b,N=z,n.width=Math.floor(b*G),n.height=Math.floor(z*G),V===!0&&(n.style.width=b+"px",n.style.height=z+"px"),this.setViewport(0,0,b,z)},this.getDrawingBufferSize=function(b){return b.set(et*G,N*G).floor()},this.setDrawingBufferSize=function(b,z,V){et=b,N=z,G=V,n.width=Math.floor(b*V),n.height=Math.floor(z*V),this.setViewport(0,0,b,z)},this.getCurrentViewport=function(b){return b.copy(x)},this.getViewport=function(b){return b.copy(Z)},this.setViewport=function(b,z,V,j){b.isVector4?Z.set(b.x,b.y,b.z,b.w):Z.set(b,z,V,j),Tt.viewport(x.copy(Z).multiplyScalar(G).round())},this.getScissor=function(b){return b.copy(it)},this.setScissor=function(b,z,V,j){b.isVector4?it.set(b.x,b.y,b.z,b.w):it.set(b,z,V,j),Tt.scissor(E.copy(it).multiplyScalar(G).round())},this.getScissorTest=function(){return yt},this.setScissorTest=function(b){Tt.setScissorTest(yt=b)},this.setOpaqueSort=function(b){O=b},this.setTransparentSort=function(b){nt=b},this.getClearColor=function(b){return b.copy(wt.getClearColor())},this.setClearColor=function(){wt.setClearColor.apply(wt,arguments)},this.getClearAlpha=function(){return wt.getClearAlpha()},this.setClearAlpha=function(){wt.setClearAlpha.apply(wt,arguments)},this.clear=function(b=!0,z=!0,V=!0){let j=0;if(b){let B=!1;if(R!==null){const rt=R.texture.format;B=rt===Yp||rt===qp||rt===Wp}if(B){const rt=R.texture.type,_t=rt===Yi||rt===us||rt===Fo||rt===Cr||rt===jp||rt===Xp,Mt=wt.getClearColor(),At=wt.getClearAlpha(),It=Mt.r,Ft=Mt.g,Dt=Mt.b;_t?(p[0]=It,p[1]=Ft,p[2]=Dt,p[3]=At,D.clearBufferuiv(D.COLOR,0,p)):(v[0]=It,v[1]=Ft,v[2]=Dt,v[3]=At,D.clearBufferiv(D.COLOR,0,v))}else j|=D.COLOR_BUFFER_BIT}z&&(j|=D.DEPTH_BUFFER_BIT,D.clearDepth(this.capabilities.reverseDepthBuffer?0:1)),V&&(j|=D.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),D.clear(j)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){n.removeEventListener("webglcontextlost",tt,!1),n.removeEventListener("webglcontextrestored",ht,!1),n.removeEventListener("webglcontextcreationerror",dt,!1),mt.dispose(),zt.dispose(),ct.dispose(),M.dispose(),C.dispose(),Y.dispose(),ae.dispose(),P.dispose(),St.dispose(),F.dispose(),F.removeEventListener("sessionstart",al),F.removeEventListener("sessionend",sl),Gn.stop()};function tt(b){b.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),y=!0}function ht(){console.log("THREE.WebGLRenderer: Context Restored."),y=!1;const b=Lt.autoReset,z=ft.enabled,V=ft.autoUpdate,j=ft.needsUpdate,B=ft.type;gt(),Lt.autoReset=b,ft.enabled=z,ft.autoUpdate=V,ft.needsUpdate=j,ft.type=B}function dt(b){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",b.statusMessage)}function Zt(b){const z=b.target;z.removeEventListener("dispose",Zt),me(z)}function me(b){$e(b),ct.remove(b)}function $e(b){const z=ct.get(b).programs;z!==void 0&&(z.forEach(function(V){St.releaseProgram(V)}),b.isShaderMaterial&&St.releaseShaderCache(b))}this.renderBufferDirect=function(b,z,V,j,B,rt){z===null&&(z=Ut);const _t=B.isMesh&&B.matrixWorld.determinant()<0,Mt=Ty(b,z,V,j,B);Tt.setMaterial(j,_t);let At=V.index,It=1;if(j.wireframe===!0){if(At=Q.getWireframeAttribute(V),At===void 0)return;It=2}const Ft=V.drawRange,Dt=V.attributes.position;let le=Ft.start*It,xe=(Ft.start+Ft.count)*It;rt!==null&&(le=Math.max(le,rt.start*It),xe=Math.min(xe,(rt.start+rt.count)*It)),At!==null?(le=Math.max(le,0),xe=Math.min(xe,At.count)):Dt!=null&&(le=Math.max(le,0),xe=Math.min(xe,Dt.count));const Ae=xe-le;if(Ae<0||Ae===1/0)return;ae.setup(B,j,Mt,V,At);let An,se=vt;if(At!==null&&(An=H.get(At),se=Ht,se.setIndex(An)),B.isMesh)j.wireframe===!0?(Tt.setLineWidth(j.wireframeLinewidth*bt()),se.setMode(D.LINES)):se.setMode(D.TRIANGLES);else if(B.isLine){let Nt=j.linewidth;Nt===void 0&&(Nt=1),Tt.setLineWidth(Nt*bt()),B.isLineSegments?se.setMode(D.LINES):B.isLineLoop?se.setMode(D.LINE_LOOP):se.setMode(D.LINE_STRIP)}else B.isPoints?se.setMode(D.POINTS):B.isSprite&&se.setMode(D.TRIANGLES);if(B.isBatchedMesh)if(B._multiDrawInstances!==null)se.renderMultiDrawInstances(B._multiDrawStarts,B._multiDrawCounts,B._multiDrawCount,B._multiDrawInstances);else if(Rt.get("WEBGL_multi_draw"))se.renderMultiDraw(B._multiDrawStarts,B._multiDrawCounts,B._multiDrawCount);else{const Nt=B._multiDrawStarts,qe=B._multiDrawCounts,re=B._multiDrawCount,ni=At?H.get(At).bytesPerElement:1,Ss=ct.get(j).currentProgram.getUniforms();for(let Rn=0;Rn<re;Rn++)Ss.setValue(D,"_gl_DrawID",Rn),se.render(Nt[Rn]/ni,qe[Rn])}else if(B.isInstancedMesh)se.renderInstances(le,Ae,B.count);else if(V.isInstancedBufferGeometry){const Nt=V._maxInstanceCount!==void 0?V._maxInstanceCount:1/0,qe=Math.min(V.instanceCount,Nt);se.renderInstances(le,Ae,qe)}else se.render(le,Ae)};function te(b,z,V){b.transparent===!0&&b.side===pi&&b.forceSinglePass===!1?(b.side=yn,b.needsUpdate=!0,ll(b,z,V),b.side=Ua,b.needsUpdate=!0,ll(b,z,V),b.side=pi):ll(b,z,V)}this.compile=function(b,z,V=null){V===null&&(V=b),m=zt.get(V),m.init(z),g.push(m),V.traverseVisible(function(B){B.isLight&&B.layers.test(z.layers)&&(m.pushLight(B),B.castShadow&&m.pushShadow(B))}),b!==V&&b.traverseVisible(function(B){B.isLight&&B.layers.test(z.layers)&&(m.pushLight(B),B.castShadow&&m.pushShadow(B))}),m.setupLights();const j=new Set;return b.traverse(function(B){if(!(B.isMesh||B.isPoints||B.isLine||B.isSprite))return;const rt=B.material;if(rt)if(Array.isArray(rt))for(let _t=0;_t<rt.length;_t++){const Mt=rt[_t];te(Mt,V,B),j.add(Mt)}else te(rt,V,B),j.add(rt)}),g.pop(),m=null,j},this.compileAsync=function(b,z,V=null){const j=this.compile(b,z,V);return new Promise(B=>{function rt(){if(j.forEach(function(_t){ct.get(_t).currentProgram.isReady()&&j.delete(_t)}),j.size===0){B(b);return}setTimeout(rt,10)}Rt.get("KHR_parallel_shader_compile")!==null?rt():setTimeout(rt,10)})};let sn=null;function Tn(b){sn&&sn(b)}function al(){Gn.stop()}function sl(){Gn.start()}const Gn=new _y;Gn.setAnimationLoop(Tn),typeof self<"u"&&Gn.setContext(self),this.setAnimationLoop=function(b){sn=b,F.setAnimationLoop(b),b===null?Gn.stop():Gn.start()},F.addEventListener("sessionstart",al),F.addEventListener("sessionend",sl),this.render=function(b,z){if(z!==void 0&&z.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(y===!0)return;if(b.matrixWorldAutoUpdate===!0&&b.updateMatrixWorld(),z.parent===null&&z.matrixWorldAutoUpdate===!0&&z.updateMatrixWorld(),F.enabled===!0&&F.isPresenting===!0&&(F.cameraAutoUpdate===!0&&F.updateCamera(z),z=F.getCamera()),b.isScene===!0&&b.onBeforeRender(_,b,z,R),m=zt.get(b,g.length),m.init(z),g.push(m),st.multiplyMatrices(z.projectionMatrix,z.matrixWorldInverse),Ct.setFromProjectionMatrix(st),K=this.localClippingEnabled,k=at.init(this.clippingPlanes,K),S=mt.get(b,u.length),S.init(),u.push(S),F.enabled===!0&&F.isPresenting===!0){const rt=_.xr.getDepthSensingMesh();rt!==null&&Vn(rt,z,-1/0,_.sortObjects)}Vn(b,z,0,_.sortObjects),S.finish(),_.sortObjects===!0&&S.sort(O,nt),qt=F.enabled===!1||F.isPresenting===!1||F.hasDepthSensing()===!1,qt&&wt.addToRenderList(S,b),this.info.render.frame++,k===!0&&at.beginShadows();const V=m.state.shadowsArray;ft.render(V,b,z),k===!0&&at.endShadows(),this.info.autoReset===!0&&this.info.reset();const j=S.opaque,B=S.transmissive;if(m.setupLights(),z.isArrayCamera){const rt=z.cameras;if(B.length>0)for(let _t=0,Mt=rt.length;_t<Mt;_t++){const At=rt[_t];rl(j,B,b,At)}qt&&wt.render(b);for(let _t=0,Mt=rt.length;_t<Mt;_t++){const At=rt[_t];ys(S,b,At,At.viewport)}}else B.length>0&&rl(j,B,b,z),qt&&wt.render(b),ys(S,b,z);R!==null&&(w.updateMultisampleRenderTarget(R),w.updateRenderTargetMipmap(R)),b.isScene===!0&&b.onAfterRender(_,b,z),ae.resetDefaultState(),U=-1,X=null,g.pop(),g.length>0?(m=g[g.length-1],k===!0&&at.setGlobalState(_.clippingPlanes,m.state.camera)):m=null,u.pop(),u.length>0?S=u[u.length-1]:S=null};function Vn(b,z,V,j){if(b.visible===!1)return;if(b.layers.test(z.layers)){if(b.isGroup)V=b.renderOrder;else if(b.isLOD)b.autoUpdate===!0&&b.update(z);else if(b.isLight)m.pushLight(b),b.castShadow&&m.pushShadow(b);else if(b.isSprite){if(!b.frustumCulled||Ct.intersectsSprite(b)){j&&Et.setFromMatrixPosition(b.matrixWorld).applyMatrix4(st);const _t=Y.update(b),Mt=b.material;Mt.visible&&S.push(b,_t,Mt,V,Et.z,null)}}else if((b.isMesh||b.isLine||b.isPoints)&&(!b.frustumCulled||Ct.intersectsObject(b))){const _t=Y.update(b),Mt=b.material;if(j&&(b.boundingSphere!==void 0?(b.boundingSphere===null&&b.computeBoundingSphere(),Et.copy(b.boundingSphere.center)):(_t.boundingSphere===null&&_t.computeBoundingSphere(),Et.copy(_t.boundingSphere.center)),Et.applyMatrix4(b.matrixWorld).applyMatrix4(st)),Array.isArray(Mt)){const At=_t.groups;for(let It=0,Ft=At.length;It<Ft;It++){const Dt=At[It],le=Mt[Dt.materialIndex];le&&le.visible&&S.push(b,_t,le,V,Et.z,Dt)}}else Mt.visible&&S.push(b,_t,Mt,V,Et.z,null)}}const rt=b.children;for(let _t=0,Mt=rt.length;_t<Mt;_t++)Vn(rt[_t],z,V,j)}function ys(b,z,V,j){const B=b.opaque,rt=b.transmissive,_t=b.transparent;m.setupLightsView(V),k===!0&&at.setGlobalState(_.clippingPlanes,V),j&&Tt.viewport(x.copy(j)),B.length>0&&ol(B,z,V),rt.length>0&&ol(rt,z,V),_t.length>0&&ol(_t,z,V),Tt.buffers.depth.setTest(!0),Tt.buffers.depth.setMask(!0),Tt.buffers.color.setMask(!0),Tt.setPolygonOffset(!1)}function rl(b,z,V,j){if((V.isScene===!0?V.overrideMaterial:null)!==null)return;m.state.transmissionRenderTarget[j.id]===void 0&&(m.state.transmissionRenderTarget[j.id]=new fs(1,1,{generateMipmaps:!0,type:Rt.has("EXT_color_buffer_half_float")||Rt.has("EXT_color_buffer_float")?Jo:Yi,minFilter:Ja,samples:4,stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:oe.workingColorSpace}));const rt=m.state.transmissionRenderTarget[j.id],_t=j.viewport||x;rt.setSize(_t.z,_t.w);const Mt=_.getRenderTarget();_.setRenderTarget(rt),_.getClearColor(W),J=_.getClearAlpha(),J<1&&_.setClearColor(16777215,.5),_.clear(),qt&&wt.render(V);const At=_.toneMapping;_.toneMapping=Ra;const It=j.viewport;if(j.viewport!==void 0&&(j.viewport=void 0),m.setupLightsView(j),k===!0&&at.setGlobalState(_.clippingPlanes,j),ol(b,V,j),w.updateMultisampleRenderTarget(rt),w.updateRenderTargetMipmap(rt),Rt.has("WEBGL_multisampled_render_to_texture")===!1){let Ft=!1;for(let Dt=0,le=z.length;Dt<le;Dt++){const xe=z[Dt],Ae=xe.object,An=xe.geometry,se=xe.material,Nt=xe.group;if(se.side===pi&&Ae.layers.test(j.layers)){const qe=se.side;se.side=yn,se.needsUpdate=!0,em(Ae,V,j,An,se,Nt),se.side=qe,se.needsUpdate=!0,Ft=!0}}Ft===!0&&(w.updateMultisampleRenderTarget(rt),w.updateRenderTargetMipmap(rt))}_.setRenderTarget(Mt),_.setClearColor(W,J),It!==void 0&&(j.viewport=It),_.toneMapping=At}function ol(b,z,V){const j=z.isScene===!0?z.overrideMaterial:null;for(let B=0,rt=b.length;B<rt;B++){const _t=b[B],Mt=_t.object,At=_t.geometry,It=j===null?_t.material:j,Ft=_t.group;Mt.layers.test(V.layers)&&em(Mt,z,V,At,It,Ft)}}function em(b,z,V,j,B,rt){b.onBeforeRender(_,z,V,j,B,rt),b.modelViewMatrix.multiplyMatrices(V.matrixWorldInverse,b.matrixWorld),b.normalMatrix.getNormalMatrix(b.modelViewMatrix),B.onBeforeRender(_,z,V,j,b,rt),B.transparent===!0&&B.side===pi&&B.forceSinglePass===!1?(B.side=yn,B.needsUpdate=!0,_.renderBufferDirect(V,z,j,B,b,rt),B.side=Ua,B.needsUpdate=!0,_.renderBufferDirect(V,z,j,B,b,rt),B.side=pi):_.renderBufferDirect(V,z,j,B,b,rt),b.onAfterRender(_,z,V,j,B,rt)}function ll(b,z,V){z.isScene!==!0&&(z=Ut);const j=ct.get(b),B=m.state.lights,rt=m.state.shadowsArray,_t=B.state.version,Mt=St.getParameters(b,B.state,rt,z,V),At=St.getProgramCacheKey(Mt);let It=j.programs;j.environment=b.isMeshStandardMaterial?z.environment:null,j.fog=z.fog,j.envMap=(b.isMeshStandardMaterial?C:M).get(b.envMap||j.environment),j.envMapRotation=j.environment!==null&&b.envMap===null?z.environmentRotation:b.envMapRotation,It===void 0&&(b.addEventListener("dispose",Zt),It=new Map,j.programs=It);let Ft=It.get(At);if(Ft!==void 0){if(j.currentProgram===Ft&&j.lightsStateVersion===_t)return im(b,Mt),Ft}else Mt.uniforms=St.getUniforms(b),b.onBeforeCompile(Mt,_),Ft=St.acquireProgram(Mt,At),It.set(At,Ft),j.uniforms=Mt.uniforms;const Dt=j.uniforms;return(!b.isShaderMaterial&&!b.isRawShaderMaterial||b.clipping===!0)&&(Dt.clippingPlanes=at.uniform),im(b,Mt),j.needsLights=Ry(b),j.lightsStateVersion=_t,j.needsLights&&(Dt.ambientLightColor.value=B.state.ambient,Dt.lightProbe.value=B.state.probe,Dt.directionalLights.value=B.state.directional,Dt.directionalLightShadows.value=B.state.directionalShadow,Dt.spotLights.value=B.state.spot,Dt.spotLightShadows.value=B.state.spotShadow,Dt.rectAreaLights.value=B.state.rectArea,Dt.ltc_1.value=B.state.rectAreaLTC1,Dt.ltc_2.value=B.state.rectAreaLTC2,Dt.pointLights.value=B.state.point,Dt.pointLightShadows.value=B.state.pointShadow,Dt.hemisphereLights.value=B.state.hemi,Dt.directionalShadowMap.value=B.state.directionalShadowMap,Dt.directionalShadowMatrix.value=B.state.directionalShadowMatrix,Dt.spotShadowMap.value=B.state.spotShadowMap,Dt.spotLightMatrix.value=B.state.spotLightMatrix,Dt.spotLightMap.value=B.state.spotLightMap,Dt.pointShadowMap.value=B.state.pointShadowMap,Dt.pointShadowMatrix.value=B.state.pointShadowMatrix),j.currentProgram=Ft,j.uniformsList=null,Ft}function nm(b){if(b.uniformsList===null){const z=b.currentProgram.getUniforms();b.uniformsList=Mc.seqWithValue(z.seq,b.uniforms)}return b.uniformsList}function im(b,z){const V=ct.get(b);V.outputColorSpace=z.outputColorSpace,V.batching=z.batching,V.batchingColor=z.batchingColor,V.instancing=z.instancing,V.instancingColor=z.instancingColor,V.instancingMorph=z.instancingMorph,V.skinning=z.skinning,V.morphTargets=z.morphTargets,V.morphNormals=z.morphNormals,V.morphColors=z.morphColors,V.morphTargetsCount=z.morphTargetsCount,V.numClippingPlanes=z.numClippingPlanes,V.numIntersection=z.numClipIntersection,V.vertexAlphas=z.vertexAlphas,V.vertexTangents=z.vertexTangents,V.toneMapping=z.toneMapping}function Ty(b,z,V,j,B){z.isScene!==!0&&(z=Ut),w.resetTextureUnits();const rt=z.fog,_t=j.isMeshStandardMaterial?z.environment:null,Mt=R===null?_.outputColorSpace:R.isXRRenderTarget===!0?R.texture.colorSpace:za,At=(j.isMeshStandardMaterial?C:M).get(j.envMap||_t),It=j.vertexColors===!0&&!!V.attributes.color&&V.attributes.color.itemSize===4,Ft=!!V.attributes.tangent&&(!!j.normalMap||j.anisotropy>0),Dt=!!V.morphAttributes.position,le=!!V.morphAttributes.normal,xe=!!V.morphAttributes.color;let Ae=Ra;j.toneMapped&&(R===null||R.isXRRenderTarget===!0)&&(Ae=_.toneMapping);const An=V.morphAttributes.position||V.morphAttributes.normal||V.morphAttributes.color,se=An!==void 0?An.length:0,Nt=ct.get(j),qe=m.state.lights;if(k===!0&&(K===!0||b!==X)){const kn=b===X&&j.id===U;at.setState(j,b,kn)}let re=!1;j.version===Nt.__version?(Nt.needsLights&&Nt.lightsStateVersion!==qe.state.version||Nt.outputColorSpace!==Mt||B.isBatchedMesh&&Nt.batching===!1||!B.isBatchedMesh&&Nt.batching===!0||B.isBatchedMesh&&Nt.batchingColor===!0&&B.colorTexture===null||B.isBatchedMesh&&Nt.batchingColor===!1&&B.colorTexture!==null||B.isInstancedMesh&&Nt.instancing===!1||!B.isInstancedMesh&&Nt.instancing===!0||B.isSkinnedMesh&&Nt.skinning===!1||!B.isSkinnedMesh&&Nt.skinning===!0||B.isInstancedMesh&&Nt.instancingColor===!0&&B.instanceColor===null||B.isInstancedMesh&&Nt.instancingColor===!1&&B.instanceColor!==null||B.isInstancedMesh&&Nt.instancingMorph===!0&&B.morphTexture===null||B.isInstancedMesh&&Nt.instancingMorph===!1&&B.morphTexture!==null||Nt.envMap!==At||j.fog===!0&&Nt.fog!==rt||Nt.numClippingPlanes!==void 0&&(Nt.numClippingPlanes!==at.numPlanes||Nt.numIntersection!==at.numIntersection)||Nt.vertexAlphas!==It||Nt.vertexTangents!==Ft||Nt.morphTargets!==Dt||Nt.morphNormals!==le||Nt.morphColors!==xe||Nt.toneMapping!==Ae||Nt.morphTargetsCount!==se)&&(re=!0):(re=!0,Nt.__version=j.version);let ni=Nt.currentProgram;re===!0&&(ni=ll(j,z,B));let Ss=!1,Rn=!1,Du=!1;const Ce=ni.getUniforms(),Ki=Nt.uniforms;if(Tt.useProgram(ni.program)&&(Ss=!0,Rn=!0,Du=!0),j.id!==U&&(U=j.id,Rn=!0),Ss||X!==b){Bt.reverseDepthBuffer?(lt.copy(b.projectionMatrix),Db(lt),Nb(lt),Ce.setValue(D,"projectionMatrix",lt)):Ce.setValue(D,"projectionMatrix",b.projectionMatrix),Ce.setValue(D,"viewMatrix",b.matrixWorldInverse);const kn=Ce.map.cameraPosition;kn!==void 0&&kn.setValue(D,xt.setFromMatrixPosition(b.matrixWorld)),Bt.logarithmicDepthBuffer&&Ce.setValue(D,"logDepthBufFC",2/(Math.log(b.far+1)/Math.LN2)),(j.isMeshPhongMaterial||j.isMeshToonMaterial||j.isMeshLambertMaterial||j.isMeshBasicMaterial||j.isMeshStandardMaterial||j.isShaderMaterial)&&Ce.setValue(D,"isOrthographic",b.isOrthographicCamera===!0),X!==b&&(X=b,Rn=!0,Du=!0)}if(B.isSkinnedMesh){Ce.setOptional(D,B,"bindMatrix"),Ce.setOptional(D,B,"bindMatrixInverse");const kn=B.skeleton;kn&&(kn.boneTexture===null&&kn.computeBoneTexture(),Ce.setValue(D,"boneTexture",kn.boneTexture,w))}B.isBatchedMesh&&(Ce.setOptional(D,B,"batchingTexture"),Ce.setValue(D,"batchingTexture",B._matricesTexture,w),Ce.setOptional(D,B,"batchingIdTexture"),Ce.setValue(D,"batchingIdTexture",B._indirectTexture,w),Ce.setOptional(D,B,"batchingColorTexture"),B._colorsTexture!==null&&Ce.setValue(D,"batchingColorTexture",B._colorsTexture,w));const Nu=V.morphAttributes;if((Nu.position!==void 0||Nu.normal!==void 0||Nu.color!==void 0)&&Ot.update(B,V,ni),(Rn||Nt.receiveShadow!==B.receiveShadow)&&(Nt.receiveShadow=B.receiveShadow,Ce.setValue(D,"receiveShadow",B.receiveShadow)),j.isMeshGouraudMaterial&&j.envMap!==null&&(Ki.envMap.value=At,Ki.flipEnvMap.value=At.isCubeTexture&&At.isRenderTargetTexture===!1?-1:1),j.isMeshStandardMaterial&&j.envMap===null&&z.environment!==null&&(Ki.envMapIntensity.value=z.environmentIntensity),Rn&&(Ce.setValue(D,"toneMappingExposure",_.toneMappingExposure),Nt.needsLights&&Ay(Ki,Du),rt&&j.fog===!0&&ot.refreshFogUniforms(Ki,rt),ot.refreshMaterialUniforms(Ki,j,G,N,m.state.transmissionRenderTarget[b.id]),Mc.upload(D,nm(Nt),Ki,w)),j.isShaderMaterial&&j.uniformsNeedUpdate===!0&&(Mc.upload(D,nm(Nt),Ki,w),j.uniformsNeedUpdate=!1),j.isSpriteMaterial&&Ce.setValue(D,"center",B.center),Ce.setValue(D,"modelViewMatrix",B.modelViewMatrix),Ce.setValue(D,"normalMatrix",B.normalMatrix),Ce.setValue(D,"modelMatrix",B.matrixWorld),j.isShaderMaterial||j.isRawShaderMaterial){const kn=j.uniformsGroups;for(let Uu=0,wy=kn.length;Uu<wy;Uu++){const am=kn[Uu];P.update(am,ni),P.bind(am,ni)}}return ni}function Ay(b,z){b.ambientLightColor.needsUpdate=z,b.lightProbe.needsUpdate=z,b.directionalLights.needsUpdate=z,b.directionalLightShadows.needsUpdate=z,b.pointLights.needsUpdate=z,b.pointLightShadows.needsUpdate=z,b.spotLights.needsUpdate=z,b.spotLightShadows.needsUpdate=z,b.rectAreaLights.needsUpdate=z,b.hemisphereLights.needsUpdate=z}function Ry(b){return b.isMeshLambertMaterial||b.isMeshToonMaterial||b.isMeshPhongMaterial||b.isMeshStandardMaterial||b.isShadowMaterial||b.isShaderMaterial&&b.lights===!0}this.getActiveCubeFace=function(){return L},this.getActiveMipmapLevel=function(){return T},this.getRenderTarget=function(){return R},this.setRenderTargetTextures=function(b,z,V){ct.get(b.texture).__webglTexture=z,ct.get(b.depthTexture).__webglTexture=V;const j=ct.get(b);j.__hasExternalTextures=!0,j.__autoAllocateDepthBuffer=V===void 0,j.__autoAllocateDepthBuffer||Rt.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),j.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(b,z){const V=ct.get(b);V.__webglFramebuffer=z,V.__useDefaultFramebuffer=z===void 0},this.setRenderTarget=function(b,z=0,V=0){R=b,L=z,T=V;let j=!0,B=null,rt=!1,_t=!1;if(b){const At=ct.get(b);if(At.__useDefaultFramebuffer!==void 0)Tt.bindFramebuffer(D.FRAMEBUFFER,null),j=!1;else if(At.__webglFramebuffer===void 0)w.setupRenderTarget(b);else if(At.__hasExternalTextures)w.rebindTextures(b,ct.get(b.texture).__webglTexture,ct.get(b.depthTexture).__webglTexture);else if(b.depthBuffer){const Dt=b.depthTexture;if(At.__boundDepthTexture!==Dt){if(Dt!==null&&ct.has(Dt)&&(b.width!==Dt.image.width||b.height!==Dt.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");w.setupDepthRenderbuffer(b)}}const It=b.texture;(It.isData3DTexture||It.isDataArrayTexture||It.isCompressedArrayTexture)&&(_t=!0);const Ft=ct.get(b).__webglFramebuffer;b.isWebGLCubeRenderTarget?(Array.isArray(Ft[z])?B=Ft[z][V]:B=Ft[z],rt=!0):b.samples>0&&w.useMultisampledRTT(b)===!1?B=ct.get(b).__webglMultisampledFramebuffer:Array.isArray(Ft)?B=Ft[V]:B=Ft,x.copy(b.viewport),E.copy(b.scissor),q=b.scissorTest}else x.copy(Z).multiplyScalar(G).floor(),E.copy(it).multiplyScalar(G).floor(),q=yt;if(Tt.bindFramebuffer(D.FRAMEBUFFER,B)&&j&&Tt.drawBuffers(b,B),Tt.viewport(x),Tt.scissor(E),Tt.setScissorTest(q),rt){const At=ct.get(b.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_CUBE_MAP_POSITIVE_X+z,At.__webglTexture,V)}else if(_t){const At=ct.get(b.texture),It=z||0;D.framebufferTextureLayer(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,At.__webglTexture,V||0,It)}U=-1},this.readRenderTargetPixels=function(b,z,V,j,B,rt,_t){if(!(b&&b.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Mt=ct.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&_t!==void 0&&(Mt=Mt[_t]),Mt){Tt.bindFramebuffer(D.FRAMEBUFFER,Mt);try{const At=b.texture,It=At.format,Ft=At.type;if(!Bt.textureFormatReadable(It)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Bt.textureTypeReadable(Ft)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}z>=0&&z<=b.width-j&&V>=0&&V<=b.height-B&&D.readPixels(z,V,j,B,Gt.convert(It),Gt.convert(Ft),rt)}finally{const At=R!==null?ct.get(R).__webglFramebuffer:null;Tt.bindFramebuffer(D.FRAMEBUFFER,At)}}},this.readRenderTargetPixelsAsync=async function(b,z,V,j,B,rt,_t){if(!(b&&b.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Mt=ct.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&_t!==void 0&&(Mt=Mt[_t]),Mt){const At=b.texture,It=At.format,Ft=At.type;if(!Bt.textureFormatReadable(It))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Bt.textureTypeReadable(Ft))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(z>=0&&z<=b.width-j&&V>=0&&V<=b.height-B){Tt.bindFramebuffer(D.FRAMEBUFFER,Mt);const Dt=D.createBuffer();D.bindBuffer(D.PIXEL_PACK_BUFFER,Dt),D.bufferData(D.PIXEL_PACK_BUFFER,rt.byteLength,D.STREAM_READ),D.readPixels(z,V,j,B,Gt.convert(It),Gt.convert(Ft),0);const le=R!==null?ct.get(R).__webglFramebuffer:null;Tt.bindFramebuffer(D.FRAMEBUFFER,le);const xe=D.fenceSync(D.SYNC_GPU_COMMANDS_COMPLETE,0);return D.flush(),await Cb(D,xe,4),D.bindBuffer(D.PIXEL_PACK_BUFFER,Dt),D.getBufferSubData(D.PIXEL_PACK_BUFFER,0,rt),D.deleteBuffer(Dt),D.deleteSync(xe),rt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(b,z=null,V=0){b.isTexture!==!0&&(Sc("WebGLRenderer: copyFramebufferToTexture function signature has changed."),z=arguments[0]||null,b=arguments[1]);const j=Math.pow(2,-V),B=Math.floor(b.image.width*j),rt=Math.floor(b.image.height*j),_t=z!==null?z.x:0,Mt=z!==null?z.y:0;w.setTexture2D(b,0),D.copyTexSubImage2D(D.TEXTURE_2D,V,0,0,_t,Mt,B,rt),Tt.unbindTexture()},this.copyTextureToTexture=function(b,z,V=null,j=null,B=0){b.isTexture!==!0&&(Sc("WebGLRenderer: copyTextureToTexture function signature has changed."),j=arguments[0]||null,b=arguments[1],z=arguments[2],B=arguments[3]||0,V=null);let rt,_t,Mt,At,It,Ft;V!==null?(rt=V.max.x-V.min.x,_t=V.max.y-V.min.y,Mt=V.min.x,At=V.min.y):(rt=b.image.width,_t=b.image.height,Mt=0,At=0),j!==null?(It=j.x,Ft=j.y):(It=0,Ft=0);const Dt=Gt.convert(z.format),le=Gt.convert(z.type);w.setTexture2D(z,0),D.pixelStorei(D.UNPACK_FLIP_Y_WEBGL,z.flipY),D.pixelStorei(D.UNPACK_PREMULTIPLY_ALPHA_WEBGL,z.premultiplyAlpha),D.pixelStorei(D.UNPACK_ALIGNMENT,z.unpackAlignment);const xe=D.getParameter(D.UNPACK_ROW_LENGTH),Ae=D.getParameter(D.UNPACK_IMAGE_HEIGHT),An=D.getParameter(D.UNPACK_SKIP_PIXELS),se=D.getParameter(D.UNPACK_SKIP_ROWS),Nt=D.getParameter(D.UNPACK_SKIP_IMAGES),qe=b.isCompressedTexture?b.mipmaps[B]:b.image;D.pixelStorei(D.UNPACK_ROW_LENGTH,qe.width),D.pixelStorei(D.UNPACK_IMAGE_HEIGHT,qe.height),D.pixelStorei(D.UNPACK_SKIP_PIXELS,Mt),D.pixelStorei(D.UNPACK_SKIP_ROWS,At),b.isDataTexture?D.texSubImage2D(D.TEXTURE_2D,B,It,Ft,rt,_t,Dt,le,qe.data):b.isCompressedTexture?D.compressedTexSubImage2D(D.TEXTURE_2D,B,It,Ft,qe.width,qe.height,Dt,qe.data):D.texSubImage2D(D.TEXTURE_2D,B,It,Ft,rt,_t,Dt,le,qe),D.pixelStorei(D.UNPACK_ROW_LENGTH,xe),D.pixelStorei(D.UNPACK_IMAGE_HEIGHT,Ae),D.pixelStorei(D.UNPACK_SKIP_PIXELS,An),D.pixelStorei(D.UNPACK_SKIP_ROWS,se),D.pixelStorei(D.UNPACK_SKIP_IMAGES,Nt),B===0&&z.generateMipmaps&&D.generateMipmap(D.TEXTURE_2D),Tt.unbindTexture()},this.copyTextureToTexture3D=function(b,z,V=null,j=null,B=0){b.isTexture!==!0&&(Sc("WebGLRenderer: copyTextureToTexture3D function signature has changed."),V=arguments[0]||null,j=arguments[1]||null,b=arguments[2],z=arguments[3],B=arguments[4]||0);let rt,_t,Mt,At,It,Ft,Dt,le,xe;const Ae=b.isCompressedTexture?b.mipmaps[B]:b.image;V!==null?(rt=V.max.x-V.min.x,_t=V.max.y-V.min.y,Mt=V.max.z-V.min.z,At=V.min.x,It=V.min.y,Ft=V.min.z):(rt=Ae.width,_t=Ae.height,Mt=Ae.depth,At=0,It=0,Ft=0),j!==null?(Dt=j.x,le=j.y,xe=j.z):(Dt=0,le=0,xe=0);const An=Gt.convert(z.format),se=Gt.convert(z.type);let Nt;if(z.isData3DTexture)w.setTexture3D(z,0),Nt=D.TEXTURE_3D;else if(z.isDataArrayTexture||z.isCompressedArrayTexture)w.setTexture2DArray(z,0),Nt=D.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}D.pixelStorei(D.UNPACK_FLIP_Y_WEBGL,z.flipY),D.pixelStorei(D.UNPACK_PREMULTIPLY_ALPHA_WEBGL,z.premultiplyAlpha),D.pixelStorei(D.UNPACK_ALIGNMENT,z.unpackAlignment);const qe=D.getParameter(D.UNPACK_ROW_LENGTH),re=D.getParameter(D.UNPACK_IMAGE_HEIGHT),ni=D.getParameter(D.UNPACK_SKIP_PIXELS),Ss=D.getParameter(D.UNPACK_SKIP_ROWS),Rn=D.getParameter(D.UNPACK_SKIP_IMAGES);D.pixelStorei(D.UNPACK_ROW_LENGTH,Ae.width),D.pixelStorei(D.UNPACK_IMAGE_HEIGHT,Ae.height),D.pixelStorei(D.UNPACK_SKIP_PIXELS,At),D.pixelStorei(D.UNPACK_SKIP_ROWS,It),D.pixelStorei(D.UNPACK_SKIP_IMAGES,Ft),b.isDataTexture||b.isData3DTexture?D.texSubImage3D(Nt,B,Dt,le,xe,rt,_t,Mt,An,se,Ae.data):z.isCompressedArrayTexture?D.compressedTexSubImage3D(Nt,B,Dt,le,xe,rt,_t,Mt,An,Ae.data):D.texSubImage3D(Nt,B,Dt,le,xe,rt,_t,Mt,An,se,Ae),D.pixelStorei(D.UNPACK_ROW_LENGTH,qe),D.pixelStorei(D.UNPACK_IMAGE_HEIGHT,re),D.pixelStorei(D.UNPACK_SKIP_PIXELS,ni),D.pixelStorei(D.UNPACK_SKIP_ROWS,Ss),D.pixelStorei(D.UNPACK_SKIP_IMAGES,Rn),B===0&&z.generateMipmaps&&D.generateMipmap(Nt),Tt.unbindTexture()},this.initRenderTarget=function(b){ct.get(b).__webglFramebuffer===void 0&&w.setupRenderTarget(b)},this.initTexture=function(b){b.isCubeTexture?w.setTextureCube(b,0):b.isData3DTexture?w.setTexture3D(b,0):b.isDataArrayTexture||b.isCompressedArrayTexture?w.setTexture2DArray(b,0):w.setTexture2D(b,0),Tt.unbindTexture()},this.resetState=function(){L=0,T=0,R=null,Tt.reset(),ae.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Fi}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const n=this.getContext();n.drawingBufferColorSpace=t===Zp?"display-p3":"srgb",n.unpackColorSpace=oe.workingColorSpace===Ru?"display-p3":"srgb"}}class kR extends an{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new xi,this.environmentIntensity=1,this.environmentRotation=new xi,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,n){return super.copy(t,n),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const n=super.toJSON(t);return this.fog!==null&&(n.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(n.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(n.object.backgroundIntensity=this.backgroundIntensity),n.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(n.object.environmentIntensity=this.environmentIntensity),n.object.environmentRotation=this.environmentRotation.toArray(),n}}class Id extends xs{constructor(t){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new ee(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}}const au=new I,su=new I,N0=new ve,to=new nl,Zl=new el,Yf=new I,U0=new I;class L0 extends an{constructor(t=new nn,n=new Id){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=n,this.updateMorphTargets()}copy(t,n){return super.copy(t,n),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){const t=this.geometry;if(t.index===null){const n=t.attributes.position,i=[0];for(let a=1,s=n.count;a<s;a++)au.fromBufferAttribute(n,a-1),su.fromBufferAttribute(n,a),i[a]=i[a-1],i[a]+=au.distanceTo(su);t.setAttribute("lineDistance",new Mn(i,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(t,n){const i=this.geometry,a=this.matrixWorld,s=t.params.Line.threshold,r=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Zl.copy(i.boundingSphere),Zl.applyMatrix4(a),Zl.radius+=s,t.ray.intersectsSphere(Zl)===!1)return;N0.copy(a).invert(),to.copy(t.ray).applyMatrix4(N0);const o=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=this.isLineSegments?2:1,h=i.index,f=i.attributes.position;if(h!==null){const p=Math.max(0,r.start),v=Math.min(h.count,r.start+r.count);for(let S=p,m=v-1;S<m;S+=c){const u=h.getX(S),g=h.getX(S+1),_=Kl(this,t,to,l,u,g);_&&n.push(_)}if(this.isLineLoop){const S=h.getX(v-1),m=h.getX(p),u=Kl(this,t,to,l,S,m);u&&n.push(u)}}else{const p=Math.max(0,r.start),v=Math.min(f.count,r.start+r.count);for(let S=p,m=v-1;S<m;S+=c){const u=Kl(this,t,to,l,S,S+1);u&&n.push(u)}if(this.isLineLoop){const S=Kl(this,t,to,l,v-1,p);S&&n.push(S)}}}updateMorphTargets(){const n=this.geometry.morphAttributes,i=Object.keys(n);if(i.length>0){const a=n[i[0]];if(a!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,r=a.length;s<r;s++){const o=a[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}}function Kl(e,t,n,i,a,s){const r=e.geometry.attributes.position;if(au.fromBufferAttribute(r,a),su.fromBufferAttribute(r,s),n.distanceSqToSegment(au,su,Yf,U0)>i)return;Yf.applyMatrix4(e.matrixWorld);const l=t.ray.origin.distanceTo(Yf);if(!(l<t.near||l>t.far))return{distance:l,point:U0.clone().applyMatrix4(e.matrixWorld),index:a,face:null,faceIndex:null,barycoord:null,object:e}}class Ec extends xs{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new ee(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}const O0=new ve,Bd=new nl,Ql=new el,Jl=new I;class Zf extends an{constructor(t=new nn,n=new Ec){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=n,this.updateMorphTargets()}copy(t,n){return super.copy(t,n),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,n){const i=this.geometry,a=this.matrixWorld,s=t.params.Points.threshold,r=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Ql.copy(i.boundingSphere),Ql.applyMatrix4(a),Ql.radius+=s,t.ray.intersectsSphere(Ql)===!1)return;O0.copy(a).invert(),Bd.copy(t.ray).applyMatrix4(O0);const o=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=i.index,d=i.attributes.position;if(c!==null){const f=Math.max(0,r.start),p=Math.min(c.count,r.start+r.count);for(let v=f,S=p;v<S;v++){const m=c.getX(v);Jl.fromBufferAttribute(d,m),P0(Jl,m,l,a,t,n,this)}}else{const f=Math.max(0,r.start),p=Math.min(d.count,r.start+r.count);for(let v=f,S=p;v<S;v++)Jl.fromBufferAttribute(d,v),P0(Jl,v,l,a,t,n,this)}}updateMorphTargets(){const n=this.geometry.morphAttributes,i=Object.keys(n);if(i.length>0){const a=n[i[0]];if(a!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,r=a.length;s<r;s++){const o=a[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}}function P0(e,t,n,i,a,s,r){const o=Bd.distanceSqToPoint(e);if(o<n){const l=new I;Bd.closestPointToPoint(e,l),l.applyMatrix4(i);const c=a.ray.origin.distanceTo(l);if(c<a.near||c>a.far)return;s.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:r})}}class $p extends nn{constructor(t=.5,n=1,i=32,a=1,s=0,r=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:t,outerRadius:n,thetaSegments:i,phiSegments:a,thetaStart:s,thetaLength:r},i=Math.max(3,i),a=Math.max(1,a);const o=[],l=[],c=[],h=[];let d=t;const f=(n-t)/a,p=new I,v=new Vt;for(let S=0;S<=a;S++){for(let m=0;m<=i;m++){const u=s+m/i*r;p.x=d*Math.cos(u),p.y=d*Math.sin(u),l.push(p.x,p.y,p.z),c.push(0,0,1),v.x=(p.x/n+1)/2,v.y=(p.y/n+1)/2,h.push(v.x,v.y)}d+=f}for(let S=0;S<a;S++){const m=S*(i+1);for(let u=0;u<i;u++){const g=u+m,_=g,y=g+i+1,L=g+i+2,T=g+1;o.push(_,y,T),o.push(y,L,T)}}this.setIndex(o),this.setAttribute("position",new Mn(l,3)),this.setAttribute("normal",new Mn(c,3)),this.setAttribute("uv",new Mn(h,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new $p(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}}class nr extends nn{constructor(t=1,n=32,i=16,a=0,s=Math.PI*2,r=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:n,heightSegments:i,phiStart:a,phiLength:s,thetaStart:r,thetaLength:o},n=Math.max(3,Math.floor(n)),i=Math.max(2,Math.floor(i));const l=Math.min(r+o,Math.PI);let c=0;const h=[],d=new I,f=new I,p=[],v=[],S=[],m=[];for(let u=0;u<=i;u++){const g=[],_=u/i;let y=0;u===0&&r===0?y=.5/n:u===i&&l===Math.PI&&(y=-.5/n);for(let L=0;L<=n;L++){const T=L/n;d.x=-t*Math.cos(a+T*s)*Math.sin(r+_*o),d.y=t*Math.cos(r+_*o),d.z=t*Math.sin(a+T*s)*Math.sin(r+_*o),v.push(d.x,d.y,d.z),f.copy(d).normalize(),S.push(f.x,f.y,f.z),m.push(T+y,1-_),g.push(c++)}h.push(g)}for(let u=0;u<i;u++)for(let g=0;g<n;g++){const _=h[u][g+1],y=h[u][g],L=h[u+1][g],T=h[u+1][g+1];(u!==0||r>0)&&p.push(_,y,T),(u!==i-1||l<Math.PI)&&p.push(y,L,T)}this.setIndex(p),this.setAttribute("position",new Mn(v,3)),this.setAttribute("normal",new Mn(S,3)),this.setAttribute("uv",new Mn(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new nr(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}class jR extends xs{constructor(t){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new ee(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new ee(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=ry,this.normalScale=new Vt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new xi,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class Ey extends an{constructor(t,n=1){super(),this.isLight=!0,this.type="Light",this.color=new ee(t),this.intensity=n}dispose(){}copy(t,n){return super.copy(t,n),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const n=super.toJSON(t);return n.object.color=this.color.getHex(),n.object.intensity=this.intensity,this.groundColor!==void 0&&(n.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(n.object.distance=this.distance),this.angle!==void 0&&(n.object.angle=this.angle),this.decay!==void 0&&(n.object.decay=this.decay),this.penumbra!==void 0&&(n.object.penumbra=this.penumbra),this.shadow!==void 0&&(n.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(n.object.target=this.target.uuid),n}}const Kf=new ve,z0=new I,I0=new I;class XR{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Vt(512,512),this.map=null,this.mapPass=null,this.matrix=new ve,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Qp,this._frameExtents=new Vt(1,1),this._viewportCount=1,this._viewports=[new pe(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const n=this.camera,i=this.matrix;z0.setFromMatrixPosition(t.matrixWorld),n.position.copy(z0),I0.setFromMatrixPosition(t.target.matrixWorld),n.lookAt(I0),n.updateMatrixWorld(),Kf.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Kf),i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(Kf)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}const B0=new ve,eo=new I,Qf=new I;class WR extends XR{constructor(){super(new Un(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new Vt(4,2),this._viewportCount=6,this._viewports=[new pe(2,1,1,1),new pe(0,1,1,1),new pe(3,1,1,1),new pe(1,1,1,1),new pe(3,0,1,1),new pe(1,0,1,1)],this._cubeDirections=[new I(1,0,0),new I(-1,0,0),new I(0,0,1),new I(0,0,-1),new I(0,1,0),new I(0,-1,0)],this._cubeUps=[new I(0,1,0),new I(0,1,0),new I(0,1,0),new I(0,1,0),new I(0,0,1),new I(0,0,-1)]}updateMatrices(t,n=0){const i=this.camera,a=this.matrix,s=t.distance||i.far;s!==i.far&&(i.far=s,i.updateProjectionMatrix()),eo.setFromMatrixPosition(t.matrixWorld),i.position.copy(eo),Qf.copy(i.position),Qf.add(this._cubeDirections[n]),i.up.copy(this._cubeUps[n]),i.lookAt(Qf),i.updateMatrixWorld(),a.makeTranslation(-eo.x,-eo.y,-eo.z),B0.multiplyMatrices(i.projectionMatrix,i.matrixWorldInverse),this._frustum.setFromProjectionMatrix(B0)}}class qR extends Ey{constructor(t,n,i=0,a=2){super(t,n),this.isPointLight=!0,this.type="PointLight",this.distance=i,this.decay=a,this.shadow=new WR}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(t,n){return super.copy(t,n),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}}class YR extends Ey{constructor(t,n){super(t,n),this.isAmbientLight=!0,this.type="AmbientLight"}}const F0=new ve;class ZR{constructor(t,n,i=0,a=1/0){this.ray=new nl(t,n),this.near=i,this.far=a,this.camera=null,this.layers=new Kp,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(t,n){this.ray.set(t,n)}setFromCamera(t,n){n.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(n.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(n).sub(this.ray.origin).normalize(),this.camera=n):n.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,(n.near+n.far)/(n.near-n.far)).unproject(n),this.ray.direction.set(0,0,-1).transformDirection(n.matrixWorld),this.camera=n):console.error("THREE.Raycaster: Unsupported camera type: "+n.type)}setFromXRController(t){return F0.identity().extractRotation(t.matrixWorld),this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(F0),this}intersectObject(t,n=!0,i=[]){return Fd(t,this,i,n),i.sort(H0),i}intersectObjects(t,n=!0,i=[]){for(let a=0,s=t.length;a<s;a++)Fd(t[a],this,i,n);return i.sort(H0),i}}function H0(e,t){return e.distance-t.distance}function Fd(e,t,n,i){let a=!0;if(e.layers.test(t.layers)&&e.raycast(t,n)===!1&&(a=!1),a===!0&&i===!0){const s=e.children;for(let r=0,o=s.length;r<o;r++)Fd(s[r],t,n,!0)}}class G0{constructor(t=1,n=0,i=0){return this.radius=t,this.phi=n,this.theta=i,this}set(t,n,i){return this.radius=t,this.phi=n,this.theta=i,this}copy(t){return this.radius=t.radius,this.phi=t.phi,this.theta=t.theta,this}makeSafe(){return this.phi=Math.max(1e-6,Math.min(Math.PI-1e-6,this.phi)),this}setFromVector3(t){return this.setFromCartesianCoords(t.x,t.y,t.z)}setFromCartesianCoords(t,n,i){return this.radius=Math.sqrt(t*t+n*n+i*i),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(t,i),this.phi=Math.acos(ln(n/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}}class KR extends vs{constructor(t,n=null){super(),this.object=t,this.domElement=n,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(){}disconnect(){}dispose(){}update(){}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Vp}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Vp);const V0={type:"change"},tm={type:"start"},by={type:"end"},$l=new nl,k0=new ra,QR=Math.cos(70*Rb.DEG2RAD),Ie=new I,mn=2*Math.PI,de={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},Jf=1e-6;class JR extends KR{constructor(t,n=null){super(t,n),this.state=de.NONE,this.enabled=!0,this.target=new I,this.cursor=new I,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:fr.ROTATE,MIDDLE:fr.DOLLY,RIGHT:fr.PAN},this.touches={ONE:$s.ROTATE,TWO:$s.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this._lastPosition=new I,this._lastQuaternion=new hs,this._lastTargetPosition=new I,this._quat=new hs().setFromUnitVectors(t.up,new I(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new G0,this._sphericalDelta=new G0,this._scale=1,this._panOffset=new I,this._rotateStart=new Vt,this._rotateEnd=new Vt,this._rotateDelta=new Vt,this._panStart=new Vt,this._panEnd=new Vt,this._panDelta=new Vt,this._dollyStart=new Vt,this._dollyEnd=new Vt,this._dollyDelta=new Vt,this._dollyDirection=new I,this._mouse=new Vt,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=tw.bind(this),this._onPointerDown=$R.bind(this),this._onPointerUp=ew.bind(this),this._onContextMenu=lw.bind(this),this._onMouseWheel=aw.bind(this),this._onKeyDown=sw.bind(this),this._onTouchStart=rw.bind(this),this._onTouchMove=ow.bind(this),this._onMouseDown=nw.bind(this),this._onMouseMove=iw.bind(this),this._interceptControlDown=cw.bind(this),this._interceptControlUp=uw.bind(this),this.domElement!==null&&this.connect(),this.update()}connect(){this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.getRootNode().removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.style.touchAction="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(t){t.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=t}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(V0),this.update(),this.state=de.NONE}update(t=null){const n=this.object.position;Ie.copy(n).sub(this.target),Ie.applyQuaternion(this._quat),this._spherical.setFromVector3(Ie),this.autoRotate&&this.state===de.NONE&&this._rotateLeft(this._getAutoRotationAngle(t)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let i=this.minAzimuthAngle,a=this.maxAzimuthAngle;isFinite(i)&&isFinite(a)&&(i<-Math.PI?i+=mn:i>Math.PI&&(i-=mn),a<-Math.PI?a+=mn:a>Math.PI&&(a-=mn),i<=a?this._spherical.theta=Math.max(i,Math.min(a,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(i+a)/2?Math.max(i,this._spherical.theta):Math.min(a,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let s=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{const r=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),s=r!=this._spherical.radius}if(Ie.setFromSpherical(this._spherical),Ie.applyQuaternion(this._quatInverse),n.copy(this.target).add(Ie),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let r=null;if(this.object.isPerspectiveCamera){const o=Ie.length();r=this._clampDistance(o*this._scale);const l=o-r;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),s=!!l}else if(this.object.isOrthographicCamera){const o=new I(this._mouse.x,this._mouse.y,0);o.unproject(this.object);const l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),s=l!==this.object.zoom;const c=new I(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(o),this.object.updateMatrixWorld(),r=Ie.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;r!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(r).add(this.object.position):($l.origin.copy(this.object.position),$l.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot($l.direction))<QR?this.object.lookAt(this.target):(k0.setFromNormalAndCoplanarPoint(this.object.up,this.target),$l.intersectPlane(k0,this.target))))}else if(this.object.isOrthographicCamera){const r=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),r!==this.object.zoom&&(this.object.updateProjectionMatrix(),s=!0)}return this._scale=1,this._performCursorZoom=!1,s||this._lastPosition.distanceToSquared(this.object.position)>Jf||8*(1-this._lastQuaternion.dot(this.object.quaternion))>Jf||this._lastTargetPosition.distanceToSquared(this.target)>Jf?(this.dispatchEvent(V0),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(t){return t!==null?mn/60*this.autoRotateSpeed*t:mn/60/60*this.autoRotateSpeed}_getZoomScale(t){const n=Math.abs(t*.01);return Math.pow(.95,this.zoomSpeed*n)}_rotateLeft(t){this._sphericalDelta.theta-=t}_rotateUp(t){this._sphericalDelta.phi-=t}_panLeft(t,n){Ie.setFromMatrixColumn(n,0),Ie.multiplyScalar(-t),this._panOffset.add(Ie)}_panUp(t,n){this.screenSpacePanning===!0?Ie.setFromMatrixColumn(n,1):(Ie.setFromMatrixColumn(n,0),Ie.crossVectors(this.object.up,Ie)),Ie.multiplyScalar(t),this._panOffset.add(Ie)}_pan(t,n){const i=this.domElement;if(this.object.isPerspectiveCamera){const a=this.object.position;Ie.copy(a).sub(this.target);let s=Ie.length();s*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*t*s/i.clientHeight,this.object.matrix),this._panUp(2*n*s/i.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(t*(this.object.right-this.object.left)/this.object.zoom/i.clientWidth,this.object.matrix),this._panUp(n*(this.object.top-this.object.bottom)/this.object.zoom/i.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(t,n){if(!this.zoomToCursor)return;this._performCursorZoom=!0;const i=this.domElement.getBoundingClientRect(),a=t-i.left,s=n-i.top,r=i.width,o=i.height;this._mouse.x=a/r*2-1,this._mouse.y=-(s/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(t){return Math.max(this.minDistance,Math.min(this.maxDistance,t))}_handleMouseDownRotate(t){this._rotateStart.set(t.clientX,t.clientY)}_handleMouseDownDolly(t){this._updateZoomParameters(t.clientX,t.clientX),this._dollyStart.set(t.clientX,t.clientY)}_handleMouseDownPan(t){this._panStart.set(t.clientX,t.clientY)}_handleMouseMoveRotate(t){this._rotateEnd.set(t.clientX,t.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const n=this.domElement;this._rotateLeft(mn*this._rotateDelta.x/n.clientHeight),this._rotateUp(mn*this._rotateDelta.y/n.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(t){this._dollyEnd.set(t.clientX,t.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(t){this._panEnd.set(t.clientX,t.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(t){this._updateZoomParameters(t.clientX,t.clientY),t.deltaY<0?this._dollyIn(this._getZoomScale(t.deltaY)):t.deltaY>0&&this._dollyOut(this._getZoomScale(t.deltaY)),this.update()}_handleKeyDown(t){let n=!1;switch(t.code){case this.keys.UP:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateUp(mn*this.rotateSpeed/this.domElement.clientHeight):this._pan(0,this.keyPanSpeed),n=!0;break;case this.keys.BOTTOM:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateUp(-mn*this.rotateSpeed/this.domElement.clientHeight):this._pan(0,-this.keyPanSpeed),n=!0;break;case this.keys.LEFT:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateLeft(mn*this.rotateSpeed/this.domElement.clientHeight):this._pan(this.keyPanSpeed,0),n=!0;break;case this.keys.RIGHT:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateLeft(-mn*this.rotateSpeed/this.domElement.clientHeight):this._pan(-this.keyPanSpeed,0),n=!0;break}n&&(t.preventDefault(),this.update())}_handleTouchStartRotate(t){if(this._pointers.length===1)this._rotateStart.set(t.pageX,t.pageY);else{const n=this._getSecondPointerPosition(t),i=.5*(t.pageX+n.x),a=.5*(t.pageY+n.y);this._rotateStart.set(i,a)}}_handleTouchStartPan(t){if(this._pointers.length===1)this._panStart.set(t.pageX,t.pageY);else{const n=this._getSecondPointerPosition(t),i=.5*(t.pageX+n.x),a=.5*(t.pageY+n.y);this._panStart.set(i,a)}}_handleTouchStartDolly(t){const n=this._getSecondPointerPosition(t),i=t.pageX-n.x,a=t.pageY-n.y,s=Math.sqrt(i*i+a*a);this._dollyStart.set(0,s)}_handleTouchStartDollyPan(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enablePan&&this._handleTouchStartPan(t)}_handleTouchStartDollyRotate(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enableRotate&&this._handleTouchStartRotate(t)}_handleTouchMoveRotate(t){if(this._pointers.length==1)this._rotateEnd.set(t.pageX,t.pageY);else{const i=this._getSecondPointerPosition(t),a=.5*(t.pageX+i.x),s=.5*(t.pageY+i.y);this._rotateEnd.set(a,s)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const n=this.domElement;this._rotateLeft(mn*this._rotateDelta.x/n.clientHeight),this._rotateUp(mn*this._rotateDelta.y/n.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(t){if(this._pointers.length===1)this._panEnd.set(t.pageX,t.pageY);else{const n=this._getSecondPointerPosition(t),i=.5*(t.pageX+n.x),a=.5*(t.pageY+n.y);this._panEnd.set(i,a)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(t){const n=this._getSecondPointerPosition(t),i=t.pageX-n.x,a=t.pageY-n.y,s=Math.sqrt(i*i+a*a);this._dollyEnd.set(0,s),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);const r=(t.pageX+n.x)*.5,o=(t.pageY+n.y)*.5;this._updateZoomParameters(r,o)}_handleTouchMoveDollyPan(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enablePan&&this._handleTouchMovePan(t)}_handleTouchMoveDollyRotate(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enableRotate&&this._handleTouchMoveRotate(t)}_addPointer(t){this._pointers.push(t.pointerId)}_removePointer(t){delete this._pointerPositions[t.pointerId];for(let n=0;n<this._pointers.length;n++)if(this._pointers[n]==t.pointerId){this._pointers.splice(n,1);return}}_isTrackingPointer(t){for(let n=0;n<this._pointers.length;n++)if(this._pointers[n]==t.pointerId)return!0;return!1}_trackPointer(t){let n=this._pointerPositions[t.pointerId];n===void 0&&(n=new Vt,this._pointerPositions[t.pointerId]=n),n.set(t.pageX,t.pageY)}_getSecondPointerPosition(t){const n=t.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[n]}_customWheelEvent(t){const n=t.deltaMode,i={clientX:t.clientX,clientY:t.clientY,deltaY:t.deltaY};switch(n){case 1:i.deltaY*=16;break;case 2:i.deltaY*=100;break}return t.ctrlKey&&!this._controlActive&&(i.deltaY*=10),i}}function $R(e){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(e.pointerId),this.domElement.addEventListener("pointermove",this._onPointerMove),this.domElement.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(e)&&(this._addPointer(e),e.pointerType==="touch"?this._onTouchStart(e):this._onMouseDown(e)))}function tw(e){this.enabled!==!1&&(e.pointerType==="touch"?this._onTouchMove(e):this._onMouseMove(e))}function ew(e){switch(this._removePointer(e),this._pointers.length){case 0:this.domElement.releasePointerCapture(e.pointerId),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(by),this.state=de.NONE;break;case 1:const t=this._pointers[0],n=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:n.x,pageY:n.y});break}}function nw(e){let t;switch(e.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case fr.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(e),this.state=de.DOLLY;break;case fr.ROTATE:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(e),this.state=de.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(e),this.state=de.ROTATE}break;case fr.PAN:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(e),this.state=de.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(e),this.state=de.PAN}break;default:this.state=de.NONE}this.state!==de.NONE&&this.dispatchEvent(tm)}function iw(e){switch(this.state){case de.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(e);break;case de.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(e);break;case de.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(e);break}}function aw(e){this.enabled===!1||this.enableZoom===!1||this.state!==de.NONE||(e.preventDefault(),this.dispatchEvent(tm),this._handleMouseWheel(this._customWheelEvent(e)),this.dispatchEvent(by))}function sw(e){this.enabled===!1||this.enablePan===!1||this._handleKeyDown(e)}function rw(e){switch(this._trackPointer(e),this._pointers.length){case 1:switch(this.touches.ONE){case $s.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(e),this.state=de.TOUCH_ROTATE;break;case $s.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(e),this.state=de.TOUCH_PAN;break;default:this.state=de.NONE}break;case 2:switch(this.touches.TWO){case $s.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(e),this.state=de.TOUCH_DOLLY_PAN;break;case $s.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(e),this.state=de.TOUCH_DOLLY_ROTATE;break;default:this.state=de.NONE}break;default:this.state=de.NONE}this.state!==de.NONE&&this.dispatchEvent(tm)}function ow(e){switch(this._trackPointer(e),this.state){case de.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(e),this.update();break;case de.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(e),this.update();break;case de.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(e),this.update();break;case de.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(e),this.update();break;default:this.state=de.NONE}}function lw(e){this.enabled!==!1&&e.preventDefault()}function cw(e){e.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function uw(e){e.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}const fw=.01720209895,$a=Math.PI/180;function no(e){return e.getTime()/864e5+24405875e-1}function Hd(e){return new Date((e-24405875e-1)*864e5)}function hw(e){const t=Hd(e);return isNaN(t.getTime())?"Unknown Date":t.toISOString().split("T")[0]+" "+t.toTimeString().split(" ")[0]}function dw(e,t){let n=e%(2*Math.PI);n>Math.PI&&(n-=2*Math.PI),n<-Math.PI&&(n+=2*Math.PI);let i=n;t>.8&&(i=n+t*Math.sin(n));const a=30,s=1e-12;for(let r=0;r<a;r++){const o=i-t*Math.sin(i)-n,l=1-t*Math.cos(i),c=o/l;if(i-=c,Math.abs(c)<s)break}return i}function pw(e,t){let n=e;t>1.2&&(n=Math.log(2*Math.abs(e)/t+1.8)*Math.sign(e));const i=30,a=1e-12;for(let s=0;s<i;s++){const r=t*Math.sinh(n)-n-e,o=t*Math.cosh(n)-1,l=r/o;if(n-=l,Math.abs(l)<a)break}return n}function mw(e){const t=Math.sqrt(e*e+1),n=Math.cbrt(e+t),i=Math.cbrt(e-t);return n+i}function ir(e,t){const{a:n,e:i,i:a,om:s,w:r,ma:o,epoch:l,q:c,tp:h}=e,d=i<.999,f=i>1.001;let p=0,v=0;if(d){const G=t-l;let O=e.n;O==null&&(O=.9856076686/Math.pow(n,1.5));const Z=(o+O*G)*$a,it=dw(Z,i);p=n*(Math.cos(it)-i),v=n*Math.sqrt(1-i*i)*Math.sin(it)}else if(f){const G=t-h,O=Math.abs(n),Z=fw/Math.pow(O,1.5)*G,it=pw(Z,i);p=O*(i-Math.cosh(it)),v=O*Math.sqrt(i*i-1)*Math.sinh(it)}else{const O=.03649116244*(t-h)/Math.pow(c,1.5),nt=mw(O);p=c*(1-nt*nt),v=2*c*nt}const S=a*$a,m=s*$a,u=r*$a,g=Math.cos(u),_=Math.sin(u),y=Math.cos(m),L=Math.sin(m),T=Math.cos(S),R=Math.sin(S),U=g*y-_*L*T,X=g*L+_*y*T,x=_*R,E=-_*y-g*L*T,q=-_*L+g*y*T,W=g*R,J=p*U+v*E,et=p*X+v*q,N=p*x+v*W;return{x:J,y:et,z:N}}function ru(e,t=120){const{e:n}=e,i=[];if(n<.999)for(let a=0;a<=t;a++){const s=a/t*2*Math.PI,r=e.a*(Math.cos(s)-n),o=e.a*Math.sqrt(1-n*n)*Math.sin(s),l=$f(r,o,e.i,e.om,e.w);i.push(l)}else if(n>1.001){const a=Math.acosh(10/Math.abs(e.a)+n),s=Math.min(a||3,3);for(let r=0;r<=t;r++){const o=-s+r/t*2*s,l=Math.abs(e.a),c=l*(n-Math.cosh(o)),h=l*Math.sqrt(n*n-1)*Math.sinh(o),d=$f(c,h,e.i,e.om,e.w);i.push(d)}}else{const a=Math.sqrt(Math.max(10/e.q-1,1)),s=Math.min(a,4);for(let r=0;r<=t;r++){const o=-s+r/t*2*s,l=e.q*(1-o*o),c=2*e.q*o,h=$f(l,c,e.i,e.om,e.w);i.push(h)}}return i}function $f(e,t,n,i,a){const s=n*$a,r=i*$a,o=a*$a,l=Math.cos(o),c=Math.sin(o),h=Math.cos(r),d=Math.sin(r),f=Math.cos(s),p=Math.sin(s),v=l*h-c*d*f,S=l*d+c*h*f,m=c*p,u=-c*h-l*d*f,g=-c*d+l*h*f,_=l*p;return{x:e*v+t*u,y:e*S+t*g,z:e*m+t*_}}const gw=({planets:e,asteroids:t,comets:n,sentryMap:i,selectedBody:a,onSelectBody:s,currentJD:r,showComets:o,showSentryOnly:l,asteroidFilter:c,planetScale:h,cameraMode:d,setCameraMode:f})=>{const p=pt.useRef(null),v=pt.useRef(null),S=pt.useRef(null),m=pt.useRef(null),u=pt.useRef(null),g=pt.useRef(null),_=pt.useRef(null),y=pt.useRef(null),L=pt.useRef(new Vt),T=pt.useRef([]),R=pt.useRef([]),U=pt.useRef(null),X=pt.useRef(null),x=pt.useRef(null),E=pt.useRef(null),q=pt.useRef(null),W=pt.useRef([]),J=pt.useRef([]),et=pt.useRef(!1),N={sun:16771584,mercury:10265519,venus:15067115,earth:3900150,mars:15680580,jupiter:16096779,saturn:14251782,uranus:440020,neptune:5195493,pha:16347926,sentry:15680580,neo:440020,standardAst:7041664,comet:11032055,selected:16436245},G=pt.useMemo(()=>t.filter(Z=>{var yt;if(c.search){const Ct=c.search.toLowerCase(),k=(yt=Z.name)==null?void 0:yt.toLowerCase().includes(Ct),K=Z.pdes.toLowerCase().includes(Ct),lt=Z.full_name.toLowerCase().includes(Ct);if(!k&&!K&&!lt)return!1}if(c.classCode!=="all"&&Z.class!==c.classCode||c.hazardStatus==="pha"&&!Z.pha||c.hazardStatus==="non-pha"&&Z.pha)return!1;const it=i.has(Z.pdes);if(l&&!it)return!1;if(Z.diameter!==null){if(Z.diameter<c.sizeRange[0]||Z.diameter>c.sizeRange[1])return!1}else if(c.sizeRange[0]>0)return!1;return!(Z.moid>c.moidMax)}),[t,c,l,i]),O=pt.useMemo(()=>{if(!o)return[];if(c.search){const Z=c.search.toLowerCase();return n.filter(it=>it.full_name.toLowerCase().includes(Z)||it.pdes.toLowerCase().includes(Z))}return n},[n,o,c.search]);pt.useEffect(()=>{W.current=G},[G]),pt.useEffect(()=>{J.current=O},[O]),pt.useEffect(()=>{if(!p.current||!v.current)return;const Z=p.current.clientWidth,it=p.current.clientHeight,yt=new kR;m.current=yt;const Ct=new Un(60,Z/it,.01,1e3);Ct.position.set(0,-3,3),u.current=Ct;const k=new VR({canvas:v.current,antialias:!0,alpha:!1});k.setSize(Z,it),k.setPixelRatio(Math.min(window.devicePixelRatio,2)),g.current=k;const K=new JR(Ct,k.domElement);K.enableDamping=!0,K.dampingFactor=.05,K.maxDistance=150,K.minDistance=.1,_.current=K;const lt=()=>{et.current=!1},st=()=>{setTimeout(()=>{et.current=!1},50)},xt=()=>{et.current=!0};K.addEventListener("start",lt),K.addEventListener("end",st),K.addEventListener("change",xt);const Et=new YR(1976635,1.2);yt.add(Et);const Ut=new qR(16777215,2.5,300,0);yt.add(Ut);const qt=new nn,bt=3e3,D=new Float32Array(bt*3);for(let F=0;F<bt*3;F+=3){const tt=Math.random(),ht=Math.random(),dt=tt*2*Math.PI,Zt=Math.acos(2*ht-1),me=200+Math.random()*50;D[F]=me*Math.sin(Zt)*Math.cos(dt),D[F+1]=me*Math.sin(Zt)*Math.sin(dt),D[F+2]=me*Math.cos(Zt)}qt.setAttribute("position",new cn(D,3));const Yt=new Ec({color:16777215,size:.8,sizeAttenuation:!1}),Rt=new Zf(qt,Yt);yt.add(Rt);const Bt=new nr(.08,32,32),Tt=new tr({color:N.sun}),Lt=new vn(Bt,Tt);yt.add(Lt);const ct=new nr(.12,32,32),w=new tr({color:N.sun,transparent:!0,opacity:.15,blending:bo}),M=new vn(ct,w);yt.add(M);const C=[];T.current=C,e.forEach(F=>{const ht=ru(F,180).map(Vn=>new I(Vn.x,Vn.y,Vn.z)),dt=new nn().setFromPoints(ht),me=(Vn=>{const ys=Vn.toLowerCase();return N[ys]||16777215})(F.name),$e=new Id({color:me,transparent:!0,opacity:.25}),te=new L0(dt,$e);yt.add(te);const Tn={Mercury:.015,Venus:.024,Earth:.025,Mars:.018,Jupiter:.055,Saturn:.048,Uranus:.035,Neptune:.034}[F.name]||.02,al=new nr(Tn,16,16),sl=new jR({color:me,roughness:.8,metalness:.1}),Gn=new vn(al,sl);if(Gn.userData={type:"planet",data:F},yt.add(Gn),C.push(Gn),F.name==="Saturn"){const Vn=new $p(Tn*1.4,Tn*2.3,32);Vn.rotateX(Math.PI/2.3);const ys=new tr({color:N.saturn,side:pi,transparent:!0,opacity:.4}),rl=new vn(Vn,ys);Gn.add(rl)}});const H=45e3,Q=new nn,Y=new Float32Array(H*3),St=new Float32Array(H*3);for(let F=0;F<H*3;F++)Y[F]=1e4;Q.setAttribute("position",new cn(Y,3)),Q.setAttribute("color",new cn(St,3));const ot=new Ec({size:2.2,sizeAttenuation:!1,vertexColors:!0,transparent:!0,opacity:.75,depthWrite:!1,blending:bo}),mt=new Zf(Q,ot);yt.add(mt),E.current=mt;const zt=5e3,at=new nn,ft=new Float32Array(zt*3),wt=new Float32Array(zt*3);for(let F=0;F<zt*3;F++)ft[F]=1e4;at.setAttribute("position",new cn(ft,3)),at.setAttribute("color",new cn(wt,3));const Ot=new Ec({size:2.5,sizeAttenuation:!1,vertexColors:!0,transparent:!0,opacity:.9,depthWrite:!1,blending:bo}),vt=new Zf(at,Ot);yt.add(vt),q.current=vt;const Ht=new nr(.04,8,8),Gt=new tr({color:N.selected,wireframe:!0,transparent:!0,opacity:.8}),ae=new vn(Ht,Gt);ae.visible=!1,yt.add(ae),X.current=ae;const P=new ZR;P.params.Points.threshold=.05,y.current=P;const gt=()=>{if(!p.current||!k||!Ct)return;const F=p.current.clientWidth,tt=p.current.clientHeight;Ct.aspect=F/tt,Ct.updateProjectionMatrix(),k.setSize(F,tt)};return window.addEventListener("resize",gt),()=>{window.removeEventListener("resize",gt),K.removeEventListener("start",lt),K.removeEventListener("end",st),K.removeEventListener("change",xt),qt.dispose(),Yt.dispose(),Bt.dispose(),Tt.dispose(),ct.dispose(),w.dispose(),Q.dispose(),ot.dispose(),at.dispose(),Ot.dispose(),Ht.dispose(),Gt.dispose(),C.forEach(F=>{F.geometry.dispose(),Array.isArray(F.material)?F.material.forEach(tt=>tt.dispose()):F.material.dispose()}),x.current&&(x.current.geometry.dispose(),x.current.material.dispose()),K.dispose(),k.dispose()}},[e]);const nt=Z=>{if(et.current||!m.current||!u.current||!y.current||!v.current)return;const it=v.current.getBoundingClientRect(),yt=(Z.clientX-it.left)/it.width*2-1,Ct=-((Z.clientY-it.top)/it.height)*2+1;L.current.set(yt,Ct),y.current.setFromCamera(L.current,u.current);const k=y.current.intersectObjects(T.current);if(k.length>0){const K=k[0].object;if(K.userData&&K.userData.type==="planet"){s(K.userData.data);return}}if(o&&q.current){const K=y.current.intersectObject(q.current);if(K.length>0){const st=K.sort((xt,Et)=>xt.distanceToRay-Et.distanceToRay)[0].index;if(st!==void 0&&st<J.current.length){s(J.current[st]);return}}}if(E.current){const K=y.current.intersectObject(E.current);if(K.length>0){const st=K.sort((xt,Et)=>xt.distanceToRay-Et.distanceToRay)[0].index;if(st!==void 0&&st<W.current.length){s(W.current[st]);return}}}};return pt.useEffect(()=>{const Z=m.current;if(Z&&(x.current&&(Z.remove(x.current),x.current.geometry.dispose(),x.current.material.dispose(),x.current=null),a)){let it=N.selected;"pha"in a&&a.pha?it=N.pha:i.has(a.pdes)?it=N.sentry:"M1"in a&&(it=N.comet);const yt="e"in a&&a.e>1.001?300:180,k=ru(a,yt).map(xt=>new I(xt.x,xt.y,xt.z)),K=new nn().setFromPoints(k),lt=new Id({color:it,transparent:!0,opacity:.6,linewidth:1.5}),st=new L0(K,lt);Z.add(st),x.current=st}},[a,i]),pt.useEffect(()=>{let Z;const it=()=>{Z=requestAnimationFrame(it);const yt=m.current,Ct=u.current,k=g.current,K=_.current;if(!yt||!Ct||!k||!K)return;e.forEach((bt,D)=>{const Yt=T.current[D];if(Yt){const Rt=ir(bt,r);Yt.position.set(Rt.x,Rt.y,Rt.z);const Lt=({Mercury:.015,Venus:.024,Earth:.025,Mars:.018,Jupiter:.055,Saturn:.048,Uranus:.035,Neptune:.034}[bt.name]||.02)*h;Yt.scale.set(Lt,Lt,Lt)}});const lt=W.current,st=E.current;if(st){const bt=st.geometry.getAttribute("position"),D=bt.array,Yt=st.geometry.getAttribute("color"),Rt=Yt.array,Bt=D.length/3,Tt=Math.min(lt.length,Bt);for(let Lt=0;Lt<Bt;Lt++){const ct=Lt*3;if(Lt<Tt){const w=lt[Lt],M=ir(w,r);D[ct]=M.x,D[ct+1]=M.y,D[ct+2]=M.z;let C=N.standardAst;a&&a.pdes===w.pdes?C=N.selected:i.has(w.pdes)?C=N.sentry:w.pha?C=N.pha:w.neo&&(C=N.neo);const H=(C>>16&255)/255,Q=(C>>8&255)/255,Y=(C&255)/255;Rt[ct]=H,Rt[ct+1]=Q,Rt[ct+2]=Y}else D[ct]=1e4,D[ct+1]=1e4,D[ct+2]=1e4}bt.needsUpdate=!0,Yt.needsUpdate=!0}const xt=J.current,Et=q.current;if(Et&&o){const bt=Et.geometry.getAttribute("position"),D=bt.array,Yt=Et.geometry.getAttribute("color"),Rt=Yt.array,Bt=D.length/3,Tt=Math.min(xt.length,Bt);for(let Lt=0;Lt<Bt;Lt++){const ct=Lt*3;if(Lt<Tt){const w=xt[Lt],M=ir(w,r);D[ct]=M.x,D[ct+1]=M.y,D[ct+2]=M.z;let C=N.comet;a&&a.pdes===w.pdes&&(C=N.selected);const H=(C>>16&255)/255,Q=(C>>8&255)/255,Y=(C&255)/255;Rt[ct]=H,Rt[ct+1]=Q,Rt[ct+2]=Y}else D[ct]=1e4,D[ct+1]=1e4,D[ct+2]=1e4}bt.needsUpdate=!0,Yt.needsUpdate=!0}let Ut=null;if(a){if(Ut=ir(a,r),X.current){X.current.position.set(Ut.x,Ut.y,Ut.z),X.current.visible=!0;const bt=1+.3*Math.sin(Date.now()*.005);let D=1;"radius_km"in a&&(D=1.5),X.current.scale.set(bt*D,bt*D,bt*D)}}else X.current&&(X.current.visible=!1);d==="follow"&&a&&Ut&&K.target.set(Ut.x,Ut.y,Ut.z),K.update(),k.render(yt,Ct);const qt=S.current;if(qt){const bt=qt.clientWidth/2,D=qt.clientHeight/2,Yt=new I;e.forEach((Bt,Tt)=>{const Lt=T.current[Tt],ct=R.current[Tt];if(Lt&&ct)if(Yt.setFromMatrixPosition(Lt.matrixWorld),Yt.project(Ct),Yt.z>1)ct.style.display="none";else{ct.style.display="block";const M=Yt.x*bt+bt,C=-Yt.y*D+D;ct.style.transform=`translate(-50%, -100%) translate(${M}px, ${C}px)`}});const Rt=U.current;if(Rt&&a&&Ut)if(Yt.set(Ut.x,Ut.y,Ut.z),Yt.project(Ct),Yt.z>1)Rt.style.display="none";else{Rt.style.display="block";const Tt=Yt.x*bt+bt,Lt=-Yt.y*D+D;Rt.style.transform=`translate(-50%, -140%) translate(${Tt}px, ${Lt}px)`}else Rt&&(Rt.style.display="none")}};return it(),()=>{cancelAnimationFrame(Z)}},[e,r,h,d,a,o]),pt.useEffect(()=>{const it=setInterval(()=>{d==="follow"&&et.current&&f("free")},100);return()=>clearInterval(it)},[d,f]),A.jsxs("div",{ref:p,className:"relative w-full h-full cursor-grab active:cursor-grabbing select-none overflow-hidden",children:[A.jsx("canvas",{ref:v,className:"w-full h-full block bg-space-950",onClick:nt}),A.jsxs("div",{ref:S,className:"absolute inset-0 pointer-events-none w-full h-full overflow-hidden",children:[e.map((Z,it)=>A.jsxs("div",{ref:yt=>R.current[it]=yt,className:"absolute left-0 top-0 text-[10px] md:text-[11px] font-medium px-2 py-0.5 rounded border border-gray-800/40 bg-gray-950/80 text-gray-300 backdrop-blur-[2px] transition-opacity duration-300 flex items-center gap-1 shadow-md shadow-black/20",style:{display:"none"},children:[A.jsx("span",{className:"w-1.5 h-1.5 rounded-full",style:{backgroundColor:`#${(N[Z.name.toLowerCase()]||16777215).toString(16).padStart(6,"0")}`}}),Z.name]},Z.name)),a&&A.jsxs("div",{ref:U,className:"absolute left-0 top-0 px-2.5 py-1 text-xs font-bold rounded-md bg-yellow-500/90 text-gray-950 shadow-lg border border-yellow-400 flex flex-col items-center gap-0.5 text-center min-w-[110px]",style:{display:"none"},children:[A.jsx("div",{className:"uppercase tracking-wider font-mono text-[9px] text-gray-950/75",children:"radius_km"in a?"Planet":"M1"in a?"Comet":"Asteroid"}),A.jsx("div",{children:"radius_km"in a?a.name:a.name||a.pdes}),"pha"in a&&a.pha&&A.jsx("span",{className:"text-[8px] bg-red-600 text-white px-1 py-0.5 rounded font-mono uppercase mt-0.5",children:"PHA"}),i.has(a.pdes)&&A.jsx("span",{className:"text-[8px] bg-red-600 text-white px-1 py-0.5 rounded font-mono uppercase mt-0.5",children:"Sentry"})]}),A.jsxs("div",{className:"absolute bottom-4 left-4 bg-gray-950/80 border border-gray-800 p-2.5 rounded font-mono text-[10px] text-gray-400 flex flex-col gap-1 backdrop-blur-md",children:[A.jsxs("div",{className:"flex items-center gap-1.5",children:[A.jsx("span",{className:"w-2 h-2 bg-yellow-500 rounded-full animate-ping"}),A.jsx("span",{className:"text-gray-200 font-bold",children:"J2000 ECLIPTIC FRAME"})]}),A.jsxs("div",{children:["JD: ",r.toFixed(4)]}),A.jsxs("div",{children:["UT: ",hw(r)]}),A.jsxs("div",{className:"mt-1 flex gap-2",children:[A.jsxs("span",{className:"flex items-center gap-1",children:[A.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-cyan-500"})," NEO"]}),A.jsxs("span",{className:"flex items-center gap-1",children:[A.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-orange-500"})," PHA"]}),A.jsxs("span",{className:"flex items-center gap-1",children:[A.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-red-500"})," Sentry"]}),o&&A.jsxs("span",{className:"flex items-center gap-1",children:[A.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-purple-500"})," Comet"]})]})]})]})]})},_w=({selectedBody:e,earth:t,currentJD:n})=>{const i=pt.useRef(null);return pt.useEffect(()=>{const a=i.current;if(!a)return;const s=a.getContext("2d");if(!s)return;const r=a.width,o=a.height,l=r/2,c=o/2;s.fillStyle="#0b0f19",s.fillRect(0,0,r,o),s.strokeStyle="rgba(61, 79, 115, 0.1)",s.lineWidth=1;for(let U=50;U<r;U+=50)s.beginPath(),s.moveTo(U,0),s.lineTo(U,o),s.stroke();for(let U=50;U<o;U+=50)s.beginPath(),s.moveTo(0,U),s.lineTo(r,U),s.stroke();const h=e.a||e.q,d=Math.max(1.3,h*(1+e.e)*1.1),f=r/2/d,p=(U,X)=>({cx:l+U*f,cy:c-X*f});s.beginPath(),s.arc(l,c,6,0,2*Math.PI),s.fillStyle="#eab308",s.shadowBlur=12,s.shadowColor="#eab308",s.fill(),s.shadowBlur=0,s.beginPath(),ru(t,100).forEach((U,X)=>{const{cx:x,cy:E}=p(U.x,U.y);X===0?s.moveTo(x,E):s.lineTo(x,E)}),s.closePath(),s.strokeStyle="rgba(59, 130, 246, 0.4)",s.lineWidth=1.5,s.stroke(),s.beginPath(),ru(e,120).forEach((U,X)=>{const{cx:x,cy:E}=p(U.x,U.y);X===0?s.moveTo(x,E):s.lineTo(x,E)}),e.e<.999&&s.closePath();let m="rgba(234, 179, 8, 0.7)";"pha"in e&&e.pha?m="rgba(249, 115, 22, 0.7)":"M1"in e&&(m="rgba(168, 85, 247, 0.7)"),s.strokeStyle=m,s.lineWidth=2,s.stroke();const u=ir(t,n),g=ir(e,n),_=p(u.x,u.y),y=p(g.x,g.y);s.beginPath(),s.arc(_.cx,_.cy,4,0,2*Math.PI),s.fillStyle="#3b82f6",s.fill(),s.strokeStyle="#ffffff",s.lineWidth=1,s.stroke(),s.beginPath(),s.arc(y.cx,y.cy,4,0,2*Math.PI),s.fillStyle=m,s.fill(),s.strokeStyle="#ffffff",s.lineWidth=1,s.stroke(),s.setLineDash([2,3]),s.strokeStyle="rgba(255, 255, 255, 0.15)",s.lineWidth=1,s.beginPath(),s.moveTo(l,c),s.lineTo(_.cx,_.cy),s.stroke(),s.beginPath(),s.moveTo(l,c),s.lineTo(y.cx,y.cy),s.stroke(),s.setLineDash([3,3]),s.strokeStyle="rgba(239, 68, 68, 0.4)",s.beginPath(),s.moveTo(_.cx,_.cy),s.lineTo(y.cx,y.cy),s.stroke(),s.setLineDash([]);const L=Math.sqrt(Math.pow(u.x-g.x,2)+Math.pow(u.y-g.y,2)+Math.pow(u.z-g.z,2)),T=L*389.17;s.fillStyle="#9ca3af",s.font="10px monospace",s.fillText("SUN",l+10,c+4),s.fillStyle="#3b82f6",s.fillText("EARTH",_.cx+8,_.cy+4),s.fillStyle="rgba(255, 255, 255, 0.8)";const R=e.name||e.pdes||"Object";s.fillText(R.toUpperCase(),y.cx+8,y.cy+4),s.fillStyle="#111827",s.fillRect(5,5,140,42),s.strokeStyle="rgba(59, 130, 246, 0.3)",s.lineWidth=1,s.strokeRect(5,5,140,42),s.fillStyle="#9ca3af",s.font="9px monospace",s.fillText("EARTH DISTANCE:",10,18),s.fillStyle="#ef4444",s.font="bold 10px monospace",s.fillText(`${L.toFixed(4)} AU`,10,30),s.font="9px monospace",s.fillStyle="#f3f4f6",s.fillText(`(${T.toFixed(1)} LD)`,72,30),s.fillStyle="#9ca3af",s.font="8px monospace",s.fillText("SCALE: TOP-DOWN ECLIPTIC",r-125,o-15),s.fillText(`1 AU = ${f.toFixed(0)}px`,r-125,o-6)},[e,t,n]),A.jsx("div",{className:"relative border border-gray-800 rounded-lg overflow-hidden bg-gray-950 shadow-inner",children:A.jsx("canvas",{ref:i,width:300,height:220,className:"w-full block aspect-[30/22] max-h-[220px]"})})};function vw(){const[e,t]=pt.useState(!0),[n,i]=pt.useState("Initializing system..."),[a,s]=pt.useState(10),[r,o]=pt.useState([]),[l,c]=pt.useState([]),[h,d]=pt.useState([]),[f,p]=pt.useState(new Map),[v,S]=pt.useState(new Map),[m,u]=pt.useState(no(new Date)),[g,_]=pt.useState(1),[y,L]=pt.useState(!0),[T,R]=pt.useState(null),[U,X]=pt.useState("free"),[x,E]=pt.useState(5e3),[q,W]=pt.useState(!0),[J,et]=pt.useState(!0),[N,G]=pt.useState(""),[O,nt]=pt.useState("all"),[Z,it]=pt.useState("all"),[yt,Ct]=pt.useState(!1),[k,K]=pt.useState(!1),[lt,st]=pt.useState(1.5),[xt,Et]=pt.useState([0,10]),[Ut,qt]=pt.useState(!1),bt=pt.useRef(null),D={APO:"Apollo",ATE:"Aten",AMO:"Amor",IEO:"Atira (IEO)"},Yt={APO:"Apollo asteroids have Earth-crossing orbits with a semi-major axis larger than Earth's (a > 1.0 AU) and perihelion distance smaller than Earth's aphelion (q < 1.017 AU).",ATE:"Aten asteroids are Earth-crossing orbits with a semi-major axis smaller than Earth's (a < 1.0 AU) and aphelion distance larger than Earth's perihelion (ad > 0.983 AU).",AMO:"Amor asteroids are Earth-approaching orbits that are outer-tangential to Earth's orbit but do not cross it (1.017 AU < q < 1.300 AU).",IEO:"Atira asteroids (Inner-Earth Objects) have orbits completely contained within Earth's orbit (aphelion ad < 0.983 AU)."};pt.useMemo(()=>Hd(m),[m]);const Rt=pt.useMemo(()=>r.find(C=>C.name==="Earth")||null,[r]);pt.useEffect(()=>{async function C(){try{i("Downloading celestial catalogs (1/5)..."),s(20);const Q=await(await fetch("data/planets.json")).json();o(Q),i("Downloading impact-risk sentry database (2/5)..."),s(40);const St=await(await fetch("data/sentry.json")).json(),ot=new Map;St.forEach(Ht=>ot.set(Ht.des,Ht)),p(ot),i("Downloading comets database (3/5)..."),s(60);const zt=await(await fetch("data/comets.json")).json();d(zt),i("Downloading Earth close-approach registry (4/5)..."),s(80);const ft=await(await fetch("data/close-approaches.json")).json(),wt=new Map;ft.forEach(Ht=>{wt.has(Ht.des)||wt.set(Ht.des,[]),wt.get(Ht.des).push(Ht)}),S(wt),i("Downloading Near-Earth Asteroids master database (~42,000 objects) (5/5)..."),s(95);const vt=await(await fetch("data/asteroids.json")).json();c(vt),i("Initializing 3D orbital canvas..."),s(100),t(!1)}catch(H){console.error("Failed to load dataset:",H),i("Error loading dataset. Please refresh or make sure files exist.")}}C()},[]),pt.useEffect(()=>{if(e)return;const C=new URLSearchParams;C.set("jd",m.toFixed(4)),T&&("radius_km"in T?C.set("selected",T.name):C.set("selected",T.pdes)),yt&&C.set("comets","true"),k&&C.set("sentry","true"),O!=="all"&&C.set("class",O),U!=="free"&&C.set("cam",U),x!==5e3&&C.set("scale",x.toString());const H="#"+C.toString();window.location.hash!==H&&window.history.replaceState(null,"",H)},[m,T,yt,k,O,U,x,e]),pt.useEffect(()=>{if(e||r.length===0||l.length===0)return;const C=window.location.hash;if(!(!C||C.length<=1))try{const H=new URLSearchParams(C.substring(1)),Q=H.get("jd");if(Q){const zt=parseFloat(Q);isNaN(zt)||u(zt)}const Y=H.get("selected");if(Y){const zt=r.find(at=>at.name.toLowerCase()===Y.toLowerCase());if(zt)R(zt);else{const at=l.find(ft=>{var wt;return ft.pdes.toLowerCase()===Y.toLowerCase()||((wt=ft.name)==null?void 0:wt.toLowerCase())===Y.toLowerCase()});if(at)R(at);else{const ft=h.find(wt=>wt.pdes.toLowerCase()===Y.toLowerCase()||wt.full_name.toLowerCase().includes(Y.toLowerCase()));ft&&R(ft)}}}H.get("comets")==="true"&&Ct(!0),H.get("sentry")==="true"&&K(!0);const St=H.get("class");St&&nt(St),H.get("cam")==="follow"&&X("follow");const mt=H.get("scale");if(mt){const zt=parseInt(mt);isNaN(zt)||E(zt)}}catch(H){console.error("Error parsing URL hash:",H)}},[e,r,l,h]),pt.useEffect(()=>{if(y){bt.current=null;return}let C;const H=Q=>{if(bt.current===null)bt.current=Q;else{const Y=(Q-bt.current)/1e3;bt.current=Q;const St=Y*g;u(ot=>ot+St)}C=requestAnimationFrame(H)};return C=requestAnimationFrame(H),()=>{cancelAnimationFrame(C)}},[y,g]);const Bt=()=>{navigator.clipboard.writeText(window.location.href),qt(!0),setTimeout(()=>qt(!1),2e3)},Tt=C=>{if(!C.target.value)return;const H=new Date(C.target.value+"T00:00:00");u(no(H))},Lt=pt.useMemo(()=>{const C=Hd(m);if(isNaN(C.getTime()))return"";const H=C.getFullYear(),Q=String(C.getMonth()+1).padStart(2,"0"),Y=String(C.getDate()).padStart(2,"0");return`${H}-${Q}-${Y}`},[m]),ct=pt.useMemo(()=>T?v.get(T.pdes)||[]:[],[T,v]),w=pt.useMemo(()=>T&&f.get(T.pdes)||null,[T,f]),M=pt.useMemo(()=>l.filter(C=>{var H;if(N){const Q=N.toLowerCase();if(!((H=C.name)!=null&&H.toLowerCase().includes(Q))&&!C.pdes.toLowerCase().includes(Q)&&!C.full_name.toLowerCase().includes(Q))return!1}return!(O!=="all"&&C.class!==O||Z==="pha"&&!C.pha||Z==="non-pha"&&C.pha||k&&!f.has(C.pdes)||C.diameter!==null&&(C.diameter<xt[0]||C.diameter>xt[1])||C.diameter===null&&xt[0]>0||C.moid>lt)}).length,[l,N,O,Z,k,lt,xt,f]);return A.jsxs("div",{className:"w-full h-full flex flex-col bg-gray-950 text-gray-100 overflow-hidden font-sans",children:[e&&A.jsxs("div",{className:"absolute inset-0 bg-gray-950 flex flex-col items-center justify-center z-50 p-6 text-center",children:[A.jsxs("div",{className:"w-20 h-20 relative mb-8",children:[A.jsx("div",{className:"absolute inset-0 border-4 border-cyan-500/20 rounded-full"}),A.jsx("div",{className:"absolute inset-0 border-4 border-t-cyan-500 rounded-full animate-spin"}),A.jsx(Al,{className:"absolute inset-4 text-cyan-400 animate-pulse w-12 h-12"})]}),A.jsx("h1",{className:"text-xl md:text-2xl font-bold font-mono tracking-widest text-cyan-400 mb-2 uppercase",children:"Inner Celestial Navigator"}),A.jsx("p",{className:"text-xs text-cyan-500/70 uppercase tracking-widest mb-6 font-mono",children:"Near-Earth Orbit & Hazard Visualizer"}),A.jsx("div",{className:"w-full max-w-md bg-gray-900 border border-gray-800 rounded-full h-2.5 overflow-hidden mb-3 shadow-inner",children:A.jsx("div",{className:"bg-gradient-to-r from-cyan-600 to-blue-500 h-full rounded-full transition-all duration-300",style:{width:`${a}%`}})}),A.jsx("p",{className:"text-sm font-mono text-gray-400 animate-pulse",children:n}),A.jsx("div",{className:"absolute bottom-6 text-[10px] font-mono text-gray-600",children:"SOLAR SYSTEM PROPAGATION LABS © 2026"})]}),A.jsxs("header",{className:"h-14 border-b border-gray-900 bg-gray-950/90 backdrop-blur-md px-4 flex items-center justify-between z-10 flex-shrink-0 select-none",children:[A.jsxs("div",{className:"flex items-center gap-3",children:[A.jsx("div",{className:"p-1.5 rounded bg-cyan-950/80 border border-cyan-800/40 text-cyan-400 shadow-md",children:A.jsx(Al,{className:"w-5 h-5"})}),A.jsxs("div",{children:[A.jsxs("h1",{className:"text-sm font-bold font-mono tracking-wider uppercase text-gray-100 flex items-center gap-2",children:["Celestial Navigator ",A.jsx("span",{className:"text-[10px] text-cyan-500 font-normal lowercase bg-cyan-950/50 border border-cyan-900/60 px-1.5 py-0.5 rounded",children:"v2.1"})]}),A.jsx("p",{className:"text-[10px] text-gray-400 uppercase tracking-widest font-mono",children:"Inner Solar System & Near-Earth Objects"})]})]}),A.jsxs("div",{className:"hidden lg:flex items-center gap-6 font-mono text-[11px] text-gray-400 border-l border-gray-900 pl-6 h-full",children:[A.jsxs("div",{children:["Cataloged: ",A.jsxs("span",{className:"text-gray-200 font-bold",children:[l.length.toLocaleString()," NEOs"]})]}),A.jsxs("div",{children:["Impact Risk: ",A.jsxs("span",{className:"text-red-500 font-bold",children:[f.size," Monitored"]})]}),A.jsxs("div",{children:["Comets: ",A.jsx("span",{className:"text-purple-400 font-bold",children:h.length.toLocaleString()})]})]}),A.jsxs("div",{className:"flex items-center gap-2",children:[A.jsxs("button",{onClick:()=>R(null),disabled:!T,className:`px-2.5 py-1.5 text-xs font-mono rounded border flex items-center gap-1.5 transition ${T?"border-gray-800 bg-gray-900/60 text-gray-300 hover:bg-gray-800":"border-transparent text-gray-600 cursor-not-allowed"}`,title:"Clear Selection",children:[A.jsx(_f,{className:"w-3.5 h-3.5"}),A.jsx("span",{className:"hidden sm:inline",children:"Deselect"})]}),A.jsxs("button",{onClick:Bt,className:`px-3 py-1.5 text-xs font-mono rounded border flex items-center gap-1.5 transition ${Ut?"bg-emerald-950/80 border-emerald-500/50 text-emerald-400":"border-cyan-900/60 bg-cyan-950/30 text-cyan-400 hover:bg-cyan-950/60"}`,children:[A.jsx(BE,{className:"w-3.5 h-3.5"}),A.jsx("span",{children:Ut?"Copied Link!":"Share View"})]})]})]}),A.jsxs("div",{className:"flex-1 w-full flex overflow-hidden relative",children:[A.jsxs("aside",{className:`absolute left-0 top-0 bottom-0 z-20 w-80 md:relative bg-gray-950/95 md:bg-gray-950 border-r border-gray-900 flex flex-col flex-shrink-0 transition-transform duration-300 h-full backdrop-blur-md md:backdrop-blur-none ${q?"translate-x-0":"-translate-x-full md:absolute"}`,children:[A.jsxs("div",{className:"flex-1 overflow-y-auto p-4 flex flex-col gap-5 select-none scrollbar-thin",children:[A.jsxs("div",{className:"flex flex-col gap-1.5",children:[A.jsxs("label",{className:"text-[10px] font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1",children:[A.jsx(IE,{className:"w-3 h-3 text-cyan-500"})," Search Objects"]}),A.jsxs("div",{className:"relative",children:[A.jsx("input",{type:"text",placeholder:"Designation or name (e.g. Apophis, 1950 DA)",value:N,onChange:C=>G(C.target.value),className:"w-full bg-gray-900/80 border border-gray-800 focus:border-cyan-500/50 outline-none rounded px-3 py-2 text-xs font-sans text-gray-200 placeholder-gray-500 transition shadow-inner"}),N&&A.jsx("button",{onClick:()=>G(""),className:"absolute right-2 top-2.5 text-gray-500 hover:text-gray-300",children:A.jsx(_f,{className:"w-3.5 h-3.5"})})]})]}),A.jsxs("div",{className:"flex flex-col gap-1.5",children:[A.jsxs("label",{className:"text-[10px] font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1",children:[A.jsx(NE,{className:"w-3 h-3 text-cyan-500"})," Orbit Classification"]}),A.jsxs("select",{value:O,onChange:C=>nt(C.target.value),className:"w-full bg-gray-900/80 border border-gray-800 outline-none focus:border-cyan-500/50 rounded p-2 text-xs font-mono text-gray-300 shadow-md cursor-pointer hover:bg-gray-900",children:[A.jsx("option",{value:"all",children:"ALL CLASSES (NEOs)"}),A.jsx("option",{value:"APO",children:"APOLLO (EARTH-CROSSER, a > 1)"}),A.jsx("option",{value:"ATE",children:"ATEN (EARTH-CROSSER, a < 1)"}),A.jsx("option",{value:"AMO",children:"AMOR (EARTH-APPROACHER)"}),A.jsx("option",{value:"IEO",children:"ATIRA / IEO (INNER-EARTH)"})]})]}),A.jsxs("div",{className:"flex flex-col gap-2.5 border-t border-gray-900 pt-4",children:[A.jsxs("label",{className:"text-[10px] font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1 mb-1",children:[A.jsx(Lg,{className:"w-3 h-3 text-cyan-500"})," Filter & Overlay Overrides"]}),A.jsx("div",{className:"flex gap-1.5",children:["all","pha","non-pha"].map(C=>A.jsx("button",{onClick:()=>it(C),className:`flex-1 py-1.5 text-[9px] font-mono font-bold uppercase rounded border transition ${Z===C?"border-orange-500 bg-orange-950/20 text-orange-400 shadow shadow-orange-500/20":"border-gray-800 bg-gray-900/30 text-gray-400 hover:bg-gray-900"}`,children:C==="all"?"All NEOs":C==="pha"?"PHA Only":"Non-PHA"},C))}),A.jsxs("div",{className:"flex flex-col gap-2 bg-gray-900/30 border border-gray-900 p-2.5 rounded-lg shadow-inner",children:[A.jsxs("label",{className:"flex items-center justify-between cursor-pointer py-1",children:[A.jsxs("span",{className:"text-xs font-mono text-gray-300 flex items-center gap-1.5",children:[A.jsx(Pg,{className:"w-3.5 h-3.5 text-red-500"}),"Sentry Impact Risks"]}),A.jsxs("div",{className:"relative",children:[A.jsx("input",{type:"checkbox",checked:k,onChange:C=>K(C.target.checked),className:"sr-only peer"}),A.jsx("div",{className:"w-8 h-4.5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-red-600 peer-checked:after:bg-white"})]})]}),A.jsxs("label",{className:"flex items-center justify-between cursor-pointer py-1",children:[A.jsxs("span",{className:"text-xs font-mono text-gray-300 flex items-center gap-1.5",children:[A.jsx(Ig,{className:"w-3.5 h-3.5 text-purple-400"}),"Overlay Comets"]}),A.jsxs("div",{className:"relative",children:[A.jsx("input",{type:"checkbox",checked:yt,onChange:C=>Ct(C.target.checked),className:"sr-only peer"}),A.jsx("div",{className:"w-8 h-4.5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-white"})]})]})]})]}),A.jsxs("div",{className:"flex flex-col gap-4 border-t border-gray-900 pt-4",children:[A.jsxs("label",{className:"text-[10px] font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1",children:[A.jsx(zg,{className:"w-3 h-3 text-cyan-500"})," Metric Constraints"]}),A.jsxs("div",{className:"flex flex-col gap-1",children:[A.jsxs("div",{className:"flex justify-between text-[11px] font-mono",children:[A.jsx("span",{className:"text-gray-400",children:"Max Earth MOID:"}),A.jsxs("span",{className:"text-cyan-400 font-bold",children:[lt.toFixed(2)," AU"]})]}),A.jsx("input",{type:"range",min:"0.01",max:"2.5",step:"0.05",value:lt,onChange:C=>st(parseFloat(C.target.value)),className:"w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"}),A.jsx("span",{className:"text-[8px] font-mono text-gray-600 uppercase text-right leading-none",children:"Minimum Orbit Intersection Distance"})]}),A.jsxs("div",{className:"flex flex-col gap-1",children:[A.jsxs("div",{className:"flex justify-between text-[11px] font-mono",children:[A.jsx("span",{className:"text-gray-400",children:"Min Size (Diameter):"}),A.jsx("span",{className:"text-cyan-400 font-bold",children:xt[0]===0?"All sizes":`> ${xt[0]} km`})]}),A.jsxs("div",{className:"flex gap-2",children:[A.jsx("button",{onClick:()=>Et([0,10]),className:`flex-1 py-1 text-[9px] font-mono uppercase border rounded ${xt[0]===0?"border-cyan-500 bg-cyan-950/20 text-cyan-400":"border-gray-800 bg-gray-900/30 text-gray-400"}`,children:"All"}),A.jsx("button",{onClick:()=>Et([.1,10]),className:`flex-1 py-1 text-[9px] font-mono uppercase border rounded ${xt[0]===.1?"border-cyan-500 bg-cyan-950/20 text-cyan-400":"border-gray-800 bg-gray-900/30 text-gray-400"}`,children:"> 100m"}),A.jsx("button",{onClick:()=>Et([1,10]),className:`flex-1 py-1 text-[9px] font-mono uppercase border rounded ${xt[0]===1?"border-cyan-500 bg-cyan-950/20 text-cyan-400":"border-gray-800 bg-gray-900/30 text-gray-400"}`,children:"> 1km"})]})]})]}),A.jsxs("div",{className:"flex flex-col gap-2.5 border-t border-gray-900 pt-4",children:[A.jsxs("label",{className:"text-[10px] font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1",children:[A.jsx(zg,{className:"w-3 h-3 text-cyan-500"})," Rendering Properties"]}),A.jsxs("div",{className:"flex flex-col gap-1",children:[A.jsxs("div",{className:"flex justify-between text-[11px] font-mono",children:[A.jsx("span",{className:"text-gray-400",children:"Planet Sizes:"}),A.jsxs("span",{className:"text-cyan-400 font-bold",children:[x.toLocaleString(),"x scale"]})]}),A.jsx("input",{type:"range",min:"1000",max:"15000",step:"500",value:x,onChange:C=>E(parseInt(C.target.value)),className:"w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"})]})]}),A.jsxs("div",{className:"flex flex-col gap-1.5 border-t border-gray-900 pt-4",children:[A.jsxs("label",{className:"text-[10px] font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1",children:[A.jsx(Ig,{className:"w-3 h-3 text-cyan-500"})," Historic Highlights"]}),A.jsxs("div",{className:"flex flex-col gap-1.5",children:[A.jsxs("button",{onClick:()=>{const C=l.find(H=>H.pdes==="99942");C&&R(C)},className:"w-full text-left bg-gray-900/30 border border-gray-900 hover:border-cyan-900 hover:bg-cyan-950/10 p-2 rounded text-xs font-mono text-gray-300 transition flex justify-between items-center",children:[A.jsx("span",{children:"99942 Apophis (PHA)"}),A.jsx(Tl,{className:"w-3 h-3 text-cyan-500"})]}),A.jsxs("button",{onClick:()=>{const C=h.find(H=>H.pdes==="1P");C&&(Ct(!0),R(C))},className:"w-full text-left bg-gray-900/30 border border-gray-900 hover:border-purple-900 hover:bg-purple-950/10 p-2 rounded text-xs font-mono text-gray-300 transition flex justify-between items-center",children:[A.jsx("span",{children:"1P/Halley (Comet)"}),A.jsx(Tl,{className:"w-3 h-3 text-purple-400"})]})]})]})]}),A.jsxs("div",{className:"border-t border-gray-900 p-3 bg-gray-950 flex flex-col font-mono text-[10px] text-gray-500 gap-0.5 select-none",children:[A.jsxs("div",{className:"flex justify-between",children:[A.jsx("span",{children:"ACTIVE ASTEROIDS:"}),A.jsxs("span",{className:"text-cyan-400 font-bold",children:[M.toLocaleString()," / ",l.length.toLocaleString()]})]}),yt&&A.jsxs("div",{className:"flex justify-between",children:[A.jsx("span",{children:"ACTIVE COMETS:"}),A.jsx("span",{className:"text-purple-400 font-bold",children:filteredComets.length.toLocaleString()})]}),A.jsx("div",{className:"text-[9px] text-gray-600 uppercase text-center mt-1 leading-none",children:"Double-click orbit paths to reset camera angle"})]})]}),A.jsxs("main",{className:"flex-1 h-full relative overflow-hidden bg-gray-950",children:[A.jsx("button",{onClick:()=>W(!q),className:"absolute left-3 top-3 z-30 p-2 rounded-md bg-gray-950/80 border border-gray-800 text-gray-300 hover:text-cyan-400 hover:bg-gray-900 backdrop-blur-md shadow-lg",children:q?A.jsx(Og,{className:"w-4 h-4"}):A.jsx(Tl,{className:"w-4 h-4"})}),A.jsx("button",{onClick:()=>et(!J),className:"absolute right-3 top-3 z-30 p-2 rounded-md bg-gray-950/80 border border-gray-800 text-gray-300 hover:text-cyan-400 hover:bg-gray-900 backdrop-blur-md shadow-lg",children:J?A.jsx(Tl,{className:"w-4 h-4"}):A.jsx(Og,{className:"w-4 h-4"})}),r.length>0&&A.jsx(gw,{planets:r,asteroids:l,comets:h,sentryMap:f,selectedBody:T,onSelectBody:R,currentJD:m,showComets:yt,showSentryOnly:k,asteroidFilter:{search:N,classCode:O,hazardStatus:Z,sizeRange:xt,moidMax:lt},planetScale:x,cameraMode:U,setCameraMode:X}),U==="follow"&&T&&A.jsxs("div",{className:"absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-lg shadow-black/40 backdrop-blur-md animate-pulse",children:[A.jsx(LE,{className:"w-3 h-3 text-yellow-400 animate-bounce"}),"Camera Locked to: ","name"in T?T.name:T.name||T.pdes,A.jsx("button",{onClick:()=>X("free"),className:"bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/40 rounded px-1.5 py-0.5 ml-1.5 transition",children:"Release"})]})]}),A.jsx("aside",{className:`absolute right-0 top-0 bottom-0 z-20 w-80 md:relative bg-gray-950/95 md:bg-gray-950 border-l border-gray-900 flex flex-col flex-shrink-0 transition-transform duration-300 h-full backdrop-blur-md md:backdrop-blur-none ${J?"translate-x-0":"translate-x-full md:absolute"}`,children:T?A.jsxs("div",{className:"flex-1 overflow-y-auto p-4 flex flex-col gap-4 select-none scrollbar-thin",children:[A.jsxs("div",{className:"flex items-start justify-between border-b border-gray-900 pb-3",children:[A.jsxs("div",{children:[A.jsx("div",{className:"text-[9px] font-mono font-bold tracking-wider text-cyan-500 uppercase",children:"radius_km"in T?"Planet":"M1"in T?"Comet":"Asteroid"}),A.jsx("h2",{className:"text-base font-extrabold font-mono tracking-wide text-gray-100 uppercase",children:"radius_km"in T?T.name:T.name||T.pdes}),!("radius_km"in T)&&T.name&&A.jsxs("div",{className:"text-[11px] text-gray-400 font-mono",children:["Des: ",T.pdes]})]}),A.jsx("button",{onClick:()=>R(null),className:"text-gray-500 hover:text-gray-300 border border-gray-900 hover:border-gray-800 p-1.5 rounded",children:A.jsx(_f,{className:"w-3.5 h-3.5"})})]}),A.jsx("div",{className:"flex gap-2",children:A.jsxs("button",{onClick:()=>{X(U==="follow"?"free":"follow")},className:`flex-1 py-1.5 text-xs font-mono font-bold uppercase rounded border transition flex items-center justify-center gap-1.5 ${U==="follow"?"border-yellow-500 bg-yellow-950/20 text-yellow-400 shadow shadow-yellow-500/20":"border-gray-800 bg-gray-900/30 text-gray-400 hover:bg-gray-900"}`,children:[A.jsx(Al,{className:"w-3.5 h-3.5"}),U==="follow"?"Camera Locked":"Lock Camera"]})}),w&&A.jsxs("div",{className:"glow-panel-red bg-red-950/20 border border-red-500/30 rounded-lg p-3 flex flex-col gap-1.5 animate-pulse-slow",children:[A.jsxs("div",{className:"flex items-center gap-1.5 text-red-400 font-mono font-bold text-xs uppercase",children:[A.jsx(Pg,{className:"w-4 h-4 text-red-500"}),"CNEOS IMPACT THREAT DETECTED"]}),A.jsx("div",{className:"text-[10px] text-gray-300 leading-snug",children:"This object is monitored by JPL's Sentry System for potential impact risks with Earth."}),A.jsxs("div",{className:"grid grid-cols-2 gap-2 mt-1 border-t border-red-950 pt-2 font-mono text-[10px]",children:[A.jsxs("div",{children:[A.jsx("div",{className:"text-gray-500 text-[8px] uppercase",children:"Impact Probability"}),A.jsxs("div",{className:"text-red-400 font-bold",children:[(w.ip*100).toFixed(6),"%"]})]}),A.jsxs("div",{children:[A.jsx("div",{className:"text-gray-500 text-[8px] uppercase",children:"Potential Impacts"}),A.jsx("div",{className:"text-red-400 font-bold",children:w.n_imp})]}),A.jsxs("div",{children:[A.jsx("div",{className:"text-gray-500 text-[8px] uppercase",children:"Torino Scale Max"}),A.jsx("div",{className:"text-red-400 font-bold",children:w.ts_max})]}),A.jsxs("div",{children:[A.jsx("div",{className:"text-gray-500 text-[8px] uppercase",children:"Risk Window"}),A.jsx("div",{className:"text-red-400 font-bold",children:w.range})]})]})]}),Rt&&A.jsxs("div",{className:"flex flex-col gap-1.5",children:[A.jsx("span",{className:"text-[9px] font-mono uppercase text-gray-500 tracking-wider",children:"Orbital Plane Alignment"}),A.jsx(_w,{selectedBody:T,earth:Rt,currentJD:m})]}),!("radius_km"in T)&&T.class&&A.jsxs("div",{className:"bg-gray-900/50 border border-gray-900/80 rounded p-2.5 text-[10px] text-gray-400 leading-normal flex flex-col gap-1 font-sans",children:[A.jsxs("span",{className:"font-mono text-cyan-400 font-bold uppercase text-[9px] flex items-center gap-1",children:[A.jsx(UE,{className:"w-3 h-3 text-cyan-400"}),"Orbit Class: ",D[T.class]||T.class]}),Yt[T.class]||"No classification notes available."]}),A.jsxs("div",{className:"flex flex-col gap-1.5",children:[A.jsx("span",{className:"text-[9px] font-mono uppercase text-gray-500 tracking-wider",children:"Physical Properties"}),A.jsx("div",{className:"bg-gray-900/40 border border-gray-900 rounded p-3 font-mono text-[11px] grid grid-cols-2 gap-y-2 gap-x-3",children:"radius_km"in T?A.jsxs(A.Fragment,{children:[A.jsxs("div",{className:"col-span-2 flex justify-between border-b border-gray-900 pb-1 mb-1",children:[A.jsx("span",{className:"text-gray-400 uppercase",children:"Equatorial Radius"}),A.jsxs("span",{className:"text-gray-200 font-bold",children:[T.radius_km.toLocaleString()," km"]})]}),A.jsxs("div",{className:"col-span-2 flex justify-between",children:[A.jsx("span",{className:"text-gray-400 uppercase",children:"Mean Distance"}),A.jsxs("span",{className:"text-gray-200 font-bold",children:[T.a.toFixed(3)," AU"]})]})]}):A.jsxs(A.Fragment,{children:[A.jsxs("div",{children:[A.jsx("div",{className:"text-gray-500 text-[8px] uppercase leading-none",children:"Absolute Mag (H)"}),A.jsx("div",{className:"text-gray-200 font-bold",children:"H"in T?T.H:"M1"in T?T.M1:"N/A"})]}),A.jsxs("div",{children:[A.jsx("div",{className:"text-gray-500 text-[8px] uppercase leading-none",children:"Diameter (Est)"}),A.jsx("div",{className:"text-gray-200 font-bold",children:T.diameter!==null?`${T.diameter.toFixed(2)} km`:"Unknown"})]}),A.jsxs("div",{children:[A.jsx("div",{className:"text-gray-500 text-[8px] uppercase leading-none",children:"Albedo (Refl)"}),A.jsx("div",{className:"text-gray-200 font-bold",children:"albedo"in T&&T.albedo!==null?T.albedo.toFixed(3):"Unknown"})]}),A.jsxs("div",{children:[A.jsx("div",{className:"text-gray-500 text-[8px] uppercase leading-none",children:"Rotation Per"}),A.jsx("div",{className:"text-gray-200 font-bold",children:"rot_per"in T&&T.rot_per!==null?`${T.rot_per.toFixed(2)} hrs`:"Unknown"})]}),"spec_B"in T&&(T.spec_B||T.spec_T)&&A.jsxs("div",{className:"col-span-2 border-t border-gray-900 pt-1.5 flex justify-between text-[10px]",children:[A.jsx("span",{className:"text-gray-500 uppercase",children:"Spectral Type"}),A.jsx("span",{className:"text-cyan-400 font-bold",children:T.spec_B||T.spec_T})]}),"first_obs"in T&&T.first_obs&&A.jsxs("div",{className:"col-span-2 border-t border-gray-900 pt-1.5 flex justify-between text-[10px]",children:[A.jsx("span",{className:"text-gray-500 uppercase",children:"First Observed"}),A.jsx("span",{className:"text-gray-400 font-bold",children:T.first_obs})]})]})})]}),A.jsxs("div",{className:"flex flex-col gap-1.5",children:[A.jsx("span",{className:"text-[9px] font-mono uppercase text-gray-500 tracking-wider",children:"Orbital Kepler Elements"}),A.jsxs("div",{className:"bg-gray-900/30 border border-gray-900/60 rounded p-2.5 font-mono text-[10px] flex flex-col gap-1.5",children:[A.jsxs("div",{className:"flex justify-between",children:[A.jsx("span",{className:"text-gray-500",title:"Semi-major Axis",children:"a - Semi-major Axis:"}),A.jsx("span",{className:"text-gray-300 font-bold",children:T.a?`${T.a.toFixed(6)} AU`:"N/A"})]}),A.jsxs("div",{className:"flex justify-between",children:[A.jsx("span",{className:"text-gray-500",title:"Eccentricity",children:"e - Eccentricity:"}),A.jsx("span",{className:"text-gray-300 font-bold",children:T.e.toFixed(6)})]}),A.jsxs("div",{className:"flex justify-between",children:[A.jsx("span",{className:"text-gray-500",title:"Inclination",children:"i - Inclination:"}),A.jsxs("span",{className:"text-gray-300 font-bold",children:[T.i.toFixed(5),"°"]})]}),A.jsxs("div",{className:"flex justify-between",children:[A.jsx("span",{className:"text-gray-500",title:"Longitude of Ascending Node",children:"om - Longitude node:"}),A.jsxs("span",{className:"text-gray-300 font-bold",children:[T.om.toFixed(5),"°"]})]}),A.jsxs("div",{className:"flex justify-between",children:[A.jsx("span",{className:"text-gray-500",title:"Argument of perihelion",children:"w - Arg perihelion:"}),A.jsxs("span",{className:"text-gray-300 font-bold",children:[T.w.toFixed(5),"°"]})]}),A.jsxs("div",{className:"flex justify-between",children:[A.jsx("span",{className:"text-gray-500",title:"Mean anomaly at epoch",children:"ma - Mean anomaly:"}),A.jsxs("span",{className:"text-gray-300 font-bold",children:[T.ma.toFixed(5),"°"]})]}),A.jsxs("div",{className:"flex justify-between border-t border-gray-900 pt-1.5",children:[A.jsx("span",{className:"text-gray-500",children:"Epoch Julian Date:"}),A.jsx("span",{className:"text-gray-300",children:T.epoch})]}),A.jsxs("div",{className:"flex justify-between",children:[A.jsx("span",{className:"text-gray-500",children:"Orbital Period:"}),A.jsx("span",{className:"text-gray-300",children:T.per?`${(T.per/365.25).toFixed(2)} yrs`:"Hyperbolic/Open"})]})]})]}),!("radius_km"in T)&&A.jsxs("div",{className:"flex flex-col gap-1.5",children:[A.jsxs("span",{className:"text-[9px] font-mono uppercase text-gray-500 tracking-wider flex items-center gap-1.5",children:[A.jsx(Lg,{className:"w-3 h-3 text-red-500"}),"Earth Close-Approaches"]}),ct.length>0?A.jsx("div",{className:"flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1 border border-gray-900 rounded p-1.5 bg-gray-900/20 scrollbar-thin",children:ct.sort((C,H)=>Math.abs(C.jd-m)-Math.abs(H.jd-m)).map((C,H)=>{const Q=C.dist*389.17,Y=H===0;return A.jsxs("div",{className:`p-2 rounded font-mono text-[10px] leading-tight flex flex-col gap-0.5 border ${Y?"bg-red-950/20 border-red-500/30 text-red-300":"bg-gray-900/50 border-gray-950 text-gray-400"}`,children:[A.jsxs("div",{className:"flex justify-between items-center",children:[A.jsx("span",{className:"font-bold text-gray-200",children:C.cd.split(" ")[0]}),Y&&A.jsx("span",{className:"text-[7px] bg-red-600 text-white px-1 py-0.5 rounded uppercase font-bold leading-none animate-pulse",children:"Closest Event"})]}),A.jsxs("div",{className:"flex justify-between mt-1",children:[A.jsx("span",{children:"Distance Nominal:"}),A.jsxs("span",{className:"font-bold text-gray-300",children:[C.dist.toFixed(4)," AU"]})]}),A.jsxs("div",{className:"flex justify-between text-[9px]",children:[A.jsx("span",{children:"Distance (Lunar):"}),A.jsxs("span",{className:"text-red-400 font-bold",children:[Q.toFixed(1)," Lunar Distances (LD)"]})]}),A.jsxs("div",{className:"flex justify-between",children:[A.jsx("span",{children:"Relative Velocity:"}),A.jsxs("span",{className:"text-gray-300",children:[C.v_rel.toFixed(2)," km/s"]})]})]},C.cd)})}):A.jsx("div",{className:"text-[10px] font-mono text-gray-600 text-center py-4 bg-gray-900/20 rounded border border-dashed border-gray-900",children:"No registered upcoming close-approaches to Earth."})]}),!("radius_km"in T)&&A.jsxs("a",{href:`https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=${T.spkid||T.pdes}`,target:"_blank",rel:"noopener noreferrer",className:"mt-2 text-center text-[10px] font-mono border border-gray-800 hover:border-cyan-500 hover:bg-cyan-950/10 text-cyan-500 py-1.5 rounded transition flex items-center justify-center gap-1.5 shadow-md shadow-black/10",children:[A.jsx(DE,{className:"w-3.5 h-3.5"}),"JPL Small-Body Database Lookup"]})]}):A.jsxs("div",{className:"flex-1 flex flex-col items-center justify-center text-center p-6 select-none font-mono text-xs text-gray-600 border-dashed",children:[A.jsx(Al,{className:"w-8 h-8 text-gray-800 mb-3 animate-spin-slow"}),A.jsx("p",{children:"NO CELESTIAL OBJECT SELECTED"}),A.jsx("p",{className:"text-[10px] text-gray-700 uppercase tracking-wider mt-1 max-w-[200px]",children:"Click an orbital body on the map or search in the catalog sidebar."})]})})]}),A.jsx("footer",{className:"border-t border-gray-900 bg-gray-950 px-4 py-3 select-none flex-shrink-0 z-10",children:A.jsxs("div",{className:"flex flex-col gap-3 max-w-7xl mx-auto",children:[A.jsxs("div",{className:"flex items-center gap-3",children:[A.jsx("span",{className:"text-[10px] font-mono text-gray-500 leading-none",children:"2010"}),A.jsx("input",{type:"range",min:no(new Date("2010-01-01")),max:no(new Date("2040-12-31")),step:"1",value:m,onChange:C=>{u(parseFloat(C.target.value)),y||L(!0)},className:"flex-1 h-1.5 bg-gray-900 border border-gray-800 rounded-lg appearance-none cursor-ew-resize accent-cyan-500"}),A.jsx("span",{className:"text-[10px] font-mono text-gray-500 leading-none",children:"2040"})]}),A.jsxs("div",{className:"flex flex-col md:flex-row items-center justify-between gap-3",children:[A.jsxs("div",{className:"flex items-center gap-2 font-mono",children:[A.jsxs("div",{className:"flex items-center gap-1.5 text-xs text-cyan-400 bg-cyan-950/40 border border-cyan-900/60 px-2.5 py-1.5 rounded shadow shadow-cyan-950/30",children:[A.jsx(CE,{className:"w-3.5 h-3.5"}),A.jsx("span",{className:"font-bold",children:"UT DATE:"}),A.jsx("input",{type:"date",value:Lt,onChange:Tt,className:"bg-transparent text-cyan-300 font-bold border-none outline-none cursor-pointer focus:ring-0 w-[110px]"})]}),A.jsxs("button",{onClick:()=>{u(no(new Date)),L(!0)},className:"p-1.5 rounded border border-gray-800 hover:border-gray-700 bg-gray-900 text-gray-400 hover:text-gray-200 transition text-xs flex items-center gap-1",title:"Reset to Today",children:[A.jsx(zE,{className:"w-3.5 h-3.5"}),A.jsx("span",{children:"Today"})]})]}),A.jsxs("div",{className:"flex items-center gap-2",children:[A.jsx("button",{onClick:()=>L(!y),className:`p-2 md:px-4 rounded-md font-mono font-bold text-xs uppercase flex items-center gap-1.5 transition shadow-lg ${y?"bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-500":"bg-gray-800 hover:bg-gray-700 text-cyan-400 border border-gray-700"}`,children:y?A.jsxs(A.Fragment,{children:[A.jsx(PE,{className:"w-4 h-4 fill-current"}),A.jsx("span",{className:"hidden sm:inline",children:"Play Orbit"})]}):A.jsxs(A.Fragment,{children:[A.jsx(OE,{className:"w-4 h-4 fill-current"}),A.jsx("span",{className:"hidden sm:inline",children:"Pause Orbit"})]})}),A.jsx("div",{className:"flex border border-gray-900 rounded bg-gray-900/40 p-0.5 shadow-inner",children:[{label:"0.1d/s",val:.1},{label:"1d/s",val:1},{label:"10d/s",val:10},{label:"30d/s",val:30},{label:"365d/s",val:365}].map(C=>A.jsx("button",{onClick:()=>{_(C.val),y&&L(!1)},className:`px-2 py-1 text-[10px] font-mono rounded transition ${g===C.val&&!y?"bg-cyan-950 border border-cyan-800/40 text-cyan-400":"border-transparent text-gray-500 hover:text-gray-300"}`,children:C.label},C.label))})]}),A.jsxs("div",{className:"hidden md:flex items-center gap-4 text-[10px] font-mono text-gray-500",children:[A.jsxs("div",{className:"flex items-center gap-1",children:[A.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-cyan-500"}),A.jsx("span",{children:"1 AU ≈ 149.6M km"})]}),A.jsxs("div",{className:"flex items-center gap-1",children:[A.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-yellow-500"}),A.jsx("span",{children:"Selected Orbit Line Active"})]})]})]})]})})]})}TE.createRoot(document.getElementById("root")).render(A.jsx(pt.StrictMode,{children:A.jsx(vw,{})}));
