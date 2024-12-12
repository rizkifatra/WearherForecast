const apiKey = "81f9510286b224b07e652a418af3e06e"; // Replace with your OpenWeatherMap API key
const baseUrl = "https://api.openweathermap.org/data/2.5/forecast";
let fetchedData = []; // Store fetched data globally for use by both buttons
let chartInstance = null; // Store the Chart.js instance to clear it later

// Function to display a consolidated alert in the HTML with dynamic colors and icons
function showAlert(messages, type = "info") {
  const alertContainer = document.getElementById("alert-container");
  let colorClass, icon;
  switch (type) {
    case "success":
      colorClass = "alert-success"; // Green
      icon = `<i class="fas fa-check-circle me-2"></i>`; // Success Icon
      break;
    case "warning":
      colorClass = "alert-warning"; // Yellow
      icon = `<i class="fas fa-exclamation-triangle me-2"></i>`; // Warning Icon
      break;
    case "grey":
      colorClass = "alert-secondary"; // Grey
      icon = `<i class="fas fa-info-circle me-2"></i>`; // Info Icon
      break;
    default:
      colorClass = "alert-danger"; // Red
      icon = `<i class="fas fa-times-circle me-2"></i>`; // Error Icon
  }
  alertContainer.innerHTML = `
        <div class="alert ${colorClass}" role="alert">
            ${icon}${messages.join("<br>")}
        </div>
    `;
}

// Clear all alerts
function clearAlerts() {
  document.getElementById("alert-container").innerHTML = "";
}

// Fetch weather data for a city
async function fetchWeather(city) {
  try {
    const response = await fetch(`${baseUrl}?q=${city.trim()}&appid=${apiKey}`);
    const data = await response.json();

    if (data.cod !== "200") {
      throw new Error(data.message);
    }

    // Extract and calculate data
    const forecasts = data.list.slice(0, 8); // First 24 hours (3-hour intervals)
    const maxTemp = Math.max(...forecasts.map((f) => f.main.temp)) - 273.15;
    const avgTemp =
      forecasts.reduce((sum, f) => sum + f.main.temp, 0) / forecasts.length -
      273.15;

    return {
      city: data.city.name,
      maxTemp: maxTemp.toFixed(2),
      avgTemp: avgTemp.toFixed(2),
    };
  } catch (error) {
    console.error(`Error fetching data for ${city}:`, error.message);
    return { city, error: true, message: `City "${city}" is not found` };
  }
}

// Update the table with weather data
function updateTable(data) {
  const tableBody = document.getElementById("weather-table-body");
  tableBody.innerHTML = ""; // Clear the table first
  data.forEach((cityData) => {
    const row = `
            <tr>
                <td>${cityData.city}</td>
                <td>${cityData.maxTemp}</td>
                <td>${cityData.avgTemp}</td>
            </tr>
        `;
    tableBody.innerHTML += row;
  });
}

// Update the chart with weather data
function updateChart(cities, maxTemps, avgTemps) {
  const ctx = document.getElementById("weather-chart").getContext("2d");

  // Destroy the previous chart if it exists
  if (chartInstance) {
    chartInstance.destroy();
  }

  // Create a new chart instance
  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: cities,
      datasets: [
        {
          label: "Maximum Temperature (°C)",
          data: maxTemps,
          backgroundColor: "rgba(255, 99, 132, 0.5)",
        },
        {
          label: "Average Temperature (°C)",
          data: avgTemps,
          backgroundColor: "rgba(54, 162, 235, 0.5)",
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

// Handle "Get Forecast" button click to fetch weather data
document.getElementById("get-forecast").addEventListener("click", async () => {
  const input = document.getElementById("city-input").value;
  const cities = input
    .split(",")
    .map((city) => city.trim())
    .filter((city) => city !== "");

  if (cities.length === 0) {
    clearAlerts();
    showAlert(["Please enter at least one city!"], "warning");
    return;
  }

  clearAlerts();
  const results = await Promise.all(cities.map(fetchWeather));
  const validResults = results.filter((result) => !result.error); // Filter valid data
  const invalidResults = results.filter((result) => result.error); // Filter invalid data

  // Handle notifications
  const messages = [];
  if (validResults.length > 0) {
    messages.push(`${validResults.length} city/cities fetched successfully.`);
    updateTable(validResults); // Populate table immediately after fetching data
  }
  if (invalidResults.length > 0) {
    const invalidCityNames = invalidResults
      .map((result) => result.city)
      .join(", ");
    messages.push(`${invalidCityNames} is/are not found.`);
    showAlert(messages, "grey"); // Grey color for partial success
  } else {
    showAlert(messages, "success"); // Green color for full success
  }

  // Store valid results globally for chart rendering
  fetchedData = validResults;
});

// Handle "Display Chart" button click to show the chart
document.getElementById("display-chart").addEventListener("click", () => {
  if (fetchedData.length === 0) {
    clearAlerts();
    showAlert(
      ["No data available. Please fetch the weather data first."],
      "warning"
    );
  } else {
    const cityNames = fetchedData.map((r) => r.city);
    const maxTemps = fetchedData.map((r) => r.maxTemp);
    const avgTemps = fetchedData.map((r) => r.avgTemp);
    updateChart(cityNames, maxTemps, avgTemps);
    showAlert(["Chart displayed successfully!"], "success");
  }
});
