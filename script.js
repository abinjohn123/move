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

    this._map.on('click', this._addMarker.bind(this));
  }

  _addMarker(event) {
    const { lat, lng } = event.latlng;
    this._workout._addPoint({ lat, lng });
    this._renderMarkers(this._workout._geoPoints);
  }

  _renderMarkers(geoPoints) {
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
  }

  _updateMarker(ev) {
    const index = Number.parseInt(ev.target._popup._content) - 1;
    this._workout._updatePoint(index, ev.target._latlng);
    ev.target.openPopup();
  }

  _removeMarker(ev) {
    ev.target.removeFrom(this._map);
    this._workout._removePoint(ev.latlng);
    this._renderMarkers(this._workout._geoPoints);
  }
}

class Workout {
  constructor() {
    this._geoPoints = [];
  }

  _addPoint({ lat, lng }) {
    this._geoPoints.push([lat, lng]);
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
