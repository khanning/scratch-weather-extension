/* Extension demonstrating a blocking reporter block */
/* Sayamindu Dasgupta <sayamindu@media.mit.edu>, May 2014 */
/* Kreg Hanning <khanning@media.mit.edu>, July 2016 */

(function(ext) {
  var APPID = '960f7f58abbc5c98030d1899739c1ba8';

  var cacheDuration = 60 * 60 * 1000 //60 minutes in ms
  var cachedTemps = {};

  function fetchWeatherData(location, callback) {

    if (location in cachedTemps &&
        Date.now() - cachedTemps[location].time < cacheDuration) {
      //Weather data is cached
      callback(cachedTemps[location].data);
      console.log('cached');
      return;
    }

    // Make an AJAX call to the Open Weather Maps API
    $.ajax({
      url: 'http://api.openweathermap.org/data/2.5/weather',
      data: {q: location, units: 'imperial', appid: APPID},
      dataType: 'jsonp',
      success: function(weatherData) {
        //Received the weather data. Cache and return the data.
        cachedTemps[location] = {data: weatherData, time: Date.now()};
        callback(weatherData);
      }
    });
  }

  // Cleanup function when the extension is unloaded
  ext._shutdown = function() {};

  // Status reporting code
  // Use this to report missing hardware, plugin or unsupported browser
  ext._getStatus = function() {
    return {status: 2, msg: 'Ready'};
  };

  ext.getWeather = function(type, location, callback) {
    var temperature = fetchWeatherData(location, function(weatherData) {
      var val = null;
      switch (type) {
        case 'temperature':
          val = weatherData.main.temp;
          break;
        case 'humidity':
          val = weatherData.main.humidity;
          break;
        case 'wind speed':
          val = weatherData.wind.speed * 2.23694;
          break;
        case 'cloudiness':
          val = weatherData.clouds.all;
          break;
        case 'sunrise':
          var date = new Date(weatherData.sys.sunrise * 1000);
          console.log(date);
          val = date.getHours() + ":";
          if (date.getMinutes() < 10)
            val += '0';
          val += date.getMinutes();
          break;
        case 'sunset':
          var date = new Date(weatherData.sys.sunset * 1000);
          val = date.getHours() + ":";
          if (date.getMinutes() < 10)
            val += '0';
          val += date.getMinutes();
          break;
      }
      callback(val);
    });
  };

  ext.whenWeather = function(type, location, op, val, callback) {
    ext.getWeather(type, location, function(v) {
      if (op === '<')
        callback((v < val));
      else if (op === '=')
        callback((v == val));
      else if (op === '>')
        callback((v > val));
    });
  };

  // Block and block menu descriptions
  var descriptor = {
    blocks: [
      ['R', '%m.reporterData in %s', 'getWeather', 'temperature', 'Boston, MA'],
      ['H', 'when %m.eventData in %s is %m.ops %n', 'whenWeather', 'temperature', 'Boston, MA', '>', 80]
    ],
    menus: {
      reporterData: ['temperature', 'humidity', 'wind speed', 'cloudiness', 'sunrise', 'sunset'],
      eventData: ['temperature', 'humidity', 'wind speed', 'cloudiness'],
      ops: ['>','=', '<']
    }
  };

  // Register the extension
  ScratchExtensions.register('Weather extension', descriptor, ext);

})({});
