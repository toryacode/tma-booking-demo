import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyBookings } from '../api/bookings';
import BookingStatusChip from '../components/booking/BookingStatusChip';
import PageReveal from '../components/ui/PageReveal';

interface Booking {
  id: number;
  service?: { name?: string; duration?: number; price?: number; description?: string };
  employee?: { name?: string; bio?: string; avatar?: string };
  start_time: string;
  end_time?: string;
  status: string;
}

interface BookingSection {
  key: 'scheduled' | 'completed' | 'canceled';
  title: string;
  bookings: Booking[];
}

const normalizeStatus = (status: string) => status.trim().toLowerCase().replace(' ', '_');
const ACTIVE_STATUSES = ['scheduled', 'upcoming', 'upcomming', 'in_progress', 'in progress'];
const SECTION_PANEL_DURATION_MS = 420;

const History = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openSections, setOpenSections] = useState<Record<BookingSection['key'], boolean>>({
    scheduled: true,
    completed: false,
    canceled: false,
  });
  const [sectionContentVisible, setSectionContentVisible] = useState<Record<BookingSection['key'], boolean>>({
    scheduled: false,
    completed: false,
    canceled: false,
  });
  const [sectionHeights, setSectionHeights] = useState<Record<BookingSection['key'], number>>({
    scheduled: 0,
    completed: 0,
    canceled: 0,
  });
  const sectionContentRefs = useRef<Record<BookingSection['key'], HTMLDivElement | null>>({
    scheduled: null,
    completed: null,
    canceled: null,
  });

  useEffect(() => {
    setLoading(true);
    getMyBookings()
      .then(setBookings)
      .catch(err => {
        console.error('Failed to fetch bookings', err);
        setError('Unable to load bookings, check API or network.');
      })
      .finally(() => setLoading(false));
  }, []);

  const now = Date.now();
  const sortedBookings = [...bookings].sort((a, b) => {
    const aTime = new Date(a.start_time).getTime();
    const bTime = new Date(b.start_time).getTime();
    const aDistance = Math.abs(aTime - now);
    const bDistance = Math.abs(bTime - now);

    if (aDistance !== bDistance) {
      return aDistance - bDistance;
    }

    return aTime - bTime;
  });

  const sections: BookingSection[] = [
    {
      key: 'scheduled',
      title: 'Scheduled',
      bookings: sortedBookings.filter(booking => ACTIVE_STATUSES.includes(normalizeStatus(booking.status))),
    },
    {
      key: 'completed',
      title: 'Completed',
      bookings: sortedBookings.filter(booking => normalizeStatus(booking.status) === 'completed'),
    },
    {
      key: 'canceled',
      title: 'Canceled',
      bookings: sortedBookings.filter(booking => {
        const status = normalizeStatus(booking.status);
        return status === 'cancelled' || status === 'canceled';
      }),
    },
  ];

  const toggleSection = (sectionKey: BookingSection['key']) => {
    setOpenSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  useLayoutEffect(() => {
    setSectionHeights({
      scheduled: openSections.scheduled ? (sectionContentRefs.current.scheduled?.offsetHeight ?? 0) : 0,
      completed: openSections.completed ? (sectionContentRefs.current.completed?.offsetHeight ?? 0) : 0,
      canceled: openSections.canceled ? (sectionContentRefs.current.canceled?.offsetHeight ?? 0) : 0,
    });
  }, [openSections, bookings]);

  useEffect(() => {
    const timers: number[] = [];

    (Object.keys(openSections) as BookingSection['key'][]).forEach((key) => {
      if (!openSections[key]) {
        setSectionContentVisible((prev) => ({ ...prev, [key]: false }));
        return;
      }

      const frameId = window.requestAnimationFrame(() => {
        const timerId = window.setTimeout(() => {
          setSectionContentVisible((prev) => ({ ...prev, [key]: true }));
        }, 90);
        timers.push(timerId);
      });

      timers.push(frameId);
    });

    return () => {
      timers.forEach((id) => {
        window.clearTimeout(id);
        window.cancelAnimationFrame(id);
      });
    };
  }, [openSections]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 dark:from-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-3xl px-4">
        <PageReveal delay={0}>
          <div className="mb-5">
            <h1 className="mb-3 text-3xl font-bold text-slate-800 dark:text-slate-100">My Bookings</h1>
            <button onClick={() => navigate('/')} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
              ← Back
            </button>
          </div>
        </PageReveal>

        {loading && (
          <PageReveal delay={90}>
            <p className="rounded-3xl bg-white/80 p-6 text-center text-slate-500 shadow-lg dark:bg-slate-800/80 dark:text-slate-300">Loading bookings...</p>
          </PageReveal>
        )}
        {error && (
          <PageReveal delay={90}>
            <p className="rounded-3xl bg-rose-50 p-6 text-center text-rose-700 shadow-lg dark:bg-rose-900/30 dark:text-rose-200">{error}</p>
          </PageReveal>
        )}

        {!loading && !error && bookings.length === 0 && (
          <PageReveal delay={90}>
            <div className="rounded-3xl bg-white/90 p-6 text-center text-slate-600 shadow-lg dark:bg-slate-800 dark:text-slate-300">No bookings yet. Book your first service today!</div>
          </PageReveal>
        )}

        {!loading && !error && bookings.length > 0 && (
          <div className="space-y-4">
            {sections.map((section, index) => (
              <PageReveal key={section.key} delay={90 + index * 70}>
                <div className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-lg dark:border-slate-700 dark:bg-slate-800/95">
                  <button
                    type="button"
                    onClick={() => toggleSection(section.key)}
                    className="flex w-full items-center justify-between rounded-2xl px-2 py-1 text-left"
                  >
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{section.title}</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-300">{section.bookings.length} booking{section.bookings.length === 1 ? '' : 's'}</p>
                    </div>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
                      <svg
                        className={`h-4 w-4 transition-transform ${openSections[section.key] ? 'rotate-180' : 'rotate-0'}`}
                        viewBox="0 0 20 20"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path d="M5 8L10 13L15 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </button>

                  <div
                    className="overflow-hidden transition-[height,opacity,margin] ease-out"
                    style={{
                      height: `${sectionHeights[section.key]}px`,
                      opacity: openSections[section.key] ? 1 : 0,
                      marginTop: openSections[section.key] ? '12px' : '0px',
                      transitionDuration: `${SECTION_PANEL_DURATION_MS}ms`,
                    }}
                    aria-hidden={!openSections[section.key]}
                  >
                    <div
                      ref={(node) => {
                        sectionContentRefs.current[section.key] = node;
                      }}
                      className="space-y-3"
                    >
                      {section.bookings.length === 0 && (
                        <p
                          className={`rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 transition-all ease-out dark:border-slate-600 dark:bg-slate-700/40 dark:text-slate-300 ${sectionContentVisible[section.key] ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
                          style={{ transitionDuration: `${SECTION_PANEL_DURATION_MS}ms`, transitionDelay: '60ms' }}
                        >
                          No bookings in this section.
                        </p>
                      )}

                      {section.bookings.map((booking, bookingIndex) => (
                        <Link
                          key={booking.id}
                          to={`/bookings/${booking.id}`}
                          state={{ booking }}
                          className={`block rounded-3xl bg-slate-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-700/60 ${sectionContentVisible[section.key] ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
                          style={{
                            transitionProperty: 'opacity, transform, box-shadow',
                            transitionDuration: `${SECTION_PANEL_DURATION_MS}ms`,
                            transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                            transitionDelay: `${80 + Math.min(bookingIndex, 6) * 70}ms`,
                          }}
                        >
                          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{booking.service?.name || 'Unknown Service'}</h3>
                          <p className="text-slate-500 dark:text-slate-300">with {booking.employee?.name || 'Unknown Specialist'}</p>
                          <p className="mt-1 text-slate-500 dark:text-slate-300">{new Date(booking.start_time).toLocaleString()}</p>
                          <div className="mt-3">
                            <BookingStatusChip status={booking.status} />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </PageReveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;