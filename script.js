
const API_KEY = "931b682ac33a754008465cce1731fd5e";

const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const loading = document.getElementById("loading");
const errorMessage = document.getElementById("errorMessage");
const weatherSection = document.getElementById("weatherSection");
const favoritesList = document.getElementById("favoritesList");
const favoriteBtn = document.getElementById("favoriteBtn");
const forecastContainer = document.getElementById("forecastContainer");
const suggestions = document.getElementById("suggestions");

let currentCity = "";
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];




async function getWeather(city) {

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;

    const response = await fetch(url);

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error("City not found! Please enter a valid city.");
        }

        if (response.status === 401) {
            throw new Error("Invalid API key. Please check your API key.");
        }

        throw new Error("Unable to fetch weather data.");
    }

    const data = await response.json();

    return {
        city: data.name,
        temp: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        icon: data.weather[0].icon
    };
}



async function getForecast(city) {

    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Unable to fetch forecast.");
    }

    const data = await response.json();

    const dailyForecast = data.list.filter(item =>
        item.dt_txt.includes("12:00:00")
    ).slice(0, 5);

    return dailyForecast;
}




function displayWeather(data) {

    document.getElementById("cityName").textContent = data.city;

    document.getElementById("temperature").textContent =
        `${data.temp}°C`;

    document.getElementById("weatherDescription").textContent =
        data.description;

    document.getElementById("feelsLike").textContent =
        `Feels Like: ${data.feelsLike}°C`;

    document.getElementById("humidity").textContent =
        `${data.humidity}%`;

    document.getElementById("windSpeed").textContent =
        `${data.windSpeed} m/s`;

    document.getElementById("weatherIcon").src =
        `https://openweathermap.org/img/wn/${data.icon}@2x.png`;

    weatherSection.classList.remove("hidden");

    currentCity = data.city;

    updateFavoriteButton();
}




function displayForecast(forecast) {

    forecastContainer.innerHTML = "";

    forecast.forEach(item => {

        const date = new Date(item.dt_txt);

        const day = date.toLocaleDateString("en-US", {
            weekday: "short"
        });

        const temp = Math.round(item.main.temp);

        const description = item.weather[0].description;

        const icon = item.weather[0].icon;

        const card = document.createElement("div");

        card.className = "forecast-card";

        const dayText = document.createElement("p");
        dayText.textContent = day;

        const weatherIcon = document.createElement("img");
        weatherIcon.src =
            `https://openweathermap.org/img/wn/${icon}@2x.png`;
        weatherIcon.alt = description;

        const temperature = document.createElement("h3");
        temperature.textContent = `${temp}°C`;

        const descriptionText = document.createElement("p");
        descriptionText.textContent = description;

        card.append(
            dayText,
            weatherIcon,
            temperature,
            descriptionText
        );

        forecastContainer.appendChild(card);

    });

}



async function searchWeather(city) {

    if (!city.trim()) {
        return;
    }

    loading.classList.remove("hidden");
    weatherSection.classList.add("hidden");
    errorMessage.textContent = "";

    try {

        const weatherData = await getWeather(city);

        const forecastData = await getForecast(city);

        displayWeather(weatherData);

        displayForecast(forecastData);

    } catch (error) {

        errorMessage.textContent = error.message;

    } finally {

        loading.classList.add("hidden");

    }
}


searchForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const city = cityInput.value.trim();

    await searchWeather(city);

});



function debounce(callback, delay) {

    let timer;

    return function (...args) {

        clearTimeout(timer);

        timer = setTimeout(() => {
            callback(...args);
        }, delay);

    };

}

const debouncedSearch = debounce((city) => {

    if (city.trim().length >= 3) {
        searchWeather(city);
    }

}, 500);

cityInput.addEventListener("input", () => {

    const city = cityInput.value.trim();

    if (city.length >= 3) {
        debouncedSearch(city);
    }

});


favoriteBtn.addEventListener("click", () => {

    if (!currentCity) return;

    const city = currentCity.toLowerCase();

    if (!favorites.some(item => item.toLowerCase() === city)) {

        favorites.push(currentCity);

        saveFavorites();

        displayFavorites();

    }

    updateFavoriteButton();

});



function saveFavorites() {

    localStorage.setItem(
        "favorites",
        JSON.stringify(favorites)
    );

}


function displayFavorites() {

    favoritesList.innerHTML = "";

    if (favorites.length === 0) {

        favoritesList.textContent = "No favorite cities yet.";

        return;
    }

    favorites.forEach(city => {

        const item = document.createElement("div");

        item.className = "favorite-item";

        const cityName = document.createElement("span");

        cityName.textContent = city;

        cityName.className = "favorite-city";

        cityName.addEventListener("click", () => {
            searchWeather(city);
        });

        const removeButton = document.createElement("button");

        removeButton.textContent = "Remove";

        removeButton.className = "remove-btn";

        removeButton.addEventListener("click", () => {

            removeFavorite(city);

        });

        item.append(cityName, removeButton);

        favoritesList.appendChild(item);

    });

}



function removeFavorite(city) {

    favorites = favorites.filter(item =>
        item.toLowerCase() !== city.toLowerCase()
    );

    saveFavorites();

    displayFavorites();

    updateFavoriteButton();

}



function updateFavoriteButton() {

    const isFavorite = favorites.some(item =>
        item.toLowerCase() === currentCity.toLowerCase()
    );

    favoriteBtn.textContent = isFavorite
        ? "⭐ Added to Favorites"
        : "⭐ Add to Favorites";

}


const themeToggle = document.getElementById("themeToggle");

themeToggle.addEventListener("click", () => {

    document.body.classList.toggle("dark");

    const isDark = document.body.classList.contains("dark");

    themeToggle.textContent = isDark
        ? "☀️ Light Mode"
        : "🌙 Dark Mode";

    localStorage.setItem("theme", isDark ? "dark" : "light");

});


const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {

    document.body.classList.add("dark");

    themeToggle.textContent = "☀️ Light Mode";

}


displayFavorites();


searchWeather("Kochi");
