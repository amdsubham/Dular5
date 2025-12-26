'use client';

import { useState, useEffect } from 'react';
import { getAllUsers, filterUsers } from '@/services/users';
import {
  sendNotificationToUser,
  sendNotificationToMultipleUsers,
  sendNotificationToAllUsers
} from '@/services/notifications';
import { UserProfile, UserFilters } from '@/types/user';
import { Send, Users, User, CheckSquare, Eye, X, Filter } from 'lucide-react';

export default function NotificationsPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [sendToAll, setSendToAll] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<UserFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filters, users]);

  const loadUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const applyFilters = async () => {
    try {
      const filtered = await filterUsers({
        ...filters,
        search: searchTerm
      });
      setFilteredUsers(filtered);
    } catch (error) {
      console.error('Error filtering users:', error);
    }
  };

  const getUserName = (user: UserProfile) => {
    const firstName = user.onboarding?.data?.firstName || user.firstName || '';
    const lastName = user.onboarding?.data?.lastName || user.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'N/A';
  };

  const getPhoneNumber = (user: UserProfile) => {
    return user.phoneNumber || user.email || 'No contact';
  };

  const handleViewProfile = (user: UserProfile) => {
    setSelectedProfile(user);
    setShowProfileModal(true);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map(u => u.uid));
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !body.trim()) {
      alert('Please fill in both title and message');
      return;
    }

    if (!sendToAll && selectedUserIds.length === 0) {
      alert('Please select at least one user or choose "Send to All"');
      return;
    }

    if (!confirm(`Are you sure you want to send this notification to ${sendToAll ? 'all users' : `${selectedUserIds.length} user(s)`}?`)) {
      return;
    }

    setSending(true);

    try {
      const notification: any = { title, body };

      // Add image if provided
      if (imageUrl.trim()) {
        notification.image = imageUrl.trim();
      }

      if (sendToAll) {
        await sendNotificationToAllUsers(notification);
      } else if (selectedUserIds.length === 1) {
        await sendNotificationToUser(selectedUserIds[0], notification);
      } else {
        await sendNotificationToMultipleUsers(selectedUserIds, notification);
      }

      alert('Notification sent successfully!');
      setTitle('');
      setBody('');
      setImageUrl('');
      setSelectedUserIds([]);
      setSendToAll(false);
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6 lg:mb-8">Send Push Notifications</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Notification Form */}
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">Compose Notification</h2>

          <form onSubmit={handleSend} className="space-y-3 md:space-y-4">
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                Notification Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter notification title"
                className="w-full px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Enter your message"
                rows={5}
                className="w-full px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                Image URL (Optional)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Add an image URL to display in the notification (must be a publicly accessible URL)
              </p>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Recipients</h3>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    checked={sendToAll}
                    onChange={() => {
                      setSendToAll(true);
                      setSelectedUserIds([]);
                    }}
                    className="w-4 h-4 text-primary-600"
                  />
                  <Users className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">
                    Send to All Users ({users.length})
                  </span>
                </label>

                <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    checked={!sendToAll}
                    onChange={() => setSendToAll(false)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <CheckSquare className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">
                    Send to Selected Users ({selectedUserIds.length})
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 md:py-3 text-sm md:text-base rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4 md:w-5 md:h-5" />
              {sending ? 'Sending...' : 'Send Notification'}
            </button>
          </form>

          {/* Preview */}
          {(title || body || imageUrl) && (
            <div className="mt-4 md:mt-6 border-t pt-4 md:pt-6">
              <h3 className="text-xs md:text-sm font-medium text-gray-700 mb-2 md:mb-3">Preview</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 md:p-4">
                {imageUrl && (
                  <div className="mb-2 md:mb-3">
                    <img
                      src={imageUrl}
                      alt="Notification"
                      className="w-full h-24 md:h-32 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="font-semibold text-gray-900 mb-1 text-sm md:text-base">{title || 'Title'}</div>
                <div className="text-xs md:text-sm text-gray-700">{body || 'Message body'}</div>
              </div>
            </div>
          )}
        </div>

        {/* User Selection */}
        {!sendToAll && (
          <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
            <div className="flex justify-between items-center mb-3 md:mb-4">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Select Users</h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 text-xs md:text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Filter className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Filters
              </button>
            </div>

            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none mb-3 md:mb-4"
            />

            {/* Filters Section */}
            {showFilters && (
              <div className="mb-3 md:mb-4 p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select
                    value={filters.gender || ''}
                    onChange={(e) => setFilters({ ...filters, gender: e.target.value || undefined })}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>

                  <select
                    onChange={(e) => {
                      const value = e.target.value;
                      setFilters({
                        ...filters,
                        registeredToday: value === 'today',
                        registeredYesterday: value === 'yesterday',
                        registeredThisWeek: value === 'week',
                        registeredThisMonth: value === 'month',
                      });
                    }}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="">All Time</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    setFilters({});
                    setSearchTerm('');
                  }}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}

            <div className="mb-3 md:mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-xs md:text-sm text-gray-600">
                {selectedUserIds.length} of {filteredUsers.length} selected
              </span>
              <button
                onClick={selectAllUsers}
                className="text-xs md:text-sm text-primary-600 hover:text-primary-700 font-medium text-left"
              >
                {selectedUserIds.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="space-y-2 max-h-[300px] md:max-h-[500px] overflow-y-auto">
              {filteredUsers.map((user) => (
                <div
                  key={user.uid}
                  className="flex items-center gap-2 md:gap-3 p-2 md:p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.uid)}
                    onChange={() => toggleUserSelection(user.uid)}
                    className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary-600 rounded focus:ring-primary-500 cursor-pointer flex-shrink-0"
                  />
                  <User className="w-4 h-4 md:w-5 md:h-5 text-gray-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs md:text-sm font-medium text-gray-900 truncate">
                      {getUserName(user)}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {getPhoneNumber(user)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewProfile(user)}
                    className="flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 text-xs bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors flex-shrink-0"
                    title="View Profile"
                  >
                    <Eye className="w-3 h-3 md:w-3.5 md:h-3.5" />
                    <span className="hidden sm:inline">View</span>
                  </button>
                </div>
              ))}

              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No users found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {showProfileModal && selectedProfile && (
        <UserProfileModal
          user={selectedProfile}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedProfile(null);
          }}
        />
      )}
    </div>
  );
}

// User Profile Modal Component
function UserProfileModal({ user, onClose }: { user: UserProfile; onClose: () => void }) {
  const getUserName = (user: UserProfile) => {
    const firstName = user.onboarding?.data?.firstName || user.firstName || '';
    const lastName = user.onboarding?.data?.lastName || user.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'N/A';
  };

  const getGender = (user: UserProfile) => {
    const gender = user.onboarding?.data?.gender || user.gender;
    if (!gender) return 'N/A';
    return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
  };

  const getInterests = (user: UserProfile) => {
    return user.onboarding?.data?.interests || user.interests || [];
  };

  const getInterestedIn = (user: UserProfile) => {
    return user.onboarding?.data?.interestedIn || user.interestedIn || [];
  };

  const getLookingFor = (user: UserProfile) => {
    return user.onboarding?.data?.lookingFor || user.lookingFor || [];
  };

  const getPictures = (user: UserProfile) => {
    return user.onboarding?.data?.pictures || user.pictures || [];
  };

  const pictures = getPictures(user);
  const interests = getInterests(user);
  const interestedIn = getInterestedIn(user);
  const lookingFor = getLookingFor(user);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">User Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Profile Image */}
          {pictures.length > 0 && (
            <div className="flex justify-center">
              <img
                src={pictures[0]}
                alt={getUserName(user)}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-gray-200"
              />
            </div>
          )}

          {/* Basic Info */}
          <div className="text-center">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900">{getUserName(user)}</h3>
            <p className="text-sm md:text-base text-gray-600">{user.phoneNumber || user.email || 'No contact'}</p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Gender</p>
              <p className="text-sm font-semibold text-gray-900">{getGender(user)}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Date of Birth</p>
              <p className="text-sm font-semibold text-gray-900">
                {user.onboarding?.data?.dob || user.dob || 'N/A'}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Height</p>
              <p className="text-sm font-semibold text-gray-900">
                {user.onboarding?.data?.height || 'N/A'}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Photos</p>
              <p className="text-sm font-semibold text-gray-900">{pictures.length} photos</p>
            </div>
          </div>

          {/* Interested In */}
          {interestedIn.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Interested In</h4>
              <div className="flex flex-wrap gap-2">
                {interestedIn.map((item: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Looking For */}
          {lookingFor.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Looking For</h4>
              <div className="flex flex-wrap gap-2">
                {lookingFor.map((item: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          {interests.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Interests</h4>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* All Photos */}
          {pictures.length > 1 && (
            <div>
              <h4 className="text-xs md:text-sm font-semibold text-gray-700 mb-2">All Photos ({pictures.length})</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {pictures.map((pic: string, idx: number) => (
                  <img
                    key={idx}
                    src={pic}
                    alt={`Photo ${idx + 1}`}
                    className="w-full h-24 md:h-32 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
