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
    console.log(this._map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(this._map);
  }
}

const app = new App();
