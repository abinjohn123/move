'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const outputDistance = document.querySelector('.form__input--distance');

class App {
  constructor() {
    this._getLocation();
    this._workout = new Workout();
  }
  _getLocation() {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      this._geolocationFailureHandler
    );
  }

  _geolocationFailureHandler() {
    alert('Error accessing location data');
  }

  _loadMap(geoObj) {
    const { latitude, longitude } = geoObj.coords;
    const position = [latitude, longitude];

    this._map = L.map('map').setView(position, 18);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(this._map);
    this._initPathOverlay();

    this._map.on('click', this._addMarker.bind(this));
  }

  _addMarker(event) {
    const { lat, lng } = event.latlng;
    this._workout._addPoint({ lat, lng });
    this._renderMarkers(this._workout._geoPoints);
  }

  _renderMarkers(geoPoints) {
    const markerOptions = {
      title: 'click and drag to move',
      draggable: true,
    };

    const popupOptions = {
      offset: L.point(0, 0),
      autoClose: false,
      closeOnClick: false,
      closeButton: false,
    };

    // Iterate over map layers and remove layers corresponding to markers
    Object.values(this._map._layers).forEach(layer => {
      if (layer._shadow) layer.removeFrom(this._map);
    });

    geoPoints.forEach(point => {
      const marker = L.marker(point, markerOptions)
        .addTo(this._map)
        .bindPopup(
          `${this._workout._getIndex({ lat: point[0], lng: point[1] })}`,
          popupOptions
        )
        .openPopup();

      marker.on('click', this._removeMarker.bind(this));
      marker.on('dragend', this._updateMarker.bind(this));
    });
    this._renderRoute();
  }

  _updateMarker(ev) {
    const index = Number.parseInt(ev.target._popup._content) - 1;
    this._workout._updatePoint(index, ev.target._latlng);
    ev.target.openPopup();
    this._renderRoute();
  }

  _removeMarker(ev) {
    ev.target.removeFrom(this._map);
    this._workout._removePoint(ev.latlng);
    this._renderMarkers(this._workout._geoPoints);
  }

  _initPathOverlay() {
    const pathOptions = {
      color: '#3388ff',
      weight: 15,
      opacity: 0.8,
    };

    this._polyline = L.polyline([], pathOptions);
    this._polyline.on('click', this._lineClickHandler.bind(this));
  }

  _lineClickHandler(ev) {
    const linePoints = ev.target._latlngs;
    const { lat: x, lng: y } = ev.latlng;

    for (let i = 0; i < linePoints.length - 1; ++i) {
      const { lat: x1, lng: y1 } = linePoints[i];
      const { lat: x2, lng: y2 } = linePoints[i + 1];
      const p1 = L.point(x1, y1);
      const p2 = L.point(x2, y2);
      const bounds = L.bounds(p1, p2);

      if (bounds.contains(L.point(x, y))) {
        this._workout._addPointInBetween(i + 1, { lat: x, lng: y });
        this._renderMarkers(this._workout._geoPoints);
        this._renderRoute();
      }
    }
    L.DomEvent.stopPropagation(ev);
  }

  _renderRoute() {
    const points = this._workout._geoPoints;
    const distance = this._calcDistance();
    this._polyline.setLatLngs(points).addTo(this._map);

    outputDistance.value = `${
      distance > 1000 ? (distance / 1000).toFixed(1) : distance
    } ${distance > 1000 ? 'kilometers' : 'meters'}`;
  }

  _calcDistance() {
    const points = this._workout._geoPoints;
    let distance = 0;
    for (let i = 0; i < points.length - 1; ++i)
      distance += L.latLng(points[i]).distanceTo(L.latLng(points[i + 1]));
    return Math.round(distance);
  }
}

class Workout {
  constructor() {
    this._geoPoints = [];
  }

  _addPoint({ lat, lng }) {
    this._geoPoints.push([lat, lng]);
  }

  _addPointInBetween(index, { lat, lng }) {
    const pointsToLeft = this._geoPoints.slice(0, index);
    const pointsToRight = this._geoPoints.slice(index);
    this._geoPoints = [...pointsToLeft, [lat, lng], ...pointsToRight];
  }

  _removePoint({ lat, lng }) {
    this._geoPoints = this._geoPoints.filter(
      point => point[0] !== lat && point[1] !== lng
    );
  }

  _updatePoint(index, { lat, lng }) {
    this._geoPoints[index] = [lat, lng];
  }

  _getIndex({ lat, lng }) {
    return (
      this._geoPoints.findIndex(point => point[0] === lat && point[1] === lng) +
      1
    );
  }
}

const app = new App();
