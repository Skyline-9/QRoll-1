import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as forgotPasswordPost } from './forgot-password';
import { POST as resetPasswordPost } from './reset-password';
import { createSupabaseClient } from '../../../lib/supabase';

// Mock the supabase client module
vi.mock('../../../lib/supabase', () => {
  const mockAuth = {
    resetPasswordForEmail: vi.fn(),
    getSession: vi.fn(),
    updateUser: vi.fn(),
  };
  const mockClient = {
    auth: mockAuth,
  };
  return {
    createSupabaseClient: vi.fn(() => mockClient),
  };
});

describe('Forgot Password API Endpoint', () => {
  let mockCookies: any;
  let mockUrl: URL;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCookies = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    };
    mockUrl = new URL('http://localhost:3000/api/auth/forgot-password');
  });

  it('should return 400 if email is missing', async () => {
    const formData = new FormData();
    const mockRequest = new Request('http://localhost:3000', {
      method: 'POST',
      body: formData,
    });

    const response = await forgotPasswordPost({
      request: mockRequest,
      cookies: mockCookies,
      url: mockUrl,
    } as any);

    expect(response.status).toBe(400);
    const text = await response.text();
    expect(text).toBe('Email is required');
  });

  it('should return 400 if supabase.auth.resetPasswordForEmail fails', async () => {
    const formData = new FormData();
    formData.append('email', 'test@example.com');
    const mockRequest = new Request('http://localhost:3000', {
      method: 'POST',
      body: formData,
    });

    const mockClient = createSupabaseClient(mockCookies);
    vi.mocked(mockClient.auth.resetPasswordForEmail).mockResolvedValueOnce({
      data: null,
      error: { message: 'Some Supabase error' } as any,
    });

    const response = await forgotPasswordPost({
      request: mockRequest,
      cookies: mockCookies,
      url: mockUrl,
    } as any);

    expect(response.status).toBe(400);
    const text = await response.text();
    expect(text).toBe('Some Supabase error');
    expect(mockClient.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
      redirectTo: 'http://localhost:3000/api/auth/callback?next=%2Freset-password',
    });
  });

  it('should return 200 and success message on success', async () => {
    const formData = new FormData();
    formData.append('email', 'test@example.com');
    const mockRequest = new Request('http://localhost:3000', {
      method: 'POST',
      body: formData,
    });

    const mockClient = createSupabaseClient(mockCookies);
    vi.mocked(mockClient.auth.resetPasswordForEmail).mockResolvedValueOnce({
      data: {},
      error: null,
    });

    const response = await forgotPasswordPost({
      request: mockRequest,
      cookies: mockCookies,
      url: mockUrl,
    } as any);

    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toBe('Check your email for the password reset link!');
  });
});

describe('Reset Password API Endpoint', () => {
  let mockCookies: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCookies = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    };
  });

  it('should return 400 if password is missing or too short', async () => {
    const formData = new FormData();
    formData.append('password', '12345'); // less than 6 characters
    const mockRequest = new Request('http://localhost:3000', {
      method: 'POST',
      body: formData,
    });

    const response = await resetPasswordPost({
      request: mockRequest,
      cookies: mockCookies,
    } as any);

    expect(response.status).toBe(400);
    const text = await response.text();
    expect(text).toBe('Password must be at least 6 characters long');
  });

  it('should return 401 if user has no active session', async () => {
    const formData = new FormData();
    formData.append('password', 'new-password-123');
    const mockRequest = new Request('http://localhost:3000', {
      method: 'POST',
      body: formData,
    });

    const mockClient = createSupabaseClient(mockCookies);
    vi.mocked(mockClient.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    } as any);

    const response = await resetPasswordPost({
      request: mockRequest,
      cookies: mockCookies,
    } as any);

    expect(response.status).toBe(401);
    const text = await response.text();
    expect(text).toBe('Unauthorized: Session not found');
  });

  it('should return 400 if supabase.auth.updateUser fails', async () => {
    const formData = new FormData();
    formData.append('password', 'new-password-123');
    const mockRequest = new Request('http://localhost:3000', {
      method: 'POST',
      body: formData,
    });

    const mockClient = createSupabaseClient(mockCookies);
    vi.mocked(mockClient.auth.getSession).mockResolvedValueOnce({
      data: { session: { user: { id: 'user-id' } } },
      error: null,
    } as any);
    vi.mocked(mockClient.auth.updateUser).mockResolvedValueOnce({
      data: null,
      error: { message: 'Weak password or database error' } as any,
    });

    const response = await resetPasswordPost({
      request: mockRequest,
      cookies: mockCookies,
    } as any);

    expect(response.status).toBe(400);
    const text = await response.text();
    expect(text).toBe('Weak password or database error');
  });

  it('should return 200 on successful password update', async () => {
    const formData = new FormData();
    formData.append('password', 'new-password-123');
    const mockRequest = new Request('http://localhost:3000', {
      method: 'POST',
      body: formData,
    });

    const mockClient = createSupabaseClient(mockCookies);
    vi.mocked(mockClient.auth.getSession).mockResolvedValueOnce({
      data: { session: { user: { id: 'user-id' } } },
      error: null,
    } as any);
    vi.mocked(mockClient.auth.updateUser).mockResolvedValueOnce({
      data: { user: { id: 'user-id' } },
      error: null,
    } as any);

    const response = await resetPasswordPost({
      request: mockRequest,
      cookies: mockCookies,
    } as any);

    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toBe('Password updated successfully');
    expect(mockClient.auth.updateUser).toHaveBeenCalledWith({ password: 'new-password-123' });
  });
});
