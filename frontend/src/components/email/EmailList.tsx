import React, { useState } from 'react';
import { useEmails, useEmailStats, useSyncEmails } from '../../hooks/useEmails';
import { EmailSearchParams } from '../../types';
import { Button, Input, Card, Loader } from '../common/UI';
import { EmailListItem } from './EmailListItem';

export function EmailList() {
  const [searchParams, setSearchParams] = useState<EmailSearchParams>({
    page: 1,
    limit: 20,
    sortBy: 'receivedAt',
    sortOrder: 'DESC',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data: emailsData, isLoading, error } = useEmails(searchParams);
  const { data: stats } = useEmailStats();
  const syncEmailsMutation = useSyncEmails();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(prev => ({
      ...prev,
      query: searchQuery,
      page: 1,
    }));
  };

  const handleFilterChange = (filters: Partial<EmailSearchParams>) => {
    setSearchParams(prev => ({
      ...prev,
      ...filters,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }));
  };

  const handleSyncEmails = () => {
    syncEmailsMutation.mutate();
  };

  if (error) {
    return (
      <div className="p-6">
        <Card className="text-center">
          <p className="text-red-600">Failed to load emails. Please try again.</p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header with stats and sync button */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Emails</h1>
          {stats && (
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>Total: {stats.totalEmails}</span>
              <span>Unread: {stats.unreadEmails}</span>
              <span>Important: {stats.importantEmails}</span>
              <span>Starred: {stats.starredEmails}</span>
            </div>
          )}
        </div>
        <Button
          onClick={handleSyncEmails}
          isLoading={syncEmailsMutation.isPending}
          className="mt-4 lg:mt-0"
        >
          Sync Gmail
        </Button>
      </div>

      {/* Search and filters */}
      <Card className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-4 mb-4">
          <Input
            type="text"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">Search</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
        </form>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={searchParams.isRead === undefined ? 'all' : searchParams.isRead ? 'read' : 'unread'}
                onChange={(e) => {
                  const value = e.target.value;
                  handleFilterChange({
                    isRead: value === 'all' ? undefined : value === 'read',
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Important
              </label>
              <select
                value={searchParams.isImportant === undefined ? 'all' : searchParams.isImportant ? 'yes' : 'no'}
                onChange={(e) => {
                  const value = e.target.value;
                  handleFilterChange({
                    isImportant: value === 'all' ? undefined : value === 'yes',
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All</option>
                <option value="yes">Important</option>
                <option value="no">Not Important</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Starred
              </label>
              <select
                value={searchParams.isStarred === undefined ? 'all' : searchParams.isStarred ? 'yes' : 'no'}
                onChange={(e) => {
                  const value = e.target.value;
                  handleFilterChange({
                    isStarred: value === 'all' ? undefined : value === 'yes',
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All</option>
                <option value="yes">Starred</option>
                <option value="no">Not Starred</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={searchParams.fromDate || ''}
                onChange={(e) => handleFilterChange({ fromDate: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={searchParams.toDate || ''}
                onChange={(e) => handleFilterChange({ toDate: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Email list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader size="lg" />
        </div>
      ) : emailsData?.emails.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500">No emails found</p>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {emailsData?.emails.map((email) => (
              <EmailListItem key={email.id} email={email} />
            ))}
          </div>

          {/* Pagination */}
          {emailsData && emailsData.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => handlePageChange(emailsData.currentPage - 1)}
                disabled={!emailsData.hasPreviousPage}
              >
                Previous
              </Button>
              
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {emailsData.currentPage} of {emailsData.totalPages}
              </span>
              
              <Button
                variant="outline"
                onClick={() => handlePageChange(emailsData.currentPage + 1)}
                disabled={!emailsData.hasNextPage}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
