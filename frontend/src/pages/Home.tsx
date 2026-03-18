import { Link } from 'react-router-dom';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { getMyBookings, getMyReviews } from '../api/bookings';
import PageReveal from '../components/ui/PageReveal';

interface Booking {
  id: number;
  service?: { name?: string; duration?: number; price?: number; description?: string };
  employee?: { name?: string; bio?: string; avatar?: string };
  start_time: string;
  end_time?: string;
  status: string;
  is_loyalty_discount?: boolean;
}

interface UserReview {
  booking_id?: number;
  booking?: { id?: number };
}

const normalizeStatus = (status: string) => status.trim().toLowerCase().replace(' ', '_');

const formatBookingDateTime = (value: string) =>
  new Date(value).toLocaleString([], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

const getDaysUntil = (value: string) => {
  const now = new Date();
  const target = new Date(value);

  const nowDayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const targetDayStart = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const days = Math.round((targetDayStart - nowDayStart) / (1000 * 60 * 60 * 24));

  if (days <= 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
};

const HERO_TRANSITION_MS = 300;
const HERO_CONTENT_REVEAL_DELAY_MS = 75;
const HERO_BADGE_DELAY_MS = 110;
const HERO_TITLE_DELAY_MS = 110;
const HERO_DESCRIPTION_DELAY_MS = 150;
const HERO_ACTIONS_DELAY_MS = 225;

const Home = () => {
  const [nextBooking, setNextBooking] = useState<Booking | null>(null);
  const [lastCompletedBooking, setLastCompletedBooking] = useState<Booking | null>(null);
  const [lastCompletedNeedsReview, setLastCompletedNeedsReview] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [heroLoading, setHeroLoading] = useState(true);
  const [heroContentVisible, setHeroContentVisible] = useState(false);
  const [heroHeight, setHeroHeight] = useState(176);
  const skeletonMeasureRef = useRef<HTMLDivElement | null>(null);
  const contentMeasureRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadUpcomingBooking = async () => {
      setHeroLoading(true);
      try {
        const [bookings, reviews] = await Promise.all([
          getMyBookings() as Promise<Booking[]>,
          getMyReviews() as Promise<UserReview[]>,
        ]);
        const now = new Date();
        const upcoming = bookings
          .filter((booking) => {
            const status = normalizeStatus(booking.status);
            const start = new Date(booking.start_time).getTime();
            const isFuture = start > now.getTime();
            return isFuture && (status === 'scheduled' || status === 'upcoming' || status === 'upcomming');
          })
          .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0] || null;

        const reviewedBookingIds = new Set(
          (reviews || [])
            .map((review) => review.booking_id || review.booking?.id)
            .filter((id): id is number => typeof id === 'number'),
        );

        const lastCompletedBooking = bookings
          .filter((booking) => normalizeStatus(booking.status) === 'completed')
          .sort((a, b) => {
            const aTime = new Date(a.end_time || a.start_time).getTime();
            const bTime = new Date(b.end_time || b.start_time).getTime();
            return bTime - aTime;
          })[0] || null;

        const totalCompletedCount = bookings.filter((booking) => normalizeStatus(booking.status) === 'completed').length;

        const shouldRateLastCompleted = !!(lastCompletedBooking && !reviewedBookingIds.has(lastCompletedBooking.id));

        setNextBooking(upcoming);
        setLastCompletedBooking(lastCompletedBooking);
        setLastCompletedNeedsReview(!upcoming && shouldRateLastCompleted);
        setCompletedCount(totalCompletedCount);
      } catch {
        setNextBooking(null);
        setLastCompletedBooking(null);
        setLastCompletedNeedsReview(false);
        setCompletedCount(0);
      } finally {
        setHeroLoading(false);
      }
    };

    void loadUpcomingBooking();
  }, []);

  useEffect(() => {
    if (heroLoading) {
      setHeroContentVisible(false);
      return;
    }

    let timerId: number | null = null;
    const frameId = window.requestAnimationFrame(() => {
      timerId = window.setTimeout(() => {
        setHeroContentVisible(true);
      }, HERO_CONTENT_REVEAL_DELAY_MS);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      if (timerId !== null) {
        window.clearTimeout(timerId);
      }
    };
  }, [heroLoading]);

  const hero = (() => {
    if (nextBooking) {
      return {
        eyebrow: 'Next Appointment',
        title: `${nextBooking.service?.name || 'Service'} with ${nextBooking.employee?.name || 'your specialist'}`,
        description: `Booked for ${formatBookingDateTime(nextBooking.start_time)}. We will notify you right before it starts.`,
        primaryTo: `/bookings/${nextBooking.id}`,
        primaryLabel: 'Open Booking',
        secondaryTo: '/services',
        secondaryLabel: 'Add Another Service',
        badge: getDaysUntil(nextBooking.start_time),
      };
    }

    if (lastCompletedBooking && lastCompletedNeedsReview) {
      return {
        eyebrow: 'Share Your Feedback',
        title: 'Rate your last visit',
        description: `Tell us how ${lastCompletedBooking.service?.name || 'your service'} with ${lastCompletedBooking.employee?.name || 'your specialist'} went. Your feedback helps us improve every appointment.`,
        primaryTo: `/bookings/${lastCompletedBooking.id}`,
        primaryLabel: 'Leave Rating',
        secondaryTo: '/history',
        secondaryLabel: 'Open Booking History',
        badge: 'Unrated visit',
      };
    }

    if (lastCompletedBooking) {
      return {
        eyebrow: 'Stay In Rhythm',
        title: 'Ready for your next refresh?',
        description: `Your last visit was ${formatBookingDateTime(lastCompletedBooking.end_time || lastCompletedBooking.start_time)}${lastCompletedBooking.service?.name ? ` for ${lastCompletedBooking.service.name}` : ''}. Keep the momentum going.`,
        primaryTo: '/services',
        primaryLabel: 'Book Next Visit',
        secondaryTo: '/history',
        secondaryLabel: 'See Visit History',
        badge: `${completedCount} completed visit${completedCount === 1 ? '' : 's'}`,
      };
    }

    return {
      eyebrow: 'Welcome',
      title: 'Your beauty concierge is ready',
      description: 'Pick a service, choose your specialist, and book in under a minute.',
      primaryTo: '/services',
      primaryLabel: 'Find Services',
      secondaryTo: '/history',
      secondaryLabel: 'My Bookings',
      badge: 'Fast booking flow',
    };
  })();

  useLayoutEffect(() => {
    const nextHeight = heroLoading
      ? skeletonMeasureRef.current?.offsetHeight
      : contentMeasureRef.current?.offsetHeight;

    if (nextHeight) {
      setHeroHeight(nextHeight);
    }
  }, [heroLoading, hero.eyebrow, hero.title, hero.description, hero.primaryLabel, hero.secondaryLabel, hero.badge]);

  const skeletonMarkup = (
    <div className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">Preparing your dashboard</p>
      <div className="mt-3 h-6 w-4/5 animate-pulse rounded bg-cyan-100/80 dark:bg-cyan-900/40" />
      <div className="mt-2 h-4 w-full animate-pulse rounded bg-slate-200/80 dark:bg-slate-700/60" />
      <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-slate-200/80 dark:bg-slate-700/60" />
      <div className="mt-4 flex gap-2">
        <div className="h-9 w-32 animate-pulse rounded-xl bg-slate-300/80 dark:bg-slate-700/70" />
        <div className="h-9 w-28 animate-pulse rounded-xl bg-slate-200/80 dark:bg-slate-800/70" />
      </div>
    </div>
  );

  const finalHeroMarkup = (
    <div className="p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p
          className={`text-xs font-semibold uppercase tracking-wide text-cyan-700 transition-all ease-out dark:text-cyan-300 ${heroContentVisible ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'}`}
          style={{ transitionDuration: `${HERO_TRANSITION_MS}ms` }}
        >
          {hero.eyebrow}
        </p>
        <span
          className={`rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-cyan-800 transition-all ease-out dark:bg-slate-900/50 dark:text-cyan-200 ${heroContentVisible ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'}`}
          style={{ transitionDuration: `${HERO_TRANSITION_MS}ms`, transitionDelay: `${HERO_BADGE_DELAY_MS}ms` }}
        >
          {hero.badge}
        </span>
      </div>
      <h1
        className={`text-2xl font-semibold text-slate-800 transition-all ease-out dark:text-slate-100 ${heroContentVisible ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'}`}
        style={{ transitionDuration: `${HERO_TRANSITION_MS}ms`, transitionDelay: `${HERO_TITLE_DELAY_MS}ms` }}
      >
        {hero.title}
      </h1>
      <p
        className={`mt-2 text-sm text-slate-600 transition-all ease-out dark:text-slate-300 ${heroContentVisible ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'}`}
        style={{ transitionDuration: `${HERO_TRANSITION_MS}ms`, transitionDelay: `${HERO_DESCRIPTION_DELAY_MS}ms` }}
      >
        {hero.description}
      </p>
      <div
        className={`mt-4 flex gap-2 transition-all ease-out ${heroContentVisible ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'}`}
        style={{ transitionDuration: `${HERO_TRANSITION_MS}ms`, transitionDelay: `${HERO_ACTIONS_DELAY_MS}ms` }}
      >
        <Link to={hero.primaryTo} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white">
          {hero.primaryLabel}
        </Link>
        <Link to={hero.secondaryTo} className="rounded-xl border border-slate-300 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:hover:bg-slate-900">
          {hero.secondaryLabel}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-slate-100 to-white py-8 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-md px-4">
        <div className="rounded-3xl bg-white/90 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:bg-slate-800/95">
          <PageReveal delay={0}>
            <div
              className="relative mb-6 overflow-hidden rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 via-sky-50 to-indigo-50 transition-[height,transform] ease-out dark:border-cyan-800/60 dark:from-cyan-950/40 dark:via-sky-950/30 dark:to-indigo-950/40"
              style={{ height: `${heroHeight}px`, transform: heroLoading ? 'scale(0.988)' : 'scale(1)', transitionDuration: `${HERO_TRANSITION_MS}ms` }}
            >
              <div className="relative h-full">
                <div
                  className={`pointer-events-none absolute inset-0 transition-all ease-out ${heroLoading ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'}`}
                  style={{ transitionDuration: `${HERO_TRANSITION_MS}ms` }}
                  aria-hidden={!heroLoading}
                >
                  {skeletonMarkup}
                </div>
                <div
                  className={`absolute inset-0 transition-all ease-out ${heroContentVisible ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'} ${heroLoading ? 'pointer-events-none' : ''}`}
                  style={{ transitionDuration: `${HERO_TRANSITION_MS}ms` }}
                  aria-hidden={heroLoading}
                >
                  {finalHeroMarkup}
                </div>
              </div>
              <div className="pointer-events-none absolute -left-[9999px] top-0 w-full opacity-0" aria-hidden="true">
                <div ref={skeletonMeasureRef}>{skeletonMarkup}</div>
                <div ref={contentMeasureRef}>{finalHeroMarkup}</div>
              </div>
            </div>
          </PageReveal>

          {nextBooking?.is_loyalty_discount && (
            <PageReveal delay={120}>
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800/50 dark:bg-emerald-950/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/50">
                    <span className="text-xl">🎁</span>
                  </div>
                  <div>
                    <p className="font-semibold text-emerald-800 dark:text-emerald-200">20% Loyalty Discount Active</p>
                    <p className="text-sm text-emerald-700/80 dark:text-emerald-300/80">Your upcoming booking has a 20% loyalty discount applied.</p>
                  </div>
                </div>
              </div>
            </PageReveal>
          )}

          <PageReveal delay={160}>
            <div className="space-y-3">
              <Link to="/services" className="block rounded-2xl bg-blue-600 px-5 py-3 text-center font-medium text-white shadow-lg transition hover:bg-blue-700">
                Browse Services
              </Link>
              <Link to="/history" className="block rounded-2xl bg-slate-900 px-5 py-3 text-center font-medium text-white shadow-lg transition hover:bg-slate-800">
                My Bookings
              </Link>
            </div>
          </PageReveal>
        </div>
      </div>
    </div>
  );
};

export default Home;