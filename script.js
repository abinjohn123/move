'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const formClose = document.querySelector('.btn--close-form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDate = document.querySelector('.form__input--date');
const outputDistance = document.querySelector('.form__input--distance');
const addWorkout = document.querySelector('.btn--add-workout');

class App {
  constructor() {
    this._getLocation();
    this._workouts = [];
    this._hideForm();
    this._points = new Point();

    addWorkout.addEventListener('click', this._displayForm.bind(this));
    form.addEventListener('submit', this._addWorkout.bind(this));
    inputType.addEventListener('change', this._routeColorHandler.bind(this));
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
    if (form.classList.contains('hidden')) return;
    const { lat, lng } = event.latlng;
    this._points._addPoint({ lat, lng });
    this._renderMarkers(this._points._geoPoints);
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
    this._removeAllMarkers();

    geoPoints.forEach(point => {
      const marker = L.marker(point, markerOptions)
        .addTo(this._map)
        .bindPopup(
          `${this._points._getIndex({ lat: point[0], lng: point[1] })}`,
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
    this._points._updatePoint(index, ev.target._latlng);
    ev.target.openPopup();
    this._renderRoute();
  }

  _removeAllMarkers() {
    Object.values(this._map._layers).forEach(layer => {
      if (layer._shadow) layer.removeFrom(this._map);
    });
  }

  _removeMarker(ev) {
    ev.target.removeFrom(this._map);
    this._points._removePoint(ev.latlng);
    this._renderMarkers(this._points._geoPoints);
  }

  _initPathOverlay() {
    const pathOptions = {
      // color: '#3388ff',
      color: '#00c46a',
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
        this._points._addPointInBetween(i + 1, { lat: x, lng: y });
        this._renderMarkers(this._points._geoPoints);
        this._renderRoute();
      }
    }
    L.DomEvent.stopPropagation(ev);
  }

  _renderRoute() {
    const points = this._points._geoPoints;
    // console.log(points);
    const distance = this._calcDistance();
    this._polyline.setLatLngs(points).addTo(this._map);

    outputDistance.value = `${
      distance > 1000 ? (distance / 1000).toFixed(1) : distance
    } ${distance > 1000 ? 'kilometers' : 'meters'}`;
  }

  _displayForm() {
    if (!form.classList.contains('hidden')) return;

    inputDate.value = '';
    outputDistance.value = '';

    form.classList.remove('hidden');
  }

  _hideForm() {
    form.classList.add('hidden');
  }
  _routeColorHandler() {
    const activity = inputType.value;
    const color = activity === 'running' ? '#00c46a' : '#ffb545';
    this._polyline.setStyle({ color });
  }

  _calcDistance() {
    const points = this._points._geoPoints;
    let distance = 0;
    for (let i = 0; i < points.length - 1; ++i)
      distance += L.latLng(points[i]).distanceTo(L.latLng(points[i + 1]));
    return Math.round(distance);
  }

  _addWorkout(e) {
    e.preventDefault();
    const distance = this._calcDistance();

    if (distance < 100) {
      alert('Distance is too short to record');
      return;
    }

    const type = inputType.value;
    const date = inputDate.value;
    const coords = this._points._geoPoints;
    this._workouts.push(new Workout(type, date, coords, distance));

    this._removeAllMarkers();
    this._points._removeAllPoints();
    this._renderRoute();
    this._hideForm();
  }
}

class Point {
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

  _removeAllPoints() {
    this._geoPoints = [];
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

class Workout {
  constructor(type, date, coords, distance) {
    this.type = type;
    this.date = date;
    this.coords = coords;
    this.distance = distance;
  }
}

const app = new App();
