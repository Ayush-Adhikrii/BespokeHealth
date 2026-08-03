import { useState, useEffect } from "react";
import ConfirmModal from "../common/ConfirmModal";

const daysOfWeek = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
];

const AvailabilityScheduler = ({ availabilities = [], onSave }) => {
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [slotPendingRemoval, setSlotPendingRemoval] = useState(null);

  
  useEffect(() => {
    const formattedSchedules = availabilities.map((slot) => ({
      id: slot.id,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
    }));

    setSchedules(formattedSchedules.length > 0 ? formattedSchedules : [getEmptySlot()]);
  }, [availabilities]);

  
  const getEmptySlot = () => ({
    id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    day_of_week: 1,
    start_time: "09:00",
    end_time: "17:00",
  });

  
  const handleAddSlot = () => {
    setSchedules([...schedules, getEmptySlot()]);
  };

  
  const handleRemoveSlot = (id) => {
    setSlotPendingRemoval(schedules.find((slot) => slot.id === id) || null);
  };

  const confirmRemoveSlot = () => {
    setSchedules(schedules.filter((slot) => slot.id !== slotPendingRemoval.id));
    setSlotPendingRemoval(null);
  };

  
  const handleSlotChange = (id, field, value) => {
    setSchedules(
      schedules.map((slot) =>
        slot.id === id ? { ...slot, [field]: value } : slot
      )
    );
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    
    for (const slot of schedules) {
      if (!slot.day_of_week || !slot.start_time || !slot.end_time) {
        alert("All fields are required for each time slot.");
        return;
      }
      
      if (slot.start_time >= slot.end_time) {
        alert("End time must be after start time.");
        return;
      }
    }
    
    setIsLoading(true);
    try {
      
      const availabilityData = schedules.map(({ day_of_week, start_time, end_time }) => ({
        day_of_week: parseInt(day_of_week),
        start_time,
        end_time
      }));
      
      await onSave(availabilityData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Set Your Weekly Availability
      </h2>
      
     
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 mb-6">
          {schedules.map((slot) => (
            <div
              key={slot.id}
              className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-gray-50 rounded-lg relative"
            >
              <div className="sm:w-1/3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Day
                </label>
                <select
                  value={slot.day_of_week}
                  onChange={(e) =>
                    handleSlotChange(slot.id, "day_of_week", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  {daysOfWeek.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="sm:w-1/4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={slot.start_time}
                  onChange={(e) =>
                    handleSlotChange(slot.id, "start_time", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="sm:w-1/4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={slot.end_time}
                  onChange={(e) =>
                    handleSlotChange(slot.id, "end_time", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {schedules.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveSlot(slot.id)}
                  className="sm:self-end mb-1 text-red-600 hover:text-red-800"
                  aria-label="Remove time slot"
                >
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <button
            type="button"
            onClick={handleAddSlot}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5 text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Add Time Slot
          </button>
        </div>
        
        <div className="border-t border-gray-200 pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
                Saving...
              </>
            ) : (
              "Save Availability"
            )}
          </button>
        </div>
      </form>

      {slotPendingRemoval && (
        <ConfirmModal
          title="Remove time slot?"
          message={`Remove ${daysOfWeek.find((d) => d.value === parseInt(slotPendingRemoval.day_of_week))?.label || "this"} ${slotPendingRemoval.start_time} - ${slotPendingRemoval.end_time}? This slot won't be available to patients until you add it back and save.`}
          confirmLabel="Remove"
          onConfirm={confirmRemoveSlot}
          onCancel={() => setSlotPendingRemoval(null)}
        />
      )}
    </div>
  );
};

export default AvailabilityScheduler;