"use client";

import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { it } from "date-fns/locale";
import { useState, useCallback, useMemo } from "react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "@/styles/calendar.css";
import { EVENT_CALENDAR_TYPE_HEX_COLORS } from "@/lib/colors";
import { useRouter } from "next/navigation";

// Configure date-fns localizer with Italian locale
const locales = {
  it: it,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface Event {
  id: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date | null;
  allDay: boolean;
  location: string | null;
  calendarType: "personal" | "work" | "family" | "other";
  project?: {
    id: string;
    name: string;
    color: string | null;
  } | null;
}

interface EventCalendarProps {
  events: Event[];
  onSelectSlot?: (start: Date, end: Date, allDay: boolean) => void;
}

// react-big-calendar event types
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: Event;
}

interface SlotInfo {
  start: Date | string;
  end: Date | string;
  action: "select" | "click" | "doubleClick";
}

export function EventCalendar({ events, onSelectSlot }: EventCalendarProps) {
  const router = useRouter();
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());

  // Transform events to react-big-calendar format
  const calendarEvents = useMemo(
    () =>
      events.map((event) => ({
        id: event.id,
        title: event.title,
        start: new Date(event.startTime),
        end: event.endTime ? new Date(event.endTime) : new Date(event.startTime),
        allDay: event.allDay,
        resource: event, // Store full event data
      })),
    [events]
  );

  // Handle event click - navigate to event detail page
  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      router.push(`/dashboard/events/${event.id}`);
    },
    [router]
  );

  // Handle slot selection (click on calendar to create event)
  const handleSelectSlot = useCallback(
    ({ start, end, action }: SlotInfo) => {
      if (action === "select" || action === "click") {
        const allDay = action === "select" && view === "month";
        const startDate = start instanceof Date ? start : new Date(start);
        const endDate = end instanceof Date ? end : new Date(end);
        if (onSelectSlot) {
          onSelectSlot(startDate, endDate, allDay);
        } else {
          // Navigate to create event page with date pre-filled
          const params = new URLSearchParams({
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
            allDay: allDay.toString(),
          });
          router.push(`/dashboard/events/new?${params}`);
        }
      }
    },
    [onSelectSlot, router, view]
  );

  // Custom event styling based on calendar type
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const calendarType = event.resource?.calendarType || "other";
    const backgroundColor = EVENT_CALENDAR_TYPE_HEX_COLORS[calendarType];

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block",
      },
    };
  }, []);

  // Custom toolbar messages in Italian
  const messages = {
    today: "Oggi",
    previous: "Indietro",
    next: "Avanti",
    month: "Mese",
    week: "Settimana",
    day: "Giorno",
    agenda: "Agenda",
    date: "Data",
    time: "Ora",
    event: "Evento",
    allDay: "Tutto il giorno",
    work_week: "Settimana lavorativa",
    yesterday: "Ieri",
    tomorrow: "Domani",
    noEventsInRange: "Nessun evento in questo periodo",
    showMore: (total: number) => `+${total} altri`,
  };

  return (
    <div className="h-[calc(100vh-280px)] min-h-[600px] bg-card border border-border rounded-lg p-6">
      <Calendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        eventPropGetter={eventStyleGetter}
        selectable
        popup
        messages={messages}
        views={["month", "week", "day", "agenda"]}
        culture="it"
      />
    </div>
  );
}
