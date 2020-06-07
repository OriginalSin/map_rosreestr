import fse from 'fs-extra';
// import conf from './config.js';
import cad from './cad.js';
import './FitCenter.js';
import Dbase from './db.js';
// import './global.css';

const L = require('leaflet');
// import L from 'leaflet'
// import 'leaflet/dist/leaflet.css';

// fetch('./config.js')
// .then(function(resp) { return resp.json(); })
// .then(function(json) { console.log('gggg', json); })

// console.log('conf', conf);
/*eslint-disable */

export const map = L.map(L.DomUtil.create('div', 'map', window.document.body), { center: [55.758031, 37.611694], zoom: 8 });
window.map = map;
map.addControl(L.control.fitCenter());
const opt = {
	layers: 'show:30,21,17,8,0',
	format: 'PNG32',
	size: '1024,1024',
	imageSR: 102100,
	bboxSR: 102100,
	tileSize: 1024,
	dpi: 96,
	f: 'image',
	transparent: true,
	interactive: true,
	// bubblingMouseEvents: true,
	maxZoom: 22,
	pane: 'overlayPane',
	'z-index': 1000000,
	attribution: 'Кадастровая карта © <a href="https://rosreestr.ru/" target="_blank">Росреестр</a>'
};
export const rosreestr = L.tileLayer.wms('https://pkk.rosreestr.ru/arcgis/rest/services/PKK6/Cadastre/MapServer/export', opt);

map.on('click', ev => {
	if (rosreestr._map) {
		cad.click(ev);
		// console.log('click', rosreestr._map, ev)
	}
});

const objects = L.geoJSON([], {
    // style: function (feature) {
        // return {color: feature.properties.color};
    // }
}).on('add', function (ev) {
	// console.log('add',  ev);
	let target = ev.target;
	target.clearLayers();
	Dbase.values().then(arr => {
		// console.log('arr', arr);
		target.addData(arr);
	fse.writeJSONSync('cad.geojson', target.toGeoJSON(), {spaces: '\t'});
		let bounds = L.bounds([]),
			crs = L.Projection.SphericalMercator;
		arr.forEach(it => {
			let ex = it.properties.extent;
			bounds.extend([ex.xmin, ex.ymin]).extend([ex.xmax, ex.ymax]);
		});
		map.fitBounds([
			crs.unproject(bounds.min),
			crs.unproject(bounds.max)
		]);
	});
	
}).bindPopup(function (layer) {
	layer.bringToBack();
	return cad._openPopup({feature: layer.feature.properties, map: map});
});

L.control.layers({
	OpenStreetMap: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	}),
	'sputnik.ru': L.tileLayer('https://tilessputnik.ru/{z}/{x}/{y}.png', {
		attribution: '&copy; <a target="_blank" href="http://maps.sputnik.ru">Спутник</a> © Ростелеком',
	}).addTo(map),
}, {
	'Росреестр': rosreestr,
	'Объекты': objects
}).addTo(map);

L.Control.Icon = L.Control.extend({
    includes: L.Evented ? L.Evented.prototype : L.Mixin.Events,
    options: {
        position: 'topleft',
        id: 'defaultIcon',
        isActive: false
    },

    onAdd: function (map) {
        let className = 'icon ' + this.options.id;
		if (this.options.className) {className += ' ' + this.options.className;}
        let container = L.DomUtil.create('div', className),
			stop = L.DomEvent.stopPropagation;
        L.DomEvent
            .on(container, 'mousemove', stop)
            .on(container, 'touchstart', stop)
            .on(container, 'mousedown', stop)
            .on(container, 'dblclick', stop)
            .on(container, 'click', stop)
            .on(container, 'click', (ev) => {
				this.fire('click');
			}, this);
        return container;
    },

    onRemove: function (map) {
    },
});
L.control.icon = function (options) {
	return new L.Control.Icon(options);
};

const sp = '\
50:27:0020543:76 \
50:27:0020543:96 \
50:27:0020543:98 \
';
// 77:07:0015007:40
// 77:07:0015007:41
// 77:07:0015007:42
L.control.icon({
	id: 'pack',
}).on('click', ev => {
	let target = ev.target,
		addedCont = target._addedCont,
		active = !target._active;
	if (!addedCont) {
        addedCont = L.DomUtil.create('div', 'addedCont', target._container);
        // L.DomEvent.on(addedCont, 'click', L.DomEvent.preventDefault);
        let stop = L.DomEvent.stopPropagation;
        L.DomEvent
            .on(addedCont, 'mousedown', stop)
            .on(addedCont, 'dblclick', stop)
            .on(addedCont, 'click', stop);
        let textarea = L.DomUtil.create('textarea', '', addedCont),
			div1 = L.DomUtil.create('div', 'notVisible', addedCont),
			fileName = L.DomUtil.create('input', '', div1),
			linkNode = L.DomUtil.create('a', '', div1),
			button1 = L.DomUtil.create('button', '', div1),
			button = L.DomUtil.create('button', '', addedCont),
			out;
		textarea.placeholder = 'Введите список номеров:\n' + sp;
		textarea.value = sp;
		button1.innerHTML = 'Сохранить';
		linkNode.download = 'cad.geojson';
		// linkNode.target = '_blank';
		linkNode.href = 'test';
		fileName.value = 'cad.geojson';
		button.innerHTML = 'Выделить границы';
		L.DomEvent.on(button, 'click', ev1 => {
			let items = textarea.value.trim().split(/[,\s+]/).reduce((p, c) => { 
				if (c.trim()) { p[c] = true; }
				return p;
			}, {});
			
// console.log('click', ev1)
			button.classList.add('notVisible');
			div1.classList.remove('notVisible');

			cad.parseArr(Object.keys(items), target._map).then(data => {
				out = L.layerGroup(data.reduce((p, it) => {
					if (it.err) {
						console.log('Ошибка оцифровки для: ', it);
					} else {
						p.push(L.geoJSON(it));
					}
					return p;
				}, [])).toGeoJSON();
				// console.log('data___', data, out);
			});
		});
		L.DomEvent.on(button1, 'click', ev1 => {
			// console.log('click1', out , ev1)
			let name = fileName.value || 'cad.geojson';
			fse.writeJSONSync(name, out, {spaces: '\t'});
			// let tt = fse;
			// let blob = new Blob([JSON.stringify(out, null, '\t')], {type: 'text/json;charset=utf-8;'});
			// linkNode.setAttribute('href', window.URL.createObjectURL(blob));
			div1.classList.add('notVisible');
			button.classList.remove('notVisible');
		});
		target._addedCont = addedCont;
	}
	if (active) {
		addedCont.classList.remove('notVisible');
		// cad.click(ev);
		// console.log('click', rosreestr._map, ev)
	} else {
		addedCont.classList.add('notVisible');
	}
	target._active = active;
}).addTo(map);
/*eslint-enable */
