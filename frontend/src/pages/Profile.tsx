import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MeResponse } from '../api/auth';
import { normalizeImageUrl } from '../utils/image';

interface ProfileProps {
  user: MeResponse | null;
}

const getDisplayName = (user: MeResponse | null) => {
  if (!user) return 'Guest';
  const full = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  if (full) return full;
  if (user.username) return `@${user.username}`;
  return `User ${user.telegram_user_id}`;
};

const getInitial = (user: MeResponse | null) => {
  const name = getDisplayName(user);
  return name.charAt(0).toUpperCase() || 'U';
};

const Profile = ({ user }: ProfileProps) => {
  const navigate = useNavigate();
  const displayName = getDisplayName(user);
  const avatarSrc = normalizeImageUrl(user?.photo_url);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [avatarSrc]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 dark:from-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-md px-4">
        <div className="mb-5">
          <h1 className="mb-3 text-3xl font-bold text-slate-800 dark:text-slate-100">Profile</h1>
          <button
            onClick={() => navigate(-1)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            ← Back
          </button>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-lg text-center dark:bg-slate-800">
          {avatarSrc && !avatarError ? (
            <img
              src={avatarSrc}
              alt={displayName}
              className="mx-auto h-28 w-28 rounded-full object-cover ring-4 ring-slate-100"
              onError={() => setAvatarError(true)}
            />
          ) : (
            <div className="mx-auto h-28 w-28 rounded-full bg-slate-800 text-white text-4xl font-bold flex items-center justify-center dark:bg-slate-200 dark:text-slate-900">
              {getInitial(user)}
            </div>
          )}

          <h2 className="mt-6 text-2xl font-semibold text-slate-800 dark:text-slate-100">{displayName}</h2>
          {user?.username && <p className="mt-2 text-slate-500 dark:text-slate-300">@{user.username}</p>}
        </div>
      </div>
    </div>
  );
};

export default Profile;
