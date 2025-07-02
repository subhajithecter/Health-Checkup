import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [symptoms, setSymptoms] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("");
  const [location, setLocation] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Convert image to base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove the data:image/jpeg;base64, prefix
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Handle image upload
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle diagnosis submission
  const handleDiagnosis = async () => {
    if (!symptoms.trim()) {
      alert("Please describe your symptoms");
      return;
    }

    setLoading(true);
    try {
      let imageBase64 = null;
      if (selectedImage) {
        imageBase64 = await convertToBase64(selectedImage);
      }

      const response = await axios.post(`${API}/diagnose`, {
        symptoms,
        patient_age: patientAge ? parseInt(patientAge) : null,
        patient_gender: patientGender || null,
        location: location || null,
        image_base64: imageBase64
      });

      setDiagnosis(response.data);
      fetchHistory(); // Refresh history
    } catch (error) {
      console.error("Error getting diagnosis:", error);
      alert("Error getting diagnosis. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch diagnosis history
  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API}/history`);
      setHistory(response.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  // Clear form
  const clearForm = () => {
    setSymptoms("");
    setPatientAge("");
    setPatientGender("");
    setLocation("");
    setSelectedImage(null);
    setImagePreview(null);
    setDiagnosis(null);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-indigo-600 rounded-full p-3">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Remote Diagnosis</h1>
                <p className="text-gray-600">AI-Powered Medical Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {showHistory ? "New Diagnosis" : "View History"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showHistory ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Form */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Describe Your Symptoms</h2>
              
              {/* Patient Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                  <input
                    type="number"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter age"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Location (Optional)</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="City, State"
                />
              </div>

              {/* Symptoms */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Symptoms</label>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-32 resize-none"
                  placeholder="Describe your symptoms in detail..."
                />
              </div>

              {/* Image Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Medical Image (Optional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-indigo-600 font-medium">Upload medical image</span>
                    <p className="text-gray-500 text-sm mt-1">PNG, JPG, JPEG up to 10MB</p>
                  </label>
                </div>
                {imagePreview && (
                  <div className="mt-4">
                    <img src={imagePreview} alt="Preview" className="max-w-full h-48 object-cover rounded-lg mx-auto" />
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={handleDiagnosis}
                  disabled={loading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    "Get Diagnosis"
                  )}
                </button>
                <button
                  onClick={clearForm}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Diagnosis Results</h2>
              
              {diagnosis ? (
                <div className="space-y-6">
                  {/* Diagnosis */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Preliminary Diagnosis</h3>
                    <p className="text-blue-800">{diagnosis.diagnosis}</p>
                  </div>

                  {/* Medicines */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-green-900 mb-2">Recommended Medicines</h3>
                    <ul className="list-disc list-inside text-green-800 space-y-1">
                      {diagnosis.medicines.map((medicine, index) => (
                        <li key={index}>{medicine}</li>
                      ))}
                    </ul>
                    <div className="mt-3 p-3 bg-green-100 rounded">
                      <p className="text-sm text-green-700"><strong>Timing:</strong> {diagnosis.medicine_timing}</p>
                    </div>
                  </div>

                  {/* Diet */}
                  <div className="bg-orange-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-orange-900 mb-2">Diet Recommendations</h3>
                    <ul className="list-disc list-inside text-orange-800 space-y-1">
                      {diagnosis.diet_recommendations.map((diet, index) => (
                        <li key={index}>{diet}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Pharmacies */}
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-purple-900 mb-2">Where to Buy Medicines</h3>
                    <ul className="list-disc list-inside text-purple-800 space-y-1">
                      {diagnosis.nearby_pharmacies.map((pharmacy, index) => (
                        <li key={index}>{pharmacy}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Doctors */}
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-indigo-900 mb-2">Recommended Specialists</h3>
                    <ul className="list-disc list-inside text-indigo-800 space-y-1">
                      {diagnosis.recommended_doctors.map((doctor, index) => (
                        <li key={index}>{doctor}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Disclaimer */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-red-900 mb-2">⚠️ Important Disclaimer</h3>
                    <p className="text-red-800 text-sm">{diagnosis.disclaimer}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500 text-lg">Enter your symptoms to get a diagnosis</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* History View */
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Diagnosis History</h2>
            
            {history.length > 0 ? (
              <div className="space-y-6">
                {history.map((item, index) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Diagnosis #{history.length - index}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Symptoms:</p>
                        <p className="text-gray-600">{item.symptoms}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700">Diagnosis:</p>
                        <p className="text-gray-600">{item.diagnosis}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700">Medicines:</p>
                        <ul className="text-gray-600 text-sm">
                          {item.medicines.map((medicine, medIndex) => (
                            <li key={medIndex}>• {medicine}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No diagnosis history found</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;