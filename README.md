# Ghumo - AI-Powered Trip Planner

An intelligent trip planning application built with React and Vite that uses Google's Generative AI to create personalized travel itineraries.

## Features

- 🗺️ Destination selection with Google Places autocomplete
- 📅 Flexible travel date picker (1-5 days)
- 💰 Budget-based recommendations
- 👥 Traveler type customization
- 🎯 Activity preferences selection
- 🤖 AI-powered itinerary generation using Google Gemini
- 🏨 Hotel recommendations with pricing
- 📱 Responsive and user-friendly UI

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **API**: Google Places API, Google Generative AI (Gemini)
- **Build Tool**: Vite
- **Linting**: ESLint

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- API Keys:
  - Google Places API Key
  - Google Generative AI API Key

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```
VITE_GOOGLE_PLACE_API_KEY=your_google_places_api_key
VITE_GEMINI_API_KEY=your_google_generative_ai_key
```

### Development

```bash
npm run dev
```

The app will start at `http://localhost:5173`

### Build

```bash
npm run build
```

## Project Structure

```
src/
├── components/          # Reusable React components
├── CreateTrip/          # Trip creation form component
├── Service/             # API service calls
├── lib/                 # Utility functions
├── constants/           # App constants and options
└── App.jsx              # Main app component
```

## Usage

1. Select your destination using the autocomplete search
2. Choose your travel dates
3. Specify the number of days (1-5)
4. Select your budget preference
5. Choose who you're traveling with
6. Select your preferred activities
7. Click "Generate Trip" to create your personalized itinerary

## Error Handling

The application includes comprehensive error handling with retry mechanisms for API calls and user-friendly error messages.
