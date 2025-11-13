'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface AuthFormProps {
  mode?: 'login' | 'register';
}

export default function AuthForm({ mode: initialMode = 'login' }: AuthFormProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        // 로그인 (이메일 또는 사용자명)
        const identifier = formData.email || formData.username;
        const result = await login(identifier, formData.password);

        if (result.success) {
          router.push('/dashboard');
        } else {
          setError(result.error || 'Login failed');
        }
      } else {
        // 회원가입
        const result = await register(
          formData.email,
          formData.username,
          formData.password,
          formData.name || undefined
        );

        if (result.success) {
          router.push('/dashboard');
        } else {
          setError(result.error || 'Registration failed');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setFormData({
      email: '',
      username: '',
      password: '',
      name: '',
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {mode === 'login' ? '로그인' : '회원가입'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {mode === 'login'
              ? '매니징 에이전트에 오신 것을 환영합니다'
              : '새로운 계정을 만들어 시작하세요'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {mode === 'register' && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  이메일
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="example@email.com"
                />
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                {mode === 'login' ? '이메일 또는 사용자명' : '사용자명'}
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required={mode === 'register'}
                value={formData.username}
                onChange={handleInputChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder={mode === 'login' ? '이메일 또는 사용자명' : '3-20자, 영문/숫자만'}
                minLength={mode === 'register' ? 3 : undefined}
                maxLength={mode === 'register' ? 20 : undefined}
              />
            </div>

            {mode === 'register' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  이름 (선택)
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="홍길동"
                />
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder={mode === 'register' ? '최소 8자' : '비밀번호'}
                minLength={mode === 'register' ? 8 : undefined}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 py-2 px-4 rounded">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              {mode === 'login'
                ? '계정이 없으신가요? 회원가입'
                : '이미 계정이 있으신가요? 로그인'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
