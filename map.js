function parseHash(e){return(e=e.slice(1)).split("&").map((e=>e.split("="))).filter((e=>""!==e[0]&&void 0!==e[1])).reduce(((e,[t,a])=>{try{return{...e,[t]:JSON.parse(decodeURIComponent(a))}}catch(i){return console.log(i,t,decodeURIComponent(a)),e}}),{})}const InfiniteBackgroundLayer=L.Layer.extend({options:{backgroundImage:"url('tiles/overworld.png')",tileSize:256,minNativeZoom:1},initialize:function(e){L.setOptions(this,e)},onAdd:function(e){this._container=L.DomUtil.create("div"),this._map=e,this._container.style.backgroundImage=this.options.backgroundImage,L.DomUtil.addClass(this._container,"infinite-background-layer"),e.getContainer().appendChild(this._container),e.on("viewreset",this._update,this),e.on("zoomanim",this._zoomAnim,this),e.on("move",this._move,this),this._update()},onRemove:function(e){L.DomUtil.remove(this._container),e.off("viewreset",this._update,this),e.off("zoomanim",this._zoomAnim,this),e.off("move",this._move,this)},_zoomAnim:function(e){this._container.style.backgroundSize=this.options.tileSize/Math.pow(2,this.options.minNativeZoom-e.zoom)+"px";const{x:t,y:a}=this._map.getPixelBounds().min;this._container.style.backgroundPosition=`${-t}px ${-a}px`},_move:function(e){const{x:t,y:a}=this._map.getPixelBounds().min;this._container.style.backgroundPosition=`${-t}px ${-a}px`},_update:function(){if(this._map){this._container.style.backgroundSize=this.options.tileSize/Math.pow(2,this.options.minNativeZoom-this._map.getZoom())+"px";const{x:e,y:t}=this._map.getPixelBounds().min;this._container.style.backgroundPosition=`${-e}px ${-t}px`}}});function createMap(e){const t=L.map(e,{zoomControl:!1,crs:L.CRS.Simple});return L.control.zoom({zoomInTitle:"ズームイン",zoomOutTitle:"ズームアウト"}).addTo(t),t.mcProject=function(e){const{x:t,y:a}=this.project(e,this.dimData.minZoom);return[this.dimData.ratio*t+this.dimData.X0,this.dimData.ratio*a+this.dimData.Z0]},t.mcUnproject=function([e,t]){return this.unproject([(e-this.dimData.X0)/this.dimData.ratio,(t-this.dimData.Z0)/this.dimData.ratio],this.dimData.minZoom)},t.dimCache={},t.layerCache={},t}async function changeDim(e,t){if(e.dim===t)return;let a;e.dim&&e.eachLayer((function(e){e.remove()})),e.dim=t,"e"===e.dim?a="data/end.json":"n"===e.dim?(await loadTileData(e,"o","data/overworld.json"),a="data/nether.json"):(e.dim="o",a="data/overworld.json"),e.hashObj.d=e.dim,await loadTileData(e,e.dim,a),"n"===e.dim&&(e.dimCache.n.dates=e.dimCache.o.dates,e.dimCache.n.fileDates=e.dimCache.o.fileDates),e.dimData=e.dimCache[e.dim];const i=e.mcUnproject([e.dimData.minX,e.dimData.maxZ]),n=e.mcUnproject([e.dimData.maxX,e.dimData.minZ]);e.setMaxBounds(new L.LatLngBounds(i,n));const o=e.hashObj&&e.hashObj.dD&&e.hashObj.dD[e.dim],d=o&&o.c&&o.c.X,l=0===e.dimData.startX?0:e.dimData.startX||(0===d?0:"number"==typeof d&&d||e.dimData.defaultX),c=o&&o.c&&o.c.Z,s=0===e.dimData.startZ?0:e.dimData.startZ||(0===c?0:"number"==typeof c&&c||e.dimData.defaultZ),m=o&&o.c&&o.c.z,r=0===e.dimData.startZoom?0:e.dimData.startZoom||(0===m?0:Number.isInteger(m)&&m<=e.dimData.maxZoom&&m>=e.dimData.minZoom&&m||e.dimData.defaultZoom);void 0===e.dimData.timeline&&(e.dimData.timeline={dateCache:{}}),void 0===e.dimData.timeline.date&&(e.dimData.timeline.date=e.dimData.dates.includes(o&&o.h&&o.h.d)&&o.h.d||e.dimData.dates[e.dimData.dates.length-1]),void 0===e.dimData.timeline.exact&&(e.dimData.timeline.exact=!0===(o&&o.h&&o.h.e)),void 0===e.dimData.timeline.fill&&(e.dimData.timeline.fill=!(o&&o.h&&!1===o.h.f)),e.hashObj.dD||(e.hashObj.dD={}),e.hashObj.dD[e.dim]={c:{X:l,Z:s,z:r},v:Array.from(e.dimData.visibleLayers),h:{d:e.dimData.timeline.date,e:e.dimData.timeline.exact,f:e.dimData.timeline.fill}},e.sidebar.timelineControl.init(e.dimData.dates),await getTileReplacements(e),e.dimData.base?e.dimData.base.addTo(e):e.dimData.base=setupBase(e),e.dimData.bg?e.dimData.bg.addTo(e):e.dimData.bg=new InfiniteBackgroundLayer({backgroundImage:`url(${e.dimData.errorTileUrl})`,tileSize:e.dimData.tileSize,minNativeZoom:e.dimData.minNativeZoom}).addTo(e),"o"===e.dim?(document.getElementById("locate-dimension-overworld").checked=!0,document.getElementById("layers-dimension-overworld").checked=!0):"n"===e.dim?(document.getElementById("locate-dimension-nether").checked=!0,document.getElementById("layers-dimension-nether").checked=!0):"e"===e.dim&&(document.getElementById("locate-dimension-end").checked=!0,document.getElementById("layers-dimension-end").checked=!0);const h=document.getElementById("grid-checkbox");if(!e.layerCache["g"+e.dim]){const t=setupGrid(e,e.dimData.tileSize);e.layerCache["g"+e.dim]={dataLayer:t,check:h}}if(h.onchange=function(){const t=e.layerCache["g"+e.dim].dataLayer;h.checked?(e.dimData.visibleLayers.add("g"+e.dim),t.addTo(e)):(e.dimData.visibleLayers.delete("g"+e.dim),t.remove())},e.sidebar.layersControl.init(e.dimData.layers),h.checked=!1,"n"===e.dim){if(!e.layerCache["nether-lines"]){const t=L.layerGroup([]);for(const a of e.dimData.layers){e.layerCache[a.id].dataLayer||(e.layerCache[a.id]={check:e.layerCache[a.id].check,url:a.url,fraction:a.fraction,...await setupLayer(e,a.url,a.fraction)});const{data:i,dataLayer:n}=e.layerCache[a.id];if(i.lines)for(const{pts:a}of i.lines){const i=8,n=a.map((([t,a,n])=>e.mcUnproject([i*t,i*n])));t.addLayer(L.polyline(n,{color:"gray"}))}}e.layerCache["nether-lines"]={dataLayer:t}}e.layerCache["nether-lines"].dataLayer.addTo(e)}for(const t of e.dimData.visibleLayers)e.layerCache[t]?(e.layerCache[t].check.checked=!0,e.layerCache[t].dataLayer||(e.layerCache[t]={check:e.layerCache[t].check,url:e.layerCache[t].url,fraction:e.layerCache[t].fraction,...await setupLayer(e,e.layerCache[t].url,e.layerCache[t].fraction)}),e.layerCache[t].check.parentElement.style.backgroundColor=`hsla(${215+360*e.layerCache[t].fraction}, 100%, 60%, 0.5)`,e.layerCache[t].dataLayer.addTo(e)):e.dimData.visibleLayers.delete(t);e.setView(e.mcUnproject([l,s]),r,{animate:!1}),e.sidebar.coordsControl.init()}async function loadTileData(e,t,a){if(!e.dimCache[t]){const{X0:i,Z0:n,defaultX:o,defaultZ:d,defaultZoom:l,minZoom:c,maxZoom:s,minNativeZoom:m,maxNativeZoom:r,minX:h,maxX:u,minZ:p,maxZ:y,dates:f,fileDates:g,layers:D,tilePath:b,errorTileUrl:v,tileSize:C,ratio:L}=await(await fetch(a)).json();e.dimCache[t]={X0:i,Z0:n,defaultX:o,defaultZ:d,defaultZoom:l,minZoom:c,maxZoom:s,minNativeZoom:m,maxNativeZoom:r,minX:h,maxX:u,minZ:p,maxZ:y,dates:f,fileDates:g,layers:D,tilePath:b,errorTileUrl:v,tileSize:C,ratio:L,visibleLayers:new Set(Array.isArray(e.hashObj.dD&&e.hashObj.dD[t]&&e.hashObj.dD[t].v)&&e.hashObj.dD[t].v||("n"===t?D.map((({id:e})=>e)):[]))},e.dimCache[t].layers.forEach(((a,i)=>{a.fraction=i/e.dimCache[t].layers.length})),console.log(t,"reset")}}function setupBase(e){const{tileSize:t,minZoom:a,maxZoom:i,minNativeZoom:n,maxNativeZoom:o,tilePath:d,errorTileUrl:l,fileDates:c,timeline:s}=e.dimData,m="***",r=L.tileLayer.fallback("{tilePath}/{z}/{x}/{y}/***.png",{attribution:"TPA(Minecraft)<br>最終更新：2022/10/17 22:24:32",tileSize:t,noWrap:!0,minZoom:a+("n"===e.dim?-3:0),maxZoom:i+("n"===e.dim?-3:0),minNativeZoom:n,maxNativeZoom:o,infinite:!0,tilePath:d,errorTileUrl:l,opacity:"n"===e.dim?.2:1});return r._originalIsValidTile=r._isValidTile,r._isValidTile=function(t){const a=`${t.z}/${t.x}/${t.y}`,i=c[a],n=e.dimData.timeline.tileReplacements[a];return!(this._map.getZoom()<this.options.minNativeZoom&&!i&&!n)&&this._originalIsValidTile(d)},r._originalCreateTile=r.createTile,r.createTile=function(t,a){const i=`${t.z}/${t.x}/${t.y}`,n=e.dimData.timeline.tileReplacements[i];if(n){const e=this.getTileSize(),t=document.createElement("div"),i=[];for(const a of n){const n=t.appendChild(document.createElement("img"));i.push(new Promise((e=>{n.onload=()=>e()}))),n.style.position="absolute",n.src=`${this.options.tilePath}/${a.key}/${a.date}.png`;const o=a.scale*e.x,d=a.scale*e.x;n.style.width=o+"px",n.style.height=d+"px",n.style.left=o*a.pos_x+"px",n.style.top=d*a.pos_z+"px"}return Promise.all(i).then((()=>a())),t}return r._originalCreateTile(t,a)},r._originalGetTileUrl=r.getTileUrl,r.getTileUrl=function(e){const t=`${e.z}/${e.x}/${e.y}`,a=c[t];if(e.z<=this.options.minNativeZoom&&!a)return this.options.errorTileUrl;const i=this._originalGetTileUrl(e),n="data:,";if(a){const e=s.exact?a.includes(s.date)&&s.date:s.fill?a.find(((e,t,a)=>t===a.length-1||a[t+1]>s.date)):a.find(((e,t,a)=>e<=s.date&&(t===a.length-1||a[t+1]>s.date)));return e?s.fill&&s.skip[t]?n:i.replace(m,e):n}return n},r.addTo(e),r}function setupGrid(e,t){const a="n"===e.dim?-3:0,i="n"===e.dim?1:4,n=L.gridLayer({minZoom:a,maxZoom:i,tileSize:t,noWrap:!0,infinite:!0});return n.createTile=function(t){const a=L.DomUtil.create("div","tile-coords"),i=("n"===e.dim?1:4)-t.z;return a.appendChild(L.DomUtil.create("div","gridLabelLayer")).innerText=`縮小率${i}: [${t.x},${t.y}]`,a},n}async function setupLayer(e,t,a=0){const i=`layer-icon-${a}`.replace(".","p"),n=await(await fetch(t)).json(),o=L.featureGroup([]);if(0===o.getLayers().length){if(n.markers){icons[i]||(icons[i]=L.Icon.Default.extend({options:{className:i}}),document.head.appendChild(document.createElement("style")).innerHTML=`.${i} { filter: hue-rotate(${a}turn); }`);for(const a of n.markers){const{name:n,pos:d}=a,l="n"===e.dim?8:1,c=d[0]*l,s=d[2]*l,m=document.createElement("div");m.innerHTML=`${n}<br>[X=${d[0]}, Y=${d[1]}, Z=${d[2]}]`,a.marker=L.marker(e.mcUnproject([c,s]),{icon:new icons[i]}).bindPopup(m),o.addLayer(a.marker),t.endsWith("gate.json")&&a.marker.setZIndexOffset(1e3)}}if(n.lines)for(const t of n.lines){const{name:i,pts:d}=t,l="n"===e.dim?8:1,c=d.map((([t,a,i])=>e.mcUnproject([l*t,l*i])));t.line=L.polyline(c,{color:`hsla(${215+360*a}, 100%, 60%, 1)`}).bindPopup(i||n.name),o.addLayer(t.line)}}return{data:n,dataLayer:o}}function setupLayerPanel(e){const t=document.getElementById("layers-select"),a=document.getElementById("layers-details"),i=a.innerHTML;e.sidebar.layersControl={layersSelect:t,layersDetails:a,currentlyViewed:null},e.sidebar.layersControl.clear=function(e){for(;t.firstChild;)t.removeChild(t.firstChild);a.innerHTML=e?i:""},e.sidebar.layersControl.init=function(i){e.sidebar.layersControl.clear(i.length>0);for(const n of i){const i=t.appendChild(document.createElement("div"));i.classList.add("layers-layerlist");const o=i.appendChild(document.createElement("span"));i.classList.add("layers-eye"),o.textContent="🔎",o.onclick=async function(){e.sidebar.layersControl.currentlyViewed&&(e.sidebar.layersControl.currentlyViewed.textContent="🔎"),e.sidebar.layersControl.currentlyViewed=o,o.textContent="👁",e.layerCache[n.id].dataLayer||(e.layerCache[n.id]={check:e.layerCache[n.id].check,url:n.url,fraction:n.fraction,...await setupLayer(e,n.url,n.fraction)});const{data:t,dataLayer:i}=e.layerCache[n.id];a.innerHTML="";const d=a.appendChild(document.createElement("div"));d.classList.add("layers-details-title"),d.innerHTML=`「${t.name}」レイヤーの位置：<br>下の位置の名前をリックすると、地図中心に表示します。注意：チェックボックスをオンにしない場合、マーカーは表示されません。`;const l=a.appendChild(document.createElement("div"));l.classList.add("layers-details-marker"),l.textContent="📍📍 レイヤー全体が表示されるようにズームする",l.onclick=function(){e.fitBounds(i.getBounds(),{animate:!0})};for(const i of t.markers){const t=a.appendChild(document.createElement("div"));t.classList.add("layers-details-marker"),t.textContent=`📍 ${i.name}`,t.onclick=function(){e.once("moveend",(()=>i.marker.openPopup())),e.panTo(i.marker.getLatLng(),{animate:!0})}}};const d=i.appendChild(document.createElement("input"));e.layerCache[n.id]?(e.layerCache[n.id].check=d,e.layerCache[n.id].url=n.url,e.layerCache[n.id].fraction=n.fraction):e.layerCache[n.id]={check:d,url:n.url,fraction:n.fraction},d.id=`map-layer-${n.id}`,d.type="checkbox";const l=i.appendChild(document.createElement("label"));l.classList.add("layers-layerlist-label"),l.textContent=n.name,l.htmlFor=d.id,d.onchange=async function(){e.layerCache[n.id].dataLayer||(e.layerCache[n.id]={check:e.layerCache[n.id].check,url:n.url,fraction:n.fraction,...await setupLayer(e,n.url,n.fraction)}),d.checked?(e.layerCache[n.id].dataLayer.addTo(e),e.dimData.visibleLayers.add(n.id),i.style.backgroundColor=`hsla(${215+360*n.fraction}, 100%, 60%, 0.5)`):(e.layerCache[n.id].dataLayer.remove(),e.dimData.visibleLayers.delete(n.id),i.style.backgroundColor="")}}}}async function setupTimelinePanel(e){const t=await(await fetch("data/dates.json")).json();function a(e){return t[e]||`${e.slice(0,4)}年${e.slice(4,6)}月${e.slice(6)}日`}const i=await(await fetch("data/vods.json")).json(),n=document.getElementById("timeline-current");function o(t){n.innerHTML=("n"===e.dim?"オーバーレイに表示されているオーバーワールドの":"現在表示されている")+`タイルは<b>${a(t)}</b>`+(e.dimData.timeline.exact?"<b>に</b>保存されたタイルです":e.dimData.timeline.fill?"<b>以前に</b>保存されたタイルで、欠落したタイルはそれ以降のタイルに置き換えられます":"<b>以前に</b>保存されたタイルです")}const d=document.getElementById("timeline-checkbox-exact");d.onchange=async()=>{e.dimData.timeline.exact=d.checked,e.dimData.timeline.exact?(l.style.display="none",c.style.display="none"):(l.style.display="inline",c.style.display="inline"),o(e.dimData.timeline.date),await getTileReplacements(e),e.dimData.base.redraw()};const l=document.getElementById("timeline-checkbox-after"),c=document.getElementById("timeline-checkbox-after-label");l.onchange=async()=>{e.dimData.timeline.fill=l.checked,o(e.dimData.timeline.date),await getTileReplacements(e),e.dimData.base.redraw()};const s=document.getElementById("timeline-radio");e.sidebar.timelineControl={timelineRadio:s},e.sidebar.timelineControl.init=function(t){function n(){const t=document.getElementById("timeline-button-left"),a=document.getElementById("timeline-button-right"),i=e.dimData.dates.indexOf(e.dimData.timeline.date);async function d(t){document.getElementById(`map-timeline-${e.dimData.timeline.date}`).checked=!1,e.dimData.timeline.date=e.dimData.dates[t];const a=document.getElementById(`map-timeline-${e.dimData.timeline.date}`);a.checked=!0,m[e.dimData.timeline.date.slice(0,6)].details.hasAttribute("open")||(m[e.dimData.timeline.date.slice(0,6)].details.open=!0),a.scrollIntoView({block:"nearest"}),o(e.dimData.timeline.date),n(),await getTileReplacements(e),e.dimData.base.redraw()}t.disabled=0===i,a.disabled=i===e.dimData.dates.length-1,t.onclick=()=>d(i-1),a.onclick=()=>d(i+1)}for(d.checked=e.dimData.timeline.exact,l.checked=e.dimData.timeline.fill,e.dimData.timeline.exact?(l.style.display="none",c.style.display="none"):(l.style.display="inline",c.style.display="inline"),o(e.dimData.timeline.date);s.firstChild;)s.removeChild(s.firstChild);const m={};let r=0;for(const d of t){for(;r<i.length&&i[r].date<=d;){const e=i[r].date;if(!m[e.slice(0,6)]){const t=s.appendChild(document.createElement("details")),a=t.appendChild(document.createElement("summary"));a.classList.add("timeline-details-summary"),m[e.slice(0,6)]={details:t,summary:a,prefix:`${e.slice(0,4)}年${e.slice(4,6)}月`,vods:0,dates:0}}const t=m[e.slice(0,6)].details.appendChild(document.createElement("div"));m[e.slice(0,6)].vods+=1,m[e.slice(0,6)].summary.innerHTML=`${m[e.slice(0,6)].prefix} ${m[e.slice(0,6)].dates>0?`(🗓${m[e.slice(0,6)].dates})`:""} ${m[e.slice(0,6)].vods>0?`(<img src="TwitchGlitchPurple.svg" height="14">${m[e.slice(0,6)].vods})`:""}`,t.classList.add("timeline-vod-div"),t.innerHTML=`<a href="https://twitch.tv/videos/${i[r].id}" target="_blank" rel="noopener noreferrer"><img src="TwitchGlitchPurple.svg" height="12"> ${a(e)}：${i[r].title}`,r++}if(!m[d.slice(0,6)]){const e=s.appendChild(document.createElement("details")),t=e.appendChild(document.createElement("summary"));t.classList.add("timeline-details-summary"),m[d.slice(0,6)]={details:e,summary:t,prefix:`${d.slice(0,4)}年${d.slice(4,6)}月`,vods:0,dates:0}}const t=m[d.slice(0,6)].details.appendChild(document.createElement("div"));m[d.slice(0,6)].dates+=1,m[d.slice(0,6)].summary.innerHTML=`${m[d.slice(0,6)].prefix} ${m[d.slice(0,6)].dates>0?`(🗓${m[d.slice(0,6)].dates})`:""} ${m[d.slice(0,6)].vods>0?`(<img src="TwitchGlitchPurple.svg" height="14">${m[d.slice(0,6)].vods})`:""}`;const l=t.appendChild(document.createElement("input"));l.type="radio",l.id=`map-timeline-${d}`,l.name="map-timeline",d===e.dimData.timeline.date&&(l.checked=!0),l.onchange=async function(){!0===l.checked&&(m[d.slice(0,6)].details.hasAttribute("open")||(m[d.slice(0,6)].details.open=!0,l.scrollIntoView({block:"nearest"}))),e.dimData.timeline.date=d,o(e.dimData.timeline.date),n(),await getTileReplacements(e),e.dimData.base.redraw()};const c=t.appendChild(document.createElement("label"));c.textContent=a(d),c.htmlFor=l.id}for(;r<i.length;){const e=i[r].date;if(!m[e.slice(0,6)]){const t=s.appendChild(document.createElement("details")),a=t.appendChild(document.createElement("summary"));a.classList.add("timeline-details-summary"),m[e.slice(0,6)]={details:t,summary:a,prefix:`${e.slice(0,4)}年${e.slice(4,6)}月`,vods:0,dates:0}}const t=m[e.slice(0,6)].details.appendChild(document.createElement("div"));m[e.slice(0,6)].vods+=1,m[e.slice(0,6)].summary.innerHTML=`${m[e.slice(0,6)].prefix} ${m[e.slice(0,6)].dates>0?`(🗓${m[e.slice(0,6)].dates})`:""} ${m[e.slice(0,6)].vods>0?`(<img src="TwitchGlitchPurple.svg" height="14">${m[e.slice(0,6)].vods})`:""}`,t.classList.add("timeline-vod-div"),t.innerHTML=`<a href="https://twitch.tv/videos/${i[r].id}" target="_blank" rel="noopener noreferrer"><img src="TwitchGlitchPurple.svg" height="12"> ${a(e)}：${i[r].title}`,r++}m[e.dimData.timeline.date.slice(0,6)].details.open=!0,document.getElementById(`map-timeline-${e.dimData.timeline.date}`).scrollIntoView({block:"nearest"}),n()},e.sidebar.on("content",(function(t){"timeline"===t.id&&document.getElementById(`map-timeline-${e.dimData.timeline.date}`).scrollIntoView({block:"nearest"})}))}async function getTileReplacements(e){const{date:t,exact:a,fill:i,dateCache:n}=e.dimData.timeline,o=`${t}-${a?"e":i?"f":"b"}`;if(!n[o]){const t="e"===e.dim?"end":"overworld";n[o]=await(await fetch(`data/${t}/${o}.json`)).json()}e.dimData.timeline.tileReplacements=n[o].tileReplacements,e.dimData.timeline.skip=n[o].skip}function setupPermalinkPanel(e){const t=document.getElementById("permalink-text");t.onclick=()=>{t.focus(),t.select(),t.setSelectionRange(0,99999)};const a=document.getElementById("permalink-button"),i=document.getElementById("permalink-copy-status");a.onclick=()=>{t.select(),t.setSelectionRange(0,99999),navigator.clipboard.writeText(t.value),i.classList.add("animating"),setTimeout((()=>{i.classList.add("fade-out-500"),setTimeout((()=>{i.classList.remove("fade-out-500","animating")}),500)}),1500)};const n=document.getElementById("permalink-checkbox-date");function o(){e.updateHash();let a={};for(const t of["o","n","e"])e.hashObj.dD[t]&&(n.checked?a[t]={c:e.hashObj.dD[t].c,v:e.hashObj.dD[t].v,h:e.hashObj.dD[t].h}:a[t]={c:e.hashObj.dD[t].c,v:e.hashObj.dD[t].v});t.value=`${e.url.origin}${e.url.pathname}#d="${e.dim}"&dD=${encodeURIComponent(JSON.stringify(a))}`}n.onchange=o,e.sidebar.on("content",(function(t){"link"===t.id?(e.on("moveend zoomend",o),e.hashObj.dD[e.dim].v=Array.from(e.dimData.visibleLayers),e.hashObj.dD[e.dim].h.d=e.dimData.timeline.date,e.hashObj.dD[e.dim].h.e=e.dimData.timeline.exact,e.hashObj.dD[e.dim].h.f=e.dimData.timeline.fill,o()):e.off("moveend zoomend",o)})),e.sidebar.on("closing",(function(){e.off("moveend zoomend",o)}))}function setupCoordinatePanel(e){const t=document.getElementById("locate-current-coords");function a(){const[a,i]=e.mcProject(e.getCenter()).map((t=>"n"===e.dim?t/8:t)).map(Math.round);t.innerHTML=`地図の中心の座標は<b>[X=${a}, Z=${i}]</b>です`}e.sidebar.on("content",(function(t){"locate"===t.id?(e.on("moveend zoomend move zoom",a),a()):e.off("moveend zoomend move zoom",a)})),e.sidebar.on("closing",(function(){e.off("moveend zoomend move zoom",a)}));document.getElementById("locate-go-home").onclick=()=>{const{defaultX:t,defaultZ:a,defaultZoom:i}=e.dimData;e.setView(e.mcUnproject([t,a]),i,{animate:!0})};const i=document.getElementById("locate-marker-div"),n=i.appendChild(document.createElement("div"));n.innerHTML="<button>🗑削除</button>",n.classList.add("locate-close-button");const o=document.createElement("div"),d=o.appendChild(document.createElement("div"));d.innerHTML="<button>🗑削除</button>",d.classList.add("locate-close-button");const l=L.marker();function c(t){const a=document.createElement("div");a.classList.add("coord-input-container"),a.id=t;const i=a.appendChild(document.createElement("span"));i.innerHTML=`<label for="${t}-x">X=</label>`;const n=i.appendChild(document.createElement("input"));n.type="number",n.size=8,n.id=`${t}-x`,n.min=e.dimData.minX,n.max=e.dimData.maxX,n.step="1";const o=a.appendChild(document.createElement("span"));o.innerHTML=`&nbsp;<label for="${t}-z">Z=</label>`;const d=o.appendChild(document.createElement("input"));return d.type="number",d.size=8,d.id=`${t}-z`,d.min=e.dimData.minZ,d.max=e.dimData.maxZ,d.step="1",{div:a,inputX:n,inputZ:d}}function s(t,a){const{div:i,inputX:n,inputZ:o}=c(a),d=i.appendChild(document.createElement("div"));d.classList.add("locate-button-container");const l=d.appendChild(document.createElement("button"));l.textContent="移動して中心に表示",l.onclick=()=>{const a=n.value,i=o.value;if(0!==a&&!a||0!==i&&!i)return;const d="n"===e.dim?8:1,l=Math.min(Math.max(a,e.dimData.minX),e.dimData.maxX),c=Math.min(Math.max(i,e.dimData.minZ),e.dimData.maxZ);t.setLatLng(e.mcUnproject([d*l,d*c])),e.panTo(t.getLatLng(),{animate:!0});for(const e of t.updates)e(l,c)};const s=d.appendChild(document.createElement("button"));function m(e,t){n.value=e,o.value=t}function r(){if(t.getLatLng()){const[a,i]=e.mcProject(t.getLatLng()).map((t=>"n"===e.dim?t/8:t)).map(Math.round);m(a,i)}}return s.textContent="位置にリセット",s.onclick=r,r(),{div:i,update:m,reset:r}}l.bindPopup(o),e.sidebar.coordsControl={},e.sidebar.coordsControl.init=()=>{const t=document.getElementById("locate-center-tool");for(;t.lastChild;)t.removeChild(t.lastChild);const a=function(t){const{div:a,inputX:i,inputZ:n}=c(t),o=a.appendChild(document.createElement("div"));o.classList.add("locate-button-container");const d=o.appendChild(document.createElement("button"));d.textContent="中心にする",d.onclick=()=>{const t=i.value,a=n.value;if(0!==t&&!t||0!==a&&!a)return;const o="n"===e.dim?8:1,d=Math.min(Math.max(t,e.dimData.minX),e.dimData.maxX),l=Math.min(Math.max(a,e.dimData.minZ),e.dimData.maxZ);e.panTo(e.mcUnproject([o*d,o*l]),{animate:!0})};const l=o.appendChild(document.createElement("button"));l.textContent="中心にリセット",l.onclick=h;const s=o.appendChild(document.createElement("button"));function m(e,t){i.value=e,n.value=t}function r(){return{x:i.value,z:n.value}}function h(){if(e.getCenter()){const[t,a]=e.mcProject(e.getCenter()).map((t=>"n"===e.dim?t/8:t)).map(Math.round);m(t,a)}}return s.textContent="📍を設置",h(),{div:a,values:r,pinButton:s}}("locate-center-input");for(t.appendChild(a.div),i.style.display="none";i.lastChild!==n;)i.removeChild(i.lastChild);const m=s(l,"sidebar-marker-coords-input");for(m.update(null,null),i.appendChild(m.div);o.lastChild!==d;)o.removeChild(o.lastChild);const r=s(l,"popup-marker-coords-input");o.appendChild(r.div),l.updates=[m.update,r.update],n.onclick=()=>{l.remove(),m.update(null,null),i.style.display="none"},d.onclick=n.onclick,a.pinButton.onclick=()=>{const{x:t,z:n}=a.values();if(0!==t&&!t||0!==n&&!n)return;const o="n"===e.dim?8:1,d=Math.min(Math.max(t,e.dimData.minX),e.dimData.maxX),c=Math.min(Math.max(n,e.dimData.minZ),e.dimData.maxZ);l.setLatLng(e.mcUnproject([o*d,o*c])).addTo(e),e.panTo(l.getLatLng(),{animate:!0}),m.update(d,c),r.update(d,c),l._icon.classList.add("coord-marker"),l.openPopup(),i.style.display=""};const h=t=>{const[a,n]=e.mcProject(t.latlng).map((t=>"n"===e.dim?t/8:t)).map(Math.round);m.update(a,n),r.update(a,n),l.setLatLng(t.latlng).addTo(e),l._icon.classList.add("coord-marker"),l.openPopup(),i.style.display=""},u=document.getElementById("coord-checkbox");u.checked=!1,e.off("click"),u.onchange=()=>{u.checked?e.on("click",h):e.off("click",h)}}}async function init(e){function t(){document.documentElement.style.setProperty("--h",`${window.innerHeight}px`)}t(),window.addEventListener("resize",t),window.addEventListener("orientationchange",t);const a=createMap(e);a.url=new URL(window.location.href),a.hashObj=parseHash(a.url.hash),console.log("hash",JSON.stringify(a.hashObj)),a.updateHash=()=>{const[e,t]=a.mcProject(a.getCenter()).map(Math.round),i=a.getZoom();a.hashObj.dD[a.dim].c={X:e,Z:t,z:i},console.log("updateHash",JSON.stringify(a.hashObj))},a.sidebar=L.control.sidebar({autopan:!1,closeButton:!0,container:"sidebar",position:"left"}).addTo(a);const i=["locate-dimension-overworld","locate-dimension-nether","locate-dimension-end","layers-dimension-overworld","layers-dimension-nether","layers-dimension-end"];function n(){for(const e of i)document.getElementById(e).disabled=!0}function o(){for(const e of i)document.getElementById(e).disabled=!1}for(const e of i){const t=document.getElementById(e);t.onchange=async()=>{n(),[a.dimData.startX,a.dimData.startZ]=a.mcProject(a.getCenter()).map(Math.round),a.dimData.startZoom=a.getZoom(),a.hashObj.dD[a.dim].v=Array.from(a.dimData.visibleLayers),a.updateHash(),a.setZoom(3,{animate:!1}),await changeDim(a,t.value),o()}}return setupLayerPanel(a),await setupTimelinePanel(a),setupPermalinkPanel(a),setupCoordinatePanel(a),await changeDim(a,a.hashObj.d||"o"),new myScale({imperial:!1,maxWidth:200}).addTo(a),window.mymap=a,a}icons={},myScale=L.Control.Scale.extend({_update:function(){var e=this._map,t=e.getSize().y/2;const a=e.mcProject(e.containerPointToLatLng([0,t])).map((t=>"n"===e.dim?t/8:t));var i=e.mcProject(e.containerPointToLatLng([this.options.maxWidth,t])).map((t=>"n"===e.dim?t/8:t))[0]-a[0];this._updateScales(i)}});