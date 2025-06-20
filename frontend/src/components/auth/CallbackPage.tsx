import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';
import { Loader } from '../common/UI';

export function CallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        navigate('/login?error=oauth_failed');
        return;
      }

      // Handle direct token from backend redirect
      if (token) {
        try {
          // Store the token and get user info
          localStorage.setItem('token', token);
          
          // Get user profile using the token
          const user = await authService.getProfile();
          login(token, user);
          navigate('/');
        } catch (error) {
          console.error('Failed to authenticate with token:', error);
          localStorage.removeItem('token');
          navigate('/login?error=token_invalid');
        }
        return;
      }

      // Handle authorization code flow
      if (!code) {
        console.error('No authorization code or token received');
        navigate('/login?error=no_code');
        return;
      }

      try {
        const { token, user } = await authService.handleCallback(code);
        login(token, user);
        navigate('/');
      } catch (error) {
        console.error('Failed to handle OAuth callback:', error);
        navigate('/login?error=callback_failed');
      }
    };

    handleCallback();
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader size="lg" />
        <p className="mt-4 text-gray-600">Signing you in...</p>
      </div>
    </div>
  );
}
