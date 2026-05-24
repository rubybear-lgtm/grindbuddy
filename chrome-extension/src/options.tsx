import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { getToastSize, setToastSize } from './lib/storage';
import type { ToastSize } from './lib/types';
import './styles.css';

const TOAST_SIZES: Array<{ value: ToastSize; label: string; description: string }> = [
    {
        value: 'small',
        label: 'Small',
        description: 'Small pill, easiest to ignore.',
    },
    {
        value: 'medium',
        label: 'Medium',
        description: 'Compact card with one clear action.',
    },
    {
        value: 'large',
        label: 'Large',
        description: 'More visible card with extra context.',
    },
];

function OptionsApp() {
    const [toastSize, setToastSizeState] = useState<ToastSize>('small');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        void getToastSize().then(setToastSizeState);
    }, []);

    const handleToastSizeChange = async (value: ToastSize) => {
        setToastSizeState(value);
        setSaved(false);
        await setToastSize(value);
        setSaved(true);
    };

    return (
        <div className="popup">
            <div className="card state-grid">
                <p className="eyebrow">Toast</p>
                <h1 className="state-title">Page badge size</h1>
                <p className="state-copy">Controls how the in-page prompt looks on LeetCode and NeetCode.</p>

                <div className="field">
                    <label className="label" htmlFor="toast-size">
                        Size
                    </label>
                    <select
                        id="toast-size"
                        className="control"
                        value={toastSize}
                        onChange={(event) => void handleToastSizeChange(event.target.value as ToastSize)}
                    >
                        {TOAST_SIZES.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </select>
                </div>

                <p className="subtle">{TOAST_SIZES.find((item) => item.value === toastSize)?.description}</p>
                {saved ? <p className="message success">Saved.</p> : null}
            </div>
        </div>
    );
}

createRoot(document.getElementById('root') as HTMLElement).render(<OptionsApp />);
