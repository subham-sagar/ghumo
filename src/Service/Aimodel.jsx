import { GoogleGenerativeAI } from "@google/generative-ai";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Error types for better error handling
// Cache for storing successful responses
const responseCache = new Map();

const ErrorTypes = {
  API_KEY: 'API_KEY_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  RATE_LIMIT: 'RATE_LIMIT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  MODEL_ERROR: 'MODEL_ERROR',
  PARTIAL_SUCCESS: 'PARTIAL_SUCCESS'
};

// Helper function to generate cache key
const generateCacheKey = (params) => {
  const { destination, days, budget, activities, travellers } = params;
  return `${destination}_${days}_${budget}_${activities?.join('.')}_${travellers}`;
};

// Helper function to generate content with timeout and retries
const generateWithTimeout = async (model, prompt, timeout, maxAttempts = 3) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(ErrorTypes.TIMEOUT)), timeout);
      });

      const result = await Promise.race([
        model.generateContent(prompt),
        timeoutPromise
      ]);

      if (!result) {
        throw new Error(ErrorTypes.SERVICE_UNAVAILABLE);
      }

      const text = result.response.text();
      if (!text || text.trim().length === 0) {
        throw new Error(ErrorTypes.INVALID_RESPONSE);
      }

      return text;
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await delay(1000 * attempt); // Progressive delay between attempts
    }
  }
};


// Helper function to parse JSON safely with validation
const parseJSON = (text, expectedKeys = []) => {
  try {
    // Clean the response to extract JSON
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}') + 1;

    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error('No valid JSON found in response');
    }

    const jsonStr = cleaned.slice(jsonStart, jsonEnd);
    const parsed = JSON.parse(jsonStr);

    // Validate expected keys
    if (expectedKeys.length > 0) {
      const missingKeys = expectedKeys.filter(key => !parsed[key]);
      if (missingKeys.length > 0) {
        throw new Error(`Missing required keys: ${missingKeys.join(', ')}`);
      }
    }

    return parsed;
  } catch (error) {
    throw new Error(`${ErrorTypes.INVALID_RESPONSE}: ${error.message}`);
  }
};

// Helper function to batch process with progressive timeouts
const batchProcess = async (tasks, initialTimeout, maxTimeout) => {
  const results = [];
  let timeout = initialTimeout;

  for (const task of tasks) {
    try {
      const result = await Promise.race([
        task(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(ErrorTypes.TIMEOUT)), timeout)
        )
      ]);
      results.push({ success: true, data: result });
      // Reset timeout on success
      timeout = initialTimeout;
    } catch (error) {
      results.push({ success: false, error });
      // Increase timeout progressively, but cap it
      timeout = Math.min(timeout * 1.5, maxTimeout);
      await delay(1000); // Brief delay between retries
    }
  }

  return results;
};// Helper function to check network connectivity
const checkConnectivity = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    await fetch('https://www.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return true;
  } catch (error) {
    return false;
  }
};

const GetTravelPlan = async (formData) => {
  const maxRetries = 7; // Increased to 7 for more attempts
  const baseDelay = 3000; // Increased to 3 seconds
  const timeout = 60000; // Increased to 60 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Initialize Gemini AI
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-pro",
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        }
      });

      // Extract travel details
      const destination = formData.place?.name || formData.place?.formatted_address || formData.place;
      const days = formData.noOfDays;
      const budget = formData.budget;
      const travellers = formData.traveller;
      const activities = formData.activities?.join(", ");
      const travelDate = formData.travelDate;

      // Create base prompt for reuse
      const basePrompt = `Travel requirements for ${destination}:
    - Budget: ${budget} per person
    - Group: ${travellers}
    - Activities: ${activities}
    - Date: ${travelDate ? new Date(travelDate).toLocaleDateString() : 'Flexible'}`;

      try {
        // Check cache first
        const cacheKey = generateCacheKey({
          destination,
          days,
          budget,
          activities: formData.activities,
          travellers
        });

        const cachedResult = responseCache.get(cacheKey);
        if (cachedResult) {
          console.log('Using cached response');
          return cachedResult;
        }

        // Prepare all tasks
        const tasks = [
          // Hotels task
          async () => {
            const hotelText = await generateWithTimeout(model, `${basePrompt}
              Suggest 2-3 specific hotels in ${destination} that match the budget of ${budget} per person.
              Return ONLY valid JSON with this structure:
              {
                "hotels": [
                  {
                    "hotelName": "Actual hotel name",
                    "hotelAddress": "Complete address",
                    "price": "Price per night in INR",
                    "rating": "4.5",
                    "description": "Brief description"
                  }
                ]
              }`, timeout, 3);
            return parseJSON(hotelText, ['hotels']);
          },
          // Day-by-day tasks
          ...Array.from({ length: days }, (_, i) => async () => {
            const dayText = await generateWithTimeout(model, `${basePrompt}
              Create a detailed plan for Day ${i + 1} of ${days} in ${destination}.
              Include 6-8 activities including meals.
              Focus on the following aspects:
              - Activities: ${activities}
              - Budget range: ${budget} per person
              - Group size: ${travellers}

              Return ONLY valid JSON with this structure:
              {
                "day": ${i + 1},
                "activities": [
                  {
                    "time": "Time slot",
                    "placeName": "Specific place name",
                    "placeDetails": "Details",
                    "ticketPricing": "Cost details",
                    "timeToTravel": "Duration",
                    "tips": "Practical tip"
                  }
                ]
              }`, timeout, 3);
            return parseJSON(dayText, ['activities']);
          })
        ];

        // Process all tasks with progressive timeouts
        const results = await batchProcess(tasks, 20000, timeout);

        // Check if we have any successful results
        const successfulResults = results.filter(r => r.success);
        if (successfulResults.length === 0) {
          throw new Error(ErrorTypes.SERVICE_UNAVAILABLE);
        }

        // Construct response from successful results
        const response = {
          hotels: [],
          itinerary: []
        };

        // First result should be hotels
        if (results[0].success) {
          response.hotels = results[0].data.hotels;
        }

        // Remaining results are days
        for (let i = 1; i < results.length; i++) {
          if (results[i].success) {
            response.itinerary.push(results[i].data);
          }
        }

        // If we have partial success, store what we have
        if (response.hotels.length > 0 || response.itinerary.length > 0) {
          responseCache.set(cacheKey, response);

          // If we're missing some days but have others, throw partial success
          if (response.itinerary.length < days) {
            throw new Error(ErrorTypes.PARTIAL_SUCCESS);
          }
        }

        return response;
      } catch (error) {
        throw error; // Re-throw to be handled by outer try-catch
      }

    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);

      // Check network connectivity if we get a service error
      if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
        const isOnline = await checkConnectivity();
        if (!isOnline) {
          throw new Error('Please check your internet connection and try again.');
        }
      }

      // Determine error type with more specific error detection
      const errorType = error.message.includes('API key') ? ErrorTypes.API_KEY
        : error.message === ErrorTypes.TIMEOUT ? ErrorTypes.TIMEOUT
          : error.message === ErrorTypes.INVALID_RESPONSE ? ErrorTypes.INVALID_RESPONSE
            : error.message.includes('quota') || error.message.includes('rate') ? ErrorTypes.RATE_LIMIT
              : error.message.includes('network') || error.message.includes('fetch') ? ErrorTypes.NETWORK_ERROR
                : error.message.includes('model') || error.message.includes('safety') ? ErrorTypes.MODEL_ERROR
                  : ErrorTypes.SERVICE_UNAVAILABLE;      // Handle non-retryable errors immediately
      if (errorType === ErrorTypes.API_KEY) {
        throw new Error('Please configure your Google Gemini API key in .env file as VITE_GEMINI_API_KEY');
      }

      // If this was the last retry, provide a specific error message
      if (attempt === maxRetries) {
        let errorMessage = '';
        switch (errorType) {
          case ErrorTypes.TIMEOUT:
            errorMessage = 'The request is taking longer than expected. Please try with a shorter trip duration (2-3 days) or fewer activities.';
            break;
          case ErrorTypes.RATE_LIMIT:
            errorMessage = 'We\'ve hit our rate limit. Please wait 5-10 minutes before trying again.';
            break;
          case ErrorTypes.INVALID_RESPONSE:
            errorMessage = 'We received an invalid response. Try simplifying your requirements or selecting fewer activities.';
            break;
          case ErrorTypes.NETWORK_ERROR:
            errorMessage = 'We\'re having trouble connecting to the service. Please check your internet connection and try again.';
            break;
          case ErrorTypes.MODEL_ERROR:
            errorMessage = 'The AI model is having trouble processing your request. Try with simpler requirements or a different destination.';
            break;
          case ErrorTypes.PARTIAL_SUCCESS:
            const cached = responseCache.get(generateCacheKey({
              destination,
              days,
              budget,
              activities: formData.activities,
              travellers
            }));
            errorMessage = `We could only generate a partial trip plan. We've saved what we could generate (${cached?.itinerary?.length || 0} days). Would you like to view the partial plan or try again for a complete plan?`;
            break;
          default:
            errorMessage = 'The service is temporarily unavailable. We tried 7 times but couldn\'t generate your trip plan. Please wait 5-10 minutes and try again.';
        }
        throw new Error(errorMessage);
      }

      // Calculate exponential backoff delay with error-specific adjustments
      let backoffDelay = baseDelay * Math.pow(2, attempt - 1);

      // Adjust delay based on error type
      switch (errorType) {
        case ErrorTypes.RATE_LIMIT:
          backoffDelay *= 3; // Triple the delay for rate limit errors
          break;
        case ErrorTypes.NETWORK_ERROR:
          backoffDelay *= 1.5; // 50% increase for network errors
          break;
        case ErrorTypes.MODEL_ERROR:
          backoffDelay *= 2; // Double for model errors
          break;
        case ErrorTypes.SERVICE_UNAVAILABLE:
          backoffDelay *= 2.5; // 2.5x for service unavailability
          break;
      }

      // Add progressive jitter (increases with attempt number)
      const jitterPercent = 0.1 + (attempt * 0.05); // 10% + 5% per attempt
      const jitter = backoffDelay * jitterPercent;
      const totalDelay = backoffDelay + jitter; console.log(`Retrying in ${Math.round(totalDelay / 1000)} seconds... (Error type: ${errorType})`);
      await delay(totalDelay);
      // Continue to next retry iteration
      continue;
    }
  }
};

export default GetTravelPlan;