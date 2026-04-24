import React, { useState, useEffect } from 'react';
import { getDailyEmailLogs, getEmailLogsByDate } from '../services/api';
import toast from 'react-hot-toast';
import { Calendar, Mail, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function DayWiseEmailLogs() {
  const [dailyLogs, setDailyLogs] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateLogs, setDateLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDate, setExpandedDate] = useState(null);

  useEffect(() => {
    fetchDailyLogs();
  }, []);

  const fetchDailyLogs = async () => {
    setLoading(true);
    try {
      const res = await getDailyEmailLogs();
      if (res.data?.data) {
        setDailyLogs(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to fetch daily logs');
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = async (date) => {
    if (expandedDate === date) {
      setExpandedDate(null);
      return;
    }
    
    setExpandedDate(date);
    try {
      const res = await getEmailLogsByDate(date);
      if (res.data?.data) {
        setDateLogs(prev => ({ ...prev, [date]: res.data.data }));
      }
    } catch (err) {
      toast.error('Failed to fetch logs for this date');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      weekday: 'short',
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  const getTotal = (day) => (day.sent || 0) + (day.failed || 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!dailyLogs.length) {
    return (
      <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl">
        <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        <p className="text-sm font-medium">No email logs found</p>
        <p className="text-xs text-slate-400 mt-1">Send some emails to see daily statistics</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-slate-800 flex items-center gap-2">
        <Calendar size={18} className="text-primary-600" />
        Day-wise Email Logs
      </h3>
      
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-bold text-slate-600">Date</th>
              <th className="px-4 py-3 text-center font-bold text-slate-600">Sent</th>
              <th className="px-4 py-3 text-center font-bold text-slate-600">Failed</th>
              <th className="px-4 py-3 text-center font-bold text-slate-600">Total</th>
              <th className="px-4 py-3 text-center font-bold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dailyLogs.map((day) => (
              <React.Fragment key={day._id}>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {formatDate(day._id)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold">
                      <CheckCircle size={12} />
                      {day.sent || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold">
                      <XCircle size={12} />
                      {day.failed || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-700">
                    {getTotal(day)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDateClick(day._id)}
                      className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 mx-auto"
                    >
                      {expandedDate === day._id ? (
                        <>
                          <ChevronUp size={14} /> Hide
                        </>
                      ) : (
                        <>
                          <ChevronDown size={14} /> View
                        </>
                      )}
                    </button>
                  </td>
                </tr>
                
                {expandedDate === day._id && dateLogs[day._id]?.length > 0 && (
                  <tr>
                    <td colSpan={5} className="p-0 bg-slate-50">
                      <div className="max-h-64 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-100 sticky top-0">
                            <tr>
                              <th className="px-4 py-2 text-left font-bold text-slate-500">Party</th>
                              <th className="px-4 py-2 text-left font-bold text-slate-500">Emails</th>
                              <th className="px-4 py-2 text-center font-bold text-slate-500">Status</th>
                              <th className="px-4 py-2 text-left font-bold text-slate-500">Time</th>
                              <th className="px-4 py-2 text-left font-bold text-slate-500">Error</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {dateLogs[day._id].map((log) => (
                              <tr key={log.id || log._id}>
                                <td className="px-4 py-2">{log.partyName || log.partyCode}</td>
                                <td className="px-4 py-2 text-slate-500">{Array.isArray(log.emails) ? log.emails.join(', ') : log.emails}</td>
                                <td className="px-4 py-2 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    log.status === 'SENT' 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    {log.status}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-slate-400">
                                  {new Date(log.createdAt).toLocaleTimeString('en-IN', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </td>
                                <td className="px-4 py-2 text-red-600 max-w-[150px] truncate">
                                  {log.error || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}