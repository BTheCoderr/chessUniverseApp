/*! For license information please see betting.af3d5fd2592c98177767.js.LICENSE.txt */
(self.webpackChunksimplechessapp=self.webpackChunksimplechessapp||[]).push([[992],{698:(t,e,r)=>{var n=r(692);function a(t){return a="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},a(t)}function o(){"use strict";o=function(){return e};var t,e={},r=Object.prototype,n=r.hasOwnProperty,i=Object.defineProperty||function(t,e,r){t[e]=r.value},c="function"==typeof Symbol?Symbol:{},s=c.iterator||"@@iterator",u=c.asyncIterator||"@@asyncIterator",l=c.toStringTag||"@@toStringTag";function f(t,e,r){return Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}),t[e]}try{f({},"")}catch(t){f=function(t,e,r){return t[e]=r}}function d(t,e,r,n){var a=e&&e.prototype instanceof b?e:b,o=Object.create(a.prototype),c=new M(n||[]);return i(o,"_invoke",{value:B(t,r,c)}),o}function h(t,e,r){try{return{type:"normal",arg:t.call(e,r)}}catch(t){return{type:"throw",arg:t}}}e.wrap=d;var p="suspendedStart",v="suspendedYield",y="executing",m="completed",g={};function b(){}function w(){}function k(){}var x={};f(x,s,(function(){return this}));var E=Object.getPrototypeOf,S=E&&E(E(F([])));S&&S!==r&&n.call(S,s)&&(x=S);var L=k.prototype=b.prototype=Object.create(x);function j(t){["next","throw","return"].forEach((function(e){f(t,e,(function(t){return this._invoke(e,t)}))}))}function O(t,e){function r(o,i,c,s){var u=h(t[o],t,i);if("throw"!==u.type){var l=u.arg,f=l.value;return f&&"object"==a(f)&&n.call(f,"__await")?e.resolve(f.__await).then((function(t){r("next",t,c,s)}),(function(t){r("throw",t,c,s)})):e.resolve(f).then((function(t){l.value=t,c(l)}),(function(t){return r("throw",t,c,s)}))}s(u.arg)}var o;i(this,"_invoke",{value:function(t,n){function a(){return new e((function(e,a){r(t,n,e,a)}))}return o=o?o.then(a,a):a()}})}function B(e,r,n){var a=p;return function(o,i){if(a===y)throw Error("Generator is already running");if(a===m){if("throw"===o)throw i;return{value:t,done:!0}}for(n.method=o,n.arg=i;;){var c=n.delegate;if(c){var s=C(c,n);if(s){if(s===g)continue;return s}}if("next"===n.method)n.sent=n._sent=n.arg;else if("throw"===n.method){if(a===p)throw a=m,n.arg;n.dispatchException(n.arg)}else"return"===n.method&&n.abrupt("return",n.arg);a=y;var u=h(e,r,n);if("normal"===u.type){if(a=n.done?m:v,u.arg===g)continue;return{value:u.arg,done:n.done}}"throw"===u.type&&(a=m,n.method="throw",n.arg=u.arg)}}}function C(e,r){var n=r.method,a=e.iterator[n];if(a===t)return r.delegate=null,"throw"===n&&e.iterator.return&&(r.method="return",r.arg=t,C(e,r),"throw"===r.method)||"return"!==n&&(r.method="throw",r.arg=new TypeError("The iterator does not provide a '"+n+"' method")),g;var o=h(a,e.iterator,r.arg);if("throw"===o.type)return r.method="throw",r.arg=o.arg,r.delegate=null,g;var i=o.arg;return i?i.done?(r[e.resultName]=i.value,r.next=e.nextLoc,"return"!==r.method&&(r.method="next",r.arg=t),r.delegate=null,g):i:(r.method="throw",r.arg=new TypeError("iterator result is not an object"),r.delegate=null,g)}function T(t){var e={tryLoc:t[0]};1 in t&&(e.catchLoc=t[1]),2 in t&&(e.finallyLoc=t[2],e.afterLoc=t[3]),this.tryEntries.push(e)}function P(t){var e=t.completion||{};e.type="normal",delete e.arg,t.completion=e}function M(t){this.tryEntries=[{tryLoc:"root"}],t.forEach(T,this),this.reset(!0)}function F(e){if(e||""===e){var r=e[s];if(r)return r.call(e);if("function"==typeof e.next)return e;if(!isNaN(e.length)){var o=-1,i=function r(){for(;++o<e.length;)if(n.call(e,o))return r.value=e[o],r.done=!1,r;return r.value=t,r.done=!0,r};return i.next=i}}throw new TypeError(a(e)+" is not iterable")}return w.prototype=k,i(L,"constructor",{value:k,configurable:!0}),i(k,"constructor",{value:w,configurable:!0}),w.displayName=f(k,l,"GeneratorFunction"),e.isGeneratorFunction=function(t){var e="function"==typeof t&&t.constructor;return!!e&&(e===w||"GeneratorFunction"===(e.displayName||e.name))},e.mark=function(t){return Object.setPrototypeOf?Object.setPrototypeOf(t,k):(t.__proto__=k,f(t,l,"GeneratorFunction")),t.prototype=Object.create(L),t},e.awrap=function(t){return{__await:t}},j(O.prototype),f(O.prototype,u,(function(){return this})),e.AsyncIterator=O,e.async=function(t,r,n,a,o){void 0===o&&(o=Promise);var i=new O(d(t,r,n,a),o);return e.isGeneratorFunction(r)?i:i.next().then((function(t){return t.done?t.value:i.next()}))},j(L),f(L,l,"Generator"),f(L,s,(function(){return this})),f(L,"toString",(function(){return"[object Generator]"})),e.keys=function(t){var e=Object(t),r=[];for(var n in e)r.push(n);return r.reverse(),function t(){for(;r.length;){var n=r.pop();if(n in e)return t.value=n,t.done=!1,t}return t.done=!0,t}},e.values=F,M.prototype={constructor:M,reset:function(e){if(this.prev=0,this.next=0,this.sent=this._sent=t,this.done=!1,this.delegate=null,this.method="next",this.arg=t,this.tryEntries.forEach(P),!e)for(var r in this)"t"===r.charAt(0)&&n.call(this,r)&&!isNaN(+r.slice(1))&&(this[r]=t)},stop:function(){this.done=!0;var t=this.tryEntries[0].completion;if("throw"===t.type)throw t.arg;return this.rval},dispatchException:function(e){if(this.done)throw e;var r=this;function a(n,a){return c.type="throw",c.arg=e,r.next=n,a&&(r.method="next",r.arg=t),!!a}for(var o=this.tryEntries.length-1;o>=0;--o){var i=this.tryEntries[o],c=i.completion;if("root"===i.tryLoc)return a("end");if(i.tryLoc<=this.prev){var s=n.call(i,"catchLoc"),u=n.call(i,"finallyLoc");if(s&&u){if(this.prev<i.catchLoc)return a(i.catchLoc,!0);if(this.prev<i.finallyLoc)return a(i.finallyLoc)}else if(s){if(this.prev<i.catchLoc)return a(i.catchLoc,!0)}else{if(!u)throw Error("try statement without catch or finally");if(this.prev<i.finallyLoc)return a(i.finallyLoc)}}}},abrupt:function(t,e){for(var r=this.tryEntries.length-1;r>=0;--r){var a=this.tryEntries[r];if(a.tryLoc<=this.prev&&n.call(a,"finallyLoc")&&this.prev<a.finallyLoc){var o=a;break}}o&&("break"===t||"continue"===t)&&o.tryLoc<=e&&e<=o.finallyLoc&&(o=null);var i=o?o.completion:{};return i.type=t,i.arg=e,o?(this.method="next",this.next=o.finallyLoc,g):this.complete(i)},complete:function(t,e){if("throw"===t.type)throw t.arg;return"break"===t.type||"continue"===t.type?this.next=t.arg:"return"===t.type?(this.rval=this.arg=t.arg,this.method="return",this.next="end"):"normal"===t.type&&e&&(this.next=e),g},finish:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var r=this.tryEntries[e];if(r.finallyLoc===t)return this.complete(r.completion,r.afterLoc),P(r),g}},catch:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var r=this.tryEntries[e];if(r.tryLoc===t){var n=r.completion;if("throw"===n.type){var a=n.arg;P(r)}return a}}throw Error("illegal catch attempt")},delegateYield:function(e,r,n){return this.delegate={iterator:F(e),resultName:r,nextLoc:n},"next"===this.method&&(this.arg=t),g}},e}function i(t,e,r,n,a,o,i){try{var c=t[o](i),s=c.value}catch(t){return void r(t)}c.done?e(s):Promise.resolve(s).then(n,a)}function c(t){return function(){var e=this,r=arguments;return new Promise((function(n,a){var o=t.apply(e,r);function c(t){i(o,n,a,c,s,"next",t)}function s(t){i(o,n,a,c,s,"throw",t)}c(void 0)}))}}function s(t,e){return function(t){if(Array.isArray(t))return t}(t)||function(t,e){var r=null==t?null:"undefined"!=typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(null!=r){var n,a,o,i,c=[],s=!0,u=!1;try{if(o=(r=r.call(t)).next,0===e){if(Object(r)!==r)return;s=!1}else for(;!(s=(n=o.call(r)).done)&&(c.push(n.value),c.length!==e);s=!0);}catch(t){u=!0,a=t}finally{try{if(!s&&null!=r.return&&(i=r.return(),Object(i)!==i))return}finally{if(u)throw a}}return c}}(t,e)||function(t,e){if(t){if("string"==typeof t)return u(t,e);var r={}.toString.call(t).slice(8,-1);return"Object"===r&&t.constructor&&(r=t.constructor.name),"Map"===r||"Set"===r?Array.from(t):"Arguments"===r||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)?u(t,e):void 0}}(t,e)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function u(t,e){(null==e||e>t.length)&&(e=t.length);for(var r=0,n=Array(e);r<e;r++)n[r]=t[r];return n}function l(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,f(n.key),n)}}function f(t){var e=function(t,e){if("object"!=a(t)||!t)return t;var r=t[Symbol.toPrimitive];if(void 0!==r){var n=r.call(t,e||"default");if("object"!=a(n))return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===e?String:Number)(t)}(t,"string");return"symbol"==a(e)?e:e+""}var d=function(){return t=function t(){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),this.socket=io(),this.selectedBets=new Map,this.board=null,this.game=new Chess,this.marketData=null,this.initializeSocket(),this.initializeChessboard(),this.initializeEventListeners()},e=[{key:"initializeSocket",value:function(){var t=this;this.socket.on("connect",(function(){console.log("Connected to server"),t.socket.emit("subscribeToBets",gameId)})),this.socket.on("marketUpdate",(function(e){t.updateMarkets(e)})),this.socket.on("betPlaced",(function(e){t.handleBetPlaced(e)})),this.socket.on("gameState",(function(e){t.updateGameState(e)}))}},{key:"initializeChessboard",value:function(){var t=this,e={position:"start",orientation:playerColor,draggable:!1,pieceTheme:"/img/chesspieces/{piece}.png"};this.board=Chessboard("game-board",e),n(window).resize((function(){return t.board.resize()}))}},{key:"initializeEventListeners",value:function(){var t=this;n(".markets-grid").on("click",".odds-button",(function(e){var r=n(e.currentTarget),a=r.data("market-id"),o=r.data("choice"),i=r.data("odds");t.toggleBetSelection(a,o,i)})),n(".bet-slip .btn-success").on("click",(function(){t.placeBet()})),n('.bet-slip input[type="number"]').on("input",(function(e){t.updatePotentialReturns(e.target.value)})),n(".chat-input input").on("keypress",(function(e){13===e.which&&t.sendChatMessage()})),n(".chat-controls .btn-primary").on("click",(function(){t.sendChatMessage()})),n(".chat-controls .btn-secondary").on("click",(function(){t.startVoiceRecording()})),n(".chat-controls .btn-info").on("click",(function(){t.startScreenSharing()}))}},{key:"updateMarkets",value:function(t){var e=this;this.marketData=t;var r=n(".markets-grid");r.empty(),t.markets.forEach((function(t){var n=e.createMarketCard(t);r.append(n)}))}},{key:"createMarketCard",value:function(t){var e=this,r=n("<div>").addClass("market-card"),a=n("<h4>").text(t.name);r.append(a);var o=n("<div>").addClass("odds-container");return Object.entries(t.odds).forEach((function(r){var a=s(r,2),i=a[0],c=a[1],u=n("<button>").addClass("odds-button").attr({"data-market-id":t.id,"data-choice":i,"data-odds":c}).text("".concat(i," (").concat(c,")"));e.selectedBets.has("".concat(t.id,"-").concat(i))&&u.addClass("selected"),o.append(u)})),r.append(o),r}},{key:"toggleBetSelection",value:function(t,e,r){var a="".concat(t,"-").concat(e);this.selectedBets.has(a)?(this.selectedBets.delete(a),n('.odds-button[data-market-id="'.concat(t,'"][data-choice="').concat(e,'"]')).removeClass("selected")):(this.selectedBets.set(a,{marketId:t,choice:e,odds:r}),n('.odds-button[data-market-id="'.concat(t,'"][data-choice="').concat(e,'"]')).addClass("selected")),this.updateBetSlip()}},{key:"updateBetSlip",value:function(){var t=this,e=n(".selected-bets");e.empty(),this.selectedBets.forEach((function(r){var a=n("<div>").addClass("selected-bet").append(n("<span>").text("".concat(r.choice," @ ").concat(r.odds))).append(n("<button>").addClass("btn btn-sm btn-danger").text("Remove").on("click",(function(){return t.toggleBetSelection(r.marketId,r.choice,r.odds)})));e.append(a)})),this.updatePotentialReturns(n('.bet-slip input[type="number"]').val())}},{key:"updatePotentialReturns",value:function(t){if(t&&0!==this.selectedBets.size){var e=Array.from(this.selectedBets.values()).reduce((function(t,e){return t*parseFloat(e.odds)}),1),r=(parseFloat(t)*e).toFixed(2);n(".potential-returns").text("$".concat(r))}else n(".potential-returns").text("$0.00")}},{key:"placeBet",value:function(){var t=c(o().mark((function t(){var e,r,a,i;return o().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:if((e=parseFloat(n('.bet-slip input[type="number"]').val()))&&0!==this.selectedBets.size){t.next=4;break}return alert("Please select bets and enter a stake amount"),t.abrupt("return");case 4:return r=Array.from(this.selectedBets.values()).map((function(t){return{marketId:t.marketId,choice:t.choice,odds:t.odds,stake:e}})),t.prev=5,t.next=8,fetch("/betting/api/place-bet",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({bets:r})});case 8:return a=t.sent,t.next=11,a.json();case 11:(i=t.sent).success?(this.selectedBets.clear(),this.updateBetSlip(),alert("Bet placed successfully!")):alert(i.error||"Failed to place bet"),t.next=19;break;case 15:t.prev=15,t.t0=t.catch(5),console.error("Error placing bet:",t.t0),alert("Failed to place bet");case 19:case"end":return t.stop()}}),t,this,[[5,15]])})));return function(){return t.apply(this,arguments)}}()},{key:"updateGameState",value:function(t){t.fen&&(this.game.load(t.fen),this.board.position(t.fen)),n(".player-info.white .player-time").text(this.formatTime(t.timeLeft.white)),n(".player-info.black .player-time").text(this.formatTime(t.timeLeft.black)),n(".game-status .status-text").text(t.status)}},{key:"formatTime",value:function(t){var e=Math.floor(t/60),r=t%60;return"".concat(e,":").concat(r.toString().padStart(2,"0"))}},{key:"sendChatMessage",value:function(){var t=c(o().mark((function t(){var e,r;return o().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:if(e=n(".chat-input input"),r=e.val().trim()){t.next=4;break}return t.abrupt("return");case 4:return t.prev=4,t.next=7,this.socket.emit("chatMessage",{roomId:gameId,message:r,type:"text"});case 7:e.val(""),t.next=14;break;case 10:t.prev=10,t.t0=t.catch(4),console.error("Error sending message:",t.t0),alert("Failed to send message");case 14:case"end":return t.stop()}}),t,this,[[4,10]])})));return function(){return t.apply(this,arguments)}}()},{key:"startVoiceRecording",value:function(){var t=c(o().mark((function t(){var e,r,n,a=this;return o().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.prev=0,t.next=3,navigator.mediaDevices.getUserMedia({audio:!0});case 3:e=t.sent,r=new MediaRecorder(e),n=[],r.ondataavailable=function(t){return n.push(t.data)},r.onstop=c(o().mark((function t(){var r;return o().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return r=new Blob(n,{type:"audio/webm"}),t.next=3,a.uploadMedia(r,"audio");case 3:e.getTracks().forEach((function(t){return t.stop()}));case 4:case"end":return t.stop()}}),t)}))),r.start(),setTimeout((function(){return r.stop()}),3e4),t.next=16;break;case 12:t.prev=12,t.t0=t.catch(0),console.error("Error starting voice recording:",t.t0),alert("Failed to start voice recording");case 16:case"end":return t.stop()}}),t,null,[[0,12]])})));return function(){return t.apply(this,arguments)}}()},{key:"startScreenSharing",value:function(){var t=c(o().mark((function t(){var e,r,n,a=this;return o().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.prev=0,t.next=3,navigator.mediaDevices.getDisplayMedia({video:!0});case 3:e=t.sent,r=new MediaRecorder(e),n=[],r.ondataavailable=function(t){return n.push(t.data)},r.onstop=c(o().mark((function t(){var r;return o().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return r=new Blob(n,{type:"video/webm"}),t.next=3,a.uploadMedia(r,"video");case 3:e.getTracks().forEach((function(t){return t.stop()}));case 4:case"end":return t.stop()}}),t)}))),r.start(),setTimeout((function(){return r.stop()}),6e4),t.next=16;break;case 12:t.prev=12,t.t0=t.catch(0),console.error("Error starting screen sharing:",t.t0),alert("Failed to start screen sharing");case 16:case"end":return t.stop()}}),t,null,[[0,12]])})));return function(){return t.apply(this,arguments)}}()},{key:"uploadMedia",value:function(){var t=c(o().mark((function t(e,r){var n,a,i;return o().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return(n=new FormData).append("file",e),t.prev=2,t.next=5,fetch("/betting/api/upload",{method:"POST",body:n});case 5:return a=t.sent,t.next=8,a.json();case 8:if(!(i=t.sent).success){t.next=14;break}return t.next=12,this.socket.emit("chatMessage",{roomId:gameId,type:r,content:i.url});case 12:t.next=15;break;case 14:throw new Error(i.error||"Upload failed");case 15:t.next=21;break;case 17:t.prev=17,t.t0=t.catch(2),console.error("Error uploading media:",t.t0),alert("Failed to upload media");case 21:case"end":return t.stop()}}),t,this,[[2,17]])})));return function(e,r){return t.apply(this,arguments)}}()}],e&&l(t.prototype,e),r&&l(t,r),Object.defineProperty(t,"prototype",{writable:!1}),t;var t,e,r}();n(document).ready((function(){window.bettingUI=new d}))}},t=>{t.O(0,[375],(()=>{return e=698,t(t.s=e);var e}));t.O()}]);
//# sourceMappingURL=betting.af3d5fd2592c98177767.js.map