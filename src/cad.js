import L from 'leaflet';
import Dbase from './db.js';
import MSQR from './msqr.js';

const proxy = 'https://pkk.rosreestr.ru/';
const proxy1 = 'https://pkk5.kosmosnimki.ru/';
const popup = L.popup({ minWidth: 280 });

/*eslint-disable */
const cad = {
	click: (ev) => {
console.log('cad click', Dbase)

		let latlng = ev.latlng, // LatLng {lat: 55.62179298063115, lng: 37.55126953125001}
			map = ev.target,
			flag = 0;

		map.setView(latlng).once('moveend', ev1 => {
			cad._clearOverlays();
			popup.setLatLng(latlng)
				.setContent('<div class="cadInfo">Поиск информации...</div>')
				.openOn(map);

			popup._itsCurr = 0;
			cad.getFeaturesByLatLng(latlng);
		});
			
	},
	parseFeatures: () => {
// console.log('parseFeatures', popup._itsCurr, popup._its);
		cad._clearOverlays();
		let curr = popup._itsCurr,
			len = popup._its.length,
			it = popup._its[curr],
			type = it.type,
			title = (titles._cadastreLayers[type] || {}).title || '',
			attrs = it.attrs,
			cn = attrs.cn || '',
			id = attrs.id || cn,
			// title = (.title || '').toUpperCase(),
			// pt = features[0] || {},
			res = L.DomUtil.create('div', 'cadInfo'),
			div = L.DomUtil.create('div', 'cadItem', res),
			cadNav = L.DomUtil.create('div', 'cadNav', div),
			featureCont = L.DomUtil.create('div', 'featureCont', div),
			operCont = L.DomUtil.create('div', 'operCont', div),
			exportIcon = L.DomUtil.create('a', 'export button notVisible', operCont),
			cadLeft = L.DomUtil.create('span', 'cadLeft', cadNav),
			cadCount = L.DomUtil.create('span', 'cadCount', cadNav),
			cadRight = L.DomUtil.create('span', 'cadRight', cadNav);

		featureCont.innerHTML = it.title || '';
		cadCount.innerHTML = title + ' (' + (curr + 1) + '/' + len + ')<br>' + id;

		cadLeft.style.visibility = curr ? 'visible' : 'hidden';
		cadLeft.innerHTML = '<';
		cadRight.style.visibility = curr < len - 1 ? 'visible' : 'hidden';
		cadRight.innerHTML = '>';
		L.DomEvent.on(cadLeft, 'click', function() {
			popup._itsCurr--;
			exportIcon.classList.add('notVisible');
			cad.parseFeatures();
		});
		L.DomEvent.on(cadRight, 'click', function() {
			popup._itsCurr++;
			exportIcon.classList.add('notVisible');
			cad.parseFeatures();
		});

		exportIcon.setAttribute('target', '_blank');
		exportIcon.setAttribute('href', '');
		exportIcon.title = 'Экспорт в GeoJSON';
		// exportIcon.innerHTML = '<svg role="img" class="svgIcon"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#download"></use></svg>';

		exportIcon.addEventListener('click', function () {
		  let overlay = popup._overlay;
		  if (overlay && overlay._exObj && overlay._exObj._map) {
			let dObj = overlay._exObj,
				geoJSON = dObj.toGeoJSON();
			// geoJSON.properties = it.attrs;
			let blob = new Blob([JSON.stringify(geoJSON, null, '\t')], {type: 'text/json;charset=utf-8;'});
			exportIcon.setAttribute('download', id + '.geojson');
			exportIcon.setAttribute('href', window.URL.createObjectURL(blob));
		  }
		}, false);

		popup._exportIcon = exportIcon;
		popup._featureCont = featureCont;
		popup._operCont = operCont;

		popup.setContent(res);

		if (attrs) {
			Dbase.get(attrs.id).then((f) => {
				console.log('sssssss', f);
				if(f) {
					cad._openPopup({feature: f.properties, geometry: f.geometry});
				} else {
					cad.getFeature(attrs.id, type)
						.then(cad._openPopup);
				}
			});
		}
	},
	getIdByCn: function(cn) {
		let arr = cn.split(':');
		return arr.map(it => Number(it.trim())).join(':');
	},

	reGetFeature: function(id, type) {
		return Dbase.get(id).then(res => {
			return res ? res : cad.getFeature(id, type);
		});
	},
	getFeature: function(id, type) {
		type = type || 1;
		let url = proxy +  'api/features/' + type + '/' + id + '?date_format=%c&_=' + Date.now();
		return fetch(url)
		.then(function(req) { return req.json();})
		.catch(err => {return {id: id, err: err}});
	},
	_openPopup: (data) => {
// console.log('_openPopup', data)
		let feature = data.feature,
			type = feature.type,
			title = (titles._cadastreLayers[type] || {}).title || '',
			attrs = feature.attrs,
			stat = titles._states[attrs.statecd],
			category_type = titles._category_types[attrs.category_type],
			fp = titles._parcelOwnership[attrs.fp],
			util_code = titles._utilizations[attrs.util_code],
			
			address = attrs.address || attrs.desc || '',
			plans = '',
			trs = [];

		trs.push('<tr><td class="first">Тип:</td><td>' + title + '</td></tr>');
		if (attrs.cn) {
			trs.push('<tr><td class="first">Кад.номер:</td><td>' + attrs.cn + '</td></tr>');
		} else if (attrs.number_zone) {
			trs.push('<tr><td class="first">Номер зоны:</td><td>' + attrs.number_zone + '</td></tr>');
		}
		// if (attrs.json_documents) {
			// [{
				// codeDocument: "558401020000"
				// date: "2017-03-28"
				// issueOrgan: "Комитет по архитектуре и градостроительству города Москвы"
				// name: "Постановление Правительства Москвы "Об утверждении правил землепользования и застройки города Москвы""
				// number: "120-ПП"
			// }]
		// }
		plans += '<a href="' + proxy +  'plan.html?id=' + attrs.id + '&type=1" target="_blank">План ЗУ</a>' ;
		if (attrs.kvartal) {
			trs.push('<tr><td class="first">Кад.квартал:</td><td>' + attrs.kvartal_cn + '</td></tr>');
			plans += ' <a href="' + proxy + 'plan.html?id=' + attrs.id + '&parent=' + attrs.kvartal + '&type=2" target="_blank">План КК</a>';
		}
		if (stat) { trs.push('<tr><td class="first">Статус:</td><td>' + stat + '</td></tr>'); }
		if (attrs.name) {
			trs.push('<tr><td class="first">Наименование:</td><td>' + attrs.name + '</td></tr>');
		}
		if (attrs.cad_cost) {
			trs.push('<tr><td class="first">Кадастровая стоимость:</td><td>' + attrs.cad_cost + '</td></tr>');
		}
		if (attrs.area_value) {
			trs.push('<tr><td class="first">Общая площадь:</td><td>' + attrs.area_value + '</td></tr>');
		}

		if (address) {
			trs.push('<tr><td class="first">Адрес:</td><td>' + address + '</td></tr>');
		}
		if (category_type) {
			trs.push('<tr><td class="first">Категория земель:</td><td>' + category_type + '</td></tr>');
		}
		if (fp) {
			trs.push('<tr><td class="first">Форма собственности:</td><td>' + fp + '</td></tr>');
		}
		if (util_code) {
			trs.push('<tr><td class="first">Разрешенное использование:</td><td>' + util_code + '</td></tr>');
		}
		if (attrs.util_by_doc) {
			trs.push('<tr><td class="first">по документу:</td><td>' + attrs.util_by_doc + '</td></tr>');
		}
		if (attrs.cad_record_date) {
			trs.push('<tr><td class="first">Дата изменения сведений в ГКН:</td><td>' + attrs.cad_record_date + '</td></tr>');
		}
		let node = L.DomUtil.create('div', '');
		L.DomUtil.create('table', 'table', node).innerHTML = trs.join('\n');
		// map.openPopup(node);
		// popup.setContent(node);
		if (popup._map && popup._featureCont) {
			popup._featureCont.innerHTML = '';
			popup._featureCont.appendChild(node);

			if (popup._inputShowObject && popup._inputShowObject.parentNode) {
				popup._inputShowObject.parentNode.removeChild(popup._inputShowObject);
			}
			let inputShowObject = L.DomUtil.create('button', 'ShowObject', popup._operCont);
			inputShowObject.innerHTML = 'Выделить границу';
			inputShowObject.checked = false;
			L.DomEvent.on(inputShowObject, 'click', function(ev) {
				// if (!inputShowObject.checked) {
					var id = this._cad;
					inputShowObject.checked = true;
					// inputShowObject.style.display = 'none';
					cad._setBoundsView(id, popup._its[popup._itsCurr], popup._map, ev.ctrlKey);
				// }
			});
			popup._inputShowObject = inputShowObject;
			popup._feature = feature;
			cad._setOverlay(feature, popup._map);
			popup._exportIcon.classList.add('notVisible');
		} else {
			let map = data.map,
				res = L.DomUtil.create('div', 'cadInfo'),
				div = L.DomUtil.create('div', 'cadItem', res),
				cadNav = L.DomUtil.create('div', 'cadNav', div),
				cadCount = L.DomUtil.create('span', 'cadCount', cadNav),
				featureCont = L.DomUtil.create('div', 'featureCont', div),
				crs = L.Projection.SphericalMercator,
				latlng = crs.unproject(feature.center);
				
			// bounds = map.getPixelBounds(),
			// ne = map.options.crs.project(map.unproject(bounds.getTopRight())),
			// sw = map.options.crs.project(map.unproject(bounds.getBottomLeft())),
			// latLngBounds = L.latLngBounds(
				// crs.unproject(L.point(attr.extent.xmin, attr.extent.ymin).divideBy(R)),
			cadCount.innerHTML = title + '<br>' + attrs.id;
			featureCont.appendChild(node);
			return res;
		}
	},
	_setBoundsView: function(id, it, map, flagExternalGeo) {
		var featureExtent = cad._getFeatureExtent(it, map);

		var onViewreset = function() {
			map.off('moveend', onViewreset);
			cad._setOverlay(it, map, flagExternalGeo);
		};
		map.on('moveend', onViewreset);

		// map.fitBounds(featureExtent.latLngBounds, {animate: false});
		map.fitBounds(featureExtent.latLngBounds, {reset: true});
	},
	_setOverlay: function(it, map, flagExternalGeo) {
		let attr = cad._getFeatureExtent(it, map),
			id = attr.id,
			type = it.type || 1,
			// exportIcon = popup._exportIcon,
			// layer = L.CadUtils.getCadastreLayer(id),
			ids = [0, 1 , 2, 3, 4, 5, 6, 7, 8, 9, 10],
			params = {
				size: attr.size.join(','),
				bbox: attr.bbox.join(','),
				layers: 'show:' + ids.join(','),
				layerDefs: '{' + ids.map(function(nm) {
					return '\"' + nm + '\":\"ID = \'' + id + '\'"'
				}).join(',') + '}',
				format: 'png32',
				dpi: 96,
				transparent: 'true',
				imageSR: 102100,
				bboxSR: 102100
			},
			imageUrl = proxy1 +  'arcgis/rest/services/PKK6/';
		imageUrl += (type === 10 ? 'ZONESSelected' : 'CadastreSelected') + '/MapServer/export?f=image&cross=' + Math.random();

		for (let key in params) {
			imageUrl += '&' + key + '=' + params[key];
		}
		if (popup._exportIcon) {
			L.DomUtil.addClass(popup._exportIcon, 'notVisible');
		}

		let overlay = popup._overlay;
		if (overlay) {
			if (overlay._dObj && overlay._dObj._map) {
				overlay._dObj._map.removeLayer(overlay._dObj);
			}
			if (overlay._map) {
				overlay._map.removeLayer(overlay);
			}
		}

// console.log('uuu', imageUrl);
		// overlay = new L.ImageOverlay.CrossOrigin(imageUrl, attr.latLngBounds, {opacity: 0.5, geoLink: !flagExternalGeo, full: attr.full, id: id, it: it, clickable: true})
		overlay = new L.ImageOverlay.CrossOrigin(imageUrl, map.getBounds(), {opacity: 0.5, geoLink: !flagExternalGeo, full: attr.full, id: id, it: it, clickable: true})
			.on('load', function() {
				if (popup) {
					popup._inputShowObject.classList.remove('notVisible');
					let geo = popup._overlay.exportGeometry(popup._feature);
	// console.log('load', geo, popup._overlay);
					if (geo && popup._inputShowObject.checked) {
						popup._exportIcon.classList.remove('notVisible');
						// geo
							// .setOptions({cadastreFeature: lastFeature})
							// .on('addtomap', function() { inputShowObject.checked = true; })
							// .on('removefrommap', function() { inputShowObject.checked = false; });
						// if (exportIcon) { L.DomUtil.removeClass(exportIcon, 'notVisible'); }
						Dbase.set(geo.properties.attrs.id, geo);
						// console.log('GeoJSON', JSON.stringify(geo));
						// L.CadUtils.addToCadastreLayer(geo.toGeoJSON());
					}
				}
			});
		// lastOverlayId = id;
		popup._overlay = overlay;

		overlay.addTo(map);
		L.rectangle(attr.latLngBounds, {color: "#ff7800", fill: false, weight: 1}).addTo(map);
		// lastOverlays.push(overlay);
		// cad._clearOverlays(2);
		return overlay;
	},

	_clearOverlays: function() {
		let overlay = popup._overlay;

		if (overlay) {
			if (overlay._exObj && overlay._exObj._map) {
				overlay._exObj._map.removeLayer(overlay._exObj);
			}
			if (overlay._map) {
				overlay._map.removeLayer(overlay);
			}
		}

	},
    worldWidthFull: 40075016.685578496,

	_getFeatureExtent: function(attr, map) {
		var R = L.version === '0.7.7' ? 6378137 : 1,
			crs = L.Projection.SphericalMercator,
			bounds = map.getPixelBounds(),
			ne = map.options.crs.project(map.unproject(bounds.getTopRight())),
			sw = map.options.crs.project(map.unproject(bounds.getBottomLeft())),
			mInPixel = Math.pow(2, map.getZoom() + 8) / cad.worldWidthFull,
			exBounds = L.bounds(
				L.point(attr.extent.xmin, attr.extent.ymin).multiplyBy(mInPixel),
				L.point(attr.extent.xmax, attr.extent.ymax).multiplyBy(mInPixel)
			),
			// topLeft = L.CRS.EPSG3857.projection.unproject(exBounds.getTopLeft()),
			latLngBounds = L.latLngBounds(
				crs.unproject(L.point(attr.extent.xmin, attr.extent.ymin).divideBy(R)),
				crs.unproject(L.point(attr.extent.xmax, attr.extent.ymax).divideBy(R))
			);

		return {
			map: map,
			full: (sw.x < attr.extent.xmin && ne.x > attr.extent.xmax) && (sw.y < attr.extent.ymin && ne.y > attr.extent.ymax),
			id: attr.attrs.id,
			type: attr.type,
			exSize: [Math.round(1 + exBounds.max.x - exBounds.min.x), Math.round(1 + exBounds.max.y - exBounds.min.y)],
			exBbox: [attr.extent.xmin, attr.extent.ymin, attr.extent.xmax, attr.extent.ymax],
			size: [bounds.max.x - bounds.min.x, bounds.max.y - bounds.min.y],
			bbox: [sw.x, sw.y, ne.x, ne.y],
			latlng: crs.unproject(L.point(attr.center.x, attr.center.y).divideBy(R)),
			latLngBounds: latLngBounds
		};
	},
	_getImageUrl: function(it, map) {
		let attr = cad._getFeatureExtent(it, map),
			id = attr.id,
			type = it.type || 1,
			// exportIcon = popup._exportIcon,
			// layer = L.CadUtils.getCadastreLayer(id),
			ids = [0, 1 , 2, 3, 4, 5, 6, 7, 8, 9, 10],
			params = {
				size: attr.exSize.join(','),
				bbox: attr.exBbox.join(','),
				layers: 'show:' + ids.join(','),
				layerDefs: '{' + ids.map(function(nm) {
					return '\"' + nm + '\":\"ID = \'' + id + '\'"'
				}).join(',') + '}',
				format: 'png32',
				dpi: 96,
				transparent: 'true',
				imageSR: 102100,
				bboxSR: 102100
			},
			imageUrl = proxy1 +  'arcgis/rest/services/PKK6/';
		imageUrl += (type === 10 ? 'ZONESSelected' : 'CadastreSelected') + '/MapServer/export?f=image&cross=' + Math.random();

		for (let key in params) {
			imageUrl += '&' + key + '=' + params[key];
		}
		return imageUrl;
	},
	_setOverlay1: function(feature, map, flagExternalGeo) {
		let url = cad._getImageUrl(feature, map);
		return fetch(url)
			.then(req => req.blob())
			.then(blob => {
			  return createImageBitmap(blob, {
				premultiplyAlpha: 'none',
				colorSpaceConversion: 'none',
			  });
			})
			.then(bitmap => {
				// console.log('bitmap', bitmap);
				const canv = L.DomUtil.create('canvas'),
					ctx = canv.getContext('2d');

				canv.width = bitmap.width; canv.height = bitmap.height;
				ctx.drawImage(bitmap, 0, 0, canv.width, canv.height);
				let pathPoints = MSQR(ctx, {path2D: false, maxShapes: 10});
				let center = map.latLngToContainerPoint(map.getCenter());
				// console.log('pathPoints', pathPoints);
				var rings = pathPoints.map(function (it) {
					var ring = it.map(function (p) {
						return L.point(p.x + center.x, p.y + center.y);
					});
					ring = L.LineUtil.simplify(ring, 1);
					return ring.map(function (p) {
						return map.containerPointToLatLng(p);
					});
				});
				var len = rings.length;
				if (len) {
					var type = 'Polygon',
						coords = rings.map(function (ring) {
							return ring.map(function (latlng) {
								return [latlng.lng, latlng.lat];
							});
						});
					if (len > 1) {
						type = 'Multi' + type;
						coords = [coords];
					}
					let _geoFson = {
						type: 'Feature',
						properties: feature,
						geometry: {
							type: type,
							coordinates: coords
						}
					};
					let _exObj = L.geoJSON(_geoFson, {
						style: function (pt) {
							return {fill: false};
						}}
					);
					map.addLayer(_exObj);
					Dbase.set(feature.attrs.id, _geoFson);
					return _geoFson;
				}
			})
			.catch(err => {return {cn: it, err: err}});
	},
	parseArr: (arr, map) => {
		return Promise.all(arr.map(it => {
			return cad.cnShowExtent(it, map)
			.catch(err => {return {cn: it, err: err}});
		}));
	},
	cnShowExtent: (cn, map, flag) => {
		return cad.reGetFeature(cad.getIdByCn(cn), 1)
			.then(json => {
				if (json.type === 'Feature') {
					return json;
				} else {
					let it = json.feature;
					if (it && it.extent) {
						let extent = it.extent,
							crs = L.Projection.SphericalMercator,
							latLngBounds = L.latLngBounds(
								crs.unproject(L.point(extent.xmin, extent.ymin)),
								crs.unproject(L.point(extent.xmax, extent.ymax))
							),
							nw = latLngBounds.getNorthWest();
						// map.fitBounds(latLngBounds);
						map.setView(nw, 15);
						if (flag) {
							let rect = L.rectangle(latLngBounds, {color: "#ff7800", fill: false, weight: 1}).addTo(map);
						}
						return cad._setOverlay1(it, map);
					}
				}
				return new Promise((resolve, reject) => resolve({cn: cn, err: 'Не найден extent'}));
			})
			.catch(err => {return {cn: cn, err: err}});
	},

	getFeaturesByLatLng: (latlng, flag) => {
		return fetch(proxy + 'api/features/?limit=40&skip=0&inPoint=true&text=' + latlng.lat + '+' + latlng.lng)
		.then(req => req.json())
		.then((data) => {
			if (data) {
				popup._its = data.features || data.results;
				cad.parseFeatures();
			}
		})
		.catch(err => {
			if (!flag) { cad.getFeaturesByLatLng(latlng, 1); }
			return null;
		});
	}
};

const titles = {
	_cadastreLayers: {
		1: {id: 1, title: 'Участок', 	reg: /^\d\d:\d+:\d+:\d+$/},
		2: {id: 2, title: 'Квартал',	reg: /^\d\d:\d+:\d+$/},
		3: {id: 3, title: 'Район', 	reg: /^\d\d:\d+$/},
		4: {id: 4, title: 'Округ', 	reg: /^\d\d$/},
		5: {id: 5, title: 'ОКС', 		reg: /^\d\d:\d+:\d+:\d+:\d+$/},
		6: {id: 6, title: 'Тер.зоны', 	reg: /^\w+$/},
		7: {id: 7, title: 'Границы', 	reg: /^\w+$/},
		9: {id: 9, title: 'ГОК', 		reg: /^\w+$/},
		10: {id: 10, title: 'ЗОУИТ', 	reg: /^\d+\.\d+\.\d+/},
		12: {id: 12, title: 'Лес', 		reg: /^\w+$/},
		13: {id: 13, title: 'Красные линии', 		reg: /^\w+$/},
		15: {id: 15, title: 'СРЗУ', 	reg: /^\w+$/},
		16: {id: 16, title: 'ОЭЗ', 		reg: /^\w+$/},
	},
	_states: {'01': 'Ранее учтенный', '03': 'Условный', '04': 'Внесенный', '05': 'Временный (Удостоверен)', '06': 'Учтенный', '07': 'Снят с учета', '08': 'Аннулированный'},
	_category_types: { '003001000000': 'Земли сельскохозяйственного назначения', '003002000000': 'Земли поселений (земли населенных пунктов)', '003003000000': 'Земли промышленности, энергетики, транспорта, связи, радиовещания, телевидения, информатики, земли для обеспечения космической деятельности, земли обороны, безопасности и земли иного специального назначения', '003004000000': 'Земли особо охраняемых территорий и объектов', '003005000000': 'Земли лесного фонда', '003006000000': 'Земли водного фонда', '003007000000': 'Земли запаса', '003008000000': 'Категория не установлена' },
	_parcelOwnership: {'200': 'Собственность публично-правовых образований', '100': 'Частная собственность'},
	_utilizations: { '141000000000': 'Для размещения объектов сельскохозяйственного назначения и сельскохозяйственных угодий', '141001000000': 'Для сельскохозяйственного производства', '141001010000': 'Для использования в качестве сельскохозяйственных угодий', '141001020000': 'Для размещения зданий, строений, сооружений, используемых для производства, хранения и первичной переработки сельскохозяйственной продукции', '141001030000': 'Для размещения внутрихозяйственных дорог и коммуникаций', '141001040000': 'Для размещения водных объектов', '141002000000': 'Для ведения крестьянского (фермерского) хозяйства', '141003000000': 'Для ведения личного подсобного хозяйства', '141004000000': 'Для ведения гражданами садоводства и огородничества', '141005000000': 'Для ведения гражданами животноводства', '141006000000': 'Для дачного строительства', '141007000000': 'Для размещения древесно-кустарниковой растительности, предназначенной для защиты земель от воздействия негативных (вредных) природных, антропогенных и техногенных явлений', '141008000000': 'Для научно-исследовательских целей', '141009000000': 'Для учебных целей', '141010000000': 'Для сенокошения и выпаса скота гражданами', '141011000000': 'Фонд перераспределения', '141012000000': 'Для размещения объектов охотничьего хозяйства', '141013000000': 'Для размещения объектов рыбного хозяйства', '141014000000': 'Для иных видов сельскохозяйственного использования', '142000000000': 'Для размещения объектов, характерных для населенных пунктов', '142001000000': 'Для объектов жилой застройки', '142001010000': 'Для индивидуальной жилой застройки', '142001020000': 'Для многоквартирной застройки', '142001020100': 'Для малоэтажной застройки', '142001020200': 'Для среднеэтажной застройки', '142001020300': 'Для многоэтажной застройки', '142001020400': 'Для иных видов жилой застройки', '142001030000': 'Для размещения объектов дошкольного, начального, общего и среднего (полного) общего образования', '142001040000': 'Для размещения иных объектов, допустимых в жилых зонах и не перечисленных в классификаторе', '142002000000': 'Для объектов общественно-делового значения', '142002010000': 'Для размещения объектов социального и коммунально-бытового назначения', '142002020000': 'Для размещения объектов здравоохранения', '142002030000': 'Для размещения объектов культуры', '142002040000': 'Для размещения объектов торговли', '142002040100': 'Для размещения объектов розничной торговли', '142002040200': 'Для размещения объектов оптовой торговли', '142002050000': 'Для размещения объектов общественного питания', '142002060000': 'Для размещения объектов предпринимательской деятельности', '142002070000': 'Для размещения объектов среднего профессионального и высшего профессионального образования', '142002080000': 'Для размещения административных зданий', '142002090000': 'Для размещения научно-исследовательских учреждений', '142002100000': 'Для размещения культовых зданий', '142002110000': 'Для стоянок автомобильного транспорта', '142002120000': 'Для размещения объектов делового назначения, в том числе офисных центров', '142002130000': 'Для размещения объектов финансового назначения', '142002140000': 'Для размещения гостиниц', '142002150000': 'Для размещения подземных или многоэтажных гаражей', '142002160000': 'Для размещения индивидуальных гаражей', '142002170000': 'Для размещения иных объектов общественно-делового значения, обеспечивающих жизнь граждан', '142003000000': 'Для общего пользования (уличная сеть)', '142004000000': 'Для размещения объектов специального назначения', '142004010000': 'Для размещения кладбищ', '142004020000': 'Для размещения крематориев', '142004030000': 'Для размещения скотомогильников', '142004040000': 'Под объектами размещения отходов потребления', '142004050000': 'Под иными объектами специального назначения', '142005000000': 'Для размещения коммунальных, складских объектов', '142006000000': 'Для размещения объектов жилищно-коммунального хозяйства', '142007000000': 'Для иных видов использования, характерных для населенных пунктов', '143000000000': 'Для размещения объектов промышленности, энергетики, транспорта, связи, радиовещания, телевидения, информатики, обеспечения космической деятельности, обороны, безопасности и иного специального назначения', '143001000000': 'Для размещения промышленных объектов', '143001010000': 'Для размещения производственных и административных зданий, строений, сооружений и обслуживающих их объектов', '143001010100': 'Для размещения производственных зданий', '143001010200': 'Для размещения коммуникаций', '143001010300': 'Для размещения подъездных путей', '143001010400': 'Для размещения складских помещений', '143001010500': 'Для размещения административных зданий', '143001010600': 'Для размещения культурно-бытовых зданий', '143001010700': 'Для размещения иных сооружений промышленности', '143001020000': 'Для добычи и разработки полезных ископаемых', '143001030000': 'Для размещения иных объектов промышленности', '143002000000': 'Для размещения объектов энергетики', '143002010000': 'Для размещения электростанций и обслуживающих сооружений и объектов', '143002010100': 'Для размещения гидроэлектростанций', '143002010200': 'Для размещения атомных станций', '143002010300': 'Для размещения ядерных установок', '143002010400': 'Для размещения пунктов хранения ядерных материалов и радиоактивных веществ энергетики', '143002010500': 'Для размещения хранилищ радиоактивных отходов', '143002010600': 'Для размещения тепловых станций', '143002010700': 'Для размещения иных типов электростанций', '143002010800': 'Для размещения иных обслуживающих сооружений и объектов', '143002020000': 'Для размещения объектов электросетевого хозяйства', '143002020100': 'Для размещения воздушных линий электропередачи', '143002020200': 'Для размещения наземных сооружений кабельных линий электропередачи', '143002020300': 'Для размещения подстанций', '143002020400': 'Для размещения распределительных пунктов', '143002020500': 'Для размещения других сооружений и объектов электросетевого хозяйства', '143002030000': 'Для размещения иных объектов энергетики', '143003000000': 'Для размещения объектов транспорта', '143003010000': 'Для размещения и эксплуатации объектов железнодорожного транспорта', '143003010100': 'Для размещения железнодорожных путей и их конструктивных элементов', '143003010200': 'Для размещения полос отвода железнодорожных путей', '143003010300': 'Для размещения, эксплуатации, расширения и реконструкции строений, зданий, сооружений, в том числе железнодорожных вокзалов, железнодорожных станций, а также устройств и других объектов, необходимых для эксплуатации, содержания, строительства, реконструкции, ремонта, развития наземных и подземных зданий, строений, сооружений, устройств и других объектов железнодорожного транспорта', '143003010301': 'Для размещения железнодорожных вокзалов', '143003010302': 'Для размещения железнодорожных станций', '143003010303': 'Для размещения устройств и других объектов, необходимых для эксплуатации, содержания, строительства, реконструкции, ремонта, развития наземных и подземных зданий, строений, сооружений, устройств и других объектов железнодорожного транспорта', '143003020000': 'Для размещения и эксплуатации объектов автомобильного транспорта и объектов дорожного хозяйства', '143003020100': 'Для размещения автомобильных дорог и их конструктивных элементов', '143003020200': 'Для размещения полос отвода', '143003020300': 'Для размещения объектов дорожного сервиса в полосах отвода автомобильных дорог', '143003020400': 'Для размещения дорожных сооружений', '143003020500': 'Для размещения автовокзалов и автостанций', '143003020600': 'Для размещения иных объектов автомобильного транспорта и дорожного хозяйства', '143003030000': 'Для размещения и эксплуатации объектов морского, внутреннего водного транспорта', '143003030100': 'Для размещения искусственно созданных внутренних водных путей', '143003030200': 'Для размещения морских и речных портов, причалов, пристаней', '143003030300': 'Для размещения иных объектов морского, внутреннего водного транспорта', '143003030400': 'Для выделения береговой полосы', '143003040000': 'Для размещения и эксплуатации объектов воздушного транспорта', '143003040100': 'Для размещения аэропортов и аэродромов', '143003040200': 'Для размещения аэровокзалов', '143003040300': 'Для размещения взлетно-посадочных полос', '143003040400': 'Для размещения иных наземных объектов воздушного транспорта', '143003050000': 'Для размещения и эксплуатации объектов трубопроводного транспорта', '143003050100': 'Для размещения нефтепроводов', '143003050200': 'Для размещения газопроводов', '143003050300': 'Для размещения иных трубопроводов', '143003050400': 'Для размещения иных объектов трубопроводного транспорта', '143003060000': 'Для размещения и эксплуатации иных объектов транспорта', '143004000000': 'Для размещения объектов связи, радиовещания, телевидения, информатики', '143004010000': 'Для размещения эксплуатационных предприятий связи и обслуживания линий связи', '143004020000': 'Для размещения кабельных, радиорелейных и воздушных линий связи и линий радиофикации на трассах кабельных и воздушных линий связи и радиофикации и их охранные зоны', '143004030000': 'Для размещения подземных кабельных и воздушных линий связи и радиофикации и их охранные зоны', '143004040000': 'Для размещения наземных и подземных необслуживаемых усилительных пунктов на кабельных линиях связи и их охранные зоны', '143004050000': 'Для размещения наземных сооружений и инфраструктур спутниковой связи', '143004060000': 'Для размещения иных объектов связи, радиовещания, телевидения, информатики', '143005000000': 'Для размещения объектов, предназначенных для обеспечения космической деятельности', '143005010000': 'Для размещения космодромов, стартовых комплексов и пусковых установок', '143005020000': 'Для размещения командно-измерительных комплексов, центров и пунктов управления полетами космических объектов, приема, хранения и переработки информации', '143005030000': 'Для размещения баз хранения космической техники', '143005040000': 'Для размещения полигонов приземления космических объектов и взлетно-посадочных полос', '143005050000': 'Для размещения объектов экспериментальной базы для отработки космической техники', '143005060000': 'Для размещения центров и оборудования для подготовки космонавтов', '143005070000': 'Для размещения других наземных сооружений и техники, используемых при осуществлении космической деятельности', '143006000000': 'Для размещения объектов, предназначенных для обеспечения обороны и безопасности', '143006010000': 'Для обеспечения задач обороны', '143006010100': 'Для размещения военных организаций, учреждений и других объектов', '143006010200': 'Для дислокации войск и сил флота', '143006010300': 'Для проведения учений и иных мероприятий', '143006010400': 'Для испытательных полигонов', '143006010500': 'Для мест уничтожения оружия и захоронения отходов', '143006010600': 'Для создания запасов материальных ценностей в государственном и мобилизационном резервах (хранилища, склады и другие)', '143006010700': 'Для размещения иных объектов обороны', '143006020000': 'Для размещения объектов (территорий), обеспечивающих защиту и охрану Государственной границы Российской Федерации', '143006020100': 'Для обустройства и содержания инженерно-технических сооружений и заграждений', '143006020200': 'Для обустройства и содержания пограничных знаков', '143006020300': 'Для обустройства и содержания пограничных просек', '143006020400': 'Для обустройства и содержания коммуникаций', '143006020500': 'Для обустройства и содержания пунктов пропуска через Государственную границу Российской Федерации', '143006020600': 'Для размещения иных объектов для защиты и охраны Государственной границы Российской Федерации', '143006030000': 'Для размещения иных объектов обороны и безопасности', '143007000000': 'Для размещения иных объектов промышленности, энергетики, транспорта, связи, радиовещания, телевидения, информатики, обеспечения космической деятельности, обороны, безопасности и иного специального назначения', '144000000000': 'Для размещения особо охраняемых историко-культурных и природных объектов (территорий)', '144001000000': 'Для размещения особо охраняемых природных объектов (территорий)', '144001010000': 'Для размещения государственных природных заповедников (в том числе биосферных)', '144001020000': 'Для размещения государственных природных заказников', '144001030000': 'Для размещения национальных парков', '144001040000': 'Для размещения природных парков', '144001050000': 'Для размещения дендрологических парков', '144001060000': 'Для размещения ботанических садов', '144001070000': 'Для размещения объектов санаторного и курортного назначения', '144001080000': 'Территории месторождений минеральных вод, лечебных грязей, рапы лиманов и озер', '144001090000': 'Для традиционного природопользования', '144001100000': 'Для размещения иных особо охраняемых природных территорий (объектов)', '144002000000': 'Для размещения объектов (территорий) природоохранного назначения', '144003000000': 'Для размещения объектов (территорий) рекреационного назначения', '144003010000': 'Для размещения домов отдыха, пансионатов, кемпингов', '144003020000': 'Для размещения объектов физической культуры и спорта', '144003030000': 'Для размещения туристических баз, стационарных и палаточных туристско-оздоровительных лагерей, домов рыболова и охотника, детских туристических станций', '144003040000': 'Для размещения туристических парков', '144003050000': 'Для размещения лесопарков', '144003060000': 'Для размещения учебно-туристических троп и трасс', '144003070000': 'Для размещения детских и спортивных лагерей', '144003080000': 'Для размещения скверов, парков, городских садов', '144003090000': 'Для размещения пляжей', '144003100000': 'Для размещения иных объектов (территорий) рекреационного назначения', '144004000000': 'Для размещения объектов историко-культурного назначения', '144004010000': 'Для размещения объектов культурного наследия народов Российской Федерации (памятников истории и культуры), в том числе объектов археологического наследия', '144004020000': 'Для размещения военных и гражданских захоронений', '144005000000': 'Для размещения иных особо охраняемых историко-культурных и природных объектов (территорий)', '145000000000': 'Для размещения объектов лесного фонда', '145001000000': 'Для размещения лесной растительности', '145002000000': 'Для восстановления лесной растительности', '145003000000': 'Для прочих объектов лесного хозяйства', '146000000000': 'Для размещения объектов водного фонда', '146001000000': 'Под водными объектами', '146002000000': 'Для размещения гидротехнических сооружений', '146003000000': 'Для размещения иных сооружений, расположенных на водных объектах', '147000000000': 'Земли запаса (неиспользуемые)', '014001000000': 'Земли жилой застройки', '014001001000': 'Земли под жилыми домами многоэтажной и повышенной этажности застройки', '014001002000': 'Земли под домами индивидуальной жилой застройкой', '014001003000': 'Незанятые земли, отведенные под жилую застройку', '014002000000': 'Земли общественно-деловой застройки', '014002001000': 'Земли гаражей и автостоянок', '014002002000': 'Земли под объектами торговли, общественного питания, бытового обслуживания, автозаправочными и газонаполнительными станциями, предприятиями автосервиса', '014002003000': 'Земли учреждений и организаций народного образования, земли под объектами здравоохранения и социального обеспечения физической культуры и спорта, культуры и искусства, религиозными объектами', '014002004000': 'Земли под административно-управлен-ческими и общественными объектами, земли предприятий, организаций, учреждений финансирования, кредитования, страхования и пенсионного обеспечения', '014002005000': 'Земли под зданиями (строениями) рекреации', '014003000000': 'Земли под объектами промышленности', '014004000000': 'Земли общего пользования (геонимы в поселениях)', '014005000000': 'Земли под объектами транспорта, связи, инженерных коммуникаций', '014005001000': 'Под объектами железнодорожного транспорта', '014005002000': 'Под объектами автомобильного транспорта', '014005003000': 'Под объектами морского, внутреннего водного транспорта', '014005004000': 'Под объектами воздушного транспорта', '014005005000': 'Под объектами иного транспорта, связи, инженерных коммуникаций', '014006000000': 'Земли сельскохозяйственного использования', '014006001000': 'Земли под крестьянскими (фермерскими) хозяйствами', '014006002000': 'Земли под предприятиями, занимающимися сельскохозяйственным производством', '014006003000': 'Земли под садоводческими объединениями и индивидуальными садоводами', '014006004000': 'Земли под огородническими объединениями и индивидуальными огородниками', '014006005000': 'Земли под дачными объединениями', '014006006000': 'Земли под личными подсобными хозяйствами', '014006007000': 'Земли под служебными наделами', '014006008000': 'Земли оленьих пастбищ', '014006009000': 'Для других сельскохозяйственных целей', '014007000000': 'Земли под лесами в поселениях (в том числе городскими лесами), под древесно-кустарниковой растительностью, не входящей в лесной фонд (в том числе лесопарками, парками, скверами, бульварами)', '014008000000': 'Земли, занятые водными объектами, земли водоохранных зон водных объектов, а также земли, выделяемые для установления полос отвода и зон охраны водозаборов, гидротехнических сооружений и иных водохозяйственных сооружений, объектов.', '014009000000': 'Земли под военными и иными режимными объектами', '014010000000': 'Земли под объектами иного специального назначения', '014011000000': 'Земли, не вовлеченные в градостроительную или иную деятельность (земли – резерв)', '014012000000': 'Неопределено', '014013000000': 'Значение отсутствует' },
};

L.ImageOverlay.CrossOrigin = L.ImageOverlay.extend({
	_updateOpacity: function () {
		this._image.crossOrigin = 'anonymous';
		L.DomUtil.setOpacity(this._image, this.options.opacity);
	},
	remove: function () {
		  if (this._map) { this._map.removeLayer(this); }
	},
	onRemove: function (map) {
		L.ImageOverlay.prototype.onRemove.call(this, map);
		if (this._dObj && this._dObj._map) {
			this._dObj._map.removeLayer(this._dObj);
		}
	},
	exportGeometry: function (feature) {
		var pathPoints = MSQR(this._image, {path2D: false, maxShapes: 10}),
			_map = this._map;
		var rings = pathPoints.map(function (it) {
			var ring = it.map(function (p) {
				return L.point(p.x, p.y);
			});
			ring = L.LineUtil.simplify(ring, 1);
			return ring.map(function (p) {
				return _map.containerPointToLatLng(p);
			});
		});
		var len = rings.length;
		if (len) {
			var type = 'Polygon',
				coords = rings.map(function (ring) {
					return ring.map(function (latlng) {
						return [latlng.lng, latlng.lat];
					});
				});
			if (len > 1) {
				type = 'Multi' + type;
				coords = [coords];
			}
			this._geoFson = {
				type: 'Feature',
				properties: feature,
				geometry: {
					type: type,
					coordinates: coords
				}
			};
			this._exObj = L.geoJSON(this._geoFson, {});
			_map.addLayer(this._exObj);
			return this._geoFson;
		}
	}
});
/*eslint-enable */

export default cad;
