'use client'
import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Thermometer, Droplets, Wind, MapPin } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { WEATHER_API_KEY } from '@/components/api-key'


const API_BASE_URL = 'https://api.openweathermap.org/data/2.5'

interface WeatherData {
  city: string
  temp: number
  description: string
  humidity: number
  windSpeed: number
}

interface ForecastData {
  date: string
  temp: number
  description: string
  minTemp: number
  maxTemp: number
}

export default function WeatherApp() {
  const [city, setCity] = useState('')
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [forecastData, setForecastData] = useState<ForecastData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inputError, setInputError] = useState<string | null>(null)
  const [unit, setUnit] = useState<'celsius' | 'fahrenheit'>('celsius')
  const [geoLocationError, setGeoLocationError] = useState<string | null>(null)

  useEffect(() => {
    getUserLocation()
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getUserLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords
          fetchWeatherData(latitude, longitude)
        },
        error => {
          setGeoLocationError("Unable to retrieve your location. Please enter a city manually.")
        }
      )
    } else {
      setGeoLocationError("Geolocation is not supported by your browser. Please enter a city manually.")
    }
  }

  const fetchWeatherData = async (lat?: number, lon?: number) => {
    setLoading(true)
    setError(null)
    try {
      let currentUrl = `${API_BASE_URL}/weather?appid=${WEATHER_API_KEY}&units=metric`
      let forecastUrl = `${API_BASE_URL}/forecast?appid=${WEATHER_API_KEY}&units=metric`

      if (lat && lon) {
        currentUrl += `&lat=${lat}&lon=${lon}`
        forecastUrl += `&lat=${lat}&lon=${lon}`
      } else if (city) {
        currentUrl += `&q=${city}`
        forecastUrl += `&q=${city}`
      } else {
        throw new Error('No location provided')
      }

      const [currentResponse, forecastResponse] = await Promise.all([
        fetch(currentUrl),
        fetch(forecastUrl)
      ])

      if (!currentResponse.ok || !forecastResponse.ok) {
        throw new Error('City not found')
      }

      const currentData = await currentResponse.json()
      const forecastData = await forecastResponse.json()

      const processedCurrentData: WeatherData = {
        city: currentData.name,
        temp: currentData.main.temp,
        description: currentData.weather[0].description,
        humidity: currentData.main.humidity,
        windSpeed: currentData.wind.speed
      }

      const processedForecastData: ForecastData[] = forecastData.list
        .filter((item: any, index: number) => index % 8 === 0)
        .slice(0, 5)
        .map((item: any) => ({
          date: new Date(item.dt * 1000).toLocaleDateString(),
          temp: item.main.temp,
          description: item.weather[0].description,
          minTemp: item.main.temp_min,
          maxTemp: item.main.temp_max
        }))

      setWeatherData(processedCurrentData)
      setForecastData(processedForecastData)
    } catch (err) {
      setError('Failed to fetch weather data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setInputError(null)
    if (city.trim()) {
      fetchWeatherData()
    } else {
      setInputError('Please enter a city name')
    }
  }

  const toggleUnit = () => {
    setUnit(unit === 'celsius' ? 'fahrenheit' : 'celsius')
  }

  const convertTemp = (temp: number) => {
    if (unit === 'fahrenheit') {
      return (temp * 9) / 5 + 32
    }
    return temp
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Weather Forecast</h1>
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-2">
            <Input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter city name"
              className="flex-grow"
            />
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Search'}
            </Button>
          </div>
        </form>

        <div className="mb-4 flex justify-between items-center">
          <Button onClick={getUserLocation} disabled={loading}>
            <MapPin className="mr-2 h-4 w-4" />
            Use My Location
          </Button>
          <Button onClick={toggleUnit}>
            Switch to {unit === 'celsius' ? 'Fahrenheit' : 'Celsius'}
          </Button>
        </div>

        {inputError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{inputError}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {geoLocationError && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{geoLocationError}</span>
          </div>
        )}

        {loading && (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {weatherData && !loading && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Current Weather in {weatherData.city}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Thermometer className="mr-2" />
                      <span>{convertTemp(weatherData.temp).toFixed(1)}°{unit === 'celsius' ? 'C' : 'F'}</span>
                    </div>
                  </div>
                  <p className="text-lg font-medium capitalize">{weatherData.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Droplets className="mr-2" />
                      <span>Humidity: {weatherData.humidity}%</span>
                    </div>
                    <div className="flex items-center">
                      <Wind className="mr-2" />
                      <span>Wind: {weatherData.windSpeed} m/s</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5-Day Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {forecastData.map((day, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg shadow">
                      <p className="font-bold">{day.date}</p>
                      <p>{convertTemp(day.temp).toFixed(1)}°{unit === 'celsius' ? 'C' : 'F'}</p>
                      <p className="capitalize">{day.description}</p>
                      <p>Min: {convertTemp(day.minTemp).toFixed(1)}°{unit === 'celsius' ? 'C' : 'F'}</p>
                      <p>Max: {convertTemp(day.maxTemp).toFixed(1)}°{unit === 'celsius' ? 'C' : 'F'}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}