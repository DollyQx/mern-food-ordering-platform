'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data));
            // Force reload or use context update to refresh Navbar state if needed
            window.location.href = '/menu';
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="flex min-h-[80vh] items-center justify-center px-4">
            <div className="w-full max-w-sm rounded-[var(--radius)] border bg-card p-6 shadow-sm">
                <h1 className="mb-6 text-2xl font-bold text-center">Login</h1>
                {error && <p className="mb-4 text-sm text-red-500 text-center">{error}</p>}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium leading-none">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            placeholder="user@example.com"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium leading-none">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        Sign In
                    </button>
                </form>
                <div className="mt-4 text-center text-sm">
                    <p className="text-muted-foreground">Don't have an account? <a href="/signup" className="text-primary hover:underline">Sign up</a></p>
                </div>
            </div>
        </div>
    );
}
