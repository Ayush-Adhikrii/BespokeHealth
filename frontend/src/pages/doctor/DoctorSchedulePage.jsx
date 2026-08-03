import { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import AppointmentService from "../../services/AppointmentService";
import { toast } from "sonner";
import "react-big-calendar/lib/css/react-big-calendar.css";


const localizer = momentLocalizer(moment);

const DoctorSchedulePage = () => {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState("month");

  
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        
        
        let startDate, endDate;
        if (currentView === "month") {
          startDate = moment(currentDate).startOf("month").toDate();
          endDate = moment(currentDate).endOf("month").toDate();
        } else {
          startDate = moment(currentDate).startOf("week").toDate();
          endDate = moment(currentDate).endOf("week").toDate();
        }
        
        const data = await AppointmentService.getDoctorSchedule(startDate, endDate);
        
        
        const appointmentEvents = [];
        Object.entries(data.schedule || {}).forEach(([date, dayData]) => {
          dayData.appointments.forEach(appt => {
            
            const startDateTime = new Date(`${date}T${appt.start_time}`);
            
            const endDateTime = appt.end_time 
              ? new Date(`${date}T${appt.end_time}`)
              : new Date(startDateTime.getTime() + 30 * 60000);
              
            appointmentEvents.push({
              id: appt.id,
              title: appt.patient.name,
              start: startDateTime,
              end: endDateTime,
              status: appt.status,
              paymentStatus: appt.payment_status,
              patientInfo: appt.patient,
              symptoms: appt.symptoms || "No symptoms recorded",
              notes: appt.notes
            });
          });
        });
        
        setAppointments(appointmentEvents);
      } catch (error) {
        toast.error("Failed to load schedule");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [currentDate, currentView]);

  
  const eventStyleGetter = (event) => {
    let backgroundColor = "#3174ad"; 
    
    if (event.status === "cancelled") {
      backgroundColor = "#e53e3e"; 
    } else if (event.status === "completed") {
      backgroundColor = "#38a169"; 
    } else if (event.status === "scheduled" && event.paymentStatus === "pending") {
      backgroundColor = "#ecc94b"; 
    }
    
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0',
        display: 'block'
      }
    };
  };

  
  const handleNavigate = (newDate) => {
    setCurrentDate(newDate);
  };

  
  const handleViewChange = (newView) => {
    setCurrentView(newView);
  };

  
  const EventComponent = ({ event }) => (
    <div className="text-xs overflow-hidden">
      <div className="font-medium">{event.title}</div>
      <div className="truncate">{event.symptoms}</div>
    </div>
  );

  
  const CustomToolbar = ({ label, onNavigate, onView }) => (
    <div className="flex justify-between items-center mb-4 p-2">
      <div>
        <button
          onClick={() => onNavigate('TODAY')}
          className="px-3 py-1 mr-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Today
        </button>
        <button
          onClick={() => onNavigate('PREV')}
          className="p-1 mr-1 rounded hover:bg-gray-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => onNavigate('NEXT')}
          className="p-1 rounded hover:bg-gray-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      <h2 className="text-xl font-semibold">{label}</h2>
      
      <div>
        <button
          onClick={() => onView('month')}
          className={`px-3 py-1 mr-2 rounded ${currentView === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          Month
        </button>
        <button
          onClick={() => onView('week')}
          className={`px-3 py-1 mr-2 rounded ${currentView === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          Week
        </button>
        <button
          onClick={() => onView('day')}
          className={`px-3 py-1 rounded ${currentView === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          Day
        </button>
      </div>
    </div>
  );

  
  const ScheduleLegend = () => (
    <div className="mb-4 flex flex-wrap gap-3">
      <div className="flex items-center">
        <div className="w-4 h-4 rounded mr-2" style={{backgroundColor: "#3174ad"}}></div>
        <span className="text-xs text-gray-600">Confirmed</span>
      </div>
      <div className="flex items-center">
        <div className="w-4 h-4 rounded mr-2" style={{backgroundColor: "#ecc94b"}}></div>
        <span className="text-xs text-gray-600">Pending Payment</span>
      </div>
      <div className="flex items-center">
        <div className="w-4 h-4 rounded mr-2" style={{backgroundColor: "#38a169"}}></div>
        <span className="text-xs text-gray-600">Completed</span>
      </div>
      <div className="flex items-center">
        <div className="w-4 h-4 rounded mr-2" style={{backgroundColor: "#e53e3e"}}></div>
        <span className="text-xs text-gray-600">Cancelled</span>
      </div>
    </div>
  );

  
  const handleSelectEvent = (event) => {
    toast(
      <div>
        <h3 className="font-medium text-gray-900">{event.title}</h3>
        <p className="text-sm mt-1">
          {moment(event.start).format('MMM D, YYYY')} • {moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}
        </p>
        <div className="mt-2">
          <div className="text-sm"><span className="font-medium">Status:</span> {event.status}</div>
          <div className="text-sm"><span className="font-medium">Payment:</span> {event.paymentStatus}</div>
          <div className="text-sm"><span className="font-medium">Symptoms:</span> {event.symptoms}</div>
          {event.notes && <div className="text-sm"><span className="font-medium">Notes:</span> {event.notes}</div>}
        </div>
      </div>,
      {
        description: "Appointment Details",
        action: {
          label: "View Details",
          onClick: () => {
            
            console.log(`Navigate to appointment ${event.id}`);
          }
        }
      }
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">My Schedule</h1>
        
        <ScheduleLegend />

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-4">
            <Calendar
              localizer={localizer}
              events={appointments}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 700 }}
              views={['month', 'week', 'day']}
              defaultView={currentView}
              onView={handleViewChange}
              defaultDate={currentDate}
              onNavigate={handleNavigate}
              eventPropGetter={eventStyleGetter}
              onSelectEvent={handleSelectEvent}
              components={{
                event: EventComponent,
                toolbar: CustomToolbar
              }}
              popup
              selectable
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorSchedulePage;