import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Users, 
  Search, 
  Edit2, 
  Save, 
  X, 
  Lock, 
  Upload, 
  Mail, 
  ShieldCheck,
  Filter,
  CheckCircle2,
  AlertCircle,
  Hash,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Download
} from 'lucide-react';
import { getPartyEmails, updatePartyEmail, uploadPartyEmails, downloadPartyEmailsCsv, triggerDownload } from '../services/api';
import { useDropzone } from 'react-dropzone';
import { cn } from '../lib/utils';

export default function PartyManagement() {
  const [parties, setParties] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    partyCode: '',
    partyName: '',
    email: '',
    cc: ''
  });
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadParties();
  }, []);

  // Reset to page 1 on search
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const loadParties = async () => {
    setFetching(true);
    try {
      const res = await getPartyEmails();
      setParties(res.data.data || []);
    } catch {
      toast.error('Failed to sync with party registry');
    } finally {
      setFetching(false);
    }
  };

  const startEdit = (party) => {
    setEditingId(party.id || party._id);
    setEditFormData({
      partyCode: party.partyCode || '',
      partyName: party.partyName || '',
      email: party.email || '',
      cc: party.cc || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFormData({ partyCode: '', partyName: '', email: '', cc: '' });
  };

  const saveDetails = async (id) => {
    if (!editFormData.partyName) return toast.error('Party Name is required');
    try {
      const res = await updatePartyEmail(id, editFormData);
      toast.success(`Registry updated: ${editFormData.partyCode || editFormData.partyName}`);
      setParties(p => p.map(item => (item.id || item._id) === id ? res.data.data : item));
      setEditingId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const onDropBulk = (accepted) => {
    if (accepted.length) setBulkFile(accepted[0]);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: onDropBulk,
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    maxFiles: 1
  });

  const handleBulkSubmit = async () => {
    if (!bulkFile) return toast.error('No file selected');
    setUploading(true);
    try {
      await uploadPartyEmails(bulkFile);
      toast.success('Registry updated successfully');
      setShowBulkUpload(false);
      loadParties();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk update failed');
    } finally {
      setUploading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await downloadPartyEmailsCsv();
      triggerDownload(res.data, 'party_emails.csv');
      toast.success('Party emails exported');
    } catch {
      toast.error('Export failed');
    }
  };

  const filteredParties = parties.filter(p => 
    p.partyCode?.toLowerCase().includes(search.toLowerCase()) ||
    p.partyName?.toLowerCase().includes(search.toLowerCase()) ||
    (p.email && p.email.toLowerCase().includes(search.toLowerCase()))
  );

  // Pagination Logic
  const totalItems = filteredParties.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedParties = filteredParties.slice(startIndex, startIndex + itemsPerPage);

  const getPageNumbers = () => {
     const pages = [];
     if (totalPages <= 5) {
       for (let i = 1; i <= totalPages; i++) pages.push(i);
     } else {
       if (currentPage <= 3) {
         pages.push(1, 2, 3, 4, '...', totalPages);
       } else if (currentPage >= totalPages - 2) {
         pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
       } else {
         pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
       }
     }
     return pages;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Identity Management</h1>
          <p className="text-slate-500 text-sm mt-1">Manage entity communication mappings and secure SMTP routing.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExport}
            className="btn-secondary flex items-center gap-2"
          >
            <Download size={18} />
            Export CSV
          </button>
          <button 
            onClick={() => setShowBulkUpload(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Upload size={18} />
            Bulk Registry Import
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-card">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Filter by code, name, or contact email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 rounded-xl text-sm transition-all outline-none"
          />
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-slate-500 text-xs font-bold">
          <Users size={14} />
          {totalItems} RECORDS
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Entity Signature</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Communication Channel</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fetching ? (
                <tr>
                  <td colSpan="4" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-slate-100 border-t-primary-600 rounded-full animate-spin" />
                      <span className="text-sm font-medium text-slate-400">Syncing with Registry...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredParties.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-20 text-center text-slate-400 font-medium">
                    No identities found matching the current filter.
                  </td>
                </tr>
              ) : paginatedParties.map(p => (
                <tr key={p.id || p._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    {editingId === (p.id || p._id) ? (
                      <div className="space-y-2 max-w-[240px]">
                        <div className="relative">
                           <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                           <input 
                             value={editFormData.partyCode}
                             onChange={e => setEditFormData({...editFormData, partyCode: e.target.value})}
                             className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-primary-300 rounded-lg outline-none"
                             placeholder="Party Code"
                           />
                        </div>
                        <div className="relative">
                           <UserIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                           <input 
                             value={editFormData.partyName}
                             onChange={e => setEditFormData({...editFormData, partyName: e.target.value})}
                             className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-primary-300 rounded-lg outline-none"
                             placeholder="Party Name"
                           />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-sm font-bold text-slate-900">{p.partyCode || '—'}</div>
                        <div className="text-[11px] font-medium text-slate-500 truncate max-w-[200px]">{p.partyName}</div>
                      </>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === (p.id || p._id) ? (
                      <div className="space-y-2 max-w-[320px]">
                        <div className="relative">
                          <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          <input 
                            value={editFormData.email}
                            onChange={e => setEditFormData({...editFormData, email: e.target.value})}
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-primary-300 rounded-lg outline-none"
                            placeholder="Primary Email(s)"
                          />
                        </div>
                        <div className="relative">
                           <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                           <input 
                             value={editFormData.cc}
                             onChange={e => setEditFormData({...editFormData, cc: e.target.value})}
                             className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-primary-300 rounded-lg outline-none italic"
                             placeholder="CC Email(s)"
                           />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex flex-wrap gap-1">
                          {p.email ? p.email.split(',').map((m, i) => (
                            <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                              {m.trim()}
                            </span>
                          )) : <span className="text-xs text-slate-400 italic">No primary mapped</span>}
                        </div>
                        {p.cc && (
                           <div className="flex flex-wrap gap-1">
                              {p.cc.split(',').map((m, i) => (
                                <span key={i} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                                  CC: {m.trim()}
                                </span>
                              ))}
                           </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {p.email ? (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100 w-fit">
                        <CheckCircle2 size={12} /> VERIFIED
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-100 w-fit">
                        <AlertCircle size={12} /> NO ROUTE
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingId === (p.id || p._id) ? (
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => saveDetails(p.id || p._id)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <Save size={18} />
                        </button>
                        <button 
                          onClick={cancelEdit}
                          className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => startEdit(p)}
                        className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Edit2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs font-medium text-slate-500">
              Showing <span className="text-slate-900 font-bold">{startIndex + 1}</span> to <span className="text-slate-900 font-bold">{Math.min(startIndex + itemsPerPage, totalItems)}</span> of <span className="text-slate-900 font-bold">{totalItems}</span> entities
            </div>
            
            <div className="flex items-center gap-1">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex items-center gap-1 px-2">
                {getPageNumbers().map((num, i) => (
                  num === '...' ? (
                    <MoreHorizontal key={`sep-${i}`} size={16} className="text-slate-400 mx-1" />
                  ) : (
                    <button
                      key={`page-${num}`}
                      onClick={() => setCurrentPage(num)}
                      className={cn(
                        "w-8 h-8 text-[11px] font-bold rounded-lg transition-all border",
                        currentPage === num 
                          ? "bg-primary-600 text-white border-primary-600 shadow-sm" 
                          : "text-slate-600 bg-white border-slate-200 hover:border-primary-400 hover:text-primary-600"
                      )}
                    >
                      {num}
                    </button>
                  )
                ))}
              </div>

              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="text-primary-600" size={24} />
                Bulk Registry Import
              </h3>
              <button onClick={() => setShowBulkUpload(false)} className="text-slate-400 hover:text-slate-900">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div 
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all",
                  bulkFile ? "border-green-400 bg-green-50" : "border-slate-200 hover:border-primary-400 bg-slate-50"
                )}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-3">
                  <div className={cn(
                    "p-4 rounded-full mb-2",
                    bulkFile ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"
                  )}>
                    <Upload size={32} />
                  </div>
                  <span className="text-sm font-bold text-slate-900">{bulkFile ? bulkFile.name : 'Drop Registry Excel (.XLSX)'}</span>
                  <p className="text-xs text-slate-400">Must include 'Party Code', 'Party Name', and 'Email' columns</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowBulkUpload(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  disabled={!bulkFile || uploading}
                  onClick={handleBulkSubmit}
                  className="flex-1 btn-primary"
                >
                  {uploading ? 'Processing...' : 'Run Import Pipeline'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
