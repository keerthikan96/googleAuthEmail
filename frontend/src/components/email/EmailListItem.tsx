import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EmailMetadata } from '../../types';
import { useMarkAsRead, useMarkAsImportant, useStarEmail } from '../../hooks/useEmails';
import { Badge } from '../common/UI';

interface EmailListItemProps {
  email: EmailMetadata;
}

export function EmailListItem({ email }: EmailListItemProps) {
  const navigate = useNavigate();
  const markAsReadMutation = useMarkAsRead();
  const markAsImportantMutation = useMarkAsImportant();
  const starEmailMutation = useStarEmail();

  const handleClick = () => {
    navigate(`/email/${email.id}`);
    
    // Mark as read when opening
    if (!email.isRead) {
      markAsReadMutation.mutate({ id: email.id, isRead: true });
    }
  };

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    starEmailMutation.mutate({ id: email.id, isStarred: !email.isStarred });
  };

  const handleImportantClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAsImportantMutation.mutate({ id: email.id, isImportant: !email.isImportant });
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const emailDate = new Date(date);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const emailDateOnly = new Date(emailDate.getFullYear(), emailDate.getMonth(), emailDate.getDate());

    if (emailDateOnly.getTime() === today.getTime()) {
      return emailDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (emailDateOnly.getTime() === today.getTime() - 24 * 60 * 60 * 1000) {
      return 'Yesterday';
    } else {
      return emailDate.toLocaleDateString();
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div
      onClick={handleClick}
      className={`
        group cursor-pointer border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors
        ${!email.isRead ? 'bg-blue-50 border-blue-200' : 'bg-white'}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className={`font-medium ${!email.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                {email.fromName || email.fromEmail}
              </span>
              {!email.isRead && (
                <Badge variant="info" size="sm">
                  New
                </Badge>
              )}
              {email.isImportant && (
                <Badge variant="warning" size="sm">
                  Important
                </Badge>
              )}
              {email.hasAttachments && (
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {formatDate(email.receivedAt)}
              </span>
              <button
                onClick={handleStarClick}
                className={`p-1 rounded hover:bg-gray-200 ${
                  email.isStarred ? 'text-yellow-500' : 'text-gray-400'
                }`}
                title={email.isStarred ? 'Remove star' : 'Add star'}
              >
                <svg className="w-5 h-5" fill={email.isStarred ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
              <button
                onClick={handleImportantClick}
                className={`p-1 rounded hover:bg-gray-200 ${
                  email.isImportant ? 'text-red-500' : 'text-gray-400'
                }`}
                title={email.isImportant ? 'Remove importance' : 'Mark as important'}
              >
                <svg className="w-5 h-5" fill={email.isImportant ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </button>
            </div>
          </div>
          
          <h3 className={`text-sm mb-1 ${!email.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
            {email.subject || '(No subject)'}
          </h3>
          
          <p className="text-sm text-gray-600 line-clamp-2">
            {truncateText(email.bodySnippet, 150)}
          </p>

          {email.labels && email.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {email.labels.slice(0, 3).map((label) => (
                <Badge key={label} variant="default" size="sm">
                  {label}
                </Badge>
              ))}
              {email.labels.length > 3 && (
                <Badge variant="default" size="sm">
                  +{email.labels.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
