"use client"
import { useState, useEffect } from 'react';
import axios from 'axios';

const useQuestions = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await axios.get<Question[]>('https://api.nexustoolz.com/api/questions');
        setQuestions(response.data);
      } catch (err) {
        setError('Failed to load questions');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  return { questions, loading, error };
};

export default useQuestions;
