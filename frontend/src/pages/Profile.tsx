import { useNavigate } from 'react-router-dom';
import type { MeResponse } from '../api/auth';

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
      <div className="mx-auto max-w-md px-4">
        <div className="mb-5 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:bg-slate-100"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-slate-800">Profile</h1>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-lg text-center">
          {user?.photo_url ? (
            <img
              src={user.photo_url}
              alt={displayName}
              className="mx-auto h-28 w-28 rounded-full object-cover ring-4 ring-slate-100"
            />
          ) : (
            <div className="mx-auto h-28 w-28 rounded-full bg-slate-800 text-white text-4xl font-bold flex items-center justify-center">
              {getInitial(user)}
            </div>
          )}

          <h2 className="mt-6 text-2xl font-semibold text-slate-800">{displayName}</h2>
          {user?.username && <p className="mt-2 text-slate-500">@{user.username}</p>}
        </div>
      </div>
    </div>
  );
};

export default Profile;
