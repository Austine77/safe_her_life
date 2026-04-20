import { useMemo, useState } from 'react';
import { createAccessPin, validateAccessPin } from '../lib/api';

type Props = { goHome: () => void; onPinCreated: (pin: string) => void; currentAccessPin: string };

const operatorMap: Record<string, string> = {
  '×': '*',
  '÷': '/',
  '−': '-',
  '+': '+',
};

export default function EntryPage({ goHome, onPinCreated, currentAccessPin }: Props) {
  const [expression, setExpression] = useState('');
  const [display, setDisplay] = useState('0');
  const [enteredDigits, setEnteredDigits] = useState('');
  const [isGeneratingPin, setIsGeneratingPin] = useState(false);
  const [entryMessage, setEntryMessage] = useState('');
  const [entryError, setEntryError] = useState('');

  const safeExpression = useMemo(() => expression.replace(/[×÷−+]/g, (char) => operatorMap[char] || char), [expression]);

  const handlePinValidation = async (digits: string) => {
    setEntryError('');
    setEntryMessage('');
    try {
      const result = await validateAccessPin(digits);
      if (result.valid) {
        goHome();
        return;
      }
      setEntryError('This access PIN is not valid yet. Tap “Create access PIN” first.');
    } catch (error) {
      setEntryError(error instanceof Error ? error.message : 'Unable to validate access PIN.');
    }
  };

  const onKeyPress = async (key: string) => {
    if (key === '=') {
      if (enteredDigits.length === 6) {
        await handlePinValidation(enteredDigits);
        return;
      }

      try {
        const result = Function(`"use strict"; return (${safeExpression || '0'})`)();
        setDisplay(String(result));
        setExpression(String(result));
      } catch {
        setDisplay('Error');
        setExpression('');
      }
      setEnteredDigits('');
      return;
    }

    const nextExpression = expression + key;
    setExpression(nextExpression);
    setDisplay(nextExpression);

    if (/^[0-9]$/.test(key)) {
      setEnteredDigits((prev) => (prev + key).slice(-6));
    } else {
      setEnteredDigits('');
    }
  };

  const clearAll = () => {
    setExpression('');
    setDisplay('0');
    setEnteredDigits('');
    setEntryError('');
  };

  const handleGeneratePin = async () => {
    setIsGeneratingPin(true);
    setEntryError('');
    setEntryMessage('');
    try {
      const result = await createAccessPin();
      onPinCreated(result.pin);
      setEntryMessage(`Access PIN created: ${result.pin}. Enter it on the calculator and press = to open SafeVoice.`);
    } catch (error) {
      setEntryError(error instanceof Error ? error.message : 'Unable to create access PIN.');
    } finally {
      setIsGeneratingPin(false);
    }
  };

  return (
    <>
      <section className="card hero">
        <h3>SafeVoice</h3>
        <p>
          Use this like a normal calculator. Create a six-digit access PIN, enter that PIN on the calculator,
          then press = to open the child abuse reporting screens discreetly.
        </p>
      </section>
      <section className="card section-gap">
        <div className="calculator">
          <div className="display">{display}</div>
          <div className="keys">
            {['7', '8', '9', '+', '4', '5', '6', '−', '1', '2', '3', '×', '0', '.', 'C', '÷', '='].map((key) => (
              <button
                key={key}
                className={`key ${['+', '−', '×', '÷', '='].includes(key) ? 'op' : ''}`}
                onClick={() => (key === 'C' ? clearAll() : void onKeyPress(key))}
              >
                {key}
              </button>
            ))}
          </div>
          <div className="button-row">
            <button className="btn btn-primary" onClick={handleGeneratePin} disabled={isGeneratingPin}>
              {isGeneratingPin ? 'Creating PIN...' : 'Create access PIN'}
            </button>
          </div>
          {currentAccessPin ? <div className="muted-small">Most recent access PIN: {currentAccessPin}</div> : null}
          {entryMessage ? <p className="info-text">{entryMessage}</p> : null}
          {entryError ? <p className="error-text">{entryError}</p> : null}
        </div>
      </section>
    </>
  );
}
