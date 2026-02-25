const searchBtn = document.getElementById("searchBtn");
const locBtn = document.getElementById("locBtn");
const result = document.getElementById("result");
const loader = document.getElementById("loader");
const error = document.getElementById("error");
const cityName = document.getElementById("cityName");

const latitude = document.getElementById("latitude");
const longitude = document.getElementById("longitude");

const aqiValue = document.getElementById("aqiValue");
const aqiStatus = document.getElementById("aqiStatus");
const components = document.getElementById("components");

const API_KEY = "5b008fb1770d14a15141666a71c006d6"; 

const statusMap = {
  1: "Good 😊",
  2: "Fair 🙂",
  3: "Moderate 😐",
  4: "Poor 😷",
  5: "Very Poor ☠"
};

const colorMap = {
  1: "#00e400",
  2: "#9cff00",
  3: "#ffae00",
  4: "#ff0000",
  5: "#99004c"
};

async function getCity(lat, lon) {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`
    );

    const data = await res.json();

    if (!data || data.length === 0) {
      return "Unknown Location";
    }

    const city = data[0];
    return `${city.name}${city.state ? ", " + city.state : ""}, ${city.country}`;

  } catch {
    return "Unknown Location";
  }
}

async function getAQI(lat, lon) {

  if (!API_KEY || API_KEY === "") {
    error.innerText = "⚠ Please Add Your OpenWeather API key!";
    return;
  }

  try {
    loader.classList.remove("hidden");
    result.classList.add("hidden");
    error.innerText = "";
    cityName.innerText = "📍 Detecting location...";

    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
    );

    if (!res.ok) {
      throw new Error(`API Error: ${res.status}`);
    }

    const data = await res.json();

    if (!data.list || data.list.length === 0) {
      throw new Error("No AQI data found");
    }

    const info = data.list[0];

    const city = await getCity(lat, lon);
    cityName.innerText = `📍 ${city} (${lat.toFixed(2)}, ${lon.toFixed(2)})`;

    const aqi = info.main.aqi;

    aqiValue.innerText = aqi;
    aqiStatus.innerText = statusMap[aqi] || "Unknown";
    aqiValue.style.color = colorMap[aqi] || "#000";

    components.innerHTML = "";

    Object.entries(info.components).forEach(([key, val]) => {
      components.innerHTML += `
        <div class="component-card">
          <strong>${key.toUpperCase()}</strong>
          <p>${val} μg/m³</p>
        </div>
      `;
    });

    result.classList.remove("hidden");

  } catch (err) {
    console.error(err);
    error.innerText = `❌ ${err.message}`;
  } finally {
    loader.classList.add("hidden");
  }
}

searchBtn.onclick = () => {

  if (!latitude.value || !longitude.value) {
    error.innerText = "⚠ Please enter latitude and longitude!";
    return;
  }

  const lat = parseFloat(latitude.value);
  const lon = parseFloat(longitude.value);

  if (isNaN(lat) || isNaN(lon)) {
    error.innerText = "⚠ Invalid coordinates!";
    return;
  }

  getAQI(lat, lon);
};


locBtn.onclick = () => {

  error.innerText = "";
  cityName.innerText = "📍 Detecting location...";
  result.classList.add("hidden");
  loader.classList.remove("hidden");

  if (!navigator.geolocation) {
    loader.classList.add("hidden");
    error.innerText = "Geolocation not supported!";
    return;
  }

  navigator.geolocation.getCurrentPosition(

    async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      latitude.value = lat.toFixed(4);
      longitude.value = lon.toFixed(4);

      await getAQI(lat, lon);
    },

    (err) => {
      loader.classList.add("hidden");

      if (err.code === 1) {
        error.innerText = "⚠ Location permission denied!";
      } else if (err.code === 2) {
        error.innerText = "⚠ Location unavailable!";
      } else {
        error.innerText = "⚠ Something went wrong!";
      }
    }

  );
};

window.onload = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        getAQI(pos.coords.latitude, pos.coords.longitude);
      }
    );
  }
};