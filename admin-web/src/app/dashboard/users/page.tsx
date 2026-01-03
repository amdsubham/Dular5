'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getAllUsers, deleteUser, filterUsers, createUser, updateUser, getUserSwipeStats } from '@/services/users';
import { UserProfile, UserFilters } from '@/types/user';
import { Search, Plus, Edit, Trash2, X, Save, ZoomIn, User as UserIcon, ChevronLeft, ChevronRight, RefreshCw, Star, Heart, ThumbsUp, ThumbsDown, Activity, MessageCircle, MapPin, Copy, Crown } from 'lucide-react';
import { format } from 'date-fns';

export default function UsersPage() {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [filters, setFilters] = useState<UserFilters>({});
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingSwipeStats, setLoadingSwipeStats] = useState<{[key: string]: boolean}>({});
  const [showSwipeStats, setShowSwipeStats] = useState<{[key: string]: boolean}>({});
  const [userLocations, setUserLocations] = useState<{[key: string]: string}>({});
  const [loadingLocations, setLoadingLocations] = useState<{[key: string]: boolean}>({});
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedUserForPlan, setSelectedUserForPlan] = useState<UserProfile | null>(null);
  const [userSubscriptions, setUserSubscriptions] = useState<{[key: string]: any}>({});
  const [loadingSubscriptions, setLoadingSubscriptions] = useState<{[key: string]: boolean}>({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(12);

  // Apply URL filter on mount
  useEffect(() => {
    const urlFilter = searchParams.get('filter');
    if (urlFilter === 'deleteRequests') {
      setFilters({ hasDeleteRequest: true });
    } else if (urlFilter === 'today') {
      setFilters({ registeredToday: true });
    }
  }, [searchParams]);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, filters, users]);

  // Fetch locations for visible users
  useEffect(() => {
    const fetchLocationsForVisibleUsers = async () => {
      const indexOfLastUser = currentPage * usersPerPage;
      const indexOfFirstUser = indexOfLastUser - usersPerPage;
      const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

      for (const user of currentUsers) {
        if (user.location?.latitude && user.location?.longitude && !userLocations[user.uid] && !loadingLocations[user.uid]) {
          // Add a small delay to respect Nominatim's rate limit (1 request per second)
          await new Promise(resolve => setTimeout(resolve, 1000));
          fetchUserLocation(user.uid, user.location.latitude, user.location.longitude);
        }
      }
    };

    if (filteredUsers.length > 0) {
      fetchLocationsForVisibleUsers();
    }
  }, [currentPage, filteredUsers, usersPerPage]);

  // Fetch subscriptions for visible users
  useEffect(() => {
    const fetchSubscriptionsForVisibleUsers = async () => {
      const indexOfLastUser = currentPage * usersPerPage;
      const indexOfFirstUser = indexOfLastUser - usersPerPage;
      const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

      for (const user of currentUsers) {
        if (!userSubscriptions[user.uid] && !loadingSubscriptions[user.uid]) {
          fetchUserSubscription(user.uid);
        }
      }
    };

    if (filteredUsers.length > 0) {
      fetchSubscriptionsForVisibleUsers();
    }
  }, [currentPage, filteredUsers, usersPerPage]);

  const loadUsers = async () => {
    try {
      const data = await getAllUsers();
      console.log('Loaded users:', data);
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadUsers();
      // Also reapply filters after refresh
      await applyFilters();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500); // Keep animation for at least 500ms
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

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await deleteUser(userId);
      await loadUsers();
      alert('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleEdit = (user: UserProfile) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleWhatsApp = (user: UserProfile) => {
    const phoneNumber = user.phoneNumber || '';
    // Remove any non-digit characters from phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    // Check if phone number exists
    if (!cleanPhone) {
      alert('No phone number available for this user');
      return;
    }

    // Create WhatsApp message
    const message = encodeURIComponent('Hi Subham here, We had a match in Dular App');

    // Open WhatsApp with the message
    // Use international format - add country code if not present
    const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone;
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${message}`;

    window.open(whatsappUrl, '_blank');
  };

  const handleOpenMap = (user: UserProfile) => {
    const latitude = user.location?.latitude;
    const longitude = user.location?.longitude;

    // Check if location data exists
    if (!latitude || !longitude) {
      alert('No location data available for this user');
      return;
    }

    // Open Google Maps with the coordinates
    const googleMapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
    window.open(googleMapsUrl, '_blank');
  };

  const fetchUserLocation = async (userId: string, latitude: number, longitude: number) => {
    // Check if location is already cached
    if (userLocations[userId]) {
      return;
    }

    setLoadingLocations(prev => ({ ...prev, [userId]: true }));

    try {
      // Use Nominatim (OpenStreetMap) reverse geocoding API - completely free, no API key required
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Dular Admin Panel'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const address = data.address;

        // Format location string: City, State, Country
        const locationParts = [];
        if (address.city || address.town || address.village) {
          locationParts.push(address.city || address.town || address.village);
        }
        if (address.state) {
          locationParts.push(address.state);
        }
        if (address.country) {
          locationParts.push(address.country);
        }

        const locationString = locationParts.join(', ') || 'Location unavailable';
        setUserLocations(prev => ({ ...prev, [userId]: locationString }));
      } else {
        setUserLocations(prev => ({ ...prev, [userId]: 'Location unavailable' }));
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      setUserLocations(prev => ({ ...prev, [userId]: 'Location unavailable' }));
    } finally {
      setLoadingLocations(prev => ({ ...prev, [userId]: false }));
    }
  };

  const fetchUserSubscription = async (userId: string) => {
    // Check if subscription is already cached
    if (userSubscriptions[userId]) {
      return;
    }

    setLoadingSubscriptions(prev => ({ ...prev, [userId]: true }));

    try {
      const { getUserSubscription } = await import('@/services/subscriptions');
      const subscription = await getUserSubscription(userId);

      if (subscription) {
        setUserSubscriptions(prev => ({ ...prev, [userId]: subscription }));
      } else {
        // User has no subscription (default to free)
        setUserSubscriptions(prev => ({ ...prev, [userId]: { currentPlan: 'free', isActive: false } }));
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setUserSubscriptions(prev => ({ ...prev, [userId]: { currentPlan: 'free', isActive: false } }));
    } finally {
      setLoadingSubscriptions(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleCopyUserId = (userId: string) => {
    navigator.clipboard.writeText(userId).then(() => {
      alert('User ID copied to clipboard!');
    }).catch((err) => {
      console.error('Failed to copy:', err);
      alert('Failed to copy User ID');
    });
  };

  const handleOpenPlanModal = (user: UserProfile) => {
    setSelectedUserForPlan(user);
    setShowPlanModal(true);
  };

  const handleRating = async (userId: string, rating: number) => {
    try {
      await updateUser(userId, { rating });
      // Update local state
      setUsers(users.map(u => u.uid === userId ? { ...u, rating } : u));
      setFilteredUsers(filteredUsers.map(u => u.uid === userId ? { ...u, rating } : u));
    } catch (error) {
      console.error('Error updating rating:', error);
      alert('Failed to update rating');
    }
  };

  const handleToggleSwipeStats = async (userId: string) => {
    // Toggle visibility
    const isCurrentlyShowing = showSwipeStats[userId];

    if (isCurrentlyShowing) {
      // Close the panel
      setShowSwipeStats(prev => ({ ...prev, [userId]: false }));
      return;
    }

    // Open the panel
    setShowSwipeStats(prev => ({ ...prev, [userId]: true }));

    // Check if already loaded or loading
    const currentUser = filteredUsers.find(u => u.uid === userId);
    if (currentUser?.swipeStats || loadingSwipeStats[userId]) {
      return;
    }

    // Load stats
    setLoadingSwipeStats(prev => ({ ...prev, [userId]: true }));

    try {
      const stats = await getUserSwipeStats(userId);

      // Update both state arrays
      setUsers(prevUsers =>
        prevUsers.map(u => u.uid === userId ? { ...u, swipeStats: stats } : u)
      );

      setFilteredUsers(prevFiltered =>
        prevFiltered.map(u => u.uid === userId ? { ...u, swipeStats: stats } : u)
      );
    } catch (error) {
      console.error('Error fetching swipe stats:', error);
    } finally {
      setLoadingSwipeStats(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleViewImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const handleViewGallery = (images: string[], startIndex: number = 0) => {
    setSelectedImages(images);
    setCurrentImageIndex(startIndex);
    setShowGalleryModal(true);
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

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      return format(dateObj, 'MMM dd, yyyy');
    } catch {
      return 'N/A';
    }
  };

  const getGender = (user: UserProfile) => {
    const gender = user.onboarding?.data?.gender || user.gender;
    if (!gender) return 'N/A';
    return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
  };

  const getInterests = (user: UserProfile) => {
    const interests = user.onboarding?.data?.interests || user.interests;
    if (!interests || interests.length === 0) return [];
    return interests;
  };

  const getInterestedIn = (user: UserProfile) => {
    const interestedIn = user.onboarding?.data?.interestedIn || user.interestedIn;
    if (!interestedIn || interestedIn.length === 0) return [];
    return interestedIn;
  };

  const getLookingFor = (user: UserProfile) => {
    const lookingFor = user.onboarding?.data?.lookingFor || user.lookingFor;
    if (!lookingFor || lookingFor.length === 0) return [];
    return lookingFor;
  };

  const getPictures = (user: UserProfile) => {
    const pictures = user.onboarding?.data?.pictures || user.pictures;
    if (!pictures || pictures.length === 0) return [];
    return pictures;
  };

  const getDeletedPictures = (user: UserProfile) => {
    const deletedPictures = user.onboarding?.data?.deletedPictures || user.deletedPictures;
    if (!deletedPictures || deletedPictures.length === 0) return [];
    return deletedPictures;
  };

  const getUserName = (user: UserProfile) => {
    const firstName = user.onboarding?.data?.firstName || user.firstName || '';
    const lastName = user.onboarding?.data?.lastName || user.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'N/A';
  };

  const getAge = (user: UserProfile) => {
    const dob = user.onboarding?.data?.dob || user.dob;
    if (!dob) return 'N/A';
    try {
      const birthDate = dob.toDate ? dob.toDate() : new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch {
      return 'N/A';
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };


  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4 md:mb-6 lg:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Users Management</h1>
        <div className="flex gap-2 md:gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1 md:gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-3 md:px-4 rounded-lg transition-colors disabled:opacity-50 text-sm md:text-base"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1 md:gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-3 md:px-4 rounded-lg transition-colors text-sm md:text-base"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Create User</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white rounded-xl shadow-md p-3 md:p-4 mb-4 md:mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6">
          <div className="flex flex-wrap items-center gap-3 md:gap-6">
            <div>
              <span className="text-xs md:text-sm text-gray-600">Total Users: </span>
              <span className="text-base md:text-lg font-bold text-gray-900">{users.length}</span>
            </div>
            <div>
              <span className="text-xs md:text-sm text-gray-600">Filtered: </span>
              <span className="text-base md:text-lg font-bold text-primary-600">{filteredUsers.length}</span>
            </div>
            <div>
              <span className="text-xs md:text-sm text-gray-600">Showing: </span>
              <span className="text-base md:text-lg font-bold text-gray-900">
                {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsers.length)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-xs md:text-sm text-gray-600 whitespace-nowrap">Users per page:</span>
            <select
              value={usersPerPage}
              onChange={(e) => {
                setUsersPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 md:px-3 py-1.5 md:py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="6">6</option>
              <option value="12">12</option>
              <option value="24">24</option>
              <option value="48">48</option>
              <option value="96">96</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-4 md:mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <select
            value={filters.gender || ''}
            onChange={(e) => {
              const newFilters = { ...filters };
              if (e.target.value === '') {
                delete newFilters.gender;
              } else {
                newFilters.gender = e.target.value;
              }
              setFilters(newFilters);
            }}
            className="px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          >
            <option value="">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          <select
            value={
              filters.hasDeleteRequest ? 'deleteRequests' :
              filters.registeredToday ? 'today' :
              filters.registeredYesterday ? 'yesterday' :
              filters.registeredThisWeek ? 'week' :
              filters.registeredThisMonth ? 'month' : ''
            }
            onChange={(e) => {
              const value = e.target.value;
              setFilters({
                ...filters,
                registeredToday: value === 'today',
                registeredYesterday: value === 'yesterday',
                registeredThisWeek: value === 'week',
                registeredThisMonth: value === 'month',
                hasDeleteRequest: value === 'deleteRequests'
              });
            }}
            className="px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          >
            <option value="">All Time</option>
            <option value="today">Registered Today</option>
            <option value="yesterday">Registered Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="deleteRequests">Deleted Users</option>
          </select>
        </div>

        {selectedUserIds.length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
            <span className="text-xs md:text-sm text-gray-600">
              {selectedUserIds.length} user(s) selected
            </span>
            <button
              onClick={() => setSelectedUserIds([])}
              className="text-xs md:text-sm text-primary-600 hover:text-primary-700 text-left"
            >
              Clear selection
            </button>
            <button
              onClick={async () => {
                if (!confirm(`Are you sure you want to delete ${selectedUserIds.length} user(s)?`)) return;
                try {
                  await Promise.all(selectedUserIds.map(id => deleteUser(id)));
                  await loadUsers();
                  setSelectedUserIds([]);
                  alert(`Successfully deleted ${selectedUserIds.length} user(s)`);
                } catch (error) {
                  console.error('Error deleting users:', error);
                  alert('Failed to delete some users');
                }
              }}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-red-600 hover:bg-red-700 text-white text-xs md:text-sm font-medium rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
              Delete Selected ({selectedUserIds.length})
            </button>
          </div>
        )}
      </div>

      {/* Users Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {currentUsers.map((user) => {
          // Get the latest user data with swipeStats from filteredUsers
          const latestUser = filteredUsers.find(u => u.uid === user.uid) || user;
          const pictures = getPictures(latestUser);
          const interests = getInterests(latestUser);
          const interestedIn = getInterestedIn(latestUser);
          const lookingFor = getLookingFor(latestUser);

          return (
            <div key={latestUser.uid} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* User Image */}
              <div className="relative h-48 sm:h-56 md:h-64 bg-gray-200">
                {pictures.length > 0 ? (
                  <div
                    className="relative h-full cursor-pointer group"
                    onClick={() => handleViewGallery(pictures, 0)}
                  >
                    <img
                      src={pictures[0]}
                      alt={getUserName(latestUser)}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                      <ZoomIn className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                    {pictures.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {pictures.length} photos
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-300">
                    <UserIcon className="w-20 h-20 text-gray-500" />
                  </div>
                )}

                {/* Selection Checkbox */}
                <div className="absolute top-2 left-2">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.uid)}
                    onChange={() => toggleUserSelection(user.uid)}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* User Info */}
              <div className="p-4 md:p-6">
                <div className="flex justify-between items-start mb-3 md:mb-4">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 truncate">
                      {getUserName(user)}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 truncate">
                      {user.phoneNumber || user.email || 'No contact'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500 font-mono">ID: {latestUser.uid.substring(0, 8)}...</span>
                      <button
                        onClick={() => handleCopyUserId(latestUser.uid)}
                        className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Copy full User ID"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-1 md:gap-2 flex-shrink-0 flex-wrap">
                    <button
                      onClick={() => handleWhatsApp(latestUser)}
                      className="text-green-600 hover:text-green-900 p-1.5 md:p-2 hover:bg-green-50 rounded-lg transition-colors"
                      title="Send WhatsApp message"
                    >
                      <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                    <button
                      onClick={() => handleOpenMap(latestUser)}
                      className="text-orange-600 hover:text-orange-900 p-1.5 md:p-2 hover:bg-orange-50 rounded-lg transition-colors"
                      title="View location on map"
                    >
                      <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                    <button
                      onClick={() => handleOpenPlanModal(latestUser)}
                      className="text-purple-600 hover:text-purple-900 p-1.5 md:p-2 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Manage subscription plan"
                    >
                      <Crown className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-blue-600 hover:text-blue-900 p-1.5 md:p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit user"
                    >
                      <Edit className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(user.uid)}
                      className="text-red-600 hover:text-red-900 p-1.5 md:p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete user"
                    >
                      <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  </div>
                </div>

                {/* User Details */}
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gender:</span>
                    <span className="font-medium text-gray-900">{getGender(user)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Age:</span>
                    <span className="font-medium text-gray-900">{getAge(user)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Registered:</span>
                    <span className="font-medium text-gray-900">{formatDate(user.createdAt)}</span>
                  </div>
                  {latestUser.location?.latitude && latestUser.location?.longitude && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium text-gray-900 text-right">
                        {loadingLocations[latestUser.uid] ? (
                          <span className="text-gray-400 italic">Loading...</span>
                        ) : (
                          userLocations[latestUser.uid] || 'Loading...'
                        )}
                      </span>
                    </div>
                  )}
                  {interestedIn.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Interested In:</span>
                      <span className="font-medium text-gray-900 capitalize">{interestedIn.join(', ')}</span>
                    </div>
                  )}
                  {lookingFor.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Looking For:</span>
                      <span className="font-medium text-gray-900 capitalize">{lookingFor.join(', ')}</span>
                    </div>
                  )}
                </div>

                {/* Current Subscription Plan */}
                <div className="mb-4 pb-4 border-b">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 font-medium">Current Plan:</span>
                    {loadingSubscriptions[latestUser.uid] ? (
                      <span className="text-xs text-gray-400 italic">Loading...</span>
                    ) : userSubscriptions[latestUser.uid] ? (
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          userSubscriptions[latestUser.uid].currentPlan === 'free'
                            ? 'bg-gray-100 text-gray-800'
                            : userSubscriptions[latestUser.uid].currentPlan === 'daily'
                            ? 'bg-blue-100 text-blue-800'
                            : userSubscriptions[latestUser.uid].currentPlan === 'weekly'
                            ? 'bg-purple-100 text-purple-800'
                            : userSubscriptions[latestUser.uid].currentPlan === 'monthly'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {userSubscriptions[latestUser.uid].currentPlan === 'free' ? '🆓 Free' :
                           userSubscriptions[latestUser.uid].currentPlan === 'daily' ? '📅 Daily' :
                           userSubscriptions[latestUser.uid].currentPlan === 'weekly' ? '📆 Weekly' :
                           userSubscriptions[latestUser.uid].currentPlan === 'monthly' ? '👑 Monthly' :
                           userSubscriptions[latestUser.uid].currentPlan?.toUpperCase() || 'FREE'}
                        </span>
                        {userSubscriptions[latestUser.uid].isActive && userSubscriptions[latestUser.uid].planEndDate && (
                          <span className="text-xs text-gray-500">
                            Until {format(new Date(userSubscriptions[latestUser.uid].planEndDate), 'MMM dd')}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                        🆓 Free
                      </span>
                    )}
                  </div>
                </div>

                {/* Interests */}
                {interests.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-600 mb-2">Interests:</p>
                    <div className="flex flex-wrap gap-1">
                      {interests.slice(0, 5).map((interest: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                        >
                          {interest}
                        </span>
                      ))}
                      {interests.length > 5 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          +{interests.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Deleted Pictures */}
                {(() => {
                  const deletedPictures = getDeletedPictures(latestUser);
                  return deletedPictures.length > 0 && (
                    <div className="mb-4 border-t pt-4">
                      <p className="text-xs text-gray-600 mb-2 font-medium">Deleted Pictures ({deletedPictures.length}):</p>
                      <div className="grid grid-cols-3 gap-2">
                        {deletedPictures.map((pic: string, idx: number) => (
                          <div
                            key={idx}
                            className="relative h-20 bg-gray-100 rounded-lg cursor-pointer hover:opacity-80 transition-opacity border-2 border-red-200"
                            onClick={() => handleViewGallery(deletedPictures, idx)}
                          >
                            <img
                              src={pic}
                              alt={`Deleted ${idx + 1}`}
                              className="w-full h-full object-cover rounded-lg opacity-75"
                            />
                            <div className="absolute inset-0 bg-red-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                              <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-medium">
                                Deleted
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Profile Rating */}
                <div className="mb-4 border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-600">Profile Rating:</p>
                    {user.rating && (
                      <button
                        onClick={() => handleRating(user.uid, 0)}
                        className="text-xs text-red-600 hover:text-red-700 hover:underline"
                        title="Clear rating"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRating(user.uid, star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                        title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= (user.rating || 0)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                    {user.rating && user.rating > 0 && (
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        {user.rating}/5
                      </span>
                    )}
                  </div>
                </div>

                {/* Swipe Statistics */}
                <div className="border-t pt-4">
                  <button
                    onClick={() => handleToggleSwipeStats(latestUser.uid)}
                    className="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      <span>Swipe Activity</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${showSwipeStats[latestUser.uid] ? 'rotate-90' : ''}`} />
                  </button>

                  {showSwipeStats[latestUser.uid] && (
                    <div className="mt-3 space-y-2">
                      {loadingSwipeStats[latestUser.uid] ? (
                        <div className="flex items-center justify-center py-6">
                          <RefreshCw className="w-5 h-5 animate-spin text-primary-600" />
                          <span className="ml-2 text-sm text-gray-600">Loading...</span>
                        </div>
                      ) : latestUser.swipeStats ? (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-blue-50 rounded-lg p-2.5">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Heart className="w-3.5 h-3.5 text-blue-600" />
                                <span className="text-xs text-gray-600">Total</span>
                              </div>
                              <p className="text-xl font-bold text-blue-600">
                                {latestUser.swipeStats.totalSwipes}
                              </p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-2.5">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Activity className="w-3.5 h-3.5 text-green-600" />
                                <span className="text-xs text-gray-600">Today</span>
                              </div>
                              <p className="text-xl font-bold text-green-600">
                                {latestUser.swipeStats.todaySwipes}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-emerald-50 rounded-lg p-2.5">
                              <div className="flex items-center gap-1.5 mb-1">
                                <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-xs text-gray-600">Likes</span>
                              </div>
                              <p className="text-lg font-bold text-emerald-600">
                                {latestUser.swipeStats.rightSwipes}
                              </p>
                            </div>
                            <div className="bg-red-50 rounded-lg p-2.5">
                              <div className="flex items-center gap-1.5 mb-1">
                                <ThumbsDown className="w-3.5 h-3.5 text-red-600" />
                                <span className="text-xs text-gray-600">Passes</span>
                              </div>
                              <p className="text-lg font-bold text-red-600">
                                {latestUser.swipeStats.leftSwipes}
                              </p>
                            </div>
                          </div>
                          {latestUser.swipeStats.lastSwipeDate && (
                            <div className="text-xs text-gray-500 text-center pt-1.5 border-t">
                              Last: {format(latestUser.swipeStats.lastSwipeDate, 'MMM dd, HH:mm')}
                            </div>
                          )}
                          {latestUser.swipeStats.totalSwipes === 0 && (
                            <div className="text-xs text-gray-500 text-center pt-1.5">
                              No swipes yet
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-4 text-sm text-gray-500">
                          No data available
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="mt-4">
                  {user.userAskedToDelete === 'yes' ? (
                    <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      Delete Request
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {filteredUsers.length > 0 && totalPages > 1 && (
        <div className="mt-6 md:mt-8 flex flex-wrap items-center justify-center gap-1.5 md:gap-2">
          {/* First Page */}
          <button
            onClick={() => paginate(1)}
            disabled={currentPage === 1}
            className="px-2 md:px-3 py-1.5 md:py-2 text-sm md:text-base rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="First page"
          >
            «
          </button>

          {/* Previous Page */}
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-2 md:px-4 py-1.5 md:py-2 text-sm md:text-base rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 md:gap-2"
          >
            <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Prev</span>
          </button>

          {/* Page Numbers */}
          <div className="flex gap-1 md:gap-2">
            {getPageNumbers().map((number) => (
              <button
                key={number}
                onClick={() => paginate(number)}
                className={`px-2.5 md:px-4 py-1.5 md:py-2 text-sm md:text-base rounded-lg font-medium transition-colors ${
                  currentPage === number
                    ? 'bg-primary-600 text-white'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {number}
              </button>
            ))}
          </div>

          {/* Next Page */}
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-2 md:px-4 py-1.5 md:py-2 text-sm md:text-base rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 md:gap-2"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
          </button>

          {/* Last Page */}
          <button
            onClick={() => paginate(totalPages)}
            disabled={currentPage === totalPages}
            className="px-2 md:px-3 py-1.5 md:py-2 text-sm md:text-base rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Last page"
          >
            »
          </button>
        </div>
      )}

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No users found</p>
        </div>
      )}

      {/* Bulk Selection Bar */}
      {selectedUserIds.length > 0 && (
        <div className="fixed bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 md:px-6 py-3 md:py-4 rounded-full shadow-2xl flex flex-col sm:flex-row items-center gap-3 md:gap-6 z-40 max-w-[90vw] sm:max-w-none">
          <span className="font-medium text-sm md:text-base text-center sm:text-left">
            {selectedUserIds.length} user{selectedUserIds.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2 md:gap-3">
            <button
              onClick={selectAllUsers}
              className="px-3 md:px-4 py-1.5 md:py-2 bg-white text-gray-900 rounded-full text-xs md:text-sm font-medium hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              {selectedUserIds.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
            </button>
            <button
              onClick={() => setSelectedUserIds([])}
              className="px-3 md:px-4 py-1.5 md:py-2 bg-red-600 text-white rounded-full text-xs md:text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {showImageModal && (
        <ImageModal
          imageUrl={selectedImage}
          onClose={() => {
            setShowImageModal(false);
            setSelectedImage('');
          }}
        />
      )}

      {/* Image Gallery Modal */}
      {showGalleryModal && (
        <ImageGalleryModal
          images={selectedImages}
          currentIndex={currentImageIndex}
          onClose={() => {
            setShowGalleryModal(false);
            setSelectedImages([]);
            setCurrentImageIndex(0);
          }}
          onIndexChange={setCurrentImageIndex}
        />
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <UserModal
          user={selectedUser}
          onClose={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSave={async () => {
            await loadUsers();
            setShowCreateModal(false);
            setShowEditModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {/* Plan Assignment Modal */}
      {showPlanModal && selectedUserForPlan && (
        <PlanAssignmentModal
          user={selectedUserForPlan}
          onClose={() => {
            setShowPlanModal(false);
            setSelectedUserForPlan(null);
          }}
          onSuccess={() => {
            setShowPlanModal(false);
            setSelectedUserForPlan(null);
            loadUsers();
          }}
        />
      )}
    </div>
  );
}

function ImageModal({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-3 transition-all"
      >
        <X className="w-8 h-8" />
      </button>
      <img
        src={imageUrl}
        alt="User"
        className="max-w-full max-h-full object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

function ImageGalleryModal({
  images,
  currentIndex,
  onClose,
  onIndexChange
}: {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  const goToPrevious = () => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      onIndexChange(currentIndex + 1);
    }
  };

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-95 flex flex-col items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 md:top-4 right-2 md:right-4 text-white hover:text-gray-300 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-2 md:p-3 transition-all z-10"
      >
        <X className="w-6 h-6 md:w-8 md:h-8" />
      </button>

      {/* Image counter */}
      <div className="absolute top-2 md:top-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-3 md:px-4 py-1.5 md:py-2 rounded-full font-medium z-10 text-sm md:text-base">
        {currentIndex + 1} of {images.length}
      </div>

      {/* Previous button */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToPrevious();
          }}
          className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-2 md:p-4 transition-all z-10"
        >
          <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
        </button>
      )}

      {/* Main image */}
      <img
        src={images[currentIndex]}
        alt={`Image ${currentIndex + 1}`}
        className="max-w-full max-h-[70vh] md:max-h-[85vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Next button */}
      {currentIndex < images.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-2 md:p-4 transition-all z-10"
        >
          <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
        </button>
      )}

      {/* Thumbnails at bottom */}
      <div className="absolute bottom-2 md:bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1.5 md:gap-2 max-w-full overflow-x-auto px-2 md:px-4 py-1.5 md:py-2 bg-black bg-opacity-50 rounded-full" onClick={(e) => e.stopPropagation()}>
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => onIndexChange(idx)}
            className={`flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden border-2 transition-all ${
              idx === currentIndex ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <img
              src={img}
              alt={`Thumbnail ${idx + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function UserModal({
  user,
  onClose,
  onSave
}: {
  user: UserProfile | null;
  onClose: () => void;
  onSave: () => void;
}) {
  // Initialize form with all user data
  const getInitialFormData = () => {
    if (!user) {
      return {
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        gender: '',
        dob: '',
        interestedIn: [] as string[],
        lookingFor: [] as string[],
        interests: [] as string[],
      };
    }

    return {
      firstName: user.onboarding?.data?.firstName || user.firstName || '',
      lastName: user.onboarding?.data?.lastName || user.lastName || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      gender: user.onboarding?.data?.gender || user.gender || '',
      dob: user.onboarding?.data?.dob || user.dob || '',
      interestedIn: user.onboarding?.data?.interestedIn || user.interestedIn || [],
      lookingFor: user.onboarding?.data?.lookingFor || user.lookingFor || [],
      interests: user.onboarding?.data?.interests || user.interests || [],
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());
  const [saving, setSaving] = useState(false);
  const [interestInput, setInterestInput] = useState('');
  const [interestedInInput, setInterestedInInput] = useState('');
  const [lookingForInput, setLookingForInput] = useState('');

  const addInterest = () => {
    if (interestInput.trim()) {
      setFormData({
        ...formData,
        interests: [...(formData.interests || []), interestInput.trim()]
      });
      setInterestInput('');
    }
  };

  const removeInterest = (index: number) => {
    setFormData({
      ...formData,
      interests: formData.interests?.filter((_: string, i: number) => i !== index) || []
    });
  };

  const addInterestedIn = () => {
    if (interestedInInput.trim()) {
      setFormData({
        ...formData,
        interestedIn: [...(formData.interestedIn || []), interestedInInput.trim()]
      });
      setInterestedInInput('');
    }
  };

  const removeInterestedIn = (index: number) => {
    setFormData({
      ...formData,
      interestedIn: formData.interestedIn?.filter((_: string, i: number) => i !== index) || []
    });
  };

  const addLookingFor = () => {
    if (lookingForInput.trim()) {
      setFormData({
        ...formData,
        lookingFor: [...(formData.lookingFor || []), lookingForInput.trim()]
      });
      setLookingForInput('');
    }
  };

  const removeLookingFor = (index: number) => {
    setFormData({
      ...formData,
      lookingFor: formData.lookingFor?.filter((_: string, i: number) => i !== index) || []
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (user) {
        await updateUser(user.uid, {
          ...formData,
          'onboarding.data.firstName': formData.firstName,
          'onboarding.data.lastName': formData.lastName,
          'onboarding.data.gender': formData.gender,
          'onboarding.data.dob': formData.dob,
          'onboarding.data.interests': formData.interests,
          'onboarding.data.interestedIn': formData.interestedIn,
          'onboarding.data.lookingFor': formData.lookingFor,
        } as any);
        alert('User updated successfully');
      } else {
        await createUser({
          ...formData,
          onboarding: {
            completed: false,
            currentStep: 0,
            data: formData
          }
        } as any);
        alert('User created successfully');
      }
      onSave();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-4 md:p-6 lg:p-8 w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            {user ? 'Edit User' : 'Create User'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName || ''}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName || ''}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber || ''}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="+919100045416"
                />
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  value={formData.gender || ''}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dob || ''}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* Interested In */}
          <div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Interested In</h3>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={interestedInInput}
                onChange={(e) => setInterestedInInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterestedIn())}
                placeholder="e.g., Men, Women..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
              <button
                type="button"
                onClick={addInterestedIn}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {formData.interestedIn && formData.interestedIn.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.interestedIn.map((item: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm flex items-center gap-2"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => removeInterestedIn(idx)}
                      className="hover:text-purple-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Looking For */}
          <div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Looking For</h3>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={lookingForInput}
                onChange={(e) => setLookingForInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLookingFor())}
                placeholder="e.g., Friendship, Dating..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
              <button
                type="button"
                onClick={addLookingFor}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {formData.lookingFor && formData.lookingFor.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.lookingFor.map((item: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center gap-2"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => removeLookingFor(idx)}
                      className="hover:text-green-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Interests */}
          <div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Interests</h3>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                placeholder="e.g., Travel, Music, Sports..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
              <button
                type="button"
                onClick={addInterest}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {formData.interests && formData.interests.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.interests.map((interest: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() => removeInterest(idx)}
                      className="hover:text-blue-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 md:gap-4 mt-4 md:mt-6 pt-4 md:pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 md:px-6 py-2 text-sm md:text-base border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 px-4 md:px-6 py-2 text-sm md:text-base bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4 md:w-5 md:h-5" />
              {saving ? 'Saving...' : 'Save User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PlanAssignmentModal({
  user,
  onClose,
  onSuccess
}: {
  user: UserProfile;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>('');
  const [adminNote, setAdminNote] = useState<string>('');
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);

  // Fetch plans and current subscription on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const { getSubscriptionPlans, getUserSubscription } = await import('@/services/subscriptions');
        const [fetchedPlans, subscription] = await Promise.all([
          getSubscriptionPlans(),
          getUserSubscription(user.uid)
        ]);
        console.log('Fetched subscription for modal:', subscription);
        setPlans(fetchedPlans);
        setCurrentSubscription(subscription || { currentPlan: 'free', isActive: false });
      } catch (error) {
        console.error('Error fetching data:', error);
        setCurrentSubscription({ currentPlan: 'free', isActive: false });
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [user.uid]);

  // Auto-calculate end date when plan or start date changes
  useEffect(() => {
    if (selectedPlan && startDate) {
      const plan = plans.find(p => p.id === selectedPlan);
      if (plan) {
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(end.getDate() + plan.duration);
        setEndDate(end.toISOString().split('T')[0]);
      }
    }
  }, [selectedPlan, startDate, plans]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlan) {
      alert('Please select a plan');
      return;
    }

    if (!startDate || !endDate) {
      alert('Please select start and end dates');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      alert('End date must be after start date');
      return;
    }

    setLoading(true);

    try {
      const { assignPlanToUser } = await import('@/services/subscriptions');
      await assignPlanToUser(
        user.uid,
        selectedPlan as 'daily' | 'weekly' | 'monthly' | 'free',
        start,
        end,
        adminNote || 'Manual plan assignment from admin panel'
      );

      alert(`Successfully assigned ${selectedPlan} plan to ${user.firstName || user.uid}`);
      onSuccess();
    } catch (error) {
      console.error('Error assigning plan:', error);
      alert('Failed to assign plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Assign Subscription Plan</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* User Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">User Information</h3>
          <p className="text-sm text-gray-600">Name: {user.firstName} {user.lastName}</p>
          <p className="text-sm text-gray-600">Phone: {user.phoneNumber}</p>
          <p className="text-sm text-gray-600 font-mono">ID: {user.uid}</p>
        </div>

        {/* Current Subscription */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Current Subscription
          </h3>
          {loadingData ? (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
              <span className="ml-2 text-sm text-blue-800">Loading subscription...</span>
            </div>
          ) : currentSubscription ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-800">Plan:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  currentSubscription.currentPlan === 'free'
                    ? 'bg-gray-100 text-gray-800'
                    : currentSubscription.currentPlan === 'daily'
                    ? 'bg-blue-100 text-blue-800'
                    : currentSubscription.currentPlan === 'weekly'
                    ? 'bg-purple-100 text-purple-800'
                    : currentSubscription.currentPlan === 'monthly'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {currentSubscription.currentPlan?.toUpperCase() || 'FREE'}
                </span>
              </div>
              {currentSubscription.planStartDate && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-800">Start Date:</span>
                  <span className="text-sm font-medium text-blue-900">
                    {format(new Date(currentSubscription.planStartDate), 'MMM dd, yyyy')}
                  </span>
                </div>
              )}
              {currentSubscription.planEndDate && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-800">End Date:</span>
                  <span className="text-sm font-medium text-blue-900">
                    {format(new Date(currentSubscription.planEndDate), 'MMM dd, yyyy')}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-800">Status:</span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  currentSubscription.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {currentSubscription.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {currentSubscription.swipesLimit !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-800">Daily Swipes:</span>
                  <span className="text-sm font-medium text-blue-900">
                    {currentSubscription.swipesLimit === -1 ? 'Unlimited' : currentSubscription.swipesLimit}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-800">Plan:</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                  FREE
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-800">Status:</span>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">
                  Inactive
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-800">Daily Swipes:</span>
                <span className="text-sm font-medium text-blue-900">5</span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Plan Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Plan *
            </label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              required
            >
              <option value="">Choose a plan...</option>
              <option value="free">Free Plan (5 swipes/day)</option>
              {plans.filter(p => p.active).map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.displayName} - ₹{plan.price} ({plan.duration} days, {plan.swipeLimit === -1 ? 'Unlimited' : plan.swipeLimit} swipes/day)
                </option>
              ))}
            </select>
          </div>

          {/* Date Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                required
              />
              {selectedPlan && (
                <p className="text-xs text-gray-500 mt-1">
                  Auto-calculated based on plan duration
                </p>
              )}
            </div>
          </div>

          {/* Duration Display */}
          {startDate && endDate && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900">
                Plan Duration: {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days
              </p>
            </div>
          )}

          {/* Admin Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Note (Optional)
            </label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Add a note about this plan assignment..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This will immediately update the user's subscription. The user's current swipes will be reset to 0.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Crown className="w-5 h-5" />
              {loading ? 'Assigning...' : 'Assign Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
