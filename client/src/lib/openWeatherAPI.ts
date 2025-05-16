import { WindCache } from "@shared/schema";

// Function to fetch wind data from our API which uses OpenWeather
export async function fetchWindData(latitude: number, longitude: number): Promise<WindCache | null> {
  try {
    const response = await fetch(`/api/wind?lat=${latitude}&lon=${longitude}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch wind data: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching wind data:", error);
    return null;
  }
}

// Function to convert wind direction in degrees to cardinal direction
export function degreesToCardinal(deg: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(deg / 22.5) % 16;
  return directions[index];
}

// Function to convert wind speed from m/s to km/h
export function msToKmh(ms: number): number {
  return ms * 3.6;
}

// Function to get a color representing wind speed
export function getWindSpeedColor(speed: number): string {
  // Speed in km/h
  if (speed < 5) return '#95D1E9'; // Light breeze - sky-mid
  if (speed < 15) return '#5DA9D6'; // Moderate - sky-dark
  if (speed < 30) return '#FF9D5C'; // Strong - wind-orange
  return '#6A5A9E'; // Storm - storm-dark
}
