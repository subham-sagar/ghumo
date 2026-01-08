import React, { useState, useEffect } from "react";
import {
  MapPin,
  Clock,
  IndianRupeeIcon,
  Star,
  Calendar,
  Users,
  Wallet,
  ChevronRight,
} from "lucide-react";

const ViewTrip = () => {
  const [tripData, setTripData] = useState(null);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(0);

  useEffect(() => {
    loadTripData();
  }, []);

  const loadTripData = () => {
    const storedTripData = localStorage.getItem("tripData");
    const storedFormData = localStorage.getItem("tripFormData");

    if (storedTripData && storedFormData) {
      try {
        const parsedTripData = JSON.parse(storedTripData);
        const parsedFormData = JSON.parse(storedFormData);
        setTripData(parsedTripData);
        setFormData(parsedFormData);
      } catch (error) {
        console.error("Error parsing stored data:", error);
      }
    }
    setLoading(false);
  };

  // Process and deduplicate itinerary data
  const processItineraryData = (rawItinerary) => {
    if (!rawItinerary || !Array.isArray(rawItinerary)) return [];

    const dayMap = new Map();

    rawItinerary.forEach((dayData, index) => {
      let dayNumber = index + 1;
      const dayString = dayData.day || `Day ${dayNumber}`;

      const dayMatch = dayString.match(/(\d+)/);
      if (dayMatch) {
        dayNumber = parseInt(dayMatch[1]);
      }

      const dayKey = `day${dayNumber}`;

      if (!dayMap.has(dayKey)) {
        dayMap.set(dayKey, {
          day: `Day ${dayNumber}`,
          bestTimeToVisit: dayData.bestTimeToVisit || "Full Day",
          theme: dayData.theme || "Exploration",
          activities: [...(dayData.activities || [])],
        });
      } else {
        const existingDay = dayMap.get(dayKey);
        existingDay.activities = [
          ...existingDay.activities,
          ...(dayData.activities || []),
        ];
      }
    });

    return Array.from(dayMap.values()).sort((a, b) => {
      const aNum = parseInt(a.day.match(/(\d+)/)?.[1] || 0);
      const bNum = parseInt(b.day.match(/(\d+)/)?.[1] || 0);
      return aNum - bNum;
    });
  };

  const processedItinerary = tripData
    ? processItineraryData(tripData.itinerary)
    : [];
  const safeSelectedDay = Math.max(
    0,
    Math.min(selectedDay, processedItinerary.length - 1)
  );

  useEffect(() => {
    if (
      processedItinerary.length > 0 &&
      selectedDay >= processedItinerary.length
    ) {
      setSelectedDay(0);
    }
  }, [processedItinerary.length, selectedDay]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your amazing trip...</p>
        </div>
      </div>
    );
  }

  if (!tripData || !formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md mx-4">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🗺️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            No Trip Data Found
          </h2>
          <p className="text-gray-600 mb-6">
            Please generate a trip first to view your itinerary.
          </p>
          <button
            onClick={() => (window.location.href = "/create-trip")}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Create New Trip
          </button>
        </div>
      </div>
    );
  }

  const placeName =
    formData.place?.name ||
    formData.place?.formatted_address ||
    "Your Destination";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section - Centered */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Your Trip to {placeName}
          </h1>

          <div className="flex flex-wrap gap-6 justify-center text-green-100">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">{formData.noOfDays} Days</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <Users className="w-5 h-5" />
              <span className="font-medium">{formData.traveller}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <Wallet className="w-5 h-5" />
              <span className="font-medium">{formData.budget}</span>
            </div>
            {formData.travelDate && (
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                <Calendar className="w-5 h-5" />
                <span className="font-medium">
                  {new Date(formData.travelDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hotels Section - Centered */}

        {tripData.hotels && tripData.hotels.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
              🏨 Recommended Hotels
            </h2>
            <div className="flex justify-center px-4">
              <div
                className={`grid gap-6 w-full max-w-6xl ${
                  tripData.hotels.length === 1
                    ? "grid-cols-1 max-w-sm"
                    : tripData.hotels.length === 2
                    ? "grid-cols-1 md:grid-cols-2 max-w-2xl"
                    : tripData.hotels.length === 3
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-4xl"
                    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                }`}
              >
                {tripData.hotels.map((hotel, index) => (
                  <div
                    key={`hotel-${index}`}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 mx-auto w-full max-w-sm"
                  >
                    <div className="relative">
                      <img
                        src={
                          hotel.hotelImageUrl ||
                          "https://images.unsplash.com/photo-1566073771259-6a8506099945"
                        }
                        alt={hotel.hotelName || "Hotel"}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          e.target.src =
                            "https://images.unsplash.com/photo-1566073771259-6a8506099945";
                        }}
                      />
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-bold text-gray-800">
                          {hotel.rating}
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-3">
                        {hotel.hotelName}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                        {hotel.hotelAddress}
                      </p>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1 text-green-600 font-bold text-lg">
                          <IndianRupeeIcon className="w-5 h-5" />
                          <span>{hotel.price}</span>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {hotel.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Itinerary Section - Centered */}
        {processedItinerary.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
              📅 Your {formData.noOfDays}-Day Adventure
            </h2>

            {/* Day Selector - Centered */}
            <div className="flex justify-center mb-10">
              <div className="flex flex-wrap gap-3 bg-white p-6 rounded-xl shadow-lg">
                {processedItinerary.map((day, index) => (
                  <button
                    key={`day-selector-${index}`}
                    onClick={() => setSelectedDay(index)}
                    className={`px-6 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 min-w-[120px] ${
                      safeSelectedDay === index
                        ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg transform scale-105"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md hover:transform hover:scale-105"
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    {day.day}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Day Content - Centered */}
            {processedItinerary[safeSelectedDay] && (
              <div className="flex justify-center">
                <div className="bg-white rounded-xl shadow-xl overflow-hidden max-w-5xl w-full">
                  {/* Day Header - Centered */}
                  <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-8 text-center">
                    <h3 className="text-4xl font-bold mb-3">
                      {processedItinerary[safeSelectedDay].day}
                    </h3>
                    {processedItinerary[safeSelectedDay].theme && (
                      <p className="text-green-100 text-xl font-medium mb-4">
                        🎯 {processedItinerary[safeSelectedDay].theme}
                      </p>
                    )}
                    <div className="inline-block bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
                      <p className="text-lg font-semibold">
                        ⏰ Best Time:{" "}
                        {processedItinerary[safeSelectedDay].bestTimeToVisit}
                      </p>
                    </div>
                  </div>

                  {/* Activities - No numbering */}
                  <div className="p-8 space-y-10">
                    {processedItinerary[safeSelectedDay].activities?.map(
                      (activity, actIndex) => (
                        <div
                          key={`activity-${actIndex}`}
                          className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 hover:shadow-lg transition-all duration-300 border border-gray-100"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-start gap-8">
                            <div className="lg:w-1/3">
                              <img
                                src={
                                  activity.placeImageUrl ||
                                  "https://images.unsplash.com/photo-1564507592333-c60657eea523"
                                }
                                alt={activity.placeName || "Activity"}
                                className="w-full h-56 object-cover rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
                                onError={(e) => {
                                  e.target.src =
                                    "https://images.unsplash.com/photo-1564507592333-c60657eea523";
                                }}
                              />
                            </div>

                            <div className="lg:w-2/3">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6">
                                <h4 className="text-2xl font-bold text-gray-800 mb-2 sm:mb-0">
                                  {activity.placeName}
                                </h4>
                                {activity.time && (
                                  <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full border-2 border-green-200">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-sm font-bold">
                                      {activity.time}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <p className="text-gray-700 mb-8 leading-relaxed text-lg">
                                {activity.placeDetails}
                              </p>

                              <div className="grid sm:grid-cols-2 gap-6 mb-6">
                                <div className="flex items-center gap-4 p-4 bg-white rounded-xl border-2 border-green-100 hover:border-green-200 transition-colors">
                                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <IndianRupeeIcon className="w-6 h-6 text-green-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500 font-medium">
                                      Price
                                    </p>
                                    <p className="font-bold text-gray-800 text-lg">
                                      {activity.ticketPricing}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-white rounded-xl border-2 border-blue-100 hover:border-blue-200 transition-colors">
                                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500 font-medium">
                                      Duration
                                    </p>
                                    <p className="font-bold text-gray-800 text-lg">
                                      {activity.timeToTravel}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {activity.tips && (
                                <div className="mt-6 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 rounded-xl">
                                  <p className="text-yellow-800 leading-relaxed">
                                    <strong className="text-lg">
                                      💡 Pro Tip:
                                    </strong>{" "}
                                    {activity.tips}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  {/* Day Navigation - Centered */}
                  <div className="flex justify-center items-center bg-gray-50 p-6 border-t gap-8">
                    <button
                      onClick={() =>
                        setSelectedDay(Math.max(0, selectedDay - 1))
                      }
                      disabled={selectedDay === 0}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                        selectedDay === 0
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg"
                      }`}
                    >
                      ← Previous Day
                    </button>

                    <span className="text-gray-600 font-semibold text-lg">
                      Day {selectedDay + 1} of {processedItinerary.length}
                    </span>

                    <button
                      onClick={() =>
                        setSelectedDay(
                          Math.min(
                            processedItinerary.length - 1,
                            selectedDay + 1
                          )
                        )
                      }
                      disabled={selectedDay === processedItinerary.length - 1}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                        selectedDay === processedItinerary.length - 1
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg"
                      }`}
                    >
                      Next Day →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Trip Summary - Centered */}
        <div className="flex justify-center">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-4xl w-full">
            <h3 className="text-3xl font-bold text-gray-800 mb-8 text-center">
              📊 Trip Summary
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-8 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border-2 border-green-200 hover:shadow-lg transition-shadow">
                <div className="text-4xl font-bold text-green-600 mb-3">
                  {formData.noOfDays}
                </div>
                <div className="text-gray-600 font-semibold text-lg">Days</div>
              </div>
              <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200 hover:shadow-lg transition-shadow">
                <div className="text-4xl font-bold text-blue-600 mb-3">
                  {tripData.hotels?.length || 0}
                </div>
                <div className="text-gray-600 font-semibold text-lg">
                  Hotels
                </div>
              </div>
              <div className="text-center p-8 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border-2 border-purple-200 hover:shadow-lg transition-shadow">
                <div className="text-4xl font-bold text-purple-600 mb-3">
                  {processedItinerary.reduce(
                    (total, day) => total + (day.activities?.length || 0),
                    0
                  )}
                </div>
                <div className="text-gray-600 font-semibold text-lg">
                  Activities
                </div>
              </div>
              <div className="text-center p-8 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border-2 border-orange-200 hover:shadow-lg transition-shadow">
                <div className="text-4xl font-bold text-orange-600 mb-3">
                  {formData.activities?.length || 0}
                </div>
                <div className="text-gray-600 font-semibold text-lg">
                  Interests
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewTrip;
