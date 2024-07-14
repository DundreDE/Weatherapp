document.addEventListener("DOMContentLoaded", () => {
    const hourlyButton = document.getElementById('hourly-button');
    const dailyButton = document.getElementById('daily-button');
    const darkModeButton = document.getElementById('dark-mode-button');
    const weatherInfoDiv = document.getElementById('weather-info');
    const forecastInfoDiv = document.getElementById('forecast-info');

    if (!hourlyButton) {
        console.error("Stündlich-Button nicht gefunden.");
        return;
    }

    if (!dailyButton) {
        console.error("Täglich-Button nicht gefunden.");
        return;
    }

    if (!darkModeButton) {
        console.error("Dark Mode-Button nicht gefunden.");
        return;
    }

    hourlyButton.addEventListener('click', () => {
        clearActiveButton();
        hourlyButton.classList.add('active');
        getHourlyForecast();
    });

    dailyButton.addEventListener('click', () => {
        clearActiveButton();
        dailyButton.classList.add('active');
        getDailyForecast();
    });

    darkModeButton.addEventListener('click', () => {
        toggleDarkMode();
    });

    // Standardmäßig stündliche Vorhersage anzeigen
    hourlyButton.classList.add('active');
    getHourlyForecast();

    // Beim Laden der Seite Dark Mode Zustand wiederherstellen
    const isDarkModeEnabled = localStorage.getItem('darkModeEnabled') === 'true';
    const body = document.body;
    if (isDarkModeEnabled) {
        body.classList.add('dark-mode');
    }

    function clearActiveButton() {
        hourlyButton.classList.remove('active');
        dailyButton.classList.remove('active');
    }

    function getWeather() {
        const storedLat = localStorage.getItem('latitude');
        const storedLon = localStorage.getItem('longitude');

        if (storedLat && storedLon) {
            fetchWeatherData(storedLat, storedLon);
        } else {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(position => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    localStorage.setItem('latitude', lat);
                    localStorage.setItem('longitude', lon);
                    fetchWeatherData(lat, lon);
                }, error => {
                    console.error("Geolocation-Fehler: ", error);
                });
            } else {
                alert("Geolocation wird von diesem Browser nicht unterstützt.");
            }
        }
    }

    function fetchWeatherData(lat, lon) {
        const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=Europe/Berlin`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                const weather = data.current_weather;
                const weatherDescription = getWeatherDescription(weather.weathercode);
                const backgroundClass = getBackgroundClass(weather.weathercode);

                document.body.className = backgroundClass;

                weatherInfoDiv.innerHTML = `
                    <h2>Aktuelles Wetter</h2>
                    <p>Temperatur: ${weather.temperature}°C</p>
                    <p>Wetter: ${weatherDescription}</p>
                    <p>Windgeschwindigkeit: ${weather.windspeed} km/h</p>
                `;
            })
            .catch(error => console.error('Fehler beim Abrufen der Wetterdaten: ', error));
    }

    function getWeatherDescription(code) {
        const weatherDescriptions = {
            0: 'Klarer Himmel',
            1: 'Überwiegend klar',
            2: 'Teilweise bewölkt',
            3: 'Bewölkt',
            45: 'Neblig',
            48: 'Reifnebel',
            51: 'Leichter Nieselregen',
            53: 'Mäßiger Nieselregen',
            55: 'Starker Nieselregen',
            56: 'Gefrierender Nieselregen',
            57: 'Gefrierender starker Nieselregen',
            61: 'Leichter Regen',
            63: 'Mäßiger Regen',
            65: 'Starker Regen',
            66: 'Gefrierender Regen',
            67: 'Gefrierender starker Regen',
            71: 'Leichter Schneefall',
            73: 'Mäßiger Schneefall',
            75: 'Starker Schneefall',
            77: 'Schneekörner',
            80: 'Leichter Regenschauer',
            81: 'Mäßiger Regenschauer',
            82: 'Starker Regenschauer',
            85: 'Leichter Schneeschauer',
            86: 'Starker Schneeschauer',
            95: 'Gewitter',
            96: 'Gewitter mit leichtem Hagel',
            99: 'Gewitter mit starkem Hagel'
        };
        return weatherDescriptions[code] || 'Unbekanntes Wetter';
    }

    function getBackgroundClass(code) {
        const backgroundClasses = {
            0: 'clear-sky',
            1: 'mostly-clear',
            2: 'partly-cloudy',
            3: 'cloudy',
            45: 'foggy',
            48: 'foggy',
            51: 'drizzle',
            53: 'drizzle',
            55: 'drizzle',
            56: 'freezing-drizzle',
            57: 'freezing-drizzle',
            61: 'rain',
            63: 'rain',
            65: 'rain',
            66: 'freezing-rain',
            67: 'freezing-rain',
            71: 'snow',
            73: 'snow',
            75: 'snow',
            77: 'snow',
            80: 'rain-shower',
            81: 'rain-shower',
            82: 'rain-shower',
            85: 'snow-shower',
            86: 'snow-shower',
            95: 'thunderstorm',
            96: 'thunderstorm',
            99: 'thunderstorm'
        };
        return backgroundClasses[code] || 'default';
    }

    function getHourlyForecast() {
        const lat = localStorage.getItem('latitude');
        const lon = localStorage.getItem('longitude');

        if (!lat || !lon) {
            console.error("Keine gespeicherten Geokoordinaten gefunden.");
            return;
        }

        const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode&timezone=Europe/Berlin`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                if (data.hourly && Array.isArray(data.hourly.time)) {
                    const hourlyForecast = data.hourly;
                    const currentHour = new Date().getHours();
                    const forecastTable = document.getElementById('forecast-table');
                    forecastTable.innerHTML = `
                        <thead>
                            <tr>
                                <th>Zeit</th>
                                <th>Temperatur (°C)</th>
                                <th>Wetter</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${hourlyForecast.time.slice(0, 24).map((time, index) => {
                                const hour = (currentHour + index) % 24; // Berechne die Stunde
                                const temperature = hourlyForecast.temperature_2m[index];
                                const weatherCode = hourlyForecast.weathercode[index];
                                const description = getWeatherDescription(weatherCode);
                                return `
                                    <tr>
                                        <td>${hour}:00</td>
                                        <td>${temperature}</td>
                                        <td>${description}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    `;
                } else {
                    console.error('Die zurückgegebenen stündlichen Daten haben keine erwartete Array-Struktur:', data);
                }
            })
            .catch(error => console.error('Fehler beim Abrufen der stündlichen Wetterdaten: ', error));
    }

    function getDailyForecast() {
        const lat = localStorage.getItem('latitude');
        const lon = localStorage.getItem('longitude');

        if (!lat || !lon) {
            console.error("Keine gespeicherten Geokoordinaten gefunden.");
            return;
        }

        const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=Europe/Berlin`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                if (data.daily && Array.isArray(data.daily.time)) {
                    const dailyForecast = data.daily;
                    const forecastTable = document.getElementById('forecast-table');
                    forecastTable.innerHTML = `
                        <thead>
                            <tr>
                                <th>Datum</th>
                                <th>Max. Temperatur (°C)</th>
                                <th>Min. Temperatur (°C)</th>
                                <th>Wetter</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dailyForecast.time.slice(0, 7).map((date, index) => {
                                const day = new Date(date).toLocaleDateString('de-DE', { weekday: 'long' });
                                const maxTemp = dailyForecast.temperature_2m_max[index];
                                const minTemp = dailyForecast.temperature_2m_min[index];
                                const weatherCode = dailyForecast.weathercode[index];
                                const description = getWeatherDescription(weatherCode);
                                return `
                                    <tr>
                                        <td>${day}</td>
                                        <td>${maxTemp}</td>
                                        <td>${minTemp}</td>
                                        <td>${description}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    `;
                } else {
                    console.error('Die zurückgegebenen täglichen Daten haben keine erwartete Array-Struktur:', data);
                }
            })
            .catch(error => console.error('Fehler beim Abrufen der täglichen Wetterdaten: ', error));
    }

    function toggleDarkMode() {
        const body = document.body;
        body.classList.toggle('dark-mode');
        const isDarkModeEnabled = body.classList.contains('dark-mode');
        localStorage.setItem('darkModeEnabled', isDarkModeEnabled);
    }

    // Wetterdaten beim Laden der Seite abrufen
    getWeather();
});

