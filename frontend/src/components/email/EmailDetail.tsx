import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEmail, useMarkAsRead, useMarkAsImportant, useStarEmail } from '../../hooks/useEmails';
import { Button, Card, Badge, Loader } from '../common/UI';

export function EmailDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: email, isLoading, error } = useEmail(id!);
  const markAsReadMutation = useMarkAsRead();
  const markAsImportantMutation = useMarkAsImportant();
  const starEmailMutation = useStarEmail();

  React.useEffect(() => {
    // Mark as read when viewing
    if (email && !email.isRead) {
      markAsReadMutation.mutate({ id: email.id, isRead: true });
    }
  }, [email, markAsReadMutation]);

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Loader size="lg" />
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="text-center">
          <p className="text-red-600">Failed to load email. Please try again.</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Back to Inbox
          </Button>
        </Card>
      </div>
    );
  }

  const handleStarClick = () => {
    starEmailMutation.mutate({ id: email.id, isStarred: !email.isStarred });
  };

  const handleImportantClick = () => {
    markAsImportantMutation.mutate({ id: email.id, isImportant: !email.isImportant });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const renderEmailBody = () => {
    if (email.bodyHtml) {
      return (
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
        />
      );
    } else if (email.bodyText) {
      return (
        <div className="whitespace-pre-wrap text-gray-800">
          {email.bodyText}
        </div>
      );
    } else {
      return (
        <div className="text-gray-600 italic">
          {email.bodySnippet}
        </div>
      );
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          onClick={() => navigate('/')}
        >
          ← Back to Inbox
        </Button>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            onClick={handleStarClick}
            className={email.isStarred ? 'text-yellow-500' : 'text-gray-400'}
          >
            <svg className="w-5 h-5" fill={email.isStarred ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            {email.isStarred ? 'Starred' : 'Star'}
          </Button>
          
          <Button
            variant="ghost"
            onClick={handleImportantClick}
            className={email.isImportant ? 'text-red-500' : 'text-gray-400'}
          >
            <svg className="w-5 h-5" fill={email.isImportant ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {email.isImportant ? 'Important' : 'Mark Important'}
          </Button>
        </div>
      </div>

      {/* Email Content */}
      <Card>
        {/* Email Header */}
        <div className="border-b border-gray-200 pb-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {email.subject || '(No subject)'}
          </h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex items-center mb-2">
                <span className="font-medium text-gray-700 w-16">From:</span>
                <span className="text-gray-900">
                  {email.fromName ? `${email.fromName} <${email.fromEmail}>` : email.fromEmail}
                </span>
              </div>
              
              <div className="flex items-start mb-2">
                <span className="font-medium text-gray-700 w-16 flex-shrink-0">To:</span>
                <div className="flex-1">
                  {email.toEmails.map((to, index) => (
                    <span key={index} className="text-gray-900">
                      {to}
                      {index < email.toEmails.length - 1 && ', '}
                    </span>
                  ))}
                </div>
              </div>
              
              {email.ccEmails && email.ccEmails.length > 0 && (
                <div className="flex items-start mb-2">
                  <span className="font-medium text-gray-700 w-16 flex-shrink-0">CC:</span>
                  <div className="flex-1">
                    {email.ccEmails.map((cc, index) => (
                      <span key={index} className="text-gray-900">
                        {cc}
                        {index < (email.ccEmails?.length || 0) - 1 && ', '}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <div className="flex items-center mb-2">
                <span className="font-medium text-gray-700 w-20">Date:</span>
                <span className="text-gray-900">{formatDate(email.receivedAt)}</span>
              </div>
              
              {email.hasAttachments && (
                <div className="flex items-center mb-2">
                  <span className="font-medium text-gray-700 w-20">Attachments:</span>
                  <span className="text-gray-900 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    {email.attachmentCount} file{email.attachmentCount !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Labels */}
          {email.labels && email.labels.length > 0 && (
            <div className="mt-4">
              <span className="font-medium text-gray-700 mr-2">Labels:</span>
              <div className="inline-flex flex-wrap gap-1">
                {email.labels.map((label) => (
                  <Badge key={label} variant="default" size="sm">
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Status badges */}
          <div className="flex items-center space-x-2 mt-4">
            {!email.isRead && (
              <Badge variant="info" size="sm">
                Unread
              </Badge>
            )}
            {email.isImportant && (
              <Badge variant="warning" size="sm">
                Important
              </Badge>
            )}
            {email.isStarred && (
              <Badge variant="default" size="sm">
                Starred
              </Badge>
            )}
          </div>
        </div>
        
        {/* Email Body */}
        <div className="prose max-w-none">
          {renderEmailBody()}
        </div>
      </Card>
    </div>
  );
}
