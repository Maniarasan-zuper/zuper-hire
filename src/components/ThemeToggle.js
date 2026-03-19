'use client';
import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ style }) {
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        const t = document.documentElement.getAttribute('data-theme') || 'dark';
        setTheme(t);
    }, []);

    const toggle = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem('theme', next); } catch {}
    };

    return (
        <button
            onClick={toggle}
            className="button outline"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{ padding: '7px 10px', flexShrink: 0, ...style }}
        >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
    );
}
