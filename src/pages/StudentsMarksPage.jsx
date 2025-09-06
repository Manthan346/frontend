import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Card from '../components/common/Card';
import MarksGraph from '../components/common/MarksGraph';

const StudentMarksPage = () => {
  const [results, setResults] = useState([]);
  const [subjectPerformance, setSubjectPerformance] = useState([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [loadingPerformance, setLoadingPerformance] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoadingResults(true);
        // Fetch student’s own results (route fixed to use auth user id)
        const res = await api.get('/student/results', { params: { page: 1, limit: 100 } });
        setResults(res.data.results || []);
        setError('');
      } catch (err) {
        setError('Failed to load test results.');
      } finally {
        setLoadingResults(false);
      }
    };

    const fetchPerformance = async () => {
      try {
        setLoadingPerformance(true);
        // Fetch student’s own performance summary
        const res = await api.get('/dashboard/student/performance');
        setSubjectPerformance(res.data.subjectPerformance || []);
        setError('');
      } catch (err) {
        setError('Failed to load performance data.');
      } finally {
        setLoadingPerformance(false);
      }
    };

    fetchResults();
    fetchPerformance();
  }, []);

  if (loadingResults || loadingPerformance) return <div>Loading your marks...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  // Group test results by subject for display
  const resultsBySubject = results.reduce((acc, result) => {
    const subjId = result.test.subject._id;
    if (!acc[subjId]) acc[subjId] = { subject: result.test.subject, tests: [] };
    acc[subjId].tests.push(result);
    return acc;
  }, {});

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-6">My Marks and Performance</h1>

      {Object.keys(resultsBySubject).length === 0 ? (
        <Card>
          <p>No test results available yet.</p>
        </Card>
      ) : (
        Object.values(resultsBySubject).map(({ subject, tests }) => {
          const perf = subjectPerformance.find(sp => sp.subject._id === subject._id);

          return (
            <Card key={subject._id}>
              <h2 className="text-xl font-semibold mb-3">{subject.name} ({subject.code})</h2>

              {/* Marks Table */}
              <table className="w-full border-collapse border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-3 py-2">Test</th>
                    <th className="border px-3 py-2">Marks Obtained</th>
                    <th className="border px-3 py-2">Max Marks</th>
                    <th className="border px-3 py-2">Percentage</th>
                    <th className="border px-3 py-2">Date</th>
                    <th className="border px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map(t => (
                    <tr key={t._id}>
                      <td className="border px-3 py-1">{t.test.title}</td>
                      <td className="border px-3 py-1">{t.marksObtained}</td>
                      <td className="border px-3 py-1">{t.test.maxMarks}</td>
                      <td className="border px-3 py-1">{((t.marksObtained / t.test.maxMarks) * 100).toFixed(1)}%</td>
                      <td className="border px-3 py-1">{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td className={`border px-3 py-1 ${t.isPassed ? 'text-green-600' : 'text-red-600'}`}>
                        {t.isPassed ? 'Passed' : 'Failed'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Performance Graph per subject */}
              {perf && perf.results.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Performance Over Time</h3>
                  <MarksGraph
                    data={perf.results.map((r, idx) => ({
                      date: `Test ${idx + 1}`,
                      percentage: parseFloat(((r.marksObtained / r.test.maxMarks) * 100).toFixed(2)),
                    }))}
                  />
                </div>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
};

export default StudentMarksPage;
