import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emailService } from '../services/api';
import { EmailSearchParams } from '../types';

export function useEmails(params: EmailSearchParams = {}) {
  return useQuery({
    queryKey: ['emails', params],
    queryFn: () => emailService.getEmails(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useEmail(id: string) {
  return useQuery({
    queryKey: ['email', id],
    queryFn: () => emailService.getEmailById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEmailStats() {
  return useQuery({
    queryKey: ['email-stats'],
    queryFn: () => emailService.getStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useSyncEmails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: emailService.syncEmails,
    onSuccess: () => {
      // Invalidate email queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['email-stats'] });
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isRead }: { id: string; isRead: boolean }) =>
      emailService.markAsRead(id, isRead),
    onSuccess: (updatedEmail) => {
      // Update the email in the cache
      queryClient.setQueryData(['email', updatedEmail.id], updatedEmail);
      
      // Invalidate email list to refetch
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['email-stats'] });
    },
  });
}

export function useMarkAsImportant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isImportant }: { id: string; isImportant: boolean }) =>
      emailService.markAsImportant(id, isImportant),
    onSuccess: (updatedEmail) => {
      queryClient.setQueryData(['email', updatedEmail.id], updatedEmail);
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['email-stats'] });
    },
  });
}

export function useStarEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isStarred }: { id: string; isStarred: boolean }) =>
      emailService.starEmail(id, isStarred),
    onSuccess: (updatedEmail) => {
      queryClient.setQueryData(['email', updatedEmail.id], updatedEmail);
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['email-stats'] });
    },
  });
}
