!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define([],t):"object"==typeof exports?exports.Lefty=t():e.Lefty=t()}(self,(()=>(()=>{"use strict";var e={d:(t,n)=>{for(var r in n)e.o(n,r)&&!e.o(t,r)&&Object.defineProperty(t,r,{enumerable:!0,get:n[r]})},o:(e,t)=>Object.prototype.hasOwnProperty.call(e,t),r:e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})}},t={};let n;e.r(t),e.d(t,{conversion:()=>d,createOrder:()=>u,createProduct:()=>a,createProductItem:()=>s,pixel:()=>m});let r=!1;const o="https://a.lefty.io";function c(e,t,n){let r=new XMLHttpRequest;r.open(e,o+t,!0),r.setRequestHeader("Content-type","application/json"),r.withCredentials=!0;let c=new Promise((function(e,t){r.onreadystatechange=function(){4===this.readyState&&(200===this.status?e(r.responseText):t(new Error(r.statusText)))}}));return n?r.send(JSON.stringify(n)):r.send(),c}function i(e){return e.map((function(e){return e.totalAmount})).reduce((function(e,t){return e+t}),0)}function u(e,t,n,r){return{externalOrderId:e,items:t,currencyCode:n,amount:r||i(t)}}function a(e,t){return{externalProductId:e,name:t}}function s(e,t,n,r){return{externalOrderItemId:e,product:t,totalAmount:n,quantity:r}}function f(e,t){t=t||{};const n="/check?ref="+(e=e||window.location.hostname);if(t.xhr)return c("POST",n);const r=o+n;return new Promise(((e,t)=>{const n=new Image;n.onload=e,n.onerror=t,n.src=r}))}function d(e,t){t=t||{},e.pixelId=e.pixelId||n,e.referringDomain=t.referer||window.location.hostname;const o="/track/conversion";return r?(console.log("Lefty - conversion",e),c("POST",o,e)):f(e.referringDomain,{xhr:!0}).then((t=>{if(!0===(t=JSON.parse(t)).matchable)return c("POST",o,e)}),(e=>console.error("Lefty - check",e)))}function l(e,t){t=t||{};const r=e.items||[],c=e.externalOrderId,i=e.amount,u=e.pixelId||n,a=e.currencyCode||t.currencyCode,s=t.referer||window.location.hostname;let f=o+"/track?type=conversion";if(f+="&orderId="+c,f+="&ref="+s,i&&(f+="&amount="+i),a&&(f+="&currency="+a),u&&(f+="&pixelId="+u),0!==r.length){const e=r.map((function(e){return"pId="+e.product.externalProductId})).join("&"),t=r.map((function(e){return"pName="+encodeURIComponent(e.product.name)})).join("&"),n=r.map((function(e){return"itemQty="+e.quantity})).join("&"),o=r.map((function(e){return"itemAmount="+e.totalAmount})).join("&"),c=r.map((function(e){return"itemId="+e.externalOrderItemId})).join("&");f+="&"+e,f+="&"+t,f+="&"+n,f+="&"+o,c&&(f+="&"+c)}(new Image).src=f}function m(e,t){return r?(console.log("Lefty - pixel",e),l(e,t)):(t.referer=t.referer||window.location.hostname,f(t.referer).then((()=>l(e,t)),(e=>console.error("Lefty - check",e))))}return window.lefty=function e(){const t=[...arguments];switch(t.shift()){case"pixel":return m(...t);case"conversion":return d(...t);case"init":return function(t,o){n=t,r=(o=o||{}).debug||!1;const c=window._lefty||[];for(;c.length;)e(...c.shift())}(...t)}},t})()));