'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getAllUsers, deleteUser, filterUsers, createUser, updateUser } from '@/services/users';
import { UserProfile, UserFilters } from '@/types/user';
import { Search, Plus, Edit, Trash2, X, Save, ZoomIn, User as UserIcon, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
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
  }, [searchTerm, filters, users]);

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

  const getPictures = (user: UserProfile) => {
    const pictures = user.onboarding?.data?.pictures || user.pictures;
    if (!pictures || pictures.length === 0) return [];
    return pictures;
  };

  const getUserName = (user: UserProfile) => {
    const firstName = user.onboarding?.data?.firstName || user.firstName || '';
    const lastName = user.onboarding?.data?.lastName || user.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'N/A';
  };

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create User
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <select
            value={filters.gender || ''}
            onChange={(e) => setFilters({ ...filters, gender: e.target.value || undefined })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          >
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
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
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
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
          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {selectedUserIds.length} user(s) selected
            </span>
            <button
              onClick={() => setSelectedUserIds([])}
              className="text-sm text-primary-600 hover:text-primary-700"
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
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected ({selectedUserIds.length})
            </button>
          </div>
        )}
      </div>

      {/* Users Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => {
          const pictures = getPictures(user);
          const interests = getInterests(user);
          const interestedIn = getInterestedIn(user);

          return (
            <div key={user.uid} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* User Image */}
              <div className="relative h-64 bg-gray-200">
                {pictures.length > 0 ? (
                  <div
                    className="relative h-full cursor-pointer group"
                    onClick={() => handleViewGallery(pictures, 0)}
                  >
                    <img
                      src={pictures[0]}
                      alt={getUserName(user)}
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
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {getUserName(user)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {user.phoneNumber || user.email || 'No contact'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit user"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(user.uid)}
                      className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete user"
                    >
                      <Trash2 className="w-5 h-5" />
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
                    <span className="text-gray-600">Registered:</span>
                    <span className="font-medium text-gray-900">{formatDate(user.createdAt)}</span>
                  </div>
                  {interestedIn.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Interested In:</span>
                      <span className="font-medium text-gray-900 capitalize">{interestedIn.join(', ')}</span>
                    </div>
                  )}
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

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No users found</p>
        </div>
      )}

      {/* Bulk Selection Bar */}
      {selectedUserIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 z-40">
          <span className="font-medium">
            {selectedUserIds.length} user{selectedUserIds.length > 1 ? 's' : ''} selected
          </span>
          <button
            onClick={selectAllUsers}
            className="px-4 py-2 bg-white text-gray-900 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            {selectedUserIds.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
          </button>
          <button
            onClick={() => setSelectedUserIds([])}
            className="px-4 py-2 bg-red-600 text-white rounded-full text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Clear
          </button>
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
        className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-3 transition-all z-10"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Image counter */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded-full font-medium z-10">
        {currentIndex + 1} of {images.length}
      </div>

      {/* Previous button */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToPrevious();
          }}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-4 transition-all z-10"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {/* Main image */}
      <img
        src={images[currentIndex]}
        alt={`Image ${currentIndex + 1}`}
        className="max-w-full max-h-[85vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Next button */}
      {currentIndex < images.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-4 transition-all z-10"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      {/* Thumbnails at bottom */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4 py-2 bg-black bg-opacity-50 rounded-full" onClick={(e) => e.stopPropagation()}>
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => onIndexChange(idx)}
            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
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
        height: '',
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
      height: user.onboarding?.data?.height || '',
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
          'onboarding.data.height': formData.height,
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
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {user ? 'Edit User' : 'Create User'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Details</h3>
            <div className="grid grid-cols-3 gap-4">
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
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height
                </label>
                <input
                  type="text"
                  value={formData.height || ''}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="e.g., 181 cm"
                />
              </div>
            </div>
          </div>

          {/* Interested In */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Interested In</h3>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Looking For</h3>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Interests</h3>
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
          <div className="flex justify-end gap-4 mt-6 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
