'use client';

import { useState, useRef } from 'react';
import { migrateUsers, validateMongoUsers, MongoUser } from '@/services/migration';

export default function MigrateUsersPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<any>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<MongoUser[]>([]);
  const [errorModal, setErrorModal] = useState<{ userId: string; error: string; index: number; total: number } | null>(null);
  const [errorModalResolve, setErrorModalResolve] = useState<((value: boolean) => void) | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrors([]);
    setResults(null);
    setPreviewData([]);

    // Read and validate file
    try {
      const text = await selectedFile.text();
      const data = JSON.parse(text);

      const validation = validateMongoUsers(data);
      if (!validation.valid) {
        setErrors(validation.errors);
        setFile(null);
        return;
      }

      // Show preview of first 5 users
      setPreviewData(data.slice(0, 5));
    } catch (error: any) {
      setErrors([`Failed to parse JSON file: ${error.message}`]);
      setFile(null);
    }
  };

  const handleErrorModalResponse = (shouldContinue: boolean) => {
    if (errorModalResolve) {
      errorModalResolve(shouldContinue);
      setErrorModalResolve(null);
    }
    setErrorModal(null);
  };

  const handleMigrate = async () => {
    if (!file) return;

    setIsUploading(true);
    setProgress({ current: 0, total: 0 });
    setResults(null);
    setErrors([]);

    try {
      const text = await file.text();
      const mongoUsers = JSON.parse(text);

      const migrationResults = await migrateUsers(
        mongoUsers,
        (current, total, result) => {
          setProgress({ current, total });
        },
        async (error, currentIndex, total) => {
          // Show error modal and wait for user response
          return new Promise<boolean>((resolve) => {
            setErrorModal({
              userId: error.userId,
              error: error.error,
              index: currentIndex,
              total,
            });
            setErrorModalResolve(() => resolve);
          });
        }
      );

      setResults(migrationResults);
    } catch (error: any) {
      setErrors([`Migration failed: ${error.message}`]);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setErrors([]);
    setResults(null);
    setPreviewData([]);
    setProgress({ current: 0, total: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Migrate Users</h1>
        <p className="text-gray-600 mt-2">
          Upload MongoDB user data (JSON) to migrate to Firestore
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload JSON File</h2>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
            disabled={isUploading}
          />
          <label
            htmlFor="file-upload"
            className={`cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
              isUploading ? 'bg-gray-400' : 'bg-pink-600 hover:bg-pink-700'
            }`}
          >
            {file ? 'Change File' : 'Choose JSON File'}
          </label>

          {file && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                Selected: <span className="font-medium">{file.name}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Expected JSON Format:</h3>
          <pre className="text-xs text-blue-800 overflow-x-auto">
{`[
  {
    "_id": { "$oid": "..." },
    "id": "user-firebase-uid",
    "name": "John Doe",
    "gender": "Male",
    "genderOfInterest": "Women",
    "photoUrl": "https://...",
    "rating": 4,
    "age": 25,
    "interests": ["Travel", "Music"],
    ...
  }
]`}
          </pre>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-red-900 mb-2">Validation Errors:</h3>
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm text-red-800">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview */}
      {previewData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Preview (First {previewData.length} users)
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    ID
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Gender
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Interested In
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.map((user, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm text-gray-900 font-mono">
                      {user.id.substring(0, 12)}...
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">{user.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{user.gender}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{user.genderOfInterest}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Migration Actions */}
      {file && !results && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Ready to Migrate</h2>
              <p className="text-sm text-gray-600 mt-1">
                All users will be migrated to Firestore with location: Ranchi (23.3516935, 85.2543815)
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                onClick={handleMigrate}
                className={`px-6 py-2 rounded-md text-white font-medium ${
                  isUploading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-pink-600 hover:bg-pink-700'
                }`}
                disabled={isUploading}
              >
                {isUploading ? 'Migrating...' : 'Start Migration'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress */}
      {isUploading && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Migration Progress</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                Migrating user {progress.current} of {progress.total}
              </span>
              <span>
                {progress.total > 0
                  ? Math.round((progress.current / progress.total) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-pink-600 h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {results.stoppedEarly ? 'Migration Stopped' : 'Migration Complete'}
            </h2>
            {results.stoppedEarly && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                Stopped Early
              </span>
            )}
          </div>

          {results.stoppedEarly && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Migration was stopped after encountering an error. Only {results.successCount} out of {results.totalUsers} users were successfully migrated.
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-900">{results.totalUsers}</div>
              <div className="text-sm text-blue-700">Total Users</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-900">{results.successCount}</div>
              <div className="text-sm text-green-700">Successful</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-900">{results.failedCount}</div>
              <div className="text-sm text-red-700">Failed</div>
            </div>
          </div>

          {results.failedCount > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Failed Users:</h3>
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        User ID
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Error
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.results
                      .filter((r: any) => !r.success)
                      .map((result: any, index: number) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900 font-mono">
                            {result.userId}
                          </td>
                          <td className="px-4 py-2 text-sm text-red-600">{result.error}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button
            onClick={handleReset}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Migrate Another File
          </button>
        </div>
      )}

      {/* Error Modal */}
      {errorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-medium text-gray-900">Migration Error</h3>
                <div className="mt-2 text-sm text-gray-500">
                  <p className="mb-2">
                    <strong>User {errorModal.index} of {errorModal.total}</strong>
                  </p>
                  <p className="mb-1">
                    <strong>User ID:</strong>{' '}
                    <span className="font-mono text-xs">{errorModal.userId}</span>
                  </p>
                  <p className="mb-3">
                    <strong>Error:</strong>{' '}
                    <span className="text-red-600 font-medium">{errorModal.error}</span>
                  </p>
                  <p className="text-gray-700">
                    Do you want to continue migrating the remaining users or stop here?
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => handleErrorModalResponse(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
              >
                Stop Migration
              </button>
              <button
                onClick={() => handleErrorModalResponse(true)}
                className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 font-medium"
              >
                Continue to Next User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
