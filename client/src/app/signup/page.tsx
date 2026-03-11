'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';

export default function SignupPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        if (id === 'phone') {
            // Only allow digits
            if (/^\d*$/.test(value)) {
                setFormData({ ...formData, [id]: value });
            }
        } else {
            setFormData({ ...formData, [id]: value });
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.post('/auth/register', formData);
            // After signup, automatically login
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data));
            window.location.href = '/menu';
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[80vh] items-center justify-center px-4">
            <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">
                <h1 className="mb-2 text-2xl font-bold text-center">Create an Account</h1>
                <p className="mb-6 text-sm text-center text-muted-foreground">Enter your details to get started</p>

                {error && <div className="mb-4 p-3 rounded bg-red-50 text-red-600 text-sm border border-red-200">{error}</div>}

                <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium leading-none">Full Name</label>
                        <input
                            id="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            placeholder="John Doe"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium leading-none">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            placeholder="user@example.com"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="phone" className="text-sm font-medium leading-none">Phone Number</label>
                        <input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            placeholder="9876543210"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium leading-none">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <p className="text-muted-foreground">
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary hover:underline font-medium">
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
