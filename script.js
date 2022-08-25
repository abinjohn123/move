'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  constructor() {
    this._getLocation();
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

    this._map.on('click', this._addMarker.bind(this));
  }

  _addMarker(event) {
    const { lat, lng } = event.latlng;
    const position = [lat, lng];

    const openPopup = function () {
      this.openPopup();
    };

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

    const marker = L.marker(position, markerOptions)
      .addTo(this._map)
      .bindPopup('10', popupOptions)
      .openPopup();

    marker.on('click', this._removeMarker.bind(this));
    marker.on('dragend', openPopup.bind(marker));
  }

  _removeMarker(ev) {
    ev.target.removeFrom(this._map);
  }
}

const app = new App();
