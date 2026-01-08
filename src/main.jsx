import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import CreateTrip from "./CreateTrip";
import Layout from "./components/Layout";
import ViewTrip from "./components/ViewTrip";

// Simple placeholder components
const TripHistory = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Trip Planner</h1>
      <p className="text-gray-600">Coming soon!</p>
    </div>
  </div>
);

const Blog = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Blog</h1>
      <p className="text-gray-600">Travel stories coming soon!</p>
    </div>
  </div>
);

const Deals = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Deals</h1>
      <p className="text-gray-600">Special offers coming soon!</p>
    </div>
  </div>
);

// Router configuration
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <App />
      },
      {
        path: "/create-trip",
        element: <CreateTrip />
      },
      {
        path: "/view-trip",
        element: <ViewTrip />
      },
      {
        path: "/trip-planner",
        element: <TripHistory />
      },
      {
        path: "/blog",
        element: <Blog />
      },
      {
        path: "/deals",
        element: <Deals />
      }
    ]
  }
]);

// Render app
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
