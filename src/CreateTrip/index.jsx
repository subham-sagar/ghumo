"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import {
  SelectBudgetOptions,
  SelectTravelesList,
  SelectActivitiesOptions,
} from "@/constants/Options";
import React, { useState, useEffect } from "react";
import ReactGoogleAutocomplete from "react-google-autocomplete";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "sonner";
import GetTravelPlan from "@/Service/Aimodel";

function CreateTrip() {
  const [place, setPlace] = useState();
  const [formData, setFormData] = useState({});
  const [startDate, setStartDate] = useState(null);
  const [days, setDays] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (name, value) => {
    if (name === "noOfDays" && value > 5) {
      toast.error("Number of days cannot be more than 5");
      return;
    }
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  useEffect(() => {
    console.log("Current form data:", formData);
  }, [formData]);

  const OnGenerateTrip = async () => {
    // Early return if already loading
    if (loading) return;

    // Comprehensive validation with specific error messages
    const validationErrors = [];

    if (!formData?.place?.formatted_address && !formData?.place?.name) {
      validationErrors.push("Please select a destination");
    }

    if (!formData?.travelDate) {
      validationErrors.push("Please select a travel date");
    }

    if (!formData?.noOfDays || formData.noOfDays < 1 || formData.noOfDays > 5) {
      validationErrors.push("Number of days must be between 1 and 5");
    }

    if (!formData?.budget) {
      validationErrors.push("Please select your budget preference");
    }

    if (!formData?.traveller) {
      validationErrors.push("Please select who you are traveling with");
    }

    if (!formData?.activities || formData.activities.length === 0) {
      validationErrors.push("Please select at least one activity");
    }

    // Show specific validation errors
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      console.log("Validation failed:", validationErrors);
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Generating your perfect trip plan...");

    try {
      // Prepare data with proper formatting
      const tripRequestData = {
        place: {
          name:
            formData.place?.name ||
            formData.place?.formatted_address ||
            formData.place,
          formatted_address: formData.place?.formatted_address,
          place_id: formData.place?.place_id,
          // Extract useful location data if available
          location: formData.place?.geometry?.location
            ? {
                lat: formData.place.geometry.location.lat(),
                lng: formData.place.geometry.location.lng(),
              }
            : null,
        },
        travelDate:
          formData.travelDate instanceof Date
            ? formData.travelDate.toISOString()
            : formData.travelDate,
        noOfDays: parseInt(formData.noOfDays),
        budget: formData.budget,
        traveller: formData.traveller,
        activities: formData.activities,
        // Add timestamp for tracking
        generatedAt: new Date().toISOString(),
      };

      console.log("🚀 Generating trip with formatted data:", tripRequestData);

      // Call AI service with timeout
      const tripData = await Promise.race([
        GetTravelPlan(tripRequestData),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Request timeout - please try again")),
            60000
          )
        ),
      ]);

      if (!tripData) {
        throw new Error("No trip data received from AI service");
      }

      console.log("✅ Trip generated successfully:", tripData);

      // Validate AI response has required fields
      if (!tripData.itinerary && !tripData.hotels && !tripData.activities) {
        throw new Error("Invalid trip data received. Please try again.");
      }

      // Store data with error handling
      try {
        localStorage.setItem("tripData", JSON.stringify(tripData));
        localStorage.setItem("tripFormData", JSON.stringify(tripRequestData));
        localStorage.setItem("tripGeneratedAt", new Date().toISOString());
      } catch (storageError) {
        console.error("Failed to store trip data:", storageError);
        // Continue anyway as data can be passed through navigation
      }

      toast.success("Trip generated successfully! 🎉", { id: toastId });

      // Navigate to results page - use React Router if available
      setTimeout(() => {
        // If using React Router:
        // navigate('/view-trip', { state: { tripData, formData: tripRequestData } });

        // Fallback to window navigation
        window.location.href = "/view-trip";
      }, 500);
    } catch (error) {
      console.error("❌ Trip generation failed:", error);

      // Provide user-friendly error messages
      let errorMessage = "Failed to generate trip. Please try again.";

      if (error.message?.includes("timeout")) {
        errorMessage = "Request is taking too long. Please try again.";
      } else if (error.message?.includes("network")) {
        errorMessage = "Network error. Please check your connection.";
      } else if (error.message?.includes("API")) {
        errorMessage =
          "Service temporarily unavailable. Please try again later.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, { id: toastId });

      // Log detailed error for debugging
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        formData: tripRequestData,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sm:px-10 md:px-32 lg:px-56 xl-px10 px-5 mt-10 bg-gray-50">
      <div>
        <h2
          className="font-bold text-5xl text-[#f56551]
       text-center"
        >
          Tell us your travel preferences
        </h2>
        <p className="mt-3 text-gray-600 text-center">
          Just provide some basic information, and our trip planner will
          generate a customized itinerary based on your preferences.
        </p>
      </div>

      <div className="mt-20 flex flex-col gap-10">
        {/* Destination Choice */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="my-3 text-xl font-medium text-gray-800">
            What is your destination choice?
          </h2>
          <ReactGoogleAutocomplete
            apiKey={import.meta.env.VITE_GOOGLE_PLACE_API_KEY}
            onPlaceSelected={(place) => {
              setPlace(place);
              handleInputChange("place", place);
              console.log(
                "Place selected:",
                place.name || place.formatted_address
              );
            }}
            options={{
              types: ["(regions)"],
            }}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 
            focus:border-green-500 outline-none"
            placeholder="Enter your destination..."
          />
        </div>

        {/* Travel Date */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="my-3 text-xl font-medium text-gray-800">
            When do you plan to travel?
          </h2>
          <DatePicker
            selected={startDate}
            onChange={(date) => {
              setStartDate(date);
              handleInputChange("travelDate", date);
            }}
            dateFormat="dd/MM/yyyy"
            minDate={new Date()}
            placeholderText="Select your travel date"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 
            focus:border-green-500 outline-none"
            popperPlacement="top-start"
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
          />
        </div>

        {/* Number of Days */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="my-3 text-xl font-medium text-gray-800">
            How many days are you planning your trip?
          </h2>
          <div className="relative">
            <Input
              placeholder="Ex. 3 days"
              type="number"
              min="1"
              max="5"
              value={days}
              onChange={(e) => {
                const value = Math.max(
                  1,
                  Math.min(5, parseInt(e.target.value) || 1)
                );
                setDays(value);
                handleInputChange("noOfDays", value);
              }}
              className="pr-20 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const newValue = Math.max(1, days - 1);
                  setDays(newValue);
                  handleInputChange("noOfDays", newValue);
                }}
                className="w-7 h-7 flex items-center justify-center text-green-600 
                bg-white rounded-full shadow-md hover:shadow-lg transition-all 
                border border-green-200 hover:bg-green-50"
                disabled={days <= 1}
              >
                -
              </button>
              <button
                type="button"
                onClick={() => {
                  const newValue = Math.min(5, days + 1);
                  setDays(newValue);
                  handleInputChange("noOfDays", newValue);
                }}
                className="w-7 h-7 flex items-center justify-center text-green-600 
                bg-white rounded-full shadow-md hover:shadow-lg transition-all 
                border border-green-200 hover:bg-green-50"
                disabled={days >= 5}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Budget Options */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="my-3 text-xl font-medium text-gray-800">
            What is your budget?
          </h2>
          <div className="grid grid-cols-3 gap-5 mt-5">
            {SelectBudgetOptions.map((item, index) => (
              <div
                key={index}
                onClick={() => handleInputChange("budget", item.title)}
                className={`p-4 border cursor-pointer rounded-lg hover:shadow-lg transition-all
                ${
                  formData.budget === item.title
                    ? "border-green-500 bg-green-50 shadow-lg"
                    : "hover:border-green-200"
                }`}
              >
                <h2 className="text-4xl">{item.icon}</h2>
                <h2 className="text-lg font-bold text-gray-800">
                  {item.title}
                </h2>
                <h2 className="text-sm text-gray-500">{item.desc}</h2>
              </div>
            ))}
          </div>
        </div>

        {/* Travelers Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="my-3 text-xl font-medium text-gray-800">
            Who do you plan on travelling with?
          </h2>
          <div className="grid grid-cols-4 gap-5 mt-5">
            {SelectTravelesList.map((item, index) => (
              <div
                key={index}
                onClick={() => handleInputChange("traveller", item.people)}
                className={`p-4 border cursor-pointer rounded-lg hover:shadow-lg transition-all
                ${
                  formData.traveller === item.people
                    ? "border-green-500 bg-green-50 shadow-lg"
                    : "hover:border-green-200"
                }`}
              >
                <h2 className="text-4xl">{item.icon}</h2>
                <h2 className="text-lg font-bold text-gray-800">
                  {item.title}
                </h2>
                <h2 className="text-sm text-gray-500">{item.desc}</h2>
              </div>
            ))}
          </div>
        </div>

        {/* Activity section */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="my-3 text-xl font-medium text-gray-800">
            What type of activities do you enjoy?
          </h2>
          <div className="grid grid-cols-3 gap-5 mt-5">
            {SelectActivitiesOptions.map((item, index) => (
              <div
                key={index}
                onClick={() => {
                  const currentActivities = formData.activities || [];
                  if (currentActivities.includes(item.title)) {
                    // Remove activity if already selected
                    handleInputChange(
                      "activities",
                      currentActivities.filter(
                        (activity) => activity !== item.title
                      )
                    );
                  } else {
                    // Add activity if not selected
                    handleInputChange("activities", [
                      ...currentActivities,
                      item.title,
                    ]);
                  }
                }}
                className={`p-4 border cursor-pointer rounded-lg hover:shadow-lg transition-all
        ${
          formData.activities && formData.activities.includes(item.title)
            ? "border-green-500 bg-green-50 shadow-lg"
            : "hover:border-green-200"
        }`}
              >
                <h2 className="text-4xl">{item.icon}</h2>
                <h2 className="text-lg font-bold text-gray-800">
                  {item.title}
                </h2>
                <h2 className="text-sm text-gray-500">{item.desc}</h2>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Generate Trip Button */}
      <div className="my-10 flex justify-center">
        <Button
          onClick={OnGenerateTrip}
          disabled={loading}
          className={`px-8 py-3 rounded-lg text-lg font-semibold transition-all shadow-lg hover:shadow-xl
          ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Generating...
            </div>
          ) : (
            "Generate Trip"
          )}
        </Button>
      </div>
    </div>
  );
}

export default CreateTrip;
