import { Download, Eye, FileText, Lock, Trash2 } from 'lucide-react';

const NoteCard = ({ note, onDelete, onDownload }) => {
    const getTypeColor = (type) => {
        switch (type) {
            case 'Clinical Note':
                return 'bg-blue-500/20 text-blue-300';
            case 'Lab Report':
                return 'bg-amber-500/20 text-amber-300';
            case 'Discharge Report':
                return 'bg-purple-500/20 text-purple-300';
            case 'Pathology Report':
                return 'bg-pink-500/20 text-pink-300';
            case 'Imaging Report':
                return 'bg-cyan-500/20 text-cyan-300';
            default:
                return 'bg-slate-500/20 text-slate-300';
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg border border-slate-700 p-4 hover:shadow-lg hover:shadow-slate-700/50 transition-all">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5 text-slate-400" />
                        <h3 className="text-lg font-bold text-white">{note.title}</h3>
                        {note.isPrivate && <Lock className="w-4 h-4 text-red-400" />}
                    </div>

                    {/* Type and Category */}
                    <div className="flex items-center gap-2 mb-3">
                        <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${getTypeColor(
                                note.type
                            )}`}
                        >
                            {note.type}
                        </span>
                        <span className="text-xs text-slate-400 px-2.5 py-1 rounded-full bg-slate-700/30">
                            {note.category}
                        </span>
                    </div>

                    {/* Patient, Author, Date */}
                    <div className="grid grid-cols-3 gap-4 mb-3 text-sm text-slate-300">
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">
                                Patient
                            </p>
                            <p className="font-semibold">{note.patient}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">
                                Author
                            </p>
                            <p className="font-semibold">{note.author}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">
                                Date
                            </p>
                            <p className="font-semibold">{formatDate(note.date)}</p>
                        </div>
                    </div>

                    {/* Content Preview */}
                    <div className="bg-slate-700/20 rounded-lg p-3 mb-3 border border-slate-700">
                        <p className="text-sm text-slate-300 line-clamp-2">{note.content}</p>
                    </div>

                    {/* Tags and Attachments */}
                    <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                            {note.tags.map((tag, idx) => (
                                <span
                                    key={idx}
                                    className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                        {note.attachments > 0 && (
                            <span className="text-xs text-slate-400 bg-slate-700/30 px-2.5 py-1 rounded-full">
                                {note.attachments} file{note.attachments > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                    <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-sky-400">
                        <Eye className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => onDownload(note.id)}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-emerald-400"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => onDelete(note.id)}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-red-400"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NoteCard;
